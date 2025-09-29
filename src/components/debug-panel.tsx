import { Settings, X } from 'lucide-react';

export interface FFTDebugParams {
  fftSize: number;
  gain: number;
  decay: number;
  smoothingTimeConstant: number;
  windowFunction: 'rectangular' | 'hamming' | 'hann' | 'blackman';
  bassSensitivity: number;
  bassBoost: number;
  bassThreshold: number;
}

interface DebugPanelProps {
  params: FFTDebugParams;
  onParamsChange: (params: FFTDebugParams) => void;
  isVisible: boolean;
  onToggle: () => void;
}

export default function DebugPanel({
  params,
  onParamsChange,
  isVisible,
  onToggle,
}: DebugPanelProps) {
  const handleParamChange = (
    key: keyof FFTDebugParams,
    value: number | string
  ) => {
    onParamsChange({
      ...params,
      [key]: value,
    });
  };

  const resetToDefaults = () => {
    onParamsChange({
      fftSize: 4096,
      gain: 1.2,
      decay: 0.95,
      smoothingTimeConstant: 0.8,
      windowFunction: 'blackman',
      bassSensitivity: 2.5,
      bassBoost: 2.0,
      bassThreshold: 0.3,
    });
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className='fixed top-4 right-4 z-50 p-3 bg-black/60 backdrop-blur-lg rounded-full border border-white/20 text-white hover:bg-black/80 transition-all duration-300'
        title='Open Debug Panel'
      >
        <Settings className='w-5 h-5' />
      </button>
    );
  }

  return (
    <div className='fixed top-4 right-4 z-50 w-80 bg-black/80 backdrop-blur-lg rounded-2xl border border-white/20 p-6 text-white'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold'>FFT Debug Panel</h3>
        <div className='flex gap-2'>
          <button
            onClick={resetToDefaults}
            className='px-3 py-1 text-xs bg-white/10 rounded-full hover:bg-white/20 transition-colors'
          >
            Reset
          </button>
          <button
            onClick={onToggle}
            className='p-1 hover:bg-white/10 rounded-full transition-colors'
          >
            <X className='w-4 h-4' />
          </button>
        </div>
      </div>

      <div className='space-y-4'>
        {/* FFT Size */}
        <div>
          <label className='block text-sm font-medium mb-2'>FFT Size</label>
          <select
            value={params.fftSize}
            onChange={e =>
              handleParamChange('fftSize', parseInt(e.target.value))
            }
            className='w-full p-2 bg-white/10 rounded-lg border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400'
          >
            <option className='text-black' value={128}>
              128 (64 bins)
            </option>
            <option className='text-black' value={256}>
              256 (128 bins)
            </option>
            <option className='text-black' value={512}>
              512 (256 bins)
            </option>
            <option className='text-black' value={1024}>
              1024 (512 bins)
            </option>
            <option className='text-black' value={2048}>
              2048 (1024 bins)
            </option>
            <option className='text-black' value={4096}>
              4096 (2048 bins)
            </option>
          </select>
        </div>

        {/* Gain */}
        <div>
          <label className='block text-sm font-medium mb-2'>
            Gain: {params.gain.toFixed(2)}
          </label>
          <input
            type='range'
            min='0.1'
            max='3.0'
            step='0.1'
            value={params.gain}
            onChange={e =>
              handleParamChange('gain', parseFloat(e.target.value))
            }
            className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider'
          />
          <div className='flex justify-between text-xs text-gray-400 mt-1'>
            <span>0.1</span>
            <span>3.0</span>
          </div>
        </div>

        {/* Decay */}
        <div>
          <label className='block text-sm font-medium mb-2'>
            Decay: {params.decay.toFixed(3)}
          </label>
          <input
            type='range'
            min='0.8'
            max='0.99'
            step='0.01'
            value={params.decay}
            onChange={e =>
              handleParamChange('decay', parseFloat(e.target.value))
            }
            className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider'
          />
          <div className='flex justify-between text-xs text-gray-400 mt-1'>
            <span>0.8</span>
            <span>0.99</span>
          </div>
        </div>

        {/* Smoothing Time Constant */}
        <div>
          <label className='block text-sm font-medium mb-2'>
            Smoothing: {params.smoothingTimeConstant.toFixed(2)}
          </label>
          <input
            type='range'
            min='0'
            max='1'
            step='0.1'
            value={params.smoothingTimeConstant}
            onChange={e =>
              handleParamChange(
                'smoothingTimeConstant',
                parseFloat(e.target.value)
              )
            }
            className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider'
          />
          <div className='flex justify-between text-xs text-gray-400 mt-1'>
            <span>0</span>
            <span>1</span>
          </div>
        </div>

        {/* Window Function */}
        <div>
          <label className='block text-sm font-medium mb-2'>
            Window Function
          </label>
          <select
            value={params.windowFunction}
            onChange={e =>
              handleParamChange(
                'windowFunction',
                e.target.value as FFTDebugParams['windowFunction']
              )
            }
            className='w-full p-2 bg-white/10 rounded-lg border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400'
          >
            <option className='text-black' value='rectangular'>
              Rectangular
            </option>
            <option className='text-black' value='hamming'>
              Hamming
            </option>
            <option className='text-black' value='hann'>
              Hann
            </option>
            <option className='text-black' value='blackman'>
              Blackman
            </option>
          </select>
        </div>

        {/* Bass Controls Section */}
        <div className='pt-4 border-t border-white/10'>
          <h4 className='text-sm font-medium mb-3 text-cyan-400'>
            Bass Controls
          </h4>

          {/* Bass Sensitivity */}
          <div className='mb-4'>
            <label className='block text-sm font-medium mb-2'>
              Bass Sensitivity: {params.bassSensitivity.toFixed(1)}x
            </label>
            <input
              type='range'
              min='0.5'
              max='5.0'
              step='0.1'
              value={params.bassSensitivity}
              onChange={e =>
                handleParamChange('bassSensitivity', parseFloat(e.target.value))
              }
              className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider'
            />
            <div className='flex justify-between text-xs text-gray-400 mt-1'>
              <span>0.5x</span>
              <span>5.0x</span>
            </div>
          </div>

          {/* Bass Boost */}
          <div className='mb-4'>
            <label className='block text-sm font-medium mb-2'>
              Bass Boost: {params.bassBoost.toFixed(1)}x
            </label>
            <input
              type='range'
              min='1.0'
              max='4.0'
              step='0.1'
              value={params.bassBoost}
              onChange={e =>
                handleParamChange('bassBoost', parseFloat(e.target.value))
              }
              className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider'
            />
            <div className='flex justify-between text-xs text-gray-400 mt-1'>
              <span>1.0x</span>
              <span>4.0x</span>
            </div>
          </div>

          {/* Bass Threshold */}
          <div className='mb-4'>
            <label className='block text-sm font-medium mb-2'>
              Bass Threshold: {params.bassThreshold.toFixed(2)}
            </label>
            <input
              type='range'
              min='0.1'
              max='0.8'
              step='0.05'
              value={params.bassThreshold}
              onChange={e =>
                handleParamChange('bassThreshold', parseFloat(e.target.value))
              }
              className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider'
            />
            <div className='flex justify-between text-xs text-gray-400 mt-1'>
              <span>0.1</span>
              <span>0.8</span>
            </div>
          </div>
        </div>

        {/* Real-time Info */}
        <div className='pt-4 border-t border-white/10'>
          <h4 className='text-sm font-medium mb-2'>Current Settings</h4>
          <div className='text-xs space-y-1 text-gray-300'>
            <div>
              FFT Size: {params.fftSize} ({(params.fftSize / 2).toFixed(0)}{' '}
              bins)
            </div>
            <div>Gain: {params.gain.toFixed(2)}x</div>
            <div>Decay: {params.decay.toFixed(3)}</div>
            <div>Smoothing: {params.smoothingTimeConstant.toFixed(2)}</div>
            <div>Window: {params.windowFunction}</div>
            <div className='pt-2 border-t border-white/5'>
              <div className='text-cyan-400 font-medium'>Bass Settings:</div>
              <div>Bass Sensitivity: {params.bassSensitivity.toFixed(1)}x</div>
              <div>Bass Boost: {params.bassBoost.toFixed(1)}x</div>
              <div>Bass Threshold: {params.bassThreshold.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
