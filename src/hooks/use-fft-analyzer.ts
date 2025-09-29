import { useEffect, useRef } from 'react';

export type FFTWindowPreset = 'rectangular' | 'hamming' | 'hann' | 'blackman';

export type FFTOptions = {
  fftSize?: number;
  gain?: number;
  decay?: number;
  smoothingTimeConstant?: number;
  windowFunction?: ((i: number, N: number) => number) | FFTWindowPreset;
};

const windowPresets: Record<FFTWindowPreset, (i: number, N: number) => number> =
  {
    rectangular: () => 1,
    hamming: (i, N) => 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (N - 1)),
    hann: (i, N) => 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1))),
    blackman: (i, N) =>
      0.42 -
      0.5 * Math.cos((2 * Math.PI * i) / (N - 1)) +
      0.08 * Math.cos((4 * Math.PI * i) / (N - 1)),
  };

export function useFFTAnalyzer(
  audioStream: MediaStream | null,
  options: FFTOptions = {}
) {
  const {
    fftSize = 512,
    gain = 1,
    decay = 0.97,
    smoothingTimeConstant = 0.8,
    windowFunction = 'rectangular',
  } = options;

  const dataRef = useRef<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const resolveWindowFn =
    typeof windowFunction === 'string'
      ? windowPresets[windowFunction]
      : windowFunction;

  useEffect(() => {
    if (!audioStream) return;

    const audioContext = new (window.AudioContext ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = smoothingTimeConstant;
    const source = audioContext.createMediaStreamSource(audioStream);
    source.connect(analyser);
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    dataRef.current = dataArray;

    return () => {
      analyser.disconnect();
      source.disconnect();
      audioContext.close();
    };
  }, [audioStream, fftSize, smoothingTimeConstant]);

  const getFrequencyData = () => {
    const analyser = analyserRef.current;
    const dataArray = dataRef.current;
    if (!analyser || !dataArray) return null;

    analyser.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>);
    for (let i = 0; i < dataArray.length; i++) {
      const windowed = dataArray[i] * resolveWindowFn(i, dataArray.length);
      dataArray[i] = Math.max(dataArray[i] * decay, windowed * gain);
    }

    return dataArray;
  };

  return { getFrequencyData };
}
