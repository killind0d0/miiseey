// ─── Custom Cursor with Magnetic Hover ─────────────────────────
// Dot + ring cursor with GSAP smooth following.
// Magnetic effect pulls cursor toward hoverable elements.
// Respects prefers-reduced-motion and touch devices.

import gsap from 'gsap';

export class CustomCursor {
  constructor() {
    this.cursor = document.getElementById('cursor');
    if (!this.cursor) return;

    this.dot = this.cursor.querySelector('.cursor__dot');
    this.ring = this.cursor.querySelector('.cursor__ring');

    // Skip on touch devices or reduced motion
    if (this.isTouchDevice() || this.prefersReducedMotion()) {
      this.cursor.style.display = 'none';
      return;
    }

    this.pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.mouse = { x: this.pos.x, y: this.pos.y };
    this.speed = 0.15; // Ring lag factor

    this.magneticElements = [];
    this.currentMagnetic = null;

    this.init();
  }

  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  init() {
    // Mouse move
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    // Track hoverable elements
    this.bindHoverables();

    // Bind magnetic elements
    this.bindMagnetics();

    // Start render loop
    this.render();
  }

  bindHoverables() {
    // Links, buttons, and any [data-cursor] elements
    const hoverables = document.querySelectorAll(
      'a, button, [data-cursor], .project-card'
    );

    hoverables.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        const cursorType = el.dataset.cursor;
        if (cursorType === 'play') {
          this.cursor.classList.add('is-play');
        } else {
          this.cursor.classList.add('is-hovering');
        }
      });

      el.addEventListener('mouseleave', () => {
        this.cursor.classList.remove('is-hovering', 'is-play');
      });
    });
  }

  bindMagnetics() {
    const magnetics = document.querySelectorAll('[data-magnetic]');

    magnetics.forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = (e.clientX - centerX) * 0.3;
        const deltaY = (e.clientY - centerY) * 0.3;

        gsap.to(el, {
          x: deltaX,
          y: deltaY,
          duration: 0.4,
          ease: 'power3.out',
        });
      });

      el.addEventListener('mouseleave', () => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'elastic.out(1, 0.5)',
        });
      });
    });
  }

  render() {
    // Dot follows mouse exactly
    gsap.set(this.dot, {
      x: this.mouse.x,
      y: this.mouse.y,
    });

    // Ring lags behind
    this.pos.x += (this.mouse.x - this.pos.x) * this.speed;
    this.pos.y += (this.mouse.y - this.pos.y) * this.speed;

    gsap.set(this.ring, {
      x: this.pos.x,
      y: this.pos.y,
    });

    requestAnimationFrame(() => this.render());
  }
}
