import React, { createContext, useContext } from 'react';
export type Crop = { x: number; y: number; zoom: number; light: number };
export const DEFAULT_CROP: Crop = { x: 50, y: 50, zoom: 1, light: 1 };
export const ArtContext = createContext<{ settings: Record<string, Crop>; urls: Record<string, string> }>({ settings: {}, urls: {} });
export function ProfileBackgroundSurface({ value = '', className = '', alt = '' }: { value?: string; className?: string; alt?: string }) {
  const { settings, urls } = useContext(ArtContext);
  const rank = Object.keys(urls).find(id => value.endsWith('rank-' + id)) || value;
  const crop = settings[rank] || DEFAULT_CROP;
  return <div className={className} style={{ overflow: 'hidden', position: 'relative' }}>
    <img alt={alt} src={urls[rank]} draggable={false} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', objectPosition: `${crop.x}% ${crop.y}%`, transform: `scale(${crop.zoom})`, transformOrigin: `${crop.x}% ${crop.y}%`, filter: `brightness(${crop.light})` }} />
  </div>;
}
