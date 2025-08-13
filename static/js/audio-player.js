/**
 * WaveSurfer.js Audio Player Module
 * Implements the basic audio player functionality with WaveSurfer.js
 */

class WaveSurferPlayer {
    constructor(containerId, audioUrl) {
        this.containerId = containerId;
        this.audioUrl = audioUrl;
        this.wavesurfer = null;
        this.currentRegion = null;
        this.isLoopMode = false;
        this.onReadyCallbacks = [];
        this.onErrorCallbacks = [];
    }

    /**
     * Initialize WaveSurfer.js with configuration
     */
    initialize() {
        try {
            this.wavesurfer = WaveSurfer.create({
                container: this.containerId,
                waveColor: '#007bff',
                progressColor: '#0056b3',
                cursorColor: '#dc3545',
                barWidth: 2,
                barRadius: 3,
                responsive: true,
                height: 120,
                normalize: true,
                plugins: [
                    WaveSurfer.regions.create({
                        regionsMinLength: 1,
                        dragSelection: {
                            slop: 5
                        }
                    })
                ]
            });

            this.setupEventListeners();
            return true;
        } catch (error) {
            console.error('WaveSurfer initialization error:', error);
            this.triggerErrorCallbacks('WaveSurfer initialization failed');
            return false;
        }
    }

    /**
     * Load audio file
     */
    loadAudio(url = null) {
        if (!this.wavesurfer) {
            console.error('WaveSurfer not initialized');
            return false;
        }

        const audioUrl = url || this.audioUrl;
        try {
            this.wavesurfer.load(audioUrl);
            return true;
        } catch (error) {
            console.error('Audio loading error:', error);
            this.triggerErrorCallbacks('Audio file loading failed');
            return false;
        }
    }

    /**
     * Setup WaveSurfer event listeners
     */
    setupEventListeners() {
        if (!this.wavesurfer) return;

        // Audio ready event
        this.wavesurfer.on('ready', () => {
            this.triggerReadyCallbacks();
        });

        // Loading progress
        this.wavesurfer.on('loading', (percent) => {
            this.onLoadingProgress(percent);
        });

        // Playback position updates
        this.wavesurfer.on('audioprocess', () => {
            this.onAudioProcess();
        });

        // Seeking
        this.wavesurfer.on('seek', () => {
            this.onSeek();
        });

        // Playback finished
        this.wavesurfer.on('finish', () => {
            this.onPlaybackFinish();
        });

        // Error handling
        this.wavesurfer.on('error', (error) => {
            console.error('WaveSurfer error:', error);
            this.triggerErrorCallbacks('Audio playback error');
        });

        // Region events
        this.wavesurfer.on('region-created', (region) => {
            this.onRegionCreated(region);
        });

        this.wavesurfer.on('region-updated', (region) => {
            this.onRegionUpdated(region);
        });

        this.wavesurfer.on('region-removed', () => {
            this.onRegionRemoved();
        });
    }

    /**
     * Play audio
     */
    play() {
        if (this.wavesurfer && this.wavesurfer.isReady) {
            this.wavesurfer.play();
        }
    }

    /**
     * Pause audio
     */
    pause() {
        if (this.wavesurfer) {
            this.wavesurfer.pause();
        }
    }

    /**
     * Stop audio
     */
    stop() {
        if (this.wavesurfer) {
            this.wavesurfer.stop();
        }
    }

    /**
     * Set volume (0-1)
     */
    setVolume(volume) {
        if (this.wavesurfer) {
            this.wavesurfer.setVolume(volume);
        }
    }

    /**
     * Get current playback time in seconds
     */
    getCurrentTime() {
        return this.wavesurfer ? this.wavesurfer.getCurrentTime() : 0;
    }

    /**
     * Get total duration in seconds
     */
    getDuration() {
        return this.wavesurfer ? this.wavesurfer.getDuration() : 0;
    }

    /**
     * Seek to specific time (0-1 ratio)
     */
    seekTo(progress) {
        if (this.wavesurfer) {
            this.wavesurfer.seekTo(progress);
        }
    }

