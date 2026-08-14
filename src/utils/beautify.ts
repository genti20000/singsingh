export type BeautifyPreset = 'original' | 'glow' | 'glam' | 'studio';

export interface FilterOption {
  id: BeautifyPreset;
  label: string;
  badge: string;
  cssFilter: string;
}

export const BEAUTIFY_PRESETS: FilterOption[] = [
  {
    id: 'glow',
    label: 'Nightlife Glow',
    badge: '✨ BEAUTIFIED',
    cssFilter: 'contrast(1.12) brightness(1.08) saturate(1.22) sepia(0.08)',
  },
  {
    id: 'glam',
    label: 'Soho Glam',
    badge: '🌟 VIVID',
    cssFilter: 'contrast(1.18) brightness(1.12) saturate(1.35)',
  },
  {
    id: 'studio',
    label: 'Studio Portrait',
    badge: '📸 CRISP',
    cssFilter: 'contrast(1.25) brightness(1.06) saturate(1.15)',
  },
  {
    id: 'original',
    label: 'Keep Original',
    badge: '🎨 ORIGINAL',
    cssFilter: 'none',
  },
];

/**
 * Renders an image through an HTML5 Canvas with the chosen beautify filter applied
 */
export const processBeautifiedImage = (
  rawImageDataUrl: string,
  preset: BeautifyPreset,
  callback: (processedDataUrl: string) => void
) => {
  if (preset === 'original') {
    callback(rawImageDataUrl);
    return;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = rawImageDataUrl;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 1080;
    canvas.height = img.naturalHeight || 1440;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      callback(rawImageDataUrl);
      return;
    }

    ctx.save();
    
    // Apply preset CSS filter
    const matched = BEAUTIFY_PRESETS.find((p) => p.id === preset);
    if (matched && matched.cssFilter !== 'none') {
      ctx.filter = matched.cssFilter;
    } else {
      ctx.filter = 'contrast(1.12) brightness(1.08) saturate(1.22)';
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Soft warm skin tone radial glow overlay in center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.max(canvas.width, canvas.height) * 0.6;
    const gradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.1,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, 'rgba(255, 230, 180, 0.08)');
    gradient.addColorStop(0.7, 'rgba(255, 200, 150, 0.04)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.25)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    callback(canvas.toDataURL('image/jpeg', 0.92));
  };

  img.onerror = () => {
    callback(rawImageDataUrl);
  };
};
