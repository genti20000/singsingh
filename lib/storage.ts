import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
export type Submission={id:string;media_key:string;media_type:'image'|'video';caption:string|null;share_consent:number;status:'pending'|'approved'|'rejected';created_at:string;approved_at:string|null;is_shared:number};
export type Env={DB:D1Database;MEDIA:R2Bucket};
export function env(){return getCloudflareContext().env as unknown as Env;}
export const allowed=new Set(['image/jpeg','image/png','image/webp','image/heic','video/mp4','video/webm','video/quicktime']);
export function typeFor(mime:string){return mime.startsWith('image/')?'image':'video';}
