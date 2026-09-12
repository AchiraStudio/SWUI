import { Unsubscribe, InterpolationOptions } from './types';
import { getState, subscribeState } from './state';
import { postMessage } from './bridge';

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function damp(current: number, target: number, smoothing: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-smoothing * dt));
}

export function createSpring(config: { stiffness?: number; damping?: number; mass?: number; initialValue?: number } = {}) {
  const stiffness = config.stiffness ?? 180;
  const damping = config.damping ?? 12;
  const mass = config.mass ?? 1;
  let value = config.initialValue ?? 0;
  let velocity = 0;
  let target = value;

  return {
    get value() { return value; },
    get target() { return target; },
    set target(v: number) { target = v; },
    set(v: number) { value = v; velocity = 0; },
    step(dt: number) {
      const force = -stiffness * (value - target) - damping * velocity;
      const accel = force / mass;
      velocity += accel * dt;
      value += velocity * dt;
      return value;
    },
  };
}

export function setActivity(key: string, active: boolean): void {
  postMessage({
    type: 'swui:activity',
    key,
    active,
  });
}

export const animation = {
  begin(id: string = 'generic'): void {
    postMessage({
      type: 'swui:animation',
      key: id,
      active: true,
    });
  },
  end(id: string = 'generic'): void {
    postMessage({
      type: 'swui:animation',
      key: id,
      active: false,
    });
  },
};

export function interpolate(
  key: string,
  callback: (currentValue: number) => void,
  options?: InterpolationOptions
): Unsubscribe {
  const speed = options?.speed ?? 0.15;
  const snapThreshold = options?.snapThreshold ?? 0.001;

  let current = typeof getState(key) === 'number' ? (getState(key) as number) : 0;
  let target = current;
  let rafId: number | null = null;
  let active = false;

  const step = () => {
    const diff = target - current;
    if (Math.abs(diff) <= snapThreshold) {
      current = target;
      callback(current);
      active = false;
      rafId = null;
      return;
    }

    current += diff * speed;
    callback(current);
    if (typeof requestAnimationFrame !== 'undefined') {
      rafId = requestAnimationFrame(step);
    }
  };

  const unsub = subscribeState<number>(key, (val) => {
    if (typeof val === 'number') {
      target = val;
      if (!active) {
        active = true;
        if (typeof requestAnimationFrame !== 'undefined') {
          rafId = requestAnimationFrame(step);
        }
      }
    }
  });

  callback(current);

  return () => {
    unsub();
    if (rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    active = false;
  };
}
