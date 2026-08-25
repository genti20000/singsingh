import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_VENUE, INITIAL_EVENTS, INITIAL_REWARDS } from './src/data/initialData';
import { Venue, EventSession, Reward, Submission, SubmissionStatus } from './src/types';

// In-Memory Database Store (persists for runtime lifecycle)
let venueStore: Venue = { ...INITIAL_VENUE };
let eventsStore: EventSession[] = [...INITIAL_EVENTS];
let rewardsStore: Reward[] = [...INITIAL_REWARDS];
let submissionsStore: Submission[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body parsing for image base64 payloads
  app.use(express.json({ limit: '20mb' }));

  // --- REST API ENDPOINTS ---

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get Venue details
  app.get('/api/venue', (_req, res) => {
    res.json(venueStore);
  });

  // Update Venue details
  app.put('/api/venue', (req, res) => {
    venueStore = { ...venueStore, ...req.body };
    res.json(venueStore);
  });

  // Get Events
  app.get('/api/events', (_req, res) => {
    res.json(eventsStore);
  });

  // Create or Activate Event
  app.post('/api/events', (req, res) => {
    const { title, event_type, custom_notice, active } = req.body;
    const newEvent: EventSession = {
      id: `evt-${Date.now()}`,
      venue_id: venueStore.id,
      title: title || 'Nightlife Event',
      event_type: event_type || 'general',
      start_time: new Date().toISOString(),
      active: active ?? true,
      custom_notice,
    };

    if (newEvent.active) {
      // Deactivate other events
      eventsStore = eventsStore.map((ev) => ({ ...ev, active: false }));
      venueStore.active_event_id = newEvent.id;
    }

    eventsStore.unshift(newEvent);
    res.json(newEvent);
  });

  // Get Rewards
  app.get('/api/rewards', (_req, res) => {
    res.json(rewardsStore.filter((r) => r.active));
  });

  // Create Reward
  app.post('/api/rewards', (req, res) => {
    const { title, description, badge } = req.body;
    const newReward: Reward = {
      id: `rew-${Date.now()}`,
      venue_id: venueStore.id,
      title,
      description,
      badge: badge || 'SPECIAL OFFER 🎁',
      active: true,
    };
    rewardsStore.push(newReward);
    res.json(newReward);
  });

  // Get Submissions (Guest & Wall & Admin view)
  app.get('/api/submissions', (req, res) => {
    const { status, event_id } = req.query;
    let list = [...submissionsStore];

    if (event_id) {
      list = list.filter((s) => s.event_id === event_id);
    }
    if (status && typeof status === 'string') {
      list = list.filter((s) => s.status === status);
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(list);
  });

  // Guest Submit New Selfie
  app.post('/api/submissions', (req, res) => {
    const { first_name, caption, image_url, original_image_url, frame_style, occasion, event_id } = req.body;

    if (!image_url || !occasion) {
      return res.status(400).json({ error: 'Photo and occasion are required.' });
    }

    const cleanFirstName = typeof first_name === 'string' && first_name.trim().length > 0
      ? first_name.trim()
      : 'VIP Guest';

    const newSub: Submission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      event_id: event_id || venueStore.active_event_id,
      venue_id: venueStore.id,
      first_name: cleanFirstName,
      caption: caption || '',
      image_url,
      original_image_url: original_image_url || image_url,
      frame_style: frame_style || occasion.frame_style || 'neon-gold',
      occasion,
      status: venueStore.auto_approve ? 'approved' : 'pending',
      created_at: new Date().toISOString(),
      featured: false,
    };

    submissionsStore.unshift(newSub);
    res.json(newSub);
  });

  // Staff Moderation Actions (Approve / Reject / Feature / Reward)
  app.patch('/api/submissions/:id', (req, res) => {
    const { id } = req.params;
    const { status, featured, reward_id, claimed } = req.body;

    const subIndex = submissionsStore.findIndex((s) => s.id === id);
    if (subIndex === -1) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const current = submissionsStore[subIndex];

    if (status) {
      current.status = status as SubmissionStatus;
    }

    if (typeof featured === 'boolean') {
      if (featured) {
        // Clear feature flag from others
        submissionsStore.forEach((s) => (s.featured = false));
        current.featured = true;
        current.featured_at = new Date().toISOString();
      } else {
        current.featured = false;
      }
    }

    if (reward_id) {
      const reward = rewardsStore.find((r) => r.id === reward_id);
      if (reward) {
        current.reward = { ...reward, code: `SS-${Math.floor(1000 + Math.random() * 9000)}` };
      }
    } else if (reward_id === null) {
      current.reward = null;
    }

    if (typeof claimed === 'boolean') {
      current.claimed = claimed;
    }

    submissionsStore[subIndex] = current;
    res.json(current);
  });

  // Delete submission
  app.delete('/api/submissions/:id', (req, res) => {
    const { id } = req.params;
    submissionsStore = submissionsStore.filter((s) => s.id !== id);
    res.json({ success: true, id });
  });

  // Feature Now Trigger for Screen Takeover
  app.post('/api/submissions/:id/feature', (req, res) => {
    const { id } = req.params;
    const sub = submissionsStore.find((s) => s.id === id);
    if (!sub) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Set all others to false, set this one to approved & featured
    submissionsStore.forEach((s) => {
      s.featured = false;
    });

    sub.status = 'approved';
    sub.featured = true;
    sub.featured_at = new Date().toISOString();

    res.json(sub);
  });

  // --- VITE MIDDLEWARE / STATIC FILE SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SingShot server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
