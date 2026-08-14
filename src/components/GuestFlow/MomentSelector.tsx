import React from 'react';
import { OccasionDetails, OccasionType } from '../../types';
import { Sparkles, PartyPopper, Heart, Building2, Smile, Check } from 'lucide-react';

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
    <div className="flex flex-col gap-5 w-full max-w-md mx-auto p-4 sm:p-6 bg-zinc-950/80 border border-[#e5b842]/30 rounded-3xl backdrop-blur-xl text-white shadow-2xl">
      <div className="text-center">
        <span className="text-[10px] font-bold text-[#e5b842] uppercase tracking-widest bg-[#e5b842]/10 px-3 py-1 rounded-full border border-[#e5b842]/30">
          Step 2 of 3
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold mt-2 text-white">
          Choose Your Moment
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Select how your photo will be styled on venue screens
        </p>
      </div>

      {/* Moment Style Option Cards */}
      <div className="grid grid-cols-1 gap-2.5">
        {/* 1. Star of the Night */}
        <button
          type="button"
          onClick={() => selectType('star')}
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
            selectedType === 'star'
              ? 'border-[#e5b842] bg-gradient-to-r from-[#e5b842]/20 to-amber-500/10 shadow-[0_0_20px_rgba(229,184,66,0.2)]'
              : 'border-white/10 bg-zinc-900/60 hover:border-white/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5b842] text-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                Star of the Night
                <span className="text-[9px] bg-[#e5b842] text-black font-extrabold px-2 py-0.5 rounded-full uppercase">
                  DEFAULT
                </span>
              </div>
              <div className="text-xs text-zinc-400">
                Premium VIP frame with animated gold particle glow
              </div>
            </div>
          </div>
          {selectedType === 'star' && <Check className="w-5 h-5 text-[#e5b842]" />}
        </button>

        {/* 2. Birthday */}
        <button
          type="button"
          onClick={() => selectType('birthday')}
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
            selectedType === 'birthday'
              ? 'border-amber-400 bg-gradient-to-r from-amber-400/20 to-yellow-500/10 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
              : 'border-white/10 bg-zinc-900/60 hover:border-white/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-black">
              <PartyPopper className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">Birthday Celebration</div>
              <div className="text-xs text-zinc-400">Confetti animation & birthday messaging</div>
            </div>
          </div>
          {selectedType === 'birthday' && <Check className="w-5 h-5 text-amber-400" />}
        </button>

        {/* 3. Hen Party */}
        <button
          type="button"
          onClick={() => selectType('hen')}
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
            selectedType === 'hen'
              ? 'border-rose-400 bg-gradient-to-r from-rose-400/20 to-pink-500/10 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
              : 'border-white/10 bg-zinc-900/60 hover:border-white/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-400 text-black">
              <Heart className="w-5 h-5 fill-black" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">Hen Party / Bride Squad</div>
              <div className="text-xs text-zinc-400">Rose gold champagne & celebratory typography</div>
            </div>
          </div>
          {selectedType === 'hen' && <Check className="w-5 h-5 text-rose-400" />}
        </button>

        {/* 4. Corporate / Team Night */}
        <button
          type="button"
          onClick={() => selectType('corporate')}
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
            selectedType === 'corporate'
              ? 'border-sky-400 bg-gradient-to-r from-sky-400/20 to-blue-500/10 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
              : 'border-white/10 bg-zinc-900/60 hover:border-white/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400 text-black">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">Corporate / Team Night</div>
              <div className="text-xs text-zinc-400">Executive midnight sapphire branding frame</div>
            </div>
          </div>
          {selectedType === 'corporate' && <Check className="w-5 h-5 text-sky-400" />}
        </button>

        {/* 5. Just for Fun */}
        <button
          type="button"
          onClick={() => selectType('fun')}
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
            selectedType === 'fun'
              ? 'border-purple-400 bg-gradient-to-r from-purple-400/20 to-fuchsia-500/10 shadow-[0_0_20px_rgba(192,132,252,0.2)]'
              : 'border-white/10 bg-zinc-900/60 hover:border-white/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-400 text-black">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">Just for Fun</div>
              <div className="text-xs text-zinc-400">Nightlife frame with custom caption quote</div>
            </div>
          </div>
          {selectedType === 'fun' && <Check className="w-5 h-5 text-purple-400" />}
        </button>
      </div>

      {/* Dynamic Conditional Fields depending on selection */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 flex flex-col gap-3">
        {selectedType === 'birthday' && (
          <>
            <div>
              <label className="text-xs font-semibold text-amber-300 block mb-1">
                Birthday Person's Name (Optional)
              </label>
              <input
                type="text"
                value={value.birthdayName || ''}
                onChange={(e) => updateField('birthdayName', e.target.value)}
                placeholder="e.g. Sophie"
                className="w-full bg-zinc-950 border border-amber-400/40 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">
                Age (Optional)
              </label>
              <input
                type="text"
                value={value.age || ''}
                onChange={(e) => updateField('age', e.target.value)}
                placeholder="e.g. 21, 30, 40"
                className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </>
        )}

        {selectedType === 'hen' && (
          <>
            <div>
              <label className="text-xs font-semibold text-rose-300 block mb-1">
                Bride's Name (Optional)
              </label>
              <input
                type="text"
                value={value.brideName || ''}
                onChange={(e) => updateField('brideName', e.target.value)}
                placeholder="e.g. Sophie"
                className="w-full bg-zinc-950 border border-rose-400/40 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-rose-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">
                Preset Hen Title
              </label>
              <select
                value={value.henSubtext || 'BRIDE TO BE'}
                onChange={(e) => updateField('henSubtext', e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-rose-400"
              >
                <option value="BRIDE TO BE">BRIDE TO BE 👑</option>
                <option value="TEAM BRIDE">TEAM BRIDE 🥂</option>
                <option value="HEN NIGHT CELEBRATION">HEN NIGHT CELEBRATION 🍾</option>
              </select>
            </div>
          </>
        )}

        {selectedType === 'corporate' && (
          <>
            <div>
              <label className="text-xs font-semibold text-sky-300 block mb-1">
                Company or Team Name (Optional)
              </label>
              <input
                type="text"
                value={value.companyName || ''}
                onChange={(e) => updateField('companyName', e.target.value)}
                placeholder="e.g. Team Google"
                className="w-full bg-zinc-950 border border-sky-400/40 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">
                Event Name (Optional)
              </label>
              <input
                type="text"
                value={value.eventName || ''}
                onChange={(e) => updateField('eventName', e.target.value)}
                placeholder="e.g. Summer Party 2026"
                className="w-full bg-zinc-950 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-sky-400"
              />
            </div>
          </>
        )}

        {selectedType === 'star' && (
          <p className="text-xs text-[#e5b842] italic">
            ⭐ The classic SingShot VIP experience. Your selfie will shine as Star of the Night with animated gold particle effects!
          </p>
        )}

        {selectedType === 'fun' && (
          <p className="text-xs text-purple-300 italic">
            ✨ Perfect for fun group selfies and nightlife moments!
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-[#e5b842] to-amber-500 text-black font-bold text-sm shadow-lg hover:brightness-110 transition-all text-center"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
