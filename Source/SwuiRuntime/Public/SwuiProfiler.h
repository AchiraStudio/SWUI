#pragma once

#include "CoreMinimal.h"
#include "HAL/PlatformTime.h"

enum class ESwuiProfileScope : uint8
{
	GameThreadTotal,
	CefMessageLoop,
	StateSync,
	JsDispatch,
	CefPaint,
	CpuCopy,
	GpuUpload,
	PresentWait,
	Count
};

struct FSwuiScopeStat
{
	static constexpr int32 Capacity = 120;
	float Samples[Capacity] = { 0.f };
	int32 Count = 0;
	int32 Index = 0;
	float Current = 0.f;
	float Min = 0.f;
	float Max = 0.f;
	float Avg = 0.f;
	float P50 = 0.f;
	float P95 = 0.f;
	float P99 = 0.f;

	void AddSample(float ValueMs);
	void RecomputeStats();
};

struct FSwuiProfilerSnapshot
{
	float UnrealFps = 0.f;
	float SwuiTargetFps = 60.f;
	float PresentedFps = 0.f;
	uint32 DroppedFrames = 0;
	uint32 SkippedFrames = 0;
	uint32 ActiveBrowserCount = 0;
	FString RenderBackendName;

	FSwuiScopeStat Scopes[static_cast<int32>(ESwuiProfileScope::Count)];

	float PaintToPresentLatencyMs = 0.f;
	float PaintToPresentP95Ms = 0.f;
	float PaintToPresentMaxMs = 0.f;

	int64 DirtyPixels = 0;
	int64 FullSurfacePixels = 0;
	float DirtyPercent = 0.f;

	uint32 StateUpdatesPerSec = 0;
	uint32 InputEventsPerSec = 0;
	uint32 InputCoalescedPerSec = 0;

	float LastLongTaskDurationMs = 0.f;
	uint32 TotalLongTaskCount = 0;
};

class SWUIRUNTIME_API FSwuiProfiler
{
public:
	static void Initialize();
	static void Shutdown();

	static bool IsProfilerOrStatsActive();
	static void RecordScopeTime(ESwuiProfileScope Scope, float DurationMs);

	static void RecordStateUpdate(uint32 UpdateCount = 1);
	static void RecordInputEvent(bool bCoalesced);
	static void RecordPixels(int64 DirtyPx, int64 FullSurfacePx);
	static void RecordDroppedFrame();
	static void RecordSkippedFrame();
	static void RecordPresentedFrame(float PaintToPresentLatencyMs);
	static void RecordLongTask(float DurationMs);

	static void Update(float DeltaTime, float CurrentEngineFps, float TargetSwuiFps, int32 BrowserCount, const FString& BackendName);

	static const FSwuiProfilerSnapshot& GetSnapshot();

	// Session capture commands (Phase 30: swui.profile.start / stop / save)
	static void StartCapture();
	static void StopCapture();
	static bool SaveCapture(FString& OutSavedPath);

	// Automated performance benchmark (Phase 31: swui.benchmark)
	static void RunBenchmark(int32 NumFrames = 300);
	static void CancelBenchmark();
	static bool IsBenchmarking();

	static void DumpStatsToLog(bool bVerbose);

	static const TCHAR* GetScopeName(ESwuiProfileScope Scope);

private:
	static void RegisterConsoleCommands();
	static void UnregisterConsoleCommands();
	static void FinishBenchmark();
};

#if !UE_BUILD_SHIPPING

class FSwuiProfilerScope
{
public:
	explicit FSwuiProfilerScope(ESwuiProfileScope InScope)
		: Scope(InScope)
	{
		if (FSwuiProfiler::IsProfilerOrStatsActive())
		{
			StartCycles = FPlatformTime::Cycles64();
		}
	}

	~FSwuiProfilerScope()
	{
		if (StartCycles > 0)
		{
			const uint64 EndCycles = FPlatformTime::Cycles64();
			const double ElapsedMs = FPlatformTime::ToMilliseconds64(EndCycles - StartCycles);
			FSwuiProfiler::RecordScopeTime(Scope, static_cast<float>(ElapsedMs));
		}
	}

private:
	ESwuiProfileScope Scope;
	uint64 StartCycles = 0;
};

#define SWUI_PROFILE_SCOPE(Scope) FSwuiProfilerScope SwuiProfileScope_##Scope(ESwuiProfileScope::Scope)

#else

#define SWUI_PROFILE_SCOPE(Scope)

#endif
