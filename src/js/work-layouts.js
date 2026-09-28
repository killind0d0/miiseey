// ─── Work Layouts Demo Controller ────────────────────────────────────
// Interactive controller for reviewing and selecting Options 1, 2, 3, and 4.

export class WorkLayoutsDemo {
  constructor() {
    this.initLayoutTabs();
    this.initDirectorsSuite();
    this.initAuteurShelves();
    this.initCriterionArchive();
    this.initCinemaModal();
  }

  // ── 1. Top Layout Switcher ──
  initLayoutTabs() {
    const tabBtns = document.querySelectorAll('.layout-tab-btn');
    const sections = document.querySelectorAll('.layout-demo-section');

    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabBtns.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        const target = btn.getAttribute('data-layout-target');

        sections.forEach((sec) => {
          if (target === 'all' || sec.getAttribute('data-layout') === target) {
            sec.style.display = 'block';
            sec.style.opacity = '1';
          } else {
            sec.style.display = 'none';
            sec.style.opacity = '0';
          }
        });

        // Scroll to top of preview area smoothly
        const container = document.getElementById('layouts-container');
        if (container) {
          container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ── 2. Option 2: Director's Suite (Master Monitor + Playlist) ──
  initDirectorsSuite() {
    const masterVideo = document.getElementById('suite-master-video');
    const masterIframeWrap = document.getElementById('suite-iframe-wrap');
    const masterIframe = document.getElementById('suite-master-iframe');
    const titleEl = document.getElementById('suite-title');
    const badgeEl = document.getElementById('suite-badge');
    const creditsEl = document.getElementById('suite-credits');
    const linkEl = document.getElementById('suite-link');
    const linkText = document.getElementById('suite-link-text');
    const items = document.querySelectorAll('.suite-playlist__item');

    items.forEach((item) => {
      item.addEventListener('click', () => {
        items.forEach((i) => i.classList.remove('is-active'));
        item.classList.add('is-active');

        const vSrc = item.getAttribute('data-video-src');
        const vType = item.getAttribute('data-video-type') || 'local';
        const ytId = item.getAttribute('data-yt-id');
        const title = item.getAttribute('data-title');
        const badge = item.getAttribute('data-badge');
        const credits = item.getAttribute('data-credits');
        const postUrl = item.getAttribute('data-post-url');
        const platform = item.getAttribute('data-platform') || 'Instagram';

        if (titleEl) titleEl.textContent = title;
        if (badgeEl) badgeEl.textContent = badge;
        if (creditsEl) creditsEl.textContent = credits;

        if (linkEl) {
          linkEl.href = postUrl || '#';
          if (linkText) linkText.textContent = platform === 'Instagram' ? 'Open Reel on Instagram' : 'Watch on YouTube';
        }

        if (vType === 'local' && vSrc) {
          if (masterIframeWrap) masterIframeWrap.style.display = 'none';
          if (masterIframe) masterIframe.src = '';
          if (masterVideo) {
            masterVideo.style.display = 'block';
            masterVideo.src = vSrc;
            masterVideo.currentTime = 0;
            masterVideo.play().catch(() => {});
          }
        } else if (ytId) {
          if (masterVideo) {
            try { masterVideo.pause(); } catch (_) {}
            masterVideo.style.display = 'none';
            masterVideo.src = '';
          }
          if (masterIframeWrap) masterIframeWrap.style.display = 'block';
          if (masterIframe) masterIframe.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`;
        }
      });
    });
  }

  // ── 3. Option 3: Auteur Film Shelves (Horizontal Carousels) ──
  initAuteurShelves() {
    const carousels = document.querySelectorAll('.shelf-carousel-wrap');

    carousels.forEach((wrap) => {
      const track = wrap.querySelector('.shelf-carousel');
      const prevBtn = wrap.querySelector('.shelf-arrow--prev');
      const nextBtn = wrap.querySelector('.shelf-arrow--next');

      if (!track) return;

      const scrollStep = 360;

      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          track.scrollBy({ left: -scrollStep, behavior: 'smooth' });
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          track.scrollBy({ left: scrollStep, behavior: 'smooth' });
        });
      }
    });
  }

  // ── 4. Option 4: Criterion Archive (Table + Live Spotlight) ──
  initCriterionArchive() {
    const rows = document.querySelectorAll('.criterion-row');
    const spotImg = document.getElementById('spotlight-img');
    const spotVideo = document.getElementById('spotlight-video');
    const spotTitle = document.getElementById('spotlight-title');
    const spotBadge = document.getElementById('spotlight-badge');
    const spotCredits = document.getElementById('spotlight-credits');
    const spotLink = document.getElementById('spotlight-link');
    const spotLinkText = document.getElementById('spotlight-link-text');
    const spotPlayBtn = document.getElementById('spotlight-play-btn');

    rows.forEach((row) => {
      const activate = () => {
        rows.forEach((r) => r.classList.remove('is-active'));
        row.classList.add('is-active');

        const vSrc = row.getAttribute('data-video-src');
        const poster = row.getAttribute('data-poster');
        const title = row.getAttribute('data-title');
        const badge = row.getAttribute('data-badge');
        const credits = row.getAttribute('data-credits');
        const postUrl = row.getAttribute('data-post-url');
        const platform = row.getAttribute('data-platform') || 'Instagram';
        const ytId = row.getAttribute('data-yt-id');

        if (spotTitle) spotTitle.textContent = title;
        if (spotBadge) spotBadge.textContent = badge;
        if (spotCredits) spotCredits.textContent = credits;

        if (spotLink) {
          spotLink.href = postUrl || '#';
          if (spotLinkText) spotLinkText.textContent = platform === 'Instagram' ? 'Open on Instagram' : 'Watch on YouTube';
        }

        if (spotPlayBtn) {
          spotPlayBtn.onclick = () => {
            this.openModalDirect({ vSrc, ytId, title, postUrl, platform });
          };
        }

        if (vSrc && spotVideo) {
          if (spotImg) spotImg.style.display = 'none';
          spotVideo.style.display = 'block';
          spotVideo.src = vSrc;
          spotVideo.currentTime = 0;
          spotVideo.play().catch(() => {});
        } else if (poster && spotImg) {
          if (spotVideo) {
            try { spotVideo.pause(); } catch (_) {}
            spotVideo.style.display = 'none';
          }
          spotImg.style.display = 'block';
          spotImg.src = poster;
        }
      };

      row.addEventListener('mouseenter', activate);
      row.addEventListener('click', activate);
    });
  }

  // ── Universal In-Site Cinema Modal ──
  initCinemaModal() {
    this.modal = document.getElementById('cinema-modal');
    if (!this.modal) return;

    this.modalPlayer = document.getElementById('modal-video-player');
    this.modalIframeWrap = document.getElementById('modal-youtube-wrap');
    this.modalIframe = document.getElementById('modal-youtube-player');
    this.modalTitle = document.getElementById('modal-video-title');
    this.modalExtLink = document.getElementById('modal-external-link');
    this.modalExtText = document.getElementById('modal-external-text');
    this.modalCloseBtn = document.getElementById('modal-close-btn');
    this.modalBackdrop = document.getElementById('cinema-modal-backdrop');

    const closeModal = () => this.closeModal();

    if (this.modalCloseBtn) this.modalCloseBtn.addEventListener('click', closeModal);
    if (this.modalBackdrop) this.modalBackdrop.addEventListener('click', closeModal);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('is-open')) {
        closeModal();
      }
    });

    // Delegate clicks from any card marked with .js-play-cinema
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.js-play-cinema');
      if (!card) return;

      if (e.target.closest('a[target="_blank"]')) return;

      e.preventDefault();
      const vSrc = card.getAttribute('data-video-src');
      const ytId = card.getAttribute('data-yt-id');
      const title = card.getAttribute('data-title');
      const postUrl = card.getAttribute('data-post-url') || card.getAttribute('data-insta-url');
      const platform = card.getAttribute('data-platform') || (ytId ? 'YouTube' : 'Instagram');

      this.openModalDirect({ vSrc, ytId, title, postUrl, platform });
    });
  }

  openModalDirect({ vSrc, ytId, title, postUrl, platform }) {
    if (!this.modal) return;

    if (this.modalTitle) this.modalTitle.textContent = title || 'Mise Films Cinema';

    if (vSrc) {
      if (this.modalIframeWrap) this.modalIframeWrap.style.display = 'none';
      if (this.modalIframe) this.modalIframe.src = '';
      if (this.modalPlayer) {
        this.modalPlayer.style.display = 'block';
        this.modalPlayer.src = vSrc;
        this.modalPlayer.currentTime = 0;
        this.modalPlayer.play().catch(() => {});
      }
      if (this.modalExtLink) {
        this.modalExtLink.href = postUrl || '#';
        if (this.modalExtText) this.modalExtText.textContent = platform === 'Instagram' ? 'Open Reel on Instagram' : 'Open Link';
      }
    } else if (ytId) {
      if (this.modalPlayer) {
        try { this.modalPlayer.pause(); } catch (_) {}
        this.modalPlayer.style.display = 'none';
        this.modalPlayer.src = '';
      }
      if (this.modalIframeWrap) this.modalIframeWrap.style.display = 'block';
      if (this.modalIframe) this.modalIframe.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`;
      if (this.modalExtLink) {
        this.modalExtLink.href = postUrl || `https://www.youtube.com/watch?v=${ytId}`;
        if (this.modalExtText) this.modalExtText.textContent = 'Watch on YouTube';
      }
    }

    this.modal.classList.add('is-open');
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.classList.remove('is-open');
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (this.modalPlayer) {
      try {
        this.modalPlayer.pause();
        this.modalPlayer.src = '';
      } catch (_) {}
    }
    if (this.modalIframe) {
      this.modalIframe.src = '';
    }
  }
}

// Auto init on page load
document.addEventListener('DOMContentLoaded', () => {
  new WorkLayoutsDemo();
});
