import { FrameStyleId } from '../types';

export interface FrameStyleOption {
  id: FrameStyleId;
  name: string;
  badge: string;
  tagline: string;
  category: 'neon' | 'themed' | 'clean';
  borderColor: string;
  glowColor: string;
  previewBg: string;
}

export const FRAME_STYLES: FrameStyleOption[] = [
  {
    id: 'none',
    name: 'Clean Edge',
    badge: '⬛ CLEAN',
    tagline: 'Natural borderless photo',
    category: 'clean',
    borderColor: 'border-white/20',
    glowColor: 'transparent',
    previewBg: 'bg-zinc-900',
  },
  {
    id: 'neon-gold',
    name: 'Soho Gold VIP',
    badge: '👑 GOLD NEON',
    tagline: 'Electric gold tubes & flares',
    category: 'neon',
    borderColor: 'border-[#e5b842]',
    glowColor: 'rgba(229,184,66,0.7)',
    previewBg: 'bg-gradient-to-br from-amber-500/20 to-yellow-600/30',
  },
  {
    id: 'neon-pink',
    name: 'Karaoke Diva',
    badge: '💖 PINK NEON',
    tagline: 'Vibrant magenta neon & musical notes',
    category: 'neon',
    borderColor: 'border-pink-500',
    glowColor: 'rgba(236,72,153,0.75)',
    previewBg: 'bg-gradient-to-br from-pink-500/20 to-rose-600/30',
  },
  {
    id: 'cyber-cyan',
    name: 'Tokyo Cyber',
    badge: '⚡ CYAN NEON',
    tagline: 'High-voltage electric blue neon',
    category: 'neon',
    borderColor: 'border-cyan-400',
    glowColor: 'rgba(34,211,238,0.75)',
    previewBg: 'bg-gradient-to-br from-cyan-500/20 to-blue-600/30',
  },
  {
    id: 'electric-violet',
    name: 'Laser Lounge',
    badge: '🔮 UV VIOLET',
    tagline: 'Deep purple & ultra-violet glow',
    category: 'neon',
    borderColor: 'border-purple-500',
    glowColor: 'rgba(168,85,247,0.75)',
    previewBg: 'bg-gradient-to-br from-purple-500/20 to-fuchsia-600/30',
  },
  {
    id: 'party-neon',
    name: 'Disco Strobe',
    badge: '🌈 MULTI NEON',
    tagline: 'Rainbow neon gradient border',
    category: 'neon',
    borderColor: 'border-amber-300',
    glowColor: 'rgba(244,63,94,0.6)',
    previewBg: 'bg-gradient-to-br from-amber-400/20 via-rose-500/20 to-cyan-400/20',
  },
  {
    id: 'champagne',
    name: 'Champagne Spark',
    badge: '🥂 SHIMMER',
    tagline: 'Sparkling bubbles & gold bokeh',
    category: 'themed',
    borderColor: 'border-amber-200',
    glowColor: 'rgba(253,230,138,0.5)',
    previewBg: 'bg-gradient-to-br from-yellow-200/20 to-amber-500/20',
  },
  {
    id: 'love-hearts',
    name: 'Love & Squad',
    badge: '💘 SQUAD HEARTS',
    tagline: 'Glowing rose gold neon hearts',
    category: 'themed',
    borderColor: 'border-rose-400',
    glowColor: 'rgba(251,113,133,0.7)',
    previewBg: 'bg-gradient-to-br from-rose-500/20 to-pink-600/30',
  },
  {
    id: 'polaroid',
    name: 'Retro Polaroid',
    badge: '📸 POLAROID',
    tagline: 'Classic vintage instant film tab',
    category: 'themed',
    borderColor: 'border-white',
    glowColor: 'rgba(255,255,255,0.4)',
    previewBg: 'bg-gradient-to-b from-zinc-200 to-white text-black',
  },
];
