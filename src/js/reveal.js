// ─── Reveal Sequence ───────────────────────────────────────────
// Enhances hero statement and UI with subtle polish
// without ever obscuring or hiding content.

import gsap from 'gsap';

export class RevealSequence {
  constructor({ onComplete } = {}) {
    this.onComplete = onComplete;
  }

  play() {
    // Ensure all critical elements are immediately visible
    const nav = document.getElementById('nav');
    if (nav) nav.style.opacity = '1';

    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) soundToggle.style.opacity = '1';

    // Unlock scroll
    document.documentElement.classList.remove('is-locked');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';

    // Subtle progressive entrance animation
    const heroCamShowcase = document.querySelector('.hero__cam-showcase');
    const heroContent = document.querySelector('.hero__content');
    const heroSpotlightShowcase = document.querySelector('.hero__spotlight-showcase');

    if (heroCamShowcase && heroContent) {
      gsap.fromTo(
        heroCamShowcase,
        { opacity: 0.6, x: -15 },
        { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' }
      );
      if (heroSpotlightShowcase) {
        gsap.fromTo(
          heroSpotlightShowcase,
          { opacity: 0.6, x: 15 },
          { opacity: 1, x: 0, duration: 0.8, ease: 'power2.out' }
        );
      }
      gsap.fromTo(
        heroContent,
        { opacity: 0.6, y: 15 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
      );
    }

    this.onComplete?.();
  }

  cleanup() {
    const remove = ['#cine-entry', '#preloader', '#curtain'];
    remove.forEach((sel) => {
      const el = document.querySelector(sel);
      if (el) el.remove();
    });
  }
}
