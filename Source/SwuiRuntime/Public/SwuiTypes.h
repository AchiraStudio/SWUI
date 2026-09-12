#pragma once

#include "CoreMinimal.h"
#include "GameplayTagContainer.h"
#include "RHI.h"
#include "RHICommandList.h"
#include "TextureResource.h"
#include "Engine/Texture2D.h"
#include "SwuiTypes.generated.h"

// ---------------------------------------------------------------------------
// Rendering mode — selects the SWUI render backend per component instance.
//
//  Auto           – prefers GPU Accelerated on supported Windows/D3D setups,
//                   falls back to CPU Compatible with a log when unavailable.
//  GpuAccelerated – uses CEF OnAcceleratedPaint with shared D3D11 textures.
//                   Zero-copy GPU path for high-refresh HUDs and animated UI.
//  CpuCompatible  – uses the existing CEF OnPaint CPU BGRA bitmap path.
//                   Compatibility fallback; works on all platforms.
// ---------------------------------------------------------------------------
UENUM(BlueprintType)
enum class ESwuiRenderingMode : uint8
{
	Auto            UMETA(DisplayName = "Automatic"),
	GpuAccelerated  UMETA(DisplayName = "GPU Shared Texture"),
	CpuDirtyRegions UMETA(DisplayName = "CPU Dirty Regions"),
	CpuCompatible   UMETA(DisplayName = "CPU Full Surface")
};

UENUM(BlueprintType)
enum class ESwuiFrameRateMode : uint8
{
	MatchGame UMETA(DisplayName = "Match Game"),
	Fixed15   UMETA(DisplayName = "15 Hz"),
	Fixed30   UMETA(DisplayName = "30 Hz"),
	Fixed60   UMETA(DisplayName = "60 Hz"),
	Fixed90   UMETA(DisplayName = "90 Hz"),
	Fixed120  UMETA(DisplayName = "120 Hz"),
	Adaptive  UMETA(DisplayName = "Adaptive")
};

UENUM(BlueprintType)
enum class ESwuiStateUpdatePolicy : uint8
{
	OnChange    UMETA(DisplayName = "On Change"),
	EventDriven UMETA(DisplayName = "Event Driven"),
	Rate15Hz    UMETA(DisplayName = "15 Hz"),
	Rate30Hz    UMETA(DisplayName = "30 Hz"),
	Rate60Hz    UMETA(DisplayName = "60 Hz"),
	Rate120Hz   UMETA(DisplayName = "120 Hz"),
	EveryFrame  UMETA(DisplayName = "Every Game Frame")
};

UENUM(BlueprintType)
enum class ESwuiUpdatePriority : uint8
{
	Critical   UMETA(DisplayName = "Critical"),
	High       UMETA(DisplayName = "High"),
	Normal     UMETA(DisplayName = "Normal"),
	Low        UMETA(DisplayName = "Low"),
	Background UMETA(DisplayName = "Background")
};

UENUM(BlueprintType)
enum class ESwuiSleepState : uint8
{
	Active   UMETA(DisplayName = "Active"),
	Idle     UMETA(DisplayName = "Idle"),
	Sleeping UMETA(DisplayName = "Sleeping")
};

UENUM(BlueprintType)
enum class ESwuiLowLatencyFramePacingMode : uint8
{
	Disabled                  UMETA(DisplayName = "Disabled"),
	WhileInteractiveUiActive  UMETA(DisplayName = "While Interactive UI Active"),
	WhileAnySwuiViewActive    UMETA(DisplayName = "While Any SWUI View Active")
};

UENUM(BlueprintType)
enum class ESwuiUiResolutionPreset : uint8
{
	Performance720p UMETA(DisplayName = "Performance - 1280x720"),
	Balanced900p    UMETA(DisplayName = "Balanced - 1600x900"),
	Quality1080p    UMETA(DisplayName = "Quality - 1920x1080"),
	High1440p       UMETA(DisplayName = "High - 2560x1440"),
	NativeViewport  UMETA(DisplayName = "Native Viewport"),
	Custom          UMETA(DisplayName = "Custom")
};

// ---------------------------------------------------------------------------
// SWUI 3.0 Document Lifecycle & Architecture Enums
// ---------------------------------------------------------------------------

UENUM(BlueprintType)
enum class ESwuiDocumentState : uint8
{
	Unloaded    UMETA(DisplayName = "Unloaded"),
	Loading     UMETA(DisplayName = "Loading"),
	Preloaded   UMETA(DisplayName = "Preloaded"),
	Active      UMETA(DisplayName = "Active"),
	Sleeping    UMETA(DisplayName = "Sleeping"),
	Unloading   UMETA(DisplayName = "Unloading")
};

