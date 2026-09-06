#include "SwuiScheduler.h"
#include "SwuiCVars.h"
#include "ISwuiRuntime.h"
#include "HAL/PlatformTime.h"

FSwuiScheduler::FSwuiScheduler()
{
	LastActivityTime = FPlatformTime::Seconds();
	LastFrameProducedTime = LastActivityTime;
}

void FSwuiScheduler::Initialize(ESwuiFrameRateMode InMode, int32 InCustomFps, bool bInEnableSleep, float InactivitySleepDelay)
{
	FrameRateMode = InMode;
	ConfiguredFps = FMath::Clamp(InCustomFps > 0 ? InCustomFps : 60, 1, 300);
	bEnableSleep = bInEnableSleep;
	SleepDelaySeconds = FMath::Max(0.5f, InactivitySleepDelay);
	HysteresisDuration = 2.0f;

	LastActivityTime = FPlatformTime::Seconds();
	LastFrameProducedTime = LastActivityTime;
	HighActivityExpireTime = 0.0;
	AccumulatedFrameTime = 0.0;
	SleepState = ESwuiSleepState::Active;

	UpdateAdaptiveState(LastActivityTime);
}

void FSwuiScheduler::SetFrameRateMode(ESwuiFrameRateMode InMode, int32 InCustomFps)
{
	FrameRateMode = InMode;
	if (InCustomFps > 0)
	{
		ConfiguredFps = FMath::Clamp(InCustomFps, 1, 300);
	}
	Wake();
}

void FSwuiScheduler::NotifyActivity(bool bHighPriority)
{
	const double Now = FPlatformTime::Seconds();
	LastActivityTime = Now;

	if (bHighPriority)
	{
		HighActivityExpireTime = Now + HysteresisDuration;
	}

	if (SleepState == ESwuiSleepState::Sleeping)
	{
		SleepState = ESwuiSleepState::Active;
		UE_LOG(LogSwuiRuntime, Verbose, TEXT("[SWUI Scheduler] UI woke from sleep."));
	}
}

void FSwuiScheduler::Wake()
{
	const double Now = FPlatformTime::Seconds();
	LastActivityTime = Now;
	HighActivityExpireTime = Now + HysteresisDuration;
	SleepState = ESwuiSleepState::Active;
	UpdateAdaptiveState(Now);
}

void FSwuiScheduler::Sleep()
{
	if (bEnableSleep)
	{
		SleepState = ESwuiSleepState::Sleeping;
		EffectiveTargetFps = 0.f;
		UE_LOG(LogSwuiRuntime, Verbose, TEXT("[SWUI Scheduler] UI entered sleep."));
	}
}

double FSwuiScheduler::GetTimeSinceLastActivity() const
{
	return FPlatformTime::Seconds() - LastActivityTime;
}

void FSwuiScheduler::UpdateAdaptiveState(double Now)
{
	switch (FrameRateMode)
	{
	case ESwuiFrameRateMode::MatchGame:
		EffectiveTargetFps = 0.f; // 0 = match game
		SleepState = ESwuiSleepState::Active;
		return;

	case ESwuiFrameRateMode::Fixed15:
		EffectiveTargetFps = 15.f;
		SleepState = ESwuiSleepState::Active;
		return;

	case ESwuiFrameRateMode::Fixed30:
		EffectiveTargetFps = 30.f;
		SleepState = ESwuiSleepState::Active;
		return;

	case ESwuiFrameRateMode::Fixed60:
		EffectiveTargetFps = 60.f;
		SleepState = ESwuiSleepState::Active;
		return;

	case ESwuiFrameRateMode::Fixed90:
		EffectiveTargetFps = 90.f;
		SleepState = ESwuiSleepState::Active;
		return;

	case ESwuiFrameRateMode::Fixed120:
		EffectiveTargetFps = 120.f;
		SleepState = ESwuiSleepState::Active;
		return;

	case ESwuiFrameRateMode::Adaptive:
	default:
		break;
	}

	// Adaptive Logic
	const double Inactivity = Now - LastActivityTime;

	if (bEnableSleep && Inactivity >= SleepDelaySeconds)
	{
		SleepState = ESwuiSleepState::Sleeping;
		EffectiveTargetFps = 0.f;
	}
	else if (Now < HighActivityExpireTime)
	{
		// Active user interaction (mouse move, button click, rapid state changes) -> 120 Hz
		SleepState = ESwuiSleepState::Active;
		EffectiveTargetFps = 120.f;
	}
	else if (Inactivity < 1.0)
	{
		// Normal UI activity -> 60 Hz
		SleepState = ESwuiSleepState::Active;
		EffectiveTargetFps = 60.f;
	}
	else
	{
		// Low activity / idle -> 30 Hz
		SleepState = ESwuiSleepState::Idle;
		EffectiveTargetFps = 30.f;
	}
}

bool FSwuiScheduler::Tick(double Now, float DeltaTime, bool bHasPendingScriptOrForce)
{
	if (bHasPendingScriptOrForce)
	{
		NotifyActivity(false);
		Wake();
		LastFrameProducedTime = Now;
		AccumulatedFrameTime = 0.0;
		return true;
	}

	UpdateAdaptiveState(Now);

	if (SleepState == ESwuiSleepState::Sleeping)
	{
		return false;
	}

	if (FrameRateMode == ESwuiFrameRateMode::MatchGame)
	{
		LastFrameProducedTime = Now;
		return true;
	}

	if (EffectiveTargetFps <= 0.f)
	{
		return false;
	}

	const double MinInterval = 1.0 / static_cast<double>(EffectiveTargetFps);
	const double Tolerance = FMath::Min(0.0015, MinInterval * 0.15);

	AccumulatedFrameTime += FMath::Max(0.0f, DeltaTime);

	if (AccumulatedFrameTime >= (MinInterval - Tolerance) || (Now - LastFrameProducedTime) >= MinInterval)
	{
		AccumulatedFrameTime = FMath::Max(0.0, AccumulatedFrameTime - MinInterval);
		LastFrameProducedTime = Now;
		return true;
	}

	return false;
}
