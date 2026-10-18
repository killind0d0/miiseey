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
    this.backdrop?.addEventListener('click', () => this.close());
    this.closeBtn?.addEventListener('click', () => this.close());

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    this.bindProjectCards();
  }

  bindProjectCards() {
    const cards = document.querySelectorAll('.project-card, .bts-reel-card, [data-video-url]');

    cards.forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

        const href = card.getAttribute('data-video-url') || card.getAttribute('href');
        if (!href) return;

        const videoInfo = this.parseVideoUrl(href);
        if (videoInfo) {
          e.preventDefault();

          const title = card.getAttribute('data-video-title') || card.querySelector('.project-card__title, .bts-reel-card__title')?.textContent || 'Mise Films Production';
          const category = card.getAttribute('data-video-category') || card.querySelector('.project-card__category, .bts-reel-card__badge')?.textContent || 'Featured Film';
          const poster = card.getAttribute('data-video-poster') || '';

          this.open({
            url: href,
            title,
            category,
            poster,
            ...videoInfo,
          });
        }
      });
    });
  }

  parseVideoUrl(url) {
    if (!url) return null;

    const ytMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (ytMatch) {
      return { type: 'youtube', id: ytMatch[1] };
    }

    const igMatch = url.match(
      /instagram\.com\/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/
    );
    if (igMatch) {
      return { type: 'instagram', id: igMatch[1] };
    }

    if (url.match(/\.(mp4|webm)($|\?)/i) || url.includes('/videos/')) {
      return { type: 'local', id: url };
    }

    return null;
  }

  open({ url, title, category, type, id, poster = '' }) {
    if (this.isOpen) return;
    this.isOpen = true;

    if (this.soundManager) {
      this.soundManager.playFoley('mechanical', 0.4);
      if (this.soundManager.isAmbientPlaying) {
        this.wasAmbientPlaying = true;
        this.soundManager.stopAmbient();
      }
    }

    if (this.lenis) {
      this.lenis.stop();
    }
    document.documentElement.style.overflow = 'hidden';

    if (this.titleEl) this.titleEl.textContent = title;
    if (this.badgeEl) this.badgeEl.textContent = category;
    if (this.extLink) {
      if (type === 'local') {
        this.extLink.href = url;
        this.extLink.setAttribute('download', '');
        if (this.extText) {
          this.extText.textContent = 'High-Bitrate Celluloid Cut';
        }
      } else {
        this.extLink.href = url;
        this.extLink.removeAttribute('download');
        if (this.extText) {
          this.extText.textContent = type === 'instagram' ? 'Watch on Instagram' : 'Watch on YouTube';
        }
      }
    }

    this.modal.classList.remove('video-modal--youtube', 'video-modal--instagram', 'video-modal--local');
    this.modal.classList.add(`video-modal--${type}`);

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
    } else if (type === 'local') {
      iframeHtml = `
        <div class="video-modal__local-wrap">
          <video
            class="video-modal__video"
            src="${url}"
            ${poster ? `poster="${poster}"` : ''}
            controls
            autoplay
            playsinline
            preload="auto"
          ></video>
        </div>
      `;
    }

    if (this.playerWrap) {
      this.playerWrap.innerHTML = iframeHtml;
    }

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

        if (this.playerWrap) {
          const vid = this.playerWrap.querySelector('video');
          if (vid) {
            vid.pause();
            vid.src = '';
            vid.load();
          }
          this.playerWrap.innerHTML = '';
        }

        document.documentElement.style.overflow = '';
        if (this.lenis) {
          this.lenis.start();
        }

        if (this.wasAmbientPlaying && this.soundManager) {
          this.soundManager.startAmbient();
          this.wasAmbientPlaying = false;
        }

        this.isOpen = false;
      },
    });
  }
}
