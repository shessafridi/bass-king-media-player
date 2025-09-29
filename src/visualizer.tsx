import { useEffect, useRef } from 'react';
import { useFFTAnalyzer } from './use-fft-analyzer';

export default function TrapNationStyleVisualizer({
  audioStream,
}: {
  audioStream: MediaStream;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getFrequencyData } = useFFTAnalyzer(audioStream, {
    fftSize: 512,
    gain: 1.2,
    decay: 0.95,
    windowFunction: 'hamming',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      const freqData = getFrequencyData();
      if (!freqData) return;

      const width = (canvas.width = window.innerWidth);
      const height = (canvas.height = window.innerHeight);
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = 100;

      const drawWaveform = (color: string, delay: number = 0) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < freqData.length / 2; i++) {
          const angle = (Math.PI * i) / (freqData.length / 2);
          const magnitude = freqData[(i + delay) % freqData.length] / 256;
          const r = radius + magnitude * 100;
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (let i = freqData.length / 2 - 1; i >= 0; i--) {
          const angle = (Math.PI * i) / (freqData.length / 2);
          const magnitude = freqData[(i + delay) % freqData.length] / 256;
          const r = radius + magnitude * 100;
          const x = centerX + r * Math.cos(-angle);
          const y = centerY + r * Math.sin(-angle);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      };

      const bass = freqData.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
      const shakeX = (Math.random() - 0.5) * bass * 0.5;
      const shakeY = (Math.random() - 0.5) * bass * 0.5;
      ctx.translate(shakeX, shakeY);

      drawWaveform('rgba(255, 0, 0, 0.2)', 12);
      drawWaveform('rgba(0, 255, 0, 0.2)', 8);
      drawWaveform('rgba(0, 0, 255, 0.2)', 4);
      drawWaveform('#FFFFFF', 0);

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [getFrequencyData]);

  return (
    <div className='relative w-full h-full'>
      <canvas ref={canvasRef} className='absolute top-0 left-0 w-full h-full' />
      <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
        <div className='w-24 h-24 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center shadow-2xl'>
          <span className='text-white font-bold text-2xl'>TN</span>
        </div>
      </div>
    </div>
  );
}
