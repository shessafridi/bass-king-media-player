import type { FFTDebugParams } from '../components/debug-panel';

export const getDefaultFFTParams = (): FFTDebugParams => {
  return {
    fftSize: 4096,
    gain: 1,
    decay: 0.8,
    smoothingTimeConstant: 0.8,
    windowFunction: 'blackman',
    bassSensitivity: 2.4,
    bassBoost: 2.0,
    bassThreshold: 0.3,
  };
};
