#include "SwuiProfiler.h"
#include "SwuiCVars.h"
#include "ISwuiRuntime.h"
#include "Engine/Engine.h"
#include "Engine/GameViewportClient.h"
#include "Widgets/SCompoundWidget.h"
#include "Widgets/DeclarativeSyntaxSupport.h"
#include "Widgets/SBoxPanel.h"
#include "Widgets/Layout/SBorder.h"
#include "Widgets/Layout/SBox.h"
#include "Widgets/Text/STextBlock.h"
#include "Styling/CoreStyle.h"
#include "Misc/FileHelper.h"
#include "Misc/Paths.h"
#include "HAL/FileManager.h"
#include "HAL/IConsoleManager.h"
#include "RHI.h"


void FSwuiScopeStat::AddSample(float ValueMs)
{
	Current = ValueMs;
	Samples[Index] = ValueMs;
	Index = (Index + 1) % Capacity;
	if (Count < Capacity)
	{
		++Count;
	}
}

void FSwuiScopeStat::RecomputeStats()
{
	if (Count <= 0)
	{
		Min = Max = Avg = P50 = P95 = P99 = 0.f;
		return;
	}

	float Sorted[Capacity];
	FMemory::Memcpy(Sorted, Samples, sizeof(float) * Count);
	// Insertion sort for small array
	for (int32 i = 1; i < Count; ++i)
	{
		float Key = Sorted[i];
		int32 j = i - 1;
		while (j >= 0 && Sorted[j] > Key)
		{
			Sorted[j + 1] = Sorted[j];
			--j;
		}
		Sorted[j + 1] = Key;
	}

	Min = Sorted[0];
	Max = Sorted[Count - 1];

	float Sum = 0.f;
	for (int32 i = 0; i < Count; ++i)
	{
		Sum += Sorted[i];
	}
	Avg = Sum / static_cast<float>(Count);

	const auto GetPercentile = [&](float Pct) -> float
	{
		float Rank = Pct * (Count - 1);
		int32 Low = FMath::FloorToInt(Rank);
		int32 High = FMath::CeilToInt(Rank);
		float Weight = Rank - Low;
		return FMath::Lerp(Sorted[Low], Sorted[High], Weight);
	};

	P50 = GetPercentile(0.50f);
	P95 = GetPercentile(0.95f);
	P99 = GetPercentile(0.99f);
}

// ---------------------------------------------------------------------------
// Slate Profiler Overlay Widget
// ---------------------------------------------------------------------------

class SSwuiProfilerOverlay : public SCompoundWidget
{
public:
	SLATE_BEGIN_ARGS(SSwuiProfilerOverlay) {}
	SLATE_END_ARGS()

	void Construct(const FArguments& InArgs)
	{
		const FSlateFontInfo MonospaceFont = FCoreStyle::GetDefaultFontStyle("Mono", 9);
		const FSlateFontInfo HeaderFont = FCoreStyle::GetDefaultFontStyle("Bold", 10);
		const FSlateFontInfo SmallFont = FCoreStyle::GetDefaultFontStyle("Regular", 8);

		ChildSlot
		.HAlign(HAlign_Right)
		.VAlign(VAlign_Top)
		.Padding(FMargin(0.f, 20.f, 20.f, 0.f))
		[
			SNew(SBox)
			.WidthOverride(420.f)
			[
				SNew(SBorder)
				.BorderBackgroundColor(FLinearColor(0.04f, 0.05f, 0.07f, 0.88f))
				.Padding(FMargin(14.f, 10.f))
				[
					SNew(SVerticalBox)

					// Header
					+ SVerticalBox::Slot()
					.AutoHeight()
					.Padding(0.f, 0.f, 0.f, 6.f)
					[
						SNew(SHorizontalBox)
						+ SHorizontalBox::Slot()
						.FillWidth(1.f)
						[
							SNew(STextBlock)
							.Text(FText::FromString(TEXT("SWUI RUNTIME PROFILER")))
							.Font(HeaderFont)
							.ColorAndOpacity(FLinearColor(0.25f, 0.75f, 1.0f, 1.0f))
						]
						+ SHorizontalBox::Slot()
						.AutoWidth()
						[
							SNew(STextBlock)
							.Text(this, &SSwuiProfilerOverlay::GetBackendText)
							.Font(SmallFont)
							.ColorAndOpacity(FLinearColor(0.6f, 0.85f, 0.6f, 0.9f))
						]
					]

					// FPS & Cadence Row
					+ SVerticalBox::Slot()
					.AutoHeight()
					.Padding(0.f, 2.f)
					[
						SNew(STextBlock)
						.Text(this, &SSwuiProfilerOverlay::GetFpsRowText)
						.Font(MonospaceFont)
						.ColorAndOpacity(FLinearColor::White)
					]

					// Dropped & Skipped Row
					+ SVerticalBox::Slot()
					.AutoHeight()
					.Padding(0.f, 1.f, 0.f, 6.f)
					[
						SNew(STextBlock)
						.Text(this, &SSwuiProfilerOverlay::GetDroppedRowText)
						.Font(MonospaceFont)
						.ColorAndOpacity(this, &SSwuiProfilerOverlay::GetDroppedColor)
					]

					// Separator
					+ SVerticalBox::Slot()
					.AutoHeight()
					.Padding(0.f, 2.f)
					[
						SNew(SBox)
						.HeightOverride(1.f)
						[
							SNew(SBorder)
							.BorderBackgroundColor(FLinearColor(0.2f, 0.25f, 0.35f, 0.5f))
						]
					]

					// Timings
					+ SVerticalBox::Slot().AutoHeight().Padding(0.f, 2.f)
					[ SNew(STextBlock).Text(this, &SSwuiProfilerOverlay::GetGameThreadTimingText).Font(MonospaceFont).ColorAndOpacity(this, &SSwuiProfilerOverlay::GetGameThreadColor) ]

					+ SVerticalBox::Slot().AutoHeight().Padding(0.f, 2.f)
					[ SNew(STextBlock).Text(this, &SSwuiProfilerOverlay::GetCefLoopTimingText).Font(MonospaceFont).ColorAndOpacity(FLinearColor(0.85f, 0.85f, 0.85f)) ]

					+ SVerticalBox::Slot().AutoHeight().Padding(0.f, 2.f)
					[ SNew(STextBlock).Text(this, &SSwuiProfilerOverlay::GetStateSyncTimingText).Font(MonospaceFont).ColorAndOpacity(FLinearColor(0.85f, 0.85f, 0.85f)) ]

					+ SVerticalBox::Slot().AutoHeight().Padding(0.f, 2.f)
					[ SNew(STextBlock).Text(this, &SSwuiProfilerOverlay::GetJsDispatchTimingText).Font(MonospaceFont).ColorAndOpacity(FLinearColor(0.85f, 0.85f, 0.85f)) ]

					+ SVerticalBox::Slot().AutoHeight().Padding(0.f, 2.f)
					[ SNew(STextBlock).Text(this, &SSwuiProfilerOverlay::GetPaintTimingText).Font(MonospaceFont).ColorAndOpacity(FLinearColor(0.85f, 0.85f, 0.85f)) ]

					+ SVerticalBox::Slot().AutoHeight().Padding(0.f, 2.f)
					[ SNew(STextBlock).Text(this, &SSwuiProfilerOverlay::GetCpuCopyTimingText).Font(MonospaceFont).ColorAndOpacity(FLinearColor(0.85f, 0.85f, 0.85f)) ]

					+ SVerticalBox::Slot().AutoHeight().Padding(0.f, 2.f)
					[ SNew(STextBlock).Text(this, &SSwuiProfilerOverlay::GetGpuUploadTimingText).Font(MonospaceFont).ColorAndOpacity(FLinearColor(0.85f, 0.85f, 0.85f)) ]

					+ SVerticalBox::Slot().AutoHeight().Padding(0.f, 2.f)
					[ SNew(STextBlock).Text(this, &SSwuiProfilerOverlay::GetLatencyTimingText).Font(MonospaceFont).ColorAndOpacity(FLinearColor(0.7f, 0.9f, 1.0f)) ]

					// Separator
					+ SVerticalBox::Slot()
					.AutoHeight()
					.Padding(0.f, 4.f, 0.f, 2.f)
					[
						SNew(SBox)
						.HeightOverride(1.f)
						[
							SNew(SBorder)
							.BorderBackgroundColor(FLinearColor(0.2f, 0.25f, 0.35f, 0.5f))
						]
					]

					+ SVerticalBox::Slot().AutoHeight().Padding(0.f, 2.f)
					[ SNew(STextBlock).Text(this, &SSwuiProfilerOverlay::GetPixelStatsText).Font(MonospaceFont).ColorAndOpacity(FLinearColor(0.8f, 0.8f, 0.8f)) ]

					+ SVerticalBox::Slot().AutoHeight().Padding(0.f, 2.f)
					[ SNew(STextBlock).Text(this, &SSwuiProfilerOverlay::GetIOStatsText).Font(MonospaceFont).ColorAndOpacity(FLinearColor(0.8f, 0.8f, 0.8f)) ]

					+ SVerticalBox::Slot().AutoHeight().Padding(0.f, 2.f)
					[ SNew(STextBlock).Text(this, &SSwuiProfilerOverlay::GetLongTaskText).Font(MonospaceFont).ColorAndOpacity(FLinearColor(1.0f, 0.75f, 0.35f)) ]
				]
			]
		];
	}

private:
	FText GetBackendText() const
	{
		const FSwuiProfilerSnapshot& S = FSwuiProfiler::GetSnapshot();
		return FText::FromString(S.RenderBackendName.IsEmpty() ? TEXT("GPU (Direct)") : S.RenderBackendName);
	}

