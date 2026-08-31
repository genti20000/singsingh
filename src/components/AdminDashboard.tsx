import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Submission, EventSession, Reward, Venue, QRShape, WallLayoutMode } from '../types';
import { QR_SHAPES_CONFIG } from '../utils/qrShapes';
import { LondonKaraokeLogo } from './LondonKaraokeLogo';
import { DataService, subscribeToSync } from '../services/dataService';
import { INITIAL_EVENTS, INITIAL_REWARDS } from '../data/initialData';
import { removeBackground } from '../utils/removeBackground';
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
  Radio,
  BellRing,
  Square,
  LayoutGrid,
  Columns3,
  Columns2,
  GalleryHorizontal,
  MonitorPlay,
  Scissors,
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
  const [events, setEvents] = useState<EventSession[]>(() => INITIAL_EVENTS);
  const [rewards, setRewards] = useState<Reward[]>(() => INITIAL_REWARDS);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingCutoutId, setProcessingCutoutId] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [newSubmissionsAlert, setNewSubmissionsAlert] = useState<string | null>(null);
  const [currentLayoutMode, setCurrentLayoutMode] = useState<WallLayoutMode>(
    venue.wall_layout_mode || 'spotlight'
  );
  const prevCountRef = useRef<number>(0);

  const WALL_LAYOUT_OPTIONS: {
    id: WallLayoutMode;
    label: string;
    subLabel: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'spotlight', label: 'Spotlight', subLabel: 'Solo Hero', badge: '1 Photo', icon: Square },
    { id: 'quad', label: 'Quad', subLabel: '2x2 Grid', badge: '4 Photos', icon: LayoutGrid },
    { id: 'mosaic', label: 'Mosaic', subLabel: 'Masonry Wall', badge: '5 Photos', icon: Columns3 },
    { id: 'duet', label: 'Duet', subLabel: 'Side-by-Side', badge: '2 Photos', icon: Columns2 },
    { id: 'carousel', label: 'Carousel', subLabel: 'Flow Deck', badge: '3D Carousel', icon: GalleryHorizontal },
  ];

  // Keep current layout mode in sync with props
  useEffect(() => {
    if (venue.wall_layout_mode && venue.wall_layout_mode !== currentLayoutMode) {
      setCurrentLayoutMode(venue.wall_layout_mode);
    }
  }, [venue.wall_layout_mode, currentLayoutMode]);

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

  // Fetch initial data with silent background update support
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const [subsList, eventsList, rewardsList] = await Promise.all([
        DataService.getSubmissions(),
        DataService.getEvents(),
        DataService.getRewards(),
      ]);

      if (subsList) {
        // Detect newly arrived submissions for quick staff alert
        const currentPendingCount = subsList.filter((s) => s.status === 'pending').length;
        if (prevCountRef.current > 0 && currentPendingCount > prevCountRef.current) {
          const newest = subsList[0];
          setNewSubmissionsAlert(`New photo submitted by ${newest?.first_name || 'Guest'}!`);
          setTimeout(() => setNewSubmissionsAlert(null), 4000);
        }
        prevCountRef.current = currentPendingCount;
        setSubmissions(subsList);
      }
      if (eventsList) setEvents(eventsList);
      if (rewardsList) setRewards(rewardsList);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      if (isManual) {
        setTimeout(() => setIsRefreshing(false), 300);
      }
    }
  }, []);

  useEffect(() => {
    fetchData(true);

    // 1. High-frequency polling (every 2.5s) to guarantee automatic refresh without reload
    const interval = setInterval(() => {
      fetchData(false);
    }, 2500);

    // 2. Realtime Event-based subscription (BroadcastChannel + CustomEvents + StorageEvents)
    const unsubscribe = subscribeToSync((event) => {
      if (
        event.type === 'SUBMISSION_CREATED' ||
        event.type === 'SUBMISSION_UPDATED' ||
        event.type === 'SUBMISSION_DELETED' ||
        event.type === 'NEW_PHOTO_APPROVED' ||
        event.type === 'STORAGE_CHANGE'
      ) {
        fetchData(false);
      }
      if (event.type === 'VENUE_UPDATED' && (event.data as Venue)?.wall_layout_mode) {
        setCurrentLayoutMode((event.data as Venue).wall_layout_mode!);
      }
      if (event.type === 'WALL_LAYOUT_CHANGED' && (event.data as { mode?: WallLayoutMode })?.mode) {
        setCurrentLayoutMode((event.data as { mode: WallLayoutMode }).mode);
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [fetchData]);

  const handleSetLayoutMode = async (mode: WallLayoutMode) => {
    setCurrentLayoutMode(mode);
    try {
      await DataService.updateVenue({ wall_layout_mode: mode });
      onUpdateVenue({ wall_layout_mode: mode });
    } catch (err) {
      console.error('Failed to change wall layout mode:', err);
    }
  };

  // Staff Moderation Actions
  const handleApprove = async (id: string) => {
    try {
      await DataService.updateSubmission(id, { status: 'approved' });
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await DataService.updateSubmission(id, { status: 'rejected' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFeatureNow = async (id: string) => {
    try {
      await DataService.featureSubmission(id);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAttachReward = async (submissionId: string, rewardId: string) => {
    try {
      const selectedReward = rewards.find((r) => r.id === rewardId) || null;
      await DataService.updateSubmission(submissionId, {
        reward: selectedReward,
      });
      setShowRewardModal(null);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await DataService.deleteSubmission(id);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle) return;

    try {
      await DataService.createEvent({
        title: newEventTitle,
        custom_notice: newEventNotice,
      });
      setNewEventTitle('');
      setNewEventNotice('');
      setShowEventModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveVenueSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { wall_ticker_text: tickerText, auto_approve: autoApprove, qr_shape: qrShape };
    try {
      await DataService.updateVenue(updated);
      onUpdateVenue(updated);
      setShowSettingsModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveBg = async (item: Submission) => {
    setProcessingCutoutId(item.id);
    try {
      const cutoutUrl = await removeBackground(item.image_url, 'transparent');
      await DataService.updateSubmission(item.id, {
        image_url: cutoutUrl,
      });
      fetchData(false);
    } catch (err) {
      console.error('Failed to remove background:', err);
    } finally {
      setProcessingCutoutId(null);
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-950/90 border border-[#e5b842]/30 p-4 sm:p-6 rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-full overflow-hidden shadow-lg border border-[#e5b842]/50 shrink-0">
              <LondonKaraokeLogo className="w-12 h-12" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-[#e5b842] text-xs uppercase tracking-widest bg-[#e5b842]/15 px-3 py-0.5 rounded-full border border-[#e5b842]/40">
                  Staff Control Deck
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Realtime Sync</span>
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-black mt-1 text-white">
                Live Photo Moderation
              </h1>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowEventModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#e5b842]" /> Event Session
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-[#e5b842]" /> Venue Config
            </button>
            <a
              href="/wall"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#e5b842] text-black font-extrabold text-xs shadow-md hover:bg-amber-400 transition-colors cursor-pointer"
            >
              <Tv className="w-4 h-4" /> Open Wall Screen
            </a>
          </div>
        </div>

        {/* Wall Display Remote Layout Controls Bar */}
        <div className="bg-zinc-950/95 border border-[#e5b842]/40 p-4 sm:p-5 rounded-3xl shadow-[0_0_30px_rgba(229,184,66,0.15)] backdrop-blur-xl space-y-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-[#e5b842]/15 border border-[#e5b842]/50 flex items-center justify-center text-[#e5b842] shadow-md shrink-0">
                <MonitorPlay className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                    Wall Display Controls
                  </h2>
                  <span className="flex items-center gap-1 text-[10px] font-black text-[#e5b842] bg-[#e5b842]/20 border border-[#e5b842]/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e5b842] animate-ping" />
                    <span>Live Remote</span>
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Remotely switch the live screen layout mode across venue displays
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400 font-medium">Active on Screen:</span>
              <span className="bg-[#e5b842] text-black font-black px-3 py-1 rounded-xl text-xs uppercase tracking-wider shadow-md">
                {WALL_LAYOUT_OPTIONS.find((o) => o.id === currentLayoutMode)?.label || 'Spotlight'}
              </span>
            </div>
          </div>

          {/* Remote Mode Switcher Toggle Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {WALL_LAYOUT_OPTIONS.map((layout) => {
              const Icon = layout.icon;
              const isActive = currentLayoutMode === layout.id;
              return (
                <button
                  key={layout.id}
                  id={`admin-layout-${layout.id}`}
                  onClick={() => handleSetLayoutMode(layout.id)}
                  className={`relative p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5 group ${
                    isActive
                      ? 'bg-[#e5b842] text-black border-[#e5b842] shadow-[0_0_20px_rgba(229,184,66,0.35)] scale-[1.02] ring-2 ring-[#e5b842]/50'
                      : 'bg-zinc-900/90 text-zinc-300 border-white/10 hover:border-white/30 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`p-2 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-black text-[#e5b842]'
                          : 'bg-zinc-800 text-zinc-300 group-hover:text-white group-hover:bg-zinc-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {isActive ? (
                      <span className="flex items-center gap-1 bg-black text-[#e5b842] text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        <Check className="w-2.5 h-2.5 stroke-[3]" /> LIVE
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold text-zinc-500 group-hover:text-zinc-400 uppercase tracking-wider">
                        {layout.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className={`font-black text-sm leading-tight ${isActive ? 'text-black' : 'text-white'}`}>
                      {layout.label}
                    </div>
                    <div className={`text-[11px] font-medium leading-tight mt-0.5 ${isActive ? 'text-black/80' : 'text-zinc-400'}`}>
                      {layout.subLabel}
                    </div>
                  </div>
                </button>
              );
            })}
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

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[11px] text-zinc-500 font-medium">
              Auto-refreshing every 2.5s • Last sync: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Manual Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#e5b842]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live Toast Banner for New Submissions */}
        {newSubmissionsAlert && (
          <div className="flex items-center justify-between gap-3 bg-[#e5b842] text-black font-extrabold text-xs px-4 py-3 rounded-2xl shadow-xl shadow-[#e5b842]/20 animate-fade-slide-up">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 animate-bounce" />
              <span>{newSubmissionsAlert}</span>
            </div>
            <button
              onClick={() => setActiveTab('pending')}
              className="bg-black text-white px-3 py-1 rounded-xl text-[11px] font-bold hover:bg-zinc-800 transition-colors"
            >
              View Pending
            </button>
          </div>
        )}

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
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('photo-1507003211169')) {
                        target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80';
                      }
                    }}
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
                      {item.occasion?.type || 'Standard'} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                      onClick={() => handleRemoveBg(item)}
                      disabled={processingCutoutId === item.id}
                      className="flex items-center gap-1 bg-zinc-800 hover:bg-amber-400 hover:text-black text-amber-300 border border-amber-500/30 font-bold text-xs px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                      title="Remove background from this photo"
                    >
                      <Scissors className={`w-3.5 h-3.5 ${processingCutoutId === item.id ? 'animate-spin text-amber-400' : ''}`} />
                      <span>{processingCutoutId === item.id ? 'CUTTING...' : 'REMOVE BG'}</span>
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
