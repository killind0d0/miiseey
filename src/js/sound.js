// ─── Cinematic Sound & UI Foley System ─────────────────────────
// Authentic camera shutter actuations & 35mm cinema projector audio.
// Built with Web Audio API for zero latency and frame-perfect response.

export class SoundManager {
  constructor() {
    this.audioCtx = null;
    this.soundToggle = document.getElementById('sound-toggle');
    this.isAmbientPlaying = false;
    this.ambientAudio = null;
    this.buffers = {};

    const base = import.meta.env.BASE_URL;
    this.soundPaths = {
      shutter: `${base}assets/audio/camera-shutter.mp3`,
      shutterAlt: `${base}assets/audio/camera-shutter-alt.mp3`,
      mechanical: `${base}assets/audio/shutter-mechanical.mp3`,
      click: `${base}assets/audio/camera-click.mp3`,
      projector: `${base}assets/audio/ambient-projector.mp3`,
    };

    this.init();
  }

  init() {
    this.setupAmbientToggle();
    this.setupUIFoley();
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  async loadSound(name) {
    if (this.buffers[name]) return this.buffers[name];
    const ctx = this.getAudioContext();
    if (!ctx) return null;

    try {
      const res = await fetch(this.soundPaths[name]);
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.buffers[name] = audioBuffer;
      return audioBuffer;
    } catch (e) {
      console.warn('[Mise Films Sound] Failed to load:', name, e);
      return null;
    }
  }

  async playFoley(name, volume = 0.4) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const buffer = await this.loadSound(name);
    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
  }

  setupAmbientToggle() {
    if (!this.soundToggle) return;

    this.ambientAudio = new Audio(this.soundPaths.projector);
    this.ambientAudio.loop = true;
    this.ambientAudio.volume = 0;

    this.soundToggle.addEventListener('click', () => {
      this.playFoley('mechanical', 0.45);

      if (this.isAmbientPlaying) {
        this.stopAmbient();
      } else {
        this.startAmbient();
      }
    });
  }

  startAmbient() {
    if (!this.ambientAudio) return;
    this.isAmbientPlaying = true;
    this.soundToggle.classList.add('is-playing');

    this.ambientAudio.play().then(() => {
      let vol = 0;
      const interval = setInterval(() => {
        vol = Math.min(vol + 0.02, 0.28);
        this.ambientAudio.volume = vol;
        if (vol >= 0.28) clearInterval(interval);
      }, 50);
    }).catch((e) => {
      console.warn('[Mise Films] Autoplay blocked:', e);
    });
  }

  stopAmbient() {
    this.isAmbientPlaying = false;
    this.soundToggle.classList.remove('is-playing');

    if (this.ambientAudio && !this.ambientAudio.paused) {
      let vol = this.ambientAudio.volume;
      const interval = setInterval(() => {
        vol = Math.max(vol - 0.02, 0);
        this.ambientAudio.volume = vol;
        if (vol <= 0) {
          clearInterval(interval);
          this.ambientAudio.pause();
        }
      }, 40);
    }
  }

  setupUIFoley() {
    // 1. Shutter actuation on project cards
    document.querySelectorAll('.project-card').forEach((card) => {
      card.addEventListener('click', () => {
        this.playFoley('shutter', 0.55);
      });
      card.addEventListener('mouseenter', () => {
        this.playFoley('click', 0.18);
      });
    });

    // 2. Shutter actuation on portraits (Vivek Kumar & Vikrant Yadav)
    document.querySelectorAll('.about__portrait-frame').forEach((frame) => {
      frame.addEventListener('click', () => {
        this.playFoley('shutter', 0.6);
      });
      frame.addEventListener('mouseenter', () => {
        this.playFoley('click', 0.15);
      });
    });

    // 3. Tactile clicks on navigation links & buttons
    document.querySelectorAll('.nav__link, .mobile-menu__link, .contact__cta').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.playFoley('mechanical', 0.35);
      });
    });

    // 4. Menu button
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        this.playFoley('mechanical', 0.4);
      });
    }

    // Preload key audio buffers on first user interaction
    window.addEventListener('pointerdown', () => {
      this.getAudioContext();
      this.loadSound('shutter');
      this.loadSound('click');
      this.loadSound('mechanical');
    }, { once: true });
  }
}

export { SoundManager as AmbientSound };