	FText GetFpsRowText() const
	{
		const FSwuiProfilerSnapshot& S = FSwuiProfiler::GetSnapshot();
		return FText::FromString(FString::Printf(TEXT("Unreal: %5.1f FPS  |  SWUI Target: %3.0f Hz  |  Presented: %5.1f FPS"),
			S.UnrealFps, S.SwuiTargetFps, S.PresentedFps));
	}

	FText GetDroppedRowText() const
	{
		const FSwuiProfilerSnapshot& S = FSwuiProfiler::GetSnapshot();
		return FText::FromString(FString::Printf(TEXT("Dropped Frames: %u  |  Skipped Requests: %u  |  Browsers: %u"),
			S.DroppedFrames, S.SkippedFrames, S.ActiveBrowserCount));
	}

	FSlateColor GetDroppedColor() const
	{
		const FSwuiProfilerSnapshot& S = FSwuiProfiler::GetSnapshot();
		if (S.DroppedFrames > 0)
		{
			return FLinearColor(1.0f, 0.7f, 0.2f);
		}
		return FLinearColor(0.6f, 0.7f, 0.8f);
	}

	FText GetGameThreadTimingText() const
	{
		const FSwuiProfilerSnapshot& S = FSwuiProfiler::GetSnapshot();
		const FSwuiScopeStat& Stat = S.Scopes[static_cast<int32>(ESwuiProfileScope::GameThreadTotal)];
		return FText::FromString(FString::Printf(TEXT("Game-Thread SWUI:  %5.2f ms  [P95: %5.2f, Max: %5.2f]"),
			Stat.Current, Stat.P95, Stat.Max));
	}

	FSlateColor GetGameThreadColor() const
	{
		const FSwuiProfilerSnapshot& S = FSwuiProfiler::GetSnapshot();
		const float Cost = S.Scopes[static_cast<int32>(ESwuiProfileScope::GameThreadTotal)].Current;
		if (Cost > 1.0f)
		{
			return FLinearColor(1.0f, 0.35f, 0.35f);
		}
		if (Cost > 0.5f)
		{
			return FLinearColor(1.0f, 0.85f, 0.3f);
		}
		return FLinearColor(0.4f, 1.0f, 0.4f);
	}

	FText GetCefLoopTimingText() const
	{
		const FSwuiProfilerSnapshot& S = FSwuiProfiler::GetSnapshot();
		const FSwuiScopeStat& Stat = S.Scopes[static_cast<int32>(ESwuiProfileScope::CefMessageLoop)];
		return FText::FromString(FString::Printf(TEXT("CEF Message Loop:  %5.2f ms  [P95: %5.2f, Max: %5.2f]"),
			Stat.Current, Stat.P95, Stat.Max));
	}

	FText GetStateSyncTimingText() const
	{
		const FSwuiProfilerSnapshot& S = FSwuiProfiler::GetSnapshot();
		const FSwuiScopeStat& Stat = S.Scopes[static_cast<int32>(ESwuiProfileScope::StateSync)];
		return FText::FromString(FString::Printf(TEXT("State Sync & Diff: %5.2f ms  [Avg: %5.2f]"),
			Stat.Current, Stat.Avg));
	}

