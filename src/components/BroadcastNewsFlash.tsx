import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Flame, Radio, Star, Trophy } from 'lucide-react';
import { Submission, Venue } from '../types';

interface BroadcastNewsFlashProps {
  submission: Submission | null | undefined;
  venue?: Venue;
  isFeatured?: boolean;
  onComplete?: () => void;
}

export const BroadcastNewsFlash: React.FC<BroadcastNewsFlashProps> = ({
  submission,
  venue,
  isFeatured = false,
  onComplete,
}) => {
  const [headlineIndex, setHeadlineIndex] = useState(0);

  // Dynamic news-ticker headlines tailored to guest & occasion
  const occasion = submission?.occasion?.type || 'star';

  const headlines = React.useMemo(() => {
    if (!submission) return [];
    const name = (submission.first_name || 'VIP GUEST').toUpperCase();
    const list = [];

    if (isFeatured) {
      list.push({
        badge: 'STAGE TAKEOVER',
        badgeColor: 'from-amber-400 via-rose-500 to-amber-400',
        icon: <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300 animate-bounce" />,
        text: `★ CROWD FAVORITE: ${name} COMMANDS THE MAIN SCREEN ★`,
        subtext: 'GOLDEN SPOTLIGHT ACTIVATED',
      });
    }

    if (occasion === 'birthday') {
      list.push({
        badge: 'LIVE ON STAGE',
        badgeColor: 'from-yellow-400 via-amber-500 to-orange-500',
        icon: <Sparkles className="w-3.5 h-3.5 text-black" />,
        text: `NOW IN THE SPOTLIGHT: ${name}`,
        subtext: submission.caption || 'RAISE A GLASS & SING OUT LOUD',
      });
    } else if (occasion === 'hen') {
      list.push({
        badge: 'BRIDE SQUAD ALERT',
        badgeColor: 'from-rose-400 via-pink-500 to-rose-400',
        icon: <Sparkles className="w-3.5 h-3.5 text-black" />,
        text: `VIP SQUAD: ${name} TAKES THE SPOTLIGHT`,
        subtext: 'POUR THE PROSECCO & HIT THE CHORUS',
      });
    } else if (occasion === 'corporate') {
      list.push({
        badge: 'TEAM NIGHT HEADLINE',
        badgeColor: 'from-sky-400 via-blue-500 to-indigo-500',
        icon: <Trophy className="w-3.5 h-3.5 text-black" />,
        text: `CHAMPIONS OF THE MIC: ${name} LEADS THE STAGE`,
        subtext: 'HIGH ENERGY LIVE PERFORMANCE',
      });
    } else {
      list.push({
        badge: 'LIVE ON STAGE',
        badgeColor: 'from-amber-400 via-yellow-300 to-amber-500',
        icon: <Zap className="w-3.5 h-3.5 fill-black text-black" />,
        text: `NOW IN THE SPOTLIGHT: ${name}`,
        subtext: submission.caption ? `"${submission.caption}"` : 'BRINGING THE NIGHTLIFE ENERGY',
      });
    }

    // Add secondary venue broadcast item
    list.push({
      badge: 'LIVE FROM SOHO',
      badgeColor: 'from-emerald-400 to-teal-500',
      icon: <Radio className="w-3.5 h-3.5 text-black animate-pulse" />,
      text: `SCAN QR ON SCREEN TO BROADCAST YOUR SELFIE LIVE`,
      subtext: 'LONDON KARAOKE CLUB • REAL-TIME VIP BROADCAST',
    });

    return list;
  }, [submission, occasion, isFeatured, venue]);

  useEffect(() => {
    if (headlines.length <= 1) return;
    const interval = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % headlines.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [headlines.length]);

  const currentHeadline = headlines[headlineIndex] || headlines[0];

  if (!submission || !currentHeadline) {
    return null;
  }

  return (
    <div className="w-full relative z-30 pointer-events-none select-none max-w-4xl mx-auto px-2">
      {/* Upper Glowing Broadcast Bar */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`headline-${submission.id}-${headlineIndex}`}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-2xl bg-zinc-950/85 border border-[#e5b842]/40 backdrop-blur-xl shadow-[0_0_35px_rgba(229,184,66,0.2)] p-2 sm:p-2.5 flex items-center justify-between gap-3"
        >
          {/* Animated golden scanline beam */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#e5b842]/15 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />

          {/* Left: News Flash Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r ${currentHeadline.badgeColor} text-black font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-md`}
            >
              {currentHeadline.icon}
              <span>{currentHeadline.badge}</span>
            </div>
            <div className="hidden sm:flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          </div>

          {/* Center: Dynamic Kinetic Headline Text */}
          <div className="flex-1 min-w-0 text-left">
            <div className="text-xs sm:text-sm font-black text-white uppercase tracking-wide truncate drop-shadow">
              {currentHeadline.text}
            </div>
            <div className="text-[10px] sm:text-[11px] font-semibold text-[#e5b842] tracking-wider truncate flex items-center gap-1.5">
              <span>{currentHeadline.subtext}</span>
            </div>
          </div>

          {/* Right: Soundwave / Graphic EQ Bars */}
          <div className="hidden md:flex items-center gap-0.5 shrink-0 px-2">
            {[40, 70, 30, 90, 50, 80, 45].map((h, i) => (
              <motion.div
                key={i}
                className="w-1 bg-[#e5b842] rounded-full"
                animate={{ height: [6, h / 3, 6] }}
                transition={{
                  duration: 0.8 + (i % 3) * 0.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
