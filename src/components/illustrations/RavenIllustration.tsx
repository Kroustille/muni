/** Calm, friendly single-color raven (design spec §4.1). */
export function RavenIllustration({ className = "h-16 w-16 text-muted" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M44 12c-2 0-4 .6-5.6 1.7C36 10 32.8 8 29 8c-6.2 0-11.2 5-11.2 11.2 0 1.2.2 2.4.6 3.5C12.4 25.6 8 32.4 8 40c0 8.8 7.2 16 16 16h22c9.9 0 18-8.1 18-18 0-8.4-5.8-15.5-13.6-17.4C49.4 17.2 47 12 44 12z"
        opacity="0.92"
      />
      <circle cx="27" cy="22" r="2.25" fill="var(--background)" />
      <circle cx="27.4" cy="21.6" r="0.9" fill="currentColor" />
      <path
        d="M18 38c3 2.5 7 4 11.5 4H42c4.2 0 7.8-1.4 10.5-3.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}
