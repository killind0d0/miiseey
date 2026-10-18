export class BtsSection {
  constructor({ soundManager = null } = {}) {
    this.soundManager = soundManager;
    this.section = document.getElementById('bts');
    this.cards = document.querySelectorAll('.bts-reel-card');
    this.isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    if (!this.section || this.cards.length === 0) return;
    this.init();
  }

  init() {
    this.initReelCards();
    this.initTelemetryClocks();
  }

  initReelCards() {
    let observer = null;
    if (this.isTouch && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const video = entry.target.querySelector('video');
            if (!video) return;

            if (entry.isIntersecting) {
              video.play().catch(() => {});
              entry.target.classList.add('is-previewing');
            } else {
              video.pause();
              entry.target.classList.remove('is-previewing');
            }
          });
        },
        { threshold: 0.5 }
      );
    }

    this.cards.forEach((card) => {
      const video = card.querySelector('.bts-reel-card__video');
      const soundBtn = card.querySelector('.bts-reel-card__sound-btn');

      if (observer) {
        observer.observe(card);
      }

      if (!this.isTouch && video) {
        card.addEventListener('mouseenter', () => {
          card.classList.add('is-previewing');
          video.play().catch(() => {});
          if (this.soundManager) {
            this.soundManager.playFoley('subtle', 0.15);
          }
        });

        card.addEventListener('mouseleave', () => {
          card.classList.remove('is-previewing');
          video.pause();
          video.currentTime = 0;
          if (soundBtn) {
            video.muted = true;
            soundBtn.classList.remove('is-unmuted');
            soundBtn.setAttribute('aria-label', 'Unmute preview');
          }
        });
      }

      if (soundBtn && video) {
        soundBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          video.muted = !video.muted;
          soundBtn.classList.toggle('is-unmuted', !video.muted);
          soundBtn.setAttribute(
            'aria-label',
            video.muted ? 'Unmute preview' : 'Mute preview'
          );
          if (this.soundManager) {
            this.soundManager.playFoley('click', 0.2);
          }
        });
      }
    });
  }

  initTelemetryClocks() {
    const btsTc = document.getElementById('bts-live-tc');
    if (!btsTc) return;

    let frames = 18;
    let sec = 42;
    let min = 16;
    let hr = 2;

    setInterval(() => {
      frames++;
      if (frames >= 24) {
        frames = 0;
        sec++;
        if (sec >= 60) {
          sec = 0;
          min++;
          if (min >= 60) {
            min = 0;
            hr++;
          }
        }
      }
      const pad = (n) => String(n).padStart(2, '0');
      btsTc.textContent = `REC ${pad(hr)}:${pad(min)}:${pad(sec)}:${pad(frames)}`;
    }, 1000 / 24);
  }
}
