// TTS - Japanese text-to-speech via GPT-SoVITS API (sakura voice model)
// Replaces Web Speech API with local GPT-SoVITS v2 API server.
// Immediately-invoked: creates a single global TTS constructor matching the
// prototype-class pattern used by speechBubble.js, animations.js, and pet.js.

(function () {
  function TTS() {
    this.enabled = true;
    this.apiBase = 'http://localhost:9880';
    this.modelReady = false;
    this._pending = false;
    this._audioContext = null;

    // Emotion -> sakura tone mapping.
    // Desktop pet emotions map to closest available sakura voice tones.
    this._emotionToTone = {
      '害羞':     '害羞',
      '生气':     '不满',
      '惊讶':     '惊讶',
      '晚安':     '中性',
      '不理你了': '不满',
      '被捉弄':   '俏皮',
      '疑惑':     '困惑',
    };

    // Tone reference audio paths and prompt texts (exact match from sakura.char ref.txt).
    // Paths are relative to the GPT-SoVITS root directory.
    this._tones = {
      '中性': { ref: 'sakura_refs/00_中性_VO01_2785.ogg',   prompt: 'でも私、初めて君に会った時、 思ったよ' },
      '不满': { ref: 'sakura_refs/01_不满_VO01_3365.ogg',   prompt: '……何で君は、私のこと、 幸せにするのがそんなに上手なの' },
      '害羞': { ref: 'sakura_refs/03_害羞_VO01_3976.ogg',   prompt: '……み、皆がいるとこで、 あんまり言わないで。そういうこと' },
      '请求': { ref: 'sakura_refs/05_请求_VO01_1215.wav',   prompt: 'お願いね。私は皆の分の 生徒会の仕事を片付けておくから' },
      '困惑': { ref: 'sakura_refs/06_困惑_VO01_0056.ogg',   prompt: 'これ私、どういう反応すればいいの……？' },
      '惊讶': { ref: 'sakura_refs/07_惊讶_VO01_2659.wav',   prompt: 'え、すごい。音、聞こえるの？' },
      '俏皮': { ref: 'sakura_refs/08_俏皮_VO01_3745.ogg',   prompt: '' },
    };

    // Default tone when no emotion match or emotion unspecified.
    this._defaultTone = '中性';

    console.log('[TTS] GPT-SoVITS mode — API base:', this.apiBase);
  }

  /**
   * Resolve the tone for a given emotion tag.
   * Falls back to _defaultTone ('中性') for unknown/absent tags.
   */
  TTS.prototype._resolveTone = function (emotion) {
    if (emotion && this._emotionToTone.hasOwnProperty(emotion)) {
      return this._emotionToTone[emotion];
    }
    return this._defaultTone;
  };

  /**
   * Ensure the GPT-SoVITS server is reachable.
   * Uses GET / as a lightweight no-side-effect health probe.
   * Called lazily on first speak() to avoid startup delay.
   */
  TTS.prototype._ensureReady = async function () {
    if (this.modelReady) return true;

    try {
      var resp = await fetch(
        this.apiBase + '/',
        { signal: AbortSignal.timeout(3000) }
      );
      // 404 is expected — any response means the server is alive.
      console.log('[TTS] GPT-SoVITS API server reachable');
      this.modelReady = true;
      return true;
    } catch (e) {
      console.warn('[TTS] GPT-SoVITS API server not available:', e.message);
      return false;
    }
  };

  /**
   * Speak the given text. Optionally pass an emotion tag to select
   * the matching sakura tone reference audio.
   *
   * @param {string} text  - Japanese text to speak.
   * @param {string} [emotion] - Optional emotion tag (e.g. '害羞', '生气').
   * @returns {Promise<void>}
   */
  TTS.prototype.speak = async function (text, emotion, onStart) {
    if (!this.enabled) return;
    if (!text || !text.trim()) return;

    // Debounce: cancel concurrent speak and let the latest one win.
    if (this._abortController) {
      this._abortController.abort();
    }
    this._abortController = new AbortController();
    var signal = this._abortController.signal;

    // Stop any currently playing audio.
    this._stopAudio();

    var ready = await this._ensureReady();
    if (!ready) {
      console.warn('[TTS] Server not ready, skipping speech');
      return;
    }

    var toneName = this._resolveTone(emotion);
    var tone = this._tones[toneName];
    if (!tone) {
      console.warn('[TTS] Unknown tone "' + toneName + '", falling back to ' + this._defaultTone);
      tone = this._tones[this._defaultTone];
    }

    this._pending = true;

    try {
      var resp = await fetch(this.apiBase + '/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          text_lang: 'ja',
          ref_audio_path: tone.ref,
          prompt_text: tone.prompt,
          prompt_lang: 'ja',
        }),
        signal: signal,
      });

      if (!resp.ok) {
        var errText = '';
        try { errText = await resp.text(); } catch (_) {}
        throw new Error('TTS API returned ' + resp.status + (errText ? ': ' + errText : ''));
      }

      var audioBlob = await resp.blob();
      if (signal.aborted) return; // cancelled mid-response

      await this._playAudio(audioBlob, signal, onStart);
    } catch (e) {
      if (e.name === 'AbortError') return; // expected on cancellation
      console.error('[TTS] Speech failed:', e.message || e);
    } finally {
      this._pending = false;
    }
  };

  /**
   * Play an audio blob via Web Audio API.
   * Returns a promise that resolves when playback finishes or rejects on abort.
   */
  TTS.prototype._playAudio = function (blob, signal, onStart) {
    var self = this;
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(blob);

      // Create AudioContext lazily (requires user-gesture in some browsers,
      // but Electron renderer allows it freely).
      if (!self._audioContext) {
        self._audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Ensure AudioContext is running — Electron/Chromium may suspend it
      // which would cause silent playback or truncation.
      var ac = self._audioContext;
      if (ac.state !== 'running') {
        ac.resume(); // fire-and-forget: decode takes long enough for resume to complete
      }

      // Decode and play.
      fetch(url)
        .then(function (r) { return r.arrayBuffer(); })
        .then(function (buf) { return ac.decodeAudioData(buf); })
        .then(function (audioBuffer) {
          URL.revokeObjectURL(url);

          if (signal.aborted) { resolve(); return; }

          var durationSec = audioBuffer.duration;
          console.log('[TTS] Audio decoded: ' + durationSec.toFixed(1) + 's, ' + audioBuffer.sampleRate + 'Hz');

          var source = ac.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ac.destination);

          self._currentSource = source;

          source.onended = function () {
            console.log('[TTS] Playback ended (source.onended)');
            self._currentSource = null;
            resolve();
          };

          // Handle abort during playback.
          var onAbort = function () {
            console.log('[TTS] Playback aborted');
            try { source.stop(); } catch (_) {}
            self._currentSource = null;
            resolve();
          };
          signal.addEventListener('abort', onAbort, { once: true });

          console.log('[TTS] Starting playback...');
          source.start(0);
          if (onStart) onStart(durationSec);
        })
        .catch(function (e) {
          URL.revokeObjectURL(url);
          console.error('[TTS] Audio playback error:', e.message);
          resolve(); // Don't reject — we don't want unhandled promise errors.
        });
    });
  };

  /**
   * Stop any currently-playing audio immediately.
   */
  TTS.prototype._stopAudio = function () {
    if (this._currentSource) {
      try { this._currentSource.stop(); } catch (_) {}
      this._currentSource = null;
    }
  };

  /**
   * Enable or disable TTS. When disabled, stops any in-progress speech.
   */
  TTS.prototype.setEnabled = function (val) {
    this.enabled = !!val;
    if (!this.enabled) {
      if (this._abortController) {
        this._abortController.abort();
        this._abortController = null;
      }
      this._stopAudio();
    }
  };

  /**
   * Returns whether TTS is currently enabled.
   */
  TTS.prototype.isEnabled = function () {
    return this.enabled;
  };

  window.TTS = TTS;
})();