	FText GetJsDispatchTimingText() const
	{
		const FSwuiProfilerSnapshot& S = FSwuiProfiler::GetSnapshot();
		const FSwuiScopeStat& Stat = S.Scopes[static_cast<int32>(ESwuiProfileScope::JsDispatch)];
		return FText::FromString(FString::Printf(TEXT("JS Dispatch:       %5.2f ms"),
			Stat.Current));
	}

	FText GetPaintTimingText() const
	{
		const FSwuiProfilerSnapshot& S = FSwuiProfiler::GetSnapshot();
		const FSwuiScopeStat& Stat = S.Scopes[static_cast<int32>(ESwuiProfileScope::CefPaint)];
		return FText::FromString(FString::Printf(TEXT("CEF Paint (Thread):%5.2f ms  [P95: %5.2f]"),
			Stat.Current, Stat.P95));
	}

	FText GetCpuCopyTimingText() const
	{
		const FSwuiProfilerSnapshot& S = FSwuiProfiler::GetSnapshot();
		const FSwuiScopeStat& Stat = S.Scopes[static_cast<int32>(ESwuiProfileScope::CpuCopy)];
		if (Stat.Current <= 0.001f && Stat.Max <= 0.001f)
		{
			return FText::FromString(TEXT("CPU Pixel Copy:    0.00 ms (Zero-Copy GPU)"));
		}
		return FText::FromString(FString::Printf(TEXT("CPU Pixel Copy:    %5.2f ms  [Avg: %5.2f]"),
			Stat.Current, Stat.Avg));
	}

	FText GetGpuUploadTimingText() const
	{
		const FSwuiProfilerSnapshot& S = FSwuiProfiler::GetSnapshot();
		const FSwuiScopeStat& Stat = S.Scopes[static_cast<int32>(ESwuiProfileScope::GpuUpload)];
		return FText::FromString(FString::Printf(TEXT("GPU Upload/Blit:   %5.2f ms  [Avg: %5.2f]"),
			Stat.Current, Stat.Avg));
	}

	FText GetLatencyTimingText() const
	{
		const FSwuiProfilerSnapshot& S = FSwuiProfiler::GetSnapshot();
		return FText::FromString(FString::Printf(TEXT("Paint->Present:    %5.2f ms  [P95: %5.2f, Max: %5.2f]"),
			S.PaintToPresentLatencyMs, S.PaintToPresentP95Ms, S.PaintToPresentMaxMs));
	}

	FText GetPixelStatsText() const
	{
		const FSwuiProfilerSnapshot& S = FSwuiProfiler::GetSnapshot();
		const float DirtyK = static_cast<float>(S.DirtyPixels) / 1000.f;
		const float FullM = static_cast<float>(S.FullSurfacePixels) / 1000000.f;
		return FText::FromString(FString::Printf(TEXT("Pixels: %5.0fK / %4.2fM (%4.1f%% dirty)"),
			DirtyK, FullM, S.DirtyPercent));
	}

	FText GetIOStatsText() const
	{
		const FSwuiProfilerSnapshot& S = FSwuiProfiler::GetSnapshot();
		return FText::FromString(FString::Printf(TEXT("State Updates: %3u/s | Input: %3u/s (Coalesced: %3u/s)"),
			S.StateUpdatesPerSec, S.InputEventsPerSec, S.InputCoalescedPerSec));
	}

	FText GetLongTaskText() const
	{
		const FSwuiProfilerSnapshot& S = FSwuiProfiler::GetSnapshot();
		if (S.TotalLongTaskCount == 0)
		{
			return FText::FromString(TEXT("Browser LongTasks: None (>16ms)"));
		}
		return FText::FromString(FString::Printf(TEXT("Browser LongTasks: %3u (>16ms) [Last: %5.1f ms]"),
			S.TotalLongTaskCount, S.LastLongTaskDurationMs));
	}
};

// ---------------------------------------------------------------------------
// Static State
// ---------------------------------------------------------------------------

namespace
{
	FSwuiProfilerSnapshot GProfilerSnapshot;
	TSharedPtr<SSwuiProfilerOverlay> GProfilerWidget;

	FCriticalSection GProfilerMutex;
	float GCurrentScopeTimes[static_cast<int32>(ESwuiProfileScope::Count)] = { 0.f };

	// Periodic accumulation
	uint32 GStateUpdatesAccum = 0;
	uint32 GInputEventsAccum = 0;
	uint32 GInputCoalescedAccum = 0;
	double GLastRateCheckTime = 0.0;

	// Rolling paint-to-present latency
	FSwuiScopeStat GLatencyStat;

	// Session Capture
	bool bIsCapturing = false;
	double GCaptureStartTime = 0.0;
	TArray<FSwuiProfilerSnapshot> GCapturedSnapshots;

	// Benchmark Session (Phase 31: swui.benchmark)
	bool bIsBenchmarking = false;
	int32 GBenchmarkTotalFrames = 300;
	int32 GBenchmarkFramesRemaining = 0;
	double GBenchmarkStartTime = 0.0;
	TArray<FSwuiProfilerSnapshot> GBenchmarkSnapshots;

	IConsoleCommand* CmdSwuiStats = nullptr;
	IConsoleCommand* CmdSwuiStatsVerbose = nullptr;
	IConsoleCommand* CmdSwuiProfileStart = nullptr;
	IConsoleCommand* CmdSwuiProfileStop = nullptr;
	IConsoleCommand* CmdSwuiProfileSave = nullptr;
	IConsoleCommand* CmdSwuiBenchmark = nullptr;
}

void FSwuiProfiler::Initialize()
{
	RegisterConsoleCommands();
}

void FSwuiProfiler::Shutdown()
{
	UnregisterConsoleCommands();

	if (GProfilerWidget.IsValid() && GEngine && GEngine->GameViewport)
	{
		GEngine->GameViewport->RemoveViewportWidgetContent(GProfilerWidget.ToSharedRef());
	}
	GProfilerWidget.Reset();
}

bool FSwuiProfiler::IsProfilerOrStatsActive()
{
	return CVarSwuiProfiler.GetValueOnAnyThread() > 0
		|| CVarSwuiDebugStats.GetValueOnAnyThread() > 0
		|| bIsCapturing
		|| bIsBenchmarking;
}

