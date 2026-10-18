export class ClapperLike {
  constructor() {
    this.board = document.getElementById('clapper-board');
    this.likeCountEl = document.getElementById('clapper-like-count');
    this.viewerCountEl = document.getElementById('clapper-viewer-count');
    this.btnText = document.getElementById('clapper-action-txt');
    this.statusNote = document.getElementById('clapper-feedback-note');
    this.stickTop = document.getElementById('clapper-stick');
    this.audio = null;
    this.isAnimating = false;
    this.hasCountedUp = false;

    if (!this.board || this.board.dataset.clapperInit) return;
    this.board.dataset.clapperInit = 'true';

    this.baseLikes = 842;
    this.baseViewers = 1428;
    this.storageKeyLikes = 'mise_like_count';
    this.storageKeyViewers = 'mise_viewer_count';
    this.sessionKeyLiked = 'mise_session_liked';
    this.sessionKeyVisited = 'mise_session_visited';

    this.initAudio();
    this.loadState();
    this.bindEvents();
    this.initIntersectionObserver();
  }

  initAudio() {
    try {
      this.audio = new Audio('./assets/audio/camera-shutter.mp3');
      this.audio.preload = 'auto';
    } catch {}
  }

  loadState() {
    let savedViewers = localStorage.getItem(this.storageKeyViewers);
    let currentViewers = savedViewers ? parseInt(savedViewers, 10) : this.baseViewers;
    
    const hasVisitedSession = sessionStorage.getItem(this.sessionKeyVisited) === 'true';
    if (!hasVisitedSession) {
      currentViewers += 1;
      localStorage.setItem(this.storageKeyViewers, currentViewers);
      sessionStorage.setItem(this.sessionKeyVisited, 'true');
    }
    this.currentViewers = currentViewers;

    let savedLikes = localStorage.getItem(this.storageKeyLikes);
    this.currentLikes = savedLikes ? parseInt(savedLikes, 10) : this.baseLikes;
    this.hasLikedInSession = sessionStorage.getItem(this.sessionKeyLiked) === 'true';

    if (this.viewerCountEl) {
      this.viewerCountEl.textContent = this.currentViewers.toLocaleString();
    }
    if (this.likeCountEl) {
      this.likeCountEl.textContent = this.currentLikes.toLocaleString();
    }

    if (this.hasLikedInSession) {
      this.setLikedUI(false);
    }
  }

  initIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.hasCountedUp) {
          this.hasCountedUp = true;
          this.animateCountUp();
          observer.disconnect();
        }
      });
    }, { threshold: 0.2 });

    observer.observe(this.board);
  }

  animateCountUp() {
    if (!this.viewerCountEl) return;
    const target = this.currentViewers;
    const start = Math.max(0, target - 50);
    const duration = 1200; // ms
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(start + (target - start) * ease);
      this.viewerCountEl.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        this.viewerCountEl.textContent = target.toLocaleString();
      }
    };
    requestAnimationFrame(step);
  }

  bindEvents() {
    const handler = (e) => {
      e.preventDefault();
      this.clap();
    };

    this.board.addEventListener('click', handler);
    this.board.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.clap();
      }
    });
  }

  playSnapSound() {
    if (this.audio) {
      this.audio.currentTime = 0;
      this.audio.play().catch(() => {
        this.playSyntheticSnap();
      });
    } else {
      this.playSyntheticSnap();
    }
  }

  playSyntheticSnap() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {}
  }

  spawnFloatingBadge(text) {
    const badge = document.createElement('div');
    badge.className = 'clapper-floating-badge';
    badge.textContent = text;
    this.board.appendChild(badge);

    setTimeout(() => {
      badge.remove();
    }, 1100);
  }

  clap() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.board.classList.remove('is-clapping-cycle');
    void this.board.offsetWidth; // Force reflow
    this.board.classList.add('is-clapping-cycle');

    setTimeout(() => {
      this.playSnapSound();
      if (navigator.vibrate) {
        try {
          navigator.vibrate([30, 40, 50]);
        } catch {}
      }
    }, 260);

    if (!this.hasLikedInSession) {
      this.hasLikedInSession = true;
      sessionStorage.setItem(this.sessionKeyLiked, 'true');

      this.currentLikes += 1;
      localStorage.setItem(this.storageKeyLikes, this.currentLikes);

      setTimeout(() => {
        if (this.likeCountEl) {
          this.likeCountEl.style.transform = 'scale(1.35)';
          this.likeCountEl.style.color = '#f5d794';
          this.likeCountEl.style.textShadow = '0 0 16px rgba(212, 168, 83, 0.8)';
          this.likeCountEl.textContent = this.currentLikes.toLocaleString();

          setTimeout(() => {
            this.likeCountEl.style.transform = 'none';
            this.likeCountEl.style.color = '';
            this.likeCountEl.style.textShadow = '';
          }, 280);
        }

        this.spawnFloatingBadge('+1 LIKE 🎬');
        this.setLikedUI(true);
      }, 270);
    } else {
      setTimeout(() => {
        this.spawnFloatingBadge('CLAP! 🎬');
        if (this.statusNote) {
          this.statusNote.textContent = '✓ Take already approved in this session • Thank you!';
          this.statusNote.style.color = '#f5d794';
          setTimeout(() => {
            if (this.statusNote) this.statusNote.style.color = '';
          }, 2600);
        }
      }, 270);
    }

    setTimeout(() => {
      this.board.classList.remove('is-clapping-cycle');
      this.isAnimating = false;
    }, 500);
  }

  setLikedUI(isNew) {
    this.board.classList.add('is-liked');
    if (this.btnText) {
      this.btnText.textContent = `✓ TAKE APPROVED // ${this.currentLikes.toLocaleString()} LIKES`;
    }
    if (this.statusNote) {
      this.statusNote.textContent = isNew
        ? `✓ Take approved! Total production likes: ${this.currentLikes.toLocaleString()}`
        : `Take approved • Liked for this session`;
    }
  }
}
