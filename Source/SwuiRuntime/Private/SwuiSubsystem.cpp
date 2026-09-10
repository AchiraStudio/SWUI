#include "SwuiSubsystem.h"
#include "SwuiManager.h"
#include "SwuiSettings.h"
#include "Swui.h"
#include "SwuiView.h"
#include "SwuiInputPreprocessor.h"
#include "SwuiHudRoiOverlayWidget.h"
#include "SwuiProfiler.h"
#include "SwuiCVars.h"
#include "SwuiCVarHelpers.h"
#include "ISwuiRuntime.h"
#include "Framework/Application/SlateApplication.h"
#include "GameFramework/GameUserSettings.h"
#include "Blueprint/UserWidget.h"
#include "Blueprint/WidgetTree.h"
#include "Components/Image.h"
#include "Components/CanvasPanel.h"
#include "Components/CanvasPanelSlot.h"
#include "Engine/Engine.h"
#include "Engine/GameInstance.h"
#include "Engine/GameViewportClient.h"
#include "Engine/LocalPlayer.h"
#include "Engine/World.h"
#include "GameFramework/WorldSettings.h"
#include "HAL/IConsoleManager.h"

#include "UObject/UnrealType.h"
#include "UObject/Field.h"
#include "UObject/PropertyIterator.h"
#include "UObject/UObjectIterator.h"
#include "UObject/ScriptInterface.h"
#include "GameplayTagContainer.h"

// ---- Helpers ----

static FString Swui_GetTSType(const FProperty* Prop)
{
	if (Prop->IsA<FFloatProperty>()  || Prop->IsA<FDoubleProperty>() ||
		Prop->IsA<FIntProperty>()    || Prop->IsA<FInt64Property>()  ||
		Prop->IsA<FEnumProperty>()   ||
		Prop->IsA<FByteProperty>())    return TEXT("number");
	if (Prop->IsA<FBoolProperty>())    return TEXT("boolean");
	if (Prop->IsA<FStrProperty>()   || Prop->IsA<FNameProperty>() ||
		Prop->IsA<FTextProperty>())    return TEXT("string");

	if (const FStructProperty* StructProp = CastField<const FStructProperty>(Prop))
	{
		const FString StructName = StructProp->Struct->GetName();
		if (StructName == TEXT("GameplayTag")) return TEXT("string");
		return TEXT("object");
	}

	if (Prop->IsA<FArrayProperty>()) return TEXT("array");
	if (Prop->IsA<FMapProperty>()) return TEXT("map");
	if (Prop->IsA<FObjectPropertyBase>()) return TEXT("object");

	return FString();
}

static FString Swui_QuoteJsonString(const FString& Raw)
{
	FString Escaped = Raw;
	Escaped.ReplaceInline(TEXT("\\"), TEXT("\\\\"));
	Escaped.ReplaceInline(TEXT("\""), TEXT("\\\""));
	Escaped.ReplaceInline(TEXT("\n"), TEXT("\\n"));
	Escaped.ReplaceInline(TEXT("\r"), TEXT("\\r"));
	Escaped.ReplaceInline(TEXT("\t"), TEXT("\\t"));
	return TEXT("\"") + Escaped + TEXT("\"");
}

// Forward declaration
static FString Swui_SerializePropertyValue(const FProperty* Prop, const void* ValuePtr);

static FString Swui_SerializeStructFields(const UScriptStruct* Struct, const void* StructPtr)
{
	TArray<FString> Fields;
	for (TFieldIterator<FProperty> It(Struct); It; ++It)
	{
		const void* FieldValuePtr = It->ContainerPtrToValuePtr<void>(StructPtr);
		FString FieldValue = Swui_SerializePropertyValue(*It, FieldValuePtr);
		if (FieldValue.IsEmpty()) continue;
		Fields.Add(Swui_QuoteJsonString(It->GetName()) + TEXT(":") + FieldValue);
	}
	return TEXT("{") + FString::Join(Fields, TEXT(",")) + TEXT("}");
}

static FString Swui_SerializePropertyValue(const FProperty* Prop, const void* ValuePtr)
{
	if (const FFloatProperty*  P = CastField<FFloatProperty>(Prop))  return FString::SanitizeFloat(P->GetPropertyValue(ValuePtr));
	if (const FDoubleProperty* P = CastField<FDoubleProperty>(Prop)) return FString::SanitizeFloat(P->GetPropertyValue(ValuePtr));
	if (const FIntProperty*    P = CastField<FIntProperty>(Prop))    return FString::FromInt(P->GetPropertyValue(ValuePtr));
	if (const FInt64Property*  P = CastField<FInt64Property>(Prop))  return FString::Printf(TEXT("%lld"), P->GetPropertyValue(ValuePtr));
	if (const FEnumProperty*   P = CastField<FEnumProperty>(Prop))
	{
		const int64 EnumValue = P->GetUnderlyingProperty()->GetSignedIntPropertyValue(ValuePtr);
		return Swui_QuoteJsonString(P->GetEnum()->GetNameStringByValue(EnumValue));
	}
	if (const FByteProperty* P = CastField<FByteProperty>(Prop))
	{
		if (P->Enum) return Swui_QuoteJsonString(P->Enum->GetNameStringByValue(P->GetPropertyValue(ValuePtr)));
		return FString::FromInt(P->GetPropertyValue(ValuePtr));
	}
	if (const FBoolProperty* P = CastField<FBoolProperty>(Prop)) return P->GetPropertyValue(ValuePtr) ? TEXT("true") : TEXT("false");
	if (const FStrProperty*  P = CastField<FStrProperty>(Prop))  return Swui_QuoteJsonString(P->GetPropertyValue(ValuePtr));
	if (const FNameProperty* P = CastField<FNameProperty>(Prop)) return Swui_QuoteJsonString(P->GetPropertyValue(ValuePtr).ToString());
	if (const FTextProperty* P = CastField<FTextProperty>(Prop)) return Swui_QuoteJsonString(P->GetPropertyValue(ValuePtr).ToString());

	if (const FStructProperty* P = CastField<FStructProperty>(Prop))
	{
		const FString StructName = P->Struct->GetName();
		if (StructName == TEXT("GameplayTag"))
		{
			const FGameplayTag* Tag = static_cast<const FGameplayTag*>(ValuePtr);
			return Tag ? Swui_QuoteJsonString(Tag->ToString()) : TEXT("null");
		}
		if (StructName == TEXT("Vector2D"))
		{
			const FVector2D* V = static_cast<const FVector2D*>(ValuePtr);
			return V ? FString::Printf(TEXT("{\"x\":%s,\"y\":%s}"), *FString::SanitizeFloat(V->X), *FString::SanitizeFloat(V->Y)) : TEXT("null");
		}
		if (StructName == TEXT("Vector"))
		{
			const FVector* V = static_cast<const FVector*>(ValuePtr);
			return V ? FString::Printf(TEXT("{\"x\":%s,\"y\":%s,\"z\":%s}"), *FString::SanitizeFloat(V->X), *FString::SanitizeFloat(V->Y), *FString::SanitizeFloat(V->Z)) : TEXT("null");
		}
		if (StructName == TEXT("Rotator"))
		{
			const FRotator* R = static_cast<const FRotator*>(ValuePtr);
			return R ? FString::Printf(TEXT("{\"pitch\":%s,\"yaw\":%s,\"roll\":%s}"), *FString::SanitizeFloat(R->Pitch), *FString::SanitizeFloat(R->Yaw), *FString::SanitizeFloat(R->Roll)) : TEXT("null");
		}
		if (StructName == TEXT("LinearColor"))
		{
			const FLinearColor* C = static_cast<const FLinearColor*>(ValuePtr);
			return C ? FString::Printf(TEXT("{\"r\":%s,\"g\":%s,\"b\":%s,\"a\":%s}"), *FString::SanitizeFloat(C->R), *FString::SanitizeFloat(C->G), *FString::SanitizeFloat(C->B), *FString::SanitizeFloat(C->A)) : TEXT("null");
		}
		if (StructName == TEXT("Color"))
		{
			const FColor* C = static_cast<const FColor*>(ValuePtr);
			if (C) return FString::Printf(TEXT("{\"r\":%d,\"g\":%d,\"b\":%d,\"a\":%d}"), C->R, C->G, C->B, C->A);
			return TEXT("null");
		}
		return Swui_SerializeStructFields(P->Struct, ValuePtr);
	}

	if (const FArrayProperty* P = CastField<FArrayProperty>(Prop))
	{
		FScriptArrayHelper Helper(P, ValuePtr);
		TArray<FString> Elements;
		for (int32 i = 0; i < Helper.Num(); ++i)
		{
			FString ElemValue = Swui_SerializePropertyValue(P->Inner, Helper.GetRawPtr(i));
			if (!ElemValue.IsEmpty()) Elements.Add(ElemValue);
		}
		return TEXT("[") + FString::Join(Elements, TEXT(",")) + TEXT("]");
	}

	if (const FMapProperty* P = CastField<FMapProperty>(Prop))
	{
		FScriptMapHelper MapHelper(P, ValuePtr);
		TArray<FString> Entries;
		for (int32 Index = 0; Index < MapHelper.GetMaxIndex(); ++Index)
		{
			if (!MapHelper.IsValidIndex(Index)) continue;

			const void* KeyPtr = MapHelper.GetKeyPtr(Index);
			const void* ValPtr = MapHelper.GetValuePtr(Index);

			FString KeyString;
			if (const FStrProperty* StrKey = CastField<FStrProperty>(P->KeyProp))
			{
				KeyString = StrKey->GetPropertyValue(KeyPtr);
			}
			else if (const FNameProperty* NameKey = CastField<FNameProperty>(P->KeyProp))
			{
				KeyString = NameKey->GetPropertyValue(KeyPtr).ToString();
			}
			else
			{
				continue;
			}

			FString ValValue = Swui_SerializePropertyValue(P->ValueProp, ValPtr);
			if (!ValValue.IsEmpty())
			{
				Entries.Add(Swui_QuoteJsonString(KeyString) + TEXT(":") + ValValue);
			}
		}
		return TEXT("{") + FString::Join(Entries, TEXT(",")) + TEXT("}");
	}

	if (const FObjectPropertyBase* P = CastField<FObjectPropertyBase>(Prop))
	{
		UObject* Obj = P->GetObjectPropertyValue(ValuePtr);
		if (!Obj) return TEXT("null");
		return FString::Printf(TEXT("{\"name\":%s,\"className\":%s}"),
			*Swui_QuoteJsonString(Obj->GetName()), *Swui_QuoteJsonString(Obj->GetClass()->GetName()));
	}

	if (Prop->IsA<FSoftObjectProperty>() || Prop->IsA<FSoftClassProperty>())
	{
		return TEXT("null");
	}

	return FString();
}

