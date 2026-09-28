import { useId } from "react";

// The leaf of the logo. It paints with `currentColor` and the veins are cut
// out with a mask, so it works on any background (header, dark footer…).
// Same geometry as src/app/icon.svg and the PWA icons; the viewBox is cropped
// to the leaf (ratio 37:51) so the size you give is the size you see.
export function LogoMark({ className }: { className?: string }) {
  const maskId = `leaf-veins-${useId().replace(/:/g, "")}`;

  return (
    <svg
      viewBox="13.5 8.5 37 51"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
        <rect width="64" height="64" fill="white" />
        <g transform="rotate(32 32 32)">
          <path
            d="M32 51V15M32 44L41 35M32 44L23 35M32 33L40 25M32 33L24 25M32 22L38 16M32 22L26 16"
            fill="none"
            stroke="black"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </mask>
      <g transform="rotate(32 32 32)" fill="currentColor">
        <path d="M32 6C51 19 52 42 32 55C12 42 13 19 32 6Z" mask={`url(#${maskId})`} />
        <path d="M32 55V61" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}
