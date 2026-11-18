// Share card (PNG drawn on a canvas) and plain-text summary of a finished career
import { topMoments } from '../game/moments';
import { computeGlory, HONORARY_TITLES } from './storage';
import { getDifficulty, getNationalCareer, NT_STATUS_LABEL } from '../game/career';

const POSITION_LABEL = { delantero: 'Delantero (9)', enganche: 'Enganche (10)', arquero: 'Arquero (1)' };

function topClubs(player, n = 3) {
  return [...(player.clubHistory || [])]
    .filter(h => h.seasons > 0)
    .sort((a, b) => b.seasons - a.seasons || b.titles - a.titles)
    .slice(0, n);
}

export function summaryText(player) {
  const glory = computeGlory(player);
  const isGk = player.position === 'arquero';
  const main = isGk ? `${player.totalCleanSheets} vallas invictas` : `${player.totalGoals} goles`;
  const clubs = topClubs(player).map(c => c.clubName).join(', ');
  const moments = topMoments(player, 4).map(m => `${m.icon} ${m.year}: ${m.text}`).join('\n');
  return `⚽ ${player.name} · ${POSITION_LABEL[player.position] || ''}\n` +
    `${player.seasonsPlayed} temporadas · ${player.totalMatches} partidos · ${main} · ${player.trophies.length} títulos\n` +
    `Clubes: ${clubs}\n${moments}\n` +
    `Gloria: ${glory.total} pts — ${HONORARY_TITLES[glory.tier]}\n#ElÍdolo`;
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  words.forEach(w => {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else line = test;
  });
  if (line) lines.push(line);
  return lines;
}

/** Draws a 1080x1350 share card and returns the canvas. */
export async function drawShareCard(player) {
  try { await document.fonts?.load('64px "Bebas Neue"'); } catch { /* fallback font */ }
  const W = 1080;
  const H = 1350;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const display = '"Bebas Neue", Impact, "Arial Narrow", sans-serif';
  const body = 'Inter, "Segoe UI", system-ui, sans-serif';

  // Background
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0e1a12');
  g.addColorStop(1, '#040705');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 0, 50, W / 2, 0, 700);
  glow.addColorStop(0, 'rgba(34,231,72,0.28)');
  glow.addColorStop(1, 'rgba(34,231,72,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(W / 2, H + 200, 520, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(34,231,72,0.5)';
  ctx.lineWidth = 6;
  ctx.strokeRect(24, 24, W - 48, H - 48);

  const glory = computeGlory(player);
  const diff = getDifficulty(player);
  const nt = getNationalCareer(player);
  const isGk = player.position === 'arquero';

  // Header
  ctx.fillStyle = '#22E748';
  ctx.font = `bold 34px ${body}`;
  ctx.textAlign = 'center';
  ctx.fillText('EL ÍDOLO · CARRERA TERMINADA', W / 2, 105);

  ctx.fillStyle = '#ffffff';
  ctx.font = `140px ${display}`;
  const name = player.name.toUpperCase();
  let size = 140;
  while (ctx.measureText(name).width > W - 140 && size > 70) { size -= 6; ctx.font = `${size}px ${display}`; }
  ctx.fillText(name, W / 2, 245);

  ctx.fillStyle = '#9ca3af';
  ctx.font = `30px ${body}`;
  ctx.fillText(`${POSITION_LABEL[player.position] || ''} · ${player.seasonsPlayed} temporadas · retirado a los ${player.age} · ${diff.icon} ${diff.label}`, W / 2, 300);

  // Glory
  ctx.fillStyle = '#F6B40E';
  ctx.font = `150px ${display}`;
  ctx.fillText(`${glory.total}`, W / 2, 455);
  ctx.font = `bold 28px ${body}`;
  ctx.fillText(`PUNTOS DE GLORIA · ${HONORARY_TITLES[glory.tier].toUpperCase()}`, W / 2, 500);

  // Stats row
  const stats = [
    ['PARTIDOS', player.totalMatches],
    [isGk ? 'VALLAS INV.' : 'GOLES', isGk ? player.totalCleanSheets : player.totalGoals],
    ['TÍTULOS', player.trophies.length],
    ['SELECCIÓN', player.nationalTeamStats?.matches || 0],
  ];
  const colW = (W - 160) / 4;
  stats.forEach(([label, value], i) => {
    const x = 80 + colW * i + colW / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(80 + colW * i + 8, 545, colW - 16, 150);
    ctx.fillStyle = '#ffffff';
    ctx.font = `86px ${display}`;
    ctx.fillText(String(value), x, 640);
    ctx.fillStyle = '#9ca3af';
    ctx.font = `bold 22px ${body}`;
    ctx.fillText(label, x, 678);
  });

  // Clubs + badges
  ctx.textAlign = 'left';
  ctx.fillStyle = '#22E748';
  ctx.font = `bold 26px ${body}`;
  ctx.fillText('CLUBES', 90, 760);
  ctx.fillStyle = '#e5e7eb';
  ctx.font = `30px ${body}`;
  const clubsLine = topClubs(player).map(cl => `${cl.clubName} (${cl.seasons})`).join('  ·  ') || player.currentClub.name;
  wrapText(ctx, clubsLine, W - 180).slice(0, 2).forEach((l, i) => ctx.fillText(l, 90, 805 + i * 40));

  const badges = [];
  if (player.hasStatue) badges.push(`🗽 Estatua en ${player.statueClubName || 'su club'}`);
  if (nt.status !== 'none') badges.push(`🎽 ${NT_STATUS_LABEL[nt.status]} de la Selección${nt.shirt ? ` (#${nt.shirt})` : ''}`);
  if ((player.clubHistory || []).some(h => h.leftAsRival)) badges.push('🐍 Traidor confeso');
  ctx.fillStyle = '#fcd34d';
  ctx.font = `bold 28px ${body}`;
  ctx.fillText(badges.join('   '), 90, 900);

  // Top moments
  ctx.fillStyle = '#22E748';
  ctx.font = `bold 26px ${body}`;
  ctx.fillText('MOMENTOS', 90, 965);
  let y = 1010;
  topMoments(player, 5).forEach(m => {
    ctx.fillStyle = '#6b7280';
    ctx.font = `bold 26px ${body}`;
    ctx.fillText(String(m.year), 90, y);
    ctx.fillStyle = '#f3f4f6';
    ctx.font = `28px ${body}`;
    const wrapped = wrapText(ctx, `${m.icon} ${m.text}`, W - 300);
    const line = wrapped.length > 1 ? `${wrapped[0].replace(/[,.:;]?$/, '')}…` : wrapped[0];
    ctx.fillText(line, 190, y);
    y += 50;
  });

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#4b5563';
  ctx.font = `24px ${body}`;
  ctx.fillText('El Ídolo · Simulador de carrera futbolística', W / 2, H - 60);
  return c;
}
