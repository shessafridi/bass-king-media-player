import { useEffect, useRef } from 'react';
import type { FFTDebugParams } from './debug-panel';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  fftParams: FFTDebugParams;
  getFrequencyData: () => Uint8Array | null;
}

export default function WaveformVisualizer({
  isPlaying,
  fftParams,
  getFrequencyData,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastBassRef = useRef(0);

  // Smoothing buffers for interpolation
  const smoothedDataRef = useRef<Float32Array | null>(null);
  const previousDataRef = useRef<Float32Array | null>(null);
  const smoothingFactor = 0.15; // Lower = more smoothing

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = 0;
    const targetFPS = 60; // Increase back to 60fps for smoothness
    const frameInterval = 1000 / targetFPS;

    const draw = (currentTime: number) => {
      // Throttle to 60fps for smooth animation
      if (currentTime - lastTime < frameInterval) {
        animationId = requestAnimationFrame(draw);
        return;
      }
      lastTime = currentTime;

      const width = (canvas.width = window.innerWidth);
      const height = (canvas.height = window.innerHeight);
      ctx.clearRect(0, 0, width, height);

      if (!isPlaying) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      const freqData = getFrequencyData();
      if (!freqData) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      // Initialize smoothing buffers
      if (!smoothedDataRef.current) {
        smoothedDataRef.current = new Float32Array(freqData.length);
        previousDataRef.current = new Float32Array(freqData.length);
        // Initialize with current data
        for (let i = 0; i < freqData.length; i++) {
          smoothedDataRef.current[i] = freqData[i] / 256;
          previousDataRef.current[i] = freqData[i] / 256;
        }
      }

      // Smooth the frequency data using exponential moving average
      const smoothedData = smoothedDataRef.current;
      const previousData = previousDataRef.current;

      if (smoothedData && previousData) {
        for (let i = 0; i < freqData.length; i++) {
          const currentValue = freqData[i] / 256;
          const previousValue = previousData[i];

          // Exponential moving average for smooth transitions
          smoothedData[i] =
            previousValue + smoothingFactor * (currentValue - previousValue);
          previousData[i] = smoothedData[i];
        }
      }

      const centerY = height / 2;
      const waveformHeight = 20; // Reduced height
      const padding = 0; // Increased padding
      const startX = padding;
      const endX = width - padding;
      const waveformWidth = endX - startX;

      let normalizedBass = lastBassRef.current;

      // Calculate bass using smoothed data for more stable values
      const bassBins = Math.min(5, Math.floor(smoothedData.length * 0.15));
      const bass =
        smoothedData.slice(0, bassBins).reduce((a, b) => a + b, 0) /
        Math.max(1, bassBins);
      normalizedBass = Math.min(1, bass * fftParams.bassSensitivity);
      lastBassRef.current = normalizedBass;

      // Add bass-driven screen shake
      const shakeIntensity = normalizedBass * 20; // Increased shake intensity
      const shakeX = (Math.random() - 0.5) * shakeIntensity;
      const shakeY = (Math.random() - 0.5) * shakeIntensity;
      ctx.translate(shakeX, shakeY);

      // Enhanced waveform with mirrored bass effect
      const layers = [
        { color: 'rgba(0, 255, 255, 0.2)', scale: 0.8, offset: 0 },
        { color: 'rgba(255, 0, 110, 0.25)', scale: 0.9, offset: 2 },
        { color: 'rgba(255, 255, 255, 0.6)', scale: 1.0, offset: 0 },
      ];

      // Optimize waveform resolution for smooth curves
      const stepSize = Math.max(1, Math.floor(waveformWidth / 200)); // More points for smoother curves

      layers.forEach((layer, layerIndex) => {
        ctx.save();
        ctx.strokeStyle = layer.color;
        ctx.lineWidth =
          layerIndex === 2
            ? 1.5 + normalizedBass * 2
            : 0.8 + normalizedBass * 1.2;
        ctx.lineCap = 'round'; // Smooth line caps
        ctx.lineJoin = 'round'; // Smooth line joins

        if (layerIndex === 2) {
          ctx.shadowBlur = 8 + normalizedBass * 15;
          ctx.shadowColor = layer.color;
        }
        // Draw mirrored waveform - top and bottom
        for (let side = 0; side < 2; side++) {
          ctx.beginPath();
          let firstPoint = true;
          let prevY = centerY;

          for (let i = 0; i < waveformWidth; i += stepSize) {
            const dataIndex = Math.floor(
              (i / waveformWidth) * smoothedData.length
            );
            const magnitude =
              smoothedData[(dataIndex + layer.offset) % smoothedData.length];

            // Enhanced bass boost with smoother reactions
            let adjustedMagnitude = magnitude * layer.scale;
            if (dataIndex < smoothedData.length * 0.15) {
              adjustedMagnitude *=
                1 + normalizedBass * fftParams.bassBoost * 0.8;
            }

            // Reduced random variation for smoother appearance
            const randomFactor =
              normalizedBass > 0.5 ? (Math.random() - 0.5) * 0.1 : 0;
            const baseY =
              centerY +
              (adjustedMagnitude * waveformHeight * 0.6 +
                randomFactor * waveformHeight) *
                (Math.random() > 0.5 ? 1 : -1);

            // Mirror the waveform: side 0 = top (negative), side 1 = bottom (positive)
            const y = side === 0 ? centerY - (baseY - centerY) : baseY;
            const x = startX + i;

            if (firstPoint) {
              ctx.moveTo(x, y);
              firstPoint = false;
            } else {
              // Use quadratic curves for smoother interpolation
              const cpX = (x + (startX + (i - stepSize))) / 2;
              const cpY = (y + prevY) / 2;
              ctx.quadraticCurveTo(cpX, cpY, x, y);
            }
            prevY = y;
          }

          ctx.stroke();
        }
        ctx.restore();
      });

      // Simplified glow - only when bass is present
      if (normalizedBass > 0.05) {
        const glowHeight = 25 + normalizedBass * 60; // Much more intense glow
        const glowGradient = ctx.createLinearGradient(
          0,
          centerY - glowHeight,
          0,
          centerY + glowHeight
        );

        // Dynamic color based on bass intensity
        const red = 255;
        const green = 50 + normalizedBass * 205;
        const blue = 255 - normalizedBass * 100;

        glowGradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 0)`);
        glowGradient.addColorStop(
          0.3,
          `rgba(${red}, ${green}, ${blue}, ${normalizedBass * 0.02})`
        );
        glowGradient.addColorStop(
          0.7,
          `rgba(${red}, ${green}, ${blue}, ${normalizedBass * 0.06})`
        );
        glowGradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`);

        ctx.fillStyle = glowGradient;
        ctx.fillRect(
          startX,
          centerY - glowHeight,
          waveformWidth,
          glowHeight * 2
        );
      }

      // Enhanced violent particle effects
      if (normalizedBass > fftParams.bassThreshold) {
        const particleCount = Math.min(20, Math.floor(normalizedBass * 25)); // More particles
        for (let i = 0; i < particleCount; i++) {
          const x = startX + Math.random() * waveformWidth;
          const y = centerY + (Math.random() - 0.5) * waveformHeight * 1.2;
          const size = 1 + normalizedBass * 4 + Math.random() * 3;

          ctx.fillStyle = `rgba(255, ${50 + normalizedBass * 205}, 255, ${
            normalizedBass * 0.8
          })`;
          ctx.shadowBlur = 8 + normalizedBass * 15;
          ctx.shadowColor = 'rgba(255, 100, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw(0);
    return () => cancelAnimationFrame(animationId);
  }, [getFrequencyData, isPlaying, fftParams]);

  return (
    <canvas
      ref={canvasRef}
      className='absolute top-0 left-0 w-full h-full pointer-events-none'
      style={{ zIndex: 1 }} // Behind the trapnation visualizer
    />
  );
}
