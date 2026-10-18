"use client";

import { useEffect } from "react";

/** Registra o service worker (app instalável e abrindo sem internet). Só em produção. */
export default function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* sem service worker o app funciona igual, só não instala */
    });
  }, []);
  return null;
}