void FSwuiProfiler::RecordScopeTime(ESwuiProfileScope Scope, float DurationMs)
{
	const int32 Idx = static_cast<int32>(Scope);
	if (Idx >= 0 && Idx < static_cast<int32>(ESwuiProfileScope::Count))
	{
		FScopeLock Lock(&GProfilerMutex);
		GCurrentScopeTimes[Idx] += DurationMs;
	}
}

void FSwuiProfiler::RecordStateUpdate(uint32 UpdateCount)
{
	FPlatformAtomics::InterlockedAdd(reinterpret_cast<volatile int32*>(&GStateUpdatesAccum), static_cast<int32>(UpdateCount));
}

void FSwuiProfiler::RecordInputEvent(bool bCoalesced)
{
	FPlatformAtomics::InterlockedIncrement(reinterpret_cast<volatile int32*>(&GInputEventsAccum));
	if (bCoalesced)
	{
		FPlatformAtomics::InterlockedIncrement(reinterpret_cast<volatile int32*>(&GInputCoalescedAccum));
	}
}

void FSwuiProfiler::RecordPixels(int64 DirtyPx, int64 FullSurfacePx)
{
	FScopeLock Lock(&GProfilerMutex);
	GProfilerSnapshot.DirtyPixels = DirtyPx;
	GProfilerSnapshot.FullSurfacePixels = FullSurfacePx;
	GProfilerSnapshot.DirtyPercent = FullSurfacePx > 0
		? (static_cast<float>(DirtyPx) / static_cast<float>(FullSurfacePx)) * 100.f
		: 0.f;
}

void FSwuiProfiler::RecordDroppedFrame()
{
	FScopeLock Lock(&GProfilerMutex);
	GProfilerSnapshot.DroppedFrames++;
}

void FSwuiProfiler::RecordSkippedFrame()
{
	FScopeLock Lock(&GProfilerMutex);
	GProfilerSnapshot.SkippedFrames++;
}

void FSwuiProfiler::RecordPresentedFrame(float PaintToPresentLatencyMs)
{
	FScopeLock Lock(&GProfilerMutex);
	GLatencyStat.AddSample(PaintToPresentLatencyMs);
	GProfilerSnapshot.PaintToPresentLatencyMs = PaintToPresentLatencyMs;
}

void FSwuiProfiler::RecordLongTask(float DurationMs)
{
	FScopeLock Lock(&GProfilerMutex);
	GProfilerSnapshot.LastLongTaskDurationMs = DurationMs;
	GProfilerSnapshot.TotalLongTaskCount++;
}

void FSwuiProfiler::Update(float DeltaTime, float CurrentEngineFps, float TargetSwuiFps, int32 BrowserCount, const FString& BackendName)
{
	const double Now = FPlatformTime::Seconds();
	bool bFinishBenchmarkNow = false;

	{
		FScopeLock Lock(&GProfilerMutex);

		GProfilerSnapshot.UnrealFps = CurrentEngineFps;
		GProfilerSnapshot.SwuiTargetFps = TargetSwuiFps;
		GProfilerSnapshot.ActiveBrowserCount = static_cast<uint32>(BrowserCount);
		GProfilerSnapshot.RenderBackendName = BackendName;

		for (int32 i = 0; i < static_cast<int32>(ESwuiProfileScope::Count); ++i)
		{
			GProfilerSnapshot.Scopes[i].AddSample(GCurrentScopeTimes[i]);
			GProfilerSnapshot.Scopes[i].RecomputeStats();
			GCurrentScopeTimes[i] = 0.f;
		}

		GLatencyStat.RecomputeStats();
		GProfilerSnapshot.PaintToPresentP95Ms = GLatencyStat.P95;
		GProfilerSnapshot.PaintToPresentMaxMs = GLatencyStat.Max;

		// Calculate presented UI FPS
		if (GLatencyStat.Avg > 0.001f)
		{
			GProfilerSnapshot.PresentedFps = 1000.f / GLatencyStat.Avg;
		}
		else
		{
			GProfilerSnapshot.PresentedFps = TargetSwuiFps;
		}

		// Calculate rates per second
		if (GLastRateCheckTime <= 0.0)
		{
			GLastRateCheckTime = Now;
		}
		else if (Now - GLastRateCheckTime >= 1.0)
		{
			const double ElapsedSec = Now - GLastRateCheckTime;
			GProfilerSnapshot.StateUpdatesPerSec = static_cast<uint32>(GStateUpdatesAccum / ElapsedSec);
			GProfilerSnapshot.InputEventsPerSec = static_cast<uint32>(GInputEventsAccum / ElapsedSec);
			GProfilerSnapshot.InputCoalescedPerSec = static_cast<uint32>(GInputCoalescedAccum / ElapsedSec);

			GStateUpdatesAccum = 0;
			GInputEventsAccum = 0;
			GInputCoalescedAccum = 0;
			GLastRateCheckTime = Now;
		}

		if (bIsCapturing)
		{
			GCapturedSnapshots.Add(GProfilerSnapshot);
		}

		if (bIsBenchmarking)
		{
			GBenchmarkSnapshots.Add(GProfilerSnapshot);
			--GBenchmarkFramesRemaining;
			if (GBenchmarkFramesRemaining <= 0)
			{
				bIsBenchmarking = false;
				bFinishBenchmarkNow = true;
			}
		}
	}

	if (bFinishBenchmarkNow)
	{
		FinishBenchmark();
	}

	// Manage Slate Viewport Overlay
	const bool bWantsOverlay = CVarSwuiProfiler.GetValueOnGameThread() > 0;
	if (bWantsOverlay && !GProfilerWidget.IsValid())
	{
		if (GEngine && GEngine->GameViewport)
		{
			SAssignNew(GProfilerWidget, SSwuiProfilerOverlay);
			GEngine->GameViewport->AddViewportWidgetContent(GProfilerWidget.ToSharedRef(), 100000);
			UE_LOG(LogSwuiRuntime, Log, TEXT("[SWUI Profiler] On-screen profiler overlay enabled."));
		}
	}
	else if (!bWantsOverlay && GProfilerWidget.IsValid())
	{
		if (GEngine && GEngine->GameViewport)
		{
			GEngine->GameViewport->RemoveViewportWidgetContent(GProfilerWidget.ToSharedRef());
		}
		GProfilerWidget.Reset();
		UE_LOG(LogSwuiRuntime, Log, TEXT("[SWUI Profiler] On-screen profiler overlay disabled."));
	}
}

const FSwuiProfilerSnapshot& FSwuiProfiler::GetSnapshot()
{
	return GProfilerSnapshot;
}

