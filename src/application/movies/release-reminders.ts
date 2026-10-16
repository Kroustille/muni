const STORAGE_PREFIX = "muni:movie-release-reminder:";

export type ReleaseReminderPrefs = {
  enabled: boolean;
  airDate: string | null;
};

function storageKey(movieItemId: string): string {
  return `${STORAGE_PREFIX}${movieItemId}`;
}

export function readReleaseReminderPrefs(movieItemId: string): ReleaseReminderPrefs {
  if (typeof localStorage === "undefined") {
    return { enabled: false, airDate: null };
  }
  try {
    const raw = localStorage.getItem(storageKey(movieItemId));
    if (!raw) return { enabled: false, airDate: null };
    const parsed = JSON.parse(raw) as Partial<ReleaseReminderPrefs>;
    return {
      enabled: parsed.enabled === true,
      airDate: typeof parsed.airDate === "string" ? parsed.airDate : null,
    };
  } catch {
    return { enabled: false, airDate: null };
  }
}

export function writeReleaseReminderPrefs(
  movieItemId: string,
  prefs: ReleaseReminderPrefs,
): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(storageKey(movieItemId), JSON.stringify(prefs));
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

/** Schedules a one-shot local notification at 09:00 local on `airDate` (YYYY-MM-DD). */
export function scheduleReleaseReminder(
  movieItemId: string,
  title: string,
  airDate: string,
): number | null {
  if (typeof window === "undefined") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(airDate);
  if (!match) return null;
  const when = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    9,
    0,
    0,
    0,
  );
  const delay = when.getTime() - Date.now();
  if (delay <= 0) return null;
  const timeoutId = window.setTimeout(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    new Notification(title, {
      body: "Nouvel épisode disponible aujourd'hui.",
      tag: `muni-episode-${movieItemId}`,
    });
  }, delay);
  return timeoutId;
}

export function cancelScheduledReminder(timeoutId: number | null): void {
  if (timeoutId === null || typeof window === "undefined") return;
  window.clearTimeout(timeoutId);
}
