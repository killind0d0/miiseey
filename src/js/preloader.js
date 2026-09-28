// ─── Cinematic Entry Animation Controller ──────────────────────
// Part 1: B&W Scratched Celluloid Universal Countdown Leader (3 -> 2 -> 1 -> 0)
// Part 2: Pure White Optical Arc-Lamp Flash to Video Transition (No Red Curtain)
//
// Features:
//   - Frame-accurate 360° pie-wipe & sweeping clock hand per tick
//   - Authentic celluloid scratches, dust specks, bulb flicker & gate jitter
//   - Synced 1000Hz cinema sync beep / optical click foley on each tick (3, 2, 1, 0)
//   - High-intensity full-screen white flash on "0"
//   - Instantaneous intro video play and seamless white-to-video dissolve
//   - Immediate scroll unlocking and component initialization
//   - Complete DOM cleanup upon completion

import gsap from 'gsap';

export class CinematicEntry {
  constructor({ onCurtainOpen, onComplete }) {
    this.onCurtainOpen = onCurtainOpen;
    this.onComplete = onComplete;

    this.root = document.getElementById('cine-entry');
    this.leader = document.getElementById('cine-leader');
    this.numeralEl = document.getElementById('cine-leader-numeral');
    this.handEl = document.getElementById('cine-leader-hand');
    this.pieEl = document.getElementById('cine-leader-pie');
    this.flashEl = document.getElementById('cine-leader-flash');

    this.isComplete = false;
    this.currentStep = 3;
    this.stepDuration = 600; // ms per number (3, 2, 1, 0 = 2.4s total)
    this.totalSteps = 4; // 3, 2, 1, 0
    this.audioCtx = null;
    this.audioTick = null;

    if (!this.root || !this.leader) {
      console.warn('[CinematicEntry] Required DOM elements not found, bypassing');
      this.finishAndCleanup();
      return;
    }

    // Lock scroll while countdown is active
    document.documentElement.classList.add('is-locked');

    this.init();
  }

  init() {
    this.initAudio();
    this.startCountdown();

    // Safety timeout: Never freeze the page past 4.5 seconds
    this._failsafeTimer = setTimeout(() => {
      if (!this.isComplete) {
        console.warn('[CinematicEntry] Max safety timeout reached, forcing finish');
        this.finishAndCleanup();
      }
    }, 4500);
  }

  initAudio() {
    try {
      this.audioTick = new Audio(`${import.meta.env.BASE_URL}assets/audio/camera-click.mp3`);
      this.audioTick.volume = 0.35;
    } catch {}
  }

  playSyncBeep(isFinal = false) {
    // 1. Mechanical click foley
    try {
      if (this.audioTick) {
        const tick = this.audioTick.cloneNode();
        tick.volume = isFinal ? 0.45 : 0.28;
        tick.play().catch(() => {});
      }
    } catch {}

    // 2. Synthesize authentic SMPTE 1000Hz sync tone via Web Audio API
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        if (!this.audioCtx) this.audioCtx = new AudioContextClass();
        if (this.audioCtx.state === 'running') {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(isFinal ? 1000 : 880, this.audioCtx.currentTime);
          gain.gain.setValueAtTime(isFinal ? 0.09 : 0.04, this.audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.045);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start();
          osc.stop(this.audioCtx.currentTime + 0.045);
        }
      }
    } catch {}
  }

  startCountdown() {
    const startTime = performance.now();
    const totalCountdownTime = this.stepDuration * this.totalSteps; // 2400ms

    // Initial audio cue & number (3)
    this.playSyncBeep(false);
    this.pulseNumeral(3);

    const onFrame = (now) => {
      if (this.isComplete) return;

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / totalCountdownTime, 1);

      // Current numeral (3 -> 2 -> 1 -> 0)
      const stepIndex = Math.min(Math.floor(elapsed / this.stepDuration), 3);
      const stepNumber = 3 - stepIndex;

      if (stepNumber !== this.currentStep && stepNumber >= 0) {
        this.currentStep = stepNumber;
        this.pulseNumeral(stepNumber);
        this.playSyncBeep(stepNumber === 0);
      }

      // Rotate clock hand and pie wipe (360° per tick)
      const stepElapsed = elapsed - (stepIndex * this.stepDuration);
      const stepProgress = Math.min(stepElapsed / this.stepDuration, 1);
      const angle = stepProgress * 360;

      if (this.handEl) this.handEl.style.transform = `rotate(${angle}deg)`;
      if (this.pieEl) this.pieEl.style.transform = `rotate(${angle}deg)`;

      if (progress >= 1) {
        // Countdown reached the end of '0' -> Trigger full-screen white flash
        this.onCountdownEnd();
        return;
      }

      requestAnimationFrame(onFrame);
    };

    requestAnimationFrame(onFrame);
  }

  pulseNumeral(num) {
    if (!this.numeralEl) return;
    this.numeralEl.textContent = num;
    this.numeralEl.style.transform = 'scale(1.2)';
    this.numeralEl.style.opacity = '0.6';

    requestAnimationFrame(() => {
      if (!this.numeralEl) return;
      this.numeralEl.style.transition = 'transform 0.18s cubic-bezier(0.18, 0.9, 0.32, 1), opacity 0.18s ease';
      this.numeralEl.style.transform = 'scale(1)';
      this.numeralEl.style.opacity = '1';
    });
  }

  onCountdownEnd() {
    // 1. Immediately trigger full-screen brilliant white flash
    if (this.flashEl) {
      this.flashEl.style.opacity = '1';
    }

    // 2. Hide leader overlay graphics behind the flash so cut is optical and clean
    if (this.leader) {
      this.leader.style.background = 'transparent';
      const reticle = this.leader.querySelector('.cine-leader__reticle');
      if (reticle) reticle.style.opacity = '0';
      const gate = this.leader.querySelector('.cine-leader__film-gate');
      if (gate) gate.style.opacity = '0';
      const crosshairs = this.leader.querySelectorAll('.cine-leader__crosshair');
      crosshairs.forEach((c) => (c.style.opacity = '0'));
      const metas = this.leader.querySelectorAll('.cine-leader__meta');
      metas.forEach((m) => (m.style.opacity = '0'));
    }

    // 3. Start playing the edge-to-edge intro video immediately
    try {
      const heroVideo = document.getElementById('hero-intro-video') || document.querySelector('.hero__video');
      if (heroVideo) {
        heroVideo.currentTime = 0;
        heroVideo.play().catch(() => {});
      }
    } catch {}

    // 4. Immediately unlock scroll and notify parent so components wake up
    document.documentElement.classList.remove('is-locked');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    this.onCurtainOpen?.();

    // 5. Smoothly dissolve the full-screen white flash to reveal the playing intro video
    if (this.flashEl) {
      gsap.to(this.flashEl, {
        opacity: 0,
        duration: 0.48,
        ease: 'power2.out',
        onComplete: () => {
          this.finishAndCleanup();
        },
      });
    } else {
      this.finishAndCleanup();
    }
  }

  finishAndCleanup() {
    if (this.isComplete) return;
    this.isComplete = true;
    clearTimeout(this._failsafeTimer);

    // Unlock scroll
    document.documentElement.classList.remove('is-locked');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';

    // Completely remove the entry animation element from the DOM
    if (this.root && this.root.parentNode) {
      this.root.remove();
    }

    // Trigger completion
    this.onComplete?.();
  }
}
