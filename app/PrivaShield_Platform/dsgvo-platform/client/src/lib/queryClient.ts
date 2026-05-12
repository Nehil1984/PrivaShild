// Copyright 2026 Daniel Schuh
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0

import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

let csrfToken: string | null = null;

function readBrowserCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  const value = match.slice(name.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function setApiCsrfToken(token: string | null) {
  csrfToken = token;
}

function buildAuthHeaders(headers: Record<string, string>, method?: string) {
  const nextHeaders: Record<string, string> = { ...headers };
  const upperMethod = String(method || "GET").toUpperCase();
  const liveCsrfToken = csrfToken || readBrowserCookie("privashield_csrf");
  if (liveCsrfToken && !["GET", "HEAD", "OPTIONS"].includes(upperMethod)) {
    nextHeaders["X-CSRF-Token"] = liveCsrfToken;
  }
  return nextHeaders;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let message = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.message === "string" && parsed.message.trim()) message = parsed.message.trim();
        else if (Array.isArray((parsed as any).issues) && (parsed as any).issues.length) {
          message = (parsed as any).issues
            .map((issue: any) => issue?.message || issue?.path?.join?.(".") || "Ungültige Eingabe")
            .filter(Boolean)
            .join(" | ");
        }
      }
    } catch {
      // ignore JSON parse failure and keep raw text
    }
    throw new Error(`${res.status}: ${message}`);
  }
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  if (res.status === 204 || res.status === 205 || res.status === 304) {
    return null as T;
  }

  const text = await res.text();
  if (!text.trim()) {
    return null as T;
  }

  return JSON.parse(text) as T;
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
    headers: buildAuthHeaders(headers, method),
    body,
    credentials: "same-origin",
  });

  const refreshedCsrf = readBrowserCookie("privashield_csrf");
  if (refreshedCsrf) csrfToken = refreshedCsrf;

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export function getQueryFn<T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> {
  return async ({ queryKey }) => {
    const res = await fetch(`${API_BASE}${queryKey.join("/")}`, {
      headers: buildAuthHeaders({}, "GET"),
      credentials: "same-origin",
    });

    if (options.on401 === "returnNull" && res.status === 401) {
      return null as T;
    }

    await throwIfResNotOk(res);
    return await parseJsonResponse<T>(res);
  };
}

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
