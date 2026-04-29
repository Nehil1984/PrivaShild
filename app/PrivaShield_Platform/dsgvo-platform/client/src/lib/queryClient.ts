// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

function buildAuthHeaders(headers: Record<string, string>) {
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  const isBlob = typeof Blob !== "undefined" && data instanceof Blob;
  const isArrayBuffer = data instanceof ArrayBuffer;
  const isUint8Array = data instanceof Uint8Array;
  const body = data == null
    ? undefined
    : isFormData || isBlob || isArrayBuffer || isUint8Array
      ? (data as BodyInit)
      : JSON.stringify(data);
  const headers: Record<string, string> = data == null || isFormData
    ? {}
    : isBlob
      ? { "Content-Type": (data as Blob).type || "application/octet-stream" }
      : isArrayBuffer || isUint8Array
        ? { "Content-Type": "application/octet-stream" }
        : { "Content-Type": "application/json" };

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: buildAuthHeaders(headers),
    body,
    credentials: "same-origin",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(`${API_BASE}${queryKey.join("/")}`, {
      headers: buildAuthHeaders({}),
      credentials: "same-origin",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
