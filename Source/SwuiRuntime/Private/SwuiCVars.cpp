#include "SwuiCVars.h"

// HUD / frame driving
TAutoConsoleVariable<int32> CVarSwuiHudLockstep(
	TEXT("swui.hud.Lockstep"),
	-1,
	TEXT("Override HUD lockstep mode. -1 = use instance setting, 0 = off, 1 = on."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiHudExternalBeginFrames(
	TEXT("swui.hud.ExternalBeginFrames"),
	-1,
	TEXT("Override external begin frames. -1 = use instance setting, 0 = off, 1 = on."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiHudSendExternalBeginFrameFromTick(
	TEXT("swui.hud.SendExternalBeginFrameFromTick"),
	-1,
	TEXT("Override sending external begin frames from SWUI tick. -1 = use instance setting, 0 = off, 1 = on."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiHudFlushBeforeFrame(
	TEXT("swui.hud.FlushBeforeFrame"),
	-1,
	TEXT("Override HUD flush-before-frame behavior. -1 = use instance setting, 0 = off, 1 = on."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiHudMaxBrowserFPS(
	TEXT("swui.hud.MaxBrowserFPS"),
	-1,
	TEXT("Override HUD browser FPS cap. -1 = use instance setting."),
	ECVF_Default);

// Paint / upload
TAutoConsoleVariable<int32> CVarSwuiPaintHybridDirtyUpload(
	TEXT("swui.paint.HybridDirtyUpload"),
	-1,
	TEXT("Override hybrid dirty upload. -1 = use instance setting, 0 = off, 1 = on."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiPaintTileDiffLargeRects(
	TEXT("swui.paint.TileDiffLargeRects"),
	-1,
	TEXT("Override tile diff for large rects. -1 = use instance setting, 0 = off, 1 = on."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiPaintUploadBudget(
	TEXT("swui.paint.UploadBudget"),
	-1,
	TEXT("Override upload budget enable. -1 = use instance setting, 0 = off, 1 = on."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiPaintMaxNormalUploadBytes(
	TEXT("swui.paint.MaxNormalUploadBytes"),
	-1,
	TEXT("Override normal upload budget in bytes per frame. -1 = use instance setting."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiPaintTileWidth(
	TEXT("swui.paint.TileWidth"),
	-1,
	TEXT("Override tile width. -1 = use instance setting."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiPaintTileHeight(
	TEXT("swui.paint.TileHeight"),
	-1,
	TEXT("Override tile height. -1 = use instance setting."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiPaintMinDirtyRectWidth(
	TEXT("swui.paint.MinDirtyRectWidth"),
	-1,
	TEXT("Override min dirty rect width. -1 = use instance setting."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiPaintMinDirtyRectHeight(
	TEXT("swui.paint.MinDirtyRectHeight"),
	-1,
	TEXT("Override min dirty rect height. -1 = use instance setting."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiPaintCenterCritical(
	TEXT("swui.paint.CenterCritical"),
	-1,
	TEXT("Override center-critical rect processing. -1 = use instance setting, 0 = off, 1 = on."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiPaintCenterCriticalWidth(
	TEXT("swui.paint.CenterCriticalWidth"),
	-1,
	TEXT("Override center-critical rect width. -1 = use instance setting."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiPaintCenterCriticalHeight(
	TEXT("swui.paint.CenterCriticalHeight"),
	-1,
	TEXT("Override center-critical rect height. -1 = use instance setting."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiPaintRotatingCursor(
	TEXT("swui.paint.RotatingCursor"),
	-1,
	TEXT("Override rotating deferred cursor. -1 = use instance setting, 0 = off, 1 = on."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiPaintFullBaseline(
	TEXT("swui.paint.FullBaseline"),
	-1,
	TEXT("Override force full baseline upload on first paint. -1 = use instance setting, 0 = off, 1 = on."),
	ECVF_Default);

// Debug
TAutoConsoleVariable<int32> CVarSwuiDebugLogPaintStats(
	TEXT("swui.debug.LogPaintStats"),
	-1,
	TEXT("Override paint stats logging. -1 = use instance setting, 0 = off, 1 = on."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiDebugShowDirtyRects(
	TEXT("swui.debug.ShowDirtyRects"),
	-1,
	TEXT("Override dirty rect debug overlay. -1 = use instance setting, 0 = off, 1 = on."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiDebugForceFullFrameUploadEveryFrame(
	TEXT("swui.DebugForceFullFrameUploadEveryFrame"),
	0,
	TEXT("Force full-frame upload every UE frame, bypassing dirty rects, tile priorities, ")
	TEXT("center-critical rects, transition heuristics, and upload cooldowns. ")
	TEXT("Also forces browser frame pumping. 0=off, 1=on."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiDebugStats(
	TEXT("swui.debug.Stats"),
	0,
	TEXT("Log throttled SWUI runtime performance and presentation stats every second. 0 = off, 1 = on."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiDebugTimelineStats(
	TEXT("swui.debug.TimelineStats"),
	0,
	TEXT("Log timeline synchronization and presentation latency error diagnostics. 0 = off, 1 = on."),
	ECVF_Default);

// UI resolution presets
TAutoConsoleVariable<int32> CVarSwuiUiResolutionPreset(
	TEXT("swui.hud.UiResolutionPreset"),
	-1,
	TEXT("Override UI resolution preset. -1 = use instance setting, ")
	TEXT("0=720p, 1=900p, 2=1080p, 3=1440p, 4=native, 5=custom."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiCustomUiWidth(
	TEXT("swui.hud.CustomUiWidth"),
	-1,
	TEXT("Override custom UI width when preset is Custom. -1 = use instance setting."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiCustomUiHeight(
	TEXT("swui.hud.CustomUiHeight"),
	-1,
	TEXT("Override custom UI height when preset is Custom. -1 = use instance setting."),
	ECVF_Default);

// Profiling helpers
TAutoConsoleVariable<int32> CVarSwuiProfiler(
	TEXT("swui.profiler"),
	0,
	TEXT("Enable on-screen SWUI runtime profiler HUD overlay. 0 = off, 1 = on."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiNoTextureUpload(
	TEXT("swui.prof.NoTextureUpload"),
	0,
	TEXT("Debug: skip RHIUpdateTexture2D (isolate GPU upload cost). 0=normal, 1=skip upload."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiVerbosePaint(
	TEXT("swui.prof.VerbosePaint"),
	0,
	TEXT("Debug: log per-paint upload strategy details. 0=off, 1=on."),
	ECVF_Default);

// Performance & Synchronization
TAutoConsoleVariable<int32> CVarSwuiGpuAccelerated(
	TEXT("swui.perf.GpuAccelerated"),
	-1,
	TEXT("Override GPU accelerated rendering. -1 = use instance setting (Auto/GPU default), 0 = force CPU, 1 = force GPU."),
	ECVF_Default);


TAutoConsoleVariable<int32> CVarSwuiFramePacing(
	TEXT("swui.perf.FramePacing"),
	0,
	TEXT("Override frame pacing mode. -1 = use instance setting, 0 = decoupled (autonomous CEF compositor, default), 1 = lockstep."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiBatchStateSync(
	TEXT("swui.perf.BatchStateSync"),
	1,
	TEXT("Enable batch state synchronization to JS runtime. 0 = legacy string eval, 1 = atomic JSON batch."),
	ECVF_Default);

TAutoConsoleVariable<float> CVarSwuiCefMessageLoopBudgetMs(
	TEXT("swui.perf.CefMessageLoopBudgetMs"),
	1.5f,
	TEXT("Maximum game-thread budget (ms) per frame for CEF message loop work. <=0 disables budget."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiDirtyRectUpload(
	TEXT("swui.perf.DirtyRectUpload"),
	1,
	TEXT("Upload only dirty sub-rectangles to GPU texture rather than full surface. 0 = force full surface, 1 = sub-rects (default)."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiTickEventPolicy(
	TEXT("swui.perf.TickEventPolicy"),
	0,
	TEXT("Policy for pushing swui:tick scripts into CEF. 0 = only on state change or events (prevents V8 GC stalls, default), 1 = every frame."),
	ECVF_Default);


// HUD ROI
TAutoConsoleVariable<int32> CVarSwuiHudRoiEnabled(
	TEXT("swui.hud.Roi.Enabled"),
	-1,
	TEXT("Override HUD ROI mode. -1 = use instance setting, 0 = off, 1 = on."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiHudRoiX(
	TEXT("swui.hud.Roi.X"),
	-1,
	TEXT("Override HUD ROI X. -1 = use instance setting."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiHudRoiY(
	TEXT("swui.hud.Roi.Y"),
	-1,
	TEXT("Override HUD ROI Y. -1 = use instance setting."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiHudRoiW(
	TEXT("swui.hud.Roi.W"),
	-1,
	TEXT("Override HUD ROI width. -1 = use instance setting."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiHudRoiH(
	TEXT("swui.hud.Roi.H"),
	-1,
	TEXT("Override HUD ROI height. -1 = use instance setting."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiHudRoiCenterEnabled(
	TEXT("swui.hud.Roi.CenterEnabled"),
	-1,
	TEXT("Override center ROI. -1 = use instance setting, 0 = off, 1 = on."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiHudRoiCenterSize(
	TEXT("swui.hud.Roi.CenterSize"),
	-1,
	TEXT("Override center ROI size. -1 = use instance setting."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiHudRoiOverlay(
	TEXT("swui.hud.Roi.Overlay"),
	-1,
	TEXT("Override ROI overlay visibility. -1 = use instance setting, 0 = off, 1 = on."),
	ECVF_Default);

TAutoConsoleVariable<int32> CVarSwuiHudRoiShadeInactive(
	TEXT("swui.hud.Roi.ShadeInactive"),
	-1,
	TEXT("Override inactive area shading. -1 = use instance setting, 0 = off, 1 = on."),
	ECVF_Default);
