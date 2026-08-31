import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { Submission, Venue, QRShape, WallLayoutMode } from '../types';
import { QR_SHAPES_CONFIG } from '../utils/qrShapes';
import { BrandedCard } from './BrandedCard';
import { ParticleCanvas } from './ParticleCanvas';
import { BroadcastNewsFlash } from './BroadcastNewsFlash';
import { LondonKaraokeLogo } from './LondonKaraokeLogo';
import { DataService, subscribeToSync } from '../services/dataService';
import {
  Sparkles,
  Maximize2,
  Minimize2,
  Radio,
  Shapes,
  Check,
  Square,
  LayoutGrid,
  Columns3,
  Columns2,
  GalleryHorizontal,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Tv,
  Flame,
  Zap,
  Mic,
  Music,
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
  const [qrShape, setQrShape] = useState<QRShape>(venue.qr_shape || 'squircle');
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeString, setTimeString] = useState('');

  const shapeConfig = QR_SHAPES_CONFIG[qrShape] || QR_SHAPES_CONFIG.squircle;
  const shapeList: QRShape[] = ['squircle', 'circle', 'hexagon', 'square', 'diamond', 'shield', 'star'];

  // Sync layout mode from props if updated
  useEffect(() => {
    if (venue.wall_layout_mode && venue.wall_layout_mode !== layoutMode) {
      setLayoutMode(venue.wall_layout_mode);
    }
  }, [venue.wall_layout_mode, layoutMode]);

  const handleCycleShape = () => {
    const nextIdx = (shapeList.indexOf(qrShape) + 1) % shapeList.length;
    const nextShape = shapeList[nextIdx];
    setQrShape(nextShape);
    DataService.updateVenue({ qr_shape: nextShape });
  };

  const handleSelectShape = (shape: QRShape) => {
    setQrShape(shape);
    setShowShapePicker(false);
    DataService.updateVenue({ qr_shape: shape });
  };

  const handleSetLayout = (mode: WallLayoutMode) => {
    setLayoutMode(mode);
    DataService.updateVenue({ wall_layout_mode: mode });
  };

  // 1. Generate QR Code for guest scanning
  useEffect(() => {
    const appUrl = window.location.origin;
    QRCode.toDataURL(appUrl, {
      margin: 1,
      width: 240,
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

  // 3. Load approved submissions using resilient DataService with live sync
  const fetchApproved = useCallback(async () => {
    try {
      const list = await DataService.getSubmissions({ status: 'approved' });
      setSubmissions(list || []);

      // Check for active featured takeover trigger
      const featured = list.find((s) => s.featured);
      if (featured && featured.id !== featuredSub?.id) {
        setFeaturedSub(featured);
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#e5b842', '#ffffff', '#f43f5e', '#38bdf8'],
        });
      } else if (!featured && featuredSub) {
        setFeaturedSub(null);
      }
    } catch (err) {
      console.error('Failed to fetch wall submissions:', err);
    }
  }, [featuredSub]);

  useEffect(() => {
    fetchApproved();
    const pollInterval = setInterval(fetchApproved, 3000);

    const unsubscribe = subscribeToSync((event) => {
      if (
        event.type === 'SUBMISSION_CREATED' ||
        event.type === 'SUBMISSION_UPDATED' ||
        event.type === 'SUBMISSION_DELETED' ||
        event.type === 'NEW_PHOTO_APPROVED' ||
        event.type === 'STORAGE_CHANGE'
      ) {
        fetchApproved();
      }
      if (event.type === 'VENUE_UPDATED' && (event.data as Venue)?.wall_layout_mode) {
        setLayoutMode((event.data as Venue).wall_layout_mode!);
      }
      if (event.type === 'WALL_LAYOUT_CHANGED' && (event.data as { mode?: WallLayoutMode })?.mode) {
        setLayoutMode((event.data as { mode: WallLayoutMode }).mode);
      }
    });

    return () => {
      clearInterval(pollInterval);
      unsubscribe();
    };
  }, [fetchApproved]);

  // 4. Auto Rotate Cards based on current layout mode
  useEffect(() => {
    if (submissions.length <= 1 || featuredSub || isPaused) return;

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
  }, [submissions.length, featuredSub, isPaused, layoutMode]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const activeSubmission = submissions[currentIndex] || submissions[0] || null;

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

  const LAYOUT_BUTTONS: {
    id: WallLayoutMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'spotlight', label: 'Spotlight', icon: Square },
    { id: 'quad', label: 'Quad (2x2)', icon: LayoutGrid },
    { id: 'mosaic', label: 'Mosaic', icon: Columns3 },
    { id: 'duet', label: 'Duet', icon: Columns2 },
    { id: 'carousel', label: 'Carousel', icon: GalleryHorizontal },
  ];

  return (
    <div className="singshot-wall relative h-screen w-screen overflow-hidden bg-[#050505] text-white flex flex-col justify-between select-none font-sans">
      {/* Background Nightlife Ambient Particle Canvas */}
      <ParticleCanvas color="#e5b842" density={75} speed={0.8} />

      {/* TOP-LEFT CORNER FLOATING HUD: Branding, Live Status, Clock & Layout Switcher */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-40 flex items-center gap-2 max-w-[calc(100vw-190px)]">
        <div className="flex items-center gap-2.5 bg-zinc-950/85 backdrop-blur-xl border border-white/15 p-1.5 sm:p-2 pr-3 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.85)]">
          {/* Venue Mini Logo */}
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full overflow-hidden shadow-[0_0_20px_rgba(229,184,66,0.5)] shrink-0 border border-[#e5b842]/70 bg-black">
            <LondonKaraokeLogo className="w-9 h-9 sm:w-10 sm:h-10" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-xs sm:text-sm tracking-wider text-[#e5b842] uppercase leading-none">
                SINGSHOT
              </span>
              {featuredSub ? (
                <span className="flex items-center gap-1 bg-gradient-to-r from-amber-500/40 to-yellow-500/30 text-[#e5b842] border border-[#e5b842] px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase shadow-[0_0_15px_rgba(229,184,66,0.5)] animate-pulse">
                  <Flame className="w-2.5 h-2.5 fill-[#e5b842] text-[#e5b842]" /> STAR OF THE NIGHT
                </span>
              ) : (
                <span className="flex items-center gap-1 bg-gradient-to-r from-rose-500/30 to-red-500/20 text-rose-300 border border-rose-500/60 px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase shadow-[0_0_12px_rgba(244,63,94,0.4)]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                  </span>
                  <span>LIVE</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-zinc-300 font-medium leading-none mt-1">
              <span className="hidden sm:inline text-zinc-400 truncate max-w-[110px]">
                {venue.sub_name || 'London Karaoke Club'}
              </span>
              <span className="hidden sm:inline text-[#e5b842]">•</span>
              <span className="text-zinc-300 font-mono tracking-tight">{timeString}</span>
            </div>
          </div>

          {/* Quick Layout Mode Buttons in Floating Corner */}
          <div className="hidden lg:flex items-center gap-1 ml-2 pl-2 border-l border-white/15">
            {LAYOUT_BUTTONS.map((btn) => {
              const Icon = btn.icon;
              const isActive = layoutMode === btn.id;
              return (
                <button
                  key={btn.id}
                  id={`wall-layout-btn-${btn.id}`}
                  onClick={() => handleSetLayout(btn.id)}
                  title={`Switch to ${btn.label} layout`}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#e5b842] text-black shadow-md shadow-[#e5b842]/30 font-extrabold scale-105'
                      : 'text-zinc-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>

          {/* Slideshow and Fullscreen Quick Icons */}
          <div className="flex items-center gap-1 ml-1">
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
      </div>

      {/* TOP-RIGHT CORNER FLOATING HUD: QR Code Scan Widget with Shape Selector */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-40 flex items-center gap-2">
        <div className={`wall-qr-widget relative flex items-center gap-2 bg-zinc-950/85 backdrop-blur-xl ${shapeConfig.containerClassName} p-1.5 pr-2.5 shadow-[0_4px_30px_rgba(229,184,66,0.35)] transition-all duration-300 border border-[#e5b842]/60`}>
          {/* Pulsing Neon Radar Glow behind QR */}
          <div className="relative shrink-0">
            <div className="absolute -inset-1 rounded-xl bg-[#e5b842]/35 blur-sm animate-pulse pointer-events-none" />
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt={`Scan QR Code (${shapeConfig.name})`}
                onClick={handleCycleShape}
                title="Click QR code to cycle frame shape"
                className={`relative z-10 w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] cursor-pointer hover:scale-105 transition-transform duration-300 ${shapeConfig.imgClassName}`}
              />
            ) : (
              <div className="relative z-10 w-[42px] h-[42px] sm:w-[46px] sm:h-[46px] rounded-lg bg-[#e5b842]" />
            )}
            <span className="absolute -top-0.5 -right-0.5 z-20 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e5b842] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#e5b842]" />
            </span>
          </div>

          <div className="text-left flex flex-col justify-center">
            <div className="flex items-center gap-1">
              <span className="text-[10px] sm:text-[11px] font-black text-[#e5b842] tracking-wider uppercase leading-none drop-shadow">
                SCAN TO JOIN
              </span>
              <button
                type="button"
                onClick={() => setShowShapePicker(!showShapePicker)}
                title="Choose QR Code shape frame"
                className="flex items-center gap-0.5 bg-[#e5b842]/20 hover:bg-[#e5b842]/40 text-[#e5b842] border border-[#e5b842]/50 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider transition-all cursor-pointer"
              >
                <Shapes className="w-2 h-2" />
                <span>{shapeConfig.name}</span>
              </button>
            </div>
            <span className="text-[9px] text-zinc-300 font-medium leading-tight mt-0.5">
              Selfie to Live Screen
            </span>
          </div>

          {/* QR Shape Popover Menu */}
          {showShapePicker && (
            <div className="absolute top-full right-0 mt-2 bg-zinc-950/95 backdrop-blur-xl border border-[#e5b842]/50 rounded-2xl p-2 shadow-2xl z-50 min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
              <div className="text-[10px] font-black text-[#e5b842] uppercase tracking-wider px-2 py-1 border-b border-white/10 mb-1">
                Select QR Frame Shape
              </div>
              <div className="grid grid-cols-1 gap-1">
                {shapeList.map((shapeKey) => {
                  const itemConfig = QR_SHAPES_CONFIG[shapeKey];
                  const isCurrent = shapeKey === qrShape;
                  return (
                    <button
                      key={shapeKey}
                      onClick={() => handleSelectShape(shapeKey)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                        isCurrent
                          ? 'bg-[#e5b842] text-black font-black'
                          : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3.5 h-3.5 border ${
                            isCurrent ? 'border-black bg-black/20' : 'border-[#e5b842]/60 bg-[#e5b842]/10'
                          } ${itemConfig.imgClassName}`}
                        />
                        <span>{itemConfig.name}</span>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Broadcast News Flash Overlay (Triggered on VIP Submissions) */}
      <BroadcastNewsFlash submission={featuredSub} venue={venue} onComplete={() => setFeaturedSub(null)} />

      {/* MAIN WALL STAGE: Maximized vertical area with no central header blockage */}
      <main className="wall-main flex-1 w-full h-full flex flex-col justify-center items-center relative overflow-hidden pt-1 pb-1">
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
              <span>Awaiting First Stage Selfie</span>
            </div>
          </div>
        ) : (
          /* ACTIVE PHOTO STAGE ACCORDING TO LAYOUT MODE */
          <div className="wall-stage w-full h-full flex items-center justify-center relative overflow-hidden">
            {/* 1. SPOTLIGHT SOLO HERO MODE: Maximum Vertical Space Takeover */}
            {layoutMode === 'spotlight' && activeSubmission && (
              <div className="spotlight-stage w-full h-full flex items-center justify-center relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSubmission.id}
                    initial={{ opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                    transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                    className="spotlight-photo-wrap"
                  >
                    {/* Ambient Blurred Backdrop */}
                    <div
                      className="spotlight-backdrop"
                      style={{ backgroundImage: `url(${activeSubmission.image_url})` }}
                    />

                    {/* Main Hero Photo Container with Maximum Vertical Fit */}
                    <div className="relative flex items-center justify-center h-full w-full max-h-full">
                      <img
                        src={activeSubmission.image_url}
                        alt={activeSubmission.first_name}
                        className="spotlight-photo cursor-pointer"
                        onClick={() => setCurrentIndex((prev) => (prev + 1) % submissions.length)}
                      />

                      {/* VIP Occasion Badge Top-Right */}
                      {activeSubmission.occasion && (
                        <div className="badge-vip animate-fade-slide-down">
                          <span className="flex items-center gap-1.5 bg-black/85 border border-[#e5b842] text-[#e5b842] px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md shadow-2xl">
                            <Sparkles className="w-3.5 h-3.5 fill-[#e5b842]" />
                            <span>
                              {activeSubmission.occasion.type === 'birthday'
                                ? `HAPPY BIRTHDAY ${activeSubmission.first_name.toUpperCase()}`
                                : activeSubmission.occasion.type === 'hen'
                                ? 'HEN PARTY VIP'
                                : activeSubmission.occasion.type === 'stag'
                                ? 'STAG PARTY SQUAD'
                                : activeSubmission.occasion.type === 'work'
                                ? 'OFFICE KARAOKE STARS'
                                : 'VIP STAGE MOMENT'}
                            </span>
                          </span>
                        </div>
                      )}

                      {/* Floating Translucent Guest Nameplate with Reward Badge */}
                      <div className="photo-nameplate flex items-center gap-3">
                        <span className="drop-shadow">{activeSubmission.first_name}</span>
                        {activeSubmission.reward && (
                          <span className="flex items-center gap-1 text-[11px] font-black text-black bg-[#e5b842] px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                            🎁 {activeSubmission.reward.title} Unlocked
                          </span>
                        )}
                        {activeSubmission.caption && (
                          <span className="hidden md:inline text-xs font-medium text-white/90 lowercase italic font-sans max-w-[200px] truncate">
                            "{activeSubmission.caption}"
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {/* 2. QUAD (2x2) GRID MODE */}
            {layoutMode === 'quad' && (
              <div className="w-full h-full max-w-6xl mx-auto flex items-center justify-center p-3 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full h-full max-h-full items-center justify-center">
                  <AnimatePresence>
                    {quadSubmissions.map((sub, idx) => (
                      <motion.div
                        key={`quad-${sub.id}-${idx}`}
                        initial={{ opacity: 0, scale: 0.9, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -15 }}
                        transition={{ duration: 0.45, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
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
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
                        transition={{ duration: 0.45, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
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
                        transition={{ duration: 0.45, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
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
                        transition={{ duration: 0.45, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
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
                        transition={{ duration: 0.45, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
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
                      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
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
                      transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
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
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
                      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
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
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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

        {/* BOTTOM FILMSTRIP OF THUMBNAILS (For Spotlight Mode) */}
        {submissions.length > 0 && layoutMode === 'spotlight' && (
          <div className="wall-filmstrip relative z-30 w-full h-[95px] min-h-[95px] max-h-[95px] border-t border-white/10 bg-black/80 backdrop-blur-md px-4 sm:px-6 py-1.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-black tracking-widest text-[#e5b842] uppercase">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>TONIGHT'S WALL OF FAME ({submissions.length} PHOTOS)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentIndex((prev) => (prev - 1 + submissions.length) % submissions.length)}
                  className="p-1 rounded-lg bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
                  title="Previous Photo"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {currentIndex + 1} / {submissions.length}
                </span>
                <button
                  onClick={() => setCurrentIndex((prev) => (prev + 1) % submissions.length)}
                  className="p-1 rounded-lg bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
                  title="Next Photo"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Row of Thumbnails */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-0.5 scrollbar-thin scrollbar-thumb-[#e5b842]/40">
              {submissions.map((sub, idx) => {
                const isActive = (featuredSub && sub.id === featuredSub.id) || (!featuredSub && idx === currentIndex);
                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setFeaturedSub(null);
                      setCurrentIndex(idx);
                    }}
                    className={`relative flex-shrink-0 group overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'border-[#e5b842] shadow-[0_0_16px_rgba(244,193,61,0.65)] scale-105 z-10'
                        : 'border-white/20 hover:border-white/60 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="relative h-13 w-18 sm:h-13 sm:w-20 overflow-hidden bg-black flex items-center justify-center">
                      <img
                        src={sub.image_url}
                        alt={sub.first_name}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />

                      {isActive && (
                        <div className="absolute top-0.5 right-0.5 bg-[#e5b842] text-black font-black text-[7px] px-1 py-0.2 rounded uppercase tracking-wider shadow">
                          NOW ON TV
                        </div>
                      )}

                      <div className="absolute bottom-0.5 left-1 right-1 text-left">
                        <div className="text-[10px] font-bold text-white truncate drop-shadow">
                          {sub.first_name}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM TICKER BANNER (~30px fixed height) */}
      <footer className="wall-ticker relative z-30 h-[30px] min-h-[30px] max-h-[30px] bg-black/95 border-t border-[#e5b842]/50 px-3 overflow-hidden flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.8)]">
        {/* Newsflash Label Block */}
        <div className="flex items-center gap-2 bg-[#e5b842] text-black px-2.5 py-0.5 rounded font-black text-[10px] uppercase tracking-widest shrink-0 shadow-md z-10 mr-3">
          <Zap className="w-3 h-3 fill-black animate-bounce" />
          <span>NEWS FLASH</span>
        </div>

        <div className="whitespace-nowrap flex items-center gap-8 animate-[marquee_24s_linear_infinite] text-[11px] sm:text-xs font-black text-[#fed21c] tracking-widest uppercase flex-1 leading-none drop-shadow">
          <span>⚡ {venue.wall_ticker_text || venue.live_ticker_message || 'LIVE STAGE SHOWCASE'}</span>
          <span className="text-zinc-500">•</span>
          <span>📸 SCAN QR CODE ON SCREEN TO SEND YOUR SELFIE LIVE TO THIS TV</span>
          <span className="text-zinc-500">•</span>
          <span>🍸 TAG @LONDONKARAOKECLUB ON INSTAGRAM FOR COMPLIMENTARY SHOTS</span>
          <span className="text-zinc-500">•</span>
          <span>👑 STAR OF THE NIGHT SELECTED EVERY 30 MINUTES</span>
          <span className="text-zinc-500">•</span>
          <span>⚡ {venue.wall_ticker_text || venue.live_ticker_message || 'LIVE STAGE SHOWCASE'}</span>
        </div>
      </footer>
    </div>
  );
};