void FSwuiProfiler::StartCapture()
{
	FScopeLock Lock(&GProfilerMutex);
	GCapturedSnapshots.Empty();
	GCaptureStartTime = FPlatformTime::Seconds();
	bIsCapturing = true;
	UE_LOG(LogSwuiRuntime, Log, TEXT("[SWUI Profiler] Recording performance capture started..."));
}

void FSwuiProfiler::StopCapture()
{
	FScopeLock Lock(&GProfilerMutex);
	bIsCapturing = false;
	const double Duration = FPlatformTime::Seconds() - GCaptureStartTime;
	UE_LOG(LogSwuiRuntime, Log, TEXT("[SWUI Profiler] Recording stopped. Recorded %d frames over %.1f seconds. Use 'swui.profile.save' to export report."),
		GCapturedSnapshots.Num(), Duration);
}

bool FSwuiProfiler::SaveCapture(FString& OutSavedPath)
{
	FScopeLock Lock(&GProfilerMutex);
	if (GCapturedSnapshots.IsEmpty())
	{
		UE_LOG(LogSwuiRuntime, Warning, TEXT("[SWUI Profiler] No captured frames to save. Run 'swui.profile.start' first."));
		return false;
	}

	const double Duration = FPlatformTime::Seconds() - GCaptureStartTime;
	const FString Timestamp = FDateTime::Now().ToString(TEXT("%Y%m%d_%H%M%S"));
	const FString Dir = FPaths::Combine(FPaths::ProjectSavedDir(), TEXT("Profiling"));
	IFileManager::Get().MakeDirectory(*Dir, true);

	OutSavedPath = FPaths::Combine(Dir, FString::Printf(TEXT("SwuiReport_%s.txt"), *Timestamp));

	FString Report;
	Report += TEXT("================================================================================\n");
	Report += TEXT("SWUI PERFORMANCE CAPTURE REPORT\n");
	Report += FString::Printf(TEXT("Date: %s  |  Duration: %.2f sec  |  Frames Captured: %d\n"),
		*FDateTime::Now().ToString(), Duration, GCapturedSnapshots.Num());
	Report += TEXT("================================================================================\n\n");

	// Compute aggregate metrics
	float AvgUnrealFps = 0.f;
	float AvgPresentedFps = 0.f;
	uint32 TotalDropped = 0;
	float ScopeSums[static_cast<int32>(ESwuiProfileScope::Count)] = { 0.f };
	float ScopeMaxs[static_cast<int32>(ESwuiProfileScope::Count)] = { 0.f };

	for (const FSwuiProfilerSnapshot& Snap : GCapturedSnapshots)
	{
		AvgUnrealFps += Snap.UnrealFps;
		AvgPresentedFps += Snap.PresentedFps;
		TotalDropped += Snap.DroppedFrames;

		for (int32 i = 0; i < static_cast<int32>(ESwuiProfileScope::Count); ++i)
		{
			ScopeSums[i] += Snap.Scopes[i].Current;
			ScopeMaxs[i] = FMath::Max(ScopeMaxs[i], Snap.Scopes[i].Current);
		}
	}

	const float FrameCountF = static_cast<float>(GCapturedSnapshots.Num());
	AvgUnrealFps /= FrameCountF;
	AvgPresentedFps /= FrameCountF;

	Report += FString::Printf(TEXT("Average Unreal FPS:     %6.1f\n"), AvgUnrealFps);
	Report += FString::Printf(TEXT("Average Presented FPS:  %6.1f\n"), AvgPresentedFps);
	Report += FString::Printf(TEXT("Total Dropped UI Frames:%6u\n\n"), TotalDropped);

	Report += TEXT("--------------------------------------------------------------------------------\n");
	Report += TEXT("SCOPE TIMINGS (ms)             AVG       MAX\n");
	Report += TEXT("--------------------------------------------------------------------------------\n");
	for (int32 i = 0; i < static_cast<int32>(ESwuiProfileScope::Count); ++i)
	{
		const float AvgMs = ScopeSums[i] / FrameCountF;
		Report += FString::Printf(TEXT("%-28s %6.3f ms %6.3f ms\n"),
			GetScopeName(static_cast<ESwuiProfileScope>(i)), AvgMs, ScopeMaxs[i]);
	}
	Report += TEXT("================================================================================\n");

	if (FFileHelper::SaveStringToFile(Report, *OutSavedPath))
	{
		UE_LOG(LogSwuiRuntime, Log, TEXT("[SWUI Profiler] Report successfully saved to: %s"), *OutSavedPath);
		return true;
	}

	UE_LOG(LogSwuiRuntime, Error, TEXT("[SWUI Profiler] Failed to write report to: %s"), *OutSavedPath);
	return false;
}

void FSwuiProfiler::RunBenchmark(int32 NumFrames)
{
	FScopeLock Lock(&GProfilerMutex);
	GBenchmarkSnapshots.Empty();
	GBenchmarkTotalFrames = FMath::Clamp(NumFrames, 30, 10000);
	GBenchmarkFramesRemaining = GBenchmarkTotalFrames;
	GBenchmarkStartTime = FPlatformTime::Seconds();
	bIsBenchmarking = true;
	UE_LOG(LogSwuiRuntime, Log, TEXT("[SWUI Benchmark] Starting automated benchmark run for %d frames..."), GBenchmarkTotalFrames);
	if (GEngine)
	{
		GEngine->AddOnScreenDebugMessage(-1, 4.f, FColor::Cyan,
			FString::Printf(TEXT("[SWUI Benchmark] Started (%d frames)..."), GBenchmarkTotalFrames));
	}
}

void FSwuiProfiler::CancelBenchmark()
{
	FScopeLock Lock(&GProfilerMutex);
	if (bIsBenchmarking)
	{
		bIsBenchmarking = false;
		GBenchmarkSnapshots.Empty();
		UE_LOG(LogSwuiRuntime, Log, TEXT("[SWUI Benchmark] Benchmark cancelled."));
	}
}

bool FSwuiProfiler::IsBenchmarking()
{
	return bIsBenchmarking;
}

