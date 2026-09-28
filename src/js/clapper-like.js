// ─── Clapperboard Like Component ─────────────────────────────
// Interactive film production slate at page end.
// Works on all devices (mobile, tablet, desktop).
// - Resting state: CLOSED (0deg)
// - On click: full open-and-clap cycle (-28deg open -> snaps shut 0deg)
// - Viewers count: increments +1 per site visit (persisted in localStorage)
// - Likes count: increments +1 only once per session (persisted in localStorage)

export class ClapperLike {
  constructor() {
    this.board = document.getElementById('clapper-board');
    this.likeCountEl = document.getElementById('clapper-like-count');
    this.viewerCountEl = document.getElementById('clapper-viewer-count');
    this.btnText = document.getElementById('clapper-action-txt');
    this.statusNote = document.getElementById('clapper-feedback-note');
    this.audio = null;
    this.isAnimating = false;

    if (!this.board) return;

    this.baseLikes = 842;
    this.baseViewers = 1428;
    this.storageKeyLikes = 'mise_like_count';
    this.storageKeyViewers = 'mise_viewer_count';
    this.sessionKeyLiked = 'mise_session_liked';
    this.sessionKeyVisited = 'mise_session_visited';

    this.initAudio();
    this.loadState();
    this.bindEvents();
  }

  initAudio() {
    try {
      this.audio = new Audio('./assets/audio/camera-shutter.mp3');
      this.audio.preload = 'auto';
    } catch {}
  }

  loadState() {
    // 1. Viewer count logic (+1 per new visit)
    let savedViewers = localStorage.getItem(this.storageKeyViewers);
    let currentViewers = savedViewers ? parseInt(savedViewers, 10) : this.baseViewers;

    const hasVisitedSession = sessionStorage.getItem(this.sessionKeyVisited) === 'true';
    if (!hasVisitedSession) {
      currentViewers += 1;
      localStorage.setItem(this.storageKeyViewers, currentViewers);
      sessionStorage.setItem(this.sessionKeyVisited, 'true');
    }

    if (this.viewerCountEl) {
      this.viewerCountEl.textContent = currentViewers.toLocaleString();
    }

    // 2. Likes count logic
    const savedLikes = localStorage.getItem(this.storageKeyLikes);
    this.currentLikes = savedLikes ? parseInt(savedLikes, 10) : this.baseLikes;
    this.hasLikedInSession = sessionStorage.getItem(this.sessionKeyLiked) === 'true';

    if (this.likeCountEl) {
      this.likeCountEl.textContent = this.currentLikes.toLocaleString();
    }

    if (this.hasLikedInSession) {
      this.setLikedUI(false);
    }
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
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  clap() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // 1. Full Open and Clap Animation Cycle (Starts closed, opens to ~-28deg, snaps shut to 0deg)
    this.board.classList.remove('is-clapping-cycle');
    void this.board.offsetWidth; // Force reflow
    this.board.classList.add('is-clapping-cycle');

    // Tactile sound and haptic vibration at the exact moment of closure (~280ms into cycle)
    setTimeout(() => {
      this.playSnapSound();
      if (navigator.vibrate) {
        try {
          navigator.vibrate([25, 30, 45]);
        } catch {}
      }
    }, 280);

    // End of cycle (~480ms)
    setTimeout(() => {
      this.board.classList.remove('is-clapping-cycle');
      this.isAnimating = false;
    }, 500);

    // 2. Session check: only 1 like per session
    if (!this.hasLikedInSession) {
      this.hasLikedInSession = true;
      sessionStorage.setItem(this.sessionKeyLiked, 'true');

      this.currentLikes += 1;
      localStorage.setItem(this.storageKeyLikes, this.currentLikes);

      // Number pop animation at the moment of the snap
      setTimeout(() => {
        if (this.likeCountEl) {
          this.likeCountEl.style.transform = 'scale(1.3)';
          this.likeCountEl.textContent = this.currentLikes.toLocaleString();
          setTimeout(() => {
            this.likeCountEl.style.transform = 'none';
          }, 240);
        }
        this.setLikedUI(true);
      }, 280);
    } else {
      // Feedback if already clicked in this session
      if (this.statusNote) {
        this.statusNote.textContent = 'Take already approved in this session! Thank you for watching.';
        this.statusNote.style.color = '#f0d28d';
        setTimeout(() => {
          this.statusNote.style.color = '';
        }, 2600);
      }
    }
  }

  setLikedUI(isNew) {
    this.board.classList.add('is-liked');
    if (this.btnText) {
      this.btnText.textContent = '✓ TAKE APPROVED // YOU LIKED THIS';
    }
    if (this.statusNote) {
      this.statusNote.textContent = isNew
        ? '✓ Take approved! Your like has been registered for this session.'
        : 'Take approved • Liked for this session';
    }
  }
}
