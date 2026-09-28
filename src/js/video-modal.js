// ─── Video Lightbox Modal ──────────────────────────────────────
// Plays YouTube and Instagram Reels directly inside the website
// without redirecting to external sites.
// Includes foley sound integration, ambient sound pausing,
// responsive aspect ratio handling, and smooth GSAP entrance/exit.

import gsap from 'gsap';

export class VideoModal {
  constructor({ soundManager = null, lenis = null } = {}) {
    this.soundManager = soundManager;
    this.lenis = lenis;

    this.modal = document.getElementById('video-modal');
    this.backdrop = document.getElementById('video-modal-backdrop');
    this.closeBtn = document.getElementById('video-modal-close');
    this.playerWrap = document.getElementById('video-modal-player-wrap');
    this.titleEl = document.getElementById('video-modal-title');
    this.badgeEl = document.getElementById('video-modal-badge');
    this.extLink = document.getElementById('video-modal-ext');
    this.extText = document.getElementById('video-modal-ext-text');

    this.isOpen = false;
    this.wasAmbientPlaying = false;

    if (!this.modal) return;

    this.init();
  }

  init() {
    // Backdrop click closes modal
    this.backdrop?.addEventListener('click', () => this.close());

    // Close button click
    this.closeBtn?.addEventListener('click', () => this.close());

    // Escape key listener
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Intercept project cards that link to YouTube or Instagram
    this.bindProjectCards();
  }

  bindProjectCards() {
    const cards = document.querySelectorAll('.project-card');

    cards.forEach((card) => {
      card.addEventListener('click', (e) => {
        // Allow ctrl/cmd + click to open in new tab if user explicitly intends to
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
          return;
        }

        const href = card.getAttribute('href');
        if (!href) return;

        const videoInfo = this.parseVideoUrl(href);
        if (videoInfo) {
          e.preventDefault();

          const title = card.querySelector('.project-card__title')?.textContent || 'Mise Films Production';
          const category = card.querySelector('.project-card__category')?.textContent || 'Featured Film';

          this.open({
            url: href,
            title,
            category,
            ...videoInfo,
          });
        }
      });
    });
  }

  parseVideoUrl(url) {
    if (!url) return null;

    // YouTube formats: watch?v=ID, youtu.be/ID, embed/ID, shorts/ID
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (ytMatch) {
      return {
        type: 'youtube',
        id: ytMatch[1],
      };
    }

    // Instagram formats: /reel/ID/, /p/ID/, /tv/ID/
    const igMatch = url.match(
      /instagram\.com\/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/
    );
    if (igMatch) {
      return {
        type: 'instagram',
        id: igMatch[1],
      };
    }

    return null;
  }

  open({ url, title, category, type, id }) {
    if (this.isOpen) return;
    this.isOpen = true;

    // Sound effect
    if (this.soundManager) {
      this.soundManager.playFoley('mechanical', 0.4);
      if (this.soundManager.isAmbientPlaying) {
        this.wasAmbientPlaying = true;
        this.soundManager.stopAmbient();
      }
    }

    // Stop Lenis smooth scroll while watching
    if (this.lenis) {
      this.lenis.stop();
    }
    document.documentElement.style.overflow = 'hidden';

    // Update modal meta
    if (this.titleEl) this.titleEl.textContent = title;
    if (this.badgeEl) this.badgeEl.textContent = category;
    if (this.extLink) {
      this.extLink.href = url;
      if (this.extText) {
        this.extText.textContent = type === 'instagram' ? 'Watch on Instagram' : 'Watch on YouTube';
      }
    }

    // Configure dialog classes based on video type
    this.modal.classList.remove('video-modal--youtube', 'video-modal--instagram');
    this.modal.classList.add(`video-modal--${type}`);

    // Build responsive iframe
    let iframeHtml = '';
    if (type === 'youtube') {
      iframeHtml = `
        <iframe
          class="video-modal__iframe video-modal__iframe--youtube"
          src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1"
          title="${title}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      `;
    } else if (type === 'instagram') {
      iframeHtml = `
        <iframe
          class="video-modal__iframe video-modal__iframe--instagram"
          src="https://www.instagram.com/reel/${id}/embed/"
          title="${title}"
          frameborder="0"
          scrolling="no"
          allowtransparency="true"
          allowfullscreen
        ></iframe>
      `;
    }

    if (this.playerWrap) {
      this.playerWrap.innerHTML = iframeHtml;
    }

    // Animate modal in
    this.modal.setAttribute('aria-hidden', 'false');
    this.modal.classList.add('is-active');

    const dialog = this.modal.querySelector('.video-modal__dialog');
    gsap.fromTo(
      this.backdrop,
      { opacity: 0 },
      { opacity: 1, duration: 0.35, ease: 'power2.out' }
    );
    gsap.fromTo(
      dialog,
      { opacity: 0, scale: 0.93, y: 25 },
      { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'power3.out' }
    );
  }

  close() {
    if (!this.isOpen) return;

    const dialog = this.modal.querySelector('.video-modal__dialog');

    gsap.to(dialog, {
      opacity: 0,
      scale: 0.94,
      y: 15,
      duration: 0.25,
      ease: 'power2.in',
    });

    gsap.to(this.backdrop, {
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        this.modal.classList.remove('is-active');
        this.modal.setAttribute('aria-hidden', 'true');

        // Destroy iframe to stop video & sound immediately
        if (this.playerWrap) {
          this.playerWrap.innerHTML = '';
        }

        // Restore scroll
        document.documentElement.style.overflow = '';
        if (this.lenis) {
          this.lenis.start();
        }

        // Resume ambient audio if it was running prior to opening
        if (this.wasAmbientPlaying && this.soundManager) {
          this.soundManager.startAmbient();
          this.wasAmbientPlaying = false;
        }

        this.isOpen = false;
      },
    });
  }
}
