import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Venue, OccasionDetails, Submission, FrameStyleId } from './types';
import { INITIAL_VENUE } from './data/initialData';
import { DataService, subscribeToSync } from './services/dataService';
import { GuestLanding } from './components/GuestFlow/GuestLanding';
import { MomentSelector } from './components/GuestFlow/MomentSelector';
import { GuestDetailsStep } from './components/GuestFlow/GuestDetailsStep';
import { SubmissionConfirmation } from './components/GuestFlow/SubmissionConfirmation';
import { CameraCapture } from './components/CameraCapture';
import { WallDisplay } from './components/WallDisplay';
import { AdminDashboard } from './components/AdminDashboard';
import { CommercialVenueSection } from './components/CommercialVenueSection';
import { LondonKaraokeLogo } from './components/LondonKaraokeLogo';
import { QrCode, Sparkles } from 'lucide-react';

export default function App() {
  // Determine view based on URL pathname
  const [currentView, setCurrentView] = useState<'guest' | 'wall' | 'admin' | 'commercial'>(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith('/wall')) return 'wall';
    if (path.startsWith('/admin')) return 'admin';
    return 'guest';
  });

  const [venue, setVenue] = useState<Venue>(INITIAL_VENUE);
  const [headerQrUrl, setHeaderQrUrl] = useState<string>('');

  // Guest flow state
  const [guestStep, setGuestStep] = useState<'landing' | 'moment' | 'details' | 'confirmation'>('landing');
  const [guestImage, setGuestImage] = useState<string | null>(null);
  const [guestOriginalImage, setGuestOriginalImage] = useState<string | null>(null);
  const [guestFrameStyle, setGuestFrameStyle] = useState<FrameStyleId>('neon-gold');
  const [guestOccasion, setGuestOccasion] = useState<OccasionDetails>({ type: 'star', frame_style: 'neon-gold' });
  const [submittedRecord, setSubmittedRecord] = useState<Submission | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate QR Code for top-right header
  useEffect(() => {
    const appUrl = window.location.origin;
    QRCode.toDataURL(appUrl, {
      margin: 1,
      width: 280,
      color: {
        dark: '#000000',
        light: '#e5b842',
      },
    })
      .then((url) => setHeaderQrUrl(url))
      .catch((err) => console.error('Failed to generate header QR code:', err));
  }, []);

  // Fetch venue configuration using resilient DataService
  useEffect(() => {
    DataService.getVenue().then((data) => {
      if (data) setVenue(data);
    });

    const unsubscribe = subscribeToSync((event) => {
      if (event.type === 'VENUE_UPDATED' && event.data) {
        setVenue(event.data as Venue);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen for popstate / browser URL changes
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/wall')) setCurrentView('wall');
      else if (path.startsWith('/admin')) setCurrentView('admin');
      else setCurrentView('guest');
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateToView = (view: 'guest' | 'wall' | 'admin' | 'commercial') => {
    setCurrentView(view);
    const pathMap = {
      guest: '/',
      wall: '/wall',
      admin: '/admin',
      commercial: '/venue-info',
    };
    window.history.pushState({}, '', pathMap[view]);
  };

  // Guest flow handlers
  const handlePhotoCaptured = (imageDataUrl: string, originalDataUrl?: string, frameStyle?: FrameStyleId) => {
    setGuestImage(imageDataUrl);
    setGuestOriginalImage(originalDataUrl || imageDataUrl);
    const chosenFrame = frameStyle || guestFrameStyle;
    setGuestFrameStyle(chosenFrame);
    setGuestOccasion((prev) => ({ ...prev, frame_style: chosenFrame }));
    setIsCameraOpen(false);
    setGuestStep('moment');
  };

  const handleGuestSubmit = async (firstName: string, caption: string) => {
    if (!guestImage) return;
    setIsSubmitting(true);

    try {
      const newSub = await DataService.createSubmission({
        first_name: firstName,
        caption,
        image_url: guestImage,
        original_image_url: guestOriginalImage || guestImage,
        frame_style: guestFrameStyle,
        occasion: { ...guestOccasion, frame_style: guestFrameStyle },
        event_id: venue.active_event_id,
      });

      if (newSub) {
        setSubmittedRecord(newSub);
        setGuestStep('confirmation');
      }
    } catch (err) {
      console.error('Failed to submit photo:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetGuestFlow = () => {
    setGuestStep('landing');
    setGuestImage(null);
    setGuestOriginalImage(null);
    setGuestFrameStyle('neon-gold');
    setGuestOccasion({ type: 'star', frame_style: 'neon-gold' });
    setSubmittedRecord(null);
  };

  // Render Full-Screen Wall Display directly without navigation bars
  if (currentView === 'wall') {
    return <WallDisplay venue={venue} />;
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-[#050505] text-white flex flex-col justify-between font-sans selection:bg-[#e5b842] selection:text-black overflow-hidden">
      {/* Top Application Header Navigation Bar */}
      <header className="shrink-0 z-40 bg-zinc-950/95 border-b border-[#e5b842]/30 backdrop-blur-2xl px-3 sm:px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <button
            onClick={() => navigateToView('guest')}
            className="flex items-center gap-2.5 group text-left min-h-[38px] cursor-pointer"
          >
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full overflow-hidden shadow-[0_0_15px_rgba(229,184,66,0.4)] group-hover:scale-105 transition-transform shrink-0 border border-[#e5b842]/60">
              <LondonKaraokeLogo className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>
            <div>
              <div className="font-black text-xs sm:text-sm tracking-widest text-[#e5b842] uppercase leading-none font-cinzel">
                SINGSHOT
              </div>
              <div className="text-[9px] sm:text-[10px] text-zinc-400 font-semibold leading-none mt-1 truncate max-w-[130px] sm:max-w-none">
                {venue.sub_name || 'London Soho Live'}
              </div>
            </div>
          </button>

          {/* Right Header: Responsive QR Badge on Mobile, Full Widget on Desktop */}
          <div className="flex items-center gap-2">
            {/* Mobile-only compact Live indicator */}
            <div className="flex sm:hidden items-center gap-1.5 bg-zinc-900/90 border border-[#e5b842]/60 px-3 py-1 rounded-full shadow-lg backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e5b842] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e5b842]" />
              </span>
              <span className="text-[10px] font-black text-[#e5b842] uppercase tracking-wider font-cinzel">
                SOHO LIVE
              </span>
            </div>

            {/* Desktop / Tablet Prominent QR Code */}
            <div className="hidden sm:flex items-center gap-2.5 bg-zinc-950/90 border border-[#e5b842]/70 ring-1 ring-[#e5b842]/30 p-1.5 pr-3 rounded-2xl shadow-[0_0_25px_rgba(229,184,66,0.35)] backdrop-blur-xl">
              <div className="relative shrink-0">
                {headerQrUrl ? (
                  <img
                    src={headerQrUrl}
                    alt="Scan QR code to join"
                    className="relative z-10 w-9 h-9 rounded-xl shadow-md bg-[#e5b842] p-0.5 border border-black/30 object-contain"
                  />
                ) : (
                  <div className="relative z-10 w-9 h-9 rounded-xl bg-[#e5b842] flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-black" />
                  </div>
                )}
                <span className="absolute -top-1 -right-1 z-20 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e5b842] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#e5b842]" />
                </span>
              </div>

              <div className="flex flex-col justify-center text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-[#e5b842] tracking-wider uppercase leading-none font-cinzel">
                    SCAN TO JOIN
                  </span>
                  <span className="flex items-center gap-0.5 bg-[#e5b842]/20 text-[#e5b842] text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                    <Sparkles className="w-2 h-2" /> LIVE
                  </span>
                </div>
                <span className="text-[10px] text-zinc-300 font-medium leading-tight mt-0.5">
                  Open Camera on Phone
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main View Area (Flex 1, centered, fitted inside one screen) */}
      <main className="flex-1 min-h-0 flex flex-col justify-center items-center px-2 sm:px-4 py-1 sm:py-2 overflow-y-auto">
        {currentView === 'admin' && (
          <div className="w-full h-full overflow-y-auto">
            <AdminDashboard
              venue={venue}
              onUpdateVenue={(updated) => setVenue((prev) => ({ ...prev, ...updated }))}
            />
          </div>
        )}

        {currentView === 'commercial' && (
          <div className="w-full h-full overflow-y-auto">
            <CommercialVenueSection onBackToGuest={() => navigateToView('guest')} />
          </div>
        )}

        {currentView === 'guest' && (
          <div className="w-full h-full flex flex-col justify-center items-center my-auto">
            {guestStep === 'landing' && (
              <GuestLanding
                venue={venue}
                onTakeSelfie={() => setIsCameraOpen(true)}
                onUploadPhoto={() => setIsCameraOpen(true)}
                onOpenCommercialSection={() => navigateToView('commercial')}
              />
            )}

            {guestStep === 'moment' && (
              <MomentSelector
                value={guestOccasion}
                onChange={setGuestOccasion}
                onNext={() => setGuestStep('details')}
                onBack={() => setGuestStep('landing')}
              />
            )}

            {guestStep === 'details' && guestImage && (
              <GuestDetailsStep
                imageUrl={guestImage}
                occasion={guestOccasion}
                onSubmit={handleGuestSubmit}
                onBack={() => setGuestStep('moment')}
                venue={venue}
                isSubmitting={isSubmitting}
              />
            )}

            {guestStep === 'confirmation' && submittedRecord && (
              <SubmissionConfirmation
                submission={submittedRecord}
                venue={venue}
                onReset={handleResetGuestFlow}
              />
            )}
          </div>
        )}
      </main>

      {/* Discrete Bottom Footer with Quick Operator Links */}
      {currentView !== 'wall' && (
        <footer className="shrink-0 border-t border-white/10 bg-zinc-950/95 py-2 px-3 sm:px-4 text-center text-xs text-zinc-400 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => navigateToView('guest')}
                className={`py-1 px-2.5 rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center ${
                  currentView === 'guest' ? 'text-[#e5b842] bg-[#e5b842]/10 border border-[#e5b842]/30 font-bold' : 'text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                Guest Camera
              </button>
              <span className="text-zinc-700">•</span>
              <button
                onClick={() => navigateToView('wall')}
                className={`py-1 px-2.5 rounded-lg transition-colors cursor-pointer hover:text-[#e5b842] font-medium text-xs flex items-center ${
                  currentView === 'wall' ? 'text-[#e5b842] bg-[#e5b842]/10 border border-[#e5b842]/30 font-bold' : 'text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                TV Wall Screen
              </button>
              <span className="text-zinc-700">•</span>
              <button
                onClick={() => navigateToView('admin')}
                className={`py-1 px-2.5 rounded-lg transition-colors cursor-pointer hover:text-[#e5b842] font-medium text-xs flex items-center ${
                  currentView === 'admin' ? 'text-[#e5b842] bg-[#e5b842]/10 border border-[#e5b842]/30 font-bold' : 'text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                Staff Moderation
              </button>
            </div>

            <div className="text-[10px] text-zinc-500 hidden sm:block">
              SingShot Live Stage Broadcast • London Karaoke Club
            </div>
          </div>
        </footer>
      )}

      {/* Camera Capture Modal */}
      {isCameraOpen && (
        <CameraCapture
          onCapture={handlePhotoCaptured}
          onCancel={() => setIsCameraOpen(false)}
          initialImage={guestImage}
          initialFrameStyle={guestFrameStyle}
        />
      )}
    </div>
  );
}