UENUM(BlueprintType)
enum class ESwuiDocumentLayer : uint8
{
	Persistent  UMETA(DisplayName = "Persistent (HUD/Overlay)"),
	Level       UMETA(DisplayName = "Level (Contextual)"),
	Modal       UMETA(DisplayName = "Modal (Menu/Popup)")
};

UENUM(BlueprintType)
enum class ESwuiDocumentLoadBehavior : uint8
{
	Lazy        UMETA(DisplayName = "Lazy"),
	Eager       UMETA(DisplayName = "Eager")
};

// ---------------------------------------------------------------------------
// Navigation enums — used by USwuiNavigation for menu/input routing.
// ---------------------------------------------------------------------------

UENUM(BlueprintType)
enum class ESwuiNavDirection : uint8
{
	Up       UMETA(DisplayName = "Up"),
	Down     UMETA(DisplayName = "Down"),
	Left     UMETA(DisplayName = "Left"),
	Right    UMETA(DisplayName = "Right"),
	Next     UMETA(DisplayName = "Next"),
	Previous UMETA(DisplayName = "Previous")
};

UENUM(BlueprintType)
enum class ESwuiPointerButton : uint8
{
	Left   UMETA(DisplayName = "Left"),
	Right  UMETA(DisplayName = "Right"),
	Middle UMETA(DisplayName = "Middle")
};

UENUM(BlueprintType)
enum class ESwuiInputMode : uint8
{
	HudOnly   UMETA(DisplayName = "HUD Only"),
	UiOnly    UMETA(DisplayName = "UI Only"),
	GameAndUi UMETA(DisplayName = "Game and UI")
};

// ---------------------------------------------------------------------------
// Navigation event — Gameplay Tag based, configurable per-event routing.
// ---------------------------------------------------------------------------

USTRUCT(BlueprintType)
struct FSwuiNavigationEvent
{
	GENERATED_BODY()

	/** Navigation event tag used by Unreal, Blueprint, and JS. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SWUI|Navigation",
		meta=(ToolTip="Navigation event tag used by Unreal, Blueprint, and JS."))
	FGameplayTag Event;

	/** JS event name. Defaults to the navigation tag name, e.g. swui.menu.open. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SWUI|Navigation",
		meta=(DisplayName="JS Event Name", ToolTip="JS event name. Defaults to the navigation tag name."))
	FString JsEventName;

	/** Forward this event to the SWUI web view. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SWUI|Navigation",
		meta=(DisplayName="Forward to JS", ToolTip="Forward this navigation event to the SWUI web view."))
	bool bForwardToJS = true;

	/** Optional UScriptStruct defining the payload schema for this navigation event.
	 *  If set, the TS generator emits a typed payload interface, typed emit helper,
	 *  and typed listener helper for this tag. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SWUI|Navigation",
		meta=(DisplayName="Payload Struct", ToolTip="Optional UScriptStruct that defines the JSON payload shape for this navigation event. Used for generated TS types."))
	TSoftObjectPtr<UScriptStruct> PayloadStruct;

	/** Trigger Blueprint callbacks for this event. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SWUI|Navigation",
		meta=(ToolTip="Trigger Blueprint callbacks for this navigation event."))
	bool bBlueprintCallback = true;

	/** Returns the effective JS event name — the configured JsEventName, or the tag string. */
	FString GetEffectiveJsEventName() const
	{
		return JsEventName.IsEmpty()
			? (Event.IsValid() ? Event.ToString() : FString())
			: JsEventName;
	}
};

// ---------------------------------------------------------------------------
// Function-backed navigation command — runtime registry, TS generation, dispatch.
// ---------------------------------------------------------------------------

/** A function-backed SWUI navigation command.
 *  Resolved from UFUNCTION(meta=(SwuiCommand="swui.rooms.host")).
 *  Runtime calls ProcessEvent on the resolved binding target with deserialized JSON. */
struct FSwuiFunctionCommand
{
	FGameplayTag Tag;
	UClass*      OwnerClass = nullptr;
	UFunction*   Function = nullptr;

	bool IsValid() const { return Tag.IsValid() && OwnerClass != nullptr && Function != nullptr; }
};

/** Default payload for navigation events that carry no data.
 *  Used implicitly by K2Node_SwuiNavigationEvent when no PayloadStruct is set. */
USTRUCT(BlueprintType)
struct FSwuiEmptyPayload
{
	GENERATED_BODY()
};

UENUM(BlueprintType)
enum class ESwuiHudRoiMode : uint8
{
	UniformEdges    UMETA(DisplayName = "Uniform Edges"),
	IndividualEdges UMETA(DisplayName = "Individual Edges")
};

