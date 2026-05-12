import type { ImageLoaderProps } from 'next/image';

// Transforms a Cloudinary URL to include Next.js-requested width/quality params.
// Bypasses the /_next/image proxy so the browser fetches directly from Cloudinary.
export default function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  const q = quality || 75;

  // If already a Cloudinary URL, inject transformation params
  const cloudinaryUploadPattern = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+)$/;
  const match = src.match(cloudinaryUploadPattern);
  if (match) {
    return `${match[1]}w_${width},q_${q},f_auto/${match[2]}`;
  }

  // Fallback: return src as-is (e.g. placeholder or non-Cloudinary URLs)
  return src;
}
