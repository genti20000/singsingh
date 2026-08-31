import React from 'react';

interface LondonKaraokeLogoProps {
  className?: string;
  size?: number | string;
}

export const LondonKaraokeLogo: React.FC<LondonKaraokeLogoProps> = ({
  className = 'w-9 h-9',
}) => {
  return (
    <div className={`relative shrink-0 select-none ${className}`}>
      <svg
        viewBox="0 0 512 512"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Halftone / perforated dot pattern */}
          <pattern
            id="lkcDotPattern"
            x="0"
            y="0"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="4" cy="4" r="0.8" fill="#000000" opacity="0.32" />
          </pattern>
          <radialGradient id="lkcBadgeYellow" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#fed21c" />
            <stop offset="70%" stopColor="#f7be0b" />
            <stop offset="100%" stopColor="#dfa705" />
          </radialGradient>
        </defs>

        {/* Outer Ring Shadow & Base */}
        <circle cx="256" cy="256" r="248" fill="#09090b" />

        {/* Yellow Background Circle */}
        <circle
          cx="256"
          cy="256"
          r="234"
          fill="url(#lkcBadgeYellow)"
          stroke="#09090b"
          strokeWidth="14"
        />

        {/* Dot Pattern Overlay */}
        <circle cx="256" cy="256" r="226" fill="url(#lkcDotPattern)" />

        {/* Inner thin accent border */}
        <circle
          cx="256"
          cy="256"
          r="228"
          fill="none"
          stroke="#000000"
          strokeWidth="1.5"
          opacity="0.4"
        />

        {/* Typography & Icons Group */}
        <g
          fill="#09090b"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, 'Arial Black', sans-serif"
          fontWeight="900"
        >
          {/* LONDON */}
          <text
            x="256"
            y="152"
            fontSize="54"
            letterSpacing="5"
            transform="scale(1, 1.15) translate(0, -20)"
          >
            LONDON
          </text>

          {/* KARAOKE */}
          <text
            x="256"
            y="238"
            fontSize="64"
            letterSpacing="2.5"
            transform="scale(1, 1.15) translate(0, -32)"
          >
            KARAOKE
          </text>

          {/* ★ CLUB ★ */}
          {/* Left Star */}
          <path
            d="M 104 278 L 112 294 L 130 296 L 116 308 L 120 326 L 104 317 L 88 326 L 92 308 L 78 296 L 96 294 Z"
            fill="#09090b"
          />

          {/* CLUB Text */}
          <text
            x="256"
            y="312"
            fontSize="58"
            letterSpacing="5"
            transform="scale(1, 1.15) translate(0, -42)"
          >
            CLUB
          </text>

          {/* Right Star */}
          <path
            d="M 408 278 L 416 294 L 434 296 L 420 308 L 424 326 L 408 317 L 392 326 L 396 308 L 382 296 L 400 294 Z"
            fill="#09090b"
          />

          {/* Lower Left Star */}
          <path
            d="M 158 356 L 164 368 L 178 369 L 168 379 L 170 392 L 158 385 L 146 392 L 148 379 L 138 369 L 152 368 Z"
            fill="#09090b"
          />

          {/* Lower Right Star */}
          <path
            d="M 354 356 L 360 368 L 374 369 L 364 379 L 366 392 L 354 385 L 342 392 L 344 379 L 334 369 L 348 368 Z"
            fill="#09090b"
          />

          {/* Vintage Microphone Vector Icon */}
          <g transform="translate(256, 376)">
            {/* Mic Capsule Body */}
            <rect
              x="-30"
              y="-38"
              width="60"
              height="52"
              rx="30"
              ry="26"
              fill="#09090b"
            />

            {/* Mic Grill Horizontal Slits */}
            <line
              x1="-23"
              y1="-26"
              x2="23"
              y2="-26"
              stroke="#f7be0b"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <line
              x1="-26"
              y1="-14"
              x2="26"
              y2="-14"
              stroke="#f7be0b"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <line
              x1="-26"
              y1="-2"
              x2="26"
              y2="-2"
              stroke="#f7be0b"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <line
              x1="-23"
              y1="10"
              x2="23"
              y2="10"
              stroke="#f7be0b"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Mic Outer Cradle / U-mount */}
            <path
              d="M -38 -8 C -38 28 38 28 38 -8"
              fill="none"
              stroke="#09090b"
              strokeWidth="7"
              strokeLinecap="round"
            />

            {/* Mic Stand Stem */}
            <rect x="-5" y="24" width="10" height="30" fill="#09090b" />

            {/* Mic Stand Base */}
            <rect x="-26" y="50" width="52" height="10" rx="3" fill="#09090b" />
          </g>
        </g>
      </svg>
    </div>
  );
};
export default LondonKaraokeLogo;
