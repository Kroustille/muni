"use client";

import { useEffect, useState } from "react";
import type { RecapActivityViewportWindow } from "@/domain/recap";

/** Matches Tailwind `md` — narrow heatmap uses 84 trailing days (OD-011-11). */
const NARROW_HEATMAP_MEDIA = "(max-width: 767px)";

export function useRecapHeatmapViewportWindow(): RecapActivityViewportWindow {
  const [viewportWindow, setViewportWindow] = useState<RecapActivityViewportWindow>(() => {
    if (typeof window === "undefined") return "365";
    return window.matchMedia(NARROW_HEATMAP_MEDIA).matches ? "84" : "365";
  });

  useEffect(() => {
    const query = window.matchMedia(NARROW_HEATMAP_MEDIA);
    const update = () => setViewportWindow(query.matches ? "84" : "365");
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return viewportWindow;
}