static FString Swui_SerializeProperty(const FProperty* Prop, const void* Container)
{
	if (!Prop || !Container) return FString();
	const void* ValuePtr = Prop->ContainerPtrToValuePtr<void>(Container);
	return Swui_SerializePropertyValue(Prop, ValuePtr);
}

// ---- Lifecycle ----

bool USwuiSubsystem::ShouldCreateSubsystem(UObject* Outer) const
{
	const USwuiSettings* Settings = GetDefault<USwuiSettings>();
	return Settings && !Settings->bDisablePlugin;
}

void USwuiSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);

	InputPreprocessor = MakeShared<FSwuiInputPreprocessor>(this);
	if (FSlateApplication::IsInitialized())
	{
		FSlateApplication::Get().RegisterInputPreProcessor(InputPreprocessor);
		UE_LOG(LogSwuiRuntime, Log, TEXT("[SwuiPreprocessor] Registered Slate input preprocessor."));
	}
}

void USwuiSubsystem::Deinitialize()
{
	if (FSlateApplication::IsInitialized() && InputPreprocessor.IsValid())
	{
		FSlateApplication::Get().UnregisterInputPreProcessor(InputPreprocessor);
		UE_LOG(LogSwuiRuntime, Log, TEXT("[SwuiPreprocessor] Unregistered Slate input preprocessor."));
	}
	InputPreprocessor.Reset();

	ShutdownRenderer();
	// Ensure the CVar is restored even if ShutdownRenderer missed it.
	if (SavedOneFrameThreadLag >= 0)
	{
		IConsoleVariable* CVar = IConsoleManager::Get().FindConsoleVariable(TEXT("r.OneFrameThreadLag"));
		if (CVar)
		{
			CVar->Set(SavedOneFrameThreadLag, ECVF_SetByGameOverride);
			if (CVarSwuiVerbosePaint.GetValueOnGameThread() != 0)
			{
				UE_LOG(LogSwuiRuntime, Log, TEXT("[SWUI Runtime] Restored r.OneFrameThreadLag=%d (on Deinitialize)"), SavedOneFrameThreadLag);
			}
		}
		SavedOneFrameThreadLag = -1;
	}
	LastAppliedFramePacingMode = ESwuiLowLatencyFramePacingMode::Disabled;
	ObservedProperties.Empty();
	ObservedDelegates.Empty();
	DelegateBridges.Empty();
	Super::Deinitialize();
}

// ---- Renderer ----

void USwuiSubsystem::DisablePlugin()
{
	bDisabledAtRuntime = true;
	ShutdownRenderer();
}

