'use client';

export default function GalleryVideo({src,caption}:{src:string;caption:string}){
  return <video className="gallery-grid-video" src={src} controls playsInline preload="metadata" aria-label={caption}/>;
}
