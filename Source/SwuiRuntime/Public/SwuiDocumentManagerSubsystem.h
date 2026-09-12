#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Tickable.h"
#include "GameplayTagContainer.h"
#include "SwuiTypes.h"
#include "SwuiDocument.h"
#include "SwuiDocumentAsset.h"
#include "SwuiDocumentManagerSubsystem.generated.h"

class USwuiSubsystem;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSwuiDocumentRegistered, USwuiDocument*, Document);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSwuiDocumentUnregistered, FName, DocumentId);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnSwuiStateChangedNotification, const FString&, Key, const FString&, JsonValue);

/**
 * USwuiDocumentManagerSubsystem — Central coordinator for SWUI 3.0 Multi-Document UI.
 * Manages document registration, lifecycle (Load/Preload/Activate/Sleep/Wake/Unload),
 * level persistence, and the centralized state bus with cross-document and legacy subsystem routing.
 */
UCLASS()
class SWUIRUNTIME_API USwuiDocumentManagerSubsystem : public UGameInstanceSubsystem, public FTickableGameObject
{
	GENERATED_BODY()

public:
	// UGameInstanceSubsystem
	virtual bool ShouldCreateSubsystem(UObject* Outer) const override;
	virtual void Initialize(FSubsystemCollectionBase& Collection) override;
	virtual void Deinitialize() override;

	// FTickableGameObject
	virtual void Tick(float DeltaTime) override;
	virtual bool IsTickable() const override { return !IsTemplate(); }
	virtual TStatId GetStatId() const override { RETURN_QUICK_DECLARE_CYCLE_STAT(USwuiDocumentManagerSubsystem, STATGROUP_Tickables); }

	// ---- Document Registration & Lifecycle ----

	/** Registers and pre-configures a document from a USwuiDocumentAsset. */
	UFUNCTION(BlueprintCallable, Category="SWUI|DocumentManager")
	USwuiDocument* RegisterDocumentAsset(USwuiDocumentAsset* Asset);

	/** Registers a document manually. */
	UFUNCTION(BlueprintCallable, Category="SWUI|DocumentManager")
	USwuiDocument* RegisterDocumentManual(FName DocumentId, const FString& EntryURL, ESwuiDocumentLayer Layer = ESwuiDocumentLayer::Level, int32 Width = 1920, int32 Height = 1080);

	/** Loads the document into memory with CEF browser initialized (Preloaded state). */
	UFUNCTION(BlueprintCallable, Category="SWUI|DocumentManager")
	USwuiDocument* LoadDocument(FName DocumentId);

	/** Loads or retrieves a document directly from an asset. */
	UFUNCTION(BlueprintCallable, Category="SWUI|DocumentManager")
	USwuiDocument* LoadDocumentAsset(USwuiDocumentAsset* Asset);

	/** Preloads a document in the background without showing it on screen. */
	UFUNCTION(BlueprintCallable, Category="SWUI|DocumentManager")
	bool PreloadDocument(FName DocumentId);

	/** Activates a document, adding its widget to the viewport. */
	UFUNCTION(BlueprintCallable, Category="SWUI|DocumentManager")
	bool ActivateDocument(FName DocumentId, int32 OverrideZOrder = -1);

	/** Deactivates a document, removing its widget from the viewport while keeping it in memory. */
	UFUNCTION(BlueprintCallable, Category="SWUI|DocumentManager")
	bool DeactivateDocument(FName DocumentId);

	/** Puts a document to sleep, freezing CEF ticking to reclaim CPU/GPU resources. */
	UFUNCTION(BlueprintCallable, Category="SWUI|DocumentManager")
	void SleepDocument(FName DocumentId);

	/** Wakes a sleeping document. */
	UFUNCTION(BlueprintCallable, Category="SWUI|DocumentManager")
	void WakeDocument(FName DocumentId);

	/** Unloads and destroys a document and its CEF instance. */
	UFUNCTION(BlueprintCallable, Category="SWUI|DocumentManager")
	void UnloadDocument(FName DocumentId);

	/** Unloads all non-persistent documents (Level and Modal layers). Called automatically on level transition. */
	UFUNCTION(BlueprintCallable, Category="SWUI|DocumentManager")
	void UnloadNonPersistentDocuments();

	// ---- Query & Inspection ----

	UFUNCTION(BlueprintPure, Category="SWUI|DocumentManager")
	USwuiDocument* GetDocument(FName DocumentId) const;

	UFUNCTION(BlueprintPure, Category="SWUI|DocumentManager")
	TArray<USwuiDocument*> GetAllDocuments() const;

	UFUNCTION(BlueprintPure, Category="SWUI|DocumentManager")
	TArray<USwuiDocument*> GetDocumentsByLayer(ESwuiDocumentLayer Layer) const;

	UFUNCTION(BlueprintPure, Category="SWUI|DocumentManager")
	bool HasDocument(FName DocumentId) const;

	// ---- Central State Bus ----

	/**
	 * Sets a state value on the global state bus.
	 * Automatically routes to all registered documents subscribed to this key,
	 * as well as the legacy USwuiSubsystem for backward compatibility.
	 */
	UFUNCTION(BlueprintCallable, Category="SWUI|StateBus")
	void SetState(const FString& Key, const FString& JsonValue);

	/** Sets a string state value (convenience helper that wraps in quotes). */
	UFUNCTION(BlueprintCallable, Category="SWUI|StateBus")
	void SetStateString(const FString& Key, const FString& StringValue);

	/** Sets a number state value. */
	UFUNCTION(BlueprintCallable, Category="SWUI|StateBus")
	void SetStateNumber(const FString& Key, float NumberValue);

	/** Sets a boolean state value. */
	UFUNCTION(BlueprintCallable, Category="SWUI|StateBus")
	void SetStateBool(const FString& Key, bool BoolValue);

	/** Gets a state value currently recorded in the global state bus snapshot. */
	UFUNCTION(BlueprintPure, Category="SWUI|StateBus")
	FString GetState(const FString& Key) const;

	/** Gets all current state key-values in the snapshot. */
	UFUNCTION(BlueprintPure, Category="SWUI|StateBus")
	TMap<FString, FString> GetStateSnapshot() const { return GlobalStateSnapshot; }

	/** Broadcasts a GameplayTag-based event to all active documents. */
	UFUNCTION(BlueprintCallable, Category="SWUI|StateBus")
	void BroadcastEvent(FGameplayTag EventTag, const FString& JsonPayload);

	// ---- Backward Compatibility / Legacy Subsystem Access ----

	/** Retrieves the legacy USwuiSubsystem instance. */
	UFUNCTION(BlueprintPure, Category="SWUI|Compat")
	USwuiSubsystem* GetLegacySubsystem() const;

	// ---- Delegates ----

	UPROPERTY(BlueprintAssignable, Category="SWUI|DocumentManager")
	FOnSwuiDocumentRegistered OnDocumentRegistered;

	UPROPERTY(BlueprintAssignable, Category="SWUI|DocumentManager")
	FOnSwuiDocumentUnregistered OnDocumentUnregistered;

	UPROPERTY(BlueprintAssignable, Category="SWUI|DocumentManager")
	FOnSwuiStateChangedNotification OnGlobalStateChanged;

protected:
	void OnWorldPreFinishDestroy(UWorld* World);

private:
	UPROPERTY()
	TMap<FName, TObjectPtr<USwuiDocument>> Documents;

	TMap<FString, FString> GlobalStateSnapshot;

	FDelegateHandle WorldDestroyDelegateHandle;
};