void USwuiSubsystem::InitRenderer(const FString& URI, const FString& InterfaceName,
	AActor* OwnerActor, bool bIsHUD, int32 Width, int32 Height, int32 ZOrder,
	UMaterialInterface* BaseMaterial, FName TextureParamName,
	const FSwuiInstanceSettings& InstanceSettings)
{
	if (bDisabledAtRuntime) return;

	if (View)
	{
		UE_LOG(LogSwuiRuntime, Log, TEXT("[SWUI InitRenderer] view already exists — skipping duplicate init (URI=%s)"), *URI);
		return;
	}

	UWorld* World = GetGameInstance()->GetWorld();
	if (!World) return;

	int32 FinalWidth = Width, FinalHeight = Height;
	if (bIsHUD)
	{
		// 1. Try the live viewport (valid once the first frame has rendered)
		if (GEngine && GEngine->GameViewport && GEngine->GameViewport->Viewport)
		{
			FIntPoint RenderSize = GEngine->GameViewport->Viewport->GetSizeXY();
			if (RenderSize.X > 0 && RenderSize.Y > 0)
			{
				FinalWidth  = RenderSize.X;
				FinalHeight = RenderSize.Y;
			}
		}
		// 2. Viewport not ready yet (BeginPlay before first render) — use the
		// player-configured game resolution, NOT the physical monitor resolution.
		// FDisplayMetrics returns the desktop native res which can be 4K+ even
		// when the game runs at a lower resolution — that causes massive OnPaint copies.
		if (FinalWidth <= 0 || FinalHeight <= 0 || (FinalWidth == 1280 && FinalHeight == 720))
		{
			if (UGameUserSettings* GUS = UGameUserSettings::GetGameUserSettings())
			{
				const FIntPoint GameRes = GUS->GetScreenResolution();
				if (GameRes.X > 0 && GameRes.Y > 0)
				{
					FinalWidth  = GameRes.X;
					FinalHeight = GameRes.Y;
				}
			}
		}
	}

	View = NewObject<USwuiView>(this);
	View->DefaultURL    = URI;
	View->Width         = FinalWidth;
	View->Height        = FinalHeight;
	View->bIsTransparent = true;
	View->BaseMaterial  = BaseMaterial;
	View->TextureParameterName = TextureParamName;
	View->SetOwningActor(OwnerActor);
	View->Init(InstanceSettings);

	// Inject focus-tracking JS so the runtime knows when an editable element has focus.
	// Uses a generic bridge helper instead of hardcoding window.cefQuery — the bridge
	// may be cefQuery, __SWUI__, Swui, or WebView2 postMessage depending on the runtime.
	View->ExecuteJavaScript(
		TEXT("(function(){")
		TEXT("var f=false;")
		TEXT("var swuiSend=window.cefQuery||window.__SWUI__?.send||window.Swui?.send||window.chrome?.webview?.postMessage||function(){};")
		TEXT("document.addEventListener('focusin',function(e){")
		TEXT("var el=e.target,ed=el&&(el.tagName==='INPUT'||el.tagName==='TEXTAREA'||el.tagName==='SELECT'||el.isContentEditable);")
		TEXT("if(ed!==f){f=ed;swuiSend(JSON.stringify({type:'swui:focusInput',focused:ed}));}")
		TEXT("});")
		TEXT("document.addEventListener('focusout',function(){")
		TEXT("setTimeout(function(){")
		TEXT("var el=document.activeElement,ed=el&&(el.tagName==='INPUT'||el.tagName==='TEXTAREA'||el.tagName==='SELECT'||el.isContentEditable);")
		TEXT("if(ed!==f){f=!!ed;swuiSend(JSON.stringify({type:'swui:focusInput',focused:!!ed}));}")
		TEXT("},0);")
		TEXT("});")
		TEXT("})();")
	);

	UpdateLowLatencyFramePacing();

	Widget = CreateWidget<UUserWidget>(World, USwuiWidget::StaticClass());
	if (!Widget) return;

	if (!Widget->WidgetTree)
	{
		Widget->WidgetTree = NewObject<UWidgetTree>(Widget, TEXT("WidgetTree"));
	}

	UCanvasPanel* RootPanel = Widget->WidgetTree->ConstructWidget<UCanvasPanel>(UCanvasPanel::StaticClass(), TEXT("RootPanel"));
	RootPanel->bIsVariable = false;

	UImage* Image = Widget->WidgetTree->ConstructWidget<UImage>(UImage::StaticClass(), TEXT("SwuiImage"));
	if (View && View->GetTexture())
	{
		Image->SetBrushFromTexture(View->GetTexture());
	}
	else if (View && View->BaseMaterial)
	{
		Image->SetBrushFromMaterial(View->BaseMaterial);
	}
	FSlateBrush Brush = Image->GetBrush();
	Brush.ImageSize = FVector2D(FinalWidth, FinalHeight);
	Brush.DrawAs    = ESlateBrushDrawType::Image;
	Image->SetBrush(Brush);
	Image->SynchronizeProperties();

	UPanelSlot* Slot = RootPanel->AddChild(Image);
	if (UCanvasPanelSlot* CanvasSlot = Cast<UCanvasPanelSlot>(Slot))
	{
		if (bIsHUD)
		{
			CanvasSlot->SetAnchors(FAnchors(0.f, 0.f, 1.f, 1.f));
			CanvasSlot->SetOffsets(FMargin(0.f));
		}
		else
		{
			CanvasSlot->SetAnchors(FAnchors(0.5f, 0.5f, 0.5f, 0.5f));
			CanvasSlot->SetPosition(FVector2D(0.f, 0.f));
			CanvasSlot->SetSize(FVector2D(FinalWidth, FinalHeight));
			CanvasSlot->SetAutoSize(false);
		}
	}

	Widget->WidgetTree->RootWidget = RootPanel;
	Widget->SetIsFocusable(false);
	Widget->AddToViewport(ZOrder);
	Widget->SetVisibility(InstanceSettings.bHideDrawComponent ? ESlateVisibility::Collapsed : ESlateVisibility::SelfHitTestInvisible);
	// State is now pushed every engine frame via FTickableGameObject::Tick
}
void USwuiSubsystem::ShutdownRenderer()
{
	DestroyRoiOverlay();
	bFocusScriptInjected = false;

	if (Widget && Widget->IsInViewport())
	{
		Widget->RemoveFromParent();
	}
	Widget = nullptr;
	View   = nullptr;
	UpdateLowLatencyFramePacing();
}

// ── HUD ROI Overlay ─────────────────────────────────────────────────────

void USwuiSubsystem::UpdateRoiOverlay()
{
	if (!View)
	{
		DestroyRoiOverlay();
		return;
	}

	const FSwuiHudRoiOverlayState State = View->GetHudRoiOverlayState();

	if (!State.bVisible && !RoiOverlay)
	{
		return;
	}

	if (!State.bVisible && RoiOverlay)
	{
		DestroyRoiOverlay();
		return;
	}

	if (State.bVisible && !RoiOverlay)
	{
		CreateRoiOverlay();
	}

	if (RoiOverlay && View)
	{
		const bool bShade = SwuiCVarBool(
			CVarSwuiHudRoiShadeInactive.GetValueOnGameThread(),
			View->GetHudRoiSettings().bShadeInactiveArea);

		RoiOverlay->UpdateOverlay(State, View->Width, View->Height, bShade);
	}
}

void USwuiSubsystem::CreateRoiOverlay()
{
	if (RoiOverlay)
	{
		return;
	}

	UWorld* World = GetGameInstance()->GetWorld();
	if (!World) return;

	RoiOverlay = CreateWidget<USwuiHudRoiOverlayWidget>(World, USwuiHudRoiOverlayWidget::StaticClass());
	if (RoiOverlay)
	{
		RoiOverlay->AddToViewport(10000); // High Z-order to stay on top
		RoiOverlay->SetVisibility(ESlateVisibility::HitTestInvisible);
	}
}

void USwuiSubsystem::DestroyRoiOverlay()
{
	if (RoiOverlay)
	{
		if (RoiOverlay->IsInViewport())
		{
			RoiOverlay->RemoveFromParent();
		}
		RoiOverlay = nullptr;
	}
}

// ── UpdateInstanceSettings ──────────────────────────────────────────────

void USwuiSubsystem::UpdateInstanceSettings(const FSwuiInstanceSettings& NewSettings)
{
	if (!View) return;
	View->InstanceSettings = NewSettings;

	// Re-apply CVars so flags backed by CVars take effect immediately.
	// CVars are centrally owned in SwuiCVars.cpp.
	const USwuiSettings* Settings = GetDefault<USwuiSettings>();
	const bool bWantVerbose  = NewSettings.bVerbosePaintLog || (Settings && Settings->bVerbosePaintLog);
	const bool bWantNoUpload = NewSettings.bNoTextureUpload || (Settings && Settings->bNoTextureUpload);
	if (IConsoleVariable* VerbosePaintVar = CVarSwuiVerbosePaint.operator->())
		VerbosePaintVar->Set(bWantVerbose ? 1 : 0, ECVF_SetByCode);
	if (IConsoleVariable* NoTextureUploadVar = CVarSwuiNoTextureUpload.operator->())
		NoTextureUploadVar->Set(bWantNoUpload ? 1 : 0, ECVF_SetByCode);

	if (NewSettings.bHideDrawComponent && Widget)
		Widget->SetVisibility(ESlateVisibility::Collapsed);
	else if (!NewSettings.bHideDrawComponent && Widget)
		Widget->SetVisibility(ESlateVisibility::HitTestInvisible);

	View->UpdateHudRoiSettings(NewSettings.HudRoiSettings);
}

void USwuiSubsystem::SetWidgetVisible(bool bVisible)
{
	if (Widget)
		Widget->SetVisibility(bVisible ? ESlateVisibility::HitTestInvisible : ESlateVisibility::Collapsed);
}

void USwuiSubsystem::LoadURI(const FString& URI)
{
	if (View) View->LoadURL(URI);
}

void USwuiSubsystem::ExecuteJavaScript(const FString& Script)
{
	if (View) View->ExecuteJavaScript(Script);
}

// ---- Pointer Input Forwarding (bridge to View) ----

void USwuiSubsystem::SetPointerInputEnabled(bool bEnabled)
{
	if (View) View->SetPointerInputEnabled(bEnabled);
}

void USwuiSubsystem::SetBrowserInputFocus(bool bFocused)
{
	if (View) View->SetBrowserInputFocus(bFocused);
}

// ---- Observe API ----

FString USwuiSubsystem::ResolveNamespace(UObject* Source, const FString& Namespace) const
{
	if (!Namespace.IsEmpty()) return Namespace;
	// Default: class name stripped of prefix, lowercased
	// AMyCharacter → "mycharacter"
	FString ClassName = Source->GetClass()->GetName();
	if (ClassName.StartsWith(TEXT("A")) || ClassName.StartsWith(TEXT("U")))
		ClassName = ClassName.RightChop(1);
	return ClassName.ToLower();
}

