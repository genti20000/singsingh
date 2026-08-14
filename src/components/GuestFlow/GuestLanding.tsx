import React from 'react';
import { Camera, Upload, Sparkles, Tv, ShieldCheck, Heart, PartyPopper } from 'lucide-react';
import { Venue } from '../../types';

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
    <div className="flex flex-col items-center gap-8 w-full max-w-xl mx-auto px-4 py-6 text-white text-center">
      {/* Venue Header Branding */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 bg-zinc-900/80 px-4 py-1.5 rounded-full border border-[#e5b842]/40 shadow-lg">
          <div className="h-2.5 w-2.5 rounded-full bg-[#e5b842] animate-ping" />
          <span className="font-extrabold text-xs tracking-widest text-[#e5b842] uppercase">
            {venue?.name || 'SINGSHOT'}
          </span>
          <span className="text-[10px] text-zinc-400 font-medium">
            {venue?.sub_name || 'at London Karaoke Club'}
          </span>
        </div>
      </div>

      {/* Main Hero Headline */}
      <div className="flex flex-col items-center gap-3">
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
          Take a selfie. <br />
          <span className="bg-gradient-to-r from-[#e5b842] via-yellow-300 to-amber-500 bg-clip-text text-transparent">
            Become part of the night.
          </span>
        </h1>
        <p className="text-zinc-300 text-sm sm:text-base max-w-md font-medium leading-relaxed">
          Snap a photo and see yourself appear on the big screen inside London Karaoke Club.
        </p>
      </div>

      {/* Primary CTAs */}
      <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 w-full max-w-sm">
        <button
          onClick={onTakeSelfie}
          className="flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#e5b842] via-yellow-400 to-amber-500 text-black font-extrabold text-sm sm:text-base shadow-[0_0_25px_rgba(229,184,66,0.4)] hover:scale-102 hover:brightness-110 active:scale-98 transition-all"
        >
          <Camera className="w-5 h-5 text-black" />
          <span>TAKE A SELFIE</span>
        </button>

        <button
          onClick={onUploadPhoto}
          className="flex items-center justify-center gap-2.5 py-4 px-5 rounded-2xl bg-zinc-900/90 border border-white/20 text-white font-bold text-sm hover:bg-zinc-800 hover:border-white/40 active:scale-98 transition-all"
        >
          <Upload className="w-4 h-4 text-[#e5b842]" />
          <span>UPLOAD A PHOTO</span>
        </button>
      </div>

      {/* 3 Step Explanation Grid */}
      <div className="w-full pt-4 border-t border-white/10">
        <h3 className="text-xs font-bold text-[#e5b842] uppercase tracking-widest mb-4">
          How SingShot Works
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Step 01 */}
          <div className="flex flex-col items-center p-4 rounded-2xl bg-zinc-950/70 border border-white/10 text-center">
            <div className="text-[10px] font-black text-[#e5b842] bg-[#e5b842]/10 px-2.5 py-0.5 rounded-full mb-2">
              01 — SNAP
            </div>
            <Camera className="w-6 h-6 text-[#e5b842] mb-1.5" />
            <h4 className="font-bold text-sm text-white">Snap or Upload</h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              Take a fresh selfie or pick your favourite photo from tonight.
            </p>
          </div>

          {/* Step 02 */}
          <div className="flex flex-col items-center p-4 rounded-2xl bg-zinc-950/70 border border-white/10 text-center">
            <div className="text-[10px] font-black text-[#e5b842] bg-[#e5b842]/10 px-2.5 py-0.5 rounded-full mb-2">
              02 — STYLE
            </div>
            <Sparkles className="w-6 h-6 text-amber-400 mb-1.5" />
            <h4 className="font-bold text-sm text-white">Choose Moment</h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              Star of the Night, Birthday, Hen Party, or Team Night frame.
            </p>
          </div>

          {/* Step 03 */}
          <div className="flex flex-col items-center p-4 rounded-2xl bg-zinc-950/70 border border-white/10 text-center">
            <div className="text-[10px] font-black text-[#e5b842] bg-[#e5b842]/10 px-2.5 py-0.5 rounded-full mb-2">
              03 — SHINE
            </div>
            <Tv className="w-6 h-6 text-emerald-400 mb-1.5" />
            <h4 className="font-bold text-sm text-white">Live on Screen</h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              Once approved, your animated card appears live on venue TVs.
            </p>
          </div>
        </div>
      </div>

      {/* Occasions Ribbon Preview */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-400">
        <span className="flex items-center gap-1 bg-zinc-900/60 px-3 py-1 rounded-full border border-white/10">
          <Sparkles className="w-3 h-3 text-[#e5b842]" /> Star of the Night
        </span>
        <span className="flex items-center gap-1 bg-zinc-900/60 px-3 py-1 rounded-full border border-white/10">
          <PartyPopper className="w-3 h-3 text-amber-400" /> Birthdays
        </span>
        <span className="flex items-center gap-1 bg-zinc-900/60 px-3 py-1 rounded-full border border-white/10">
          <Heart className="w-3 h-3 text-rose-400 fill-rose-400" /> Hen Parties
        </span>
      </div>

      {/* Footer Info & Commercial Link */}
      <div className="flex flex-col items-center gap-2 pt-2 text-[11px] text-zinc-500">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#e5b842]" />
          <span>No app download or account needed. Instant selfie to screen.</span>
        </div>

        {onOpenCommercialSection && (
          <button
            onClick={onOpenCommercialSection}
            className="text-xs text-zinc-400 underline hover:text-[#e5b842] transition-colors mt-2"
          >
            Are you a venue operator? See SingShot for Venues
          </button>
        )}
      </div>
    </div>
  );
};
