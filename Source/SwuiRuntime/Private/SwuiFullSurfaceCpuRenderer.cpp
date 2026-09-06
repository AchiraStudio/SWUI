#include "SwuiFullSurfaceCpuRenderer.h"
#include "SwuiCVars.h"
#include "RHICommandList.h"
#include "RenderingThread.h"

FSwuiFullSurfaceCpuRenderer::FSwuiFullSurfaceCpuRenderer()
{
}

FSwuiFullSurfaceCpuRenderer::~FSwuiFullSurfaceCpuRenderer()
{
	Reset();
}

// ── Init / resize ──────────────────────────────────────────────────────────

void FSwuiFullSurfaceCpuRenderer::InitializePool(int32 Width, int32 Height)
{
	FScopeLock Lock(&PoolMutex);

	if (AllocatedWidth == Width && AllocatedHeight == Height)
	{
		return;
	}

	// Flush any stale return queue entries before re-initializing.
	FSwuiFullSurfaceFrame* Discard = nullptr;
	while (ReturnedFrames.Dequeue(Discard)) {}

	const int32 ByteCount = Width * Height * 4;

	for (int32 i = 0; i < PoolSize; ++i)
	{
		OwnedFrames[i].Allocate(Width, Height);
		OwnedFrames[i].Generation = 0;
		OwnedFrames[i].PaintTime  = 0.0;
		FreeFrames[i] = &OwnedFrames[i];
	}
	FreeCount = PoolSize;

	LatestReadyFrame = nullptr;
	InFlightCount    = 0;

	AllocatedWidth  = Width;
	AllocatedHeight = Height;
	PaintGeneration = 0;
	UploadedGeneration = 0;
	bHasEverHadFrame  = false;

	Stats.StatInterval_Allocations += PoolSize;
	Stats.StatTotal_Allocations   += PoolSize;

	UE_LOG(LogTemp, Log,
		TEXT("[SwuiFullSurfacePool] initialized buffers=%d stride=%d bytesPerFrame=%d size=%dx%d"),
		PoolSize, Width * 4, ByteCount, Width, Height);
}

void FSwuiFullSurfaceCpuRenderer::HandleTextureSizeChanged(int32 NewWidth, int32 NewHeight)
{
	InitializePool(NewWidth, NewHeight);
}

// ── _Locked helpers (caller owns PoolMutex) ────────────────────────────────

void FSwuiFullSurfaceCpuRenderer::DrainReturnedQueue_Locked()
{
	FSwuiFullSurfaceFrame* ReturnedFrame = nullptr;
	while (ReturnedFrames.Dequeue(ReturnedFrame))
	{
		if (!ReturnedFrame)
		{
			continue;
		}

		// Remove from InFlightFrames (it was placed there by ConsumeLatestFrame_Locked).
		for (int32 i = 0; i < InFlightCount; ++i)
		{
			if (InFlightFrames[i] == ReturnedFrame)
			{
				InFlightFrames[i] = InFlightFrames[--InFlightCount];
				break;
			}
		}

		// Guard against duplicate entries in FreeFrames
		bool bAlreadyFree = false;
		for (int32 i = 0; i < FreeCount; ++i)
		{
			if (FreeFrames[i] == ReturnedFrame)
			{
				bAlreadyFree = true;
				break;
			}
		}

		if (!bAlreadyFree && FreeCount < PoolSize)
		{
			FreeFrames[FreeCount++] = ReturnedFrame;
		}
	}
}

FSwuiFullSurfaceFrame* FSwuiFullSurfaceCpuRenderer::AcquireFreeFrame_Locked()
{
	DrainReturnedQueue_Locked();

	if (FreeCount == 0)
	{
		// If an unconsumed LatestReadyFrame exists, recycle it!
		// It has not yet been dispatched to the Render Thread, so overwriting it is 100% thread-safe.
		// This provides true latest-frame discard without any data race.
		if (LatestReadyFrame)
		{
			FSwuiFullSurfaceFrame* Discarded = LatestReadyFrame;
			LatestReadyFrame = nullptr;
			Stats.StatInterval_ReplacedReadyFrames++;
			Discarded->Generation = 0;
			Discarded->PaintTime  = 0.0;
			return Discarded;
		}

		// Never steal in-flight frames currently being read by the Render Thread.
		return nullptr;
	}

	FSwuiFullSurfaceFrame* Frame = FreeFrames[--FreeCount];
	Frame->Generation = 0;
	Frame->PaintTime  = 0.0;
	return Frame;
}

