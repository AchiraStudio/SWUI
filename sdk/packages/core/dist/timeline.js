let _currentClock = {
    gameTime: 0,
    timeDilation: 1.0,
    paused: false,
    receivedAtMonotonic: typeof performance !== 'undefined' ? performance.now() : Date.now(),
};
export function updateClock(gameTime, timeDilation = 1.0, paused = false) {
    _currentClock = {
        gameTime,
        timeDilation: timeDilation > 0 ? timeDilation : 1.0,
        paused,
        receivedAtMonotonic: typeof performance !== 'undefined' ? performance.now() : Date.now(),
    };
}
export function gameTimeNow() {
    if (_currentClock.paused) {
        return _currentClock.gameTime;
    }
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const elapsedSeconds = (now - _currentClock.receivedAtMonotonic) / 1000.0;
    return _currentClock.gameTime + (elapsedSeconds * _currentClock.timeDilation);
}
const _timelines = new Map();
const _timelineCompleteSubs = new Map();
const _timelineCancelSubs = new Map();
const _timelineProgressSubs = new Map();
export function getTimeline(id) {
    return _timelines.get(id);
}
export function getTimelineState(id) {
    return _timelines.get(id)?.state ?? 'idle';
}
export function getTimelineGeneration(id) {
    return _timelines.get(id)?.generation ?? 0;
}
export function getTimelineProgress(id) {
    const tl = _timelines.get(id);
    if (!tl)
        return 0;
    if (tl.state === 'completed')
        return 1.0;
    if (tl.state === 'cancelled')
        return tl.cancelProgress ?? 0;
    if (tl.state === 'running') {
        if (tl.duration <= 0)
            return 0.99999;
        const now = gameTimeNow();
        const elapsed = now - tl.startGameTime;
        const raw = elapsed / tl.duration;
        const clamped = Math.max(0, Math.min(0.99999, raw));
        return tl.reversed ? (1.0 - clamped) : clamped;
    }
    return 0;
}
function _onNativeTimelineStart(event) {
    const existing = _timelines.get(event.id);
    if (existing && existing.generation > event.generation) {
        return;
    }
    const tl = {
        id: event.id,
        generation: event.generation,
        startGameTime: event.startGameTime,
        duration: event.duration,
        reversed: Boolean(event.reversed),
        state: 'running',
        completeGameTime: 0,
        cancelGameTime: 0,
        cancelProgress: 0,
    };
    _timelines.set(event.id, tl);
    _ensureTimelineRaf();
}
function _onNativeTimelineComplete(event) {
    const tl = _timelines.get(event.id);
    if (!tl || tl.generation !== event.generation) {
        return;
    }
    tl.state = 'completed';
    tl.completeGameTime = event.completeGameTime;
    const listeners = _timelineCompleteSubs.get(event.id);
    if (listeners) {
        for (const fn of listeners) {
            try {
                fn(event.generation);
            }
            catch (e) {
                console.error('[SWUI Timeline] onComplete error', e);
            }
        }
    }
}
function _onNativeTimelineCancel(event) {
    const tl = _timelines.get(event.id);
    if (!tl || tl.generation !== event.generation) {
        return;
    }
    tl.state = 'cancelled';
    tl.cancelGameTime = event.cancelGameTime;
    if (event.cancelProgress !== undefined) {
        tl.cancelProgress = event.cancelProgress;
    }
    else {
        const elapsed = event.cancelGameTime - tl.startGameTime;
        tl.cancelProgress = tl.duration > 0 ? Math.max(0, Math.min(1.0, elapsed / tl.duration)) : 0;
    }
    const listeners = _timelineCancelSubs.get(event.id);
    if (listeners) {
        for (const fn of listeners) {
            try {
                fn(event.generation, tl.cancelProgress);
            }
            catch (e) {
                console.error('[SWUI Timeline] onCancel error', e);
            }
        }
    }
}
let _timelineRafId = null;
function _ensureTimelineRaf() {
    if (_timelineRafId !== null)
        return;
    const loop = () => {
        let hasRunning = false;
        for (const [id, tl] of _timelines) {
            if (tl.state === 'running') {
                hasRunning = true;
                const prog = getTimelineProgress(id);
                const subs = _timelineProgressSubs.get(id);
                if (subs) {
                    for (const fn of subs) {
                        try {
                            fn(prog, tl.state);
                        }
                        catch (e) {
                            console.error('[SWUI Timeline] onProgress error', e);
                        }
                    }
                }
            }
        }
        if (hasRunning && typeof requestAnimationFrame !== 'undefined') {
            _timelineRafId = requestAnimationFrame(loop);
        }
        else {
            _timelineRafId = null;
        }
    };
    if (typeof requestAnimationFrame !== 'undefined') {
        _timelineRafId = requestAnimationFrame(loop);
    }
}
if (typeof window !== 'undefined') {
    window.addEventListener('swui:timelineStart', (e) => _onNativeTimelineStart(e.detail));
    window.addEventListener('swui:timelineComplete', (e) => _onNativeTimelineComplete(e.detail));
    window.addEventListener('swui:timelineCancel', (e) => _onNativeTimelineCancel(e.detail));
}
export const timeline = {
    start(id, duration, reversed = false) {
        _onNativeTimelineStart({
            id,
            generation: (_timelines.get(id)?.generation ?? 0) + 1,
            startGameTime: gameTimeNow(),
            duration,
            reversed,
        });
    },
    progress: getTimelineProgress,
    getState: getTimelineState,
    getGeneration: getTimelineGeneration,
    onComplete(id, callback) {
        let list = _timelineCompleteSubs.get(id);
        if (!list) {
            list = [];
            _timelineCompleteSubs.set(id, list);
        }
        list.push(callback);
        return () => {
            const arr = _timelineCompleteSubs.get(id);
            if (arr)
                _timelineCompleteSubs.set(id, arr.filter(f => f !== callback));
        };
    },
    onCancel(id, callback) {
        let list = _timelineCancelSubs.get(id);
        if (!list) {
            list = [];
            _timelineCancelSubs.set(id, list);
        }
        list.push(callback);
        return () => {
            const arr = _timelineCancelSubs.get(id);
            if (arr)
                _timelineCancelSubs.set(id, arr.filter(f => f !== callback));
        };
    },
    onProgress(id, callback) {
        let list = _timelineProgressSubs.get(id);
        if (!list) {
            list = [];
            _timelineProgressSubs.set(id, list);
        }
        list.push(callback);
        _ensureTimelineRaf();
        return () => {
            const arr = _timelineProgressSubs.get(id);
            if (arr)
                _timelineProgressSubs.set(id, arr.filter(f => f !== callback));
        };
    },
};
