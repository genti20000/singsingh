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

// SSE connected clients
const sseClients = new Set<express.Response>();

function notifySSE(type: string, data?: unknown) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Heartbeat ping to keep SSE connections healthy
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': ping\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 15000);

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

  // Real-time Server-Sent Events (SSE) Stream for WallDisplay & Admin background auto-refresh
  app.get(['/api/wall/stream', '/api/stream'], (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Get Venue details
  app.get('/api/venue', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(venueStore);
  });

  // Update Venue details
  app.put('/api/venue', (req, res) => {
    venueStore = { ...venueStore, ...req.body };
    notifySSE('VENUE_UPDATED', venueStore);
    res.json(venueStore);
  });

  // Get Events
  app.get('/api/events', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
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
    notifySSE('EVENT_CREATED', newEvent);
    res.json(newEvent);
  });

  // Get Rewards
  app.get('/api/rewards', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
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
    notifySSE('REWARD_CREATED', newReward);
    res.json(newReward);
  });

  // Get Submissions (Guest & Wall & Admin view)
  app.get('/api/submissions', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

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
    notifySSE('SUBMISSION_CREATED', newSub);
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
    notifySSE('SUBMISSION_UPDATED', current);
    res.json(current);
  });

  // Delete submission
  app.delete('/api/submissions/:id', (req, res) => {
    const { id } = req.params;
    submissionsStore = submissionsStore.filter((s) => s.id !== id);
    notifySSE('SUBMISSION_DELETED', { id });
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

    notifySSE('SUBMISSION_FEATURED', sub);
    res.json(sub);
  });

  // AI & Smart Background Removal API Endpoint
  app.post('/api/remove-bg', async (req, res) => {
    try {
      const { image, style } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'Image is required' });
      }

      // Check if GEMINI_API_KEY is available for high-fidelity AI segmentation
      if (process.env.GEMINI_API_KEY) {
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          
          let base64Data = image;
          let mimeType = 'image/jpeg';
          if (image.startsWith('data:')) {
            const parts = image.split(',');
            const match = parts[0].match(/:(.*?);/);
            if (match) mimeType = match[1];
            base64Data = parts[1];
          }

          const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite-image',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: 'Extract the person/subject cleanly as a cutout on a pure transparent background. Remove all room walls, backgrounds, and clutter completely, keeping only the singer/person.',
                  },
                  {
                    inlineData: {
                      mimeType: mimeType || 'image/jpeg',
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
          });

          // Check if image candidate was returned
          const candidatePart = response.candidates?.[0]?.content?.parts?.find(
            (p: any) => p.inlineData?.data
          );
          if (candidatePart?.inlineData?.data) {
            const outMime = candidatePart.inlineData.mimeType || 'image/png';
            const outUrl = `data:${outMime};base64,${candidatePart.inlineData.data}`;
            return res.json({ success: true, image_url: outUrl, mode: 'gemini-ai' });
          }
        } catch (aiErr) {
          console.warn('Gemini AI background removal fallback to client engine:', aiErr);
        }
      }

      // Fallback: indicate client-side canvas segmentation should run
      return res.json({ success: false, fallbackToClient: true });
    } catch (err: any) {
      console.error('Background removal error:', err);
      res.status(500).json({ error: err.message || 'Background removal failed' });
    }
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
