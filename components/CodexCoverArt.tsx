import React from 'react';
import { EmojiGlyph, type EmojiGlyphSize } from './EmojiGlyph';

export const isProbablyImageUrl = (value?: string | null) => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('/') || normalized.startsWith('data:image/');
};

interface CodexCoverArtProps {
  cover?: string | null;
  title: string;
  fallback?: string;
  imageClassName?: string;
  backgroundClassName?: string;
  emojiSize?: EmojiGlyphSize;
  emojiClassName?: string;
}

export const CodexCoverArt: React.FC<CodexCoverArtProps> = ({
  cover,
  title,
  fallback = '\u{1F4DC}',
  imageClassName = 'absolute inset-0 h-full w-full object-cover',
  backgroundClassName = 'absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_58%),linear-gradient(180deg,rgba(33,24,16,0.95),rgba(10,8,10,0.98))]',
  emojiSize = 'cover',
  emojiClassName = '',
}) => {
  if (isProbablyImageUrl(cover)) {
    return <img src={cover} alt={title} className={imageClassName} />;
  }

  return (
    <div className={backgroundClassName}>
      <EmojiGlyph symbol={cover || fallback} size={emojiSize} className={emojiClassName} />
    </div>
  );
};
