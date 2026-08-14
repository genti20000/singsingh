import React from 'react';
import { motion } from 'motion/react';
import { ParticleCanvas } from './ParticleCanvas';
import { FrameOverlay } from './FrameOverlay';
import { Submission, Venue } from '../types';
import { Crown, Sparkles, PartyPopper, Heart, Building2, Gift } from 'lucide-react';

interface BrandedCardProps {
  submission: Submission;
  venue?: Venue;
  size?: 'thumb' | 'normal' | 'large' | 'hero';
  showReward?: boolean;
}

export const BrandedCard: React.FC<BrandedCardProps> = ({
  submission,
  venue,
  size = 'normal',
  showReward = true,
}) => {
  const { occasion, first_name, caption, image_url, reward } = submission;
  const occasionType = occasion.type || 'star';

  // Size specific styling
  const sizeClasses = {
    thumb: 'w-44 h-60 text-xs',
    normal: 'w-full max-w-sm h-[520px] text-sm',
    large: 'w-full max-w-lg h-[620px] sm:h-[660px] text-base',
    hero: 'w-full max-w-3xl h-[680px] sm:h-[740px] text-lg',
  }[size];

  // Frame theme configurations
  const frameThemes = {
    star: {
      border: 'border-2 border-[#e5b842]/60 shadow-[0_0_30px_rgba(229,184,66,0.25)]',
      gradient: 'from-[#14120c] via-[#090806] to-[#18150d]',
      accentColor: '#e5b842',
      badgeBg: 'bg-gradient-to-r from-[#e5b842] via-[#f59e0b] to-[#b38318]',
      badgeText: 'text-black font-extrabold',
      title: 'STAR OF THE NIGHT',
      icon: <Sparkles className="w-4 h-4 text-black animate-pulse" />,
    },
    birthday: {
      border: 'border-2 border-amber-400/80 shadow-[0_0_35px_rgba(251,191,36,0.3)]',
      gradient: 'from-[#181005] via-[#0d0903] to-[#1c1307]',
      accentColor: '#fbbf24',
      badgeBg: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500',
      badgeText: 'text-black font-extrabold',
      title: occasion.age ? `${first_name.toUpperCase()}'S ${occasion.age}TH` : `HAPPY BIRTHDAY ${first_name.toUpperCase()}`,
      icon: <PartyPopper className="w-4 h-4 text-black" />,
    },
    hen: {
      border: 'border-2 border-rose-400/70 shadow-[0_0_35px_rgba(244,63,94,0.3)]',
      gradient: 'from-[#1a080e] via-[#0d0407] to-[#1d0910]',
      accentColor: '#f43f5e',
      badgeBg: 'bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300',
      badgeText: 'text-black font-extrabold',
      title: occasion.henSubtext || (occasion.brideName ? `BRIDE TO BE — ${occasion.brideName.toUpperCase()}` : "SOPHIE'S HEN NIGHT"),
      icon: <Heart className="w-4 h-4 text-black fill-black" />,
    },
    corporate: {
      border: 'border-2 border-sky-400/60 shadow-[0_0_30px_rgba(56,189,248,0.2)]',
      gradient: 'from-[#06101e] via-[#030810] to-[#081527]',
      accentColor: '#38bdf8',
      badgeBg: 'bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400',
      badgeText: 'text-slate-950 font-extrabold',
      title: occasion.companyName ? occasion.companyName.toUpperCase() : 'TEAM NIGHT',
      icon: <Building2 className="w-4 h-4 text-slate-950" />,
    },
    fun: {
      border: 'border-2 border-purple-500/60 shadow-[0_0_30px_rgba(168,85,247,0.25)]',
      gradient: 'from-[#12081c] via-[#08040d] to-[#170a24]',
      accentColor: '#c084fc',
      badgeBg: 'bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400',
      badgeText: 'text-black font-extrabold',
      title: 'SINGSHOT MOMENT',
      icon: <Crown className="w-4 h-4 text-black" />,
    },
  };

  const theme = frameThemes[occasionType] || frameThemes.star;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b ${theme.gradient} ${theme.border} p-4 sm:p-5 text-white ${sizeClasses} selection:bg-none shadow-2xl`}
    >
      {/* Subtle particle background effect */}
      <ParticleCanvas color={theme.accentColor} density={size === 'hero' ? 60 : 30} speed={0.8} />

      {/* Decorative Gold Corner Frames */}
      <div className="pointer-events-none absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-[#e5b842]/70" />
      <div className="pointer-events-none absolute right-2 top-2 h-4 w-4 border-r-2 border-t-2 border-[#e5b842]/70" />
      <div className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-[#e5b842]/70" />
      <div className="pointer-events-none absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-[#e5b842]/70" />

      {/* Top Header: Venue Branding & Occasion Badge */}
      <div className="relative z-20 flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e5b842] text-black font-black text-xs shadow-md">
            SS
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-black tracking-widest text-[#e5b842] uppercase">
              SINGSHOT
            </div>
            <div className="text-[9px] text-zinc-400 tracking-wider">
              {venue?.sub_name || 'at London Karaoke Club'}
            </div>
          </div>
        </div>

        {/* Occasion Badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText} shadow-md`}>
          {theme.icon}
          <span className="truncate max-w-[140px]">{theme.title}</span>
        </div>
      </div>

      {/* Central Portrait Photo Container */}
      <div className="relative z-20 my-2 flex-1 overflow-hidden rounded-xl border border-white/15 bg-black/50 shadow-inner group">
        <img
          src={image_url}
          alt={`${first_name}'s SingShot`}
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />

        {/* Themed Overlay / Neon Border Frame */}
        <FrameOverlay
          frameStyle={submission.frame_style || occasion.frame_style}
          guestName={first_name}
        />

        {/* Soft Vignette Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

        {/* Floating Sparkle / Crown Banner on Image */}
        {occasionType === 'birthday' && (
          <div className="absolute top-3 left-3 bg-amber-500/90 backdrop-blur-md text-black font-black text-[10px] px-2.5 py-1 rounded-md uppercase tracking-widest shadow-lg flex items-center gap-1">
            <PartyPopper className="w-3.5 h-3.5" /> CELEBRATE
          </div>
        )}

        {occasionType === 'hen' && (
          <div className="absolute top-3 left-3 bg-rose-500/90 backdrop-blur-md text-white font-black text-[10px] px-2.5 py-1 rounded-md uppercase tracking-widest shadow-lg flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 fill-white" /> BRIDE SQUAD
          </div>
        )}

        {/* Reward Notification Banner overlay if rewarded */}
        {showReward && reward && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-3 left-3 right-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black p-2 rounded-xl shadow-xl border border-yellow-200 text-center"
          >
            <div className="flex items-center justify-center gap-1.5 font-black text-xs uppercase tracking-wide">
              <Gift className="w-4 h-4 animate-bounce text-black" />
              <span>{reward.badge} UNLOCKED!</span>
            </div>
            <p className="text-[10px] font-semibold text-black/80 leading-tight">
              Show screen at the bar for {reward.title}
            </p>
          </motion.div>
        )}
      </div>

      {/* Bottom Footer: Guest Name & Optional Caption */}
      <div className="relative z-20 pt-2 border-t border-white/10 flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-serif font-bold text-lg sm:text-xl md:text-2xl tracking-wide text-white drop-shadow-md">
            {first_name || 'VIP Guest'}
          </h3>
          <span className="text-[10px] text-[#e5b842] font-semibold tracking-widest uppercase">
            LIVE ON SCREEN
          </span>
        </div>

        {caption && (
          <p className="text-xs sm:text-sm text-zinc-300 italic line-clamp-2 leading-tight">
            “{caption}”
          </p>
        )}

        {/* Corporate Event details subtext */}
        {occasionType === 'corporate' && occasion.eventName && (
          <div className="text-[10px] text-sky-300 uppercase tracking-widest font-semibold mt-0.5">
            {occasion.eventName}
          </div>
        )}
      </div>
    </motion.div>
  );
};
