import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Upload, Music } from 'lucide-react';
import TrapNationStyleVisualizer from './visualizer';
import BassBackground from './bass-background';
import DebugPanel, { type FFTDebugParams } from './debug-panel';
import { useFFTAnalyzer } from '../hooks/use-fft-analyzer';

export default function MediaPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [fftParams, setFftParams] = useState<FFTDebugParams>({
    fftSize: 4096,
    gain: 1.2,
    decay: 0.95,
    smoothingTimeConstant: 0.8,
    windowFunction: 'blackman',
    bassSensitivity: 2.5,
    bassBoost: 2.0,
    bassThreshold: 0.3,
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const visualizationAudioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single FFT analyzer for both visualizers
  const { getFrequencyData } = useFFTAnalyzer(audioStream, {
    fftSize: fftParams.fftSize,
    gain: fftParams.gain,
    decay: fftParams.decay,
    smoothingTimeConstant: fftParams.smoothingTimeConstant,
    windowFunction: fftParams.windowFunction,
  });

  // Calculate dynamic volume based on FFT size
  const calculateVisualizationVolume = (fftSize: number): number => {
    if (fftSize === 4096) {
      return 0.07;
    }
    if (fftSize === 2048) {
      return 0.04;
    }
    if (fftSize === 1024) {
      return 0.02;
    }
    if (fftSize === 512) {
      return 0.01;
    }
    if (fftSize === 256) {
      return 0.005;
    }
    if (fftSize === 128) {
      return 0.0025;
    }
    // Base volume for 4096 FFT size
    const baseVolume = 0.07;
    const baseFftSize = 4096;

    // Scale volume inversely with FFT size
    // Smaller FFT sizes need less volume to avoid overwhelming the visualization
    const volumeScale = baseFftSize / fftSize;
    return Math.max(0.01, Math.min(0.5, baseVolume * volumeScale));
  };

  // Create audio stream for visualizer from visualization-only audio
  useEffect(() => {
    if (visualizationAudioRef.current && audioFile) {
      const audioContext = new (window.AudioContext ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(
        visualizationAudioRef.current
      );
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      setAudioStream(destination.stream);
    }
  }, [audioFile]);

  // Update visualization volume when FFT size changes
  useEffect(() => {
    if (visualizationAudioRef.current) {
      const calculatedVolume = calculateVisualizationVolume(fftParams.fftSize);
      console.log('calculatedVolume', calculatedVolume);
      visualizationAudioRef.current.volume = calculatedVolume;
    }
  }, [fftParams.fftSize]);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }
      if (visualizationAudioRef.current) {
        visualizationAudioRef.current.src = url;
        visualizationAudioRef.current.load();
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const togglePlay = () => {
    if (!audioRef.current || !visualizationAudioRef.current || !audioFile)
      return;

    if (isPlaying) {
      audioRef.current.pause();
      visualizationAudioRef.current.pause();
    } else {
      audioRef.current.play();
      visualizationAudioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !visualizationAudioRef.current || !duration)
      return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    audioRef.current.currentTime = newTime;
    visualizationAudioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className='relative w-full h-screen bg-black overflow-hidden'>
      {/* Bass-responsive background */}
      <BassBackground
        isPlaying={isPlaying}
        fftParams={fftParams}
        getFrequencyData={getFrequencyData}
      />

      {/* <WaveformVisualizer
        isPlaying={isPlaying}
        fftParams={fftParams}
        getFrequencyData={getFrequencyData}
      /> */}
      <TrapNationStyleVisualizer
        isPlaying
        fftParams={fftParams}
        getFrequencyData={getFrequencyData}
      />

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className='hidden'
      />

      {/* Visualization-only audio element - hidden but not muted for FFT analysis */}
      <audio ref={visualizationAudioRef} className='hidden' />

      {/* File Drop Zone */}
      {!audioFile && (
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            isDragOver ? 'bg-blue-900/50' : 'bg-black/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className='text-center p-8 border-2 border-dashed border-gray-500 rounded-2xl backdrop-blur-md bg-black/30'>
            <Music className='w-16 h-16 mx-auto mb-4 text-gray-400' />
            <h2 className='text-2xl font-bold text-white mb-2'>
              Drop Your Music Here
            </h2>
            <p className='text-gray-400 mb-6'>or click to browse files</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className='px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-white font-semibold hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 flex items-center gap-2 mx-auto'
            >
              <Upload className='w-5 h-5' />
              Choose File
            </button>
          </div>
        </div>
      )}

      {/* Media Controls */}
      {audioFile && (
        <div className='absolute bottom-0 left-0 right-0 p-6'>
          <div className='bg-black/60 backdrop-blur-lg rounded-2xl p-6 border border-white/10'>
            {/* Song Info */}
            <div className='mb-4'>
              <h3 className='text-white font-semibold truncate'>
                {audioFile.name}
              </h3>
            </div>

            {/* Progress Bar */}
            <div className='mb-4'>
              <div
                className='w-full h-2 bg-gray-700 rounded-full cursor-pointer group'
                onClick={handleSeek}
              >
                <div
                  className='h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full relative transition-all duration-100 group-hover:from-cyan-300 group-hover:to-purple-300'
                  style={{ width: `${progress}%` }}
                >
                  <div className='absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity' />
                </div>
              </div>
              <div className='flex justify-between text-sm text-gray-400 mt-2'>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <button
                  onClick={togglePlay}
                  className='w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white hover:from-cyan-400 hover:to-purple-400 transition-all duration-300 hover:scale-105'
                >
                  {isPlaying ? (
                    <Pause className='w-6 h-6' />
                  ) : (
                    <Play className='w-6 h-6 ml-1' />
                  )}
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className='px-4 py-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all duration-300'
                >
                  <Upload className='w-4 h-4' />
                </button>
              </div>

              {/* Volume Control */}
              <div className='flex items-center gap-3'>
                <button
                  onClick={toggleMute}
                  className='text-white hover:text-gray-300 transition-colors'
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className='w-5 h-5' />
                  ) : (
                    <Volume2 className='w-5 h-5' />
                  )}
                </button>
                <input
                  type='range'
                  min='0'
                  max='1'
                  step='0.01'
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className='w-24 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer slider'
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type='file'
        accept='audio/*'
        onChange={handleFileInput}
        className='hidden'
      />

      {/* Debug Panel */}
      <DebugPanel
        params={fftParams}
        onParamsChange={setFftParams}
        isVisible={showDebugPanel}
        onToggle={() => setShowDebugPanel(!showDebugPanel)}
      />
    </div>
  );
}
