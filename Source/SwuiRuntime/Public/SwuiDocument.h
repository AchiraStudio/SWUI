#pragma once

#include "CoreMinimal.h"
#include "UObject/Object.h"
#include "SwuiTypes.h"
#include "GameplayTagContainer.h"
#include "SwuiDocument.generated.h"

class USwuiView;
class UUserWidget;
class USwuiDocumentAsset;
class UWorld;
class AActor;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnSwuiDocumentStateChanged, class USwuiDocument*, Document, ESwuiDocumentState, NewState);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSwuiDocumentLoaded, class USwuiDocument*, Document);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnSwuiDocumentNavigationEvent, class USwuiDocument*, Document, FGameplayTag, EventTag, const FString&, PayloadJson);

/**
 * USwuiDocument — SWUI 3.0 runtime representation of an active or managed web document.
 * Wraps a USwuiView (CEF browser), an optional viewport UUserWidget, and lifecycle state management.
 */
UCLASS(BlueprintType)
class SWUIRUNTIME_API USwuiDocument : public UObject
{
	GENERATED_BODY()

public:
	USwuiDocument();

	/** Initializes this document instance from a document data asset. */
	UFUNCTION(BlueprintCallable, Category="SWUI|Document")
	void InitializeFromAsset(USwuiDocumentAsset* InAsset);

	/** Initializes this document instance manually with explicit properties. */
	UFUNCTION(BlueprintCallable, Category="SWUI|Document")
	void InitializeManual(FName InDocumentId, const FString& InEntryURL, ESwuiDocumentLayer InLayer = ESwuiDocumentLayer::Level, int32 InWidth = 1920, int32 InHeight = 1080);

	/** Loads the document and initializes the underlying CEF browser view. Transitions state to Preloaded. */
	UFUNCTION(BlueprintCallable, Category="SWUI|Document")
	bool Load(UWorld* InWorld = nullptr);

	/** Preloads the document in the background without rendering it to the viewport. */
	UFUNCTION(BlueprintCallable, Category="SWUI|Document")
	bool Preload(UWorld* InWorld = nullptr);

	/** Mounts the document to the Unreal viewport and sets its state to Active. */
	UFUNCTION(BlueprintCallable, Category="SWUI|Document")
	bool Activate(int32 OverrideZOrder = -1);

	/** Removes the document from the viewport while keeping the browser in memory. Transitions to Preloaded or Sleeping. */
	UFUNCTION(BlueprintCallable, Category="SWUI|Document")
	bool Deactivate();

	/** Freezes CEF execution to reclaim CPU/GPU budget. Transitions state to Sleeping. */
	UFUNCTION(BlueprintCallable, Category="SWUI|Document")
	void Sleep();

	/** Restores execution and wakes the scheduler. Transitions state to Active. */
	UFUNCTION(BlueprintCallable, Category="SWUI|Document")
	void Wake();

	/** Unloads and destroys the CEF browser view and viewport widget. Transitions state to Unloaded. */
	UFUNCTION(BlueprintCallable, Category="SWUI|Document")
	void Unload();

	/** Executes arbitrary JavaScript inside this document's CEF browser. */
	UFUNCTION(BlueprintCallable, Category="SWUI|Document")
	void ExecuteJavaScript(const FString& Script);

	/** Pushes a single key-value state update to this document if it is subscribed to the key. */
	UFUNCTION(BlueprintCallable, Category="SWUI|Document")
	void PushState(const FString& Key, const FString& JsonValue);

	/** Pushes a batched map of state updates to this document. */
	void PushStateBatch(const TMap<FString, FString>& StateBatch);

	/** Broadcasts a custom DOM event with a JSON detail payload. */
	UFUNCTION(BlueprintCallable, Category="SWUI|Document")
	void DispatchWebEvent(const FString& EventName, const FString& JsonDetail);

	/** Checks if this document subscribes to the specified state key. */
	UFUNCTION(BlueprintPure, Category="SWUI|Document")
	bool IsSubscribedToKey(const FString& Key) const;

	// Accessors
	UFUNCTION(BlueprintPure, Category="SWUI|Document")
	FName GetDocumentId() const { return DocumentId; }

	UFUNCTION(BlueprintPure, Category="SWUI|Document")
	ESwuiDocumentState GetState() const { return State; }

	UFUNCTION(BlueprintPure, Category="SWUI|Document")
	ESwuiDocumentLayer GetLayer() const { return Layer; }

	UFUNCTION(BlueprintPure, Category="SWUI|Document")
	bool IsPersistent() const { return bIsPersistent; }

	UFUNCTION(BlueprintPure, Category="SWUI|Document")
	USwuiView* GetView() const { return View; }

	UFUNCTION(BlueprintPure, Category="SWUI|Document")
	UUserWidget* GetWidget() const { return Widget; }

	UFUNCTION(BlueprintPure, Category="SWUI|Document")
	USwuiDocumentAsset* GetAsset() const { return Asset; }

	UFUNCTION(BlueprintPure, Category="SWUI|Document")
	int32 GetZOrder() const { return ZOrder; }

	UFUNCTION(BlueprintCallable, Category="SWUI|Document")
	void SetZOrder(int32 InZOrder);

	UFUNCTION(BlueprintCallable, Category="SWUI|Document")
	void SetOwningActor(AActor* InActor);

	// Delegates
	UPROPERTY(BlueprintAssignable, Category="SWUI|Document")
	FOnSwuiDocumentStateChanged OnStateChanged;

	UPROPERTY(BlueprintAssignable, Category="SWUI|Document")
	FOnSwuiDocumentLoaded OnLoaded;

	UPROPERTY(BlueprintAssignable, Category="SWUI|Document")
	FOnSwuiDocumentNavigationEvent OnNavigationEvent;

protected:
	void SetState(ESwuiDocumentState NewState);
	void CreateWidgetSurface(UWorld* InWorld);

private:
	UPROPERTY()
	FName DocumentId;

	UPROPERTY()
	TObjectPtr<USwuiDocumentAsset> Asset = nullptr;

	UPROPERTY()
	ESwuiDocumentState State = ESwuiDocumentState::Unloaded;

	UPROPERTY()
	ESwuiDocumentLayer Layer = ESwuiDocumentLayer::Level;

	UPROPERTY()
	ESwuiDocumentLoadBehavior LoadBehavior = ESwuiDocumentLoadBehavior::Lazy;

	UPROPERTY()
	ESwuiUpdatePriority Priority = ESwuiUpdatePriority::Normal;

	UPROPERTY()
	bool bIsPersistent = false;

	UPROPERTY()
	FString EntryURL;

	UPROPERTY()
	int32 Width = 1920;

	UPROPERTY()
	int32 Height = 1080;

	UPROPERTY()
	int32 ZOrder = 0;

	UPROPERTY()
	bool bIsTransparent = true;

	UPROPERTY()
	TArray<FString> SubscribedKeys;

	FSwuiInstanceSettings InstanceSettings;

	UPROPERTY()
	TObjectPtr<USwuiView> View = nullptr;

	UPROPERTY()
	TObjectPtr<UUserWidget> Widget = nullptr;

	TWeakObjectPtr<AActor> OwningActor;

	TWeakObjectPtr<UWorld> CachedWorld;
};
