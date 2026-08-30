#include "SwuiWorldWidget.h"

#include "SwuiView.h"
#include "SwuiTypes.h"

#include "Engine/Engine.h"
#include "Engine/Texture2D.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "Materials/MaterialInterface.h"
#include "Components/PrimitiveComponent.h"
#include "GameFramework/Actor.h"

DEFINE_LOG_CATEGORY_STATIC(LogSwuiWorld, Log, All);

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

USwuiWorldWidget::USwuiWorldWidget()
{
	// Enable Tick so we can call TickDeferredUpload each frame.
	PrimaryComponentTick.bCanEverTick = true;
	PrimaryComponentTick.bStartWithTickEnabled = true;
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

void USwuiWorldWidget::BeginPlay()
{
	Super::BeginPlay();
	InitView();
}

void USwuiWorldWidget::InitView()
{
	if (View)
	{
		UE_LOG(LogSwuiWorld, Warning, TEXT("[SwuiWorldWidget] InitView called but View already exists — skipping."));
		return;
	}

	if (RenderWidth <= 0 || RenderHeight <= 0)
	{
		UE_LOG(LogSwuiWorld, Warning, TEXT("[SwuiWorldWidget] RenderWidth or RenderHeight is <= 0 — aborting init."));
		return;
	}

	View = NewObject<USwuiView>(this);
	View->DefaultURL    = URL;
	View->Width         = RenderWidth;
	View->Height        = RenderHeight;
	View->bIsTransparent = true;
	View->BaseMaterial  = BaseMaterial;
	View->TextureParameterName = TextureParameterName;

	// World-space surfaces use simple per-view settings (no HUD lockstep, no
	// external begin frames). Frame rate can be tuned via the FrameRate property.
	FSwuiInstanceSettings Settings;
	Settings.bIsHUD                    = false;
	Settings.bUseUEFrameLockedBrowser  = false;
	Settings.bUseExternalBeginFrames   = false;
	Settings.MaxBrowserFramesPerSecond = FrameRate > 0 ? FrameRate : 30;
	Settings.OverrideFrameRate         = FrameRate;
	Settings.UiResolutionPreset        = ESwuiUiResolutionPreset::Custom;
	Settings.CustomUiWidth             = RenderWidth;
	Settings.CustomUiHeight            = RenderHeight;

	View->Init(Settings);

	UE_LOG(LogSwuiWorld, Log, TEXT("[SwuiWorldWidget] View initialised: %dx%d  URL=%s"),
		RenderWidth, RenderHeight, *URL);

	// Bind texture to material and apply to mesh.
	ApplyMaterialToMesh();
}

void USwuiWorldWidget::ApplyMaterialToMesh()
{
	if (!View) return;

	UTexture2D* Texture = View->GetTexture();
	if (!Texture)
	{
		UE_LOG(LogSwuiWorld, Warning,
			TEXT("[SwuiWorldWidget] GetTexture() returned null — material will not be applied yet."));
		return;
	}

	if (!BaseMaterial || TextureParameterName.IsNone())
	{
		UE_LOG(LogSwuiWorld, Verbose,
			TEXT("[SwuiWorldWidget] No BaseMaterial or TextureParameterName set — skipping material apply."));
		return;
	}

	if (!MaterialInstance)
	{
		MaterialInstance = UMaterialInstanceDynamic::Create(BaseMaterial, this);
		if (!MaterialInstance)
		{
			UE_LOG(LogSwuiWorld, Error,
				TEXT("[SwuiWorldWidget] Failed to create UMaterialInstanceDynamic from BaseMaterial."));
			return;
		}
	}

	MaterialInstance->SetTextureParameterValue(TextureParameterName, Texture);

	if (TargetMesh)
	{
		TargetMesh->SetMaterial(TargetMeshMaterialIndex, MaterialInstance);
		UE_LOG(LogSwuiWorld, Log,
			TEXT("[SwuiWorldWidget] Applied dynamic material to TargetMesh slot %d."),
			TargetMeshMaterialIndex);
	}
}

void USwuiWorldWidget::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
	if (View)
	{
		// Destroy the underlying CEF browser.
		View->BeginDestroy();
		View = nullptr;
	}

	MaterialInstance = nullptr;
	Super::EndPlay(EndPlayReason);
}

void USwuiWorldWidget::TickComponent(
	float DeltaTime,
	ELevelTick TickType,
	FActorComponentTickFunction* ThisTickFunction)
{
	Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

	if (!View) return;

	// Pump CEF deferred uploads — mirrors what USwuiSubsystem::Tick does for
	// its view. The global CefDoMessageLoopWork() is already pumped by the
	// subsystem Tick; we only need to drive the upload pipeline for our view.
	View->NotifySubsystemTick();
	View->TickDeferredUpload();

	// Re-bind texture each tick until it is valid (texture is created async
	// on first OnPaint from CEF, which may arrive after BeginPlay returns).
	if (MaterialInstance && View->GetTexture())
	{
		UTexture* Current = nullptr;
		MaterialInstance->GetTextureParameterValue(TextureParameterName, Current);
		if (Current != View->GetTexture())
		{
			MaterialInstance->SetTextureParameterValue(TextureParameterName, View->GetTexture());
		}
	}
	else if (!MaterialInstance && View->GetTexture())
	{
		// Texture has just become available for the first time — create the material.
		ApplyMaterialToMesh();
	}
}

// ---------------------------------------------------------------------------
// Interaction API
// ---------------------------------------------------------------------------

void USwuiWorldWidget::ForwardHitUVToBrowser(
	FVector2D UV,
	bool bIsMove,
	bool bIsDown,
	bool bIsUp,
	FKey MouseButton)
{
	if (!View) return;

	int32 BX = 0, BY = 0;
	if (!View->UVToBrowserPixel(UV, BX, BY))
	{
		UE_LOG(LogSwuiWorld, Verbose,
			TEXT("[SwuiWorldWidget] ForwardHitUVToBrowser: UV (%.3f, %.3f) out of [0,1] range — ignored."),
			UV.X, UV.Y);
		return;
	}

	if (bIsMove)
	{
		View->ForwardMouseMoveAtPixel(BX, BY);
	}
	if (bIsDown)
	{
		View->ForwardMouseButtonAtPixel(BX, BY, MouseButton, /*bMouseUp=*/false);
	}
	if (bIsUp)
	{
		View->ForwardMouseButtonAtPixel(BX, BY, MouseButton, /*bMouseUp=*/true);
	}
}

void USwuiWorldWidget::ForwardScrollAtUV(FVector2D UV, float DeltaX, float DeltaY)
{
	if (!View) return;

	int32 BX = 0, BY = 0;
	if (!View->UVToBrowserPixel(UV, BX, BY)) return;

	View->ForwardMouseWheelAtPixel(BX, BY, DeltaX, DeltaY);
}

// ---------------------------------------------------------------------------
// Control API
// ---------------------------------------------------------------------------

void USwuiWorldWidget::ExecuteJavaScript(const FString& Script)
{
	if (View) View->ExecuteJavaScript(Script);
}

void USwuiWorldWidget::LoadURL(const FString& NewURL)
{
	if (View) View->LoadURL(NewURL);
}

void USwuiWorldWidget::SetInteractionEnabled(bool bEnabled)
{
	if (View) View->SetPointerInputEnabled(bEnabled);
}

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

UTexture2D* USwuiWorldWidget::GetTexture() const
{
	return View ? View->GetTexture() : nullptr;
}
