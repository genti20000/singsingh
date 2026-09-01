import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, FlipHorizontal, Upload, X, Check, Sparkles, Wand2, Frame, Timer, Zap, Scissors, Layers } from 'lucide-react';
import { BEAUTIFY_PRESETS, BeautifyPreset, processBeautifiedImage } from '../utils/beautify';
import { FRAME_STYLES, FrameStyleOption } from '../utils/frameStyles';
import { FrameOverlay } from './FrameOverlay';
import { FrameStyleId } from '../types';
import { CUTOUT_PRESETS, CutoutStyle, removeBackgroundClient } from '../utils/removeBackground';

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string, originalDataUrl?: string, frameStyle?: FrameStyleId) => void;
  onCancel: () => void;
  initialImage?: string | null;
  initialFrameStyle?: FrameStyleId;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onCancel,
  initialImage = null,
  initialFrameStyle = 'neon-gold',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [rawCapturedImage, setRawCapturedImage] = useState<string | null>(initialImage);
  const [activeFilter, setActiveFilter] = useState<BeautifyPreset>('glow');
  const [activeCutout, setActiveCutout] = useState<CutoutStyle>('transparent');
  const [activeFrameStyle, setActiveFrameStyle] = useState<FrameStyleId>(initialFrameStyle);
  const [previewTab, setPreviewTab] = useState<'backgrounds' | 'frames' | 'beautify'>('backgrounds');
  const [backgroundCategory, setBackgroundCategory] = useState<'all' | 'vip' | 'party' | 'scene' | 'studio'>('all');
  const [displayImage, setDisplayImage] = useState<string | null>(initialImage);
  const [isProcessingCutout, setIsProcessingCutout] = useState(false);
  const [isProcessingFilter, setIsProcessingFilter] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownEnabled, setCountdownEnabled] = useState<boolean>(true);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  // Play subtle feedback beep using Web Audio API
  const playCountdownBeep = (frequency = 600, duration = 0.08) => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // AudioContext may be restricted by autoplay policy, safely ignore
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Process Cutout & Beautify whenever raw image, activeFilter, or activeCutout changes
  useEffect(() => {
    if (!rawCapturedImage) {
      setDisplayImage(null);
      return;
    }

    let isCancelled = false;

    const processImagePipeline = async () => {
      setIsProcessingCutout(true);
      try {
        // Step 1: Background removal / Cutout
        let intermediate = rawCapturedImage;
        if (activeCutout !== 'original') {
          intermediate = await removeBackgroundClient(rawCapturedImage, activeCutout);
        }

        if (isCancelled) return;

        // Step 2: Beautify filter
        if (activeFilter === 'original') {
          setDisplayImage(intermediate);
          setIsProcessingCutout(false);
        } else {
          setIsProcessingFilter(true);
          processBeautifiedImage(intermediate, activeFilter, (processed) => {
            if (!isCancelled) {
              setDisplayImage(processed);
              setIsProcessingCutout(false);
              setIsProcessingFilter(false);
            }
          });
        }
      } catch (err) {
        console.error('Image pipeline processing error:', err);
        if (!isCancelled) {
          setDisplayImage(rawCapturedImage);
          setIsProcessingCutout(false);
          setIsProcessingFilter(false);
        }
      }
    };

    processImagePipeline();

    return () => {
      isCancelled = true;
    };
  }, [rawCapturedImage, activeCutout, activeFilter]);

  // Start Camera Stream
  const startCamera = async (mode: 'user' | 'environment') => {
    setIsLoadingCamera(true);
    setCameraError(null);

    // Stop existing stream if any
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1080 },
          height: { ideal: 1440 },
          aspectRatio: { ideal: 0.75 }, // Portrait
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. You can upload a photo instead!');
    } finally {
      setIsLoadingCamera(false);
    }
  };

  useEffect(() => {
    if (!rawCapturedImage) {
      startCamera(facingMode);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode, rawCapturedImage]);

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
  };

  const cancelCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
  };

  // Immediate photo capture execution
  const executeSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Trigger visual camera flash
    setIsFlashing(true);
    playCountdownBeep(1200, 0.15);

    canvas.width = video.videoWidth || 800;
    canvas.height = video.videoHeight || 1066;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsFlashing(false);
      return;
    }

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    setTimeout(() => {
      setIsFlashing(false);
    }, 180);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    setCountdown(null);
    setRawCapturedImage(dataUrl);
  };

  // Start 3-2-1 countdown or snap immediately based on setting
  const handleStartCapture = () => {
    if (isLoadingCamera || !!cameraError) return;

    if (!countdownEnabled) {
      executeSnap();
      return;
    }

    if (countdown !== null) {
      // If already counting down, snap immediately
      cancelCountdown();
      executeSnap();
      return;
    }

    let currentCount = 3;
    setCountdown(3);
    playCountdownBeep(520, 0.1);

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    countdownTimerRef.current = setInterval(() => {
      currentCount -= 1;
      if (currentCount > 0) {
        setCountdown(currentCount);
        playCountdownBeep(currentCount === 1 ? 800 : 660, 0.1);
      } else {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        executeSnap();
      }
    }, 1000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    cancelCountdown();
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }
        setRawCapturedImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    cancelCountdown();
    setRawCapturedImage(null);
    setDisplayImage(null);
    startCamera(facingMode);
  };

  const handleConfirm = () => {
    const finalImg = displayImage || rawCapturedImage;
    if (finalImg && rawCapturedImage) {
      onCapture(finalImg, rawCapturedImage, activeFrameStyle);
    }
  };

  const currentFrameOption = FRAME_STYLES.find((f) => f.id === activeFrameStyle) || FRAME_STYLES[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-2 sm:p-4 backdrop-blur-md overflow-y-auto overscroll-contain">
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div
        className="camera-capture-shell relative flex w-full max-w-md max-h-[96dvh] flex-col overflow-y-auto sm:overflow-hidden rounded-2xl sm:rounded-3xl border border-[#e5b842]/50 bg-zinc-950 p-3 sm:p-4 text-white shadow-2xl my-auto"
        style={!rawCapturedImage ? { backgroundImage: "url('/lkc-vip-birthday-spotlight.svg')" } : undefined}
      >
        {!rawCapturedImage && <div className="camera-artwork-wash absolute inset-0" aria-hidden="true" />}

        {/* Header Bar */}
        <div className="relative z-10 mb-2 sm:mb-3 flex items-center justify-between border-b border-white/10 pb-2.5 sm:pb-3">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[#e5b842] animate-ping" />
            <span className="font-serif font-bold text-base sm:text-lg text-white">SingShot Selfie</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Timer Toggle */}
            {!rawCapturedImage && (
              <button
                type="button"
                onClick={() => setCountdownEnabled((prev) => !prev)}
                className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer min-h-[36px] ${
                  countdownEnabled
                    ? 'bg-[#e5b842]/20 border-[#e5b842] text-[#e5b842]'
                    : 'bg-zinc-800 border-white/10 text-zinc-400 hover:text-white'
                }`}
                title="Toggle 3-Second Timer"
              >
                <Timer className="w-3.5 h-3.5" />
                <span>{countdownEnabled ? '3s Timer' : 'Instant'}</span>
              </button>
            )}

            <button
              onClick={() => {
                cancelCountdown();
                onCancel();
              }}
              className="rounded-full bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* View Area: Camera Stream or Photo Preview */}
        <div className="camera-viewport relative z-10 flex w-full items-center justify-center overflow-hidden rounded-2xl border border-[#e5b842]/45 bg-black/60">
          {/* Visual Camera Flash */}
          {isFlashing && (
            <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150" />
          )}

          {displayImage ? (
            <div className="relative h-full w-full">
              <img
                src={displayImage}
                alt="Captured Selfie"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* LIVE FRAME STYLE & NEON BORDER OVERLAY */}
              <FrameOverlay frameStyle={activeFrameStyle} />

              {/* Active Badges */}
              <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5 z-20">
                {activeCutout !== 'original' && (
                  <div className="bg-amber-400 text-black px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-lg">
                    <Scissors className="w-3 h-3 text-black" />
                    <span>{CUTOUT_PRESETS.find((c) => c.id === activeCutout)?.badge || '✂️ CUTOUT'}</span>
                  </div>
                )}
                {activeFrameStyle !== 'none' && (
                  <div className="bg-black/85 backdrop-blur-md border border-[#e5b842]/50 px-2.5 py-1 rounded-full text-[10px] text-[#e5b842] font-black flex items-center gap-1 shadow-lg">
                    <Frame className="w-3 h-3 text-[#e5b842]" />
                    <span>{currentFrameOption.badge}</span>
                  </div>
                )}
                {activeFilter !== 'original' && (
                  <div className="bg-black/80 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full text-[10px] text-zinc-200 font-bold flex items-center gap-1 shadow-lg">
                    <Wand2 className="w-3 h-3 text-[#e5b842]" />
                    <span>{BEAUTIFY_PRESETS.find((p) => p.id === activeFilter)?.label || 'Beautified'}</span>
                  </div>
                )}
              </div>

              {/* Quick Cutout Toggle Pill in Top-Right of photo */}
              <button
                type="button"
                onClick={() => {
                  setActiveCutout((prev) => (prev === 'transparent' ? 'original' : 'transparent'));
                  setPreviewTab('cutout');
                }}
                className={`absolute top-3 right-3 z-30 px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition-all shadow-xl backdrop-blur-md border cursor-pointer ${
                  activeCutout !== 'original'
                    ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                    : 'bg-black/80 text-zinc-300 border-white/20 hover:text-white hover:bg-black'
                }`}
                title="Toggle Instant Background Removal"
              >
                <Scissors className={`w-3.5 h-3.5 ${activeCutout !== 'original' ? 'text-black' : 'text-[#e5b842]'}`} />
                <span>{activeCutout !== 'original' ? 'No Background (On)' : 'Remove BG'}</span>
              </button>

              {(isProcessingCutout || isProcessingFilter) && (
                <div className="absolute inset-0 bg-black/65 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-30 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 bg-zinc-900 border border-[#e5b842]/40 px-4 py-2.5 rounded-full text-xs font-black text-[#e5b842] shadow-2xl">
                    <Sparkles className="w-4 h-4 animate-spin text-[#e5b842]" />
                    <span>{isProcessingCutout ? 'Removing Background...' : 'Applying Beautify Filter...'}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-semibold tracking-wider">
                    {isProcessingCutout ? 'Extracting VIP Singer Cutout' : 'Enhancing Stage Glow'}
                  </span>
                </div>
              )}
            </div>
          ) : cameraError ? (
            <div className="p-6 text-center">
              <p className="text-sm text-zinc-300 mb-4">{cameraError}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#e5b842] text-black font-bold rounded-xl shadow-lg hover:bg-amber-400"
              >
                <Upload className="w-4 h-4" /> Choose from Photos
              </button>
            </div>
          ) : (
            <div className="relative h-full w-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />

              <div className="absolute left-3 top-3 z-20 rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#fff1af] backdrop-blur-sm">
                Portrait capture · front camera
              </div>

              {/* Selfie Frame Guide Overlay (hidden during countdown for clear view) */}
              {countdown === null && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="camera-face-guide flex h-[58%] w-[66%] items-end justify-center rounded-[48%] border-2 border-dashed border-[#e5b842]/80 pb-6 shadow-[0_0_28px_rgba(229,184,66,0.35)]">
                    <span className="rounded-full border border-white/20 bg-black/65 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#fff1af] backdrop-blur-sm">
                      Keep face in the light
                    </span>
                  </div>
                </div>
              )}

              {/* 3-2-1 COUNTDOWN VISUAL OVERLAY */}
              <AnimatePresence>
                {countdown !== null && (
                  <motion.div
                    key="countdown-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]"
                  >
                    {/* Glowing Countdown Ring & Big Number */}
                    <div className="relative flex items-center justify-center">
                      {/* Pulse Wave Rings */}
                      <div className="absolute h-36 w-36 rounded-full border-2 border-[#e5b842]/40 animate-ping" />
                      <div className="absolute h-44 w-44 rounded-full border border-amber-500/20" />

                      {/* Main Countdown Disc */}
                      <div className="h-28 w-28 rounded-full border-4 border-[#e5b842] bg-zinc-950/85 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(229,184,66,0.9),inset_0_0_20px_rgba(229,184,66,0.3)] backdrop-blur-md">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={`count-${countdown}`}
                            initial={{ scale: 0.4, opacity: 0, y: 10 }}
                            animate={{ scale: [1.4, 1], opacity: 1, y: 0 }}
                            exit={{ scale: 1.8, opacity: 0 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                            className="font-serif font-black text-6xl text-[#e5b842] drop-shadow-[0_0_25px_rgba(229,184,66,1)] leading-none"
                          >
                            {countdown}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Countdown Status Tagline */}
                    <motion.div
                      key={`tag-${countdown}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 flex flex-col items-center gap-1"
                    >
                      <span className="text-sm font-extrabold text-white tracking-wider uppercase drop-shadow-md flex items-center gap-1.5">
                        {countdown === 3 && '✨ Get Ready!'}
                        {countdown === 2 && '🎤 Look at Camera!'}
                        {countdown === 1 && '📸 Strike a Pose!'}
                      </span>
                      <span className="text-[11px] text-[#e5b842] font-semibold">
                        Snapping photo in {countdown}s...
                      </span>
                    </motion.div>

                    {/* Countdown Quick Action Buttons */}
                    <div className="mt-5 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={cancelCountdown}
                        className="px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-white/20 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors shadow-lg"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          cancelCountdown();
                          executeSnap();
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-[#e5b842] text-black text-xs font-extrabold shadow-lg hover:brightness-110 flex items-center gap-1"
                      >
                        <Zap className="w-3.5 h-3.5 fill-black" /> Snap Now
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isLoadingCamera && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="h-8 w-8 animate-spin text-[#e5b842]" />
                    <span className="text-xs text-zinc-300">Starting camera...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PHOTO CUSTOMIZATION TABS & SELECTION GRIDS (Only visible after capture) */}
        {rawCapturedImage && (
          <div className="relative z-10 mt-2.5 flex flex-col gap-2">
            {/* Customization Nav Tabs: Backgrounds | Frames | Beautify */}
            <div className="flex items-center rounded-xl bg-zinc-900/90 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setPreviewTab('backgrounds')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  previewTab === 'backgrounds'
                    ? 'bg-gradient-to-r from-[#e5b842] to-amber-500 text-black shadow-md font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Backgrounds</span>
                {activeCutout !== 'original' && (
                  <span className="w-2 h-2 rounded-full bg-black" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab('frames')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  previewTab === 'frames'
                    ? 'bg-[#e5b842] text-black shadow-md font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Frame className="w-3.5 h-3.5" />
                <span>Frames</span>
                {activeFrameStyle !== 'none' && (
                  <span className="w-2 h-2 rounded-full bg-amber-950" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setPreviewTab('beautify')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  previewTab === 'beautify'
                    ? 'bg-[#e5b842] text-black shadow-md font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Beautify</span>
              </button>
            </div>

            {/* TAB 1: BACKGROUNDS & VIRTUAL BACKDROPS */}
            {previewTab === 'backgrounds' && (
              <div className="bg-zinc-900/90 border border-amber-400/30 rounded-2xl p-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" /> Virtual Backdrops
                    </span>
                    <span className="text-[9px] bg-amber-400/20 text-amber-300 font-bold px-1.5 py-0.2 rounded-full border border-amber-400/40">
                      {CUTOUT_PRESETS.find((c) => c.id === activeCutout)?.label || 'Active'}
                    </span>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1">
                    {(['all', 'vip', 'party', 'scene', 'studio'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setBackgroundCategory(cat)}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase transition-all ${
                          backgroundCategory === cat
                            ? 'bg-amber-400 text-black'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[145px] overflow-y-auto pr-1">
                  {CUTOUT_PRESETS.filter(
                    (preset) => backgroundCategory === 'all' || preset.category === backgroundCategory
                  ).map((preset) => {
                    const isSelected = activeCutout === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setActiveCutout(preset.id)}
                        className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between gap-1 ${
                          isSelected
                            ? 'border-amber-400 bg-zinc-800 shadow-[0_0_15px_rgba(251,191,36,0.3)] ring-1 ring-amber-400 scale-101'
                            : 'border-white/10 bg-zinc-950/80 hover:border-white/30 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[10px] font-extrabold ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                            {preset.badge}
                          </span>
                          {isSelected && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-200 truncate">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: FRAME STYLES SELECTION GRID */}
            {previewTab === 'frames' && (
              <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-extrabold text-[#e5b842] uppercase tracking-wider flex items-center gap-1">
                    <Frame className="w-3.5 h-3.5" /> Select Frame Overlay
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {currentFrameOption.tagline}
                  </span>
                </div>

                {/* 3x3 Responsive Frame Styles Grid */}
                <div className="grid grid-cols-3 gap-1.5 max-h-[145px] overflow-y-auto pr-1">
                  {FRAME_STYLES.map((frame) => {
                    const isSelected = activeFrameStyle === frame.id;
                    return (
                      <button
                        key={frame.id}
                        type="button"
                        onClick={() => setActiveFrameStyle(frame.id)}
                        className={`relative p-2 rounded-xl text-left border transition-all flex flex-col justify-between gap-1 overflow-hidden ${
                          isSelected
                            ? 'border-[#e5b842] bg-zinc-800 shadow-[0_0_12px_rgba(229,184,66,0.35)] scale-102 ring-1 ring-[#e5b842]'
                            : 'border-white/10 bg-zinc-950/80 hover:border-white/30 text-zinc-300'
                        }`}
                      >
                        {/* Miniature Neon Border Preview */}
                        <div className={`h-4 w-full rounded-md border ${frame.borderColor} ${frame.previewBg} flex items-center justify-center`}>
                          <span className="text-[8px] font-black uppercase tracking-tighter truncate px-1 text-white">
                            {frame.badge.split(' ')[0]}
                          </span>
                        </div>

                        <div className="flex items-center justify-between w-full">
                          <span className={`text-[10px] font-bold truncate ${isSelected ? 'text-[#e5b842]' : 'text-zinc-200'}`}>
                            {frame.name}
                          </span>
                          {isSelected && <Check className="w-3 h-3 text-[#e5b842] shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: PHOTO BEAUTIFY SELECTION GRID */}
            {previewTab === 'beautify' && (
              <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-extrabold text-[#e5b842] uppercase tracking-wider flex items-center gap-1">
                    <Wand2 className="w-3.5 h-3.5" /> 1-Tap Skin & Glow
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">Lighting presets</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {BEAUTIFY_PRESETS.map((preset) => {
                    const isSelected = activeFilter === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setActiveFilter(preset.id)}
                        className={`py-2 px-1 rounded-xl text-[10px] font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5 border ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#e5b842] to-amber-500 text-black border-[#e5b842] shadow-md scale-102 font-extrabold'
                            : 'bg-zinc-800/80 text-zinc-300 border-white/10 hover:border-white/40 hover:text-white'
                        }`}
                      >
                        <span className="truncate w-full">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Controls Footer */}
        <div className="relative z-10 mt-2 sm:mt-3 flex items-center justify-between gap-3">
          {rawCapturedImage ? (
            <>
              <button
                onClick={handleRetake}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-800 py-3 px-4 min-h-[48px] text-sm font-semibold text-white hover:bg-zinc-700 active:scale-98 transition-all cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" /> Retake
              </button>
              <button
                onClick={handleConfirm}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e5b842] to-amber-500 py-3 px-4 min-h-[48px] text-sm font-extrabold text-black shadow-lg hover:brightness-110 active:scale-98 transition-all cursor-pointer"
              >
                <Check className="h-4 w-4" /> Use Photo
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-800 px-3.5 py-3 min-h-[48px] text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700 active:scale-98 transition-all cursor-pointer"
                title="Upload Photo"
              >
                <Upload className="h-4 w-4" /> Upload
              </button>

              {/* Shutter Button */}
              <button
                onClick={handleStartCapture}
                disabled={isLoadingCamera || !!cameraError}
                className={`flex h-14 w-14 items-center justify-center rounded-full transition-transform cursor-pointer disabled:opacity-50 ${
                  countdown !== null
                    ? 'bg-gradient-to-r from-red-500 to-amber-500 p-1 animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.7)]'
                    : 'bg-gradient-to-r from-[#e5b842] via-yellow-400 to-amber-500 p-1 shadow-[0_0_20px_rgba(229,184,66,0.5)] hover:scale-105 active:scale-95'
                }`}
                title={countdown !== null ? 'Tap to snap immediately' : countdownEnabled ? 'Start 3-second countdown' : 'Take photo'}
              >
                <div className="h-11 w-11 rounded-full border-2 border-black bg-white/20 flex items-center justify-center">
                  {countdown !== null ? (
                    <span className="font-serif font-black text-lg text-black">{countdown}</span>
                  ) : (
                    <Camera className="h-6 w-6 text-black" />
                  )}
                </div>
              </button>

              <button
                onClick={toggleCameraFacing}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-800 px-3.5 py-3 min-h-[48px] text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700 active:scale-98 transition-all cursor-pointer"
                title="Flip Camera"
              >
                <FlipHorizontal className="h-4 w-4" /> Flip
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
