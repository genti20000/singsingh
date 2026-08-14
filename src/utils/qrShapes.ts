import type { CSSProperties } from 'react';
import { QRShape } from '../types';

export interface QRShapeConfig {
  id: QRShape;
  name: string;
  badge: string;
  description: string;
  imgClassName: string;
  containerClassName: string;
  style?: CSSProperties;
}

export const QR_SHAPES_CONFIG: Record<QRShape, QRShapeConfig> = {
  squircle: {
    id: 'squircle',
    name: 'Squircle',
    badge: '✨ SQUIRCLE',
    description: 'Smooth luxury curved profile',
    imgClassName: 'rounded-[18px] object-contain bg-[#e5b842] p-1.5 transition-all duration-300 shadow-[0_0_15px_rgba(229,184,66,0.4)]',
    containerClassName: 'rounded-2xl border-2 border-[#e5b842]',
  },
  circle: {
    id: 'circle',
    name: 'Circle Badge',
    badge: '⭕ CIRCLE',
    description: 'Round nightlife VIP disc badge',
    imgClassName: 'rounded-full object-contain bg-[#e5b842] p-2 transition-all duration-300 ring-2 ring-[#e5b842]/70 shadow-[0_0_20px_rgba(229,184,66,0.6)]',
    containerClassName: 'rounded-full border-2 border-[#e5b842]',
  },
  hexagon: {
    id: 'hexagon',
    name: 'Hexagon Crest',
    badge: '⬢ HEXAGON',
    description: 'Geometric 6-sided VIP crest',
    imgClassName: 'object-contain bg-[#e5b842] p-2 transition-all duration-300 shadow-[0_0_20px_rgba(229,184,66,0.5)] [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]',
    containerClassName: 'rounded-2xl border-2 border-[#e5b842]',
  },
  square: {
    id: 'square',
    name: 'Classic Square',
    badge: '⏹ SQUARE',
    description: 'Crisp beveled golden square',
    imgClassName: 'rounded-lg object-contain bg-[#e5b842] p-1.5 transition-all duration-300 border border-amber-300/60 shadow-[0_0_15px_rgba(229,184,66,0.3)]',
    containerClassName: 'rounded-xl border-2 border-[#e5b842]',
  },
  diamond: {
    id: 'diamond',
    name: 'Diamond Gem',
    badge: '◆ DIAMOND',
    description: 'Brilliant faceted diamond shape',
    imgClassName: 'object-contain bg-[#e5b842] p-2 transition-all duration-300 shadow-[0_0_20px_rgba(229,184,66,0.5)] [clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)]',
    containerClassName: 'rounded-2xl border-2 border-[#e5b842]',
  },
  shield: {
    id: 'shield',
    name: 'VIP Shield',
    badge: '🛡 SHIELD',
    description: 'Royal nightclub coat of arms',
    imgClassName: 'object-contain bg-[#e5b842] p-2 transition-all duration-300 shadow-[0_0_20px_rgba(229,184,66,0.5)] [clip-path:polygon(0%_0%,100%_0%,100%_70%,50%_100%,0%_70%)]',
    containerClassName: 'rounded-2xl border-2 border-[#e5b842]',
  },
  star: {
    id: 'star',
    name: 'Starburst Badge',
    badge: '★ STARBURST',
    description: 'Scalloped celebration starburst',
    imgClassName: 'object-contain bg-[#e5b842] p-2 transition-all duration-300 shadow-[0_0_25px_rgba(229,184,66,0.6)] [clip-path:polygon(50%_0%,63%_15%,85%_15%,85%_37%,100%_50%,85%_63%,85%_85%,63%_85%,50%_100%,37%_85%,15%_85%,15%_63%,0%_50%,15%_37%,15%_15%,37%_15%)]',
    containerClassName: 'rounded-2xl border-2 border-[#e5b842]',
  },
};
