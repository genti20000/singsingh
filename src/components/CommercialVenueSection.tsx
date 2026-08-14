import React from 'react';
import { Camera, Sparkles, Gift, TrendingUp, Tv, ChevronLeft, ArrowRight } from 'lucide-react';

interface CommercialVenueSectionProps {
  onBackToGuest: () => void;
}

export const CommercialVenueSection: React.FC<CommercialVenueSectionProps> = ({ onBackToGuest }) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 sm:p-12 selection:bg-[#e5b842] selection:text-black">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Navigation back */}
        <button
          onClick={onBackToGuest}
          className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-[#e5b842] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Guest Selfie Experience
        </button>

        {/* Hero Section */}
        <div className="text-center space-y-4">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-[#e5b842] bg-[#e5b842]/10 px-4 py-1.5 rounded-full border border-[#e5b842]/30">
            For Venue Operators & Event Managers
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-white leading-tight">
            Turn guest selfies into <br />
            <span className="bg-gradient-to-r from-[#e5b842] via-yellow-300 to-amber-500 bg-clip-text text-transparent">
              live entertainment.
            </span>
          </h1>
          <p className="text-zinc-300 text-base max-w-2xl mx-auto leading-relaxed">
            SingShot transforms customer photos into branded moments on your venue screens, giving guests another reason to interact, celebrate and spend.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-zinc-900/80 border border-white/10 hover:border-[#e5b842]/50 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-[#e5b842]/20 border border-[#e5b842] text-[#e5b842] flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-white">Selfie to Screen</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Guests scan a QR code on tables or screens, snap a selfie, and appear live on venue TVs in seconds. Zero app downloads needed.
              </p>
            </div>
            <div className="text-[10px] font-bold text-[#e5b842] uppercase tracking-wider flex items-center gap-1 pt-4 border-t border-white/10">
              <Tv className="w-3.5 h-3.5" /> High Guest Engagement
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-zinc-900/80 border border-white/10 hover:border-[#e5b842]/50 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-500 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-white">Branded Night Moments</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Special frames for Star of the Night, Birthdays, Hen Parties, and Corporate Nights with custom typography & floating particle effects.
              </p>
            </div>
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 pt-4 border-t border-white/10">
              <Sparkles className="w-3.5 h-3.5" /> Premium Nightlife Aesthetics
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-zinc-900/80 border border-white/10 hover:border-[#e5b842]/50 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-white">Rewards That Drive Sales</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Use screen moments to unlock drinks, prosecco, and venue rewards that incentivise guests to visit the bar and tag your venue on social media.
              </p>
            </div>
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 pt-4 border-t border-white/10">
              <TrendingUp className="w-3.5 h-3.5" /> Revenue & Bar Uplift
            </div>
          </div>
        </div>

        {/* Demo CTAs */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-[#14120c] via-zinc-900 to-[#14120c] border border-[#e5b842]/40 text-center space-y-4">
          <h2 className="font-serif text-2xl font-bold text-white">Experience SingShot In Action</h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Try the live staff dashboard or open the full-screen venue TV wall display to test the end-to-end Soho nightlife experience.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
            <a
              href="/admin"
              className="px-6 py-3 rounded-2xl bg-[#e5b842] text-black font-extrabold text-xs shadow-lg hover:bg-amber-400 transition-all flex items-center gap-2"
            >
              <span>OPEN STAFF DASHBOARD</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/wall"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-2xl bg-zinc-800 border border-white/20 text-white font-bold text-xs hover:bg-zinc-700 transition-all flex items-center gap-2"
            >
              <span>PREVIEW WALL TV SCREEN</span>
              <Tv className="w-4 h-4 text-[#e5b842]" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
