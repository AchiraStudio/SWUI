#include "SwuiGpuSharedTextureHelper.h"
#include "ISwuiRuntime.h"

FSwuiGpuSharedTextureHelper::FSwuiGpuSharedTextureHelper()
{
}

FSwuiGpuSharedTextureHelper::~FSwuiGpuSharedTextureHelper()
{
	Shutdown();
}

bool FSwuiGpuSharedTextureHelper::IsGpuAccelerationSupported()
{
#if PLATFORM_WINDOWS
	if (!GDynamicRHI)
	{
		return false;
	}
	const TCHAR* RHIName = GDynamicRHI->GetName();
	// CEF windowless rendering allocates shared surfaces natively on Direct3D 11 (ANGLE/DirectComposition).
	// Only native D3D11 RHI can directly share texture interfaces without cross-API residency page faults.
	// On D3D12, SWUI automatically runs on the high-refresh 120 FPS CPU renderer with zero crash risk.
	if (FCString::Strcmp(RHIName, TEXT("D3D11")) == 0)
	{
		return true;
	}
#endif
	return false;
}

void FSwuiGpuSharedTextureHelper::Shutdown()
{
#if PLATFORM_WINDOWS
	FScopeLock Lock(&BlitMutex);

	if (CachedD3D11SharedTex)
	{
		CachedD3D11SharedTex->Release();
		CachedD3D11SharedTex = nullptr;
	}

	if (CachedD3D12SharedRes)
	{
		CachedD3D12SharedRes->Release();
		CachedD3D12SharedRes = nullptr;
	}

	if (D3D12Fence)
	{
		if (D3D12FenceValue > 0 && D3D12Fence->GetCompletedValue() < D3D12FenceValue && D3D12FenceEvent)
		{
			D3D12Fence->SetEventOnCompletion(D3D12FenceValue, D3D12FenceEvent);
			WaitForSingleObject(D3D12FenceEvent, 100);
		}
		D3D12Fence->Release();
		D3D12Fence = nullptr;
	}

	if (D3D12FenceEvent)
	{
		CloseHandle(D3D12FenceEvent);
		D3D12FenceEvent = nullptr;
	}

	if (D3D12CommandList)
	{
		D3D12CommandList->Release();
		D3D12CommandList = nullptr;
	}

	if (D3D12CommandAllocator)
	{
		D3D12CommandAllocator->Release();
		D3D12CommandAllocator = nullptr;
	}

	LastSharedHandle = nullptr;
#endif
}

bool FSwuiGpuSharedTextureHelper::BlitSharedTexture(void* SharedHandle, FRHITexture* DestRHI, int32 Width, int32 Height)
{
	if (!SharedHandle || !DestRHI || !GDynamicRHI)
	{
		return false;
	}

#if PLATFORM_WINDOWS
	const TCHAR* RHIName = GDynamicRHI->GetName();
	if (FCString::Strcmp(RHIName, TEXT("D3D11")) == 0)
	{
		return BlitD3D11(SharedHandle, DestRHI, Width, Height);
	}
#endif

	return false;
}

#if PLATFORM_WINDOWS

bool FSwuiGpuSharedTextureHelper::BlitD3D11(void* SharedHandle, FRHITexture* DestRHI, int32 Width, int32 Height)
{
	ID3D11Device* Device = static_cast<ID3D11Device*>(GDynamicRHI->RHIGetNativeDevice());
	if (!Device)
	{
		return false;
	}

	FScopeLock Lock(&BlitMutex);

	if (SharedHandle != LastSharedHandle || !CachedD3D11SharedTex)
	{
		if (CachedD3D11SharedTex)
		{
			CachedD3D11SharedTex->Release();
			CachedD3D11SharedTex = nullptr;
		}

		HANDLE HandleCopy = static_cast<HANDLE>(SharedHandle);
		HRESULT hr = Device->OpenSharedResource(HandleCopy, __uuidof(ID3D11Texture2D), reinterpret_cast<void**>(&CachedD3D11SharedTex));
		if (FAILED(hr) || !CachedD3D11SharedTex)
		{
			// Try D3D11.1 OpenSharedResource1 for NT handles
			ID3D11Device1* Device1 = nullptr;
			if (SUCCEEDED(Device->QueryInterface(IID_PPV_ARGS(&Device1))) && Device1)
			{
				hr = Device1->OpenSharedResource1(HandleCopy, __uuidof(ID3D11Texture2D), reinterpret_cast<void**>(&CachedD3D11SharedTex));
				Device1->Release();
			}
		}

		if (FAILED(hr) || !CachedD3D11SharedTex)
		{
			UE_LOG(LogSwuiRuntime, Warning, TEXT("[SWUI GPU] Failed to open D3D11 shared resource handle 0x%p (hr=0x%08X)"), SharedHandle, hr);
			return false;
		}

		LastSharedHandle = SharedHandle;
	}

	ID3D11Texture2D* NativeDst = static_cast<ID3D11Texture2D*>(DestRHI->GetNativeResource());
	if (!NativeDst)
	{
		return false;
	}

	ID3D11DeviceContext* Context = nullptr;
	Device->GetImmediateContext(&Context);
	if (!Context)
	{
		return false;
	}

	Context->CopyResource(NativeDst, CachedD3D11SharedTex);
	Context->Release();

	return true;
}

bool FSwuiGpuSharedTextureHelper::BlitD3D12(void* SharedHandle, FRHITexture* DestRHI, int32 Width, int32 Height)
{
	// Cross-API D3D11-to-D3D12 shared handle blitting without 11on12 device interop causes GPU MMU page faults
	// when conflicting with Unreal Engine's internal D3D12 RHI resource state tracker.
	// On D3D12, SWUI safely routes through the CPU compatible renderer.
	return false;
}

#endif // PLATFORM_WINDOWS