void USwuiSubsystem::ObserveProperty(UObject* Source, const FString& Namespace, const FName& PropertyName, ESwuiUpdatePriority Priority)
{
	if (!Source) return;

	FProperty* Prop = Source->GetClass()->FindPropertyByName(PropertyName);
	if (!Prop)
	{
		UE_LOG(LogTemp, Warning, TEXT("SWUI ObserveProperty: '%s' not found on '%s'"),
			*PropertyName.ToString(), *Source->GetClass()->GetName());
		return;
	}

	if (Swui_GetTSType(Prop).IsEmpty())
	{
		UE_LOG(LogTemp, Warning, TEXT("SWUI ObserveProperty: '%s' has an unsupported type for JS sync"),
			*PropertyName.ToString());
		return;
	}

	const FString NsKey = ResolveNamespace(Source, Namespace) + TEXT(".") + PropertyName.ToString();

	// Deduplicate: do not add if the exact source and property are already observed
	const bool bAlreadyObserved = ObservedProperties.ContainsByPredicate(
		[Source, &PropertyName, &NsKey](const FSwuiObservedProperty& E)
		{
			return E.Source.Get() == Source && (E.PropertyName == PropertyName || E.NamespacedKey == NsKey);
		});
	if (bAlreadyObserved)
	{
		return;
	}

	FSwuiObservedProperty Entry;
	Entry.Source        = Source;
	Entry.PropertyName  = PropertyName;
	Entry.CachedProp    = Prop;
	Entry.NamespacedKey = NsKey;
	Entry.Priority      = Priority;

	ObservedProperties.Add(Entry);
}

void USwuiSubsystem::ObserveDelegate(UObject* Source, const FString& Namespace, const FName& DelegateName)
{
	if (!Source) return;

	const FString NsKey = ResolveNamespace(Source, Namespace) + TEXT(".") + DelegateName.ToString();

	// Deduplicate: do not add if the exact source and delegate are already observed
	const bool bAlreadyObserved = ObservedDelegates.ContainsByPredicate(
		[Source, &DelegateName, &NsKey](const FSwuiObservedDelegate& E)
		{
			return E.Source.Get() == Source && (E.DelegateName == DelegateName || E.NamespacedKey == NsKey);
		});
	if (bAlreadyObserved)
	{
		return;
	}

	FObjectProperty* DelegateProp = nullptr;
	FMulticastDelegateProperty* MCProp = nullptr;

	for (TFieldIterator<FMulticastDelegateProperty> It(Source->GetClass()); It; ++It)
	{
		if (It->GetFName() == DelegateName)
		{
			MCProp = *It;
			break;
		}
	}

	if (!MCProp)
	{
		UE_LOG(LogTemp, Warning, TEXT("SWUI ObserveDelegate: delegate '%s' not found on '%s'"),
			*DelegateName.ToString(), *Source->GetClass()->GetName());
		return;
	}

	// Cache payload field names + TS types from the delegate signature
	TArray<TTuple<FName, FString>> PayloadFields;
	UFunction* SignatureFunc = MCProp->SignatureFunction;
	if (SignatureFunc)
	{
		for (TFieldIterator<FProperty> ParamIt(SignatureFunc); ParamIt; ++ParamIt)
		{
			if (ParamIt->HasAnyPropertyFlags(CPF_Parm) && !ParamIt->HasAnyPropertyFlags(CPF_ReturnParm))
			{
				const FString TSType = Swui_GetTSType(*ParamIt);
				if (!TSType.IsEmpty())
					PayloadFields.Add(MakeTuple(ParamIt->GetFName(), TSType));
			}
		}
	}

	FSwuiObservedDelegate Entry;
	Entry.Source        = Source;
	Entry.DelegateName  = DelegateName;
	Entry.NamespacedKey = NsKey;
	Entry.PayloadFields = PayloadFields;

	ObservedDelegates.Add(Entry);

	// Create a generic bridge that intercepts ProcessEvent and serializes the
	// delegate's actual broadcast parameters using the SignatureFunction's
	// property names and layout. Works for any delegate signature.
	USwuiDelegateBridge* Bridge = NewObject<USwuiDelegateBridge>(this);
	Bridge->Init(NsKey, this, SignatureFunc);
	DelegateBridges.Add(Bridge);

	FScriptDelegate ScriptDelegate;
	ScriptDelegate.BindUFunction(Bridge, GET_FUNCTION_NAME_CHECKED(USwuiDelegateBridge, DelegateHook));
	MCProp->AddDelegate(ScriptDelegate, Source);
}

// ---- Binding source auto-observe ----

void USwuiSubsystem::SetBindingSources(const TArray<FSwuiBindingSource>& Sources)
{
	CachedBindingSources = Sources;

	// At BeginPlay time all actors are already initialized — scan the world once
	// and auto-observe every actor whose class matches a configured source entry.
	UWorld* World = GetGameInstance() ? GetGameInstance()->GetWorld() : nullptr;
	if (!World) return;

	// Iterate all live UObjects matching each configured source class.
	// This handles Actors, ActorComponents, and any other UObject subclass uniformly.
	for (const FSwuiBindingSource& Src : Sources)
	{
		if (!Src.SourceClass) continue;
		if (Src.Properties.IsEmpty() && Src.Delegates.IsEmpty()) continue;
		for (TObjectIterator<UObject> It; It; ++It)
		{
			if (It->GetWorld() != World) continue;
			if (!It->IsA(Src.SourceClass)) continue;
			ObserveSource(*It, /*bWarnOnMiss=*/false);

			// Auto-bind any checked delegate events on this instance.
			for (const FName& DelegateName : Src.Delegates)
				ObserveDelegate(*It, TEXT(""), DelegateName);
		}
	}

	RebuildCommandRuntime();
}

void USwuiSubsystem::ObserveSource(UObject* Instance, bool bWarnOnMiss)
{
	if (!Instance) return;
	UClass* InstanceClass = Instance->GetClass();

	for (const FSwuiBindingSource& Src : CachedBindingSources)
	{
		if (!Src.SourceClass || Src.Properties.IsEmpty()) continue;
		if (!InstanceClass->IsChildOf(Src.SourceClass)) continue;

		// Don't double-register the same instance.
		const bool bAlreadyObserved = ObservedProperties.ContainsByPredicate(
			[Instance](const FSwuiObservedProperty& E){ return E.Source == Instance; });
		if (bAlreadyObserved) return;

		for (const FName& PropName : Src.Properties)
			ObserveProperty(Instance, TEXT(""), PropName);
		return;
	}

	if (bWarnOnMiss)
		UE_LOG(LogTemp, Warning, TEXT("SWUI ObserveSource: no BindingSource entry found for class '%s'"),
			*InstanceClass->GetName());
}

void USwuiSubsystem::K2_Observe(UObject* Source, FName PropertyName)
{
	if (!Source) return;
	UWorld* World = Source->GetWorld();
	if (!World) return;
	if (UGameInstance* GI = World->GetGameInstance())
		if (USwuiSubsystem* Sub = GI->GetSubsystem<USwuiSubsystem>())
			Sub->ObserveProperty(Source, TEXT(""), PropertyName);
}

void USwuiSubsystem::K2_ObserveEvent(UObject* Source, FName DelegateName)
{
	if (!Source) return;
	UWorld* World = Source->GetWorld();
	if (!World) return;
	if (UGameInstance* GI = World->GetGameInstance())
		if (USwuiSubsystem* Sub = GI->GetSubsystem<USwuiSubsystem>())
			Sub->ObserveDelegate(Source, TEXT(""), DelegateName);
}

void USwuiSubsystem::Unobserve(UObject* Source)
{
	ObservedProperties.RemoveAll([&](const FSwuiObservedProperty& E) { return E.Source == Source; });
	ObservedDelegates.RemoveAll([&](const FSwuiObservedDelegate& E)  { return E.Source == Source; });
}

// ---- FTickableGameObject::Tick — runs every engine frame ----

