#include "SwuiDocument.h"
#include "SwuiDocumentAsset.h"
#include "SwuiDocumentManagerSubsystem.h"
#include "SwuiView.h"
#include "Swui.h" // for USwuiWidget
#include "Engine/World.h"
#include "Engine/Engine.h"
#include "Blueprint/UserWidget.h"
#include "Blueprint/WidgetTree.h"
#include "Components/CanvasPanel.h"
#include "Components/CanvasPanelSlot.h"
#include "Components/Image.h"
#include "Materials/MaterialInterface.h"

USwuiDocument::USwuiDocument()
{
	DocumentId = NAME_None;
	State = ESwuiDocumentState::Unloaded;
	Layer = ESwuiDocumentLayer::Level;
	LoadBehavior = ESwuiDocumentLoadBehavior::Lazy;
	Priority = ESwuiUpdatePriority::Normal;
	bIsPersistent = false;
	EntryURL = TEXT("local://UI/out/index.html");
	Width = 1920;
	Height = 1080;
	ZOrder = 0;
	bIsTransparent = true;
}

void USwuiDocument::InitializeFromAsset(USwuiDocumentAsset* InAsset)
{
	if (!InAsset) return;

	Asset = InAsset;
	DocumentId = InAsset->DocumentId.IsNone() ? InAsset->GetFName() : InAsset->DocumentId;
	EntryURL = InAsset->EntryURL;
	Layer = InAsset->Layer;
	LoadBehavior = InAsset->LoadBehavior;
	Priority = InAsset->Priority;
	bIsPersistent = InAsset->bIsPersistent;
	ZOrder = InAsset->DefaultZOrder;
	Width = InAsset->Width;
	Height = InAsset->Height;
	bIsTransparent = InAsset->bIsTransparent;
	SubscribedKeys = InAsset->SubscribedStateKeys;
	InstanceSettings = InAsset->ToInstanceSettings();
}

void USwuiDocument::InitializeManual(FName InDocumentId, const FString& InEntryURL, ESwuiDocumentLayer InLayer, int32 InWidth, int32 InHeight)
{
	DocumentId = InDocumentId;
	EntryURL = InEntryURL;
	Layer = InLayer;
	Width = InWidth;
	Height = InHeight;
	bIsPersistent = (InLayer == ESwuiDocumentLayer::Persistent);

	InstanceSettings.RenderingMode = ESwuiRenderingMode::Auto;
	InstanceSettings.bIsHUD = (InLayer == ESwuiDocumentLayer::Persistent);
	InstanceSettings.CustomUiWidth = InWidth;
	InstanceSettings.CustomUiHeight = InHeight;
	InstanceSettings.UiResolutionPreset = ESwuiUiResolutionPreset::Custom;
}

void USwuiDocument::SetState(ESwuiDocumentState NewState)
{
	if (State != NewState)
	{
		State = NewState;
		OnStateChanged.Broadcast(this, State);
	}
}

void USwuiDocument::CreateWidgetSurface(UWorld* InWorld)
{
	if (!InWorld || Widget) return;

	Widget = CreateWidget<UUserWidget>(InWorld, USwuiWidget::StaticClass());
	if (!Widget) return;

	if (!Widget->WidgetTree)
	{
		Widget->WidgetTree = NewObject<UWidgetTree>(Widget, TEXT("WidgetTree"));
	}

	UCanvasPanel* RootPanel = Widget->WidgetTree->ConstructWidget<UCanvasPanel>(UCanvasPanel::StaticClass(), TEXT("RootPanel"));
	RootPanel->bIsVariable = false;

	UImage* Image = Widget->WidgetTree->ConstructWidget<UImage>(UImage::StaticClass(), TEXT("SwuiDocumentImage"));
	if (View && View->GetTexture())
	{
		Image->SetBrushFromTexture(View->GetTexture());
	}
	else if (View && View->BaseMaterial)
	{
		Image->SetBrushFromMaterial(View->BaseMaterial);
	}

	FSlateBrush Brush = Image->GetBrush();
	Brush.ImageSize = FVector2D(Width, Height);
	Brush.DrawAs = ESlateBrushDrawType::Image;
	Image->SetBrush(Brush);
	Image->SynchronizeProperties();

	UPanelSlot* Slot = RootPanel->AddChild(Image);
	if (UCanvasPanelSlot* CanvasSlot = Cast<UCanvasPanelSlot>(Slot))
	{
		if (Layer == ESwuiDocumentLayer::Persistent)
		{
			CanvasSlot->SetAnchors(FAnchors(0.f, 0.f, 1.f, 1.f));
			CanvasSlot->SetOffsets(FMargin(0.f));
		}
		else
		{
			CanvasSlot->SetAnchors(FAnchors(0.5f, 0.5f, 0.5f, 0.5f));
			CanvasSlot->SetPosition(FVector2D(0.f, 0.f));
			CanvasSlot->SetSize(FVector2D(Width, Height));
			CanvasSlot->SetAutoSize(false);
		}
	}

	Widget->WidgetTree->RootWidget = RootPanel;
	Widget->SetIsFocusable(false);
}

