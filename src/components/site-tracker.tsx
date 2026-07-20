"use client";

import { useEffect, useRef } from "react";

const visitorStorageKey = "site-builder-anonymous-visitor-v1";

function anonymousVisitorId() {
  const created = crypto.randomUUID();
  try {
    const stored = window.localStorage.getItem(visitorStorageKey);
    if (stored) return stored;
    window.localStorage.setItem(visitorStorageKey, created);
  } catch {
    return created;
  }
  return created;
}

export function SiteTracker({ publishedSlug, pagePath }: { publishedSlug: string; pagePath: string }) {
  const sessionId = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    const visitorId = anonymousVisitorId();
    const startedAt = performance.now();
    let visibleSince = document.visibilityState === "visible" ? performance.now() : null;
    let visibleMilliseconds = 0;

    const payload = (engagementSeconds: number) => JSON.stringify({
      publishedSlug,
      pagePath,
      sessionId: sessionId.current,
      visitorId,
      engagementSeconds,
    });

    const elapsedSeconds = () => {
      const active = visibleSince === null ? 0 : performance.now() - visibleSince;
      return Math.min(21600, Math.max(0, Math.round((visibleMilliseconds + active) / 1000)));
    };

    const send = (beacon = false) => {
      const body = payload(elapsedSeconds());
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon("/api/site-tracking", new Blob([body], { type: "application/json" }));
        return;
      }
      void fetch("/api/site-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => undefined);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden" && visibleSince !== null) {
        visibleMilliseconds += performance.now() - visibleSince;
        visibleSince = null;
        send(true);
      } else if (document.visibilityState === "visible" && visibleSince === null) {
        visibleSince = performance.now();
      }
    };
    const onPageHide = () => send(true);

    send();
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === "visible" && performance.now() - startedAt > 1000) send();
    }, 15000);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      send(true);
    };
  }, [pagePath, publishedSlug]);

  return null;
}