void USwuiSubsystem::Tick(float DeltaTime)
{
	SWUI_PROFILE_SCOPE(GameThreadTotal);

	// Pump CEF at the start of the SWUI tick within a bounded time budget
	// so queued CEF UI tasks, timers, and JS work progress without stalling the game thread.
	const float CefBudgetMs = CVarSwuiCefMessageLoopBudgetMs.GetValueOnGameThread();
	const double CefBudgetSec = (CefBudgetMs > 0.f) ? (static_cast<double>(CefBudgetMs) * 0.001) : 0.0015;
	{
		SWUI_PROFILE_SCOPE(CefMessageLoop);
		SwuiManager::DoSwuiMessageLoopBudgeted(CefBudgetSec);
	}

	if (!View) return;

	// Retry focus-tracking script injection on first tick after browser is ready.
	if (!bFocusScriptInjected && View->HasBrowserHost())
	{
		bFocusScriptInjected = true;
		View->ExecuteJavaScript(
			TEXT("(function(){")
			TEXT("var f=false;")
			TEXT("var swuiSend=window.cefQuery||window.__SWUI__?.send||window.Swui?.send||window.chrome?.webview?.postMessage||function(){};")
			TEXT("document.addEventListener('focusin',function(e){")
			TEXT("var el=e.target,ed=el&&(el.tagName==='INPUT'||el.tagName==='TEXTAREA'||el.tagName==='SELECT'||el.isContentEditable);")
			TEXT("if(ed!==f){f=ed;swuiSend(JSON.stringify({type:'swui:focusInput',focused:ed}));}")
			TEXT("});")
			TEXT("document.addEventListener('focusout',function(){")
			TEXT("setTimeout(function(){")
			TEXT("var el=document.activeElement,ed=el&&(el.tagName==='INPUT'||el.tagName==='TEXTAREA'||el.tagName==='SELECT'||el.isContentEditable);")
			TEXT("if(ed!==f){f=!!ed;swuiSend(JSON.stringify({type:'swui:focusInput',focused:!!ed}));}")
			TEXT("},0);")
			TEXT("});")
			TEXT("})();")
		);
	}

	// Sync focus state from CEF browser to subsystem-level flag.
	bTextInputFocused = View->IsTextInputFocused();

	View->NotifySubsystemTick();

	// 1. Flush game state to JS FIRST so that DOM and animations receive new values
	// before the compositor renders the visual frame.
	const bool bCanFlushJs = !View->InstanceSettings.bPauseBrowserUpdates;
	const bool bFlushedState = bCanFlushJs && FlushHudStateToJs(DeltaTime);
	if (bFlushedState)
	{
		View->NotifyHudStateFlushed();
	}

	// 2. Drive continuous browser frame + upload/blit latest surface.
	View->TickDeferredUpload();

	// ── HUD ROI overlay ─────────────────────────────────────────────────
	UpdateRoiOverlay();

	// ── Periodic Diagnostic Telemetry Logging (swui.debug.Stats) ────────
	const int32 DebugStatsCVar = CVarSwuiDebugStats.GetValueOnGameThread();
	if (DebugStatsCVar > 0)
	{
		const double Now = FPlatformTime::Seconds();
		if (Now - Telemetry.LastLogStatsTime >= 1.0)
		{
			Telemetry.LastLogStatsTime = Now;
			const float PresentedFps = Telemetry.PaintToPresentLatency.Count > 0
				? (1000.f / FMath::Max(1.f, Telemetry.PaintToPresentLatency.Avg))
				: 0.f;

			UE_LOG(LogSwuiRuntime, Log,
				TEXT("[SWUI STATS] Frame: %llu | StateGen: %llu | Browser FPS: %.1f | Presented FPS: %.1f | Paint->Present: min=%.2fms avg=%.2fms max=%.2fms | Flush: min=%.2fms avg=%.2fms max=%.2fms | Props: %u (changed: %u) | Input: %u (coalesced: %u) | Dropped: %u"),
				Telemetry.FrameIndex,
				Telemetry.StateGeneration,
				AvgFPS,
				PresentedFps,
				Telemetry.PaintToPresentLatency.Min,
				Telemetry.PaintToPresentLatency.Avg,
				Telemetry.PaintToPresentLatency.Max,
				Telemetry.StateFlushDuration.Min,
				Telemetry.StateFlushDuration.Avg,
				Telemetry.StateFlushDuration.Max,
				Telemetry.ObservedPropertiesNum,
				Telemetry.ChangedPropertiesNum,
				Telemetry.InputEventsReceived,
				Telemetry.InputEventsCoalesced,
				Telemetry.DroppedFrames);
		}
	}

	const int32 TimelineStatsCVar = CVarSwuiDebugTimelineStats.GetValueOnGameThread();
	if (TimelineStatsCVar > 0 && Telemetry.ActiveTimelineId != NAME_None)
	{
		const double Now = FPlatformTime::Seconds();
		if (Now - Telemetry.LastLogStatsTime >= 0.5)
		{
			UE_LOG(LogSwuiRuntime, Log,
				TEXT("[SWUI TIMELINE STATS] Timeline: %s (gen %llu) | AuthProgress: %.3f | PresentedProgress: %.3f | Error: %.3f (max: %.3f, avg: %.3f) | CompletionDelay: %.2fms"),
				*Telemetry.ActiveTimelineId.ToString(),
				Telemetry.TimelineGeneration,
				Telemetry.LastAuthoritativeProgress,
				Telemetry.LastPresentedProgress,
				Telemetry.TimelinePresentationError,
				Telemetry.TimelineError.Max,
				Telemetry.TimelineError.Avg,
				Telemetry.CompletionPresentationDelayMs);
		}
	}

	// 3. Update SWUI Runtime Profiler
	FSwuiProfiler::Update(
		DeltaTime,
		AvgFPS,
		View ? static_cast<float>(View->GetWindowlessFrameRate()) : 60.f,
		View ? 1 : 0,
		View ? (View->GetResolvedRenderingMode() == ESwuiRenderingMode::GpuAccelerated ? TEXT("GPU (D3D Shared)") : TEXT("CPU Fallback")) : TEXT("None")
	);
}

