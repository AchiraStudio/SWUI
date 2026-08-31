#include "ISwuiRuntime.h"
#include "Interfaces/IPluginManager.h"
#include "SwuiManager.h"
#include "SwuiSettings.h"
#include "SwuiView.h"
#include "HAL/FileManager.h"
#include "HAL/PlatformProcess.h"
#include "HAL/PlatformTime.h"
#include "Misc/Paths.h"
#include "UObject/UObjectIterator.h"

#if PLATFORM_WINDOWS
#include "Windows/AllowWindowsPlatformTypes.h"
#include <windows.h>
#include "Windows/HideWindowsPlatformTypes.h"
#endif

static void SwuiSetCefString(cef_string_t& Target, const FString& Value)
{
	const FTCHARToUTF8 Utf8Value(*Value);
	CefString(&Target).FromString(Utf8Value.Get(), Utf8Value.Length());
}

class FSwuiRuntime : public ISwuiRuntime
{
	/** IModuleInterface implementation */
	virtual void StartupModule() override
	{
		if (GetDefault<USwuiSettings>()->bDisablePlugin)
		{
			UE_LOG(LogSwuiRuntime, Log, TEXT(" STATUS: Disabled via Project Settings > Plugins > SimpleWebUI > Debug"));
			return;
		}

		TSharedPtr<IPlugin> SimpleWebUIPlugin = IPluginManager::Get().FindPlugin(TEXT("SimpleWebUI"));
		if (!SimpleWebUIPlugin.IsValid())
		{
			UE_LOG(LogSwuiRuntime, Error, TEXT("SWUI CEF: SimpleWebUI plugin not found."));
			return;
		}

		const FString PluginBaseDir = SimpleWebUIPlugin->GetBaseDir();
		FString ExecutablePath;
		FString CefRoot;
		FString ResourcesPath;
		FString LocalesPath;

		SwuiManager::Settings.windowless_rendering_enabled = 1;
		SwuiManager::Settings.no_sandbox = 1;
		SwuiManager::Settings.remote_debugging_port = 7777;
		SwuiManager::Settings.uncaught_exception_stack_size = 5;
		SwuiManager::Settings.command_line_args_disabled = 0;

#if PLATFORM_LINUX
		CefRoot = FPaths::ConvertRelativePathToFull(FPaths::Combine(PluginBaseDir, TEXT("ThirdParty/cef/Linux/shipping")));
		ExecutablePath = FPaths::Combine(CefRoot, TEXT("swui_ue_process"));
		if (!FPaths::FileExists(ExecutablePath))
		{
			ExecutablePath = FPaths::Combine(CefRoot, TEXT("blu_ue4_process"));
		}
		ResourcesPath = FPaths::FileExists(FPaths::Combine(CefRoot, TEXT("resources.pak")))
			? CefRoot
			: (FPaths::FileExists(FPaths::Combine(CefRoot, TEXT("Resources/resources.pak"))) ? FPaths::Combine(CefRoot, TEXT("Resources")) : CefRoot);
		LocalesPath = FPaths::DirectoryExists(FPaths::Combine(CefRoot, TEXT("locales")))
			? FPaths::Combine(CefRoot, TEXT("locales"))
			: (FPaths::DirectoryExists(FPaths::Combine(CefRoot, TEXT("Resources/locales"))) ? FPaths::Combine(CefRoot, TEXT("Resources/locales")) : FPaths::Combine(CefRoot, TEXT("locales")));
#elif PLATFORM_MAC
		CefRoot = FPaths::ConvertRelativePathToFull(FPaths::Combine(PluginBaseDir, TEXT("ThirdParty/cef/Mac/shipping")));
		ExecutablePath = FPaths::Combine(CefRoot, TEXT("swui_ue_process.app/Contents/MacOS/swui_ue_process"));
		if (!FPaths::FileExists(ExecutablePath))
		{
			ExecutablePath = FPaths::Combine(CefRoot, TEXT("blu_ue4_process.app/Contents/MacOS/blu_ue4_process"));
		}
		ResourcesPath = FPaths::FileExists(FPaths::Combine(CefRoot, TEXT("resources.pak")))
			? CefRoot
			: (FPaths::FileExists(FPaths::Combine(CefRoot, TEXT("Resources/resources.pak"))) ? FPaths::Combine(CefRoot, TEXT("Resources")) : CefRoot);
		LocalesPath = FPaths::DirectoryExists(FPaths::Combine(CefRoot, TEXT("locales")))
			? FPaths::Combine(CefRoot, TEXT("locales"))
			: (FPaths::DirectoryExists(FPaths::Combine(CefRoot, TEXT("Resources/locales"))) ? FPaths::Combine(CefRoot, TEXT("Resources/locales")) : FPaths::Combine(CefRoot, TEXT("locales")));
#elif PLATFORM_WINDOWS
		CefRoot = FPaths::ConvertRelativePathToFull(FPaths::Combine(PluginBaseDir, TEXT("ThirdParty/cef/Win/shipping")));
		ExecutablePath = FPaths::Combine(CefRoot, TEXT("SwuiBrowserProcess.exe"));
		if (!FPaths::FileExists(ExecutablePath))
		{
			ExecutablePath = FPaths::Combine(CefRoot, TEXT("BluBrowserProcess.exe"));
		}
		ResourcesPath = FPaths::FileExists(FPaths::Combine(CefRoot, TEXT("resources.pak")))
			? CefRoot
			: (FPaths::FileExists(FPaths::Combine(CefRoot, TEXT("Resources/resources.pak"))) ? FPaths::Combine(CefRoot, TEXT("Resources")) : CefRoot);
		LocalesPath = FPaths::DirectoryExists(FPaths::Combine(CefRoot, TEXT("locales")))
			? FPaths::Combine(CefRoot, TEXT("locales"))
			: (FPaths::DirectoryExists(FPaths::Combine(CefRoot, TEXT("Resources/locales"))) ? FPaths::Combine(CefRoot, TEXT("Resources/locales")) : FPaths::Combine(CefRoot, TEXT("locales")));
#else
		UE_LOG(LogSwuiRuntime, Error, TEXT("SWUI CEF: Unsupported platform."));
		return;
#endif

		// Sanity check critical CEF files before calling CefInitialize to prevent hard crashes (0x80000003)
		if (!FPaths::DirectoryExists(CefRoot))
		{
			UE_LOG(LogSwuiRuntime, Error, TEXT("SWUI CEF Error: CefRoot directory '%s' does not exist! Aborting CefInitialize."), *CefRoot);
			return;
		}
		if (!FPaths::FileExists(ExecutablePath))
		{
			UE_LOG(LogSwuiRuntime, Error, TEXT("SWUI CEF Error: Browser sub-process executable '%s' does not exist! Aborting CefInitialize."), *ExecutablePath);
			return;
		}
		if (!FPaths::DirectoryExists(LocalesPath) || (!FPaths::FileExists(FPaths::Combine(LocalesPath, TEXT("en-US.pak"))) && !FPaths::FileExists(FPaths::Combine(LocalesPath, TEXT("en-GB.pak")))))
		{
			UE_LOG(LogSwuiRuntime, Error, TEXT("SWUI CEF Error: Locales directory '%s' is missing or has no locale pak files! Aborting CefInitialize."), *LocalesPath);
			return;
		}

		const uint32 ProcessId = FPlatformProcess::GetCurrentProcessId();

		// Stable cache path that persists across launches so Chromium can reuse
		// its JS/CSS parse cache and GPU shader cache. CEF uses its own internal
		// locking, making a fixed path safe for the normal single-instance case.
		// Previously this was PID-suffixed (SWUI_BundledCEF_<pid> in temp),
		// which caused a cold-start on every single launch and leaked a new
		// orphaned folder in the OS temp dir each run.
		const FString RootCachePath = FPaths::ConvertRelativePathToFull(
			FPaths::Combine(FPaths::ProjectSavedDir(), TEXT("SwuiCef"), TEXT("Cache"))
		);

		const FString CachePath = FPaths::Combine(RootCachePath, TEXT("Default"));

		// Log file keeps the PID suffix so concurrent editor/game instances
		// don't overwrite each other's CEF debug log.
		const FString CefLogPath = FPaths::ConvertRelativePathToFull(
			FPaths::Combine(
				FPaths::ProjectLogDir(),
				FString::Printf(TEXT("SwuiCefDebug_%u.log"), ProcessId)
			)
		);

		IFileManager::Get().MakeDirectory(*RootCachePath, true);
		IFileManager::Get().MakeDirectory(*CachePath, true);
		IFileManager::Get().MakeDirectory(*FPaths::GetPath(CefLogPath), true);

		SwuiSetCefString(SwuiManager::Settings.browser_subprocess_path, ExecutablePath);
		SwuiSetCefString(SwuiManager::Settings.resources_dir_path, ResourcesPath);
		SwuiSetCefString(SwuiManager::Settings.locales_dir_path, LocalesPath);
		SwuiSetCefString(SwuiManager::Settings.root_cache_path, RootCachePath);
		SwuiSetCefString(SwuiManager::Settings.cache_path, CachePath);
		SwuiSetCefString(SwuiManager::Settings.log_file, CefLogPath);
		SwuiManager::Settings.log_severity = LOGSEVERITY_WARNING;

		UE_LOG(LogSwuiRuntime, Log, TEXT("SWUI CEF root: %s (exists=%s)"), *CefRoot, FPaths::DirectoryExists(CefRoot) ? TEXT("true") : TEXT("false"));
		UE_LOG(LogSwuiRuntime, Log, TEXT("SWUI CEF browser_subprocess_path: %s (exists=%s)"), *ExecutablePath, FPaths::FileExists(ExecutablePath) ? TEXT("true") : TEXT("false"));
		UE_LOG(LogSwuiRuntime, Log, TEXT("SWUI CEF resources_dir_path: %s (exists=%s)"), *ResourcesPath, FPaths::DirectoryExists(ResourcesPath) ? TEXT("true") : TEXT("false"));
		UE_LOG(LogSwuiRuntime, Log, TEXT("SWUI CEF locales_dir_path: %s (exists=%s)"), *LocalesPath, FPaths::DirectoryExists(LocalesPath) ? TEXT("true") : TEXT("false"));
		UE_LOG(LogSwuiRuntime, Log, TEXT("SWUI CEF root_cache_path: %s"), *RootCachePath);
		UE_LOG(LogSwuiRuntime, Log, TEXT("SWUI CEF cache_path: %s"), *CachePath);
		UE_LOG(LogSwuiRuntime, Log, TEXT("SWUI CEF log_file: %s"), *CefLogPath);

		CefRefPtr<SwuiManager> SwuiApp = new SwuiManager();

#if PLATFORM_WINDOWS
		CefMainArgs MainArgs(GetModuleHandle(nullptr));
		const bool bCefInitialized = CefInitialize(MainArgs, SwuiManager::Settings, SwuiApp, nullptr);
#else
		const bool bCefInitialized = CefInitialize(SwuiManager::MainArgs, SwuiManager::Settings, SwuiApp, nullptr);
#endif

		UE_LOG(LogSwuiRuntime, Log, TEXT("SWUI bundled CefInitialize result: %s"), bCefInitialized ? TEXT("true") : TEXT("false"));
		UE_LOG(LogSwuiRuntime, Log, TEXT(" STATUS: Loaded"));
	}

