import { useEffect, useRef } from 'react';
import type { FFTDebugParams } from './debug-panel';
import bg from '../assets/bg.jpg';

interface BassBackgroundProps {
  isPlaying: boolean;
  fftParams: FFTDebugParams;
  getFrequencyData: () => Uint8Array | null;
}

export default function BassBackground({
  isPlaying,
  fftParams,
  getFrequencyData,
}: BassBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId: number;
    let lastUpdate = 0;
    const updateInterval = 1000 / 30; // 30 FPS instead of 60 FPS

    const updateBackground = (timestamp: number) => {
      // Throttle updates to 30 FPS for better performance
      if (timestamp - lastUpdate < updateInterval) {
        animationId = requestAnimationFrame(updateBackground);
        return;
      }
      lastUpdate = timestamp;

      if (!isPlaying) {
        // Reset to base brightness when not playing
        container.style.filter = 'brightness(0.3)';
        container.style.transform = 'translate(0, 0)';
        animationId = requestAnimationFrame(updateBackground);
        return;
      }

      const freqData = getFrequencyData();
      if (!freqData) {
        animationId = requestAnimationFrame(updateBackground);
        return;
      }

      // Simplified bass analysis - only check first few bins for performance
      const bassBins = Math.min(4, Math.floor(freqData.length * 0.1));
      let bassSum = 0;
      for (let i = 0; i < bassBins; i++) {
        bassSum += freqData[i];
      }
      const bass = bassSum / bassBins;

      // Simplified normalization
      const normalizedBass = Math.min(
        1,
        (bass / 256) * fftParams.bassSensitivity
      );

      // Simplified brightness calculation
      const baseBrightness = 0.3;
      const maxBrightness = 0.8;
      const brightness =
        baseBrightness + normalizedBass * (maxBrightness - baseBrightness);

      let transform = '';
      // Exponential curve: low bass = minimal shake, high bass = dramatic shake
      const shakeIntensity = Math.pow(normalizedBass, 2.5) * 15;
      const shakeX = (Math.random() - 0.5) * shakeIntensity;
      const shakeY = (Math.random() - 0.5) * shakeIntensity;
      transform = `translate(${shakeX}px, ${shakeY}px)`;

      // Apply effects
      container.style.filter = `brightness(${brightness})`;
      container.style.transform = transform;

      animationId = requestAnimationFrame(updateBackground);
    };

    updateBackground(0);
    return () => cancelAnimationFrame(animationId);
  }, [getFrequencyData, isPlaying, fftParams]);

  return (
    <div
      ref={containerRef}
      className='absolute inset-0 w-full h-full overflow-hidden'
    >
      <img
        src={bg}
        alt='Background'
        className='w-full h-full object-cover transition-all duration-[50px] scale-105'
        style={{
          animation: 'sway 8s ease-in-out infinite',
        }}
      />
    </div>
  );
}
