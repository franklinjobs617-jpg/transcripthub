import { type SVGProps } from "react";

type SocialIconProps = SVGProps<SVGSVGElement>;

export function TikTokIcon({ className, ...props }: SocialIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M14 3.5V12a4.5 4.5 0 1 1-3-4.24V3.5h3Zm0 0a6.8 6.8 0 0 0 5.5 4"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InstagramIcon({ className, ...props }: SocialIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle cx="12" cy="12" r="4.15" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="17.3" cy="6.7" r="1.05" fill="currentColor" />
    </svg>
  );
}

export function FacebookIcon({ className, ...props }: SocialIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M15.5 4.25h3V1h-3.8C11.4 1 9 3.44 9 6.72V10H6v3.2h3V23h3.6v-9.8h3.1l.75-3.2h-3.85V7.05c0-1.02.7-1.8 1.9-1.8Z"
        fill="currentColor"
      />
    </svg>
  );
}