    /**
     * Create a region for time range selection
     */
    setRegion(startTime, endTime, options = {}) {
        if (!this.wavesurfer) return null;

        // Clear existing regions
        this.clearRegions();

        const defaultOptions = {
            start: startTime,
            end: endTime,
            color: 'rgba(0, 123, 255, 0.1)',
            drag: true,
            resize: true
        };

        const regionOptions = { ...defaultOptions, ...options };
        return this.wavesurfer.addRegion(regionOptions);
    }

    /**
     * Clear all regions
     */
    clearRegions() {
        if (this.wavesurfer) {
            this.wavesurfer.clearRegions();
        }
    }

    /**
     * Enable/disable loop mode
     */
    enableLoopMode(enabled) {
        this.isLoopMode = enabled;
    }

    /**
     * Check if audio is ready
     */
    isReady() {
        return this.wavesurfer && this.wavesurfer.isReady;
    }

    /**
     * Check if audio is playing
     */
    isPlaying() {
        return this.wavesurfer && this.wavesurfer.isPlaying();
    }

    /**
     * Add callback for when audio is ready
     */
    onReady(callback) {
        this.onReadyCallbacks.push(callback);
    }

    /**
     * Add callback for errors
     */
    onError(callback) {
        this.onErrorCallbacks.push(callback);
    }

    /**
     * Event handlers
     */
    onLoadingProgress(percent) {
        // Override in implementation
    }

    onAudioProcess() {
        // Override in implementation
    }

    onSeek() {
        // Override in implementation
    }

    onPlaybackFinish() {
        if (this.isLoopMode && this.currentRegion) {
            // Loop back to region start
            this.seekTo(this.currentRegion.start / this.getDuration());
            this.play();
        }
    }

    onRegionCreated(region) {
        this.currentRegion = region;
        this.enableLoopMode(true);
    }

    onRegionUpdated(region) {
        this.currentRegion = region;
    }

    onRegionRemoved() {
        this.currentRegion = null;
        this.enableLoopMode(false);
    }

    /**
     * Trigger ready callbacks
     */
    triggerReadyCallbacks() {
        this.onReadyCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Ready callback error:', error);
            }
        });
    }

    /**
     * Trigger error callbacks
     */
    triggerErrorCallbacks(message) {
        this.onErrorCallbacks.forEach(callback => {
            try {
                callback(message);
            } catch (error) {
                console.error('Error callback error:', error);
            }
        });
    }

    /**
     * Destroy the player instance
     */
    destroy() {
        if (this.wavesurfer) {
            this.wavesurfer.destroy();
            this.wavesurfer = null;
        }
        this.currentRegion = null;
        this.isLoopMode = false;
        this.onReadyCallbacks = [];
        this.onErrorCallbacks = [];
    }
}

/**
 * Audio Player UI Controller
 * Manages the UI interactions and integrates with WaveSurferPlayer
 */
