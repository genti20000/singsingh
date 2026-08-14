import React, { useEffect, useState } from 'react';
import { Submission, Venue } from '../../types';
import { BrandedCard } from '../BrandedCard';
import { CheckCircle2, Clock, Sparkles, RefreshCw, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SubmissionConfirmationProps {
  submission: Submission;
  venue?: Venue;
  onReset: () => void;
}

export const SubmissionConfirmation: React.FC<SubmissionConfirmationProps> = ({
  submission: initialSubmission,
  venue,
  onReset,
}) => {
  const [submission, setSubmission] = useState<Submission>(initialSubmission);
  const [isChecking, setIsChecking] = useState(false);

  // Poll for moderation status change
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/submissions?event_id=${submission.event_id}`);
        if (res.ok) {
          const list: Submission[] = await res.json();
          const updated = list.find((s) => s.id === submission.id);
          if (updated) {
            if (updated.status === 'approved' && submission.status !== 'approved') {
              // Trigger celebratory confetti on approval!
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#e5b842', '#ffffff', '#f59e0b'],
              });
            }
            setSubmission(updated);
          }
        }
      } catch (err) {
        console.error('Failed to poll status:', err);
      }
    };

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [submission.id, submission.status, submission.event_id]);

  const handleManualRefresh = async () => {
    setIsChecking(true);
    try {
      const res = await fetch(`/api/submissions?event_id=${submission.event_id}`);
      if (res.ok) {
        const list: Submission[] = await res.json();
        const updated = list.find((s) => s.id === submission.id);
        if (updated) setSubmission(updated);
      }
    } finally {
      setTimeout(() => setIsChecking(false), 500);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-md mx-auto p-4 sm:p-6 bg-zinc-950/90 border border-[#e5b842]/40 rounded-3xl backdrop-blur-xl text-white shadow-2xl text-center">
      {/* Top Banner */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e5b842]/20 border-2 border-[#e5b842] text-[#e5b842] shadow-[0_0_20px_rgba(229,184,66,0.3)]">
          <Sparkles className="h-7 w-7 animate-pulse" />
        </div>
        <h2 className="font-serif text-3xl font-extrabold tracking-wide text-white uppercase mt-1">
          YOU'RE IN.
        </h2>
        <p className="text-xs sm:text-sm text-zinc-300 max-w-xs font-medium">
          Your SingShot is submitted. Keep an eye on the venue screens!
        </p>
      </div>

      {/* Moderation Status Pill */}
      <div className="w-full">
        {submission.status === 'approved' ? (
          <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>APPROVED! YOUR PHOTO IS LIVE ON VENUE SCREENS</span>
          </div>
        ) : submission.status === 'rejected' ? (
          <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold">
            <span>Photo was not approved. Please try submitting another photo!</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>WAITING FOR VENUE APPROVAL...</span>
          </div>
        )}
      </div>

      {/* Attached Reward Banner if staff attached one */}
      {submission.reward && (
        <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black shadow-xl border-2 border-yellow-200">
          <div className="flex items-center justify-center gap-2 font-extrabold text-sm uppercase">
            <Gift className="w-5 h-5" /> YOU'VE WON {submission.reward.badge}!
          </div>
          <p className="text-xs font-bold mt-1 text-black/80">
            {submission.reward.title}
          </p>
          <div className="mt-2 pt-2 border-t border-black/20 text-[11px] font-black uppercase tracking-widest bg-black/10 py-1.5 rounded-lg">
            SHOW THIS SCREEN TO THE BAR • CODE: {submission.reward.code || 'SINGSHOT'}
          </div>
        </div>
      )}

      {/* Visual Card Preview */}
      <div className="w-full max-w-[320px] my-1">
        <BrandedCard submission={submission} venue={venue} size="normal" />
      </div>

      {/* Manual refresh or Submit another */}
      <div className="flex flex-col gap-2.5 w-full pt-2">
        <button
          onClick={handleManualRefresh}
          disabled={isChecking}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-[#e5b842]' : ''}`} />
          <span>Check Status</span>
        </button>

        <button
          onClick={onReset}
          className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#e5b842] to-amber-500 text-black font-extrabold text-sm shadow-lg hover:brightness-110 active:scale-98 transition-all"
        >
          TAKE ANOTHER SELFIE
        </button>
      </div>
    </div>
  );
};
