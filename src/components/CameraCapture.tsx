import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, FlipHorizontal, Upload, X, Check, Sparkles, Wand2, Frame, Timer, Zap } from 'lucide-react';
import { BEAUTIFY_PRESETS, BeautifyPreset, processBeautifiedImage } from '../utils/beautify';
import { FRAME_STYLES, FrameStyleOption } from '../utils/frameStyles';
import { FrameOverlay } from './FrameOverlay';
import { FrameStyleId } from '../types';

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
  const [activeFrameStyle, setActiveFrameStyle] = useState<FrameStyleId>(initialFrameStyle);
  const [previewTab, setPreviewTab] = useState<'frames' | 'beautify'>('frames');
  const [displayImage, setDisplayImage] = useState<string | null>(initialImage);
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

  // Apply beautify preset whenever raw image or active filter changes
  useEffect(() => {
    if (!rawCapturedImage) {
      setDisplayImage(null);
      return;
    }

    if (activeFilter === 'original') {
      setDisplayImage(rawCapturedImage);
      return;
    }

    setIsProcessingFilter(true);
    processBeautifiedImage(rawCapturedImage, activeFilter, (processed) => {
      setDisplayImage(processed);
      setIsProcessingFilter(false);
    });
  }, [rawCapturedImage, activeFilter]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3 sm:p-6 backdrop-blur-md overflow-y-auto">
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-[#e5b842]/40 bg-zinc-950 p-4 text-white shadow-2xl my-auto">
        {/* Header Bar */}
        <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#e5b842] animate-ping" />
            <span className="font-serif font-bold text-lg text-white">SingShot Selfie</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Timer Toggle */}
            {!rawCapturedImage && (
              <button
                type="button"
                onClick={() => setCountdownEnabled((prev) => !prev)}
                className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
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
              className="rounded-full bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* View Area: Camera Stream or Photo Preview */}
        <div className="relative flex h-[340px] sm:h-[380px] w-full items-center justify-center overflow-hidden rounded-2xl bg-black border border-white/10">
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
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-20">
                {activeFrameStyle !== 'none' && (
                  <div className="bg-black/85 backdrop-blur-md border border-[#e5b842]/50 px-2.5 py-1 rounded-full text-[10px] text-[#e5b842] font-black flex items-center gap-1 shadow-lg">
                    <Frame className="w-3 h-3 text-[#e5b842]" />
                    <span>{currentFrameOption.badge}</span>
                  </div>
                )}
                <div className="bg-black/80 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full text-[10px] text-zinc-200 font-bold flex items-center gap-1 shadow-lg">
                  <Wand2 className="w-3 h-3 text-[#e5b842]" />
                  <span>{BEAUTIFY_PRESETS.find((p) => p.id === activeFilter)?.label || 'Beautified'}</span>
                </div>
              </div>

              {isProcessingFilter && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30">
                  <div className="flex items-center gap-2 bg-zinc-900 px-4 py-2 rounded-full text-xs font-bold text-[#e5b842]">
                    <Sparkles className="w-4 h-4 animate-spin" /> Beautifying Photo...
                  </div>
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

              {/* Selfie Frame Guide Overlay (hidden during countdown for clear view) */}
              {countdown === null && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-[250px] w-[190px] rounded-[50%] border-2 border-dashed border-[#e5b842]/70 shadow-[0_0_20px_rgba(229,184,66,0.3)] flex items-center justify-center">
                    <span className="text-[10px] uppercase font-bold text-[#e5b842] bg-black/60 px-2 py-0.5 rounded-full">
                      Center Face Here
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
          <div className="mt-3 flex flex-col gap-2">
            {/* Customization Nav Tabs */}
            <div className="flex items-center rounded-xl bg-zinc-900/90 p-1 border border-white/10">
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
                <span>Frame Styles</span>
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
                <span>Photo Beautify</span>
              </button>
            </div>

            {/* TAB 1: FRAME STYLES SELECTION GRID */}
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

            {/* TAB 2: PHOTO BEAUTIFY SELECTION GRID */}
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
        <div className="mt-3 flex items-center justify-between gap-3">
          {rawCapturedImage ? (
            <>
              <button
                onClick={handleRetake}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-800 py-3 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" /> Retake
              </button>
              <button
                onClick={handleConfirm}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e5b842] to-amber-500 py-3 text-sm font-extrabold text-black shadow-lg hover:brightness-110 transition-all"
              >
                <Check className="h-4 w-4" /> Use This Photo
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl bg-zinc-800 px-3 py-3 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
                title="Upload Photo"
              >
                <Upload className="h-4 w-4" /> Upload
              </button>

              {/* Shutter Button */}
              <button
                onClick={handleStartCapture}
                disabled={isLoadingCamera || !!cameraError}
                className={`flex h-14 w-14 items-center justify-center rounded-full transition-transform disabled:opacity-50 ${
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
                className="flex items-center gap-2 rounded-xl bg-zinc-800 px-3 py-3 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
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