void FSwuiFullSurfaceCpuRenderer::PublishLatestFrame_Locked(FSwuiFullSurfaceFrame* Frame)
{
	if (LatestReadyFrame)
	{
		bool bAlreadyFree = false;
		for (int32 i = 0; i < FreeCount; ++i)
		{
			if (FreeFrames[i] == LatestReadyFrame)
			{
				bAlreadyFree = true;
				break;
			}
		}
		if (!bAlreadyFree && FreeCount < PoolSize)
		{
			FreeFrames[FreeCount++] = LatestReadyFrame;
		}
		Stats.StatInterval_ReplacedReadyFrames++;
	}

	LatestReadyFrame = Frame;
}

FSwuiFullSurfaceFrame* FSwuiFullSurfaceCpuRenderer::ConsumeLatestFrame_Locked()
{
	DrainReturnedQueue_Locked();

	if (!LatestReadyFrame || PaintGeneration <= UploadedGeneration)
	{
		return nullptr;
	}

	FSwuiFullSurfaceFrame* Frame = LatestReadyFrame;
	LatestReadyFrame = nullptr;

	InFlightFrames[InFlightCount++] = Frame;
	UploadedGeneration = Frame->Generation;

	return Frame;
}

// ── StagePaint (CEF renderer thread) ───────────────────────────────────────

void FSwuiFullSurfaceCpuRenderer::StagePaint(
	const void* Buffer,
	const FUpdateTextureRegion2D* InRegions,
	int32 InRegionCount,
	int32 InWidth,
	int32 InHeight,
	double PaintArrivalTime)
{
	if (AllocatedWidth == 0 || AllocatedHeight == 0)
	{
		InitializePool(InWidth, InHeight);
	}
	else if (AllocatedWidth != InWidth || AllocatedHeight != InHeight)
	{
		InitializePool(InWidth, InHeight);
	}

	const int32 ByteCount = InWidth * InHeight * 4;
	const double CopyStart = FPlatformTime::Seconds();

	FSwuiFullSurfaceFrame* Frame;
	{
		FScopeLock Lock(&PoolMutex);
		Frame = AcquireFreeFrame_Locked();
	}

	if (!Frame)
	{
		FScopeLock Lock(&PoolMutex);
		Stats.StatInterval_DroppedPaints++;
		Stats.StatTotal_DroppedPaints++;
		return;
	}

	FPlatformMemory::Memcpy(Frame->Pixels.GetData(), Buffer, ByteCount);

	const double CopyMs = (FPlatformTime::Seconds() - CopyStart) * 1000.0;

	Frame->Width      = InWidth;
	Frame->Height     = InHeight;
	Frame->PaintTime  = PaintArrivalTime;

	// Calculate dirty regions for sub-rect upload
	int64 DirtyPixelArea = 0;
	if (InRegions && InRegionCount > 0)
	{
		for (int32 i = 0; i < InRegionCount; ++i)
		{
			DirtyPixelArea += static_cast<int64>(InRegions[i].Width) * static_cast<int64>(InRegions[i].Height);
		}
	}

	const int64 FullSurfaceArea = static_cast<int64>(InWidth) * static_cast<int64>(InHeight);
	const bool bSubRectAllowed = (CVarSwuiDirtyRectUpload.GetValueOnAnyThread() != 0);

	if (bSubRectAllowed && InRegions && InRegionCount > 0 && DirtyPixelArea < static_cast<int64>(FullSurfaceArea * 0.85))
	{
		Frame->bIsFullSurfaceDirty = false;
		Frame->DirtyRegions.Reset();

		if (InRegionCount == 1)
		{
			const FUpdateTextureRegion2D& InR = InRegions[0];
			const uint32 ClampedDestX = FMath::Clamp<uint32>(InR.DestX, 0, InWidth);
			const uint32 ClampedDestY = FMath::Clamp<uint32>(InR.DestY, 0, InHeight);
			const uint32 ClampedW = FMath::Clamp<uint32>(InR.Width, 0, InWidth - ClampedDestX);
			const uint32 ClampedH = FMath::Clamp<uint32>(InR.Height, 0, InHeight - ClampedDestY);

			if (ClampedW > 0 && ClampedH > 0)
			{
				Frame->DirtyRegions.Add(FUpdateTextureRegion2D(
					ClampedDestX, ClampedDestY,
					ClampedDestX, ClampedDestY,
					ClampedW, ClampedH));
			}
		}
		else
		{
			// Merge multiple small rects into a single bounding box so the Render Thread issues only ONE UpdateTexture2D call
			int32 MinX = InWidth, MinY = InHeight, MaxX = 0, MaxY = 0;
			for (int32 i = 0; i < InRegionCount; ++i)
			{
				MinX = FMath::Clamp<int32>(FMath::Min(MinX, static_cast<int32>(InRegions[i].DestX)), 0, InWidth);
				MinY = FMath::Clamp<int32>(FMath::Min(MinY, static_cast<int32>(InRegions[i].DestY)), 0, InHeight);
				MaxX = FMath::Clamp<int32>(FMath::Max(MaxX, static_cast<int32>(InRegions[i].DestX + InRegions[i].Width)), 0, InWidth);
				MaxY = FMath::Clamp<int32>(FMath::Max(MaxY, static_cast<int32>(InRegions[i].DestY + InRegions[i].Height)), 0, InHeight);
			}
			if (MaxX > MinX && MaxY > MinY)
			{
				FUpdateTextureRegion2D Merged(
					static_cast<uint32>(MinX), static_cast<uint32>(MinY),
					static_cast<uint32>(MinX), static_cast<uint32>(MinY),
					static_cast<uint32>(MaxX - MinX), static_cast<uint32>(MaxY - MinY));
				Frame->DirtyRegions.Add(Merged);
			}
		}

		if (Frame->DirtyRegions.IsEmpty())
		{
			Frame->bIsFullSurfaceDirty = true;
		}
	}
	else
	{
		Frame->bIsFullSurfaceDirty = true;
		Frame->DirtyRegions.Reset();
	}

	{
		FScopeLock Lock(&PoolMutex);
		Frame->Generation = ++PaintGeneration;
		PublishLatestFrame_Locked(Frame);

		Stats.StatInterval_CefPaints++;
		Stats.StatInterval_PaintCopySamples++;
		Stats.StatInterval_PaintCopyMsSum += CopyMs;
		if (CopyMs > Stats.StatInterval_PaintCopyMsMax)
		{
			Stats.StatInterval_PaintCopyMsMax = CopyMs;
		}
		bHasEverHadFrame = true;
	}
}

