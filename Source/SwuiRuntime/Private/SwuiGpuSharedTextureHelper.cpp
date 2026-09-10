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

	if (CachedWrappedD3D12Dst)
	{
		CachedWrappedD3D12Dst->Release();
		CachedWrappedD3D12Dst = nullptr;
	}

	if (CachedD3D11On12SharedTex)
	{
		CachedD3D11On12SharedTex->Release();
		CachedD3D11On12SharedTex = nullptr;
	}

	if (D3D11On12Context)
	{
		D3D11On12Context->Release();
		D3D11On12Context = nullptr;
	}

	if (D3D11On12Device)
	{
		D3D11On12Device->Release();
		D3D11On12Device = nullptr;
	}

	if (D3D11On12BaseDevice)
	{
		D3D11On12BaseDevice->Release();
		D3D11On12BaseDevice = nullptr;
	}

	LastSharedHandle = nullptr;
	LastD3D12NativeDst = nullptr;
	LastD3D12SharedHandle = nullptr;
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
	else if (FCString::Strcmp(RHIName, TEXT("D3D12")) == 0)
	{
		return BlitD3D12(SharedHandle, DestRHI, Width, Height);
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
			UE_LOG(LogSwuiRuntime, Warning, TEXT("[SWUI GPU D3D11] Failed to open shared resource handle 0x%p (hr=0x%08X)"), SharedHandle, hr);
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
	Context->Flush();
	Context->Release();

	return true;
}

