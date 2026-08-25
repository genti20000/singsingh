import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { Submission, Venue, QRShape } from '../types';
import { QR_SHAPES_CONFIG } from '../utils/qrShapes';
import { BrandedCard } from './BrandedCard';
import { ParticleCanvas } from './ParticleCanvas';
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
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Tv
} from 'lucide-react';
import confetti from 'canvas-confetti';

type WallLayoutMode = 'spotlight' | 'quad' | 'mosaic';

interface WallDisplayProps {
  venue: Venue;
}

export const WallDisplay: React.FC<WallDisplayProps> = ({ venue }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [layoutMode, setLayoutMode] = useState<WallLayoutMode>('spotlight');
  const [isPaused, setIsPaused] = useState(false);
  const [featuredSub, setFeaturedSub] = useState<Submission | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrShape, setQrShape] = useState<QRShape>(venue.qr_shape || 'squircle');
  const [showShapePicker, setShowShapePicker] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeString, setTimeString] = useState('');

  const shapeConfig = QR_SHAPES_CONFIG[qrShape] || QR_SHAPES_CONFIG.squircle;
  const shapeList: QRShape[] = ['squircle', 'circle', 'hexagon', 'square', 'diamond', 'shield', 'star'];

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
        // Trigger celebratory confetti on spotlight takeover
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
    const unsubscribe = subscribeToSync(() => {
      fetchApproved();
    });

    return () => {
      clearInterval(pollInterval);
      unsubscribe();
    };
  }, [fetchApproved]);

  // 4. Auto Rotate Cards
  useEffect(() => {
    if (submissions.length <= 1 || featuredSub || isPaused) return;

    const intervalSeconds = layoutMode === 'spotlight' ? 6000 : 8000;

    const rotateTimer = setInterval(() => {
      if (layoutMode === 'spotlight') {
        setCurrentIndex((prev) => (prev + 1) % submissions.length);
      } else if (layoutMode === 'quad') {
        setCurrentIndex((prev) => (prev + 4 >= submissions.length ? 0 : prev + 4));
      } else if (layoutMode === 'mosaic') {
        setCurrentIndex((prev) => (prev + 3 >= submissions.length ? 0 : prev + 3));
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

  return (
    <div className="singshot-wall relative h-screen w-screen overflow-hidden bg-[#050505] text-white flex flex-col justify-between select-none font-sans">
      {/* Background Nightlife Ambient Particle Canvas */}
      <ParticleCanvas color="#e5b842" density={70} speed={0.9} />

      {/* Top Header Bar */}
      <header className="wall-header relative z-30 flex items-center justify-between px-6 sm:px-8 py-3.5 bg-gradient-to-b from-black/95 via-black/80 to-transparent border-b border-white/10 backdrop-blur-md">
        {/* Left: Venue Branding */}
        <div className="wall-brand-block flex items-center gap-3 sm:gap-4">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#e5b842] via-yellow-300 to-amber-500 text-black font-extrabold text-lg sm:text-xl shadow-[0_0_25px_rgba(229,184,66,0.5)]">
            SS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-xl sm:text-2xl tracking-widest text-[#e5b842] uppercase drop-shadow-md">
                SINGSHOT
              </h1>
              <span className="flex items-center gap-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase animate-pulse">
                <Radio className="w-3 h-3" /> LIVE ON AIR
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium">
              {venue.sub_name || 'at London Karaoke Club'} • {timeString}
            </p>
          </div>
        </div>

        {/* Center: Layout Mode Switcher */}
        <div className="hidden md:flex items-center gap-1 bg-zinc-950/90 p-1.5 rounded-2xl border border-white/15 shadow-xl">
          <button
            id="wall-mode-spotlight"
            onClick={() => setLayoutMode('spotlight')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              layoutMode === 'spotlight'
                ? 'bg-[#e5b842] text-black shadow-md shadow-[#e5b842]/25 font-extrabold'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
            title="Solo Spotlight Mode"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Solo Spotlight</span>
          </button>

          <button
            id="wall-mode-quad"
            onClick={() => setLayoutMode('quad')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              layoutMode === 'quad'
                ? 'bg-[#e5b842] text-black shadow-md shadow-[#e5b842]/25 font-extrabold'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
            title="2x2 Quad Grid Mode"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>2x2 Quad Grid</span>
          </button>

          <button
            id="wall-mode-mosaic"
            onClick={() => setLayoutMode('mosaic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              layoutMode === 'mosaic'
                ? 'bg-[#e5b842] text-black shadow-md shadow-[#e5b842]/25 font-extrabold'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
            title="Mosaic Masonry Mode"
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span>Mosaic Wall</span>
          </button>
        </div>

        {/* Right: Scan QR Widget & Controls */}
        <div className="wall-actions flex items-center gap-3 sm:gap-4 relative">
          <div className={`wall-qr-widget relative flex items-center gap-2.5 sm:gap-3 bg-zinc-950/90 ${shapeConfig.containerClassName} p-2 pr-3.5 shadow-[0_0_30px_rgba(229,184,66,0.3)] transition-all duration-300 border border-[#e5b842]/40`}>
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt={`Scan QR Code (${shapeConfig.name})`}
                onClick={handleCycleShape}
                title="Click QR code to switch shape"
                className={`h-11 w-11 sm:h-12 sm:w-12 cursor-pointer hover:scale-105 ${shapeConfig.imgClassName}`}
              />
            ) : (
              <div className="h-11 w-11 rounded-lg bg-[#e5b842]" />
            )}
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] sm:text-xs font-black text-[#e5b842] tracking-wider uppercase leading-none">
                  SCAN TO SINGSHOT
                </span>
                <button
                  type="button"
                  onClick={() => setShowShapePicker(!showShapePicker)}
                  title="Click to choose QR code shape"
                  className="flex items-center gap-0.5 bg-[#e5b842]/20 hover:bg-[#e5b842]/40 text-[#e5b842] border border-[#e5b842]/50 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Shapes className="w-2.5 h-2.5" />
                  <span>{shapeConfig.name}</span>
                </button>
              </div>
              <div className="text-[9px] sm:text-[10px] text-zinc-300 font-bold mt-1 flex items-center gap-1.5">
                <span>Selfie to big screen</span>
                <button
                  type="button"
                  onClick={handleCycleShape}
                  className="text-[9px] text-[#e5b842] hover:underline font-semibold cursor-pointer"
                >
                  • Cycle
                </button>
              </div>
            </div>

            {/* Shape Picker Floating Dropdown */}
            {showShapePicker && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-950 border border-[#e5b842]/50 p-2.5 rounded-2xl shadow-2xl z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] font-extrabold text-[#e5b842] uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
                  <span>QR Code Shape</span>
                  <span className="text-[9px] text-zinc-400 font-normal">7 shapes</span>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {shapeList.map((shapeKey) => {
                    const cfg = QR_SHAPES_CONFIG[shapeKey];
                    const isSelected = qrShape === shapeKey;
                    return (
                      <button
                        key={shapeKey}
                        type="button"
                        onClick={() => handleSelectShape(shapeKey)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#e5b842] text-black font-extrabold shadow'
                            : 'text-zinc-200 hover:bg-zinc-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{cfg.badge.split(' ')[0]}</span>
                          <span>{cfg.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-black" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isPaused
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-zinc-900/80 border-white/20 text-zinc-400 hover:text-white'
            }`}
            title={isPaused ? 'Resume Slideshow' : 'Pause Slideshow'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-zinc-900/80 border border-white/20 text-zinc-400 hover:text-white hover:border-white transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content Showcase Stage */}
      <main className="wall-main relative z-20 flex-1 flex flex-col items-center justify-between p-3 sm:p-5 overflow-hidden">
        {submissions.length === 0 ? (
          /* FALLBACK EMPTY QUEUE STATE */
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center text-center max-w-md p-8 rounded-3xl bg-zinc-950/80 border border-[#e5b842]/40 backdrop-blur-xl animate-fade-slide-up"
            >
              <div className="h-20 w-20 rounded-full bg-[#e5b842]/20 border-2 border-[#e5b842] flex items-center justify-center mb-4 text-[#e5b842]">
                <Sparkles className="w-10 h-10 animate-pulse" />
              </div>
              <h2 className="font-serif text-3xl font-extrabold text-white">Be The First On Screen!</h2>
              <p className="text-zinc-300 text-sm mt-2 leading-relaxed">
                Scan the QR code in the top right with your phone camera to take a stage selfie and join tonight's live wall of fame.
              </p>
            </motion.div>
          </div>
        ) : (
          <div className="wall-stage flex-1 flex items-center justify-center w-full max-w-6xl py-1">
            {/* 1. SOLO SPOTLIGHT MODE */}
            {layoutMode === 'spotlight' && (
              <AnimatePresence mode="wait">
                {featuredSub ? (
                  <motion.div
                    key={`featured-${featuredSub.id}`}
                    initial={{ opacity: 0, scale: 0.82, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.08, y: -30 }}
                    transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                    className="relative flex flex-col items-center justify-center w-full animate-fade-slide-up"
                  >
                    {/* Spotlight Banner Header */}
                    <div className="mb-3 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 text-black px-8 py-2 rounded-full font-black text-base md:text-xl uppercase tracking-widest shadow-[0_0_40px_rgba(229,184,66,0.6)] animate-bounce flex items-center gap-2">
                      <Sparkles className="w-5 h-5 fill-black" />
                      <span>SPOTLIGHT TAKEOVER</span>
                      <Sparkles className="w-5 h-5 fill-black" />
                    </div>

                    <BrandedCard submission={featuredSub} venue={venue} size="hero" showReward={true} />
                  </motion.div>
                ) : activeSubmission ? (
                  <motion.div
                    key={`spotlight-${activeSubmission.id}-${currentIndex}`}
                    initial={{ opacity: 0, scale: 0.9, y: 28 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.05, y: -28 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-center w-full animate-fade-slide-up"
                  >
                    <BrandedCard submission={activeSubmission} venue={venue} size="large" showReward={true} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            )}

            {/* 2. 2X2 QUAD GRID MODE */}
            {layoutMode === 'quad' && (
              <div className="w-full max-w-5xl h-full flex items-center justify-center py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5 w-full">
                  <AnimatePresence mode="popLayout">
                    {quadSubmissions.map((sub, idx) => (
                      <motion.div
                        key={`quad-${sub.id}-${idx}`}
                        layout
                        initial={{ opacity: 0, scale: 0.85, y: 25 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: -25 }}
                        transition={{
                          duration: 0.5,
                          delay: idx * 0.07,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="flex items-center justify-center animate-fade-slide-up"
                      >
                        <BrandedCard
                          submission={sub}
                          venue={venue}
                          size="md"
                          showReward={false}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* 3. MOSAIC MASONRY MODE */}
            {layoutMode === 'mosaic' && (
              <div className="w-full max-w-6xl h-full flex items-center justify-center py-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 w-full items-center">
                  {/* Left Highlight Tile */}
                  {mosaicSubmissions[0] && (
                    <motion.div
                      key={`mosaic-0-${mosaicSubmissions[0].id}`}
                      initial={{ opacity: 0, x: -35, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -35, scale: 0.9 }}
                      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                      className="flex items-center justify-center md:col-span-1 animate-fade-slide-up"
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
                  <div className="flex flex-col gap-3 justify-center items-center">
                    {mosaicSubmissions[1] && (
                      <motion.div
                        key={`mosaic-1-${mosaicSubmissions[1].id}`}
                        initial={{ opacity: 0, y: -25, scale: 0.88 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -25, scale: 0.88 }}
                        transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full flex justify-center animate-fade-slide-up"
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
                        initial={{ opacity: 0, y: 25, scale: 0.88 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 25, scale: 0.88 }}
                        transition={{ duration: 0.5, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full flex justify-center animate-fade-slide-up"
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
                  <div className="flex flex-col gap-3 justify-center items-center">
                    {mosaicSubmissions[3] && (
                      <motion.div
                        key={`mosaic-3-${mosaicSubmissions[3].id}`}
                        initial={{ opacity: 0, x: 25, scale: 0.88 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 25, scale: 0.88 }}
                        transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full flex justify-center animate-fade-slide-up"
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
                        initial={{ opacity: 0, y: 25, scale: 0.88 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 25, scale: 0.88 }}
                        transition={{ duration: 0.5, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full flex justify-center animate-fade-slide-up"
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
          </div>
        )}

        {/* BOTTOM GALLERY FILMSTRIP — Show Other Guest Photos */}
        {submissions.length > 0 && layoutMode === 'spotlight' && (
          <div className="wall-filmstrip relative z-30 w-full max-w-7xl mt-1 pt-2.5 border-t border-white/10 bg-black/60 backdrop-blur-md rounded-2xl px-4 py-2">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-xs font-black tracking-widest text-[#e5b842] uppercase">
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
                <span className="text-[10px] text-zinc-400 font-medium">
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

            {/* Scrollable Row of Photos at the Bottom */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#e5b842]/40">
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
                        ? 'border-[#e5b842] shadow-[0_0_20px_rgba(229,184,66,0.6)] scale-105 z-10'
                        : 'border-white/20 hover:border-white/60 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {/* Thumbnail Image Container */}
                    <div className="relative h-16 w-20 sm:h-20 sm:w-24 overflow-hidden bg-black">
                      <img
                        src={sub.image_url}
                        alt={sub.first_name}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                      {/* Active Indicator Badge */}
                      {isActive && (
                        <div className="absolute top-1 right-1 bg-[#e5b842] text-black font-black text-[8px] px-1 py-0.5 rounded uppercase tracking-wider shadow">
                          NOW ON TV
                        </div>
                      )}

                      {/* Guest Name & Subtext */}
                      <div className="absolute bottom-1 left-1 right-1 text-left">
                        <div className="text-[11px] font-bold text-white truncate drop-shadow">
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

      {/* Bottom Offer / Ticker Banner */}
      <footer className="wall-ticker relative z-30 bg-gradient-to-r from-[#14120c] via-black to-[#14120c] border-t-2 border-[#e5b842]/50 py-2.5 px-6 overflow-hidden flex items-center justify-between gap-4">
        <div className="whitespace-nowrap flex items-center gap-8 animate-[marquee_25s_linear_infinite] text-xs sm:text-sm font-extrabold text-[#e5b842] tracking-wider uppercase flex-1">
          <span>{venue.wall_ticker_text || venue.live_ticker_message || 'LIVE STAGE SHOWCASE'}</span>
          <span>•</span>
          <span>TAG @LONDONKARAOKECLUB ON INSTAGRAM & UNLOCK A FREE SHOT AT THE BAR</span>
          <span>•</span>
          <span>SCAN QR CODE ON SCREEN TO JOIN THE WALL OF FAME</span>
          <span>•</span>
          <span>{venue.wall_ticker_text || venue.live_ticker_message || 'LIVE STAGE SHOWCASE'}</span>
        </div>

        {/* Mobile quick mode toggle */}
        <div className="flex md:hidden items-center gap-1 bg-zinc-900 px-2 py-1 rounded-xl border border-white/10 shrink-0">
          <button
            onClick={() => setLayoutMode(layoutMode === 'spotlight' ? 'quad' : layoutMode === 'quad' ? 'mosaic' : 'spotlight')}
            className="text-[10px] font-black text-[#e5b842] uppercase tracking-wider"
          >
            {layoutMode}
          </button>
        </div>
      </footer>
    </div>
  );
};