// ── TickUpload (game thread) ───────────────────────────────────────────────

void FSwuiFullSurfaceCpuRenderer::TickUpload(
	FTextureResource* InTextureResource,
	double Now,
	bool bForceEveryTick)
{
	if (!InTextureResource || !InTextureResource->TextureRHI)
	{
		return;
	}

	FRHITexture* TexRHI = InTextureResource->TextureRHI.GetReference();
	if (!TexRHI)
	{
		return;
	}


	FSwuiFullSurfaceFrame* Frame;
	{
		FScopeLock Lock(&PoolMutex);
		Frame = ConsumeLatestFrame_Locked();
	}

	if (!Frame)
	{
		FScopeLock Lock(&PoolMutex);
		Stats.StatInterval_SkippedNoFreshPaint++;
		return;
	}

	const double EnqueueStart = FPlatformTime::Seconds();
	const int32 FrameWidth  = Frame->Width;
	const int32 FrameHeight = Frame->Height;
	const int32 FramePitch  = FrameWidth * 4;
	const double PaintArrivalTime = Frame->PaintTime;

	ENQUEUE_RENDER_COMMAND(SwuiFullSurfaceUpload)(
		[this, Frame, TexRHI, FrameWidth, FrameHeight, FramePitch](FRHICommandListImmediate& RHICmdList)
		{
			if (TexRHI)
			{
				const int32 TexW = TexRHI->GetSizeX();
				const int32 TexH = TexRHI->GetSizeY();

				if (TexW == FrameWidth && TexH == FrameHeight)
				{
					if (!Frame->bIsFullSurfaceDirty && Frame->DirtyRegions.Num() > 0)
					{
						for (const FUpdateTextureRegion2D& Region : Frame->DirtyRegions)
						{
							if (Region.Width > 0 && Region.Height > 0 &&
								(Region.DestX + Region.Width <= static_cast<uint32>(TexW)) &&
								(Region.DestY + Region.Height <= static_cast<uint32>(TexH)))
							{
								// Match engine's UTexture2D::UpdateTextureRegions:
								// Offset source data pointer and set source offsets to zero for RHI compatibility.
								FUpdateTextureRegion2D RegionCopy = Region;
								const uint8* RegionSourceData = Frame->Pixels.GetData()
									+ (RegionCopy.SrcY * FramePitch)
									+ (RegionCopy.SrcX * 4);
								RegionCopy.SrcX = 0;
								RegionCopy.SrcY = 0;

								RHIUpdateTexture2D(
									TexRHI,
									0,
									RegionCopy,
									FramePitch,
									RegionSourceData);
							}
						}
					}
					else
					{
						FUpdateTextureRegion2D Region(0, 0, 0, 0, FrameWidth, FrameHeight);
						RHIUpdateTexture2D(TexRHI, 0, Region, FramePitch, Frame->Pixels.GetData());
					}
				}
				else
				{
					const int32 UploadW = FMath::Min(TexW, FrameWidth);
					const int32 UploadH = FMath::Min(TexH, FrameHeight);
					if (UploadW > 0 && UploadH > 0)
					{
						FUpdateTextureRegion2D Region(0, 0, 0, 0, UploadW, UploadH);
						RHIUpdateTexture2D(TexRHI, 0, Region, FramePitch, Frame->Pixels.GetData());
					}
				}
			}

			// Defer returning frame buffer to the free pool until the RHI thread has finished uploading
			RHICmdList.EnqueueLambda([this, Frame](FRHICommandList&)
			{
				this->ReturnFrameToFree(Frame);
			});
		});

	const double EnqueueMs = (FPlatformTime::Seconds() - EnqueueStart) * 1000.0;

	{
		FScopeLock Lock(&PoolMutex);
		Stats.StatInterval_Uploads++;
		Stats.StatInterval_UploadedPx += int64(FrameWidth) * FrameHeight;
		Stats.StatInterval_EnqueueSamples++;
		Stats.StatInterval_EnqueueMsSum += EnqueueMs;
		if (EnqueueMs > Stats.StatInterval_EnqueueMsMax)
		{
			Stats.StatInterval_EnqueueMsMax = EnqueueMs;
		}

		if (PaintArrivalTime > 0.0)
		{
			const double PaintToUploadMs = (FPlatformTime::Seconds() - PaintArrivalTime) * 1000.0;
			Stats.StatInterval_PaintToUploadSamples++;
			Stats.StatInterval_PaintToUploadMsSum += PaintToUploadMs;
			if (PaintToUploadMs > Stats.StatInterval_PaintToUploadMsMax)
			{
				Stats.StatInterval_PaintToUploadMsMax = PaintToUploadMs;
			}
		}
	}
}

