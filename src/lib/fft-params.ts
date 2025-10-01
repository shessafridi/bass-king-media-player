import type { FFTDebugParams } from '../components/debug-panel';

export const getDefaultFFTParams = (): FFTDebugParams => {
  return {
    fftSize: 4096,
    gain: 1,
    decay: 0.99,
    smoothingTimeConstant: 0.75,
    windowFunction: 'blackman',
    bassSensitivity: 2.2,
    bassBoost: 2.0,
    bassThreshold: 0.3,
  };
};
