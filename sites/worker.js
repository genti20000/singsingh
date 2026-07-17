const MIME=new Set(['image/jpeg','image/png','image/webp','image/heic','video/mp4','video/webm','video/quicktime']);
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const fail=(message,status=500)=>json({error:message},status);
let schemaReady;
const ensureSchema=env=>schemaReady??=(async()=>{await env.DB.prepare("CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY,media_key TEXT NOT NULL UNIQUE,media_type TEXT NOT NULL CHECK(media_type IN ('image','video')),caption TEXT,share_consent INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,approved_at TEXT,is_shared INTEGER NOT NULL DEFAULT 0)").run();await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_submissions_status_created ON submissions(status,created_at DESC)').run()})().catch(e=>{schemaReady=undefined;throw e});
export default {async fetch(request,env){
  const url=new URL(request.url);const path=url.pathname;
  try{
    if(path.startsWith('/api/'))await ensureSchema(env);
    if(path==='/api/submissions'&&request.method==='GET'){
      const where=[],vals=[];const status=url.searchParams.get('status'),media=url.searchParams.get('media');
      if(status&&status!=='all'){where.push('status = ?');vals.push(status)}if(media&&media!=='all'){where.push('media_type = ?');vals.push(media)}
      const q=`SELECT * FROM submissions ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY created_at DESC LIMIT 250`;
      const out=await env.DB.prepare(q).bind(...vals).all();return json({submissions:out.results});
    }
    if(path==='/api/submissions'&&request.method==='POST'){
      const data=await request.formData(),file=data.get('media');if(!(file instanceof File))return fail('Choose a photo or video.',400);
      if(!MIME.has(file.type))return fail('Use a JPG, PNG, WebP, HEIC, MP4, MOV, or WebM file.',415);
      const kind=file.type.startsWith('image/')?'image':'video',max=kind==='image'?12582912:26214400;if(file.size>max)return fail(`${kind==='image'?'Photos':'Videos'} must be under ${max/1048576} MB.`,413);
      const caption=String(data.get('caption')||'').trim().slice(0,160),consent=data.get('consent')==='true',id=crypto.randomUUID(),ext=(file.name.split('.').pop()||'bin').replace(/[^a-z0-9]/gi,'').slice(0,8),key=`submissions/${new Date().toISOString().slice(0,10)}/${id}.${ext}`;
      await env.MEDIA.put(key,file.stream(),{httpMetadata:{contentType:file.type}});
      try{await env.DB.prepare("INSERT INTO submissions (id,media_key,media_type,caption,share_consent,status,created_at,approved_at,is_shared) VALUES (?,?,?,?,?,'pending',CURRENT_TIMESTAMP,NULL,0)").bind(id,key,kind,caption||null,consent?1:0).run()}catch(e){await env.MEDIA.delete(key);throw e}return json({id,status:'pending'},201);
    }
    const match=path.match(/^\/api\/submissions\/([^/]+)$/);
    if(match&&request.method==='PATCH'){const {status}=await request.json();if(!['approved','rejected'].includes(status))return fail('Invalid status.',400);await env.DB.prepare("UPDATE submissions SET status=?, approved_at=CASE WHEN ?='approved' THEN CURRENT_TIMESTAMP ELSE NULL END, is_shared=CASE WHEN ?='approved' THEN share_consent ELSE 0 END WHERE id=?").bind(status,status,status,match[1]).run();return json({ok:true})}
    if(match&&request.method==='DELETE'){const row=await env.DB.prepare('SELECT media_key FROM submissions WHERE id=?').bind(match[1]).first();if(row){await env.MEDIA.delete(row.media_key);await env.DB.prepare('DELETE FROM submissions WHERE id=?').bind(match[1]).run()}return json({ok:true})}
    if(path==='/api/submissions/bulk'&&request.method==='DELETE'){const body=await request.json(),ids=Array.isArray(body.ids)?body.ids.filter(x=>typeof x==='string').slice(0,250):[];if(!ids.length)return fail('Select at least one item.',400);const marks=ids.map(()=>'?').join(','),rows=await env.DB.prepare(`SELECT media_key FROM submissions WHERE id IN (${marks})`).bind(...ids).all();await Promise.all(rows.results.map(r=>env.MEDIA.delete(r.media_key)));await env.DB.prepare(`DELETE FROM submissions WHERE id IN (${marks})`).bind(...ids).run();return json({ok:true})}
    const mediaMatch=path.match(/^\/api\/media\/([^/]+)$/);
    if(mediaMatch&&request.method==='GET'){const gallery=url.searchParams.get('gallery')==='1',row=await env.DB.prepare(`SELECT * FROM submissions WHERE id=? ${gallery?"AND status='approved'":''}`).bind(mediaMatch[1]).first();if(!row)return new Response('Not found',{status:404});const obj=await env.MEDIA.get(row.media_key);if(!obj)return new Response('Not found',{status:404});const h=new Headers({'cache-control':gallery?'private, max-age=30':'private, no-store','content-disposition':'inline','x-content-type-options':'nosniff'});obj.writeHttpMetadata(h);return new Response(obj.body,{headers:h})}
    return env.ASSETS.fetch(request);
  }catch(e){return fail(path.startsWith('/api/')?'Storage is temporarily unavailable.':'Service unavailable.',503)}
}};
