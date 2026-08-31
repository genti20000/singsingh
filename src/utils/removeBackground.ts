/**
 * SingShot Portrait Segmentation & Background Removal Utility
 * 
 * Provides client-side and server-side background removal for photo selfies,
 * extracting the subject as a crisp transparent PNG for display against
 * venue neon backdrops, golden spotlight stages, and VIP frames.
 */

export interface BackgroundRemovalOptions {
  featherRadius?: number;
  sensitivity?: number; // 0.5 - 1.5 (default 1.0)
  edgeSoftness?: number;
  contrastBoost?: number;
}

export type CutoutStyle = 'transparent' | 'original' | 'portrait-blur' | 'gold-glow' | 'studio-dark' | 'soho-neon';

export interface CutoutPreset {
  id: CutoutStyle;
  label: string;
  badge: string;
  description: string;
}

export const CUTOUT_PRESETS: CutoutPreset[] = [
  {
    id: 'transparent',
    label: 'Transparent Cutout',
    badge: '✂️ NO BG',
    description: 'Crisp cutout that floats seamlessly over the Wall TV stage glow',
  },
  {
    id: 'gold-glow',
    label: 'VIP Gold Halo',
    badge: '👑 GOLD AURA',
    description: 'Subject cutout framed with radiating golden stage aura',
  },
  {
    id: 'studio-dark',
    label: 'Velvet Black Studio',
    badge: '📸 STUDIO',
    description: 'Clean dark studio background for high-contrast portrait look',
  },
  {
    id: 'soho-neon',
    label: 'Soho Neon Glow',
    badge: '🍸 SOHO NIGHTS',
    description: 'Subtle magenta-to-gold ambient nightlife backdrop',
  },
  {
    id: 'original',
    label: 'Keep Original BG',
    badge: '🎨 ORIGINAL',
    description: 'Retain the original venue/room background as captured',
  },
  {
    id: 'portrait-blur',
    label: 'Soft Portrait Blur',
    badge: '✨ BLUR BG',
    description: 'Keep you sharp while softly blurring the room behind you',
  },
];

/**
 * Checks if an image data URL or URL contains alpha transparency (cutout PNG)
 */
export async function isImageCutout(imageUrl: string): Promise<boolean> {
  if (!imageUrl) return false;
  if (imageUrl.startsWith('data:image/png')) {
    // If it's a PNG dataurl, test a few sample pixels for transparency
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(img.width, 100);
        canvas.height = Math.min(img.height, 100);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(false);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          let transparentCount = 0;
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 220) transparentCount++;
          }
          resolve(transparentCount > (data.length / 4) * 0.05);
        } catch {
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      img.src = imageUrl;
    });
  }
  return false;
}

/**
 * Intelligent Canvas-based Portrait Segmentation & Background Removal
 * Samples background perimeter colors, calculates foreground saliency (face/body region),
 * detects luminance and color delta gradients, and generates a soft-feathered alpha channel.
 */
