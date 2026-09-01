import React from 'react';
import { motion } from 'motion/react';
import { ParticleCanvas } from './ParticleCanvas';
import { FrameOverlay } from './FrameOverlay';
import { Submission, Venue } from '../types';
import { Crown, Sparkles, PartyPopper, Heart, Building2, Gift } from 'lucide-react';
import { LondonKaraokeLogo } from './LondonKaraokeLogo';

interface BrandedCardProps {
  submission: Submission;
  venue?: Venue;
  size?: 'thumb' | 'sm' | 'md' | 'normal' | 'large' | 'hero';
  showReward?: boolean;
  animated?: boolean;
}

export const BrandedCard: React.FC<BrandedCardProps> = ({
  submission,
  venue,
  size = 'normal',
  showReward = true,
  animated = true,
}) => {
  const { occasion, first_name, caption, image_url, reward } = submission;
  const occasionType = occasion?.type || 'star';

  // Size specific styling
  const sizeClasses = {
    thumb: 'w-44 h-60 text-xs',
    sm: 'w-full max-w-[320px] h-[260px] sm:h-[290px] text-xs p-3',
    md: 'w-full max-w-md h-[340px] sm:h-[380px] text-xs sm:text-sm p-3.5',
    normal: 'branded-card-normal w-full max-w-sm h-[520px] text-sm p-4 sm:p-5',
    large: 'branded-card-large w-full max-w-lg h-[620px] sm:h-[660px] text-base p-4 sm:p-5',
    hero: 'branded-card-hero w-full max-w-3xl h-[680px] sm:h-[740px] text-lg p-4 sm:p-5',
  }[size];

  // Frame theme configurations
  const frameThemes = {
    star: {
      border: 'border border-[#e5b842]/70 shadow-[0_0_35px_rgba(229,184,66,0.35)] ring-1 ring-[#ffe580]/30',
      gradient: 'from-[#1a1508] via-[#0a0804] to-[#120e05]',
      accentColor: '#e5b842',
      badgeBg: 'bg-gradient-to-r from-[#ffe066] via-[#f59e0b] to-[#b38318]',
      badgeText: 'text-black font-black',
      title: 'STAR OF THE NIGHT',
      icon: <Sparkles className="w-3.5 h-3.5 text-black animate-pulse stroke-[2.5]" />,
    },
    birthday: {
      border: 'border border-amber-400/90 shadow-[0_0_40px_rgba(251,191,36,0.35)] ring-1 ring-amber-300/40',
      gradient: 'from-[#1f1406] via-[#0d0903] to-[#170e04]',
      accentColor: '#fbbf24',
      badgeBg: 'bg-gradient-to-r from-[#ffe580] via-[#f59e0b] to-[#d97706]',
      badgeText: 'text-black font-black',
      title: occasion.age ? `${first_name.toUpperCase()}'S ${occasion.age}TH` : `HAPPY BIRTHDAY ${first_name.toUpperCase()}`,
      icon: <PartyPopper className="w-3.5 h-3.5 text-black stroke-[2.5]" />,
    },
    hen: {
      border: 'border border-rose-400/80 shadow-[0_0_40px_rgba(244,63,94,0.35)] ring-1 ring-rose-300/40',
      gradient: 'from-[#220a13] via-[#0e0408] to-[#1a070e]',
      accentColor: '#f43f5e',
      badgeBg: 'bg-gradient-to-r from-rose-300 via-pink-400 to-amber-300',
      badgeText: 'text-black font-black',
      title: occasion.henSubtext || (occasion.brideName ? `BRIDE TO BE — ${occasion.brideName.toUpperCase()}` : "SOPHIE'S HEN NIGHT"),
      icon: <Heart className="w-3.5 h-3.5 text-black fill-black" />,
    },
    corporate: {
      border: 'border border-sky-400/70 shadow-[0_0_35px_rgba(56,189,248,0.3)] ring-1 ring-sky-300/30',
      gradient: 'from-[#081527] via-[#030914] to-[#05101f]',
      accentColor: '#38bdf8',
      badgeBg: 'bg-gradient-to-r from-sky-300 via-blue-400 to-indigo-400',
      badgeText: 'text-slate-950 font-black',
      title: occasion.companyName ? occasion.companyName.toUpperCase() : 'VIP TEAM NIGHT',
      icon: <Building2 className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />,
    },
    fun: {
      border: 'border border-purple-400/70 shadow-[0_0_35px_rgba(168,85,247,0.35)] ring-1 ring-purple-300/30',
      gradient: 'from-[#170a24] via-[#090410] to-[#12071c]',
      accentColor: '#c084fc',
      badgeBg: 'bg-gradient-to-r from-purple-300 via-fuchsia-400 to-pink-400',
      badgeText: 'text-black font-black',
      title: 'SINGSHOT MOMENT',
      icon: <Crown className="w-3.5 h-3.5 text-black stroke-[2.5]" />,
    },
  };

  const theme = frameThemes[occasionType] || frameThemes.star;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-b ${theme.gradient} ${theme.border} p-3.5 sm:p-5 text-white ${sizeClasses} selection:bg-none shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl`}
    >
      {/* Subtle particle background effect */}
      <ParticleCanvas color={theme.accentColor} density={size === 'hero' ? 60 : 30} speed={0.8} />

      {/* Decorative Gold Filigree Corner Accents */}
      <div className="pointer-events-none absolute left-2.5 top-2.5 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#e5b842]/80 drop-shadow">
          <path d="M2 22V2H22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="6" cy="6" r="2" fill="currentColor" />
        </svg>
      </div>
      <div className="pointer-events-none absolute right-2.5 top-2.5 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#e5b842]/80 drop-shadow">
          <path d="M22 22V2H2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="18" cy="6" r="2" fill="currentColor" />
        </svg>
      </div>
      <div className="pointer-events-none absolute bottom-2.5 left-2.5 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#e5b842]/80 drop-shadow">
          <path d="M2 2V22H22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="6" cy="18" r="2" fill="currentColor" />
        </svg>
      </div>
      <div className="pointer-events-none absolute bottom-2.5 right-2.5 flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#e5b842]/80 drop-shadow">
          <path d="M22 2V22H2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="18" cy="18" r="2" fill="currentColor" />
        </svg>
      </div>

      {/* Top Header: Venue Branding & Occasion Badge */}
      <div className="relative z-20 flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full overflow-hidden border border-[#e5b842]/70 shadow-[0_0_15px_rgba(229,184,66,0.3)] shrink-0">
            <LondonKaraokeLogo className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-black tracking-widest text-[#e5b842] uppercase font-cinzel">
              SINGSHOT
            </div>
            <div className="text-[8px] sm:text-[9px] text-zinc-400 tracking-wider">
              {venue?.sub_name || 'London Karaoke Club'}
            </div>
          </div>
        </div>

        {/* Occasion Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] sm:text-[11px] uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText} shadow-lg ring-1 ring-black/20 animate-light-sweep`}>
          {theme.icon}
          <span className="truncate max-w-[140px] font-black">{theme.title}</span>
        </div>
      </div>

      {/* Central Portrait Photo Container */}
      <div className="relative z-20 my-2 flex-1 overflow-hidden rounded-2xl border border-white/15 bg-zinc-950 shadow-2xl group">
        <img
          src={image_url}
          alt={`${first_name}'s SingShot`}
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes('photo-1534528741775')) {
              target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';
            }
          }}
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />

        {/* Themed Overlay / Neon Border Frame */}
        <FrameOverlay
          frameStyle={submission.frame_style || occasion.frame_style}
          guestName={first_name}
        />

        {/* Soft Vignette Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/35" />

        {/* Floating Sparkle / Crown Banner on Image */}
        {occasionType === 'birthday' && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1">
            <PartyPopper className="w-3 h-3 stroke-[2.5]" /> CELEBRATE
          </div>
        )}

        {occasionType === 'hen' && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-[9px] sm:text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1">
            <Heart className="w-3 h-3 fill-white" /> BRIDE SQUAD
          </div>
        )}

        {/* Reward Notification Banner overlay if rewarded */}
        {showReward && reward && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-3 left-3 right-3 bg-gradient-to-r from-[#ffe580] via-amber-400 to-[#d97706] text-black p-2 rounded-2xl shadow-2xl border border-yellow-200 text-center animate-light-sweep"
          >
            <div className="flex items-center justify-center gap-1.5 font-black text-xs uppercase tracking-wide">
              <Gift className="w-4 h-4 text-black" />
              <span>{reward.badge} UNLOCKED!</span>
            </div>
            <p className="text-[10px] font-bold text-black/90 leading-tight">
              Show screen at the bar for {reward.title}
            </p>
          </motion.div>
        )}
      </div>

      {/* Bottom Footer: Guest Name & Optional Caption */}
      <div className="relative z-20 pt-2 border-t border-white/10 flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-serif font-black text-base sm:text-xl md:text-2xl tracking-tight text-white drop-shadow-md">
            {first_name || 'VIP Guest'}
          </h3>
          <span className="text-[9px] sm:text-[10px] text-[#e5b842] font-black tracking-widest uppercase bg-[#e5b842]/10 border border-[#e5b842]/30 px-2 py-0.5 rounded-full">
            LIVE ON STAGE
          </span>
        </div>

        {caption && (
          <p className="text-xs sm:text-sm text-zinc-300 italic line-clamp-2 leading-tight">
            “{caption}”
          </p>
        )}

        {/* Corporate Event details subtext */}
        {occasionType === 'corporate' && occasion.eventName && (
          <div className="text-[10px] text-sky-300 uppercase tracking-widest font-bold mt-0.5">
            {occasion.eventName}
          </div>
        )}
      </div>
    </motion.div>
  );
};
