import React, { useState } from 'react';
import { OccasionDetails, Venue } from '../../types';
import { BrandedCard } from '../BrandedCard';
import { Sparkles, ShieldCheck } from 'lucide-react';

interface GuestDetailsStepProps {
  imageUrl: string;
  occasion: OccasionDetails;
  onSubmit: (firstName: string, caption: string) => void;
  onBack: () => void;
  venue?: Venue;
  isSubmitting?: boolean;
}

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
    <div className="flex flex-col gap-5 w-full max-w-md mx-auto p-4 sm:p-6 bg-zinc-950/85 border border-[#e5b842]/30 rounded-3xl backdrop-blur-xl text-white shadow-2xl">
      <div className="text-center">
        <span className="text-[10px] font-bold text-[#e5b842] uppercase tracking-widest bg-[#e5b842]/10 px-3 py-1 rounded-full border border-[#e5b842]/30">
          Step 3 of 3
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold mt-2 text-white">
          Your Details
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Only requested so staff can introduce you on screen
        </p>
      </div>

      {/* Live Card Preview */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#e5b842]" /> Live Card Preview
        </span>
        <div className="w-full max-w-[280px] scale-95 transform transition-all">
          <BrandedCard submission={mockSubmission} venue={venue} size="thumb" />
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-zinc-300 block mb-1">
            First Name or Nickname <span className="text-zinc-500 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="e.g. Sophie (or leave blank for VIP Guest)"
            className="w-full bg-zinc-900 border border-white/20 rounded-xl p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e5b842] transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-300 block mb-1">
            Short Caption <span className="text-zinc-500 font-normal">(Optional, max 60 chars)</span>
          </label>
          <input
            type="text"
            maxLength={60}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. Singing my heart out tonight! 🎤"
            className="w-full bg-zinc-900 border border-white/20 rounded-xl p-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e5b842] transition-colors"
          />
        </div>

        {/* Consent Checkbox */}
        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/60 border border-white/10 cursor-pointer">
          <input
            type="checkbox"
            checked={hasConsent}
            onChange={(e) => setHasConsent(e.target.checked)}
            className="mt-0.5 accent-[#e5b842] h-4 w-4 rounded"
          />
          <div className="text-xs text-zinc-300 leading-tight">
            I agree to have my selfie displayed on {venue?.name || 'SingShot'} venue screens during tonight's event.
          </div>
        </label>

        {error && (
          <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30 text-center">
            {error}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-[#e5b842]" />
          <span>No account creation or email required</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="px-5 py-3 rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-[#e5b842] via-yellow-400 to-amber-500 text-black font-extrabold text-sm shadow-[0_0_20px_rgba(229,184,66,0.4)] hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Submitting...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> SUBMIT TO SCREEN
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
