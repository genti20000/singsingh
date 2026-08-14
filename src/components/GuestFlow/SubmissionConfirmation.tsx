import React, { useEffect, useState } from 'react';
import { Submission, Venue } from '../../types';
import { BrandedCard } from '../BrandedCard';
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

      {/* SHARE TO SOCIALS SECTION */}
      <div className="w-full flex flex-col gap-3 rounded-2xl bg-zinc-900/90 border border-[#e5b842]/30 p-3.5 shadow-lg text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#e5b842]/20 border border-[#e5b842]/50 flex items-center justify-center text-[#e5b842]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-white block">
                Share to Socials
              </span>
              <span className="text-[10px] text-zinc-400">
                Tagged at <strong className="text-zinc-200">{venueName}</strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowShareOptions((prev) => !prev)}
            className="text-[11px] text-[#e5b842] hover:text-amber-300 font-bold flex items-center gap-0.5"
          >
            <span>{showShareOptions ? 'Hide' : 'Options'}</span>
            {showShareOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Main Share Button */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleNativeOrToggleShare}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 text-white font-extrabold text-xs shadow-md hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share to Story</span>
          </button>

          <button
            type="button"
            onClick={handleCopyMessage}
            className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              copied
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-zinc-800 border-white/20 text-zinc-200 hover:text-white hover:border-white/40'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#e5b842]" />}
            <span>{copied ? 'Copied!' : 'Copy Caption'}</span>
          </button>
        </div>

        {/* Direct Social Shortcuts & Message Preview */}
        {showShareOptions && (
          <div className="flex flex-col gap-2.5 pt-2 border-t border-white/10 animate-in fade-in duration-200">
            {/* Quick Share Links */}
            <div className="grid grid-cols-3 gap-1.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] text-[11px] font-bold hover:bg-[#25D366]/30 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-[#1DA1F2]/20 border border-[#1DA1F2]/40 text-[#1DA1F2] text-[11px] font-bold hover:bg-[#1DA1F2]/30 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>X / Post</span>
              </a>

              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-[#1877F2]/20 border border-[#1877F2]/40 text-[#1877F2] text-[11px] font-bold hover:bg-[#1877F2]/30 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Facebook</span>
              </a>
            </div>

            {/* Formatted Message Box */}
            <div className="relative rounded-xl bg-black/60 border border-white/10 p-2.5 text-[11px] text-zinc-300 font-mono leading-relaxed max-h-24 overflow-y-auto whitespace-pre-line select-all">
              {formattedShareMessage}
            </div>
          </div>
        )}
      </div>

      {/* Manual refresh or Submit another */}
      <div className="flex flex-col gap-2.5 w-full pt-1">
        <button
          onClick={handleManualRefresh}
          disabled={isChecking}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-[#e5b842]' : ''}`} />
          <span>Check Screen Status</span>
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

