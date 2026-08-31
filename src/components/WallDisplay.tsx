import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { Submission, Venue, WallLayoutMode } from '../types';
import { BrandedCard } from './BrandedCard';
import { ParticleCanvas } from './ParticleCanvas';
import { LondonKaraokeLogo } from './LondonKaraokeLogo';
import { DataService, subscribeToSync, preloadImages } from '../services/dataService';
import {
  Sparkles,
  Maximize2,
  Minimize2,
  Radio,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Zap,
  Mic,
  Music,
  QrCode,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WallDisplayProps {
  venue: Venue;
}

export const WallDisplay: React.FC<WallDisplayProps> = ({ venue }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [layoutMode, setLayoutMode] = useState<WallLayoutMode>(
    venue.wall_layout_mode || 'spotlight'
  );
  const [isPaused, setIsPaused] = useState(false);
  const [featuredSub, setFeaturedSub] = useState<Submission | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeString, setTimeString] = useState('');
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [newArrivalToast, setNewArrivalToast] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [heroOrientation, setHeroOrientation] = useState<'portrait' | 'landscape' | 'square'>('landscape');
  const [liveRailIndex, setLiveRailIndex] = useState(0);

  const liveRailMessages = [
    'Soho’s favourite voices are taking the spotlight',
    'Scan the screen to join tonight’s VIP broadcast',
    'Raise a glass, hit the chorus, own the room',
  ];

  // Ref tracking previous submission IDs to detect new arrivals without flickering
  const prevSubIdsRef = useRef<Set<string>>(new Set());
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync layout mode from props if updated
  useEffect(() => {
    if (venue.wall_layout_mode && venue.wall_layout_mode !== layoutMode) {
      setLayoutMode(venue.wall_layout_mode);
    }
  }, [venue.wall_layout_mode, layoutMode]);

  // 1. Generate high-resolution QR Code for guest scanning
  useEffect(() => {
    const appUrl = window.location.origin;
    QRCode.toDataURL(appUrl, {
      margin: 1,
      width: 320,
      color: {
        dark: '#000000',
        light: '#e5b842',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, []);

  // 2. Clock tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveRailIndex((prev) => (prev + 1) % liveRailMessages.length);
    }, 5200);
    return () => clearInterval(interval);
  }, [liveRailMessages.length]);

  // 3. Background Auto-Refresh Engine: pulls approved submissions from venue queue
  const fetchApproved = useCallback(async (isManualTrigger = false) => {
    if (isManualTrigger) {
      setIsAutoSyncing(true);
    }
    try {
      const list = await DataService.getSubmissions({ status: 'approved' });
      const currentList = list || [];

      // Check for newly added photos to the venue queue
      const incomingIds = new Set(currentList.map((s) => s.id));
      const hasInitialLoad = prevSubIdsRef.current.size > 0;

      // Find if any brand new submission arrived
      if (hasInitialLoad && currentList.length > 0) {
        const brandNew = currentList.find((s) => !prevSubIdsRef.current.has(s.id));
        if (brandNew) {
          // Preload the incoming photo asset immediately
          preloadImages([brandNew.image_url]);

          // Trigger live screen toast notification
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          setNewArrivalToast({
            id: brandNew.id,
            name: brandNew.first_name || 'VIP Guest',
            avatar: brandNew.image_url,
          });

          toastTimeoutRef.current = setTimeout(() => {
            setNewArrivalToast(null);
          }, 4500);
        }
      }

      // Preload next image assets in background for seamless transitions
      if (currentList.length > 0) {
        preloadImages(currentList.slice(0, 8).map((s) => s.image_url));
      }

      // Update ID tracking ref
      prevSubIdsRef.current = incomingIds;

      setSubmissions((prev) => {
        // If count or content changed, update state
        if (
          prev.length !== currentList.length ||
          prev.some((item, idx) => item.id !== currentList[idx]?.id)
        ) {
          return currentList;
        }
        return prev;
      });

      // Keep current index in safe range
      setCurrentIndex((prevIdx) => {
        if (currentList.length === 0) return 0;
        return prevIdx >= currentList.length ? 0 : prevIdx;
      });

      // Check for active featured takeover trigger
      const featured = currentList.find((s) => s.featured);
      if (featured && featured.id !== featuredSub?.id) {
        setFeaturedSub(featured);
        setCurrentIndex(currentList.findIndex((submission) => submission.id === featured.id));
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#e5b842', '#ffffff', '#f43f5e', '#38bdf8'],
        });
      } else if (!featured && featuredSub) {
        setFeaturedSub(null);
      }

      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Failed to auto-refresh wall submissions:', err);
    } finally {
      if (isManualTrigger) {
        setTimeout(() => setIsAutoSyncing(false), 400);
      }
    }
  }, [featuredSub]);

  // Set up Dual Background Auto-Refresh:
  // 1. Resilient Polling Loop (every 2.5 seconds)
  // 2. Real-time Event Stream Listener (SSE + BroadcastChannel + Window CustomEvents)
  // 3. Tab Visibility Change / Window Focus Trigger
  useEffect(() => {
    // Initial fetch
    fetchApproved(false);

    // Continuous background auto-refresh interval (every 2.5s)
    const pollInterval = setInterval(() => {
      fetchApproved(false);
    }, 2500);

    // Realtime event sync
    const unsubscribe = subscribeToSync((event) => {
      if (
        event.type === 'SUBMISSION_CREATED' ||
        event.type === 'SUBMISSION_UPDATED' ||
        event.type === 'SUBMISSION_DELETED' ||
        event.type === 'SUBMISSION_FEATURED' ||
        event.type === 'NEW_PHOTO_APPROVED' ||
        event.type === 'STORAGE_CHANGE' ||
        event.type === 'CONNECTED'
      ) {
        fetchApproved(false);
      }
      if (event.type === 'VENUE_UPDATED' && (event.data as Venue)?.wall_layout_mode) {
        setLayoutMode((event.data as Venue).wall_layout_mode!);
      }
      if (event.type === 'WALL_LAYOUT_CHANGED' && (event.data as { mode?: WallLayoutMode })?.mode) {
        setLayoutMode((event.data as { mode: WallLayoutMode }).mode);
      }
    });

    // Handle Tab Visibility & Window Focus (instant refresh when returning to tab)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchApproved(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('online', handleVisibilityOrFocus);

    return () => {
      clearInterval(pollInterval);
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('online', handleVisibilityOrFocus);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [fetchApproved]);

  // 4. Auto Rotate Cards based on current layout mode
  useEffect(() => {
    if (submissions.length <= 1 || isPaused) return;

    const intervalMap: Record<WallLayoutMode, number> = {
      spotlight: 6000,
      quad: 8000,
      mosaic: 8000,
      duet: 7000,
      carousel: 6000,
    };

    const intervalSeconds = intervalMap[layoutMode] || 6000;

    const rotateTimer = setInterval(() => {
      if (layoutMode === 'spotlight' || layoutMode === 'carousel') {
        setCurrentIndex((prev) => (prev + 1) % submissions.length);
      } else if (layoutMode === 'quad') {
        setCurrentIndex((prev) => (prev + 4 >= submissions.length ? 0 : prev + 4));
      } else if (layoutMode === 'mosaic') {
        setCurrentIndex((prev) => (prev + 3 >= submissions.length ? 0 : prev + 3));
      } else if (layoutMode === 'duet') {
        setCurrentIndex((prev) => (prev + 2 >= submissions.length ? 0 : prev + 2));
      }
    }, intervalSeconds);

    return () => clearInterval(rotateTimer);
  }, [submissions.length, isPaused, layoutMode]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const activeSubmission = submissions[currentIndex] || submissions[0] || null;

  useEffect(() => {
    setHeroOrientation('landscape');
  }, [activeSubmission?.id]);

  const heroRailItems = useMemo(() => {
    if (!activeSubmission || submissions.length < 2) return { left: [] as Submission[], right: [] as Submission[] };
    const activeIdx = Math.max(0, submissions.findIndex((submission) => submission.id === activeSubmission.id));
    const itemAt = (offset: number) => submissions[(activeIdx + offset + submissions.length) % submissions.length];
    return {
      left: [itemAt(-1), itemAt(-2), itemAt(-3)].filter((submission, index, list) => submission && list.findIndex((item) => item.id === submission.id) === index),
      right: [itemAt(1), itemAt(2), itemAt(3)].filter((submission, index, list) => submission && list.findIndex((item) => item.id === submission.id) === index),
    };
  }, [activeSubmission, submissions]);

  // Quad Grid Slice (4 cards)
  const quadSubmissions = useMemo(() => {
    if (submissions.length === 0) return [];
    if (submissions.length <= 4) return submissions;
    const result: Submission[] = [];
    for (let i = 0; i < 4; i++) {
      result.push(submissions[(currentIndex + i) % submissions.length]);
    }
    return result;
  }, [submissions, currentIndex]);

  // Mosaic Masonry Slice (5 cards)
  const mosaicSubmissions = useMemo(() => {
    if (submissions.length === 0) return [];
    if (submissions.length <= 5) return submissions;
    const result: Submission[] = [];
    for (let i = 0; i < 5; i++) {
      result.push(submissions[(currentIndex + i) % submissions.length]);
    }
    return result;
  }, [submissions, currentIndex]);

  // Duet Slice (2 cards)
  const duetSubmissions = useMemo(() => {
    if (submissions.length === 0) return [];
    if (submissions.length === 1) return [submissions[0], submissions[0]];
    const first = submissions[currentIndex % submissions.length];
    const second = submissions[(currentIndex + 1) % submissions.length];
    return [first, second];
  }, [submissions, currentIndex]);

  // Carousel Slice (Previous, Active, Next)
  const carouselDeck = useMemo(() => {
    if (submissions.length === 0) return { prev: null, current: null, next: null };
    const prevIdx = (currentIndex - 1 + submissions.length) % submissions.length;
    const nextIdx = (currentIndex + 1) % submissions.length;
    return {
      prev: submissions.length > 1 ? submissions[prevIdx] : null,
      current: submissions[currentIndex] || submissions[0],
      next: submissions.length > 1 ? submissions[nextIdx] : null,
    };
  }, [submissions, currentIndex]);

  return (
    <div className="singshot-wall relative h-screen w-screen overflow-hidden bg-[#050505] text-white flex flex-col justify-between select-none font-sans">
      {/* Background Nightlife Ambient Particle Canvas */}
      <ParticleCanvas color="#e5b842" density={75} speed={0.8} />

      {/* Real-time New Photo Arrival Toast Banner (Smooth Slide-In) */}
      <AnimatePresence>
        {newArrivalToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="flex items-center gap-3 bg-zinc-950/95 border-2 border-[#e5b842] px-4 py-2 rounded-full shadow-[0_0_35px_rgba(229,184,66,0.6)] backdrop-blur-xl">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#e5b842] shrink-0 bg-black">
                <img
                  src={newArrivalToast.avatar}
                  alt={newArrivalToast.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#e5b842] animate-spin" />
                <span className="text-xs font-black text-white tracking-wide uppercase">
                  ✨ NEW PHOTO BROADCAST: <span className="text-[#e5b842]">{newArrivalToast.name}</span>
                </span>
                <span className="bg-[#e5b842] text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  JUST ADDED
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP FLOATING HUD BAR: Left Venue HUD, Center Occasion Banner & Right QR Widget */}
      <header className="relative z-40 w-full px-4 pt-3 sm:pt-4 flex items-center justify-between gap-3">
        {/* Left HUD: Branding, Live Status, Auto-Sync Pulse, Clock & Controls */}
        <div className="flex items-center gap-2.5 bg-black/90 backdrop-blur-xl border border-[#e5b842]/70 p-2 sm:p-2.5 pr-3.5 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.85)]">
          {/* Venue Mini Logo */}
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full overflow-hidden shadow-[0_0_20px_rgba(229,184,66,0.5)] shrink-0 border border-[#e5b842]/80 bg-black">
            <LondonKaraokeLogo className="w-10 h-10 sm:w-11 sm:h-11" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm sm:text-base tracking-wider text-[#e5b842] uppercase leading-none">
                SINGSHOT
              </span>
              <span className="text-[10px] font-bold text-[#e5b842]/90 tracking-wide uppercase">
                ☆ STAR OF THE NIGHT
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-zinc-300 font-medium leading-none mt-1.5">
              <span className="flex items-center gap-1 text-zinc-400">
                <span>📍</span>
                <span className="truncate max-w-[130px]">{venue.sub_name || 'London Karaoke Club'}</span>
              </span>
              <span className="text-[#e5b842]">•</span>
              <span className="flex items-center gap-1 text-zinc-300 font-mono tracking-tight">
                <span>🕒</span>
                <span>{timeString}</span>
              </span>
            </div>
          </div>

          {/* Quick Controls: Refresh, Play/Pause, Fullscreen */}
          <div className="flex items-center gap-1 ml-1.5 pl-1.5 border-l border-white/15">
            <button
              onClick={() => fetchApproved(true)}
              className="p-1.5 rounded-xl bg-zinc-900/90 border border-white/10 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Force Queue Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAutoSyncing ? 'animate-spin text-[#e5b842]' : ''}`} />
            </button>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 rounded-xl bg-zinc-900/90 border border-white/10 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
              title={isPaused ? 'Resume live slideshow' : 'Pause slideshow'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-[#e5b842]" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-xl bg-zinc-900/90 border border-white/10 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Toggle Fullscreen Mode"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-[#e5b842]" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Quiet rotating venue rail keeps the wall alive without competing with the hero. */}
        <div className="live-from-soho-rail hidden lg:flex min-w-0 flex-1 items-center justify-center gap-4 mx-2 rounded-2xl border border-white/10 bg-black/55 px-5 py-2.5 backdrop-blur-xl">
          <div className="flex items-center gap-2 shrink-0 text-[#e5b842]">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.22em]">Live from Soho</span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={liveRailIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="min-w-0 truncate text-center text-xs font-semibold tracking-wide text-zinc-300"
            >
              {liveRailMessages[liveRailIndex]}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Right HUD: QR Code Scanning Widget */}
        <div className="wall-qr-widget flex items-center gap-2.5 bg-black/75 backdrop-blur-xl rounded-2xl p-1.5 sm:p-2 pr-3 shadow-[0_4px_28px_rgba(229,184,66,0.25)] border border-[#e5b842]/70 shrink-0">
          {/* Yellow QR with Radar Glow */}
          <div className="relative shrink-0">
            <div className="absolute -inset-1 rounded-xl bg-[#e5b842]/30 blur-md animate-pulse pointer-events-none" />
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="Scan to join live screen"
                className="relative z-10 w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] rounded-xl shadow-md bg-[#e5b842] p-0.5 border border-black/30"
              />
            ) : (
              <div className="relative z-10 w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] rounded-xl bg-[#e5b842] flex items-center justify-center">
                <QrCode className="w-7 h-7 text-black" />
              </div>
            )}
            <span className="absolute -top-1 -right-1 z-20 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e5b842] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#e5b842]" />
            </span>
          </div>

          <div className="text-left flex flex-col justify-center">
            <div className="text-xs sm:text-sm font-black text-[#e5b842] tracking-wider uppercase leading-none drop-shadow">
              SCAN TO JOIN
            </div>
            <span className="text-[10px] sm:text-[11px] text-zinc-300 font-medium leading-tight mt-1">
              Snap selfie with phone
            </span>
            <span className="text-[9px] text-[#e5b842] font-black uppercase tracking-wider mt-0.5">
              INSTANT BIG SCREEN
            </span>
          </div>
        </div>
      </header>

      {/* MAIN WALL STAGE: Centered Portrait + Smooth Cross-Fade Transitions */}
      <main className="wall-main flex-1 w-full h-full flex flex-col justify-center items-center relative overflow-hidden py-2 px-4">
        {submissions.length === 0 ? (
          /* Empty Stage Waiting State */
          <div className="flex flex-col items-center justify-center text-center p-6 sm:p-10 max-w-lg mx-auto relative z-10">
            <div className="relative mb-6">
              <div className="absolute -inset-4 rounded-full bg-[#e5b842]/20 blur-xl animate-pulse" />
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-zinc-950 border-2 border-[#e5b842] p-4 flex items-center justify-center shadow-[0_0_50px_rgba(229,184,66,0.3)]">
                {qrCodeDataUrl ? (
                  <img src={qrCodeDataUrl} alt="Scan QR Code" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <Sparkles className="w-12 h-12 text-[#e5b842] animate-spin" />
                )}
              </div>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-black text-[#e5b842] mb-3 tracking-wide drop-shadow-md">
              BECOME TONIGHT'S STAR
            </h2>
            <p className="text-zinc-300 text-sm sm:text-base mb-6 leading-relaxed">
              Scan the QR code with your phone camera to snap a live karaoke photo and broadcast it to this big screen!
            </p>
            <div className="inline-flex items-center gap-2 bg-[#e5b842]/15 border border-[#e5b842]/40 px-5 py-2.5 rounded-full text-xs font-black text-[#e5b842] uppercase tracking-wider animate-pulse">
              <Radio className="w-4 h-4 text-[#e5b842]" />
              <span>Awaiting First Stage Selfie • Auto-Sync Active</span>
            </div>
          </div>
        ) : (
          /* ACTIVE PHOTO STAGE WITH SMOOTH CROSS-FADE */
          <div className="wall-stage w-full h-full flex items-center justify-center relative overflow-hidden">
            {/* 1. SPOTLIGHT SOLO HERO MODE: image-first wide TV composition */}
            {layoutMode === 'spotlight' && activeSubmission && (
              <div className="spotlight-hero w-full h-full max-w-[1500px] mx-auto flex items-center justify-center relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSubmission.id}
                    initial={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
                    transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
                    className="spotlight-hero-inner w-full h-full flex items-center justify-center gap-3 sm:gap-5 lg:gap-7 relative"
                  >
                    {/* Same-photo ambient fill gives portrait photos a branded stage without cropping faces. */}
                    <div
                      className="spotlight-backdrop rounded-[28px]"
                      style={{ backgroundImage: `url(${activeSubmission.image_url})` }}
                    />

                    {/* Slim side rails frame the hero image and keep the photo queue visible. */}
                    <div className="spotlight-thumb-rail spotlight-thumb-rail-left" aria-label="Previous guest photos">
                      {heroRailItems.left.map((submission) => (
                        <button
                          type="button"
                          key={`left-${submission.id}`}
                          onClick={() => {
                            setFeaturedSub(null);
                            setCurrentIndex(submissions.findIndex((item) => item.id === submission.id));
                          }}
                          className="spotlight-thumb"
                          aria-label={`Show ${submission.first_name || 'VIP guest'}`}
                        >
                          <img src={submission.image_url} alt="" />
                        </button>
                      ))}
                    </div>

                    <div className={`spotlight-hero-media spotlight-hero-media-${heroOrientation}`}>
                      <img
                        src={activeSubmission.image_url}
                        alt={activeSubmission.first_name || 'VIP guest'}
                        onLoad={(event) => {
                          const { naturalWidth, naturalHeight } = event.currentTarget;
                          setHeroOrientation(
                            naturalHeight > naturalWidth * 1.08
                              ? 'portrait'
                              : naturalWidth > naturalHeight * 1.08
                              ? 'landscape'
                              : 'square'
                          );
                        }}
                        className="spotlight-hero-image cursor-pointer"
                        onClick={() => setCurrentIndex((prev) => (prev + 1) % submissions.length)}
                      />

                      <div className="spotlight-hero-copy">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <span className="spotlight-hero-name">
                            {activeSubmission.first_name ? activeSubmission.first_name.toUpperCase() : 'VIP GUEST'}
                          </span>
                          {(activeSubmission.featured || featuredSub?.id === activeSubmission.id) && (
                            <span className="spotlight-featured-pill">FEATURED VIP</span>
                          )}
                        </div>
                        <p className="spotlight-hero-message">
                          {activeSubmission.occasion?.type === 'birthday'
                            ? `Happy Birthday${activeSubmission.occasion.birthdayName ? `, ${activeSubmission.occasion.birthdayName}` : ''} — ${activeSubmission.caption || 'raise a glass and sing out loud'}`
                            : activeSubmission.caption || 'Taking the spotlight at London Karaoke Club'}
                        </p>
                        {activeSubmission.reward && (
                          <span className="spotlight-reward-pill">🎁 {activeSubmission.reward.title} unlocked</span>
                        )}
                      </div>
                    </div>

                    <div className="spotlight-thumb-rail spotlight-thumb-rail-right" aria-label="Next guest photos">
                      {heroRailItems.right.map((submission) => (
                        <button
                          type="button"
                          key={`right-${submission.id}`}
                          onClick={() => {
                            setFeaturedSub(null);
                            setCurrentIndex(submissions.findIndex((item) => item.id === submission.id));
                          }}
                          className="spotlight-thumb"
                          aria-label={`Show ${submission.first_name || 'VIP guest'}`}
                        >
                          <img src={submission.image_url} alt="" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {/* 2. QUAD (2x2) GRID MODE */}
            {layoutMode === 'quad' && (
              <div className="w-full h-full max-w-6xl mx-auto flex items-center justify-center p-3 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full h-full max-h-full items-center justify-center">
                  <AnimatePresence mode="wait">
                    {quadSubmissions.map((sub, idx) => (
                      <motion.div
                        key={`quad-${sub.id}-${idx}`}
                        initial={{ opacity: 0, scale: 0.92, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: -15 }}
                        transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                        className="flex items-center justify-center w-full h-full"
                      >
                        <BrandedCard
                          submission={sub}
                          venue={venue}
                          size="md"
                          showReward={true}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* 3. MOSAIC MASONRY MODE */}
            {layoutMode === 'mosaic' && (
              <div className="w-full h-full max-w-7xl mx-auto flex items-center justify-center p-2 sm:p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full items-center">
                  {/* Left Column: Large Highlight Hero Card */}
                  {mosaicSubmissions[0] && (
                    <motion.div
                      key={`mosaic-0-${mosaicSubmissions[0].id}`}
                      initial={{ opacity: 0, x: -30, scale: 0.92 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -30, scale: 0.92 }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-center justify-center md:col-span-1"
                    >
                      <BrandedCard
                        submission={mosaicSubmissions[0]}
                        venue={venue}
                        size="large"
                        showReward={true}
                      />
                    </motion.div>
                  )}

                  {/* Center Column: 2 Stacked Cards */}
                  <div className="flex flex-col gap-2.5 justify-center items-center">
                    {mosaicSubmissions[1] && (
                      <motion.div
                        key={`mosaic-1-${mosaicSubmissions[1].id}`}
                        initial={{ opacity: 0, y: -20, scale: 0.88 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.88 }}
                        transition={{ duration: 0.5, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full flex justify-center"
                      >
                        <BrandedCard
                          submission={mosaicSubmissions[1]}
                          venue={venue}
                          size="sm"
                          showReward={false}
                        />
                      </motion.div>
                    )}
                    {mosaicSubmissions[2] && (
                      <motion.div
                        key={`mosaic-2-${mosaicSubmissions[2].id}`}
                        initial={{ opacity: 0, y: 20, scale: 0.88 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.88 }}
                        transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full flex justify-center"
                      >
                        <BrandedCard
                          submission={mosaicSubmissions[2]}
                          venue={venue}
                          size="sm"
                          showReward={false}
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Right Column: 2 Stacked Cards */}
                  <div className="flex flex-col gap-2.5 justify-center items-center">
                    {mosaicSubmissions[3] && (
                      <motion.div
                        key={`mosaic-3-${mosaicSubmissions[3].id}`}
                        initial={{ opacity: 0, x: 20, scale: 0.88 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.88 }}
                        transition={{ duration: 0.5, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full flex justify-center"
                      >
                        <BrandedCard
                          submission={mosaicSubmissions[3]}
                          venue={venue}
                          size="sm"
                          showReward={false}
                        />
                      </motion.div>
                    )}
                    {mosaicSubmissions[4] && (
                      <motion.div
                        key={`mosaic-4-${mosaicSubmissions[4].id}`}
                        initial={{ opacity: 0, y: 20, scale: 0.88 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.88 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full flex justify-center"
                      >
                        <BrandedCard
                          submission={mosaicSubmissions[4]}
                          venue={venue}
                          size="sm"
                          showReward={false}
                        />
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. DUET SIDE-BY-SIDE SPLIT MODE */}
            {layoutMode === 'duet' && (
              <div className="w-full h-full max-w-6xl mx-auto flex items-center justify-center p-3 sm:p-5 relative">
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-8 w-full h-full relative">
                  {/* Left Duet Performer */}
                  {duetSubmissions[0] && (
                    <motion.div
                      key={`duet-left-${duetSubmissions[0].id}-${currentIndex}`}
                      initial={{ opacity: 0, x: -40, scale: 0.94 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -40, scale: 0.94 }}
                      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                      className="flex-1 flex justify-center items-center w-full"
                    >
                      <BrandedCard
                        submission={duetSubmissions[0]}
                        venue={venue}
                        size="large"
                        showReward={true}
                      />
                    </motion.div>
                  )}

                  {/* Center Stage Duet Visual Connector */}
                  <div className="flex flex-col items-center justify-center shrink-0 z-20 my-[-10px] md:my-0">
                    <div className="flex items-center gap-1.5 bg-zinc-950/90 border-2 border-[#e5b842] px-4 py-2 rounded-full shadow-[0_0_30px_rgba(229,184,66,0.6)] backdrop-blur-xl animate-pulse">
                      <Mic className="w-4 h-4 text-[#e5b842] animate-bounce" />
                      <span className="font-black text-xs uppercase tracking-widest text-[#e5b842]">
                        STAGE DUET
                      </span>
                      <Music className="w-4 h-4 text-[#e5b842]" />
                    </div>
                  </div>

                  {/* Right Duet Performer */}
                  {duetSubmissions[1] && (
                    <motion.div
                      key={`duet-right-${duetSubmissions[1].id}-${currentIndex}`}
                      initial={{ opacity: 0, x: 40, scale: 0.94 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 40, scale: 0.94 }}
                      transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                      className="flex-1 flex justify-center items-center w-full"
                    >
                      <BrandedCard
                        submission={duetSubmissions[1]}
                        venue={venue}
                        size="large"
                        showReward={true}
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* 5. CAROUSEL 3D FLOW DECK MODE */}
            {layoutMode === 'carousel' && (
              <div className="w-full h-full max-w-6xl mx-auto flex flex-col items-center justify-center p-3 relative">
                <div className="flex items-center justify-center gap-3 sm:gap-6 w-full h-full relative overflow-hidden">
                  {/* Left Preview Card */}
                  {carouselDeck.prev && (
                    <motion.div
                      key={`carousel-prev-${carouselDeck.prev.id}`}
                      initial={{ opacity: 0, scale: 0.75, x: -60 }}
                      animate={{ opacity: 0.45, scale: 0.82, x: 0 }}
                      exit={{ opacity: 0, scale: 0.75, x: -60 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      onClick={() => setCurrentIndex((prev) => (prev - 1 + submissions.length) % submissions.length)}
                      className="hidden md:flex justify-center items-center cursor-pointer hover:opacity-75 transition-opacity blur-[1px] hover:blur-none"
                    >
                      <BrandedCard
                        submission={carouselDeck.prev}
                        venue={venue}
                        size="md"
                        showReward={false}
                      />
                    </motion.div>
                  )}

                  {/* Center Active Spotlight Hero Card */}
                  {carouselDeck.current && (
                    <motion.div
                      key={`carousel-active-${carouselDeck.current.id}`}
                      initial={{ opacity: 0, scale: 0.92, y: 20 }}
                      animate={{ opacity: 1, scale: 1.04, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -20 }}
                      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                      className="flex justify-center items-center z-20 scale-105 ring-4 ring-[#e5b842]/40 rounded-3xl shadow-[0_0_50px_rgba(229,184,66,0.4)]"
                    >
                      <BrandedCard
                        submission={carouselDeck.current}
                        venue={venue}
                        size="large"
                        showReward={true}
                      />
                    </motion.div>
                  )}

                  {/* Right Preview Card */}
                  {carouselDeck.next && (
                    <motion.div
                      key={`carousel-next-${carouselDeck.next.id}`}
                      initial={{ opacity: 0, scale: 0.75, x: 60 }}
                      animate={{ opacity: 0.45, scale: 0.82, x: 0 }}
                      exit={{ opacity: 0, scale: 0.75, x: 60 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      onClick={() => setCurrentIndex((prev) => (prev + 1) % submissions.length)}
                      className="hidden md:flex justify-center items-center cursor-pointer hover:opacity-75 transition-opacity blur-[1px] hover:blur-none"
                    >
                      <BrandedCard
                        submission={carouselDeck.next}
                        venue={venue}
                        size="md"
                        showReward={false}
                      />
                    </motion.div>
                  )}
                </div>

                {/* Carousel Navigation Chevrons & Position Indicator */}
                <div className="flex items-center gap-4 mt-2 z-30">
                  <button
                    onClick={() => setCurrentIndex((prev) => (prev - 1 + submissions.length) % submissions.length)}
                    className="p-2 rounded-xl bg-zinc-900/90 border border-white/20 hover:border-[#e5b842] text-zinc-300 hover:text-white transition-all cursor-pointer shadow-lg"
                    title="Previous Slide"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {submissions.slice(0, 8).map((_, i) => (
                      <span
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          i === currentIndex % Math.min(8, submissions.length)
                            ? 'w-6 bg-[#e5b842]'
                            : 'w-2 bg-white/25 hover:bg-white/50'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentIndex((prev) => (prev + 1) % submissions.length)}
                    className="p-2 rounded-xl bg-zinc-900/90 border border-white/20 hover:border-[#e5b842] text-zinc-300 hover:text-white transition-all cursor-pointer shadow-lg"
                    title="Next Slide"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* BOTTOM LIVE FROM SOHO TICKER STRIP */}
      <footer className="wall-ticker relative z-30 h-[34px] min-h-[34px] max-h-[34px] bg-black/95 border-t border-[#e5b842] px-3 overflow-hidden flex items-center justify-between shadow-[0_-4px_25px_rgba(0,0,0,0.9)]">
        {/* Rotating Soho strip keeps a live pulse without a competing headline card. */}
        <div className="flex items-center gap-1.5 bg-[#e5b842] text-black px-3 py-1 rounded-md font-black text-[11px] uppercase tracking-widest shrink-0 shadow-md z-10 mr-4">
          <Zap className="w-3.5 h-3.5 fill-black" />
          <span>LIVE FROM SOHO</span>
        </div>

        {/* Marquee Scrolling Ticker Text */}
        <div className="whitespace-nowrap flex items-center gap-8 animate-[marquee_24s_linear_infinite] text-xs font-black text-[#e5b842] tracking-widest uppercase flex-1 leading-none drop-shadow">
          <span>• {liveRailMessages[liveRailIndex]}</span>
          <span className="text-zinc-400">•</span>
          <span>• SCAN QR CODE ON SCREEN TO SEND YOUR SELFIE LIVE TO THIS TV</span>
          <span className="text-zinc-400">•</span>
          <span>• TAG @LONDONKARAOKECLUB ON INSTAGRAM FOR COMPLIMENTARY SHOTS</span>
          <span className="text-zinc-400">•</span>
          <span>⚡ {venue.wall_ticker_text || venue.live_ticker_message || 'LIVE STAGE SHOWCASE'}</span>
          <span className="text-zinc-400">•</span>
          <span>• {liveRailMessages[liveRailIndex]}</span>
          <span className="text-zinc-400">•</span>
          <span>• SCAN QR CODE ON SCREEN TO SEND YOUR SELFIE LIVE TO THIS TV</span>
        </div>
      </footer>
    </div>
  );
};
