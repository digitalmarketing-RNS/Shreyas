"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * A value that is controlled when `value` is passed and internal otherwise, like a native input
 * with value or defaultValue. `onChange` fires on every change either way.
 */
export function useControllableState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (next: T) => void,
): [T, (next: T) => void] {
  const [inner, setInner] = useState<T>(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? (value as T) : inner;
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  const set = useCallback(
    (next: T) => {
      if (!controlled) setInner(next);
      onChangeRef.current?.(next);
    },
    [controlled],
  );
  return [current, set];
}

const subscribeNothing = () => () => {};

/**
 * False during the server render and hydration, true afterwards. For content that depends on the
 * browser (its time zone, whether JavaScript runs at all), so the first client render matches the
 * server's HTML.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}

/** Calls `callback` once `delay` ms have passed without another call. */
export function useDebouncedCallback<A extends unknown[]>(callback: (...args: A) => void, delay: number) {
  const timer = useRef<number | null>(null);
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );
  const cancel = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const run = useCallback(
    (...args: A) => {
      cancel();
      timer.current = window.setTimeout(() => {
        timer.current = null;
        callbackRef.current(...args);
      }, delay);
    },
    [cancel, delay],
  );
  return { run, cancel };
}

/** True once `active` has stayed true for `delay` ms (spinners that appear only for slow work). */
export function useDelayedFlag(active: boolean, delay: number): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => setShown(true), delay);
    return () => {
      window.clearTimeout(timer);
      setShown(false);
    };
  }, [active, delay]);
  return active && shown;
}

/** Whether the page runs on a Mac, for "Cmd" in place of "Ctrl" (read after mount only). */
export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform ?? "";
  return /mac|iphone|ipad/i.test(platform);
}
