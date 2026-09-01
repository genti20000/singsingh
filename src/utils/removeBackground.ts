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

export type CutoutStyle =
  | 'gold-glow'
  | 'transparent'
  | 'soho-neon'
  | 'disco-fever'
  | 'rose-gold'
  | 'red-carpet'
  | 'cyber-stage'
  | 'studio-dark'
  | 'portrait-blur'
  | 'original';

export interface CutoutPreset {
  id: CutoutStyle;
  label: string;
  badge: string;
  category: 'vip' | 'party' | 'scene' | 'studio';
  description: string;
}

export const CUTOUT_PRESETS: CutoutPreset[] = [
  {
    id: 'gold-glow',
    label: 'VIP Gold Halo',
    badge: '👑 GOLD AURA',
    category: 'vip',
    description: 'Radiating golden stage aura with sparkling VIP particle glow',
  },
  {
    id: 'transparent',
    label: 'Transparent Cutout',
    badge: '✂️ CUTOUT',
    category: 'studio',
    description: 'Crisp subject cutout floating over the live TV wall stage',
  },
  {
    id: 'soho-neon',
    label: 'Soho London Neon',
    badge: '🍸 SOHO NIGHTS',
    category: 'scene',
    description: 'Iconic Soho nightlife skyline with vibrant neon sign reflections',
  },
  {
    id: 'disco-fever',
    label: 'Retro Disco Glitz',
    badge: '🪩 DISCO FEVER',
    category: 'party',
    description: 'Shimmering mirrorball prism rays & multi-colored stage lights',
  },
  {
    id: 'rose-gold',
    label: 'Rose Gold Champagne',
    badge: '🥂 BUBBLY ROSE',
    category: 'vip',
    description: 'Warm celebratory champagne bubbles & soft rose quartz ambiance',
  },
  {
    id: 'red-carpet',
    label: 'VIP Red Carpet',
    badge: '🎬 RED CARPET',
    category: 'vip',
    description: 'Paparazzi camera flash starbursts & luxury crimson carpet',
  },
  {
    id: 'cyber-stage',
    label: 'Cyber Laser Stage',
    badge: '⚡ CYBER STAGE',
    category: 'party',
    description: 'High-octane neon laser beams & perspective floor grid',
  },
  {
    id: 'studio-dark',
    label: 'Velvet Black Studio',
    badge: '📸 STUDIO',
    category: 'studio',
    description: 'Clean dark studio background for high-contrast portrait look',
  },
  {
    id: 'portrait-blur',
    label: 'Soft Portrait Blur',
    badge: '✨ BLUR BG',
    category: 'studio',
    description: 'Keep you sharp while softly blurring the room behind you',
  },
  {
    id: 'original',
    label: 'Keep Original BG',
    badge: '🎨 ORIGINAL',
    category: 'studio',
    description: 'Retain the original venue/room background as captured',
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
        if (style !== 'transparent') {
          const bgCanvas = document.createElement('canvas');
          bgCanvas.width = targetWidth;
          bgCanvas.height = targetHeight;
          const bgCtx = bgCanvas.getContext('2d');
          if (bgCtx) {
            if (style === 'gold-glow') {
              // VIP Gold Halo & Stage Lights
              const grad = bgCtx.createRadialGradient(
                targetWidth / 2, targetHeight * 0.42, targetWidth * 0.08,
                targetWidth / 2, targetHeight * 0.45, targetWidth * 0.88
              );
              grad.addColorStop(0, '#5a4208');
              grad.addColorStop(0.35, '#2b1e04');
              grad.addColorStop(0.75, '#120d02');
              grad.addColorStop(1, '#050402');
              bgCtx.fillStyle = grad;
              bgCtx.fillRect(0, 0, targetWidth, targetHeight);

              // Top golden spotlight beam
              bgCtx.save();
              const cone = bgCtx.createLinearGradient(targetWidth / 2, 0, targetWidth / 2, targetHeight * 0.7);
              cone.addColorStop(0, 'rgba(245, 197, 66, 0.35)');
              cone.addColorStop(1, 'rgba(245, 197, 66, 0)');
              bgCtx.fillStyle = cone;
              bgCtx.beginPath();
              bgCtx.moveTo(targetWidth * 0.35, 0);
              bgCtx.lineTo(targetWidth * 0.65, 0);
              bgCtx.lineTo(targetWidth * 0.95, targetHeight * 0.85);
              bgCtx.lineTo(targetWidth * 0.05, targetHeight * 0.85);
              bgCtx.closePath();
              bgCtx.fill();
              bgCtx.restore();

              // Sparkle particles
              for (let i = 0; i < 28; i++) {
                const px = ((i * 137) % targetWidth);
                const py = ((i * 229) % targetHeight);
                const pr = (i % 3) + 1.2;
                bgCtx.beginPath();
                bgCtx.arc(px, py, pr, 0, Math.PI * 2);
                bgCtx.fillStyle = 'rgba(255, 230, 150, 0.6)';
                bgCtx.shadowColor = '#e5b842';
                bgCtx.shadowBlur = 8;
                bgCtx.fill();
              }
            } else if (style === 'soho-neon') {
              // Soho London Neon Nights
              const grad = bgCtx.createLinearGradient(0, 0, targetWidth, targetHeight);
              grad.addColorStop(0, '#350930');
              grad.addColorStop(0.4, '#130826');
              grad.addColorStop(0.8, '#08142b');
              grad.addColorStop(1, '#040b17');
              bgCtx.fillStyle = grad;
              bgCtx.fillRect(0, 0, targetWidth, targetHeight);

              // Rooftop skyline silhouette at bottom
              bgCtx.fillStyle = '#050308';
              bgCtx.beginPath();
              bgCtx.moveTo(0, targetHeight);
              bgCtx.lineTo(0, targetHeight * 0.85);
              bgCtx.lineTo(targetWidth * 0.15, targetHeight * 0.85);
              bgCtx.lineTo(targetWidth * 0.15, targetHeight * 0.78);
              bgCtx.lineTo(targetWidth * 0.28, targetHeight * 0.78);
              bgCtx.lineTo(targetWidth * 0.28, targetHeight * 0.86);
              bgCtx.lineTo(targetWidth * 0.45, targetHeight * 0.86);
              bgCtx.lineTo(targetWidth * 0.45, targetHeight * 0.74);
              bgCtx.lineTo(targetWidth * 0.6, targetHeight * 0.74);
              bgCtx.lineTo(targetWidth * 0.6, targetHeight * 0.88);
              bgCtx.lineTo(targetWidth * 0.8, targetHeight * 0.88);
              bgCtx.lineTo(targetWidth * 0.8, targetHeight * 0.8);
              bgCtx.lineTo(targetWidth, targetHeight * 0.8);
              bgCtx.lineTo(targetWidth, targetHeight);
              bgCtx.closePath();
              bgCtx.fill();

              // Neon glow orbs
              const neon1 = bgCtx.createRadialGradient(targetWidth * 0.2, targetHeight * 0.3, 10, targetWidth * 0.2, targetHeight * 0.3, targetWidth * 0.45);
              neon1.addColorStop(0, 'rgba(244, 63, 94, 0.4)');
              neon1.addColorStop(1, 'rgba(244, 63, 94, 0)');
              bgCtx.fillStyle = neon1;
              bgCtx.fillRect(0, 0, targetWidth, targetHeight);

              const neon2 = bgCtx.createRadialGradient(targetWidth * 0.8, targetHeight * 0.35, 10, targetWidth * 0.8, targetHeight * 0.35, targetWidth * 0.45);
              neon2.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
              neon2.addColorStop(1, 'rgba(56, 189, 248, 0)');
              bgCtx.fillStyle = neon2;
              bgCtx.fillRect(0, 0, targetWidth, targetHeight);
            } else if (style === 'disco-fever') {
              // Retro Disco Fever & Mirrorball Rays
              bgCtx.fillStyle = '#06030c';
              bgCtx.fillRect(0, 0, targetWidth, targetHeight);

              // Radial prism rays from top center
              const rayCount = 18;
              const cx = targetWidth / 2;
              const cy = targetHeight * 0.05;
              const rayLength = Math.max(targetWidth, targetHeight) * 1.2;

              for (let i = 0; i < rayCount; i++) {
                const angle = (i / rayCount) * Math.PI + Math.PI * 0.05;
                const spread = (Math.PI / rayCount) * 0.45;
                bgCtx.save();
                bgCtx.beginPath();
                bgCtx.moveTo(cx, cy);
                bgCtx.arc(cx, cy, rayLength, angle - spread / 2, angle + spread / 2);
                bgCtx.closePath();
                const colors = ['rgba(236,72,153,0.18)', 'rgba(59,130,246,0.18)', 'rgba(234,179,8,0.18)', 'rgba(168,85,247,0.18)', 'rgba(34,197,94,0.18)'];
                bgCtx.fillStyle = colors[i % colors.length];
                bgCtx.fill();
                bgCtx.restore();
              }

              // Bokeh bubbles
              for (let i = 0; i < 22; i++) {
                const bx = ((i * 181) % targetWidth);
                const by = ((i * 271) % targetHeight);
                const br = (i % 5) * 6 + 8;
                bgCtx.beginPath();
                bgCtx.arc(bx, by, br, 0, Math.PI * 2);
                bgCtx.fillStyle = i % 2 === 0 ? 'rgba(244, 114, 182, 0.25)' : 'rgba(96, 165, 250, 0.25)';
                bgCtx.fill();
              }
            } else if (style === 'rose-gold') {
              // Rose Gold & Champagne Sparkles
              const grad = bgCtx.createRadialGradient(
                targetWidth / 2, targetHeight * 0.4, targetWidth * 0.1,
                targetWidth / 2, targetHeight * 0.5, targetWidth * 0.8
              );
              grad.addColorStop(0, '#4a1525');
              grad.addColorStop(0.5, '#260a14');
              grad.addColorStop(1, '#0c0206');
              bgCtx.fillStyle = grad;
              bgCtx.fillRect(0, 0, targetWidth, targetHeight);

              // Champagne bubbles rising
              for (let i = 0; i < 35; i++) {
                const px = ((i * 149) % targetWidth);
                const py = ((i * 197) % targetHeight);
                const pr = (i % 4) + 1.5;
                bgCtx.beginPath();
                bgCtx.arc(px, py, pr, 0, Math.PI * 2);
                bgCtx.fillStyle = 'rgba(253, 230, 138, 0.55)';
                bgCtx.shadowColor = '#fb7185';
                bgCtx.shadowBlur = 6;
                bgCtx.fill();
              }
            } else if (style === 'red-carpet') {
              // VIP Red Carpet & Paparazzi Strobe Flashes
              const grad = bgCtx.createRadialGradient(
                targetWidth / 2, targetHeight * 0.38, targetWidth * 0.05,
                targetWidth / 2, targetHeight * 0.5, targetWidth * 0.9
              );
              grad.addColorStop(0, '#5e0b1b');
              grad.addColorStop(0.4, '#31040d');
              grad.addColorStop(0.85, '#120105');
              grad.addColorStop(1, '#050002');
              bgCtx.fillStyle = grad;
              bgCtx.fillRect(0, 0, targetWidth, targetHeight);

              // Carpet bottom perspective
              const carpetGrad = bgCtx.createLinearGradient(0, targetHeight * 0.7, 0, targetHeight);
              carpetGrad.addColorStop(0, 'rgba(159, 18, 57, 0.8)');
              carpetGrad.addColorStop(1, 'rgba(225, 29, 72, 0.95)');
              bgCtx.fillStyle = carpetGrad;
              bgCtx.beginPath();
              bgCtx.moveTo(targetWidth * 0.15, targetHeight * 0.7);
              bgCtx.lineTo(targetWidth * 0.85, targetHeight * 0.7);
              bgCtx.lineTo(targetWidth, targetHeight);
              bgCtx.lineTo(0, targetHeight);
              bgCtx.closePath();
              bgCtx.fill();

              // Camera flash starbursts
              const flashes = [
                [targetWidth * 0.12, targetHeight * 0.22, 14],
                [targetWidth * 0.88, targetHeight * 0.28, 16],
                [targetWidth * 0.25, targetHeight * 0.12, 10],
                [targetWidth * 0.78, targetHeight * 0.15, 12],
              ];
              flashes.forEach(([fx, fy, size]) => {
                bgCtx.save();
                bgCtx.beginPath();
                bgCtx.arc(fx, fy, size * 0.4, 0, Math.PI * 2);
                bgCtx.fillStyle = '#ffffff';
                bgCtx.shadowColor = '#ffffff';
                bgCtx.shadowBlur = 15;
                bgCtx.fill();

                // Cross spikes
                bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                bgCtx.lineWidth = 1.5;
                bgCtx.beginPath();
                bgCtx.moveTo(fx - size, fy);
                bgCtx.lineTo(fx + size, fy);
                bgCtx.moveTo(fx, fy - size);
                bgCtx.lineTo(fx, fy + size);
                bgCtx.stroke();
                bgCtx.restore();
              });
            } else if (style === 'cyber-stage') {
              // Cyber Laser Matrix Stage
              bgCtx.fillStyle = '#050811';
              bgCtx.fillRect(0, 0, targetWidth, targetHeight);

              // Perspective floor grid lines
              bgCtx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
              bgCtx.lineWidth = 1.5;
              const horizon = targetHeight * 0.65;
              for (let x = -targetWidth * 0.5; x <= targetWidth * 1.5; x += targetWidth * 0.12) {
                bgCtx.beginPath();
                bgCtx.moveTo(targetWidth / 2, horizon);
                bgCtx.lineTo(x, targetHeight);
                bgCtx.stroke();
              }
              for (let y = horizon; y <= targetHeight; y += (targetHeight - horizon) / 6) {
                bgCtx.beginPath();
                bgCtx.moveTo(0, y);
                bgCtx.lineTo(targetWidth, y);
                bgCtx.stroke();
              }

              // Sweeping Neon Lasers
              bgCtx.strokeStyle = 'rgba(236, 72, 153, 0.6)';
              bgCtx.lineWidth = 2.5;
              bgCtx.shadowColor = '#ec4899';
              bgCtx.shadowBlur = 10;
              bgCtx.beginPath();
              bgCtx.moveTo(0, targetHeight * 0.1);
              bgCtx.lineTo(targetWidth, targetHeight * 0.5);
              bgCtx.stroke();

              bgCtx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
              bgCtx.shadowColor = '#06b6d4';
              bgCtx.beginPath();
              bgCtx.moveTo(targetWidth, targetHeight * 0.12);
              bgCtx.lineTo(0, targetHeight * 0.55);
              bgCtx.stroke();
            } else if (style === 'studio-dark') {
              // Velvet Studio Dark
              bgCtx.fillStyle = '#08080a';
              bgCtx.fillRect(0, 0, targetWidth, targetHeight);
              const grad = bgCtx.createRadialGradient(
                targetWidth / 2, targetHeight * 0.4, 20,
                targetWidth / 2, targetHeight * 0.4, targetWidth * 0.7
              );
              grad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
              grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
              bgCtx.fillStyle = grad;
              bgCtx.fillRect(0, 0, targetWidth, targetHeight);
            }

            // Draw subject cutout cleanly over styled backdrop
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
