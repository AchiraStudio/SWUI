#pragma once

#include "CoreMinimal.h"
#include "SwuiTypes.h"

class SWUIRUNTIME_API FSwuiScheduler
{
public:
	FSwuiScheduler();

	void Initialize(ESwuiFrameRateMode InMode, int32 InCustomFps = 60, bool bInEnableSleep = true, float InactivitySleepDelay = 2.0f);

	void SetFrameRateMode(ESwuiFrameRateMode InMode, int32 InCustomFps = 60);
	ESwuiFrameRateMode GetFrameRateMode() const { return FrameRateMode; }

	void SetEnableSleep(bool bInEnable) { bEnableSleep = bInEnable; }
	bool IsSleepEnabled() const { return bEnableSleep; }

	ESwuiSleepState GetSleepState() const { return SleepState; }
	float GetEffectiveTargetFps() const { return EffectiveTargetFps; }

	/** Called when user input, state update, animation or visual event occurs. */
	void NotifyActivity(bool bHighPriority = false);

	/** Force immediate wake from sleep to active cadence. */
	void Wake();

	/** Put UI to sleep immediately. */
	void Sleep();

	/**
	 * Evaluates whether a browser frame should be produced on this engine tick.
	 * Returns true if due, and updates internal timers.
	 */
	bool Tick(double Now, float DeltaTime, bool bHasPendingScriptOrForce);

	/** Returns time since last recorded activity in seconds. */
	double GetTimeSinceLastActivity() const;

private:
	ESwuiFrameRateMode FrameRateMode = ESwuiFrameRateMode::Fixed60;
	ESwuiSleepState SleepState = ESwuiSleepState::Active;

	int32 ConfiguredFps = 60;
	float EffectiveTargetFps = 60.f;

	bool bEnableSleep = true;
	float SleepDelaySeconds = 2.0f;
	float HysteresisDuration = 2.0f;

	double LastActivityTime = 0.0;
	double LastFrameProducedTime = 0.0;
	double AccumulatedFrameTime = 0.0;
	double HighActivityExpireTime = 0.0;

	void UpdateAdaptiveState(double Now);
};
