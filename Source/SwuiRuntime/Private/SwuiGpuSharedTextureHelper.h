#pragma once

#include "CoreMinimal.h"
#include "RHI.h"
#include "RHICommandList.h"

#if PLATFORM_WINDOWS
#include "Windows/AllowWindowsPlatformTypes.h"
#include <d3d11.h>
#include <d3d11_1.h>
#include <d3d11on12.h>
#include <d3d12.h>
#include <dxgi1_4.h>
#include "Windows/HideWindowsPlatformTypes.h"
#endif

/**
 * Native DirectX 12 & DirectX 11 GPU Shared Texture Blitter for SWUI.
 *
 * CEF renders into a shared Direct3D 11 texture in windowless GPU accelerated mode
 * and passes the DXGI shared HANDLE via OnAcceleratedPaint.
 * Per CEF specification, that shared handle is only valid for the lifetime of the
 * OnAcceleratedPaint callback.
 *
 * This helper performs a direct GPU-to-GPU copy synchronously on the CEF callback thread
 * before OnAcceleratedPaint returns, opening the shared handle on the native D3D11 or D3D12
 * device and copying the subresource into Unreal's target FRHITexture with zero CPU staging
 * and zero PCIe upload latency.
 */
class FSwuiGpuSharedTextureHelper
{
public:
	FSwuiGpuSharedTextureHelper();
	~FSwuiGpuSharedTextureHelper();

	/** Returns true if the active Unreal RHI supports GPU shared textures (D3D11 or D3D12). */
	static bool IsGpuAccelerationSupported();

	/**
	 * Synchronously blits from CEF's shared texture handle to the destination Unreal RHI texture.
	 * Must be called inside OnAcceleratedPaint before the callback returns to CEF.
	 */
	bool BlitSharedTexture(void* SharedHandle, FRHITexture* DestRHI, int32 Width, int32 Height);

	/** Clean up cached GPU objects and resources. */
	void Shutdown();

private:
#if PLATFORM_WINDOWS
	bool BlitD3D11(void* SharedHandle, FRHITexture* DestRHI, int32 Width, int32 Height);
	bool BlitD3D12(void* SharedHandle, FRHITexture* DestRHI, int32 Width, int32 Height);

	FCriticalSection BlitMutex;

	// D3D11 cached objects
	void* LastSharedHandle = nullptr;
	ID3D11Texture2D* CachedD3D11SharedTex = nullptr;

	// D3D11On12 interop objects for D3D12 RHI
	ID3D11Device* D3D11On12BaseDevice = nullptr;
	ID3D11On12Device* D3D11On12Device = nullptr;
	ID3D11DeviceContext* D3D11On12Context = nullptr;
	ID3D11Resource* CachedWrappedD3D12Dst = nullptr;
	ID3D11Resource* CachedD3D11On12SharedTex = nullptr;
	void* LastD3D12NativeDst = nullptr;
	void* LastD3D12SharedHandle = nullptr;
#endif
};
