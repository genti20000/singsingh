import React, { useState, useEffect } from 'react';
import { Venue, OccasionDetails, Submission, FrameStyleId } from './types';
import { INITIAL_VENUE } from './data/initialData';
import { GuestLanding } from './components/GuestFlow/GuestLanding';
import { MomentSelector } from './components/GuestFlow/MomentSelector';
import { GuestDetailsStep } from './components/GuestFlow/GuestDetailsStep';
import { SubmissionConfirmation } from './components/GuestFlow/SubmissionConfirmation';
import { CameraCapture } from './components/CameraCapture';
import { WallDisplay } from './components/WallDisplay';
import { AdminDashboard } from './components/AdminDashboard';
import { CommercialVenueSection } from './components/CommercialVenueSection';
import { Camera, Tv, ShieldCheck, Sparkles, Building2 } from 'lucide-react';

export default function App() {
  // Determine view based on URL pathname
  const [currentView, setCurrentView] = useState<'guest' | 'wall' | 'admin' | 'commercial'>(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith('/wall')) return 'wall';
    if (path.startsWith('/admin')) return 'admin';
    return 'guest';
  });

  const [venue, setVenue] = useState<Venue>(INITIAL_VENUE);

  // Guest flow state
  const [guestStep, setGuestStep] = useState<'landing' | 'moment' | 'details' | 'confirmation'>('landing');
  const [guestImage, setGuestImage] = useState<string | null>(null);
  const [guestOriginalImage, setGuestOriginalImage] = useState<string | null>(null);
  const [guestFrameStyle, setGuestFrameStyle] = useState<FrameStyleId>('neon-gold');
  const [guestOccasion, setGuestOccasion] = useState<OccasionDetails>({ type: 'star', frame_style: 'neon-gold' });
  const [submittedRecord, setSubmittedRecord] = useState<Submission | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch venue configuration from backend
  useEffect(() => {
    fetch('/api/venue')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setVenue(data);
      })
      .catch((err) => console.error('Failed to load venue config:', err));
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
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          caption,
          image_url: guestImage,
          original_image_url: guestOriginalImage || guestImage,
          frame_style: guestFrameStyle,
          occasion: { ...guestOccasion, frame_style: guestFrameStyle },
          event_id: venue.active_event_id,
        }),
      });

      if (res.ok) {
        const newSub: Submission = await res.json();
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
            className="flex items-center gap-2 group text-left"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#e5b842] to-amber-500 text-black font-black text-sm shadow-md group-hover:scale-105 transition-transform">
              SS
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

          {/* Navigation Mode Switcher */}
          <nav className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-2xl border border-white/10 text-xs">
            <button
              onClick={() => navigateToView('guest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                currentView === 'guest'
                  ? 'bg-[#e5b842] text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Take Selfie</span>
            </button>

            <button
              onClick={() => navigateToView('wall')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                currentView === 'wall'
                  ? 'bg-[#e5b842] text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Wall Screen</span>
            </button>

            <button
              onClick={() => navigateToView('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                currentView === 'admin'
                  ? 'bg-[#e5b842] text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Staff Queue</span>
            </button>

            <button
              onClick={() => navigateToView('commercial')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                currentView === 'commercial'
                  ? 'bg-[#e5b842] text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Venues</span>
            </button>
          </nav>
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
