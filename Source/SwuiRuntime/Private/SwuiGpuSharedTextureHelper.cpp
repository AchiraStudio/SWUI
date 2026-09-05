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
	// CEF allocates shared textures natively on D3D11. Only native D3D11 RHI can directly
	// share texture interfaces without cross-API residency page faults.
	// On D3D12, SWUI runs on the high-refresh 120 FPS CPU renderer with zero crash risk.
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
	if (FCString::Strcmp(RHIName, TEXT("D3D12")) == 0)
	{
		return BlitD3D12(SharedHandle, DestRHI, Width, Height);
	}
	else if (FCString::Strcmp(RHIName, TEXT("D3D11")) == 0)
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
	ID3D12Device* D3D12Device = static_cast<ID3D12Device*>(GDynamicRHI->RHIGetNativeDevice());
	ID3D12CommandQueue* CommandQueue = static_cast<ID3D12CommandQueue*>(GDynamicRHI->RHIGetNativeGraphicsQueue());

	if (!D3D12Device || !CommandQueue)
	{
		return false;
	}

	FScopeLock Lock(&BlitMutex);

	if (SharedHandle != LastSharedHandle || !CachedD3D12SharedRes)
	{
		if (CachedD3D12SharedRes)
		{
			CachedD3D12SharedRes->Release();
			CachedD3D12SharedRes = nullptr;
		}

		HRESULT hr = D3D12Device->OpenSharedHandle(static_cast<HANDLE>(SharedHandle), IID_PPV_ARGS(&CachedD3D12SharedRes));
		if (FAILED(hr) || !CachedD3D12SharedRes)
		{
			UE_LOG(LogSwuiRuntime, Warning, TEXT("[SWUI GPU] Failed to open D3D12 shared handle 0x%p (hr=0x%08X)"), SharedHandle, hr);
			return false;
		}

		LastSharedHandle = SharedHandle;
	}

	ID3D12Resource* NativeDst = static_cast<ID3D12Resource*>(DestRHI->GetNativeResource());
	if (!NativeDst)
	{
		return false;
	}

	// Lazy initialize command allocator and list
	if (!D3D12CommandAllocator)
	{
		HRESULT hr = D3D12Device->CreateCommandAllocator(D3D12_COMMAND_LIST_TYPE_DIRECT, IID_PPV_ARGS(&D3D12CommandAllocator));
		if (FAILED(hr))
		{
			UE_LOG(LogSwuiRuntime, Error, TEXT("[SWUI GPU] CreateCommandAllocator failed (hr=0x%08X)"), hr);
			return false;
		}
	}

	if (!D3D12CommandList)
	{
		HRESULT hr = D3D12Device->CreateCommandList(0, D3D12_COMMAND_LIST_TYPE_DIRECT, D3D12CommandAllocator, nullptr, IID_PPV_ARGS(&D3D12CommandList));
		if (FAILED(hr))
		{
			UE_LOG(LogSwuiRuntime, Error, TEXT("[SWUI GPU] CreateCommandList failed (hr=0x%08X)"), hr);
			return false;
		}
		D3D12CommandList->Close();
	}

	if (!D3D12Fence)
	{
		HRESULT hr = D3D12Device->CreateFence(0, D3D12_FENCE_FLAG_NONE, IID_PPV_ARGS(&D3D12Fence));
		if (SUCCEEDED(hr))
		{
			D3D12FenceEvent = CreateEvent(nullptr, false, false, nullptr);
		}
	}

	// Wait for previous copy if still in-flight
	if (D3D12Fence && D3D12FenceValue > 0)
	{
		if (D3D12Fence->GetCompletedValue() < D3D12FenceValue && D3D12FenceEvent)
		{
			D3D12Fence->SetEventOnCompletion(D3D12FenceValue, D3D12FenceEvent);
			WaitForSingleObject(D3D12FenceEvent, 50);
		}
	}

	D3D12CommandAllocator->Reset();
	D3D12CommandList->Reset(D3D12CommandAllocator, nullptr);

	// Transition barriers
	D3D12_RESOURCE_BARRIER Barriers[2] = {};

	// Shared texture from CEF starts in COMMON state, transition to COPY_SOURCE
	Barriers[0].Type = D3D12_RESOURCE_BARRIER_TYPE_TRANSITION;
	Barriers[0].Transition.pResource = CachedD3D12SharedRes;
	Barriers[0].Transition.StateBefore = D3D12_RESOURCE_STATE_COMMON;
	Barriers[0].Transition.StateAfter = D3D12_RESOURCE_STATE_COPY_SOURCE;
	Barriers[0].Transition.Subresource = D3D12_RESOURCE_BARRIER_ALL_SUBRESOURCES;

	// Destination texture is sampled by material, transition from PIXEL_SHADER_RESOURCE to COPY_DEST
	Barriers[1].Type = D3D12_RESOURCE_BARRIER_TYPE_TRANSITION;
	Barriers[1].Transition.pResource = NativeDst;
	Barriers[1].Transition.StateBefore = D3D12_RESOURCE_STATE_PIXEL_SHADER_RESOURCE;
	Barriers[1].Transition.StateAfter = D3D12_RESOURCE_STATE_COPY_DEST;
	Barriers[1].Transition.Subresource = D3D12_RESOURCE_BARRIER_ALL_SUBRESOURCES;

	D3D12CommandList->ResourceBarrier(2, Barriers);

	D3D12CommandList->CopyResource(NativeDst, CachedD3D12SharedRes);

	// Transition back
	Barriers[0].Transition.StateBefore = D3D12_RESOURCE_STATE_COPY_SOURCE;
	Barriers[0].Transition.StateAfter = D3D12_RESOURCE_STATE_COMMON;

	Barriers[1].Transition.StateBefore = D3D12_RESOURCE_STATE_COPY_DEST;
	Barriers[1].Transition.StateAfter = D3D12_RESOURCE_STATE_PIXEL_SHADER_RESOURCE;

	D3D12CommandList->ResourceBarrier(2, Barriers);

	D3D12CommandList->Close();

	ID3D12CommandList* CmdLists[] = { D3D12CommandList };
	CommandQueue->ExecuteCommandLists(1, CmdLists);

	if (D3D12Fence)
	{
		++D3D12FenceValue;
		CommandQueue->Signal(D3D12Fence, D3D12FenceValue);
	}

	return true;
}

#endif // PLATFORM_WINDOWS