bool FSwuiGpuSharedTextureHelper::BlitD3D12(void* SharedHandle, FRHITexture* DestRHI, int32 Width, int32 Height)
{
	ID3D12Device* D3D12Device = static_cast<ID3D12Device*>(GDynamicRHI->RHIGetNativeDevice());
	ID3D12CommandQueue* CommandQueue = static_cast<ID3D12CommandQueue*>(GDynamicRHI->RHIGetNativeGraphicsQueue());
	ID3D12Resource* NativeDst = static_cast<ID3D12Resource*>(DestRHI->GetNativeResource());

	if (!D3D12Device || !CommandQueue || !NativeDst)
	{
		return false;
	}

	FScopeLock Lock(&BlitMutex);

	// 1. Initialize D3D11On12 interop device if not already created
	if (!D3D11On12Device || !D3D11On12Context)
	{
		HMODULE D3D11Module = GetModuleHandleW(L"d3d11.dll");
		if (!D3D11Module)
		{
			D3D11Module = LoadLibraryW(L"d3d11.dll");
		}
		if (!D3D11Module)
		{
			UE_LOG(LogSwuiRuntime, Warning, TEXT("[SWUI GPU D3D12] Failed to load d3d11.dll for D3D11On12 interop."));
			return false;
		}

#pragma warning(push)
#pragma warning(disable: 4191)
		PFN_D3D11ON12_CREATE_DEVICE D3D11On12CreateDeviceFunc =
			reinterpret_cast<PFN_D3D11ON12_CREATE_DEVICE>(GetProcAddress(D3D11Module, "D3D11On12CreateDevice"));
#pragma warning(pop)

		if (!D3D11On12CreateDeviceFunc)
		{
			UE_LOG(LogSwuiRuntime, Warning, TEXT("[SWUI GPU D3D12] d3d11.dll does not export D3D11On12CreateDevice."));
			return false;
		}

		IUnknown* Queues[1] = { CommandQueue };
		HRESULT hr = D3D11On12CreateDeviceFunc(
			D3D12Device,
			D3D11_CREATE_DEVICE_BGRA_SUPPORT,
			nullptr,
			0,
			Queues,
			1,
			0,
			&D3D11On12BaseDevice,
			&D3D11On12Context,
			nullptr);

		if (FAILED(hr) || !D3D11On12BaseDevice)
		{
			UE_LOG(LogSwuiRuntime, Warning, TEXT("[SWUI GPU D3D12] D3D11On12CreateDevice failed (hr=0x%08X)."), hr);
			return false;
		}

		hr = D3D11On12BaseDevice->QueryInterface(IID_PPV_ARGS(&D3D11On12Device));
		if (FAILED(hr) || !D3D11On12Device)
		{
			UE_LOG(LogSwuiRuntime, Warning, TEXT("[SWUI GPU D3D12] Failed to QueryInterface ID3D11On12Device (hr=0x%08X)."), hr);
			return false;
		}
	}

	// 2. Wrap the Unreal Engine D3D12 destination texture resource
	if (NativeDst != LastD3D12NativeDst || !CachedWrappedD3D12Dst)
	{
		if (CachedWrappedD3D12Dst)
		{
			CachedWrappedD3D12Dst->Release();
			CachedWrappedD3D12Dst = nullptr;
		}

		D3D11_RESOURCE_FLAGS Flags;
		FMemory::Memzero(&Flags, sizeof(Flags));
		Flags.BindFlags = D3D11_BIND_SHADER_RESOURCE;

		// Unreal tracks transient UI textures in PIXEL_SHADER_RESOURCE state for Slate / UMG materials
		HRESULT hr = D3D11On12Device->CreateWrappedResource(
			NativeDst,
			&Flags,
			D3D12_RESOURCE_STATE_PIXEL_SHADER_RESOURCE,
			D3D12_RESOURCE_STATE_PIXEL_SHADER_RESOURCE,
			IID_PPV_ARGS(&CachedWrappedD3D12Dst));

		if (FAILED(hr) || !CachedWrappedD3D12Dst)
		{
			// Fallback attempt: ALL_SHADER_RESOURCE
			hr = D3D11On12Device->CreateWrappedResource(
				NativeDst,
				&Flags,
				D3D12_RESOURCE_STATE_ALL_SHADER_RESOURCE,
				D3D12_RESOURCE_STATE_ALL_SHADER_RESOURCE,
				IID_PPV_ARGS(&CachedWrappedD3D12Dst));
		}

		if (FAILED(hr) || !CachedWrappedD3D12Dst)
		{
			// Fallback attempt: COMMON
			hr = D3D11On12Device->CreateWrappedResource(
				NativeDst,
				&Flags,
				D3D12_RESOURCE_STATE_COMMON,
				D3D12_RESOURCE_STATE_COMMON,
				IID_PPV_ARGS(&CachedWrappedD3D12Dst));
		}

		if (FAILED(hr) || !CachedWrappedD3D12Dst)
		{
			UE_LOG(LogSwuiRuntime, Warning, TEXT("[SWUI GPU D3D12] CreateWrappedResource failed for NativeDst (hr=0x%08X)."), hr);
			return false;
		}

		UE_LOG(LogSwuiRuntime, Log, TEXT("[SWUI GPU D3D12] Successfully wrapped Unreal D3D12 texture into D3D11On12 resource."));
		LastD3D12NativeDst = NativeDst;
	}

	// 3. Open CEF's Direct3D 11 shared texture handle on D3D11On12
	if (SharedHandle != LastD3D12SharedHandle || !CachedD3D11On12SharedTex)
	{
		if (CachedD3D11On12SharedTex)
		{
			CachedD3D11On12SharedTex->Release();
			CachedD3D11On12SharedTex = nullptr;
		}

		HANDLE HandleCopy = static_cast<HANDLE>(SharedHandle);
		HRESULT hr = D3D11On12BaseDevice->OpenSharedResource(HandleCopy, __uuidof(ID3D11Texture2D), reinterpret_cast<void**>(&CachedD3D11On12SharedTex));
		if (FAILED(hr) || !CachedD3D11On12SharedTex)
		{
			ID3D11Device1* Device1 = nullptr;
			if (SUCCEEDED(D3D11On12BaseDevice->QueryInterface(IID_PPV_ARGS(&Device1))) && Device1)
			{
				hr = Device1->OpenSharedResource1(HandleCopy, __uuidof(ID3D11Texture2D), reinterpret_cast<void**>(&CachedD3D11On12SharedTex));
				Device1->Release();
			}
		}

		if (FAILED(hr) || !CachedD3D11On12SharedTex)
		{
			UE_LOG(LogSwuiRuntime, Warning, TEXT("[SWUI GPU D3D12] OpenSharedResource failed for handle 0x%p (hr=0x%08X)."), SharedHandle, hr);
			return false;
		}

		LastD3D12SharedHandle = SharedHandle;
	}

	// 4. Synchronously blit GPU-to-GPU across wrapped resource
	D3D11On12Device->AcquireWrappedResources(&CachedWrappedD3D12Dst, 1);
	D3D11On12Context->CopyResource(CachedWrappedD3D12Dst, CachedD3D11On12SharedTex);
	D3D11On12Device->ReleaseWrappedResources(&CachedWrappedD3D12Dst, 1);
	D3D11On12Context->Flush();

	return true;
}

#endif // PLATFORM_WINDOWS
