const { useState, useEffect } = React;

// YouTube Player Component
const YouTubePlayer = React.forwardRef(({ videoUrl, onUrlChange, onVideoLoad }, ref) => {
    const [videoId, setVideoId] = useState('');
    const playerRef = React.useRef(null);

    // Extract video ID from various YouTube URL formats
    const extractVideoId = (url) => {
        if (!url) return '';
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return '';
    };

    useEffect(() => {
        const id = extractVideoId(videoUrl);
        setVideoId(id);
    }, [videoUrl]);

    useEffect(() => {
        if (!videoId || !window.YT) return;

        const ytPlayer = new window.YT.Player('youtube-player', {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                autoplay: 0,
                controls: 1,
                rel: 0
            },
            events: {
                onReady: (event) => {
                    playerRef.current = event.target;
                    if (onVideoLoad) onVideoLoad(event.target);
                }
            }
        });

        return () => {
            if (ytPlayer && ytPlayer.destroy) {
                ytPlayer.destroy();
            }
            playerRef.current = null;
        };
    }, [videoId, onVideoLoad]);

    // Expose player methods via ref
    React.useImperativeHandle(ref, () => ({
        seekBackward: () => {
            if (playerRef.current) {
                try {
                    const currentTime = playerRef.current.getCurrentTime();
                    const newTime = Math.max(0, currentTime - 5);
                    playerRef.current.seekTo(newTime, true);
                } catch (error) {
                    console.warn('Failed to seek backward:', error);
                }
            }
        },
        seekForward: () => {
            if (playerRef.current) {
                try {
                    const currentTime = playerRef.current.getCurrentTime();
                    const duration = playerRef.current.getDuration();
                    const newTime = Math.min(duration, currentTime + 5);
                    playerRef.current.seekTo(newTime, true);
                } catch (error) {
                    console.warn('Failed to seek forward:', error);
                }
            }
        },
        togglePlayPause: () => {
            if (playerRef.current) {
                try {
                    const playerState = playerRef.current.getPlayerState();
                    // YouTube API states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
                    if (playerState === 1) {
                        // Currently playing, so pause
                        playerRef.current.pauseVideo();
                    } else {
                        // Paused, ended, or unstarted, so play
                        playerRef.current.playVideo();
                    }
                } catch (error) {
                    console.warn('Failed to toggle play/pause:', error);
                }
            }
        }
    }));

    return (
        <div className="youtube-container">
            <div className="youtube-input-container">
                <input
                    type="text"
                    placeholder="Paste YouTube URL here..."
                    value={videoUrl}
                    onChange={(e) => {
                        if (onUrlChange) {
                            onUrlChange(e.target.value);
                        }
                    }}
                    className="youtube-input"
                />
            </div>
            <div id="youtube-player" className="youtube-player"></div>
        </div>
    );
});