USTRUCT(BlueprintType)
struct FSwuiHudRoiSettings
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SWUI|HUD ROI")
	bool bEnabled = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SWUI|HUD ROI")
	ESwuiHudRoiMode Mode = ESwuiHudRoiMode::UniformEdges;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SWUI|HUD ROI",
		meta=(EditCondition="Mode==ESwuiHudRoiMode::UniformEdges", ClampMin="1", ClampMax="100"))
	int32 UniformEdgePercent = 25;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SWUI|HUD ROI",
		meta=(EditCondition="Mode==ESwuiHudRoiMode::IndividualEdges", ClampMin="1", ClampMax="100"))
	int32 TopPercent = 10;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SWUI|HUD ROI",
		meta=(EditCondition="Mode==ESwuiHudRoiMode::IndividualEdges", ClampMin="1", ClampMax="100"))
	int32 BottomPercent = 10;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SWUI|HUD ROI",
		meta=(EditCondition="Mode==ESwuiHudRoiMode::IndividualEdges", ClampMin="1", ClampMax="100"))
	int32 LeftPercent = 5;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SWUI|HUD ROI",
		meta=(EditCondition="Mode==ESwuiHudRoiMode::IndividualEdges", ClampMin="1", ClampMax="100"))
	int32 RightPercent = 5;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SWUI|HUD ROI")
	bool bCenterRoiEnabled = true;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SWUI|HUD ROI", meta=(ClampMin="0", ClampMax="100"))
	int32 CenterRoiPercent = 3;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SWUI|HUD ROI|Debug")
	bool bShowOverlay = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SWUI|HUD ROI|Debug")
	bool bShadeInactiveArea = true;
};

// Per-instance rendering overrides forwarded from USwui → InitRenderer → USwuiView::Init().
// A value of 0 / 0.f means "use the project-wide USwuiSettings default".
struct FSwuiInstanceSettings
{
	// Rendering backend selection (Auto / GPU Accelerated / CPU Compatible).
	ESwuiRenderingMode RenderingMode = ESwuiRenderingMode::Auto;

	bool  bIsHUD                          = false;
	bool  bUseUEFrameLockedBrowser        = false;
	bool  bUseExternalBeginFrames         = false;
	bool  bSendExternalBeginFrameFromTick = true;
	bool  bFlushHudStateBeforeBrowserFrame = true;
	int32 MaxBrowserFramesPerSecond       = 60;

	// UI Frame Scheduler & Sleep/Wake settings
	ESwuiFrameRateMode FrameRateMode = ESwuiFrameRateMode::MatchGame;
	bool  bEnableSleep               = true;
	float InactivitySleepDelay       = 2.0f;
	ESwuiStateUpdatePolicy StateUpdatePolicy = ESwuiStateUpdatePolicy::OnChange;

	int32 OverrideFrameRate        = 0;    // 0 = use project setting / engine MaxFPS
	float OverrideBandOvercopyRatio = 0.f; // 0 = use project setting (1.25)
	int32 OverrideMaxPerRectUploads = 0;   // 0 = use project setting (32)
	bool  bVerbosePaintLog          = false;
	bool  bNoTextureUpload          = false;

	// Stage-level isolation flags (all false = normal operation)
	bool  bSkipOnPaintProcessing    = false; // return at top of OnPaint after counting
	bool  bSkipDirtyRectStrategy    = false; // skip rect validation + strategy, no upload
	bool  bSkipPaintMemcpy          = false; // skip pixel copy into upload buffers
	bool  bSkipTextureUpload        = false; // skip RHIUpdateTexture2D enqueue (alias for bNoTextureUpload)
	bool  bFreezeTexture            = false; // keep last texture, skip new uploads
	bool  bPauseBrowserUpdates      = false; // skip JS state push and runtime tick dispatch
	bool  bHideDrawComponent        = false; // hide the UE widget/material draw surface
	bool  bShowDirtyRectOverlay     = false; // push dirty rects + stats to __SWUI_DEBUG_RECTS__ at ~10 Hz
	bool  bDebugForceFullFrameUploadEveryFrame = false; // bypass all optimisations, upload full texture every frame

	// HUD ROI settings for partial-surface rendering.
	FSwuiHudRoiSettings HudRoiSettings;

	// UI resolution preset — internal render size before HUD scaling.
	ESwuiUiResolutionPreset UiResolutionPreset = ESwuiUiResolutionPreset::Quality1080p;
	int32 CustomUiWidth  = 1920;
	int32 CustomUiHeight = 1080;

