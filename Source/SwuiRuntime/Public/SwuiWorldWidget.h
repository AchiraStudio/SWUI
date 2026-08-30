#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "InputCoreTypes.h"
#include "SwuiWorldWidget.generated.h"

class USwuiView;
class UMaterialInterface;
class UMaterialInstanceDynamic;
class UTexture2D;
class UPrimitiveComponent;

/**
 * USwuiWorldWidget — Add this to any Actor to display a CEF-rendered web surface
 * on a 3D mesh in the game world (e.g. monitor screens, panels, kiosks).
 *
 * Unlike USwui (which targets the 2D screen HUD), USwuiWorldWidget creates its
 * own USwuiView independently of USwuiSubsystem and renders into a texture that
 * is applied to a BaseMaterial via a UMaterialInstanceDynamic.
 *
 * Usage:
 *   1. Add USwuiWorldWidget to your Actor.
 *   2. Set URL, RenderWidth, RenderHeight.
 *   3. Set BaseMaterial to a material with a Texture2D parameter named by
 *      TextureParameterName.
 *   4. (Optional) Set TargetMesh — the component will auto-apply the material
 *      instance to it on BeginPlay.
 *   5. For interaction: line-trace against the mesh in your PlayerController,
 *      read the UV1 texture coordinate from FHitResult (e.g. via
 *      UGameplayStatics::FindCollisionUV), and call ForwardHitUVToBrowser().
 *
 * Multiple USwuiWorldWidget components can coexist simultaneously; each owns
 * an independent CEF browser instance sharing the same CEF process.
 *
 * Note: The CEF message loop is pumped by USwuiSubsystem::Tick (which runs when
 * the SwuiRuntime plugin is active). World widgets do NOT need USwuiSubsystem to
 * manage their view — they only benefit from its global CEF pump.
 */
UCLASS(ClassGroup=Swui, Blueprintable, meta=(BlueprintSpawnableComponent))
class SWUIRUNTIME_API USwuiWorldWidget : public UActorComponent
{
	GENERATED_BODY()

public:
	USwuiWorldWidget();

	// ---- Content -------------------------------------------------------

	/** URL to load. Bare paths and swui:// resolve under Content/ (.html implicit).
	 *  http://, https://, and localhost URIs are passed through directly. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SimpleWebUI|World")
	FString URL;

	// ---- Render Resolution ---------------------------------------------

	/** Width of the CEF browser render buffer (pixels). */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SimpleWebUI|World",
		meta=(ClampMin="1", ClampMax="4096"))
	int32 RenderWidth = 1280;

	/** Height of the CEF browser render buffer (pixels). */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SimpleWebUI|World",
		meta=(ClampMin="1", ClampMax="4096"))
	int32 RenderHeight = 720;

	// ---- Material ------------------------------------------------------

	/** Base material applied to TargetMesh. Must expose a Texture2D parameter
	 *  with the name set in TextureParameterName. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SimpleWebUI|World")
	UMaterialInterface* BaseMaterial = nullptr;

	/** Name of the Texture2D parameter inside BaseMaterial that receives the
	 *  browser render texture. */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category="SimpleWebUI|World")
	FName TextureParameterName = TEXT("SwuiTexture");

	/** Optional: primitive component on this Actor to receive the dynamic
	 *  material instance automatically on BeginPlay. If null, retrieve
	 *  GetMaterialInstance() and apply it yourself. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SimpleWebUI|World")
	UPrimitiveComponent* TargetMesh = nullptr;

	/** Material slot index on TargetMesh to apply the dynamic material to. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SimpleWebUI|World",
		meta=(ClampMin="0"))
	int32 TargetMeshMaterialIndex = 0;

	// ---- Performance ---------------------------------------------------

	/** CEF windowless frame rate for this surface.
	 *  0 = use the engine default (up to 300 Hz). For most world panels 30–60 is sufficient. */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category="SimpleWebUI|World|Performance",
		meta=(ClampMin="0", ClampMax="300"))
	int32 FrameRate = 30;

	// ---- Interaction API -----------------------------------------------

	/**
	 * Forward a line-trace hit UV coordinate to the CEF browser as a mouse event.
	 *
	 * Call this from your PlayerController when a line trace hits the mesh this
	 * component lives on. Use the UV1 texture coordinate from FHitResult
	 * (via UGameplayStatics::FindCollisionUV) as the UV argument.
	 *
	 * @param UV          Normalised surface UV in [0,1]x[0,1].
	 * @param bIsMove     Send a mouse-move event at this UV.
	 * @param bIsDown     Send a mouse button press at this UV.
	 * @param bIsUp       Send a mouse button release at this UV.
	 * @param MouseButton The button to use for press/release (default: left).
	 */
	UFUNCTION(BlueprintCallable, Category="SimpleWebUI|World")
	void ForwardHitUVToBrowser(
		FVector2D UV,
		bool bIsMove,
		bool bIsDown,
		bool bIsUp,
		FKey MouseButton);


	/**
	 * Forward a scroll event at the given UV position to the CEF browser.
	 *
	 * @param UV     Normalised UV in [0,1]x[0,1].
	 * @param DeltaX Horizontal scroll delta (usually 0).
	 * @param DeltaY Vertical scroll delta (positive = scroll up).
	 */
	UFUNCTION(BlueprintCallable, Category="SimpleWebUI|World")
	void ForwardScrollAtUV(FVector2D UV, float DeltaX, float DeltaY);

	/** Execute arbitrary JavaScript in the browser owned by this surface. */
	UFUNCTION(BlueprintCallable, Category="SimpleWebUI|World")
	void ExecuteJavaScript(const FString& Script);

	/** Navigate to a new URL. Supports the same URI schemes as the URL property. */
	UFUNCTION(BlueprintCallable, Category="SimpleWebUI|World")
	void LoadURL(const FString& NewURL);

	/** Enable or disable pointer (mouse) input forwarding to the browser.
	 *  Must be true for ForwardHitUVToBrowser to deliver events. */
	UFUNCTION(BlueprintCallable, Category="SimpleWebUI|World")
	void SetInteractionEnabled(bool bEnabled);

	// ---- Accessors -----------------------------------------------------

	/** Returns the render texture. Use this to set the texture on materials manually. */
	UFUNCTION(BlueprintPure, Category="SimpleWebUI|World")
	UTexture2D* GetTexture() const;

	/** Returns the dynamic material instance created from BaseMaterial.
	 *  Null until BeginPlay completes and BaseMaterial is valid. */
	UFUNCTION(BlueprintPure, Category="SimpleWebUI|World")
	UMaterialInstanceDynamic* GetMaterialInstance() const { return MaterialInstance; }

	/** Returns the underlying USwuiView (for advanced / C++ use). */
	UFUNCTION(BlueprintPure, Category="SimpleWebUI|World")
	USwuiView* GetView() const { return View; }

private:
	virtual void BeginPlay() override;
	virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;
	virtual void TickComponent(
		float DeltaTime,
		ELevelTick TickType,
		FActorComponentTickFunction* ThisTickFunction) override;

	/** Creates the USwuiView, initialises the CEF browser, and loads the URL. */
	void InitView();

	/** Creates a UMaterialInstanceDynamic from BaseMaterial, binds the texture,
	 *  and applies it to TargetMesh if set. */
	void ApplyMaterialToMesh();

	UPROPERTY()
	USwuiView* View = nullptr;

	UPROPERTY()
	UMaterialInstanceDynamic* MaterialInstance = nullptr;
};
