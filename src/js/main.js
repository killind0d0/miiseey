// ─── Mise Films — Main Entry Point ─────────────────────────────
// Orchestrates initialization of all modules in the correct order.
// Includes failsafe: if any animation step errors, scroll is still
// unlocked so the site remains usable (critical for mobile).

import '@/css/main.scss';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { CinematicEntry } from './preloader.js';
import { RevealSequence } from './reveal.js';
import { TextSplitter } from './text-split.js';
import { CustomCursor } from './cursor.js';
import { ScrollAnimations } from './scroll-animations.js';
import { FilmGrain } from './film-grain.js';
import { AmbientSound } from './sound.js';
import { MobileMenu } from './mobile-menu.js';
import { VideoModal } from './video-modal.js';
import { WorkShowcase } from './work-showcase.js';
import { ClapperLike } from './clapper-like.js';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// ─── Helpers ───────────────────────────────────────────────────
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || (window.matchMedia('(hover: none) and (pointer: coarse)').matches);
}

function unlockScroll() {
  document.documentElement.classList.remove('is-locked');
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
}

function forceCleanup() {
  // Remove blocking overlay elements so content is visible
  ['#cine-entry', '#preloader', '#curtain'].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.remove();
  });
  // Show nav and other hidden-by-default elements
  const nav = document.getElementById('nav');
  if (nav) nav.style.opacity = '1';
  const soundToggle = document.getElementById('sound-toggle');
  if (soundToggle) soundToggle.style.opacity = '1';
  // Show hero content (undo the initial hidden state from text-split)
  document.querySelectorAll('.hero__title .word').forEach((w) => {
    w.style.transform = 'none';
    w.style.filter = 'none';
    w.style.opacity = '1';
  });
  const camShowcase = document.querySelector('.hero__cam-showcase');
  if (camShowcase) {
    camShowcase.style.transform = 'none';
    camShowcase.style.opacity = '1';
  }
  const spotlightShowcase = document.querySelector('.hero__spotlight-showcase');
  if (spotlightShowcase) {
    spotlightShowcase.style.transform = 'none';
    spotlightShowcase.style.opacity = '1';
  }
  document.querySelectorAll('.hero__subtitle .line').forEach((l) => {
    l.style.transform = 'none';
    l.style.opacity = '1';
  });
  document.querySelectorAll('.hero__badges').forEach((b) => {
    b.style.transform = 'none';
    b.style.opacity = '1';
  });
  document.querySelectorAll('.hero__eyebrow').forEach((e) => {
    e.style.transform = 'none';
    e.style.opacity = '1';
  });
  // Show all reveal elements
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
}

// ─── App ───────────────────────────────────────────────────────
class MiseFilmsApp {
  constructor() {
    this.lenis = null;
    this.cursor = null;
    this.grain = null;
    this.scrollAnims = null;
    this.mobile = isMobile();

    this.init();
  }

