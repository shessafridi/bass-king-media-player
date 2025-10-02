import { Analytics } from '@vercel/analytics/react';
import MediaPlayer from './components/media-player';

function App() {
  return (
    <>
      <MediaPlayer />
      <Analytics />
    </>
  );
}

export default App;
