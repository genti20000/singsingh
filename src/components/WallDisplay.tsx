import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { Submission, Venue, QRShape } from '../types';
import { QR_SHAPES_CONFIG } from '../utils/qrShapes';
import { BrandedCard } from './BrandedCard';
import { ParticleCanvas } from './ParticleCanvas';
import { Sparkles, Maximize2, Minimize2, Radio, Shapes, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WallDisplayProps {
  venue: Venue;
}

export const WallDisplay: React.FC<WallDisplayProps> = ({ venue }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
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
    fetch('/api/venue', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_shape: nextShape }),
    }).catch(() => {});
  };

  const handleSelectShape = (shape: QRShape) => {
    setQrShape(shape);
    setShowShapePicker(false);
    fetch('/api/venue', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_shape: shape }),
    }).catch(() => {});
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

  // 3. Poll for approved submissions from backend
  useEffect(() => {
    const fetchApproved = async () => {
      try {
        const res = await fetch(`/api/submissions?status=approved`);
        if (res.ok) {
          const list: Submission[] = await res.json();
          setSubmissions(list);

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
        }
      } catch (err) {
        console.error('Failed to fetch wall submissions:', err);
      }
    };

    fetchApproved();
    const pollInterval = setInterval(fetchApproved, 2000);
    return () => clearInterval(pollInterval);
  }, [featuredSub?.id]);

  // 4. Auto Rotate Cards every 6 seconds if not in featured spotlight mode
  useEffect(() => {
    if (submissions.length <= 1 || featuredSub) return;

    const rotateTimer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % submissions.length);
    }, 6000);

    return () => clearInterval(rotateTimer);
  }, [submissions.length, featuredSub]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const activeSubmission = submissions[currentIndex] || null;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#050505] text-white flex flex-col justify-between select-none">
      {/* Background Nightlife Ambient Particle Canvas */}
      <ParticleCanvas color="#e5b842" density={70} speed={0.9} />

      {/* Top Header Bar */}
      <header className="relative z-30 flex items-center justify-between px-8 py-4 bg-gradient-to-b from-black/90 via-black/60 to-transparent border-b border-white/10">
        {/* Left: Venue Branding */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#e5b842] via-yellow-300 to-amber-500 text-black font-extrabold text-xl shadow-[0_0_25px_rgba(229,184,66,0.5)]">
            SS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-2xl tracking-widest text-[#e5b842] uppercase drop-shadow-md">
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

        {/* Center: Headline */}
        <div className="hidden md:flex flex-col items-center">
          <span className="text-xs font-black tracking-[0.3em] text-[#e5b842] uppercase">
            LIVE WALL OF FAME
          </span>
          <span className="text-sm font-serif italic text-zinc-300">
            Take a selfie. Become part of the night.
          </span>
        </div>

        {/* Right: High-Contrast Scan QR Widget & Controls */}
        <div className="flex items-center gap-4 relative">
          <div className={`relative flex items-center gap-3 bg-zinc-950/90 ${shapeConfig.containerClassName} p-2 pr-4 shadow-[0_0_30px_rgba(229,184,66,0.3)] transition-all duration-300`}>
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt={`Scan QR Code (${shapeConfig.name})`}
                onClick={handleCycleShape}
                title="Click QR code to switch shape"
                className={`h-12 w-12 cursor-pointer hover:scale-105 ${shapeConfig.imgClassName}`}
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-[#e5b842]" />
            )}
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-[#e5b842] tracking-wider uppercase leading-none">
                  SCAN TO SINGSHOT
                </span>
                <button
                  type="button"
                  onClick={() => setShowShapePicker(!showShapePicker)}
                  title="Click to choose QR code shape"
                  className="flex items-center gap-0.5 bg-[#e5b842]/20 hover:bg-[#e5b842]/40 text-[#e5b842] border border-[#e5b842]/50 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider transition-all"
                >
                  <Shapes className="w-2.5 h-2.5" />
                  <span>{shapeConfig.name}</span>
                </button>
              </div>
              <div className="text-[10px] text-zinc-300 font-bold mt-1 flex items-center gap-2">
                <span>Selfie to big screen</span>
                <button
                  type="button"
                  onClick={handleCycleShape}
                  className="text-[9px] text-[#e5b842] hover:underline font-semibold"
                >
                  • Change Shape
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
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold text-left transition-all ${
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
            onClick={toggleFullscreen}
            className="p-3 rounded-xl bg-zinc-900/80 border border-white/20 text-zinc-400 hover:text-white hover:border-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content Showcase Stage */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-between p-3 sm:p-6 overflow-hidden">
        {/* Main Central Showcase Card */}
        <div className="flex-1 flex items-center justify-center w-full max-w-5xl py-2">
          <AnimatePresence mode="wait">
            {/* FEATURED SPOTLIGHT TAKEOVER MODE */}
            {featuredSub ? (
              <motion.div
                key={`featured-${featuredSub.id}`}
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.6, type: 'spring' }}
                className="relative flex flex-col items-center justify-center w-full"
              >
                {/* Spotlight Banner Header */}
                <div className="mb-3 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 text-black px-8 py-2 rounded-full font-black text-base md:text-xl uppercase tracking-widest shadow-[0_0_40px_rgba(229,184,66,0.6)] animate-bounce flex items-center gap-2">
                  <Sparkles className="w-5 h-5 fill-black" />
                  <span>SPOTLIGHT TAKEOVER</span>
                  <Sparkles className="w-5 h-5 fill-black" />
                </div>

                {/* Large Hero Card */}
                <BrandedCard submission={featuredSub} venue={venue} size="hero" showReward={true} />
              </motion.div>
            ) : activeSubmission ? (
              /* NORMAL LIVE ROTATION MODE */
              <motion.div
                key={`wall-${activeSubmission.id}-${currentIndex}`}
                initial={{ opacity: 0, scale: 0.9, x: 50 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -50 }}
                transition={{ duration: 0.7 }}
                className="flex items-center justify-center w-full"
              >
                <BrandedCard submission={activeSubmission} venue={venue} size="large" showReward={true} />
              </motion.div>
            ) : (
              /* FALLBACK EMPTY QUEUE STATE */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center text-center max-w-md p-8 rounded-3xl bg-zinc-950/80 border border-[#e5b842]/40 backdrop-blur-xl"
              >
                <div className="h-20 w-20 rounded-full bg-[#e5b842]/20 border-2 border-[#e5b842] flex items-center justify-center mb-4 text-[#e5b842]">
                  <Sparkles className="w-10 h-10 animate-pulse" />
                </div>
                <h2 className="font-serif text-3xl font-extrabold text-white">Be The First On Screen!</h2>
                <p className="text-zinc-300 text-sm mt-2">
                  Scan the QR code in the top right to take a selfie and become part of tonight's wall of fame.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM GALLERY FILMSTRIP — Show Other Guest Photos */}
        {submissions.length > 0 && (
          <div className="relative z-30 w-full max-w-7xl mt-2 pt-3 border-t border-white/10 bg-black/60 backdrop-blur-md rounded-2xl px-4 py-2.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-black tracking-widest text-[#e5b842] uppercase">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>TONIGHT'S WALL OF FAME ({submissions.length} PHOTOS)</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium hidden sm:inline">
                Click any photo to feature on main screen
              </span>
            </div>

            {/* Scrollable / Row of Photos at the Bottom */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#e5b842]/40">
              {submissions.map((sub, idx) => {
                const isActive = (featuredSub && sub.id === featuredSub.id) || (!featuredSub && idx === currentIndex);
                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setFeaturedSub(null);
                      setCurrentIndex(idx);
                    }}
                    className={`relative flex-shrink-0 group overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                      isActive
                        ? 'border-[#e5b842] shadow-[0_0_20px_rgba(229,184,66,0.6)] scale-105 z-10'
                        : 'border-white/20 hover:border-white/60 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {/* Thumbnail Image Container */}
                    <div className="relative h-20 w-24 sm:h-24 sm:w-28 overflow-hidden bg-black">
                      <img
                        src={sub.image_url}
                        alt={sub.first_name}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

                      {/* Active Indicator Badge */}
                      {isActive && (
                        <div className="absolute top-1 right-1 bg-[#e5b842] text-black font-black text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow">
                          NOW ON TV
                        </div>
                      )}

                      {/* Guest Name & Subtext */}
                      <div className="absolute bottom-1 left-1 right-1 text-left">
                        <div className="text-xs font-bold text-white truncate drop-shadow">
                          {sub.first_name}
                        </div>
                        <div className="text-[9px] text-[#e5b842] font-semibold uppercase tracking-tight truncate">
                          {sub.occasion?.type || 'Guest'}
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
      <footer className="relative z-30 bg-gradient-to-r from-[#14120c] via-black to-[#14120c] border-t-2 border-[#e5b842]/50 py-3 px-6 overflow-hidden">
        <div className="whitespace-nowrap flex items-center gap-8 animate-[marquee_25s_linear_infinite] text-sm md:text-base font-extrabold text-[#e5b842] tracking-wider uppercase">
          <span>{venue.wall_ticker_text}</span>
          <span>•</span>
          <span>TAG @LONDONKARAOKECLUB ON INSTAGRAM & UNLOCK A FREE SHOT AT THE BAR</span>
          <span>•</span>
          <span>SCAN QR CODE ON SCREEN TO JOIN THE WALL OF FAME</span>
          <span>•</span>
          <span>{venue.wall_ticker_text}</span>
        </div>
      </footer>
    </div>
  );
};