	virtual void ShutdownModule() override
	{
		UE_LOG(LogSwuiRuntime, Log, TEXT(" STATUS: Shutdown"));

		// Close every live browser before calling CefShutdown().
		// Calling CefShutdown() while any CefBrowser is still alive causes a
		// crash or hang — that's why it was commented out before. The correct
		// sequence is: close all browsers → pump message loop until each
		// OnBeforeClose has fired → then call CefShutdown().
		int32 BrowsersClosed = 0;
		for (TObjectIterator<USwuiView> It; It; ++It)
		{
			if (It->HasBrowserHost())
			{
				It->ForceCloseBrowserForShutdown();
				++BrowsersClosed;
			}
		}

		if (BrowsersClosed > 0)
		{
			// Pump the CEF message loop until all browser hosts are gone,
			// or until a 500 ms safety timeout elapses.
			const double TimeoutSec = 0.500;
			const double StartTime  = FPlatformTime::Seconds();

			bool bAllClosed = false;
			while (!bAllClosed && (FPlatformTime::Seconds() - StartTime) < TimeoutSec)
			{
				CefDoMessageLoopWork();

				bAllClosed = true;
				for (TObjectIterator<USwuiView> It; It; ++It)
				{
					if (It->HasBrowserHost())
					{
						bAllClosed = false;
						break;
					}
				}
			}

			UE_LOG(LogSwuiRuntime, Log,
				TEXT("[SWUI Shutdown] Closed %d browser(s) in %.1f ms. AllClosed=%s"),
				BrowsersClosed,
				(FPlatformTime::Seconds() - StartTime) * 1000.0,
				bAllClosed ? TEXT("true") : TEXT("false (timeout)"));
		}

		CefShutdown();
	}
};

IMPLEMENT_MODULE(FSwuiRuntime, SwuiRuntime)
DEFINE_LOG_CATEGORY(LogSwuiRuntime);