bool USwuiSubsystem::FlushHudStateToJs(float DeltaTime)
{
	if (!View) return false;

	SWUI_PROFILE_SCOPE(StateSync);

	const double FlushStartTime = FPlatformTime::Seconds();

	const bool bFlushBeforeFrame =
		SwuiCVarBool(
			CVarSwuiHudFlushBeforeFrame.GetValueOnGameThread(),
			View->InstanceSettings.bFlushHudStateBeforeBrowserFrame);
	if (!bFlushBeforeFrame) return false;

	// Evaluate state update policy cadence
	const double Now = FPlatformTime::Seconds();
	float MinInterval = 0.f;
	switch (StateUpdatePolicy)
	{
	case ESwuiStateUpdatePolicy::Rate15Hz:  MinInterval = 1.0f / 15.0f; break;
	case ESwuiStateUpdatePolicy::Rate30Hz:  MinInterval = 1.0f / 30.0f; break;
	case ESwuiStateUpdatePolicy::Rate60Hz:  MinInterval = 1.0f / 60.0f; break;
	case ESwuiStateUpdatePolicy::Rate120Hz: MinInterval = 1.0f / 120.0f; break;
	case ESwuiStateUpdatePolicy::EventDriven:
		if (QueuedHudEventScripts.Num() == 0)
		{
			return false;
		}
		break;
	case ESwuiStateUpdatePolicy::OnChange:
	case ESwuiStateUpdatePolicy::EveryFrame:
	default:
		MinInterval = 0.f;
		break;
	}

	if (MinInterval > 0.f && LastStateFlushTime > 0.0)
	{
		if ((Now - LastStateFlushTime) < (MinInterval - 0.001) && QueuedHudEventScripts.Num() == 0)
		{
			return false;
		}
	}
	LastStateFlushTime = Now;

	const int32 CefFPS = SwuiCVarInt(
		CVarSwuiHudMaxBrowserFPS.GetValueOnGameThread(),
		View->InstanceSettings.MaxBrowserFramesPerSecond);

	// Exponential moving average FPS (alpha=0.1, smoothed over ~10 frames)
	if (DeltaTime > 0.f)
		AvgFPS = AvgFPS * 0.9f + (1.f / DeltaTime) * 0.1f;
	LastDeltaTime = DeltaTime;

	const double WorldTime = GetWorld() ? GetWorld()->GetTimeSeconds() : 0.0;
	const float TimeDilation = GetWorld() ? GetWorld()->GetWorldSettings()->TimeDilation : 1.f;
	const bool bIsPaused = GetWorld() ? GetWorld()->IsPaused() : false;
	const uint64 FrameCounter = GFrameCounter;

	Telemetry.ObservedPropertiesNum = ObservedProperties.Num();
	Telemetry.FrameIndex = FrameCounter;

	const bool bUseBatchStateSync = CVarSwuiBatchStateSync.GetValueOnGameThread() != 0;
	FString BatchedScript;
	int32 ChangedCount = 0;

	if (bUseBatchStateSync)
	{
		// Fast atomic JSON state batch — only serialize changed properties
		TArray<FString> ChangedEntries;

		for (int32 i = ObservedProperties.Num() - 1; i >= 0; --i)
		{
			FSwuiObservedProperty& Entry = ObservedProperties[i];
			if (!Entry.Source.IsValid())
			{
				ObservedProperties.RemoveAtSwap(i);
				continue;
			}

			// Low priority properties are checked every 4th frame (~15Hz at 60fps)
			if (Entry.Priority == ESwuiUpdatePriority::Low && (FrameCounter % 4) != 0)
			{
				continue;
			}

			UObject* Obj = Entry.Source.Get();
			if (!Entry.CachedProp) continue;

			const FString JSValue = Swui_SerializeProperty(Entry.CachedProp, Obj);
			if (JSValue.IsEmpty()) continue;

			const FString* PrevValue = LastObservedValues.Find(Entry.NamespacedKey);
			const bool bChanged = !PrevValue || *PrevValue != JSValue;
			if (bChanged)
			{
				LastObservedValues.Add(Entry.NamespacedKey, JSValue);
				ChangedEntries.Add(FString::Printf(TEXT("\"%s\":%s"), *Entry.NamespacedKey, *JSValue));
			}
		}

		ChangedCount = ChangedEntries.Num();
		if (ChangedCount > 0)
		{
			++Telemetry.StateGeneration;
			FSwuiProfiler::RecordStateUpdate(ChangedCount);
		}

		const bool bForceTickScript = CVarSwuiTickEventPolicy.GetValueOnGameThread() != 0;
		const bool bHasStateOrEvents = (ChangedCount > 0) || (QueuedHudEventScripts.Num() > 0) || bForceTickScript;

		if (bHasStateOrEvents)
		{
			FString StateJson = ChangedEntries.Num() > 0
				? FString::Printf(TEXT("{%s}"), *FString::Join(ChangedEntries, TEXT(",")))
				: TEXT("null");

			BatchedScript = FString::Printf(
				TEXT("(function(){")
				TEXT("var s=(window.__SWUI__=window.__SWUI__||{state:{},events:{}});")
				TEXT("s._runtime={fps:%.1f,dt:%.4f,time:%.3f,frameIndex:%llu,stateVersion:%llu,cefFps:%d,width:%d,height:%d,timeDilation:%.3f,paused:%s};")
				TEXT("var u=%s;")
				TEXT("if(u){if(s._batch){s._batch(u,s._runtime);}else{for(var k in u){s.state[k]=u[k];if(s._notify)s._notify(k,u[k]);}}}")
				TEXT("document.dispatchEvent(new CustomEvent('swui:tick',{detail:s._runtime}));")
				TEXT("})()"),
				AvgFPS, LastDeltaTime, WorldTime, FrameCounter, Telemetry.StateGeneration, CefFPS, View->Width, View->Height,
				TimeDilation, bIsPaused ? TEXT("true") : TEXT("false"),
				*StateJson);
		}
	}
	else
	{
		// Legacy fallback
		TArray<FString> PropertyAssignments;
		for (int32 i = ObservedProperties.Num() - 1; i >= 0; --i)
		{
			FSwuiObservedProperty& Entry = ObservedProperties[i];
			if (!Entry.Source.IsValid())
			{
				ObservedProperties.RemoveAtSwap(i);
				continue;
			}

			if (Entry.Priority == ESwuiUpdatePriority::Low && (FrameCounter % 4) != 0)
			{
				continue;
			}

			UObject* Obj = Entry.Source.Get();
			if (!Entry.CachedProp) continue;

			const FString JSValue = Swui_SerializeProperty(Entry.CachedProp, Obj);
			if (JSValue.IsEmpty()) continue;
			const FString* PrevValue = LastObservedValues.Find(Entry.NamespacedKey);
			const bool bChanged = !PrevValue || *PrevValue != JSValue;
			if (bChanged)
			{
				LastObservedValues.Add(Entry.NamespacedKey, JSValue);
				PropertyAssignments.Add(FString::Printf(
					TEXT("s.state['%s']=%s;if(s._notify)s._notify('%s',%s);"),
					*Entry.NamespacedKey, *JSValue,
					*Entry.NamespacedKey, *JSValue));
				++ChangedCount;
			}
		}

		if (ChangedCount > 0)
		{
			++Telemetry.StateGeneration;
			FSwuiProfiler::RecordStateUpdate(ChangedCount);
		}

		const bool bForceTickScript = CVarSwuiTickEventPolicy.GetValueOnGameThread() != 0;
		const bool bHasStateOrEvents = (ChangedCount > 0) || (QueuedHudEventScripts.Num() > 0) || bForceTickScript;

		if (bHasStateOrEvents)
		{
			BatchedScript = FString::Printf(
				TEXT("(function(){var s=(window.__SWUI__=window.__SWUI__||{state:{},events:{}});")
				TEXT("s._runtime={fps:%.1f,dt:%.4f,time:%.3f,frameIndex:%llu,stateVersion:%llu,cefFps:%d,width:%d,height:%d,timeDilation:%.3f,paused:%s};"),
				AvgFPS, LastDeltaTime, WorldTime, FrameCounter, Telemetry.StateGeneration, CefFPS, View->Width, View->Height,
				TimeDilation, bIsPaused ? TEXT("true") : TEXT("false"));

			for (const FString& Assign : PropertyAssignments)
			{
				BatchedScript += Assign;
			}

			BatchedScript += TEXT("document.dispatchEvent(new CustomEvent('swui:tick',{detail:s._runtime}));})();");
		}
	}

	Telemetry.ChangedPropertiesNum = ChangedCount;

	// Update timeline telemetry if an active timeline is running
	if (Telemetry.ActiveTimelineId != NAME_None)
	{
		const float AuthProg = GetTimelineProgress(Telemetry.ActiveTimelineId);
		Telemetry.LastAuthoritativeProgress = AuthProg;
	}

	const double FlushEndTime = FPlatformTime::Seconds();
	Telemetry.LastStateFlushDurationMs = (FlushEndTime - FlushStartTime) * 1000.0;
	Telemetry.StateFlushDuration.Add(static_cast<float>(Telemetry.LastStateFlushDurationMs));

	if (QueuedHudEventScripts.Num() > 0)
	{
		FString BatchedEvents;
		for (const FString& EventScript : QueuedHudEventScripts)
		{
			if (!BatchedEvents.IsEmpty()) BatchedEvents += TEXT(";");
			BatchedEvents += EventScript;
		}
		QueuedHudEventScripts.Reset();
		if (!BatchedEvents.IsEmpty())
		{
			if (!BatchedScript.IsEmpty()) BatchedScript += TEXT(";");
			BatchedScript += BatchedEvents;
		}
	}

	if (!BatchedScript.IsEmpty())
	{
		SWUI_PROFILE_SCOPE(JsDispatch);
		View->QueuePendingScript(BatchedScript);
	}

	if (ChangedCount > 0)
	{
		View->GetScheduler().NotifyActivity(false);
	}

	return !BatchedScript.IsEmpty();
}


void USwuiSubsystem::RequestHudVisualRefresh(float DurationSeconds, bool bForceFullUpload)
{
	if (View)
	{
		View->RequestBrowserVisualRefresh(true);
	}
}

void USwuiSubsystem::UpdateUiInteractionTime()
{
	LastUiInteractionTime = FPlatformTime::Seconds();
}

void USwuiSubsystem::QueueHudEventScript(const FString& Script)
{
	if (Script.IsEmpty())
	{
		return;
	}
	QueuedHudEventScripts.Add(Script);

	if (View)
	{
		View->GetScheduler().NotifyActivity(true);
	}
}



