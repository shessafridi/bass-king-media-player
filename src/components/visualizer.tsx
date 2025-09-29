import React, { useEffect, useRef } from 'react';
import { useFFTAnalyzer } from '../hooks/use-fft-analyzer';

interface TrapNationStyleVisualizerProps {
  audioStream: MediaStream | null;
  isPlaying: boolean;
}

export default function TrapNationStyleVisualizer({
  audioStream,
  isPlaying,
}: TrapNationStyleVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getFrequencyData } = useFFTAnalyzer(audioStream, {
    fftSize: 512,
    gain: 1.2,
    decay: 0.95,
    windowFunction: 'blackman',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      const width = (canvas.width = window.innerWidth);
      const height = (canvas.height = window.innerHeight);
      ctx.clearRect(0, 0, width, height);

      // Background gradient
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.min(width, height) / 2
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      if (!isPlaying || !audioStream) {
        // Static visualization when not playing
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = 120;

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
      const radius = 120;

      const drawWaveform = (
        color: string,
        delay: number = 0,
        radiusMultiplier: number = 1
      ) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.beginPath();

        for (let i = 0; i < freqData.length / 2; i++) {
          const angle = (Math.PI * 2 * i) / (freqData.length / 2);
          const magnitude = freqData[(i + delay) % freqData.length] / 256;
          const r = radius * radiusMultiplier + magnitude * 150;
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      };

      // Bass-driven screen shake
      const bass = freqData.slice(0, 15).reduce((a, b) => a + b, 0) / 15;
      const shakeIntensity = (bass / 256) * 8;
      const shakeX = (Math.random() - 0.5) * shakeIntensity;
      const shakeY = (Math.random() - 0.5) * shakeIntensity;
      ctx.translate(shakeX, shakeY);

      // Multiple waveform layers
      drawWaveform('rgba(0, 255, 255, 0.15)', 16, 1.3);
      drawWaveform('rgba(255, 0, 110, 0.2)', 12, 1.2);
      drawWaveform('rgba(131, 56, 236, 0.25)', 8, 1.1);
      drawWaveform('rgba(255, 255, 255, 0.8)', 0, 1);

      // Center glow effect
      const glowRadius = 20 + (bass / 256) * 40;
      const glowGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        glowRadius
      );
      glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
      glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(
        centerX - glowRadius,
        centerY - glowRadius,
        glowRadius * 2,
        glowRadius * 2
      );

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [getFrequencyData, isPlaying, audioStream]);

  return (
    <canvas
      ref={canvasRef}
      className='absolute top-0 left-0 w-full h-full pointer-events-none'
    />
  );
}
