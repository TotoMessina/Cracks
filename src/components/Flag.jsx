import React from 'react';

// Simple SVG flags (emoji flags don't render on Windows). viewBox 30x20.
const H3 = (a, b, c) => (
  <>
    <rect width="30" height="6.67" fill={a} />
    <rect y="6.67" width="30" height="6.67" fill={b} />
    <rect y="13.33" width="30" height="6.67" fill={c} />
  </>
);
const V3 = (a, b, c) => (
  <>
    <rect width="10" height="20" fill={a} />
    <rect x="10" width="10" height="20" fill={b} />
    <rect x="20" width="10" height="20" fill={c} />
  </>
);

const FLAGS = {
  ar: <>{H3('#74ACDF', '#FFFFFF', '#74ACDF')}<circle cx="15" cy="10" r="2.2" fill="#F6B40E" /></>,
  uy: (
    <>
      <rect width="30" height="20" fill="#fff" />
      {[2.22, 6.67, 11.11, 15.56].map(y => <rect key={y} y={y} width="30" height="2.22" fill="#0038A8" />)}
      <rect width="11" height="11.11" fill="#fff" />
      <circle cx="5.5" cy="5.5" r="2.6" fill="#FCD116" />
    </>
  ),
  br: (
    <>
      <rect width="30" height="20" fill="#009C3B" />
      <polygon points="15,2 28,10 15,18 2,10" fill="#FFDF00" />
      <circle cx="15" cy="10" r="4" fill="#002776" />
    </>
  ),
  co: (
    <>
      <rect width="30" height="10" fill="#FCD116" />
      <rect y="10" width="30" height="5" fill="#003893" />
      <rect y="15" width="30" height="5" fill="#CE1126" />
    </>
  ),
  cl: (
    <>
      <rect width="30" height="10" fill="#fff" />
      <rect y="10" width="30" height="10" fill="#D52B1E" />
      <rect width="10" height="10" fill="#0039A6" />
      <circle cx="5" cy="5" r="1.8" fill="#fff" />
    </>
  ),
  py: <>{H3('#D52B1E', '#FFFFFF', '#0038A8')}<circle cx="15" cy="10" r="2" fill="none" stroke="#1d7a2e" strokeWidth="0.8" /></>,
  pe: V3('#D91023', '#FFFFFF', '#D91023'),
  mx: <>{V3('#006847', '#FFFFFF', '#CE1126')}<circle cx="15" cy="10" r="2" fill="#8B5A2B" /></>,
  es: (
    <>
      <rect width="30" height="20" fill="#AA151B" />
      <rect y="5" width="30" height="10" fill="#F1BF00" />
    </>
  ),
  fr: V3('#002395', '#FFFFFF', '#ED2939'),
  it: V3('#009246', '#FFFFFF', '#CE2B37'),
  en: (
    <>
      <rect width="30" height="20" fill="#fff" />
      <rect x="13" width="4" height="20" fill="#CE1124" />
      <rect y="8" width="30" height="4" fill="#CE1124" />
    </>
  ),
  de: H3('#000000', '#DD0000', '#FFCE00'),
  pt: (
    <>
      <rect width="30" height="20" fill="#FF0000" />
      <rect width="12" height="20" fill="#006600" />
      <circle cx="12" cy="10" r="3.4" fill="#FFCC00" />
    </>
  ),
  nl: H3('#AE1C28', '#FFFFFF', '#21468B'),
};

export default function Flag({ code, size = 18, title, className = '' }) {
  const content = FLAGS[code];
  const width = Math.round(size * 1.5);
  if (!content) {
    return <span className={`inline-block rounded-sm bg-white/10 ${className}`} style={{ width, height: size }} title={title} />;
  }
  return (
    <svg
      viewBox="0 0 30 20"
      width={width}
      height={size}
      className={`inline-block flex-shrink-0 rounded-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.15)] ${className}`}
      role="img"
      aria-label={title || code}
    >
      {title && <title>{title}</title>}
      {content}
    </svg>
  );
}
