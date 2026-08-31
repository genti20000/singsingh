export type OccasionType = 'star' | 'birthday' | 'hen' | 'corporate' | 'fun';

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export type QRShape = 'square' | 'circle' | 'squircle' | 'hexagon' | 'diamond' | 'shield' | 'star';

export type FrameStyleId =
  | 'none'
  | 'neon-gold'
  | 'neon-pink'
  | 'cyber-cyan'
  | 'electric-violet'
  | 'polaroid'
  | 'champagne'
  | 'party-neon'
  | 'love-hearts';

export interface Reward {
  id: string;
  venue_id: string;
  title: string;
  description: string;
  badge: string;
  active: boolean;
  code?: string;
}

export interface OccasionDetails {
  type: OccasionType;
  birthdayName?: string;
  age?: string;
  brideName?: string;
  henSubtext?: string; // e.g. "BRIDE TO BE", "TEAM SOPHIE", "SOPHIE'S HEN NIGHT"
  companyName?: string;
  eventName?: string;
  customCaption?: string;
  frame_style?: FrameStyleId;
}

export interface Submission {
  id: string;
  event_id: string;
  venue_id: string;
  first_name: string;
  caption?: string;
  image_url: string; // Base64 data URL or photo path
  original_image_url?: string; // Untouched raw photo
  filter_preset?: 'original' | 'glow' | 'glam' | 'studio';
  frame_style?: FrameStyleId;
  occasion: OccasionDetails;
  status: SubmissionStatus;
  created_at: string;
  featured?: boolean;
  featured_at?: string;
  reward?: Reward | null;
  claimed?: boolean;
}

export type WallLayoutMode = 'spotlight' | 'quad' | 'mosaic' | 'duet' | 'carousel';

export interface Venue {
  id: string;
  name: string;
  sub_name: string; // e.g. "Soho, London"
  logo_url?: string;
  primary_color: string;
  accent_color: string;
  qr_code_url?: string;
  active_event_id: string;
  wall_ticker_text: string;
  auto_approve?: boolean;
  qr_shape?: QRShape;
  wall_layout_mode?: WallLayoutMode;
}

export interface EventSession {
  id: string;
  venue_id: string;
  title: string;
  event_type: 'general' | 'birthday' | 'corporate' | 'hen' | 'special';
  start_time: string;
  end_time?: string;
  active: boolean;
  custom_notice?: string;
}
