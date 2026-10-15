"use client";

import { useEffect, useState } from "react";

const MOBILE_MEDIA = "(max-width: 768px), (pointer: coarse)";

export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(MOBILE_MEDIA);
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return mobile;
}
