import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
export type Occasion='star'|'birthday'|'hen'|'corporate'|'fun';
export type Submission={id:string;venue_id:string;event_id:string;media_key:string;media_type:'image'|'video';first_name:string|null;caption:string|null;occasion_type:Occasion;occasion_label:string|null;occasion_detail:string|null;share_consent:number;status:'pending'|'approved'|'rejected';created_at:string;approved_at:string|null;featured:number;featured_at:string|null;reward_id:string|null;reward_title:string|null;is_shared:number};
export type Env={DB:D1Database;MEDIA:R2Bucket};
export function env(){return getCloudflareContext().env as unknown as Env;}
export const allowed=new Set(['image/jpeg','image/png','image/webp','image/heic','video/mp4','video/webm','video/quicktime']);
export function typeFor(mime:string){return mime.startsWith('image/')?'image':'video';}