	// Focused hybrid upload-path tuning
	bool  bEnableHybridDirtyUpload             = true;
	bool  bEnableTileDiffForLargeRects         = true;
	bool  bEnableUploadBudget                  = true;
	int32 TileWidth                            = 128;
	int32 TileHeight                           = 64;
	int32 MinDirtyRectWidth                    = 32;
	int32 MinDirtyRectHeight                   = 32;
	int32 CenterCriticalWidth                  = 64;
	int32 CenterCriticalHeight                 = 64;
	bool  bAlwaysProcessCenterCriticalRect     = true;
	int32 MaxNormalUploadBytesPerFrame         = 2 * 1024 * 1024;
	float MaxMergeWasteRatio                   = 1.15f;
	int32 MaxMergedRectWidth                   = 512;
	int32 MaxMergedRectHeight                  = 256;
	int32 MaxMergedRectArea                    = 256 * 1024;
	bool  bForceFullBaselineUploadOnFirstPaint = true;
	bool  bUseRotatingDeferredTileCursor       = true;
	bool  bLogSwuiPaintStats                   = true;
	bool  bShowSwuiDirtyRects                  = false;
};

// Descriptor for one dirty rect within a shared packed pixel buffer.
// SrcX/SrcY in Region are always 0 — data starts at SrcOffsetBytes in the shared buffer.
struct FSwuiPackedRectDesc
{
	FUpdateTextureRegion2D Region;    // DestX/DestY = texture destination; SrcX=SrcY=0
	uint32 SrcPitch       = 0;        // tight row stride = Width * 4
	int32  SrcOffsetBytes = 0;        // byte offset into FSwuiPaintUploadData::PackedPixels
};

// Single-allocation upload payload for the per-rect path.
// All rects are packed sequentially into one PackedPixels buffer — no per-rect heap alloc.
struct FSwuiPaintUploadData
{
	FTextureResource*           Texture2DResource = nullptr;
	TArray<uint8>               PackedPixels;  // all rect data end-to-end
	TArray<FSwuiPackedRectDesc> Rects;
};

// ---------------------------------------------------------------------------
// HUD ROI overlay state — consumed by the debug overlay widget each frame.
// Contains the same rects used by the renderer, plus display info.
// ---------------------------------------------------------------------------
USTRUCT(BlueprintType)
struct FSwuiHudRoiOverlayState
{
	GENERATED_BODY()

	UPROPERTY(BlueprintReadOnly, Category = "SWUI|HUD ROI|Debug")
	bool bVisible = false;

	UPROPERTY(BlueprintReadOnly, Category = "SWUI|HUD ROI|Debug")
	bool bHudRoiModeActive = false;

	/** All outer ROI rects (1 for manual, 4 edge bands for percentage frame). */
	UPROPERTY(BlueprintReadOnly, Category = "SWUI|HUD ROI|Debug")
	TArray<FIntRect> OuterRoiRects;

	/** Center ROI rect (0 or 1). */
	UPROPERTY(BlueprintReadOnly, Category = "SWUI|HUD ROI|Debug")
	TArray<FIntRect> CenterRoiRects;

	/** Combined active rects — same list the renderer uploads. */
	UPROPERTY(BlueprintReadOnly, Category = "SWUI|HUD ROI|Debug")
	TArray<FIntRect> ActiveRoiRects;

	/** Union area of all active rects as percentage of total texture area. */
	UPROPERTY(BlueprintReadOnly, Category = "SWUI|HUD ROI|Debug")
	float RoiAreaPercent = 0.0f;

	UPROPERTY(BlueprintReadOnly, Category = "SWUI|HUD ROI|Debug")
	FString ModeLabel;
};

class ISwuiRenderTarget
{
public:
	virtual ~ISwuiRenderTarget() = default;
	virtual void OnPaint(const void* Buffer, FUpdateTextureRegion2D* Regions, int32 RegionCount, int32 Width, int32 Height) = 0;
	virtual UTexture2D* GetOrCreateTexture(int32 Width, int32 Height) = 0;
};

// ---------------------------------------------------------------------------
// Accelerated paint target interface — implemented by USwuiView when the
// GPU Accelerated backend is active.
//
// Thread: OnAcceleratedPaint is called on the CEF renderer thread.
// The shared texture handle (a D3D11 HANDLE on Windows) is only valid for
// the duration of the call — the callee must open/copy the resource before
// returning.
// ---------------------------------------------------------------------------
class ISwuiAcceleratedRenderTarget
{
public:
	virtual ~ISwuiAcceleratedRenderTarget() = default;
	virtual void OnAcceleratedPaint(void* SharedHandle, int32 Width, int32 Height) = 0;
};

