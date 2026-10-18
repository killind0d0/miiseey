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
import { BtsSection } from './bts-section.js';

gsap.registerPlugin(ScrollTrigger);

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
  ['#cine-entry', '#preloader', '#curtain'].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.remove();
  });

  const nav = document.getElementById('nav');
  if (nav) nav.style.opacity = '1';
  const soundToggle = document.getElementById('sound-toggle');
  if (soundToggle) soundToggle.style.opacity = '1';

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

  document.querySelectorAll('[data-reveal]').forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
}

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

      new TextSplitter();

      const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced) {
        unlockScroll();
        forceCleanup();
        this.initPostReveal();
        return;
      }

      new CinematicEntry({
        onCurtainOpen: () => {
          unlockScroll();
          this.initPostReveal();
        },
        onComplete: () => this.onPreloaderComplete(),
      });

      this._failsafeTimer = setTimeout(() => {
        unlockScroll();
        forceCleanup();
        this.initPostReveal();
      }, 6000);
    } catch (err) {
      console.error(err);
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
      console.warn(err);
    }
  }

  initPostReveal() {
    if (this._postRevealDone) return;
    this._postRevealDone = true;

    try {
      this.initLenis();
    } catch (err) {
      console.warn(err);
    }

    try {
      this.scrollAnims = new ScrollAnimations();
    } catch (err) {
      console.warn(err);
    }

    if (!this.mobile) {
      try {
        this.cursor = new CustomCursor();
      } catch (err) {
        console.warn(err);
      }

      try {
        this.grain = new FilmGrain();
        this.grain.start();
      } catch (err) {
        console.warn(err);
      }
    }

    let soundManager = null;
    try {
      soundManager = new AmbientSound();
    } catch (err) {
      console.warn(err);
    }

    try {
      new VideoModal({
        soundManager,
        lenis: this.lenis,
      });
    } catch (err) {
      console.warn(err);
    }

    try {
      new MobileMenu();
    } catch (err) {
      console.warn(err);
    }

    try {
      new WorkShowcase({ lenis: this.lenis });
    } catch (err) {
      console.warn(err);
    }

    try {
      new BtsSection({ soundManager });
    } catch (err) {
      console.warn(err);
    }

    try {
      const heroVideo = document.getElementById('hero-intro-video') || document.querySelector('.hero__video');
      if (heroVideo) {
        heroVideo.muted = true;
        heroVideo.loop = false;
        heroVideo.removeAttribute('loop');

        const isMobileDevice = window.matchMedia('(max-width: 768px)').matches;
        const source = heroVideo.querySelector('source');
        if (source) {
          source.src = isMobileDevice ? './videos/mise-intro-mobile.mp4' : './videos/mise-intro-1080.mp4';
        } else {
          heroVideo.src = isMobileDevice ? './videos/mise-intro-mobile.mp4' : './videos/mise-intro-1080.mp4';
        }
        heroVideo.load();
        heroVideo.play().catch(() => {});

        heroVideo.addEventListener('ended', () => {
          heroVideo.pause();
          if (heroVideo.duration) {
            heroVideo.currentTime = Math.max(0, heroVideo.duration - 0.05);
          }
        });
      }
    } catch (err) {
      console.warn(err);
    }

    try {
      new ClapperLike();
    } catch (err) {}

    this.initViewfinderTimecode();
    this.initQuoteRotator();

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
    this.lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      if (this.lenis) {
        this.lenis.raf(time * 1000);
      }
    });

    gsap.ticker.lagSmoothing(0);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    new MiseFilmsApp();
  } catch (err) {
    unlockScroll();
    forceCleanup();
  }
});
