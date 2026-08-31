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
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-[#e5b842] selection:text-black">
      {/* Top Application Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 border-b border-white/10 backdrop-blur-md px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <button
            onClick={() => navigateToView('guest')}
            className="flex items-center gap-2.5 group text-left"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden shadow-md group-hover:scale-105 transition-transform shrink-0">
              <LondonKaraokeLogo className="w-9 h-9" />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-wider text-[#e5b842] uppercase leading-none">
                SINGSHOT
              </div>
              <div className="text-[10px] text-zinc-400 font-medium leading-none mt-0.5">
                {venue.sub_name || 'at London Karaoke Club'}
              </div>
            </div>
          </button>

          {/* Top-Right Prominent QR Code */}
          <div className="flex items-center gap-3 bg-zinc-900/90 border-2 border-[#e5b842]/70 ring-1 ring-[#e5b842]/30 p-2 sm:p-2.5 pr-3.5 rounded-2xl shadow-[0_0_25px_rgba(229,184,66,0.35)] backdrop-blur-xl">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-xl bg-[#e5b842]/30 blur-sm animate-pulse pointer-events-none" />
              {headerQrUrl ? (
                <img
                  src={headerQrUrl}
                  alt="Scan QR code to join"
                  className="relative z-10 w-[56px] h-[56px] sm:w-[66px] sm:h-[66px] rounded-xl shadow-md bg-[#e5b842] p-0.5 border border-black/30 object-contain"
                />
              ) : (
                <div className="relative z-10 w-[56px] h-[56px] sm:w-[66px] sm:h-[66px] rounded-xl bg-[#e5b842] flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-black" />
                </div>
              )}
              <span className="absolute -top-1 -right-1 z-20 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e5b842] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#e5b842]" />
              </span>
            </div>

            <div className="flex flex-col justify-center text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-[#e5b842] tracking-wider uppercase leading-none drop-shadow">
                  SCAN TO JOIN
                </span>
                <span className="flex items-center gap-0.5 bg-[#e5b842]/20 text-[#e5b842] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                  <Sparkles className="w-2 h-2" /> LIVE
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-zinc-300 font-medium leading-tight mt-1">
                Open Camera on Phone
              </span>
              <span className="text-[9px] text-[#e5b842]/90 font-bold uppercase tracking-wider mt-0.5">
                Instant Screen Broadcast
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 flex flex-col justify-center p-4">
        {currentView === 'admin' && (
          <AdminDashboard
            venue={venue}
            onUpdateVenue={(updated) => setVenue((prev) => ({ ...prev, ...updated }))}
          />
        )}

        {currentView === 'commercial' && (
          <CommercialVenueSection onBackToGuest={() => navigateToView('guest')} />
        )}

        {currentView === 'guest' && (
          <div className="w-full my-auto py-4">
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
        <footer className="border-t border-white/10 bg-zinc-950/60 py-2.5 px-4 text-center text-xs text-zinc-400">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateToView('guest')}
                className={`transition-colors cursor-pointer hover:text-white font-medium ${
                  currentView === 'guest' ? 'text-[#e5b842] font-bold' : 'text-zinc-400'
                }`}
              >
                Guest Camera
              </button>
              <span className="text-zinc-600">•</span>
              <button
                onClick={() => navigateToView('wall')}
                className={`transition-colors cursor-pointer hover:text-[#e5b842] font-medium ${
                  currentView === 'wall' ? 'text-[#e5b842] font-bold' : 'text-zinc-400'
                }`}
              >
                TV Wall Screen
              </button>
              <span className="text-zinc-600">•</span>
              <button
                onClick={() => navigateToView('admin')}
                className={`transition-colors cursor-pointer hover:text-[#e5b842] font-medium ${
                  currentView === 'admin' ? 'text-[#e5b842] font-bold' : 'text-zinc-400'
                }`}
              >
                Staff Moderation
              </button>
            </div>

            <div className="text-[11px] text-zinc-400">
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
