import { useState, useRef, useEffect } from 'react';
import TrapNationStyleVisualizer from './visualizer';

interface MediaPlayerProps {
  className?: string;
}

export default function MediaPlayer({ className = '' }: MediaPlayerProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      setError(null);
      setIsLoading(true);

      // Create audio element
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audioRef.current = audio;

      // Set up audio event listeners
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
        setIsLoading(false);
      });

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      audio.addEventListener('error', () => {
        setError('Failed to load audio file');
        setIsLoading(false);
      });
    } else {
      setError('Please select a valid audio file');
    }
  };

  // Create audio stream for visualizer
  useEffect(() => {
    if (audioRef.current && !audioContextRef.current) {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaElementSource(audioRef.current);
      sourceRef.current = source;

      // Create a MediaStreamDestination to get a MediaStream
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      source.connect(audioContext.destination); // Also connect to speakers

      setAudioStream(destination.stream);
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        sourceRef.current = null;
      }
    };
  }, [audioFile]);

  // Play/pause functionality
  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        setError('Failed to play audio');
      }
    }
  };

  // Handle progress bar click
  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle volume change
  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Format time helper
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 ${className}`}
    >
      {/* Visualizer Background */}
      {audioStream && (
        <div className='absolute inset-0'>
          <TrapNationStyleVisualizer audioStream={audioStream} />
        </div>
      )}

      {/* Main Content */}
      <div className='relative z-10 flex flex-col items-center justify-center min-h-screen p-8'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-6xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent'>
            TrapNation Player
          </h1>
          <p className='text-xl text-gray-300'>
            Drop your beats and feel the rhythm
          </p>
        </div>

        {/* File Selection */}
        <div className='bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-2xl'>
          <div className='text-center'>
            <div className='mb-6'>
              <label
                htmlFor='audio-file'
                className='block text-white text-lg font-semibold mb-4'
              >
                Select Audio File
              </label>
              <input
                id='audio-file'
                type='file'
                accept='audio/*'
                onChange={handleFileSelect}
                className='hidden'
              />
              <label
                htmlFor='audio-file'
                className='inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl cursor-pointer hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105'
              >
                <svg
                  className='w-6 h-6 mr-3'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                  />
                </svg>
                Choose Audio File
              </label>
            </div>

            {audioFile && (
              <div className='text-white'>
                <p className='text-lg font-medium'>Now Playing:</p>
                <p className='text-gray-300 truncate max-w-md'>
                  {audioFile.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className='bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 text-red-200'>
            {error}
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className='flex items-center space-x-2 text-white mb-6'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-white'></div>
            <span>Loading audio...</span>
          </div>
        )}

        {/* Audio Controls */}
        {audioFile && !isLoading && (
          <div className='bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-2xl border border-white/20 shadow-2xl'>
            {/* Progress Bar */}
            <div className='mb-6'>
              <div
                className='w-full h-2 bg-white/20 rounded-full cursor-pointer hover:h-3 transition-all duration-200'
                onClick={handleProgressClick}
              >
                <div
                  className='h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full transition-all duration-200'
                  style={{
                    width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className='flex justify-between text-white text-sm mt-2'>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className='flex items-center justify-center space-x-6 mb-6'>
              <button
                onClick={togglePlayPause}
                className='w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white hover:from-pink-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110'
              >
                {isPlaying ? (
                  <svg
                    className='w-8 h-8'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M6 4h4v16H6V4zm8 0h4v16h-4V4z' />
                  </svg>
                ) : (
                  <svg
                    className='w-8 h-8 ml-1'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M8 5v14l11-7z' />
                  </svg>
                )}
              </button>
            </div>

            {/* Volume Control */}
            <div className='flex items-center space-x-4'>
              <svg
                className='w-6 h-6 text-white'
                fill='currentColor'
                viewBox='0 0 24 24'
              >
                <path d='M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z' />
              </svg>
              <input
                type='range'
                min='0'
                max='1'
                step='0.01'
                value={volume}
                onChange={handleVolumeChange}
                className='flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider'
              />
              <span className='text-white text-sm w-12'>
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!audioFile && (
          <div className='text-center text-white/70 mt-8'>
            <p className='text-lg'>
              Upload an audio file to start the visualizer
            </p>
            <p className='text-sm mt-2'>
              Supports MP3, WAV, OGG, and other audio formats
            </p>
          </div>
        )}
      </div>

      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #ec4899, #8b5cf6);
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #ec4899, #8b5cf6);
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
