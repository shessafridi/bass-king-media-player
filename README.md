# 🎶 Bass King Media Player

_Powered by Soundkeys DSP_

Bass King is a **real-time, display-native audio visualizer and media player** built with React + HTML Canvas.  
Unlike traditional After Effects workflows that require hours of rendering and suffer from video compression, Bass King brings your music to life **instantly**, at your monitor’s refresh rate, artifact-free.

Bass King isn’t just a visualizer — it’s a stage for your music.

---

## ✨ Features

- ⚡ **Real-Time Rendering**  
  Visuals are generated live — no rendering, no exporting.

- 🖥 **Display-Native Performance**  
  Automatically syncs to your monitor’s refresh rate and resolution (1080p, 1440p, 4K, ultrawide, 240Hz).

- 🔊 **Powered by Soundkeys DSP**  
  Custom-built FFT engine with configurable gain, smoothing, and frequency band controls.

- 🎭 **Dynamic Effects**  
  Visuals that react directly to audio events:

  - _Twitch_ → violent screen shake on bass hits.
  - _Power Surge_ → background flashes with bass intensity.
  - _Particular_ → dust particle system with emission tied to beat hits.
  - _Motion Blur_ → adds smoothness and cinematic trails.

- 🎧 **Audio-Reactive Soul**  
  Every playback is unique — effects breathe with the music instead of looping a pre-render.

---

## 🛠 Tech Stack

- **React** (UI + orchestration)
- **HTML Canvas** (real-time rendering)
- **Electron (planned)** for standalone desktop builds with system loopback support

---

## 🚀 Roadmap

- 🎚 Configurable bandpass filters with smooth edge fading
- 🥁 Beat hit detection with pre-computed event markers for optimal performance
- 🎛 EQ, filters, and audio FX support (beyond analysis → true DSP playground)
- 📦 Packaged **Soundkeys DSP** as a reusable npm library
- 🖥 Desktop standalone app (Electron) for system-wide audio visualization

---

## 🎨 Why Bass King?

Traditional visualizers are static, old-school (Windows XP vibes), and disconnected from the music. After Effects workflows look nice but take hours to render and end up crushed by video compression.

**Bass King is alive.**

- Fluid at your refresh rate.
- Crisp with no compression artifacts.
- Dynamic and unique on every playback.

Your music deserves more than a waveform. It deserves a stage.

---

## 📦 Installation

```bash
# Clone repo
git clone https://github.com/shessafridi/bass-king-media-player.git

# Install dependencies
npm install

# Run dev server
npm run dev
```

## 📜 License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0)**.

You are free to:

- Share — copy and redistribute the material in any medium or format.
- Adapt — remix, transform, and build upon the material.

Under the following terms:

- Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
- NonCommercial — You may not use the material for commercial purposes.

For the full license text, see [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