void FSwuiProfiler::FinishBenchmark()
{
	TArray<FSwuiProfilerSnapshot> SnapshotsCopy;
	double StartTime = 0.0;
	{
		FScopeLock Lock(&GProfilerMutex);
		SnapshotsCopy = GBenchmarkSnapshots;
		StartTime = GBenchmarkStartTime;
		GBenchmarkSnapshots.Empty();
	}

	if (SnapshotsCopy.IsEmpty())
	{
		UE_LOG(LogSwuiRuntime, Warning, TEXT("[SWUI Benchmark] No snapshots collected during benchmark."));
		return;
	}

	const double Duration = FPlatformTime::Seconds() - StartTime;
	const int32 NumFrames = SnapshotsCopy.Num();
	const float NumFramesF = static_cast<float>(NumFrames);

	TArray<float> ScopeSamples[static_cast<int32>(ESwuiProfileScope::Count)];
	for (int32 i = 0; i < static_cast<int32>(ESwuiProfileScope::Count); ++i)
	{
		ScopeSamples[i].Reserve(NumFrames);
	}

	float SumUnrealFps = 0.f;
	float MinUnrealFps = 9999.f;
	float SumPresentedFps = 0.f;
	float MinPresentedFps = 9999.f;
	float TargetSwuiFps = 60.f;
	uint32 DroppedFramesTotal = 0;
	uint32 SkippedFramesTotal = 0;
	FString BackendName;
	uint32 ActiveBrowserCount = 0;

	for (const FSwuiProfilerSnapshot& S : SnapshotsCopy)
	{
		SumUnrealFps += S.UnrealFps;
		MinUnrealFps = FMath::Min(MinUnrealFps, S.UnrealFps);
		SumPresentedFps += S.PresentedFps;
		MinPresentedFps = FMath::Min(MinPresentedFps, S.PresentedFps);
		TargetSwuiFps = S.SwuiTargetFps;
		DroppedFramesTotal += S.DroppedFrames;
		SkippedFramesTotal += S.SkippedFrames;
		if (BackendName.IsEmpty() && !S.RenderBackendName.IsEmpty())
		{
			BackendName = S.RenderBackendName;
		}
		ActiveBrowserCount = FMath::Max(ActiveBrowserCount, S.ActiveBrowserCount);

		for (int32 i = 0; i < static_cast<int32>(ESwuiProfileScope::Count); ++i)
		{
			ScopeSamples[i].Add(S.Scopes[i].Current);
		}
	}

	const float AvgUnrealFps = SumUnrealFps / NumFramesF;
	const float AvgPresentedFps = SumPresentedFps / NumFramesF;

	struct FCalculatedStat
	{
		float Avg = 0.f;
		float P50 = 0.f;
		float P95 = 0.f;
		float P99 = 0.f;
		float Max = 0.f;
	};

	FCalculatedStat ComputedScopes[static_cast<int32>(ESwuiProfileScope::Count)];
	for (int32 i = 0; i < static_cast<int32>(ESwuiProfileScope::Count); ++i)
	{
		TArray<float>& Samples = ScopeSamples[i];
		Samples.Sort();

		float Sum = 0.f;
		for (float V : Samples)
		{
			Sum += V;
		}
		ComputedScopes[i].Avg = Sum / NumFramesF;
		ComputedScopes[i].Max = Samples.Last();

		const auto GetPct = [&](float Pct) -> float
		{
			const float Rank = Pct * (NumFrames - 1);
			const int32 Low = FMath::FloorToInt(Rank);
			const int32 High = FMath::CeilToInt(Rank);
			const float Weight = Rank - Low;
			return FMath::Lerp(Samples[Low], Samples[High], Weight);
		};

		ComputedScopes[i].P50 = GetPct(0.50f);
		ComputedScopes[i].P95 = GetPct(0.95f);
		ComputedScopes[i].P99 = GetPct(0.99f);
	}

	const FCalculatedStat& GtStat = ComputedScopes[static_cast<int32>(ESwuiProfileScope::GameThreadTotal)];
	const FCalculatedStat& CefStat = ComputedScopes[static_cast<int32>(ESwuiProfileScope::CefMessageLoop)];
	const float CefBudgetMs = CVarSwuiCefMessageLoopBudgetMs.GetValueOnGameThread();

	enum class ECheckStatus { Pass, Warn, Fail };

	auto EvalMetric = [](float Val, float PassThresh, float WarnThresh) -> ECheckStatus
	{
		if (Val <= PassThresh) return ECheckStatus::Pass;
		if (Val <= WarnThresh) return ECheckStatus::Warn;
		return ECheckStatus::Fail;
	};

	const ECheckStatus GtAvgStatus = EvalMetric(GtStat.Avg, 0.50f, 1.00f);
	const ECheckStatus GtP95Status = EvalMetric(GtStat.P95, 1.00f, 2.00f);
	const ECheckStatus GtMaxStatus = EvalMetric(GtStat.Max, 2.00f, 5.00f);
	const ECheckStatus CefAvgStatus = EvalMetric(CefStat.Avg, CefBudgetMs, CefBudgetMs * 1.5f);

	const bool bGpuDirect = BackendName.Contains(TEXT("Direct")) || BackendName.Contains(TEXT("GPU"));
	const bool bIsD3D11 = GDynamicRHI && FCString::Strcmp(GDynamicRHI->GetName(), TEXT("D3D11")) == 0;
	const ECheckStatus RenderModeStatus = (bGpuDirect || !bIsD3D11) ? ECheckStatus::Pass : ECheckStatus::Warn;

	ECheckStatus OverallStatus = ECheckStatus::Pass;
	auto UpdateOverall = [&](ECheckStatus St)
	{
		if (St == ECheckStatus::Fail) OverallStatus = ECheckStatus::Fail;
		else if (St == ECheckStatus::Warn && OverallStatus != ECheckStatus::Fail) OverallStatus = ECheckStatus::Warn;
	};

	UpdateOverall(GtAvgStatus);
	UpdateOverall(GtP95Status);
	UpdateOverall(GtMaxStatus);
	UpdateOverall(CefAvgStatus);
	UpdateOverall(RenderModeStatus);

	auto StatusToString = [](ECheckStatus St) -> const TCHAR*
	{
		switch (St)
		{
		case ECheckStatus::Pass: return TEXT("[PASS]");
		case ECheckStatus::Warn: return TEXT("[WARN]");
		case ECheckStatus::Fail: return TEXT("[FAIL]");
		default: return TEXT("[INFO]");
		}
	};

	const FString Timestamp = FDateTime::Now().ToString(TEXT("%Y%m%d_%H%M%S"));
	const FString Dir = FPaths::Combine(FPaths::ProjectSavedDir(), TEXT("Profiling"));
	IFileManager::Get().MakeDirectory(*Dir, true);
	const FString SavedPath = FPaths::Combine(Dir, FString::Printf(TEXT("SwuiBenchmark_%s.txt"), *Timestamp));

	FString Report;
	Report += TEXT("\n================================================================================\n");
	Report += TEXT("                     SWUI AUTOMATED PERFORMANCE BENCHMARK\n");
	Report += TEXT("================================================================================\n");
	Report += FString::Printf(TEXT("Timestamp:           %s\n"), *FDateTime::Now().ToString());
	Report += FString::Printf(TEXT("Duration:            %.2f sec (%d frames)\n"), Duration, NumFrames);
	Report += FString::Printf(TEXT("Backend:             %s (Active Browsers: %u)\n"), *BackendName, ActiveBrowserCount);
	Report += FString::Printf(TEXT("Unreal Engine FPS:   Avg: %5.1f FPS | Min: %5.1f FPS\n"), AvgUnrealFps, MinUnrealFps);
	Report += FString::Printf(TEXT("SWUI Target Cadence: %5.1f Hz  | Presented: %5.1f FPS\n"), TargetSwuiFps, AvgPresentedFps);
	Report += FString::Printf(TEXT("Frame Telemetry:     Dropped: %u frames | Skipped: %u requests\n"), DroppedFramesTotal, SkippedFramesTotal);
	Report += TEXT("--------------------------------------------------------------------------------\n");
	Report += TEXT("PERFORMANCE SLA CHECKLIST                  MEASURED     TARGET      STATUS\n");
	Report += TEXT("--------------------------------------------------------------------------------\n");
	Report += FString::Printf(TEXT("Game-Thread SWUI (Avg)                    %5.2f ms    < 0.50 ms    %-6s\n"),
		GtStat.Avg, StatusToString(GtAvgStatus));
	Report += FString::Printf(TEXT("Game-Thread SWUI (P95)                    %5.2f ms    < 1.00 ms    %-6s\n"),
		GtStat.P95, StatusToString(GtP95Status));
	Report += FString::Printf(TEXT("Game-Thread SWUI (Max)                    %5.2f ms    < 2.00 ms    %-6s\n"),
		GtStat.Max, StatusToString(GtMaxStatus));
	Report += FString::Printf(TEXT("CEF Message Loop (Avg)                    %5.2f ms    < %4.2f ms    %-6s\n"),
		CefStat.Avg, CefBudgetMs, StatusToString(CefAvgStatus));
	Report += FString::Printf(TEXT("Rendering Backend Path                    %-8s    Verified    %-6s\n"),
		*BackendName, StatusToString(RenderModeStatus));
	Report += TEXT("--------------------------------------------------------------------------------\n");
	Report += TEXT("SCOPE TIMINGS (ms)             AVG      P50      P95      P99      MAX\n");
	Report += TEXT("--------------------------------------------------------------------------------\n");
	for (int32 i = 0; i < static_cast<int32>(ESwuiProfileScope::Count); ++i)
	{
		const FCalculatedStat& Sc = ComputedScopes[i];
		Report += FString::Printf(TEXT("%-28s %6.3f   %6.3f   %6.3f   %6.3f   %6.3f\n"),
			FSwuiProfiler::GetScopeName(static_cast<ESwuiProfileScope>(i)),
			Sc.Avg, Sc.P50, Sc.P95, Sc.P99, Sc.Max);
	}
	Report += TEXT("================================================================================\n");
	const FString OverallString = OverallStatus == ECheckStatus::Pass ? TEXT("PASS")
		: (OverallStatus == ECheckStatus::Warn ? TEXT("PASS (WITH WARNINGS)") : TEXT("FAIL"));
	Report += FString::Printf(TEXT("OVERALL BENCHMARK RESULT: %s\n"), *OverallString);
	Report += TEXT("================================================================================\n");

	FFileHelper::SaveStringToFile(Report, *SavedPath);

	UE_LOG(LogSwuiRuntime, Log, TEXT("%s"), *Report);
	UE_LOG(LogSwuiRuntime, Log, TEXT("[SWUI Benchmark] Full benchmark scorecard saved to: %s"), *SavedPath);

	if (GEngine)
	{
		const FColor DisplayColor = OverallStatus == ECheckStatus::Pass ? FColor::Green
			: (OverallStatus == ECheckStatus::Warn ? FColor::Yellow : FColor::Red);
		GEngine->AddOnScreenDebugMessage(-1, 8.f, DisplayColor,
			FString::Printf(TEXT("[SWUI BENCHMARK: %s] GameThread Avg: %.2fms, P95: %.2fms | %s"),
				*OverallString, GtStat.Avg, GtStat.P95, *FPaths::GetCleanFilename(SavedPath)));
	}
}

