import { Venue, EventSession, Reward, Submission, QRShape } from '../types';
import { INITIAL_VENUE, INITIAL_EVENTS, INITIAL_REWARDS, INITIAL_SUBMISSIONS } from '../data/initialData';

// Fallback high-res nightlife photo placeholders in case of CDN failures
export const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
];

const STORAGE_KEYS = {
  VENUE: 'singshot_venue_v1',
  EVENTS: 'singshot_events_v1',
  REWARDS: 'singshot_rewards_v1',
  SUBMISSIONS: 'singshot_submissions_v1',
};

// Create a BroadcastChannel for cross-tab realtime sync on static hosting (e.g. Vercel)
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('singshot_realtime_sync')
  : null;

export const broadcastSync = (type: string, data?: unknown) => {
  try {
    if (syncChannel) {
      syncChannel.postMessage({ type, data, timestamp: Date.now() });
    }
    // Also dispatch custom window event for same-tab reactivity
    window.dispatchEvent(new CustomEvent('singshot_sync', { detail: { type, data } }));
  } catch (err) {
    console.warn('Sync broadcast error:', err);
  }
};

export const subscribeToSync = (callback: (event: { type: string; data?: unknown }) => void) => {
  const handleBroadcast = (e: MessageEvent) => {
    if (e.data) callback(e.data);
  };
  const handleCustom = (e: Event) => {
    const ce = e as CustomEvent;
    if (ce.detail) callback(ce.detail);
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key && Object.values(STORAGE_KEYS).includes(e.key)) {
      callback({ type: 'STORAGE_CHANGE', data: { key: e.key } });
    }
  };

  if (syncChannel) syncChannel.addEventListener('message', handleBroadcast);
  window.addEventListener('singshot_sync', handleCustom);
  window.addEventListener('storage', handleStorage);

  return () => {
    if (syncChannel) syncChannel.removeEventListener('message', handleBroadcast);
    window.removeEventListener('singshot_sync', handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
};

// --- LocalStorage Helpers ---
function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item);
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage quota exceeded or unavailable:', e);
  }
}

