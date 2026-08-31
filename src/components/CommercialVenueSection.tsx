import React from 'react';
import { Camera, Sparkles, Gift, TrendingUp, Tv, ChevronLeft, ArrowRight, Flame, Zap, Trophy, ShieldCheck } from 'lucide-react';
import { LondonKaraokeLogo } from './LondonKaraokeLogo';

interface CommercialVenueSectionProps {
  onBackToGuest: () => void;
}

export const CommercialVenueSection: React.FC<CommercialVenueSectionProps> = ({ onBackToGuest }) => {
  return (
    <div className="min-h-screen bg-[#070707] text-white p-6 sm:p-12 selection:bg-[#e5b842] selection:text-black">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Navigation back */}
        <button
          onClick={onBackToGuest}
          className="flex items-center gap-2 text-xs font-black text-zinc-400 hover:text-[#e5b842] transition-colors uppercase tracking-wider cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-[#e5b842]" /> Back to Guest Selfie Experience
        </button>

        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#e5b842]/10 border border-[#e5b842]/30 shadow-[0_0_20px_rgba(229,184,66,0.15)]">
            <div className="w-5 h-5">
              <LondonKaraokeLogo className="w-5 h-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#e5b842]">
              For Nightclub & Karaoke Venue Operators
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-6xl font-black text-white leading-tight drop-shadow-lg">
            Turn guest selfies into <br />
            <span className="bg-gradient-to-r from-[#fed21c] via-[#f7be0b] to-[#dfa705] bg-clip-text text-transparent">
              viral live entertainment.
            </span>
          </h1>
          <p className="text-zinc-300 text-base sm:text-lg leading-relaxed font-normal">
            SingShot turns ordinary customer phone snaps into branded high-fashion TV moments with live newsflash tickers, celebratory countdowns, and bar incentive rewards.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-7 rounded-3xl bg-zinc-950/90 border border-white/10 hover:border-[#e5b842]/50 transition-all flex flex-col justify-between space-y-5 shadow-2xl group">
            <div className="space-y-3.5">
              <div className="h-12 w-12 rounded-2xl bg-[#e5b842]/15 border border-[#e5b842]/40 text-[#e5b842] flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-black text-xl text-white">Instant Selfie to Screen</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Guests scan the dynamic QR code on venue screens, snap a selfie in their mobile browser, and broadcast live to televisions in seconds with zero apps.
              </p>
            </div>
            <div className="text-[11px] font-black text-[#e5b842] uppercase tracking-wider flex items-center gap-1.5 pt-4 border-t border-white/10">
              <Tv className="w-4 h-4 text-[#e5b842]" />
              <span>Real-Time Screen Takeover</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-7 rounded-3xl bg-zinc-950/90 border border-white/10 hover:border-amber-400/50 transition-all flex flex-col justify-between space-y-5 shadow-2xl group">
            <div className="space-y-3.5">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-black text-xl text-white">News Flash & VIP Frames</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Automated broadcast overlays with headline tickers, Star of the Night awards, Birthday celebrations, Hen Party squads, and animated gold particles.
              </p>
            </div>
            <div className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 pt-4 border-t border-white/10">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Luxury Nightlife Aesthetics</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-7 rounded-3xl bg-zinc-950/90 border border-white/10 hover:border-emerald-400/50 transition-all flex flex-col justify-between space-y-5 shadow-2xl group">
            <div className="space-y-3.5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-black text-xl text-white">Bar Spend & Social Upsell</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Attach digital drink tokens, free shots, and VIP discounts to featured photos, incentivizing guests to order at the bar and tag your venue on Instagram.
              </p>
            </div>
            <div className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 pt-4 border-t border-white/10">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Proven Bar Revenue Uplift</span>
            </div>
          </div>
        </div>

        {/* Demo CTAs Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-zinc-950 via-[#18140a] to-zinc-950 border border-[#e5b842]/40 text-center space-y-5 shadow-[0_0_40px_rgba(229,184,66,0.15)]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e5b842]/15 text-[#e5b842] text-xs font-black uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5 fill-[#e5b842]" />
            <span>Try The Live Interactive Suite</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-4xl font-black text-white">Experience SingShot In Action</h2>
          <p className="text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
            Open the real-time staff moderation dashboard to approve live guest photos or launch the full-screen venue TV wall.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap pt-3">
            <button
              onClick={onBackToGuest}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#fed21c] via-[#f7be0b] to-[#dfa705] text-black font-black text-xs sm:text-sm shadow-xl hover:scale-102 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>OPEN GUEST SELFIE FLOW</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
