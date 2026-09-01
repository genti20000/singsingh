import React from 'react';
import { OccasionDetails, OccasionType } from '../../types';
import { Sparkles, PartyPopper, Heart, Building2, Smile, Check, ArrowLeft, ArrowRight } from 'lucide-react';

interface MomentSelectorProps {
  value: OccasionDetails;
  onChange: (details: OccasionDetails) => void;
  onNext: () => void;
  onBack: () => void;
}

export const MomentSelector: React.FC<MomentSelectorProps> = ({
  value,
  onChange,
  onNext,
  onBack,
}) => {
  const selectedType = value.type || 'star';

  const selectType = (type: OccasionType) => {
    onChange({ ...value, type });
  };

  const updateField = (field: keyof OccasionDetails, val: string) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="flex flex-col justify-between h-full max-h-full w-full max-w-md mx-auto p-3 sm:p-5 bg-zinc-950/95 border border-[#e5b842]/30 rounded-3xl backdrop-blur-2xl text-white shadow-[0_20px_50px_rgba(0,0,0,0.8)] select-none">
      {/* Header */}
      <div className="text-center shrink-0">
        <div className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-[#e5b842] uppercase tracking-widest bg-[#e5b842]/10 px-3 py-0.5 rounded-full border border-[#e5b842]/30">
          Step 2 of 3 • Occasion Theme
        </div>
        <h2 className="font-serif text-lg sm:text-2xl font-black mt-1 text-white tracking-tight">
          Choose Your Moment
        </h2>
        <p className="text-[11px] sm:text-xs text-zinc-400">
          How your photo and nameplate will appear on the big screen
        </p>
      </div>

      {/* Moment Style Option Cards Grid */}
      <div className="grid grid-cols-2 gap-2 my-auto">
        {/* 1. Star of the Night (Full Width top card) */}
        <button
          type="button"
          onClick={() => selectType('star')}
          className={`col-span-2 flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer group ${
            selectedType === 'star'
              ? 'border-[#e5b842] bg-gradient-to-r from-[#e5b842]/25 via-amber-500/15 to-transparent shadow-[0_0_20px_rgba(229,184,66,0.3)] ring-1 ring-[#e5b842]/40'
              : 'border-white/10 bg-zinc-900/60 hover:border-white/30 hover:bg-zinc-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffe066] to-[#d97706] text-black shadow-md">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-2">
                Star of the Night
                <span className="text-[8px] bg-[#e5b842] text-black font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  VIP CHOICE
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-zinc-300">
                Gold particle aura & Soho stage glow
              </div>
            </div>
          </div>
          {selectedType === 'star' && <Check className="w-5 h-5 text-[#e5b842] shrink-0 ml-2" />}
        </button>

        {/* 2. Birthday */}
        <button
          type="button"
          onClick={() => selectType('birthday')}
          className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left cursor-pointer ${
            selectedType === 'birthday'
              ? 'border-amber-400 bg-amber-400/20 shadow-[0_0_18px_rgba(251,191,36,0.3)] ring-1 ring-amber-400/50'
              : 'border-white/10 bg-zinc-900/60 hover:border-white/30 hover:bg-zinc-900'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-black shadow-md">
              <PartyPopper className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[11px] sm:text-xs text-white truncate">Birthday Bash</div>
              <div className="text-[9px] text-zinc-400 truncate">Confetti & cake badge</div>
            </div>
          </div>
          {selectedType === 'birthday' && <Check className="w-4 h-4 text-amber-400 shrink-0 ml-1" />}
        </button>

        {/* 3. Hen Party */}
        <button
          type="button"
          onClick={() => selectType('hen')}
          className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left cursor-pointer ${
            selectedType === 'hen'
              ? 'border-rose-400 bg-rose-400/20 shadow-[0_0_18px_rgba(244,63,94,0.3)] ring-1 ring-rose-400/50'
              : 'border-white/10 bg-zinc-900/60 hover:border-white/30 hover:bg-zinc-900'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-400 text-black shadow-md">
              <Heart className="w-4 h-4 fill-black" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[11px] sm:text-xs text-white truncate">Hen Squad</div>
              <div className="text-[9px] text-zinc-400 truncate">Rose gold crown</div>
            </div>
          </div>
          {selectedType === 'hen' && <Check className="w-4 h-4 text-rose-400 shrink-0 ml-1" />}
        </button>

        {/* 4. Corporate */}
        <button
          type="button"
          onClick={() => selectType('corporate')}
          className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left cursor-pointer ${
            selectedType === 'corporate'
              ? 'border-sky-400 bg-sky-400/20 shadow-[0_0_18px_rgba(56,189,248,0.3)] ring-1 ring-sky-400/50'
              : 'border-white/10 bg-zinc-900/60 hover:border-white/30 hover:bg-zinc-900'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-400 text-black shadow-md">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[11px] sm:text-xs text-white truncate">Team Night</div>
              <div className="text-[9px] text-zinc-400 truncate">Sapphire team crest</div>
            </div>
          </div>
          {selectedType === 'corporate' && <Check className="w-4 h-4 text-sky-400 shrink-0 ml-1" />}
        </button>

        {/* 5. Just for Fun */}
        <button
          type="button"
          onClick={() => selectType('fun')}
          className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left cursor-pointer ${
            selectedType === 'fun'
              ? 'border-purple-400 bg-purple-400/20 shadow-[0_0_18px_rgba(192,132,252,0.3)] ring-1 ring-purple-400/50'
              : 'border-white/10 bg-zinc-900/60 hover:border-white/30 hover:bg-zinc-900'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-400 text-black shadow-md">
              <Smile className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[11px] sm:text-xs text-white truncate">Nightlife Fun</div>
              <div className="text-[9px] text-zinc-400 truncate">Electric neon mood</div>
            </div>
          </div>
          {selectedType === 'fun' && <Check className="w-4 h-4 text-purple-400 shrink-0 ml-1" />}
        </button>
      </div>

      {/* Dynamic Contextual Inputs */}
      <div className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 flex flex-col gap-2 shrink-0">
        {selectedType === 'birthday' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-amber-300 block mb-0.5 uppercase tracking-wide">
                Birthday Person
              </label>
              <input
                type="text"
                value={value.birthdayName || ''}
                onChange={(e) => updateField('birthdayName', e.target.value)}
                placeholder="e.g. Sophie"
                className="w-full bg-zinc-950 border border-amber-400/40 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 block mb-0.5 uppercase tracking-wide">
                Age (Optional)
              </label>
              <input
                type="text"
                value={value.age || ''}
                onChange={(e) => updateField('age', e.target.value)}
                placeholder="e.g. 21, 30, 40"
                className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>
        )}

        {selectedType === 'hen' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-rose-300 block mb-0.5 uppercase tracking-wide">
                Bride's Name
              </label>
              <input
                type="text"
                value={value.brideName || ''}
                onChange={(e) => updateField('brideName', e.target.value)}
                placeholder="e.g. Jessica"
                className="w-full bg-zinc-950 border border-rose-400/40 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-rose-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 block mb-0.5 uppercase tracking-wide">
                Hen Badge
              </label>
              <select
                value={value.henSubtext || 'BRIDE TO BE'}
                onChange={(e) => updateField('henSubtext', e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-rose-400"
              >
                <option value="BRIDE TO BE">BRIDE TO BE 👑</option>
                <option value="TEAM BRIDE">TEAM BRIDE 🥂</option>
                <option value="HEN NIGHT">HEN NIGHT ✨</option>
              </select>
            </div>
          </div>
        )}

        {selectedType === 'corporate' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-sky-300 block mb-0.5 uppercase tracking-wide">
                Company / Team
              </label>
              <input
                type="text"
                value={value.companyName || ''}
                onChange={(e) => updateField('companyName', e.target.value)}
                placeholder="e.g. Google"
                className="w-full bg-zinc-950 border border-sky-400/40 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-sky-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 block mb-0.5 uppercase tracking-wide">
                Event (Optional)
              </label>
              <input
                type="text"
                value={value.eventName || ''}
                onChange={(e) => updateField('eventName', e.target.value)}
                placeholder="e.g. Soho Social"
                className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-sky-400 transition-colors"
              />
            </div>
          </div>
        )}

        {selectedType === 'star' && (
          <p className="text-[11px] text-[#e5b842] font-medium text-center leading-snug">
            ⭐ SingShot VIP Gold frame with luxury particle aura and stage spotlight!
          </p>
        )}

        {selectedType === 'fun' && (
          <p className="text-[11px] text-purple-300 font-medium text-center leading-snug">
            ✨ Electric nightclub styling with glowing neon accents for group selfies!
          </p>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-2.5 pt-1 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] px-4 py-2 rounded-2xl bg-zinc-900 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 min-h-[44px] py-2.5 px-5 rounded-2xl bg-gradient-to-r from-[#ffe066] via-[#f59e0b] to-[#d97706] text-black font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(229,184,66,0.35)] hover:brightness-110 active:scale-[0.98] transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>CONTINUE TO DETAILS</span>
          <ArrowRight className="w-4 h-4 text-black stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
