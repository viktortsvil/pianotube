# WebPiano - YouTube Video Player with Piano Keyboard

## Project Overview
A lightweight web application that allows users to:
- Paste a YouTube video link and play it on the left side of the screen
- Play a virtual piano keyboard on the right side using computer keyboard keys

## Features
- YouTube video player (left side)
- Interactive piano keyboard simulator (right side)

## Tech Stack
- **Frontend**: React (lightweight, no build tools needed - using React via CDN)
- **Styling**: CSS
- **YouTube API**: YouTube IFrame Player API

## Project Structure
```
WebPiano/
├── index.html          # Main HTML entry point
├── src/
│   ├── App.js          # Main React component
│   └── styles/
│       └── App.css     # Main stylesheet
├── package.json        # Dependencies (minimal)
└── README.md          # This file
```

## Component Architecture

### App.js
- Main container component
- Manages layout (left: video, right: piano)
- Handles YouTube URL input

### YouTubePlayer.js
- Accepts YouTube video URL
- Extracts video ID from URL
- Embeds YouTube IFrame Player
- Handles video playback

### PianoKeyboard.js
- Renders piano keys (white and black)
- Maps keyboard keys to piano notes
- Handles key press/release events
- Visual feedback for pressed keys
- Audio generation for piano notes

## Implementation Notes
- Use Web Audio API for piano sound generation
- Responsive layout (flexbox/grid)
- Visual feedback when keys are pressed
- Extract YouTube video ID from various URL formats
- Handle keyboard event listeners globally

## Future Enhancements (Optional)
- Record and playback functionality
- Multiple octaves
- Different piano sounds/instruments
- Save favorite YouTube videos
- Full-screen mode

