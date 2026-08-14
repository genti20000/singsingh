import React from 'react';
import { FrameStyleId } from '../types';
import { Sparkles, Music, Heart, Zap, Flame, Crown } from 'lucide-react';

interface FrameOverlayProps {
  frameStyle?: FrameStyleId;
  className?: string;
  guestName?: string;
}

export const FrameOverlay: React.FC<FrameOverlayProps> = ({
  frameStyle = 'none',
  className = '',
  guestName = 'SINGSHOT',
}) => {
  if (!frameStyle || frameStyle === 'none') {
    return null;
  }

  return (
    <div className={`pointer-events-none absolute inset-0 z-10 ${className}`}>
      {/* 1. SOHO GOLD VIP NEON */}
      {frameStyle === 'neon-gold' && (
        <div className="absolute inset-0 rounded-2xl border-[3px] border-[#e5b842] shadow-[0_0_25px_rgba(229,184,66,0.8),inset_0_0_15px_rgba(229,184,66,0.4)]">
          {/* Neon Corner Brackets */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-yellow-200 rounded-tl-lg shadow-[0_0_10px_#e5b842]" />
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-yellow-200 rounded-tr-lg shadow-[0_0_10px_#e5b842]" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-yellow-200 rounded-bl-lg shadow-[0_0_10px_#e5b842]" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-yellow-200 rounded-br-lg shadow-[0_0_10px_#e5b842]" />

          {/* Top VIP Neon Crown Badge */}
          <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-yellow-300 text-black px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(229,184,66,0.8)] flex items-center gap-1">
            <Crown className="w-2.5 h-2.5 fill-black" /> VIP
          </div>

          {/* Floating Gold Sparkle Badges */}
          <div className="absolute bottom-2 right-2 text-yellow-300 animate-pulse">
            <Sparkles className="w-4 h-4 drop-shadow-[0_0_8px_#e5b842]" />
          </div>
        </div>
      )}

      {/* 2. KARAOKE DIVA PINK NEON */}
      {frameStyle === 'neon-pink' && (
        <div className="absolute inset-0 rounded-2xl border-[3px] border-pink-500 shadow-[0_0_25px_rgba(236,72,153,0.85),inset_0_0_15px_rgba(236,72,153,0.4)]">
          {/* Corner Accents */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-pink-300 rounded-tl-lg shadow-[0_0_10px_#ec4899]" />
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-pink-300 rounded-tr-lg shadow-[0_0_10px_#ec4899]" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-pink-300 rounded-bl-lg shadow-[0_0_10px_#ec4899]" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-pink-300 rounded-br-lg shadow-[0_0_10px_#ec4899]" />

          {/* Floating Neon Musical Notes & Microphone Accent */}
          <div className="absolute top-2 left-2 bg-pink-500/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-[0_0_10px_#ec4899] flex items-center gap-1">
            <Music className="w-2.5 h-2.5" /> KARAOKE DIVA
          </div>
          <div className="absolute bottom-2 right-2 text-pink-300 animate-bounce">
            <Music className="w-4 h-4 drop-shadow-[0_0_8px_#ec4899]" />
          </div>
          <div className="absolute top-10 right-2 text-pink-400 opacity-80">
            <Heart className="w-3.5 h-3.5 fill-pink-400 drop-shadow-[0_0_6px_#ec4899]" />
          </div>
        </div>
      )}

      {/* 3. TOKYO CYBER CYAN NEON */}
      {frameStyle === 'cyber-cyan' && (
        <div className="absolute inset-0 rounded-2xl border-[3px] border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.85),inset_0_0_15px_rgba(34,211,238,0.4)]">
          {/* Cyber Cut-Corner Accents */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-200 rounded-tl-lg shadow-[0_0_10px_#22d3ee]" />
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-200 rounded-tr-lg shadow-[0_0_10px_#22d3ee]" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-200 rounded-bl-lg shadow-[0_0_10px_#22d3ee]" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-200 rounded-br-lg shadow-[0_0_10px_#22d3ee]" />

          {/* Cyber Badge */}
          <div className="absolute top-2 right-2 bg-cyan-400 text-black px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-[0_0_12px_#22d3ee] flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 fill-black" /> CYBER BEAT
          </div>
          <div className="absolute bottom-2 left-2 text-cyan-300 font-mono text-[9px] tracking-widest bg-black/60 px-2 py-0.5 rounded">
            // LIVE_NIGHT
          </div>
        </div>
      )}

      {/* 4. LASER LOUNGE UV VIOLET */}
      {frameStyle === 'electric-violet' && (
        <div className="absolute inset-0 rounded-2xl border-[3px] border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.85),inset_0_0_15px_rgba(168,85,247,0.4)]">
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-fuchsia-300 rounded-tl-lg shadow-[0_0_10px_#a855f7]" />
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-fuchsia-300 rounded-tr-lg shadow-[0_0_10px_#a855f7]" />
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-fuchsia-300 rounded-bl-lg shadow-[0_0_10px_#a855f7]" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-fuchsia-300 rounded-br-lg shadow-[0_0_10px_#a855f7]" />

          <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-[0_0_10px_#a855f7] flex items-center gap-1">
            <Flame className="w-2.5 h-2.5 fill-white" /> LASER GLOW
          </div>
        </div>
      )}

      {/* 5. DISCO MULTI-NEON STROBE */}
      {frameStyle === 'party-neon' && (
        <div className="absolute inset-0 rounded-2xl p-[3px] bg-gradient-to-tr from-rose-500 via-yellow-400 to-cyan-400 shadow-[0_0_25px_rgba(244,63,94,0.7)]">
          <div className="w-full h-full rounded-2xl" />
          <div className="absolute top-2 right-2 bg-black/80 border border-yellow-300 text-yellow-300 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> PARTY ON
          </div>
        </div>
      )}

      {/* 6. CHAMPAGNE SHIMMER & GOLD FOIL */}
      {frameStyle === 'champagne' && (
        <div className="absolute inset-0 rounded-2xl border-[3px] border-amber-200/90 shadow-[0_0_20px_rgba(253,230,138,0.6)]">
          {/* Shimmer Bokeh Dots */}
          <div className="absolute top-3 left-3 h-2 w-2 rounded-full bg-yellow-200 shadow-[0_0_8px_#fef08a] animate-ping" />
          <div className="absolute top-8 right-5 h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_10px_#fcd34d] animate-pulse" />
          <div className="absolute bottom-10 left-5 h-2 w-2 rounded-full bg-yellow-100 shadow-[0_0_8px_#fff]" />
          <div className="absolute bottom-3 right-3 bg-gradient-to-r from-amber-300 to-yellow-200 text-black px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow">
            🥂 PROSECCO VIBES
          </div>
        </div>
      )}

      {/* 7. LOVE & SQUAD HEARTS */}
      {frameStyle === 'love-hearts' && (
        <div className="absolute inset-0 rounded-2xl border-[3px] border-rose-400 shadow-[0_0_25px_rgba(251,113,133,0.75)]">
          <div className="absolute top-2 left-2 text-rose-300">
            <Heart className="w-5 h-5 fill-rose-400 drop-shadow-[0_0_8px_#fb7185]" />
          </div>
          <div className="absolute top-2 right-2 text-rose-300">
            <Heart className="w-5 h-5 fill-rose-400 drop-shadow-[0_0_8px_#fb7185]" />
          </div>
          <div className="absolute bottom-2 left-2 bg-rose-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow">
            💖 BESTIES
          </div>
        </div>
      )}

      {/* 8. RETRO POLAROID */}
      {frameStyle === 'polaroid' && (
        <div className="absolute inset-0 rounded-2xl border-[8px] sm:border-[10px] border-b-[38px] sm:border-b-[44px] border-white shadow-[0_15px_30px_rgba(0,0,0,0.6)]">
          {/* Bottom Polaroid Tab text */}
          <div className="absolute -bottom-[32px] sm:-bottom-[38px] left-0 right-0 text-center pointer-events-none">
            <span className="font-serif italic text-xs sm:text-sm font-bold text-zinc-900 tracking-wide">
              {guestName || 'London Karaoke Club'} • {new Date().toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
