#include "SwuiDocumentManagerSubsystem.h"
#include "SwuiSubsystem.h"
#include "SwuiSettings.h"
#include "SwuiView.h"
#include "SwuiCVars.h"
#include "SwuiManager.h"
#include "SwuiProfiler.h"
#include "Engine/GameInstance.h"
#include "Engine/World.h"

bool USwuiDocumentManagerSubsystem::ShouldCreateSubsystem(UObject* Outer) const
{
	const USwuiSettings* Settings = GetDefault<USwuiSettings>();
	return Settings && !Settings->bDisablePlugin;
}

void USwuiDocumentManagerSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);

	WorldDestroyDelegateHandle = FWorldDelegates::OnPreWorldFinishDestroy.AddUObject(
		this, &USwuiDocumentManagerSubsystem::OnWorldPreFinishDestroy);

	UE_LOG(LogTemp, Log, TEXT("[SWUI 3.0] USwuiDocumentManagerSubsystem initialized."));
}

void USwuiDocumentManagerSubsystem::Deinitialize()
{
	if (WorldDestroyDelegateHandle.IsValid())
	{
		FWorldDelegates::OnPreWorldFinishDestroy.Remove(WorldDestroyDelegateHandle);
		WorldDestroyDelegateHandle.Reset();
	}

	for (auto& Kvp : Documents)
	{
		if (Kvp.Value)
		{
			Kvp.Value->Unload();
		}
	}
	Documents.Empty();
	GlobalStateSnapshot.Empty();
	PendingDirtyState.Empty();

	Super::Deinitialize();
}

void USwuiDocumentManagerSubsystem::Tick(float DeltaTime)
{
	SWUI_PROFILE_SCOPE(GameThreadTotal);

	// 1. Primary CEF message loop pumping within bounded time budget
	const float CefBudgetMs = CVarSwuiCefMessageLoopBudgetMs.GetValueOnGameThread();
	const double CefBudgetSec = (CefBudgetMs > 0.f) ? (static_cast<double>(CefBudgetMs) * 0.001) : 0.0015;
	{
		SWUI_PROFILE_SCOPE(CefMessageLoop);
		SwuiManager::DoSwuiMessageLoopBudgeted(CefBudgetSec);
	}

	// 2. Atomic state batch flushing to JavaScript DOM/frameworks before visual rendering
	FlushStateBatch();

	// 3. Drive continuous browser frame + upload/blit latest surface for all active/preloaded documents
	for (auto& Kvp : Documents)
	{
		USwuiDocument* Doc = Kvp.Value;
		if (!Doc)
		{
			continue;
		}

		USwuiView* View = Doc->GetView();
		if (!View)
		{
			continue;
		}

		const ESwuiDocumentState DocState = Doc->GetState();
		if (DocState == ESwuiDocumentState::Active || DocState == ESwuiDocumentState::Preloaded)
		{
			View->NotifySubsystemTick();
			View->SendExternalBeginFrameIfDue(DeltaTime);
			View->TickDeferredUpload();
		}
	}
}

USwuiDocument* USwuiDocumentManagerSubsystem::RegisterDocumentAsset(USwuiDocumentAsset* Asset)
{
	if (!Asset)
	{
		return nullptr;
	}

	const FName DocId = Asset->DocumentId.IsNone() ? Asset->GetFName() : Asset->DocumentId;
	if (const TObjectPtr<USwuiDocument>* Existing = Documents.Find(DocId))
	{
		(*Existing)->InitializeFromAsset(Asset);
		return Existing->Get();
	}

	USwuiDocument* NewDoc = NewObject<USwuiDocument>(this);
	NewDoc->InitializeFromAsset(Asset);
	Documents.Add(DocId, NewDoc);

	if (Asset->LoadBehavior == ESwuiDocumentLoadBehavior::Eager)
	{
		NewDoc->Preload();
	}

	OnDocumentRegistered.Broadcast(NewDoc);
	return NewDoc;
}

USwuiDocument* USwuiDocumentManagerSubsystem::RegisterDocumentManual(FName DocumentId, const FString& EntryURL, ESwuiDocumentLayer Layer, int32 Width, int32 Height)
{
	if (DocumentId.IsNone())
	{
		return nullptr;
	}

	if (const TObjectPtr<USwuiDocument>* Existing = Documents.Find(DocumentId))
	{
		(*Existing)->InitializeManual(DocumentId, EntryURL, Layer, Width, Height);
		return Existing->Get();
	}

	USwuiDocument* NewDoc = NewObject<USwuiDocument>(this);
	NewDoc->InitializeManual(DocumentId, EntryURL, Layer, Width, Height);
	Documents.Add(DocumentId, NewDoc);

	OnDocumentRegistered.Broadcast(NewDoc);
	return NewDoc;
}

USwuiDocument* USwuiDocumentManagerSubsystem::LoadDocument(FName DocumentId)
{
	USwuiDocument* Doc = GetDocument(DocumentId);
	if (Doc)
	{
		Doc->Load();
	}
	return Doc;
}