void FSwuiProfiler::DumpStatsToLog(bool bVerbose)
{
	const FSwuiProfilerSnapshot& S = GetSnapshot();

	if (!bVerbose)
	{
		UE_LOG(LogSwuiRuntime, Log,
			TEXT("[SWUI PROFILER] Unreal: %.1f FPS | Presented: %.1f FPS | Game-Thread: %.2f ms | CEF: %.2f ms | Paint: %.2f ms | Upload: %.2f ms | Latency: %.2f ms | Dropped: %u"),
			S.UnrealFps,
			S.PresentedFps,
			S.Scopes[static_cast<int32>(ESwuiProfileScope::GameThreadTotal)].Current,
			S.Scopes[static_cast<int32>(ESwuiProfileScope::CefMessageLoop)].Current,
			S.Scopes[static_cast<int32>(ESwuiProfileScope::CefPaint)].Current,
			S.Scopes[static_cast<int32>(ESwuiProfileScope::GpuUpload)].Current,
			S.PaintToPresentLatencyMs,
			S.DroppedFrames);
	}
	else
	{
		UE_LOG(LogSwuiRuntime, Log, TEXT("======================== SWUI VERBOSE PROFILER SNAPSHOT ========================"));
		UE_LOG(LogSwuiRuntime, Log, TEXT("Unreal FPS: %.1f | SWUI Target: %.0f Hz | Presented FPS: %.1f | Dropped: %u | Skipped: %u"),
			S.UnrealFps, S.SwuiTargetFps, S.PresentedFps, S.DroppedFrames, S.SkippedFrames);
		UE_LOG(LogSwuiRuntime, Log, TEXT("Backend: %s | Active Browsers: %u"), *S.RenderBackendName, S.ActiveBrowserCount);

		for (int32 i = 0; i < static_cast<int32>(ESwuiProfileScope::Count); ++i)
		{
			const FSwuiScopeStat& Stat = S.Scopes[i];
			UE_LOG(LogSwuiRuntime, Log, TEXT("  %-22s : Cur=%5.2fms | Avg=%5.2fms | P50=%5.2fms | P95=%5.2fms | P99=%5.2fms | Max=%5.2fms"),
				GetScopeName(static_cast<ESwuiProfileScope>(i)),
				Stat.Current, Stat.Avg, Stat.P50, Stat.P95, Stat.P99, Stat.Max);
		}

		UE_LOG(LogSwuiRuntime, Log, TEXT("Paint->Present Latency : Cur=%5.2fms | P95=%5.2fms | Max=%5.2fms"),
			S.PaintToPresentLatencyMs, S.PaintToPresentP95Ms, S.PaintToPresentMaxMs);
		UE_LOG(LogSwuiRuntime, Log, TEXT("Dirty Surface          : %d / %d px (%.1f%% dirty)"),
			static_cast<int32>(S.DirtyPixels), static_cast<int32>(S.FullSurfacePixels), S.DirtyPercent);
		UE_LOG(LogSwuiRuntime, Log, TEXT("Traffic Rates          : StateUpdates=%u/s | Input=%u/s (Coalesced=%u/s)"),
			S.StateUpdatesPerSec, S.InputEventsPerSec, S.InputCoalescedPerSec);
		UE_LOG(LogSwuiRuntime, Log, TEXT("================================================================================"));
	}
}

