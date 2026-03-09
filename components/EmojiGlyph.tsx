import React from 'react';

type EmojiGlyphSize = 'arena' | 'action' | 'milestone' | 'picker' | 'badge';

const sizeClasses: Record<EmojiGlyphSize, string> = {
  arena: 'emoji-glyph--arena',
  action: 'emoji-glyph--action',
  milestone: 'emoji-glyph--milestone',
  picker: 'emoji-glyph--picker',
  badge: 'emoji-glyph--badge',
};

interface EmojiGlyphProps {
  symbol: string;
  size?: EmojiGlyphSize;
  className?: string;
}

export const EmojiGlyph: React.FC<EmojiGlyphProps> = ({ symbol, size = 'action', className = '' }) => (
  <span className={`emoji-glyph ${sizeClasses[size]} ${className}`.trim()} aria-hidden="true">
    {symbol}
  </span>
);