// ── ReturnFrameToFree (RHI thread) ─────────────────────────────────────────
// Lock-free enqueue into MPSC queue. No PoolMutex needed — single producer
// (RHI thread), consumer drains under PoolMutex in _Locked helpers.

void FSwuiFullSurfaceCpuRenderer::ReturnFrameToFree(FSwuiFullSurfaceFrame* Frame)
{
	Frame->Generation = 0;
	Frame->PaintTime  = 0.0;

	ReturnedFrames.Enqueue(Frame);
}

// ── ROI direct paint path ─────────────────────────────────────────────────

void FSwuiFullSurfaceCpuRenderer::StageRoiPaint(
	const void* CefBuffer,
	int32 BufferWidth,
	int32 BufferHeight,
	const TArray<FIntRect>& ActiveRects,
	double PaintArrivalTime)
{
	const double CopyStart = FPlatformTime::Seconds();
	const int32 SrcPitch = BufferWidth * 4;
	const uint8* Src = static_cast<const uint8*>(CefBuffer);

	FSwuiRoiPayload Payload;
	Payload.FrameWidth  = BufferWidth;
	Payload.FrameHeight = BufferHeight;
	Payload.PaintTime   = PaintArrivalTime;

	Payload.Pixels.Reset();
	Payload.Regions.Reset();

	int32 TotalBytes = 0;
	for (const FIntRect& Rect : ActiveRects)
	{
		TotalBytes += Rect.Width() * Rect.Height() * 4;
	}
	Payload.Pixels.Reserve(TotalBytes);

	for (const FIntRect& Rect : ActiveRects)
	{
		const int32 RgnW = Rect.Width();
		const int32 RgnH = Rect.Height();
		const int32 DstPitch = RgnW * 4;

		Payload.Regions.Add(FUpdateTextureRegion2D(Rect.Min.X, Rect.Min.Y, 0, 0, RgnW, RgnH));

		for (int32 Row = 0; Row < RgnH; ++Row)
		{
			const int32 SrcOffset = (Rect.Min.Y + Row) * SrcPitch + Rect.Min.X * 4;
			const int32 DstOffset = Payload.Pixels.Num();
			Payload.Pixels.AddUninitialized(DstPitch);
			FPlatformMemory::Memcpy(Payload.Pixels.GetData() + DstOffset, Src + SrcOffset, DstPitch);
		}
	}

	const double CopyMs = (FPlatformTime::Seconds() - CopyStart) * 1000.0;

	{
		FScopeLock Lock(&RoiPayloadMutex);

		Payload.Generation = ++RoiGeneration;
		LatestRoiPayload = MoveTemp(Payload);
	}

	{
		FScopeLock Lock(&PoolMutex);
		Stats.StatInterval_CefPaints++;
		Stats.StatInterval_PaintCopySamples++;
		Stats.StatInterval_PaintCopyMsSum += CopyMs;
		if (CopyMs > Stats.StatInterval_PaintCopyMsMax)
			Stats.StatInterval_PaintCopyMsMax = CopyMs;
	}
}