USwuiDocument* USwuiDocumentManagerSubsystem::LoadDocumentAsset(USwuiDocumentAsset* Asset)
{
	USwuiDocument* Doc = RegisterDocumentAsset(Asset);
	if (Doc)
	{
		Doc->Load();
	}
	return Doc;
}

bool USwuiDocumentManagerSubsystem::PreloadDocument(FName DocumentId)
{
	USwuiDocument* Doc = GetDocument(DocumentId);
	if (Doc)
	{
		return Doc->Preload();
	}
	return false;
}

bool USwuiDocumentManagerSubsystem::ActivateDocument(FName DocumentId, int32 OverrideZOrder)
{
	USwuiDocument* Doc = GetDocument(DocumentId);
	if (Doc)
	{
		return Doc->Activate(OverrideZOrder);
	}
	return false;
}

bool USwuiDocumentManagerSubsystem::DeactivateDocument(FName DocumentId)
{
	USwuiDocument* Doc = GetDocument(DocumentId);
	if (Doc)
	{
		return Doc->Deactivate();
	}
	return false;
}

void USwuiDocumentManagerSubsystem::SleepDocument(FName DocumentId)
{
	USwuiDocument* Doc = GetDocument(DocumentId);
	if (Doc)
	{
		Doc->Sleep();
	}
}

void USwuiDocumentManagerSubsystem::WakeDocument(FName DocumentId)
{
	USwuiDocument* Doc = GetDocument(DocumentId);
	if (Doc)
	{
		Doc->Wake();
	}
}

void USwuiDocumentManagerSubsystem::UnloadDocument(FName DocumentId)
{
	USwuiDocument* Doc = GetDocument(DocumentId);
	if (Doc)
	{
		Doc->Unload();
		Documents.Remove(DocumentId);
		OnDocumentUnregistered.Broadcast(DocumentId);
	}
}

void USwuiDocumentManagerSubsystem::UnloadNonPersistentDocuments()
{
	TArray<FName> KeysToRemove;
	for (auto& Kvp : Documents)
	{
		if (Kvp.Value && !Kvp.Value->IsPersistent())
		{
			Kvp.Value->Unload();
			KeysToRemove.Add(Kvp.Key);
		}
	}

	for (const FName& Key : KeysToRemove)
	{
		Documents.Remove(Key);
		OnDocumentUnregistered.Broadcast(Key);
	}
}

void USwuiDocumentManagerSubsystem::OnWorldPreFinishDestroy(UWorld* World)
{
	UnloadNonPersistentDocuments();
}

USwuiDocument* USwuiDocumentManagerSubsystem::GetDocument(FName DocumentId) const
{
	const TObjectPtr<USwuiDocument>* Found = Documents.Find(DocumentId);
	return Found ? Found->Get() : nullptr;
}

TArray<USwuiDocument*> USwuiDocumentManagerSubsystem::GetAllDocuments() const
{
	TArray<USwuiDocument*> Result;
	Result.Reserve(Documents.Num());
	for (const auto& Kvp : Documents)
	{
		if (Kvp.Value)
		{
			Result.Add(Kvp.Value.Get());
		}
	}
	return Result;
}

TArray<USwuiDocument*> USwuiDocumentManagerSubsystem::GetDocumentsByLayer(ESwuiDocumentLayer Layer) const
{
	TArray<USwuiDocument*> Result;
	for (const auto& Kvp : Documents)
	{
		if (Kvp.Value && Kvp.Value->GetLayer() == Layer)
		{
			Result.Add(Kvp.Value);
		}
	}
	return Result;
}

bool USwuiDocumentManagerSubsystem::HasDocument(FName DocumentId) const
{
	return Documents.Contains(DocumentId);
}

void USwuiDocumentManagerSubsystem::SetState(const FString& Key, const FString& JsonValue)
{
	GlobalStateSnapshot.Add(Key, JsonValue);
	PendingDirtyState.Add(Key, JsonValue);

	OnGlobalStateChanged.Broadcast(Key, JsonValue);
}

void USwuiDocumentManagerSubsystem::FlushStateBatch()
{
	if (PendingDirtyState.IsEmpty())
	{
		return;
	}

	for (auto& Kvp : Documents)
	{
		if (Kvp.Value && (Kvp.Value->GetState() == ESwuiDocumentState::Active || Kvp.Value->GetState() == ESwuiDocumentState::Preloaded))
		{
			Kvp.Value->PushStateBatch(PendingDirtyState);
		}
	}

	// Side-by-side legacy subsystem support
	if (USwuiSubsystem* LegacySub = GetLegacySubsystem())
	{
		TArray<FString> FilteredAssignments;
		for (const auto& Kvp : PendingDirtyState)
		{
			FilteredAssignments.Add(FString::Printf(TEXT("\"%s\":%s"), *Kvp.Key, *Kvp.Value));
		}
		if (!FilteredAssignments.IsEmpty())
		{
			const FString BatchJson = FString::Printf(TEXT("{%s}"), *FString::Join(FilteredAssignments, TEXT(",")));
			const FString Script = FString::Printf(
				TEXT("(function(){")
				TEXT("var s=(window.__SWUI__=window.__SWUI__||{state:{},events:{}});")
				TEXT("var u=%s;")
				TEXT("if(s._batch){s._batch(u);}else{for(var k in u){s.state[k]=u[k];if(s._notify)s._notify(k,u[k]);document.dispatchEvent(new CustomEvent('swui:stateChange',{detail:{key:k,value:u[k]}}));}}")
				TEXT("})()"),
				*BatchJson
			);
			LegacySub->ExecuteJavaScript(Script);
		}
	}

	PendingDirtyState.Empty();
}

