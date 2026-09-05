#pragma once

#include "CoreMinimal.h"
#include "RHI.h"
#include "RHICommandList.h"

#if PLATFORM_WINDOWS
#include "Windows/AllowWindowsPlatformTypes.h"
#include <d3d11.h>
#include <d3d11_1.h>
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

	// D3D12 cached objects
	ID3D12CommandAllocator* D3D12CommandAllocator = nullptr;
	ID3D12GraphicsCommandList* D3D12CommandList = nullptr;
	ID3D12Fence* D3D12Fence = nullptr;
	HANDLE D3D12FenceEvent = nullptr;
	uint64 D3D12FenceValue = 0;

	// Cache of opened shared resources to avoid re-opening every frame
	void* LastSharedHandle = nullptr;
	ID3D11Texture2D* CachedD3D11SharedTex = nullptr;
	ID3D12Resource* CachedD3D12SharedRes = nullptr;
#endif
};