bool USwuiDocument::Load(UWorld* InWorld)
{
	if (State == ESwuiDocumentState::Active || State == ESwuiDocumentState::Preloaded)
	{
		return true;
	}

	UWorld* World = InWorld;
	if (!World)
	{
		World = CachedWorld.Get();
	}
	if (!World && GEngine)
	{
		for (const FWorldContext& Context : GEngine->GetWorldContexts())
		{
			if (Context.WorldType == EWorldType::Game || Context.WorldType == EWorldType::PIE)
			{
				World = Context.World();
				break;
			}
		}
	}
	if (!World)
	{
		return false;
	}
	CachedWorld = World;

	SetState(ESwuiDocumentState::Loading);

	View = NewObject<USwuiView>(this);
	View->DefaultURL = EntryURL;
	View->Width = Width;
	View->Height = Height;
	View->bIsTransparent = bIsTransparent;
	View->BaseMaterial = Asset ? Asset->BaseMaterial.Get() : nullptr;
	View->TextureParameterName = Asset ? Asset->TextureParameterName : FName(TEXT("SwuiTexture"));
	if (OwningActor.IsValid())
	{
		View->SetOwningActor(OwningActor.Get());
	}
	View->Init(InstanceSettings);

	// Generic focus tracking bridge
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

	CreateWidgetSurface(World);

	SetState(ESwuiDocumentState::Preloaded);
	OnLoaded.Broadcast(this);
	return true;
}

bool USwuiDocument::Preload(UWorld* InWorld)
{
	return Load(InWorld);
}

bool USwuiDocument::Activate(int32 OverrideZOrder)
{
	if (State == ESwuiDocumentState::Unloaded || !View)
	{
		if (!Load())
		{
			return false;
		}
	}

	const int32 FinalZ = (OverrideZOrder >= 0) ? OverrideZOrder : ZOrder;
	ZOrder = FinalZ;

	if (Widget && !Widget->IsInViewport())
	{
		Widget->AddToViewport(FinalZ);
		Widget->SetVisibility(ESlateVisibility::SelfHitTestInvisible);
	}

	if (View)
	{
		View->WakeUI();
	}

	SetState(ESwuiDocumentState::Active);

	if (USwuiDocumentManagerSubsystem* DocMgr = GetTypedOuter<USwuiDocumentManagerSubsystem>())
	{
		const TMap<FString, FString> Snapshot = DocMgr->GetStateSnapshot();
		if (!Snapshot.IsEmpty())
		{
			PushStateBatch(Snapshot);
		}
	}

	return true;
}

bool USwuiDocument::Deactivate()
{
	if (Widget && Widget->IsInViewport())
	{
		Widget->RemoveFromParent();
	}

	if (View && InstanceSettings.bEnableSleep)
	{
		Sleep();
	}
	else
	{
		SetState(ESwuiDocumentState::Preloaded);
	}

	return true;
}

void USwuiDocument::Sleep()
{
	if (View)
	{
		View->SleepUI();
	}
	SetState(ESwuiDocumentState::Sleeping);
}

