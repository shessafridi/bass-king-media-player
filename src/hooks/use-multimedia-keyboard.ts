import { useEffect, useCallback, useRef } from 'react';

export type MediaAction =
  | 'play-pause'
  | 'play'
  | 'pause'
  | 'stop'
  | 'mute'
  | 'volume-up'
  | 'volume-down'
  | 'seek-forward'
  | 'seek-backward'
  | 'next-track'
  | 'previous-track'
  | 'fullscreen';

interface MediaKeyboardHandlers {
  onPlayPause?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onMute?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
  onSeekForward?: () => void;
  onSeekBackward?: () => void;
  onNextTrack?: () => void;
  onPreviousTrack?: () => void;
  onFullscreen?: () => void;
}

interface UseMediaKeyboardOptions extends MediaKeyboardHandlers {
  enabled?: boolean;
  preventDefault?: boolean;
  targetRef?: React.RefObject<HTMLElement>;
}

/**
 * Hook to capture keyboard input for media player controls
 * Supports standard keys and dedicated multimedia keys for accessibility
 */
export function useMultiMediaKeyboard(options: UseMediaKeyboardOptions = {}) {
  const {
    enabled = true,
    preventDefault = true,
    targetRef,
    onPlayPause,
    onPlay,
    onPause,
    onStop,
    onMute,
    onVolumeUp,
    onVolumeDown,
    onSeekForward,
    onSeekBackward,
    onNextTrack,
    onPreviousTrack,
    onFullscreen,
  } = options;

  const handlersRef = useRef({
    onPlayPause,
    onPlay,
    onPause,
    onStop,
    onMute,
    onVolumeUp,
    onVolumeDown,
    onSeekForward,
    onSeekBackward,
    onNextTrack,
    onPreviousTrack,
    onFullscreen,
  });

  useEffect(() => {
    handlersRef.current = {
      onPlayPause,
      onPlay,
      onPause,
      onStop,
      onMute,
      onVolumeUp,
      onVolumeDown,
      onSeekForward,
      onSeekBackward,
      onNextTrack,
      onPreviousTrack,
      onFullscreen,
    };
  }, [
    onPlayPause,
    onPlay,
    onPause,
    onStop,
    onMute,
    onVolumeUp,
    onVolumeDown,
    onSeekForward,
    onSeekBackward,
    onNextTrack,
    onPreviousTrack,
    onFullscreen,
  ]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const target = e.target as HTMLElement;
      const isInputField =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
        target.isContentEditable;

      if (isInputField && !e.key.startsWith('Media')) return;

      const handlers = handlersRef.current;
      let handled = false;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'MediaPlayPause':
          handlers.onPlayPause?.();
          handled = true;
          break;

        case 'MediaPlay':
          handlers.onPlay?.();
          handled = true;
          break;

        case 'MediaPause':
          handlers.onPause?.();
          handled = true;
          break;

        case 'MediaStop':
          handlers.onStop?.();
          handled = true;
          break;

        case 'm':
        case 'MediaVolumeMute':
          handlers.onMute?.();
          handled = true;
          break;

        case 'ArrowUp':
        case 'MediaVolumeUp':
          handlers.onVolumeUp?.();
          handled = true;
          break;

        case 'ArrowDown':
        case 'MediaVolumeDown':
          handlers.onVolumeDown?.();
          handled = true;
          break;

        case 'ArrowRight':
        case 'l':
        case 'MediaFastForward':
          handlers.onSeekForward?.();
          handled = true;
          break;

        case 'ArrowLeft':
        case 'j':
        case 'MediaRewind':
          handlers.onSeekBackward?.();
          handled = true;
          break;

        case 'MediaTrackNext':
        case 'n':
          handlers.onNextTrack?.();
          handled = true;
          break;

        case 'MediaTrackPrevious':
        case 'p':
          handlers.onPreviousTrack?.();
          handled = true;
          break;

        case 'f':
          handlers.onFullscreen?.();
          handled = true;
          break;
      }

      if (handled && preventDefault) {
        e.preventDefault();
      }
    },
    [enabled, preventDefault]
  );

  useEffect(() => {
    if (!enabled) return;

    const target = targetRef?.current || window;

    target.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [enabled, handleKeyDown, targetRef]);
}