const TCHAR* FSwuiProfiler::GetScopeName(ESwuiProfileScope Scope)
{
	switch (Scope)
	{
	case ESwuiProfileScope::GameThreadTotal: return TEXT("Game-Thread SWUI Total");
	case ESwuiProfileScope::CefMessageLoop:  return TEXT("CEF Message Loop");
	case ESwuiProfileScope::StateSync:       return TEXT("State Sync & Diff");
	case ESwuiProfileScope::JsDispatch:      return TEXT("JS Event Dispatch");
	case ESwuiProfileScope::CefPaint:        return TEXT("CEF Paint Callback");
	case ESwuiProfileScope::CpuCopy:         return TEXT("CPU Staging Memcpy");
	case ESwuiProfileScope::GpuUpload:       return TEXT("GPU Upload / Blit");
	case ESwuiProfileScope::PresentWait:     return TEXT("Present Wait");
	default:                                 return TEXT("Unknown");
	}
}

void FSwuiProfiler::RegisterConsoleCommands()
{
	CmdSwuiStats = IConsoleManager::Get().RegisterConsoleCommand(
		TEXT("swui.stats"),
		TEXT("Prints a current SWUI runtime performance snapshot to log."),
		FConsoleCommandDelegate::CreateStatic(&FSwuiProfiler::DumpStatsToLog, false),
		ECVF_Default);

	CmdSwuiStatsVerbose = IConsoleManager::Get().RegisterConsoleCommand(
		TEXT("swui.stats.verbose"),
		TEXT("Prints a detailed SWUI runtime performance snapshot including percentiles to log."),
		FConsoleCommandDelegate::CreateStatic(&FSwuiProfiler::DumpStatsToLog, true),
		ECVF_Default);

	CmdSwuiProfileStart = IConsoleManager::Get().RegisterConsoleCommand(
		TEXT("swui.profile.start"),
		TEXT("Starts recording a SWUI performance profiling session."),
		FConsoleCommandDelegate::CreateStatic(&FSwuiProfiler::StartCapture),
		ECVF_Default);

	CmdSwuiProfileStop = IConsoleManager::Get().RegisterConsoleCommand(
		TEXT("swui.profile.stop"),
		TEXT("Stops recording the active SWUI performance profiling session."),
		FConsoleCommandDelegate::CreateStatic(&FSwuiProfiler::StopCapture),
		ECVF_Default);

	CmdSwuiProfileSave = IConsoleManager::Get().RegisterConsoleCommand(
		TEXT("swui.profile.save"),
		TEXT("Saves the recorded SWUI performance profiling session report to Saved/Profiling."),
		FConsoleCommandDelegate::CreateLambda([]()
		{
			FString SavedPath;
			FSwuiProfiler::SaveCapture(SavedPath);
		}),
		ECVF_Default);

	CmdSwuiBenchmark = IConsoleManager::Get().RegisterConsoleCommand(
		TEXT("swui.benchmark"),
		TEXT("Runs an automated multi-frame performance benchmark (default: 300 frames). Usage: swui.benchmark [num_frames|stop]"),
		FConsoleCommandWithArgsDelegate::CreateLambda([](const TArray<FString>& Args)
		{
			if (Args.Num() > 0 && Args[0].Equals(TEXT("stop"), ESearchCase::IgnoreCase))
			{
				FSwuiProfiler::CancelBenchmark();
			}
			else
			{
				int32 Frames = 300;
				if (Args.Num() > 0)
				{
					Frames = FMath::Clamp(FCString::Atoi(*Args[0]), 30, 10000);
				}
				FSwuiProfiler::RunBenchmark(Frames);
			}
		}),
		ECVF_Default);
}

void FSwuiProfiler::UnregisterConsoleCommands()
{
	if (CmdSwuiStats)
	{
		IConsoleManager::Get().UnregisterConsoleObject(CmdSwuiStats);
		CmdSwuiStats = nullptr;
	}
	if (CmdSwuiStatsVerbose)
	{
		IConsoleManager::Get().UnregisterConsoleObject(CmdSwuiStatsVerbose);
		CmdSwuiStatsVerbose = nullptr;
	}
	if (CmdSwuiProfileStart)
	{
		IConsoleManager::Get().UnregisterConsoleObject(CmdSwuiProfileStart);
		CmdSwuiProfileStart = nullptr;
	}
	if (CmdSwuiProfileStop)
	{
		IConsoleManager::Get().UnregisterConsoleObject(CmdSwuiProfileStop);
		CmdSwuiProfileStop = nullptr;
	}
	if (CmdSwuiProfileSave)
	{
		IConsoleManager::Get().UnregisterConsoleObject(CmdSwuiProfileSave);
		CmdSwuiProfileSave = nullptr;
	}
	if (CmdSwuiBenchmark)
	{
		IConsoleManager::Get().UnregisterConsoleObject(CmdSwuiBenchmark);
		CmdSwuiBenchmark = nullptr;
	}
}
