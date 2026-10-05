"use client";

import { useSyncExternalStore } from "react";

/** Never subscribes — the value is fixed once hydration completes. */
const subscribe = () => () => {};

/**
 * True only after the client has hydrated.
 *
 * `useSyncExternalStore` is the correct primitive here: it yields `false` during
 * the server render and `true` on the client, with no `setState` in an effect,
 * so it stays compatible with the React Compiler lint rules.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}