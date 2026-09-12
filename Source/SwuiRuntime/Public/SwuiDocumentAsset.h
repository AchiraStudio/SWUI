#pragma once

#include "CoreMinimal.h"
#include "Engine/DataAsset.h"
#include "SwuiTypes.h"
#include "SwuiDocumentAsset.generated.h"

class UMaterialInterface;

/**
 * USwuiDocumentAsset — SWUI 3.0 Data Asset representing a web document configuration.
 * Configured in Unreal Editor (.swui) and loaded by USwuiDocumentManagerSubsystem or USwui.
 */
UCLASS(BlueprintType, meta=(DisplayName="SWUI UI Document"))
class SWUIRUNTIME_API USwuiDocumentAsset : public UPrimaryDataAsset
{
	GENERATED_BODY()

public:
	USwuiDocumentAsset();

	/** Unique identifier for this UI document (e.g. "MainHUD", "Level01", "Inventory", "PauseMenu"). */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|Document", meta=(DisplayName="Document ID"))
	FName DocumentId;

	/** Entry URL loaded by CEF (e.g. "local://UI/out/hud.html" or "local://UI/dist/main.html"). */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|Document", meta=(DisplayName="Entry URL"))
	FString EntryURL;

	/** Functional layer this document belongs to. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|Document")
	ESwuiDocumentLayer Layer = ESwuiDocumentLayer::Level;

	/** How this document is loaded (Lazy on activation vs Eager preloaded). */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|Document")
	ESwuiDocumentLoadBehavior LoadBehavior = ESwuiDocumentLoadBehavior::Lazy;

	/** Execution & update priority within the SWUI scheduler. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|Document")
	ESwuiUpdatePriority Priority = ESwuiUpdatePriority::Normal;

	/** If true, this document survives level transitions (e.g., persistent HUD, notification overlays). */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|Document")
	bool bIsPersistent = false;

	/** Z-Order when added to the Unreal viewport. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|Viewport", meta=(ClampMin="-1000", ClampMax="1000"))
	int32 DefaultZOrder = 0;

	/** Viewport width in pixels. Default is 1920. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|Viewport")
	int32 Width = 1920;

	/** Viewport height in pixels. Default is 1080. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|Viewport")
	int32 Height = 1080;

	/** Whether the CEF web view background is transparent. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|Viewport")
	bool bIsTransparent = true;

	/** Custom base material for the UI surface. If null, default translucent material is used. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|Viewport")
	TObjectPtr<UMaterialInterface> BaseMaterial = nullptr;

	/** Material parameter name for the CEF texture. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|Viewport")
	FName TextureParameterName = TEXT("SwuiTexture");

	/** Frame rate cadence mode for this document. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|Performance")
	ESwuiFrameRateMode FrameRateMode = ESwuiFrameRateMode::MatchGame;

	/** Custom frame rate cap when using Fixed frame rate mode. 0 = match project default. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|Performance", meta=(EditCondition="FrameRateMode!=ESwuiFrameRateMode::MatchGame"))
	int32 CustomFrameRate = 60;

	/** Allow this document to enter sleep state when inactive to reclaim CPU/GPU budget. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|Performance")
	bool bEnableSleep = true;

	/** Inactivity delay before sleeping in seconds. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|Performance", meta=(EditCondition="bEnableSleep"))
	float InactivitySleepDelay = 2.0f;

	/** Rendering backend mode for this document. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|Performance")
	ESwuiRenderingMode RenderingMode = ESwuiRenderingMode::Auto;

	/** State sync update policy for this document. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|Performance")
	ESwuiStateUpdatePolicy StateUpdatePolicy = ESwuiStateUpdatePolicy::OnChange;

	/** List of state key prefixes/patterns this document subscribes to. Empty means all state keys. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|State")
	TArray<FString> SubscribedStateKeys;

	virtual FPrimaryAssetId GetPrimaryAssetId() const override;

	/** Converts document asset settings to FSwuiInstanceSettings. */
	FSwuiInstanceSettings ToInstanceSettings() const;
};
