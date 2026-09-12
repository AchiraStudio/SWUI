#include "SwuiDocumentAsset.h"

USwuiDocumentAsset::USwuiDocumentAsset()
{
	DocumentId = NAME_None;
	EntryURL = TEXT("local://UI/out/index.html");
	Layer = ESwuiDocumentLayer::Level;
	LoadBehavior = ESwuiDocumentLoadBehavior::Lazy;
	Priority = ESwuiUpdatePriority::Normal;
	bIsPersistent = false;
	DefaultZOrder = 0;
	Width = 1920;
	Height = 1080;
	bIsTransparent = true;
	TextureParameterName = TEXT("SwuiTexture");
	FrameRateMode = ESwuiFrameRateMode::MatchGame;
	CustomFrameRate = 60;
	bEnableSleep = true;
	InactivitySleepDelay = 2.0f;
	RenderingMode = ESwuiRenderingMode::Auto;
	StateUpdatePolicy = ESwuiStateUpdatePolicy::OnChange;
}

FPrimaryAssetId USwuiDocumentAsset::GetPrimaryAssetId() const
{
	const FName Id = DocumentId.IsNone() ? GetFName() : DocumentId;
	return FPrimaryAssetId(TEXT("SwuiDocument"), Id);
}

FSwuiInstanceSettings USwuiDocumentAsset::ToInstanceSettings() const
{
	FSwuiInstanceSettings Settings;
	Settings.RenderingMode = RenderingMode;
	Settings.bIsHUD = (Layer == ESwuiDocumentLayer::Persistent);
	Settings.FrameRateMode = FrameRateMode;
	Settings.OverrideFrameRate = (FrameRateMode == ESwuiFrameRateMode::Fixed15 ||
								  FrameRateMode == ESwuiFrameRateMode::Fixed30 ||
								  FrameRateMode == ESwuiFrameRateMode::Fixed60 ||
								  FrameRateMode == ESwuiFrameRateMode::Fixed90 ||
								  FrameRateMode == ESwuiFrameRateMode::Fixed120) ? CustomFrameRate : 0;
	Settings.bEnableSleep = bEnableSleep;
	Settings.InactivitySleepDelay = InactivitySleepDelay;
	Settings.StateUpdatePolicy = StateUpdatePolicy;
	Settings.UiResolutionPreset = ESwuiUiResolutionPreset::Custom;
	Settings.CustomUiWidth = Width;
	Settings.CustomUiHeight = Height;
	return Settings;
}