void USwuiDocumentManagerSubsystem::DispatchNavigationEventFromJs(USwuiDocument* Document, FGameplayTag EventTag, const FString& PayloadJson)
{
	if (Document)
	{
		Document->OnNavigationEvent.Broadcast(Document, EventTag, PayloadJson);
	}

	OnNavigationEvent.Broadcast(Document, EventTag, PayloadJson);
}

USwuiView* USwuiDocumentManagerSubsystem::GetTopInteractiveViewAt(const FVector2D& ScreenPosition) const
{
	USwuiView* BestView = nullptr;
	int32 HighestZOrder = MIN_int32;

	for (const auto& Kvp : Documents)
	{
		const USwuiDocument* Doc = Kvp.Value;
		if (!Doc || Doc->GetState() != ESwuiDocumentState::Active)
		{
			continue;
		}

		USwuiView* View = Doc->GetView();
		if (!View || !View->IsPointerInputEnabled() || !View->HasBrowserHost())
		{
			continue;
		}

		int32 BrowserX = 0;
		int32 BrowserY = 0;
		if (View->ScreenToBrowserPixel(ScreenPosition, BrowserX, BrowserY))
		{
			if (Doc->GetZOrder() >= HighestZOrder)
			{
				HighestZOrder = Doc->GetZOrder();
				BestView = View;
			}
		}
	}

	return BestView;
}

USwuiView* USwuiDocumentManagerSubsystem::GetFocusedOrTopInteractiveView() const
{
	USwuiView* TopInteractiveView = nullptr;
	int32 HighestZOrder = MIN_int32;

	for (const auto& Kvp : Documents)
	{
		const USwuiDocument* Doc = Kvp.Value;
		if (!Doc || Doc->GetState() != ESwuiDocumentState::Active)
		{
			continue;
		}

		USwuiView* View = Doc->GetView();
		if (!View || !View->HasBrowserHost())
		{
			continue;
		}

		// Prioritize view that currently has text input focus
		if (View->IsTextInputFocused())
		{
			return View;
		}

		if (View->IsPointerInputEnabled() && Doc->GetZOrder() >= HighestZOrder)
		{
			HighestZOrder = Doc->GetZOrder();
			TopInteractiveView = View;
		}
	}

	return TopInteractiveView;
}

void USwuiDocumentManagerSubsystem::SetStateString(const FString& Key, const FString& StringValue)
{
	SetState(Key, FString::Printf(TEXT("\"%s\""), *StringValue.Replace(TEXT("\""), TEXT("\\\""))));
}

void USwuiDocumentManagerSubsystem::SetStateNumber(const FString& Key, float NumberValue)
{
	SetState(Key, FString::SanitizeFloat(NumberValue));
}

void USwuiDocumentManagerSubsystem::SetStateBool(const FString& Key, bool BoolValue)
{
	SetState(Key, BoolValue ? TEXT("true") : TEXT("false"));
}

FString USwuiDocumentManagerSubsystem::GetState(const FString& Key) const
{
	const FString* Found = GlobalStateSnapshot.Find(Key);
	return Found ? *Found : FString();
}

void USwuiDocumentManagerSubsystem::BroadcastEvent(FGameplayTag EventTag, const FString& JsonPayload)
{
	const FString EventName = EventTag.IsValid() ? EventTag.ToString() : TEXT("swui:event");
	const FString DetailStr = JsonPayload.IsEmpty() ? TEXT("{}") : JsonPayload;

	for (auto& Kvp : Documents)
	{
		if (Kvp.Value && Kvp.Value->GetState() == ESwuiDocumentState::Active)
		{
			Kvp.Value->DispatchWebEvent(EventName, DetailStr);
		}
	}

	if (USwuiSubsystem* LegacySub = GetLegacySubsystem())
	{
		const FString Script = FString::Printf(
			TEXT("(function(){")
			TEXT("document.dispatchEvent(new CustomEvent('%s',{detail:%s}));")
			TEXT("})()"),
			*EventName, *DetailStr
		);
		LegacySub->ExecuteJavaScript(Script);
	}
}

USwuiSubsystem* USwuiDocumentManagerSubsystem::GetLegacySubsystem() const
{
	if (UGameInstance* GI = GetGameInstance())
	{
		return GI->GetSubsystem<USwuiSubsystem>();
	}
	return nullptr;
}