// ---------------------------------------------------------------------------
// Timeline Synchronization (SWUI 1.5 Phase 2)
// ---------------------------------------------------------------------------

UENUM(BlueprintType)
enum class ESwuiTimelineState : uint8
{
	Idle,
	Running,
	Completed,
	Cancelled
};

USTRUCT(BlueprintType)
struct FSwuiTimeline
{
	GENERATED_BODY()

	UPROPERTY(BlueprintReadOnly, Category = "SimpleWebUI|Timeline")
	FName Id = NAME_None;

	UPROPERTY(BlueprintReadOnly, Category = "SimpleWebUI|Timeline")
	int64 Generation = 0;

	UPROPERTY(BlueprintReadOnly, Category = "SimpleWebUI|Timeline")
	float Duration = 0.f;

	UPROPERTY(BlueprintReadOnly, Category = "SimpleWebUI|Timeline")
	bool bReversed = false;

	UPROPERTY(BlueprintReadOnly, Category = "SimpleWebUI|Timeline")
	ESwuiTimelineState State = ESwuiTimelineState::Idle;

	UPROPERTY(BlueprintReadOnly, Category = "SimpleWebUI|Timeline")
	float StartGameTime = 0.f;

	UPROPERTY(BlueprintReadOnly, Category = "SimpleWebUI|Timeline")
	float CompleteGameTime = 0.f;

	UPROPERTY(BlueprintReadOnly, Category = "SimpleWebUI|Timeline")
	float CancelGameTime = 0.f;

	UPROPERTY(BlueprintReadOnly, Category = "SimpleWebUI|Timeline")
	float CancelProgress = 0.f;
};

// ---------------------------------------------------------------------------
// Telemetry & Diagnostics (SWUI 1.5 Phase 0)
// ---------------------------------------------------------------------------

struct FSwuiRollingStat
{
	static constexpr int32 Capacity = 60;
	float Samples[Capacity] = { 0.f };
	int32 Count = 0;
	int32 Index = 0;
	float Min = 0.f;
	float Max = 0.f;
	float Avg = 0.f;

	void Add(float Value)
	{
		Samples[Index] = Value;
		Index = (Index + 1) % Capacity;
		if (Count < Capacity)
		{
			++Count;
		}

		Min = Samples[0];
		Max = Samples[0];
		float Sum = 0.f;
		for (int32 i = 0; i < Count; ++i)
		{
			Min = FMath::Min(Min, Samples[i]);
			Max = FMath::Max(Max, Samples[i]);
			Sum += Samples[i];
		}
		Avg = Count > 0 ? (Sum / Count) : 0.f;
	}

	void Reset()
	{
		Count = 0;
		Index = 0;
		Min = 0.f;
		Max = 0.f;
		Avg = 0.f;
	}
};

struct FSwuiTelemetry
{
	// Core Counters (Section 6.1)
	uint32 ObservedPropertiesNum = 0;
	uint32 ChangedPropertiesNum = 0;
	uint64 StateGeneration = 0;       // Incremented on discrete state flushes
	uint64 FrameIndex = 0;            // Heartbeat/frame index
	uint32 BeginFrameRequests = 0;
	uint32 BeginFrameSkips = 0;
	uint32 CefPaints = 0;
	uint32 PresentedFrames = 0;
	uint32 DroppedFrames = 0;
	uint32 InputEventsReceived = 0;
	uint32 InputEventsCoalesced = 0;

	// Frame Timing & Latency (Section 6.2)
	double LastStateFlushDurationMs = 0.0;
	double LastBeginFrameRequestTime = 0.0;
	double LastCefPaintTime = 0.0;
	double LastUploadDurationMs = 0.0;
	double LastPaintToPresentLatencyMs = 0.0;

	// Rolling stats (ms)
	FSwuiRollingStat StateFlushDuration;
	FSwuiRollingStat PaintToPresentLatency;
	FSwuiRollingStat UploadDuration;

	// Timeline Specific Telemetry (Section 6.3)
	FName  ActiveTimelineId = NAME_None;
	uint64 TimelineGeneration = 0;
	double TimelineStartGameTime = 0.0;
	double TimelineDuration = 0.0;
	double TimelineCompleteGameTime = 0.0;
	double TimelineCancelGameTime = 0.0;
	float  LastAuthoritativeProgress = 0.f;
	float  LastPresentedProgress = 0.f;
	float  TimelinePresentationError = 0.f;
	FSwuiRollingStat TimelineError;
	double CompletionPresentationDelayMs = 0.0;

	// Periodic reporting
	double LastLogStatsTime = 0.0;
};