void USwuiSubsystem::UpdateLowLatencyFramePacing()
{
	const USwuiSettings* Settings = GetDefault<USwuiSettings>();
	const ESwuiLowLatencyFramePacingMode ConfiguredMode = Settings
		? Settings->LowLatencyFramePacingMode
		: ESwuiLowLatencyFramePacingMode::Disabled;

	// Determine whether the condition is currently active.
	bool bShouldApply = false;
	switch (ConfiguredMode)
	{
	case ESwuiLowLatencyFramePacingMode::WhileInteractiveUiActive:
		bShouldApply = (View != nullptr);
		break;
	case ESwuiLowLatencyFramePacingMode::WhileAnySwuiViewActive:
		bShouldApply = (View != nullptr);
		break;
	default:
		break;
	}

	// Avoid repeated CVar sets when mode hasn't changed.
	if (bShouldApply == (LastAppliedFramePacingMode != ESwuiLowLatencyFramePacingMode::Disabled))
	{
		return;
	}

	IConsoleVariable* CVar = IConsoleManager::Get().FindConsoleVariable(TEXT("r.OneFrameThreadLag"));
	if (!CVar) return;

	if (bShouldApply)
	{
		// Save previous value on first activation.
		if (SavedOneFrameThreadLag < 0)
		{
			SavedOneFrameThreadLag = CVar->GetInt();
		}
		CVar->Set(0, ECVF_SetByGameOverride);
		LastAppliedFramePacingMode = ConfiguredMode;
		if (View && (CVarSwuiVerbosePaint.GetValueOnGameThread() != 0 || View->InstanceSettings.bVerbosePaintLog))
		{
			UE_LOG(LogSwuiRuntime, Log, TEXT("[SWUI Runtime] Applied low latency frame pacing: r.OneFrameThreadLag 0"));
		}
	}
	else
	{
		// Restore previous value.
		if (SavedOneFrameThreadLag >= 0)
		{
			CVar->Set(SavedOneFrameThreadLag, ECVF_SetByGameOverride);
			if (View && (CVarSwuiVerbosePaint.GetValueOnGameThread() != 0 || View->InstanceSettings.bVerbosePaintLog))
			{
				UE_LOG(LogSwuiRuntime, Log, TEXT("[SWUI Runtime] Restored r.OneFrameThreadLag=%d"), SavedOneFrameThreadLag);
			}
			SavedOneFrameThreadLag = -1;
		}
		LastAppliedFramePacingMode = ESwuiLowLatencyFramePacingMode::Disabled;
	}
}

bool USwuiSubsystem::SendExternalBeginFrameIfDue(float DeltaTime)
{
	if (View)
	{
		return View->SendExternalBeginFrameIfDue(DeltaTime);
	}
	return false;
}

// ---- Delegate fire trampoline ----
// This is called whenever any observed delegate fires using the OLD shared path.
// Only used as a fallback; per-delegate bridges (USwuiDelegateBridge) are preferred.
void USwuiSubsystem::OnObservedDelegateFired()
{
	for (const FSwuiObservedDelegate& Entry : ObservedDelegates)
	{
		if (!Entry.Source.IsValid()) continue;

		FString Script = FString::Printf(
			TEXT("(function(){var s=(window.__SWUI__=window.__SWUI__||{state:{},events:{}});")
			TEXT("var ev=new CustomEvent('%s',{detail:{}});document.dispatchEvent(ev);})();"),
			*Entry.NamespacedKey);
		QueueHudEventScript(Script);
	}
}

// ---- USwuiDelegateBridge ----
// Generic bridge: ProcessEvent is overridden so that when the observed delegate
// broadcasts, we intercept the call, read ALL parameters from the delegate's
// Parms buffer using the stored SignatureFunction's property layout, serialize
// each param by its original name, and dispatch the SWUI CustomEvent.
// No per-type Fire* functions needed — this handles any delegate signature.

void USwuiDelegateBridge::Init(const FString& InNsKey, USwuiSubsystem* InOwner, UFunction* InDelegateSignature)
{
	NamespacedKey = InNsKey;
	Owner = InOwner;
	DelegateSignature = InDelegateSignature;
	HookFunction = FindFunctionChecked(TEXT("DelegateHook"));
}

void USwuiDelegateBridge::ProcessEvent(UFunction* Function, void* Parms)
{
	if (Function != HookFunction || !Owner || !DelegateSignature)
	{
		// Not our delegate hook — chain to base class so normal UObject
		// events (Serialize, FinishDestroy, etc.) still work.
		Super::ProcessEvent(Function, Parms);
		return;
	}

	FString Json = TEXT("{");
	bool bFirst = true;

	for (TFieldIterator<FProperty> It(DelegateSignature); It; ++It)
	{
		if (!It->HasAnyPropertyFlags(CPF_Parm) || It->HasAnyPropertyFlags(CPF_ReturnParm))
			continue;

		if (!bFirst) Json += TEXT(",");
		bFirst = false;

		const FString FieldName = It->GetName();
		Json += Swui_QuoteJsonString(FieldName) + TEXT(":");

		void* ValuePtr = It->ContainerPtrToValuePtr<void>(Parms);
		Json += Swui_SerializePropertyValue(*It, ValuePtr);
	}

	Json += TEXT("}");

	const FString EscapedName = Swui_QuoteJsonString(NamespacedKey);
	const FString Script = FString::Printf(
		TEXT("document.dispatchEvent(new CustomEvent(%s,{detail:%s}));"),
		*EscapedName, *Json);

	Owner->QueueHudEventScript(Script);
}

// ══════════════════════════════════════════════════════════════════════════════
// Command Runtime — function-backed navigation events
// ══════════════════════════════════════════════════════════════════════════════

void USwuiSubsystem::RebuildCommandRuntime()
{
	FunctionCommands.Reset();

#if WITH_EDITOR
	for (TObjectIterator<UClass> It; It; ++It)
	{
		UClass* Cls = *It;
		if (Cls->HasAnyClassFlags(CLASS_Abstract | CLASS_Deprecated | CLASS_NewerVersionExists)) continue;
		if (Cls->GetName().StartsWith(TEXT("SKEL_")) || Cls->GetName().StartsWith(TEXT("REINST_"))) continue;

		for (TFieldIterator<UFunction> FnIt(Cls, EFieldIteratorFlags::ExcludeSuper); FnIt; ++FnIt)
		{
			const FString TagStr = FnIt->GetMetaData(TEXT("SwuiCommand"));
			if (TagStr.IsEmpty()) continue;

			FGameplayTag Tag = FGameplayTag::RequestGameplayTag(FName(*TagStr), /*bErrorIfNotFound=*/false);
			if (!Tag.IsValid()) continue;

			FSwuiFunctionCommand Cmd;
			Cmd.Tag = Tag;
			Cmd.OwnerClass = Cls;
			Cmd.Function = *FnIt;
			FunctionCommands.Add(Tag, Cmd);

			UE_LOG(LogTemp, Verbose, TEXT("SWUI: Command registered: '%s' -> %s::%s(%d params)"),
				*TagStr, *Cls->GetName(), *FnIt->GetName(), FnIt->ParmsSize);
		}
	}

	UE_LOG(LogTemp, Log, TEXT("SWUI: Command runtime rebuilt -- %d function-backed command(s) registered."),
		FunctionCommands.Num());
#endif
}

bool USwuiSubsystem::TryResolveFunctionCommand(FGameplayTag Tag, FSwuiFunctionCommand& OutCommand) const
{
	if (const FSwuiFunctionCommand* Found = FunctionCommands.Find(Tag))
	{
		OutCommand = *Found;
		return true;
	}
	return false;
}

