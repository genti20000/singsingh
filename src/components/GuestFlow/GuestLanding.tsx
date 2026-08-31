import React from 'react';
import { Camera, Upload, Sparkles, Tv, ShieldCheck, Heart, PartyPopper, Flame, Zap, ArrowRight } from 'lucide-react';
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
    <div className="flex flex-col items-center gap-7 w-full max-w-xl mx-auto px-4 py-6 text-white text-center">
      {/* Venue Header Branding Badge */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2.5 bg-zinc-950/90 px-4 py-2 rounded-full border border-[#e5b842]/50 shadow-[0_0_25px_rgba(229,184,66,0.25)] backdrop-blur-md">
          <div className="w-6 h-6 shrink-0">
            <LondonKaraokeLogo className="w-6 h-6" />
          </div>
          <span className="font-black text-xs tracking-widest text-[#e5b842] uppercase">
            {venue?.name || 'SINGSHOT'}
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-[11px] text-zinc-300 font-semibold">
            {venue?.sub_name || 'at London Karaoke Club'}
          </span>
        </div>
      </div>

      {/* Main Hero Headline */}
      <div className="flex flex-col items-center gap-3.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-[#e5b842]/40 text-[#e5b842] text-[11px] font-black uppercase tracking-widest">
          <Flame className="w-3.5 h-3.5 text-[#e5b842]" />
          <span>LIVE SOHO NIGHTLIFE BROADCAST</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight leading-[1.15] text-white drop-shadow-xl">
          Take a selfie. <br />
          <span className="bg-gradient-to-r from-[#fed21c] via-[#f7be0b] to-[#dfa705] bg-clip-text text-transparent">
            Dominate the big screen.
          </span>
        </h1>
        <p className="text-zinc-300 text-sm sm:text-base max-w-md font-medium leading-relaxed">
          Snap a photo and get broadcasted live across London Karaoke Club's venue displays with custom VIP frames.
        </p>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3.5 w-full max-w-md">
        <button
          onClick={onTakeSelfie}
          className="flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#fed21c] via-yellow-400 to-[#e2a806] text-black font-black text-sm sm:text-base shadow-[0_0_30px_rgba(229,184,66,0.45)] hover:scale-102 hover:brightness-110 active:scale-98 transition-all cursor-pointer"
        >
          <Camera className="w-5 h-5 text-black" />
          <span>TAKE A STAGE SELFIE</span>
        </button>

        <button
          onClick={onUploadPhoto}
          className="flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-zinc-900/90 border border-white/20 text-white font-bold text-sm hover:bg-zinc-800 hover:border-[#e5b842]/60 active:scale-98 transition-all cursor-pointer shadow-lg"
        >
          <Upload className="w-4 h-4 text-[#e5b842]" />
          <span>CHOOSE FROM GALLERY</span>
        </button>
      </div>

      {/* 3 Step Interactive Process Grid */}
      <div className="w-full pt-6 border-t border-white/10">
        <div className="flex items-center justify-center gap-2 text-xs font-black text-[#e5b842] uppercase tracking-widest mb-4">
          <Zap className="w-3.5 h-3.5 fill-[#e5b842]" />
          <span>HOW SINGSHOT WORKS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Step 01 */}
          <div className="flex flex-col items-center p-4 rounded-2xl bg-zinc-950/80 border border-white/10 hover:border-[#e5b842]/40 transition-all text-center group">
            <div className="text-[10px] font-black text-[#e5b842] bg-[#e5b842]/15 px-3 py-0.5 rounded-full mb-2.5">
              01 — SNAP
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#e5b842]/15 border border-[#e5b842]/30 flex items-center justify-center text-[#e5b842] mb-2 group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-sm text-white">Snap or Upload</h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              Capture your live moment right from your mobile browser.
            </p>
          </div>

          {/* Step 02 */}
          <div className="flex flex-col items-center p-4 rounded-2xl bg-zinc-950/80 border border-white/10 hover:border-amber-400/40 transition-all text-center group">
            <div className="text-[10px] font-black text-amber-400 bg-amber-400/15 px-3 py-0.5 rounded-full mb-2.5">
              02 — STYLE
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-sm text-white">Choose Theme</h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              Star of the Night, Birthday, Hen Party, or Team Night VIP frames.
            </p>
          </div>

          {/* Step 03 */}
          <div className="flex flex-col items-center p-4 rounded-2xl bg-zinc-950/80 border border-white/10 hover:border-emerald-400/40 transition-all text-center group">
            <div className="text-[10px] font-black text-emerald-400 bg-emerald-400/15 px-3 py-0.5 rounded-full mb-2.5">
              03 — SHINE
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
              <Tv className="w-5 h-5" />
            </div>
            <h4 className="font-extrabold text-sm text-white">Live On Screen</h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              Appear on the venue TV Wall with live newsflash tickers and effects.
            </p>
          </div>
        </div>
      </div>

      {/* Occasions Ribbon Preview */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-300">
        <span className="flex items-center gap-1.5 bg-zinc-900/80 px-3.5 py-1.5 rounded-full border border-white/15">
          <Sparkles className="w-3.5 h-3.5 text-[#e5b842]" /> Star of the Night
        </span>
        <span className="flex items-center gap-1.5 bg-zinc-900/80 px-3.5 py-1.5 rounded-full border border-white/15">
          <PartyPopper className="w-3.5 h-3.5 text-amber-400" /> Birthday Bash
        </span>
        <span className="flex items-center gap-1.5 bg-zinc-900/80 px-3.5 py-1.5 rounded-full border border-white/15">
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" /> Hen Party Squad
        </span>
      </div>

      {/* Footer Info & Commercial Link */}
      <div className="flex flex-col items-center gap-2 pt-2 text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#e5b842]" />
          <span>No app download or sign up needed. Instant camera to TV sync.</span>
        </div>

        {onOpenCommercialSection && (
          <button
            onClick={onOpenCommercialSection}
            className="text-xs text-zinc-300 hover:text-[#e5b842] transition-colors mt-2 flex items-center gap-1 cursor-pointer font-semibold"
          >
            <span>Are you a venue operator? Explore SingShot Commercial</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#e5b842]" />
          </button>
        )}
      </div>
    </div>
  );
};