class AudioPlayerController {
    constructor(playerId, audioUrl) {
        this.player = new WaveSurferPlayer('#waveform', audioUrl);
        this.playBtn = document.getElementById('play-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeDisplay = document.getElementById('volume-display');
        this.currentTimeDisplay = document.getElementById('current-time');
        this.totalTimeDisplay = document.getElementById('total-time');
        this.regionTimeDisplay = document.getElementById('region-time');
        this.regionStartDisplay = document.getElementById('region-start');
        this.regionEndDisplay = document.getElementById('region-end');
        this.statusContainer = document.getElementById('status-container');

        this.setupEventListeners();
        this.setupPlayerCallbacks();
    }

    /**
     * Initialize the audio player
     */
    initialize() {
        if (this.player.initialize()) {
            this.showStatus('音声プレイヤーを初期化しています...', 'info');
            this.player.loadAudio();
            return true;
        }
        return false;
    }

    /**
     * Setup UI event listeners
     */
    setupEventListeners() {
        // Play button
        if (this.playBtn) {
            this.playBtn.addEventListener('click', () => {
                this.player.play();
            });
        }

        // Pause button
        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', () => {
                this.player.pause();
            });
        }

        // Volume slider
        if (this.volumeSlider) {
            this.volumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                this.player.setVolume(volume);
                if (this.volumeDisplay) {
                    this.volumeDisplay.textContent = e.target.value + '%';
                }
            });
        }
    }

    /**
     * Setup player callbacks
     */
    setupPlayerCallbacks() {
        // When audio is ready
        this.player.onReady(() => {
            this.showStatus('音声ファイルの読み込みが完了しました。', 'success');
            this.enableControls(true);
            this.updateTimeDisplay();
        });

        // When error occurs
        this.player.onError((message) => {
            this.showStatus(`エラー: ${message}`, 'error');
            this.enableControls(false);
        });

        // Override player event handlers
        this.player.onLoadingProgress = (percent) => {
            this.showStatus(`音声ファイルを読み込み中... ${percent}%`, 'info');
        };

        this.player.onAudioProcess = () => {
            this.updateTimeDisplay();
        };

        this.player.onSeek = () => {
            this.updateTimeDisplay();
        };

        this.player.onRegionCreated = (region) => {
            this.player.currentRegion = region;
            this.showRegionTime(region.start, region.end);
            this.player.enableLoopMode(true);
            this.showStatus('ループ再生モードが有効になりました', 'info');
        };

        this.player.onRegionUpdated = (region) => {
            this.player.currentRegion = region;
            this.showRegionTime(region.start, region.end);
        };

        this.player.onRegionRemoved = () => {
            this.player.currentRegion = null;
            this.hideRegionTime();
            this.player.enableLoopMode(false);
        };
    }

    /**
     * Show status message
     */
    showStatus(message, type) {
        if (this.statusContainer) {
            this.statusContainer.innerHTML = `<div class="status-message status-${type}">${message}</div>`;
            
            // Auto-hide success and info messages
            if (type === 'success' || type === 'info') {
                setTimeout(() => {
                    this.statusContainer.innerHTML = '';
                }, 5000);
            }
        }
    }

    /**
     * Enable/disable controls
     */
    enableControls(enabled) {
        if (this.playBtn) this.playBtn.disabled = !enabled;
        if (this.pauseBtn) this.pauseBtn.disabled = !enabled;
        if (this.volumeSlider) this.volumeSlider.disabled = !enabled;
    }

    /**
     * Update time display
     */
    updateTimeDisplay() {
        if (!this.player.isReady()) return;

        const current = this.player.getCurrentTime();
        const total = this.player.getDuration();

        if (this.currentTimeDisplay) {
            this.currentTimeDisplay.textContent = this.formatTime(current);
        }
        if (this.totalTimeDisplay) {
            this.totalTimeDisplay.textContent = this.formatTime(total);
        }
    }

    /**
     * Show region time display
     */
    showRegionTime(start, end) {
        if (this.regionStartDisplay) {
            this.regionStartDisplay.textContent = this.formatTime(start);
        }
        if (this.regionEndDisplay) {
            this.regionEndDisplay.textContent = this.formatTime(end);
        }
        if (this.regionTimeDisplay) {
            this.regionTimeDisplay.style.display = 'block';
        }
    }

    /**
     * Hide region time display
     */
    hideRegionTime() {
        if (this.regionTimeDisplay) {
            this.regionTimeDisplay.style.display = 'none';
        }
    }

    /**
     * Format time in MM:SS format
     */
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * Set time range (public API for chat integration)
     */
    setTimeRange(startTime, endTime) {
        if (!this.player.isReady()) return false;

        const region = this.player.setRegion(startTime, endTime);
        if (region) {
            // Seek to start time
            this.player.seekTo(startTime / this.player.getDuration());
            this.showStatus(`時間範囲が設定されました: ${this.formatTime(startTime)} - ${this.formatTime(endTime)}`, 'success');
            return true;
        }
        return false;
    }

    /**
     * Destroy the controller
     */
    destroy() {
        if (this.player) {
            this.player.destroy();
        }
    }
}

// Export for global access
window.WaveSurferPlayer = WaveSurferPlayer;
window.AudioPlayerController = AudioPlayerController;