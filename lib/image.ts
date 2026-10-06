const DEFAULT_MAX_DIMENSION = 2000;
const DEFAULT_MAX_BYTES = 1.3 * 1024 * 1024; // raw bytes, before base64
const DEFAULT_INITIAL_QUALITY = 0.92;
const MIN_QUALITY = 0.55;

/**
 * Resizes and re-encodes an image file client-side, returning a JPEG data
 * URL. Product photos straight off a phone are routinely 3-8MB — uncompressed,
 * that's what was making "adding images" feel stuck: the full-size base64
 * payload (worse with several gallery photos at once) is slow to upload and
 * slow for Postgres to write.
 *
 * Quality is adaptive rather than fixed: it starts high (0.92) and only
 * steps down if the result is still over `maxBytes`, so a simple or
 * already-small photo keeps its full quality instead of every upload being
 * crushed to the same ~900KB regardless of content. `maxBytes` stays well
 * under Vercel's ~4.5MB request body limit even once base64-encoded and
 * combined with a few gallery photos in the same save.
 */
export function compressImageToDataUrl(
  file: File,
  { maxDimension = DEFAULT_MAX_DIMENSION, maxBytes = DEFAULT_MAX_BYTES, initialQuality = DEFAULT_INITIAL_QUALITY } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      let quality = initialQuality;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);

      // toDataURL's base64 payload is ~4/3 the raw byte size — approximate
      // raw size from its string length rather than re-decoding it.
      const rawBytes = (url: string) => (url.length * 3) / 4;

      while (rawBytes(dataUrl) > maxBytes && quality > MIN_QUALITY) {
        quality = Math.max(quality - 0.08, MIN_QUALITY);
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

/** Estimated raw byte size of a data URL, from its string length. */
export function dataUrlBytes(dataUrl: string): number {
  return (dataUrl.length * 3) / 4;
}
