/*! coi-serviceworker v0.1.7 - Guido Zuidhof / nicololessitalia, licensed under MIT */
"use strict";

const ENABLED = true;

if (typeof window === "undefined") {
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (e) =>
    e.waitUntil(self.clients.claim())
  );
  self.addEventListener("fetch", (e) => {
    if (
      e.request.cache === "only-if-cached" &&
      e.request.mode !== "same-origin"
    )
      return;

    e.respondWith(
      fetch(e.request).then((res) => {
        if (res.status === 0) return res;

        const headers = new Headers(res.headers);
        headers.set("Cross-Origin-Embedder-Policy", "require-corp");
        headers.set("Cross-Origin-Opener-Policy", "same-origin");

        return new Response(res.body, {
          status: res.status,
          statusText: res.statusText,
          headers,
        });
      })
    );
  });
} else {
  (() => {
    const reloadedBySelf = window.sessionStorage.getItem("coiReloadedBySelf");
    window.sessionStorage.removeItem("coiReloadedBySelf");
    const coepDegrading =
      reloadedBySelf === "true" &&
      !window.crossOriginIsolated;

    if (window.crossOriginIsolated !== false || coepDegrading) return;

    window.sessionStorage.setItem("coiReloadedBySelf", "true");

    const url = window.location.href;
    const reg = window.navigator.serviceWorker.register(
      new URL("coi-serviceworker.js", window.location.href).href
    );
    reg.then((r) => {
      if (r.active && !r.installing && !r.waiting) {
        window.location.reload();
      } else if (r.installing || r.waiting) {
        const sw = r.installing || r.waiting;
        sw.addEventListener("statechange", () => {
          if (sw.state === "activated") window.location.reload();
        });
      }
    });
  })();
}
