import React, { useState } from 'react';
import { Share2, Download, Copy, Check } from 'lucide-react';
import { getCareerMoments } from '../game/moments';
import { drawShareCard, summaryText } from '../utils/shareCard';
import { sound } from '../utils/audio';

export default function CareerHighlights({ player, showShare = false, compact = false }) {
  const moments = getCareerMoments(player);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const fileName = `el-idolo-${(player.name || 'carrera').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.png`;

  const handleShareImage = async () => {
    setBusy(true);
    sound.playClick();
    try {
      const canvas = await drawShareCard(player);
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `La carrera de ${player.name}`, text: summaryText(player) });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
    } catch {
      // share cancelled by the user
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText(player));
      setCopied(true);
      sound.playCoin();
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  };

  return (
    <div className={`bg-black/40 border border-white/10 rounded-2xl ${compact ? 'p-4' : 'p-5'} text-left`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-[#22E748]">Tus mejores momentos</h3>
        {showShare && (
          <div className="flex gap-2">
            <button onClick={handleShareImage} disabled={busy} className="px-3 py-1.5 rounded-lg bg-[#22E748] text-black text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
              {navigator.canShare ? <Share2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
              {busy ? 'Generando…' : 'Tarjeta para compartir'}
            </button>
            <button onClick={handleCopy} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
              {copied ? <Check className="w-3.5 h-3.5 text-[#22E748]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar resumen'}
            </button>
          </div>
        )}
      </div>

      {moments.length === 0 ? (
        <p className="text-xs text-gray-400">Todavía no hay momentos para contar. ¡A jugar!</p>
      ) : (
        <ol className={`relative border-l border-white/10 ml-2 space-y-3 ${compact ? 'max-h-72' : 'max-h-96'} overflow-y-auto pr-2`}>
          {moments.map((m, i) => (
            <li key={i} className="ml-4">
              <span className="absolute -left-3 w-6 h-6 rounded-full bg-[#0e1712] border border-white/15 flex items-center justify-center text-xs">{m.icon}</span>
              <span className="text-[10px] font-mono font-bold text-gray-500">{m.year}{m.age ? ` · ${m.age} años` : ''}</span>
              <p className={`text-sm ${['statue', 'world_cup', 'continental', 'title', 'national_title', 'ballon', 'captain'].includes(m.type) ? 'text-amber-200 font-bold' : m.type === 'betrayal' ? 'text-red-300 font-bold' : 'text-gray-200'}`}>
                {m.text}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