export async function removeBackgroundClient(
  rawImageDataUrl: string,
  style: CutoutStyle = 'transparent',
  options: BackgroundRemovalOptions = {}
): Promise<string> {
  if (style === 'original') {
    return rawImageDataUrl;
  }

  if (style === 'portrait-blur') {
    return blurBackgroundClient(rawImageDataUrl);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const targetWidth = Math.min(img.naturalWidth || 800, 1080);
        const targetHeight = Math.round((targetWidth / (img.naturalWidth || 800)) * (img.naturalHeight || 1080));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          return resolve(rawImageDataUrl);
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const { data, width, height } = imageData;

        // 1. Sample perimeter pixels (corners & top/side borders) to determine background characteristics
        const cornerSamples: [number, number, number][] = [];
        const sampleSize = Math.max(4, Math.floor(width * 0.05));

        // Sample Top-Left, Top-Right, Top-Center, Bottom-Left, Bottom-Right
        const samplePoints = [
          [0, 0],
          [width - sampleSize, 0],
          [Math.floor(width / 2), 0],
          [0, Math.floor(height * 0.2)],
          [width - sampleSize, Math.floor(height * 0.2)],
          [0, height - sampleSize],
          [width - sampleSize, height - sampleSize],
        ];

        samplePoints.forEach(([sx, sy]) => {
          for (let dx = 0; dx < sampleSize; dx += 2) {
            for (let dy = 0; dy < sampleSize; dy += 2) {
              const px = Math.min(width - 1, sx + dx);
              const py = Math.min(height - 1, sy + dy);
              const idx = (py * width + px) * 4;
              cornerSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
            }
          }
        });

        // Compute average background color & variance
        let avgR = 0, avgG = 0, avgB = 0;
        cornerSamples.forEach(([r, g, b]) => {
          avgR += r;
          avgG += g;
          avgB += b;
        });
        avgR /= cornerSamples.length || 1;
        avgG /= cornerSamples.length || 1;
        avgB /= cornerSamples.length || 1;

        // 2. Define Subject Saliency Center (Portrait Subject is typically centered at x=50%, y=40%-85%)
        const centerX = width * 0.5;
        const centerY = height * 0.52;
        const radiusX = width * 0.44;
        const radiusY = height * 0.56;

        // 3. Alpha Mask array for smooth feathering
        const alphaMask = new Float32Array(width * height);

        for (let y = 0; y < height; y++) {
          const dy = (y - centerY) / radiusY;
          const dySq = dy * dy;

          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const dx = (x - centerX) / radiusX;
            const distFromCenterSq = dx * dx + dySq;
            const distFromCenter = Math.sqrt(distFromCenterSq);

            // Distance to background sample
            const colorDist = Math.sqrt(
              Math.pow(r - avgR, 2) + Math.pow(g - avgG, 2) + Math.pow(b - avgB, 2)
            );

            // Skin tone detection in YCbCr / RGB space
            const isSkinTone = (
              r > 70 && g > 40 && b > 20 &&
              r > g && r > b &&
              Math.abs(r - g) > 12 &&
              r - b > 15
            );

            // Hair / Dark Clothing detection vs Bright/Flat Background
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            const isSubjectLikely = isSkinTone || (distFromCenter < 0.65 && luminance > 30);

            // Calculate foreground probability
            let fgScore = 0;

            // Core center region is strongly foreground
            if (distFromCenter < 0.42) {
              fgScore = 1.0;
            } else if (distFromCenter < 0.78) {
              // Intermediate transition zone
              const radialFactor = 1.0 - (distFromCenter - 0.42) / 0.36;
              const colorFactor = Math.min(1.0, colorDist / 60);
              fgScore = Math.max(0, radialFactor * 0.7 + (isSubjectLikely ? 0.35 : 0) + (colorFactor > 0.4 ? 0.2 : -0.2));
            } else {
              // Outer border zone
              const edgeFalloff = Math.max(0, 1.0 - (distFromCenter - 0.78) / 0.25);
              fgScore = Math.max(0, edgeFalloff * (isSkinTone ? 0.8 : colorDist > 80 ? 0.4 : 0.05));
            }

            // Keep bottom torso connected (people expand downwards)
            if (y > height * 0.65 && Math.abs(x - centerX) < width * 0.38) {
              fgScore = Math.max(fgScore, 0.92);
            }

            alphaMask[y * width + x] = Math.min(1, Math.max(0, fgScore));
          }
        }

        // 4. Smooth Alpha Mask with Box/Gaussian Blur for natural anti-aliased hair/clothing edges
        const smoothedMask = new Float32Array(width * height);
        const blurRadius = 2;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            let sum = 0;
            let count = 0;
            for (let ky = -blurRadius; ky <= blurRadius; ky++) {
              const py = Math.min(height - 1, Math.max(0, y + ky));
              for (let kx = -blurRadius; kx <= blurRadius; kx++) {
                const px = Math.min(width - 1, Math.max(0, x + kx));
                sum += alphaMask[py * width + px];
                count++;
              }
            }
            smoothedMask[y * width + x] = sum / count;
          }
        }

        // 5. Apply Alpha Mask to Image Data
        for (let i = 0; i < width * height; i++) {
          const alphaVal = smoothedMask[i];
          const pixelIdx = i * 4;

          // Non-linear threshold curve for crisp subject definition with soft rim
          let finalAlpha = 0;
          if (alphaVal > 0.6) {
            finalAlpha = 255;
          } else if (alphaVal > 0.2) {
            finalAlpha = Math.round(((alphaVal - 0.2) / 0.4) * 255);
          } else {
            finalAlpha = 0;
          }

          data[pixelIdx + 3] = finalAlpha;
        }

        ctx.putImageData(imageData, 0, 0);

        // 6. Optional: Composite against preset background style
        if (style === 'gold-glow' || style === 'studio-dark' || style === 'soho-neon') {
          const bgCanvas = document.createElement('canvas');
          bgCanvas.width = targetWidth;
          bgCanvas.height = targetHeight;
          const bgCtx = bgCanvas.getContext('2d');
          if (bgCtx) {
            if (style === 'gold-glow') {
              const grad = bgCtx.createRadialGradient(
                targetWidth / 2, targetHeight * 0.45, targetWidth * 0.1,
                targetWidth / 2, targetHeight * 0.45, targetWidth * 0.85
              );
              grad.addColorStop(0, '#3a2a05');
              grad.addColorStop(0.5, '#191202');
              grad.addColorStop(1, '#050505');
              bgCtx.fillStyle = grad;
              bgCtx.fillRect(0, 0, targetWidth, targetHeight);
            } else if (style === 'studio-dark') {
              bgCtx.fillStyle = '#08080a';
              bgCtx.fillRect(0, 0, targetWidth, targetHeight);
              const grad = bgCtx.createRadialGradient(
                targetWidth / 2, targetHeight * 0.4, 20,
                targetWidth / 2, targetHeight * 0.4, targetWidth * 0.7
              );
              grad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
              grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
              bgCtx.fillStyle = grad;
              bgCtx.fillRect(0, 0, targetWidth, targetHeight);
            } else if (style === 'soho-neon') {
              const grad = bgCtx.createLinearGradient(0, 0, targetWidth, targetHeight);
              grad.addColorStop(0, '#2d0824');
              grad.addColorStop(0.5, '#0c0517');
              grad.addColorStop(1, '#051824');
              bgCtx.fillStyle = grad;
              bgCtx.fillRect(0, 0, targetWidth, targetHeight);
            }

            // Draw subject over styled background
            bgCtx.drawImage(canvas, 0, 0);
            return resolve(bgCanvas.toDataURL('image/jpeg', 0.94));
          }
        }

        // Return clean transparent PNG
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('Client background removal error:', err);
        resolve(rawImageDataUrl);
      }
    };

    img.onerror = () => {
      resolve(rawImageDataUrl);
    };

    img.src = rawImageDataUrl;
  });
}