// Piano Keyboard Component
function PianoKeyboard() {
    const [pressedKeys, setPressedKeys] = useState(new Set());
    const [audioContext, setAudioContext] = useState(null);
    const [audioBuffers, setAudioBuffers] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const playingSourcesRef = React.useRef({});

    // Initialize Audio Context
    useEffect(() => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        setAudioContext(ctx);

        return () => {
            ctx.close();
        };
    }, []);

    // Load piano samples
    useEffect(() => {
        if (!audioContext) return;

        // Convert note name and octave to MIDI note number
        const getMidiNoteNumber = (note, octave) => {
            return `${note}${octave}`;
        };

        const loadSample = async (note, octave) => {
            try {
                // Using a CDN that provides piano samples
                // Using jsDelivr CDN which has proper CORS headers
                const midiNote = getMidiNoteNumber(note, octave);
                const url = `https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts@gh-pages/FluidR3_GM/acoustic_grand_piano-mp3/${midiNote}.mp3`;

                const response = await fetch(url);
                if (!response.ok) {
                    console.warn(`Failed to load sample for ${note}${octave} from ${url}`);
                    return null;
                }
                const arrayBuffer = await response.arrayBuffer();
                return await audioContext.decodeAudioData(arrayBuffer);
            } catch (error) {
                console.warn(`Failed to load sample for ${note}${octave}:`, error);
                return null;
            }
        };

        const loadAllSamples = async () => {
            const samples = {};
            const notes = [
                { key: 'q', note: 'C', octave: 4 },
                { key: 'w', note: 'D', octave: 4 },
                { key: 'e', note: 'E', octave: 4 },
                { key: 'r', note: 'F', octave: 4 },
                { key: 't', note: 'G', octave: 4 },
                { key: 'y', note: 'A', octave: 4 },
                { key: 'u', note: 'B', octave: 4 },
                { key: 'i', note: 'C', octave: 5 },
                { key: 'o', note: 'D', octave: 5 },
                { key: 'p', note: 'E', octave: 5 },
                { key: '[', note: 'F', octave: 5 },
                { key: ']', note: 'G', octave: 5 },
                { key: '2', note: 'Db', octave: 4 },
                { key: '3', note: 'Eb', octave: 4 },
                { key: '5', note: 'Gb', octave: 4 },
                { key: '6', note: 'Ab', octave: 4 },
                { key: '7', note: 'Bb', octave: 4 },
                { key: '9', note: 'Db', octave: 5 },
                { key: '0', note: 'Eb', octave: 5 },
                { key: '=', note: 'Gb', octave: 5 },
            ];

            // Load samples in parallel
            const loadPromises = notes.map(async ({ key, note, octave }) => {
                const buffer = await loadSample(note, octave);
                if (buffer) {
                    samples[key] = buffer;
                }
            });

            await Promise.all(loadPromises);
            setAudioBuffers(samples);
            setIsLoading(false);
        };

        loadAllSamples();
    }, [audioContext]);

    // Pre-warm audio context once samples are loaded
    useEffect(() => {
        if (!isLoading && audioContext) {
            // Activate audio context on any user interaction
            const activateAudio = () => {
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                // Play a silent sound to fully activate the audio context
                try {
                    const silentSource = audioContext.createBufferSource();
                    const silentGain = audioContext.createGain();
                    silentGain.gain.value = 0;
                    silentSource.connect(silentGain);
                    silentGain.connect(audioContext.destination);
                    silentSource.start(0);
                    silentSource.stop(0.001);
                } catch (e) {
                    // Ignore errors
                }
            };

            // Try to activate immediately if possible
            activateAudio();

            // Also activate on first user interaction (click, touch, keydown)
            const events = ['click', 'touchstart', 'keydown'];
            const handleActivation = () => {
                activateAudio();
                events.forEach(event => {
                    document.removeEventListener(event, handleActivation);
                });
            };

            events.forEach(event => {
                document.addEventListener(event, handleActivation, { once: true });
            });

            return () => {
                events.forEach(event => {
                    document.removeEventListener(event, handleActivation);
                });
            };
        }
    }, [isLoading, audioContext]);

    // Piano key mapping
    const keyMap = {
        // White keys
        'q': { note: 'C', frequency: 261.63, type: 'white' },
        'w': { note: 'D', frequency: 293.66, type: 'white' },
        'e': { note: 'E', frequency: 329.63, type: 'white' },
        'r': { note: 'F', frequency: 349.23, type: 'white' },
        't': { note: 'G', frequency: 392.00, type: 'white' },
        'y': { note: 'A', frequency: 440.00, type: 'white' },
        'u': { note: 'B', frequency: 493.88, type: 'white' },
        'i': { note: 'C', frequency: 523.25, type: 'white' },
        'o': { note: 'D', frequency: 587.33, type: 'white' },
        'p': { note: 'E', frequency: 659.25, type: 'white' },
        "[": { note: 'F', frequency: 698.46, type: 'white' },
        "]": { note: 'G', frequency: 783.99, type: 'white' },

        // Black keys
        '2': { note: 'Db', frequency: 277.18, type: 'black' },
        '3': { note: 'Eb', frequency: 311.13, type: 'black' },
        '5': { note: 'Gb', frequency: 369.99, type: 'black' },
        '6': { note: 'Ab', frequency: 415.30, type: 'black' },
        '7': { note: 'Bb', frequency: 466.16, type: 'black' },
        '9': { note: 'Db', frequency: 554.37, type: 'black' },
        '0': { note: 'Eb', frequency: 622.25, type: 'black' },
        '=': { note: 'Gb', frequency: 739.99, type: 'black' },
    };

    const playNote = (key) => {
        if (!audioContext || !audioBuffers[key]) return;

        // Resume audio context if suspended (should be rare after pre-warming)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const buffer = audioBuffers[key];
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();

        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Set volume immediately
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

        // Play from 0.1s into the sample to skip initial silence/attack
        source.start(0, 0.1);

        // Initialize array for this key if it doesn't exist
        if (!playingSourcesRef.current[key]) {
            playingSourcesRef.current[key] = [];
        }

        // Store the source and gainNode so we can stop it when key is released
        playingSourcesRef.current[key].push({ source, gainNode });

        // Clean up when source ends naturally
        source.onended = () => {
            if (playingSourcesRef.current[key]) {
                playingSourcesRef.current[key] = playingSourcesRef.current[key].filter(
                    item => item.source !== source
                );
                if (playingSourcesRef.current[key].length === 0) {
                    delete playingSourcesRef.current[key];
                }
            }
        };
    };

    const stopNote = (key) => {
        if (playingSourcesRef.current[key] && playingSourcesRef.current[key].length > 0) {
            const now = audioContext.currentTime;
            const releaseTime = 0.1; // 0.1 second release

            // Stop all sources for this key
            playingSourcesRef.current[key].forEach(({ source, gainNode }) => {
                // Fade out the gain
                gainNode.gain.cancelScheduledValues(now);
                gainNode.gain.setValueAtTime(gainNode.gain.value, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);

                // Stop the source after the fade
                source.stop(now + releaseTime);
            });

            // Clear all sources for this key
            delete playingSourcesRef.current[key];
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Prevent key repeat
            if (e.repeat) return;

            const key = e.key.toLowerCase();
            if (keyMap[key] && !pressedKeys.has(key)) {
                // Update state and play note immediately
                setPressedKeys(prev => new Set([...prev, key]));
                // Play note immediately - audio context should already be active
                playNote(key);
            }
        };

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            if (keyMap[key]) {
                setPressedKeys(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(key);
                    return newSet;
                });
                // Stop the note with 0.1s fade out
                stopNote(key);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [pressedKeys, audioContext, audioBuffers]);

    const whiteKeys = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'];
    const blackKeyPositions = {
        '2': 0, '3': 0.2, '5': 1.6, '6': 1.9, '7': 2.25, '9': 3.6, '0': 9.35, '=': 6.1
    };

    if (isLoading) {
        return (
            <div className="piano-container">
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>Loading piano samples...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="piano-container">
            <div className="piano-keyboard">
                <div className="piano-keys">
                    {/* Black keys */}
                    <div className="black-keys-row">
                        {Object.entries(blackKeyPositions).map(([key, position]) => {
                            const keyInfo = keyMap[key];
                            return (
                                <div
                                    key={key}
                                    className={`piano-key black-key ${pressedKeys.has(key) ? 'pressed' : ''}`}
                                    style={{ left: `${position * 7.69}%`, top: `0%` }}
                                    title={`${keyInfo.note} (${key})`}
                                >
                                    <span className="key-label">{key}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* White keys */}
                    <div className="white-keys-row">
                        {whiteKeys.map((key) => {
                            const keyInfo = keyMap[key];
                            return (
                                <div
                                    key={key}
                                    className={`piano-key white-key ${pressedKeys.has(key) ? 'pressed' : ''}`}
                                    title={`${keyInfo.note} (${key})`}
                                >
                                    <span className="key-label">{key}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className="piano-instructions">
                <p>Use your keyboard to play:</p>
                <p className="key-mapping">
                    <strong>White keys:</strong> {whiteKeys.join(' ')} '<br />
                    <strong>Black keys:</strong> {Object.keys(blackKeyPositions).join(' ')}
                </p>
            </div>
        </div>
    );
}

// Main App Component
function App() {
    const [videoUrl, setVideoUrl] = useState('');
    const playerRef = React.useRef(null);

    // Handle arrow key navigation for video seeking and spacebar for play/pause
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle keys if not typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (playerRef.current) {
                    playerRef.current.seekBackward();
                }
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (playerRef.current) {
                    playerRef.current.seekForward();
                }
            } else if (e.key === ' ') {
                e.preventDefault(); // Prevent page scroll
                if (playerRef.current) {
                    playerRef.current.togglePlayPause();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <div className="app">
            <header className="app-header">
                <h1>WebPiano</h1>
                <p>YouTube Player with Interactive Piano</p>
            </header>
            <div className="app-content">
                <div className="left-panel">
                    <YouTubePlayer
                        videoUrl={videoUrl}
                        onUrlChange={setVideoUrl}
                        ref={playerRef}
                    />
                </div>
                <div className="right-panel">
                    <PianoKeyboard />
                </div>
            </div>
        </div>
    );
}

// Render the app
ReactDOM.render(<App />, document.getElementById('root'));

