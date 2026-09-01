import React, { useState } from 'react';
import { OccasionDetails, Venue } from '../../types';
import { BrandedCard } from '../BrandedCard';
import { Sparkles, ShieldCheck, ArrowLeft, Send, Check } from 'lucide-react';

interface GuestDetailsStepProps {
  imageUrl: string;
  occasion: OccasionDetails;
  onSubmit: (firstName: string, caption: string) => void;
  onBack: () => void;
  venue?: Venue;
  isSubmitting?: boolean;
}

const QUICK_CAPTIONS = [
  'Living the Soho Dream 🥂',
  'Karaoke Royalty 🎤',
  'Happy Birthday! 🎂',
  'London Soho Live 🔥',
  'VIP Lounge Vibes 🌟',
  'Squad on Stage 👑',
];

export const GuestDetailsStep: React.FC<GuestDetailsStepProps> = ({
  imageUrl,
  occasion,
  onSubmit,
  onBack,
  venue,
  isSubmitting = false,
}) => {
  const [firstName, setFirstName] = useState('');
  const [caption, setCaption] = useState('');
  const [hasConsent, setHasConsent] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasConsent) {
      setError('Please accept consent to display your photo on venue screens.');
      return;
    }
    setError('');
    const finalName = firstName.trim() || 'VIP Guest';
    onSubmit(finalName, caption.trim());
  };

  // Construct mock submission for live preview
  const mockSubmission = {
    id: 'preview',
    event_id: 'preview',
    venue_id: 'preview',
    first_name: firstName.trim() || 'VIP Guest',
    caption: caption || 'Ready for the big screen! 🎤✨',
    image_url: imageUrl,
    occasion,
    status: 'approved' as const,
    created_at: new Date().toISOString(),
  };

  return (
    <div className="flex flex-col justify-between h-full max-h-full w-full max-w-md mx-auto p-3 sm:p-5 bg-zinc-950/95 border border-[#e5b842]/30 rounded-3xl backdrop-blur-2xl text-white shadow-[0_20px_50px_rgba(0,0,0,0.8)] select-none">
      {/* Header */}
      <div className="text-center shrink-0">
        <div className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-[#e5b842] uppercase tracking-widest bg-[#e5b842]/10 px-3 py-0.5 rounded-full border border-[#e5b842]/30">
          Step 3 of 3 • Stage Details
        </div>
        <h2 className="font-serif text-lg sm:text-2xl font-black mt-1 text-white tracking-tight">
          Your Stage Details
        </h2>
        <p className="text-[11px] sm:text-xs text-zinc-400">
          Add your name and an optional message for venue screens
        </p>
      </div>

      {/* Live Card Preview */}
      <div className="flex flex-col items-center my-auto shrink-0 py-1">
        <div className="w-full max-w-[190px] sm:max-w-[220px] scale-95 transform transition-all drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]">
          <BrandedCard submission={mockSubmission} venue={venue} size="thumb" />
        </div>
      </div>

      {/* Form & Quick Captions */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold text-zinc-300 block mb-1 uppercase tracking-wide">
              Your Name / Nickname
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Sophie"
              maxLength={24}
              className="w-full bg-zinc-900/90 border border-white/20 rounded-xl p-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e5b842] focus:ring-1 focus:ring-[#e5b842] transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-300 block mb-1 uppercase tracking-wide">
              Caption (Optional)
            </label>
            <input
              type="text"
              maxLength={60}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Living the Soho Dream! 🎤"
              className="w-full bg-zinc-900/90 border border-white/20 rounded-xl p-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e5b842] focus:ring-1 focus:ring-[#e5b842] transition-colors"
            />
          </div>
        </div>

        {/* Quick Caption Suggestions */}
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mr-1">Quick:</span>
          {QUICK_CAPTIONS.slice(0, 3).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCaption(item)}
              className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                caption === item
                  ? 'bg-[#e5b842] text-black border-[#e5b842]'
                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white hover:border-white/30'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Consent Checkbox */}
        <label className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-900/70 border border-white/10 cursor-pointer">
          <input
            type="checkbox"
            checked={hasConsent}
            onChange={(e) => setHasConsent(e.target.checked)}
            className="accent-[#e5b842] h-4 w-4 rounded shrink-0 cursor-pointer"
          />
          <div className="text-[10px] sm:text-[11px] text-zinc-300 leading-tight">
            I agree to display my selfie on {venue?.name || 'SingShot'} venue screens tonight.
          </div>
        </label>

        {error && (
          <div className="text-[10px] text-rose-400 bg-rose-500/10 p-2 rounded-xl border border-rose-500/30 text-center font-medium">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-2.5 pt-1">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="min-h-[44px] px-4 py-2 rounded-2xl bg-zinc-900 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 min-h-[44px] py-2.5 px-5 rounded-2xl bg-gradient-to-r from-[#ffe066] via-[#f59e0b] to-[#d97706] text-black font-black text-xs sm:text-sm shadow-[0_0_30px_rgba(229,184,66,0.45)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <span className="animate-spin h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full" />
                <span>BROADCASTING...</span>
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-black stroke-[2.5]" />
                <span className="uppercase tracking-wider">SUBMIT TO BIG SCREEN</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