/**
 * Lightweight portrait-style blur: render a blurred copy of the original image,
 * then layer the existing subject cutout on top. If canvas blur or segmentation
 * is unavailable, the untouched capture is returned so the flow stays usable.
 */
export async function blurBackgroundClient(rawImageDataUrl: string): Promise<string> {
  try {
    const cutoutUrl = await removeBackgroundClient(rawImageDataUrl, 'transparent');
    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
      });

    const [original, cutout] = await Promise.all([loadImage(rawImageDataUrl), loadImage(cutoutUrl)]);
    const width = Math.min(original.naturalWidth || 1080, 1080);
    const height = Math.round(width * ((original.naturalHeight || 1440) / (original.naturalWidth || 1080)));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context || !('filter' in context)) return rawImageDataUrl;

    context.save();
    context.filter = 'blur(18px)';
    context.drawImage(original, -18, -18, width + 36, height + 36);
    context.restore();
    context.drawImage(cutout, 0, 0, width, height);

    return canvas.toDataURL('image/jpeg', 0.94);
  } catch (error) {
    console.warn('Portrait blur unavailable; keeping original capture.', error);
    return rawImageDataUrl;
  }
}

/**
 * Unified Background Removal Runner: Tries server API if available, falls back seamlessly to client engine
 */
export async function removeBackground(
  imageUrl: string,
  style: CutoutStyle = 'transparent'
): Promise<string> {
  if (!imageUrl || style === 'original') {
    return imageUrl;
  }

  if (style === 'portrait-blur') {
    return blurBackgroundClient(imageUrl);
  }

  try {
    // Attempt fast server-assisted background removal
    const response = await fetch('/api/remove-bg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageUrl, style }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.image_url) {
        return result.image_url;
      }
    }
  } catch {
    // Server endpoint optional, continue to robust client segmentation
  }

  return removeBackgroundClient(imageUrl, style);
}