void USwuiDocument::Wake()
{
	if (View)
	{
		View->WakeUI();
	}

	if (Widget && Widget->IsInViewport())
	{
		SetState(ESwuiDocumentState::Active);
	}
	else
	{
		SetState(ESwuiDocumentState::Preloaded);
	}
}

void USwuiDocument::Unload()
{
	SetState(ESwuiDocumentState::Unloading);

	if (Widget && Widget->IsInViewport())
	{
		Widget->RemoveFromParent();
	}
	Widget = nullptr;

	if (View)
	{
		View->Shutdown();
		View = nullptr;
	}

	SetState(ESwuiDocumentState::Unloaded);
}

void USwuiDocument::ExecuteJavaScript(const FString& Script)
{
	if (View)
	{
		View->ExecuteJavaScript(Script);
	}
}

void USwuiDocument::PushState(const FString& Key, const FString& JsonValue)
{
	if (!View || !IsSubscribedToKey(Key))
	{
		return;
	}

	const FString Script = FString::Printf(
		TEXT("(function(){")
		TEXT("var s=(window.__SWUI__=window.__SWUI__||{state:{},events:{}});")
		TEXT("s.state['%s']=%s;")
		TEXT("if(s._notify)s._notify('%s',%s);")
		TEXT("document.dispatchEvent(new CustomEvent('swui:stateChange',{detail:{key:'%s',value:%s}}));")
		TEXT("})()"),
		*Key, *JsonValue,
		*Key, *JsonValue,
		*Key, *JsonValue
	);

	View->ExecuteJavaScript(Script);
}

void USwuiDocument::PushStateBatch(const TMap<FString, FString>& StateBatch)
{
	if (!View || StateBatch.IsEmpty())
	{
		return;
	}

	TArray<FString> FilteredAssignments;
	for (const auto& Kvp : StateBatch)
	{
		if (IsSubscribedToKey(Kvp.Key))
		{
			FilteredAssignments.Add(FString::Printf(TEXT("\"%s\":%s"), *Kvp.Key, *Kvp.Value));
		}
	}

	if (FilteredAssignments.IsEmpty())
	{
		return;
	}

	const FString BatchJson = FString::Printf(TEXT("{%s}"), *FString::Join(FilteredAssignments, TEXT(",")));
	const FString Script = FString::Printf(
		TEXT("(function(){")
		TEXT("var s=(window.__SWUI__=window.__SWUI__||{state:{},events:{}});")
		TEXT("var u=%s;")
		TEXT("if(s._batch){s._batch(u);}else{for(var k in u){s.state[k]=u[k];if(s._notify)s._notify(k,u[k]);document.dispatchEvent(new CustomEvent('swui:stateChange',{detail:{key:k,value:u[k]}}));}}")
		TEXT("})()"),
		*BatchJson
	);

	View->ExecuteJavaScript(Script);
}

void USwuiDocument::DispatchWebEvent(const FString& EventName, const FString& JsonDetail)
{
	if (!View) return;

	const FString DetailStr = JsonDetail.IsEmpty() ? TEXT("{}") : JsonDetail;
	const FString Script = FString::Printf(
		TEXT("(function(){")
		TEXT("document.dispatchEvent(new CustomEvent('%s',{detail:%s}));")
		TEXT("})()"),
		*EventName, *DetailStr
	);

	View->ExecuteJavaScript(Script);
}

bool USwuiDocument::IsSubscribedToKey(const FString& Key) const
{
	if (SubscribedKeys.IsEmpty())
	{
		return true; // Empty array means subscribed to all
	}

	for (const FString& Subscribed : SubscribedKeys)
	{
		if (Subscribed == TEXT("*") || Key == Subscribed || Key.StartsWith(Subscribed + TEXT(".")))
		{
			return true;
		}
	}

	return false;
}

void USwuiDocument::SetZOrder(int32 InZOrder)
{
	ZOrder = InZOrder;
	if (Widget && Widget->IsInViewport())
	{
		Widget->RemoveFromParent();
		Widget->AddToViewport(ZOrder);
	}
}

void USwuiDocument::SetOwningActor(AActor* InActor)
{
	OwningActor = InActor;
	if (View)
	{
		View->SetOwningActor(InActor);
	}
}
