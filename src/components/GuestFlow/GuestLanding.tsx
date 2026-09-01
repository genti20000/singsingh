import React from 'react';
import { Camera, Upload, Sparkles, Tv, ShieldCheck, Flame, ArrowRight, Music2, Star, Zap } from 'lucide-react';
import { Venue } from '../../types';
import { LondonKaraokeLogo } from '../LondonKaraokeLogo';

interface GuestLandingProps {
  venue?: Venue;
  onTakeSelfie: () => void;
  onUploadPhoto: () => void;
  onOpenCommercialSection?: () => void;
}

export const GuestLanding: React.FC<GuestLandingProps> = ({
  venue,
  onTakeSelfie,
  onUploadPhoto,
  onOpenCommercialSection,
}) => {
  return (
    <div className="flex flex-col items-center justify-between h-full max-h-full w-full max-w-lg mx-auto py-1 sm:py-2.5 px-3 sm:px-4 text-white text-center select-none">
      {/* Top Venue VIP Badge */}
      <div className="shrink-0 flex items-center gap-2 bg-zinc-950/95 px-4 py-1.5 rounded-full border border-[#e5b842]/50 shadow-[0_0_30px_rgba(229,184,66,0.25)] backdrop-blur-2xl ring-1 ring-[#ffe580]/20">
        <div className="w-5 h-5 shrink-0">
          <LondonKaraokeLogo className="w-5 h-5" />
        </div>
        <span className="font-black text-[11px] sm:text-xs tracking-widest text-[#e5b842] uppercase font-cinzel">
          {venue?.name || 'SINGSHOT'}
        </span>
        <span className="text-zinc-600 text-xs">•</span>
        <span className="text-[10px] sm:text-[11px] text-zinc-300 font-bold truncate tracking-wide">
          {venue?.sub_name || 'London Soho Live'}
        </span>
        <span className="flex h-2 w-2 relative ml-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e5b842] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e5b842]" />
        </span>
      </div>

      {/* Hero Headline & Luxury Hook */}
      <div className="flex flex-col items-center gap-2.5 sm:gap-3.5 my-auto w-full max-w-md">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-[#e5b842]/40 text-[#e5b842] text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg">
          <Flame className="w-3.5 h-3.5 text-[#e5b842] shrink-0 fill-[#e5b842]/30" />
          <span>LIVE STAGE BROADCAST</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#e5b842]" />
          <span className="text-zinc-300 font-extrabold tracking-wider">SOHO CLUB</span>
        </div>

        <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.06] text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)]">
          Take a selfie. <br />
          <span className="gold-foil-text font-black">
            Dominate the big screen.
          </span>
        </h1>

        <p className="text-zinc-300 text-xs sm:text-sm max-w-sm font-normal leading-relaxed px-2">
          Snap a photo and get broadcasted live across Soho venue screens with 24k gold frames & animated lighting.
        </p>

        {/* Live Venue Status Strip */}
        <div className="flex items-center justify-center gap-2.5 text-[10px] sm:text-[11px] text-zinc-300 bg-zinc-950/90 px-4 py-1.5 rounded-full border border-white/15 shadow-inner">
          <span className="flex items-center gap-1.5 text-amber-300 font-extrabold tracking-wide">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" /> Instant Broadcast
          </span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1 text-zinc-300 font-semibold">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> 14 VIP Backdrops
          </span>
        </div>

        {/* Primary Call-to-Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2.5 sm:gap-3 w-full mt-1.5">
          <button
            onClick={onTakeSelfie}
            className="flex-1 flex items-center justify-center gap-2.5 min-h-[52px] sm:min-h-[56px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#fff5b8] via-[#f59e0b] to-[#d97706] text-black font-black text-xs sm:text-sm shadow-[0_0_35px_rgba(229,184,66,0.5)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer ring-1 ring-white/50 animate-light-sweep"
          >
            <Camera className="w-4 h-4 text-black shrink-0 stroke-[2.5]" />
            <span className="tracking-wider uppercase">TAKE A STAGE SELFIE</span>
          </button>

          <button
            onClick={onUploadPhoto}
            className="flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[56px] py-3 px-5 rounded-2xl bg-zinc-900/90 border border-white/20 text-white font-black text-xs sm:text-sm hover:bg-zinc-800 hover:border-[#e5b842]/70 active:scale-[0.98] transition-all cursor-pointer shadow-xl backdrop-blur-md"
          >
            <Upload className="w-4 h-4 text-[#e5b842] shrink-0 stroke-[2.5]" />
            <span className="tracking-wide">CHOOSE PHOTO</span>
          </button>
        </div>

        {/* Occasion Quick Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-300 mt-1">
          <span className="flex items-center gap-1 bg-zinc-900/90 px-3 py-1 rounded-full border border-[#e5b842]/30 text-amber-200 font-semibold shadow-sm">
            <Sparkles className="w-3 h-3 text-[#e5b842]" /> Star of the Night
          </span>
          <span className="flex items-center gap-1 bg-zinc-900/90 px-3 py-1 rounded-full border border-amber-400/30 text-yellow-200 font-semibold shadow-sm">
            🎂 Birthday Bash
          </span>
          <span className="flex items-center gap-1 bg-zinc-900/90 px-3 py-1 rounded-full border border-rose-400/30 text-rose-200 font-semibold shadow-sm">
            👑 Hen Squad
          </span>
          <span className="flex items-center gap-1 bg-zinc-900/90 px-3 py-1 rounded-full border border-sky-400/30 text-sky-200 font-semibold shadow-sm">
            💼 Team Night
          </span>
        </div>
      </div>

      {/* Bottom Compact 3-Step Strip & Venue Link */}
      <div className="shrink-0 w-full pt-2 border-t border-white/10 flex flex-col items-center gap-1.5">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full text-center">
          <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-zinc-950/70 border border-white/10 text-[10px] sm:text-xs">
            <Camera className="w-3 h-3 text-[#e5b842] shrink-0" />
            <span className="font-bold text-zinc-200 truncate">1. Snap</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-zinc-950/70 border border-white/10 text-[10px] sm:text-xs">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="font-bold text-zinc-200 truncate">2. VIP Style</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-zinc-950/70 border border-white/10 text-[10px] sm:text-xs">
            <Tv className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="font-bold text-zinc-200 truncate">3. Big Screen</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[9px] sm:text-[10px] text-zinc-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#e5b842] shrink-0" />
            <span>No app download needed</span>
          </span>
          {onOpenCommercialSection && (
            <>
              <span className="text-zinc-600">•</span>
              <button
                onClick={onOpenCommercialSection}
                className="text-zinc-300 hover:text-[#e5b842] transition-colors flex items-center gap-0.5 cursor-pointer font-semibold"
              >
                <span>For Venues</span>
                <ArrowRight className="w-2.5 h-2.5 text-[#e5b842]" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