// Seed initial data if empty
export function initLocalDatabase(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.VENUE)) {
    setLocal(STORAGE_KEYS.VENUE, INITIAL_VENUE);
  }
  if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) {
    setLocal(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.REWARDS)) {
    setLocal(STORAGE_KEYS.REWARDS, INITIAL_REWARDS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
    setLocal(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
  }
}

// Ensure initial database is ready
initLocalDatabase();

// --- DATA ACCESS LAYER (API with seamless LocalStorage fallback) ---

export const DataService = {
  // 1. Get Venue
  async getVenue(): Promise<Venue> {
    try {
      const res = await fetch('/api/venue');
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          setLocal(STORAGE_KEYS.VENUE, data);
          return data;
        }
      }
    } catch {
      // Backend not running (e.g. Vercel Static Hosting)
    }
    return getLocal<Venue>(STORAGE_KEYS.VENUE, INITIAL_VENUE);
  },

  // 2. Update Venue
  async updateVenue(patch: Partial<Venue>): Promise<Venue> {
    const current = getLocal<Venue>(STORAGE_KEYS.VENUE, INITIAL_VENUE);
    const updated = { ...current, ...patch };
    setLocal(STORAGE_KEYS.VENUE, updated);
    broadcastSync('VENUE_UPDATED', updated);

    try {
      const res = await fetch('/api/venue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const data = await res.json();
        setLocal(STORAGE_KEYS.VENUE, data);
        return data;
      }
    } catch {
      // Offline / static
    }
    return updated;
  },

  // 3. Get Submissions
  async getSubmissions(filters?: { status?: string; event_id?: string }): Promise<Submission[]> {
    let list: Submission[] = [];
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.event_id) params.append('event_id', filters.event_id);

      const url = `/api/submissions${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Sync with local
          setLocal(STORAGE_KEYS.SUBMISSIONS, data);
          return data;
        }
      }
    } catch {
      // API unavailable on Vercel static
    }

    // Fallback to local storage (which is always seeded with INITIAL_SUBMISSIONS)
    list = getLocal<Submission[]>(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);

    // If local was somehow wiped or empty, reseed with INITIAL_SUBMISSIONS
    if (!list || list.length === 0) {
      list = [...INITIAL_SUBMISSIONS];
      setLocal(STORAGE_KEYS.SUBMISSIONS, list);
    }

    if (filters?.event_id) {
      list = list.filter((s) => s.event_id === filters.event_id);
    }
    if (filters?.status) {
      list = list.filter((s) => s.status === filters.status);
    }

    // Sort newest first
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // 4. Create Submission
  async createSubmission(payload: {
    first_name?: string;
    caption?: string;
    image_url: string;
    original_image_url?: string;
    frame_style?: string;
    occasion: unknown;
    event_id?: string;
  }): Promise<Submission> {
    const venue = getLocal<Venue>(STORAGE_KEYS.VENUE, INITIAL_VENUE);
    const newSubmission: Submission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      venue_id: venue.id,
      event_id: payload.event_id || venue.active_event_id,
      first_name: payload.first_name?.trim() || 'VIP Guest',
      caption: payload.caption || '',
      image_url: payload.image_url,
      original_image_url: payload.original_image_url || payload.image_url,
      frame_style: (payload.frame_style as Submission['frame_style']) || 'neon-gold',
      occasion: payload.occasion as Submission['occasion'],
      status: venue.auto_approve ? 'approved' : 'pending',
      created_at: new Date().toISOString(),
      featured: false,
    };

    // Save locally first
    const list = getLocal<Submission[]>(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    const updatedList = [newSubmission, ...list];
    setLocal(STORAGE_KEYS.SUBMISSIONS, updatedList);
    broadcastSync('SUBMISSION_CREATED', newSubmission);

    // Try posting to API if available
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const serverCreated = await res.json();
        // Replace in local
        const merged = [serverCreated, ...list.filter((s) => s.id !== newSubmission.id)];
        setLocal(STORAGE_KEYS.SUBMISSIONS, merged);
        return serverCreated;
      }
    } catch {
      // Static / offline fallback
    }

    return newSubmission;
  },

  // 5. Update Submission (Status, Reward, etc.)
  async updateSubmission(id: string, patch: Partial<Submission>): Promise<Submission | null> {
    const list = getLocal<Submission[]>(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    let updatedItem: Submission | null = null;

    const updatedList = list.map((item) => {
      if (item.id === id) {
        updatedItem = { ...item, ...patch };
        return updatedItem;
      }
      return item;
    });

    if (updatedItem) {
      setLocal(STORAGE_KEYS.SUBMISSIONS, updatedList);
      broadcastSync('SUBMISSION_UPDATED', updatedItem);
    }

    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch {
      // Static / offline
    }

    return updatedItem;
  },

  // 6. Feature Submission Spotlight
  async featureSubmission(id: string): Promise<Submission | null> {
    const list = getLocal<Submission[]>(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    let featuredItem: Submission | null = null;

    const updatedList = list.map((item) => {
      if (item.id === id) {
        featuredItem = {
          ...item,
          featured: true,
          status: 'approved',
          featured_at: new Date().toISOString(),
        };
        return featuredItem;
      }
      // Unfeature other items
      return { ...item, featured: false };
    });

    setLocal(STORAGE_KEYS.SUBMISSIONS, updatedList);
    broadcastSync('SUBMISSION_FEATURED', featuredItem);

    try {
      const res = await fetch(`/api/submissions/${id}/feature`, { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Static / offline
    }

    return featuredItem;
  },

  // 7. Delete Submission
  async deleteSubmission(id: string): Promise<boolean> {
    const list = getLocal<Submission[]>(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    const updatedList = list.filter((s) => s.id !== id);
    setLocal(STORAGE_KEYS.SUBMISSIONS, updatedList);
    broadcastSync('SUBMISSION_DELETED', { id });

    try {
      await fetch(`/api/submissions/${id}`, { method: 'DELETE' });
    } catch {
      // Static / offline
    }

    return true;
  },

  // 8. Get Events
  async getEvents(): Promise<EventSession[]> {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setLocal(STORAGE_KEYS.EVENTS, data);
          return data;
        }
      }
    } catch {
      // Static / offline
    }
    return getLocal<EventSession[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
  },

  // 9. Create Event
  async createEvent(eventData: { title: string; event_type?: string; custom_notice?: string }): Promise<EventSession> {
    const venue = getLocal<Venue>(STORAGE_KEYS.VENUE, INITIAL_VENUE);
    const newEvent: EventSession = {
      id: `evt-${Date.now()}`,
      venue_id: venue.id,
      title: eventData.title,
      event_type: (eventData.event_type as EventSession['event_type']) || 'general',
      start_time: new Date().toISOString(),
      active: true,
      custom_notice: eventData.custom_notice,
    };

    const currentEvents = getLocal<EventSession[]>(STORAGE_KEYS.EVENTS, INITIAL_EVENTS);
    const updatedEvents = [newEvent, ...currentEvents.map((e) => ({ ...e, active: false }))];
    setLocal(STORAGE_KEYS.EVENTS, updatedEvents);

    // Update active event on venue
    await this.updateVenue({ active_event_id: newEvent.id });
    broadcastSync('EVENT_CREATED', newEvent);

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
    } catch {
      // Static / offline
    }

    return newEvent;
  },

  // 10. Get Rewards
  async getRewards(): Promise<Reward[]> {
    try {
      const res = await fetch('/api/rewards');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setLocal(STORAGE_KEYS.REWARDS, data);
          return data;
        }
      }
    } catch {
      // Static / offline
    }
    return getLocal<Reward[]>(STORAGE_KEYS.REWARDS, INITIAL_REWARDS);
  },
};