bool USwuiSubsystem::TryResolveActiveBindingTarget(UClass* RequiredClass, UObject*& OutTarget, FString& OutError) const
{
	OutTarget = nullptr;
	OutError.Empty();

	if (!RequiredClass)
	{
		OutError = TEXT("RequiredClass is null.");
		return false;
	}

	if (RequiredClass->IsChildOf<UGameInstanceSubsystem>())
	{
		UGameInstance* GI = GetGameInstance();
		if (!GI)
		{
			OutError = TEXT("No GameInstance available.");
			return false;
		}
		OutTarget = GI->GetSubsystemBase(RequiredClass);
		if (!OutTarget)
		{
			OutError = FString::Printf(TEXT("GameInstance subsystem %s not found."), *RequiredClass->GetName());
			return false;
		}
		return true;
	}

		if (RequiredClass->IsChildOf<UWorldSubsystem>())
	{
		UWorld* World = GetWorld();
		if (!World)
		{
			OutError = TEXT("No World available.");
			return false;
		}
		OutTarget = World->GetSubsystemBase(RequiredClass);
		if (!OutTarget)
		{
			OutError = FString::Printf(TEXT("World subsystem %s not found."), *RequiredClass->GetName());
			return false;
		}
		return true;
	}

	if (RequiredClass->IsChildOf<ULocalPlayerSubsystem>())
	{
		const UGameInstance* GI = GetGameInstance();
		const ULocalPlayer* LP = GI ? GI->GetFirstGamePlayer() : nullptr;
		if (!LP)
		{
			OutError = TEXT("No LocalPlayer available.");
			return false;
		}
		OutTarget = LP->GetSubsystemBase(RequiredClass);
		if (!OutTarget)
		{
			OutError = FString::Printf(TEXT("LocalPlayer subsystem %s not found."), *RequiredClass->GetName());
			return false;
		}
		return true;
	}

	// ── Active binding source inst-ances ────────────────────────────────
	int32 MatchCount = 0;
	for (const FSwuiObservedProperty& Obs : ObservedProperties)
	{
		UObject* Obj = Obs.Source.Get();
		if (!Obj) continue;
		if (!Obj->IsA(RequiredClass)) continue;

		if (OutTarget == nullptr)
			OutTarget = Obj;
		else if (OutTarget != Obj)
			++MatchCount;
	}

	if (MatchCount > 1)
	{
		OutError = FString::Printf(TEXT("Multiple active instances found for %s — command dispatch is ambiguous."),
			*RequiredClass->GetName());
		OutTarget = nullptr;
		return false;
	}

	if (!OutTarget)
	{
		// Also check ObservedDelegates for instances.
		for (const FSwuiObservedDelegate& Obs : ObservedDelegates)
		{
			UObject* Obj = Obs.Source.Get();
			if (!Obj) continue;
			if (!Obj->IsA(RequiredClass)) continue;

			if (OutTarget == nullptr)
				OutTarget = Obj;
			else if (OutTarget != Obj)
				++MatchCount;
		}

		if (MatchCount > 1)
		{
			OutError = FString::Printf(TEXT("Multiple active instances found for %s — command dispatch is ambiguous."),
				*RequiredClass->GetName());
			OutTarget = nullptr;
			return false;
		}
	}

	if (!OutTarget)
	{
		OutError = FString::Printf(TEXT("No active binding-source instance found for %s."), *RequiredClass->GetName());
		return false;
	}

	return true;
}

// ---------------------------------------------------------------------------
// Timeline Synchronization API (SWUI 1.5 Phase 2)
// ---------------------------------------------------------------------------

void USwuiSubsystem::StartTimeline(FName Id, float Duration, bool bReversed)
{
	if (Id == NAME_None) return;

	const double WorldTime = GetWorld() ? GetWorld()->GetTimeSeconds() : 0.0;
	const uint64 Gen = NextTimelineGeneration++;

	FSwuiTimeline Timeline;
	Timeline.Id = Id;
	Timeline.Generation = Gen;
	Timeline.Duration = FMath::Max(0.001f, Duration);
	Timeline.bReversed = bReversed;
	Timeline.State = ESwuiTimelineState::Running;
	Timeline.StartGameTime = static_cast<float>(WorldTime);
	Timeline.CompleteGameTime = 0.f;
	Timeline.CancelGameTime = 0.f;
	Timeline.CancelProgress = 0.f;

	ActiveTimelines.Add(Id, Timeline);

	Telemetry.ActiveTimelineId = Id;
	Telemetry.TimelineGeneration = Gen;
	Telemetry.TimelineStartGameTime = WorldTime;
	Telemetry.TimelineDuration = Timeline.Duration;

	const FString Script = FString::Printf(
		TEXT("window.dispatchEvent(new CustomEvent('swui:timelineStart', { detail: { id: '%s', generation: %llu, startGameTime: %.4f, duration: %.4f, reversed: %s } }));"),
		*Id.ToString(),
		Gen,
		WorldTime,
		Timeline.Duration,
		bReversed ? TEXT("true") : TEXT("false"));

	QueueHudEventScript(Script);
}

void USwuiSubsystem::CompleteTimeline(FName Id)
{
	FSwuiTimeline* Found = ActiveTimelines.Find(Id);
	if (!Found || Found->State != ESwuiTimelineState::Running)
	{
		return;
	}

	const double WorldTime = GetWorld() ? GetWorld()->GetTimeSeconds() : 0.0;
	Found->State = ESwuiTimelineState::Completed;
	Found->CompleteGameTime = static_cast<float>(WorldTime);

	Telemetry.TimelineCompleteGameTime = WorldTime;
	Telemetry.LastAuthoritativeProgress = 1.0f;

	const FString Script = FString::Printf(
		TEXT("window.dispatchEvent(new CustomEvent('swui:timelineComplete', { detail: { id: '%s', generation: %llu, completeGameTime: %.4f } }));"),
		*Id.ToString(),
		Found->Generation,
		WorldTime);

	QueueHudEventScript(Script);
}

void USwuiSubsystem::CancelTimeline(FName Id, float CancelGameTime)
{
	FSwuiTimeline* Found = ActiveTimelines.Find(Id);
	if (!Found || Found->State != ESwuiTimelineState::Running)
	{
		return;
	}

	const double WorldTime = GetWorld() ? GetWorld()->GetTimeSeconds() : 0.0;
	const float EffectiveCancelTime = (CancelGameTime >= 0.f) ? CancelGameTime : static_cast<float>(WorldTime);

	Found->State = ESwuiTimelineState::Cancelled;
	Found->CancelGameTime = EffectiveCancelTime;
	const float Elapsed = EffectiveCancelTime - Found->StartGameTime;
	Found->CancelProgress = Found->Duration > 0.f ? FMath::Clamp(Elapsed / Found->Duration, 0.f, 1.f) : 0.f;
	if (Found->bReversed)
	{
		Found->CancelProgress = 1.0f - Found->CancelProgress;
	}

	Telemetry.TimelineCancelGameTime = EffectiveCancelTime;
	Telemetry.LastAuthoritativeProgress = Found->CancelProgress;

	const FString Script = FString::Printf(
		TEXT("window.dispatchEvent(new CustomEvent('swui:timelineCancel', { detail: { id: '%s', generation: %llu, cancelGameTime: %.4f, cancelProgress: %.4f } }));"),
		*Id.ToString(),
		Found->Generation,
		EffectiveCancelTime,
		Found->CancelProgress);

	QueueHudEventScript(Script);
}

float USwuiSubsystem::GetTimelineProgress(FName Id) const
{
	const FSwuiTimeline* Found = ActiveTimelines.Find(Id);
	if (!Found) return 0.f;

	if (Found->State == ESwuiTimelineState::Completed)
	{
		return 1.0f;
	}
	if (Found->State == ESwuiTimelineState::Cancelled)
	{
		return Found->CancelProgress;
	}
	if (Found->State == ESwuiTimelineState::Running)
	{
		if (Found->Duration <= 0.f) return 1.0f;
		const double WorldTime = GetWorld() ? GetWorld()->GetTimeSeconds() : 0.0;
		const float Elapsed = static_cast<float>(WorldTime) - Found->StartGameTime;
		const float Raw = FMath::Clamp(Elapsed / Found->Duration, 0.f, 1.f);
		return Found->bReversed ? (1.0f - Raw) : Raw;
	}
	return 0.f;
}

bool USwuiSubsystem::IsTimelineActive(FName Id) const
{
	const FSwuiTimeline* Found = ActiveTimelines.Find(Id);
	return Found && Found->State == ESwuiTimelineState::Running;
}

int64 USwuiSubsystem::GetTimelineGeneration(FName Id) const
{
	const FSwuiTimeline* Found = ActiveTimelines.Find(Id);
	return Found ? Found->Generation : 0;
}

bool USwuiSubsystem::GetTimelineData(FName Id, FSwuiTimeline& OutTimeline) const
{
	const FSwuiTimeline* Found = ActiveTimelines.Find(Id);
	if (Found)
	{
		OutTimeline = *Found;
		return true;
	}
	OutTimeline = FSwuiTimeline{};
	return false;
}

