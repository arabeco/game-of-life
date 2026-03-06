/**
 * Image compression utilities for Supabase Storage upload optimization.
 * Converts images to WebP with controllable quality and max dimensions.
 */

interface CompressOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0-1, default 0.8
}

/**
 * Compresses an image (from a data URL, Blob, or File) to WebP format.
 * Returns a Blob ready for Supabase upload.
 *
 * Usage:
 *   const webpBlob = await compressToWebP(file);
 *   supabase.storage.from('bucket').upload('path.webp', webpBlob, { contentType: 'image/webp' });
 */
export async function compressToWebP(
    input: File | Blob | string, // string = data URL
    options: CompressOptions = {}
): Promise<Blob> {
    const { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = options;

    // Convert input to an HTMLImageElement
    const img = await loadImage(input);

    // Calculate new dimensions preserving aspect ratio
    let { width, height } = img;
    if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }

    // Draw to canvas and export as WebP
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, width, height);

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('WebP compression failed'));
            },
            'image/webp',
            quality
        );
    });
}

/**
 * Compresses a data URL to a WebP data URL string.
 * Useful when you need to keep working with data URLs (e.g. cropper output).
 */
export async function compressDataUrlToWebP(
    dataUrl: string,
    options: CompressOptions = {}
): Promise<string> {
    const blob = await compressToWebP(dataUrl, options);
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/** Load an image source into an HTMLImageElement */
function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;

        if (typeof source === 'string') {
            img.src = source; // data URL or regular URL
        } else {
            img.src = URL.createObjectURL(source);
        }
    });
}
