# Typing ASMR

A browser-based typing simulator that plays mechanical keyboard sounds as it "types" your text. Built for relaxation, focus, or background noise.

## Features

- **Realistic typing rhythm** - speed drifts naturally within a configurable WPM range, with pauses at punctuation and paragraph breaks
- **Mechanical keyboard sounds** - multiple switch profiles (hi75, halo, uhk, asus, etc.) with per-paragraph sound cycling or randomization
- **Space-bar variants** - dedicated space-bar sounds for supported keyboards
- **Believable typos** - occasional wrong key, backspace, and retry (toggleable)
- **Pitch wobble & volume control** - subtle variation so it doesn't feel robotic
- **Keyboard-driven** - space/enter to pause/resume, escape to reset

## Getting Started

```bash
# install dependencies
bun install

# dev server
bun run dev

# production build
bun run build

# preview build
bun run preview
```

## Usage

1. Paste text into the textarea (blank lines = paragraph breaks)
2. Adjust speed range, sound selection, volume, and pitch wobble
3. Click **Start typing** - the page types your text with sound
4. **Pause/Resume** or **Reset** anytime

### Keyboard shortcuts (while typing)

| Key | Action |
|-----|--------|
| Space / Enter | Pause / Resume |
| Escape | Reset |

## Configuration

| Setting | Description |
|---------|-------------|
| **Speed (WPM)** | Min/max words per minute. Actual speed drifts smoothly inside this range. |
| **Sound mode** | `Same` - one sound for all paragraphs. `Cycle` - rotate through selected sounds per paragraph. `Random` - pick a different sound each paragraph. |
| **Volume** | Master volume (0–100%). |
| **Pitch wobble** | Random pitch variation per keystroke (0–15%). |
| **Space-bar sound** | Use dedicated space-bar sample when available (hi75, halo, uhk, asus). |
| **Typos** | Simulate occasional mistakes and corrections. |

## Tech Stack

- **Vite** - dev server & bundler
- **button-sounds** - mechanical keyboard audio samples by Josh Comeau ([buttons.joshwcomeau.com](https://buttons.joshwcomeau.com/))
- Vanilla JS / CSS - no framework overhead

## Credits

Keyboard sounds sourced from the excellent [button-sounds](https://www.npmjs.com/package/button-sounds) package by Josh Comeau. Check out the interactive demo at [buttons.joshwcomeau.com](https://buttons.joshwcomeau.com/).

## License

MIT - do whatever you want.
