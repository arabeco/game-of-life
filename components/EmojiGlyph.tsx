import React from 'react';

export type EmojiGlyphSize = 'arena' | 'action' | 'milestone' | 'detail' | 'picker' | 'badge' | 'cover-sm' | 'cover';

const sizeClasses: Record<EmojiGlyphSize, string> = {
  arena: 'emoji-glyph--arena',
  action: 'emoji-glyph--action',
  milestone: 'emoji-glyph--milestone',
  detail: 'emoji-glyph--detail',
  picker: 'emoji-glyph--picker',
  badge: 'emoji-glyph--badge',
  'cover-sm': 'emoji-glyph--cover-sm',
  cover: 'emoji-glyph--cover',
};

interface EmojiGlyphProps {
  symbol: string;
  size?: EmojiGlyphSize;
  className?: string;
  style?: React.CSSProperties;
}

const EMOJI_FALLBACKS: Record<string, string> = {
  '?': '\u{1F4DD}',
  '??': '\u{1F4DD}',
  '???': '\u221E',
  '????': '\u{1F525}',
  '?????': '\u{1F3C6}',
  '??????': '\u2694\uFE0F',
  '???????': '\u{1F441}\uFE0F',
};

const normalizeEmojiSymbol = (symbol: string) => {
  if (!symbol) return '\u{1F4DD}';
  return EMOJI_FALLBACKS[symbol] || symbol;
};

export const EmojiGlyph: React.FC<EmojiGlyphProps> = ({ symbol, size = 'action', className = '', style }) => (
  <span className={`emoji-glyph ${sizeClasses[size]} ${className}`.trim()} style={style} aria-hidden="true">
    {normalizeEmojiSymbol(symbol)}
  </span>
);
