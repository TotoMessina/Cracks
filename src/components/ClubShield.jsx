import React from 'react';

// Dynamic SVG Soccer Shield for any Club
export default function ClubShield({ club, size = 48, className = "" }) {
  if (!club) return null;
  const colors = club.colors || ["#103F79", "#F6B40E"];
  const c1 = colors[0];
  const c2 = colors[1] || "#FFFFFF";
  const name = club.shortName || club.name || "FC";
  const initials = (club.sigla || name.substring(0, 3)).toUpperCase().slice(0, 4);

  return (
    <div
      className={`inline-flex items-center justify-center relative flex-shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      title={club.city ? `${club.name} · ${club.city}` : club.name}
    >
      <svg
        viewBox="0 0 100 120"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id={`shield-clip-${club.id}-${size}`}>
            <path d="M50 0 C75 0 96 15 96 35 C96 75 75 105 50 120 C25 105 4 75 4 35 C4 15 25 0 50 0 Z" />
          </clipPath>
          <linearGradient id={`grad-${club.id}-${size}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c1} stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Outer Shield Outline */}
        <path
          d="M50 0 C75 0 96 15 96 35 C96 75 75 105 50 120 C25 105 4 75 4 35 C4 15 25 0 50 0 Z"
          fill={`url(#grad-${club.id}-${size})`}
          stroke="#FFFFFF"
          strokeWidth="3.5"
        />

        {/* Internal Stripes / Sash pattern inside shield */}
        <g clipPath={`url(#shield-clip-${club.id}-${size})`}>
          {/* Vertical stripe or diagonal sash */}
          <path d="M34 0 L66 0 L66 120 L34 120 Z" fill={c2} opacity="0.9" />
          <path d="M-20 0 L120 120 L100 120 L-40 0 Z" fill={c2} opacity="0.3" />

          {/* Top header bar */}
          <rect x="0" y="0" width="100" height="30" fill="rgba(0,0,0,0.3)" />

          {/* Stars / Decor */}
          <circle cx="50" cy="15" r="4" fill="#FBBF24" />
          {club.tier === 1 && (
            <>
              <circle cx="35" cy="17" r="3" fill="#FBBF24" />
              <circle cx="65" cy="17" r="3" fill="#FBBF24" />
            </>
          )}

          {/* Club Initials in Center */}
          <text
            x="50"
            y="72"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize={initials.length > 3 ? 18 : 22}
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 2px #000',
              letterSpacing: '1px'
            }}
          >
            {initials}
          </text>
        </g>
      </svg>
    </div>
  );
}
