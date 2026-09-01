import React, { useEffect, useState } from 'react';
import { Submission, Venue } from '../../types';
import { BrandedCard } from '../BrandedCard';
import { DataService, subscribeToSync } from '../../services/dataService';
import { CheckCircle2, Clock, Sparkles, RefreshCw, Gift, Share2, Copy, Check, MessageCircle, ExternalLink, Send, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const venueName = venue?.name || venue?.brand_name || 'London Karaoke Club';
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://singshot.app';

  // Construct pre-formatted share message
  const occasionSummary = (() => {
    switch (submission.occasion?.type) {
      case 'birthday':
        return submission.occasion.birthdayName
          ? `🎂 Celebrating ${submission.occasion.birthdayName}'s Birthday!`
          : '🎂 Celebrating a Birthday!';
      case 'hen':
        return submission.occasion.brideName
          ? `💍 ${submission.occasion.brideName}'s Hen Party in London!`
          : '💍 Hen Party squad taking over!';
      case 'stag':
        return submission.occasion.groomName
          ? `🍻 ${submission.occasion.groomName}'s Stag Do in London!`
          : '🍻 Stag Do legends!';
      case 'corporate':
        return submission.occasion.companyName
          ? `🏢 ${submission.occasion.companyName} Team Night Out!`
          : '🏢 Corporate squad on stage!';
      case 'star':
        return '⭐ Star of the Night live on stage!';
      default:
        return '🎤 Living the VIP karaoke life!';
    }
  })();

  const captionQuote = submission.caption ? `"${submission.caption}"` : '';

  const formattedShareMessage = [
    `🎤 Just hit the big screens at ${venueName} with SingShot! ✨`,
    occasionSummary,
    captionQuote,
    `📱 Join the party & put your selfie on the venue screens:`,
    appUrl,
    `#SingShot #${venueName.replace(/[^a-zA-Z0-9]/g, '')} #BigScreen #Nightlife`,
  ]
    .filter(Boolean)
    .join('\n\n');

  // Trigger celebratory confetti when submission confirmation screen mounts
  useEffect(() => {
    // Stage 1: Central gold shower
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#e5b842', '#f59e0b', '#ffffff', '#fbbf24', '#f43f5e'],
      disableForReducedMotion: true,
    });

    // Stage 2: Left and right celebratory cannons
    const timer1 = setTimeout(() => {
      confetti({
        particleCount: 45,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#e5b842', '#ffffff', '#38bdf8', '#a855f7'],
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 45,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#e5b842', '#ffffff', '#38bdf8', '#a855f7'],
        disableForReducedMotion: true,
      });
    }, 200);

    return () => clearTimeout(timer1);
  }, []);

  // Poll for moderation status change
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const list = await DataService.getSubmissions({ event_id: submission.event_id });
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
      } catch (err) {
        console.error('Failed to poll status:', err);
      }
    };

    const interval = setInterval(checkStatus, 3000);
    const unsubscribe = subscribeToSync((event) => {
      if (event.type === 'SUBMISSION_UPDATED' && (event.data as Submission)?.id === submission.id) {
        const updated = event.data as Submission;
        if (updated.status === 'approved' && submission.status !== 'approved') {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        }
        setSubmission(updated);
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [submission.id, submission.status, submission.event_id]);

  const handleManualRefresh = async () => {
    setIsChecking(true);
    try {
      const list = await DataService.getSubmissions({ event_id: submission.event_id });
      const updated = list.find((s) => s.id === submission.id);
      if (updated) setSubmission(updated);
    } finally {
      setTimeout(() => setIsChecking(false), 500);
    }
  };

  const handleNativeOrToggleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `SingShot @ ${venueName}`,
          text: formattedShareMessage,
          url: appUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, open share tray as fallback
        if ((err as Error).name !== 'AbortError') {
          console.log('Native share dismissed or not supported:', err);
        }
      }
    }
    setShowShareOptions((prev) => !prev);
  };

  const handleCopyMessage = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(formattedShareMessage);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = formattedShareMessage;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedShareMessage)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(formattedShareMessage)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(formattedShareMessage)}`;

  return (
    <div className="flex flex-col justify-between h-full max-h-full w-full max-w-md mx-auto p-3 sm:p-5 bg-zinc-950/95 border border-[#e5b842]/40 rounded-3xl backdrop-blur-2xl text-white shadow-[0_20px_50px_rgba(0,0,0,0.85)] text-center select-none">
      {/* Top Banner */}
      <div className="flex flex-col items-center shrink-0">
        <div className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffe066] via-[#f59e0b] to-[#d97706] text-black shadow-[0_0_25px_rgba(229,184,66,0.4)] mb-1">
          <Sparkles className="h-6 w-6 stroke-[2.5] animate-pulse" />
        </div>
        <h2 className="font-serif text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
          YOU'RE IN THE MIX!
        </h2>
        <p className="text-[11px] sm:text-xs text-zinc-300 font-medium max-w-xs">
          Submitted! Watch the main venue wall for your spotlight moment.
        </p>
      </div>

      {/* Moderation Status Pill */}
      <div className="w-full shrink-0 my-1">
        {submission.status === 'approved' ? (
          <div className="flex items-center justify-center gap-1.5 p-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[10px] sm:text-xs font-black shadow-[0_0_15px_rgba(16,185,129,0.2)] tracking-wide">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>APPROVED • BROADCASTING ON STAGE SCREENS</span>
          </div>
        ) : submission.status === 'rejected' ? (
          <div className="flex items-center justify-center gap-1.5 p-2 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[10px] sm:text-xs font-bold">
            <span>Photo was not approved. Tap below to try another shot!</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 p-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-black animate-pulse tracking-wide">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>QUEUED FOR STAGE BROADCAST...</span>
          </div>
        )}
      </div>

      {/* Attached Reward Banner if staff attached one */}
      {submission.reward && (
        <div className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-[#ffe066] via-amber-400 to-[#d97706] text-black shadow-lg border border-yellow-200 shrink-0 my-1">
          <div className="flex items-center justify-center gap-1.5 font-black text-xs uppercase tracking-wide">
            <Gift className="w-4 h-4 shrink-0" /> VIP PERK: {submission.reward.badge}!
          </div>
          <div className="mt-1 pt-1 border-t border-black/20 text-[10px] font-black uppercase tracking-widest bg-black/10 py-1 rounded-lg">
            SHOW TO BAR STAFF • CODE: {submission.reward.code || 'SINGSHOT'}
          </div>
        </div>
      )}

      {/* Visual Card Preview */}
      <div className="w-full max-w-[190px] sm:max-w-[220px] mx-auto my-auto shrink-0 py-1">
        <div className="drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)]">
          <BrandedCard submission={submission} venue={venue} size="thumb" />
        </div>
      </div>

      {/* Action Buttons & Socials */}
      <div className="flex flex-col gap-2 w-full shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleNativeOrToggleShare}
            className="w-full min-h-[42px] py-2 px-3 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 text-white font-extrabold text-xs shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            <span>Share Story</span>
          </button>

          <button
            type="button"
            onClick={handleCopyMessage}
            className={`w-full min-h-[42px] py-2 px-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              copied
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-zinc-900 border-white/20 text-zinc-200 hover:text-white hover:border-white/40'
            }`}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 text-[#e5b842] shrink-0" />}
            <span>{copied ? 'Copied!' : 'Copy Caption'}</span>
          </button>
        </div>

        {showShareOptions && (
          <div className="grid grid-cols-3 gap-1.5 pt-0.5 animate-in fade-in duration-200">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 min-h-[36px] py-1.5 px-1 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] text-[10px] font-bold hover:bg-[#25D366]/30 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span>WhatsApp</span>
            </a>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 min-h-[36px] py-1.5 px-1 rounded-xl bg-[#1DA1F2]/20 border border-[#1DA1F2]/40 text-[#1DA1F2] text-[10px] font-bold hover:bg-[#1DA1F2]/30 transition-colors"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span>X / Tweet</span>
            </a>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 min-h-[36px] py-1.5 px-1 rounded-xl bg-[#1877F2]/20 border border-[#1877F2]/40 text-[#1877F2] text-[10px] font-bold hover:bg-[#1877F2]/30 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>Facebook</span>
            </a>
          </div>
        )}

        <button
          onClick={onReset}
          className="w-full min-h-[46px] py-2.5 px-5 rounded-2xl bg-gradient-to-r from-[#ffe066] via-[#f59e0b] to-[#d97706] text-black font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(229,184,66,0.35)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>TAKE ANOTHER SELFIE</span>
        </button>
      </div>
    </div>
  );
};

