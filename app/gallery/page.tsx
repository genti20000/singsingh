'use client';

import {useEffect,useRef,useState} from 'react';
import styles from './gallery.module.css';

type Photo={
  id:string;
  media_type:'image'|'video';
  caption:string|null;
  status:'pending'|'approved'|'rejected';
  created_at:string;
};

const ROTATION_MS=6500;

const altText=(photo:Photo)=>photo.caption
  ?`${photo.caption} — guest karaoke moment`
  :'Guest karaoke celebration';

export default function Gallery(){
  const [items,setItems]=useState<Photo[]>([]);
  const [currentId,setCurrentId]=useState('');
  const [previousId,setPreviousId]=useState('');
  const [loadedId,setLoadedId]=useState('');
  const [broken,setBroken]=useState<string[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const newestRef=useRef('');

  const photos=items.filter(item=>item.media_type==='image'&&!broken.includes(item.id));
  const current=photos.find(photo=>photo.id===currentId)||photos[0];
  const previous=photos.find(photo=>photo.id===previousId);
  const currentIndex=current?photos.findIndex(photo=>photo.id===current.id):-1;
  const mediaUrl=(id:string)=>`/api/media/${id}?gallery=1`;

  useEffect(()=>{
    let active=true;
    const load=async()=>{
      try{
        const response=await fetch('/api/submissions?status=approved&media=image',{cache:'no-store'});
        if(!response.ok)throw new Error();
        const next=(await response.json()).submissions as Photo[];
        if(!active)return;
        const newest=next[0]?.id||'';
        setItems(next);
        setCurrentId(id=>{
          const newApproval=Boolean(newestRef.current&&newest&&newest!==newestRef.current);
          return !id||!next.some(photo=>photo.id===id)||newApproval?newest:id;
        });
        newestRef.current=newest;
        setError('');
      }catch{
        if(active)setError('Reconnecting…');
      }finally{
        if(active)setLoading(false);
      }
    };
    load();
    const poll=setInterval(load,8000);
    return()=>{active=false;clearInterval(poll)};
  },[]);

  useEffect(()=>{
    if(!current||photos.length<2)return;
    const timer=setTimeout(()=>{
      setPreviousId(current.id);
      setLoadedId('');
      setCurrentId(photos[(currentIndex+1)%photos.length].id);
    },ROTATION_MS);
    return()=>clearTimeout(timer);
  },[current?.id,currentIndex,photos.length]);

  useEffect(()=>{
    if(!previousId||loadedId!==current?.id)return;
    const timer=setTimeout(()=>setPreviousId(''),700);
    return()=>clearTimeout(timer);
  },[previousId,loadedId,current?.id]);

  function imageFailed(id:string){
    setBroken(list=>list.includes(id)?list:[...list,id]);
    if(id===current?.id){
      setCurrentId(photos.find(photo=>photo.id!==id)?.id||'');
      setPreviousId('');
      setLoadedId('');
    }
  }

  return <main className={styles.display}>
    <header className={styles.header}>
      <div className={styles.identity} aria-label="SingShot">
        <b>SING</b><i>SHOT</i>
      </div>
      <h1>Tonight’s SingShots</h1>
      <span className={styles.location}>London Karaoke Club</span>
    </header>

    <section className={styles.stage} aria-live="polite" aria-busy={loading}>
      <div className={styles.ambient} aria-hidden="true"/>

      {previous&&
        <figure className={`${styles.photo} ${styles.previous} ${loadedId===current?.id?styles.leaving:''}`} aria-hidden="true">
          <img src={mediaUrl(previous.id)} alt=""/>
        </figure>}

      {current&&
        <figure key={current.id} className={`${styles.photo} ${styles.current} ${loadedId===current.id?styles.ready:''}`}>
          <img
            src={mediaUrl(current.id)}
            alt={altText(current)}
            onLoad={()=>setLoadedId(current.id)}
            onError={()=>imageFailed(current.id)}
          />
        </figure>}

      {current&&loadedId===current.id&&<div key={`flash-${current.id}`} className={styles.flash} aria-hidden="true"/>}

      {!current&&
        <div className={styles.state}>
          {loading
            ?<><span className={styles.spinner}/><h2>Loading tonight’s SingShots…</h2></>
            :<><span className={styles.monogram}>S</span><h2>The stage is warming up.</h2><p>Your next SingShot will appear here.</p></>}
        </div>}

      <div className={styles.preload} aria-hidden="true">
        {photos.map(photo=><img key={photo.id} src={mediaUrl(photo.id)} alt="" onError={()=>imageFailed(photo.id)}/>)}
      </div>

      {error&&<span className={styles.error}>{error}</span>}
      {photos.length>1&&
        <span className={styles.count}>
          {String(currentIndex+1).padStart(2,'0')} / {String(photos.length).padStart(2,'0')}
        </span>}
    </section>
  </main>;
}
