import type { Connectivity } from "@/application/ports/connectivity";

export function createBrowserConnectivity(): Connectivity {
  return {
    isOnline() {
      return typeof navigator !== "undefined" ? navigator.onLine : true;
    },
    onChange(listener) {
      if (typeof window === "undefined") return () => {};

      const notify = () => listener(navigator.onLine);

      window.addEventListener("online", notify);
      window.addEventListener("offline", notify);
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", notify);
      }

      return () => {
        window.removeEventListener("online", notify);
        window.removeEventListener("offline", notify);
        if (typeof document !== "undefined") {
          document.removeEventListener("visibilitychange", notify);
        }
      };
    },
  };
}
