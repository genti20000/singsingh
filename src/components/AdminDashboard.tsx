import React, { useEffect, useState } from 'react';
import { Submission, EventSession, Reward, Venue, QRShape } from '../types';
import { QR_SHAPES_CONFIG } from '../utils/qrShapes';
import {
  Check,
  X,
  Sparkles,
  Gift,
  Trash2,
  Calendar,
  Settings,
  RefreshCw,
  Plus,
  Tv,
  CheckCircle2,
  Shapes,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdminDashboardProps {
  venue: Venue;
  onUpdateVenue: (updated: Partial<Venue>) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  venue,
  onUpdateVenue,
}) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [events, setEvents] = useState<EventSession[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState<Submission | null>(null);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventNotice, setNewEventNotice] = useState('');

  // Venue Settings Form State
  const [tickerText, setTickerText] = useState(venue.wall_ticker_text);
  const [autoApprove, setAutoApprove] = useState(!!venue.auto_approve);
  const [qrShape, setQrShape] = useState<QRShape>(venue.qr_shape || 'squircle');

  // Fetch initial data
  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [subRes, evtRes, rewRes] = await Promise.all([
        fetch('/api/submissions'),
        fetch('/api/events'),
        fetch('/api/rewards'),
      ]);

      if (subRes.ok) setSubmissions(await subRes.json());
      if (evtRes.ok) setEvents(await evtRes.json());
      if (rewRes.ok) setRewards(await rewRes.json());
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Staff Moderation Actions
  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      if (res.ok) {
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await fetch(`/api/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFeatureNow = async (id: string) => {
    try {
      await fetch(`/api/submissions/${id}/feature`, {
        method: 'POST',
      });
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAttachReward = async (submissionId: string, rewardId: string) => {
    try {
      await fetch(`/api/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reward_id: rewardId }),
      });
      setShowRewardModal(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/submissions/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle) return;

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEventTitle,
          custom_notice: newEventNotice,
          active: true,
        }),
      });
      if (res.ok) {
        setNewEventTitle('');
        setNewEventNotice('');
        setShowEventModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveVenueSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { wall_ticker_text: tickerText, auto_approve: autoApprove, qr_shape: qrShape };
    try {
      await fetch('/api/venue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      onUpdateVenue(updated);
      setShowSettingsModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered List
  const pendingList = submissions.filter((s) => s.status === 'pending');
  const approvedList = submissions.filter((s) => s.status === 'approved');

  const displayedList =
    activeTab === 'pending'
      ? pendingList
      : activeTab === 'approved'
      ? approvedList
      : submissions;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6 pb-20 select-none">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/90 border border-white/10 p-4 sm:p-5 rounded-3xl shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#e5b842] text-sm uppercase tracking-widest bg-[#e5b842]/10 px-3 py-1 rounded-full border border-[#e5b842]/30">
                Staff Dashboard
              </span>
              <span className="text-xs text-zinc-400">London Karaoke Club</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-1 text-white">
              Moderation Queue
            </h1>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowEventModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-700 transition-colors"
            >
              <Calendar className="w-4 h-4 text-[#e5b842]" /> Event Session
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-700 transition-colors"
            >
              <Settings className="w-4 h-4 text-[#e5b842]" /> Venue Config
            </button>
            <a
              href="/wall"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#e5b842] text-black font-extrabold text-xs shadow-md hover:bg-amber-400 transition-colors"
            >
              <Tv className="w-4 h-4" /> Open Wall Screen
            </a>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-900/80 border border-amber-500/30 p-4 rounded-2xl flex flex-col">
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
              Pending Approval
            </span>
            <span className="font-serif text-3xl font-extrabold text-white mt-1">
              {pendingList.length}
            </span>
          </div>

          <div className="bg-zinc-900/80 border border-emerald-500/30 p-4 rounded-2xl flex flex-col">
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
              Live On Screen
            </span>
            <span className="font-serif text-3xl font-extrabold text-white mt-1">
              {approvedList.length}
            </span>
          </div>

          <div className="bg-zinc-900/80 border border-sky-500/30 p-4 rounded-2xl flex flex-col">
            <span className="text-xs text-sky-400 font-bold uppercase tracking-wider">
              Active Event
            </span>
            <span className="text-sm font-bold text-white truncate mt-1">
              {events.find((e) => e.active)?.title || 'Friday Night'}
            </span>
          </div>

          <div className="bg-zinc-900/80 border border-purple-500/30 p-4 rounded-2xl flex flex-col">
            <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">
              Rewards Issued
            </span>
            <span className="font-serif text-3xl font-extrabold text-white mt-1">
              {submissions.filter((s) => s.reward).length}
            </span>
          </div>
        </div>

        {/* Queue Filter Tabs & Refresh */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'pending'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              PENDING ({pendingList.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'approved'
                  ? 'bg-[#e5b842] text-black shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              APPROVED / ON WALL ({approvedList.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-zinc-800 text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              ALL ({submissions.length})
            </button>
          </div>

          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#e5b842]' : ''}`} />
          </button>
        </div>

        {/* Submissions List Grid */}
        {displayedList.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/40 rounded-3xl border border-white/10">
            <p className="text-sm text-zinc-400">No submissions found in this view.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedList.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col sm:flex-row gap-4 p-4 rounded-3xl border bg-zinc-900/80 transition-all ${
                  item.featured
                    ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                    : item.status === 'approved'
                    ? 'border-emerald-500/40'
                    : 'border-white/10'
                }`}
              >
                {/* Photo Thumbnail */}
                <div className="relative h-48 sm:h-36 sm:w-32 rounded-2xl overflow-hidden bg-black flex-shrink-0">
                  <img
                    src={item.image_url}
                    alt={item.first_name}
                    className="h-full w-full object-cover"
                  />
                  {item.featured && (
                    <div className="absolute top-2 left-2 bg-amber-400 text-black text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                      SPOTLIGHT
                    </div>
                  )}
                </div>

                {/* Sub details */}
                <div className="flex-1 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-white">{item.first_name}</h3>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          item.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : item.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="text-xs text-[#e5b842] font-semibold mt-0.5 uppercase tracking-wide">
                      {item.occasion.type} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {item.caption && (
                      <p className="text-xs text-zinc-300 italic mt-1 line-clamp-2">
                        “{item.caption}”
                      </p>
                    )}

                    {item.reward && (
                      <div className="mt-2 text-[11px] bg-amber-500/10 border border-amber-500/30 text-amber-300 p-1.5 rounded-lg font-semibold flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5" /> Reward: {item.reward.badge}
                      </div>
                    )}
                  </div>

                  {/* Staff Moderation Action Controls */}
                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/10">
                    {item.status !== 'approved' && (
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs px-3 py-2 rounded-xl transition-colors"
                      >
                        <Check className="w-4 h-4" /> APPROVE
                      </button>
                    )}

                    <button
                      onClick={() => handleFeatureNow(item.id)}
                      className="flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs px-3 py-2 rounded-xl transition-colors shadow-md"
                      title="Trigger full screen takeover on wall"
                    >
                      <Sparkles className="w-4 h-4" /> FEATURE NOW
                    </button>

                    <button
                      onClick={() => setShowRewardModal(item)}
                      className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3 py-2 rounded-xl transition-colors"
                    >
                      <Gift className="w-4 h-4" /> REWARD
                    </button>

                    {item.status !== 'rejected' && (
                      <button
                        onClick={() => handleReject(item.id)}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 rounded-xl transition-colors"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-500 rounded-xl transition-colors ml-auto"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attach Reward Modal */}
      {showRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-purple-500/40 p-6 rounded-3xl max-w-md w-full text-white shadow-2xl space-y-4">
            <h3 className="font-serif text-xl font-bold flex items-center gap-2 text-purple-300">
              <Gift className="w-5 h-5 text-purple-400" /> Attach Reward to {showRewardModal.first_name}
            </h3>
            <p className="text-xs text-zinc-400">
              Select a venue perk to reward this guest on screen and on their phone confirmation.
            </p>

            <div className="space-y-2">
              {rewards.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleAttachReward(showRewardModal.id, r.id)}
                  className="w-full text-left p-3 rounded-2xl bg-zinc-900 border border-white/10 hover:border-purple-400 hover:bg-purple-900/20 transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-sm text-white">{r.title}</div>
                    <div className="text-xs text-zinc-400">{r.description}</div>
                  </div>
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full font-bold">
                    {r.badge}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowRewardModal(null)}
              className="w-full py-2.5 bg-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Event Session Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-[#e5b842]/40 p-6 rounded-3xl max-w-md w-full text-white shadow-2xl space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#e5b842] flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Event Sessions
            </h3>

            {/* List existing */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between ${
                    evt.active ? 'border-[#e5b842] bg-[#e5b842]/10' : 'border-white/10 bg-zinc-900'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-white">{evt.title}</div>
                    {evt.custom_notice && (
                      <div className="text-xs text-zinc-400">{evt.custom_notice}</div>
                    )}
                  </div>
                  {evt.active && (
                    <span className="text-[10px] bg-[#e5b842] text-black font-extrabold px-2 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Create new event */}
            <form onSubmit={handleCreateEvent} className="pt-2 border-t border-white/10 space-y-3">
              <div className="text-xs font-bold text-[#e5b842]">Create New Event Session</div>
              <input
                type="text"
                required
                placeholder="e.g. Saturday Soho Night"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                className="w-full bg-zinc-900 border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#e5b842]"
              />
              <input
                type="text"
                placeholder="Optional Notice e.g. VIP Room 2"
                value={newEventNotice}
                onChange={(e) => setNewEventNotice(e.target.value)}
                className="w-full bg-zinc-900 border border-white/20 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#e5b842]"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-[#e5b842] text-black font-extrabold rounded-xl text-xs hover:bg-amber-400 flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> START EVENT SESSION
              </button>
            </form>

            <button
              onClick={() => setShowEventModal(false)}
              className="w-full py-2 bg-zinc-800 rounded-xl text-xs text-zinc-400 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Venue Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveVenueSettings}
            className="bg-zinc-950 border border-white/20 p-6 rounded-3xl max-w-md w-full text-white shadow-2xl space-y-4"
          >
            <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#e5b842]" /> Venue Configuration
            </h3>

            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">
                Bottom Ticker Message
              </label>
              <textarea
                rows={3}
                value={tickerText}
                onChange={(e) => setTickerText(e.target.value)}
                className="w-full bg-zinc-900 border border-white/20 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#e5b842]"
              />
            </div>

            {/* QR Code Shape Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Shapes className="w-3.5 h-3.5 text-[#e5b842]" /> Wall Screen QR Code Shape
                </label>
                <span className="text-[10px] text-[#e5b842] font-semibold uppercase">
                  {QR_SHAPES_CONFIG[qrShape]?.name || 'Squircle'}
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {(['squircle', 'circle', 'hexagon', 'square', 'diamond', 'shield', 'star'] as QRShape[]).map((shapeKey) => {
                  const cfg = QR_SHAPES_CONFIG[shapeKey];
                  const isSelected = qrShape === shapeKey;
                  return (
                    <button
                      key={shapeKey}
                      type="button"
                      onClick={() => setQrShape(shapeKey)}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-[#e5b842] text-black border-[#e5b842] font-extrabold shadow-md scale-102'
                          : 'bg-zinc-900 text-zinc-300 border-white/10 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      <span className="text-sm">{cfg.badge.split(' ')[0]}</span>
                      <span className="text-[10px] leading-tight truncate w-full">{cfg.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900 border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="h-4 w-4 accent-[#e5b842]"
              />
              <div>
                <div className="font-bold text-xs text-white">Auto-Approve Submissions</div>
                <div className="text-[10px] text-zinc-400">
                  Directly send guest photos to screen without manual staff approval
                </div>
              </div>
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="flex-1 py-2.5 bg-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#e5b842] text-black font-extrabold rounded-xl text-xs hover:bg-amber-400"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