bool FSwuiFullSurfaceCpuRenderer::HasRoiPaintPending() const
{
	FScopeLock Lock(&RoiPayloadMutex);
	return RoiGeneration > RoiUploadedGeneration && LatestRoiPayload.Regions.Num() > 0;
}

bool FSwuiFullSurfaceCpuRenderer::ConsumeLatestRoiPayload(FSwuiRoiPayload& OutPayload)
{
	FScopeLock Lock(&RoiPayloadMutex);

	if (RoiGeneration <= RoiUploadedGeneration || LatestRoiPayload.Regions.IsEmpty())
	{
		return false;
	}

	OutPayload = MoveTemp(LatestRoiPayload);
	RoiUploadedGeneration = OutPayload.Generation;
	return true;
}

// ── Reset ───────────────────────────────────────────────────────────────────

void FSwuiFullSurfaceCpuRenderer::Reset()
{
	{
		FScopeLock Lock(&PoolMutex);

		FSwuiFullSurfaceFrame* Discard = nullptr;
		while (ReturnedFrames.Dequeue(Discard)) {}

		FreeCount = 0;
		for (int32 i = 0; i < PoolSize; ++i)
		{
			OwnedFrames[i].Pixels.Empty();
			OwnedFrames[i].Width      = 0;
			OwnedFrames[i].Height     = 0;
			OwnedFrames[i].Generation = 0;
			OwnedFrames[i].PaintTime  = 0.0;
		}
		LatestReadyFrame   = nullptr;
		InFlightCount      = 0;
		AllocatedWidth     = 0;
		AllocatedHeight    = 0;
		PaintGeneration    = 0;
		UploadedGeneration = 0;
		bHasEverHadFrame   = false;
	}

	{
		FScopeLock Lock(&RoiPayloadMutex);
		LatestRoiPayload = FSwuiRoiPayload();
		ConsumedRoiPayload = FSwuiRoiPayload();
		RoiGeneration = 0;
		RoiUploadedGeneration = 0;
	}

	FStats Z = {};
	Stats = Z;
}

// ── Query ──────────────────────────────────────────────────────────────────

bool FSwuiFullSurfaceCpuRenderer::HasFreshPaintPending() const
{
	FScopeLock Lock(&PoolMutex);
	return LatestReadyFrame != nullptr && PaintGeneration > UploadedGeneration;
}

void FSwuiFullSurfaceCpuRenderer::ClearPendingPaint()
{
	FScopeLock Lock(&PoolMutex);
	UploadedGeneration = PaintGeneration;
}

// ── Stats ──────────────────────────────────────────────────────────────────

void FSwuiFullSurfaceCpuRenderer::ResetIntervalStats()
{
	FScopeLock Lock(&PoolMutex);

	Stats.StatInterval_CefPaints            = 0;
	Stats.StatInterval_Uploads              = 0;
	Stats.StatInterval_SkippedNoFreshPaint  = 0;
	Stats.StatInterval_DroppedPaints        = 0;
	Stats.StatInterval_ReplacedReadyFrames  = 0;
	Stats.StatInterval_Allocations          = 0;
	Stats.StatInterval_PaintCopySamples     = 0;
	Stats.StatInterval_EnqueueSamples       = 0;
	Stats.StatInterval_PaintToUploadSamples = 0;
	Stats.StatInterval_UploadedPx           = 0;
	Stats.StatInterval_PaintCopyMsSum       = 0.0;
	Stats.StatInterval_PaintCopyMsMax       = 0.0;
	Stats.StatInterval_EnqueueMsSum         = 0.0;
	Stats.StatInterval_EnqueueMsMax         = 0.0;
	Stats.StatInterval_PaintToUploadMsSum   = 0.0;
	Stats.StatInterval_PaintToUploadMsMax   = 0.0;
}

void FSwuiFullSurfaceCpuRenderer::RefreshPoolSnapshot() const
{
	FScopeLock Lock(&PoolMutex);

	const_cast<FStats&>(Stats).PoolFree     = FreeCount;
	const_cast<FStats&>(Stats).PoolReady    = LatestReadyFrame ? 1 : 0;
	const_cast<FStats&>(Stats).PoolInFlight = InFlightCount;
}
