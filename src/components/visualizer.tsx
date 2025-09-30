import { useCallback, useEffect, useRef, useState } from 'react';
import type { FFTDebugParams } from './debug-panel';
import logo from '../assets/logo.png';

interface TrapNationStyleVisualizerProps {
  isPlaying: boolean;
  fftParams: FFTDebugParams;
  getFrequencyData: () => Uint8Array | null;
}

export default function TrapNationStyleVisualizer({
  isPlaying,
  fftParams,
  getFrequencyData,
}: TrapNationStyleVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  // Calculate dynamic radius based on screen resolution
  const getDynamicRadius = useCallback(
    (baseRadius: number) => {
      if (screenSize.width === 0 || screenSize.height === 0) return baseRadius;

      // Base resolution is 1920x1080 (1080p)
      const baseWidth = 1920;
      const baseHeight = 1080;

      // Calculate scale factor based on screen area
      const currentArea = screenSize.width * screenSize.height;
      const baseArea = baseWidth * baseHeight;
      const areaScale = Math.sqrt(currentArea / baseArea);

      // Apply scaling with some limits to prevent extreme values
      const scaledRadius = baseRadius * Math.max(0.5, Math.min(2.0, areaScale));

      return Math.round(scaledRadius);
    },
    [screenSize]
  );

  // Load logo image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setLogoImage(img);
    img.src = logo;
  }, []);

  // Detect mobile device and track screen size
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
      setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      const width = (canvas.width = window.innerWidth);
      const height = (canvas.height = window.innerHeight);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Add black radial gradient overlay from center (dark) to edges (transparent)
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.min(width, height) / 2
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)'); // Dark center
      gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)'); // Semi-transparent middle
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Transparent edges
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      if (!isPlaying) {
        // Static visualization when not playing
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = getDynamicRadius(isMobile ? 60 : 100);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        animationId = requestAnimationFrame(draw);
        return;
      }

      const freqData = getFrequencyData();
      if (!freqData) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      const centerX = width / 2;
      const centerY = height / 2;
      // Dynamic radius: scales with screen resolution
      const radius = getDynamicRadius(isMobile ? 240 : 200);

      const drawWaveform = (
        color: string,
        delay: number = 0,
        radiusMultiplier: number = 1,
        bassBoost: boolean = false
      ) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3 + (bassBoost ? normalizedBass * 4 : 0);
        ctx.shadowBlur = 10 + (bassBoost ? normalizedBass * 20 : 0);
        ctx.shadowColor = color;
        ctx.beginPath();

        for (let i = 0; i < freqData.length / 2; i++) {
          const angle = (Math.PI * 2 * i) / (freqData.length / 2);
          let magnitude = freqData[(i + delay) % freqData.length] / 256;

          // Scale magnitude with radius - bigger radius means bigger magnitude
          const radiusScale = (radius * radiusMultiplier) / 200; // Normalize to base radius of 200
          magnitude *= radiusScale;

          // Apply bass boost to lower frequencies
          if (bassBoost && i < freqData.length * 0.1) {
            magnitude *= 1 + normalizedBass * fftParams.bassBoost * 0.2;
          }

          const r =
            radius * radiusMultiplier +
            magnitude * (150 + (bassBoost ? normalizedBass * 100 : 0));
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = color;

        ctx.fill();
      };

      // Enhanced bass analysis - focus on true bass frequencies (20-250Hz)
      // For 44.1kHz sample rate, bass frequencies are roughly in the first 1-6 bins
      const bassBins = Math.min(5, Math.floor(freqData.length * 0.1)); // First 10% of bins
      const subBass =
        freqData
          .slice(0, Math.max(1, Math.floor(bassBins * 0.3)))
          .reduce((a, b) => a + b, 0) / Math.max(1, Math.floor(bassBins * 0.3));
      const midBass =
        freqData
          .slice(Math.floor(bassBins * 0.3), bassBins)
          .reduce((a, b) => a + b, 0) / Math.max(1, Math.floor(bassBins * 0.7));
      const bass = Math.max(subBass, midBass);

      // Use configurable bass sensitivity
      const normalizedBass = Math.min(
        1,
        (bass / 256) * fftParams.bassSensitivity
      );

      // Bass-driven screen shake with enhanced intensity
      const shakeIntensity = normalizedBass * 15;
      const shakeX = (Math.random() - 0.5) * shakeIntensity;
      const shakeY = (Math.random() - 0.5) * shakeIntensity;
      ctx.translate(shakeX, shakeY);

      // Multiple waveform layers with bass responsiveness
      drawWaveform('rgba(0, 255, 0, 0.25)', 16, 1.3);
      drawWaveform('rgba(255, 0, 110, 0.4)', 12, 1.2);
      drawWaveform('rgba(131, 56, 236, 0.55)', 8, 1.1);
      drawWaveform('rgba(255, 255, 255, 0.8)', 0, 1, true); // Main waveform with bass boost

      // Additional bass-driven effects
      if (normalizedBass > fftParams.bassThreshold) {
        // Bass pulse effect - additional ring when bass is strong
        const pulseRadius = radius * 0.8 + normalizedBass * 80;
        const pulseAlpha = normalizedBass * 0.4;
        ctx.strokeStyle = `rgba(255, 100, 255, ${pulseAlpha})`;
        ctx.lineWidth = 2 + normalizedBass * 16;
        ctx.shadowBlur = 15 + normalizedBass * 25;
        ctx.shadowColor = 'rgba(255, 100, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Enhanced center glow effect with bass responsiveness
      const glowRadius = 20 + normalizedBass * 60;
      const glowGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        glowRadius
      );

      // Dynamic color based on bass intensity
      const bassColorIntensity = normalizedBass;
      const red = 255;
      const green = 100 + bassColorIntensity * 155;
      const blue = 255 - bassColorIntensity * 100;

      glowGradient.addColorStop(
        0,
        `rgba(${red}, ${green}, ${blue}, ${0.3 + normalizedBass * 0.4})`
      );
      glowGradient.addColorStop(
        0.5,
        `rgba(${red}, ${green}, ${blue}, ${0.1 + normalizedBass * 0.2})`
      );
      glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(
        centerX - glowRadius,
        centerY - glowRadius,
        glowRadius * 2,
        glowRadius * 2
      );

      // Bass-driven particle effects
      if (normalizedBass > fftParams.bassThreshold + 0.1) {
        const particleCount = Math.floor(normalizedBass * 0);
        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount;
          const distance = radius * 0.5 + normalizedBass * radius * 0.75;
          const x = centerX + Math.cos(angle) * distance;
          const y = centerY + Math.sin(angle) * distance;

          ctx.fillStyle = `rgba(255, ${100 + normalizedBass * 155}, 255, ${
            normalizedBass * 0.8
          })`;
          ctx.shadowBlur = 10 + normalizedBass * 15;
          ctx.shadowColor = 'rgba(255, 100, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(x, y, 2 + normalizedBass * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw logo with bass shake effects
      if (logoImage) {
        ctx.save();

        // Apply additional bass shake to logo (on top of the global shake)
        const logoShakeIntensity = normalizedBass * 8;
        const logoShakeX = (Math.random() - 0.5) * logoShakeIntensity;
        const logoShakeY = (Math.random() - 0.5) * logoShakeIntensity;
        ctx.translate(logoShakeX, logoShakeY);

        // Logo size with bass responsiveness
        const logoSize = radius * 2 + normalizedBass * 10;
        const logoX = centerX - logoSize / 2;
        const logoY = centerY - logoSize / 2;

        // Add glow effect to logo when bass is strong
        if (normalizedBass > fftParams.bassThreshold) {
          ctx.shadowBlur = 15 + normalizedBass * 25;
          ctx.shadowColor = `rgba(255, ${100 + normalizedBass * 155}, 255, ${
            normalizedBass * 0.6
          })`;
        }

        // Draw the logo
        ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);

        ctx.restore();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [
    getFrequencyData,
    isPlaying,
    fftParams,
    logoImage,
    isMobile,
    getDynamicRadius,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className='absolute top-0 left-0 w-full h-full pointer-events-none'
    />
  );
}
