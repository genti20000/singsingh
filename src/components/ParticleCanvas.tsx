import React, { useEffect, useRef } from 'react';
import { WallBackgroundTheme } from '../types';

interface ParticleCanvasProps {
  color?: string; // fallback color
  theme?: WallBackgroundTheme;
  density?: number;
  speed?: number;
  className?: string;
}

const THEME_PALETTES: Record<WallBackgroundTheme, string[]> = {
  'soho-gold': ['#e5b842', '#f59e0b', '#fbbf24', '#ffffff', '#b45309'],
  'cyber-neon': ['#ec4899', '#06b6d4', '#8b5cf6', '#3b82f6', '#ffffff'],
  'velvet-rose': ['#fb7185', '#f43f5e', '#fda4af', '#fde047', '#ffffff'],
  'midnight-sapphire': ['#38bdf8', '#60a5fa', '#818cf8', '#c084fc', '#ffffff'],
  'disco-fever': ['#ec4899', '#3b82f6', '#eab308', '#a855f7', '#22c55e', '#ffffff'],
  'emerald-stage': ['#10b981', '#34d399', '#6ee7b7', '#e5b842', '#ffffff'],
};

export const ParticleCanvas: React.FC<ParticleCanvasProps> = ({
  color = '#e5b842',
  theme,
  density = 40,
  speed = 1,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const palette = theme ? THEME_PALETTES[theme] : [color];

    // Initialize particles
    const particles = Array.from({ length: density }, () => ({
      x: Math.random() * (canvas.width || 800),
      y: Math.random() * (canvas.height || 600),
      radius: Math.random() * 2.6 + 0.8,
      alpha: Math.random() * 0.7 + 0.2,
      vx: (Math.random() - 0.5) * 0.45 * speed,
      vy: -1 * (Math.random() * 0.65 + 0.25) * speed, // float upwards
      pulseSpeed: Math.random() * 0.02 + 0.005,
      color: palette[Math.floor(Math.random() * palette.length)],
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;
        p.alpha += Math.sin(Date.now() * p.pulseSpeed) * 0.01;

        // Wrap around top or sides
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.12, Math.min(0.95, p.alpha));
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.radius * 3.5;
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color, theme, density, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-10 h-full w-full ${className}`}
    />
  );
};
