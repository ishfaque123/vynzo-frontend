import type { CSSProperties } from 'react';

export interface ChatWallpaperPreset {
  id: string;
  name: string;
  /** Base background (colour) applied under any image layer. */
  bg: string;
  /** Optional background-image layer (gradients / patterns, pure CSS). */
  image?: string;
}

// Shared by the per-chat wallpaper picker in the chat screen and the
// account-level Chat wallpaper setting in Messages Settings. The first
// six presets are the original per-chat list — ids and colours are
// unchanged so existing per-chat picks (localStorage) keep resolving.
export const CHAT_WALLPAPERS: ChatWallpaperPreset[] = [
  { id: 'default', name: 'Default', bg: '#f8fafc' },
  { id: 'beige', name: 'Beige', bg: '#e9dfd0' },
  { id: 'green', name: 'Mint', bg: '#d8e8d2' },
  { id: 'blue', name: 'Sky', bg: '#d5e2f2' },
  { id: 'pink', name: 'Rose', bg: '#f2dde4' },
  { id: 'dark', name: 'Dark', bg: '#232a33' },
  {
    id: 'dusk',
    name: 'Dusk',
    bg: '#e8a2b4',
    image: 'linear-gradient(160deg, #f6d5a7 0%, #e8a2b4 55%, #7d7fc9 100%)',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    bg: '#7fb6d9',
    image: 'linear-gradient(160deg, #bfe3ea 0%, #7fb6d9 60%, #3f7fbf 100%)',
  },
  {
    id: 'dots',
    name: 'Dots',
    bg: '#eef2f7',
    image: 'radial-gradient(#c3cedd 1.5px, transparent 1.6px)',
  },
];

export const CHAT_WALLPAPER_IDS = CHAT_WALLPAPERS.map((w) => w.id);

/**
 * Resolve a stored wallpaper value (preset id, or an uploaded photo URL)
 * into the style for the chat screen's message area. 'default' (or an
 * unknown/empty value) keeps the theme background exactly as before.
 * Message bubbles keep their own colours — the wallpaper only shows in
 * the gaps behind them.
 */
export function chatWallpaperStyle(value: string | null | undefined, isDarkTheme: boolean): CSSProperties {
  if (!value || value === 'default') {
    return { background: isDarkTheme ? '#1c232e' : '#f8fafc' };
  }
  if (value.startsWith('http')) {
    return {
      backgroundImage: `url("${value}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }
  const preset = CHAT_WALLPAPERS.find((w) => w.id === value) || CHAT_WALLPAPERS[0];
  const style: CSSProperties = { background: preset.bg };
  if (preset.image) {
    style.backgroundImage = preset.image;
    if (preset.id === 'dots') {
      style.backgroundSize = '22px 22px';
    }
  }
  return style;
}

/** Swatch style for picker grids (settings page + per-chat sheet). */
export function chatWallpaperSwatchStyle(preset: ChatWallpaperPreset): CSSProperties {
  const style: CSSProperties = { background: preset.bg };
  if (preset.image) {
    style.backgroundImage = preset.image;
    if (preset.id === 'dots') style.backgroundSize = '22px 22px';
  }
  return style;
}