  init() {
    try {
      try {
        new ClapperLike();
      } catch (e) {}

      // 1. Split text before any animations reference the split elements
      new TextSplitter();

      const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced) {
        unlockScroll();
        forceCleanup();
        this.initPostReveal();
        return;
      }

      // 2. Start Cinematic Entry (B&W 35mm Leader → Red Velvet Curtain)
      new CinematicEntry({
        onCurtainOpen: () => {
          // As soon as curtain begins parting, unlock scroll and wake up core components
          unlockScroll();
          this.initPostReveal();
        },
        onComplete: () => this.onPreloaderComplete(),
      });

      // FAILSAFE: If the entry sequence hasn't completed in 6 seconds,
      // force-unlock scroll and clean up overlays.
      this._failsafeTimer = setTimeout(() => {
        console.warn('[Mise Films] Failsafe triggered — force unlocking scroll');
        unlockScroll();
        forceCleanup();
        this.initPostReveal();
      }, 6000);
    } catch (err) {
      console.error('[Mise Films] Init error:', err);
      unlockScroll();
      forceCleanup();
      this.initPostReveal();
    }
  }

  onPreloaderComplete() {
    clearTimeout(this._failsafeTimer);
    unlockScroll();
    this.initPostReveal();

    try {
      const reveal = new RevealSequence();
      reveal.play();
    } catch (err) {
      console.warn('[Mise Films] Reveal error:', err);
    }
  }

  initPostReveal() {
    // Guard: only run once
    if (this._postRevealDone) return;
    this._postRevealDone = true;

    try {
      this.initLenis();
    } catch (err) {
      console.warn('[Mise Films] Lenis init failed, using native scroll:', err);
      // Native scroll still works fine without Lenis
    }

    try {
      this.scrollAnims = new ScrollAnimations();
    } catch (err) {
      console.warn('[Mise Films] ScrollAnimations error:', err);
    }

    // Custom cursor — skip entirely on mobile
    if (!this.mobile) {
      try {
        this.cursor = new CustomCursor();
      } catch (err) {
        console.warn('[Mise Films] Cursor error:', err);
      }
    }

    // Film grain — skip on mobile for performance
    if (!this.mobile) {
      try {
        this.grain = new FilmGrain();
        this.grain.start();
      } catch (err) {
        console.warn('[Mise Films] FilmGrain error:', err);
      }
    }

    let soundManager = null;
    try {
      soundManager = new AmbientSound();
    } catch (err) {
      console.warn('[Mise Films] Sound error:', err);
    }

    try {
      new VideoModal({
        soundManager,
        lenis: this.lenis,
      });
    } catch (err) {
      console.warn('[Mise Films] VideoModal error:', err);
    }

    try {
      new MobileMenu();
    } catch (err) {
      console.warn('[Mise Films] MobileMenu error:', err);
    }

    try {
      new WorkShowcase({ lenis: this.lenis });
    } catch (err) {
      console.warn('[Mise Films] WorkShowcase error:', err);
    }

    // Intro Video: Single Play, Silent, Freeze on HD Logo at End
    try {
      const heroVideo = document.getElementById('hero-intro-video') || document.querySelector('.hero__video');
      if (heroVideo) {
        heroVideo.muted = true;
        heroVideo.loop = false;
        heroVideo.removeAttribute('loop');

        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const source = heroVideo.querySelector('source');
        if (source) {
          source.src = isMobile ? './videos/mise-intro-mobile.mp4' : './videos/mise-intro-1080.mp4';
        } else {
          heroVideo.src = isMobile ? './videos/mise-intro-mobile.mp4' : './videos/mise-intro-1080.mp4';
        }
        heroVideo.load();

        heroVideo.play().catch(() => {});

        // When animation reaches its end, pause permanently on the full HD logo frame
        heroVideo.addEventListener('ended', () => {
          heroVideo.pause();
          if (heroVideo.duration) {
            heroVideo.currentTime = Math.max(0, heroVideo.duration - 0.05);
          }
        });
      }
    } catch (err) {
      console.warn('[Mise Films] Hero intro video controller error:', err);
    }

    try {
      new ClapperLike();
    } catch (err) {
      console.warn('[Mise Films] ClapperLike error:', err);
    }

    this.initViewfinderTimecode();
    this.initQuoteRotator();

    // Refresh ScrollTrigger after all content is ready
    ScrollTrigger.refresh();
  }

  initQuoteRotator() {
    const textEl = document.getElementById('quote-text');
    const authorEl = document.getElementById('quote-author');
    const portraitEl = document.getElementById('quote-portrait');
    if (!textEl || !authorEl) return;

    const quotes = [
      {
        id: 'scorsese',
        name: 'Martin Scorsese',
        text: "Cinema is a matter of what's in the frame and what's out.",
        author: "— Martin Scorsese",
        photo: './images/directors/scorsese.webp'
      },
      {
        id: 'godard',
        name: 'Jean-Luc Godard',
        text: "Cinema is truth 24 frames-per-second.",
        author: "— Jean-Luc Godard",
        photo: './images/directors/godard.webp'
      },
      {
        id: 'kubrick',
        name: 'Stanley Kubrick',
        text: "If it can be written, or thought, it can be filmed.",
        author: "— Stanley Kubrick",
        photo: './images/directors/kubrick.webp'
      },
      {
        id: 'welles',
        name: 'Orson Welles',
        text: "A film is never really good unless the camera is an eye in the head of a poet.",
        author: "— Orson Welles",
        photo: './images/directors/welles.webp'
      },
      {
        id: 'capra',
        name: 'Frank Capra',
        text: "There are no rules in filmmaking. Only sins. And the cardinal sin is dullness.",
        author: "— Frank Capra",
        photo: './images/directors/capra.webp'
      },
      {
        id: 'truffaut',
        name: 'François Truffaut',
        text: "To make a film is to improve on life, to arrange movement as you would arrange a room.",
        author: "— François Truffaut",
        photo: './images/directors/truffaut.webp'
      },
      {
        id: 'tarantino',
        name: 'Quentin Tarantino',
        text: "When people ask me if I went to film school, I tell them, 'No, I went to films.'",
        author: "— Quentin Tarantino",
        photo: './images/directors/tarantino.webp'
      }
    ];

    let currentIndex = 0;
    let timer = null;

    const goToQuote = (nextIdx) => {
      currentIndex = nextIdx;
      const nextQuote = quotes[currentIndex];

      textEl.classList.add('is-changing');
      authorEl.classList.add('is-changing');
      if (portraitEl) portraitEl.classList.add('is-changing');

      setTimeout(() => {
        textEl.textContent = nextQuote.text;
        authorEl.textContent = nextQuote.author;
        if (portraitEl) {
          if (nextQuote.photo) {
            portraitEl.style.backgroundImage = `url(${nextQuote.photo})`;
            portraitEl.style.display = 'block';
          } else {
            portraitEl.style.backgroundImage = 'none';
          }
          portraitEl.classList.remove('is-changing');
        }
        textEl.classList.remove('is-changing');
        authorEl.classList.remove('is-changing');
      }, 450);
    };

    const restartTimer = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        const nextIdx = (currentIndex + 1) % quotes.length;
        goToQuote(nextIdx);
      }, 6500);
    };

    // Initial setup
    if (portraitEl && quotes[0].photo) {
      portraitEl.style.backgroundImage = `url(${quotes[0].photo})`;
      portraitEl.style.display = 'block';
    }
    restartTimer();
  }

  initViewfinderTimecode() {
    const tcEl = document.getElementById('hero-live-tc');
    if (!tcEl) return;

    let h = 1, m = 24, s = 8, f = 14;
    setInterval(() => {
      f++;
      if (f >= 24) {
        f = 0;
        s++;
        if (s >= 60) {
          s = 0;
          m++;
          if (m >= 60) {
            m = 0;
            h++;
          }
        }
      }
      const pad = (n) => String(n).padStart(2, '0');
      tcEl.textContent = `TC ${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
    }, 1000 / 24);
  }

  initLenis() {
    // On mobile devices: use 100% native momentum scrolling (iOS Safari 120Hz & Android).
    // Virtual scroll libraries intercept touch events, creating stutter, fighting gesture inertia,
    // and causing jittery rubber-banding.
    if (this.mobile) {
      ScrollTrigger.config({ ignoreMobileResize: true });
      ScrollTrigger.refresh();
      return;
    }

    const config = {
      lerp: 0.08,
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 1.5,
    };

    this.lenis = new Lenis(config);

    // Sync Lenis with ScrollTrigger
    this.lenis.on('scroll', ScrollTrigger.update);

    // Drive Lenis through GSAP ticker for frame-perfect sync
    gsap.ticker.add((time) => {
      if (this.lenis) {
        this.lenis.raf(time * 1000);
      }
    });

    // Disable lag smoothing to prevent jumpy catch-up frames
    gsap.ticker.lagSmoothing(0);
  }
}

// ─── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  try {
    new MiseFilmsApp();
  } catch (err) {
    console.error('[Mise Films] Fatal boot error:', err);
    // Last resort: make the page scrollable no matter what
    unlockScroll();
    forceCleanup();
  }
});
