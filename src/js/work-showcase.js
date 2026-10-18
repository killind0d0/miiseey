import gsap from 'gsap';

export class WorkShowcase {
  constructor({ lenis } = {}) {
    this.lenis = lenis;
    this.filterBar = document.getElementById('projects-filter');
    this.ledgerTable = document.getElementById('hybrid-ledger-table');
    this.tapeCanvas = document.getElementById('exhibition-tape-canvas');
    this.tapePauseBtn = document.getElementById('tape-pause-btn');
    this.tapePauseIcon = document.getElementById('tape-pause-icon');
    this.tapePauseText = document.getElementById('tape-pause-text');
    this.tapePrevBtn = document.getElementById('tape-prev-btn');
    this.tapeNextBtn = document.getElementById('tape-next-btn');
    this.craftSection = document.getElementById('services');

    this.currentFilmIndex = 0;
    this.currentFilmData = null;
    this.isTapePaused = false;
    this.isAutoRollEnabled = true;
    this.autoRollTimer = null;
    this.resumeTimer = null;
    this.tcHours = 1;
    this.tcMinutes = 24;
    this.tcSeconds = 8;
    this.tcFrames = 14;
    this.tcInterval = null;
    this.vuInterval = null;

    this.initCameraMonitor();
    this.initExhibitionTape();
    this.initCategoryFiltering();
    this.initCraftLinking();
    this.initCinemaModal();
  }

  initCameraMonitor() {
    this.masterVideo = document.getElementById('hybrid-master-video');
    this.iframeWrap = document.getElementById('hybrid-iframe-wrap');
    this.masterIframe = document.getElementById('hybrid-master-iframe');
    this.titleEl = document.getElementById('hybrid-title');
    this.badgeEl = document.getElementById('hybrid-badge');
    this.craftBadge = document.getElementById('hybrid-craft-badge');
    this.creditsEl = document.getElementById('hybrid-credits');
    this.linkEl = document.getElementById('hybrid-link');
    this.linkText = document.getElementById('hybrid-link-text');
    this.rollTag = document.getElementById('camera-roll-tag');
    this.timecodeEl = document.getElementById('camera-timecode');
    this.cameraOsd = document.getElementById('camera-osd');
    this.hudToggleBtn = document.getElementById('cam-hud-toggle');
    this.hudToggleText = document.getElementById('cam-hud-toggle-text');
    this.expandBtn = document.getElementById('hybrid-expand-btn');
    this.prevBtn = document.getElementById('cam-prev-btn');
    this.nextBtn = document.getElementById('cam-next-btn');

    this.vuBar1 = document.getElementById('vu-bar-1');
    this.vuBar2 = document.getElementById('vu-bar-2');

    if (!this.ledgerTable) return;
    this.rows = Array.from(this.ledgerTable.querySelectorAll('.criterion-row'));
    if (this.rows.length === 0) return;
    this.rows.forEach((row, i) => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.js-flip-spec')) {
          e.preventDefault();
          e.stopPropagation();
          row.classList.toggle('is-flipped');
          return;
        }
        if (e.target.closest('.criterion-row__thumb') || e.target.closest('.js-open-modal')) {
          e.preventDefault();
          this.setMasterFilm(row, i);
          this.openModalForFilm(this.extractRowData(row));
          return;
        }

        this.setMasterFilm(row, i);
        if (e.target.closest('.js-screen-reel')) {
          const monitor = document.getElementById('hybrid-master');
          if (monitor) {
            monitor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      });
    });
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.stepFilm(-1);
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.stepFilm(1);
      });
    }
    if (this.hudToggleBtn && this.cameraOsd) {
      this.hudToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isHidden = this.cameraOsd.classList.toggle('is-hidden');
        if (this.hudToggleText) {
          this.hudToggleText.textContent = isHidden ? 'HUD: OFF' : 'HUD: ON';
        }
      });
    }
    this.camSoundToggle = document.getElementById('cam-sound-toggle');
    this.camSoundIcon = document.getElementById('cam-sound-icon');
    this.camSoundText = document.getElementById('cam-sound-text');
    this.camVolSlider = document.getElementById('cam-vol-slider');

    if (this.camSoundToggle && this.masterVideo) {
      this.camSoundToggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.masterVideo.muted = !this.masterVideo.muted;
        if (!this.masterVideo.muted && this.masterVideo.volume === 0) {
          this.masterVideo.volume = 0.8;
        }
        this.updateCamAudioUI();
      });
    }

    if (this.camVolSlider && this.masterVideo) {
      this.camVolSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.masterVideo.volume = val;
        if (val > 0 && this.masterVideo.muted) {
          this.masterVideo.muted = false;
        }
        this.updateCamAudioUI();
      });
    }
    if (this.expandBtn) {
      this.expandBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.currentFilmData) {
          this.openModalForFilm(this.currentFilmData);
        }
      });
    }
    this.startTimecodeTicker();
    this.startVuMeters();
    if (this.rows[0]) {
      this.setMasterFilm(this.rows[0], 0, true);
    }
  }

  updateCamAudioUI() {
    if (!this.masterVideo) return;
    const isMuted = this.masterVideo.muted || this.masterVideo.volume === 0;
    if (this.camSoundIcon) this.camSoundIcon.textContent = isMuted ? '🔈' : '🔊';
    if (this.camSoundText) this.camSoundText.textContent = isMuted ? 'SOUND: OFF' : 'SOUND: ON';
    if (this.camVolSlider) this.camVolSlider.value = this.masterVideo.muted ? 0 : this.masterVideo.volume;
  }

  stepFilm(direction) {
    const visibleRows = this.rows.filter((r) => r.style.display !== 'none');
    if (visibleRows.length === 0) return;

    let currentIndex = visibleRows.indexOf(this.currentRow);
    if (currentIndex === -1) currentIndex = 0;

    let targetIndex = (currentIndex + direction + visibleRows.length) % visibleRows.length;
    const targetRow = visibleRows[targetIndex];
    const globalIndex = this.rows.indexOf(targetRow);

    this.setMasterFilm(targetRow, globalIndex);
  }

  extractRowData(row) {
    return {
      roll: row.getAttribute('data-roll') || 'ROLL 01 / 15',
      videoType: row.getAttribute('data-video-type') || (row.getAttribute('data-video-src') ? 'local' : 'youtube'),
      videoSrc: row.getAttribute('data-video-src'),
      poster: row.getAttribute('data-poster'),
      ytId: row.getAttribute('data-yt-id'),
      title: row.getAttribute('data-title') || row.querySelector('strong')?.textContent || '',
      badge: row.getAttribute('data-badge') || 'CELLULOID ARCHIVE',
      credits: row.getAttribute('data-credits') || 'Direction: Mise Films',
      postUrl: row.getAttribute('data-post-url') || '#',
      platform: row.getAttribute('data-platform') || 'Watch Film',
      quality: row.getAttribute('data-quality') || '4K UHD CELLULOID',
      category: row.getAttribute('data-category') || 'all',
    };
  }

  setMasterFilm(row, index = 0, isInitial = false) {
    if (!row) return;

    this.currentRow = row;
    this.currentFilmIndex = index;
    const data = this.extractRowData(row);
    this.currentFilmData = data;
    this.rows.forEach((r) => r.classList.remove('is-screening', 'is-active'));
    row.classList.add('is-screening', 'is-active');
    if (this.tapeCanvas && row && !isInitial) {
      const cardLeft = row.offsetLeft;
      const cardWidth = row.offsetWidth;
      const canvasWidth = this.tapeCanvas.clientWidth;
      const targetScroll = cardLeft - (canvasWidth / 2) + (cardWidth / 2);
      this.tapeCanvas.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
    }
    if (this.rollTag) this.rollTag.textContent = data.roll;
    if (this.badgeEl) this.badgeEl.textContent = data.badge;
    if (this.titleEl) this.titleEl.textContent = data.title;
    if (this.creditsEl) this.creditsEl.textContent = data.credits;

    if (this.craftBadge) {
      this.craftBadge.textContent = data.credits.includes('Vikrant') ? 'DOP. VIKRANT YADAV' : 'DIR. SHREYANK VISHNOI';
    }

    if (this.linkEl) {
      this.linkEl.href = data.postUrl;
      if (this.linkText) {
        this.linkText.textContent = data.platform === 'Instagram' ? 'Open Reel on Instagram' : 'Watch on YouTube';
      }
    }
    if (data.videoType === 'local' && data.videoSrc) {
      if (this.iframeWrap) this.iframeWrap.style.display = 'none';
      if (this.masterIframe) this.masterIframe.src = '';

      if (this.masterVideo) {
        this.masterVideo.style.display = 'block';
        if (data.poster) this.masterVideo.poster = data.poster;
        this.masterVideo.src = data.videoSrc;
        this.masterVideo.currentTime = 0;

        const playPromise = this.masterVideo.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            this.masterVideo.muted = true;
            this.masterVideo.play().catch(() => {});
          });
        }
        this.updateCamAudioUI();
      }
    } else if (data.ytId) {
      if (this.masterVideo) {
        try { this.masterVideo.pause(); } catch (_) {}
        this.masterVideo.style.display = 'none';
        this.masterVideo.src = '';
      }

      if (this.iframeWrap && this.masterIframe) {
        this.iframeWrap.style.display = 'block';
        const autoplayParam = isInitial ? '0' : '1';
        this.masterIframe.src = `https://www.youtube-nocookie.com/embed/${data.ytId}?autoplay=${autoplayParam}&mute=1&rel=0`;
      }
    }
  }

  startTimecodeTicker() {
    if (!this.timecodeEl) return;

    clearInterval(this.tcInterval);
    this.tcInterval = setInterval(() => {
      this.tcFrames++;
      if (this.tcFrames >= 24) {
        this.tcFrames = 0;
        this.tcSeconds++;
        if (this.tcSeconds >= 60) {
          this.tcSeconds = 0;
          this.tcMinutes++;
          if (this.tcMinutes >= 60) {
            this.tcMinutes = 0;
            this.tcHours++;
          }
        }
      }

      const h = String(this.tcHours).padStart(2, '0');
      const m = String(this.tcMinutes).padStart(2, '0');
      const s = String(this.tcSeconds).padStart(2, '0');
      const f = String(this.tcFrames).padStart(2, '0');

      this.timecodeEl.textContent = `${h}:${m}:${s}:${f}`;
    }, 42);
  }

  startVuMeters() {
    if (!this.vuBar1 || !this.vuBar2) return;

    clearInterval(this.vuInterval);
    this.vuInterval = setInterval(() => {
      const v1 = Math.floor(45 + Math.random() * 45);
      const v2 = Math.floor(40 + Math.random() * 50);
      this.vuBar1.style.width = `${v1}%`;
      this.vuBar2.style.width = `${v2}%`;
    }, 180);
  }

  initExhibitionTape() {
    if (!this.tapeCanvas) return;
    this.startAutoRoll();
    this.tapeCanvas.addEventListener('mouseenter', () => {
      this.isTapePaused = true;
    });

    this.tapeCanvas.addEventListener('mouseleave', () => {
      this.isTapePaused = false;
    });
    this.tapeCanvas.addEventListener('touchstart', () => {
      this.isTapePaused = true;
    }, { passive: true });

    this.tapeCanvas.addEventListener('touchend', () => {
      setTimeout(() => { this.isTapePaused = false; }, 3500);
    }, { passive: true });

    if (this.tapePauseBtn) {
      this.tapePauseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.isAutoRollEnabled = !this.isAutoRollEnabled;
        if (this.tapePauseIcon) {
          this.tapePauseIcon.textContent = this.isAutoRollEnabled ? '⏸' : '▶';
        }
        if (this.tapePauseText) {
          this.tapePauseText.textContent = this.isAutoRollEnabled ? 'Auto' : 'Roll';
        }
      });
    }
    if (this.tapePrevBtn) {
      this.tapePrevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.rollTape(-1);
        this.pauseAutoRollBriefly();
      });
    }
    if (this.tapeNextBtn) {
      this.tapeNextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.rollTape(1);
        this.pauseAutoRollBriefly();
      });
    }
  }

  rollTape(dir = 1) {
    if (!this.tapeCanvas) return;
    const card = this.tapeCanvas.querySelector('.criterion-slipcase-box:not([style*="display: none"])');
    const step = card ? card.offsetWidth + 24 : 300;
    const maxScroll = this.tapeCanvas.scrollWidth - this.tapeCanvas.clientWidth;

    if (dir > 0 && this.tapeCanvas.scrollLeft >= maxScroll - 25) {
      this.tapeCanvas.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (dir < 0 && this.tapeCanvas.scrollLeft <= 25) {
      this.tapeCanvas.scrollTo({ left: maxScroll, behavior: 'smooth' });
    } else {
      this.tapeCanvas.scrollBy({ left: dir * step, behavior: 'smooth' });
    }
  }

  startAutoRoll() {
    clearInterval(this.autoRollTimer);
    this.autoRollTimer = setInterval(() => {
      if (this.isAutoRollEnabled && !this.isTapePaused) {
        this.rollTape(1);
      }
    }, 2400);
  }

  pauseAutoRollBriefly() {
    this.isTapePaused = true;
    clearTimeout(this.resumeTimer);
    this.resumeTimer = setTimeout(() => {
      this.isTapePaused = false;
    }, 4500);
  }

  initCategoryFiltering() {
    if (!this.filterBar || !this.ledgerTable) return;

    this.filterButtons = Array.from(this.filterBar.querySelectorAll('.filter-btn'));
    this.ledgerCount = document.getElementById('hybrid-ledger-count');

    this.filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-filter');
        this.filterCategory(cat);
      });
    });
  }

  filterCategory(category) {
    if (!category) category = 'all';
    if (this.filterButtons) {
      this.filterButtons.forEach((b) => {
        if (b.getAttribute('data-filter') === category) {
          b.classList.add('is-active');
        } else {
          b.classList.remove('is-active');
        }
      });
    }

    const visibleRows = [];
    const hiddenRows = [];

    this.rows.forEach((row) => {
      const rowCats = (row.getAttribute('data-category') || '').split(' ');
      const matches = category === 'all' || rowCats.includes(category);

      if (matches) {
        visibleRows.push(row);
      } else {
        hiddenRows.push(row);
      }
    });

    if (this.ledgerCount) {
      const count = visibleRows.length;
      const catNames = {
        all: `${count} Selected Celluloid Works`,
        commercials: `${count} Commercials & Brand Films`,
        'music-videos': `${count} Music Videos & Visual Albums`,
        'feature-films': `${count} Feature & Devotional Films`,
        documentaries: `${count} Documentaries & Live Events`,
        'post-production': `${count} Post-Production & BTS Works`,
      };
      this.ledgerCount.textContent = catNames[category] || `${count} Works`;
    }

    if (this.tapeCanvas) {
      this.tapeCanvas.scrollTo({ left: 0, behavior: 'smooth' });
    }

    if (hiddenRows.length) {
      gsap.to(hiddenRows, {
        opacity: 0,
        y: 10,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          hiddenRows.forEach((r) => {
            r.style.display = 'none';
          });
        },
      });
    }

    visibleRows.forEach((r) => {
      r.style.display = '';
    });

    gsap.fromTo(
      visibleRows,
      { opacity: 0, y: 15 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.03,
        ease: 'power2.out',
        delay: hiddenRows.length ? 0.2 : 0,
      }
    );

    if (visibleRows.length > 0) {
      const globalIdx = this.rows.indexOf(visibleRows[0]);
      this.setMasterFilm(visibleRows[0], globalIdx);
    }
  }

  initCraftLinking() {
    if (!this.craftSection) return;

    const serviceRows = this.craftSection.querySelectorAll('.service-row');
    serviceRows.forEach((row) => {
      row.style.cursor = 'pointer';

      row.addEventListener('click', (e) => {
        if (e.target.tagName.toLowerCase() === 'a') return;

        const craftFilter = row.getAttribute('data-craft-filter');
        if (!craftFilter) return;

        const targetEl = document.getElementById('work');
        if (targetEl) {
          if (this.lenis) {
            this.lenis.scrollTo(targetEl, { offset: -60, duration: 1.2 });
          } else {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }

        setTimeout(() => {
          this.filterCategory(craftFilter);
        }, 300);
      });
    });
  }

  initCinemaModal() {
    this.modal = document.getElementById('cinema-modal');
    if (!this.modal) return;

    this.modalStage = document.getElementById('cinema-modal-stage');
    this.modalPlayer = document.getElementById('modal-video-player');
    this.modalPlayerBar = document.getElementById('modal-player-bar');
    this.modalIframeWrap = document.getElementById('modal-youtube-wrap');
    this.modalIframe = document.getElementById('modal-youtube-player');
    this.modalTitle = document.getElementById('modal-video-title');
    this.modalExtLink = document.getElementById('modal-external-link');
    this.modalExtText = document.getElementById('modal-external-text');
    this.modalCloseBtn = document.getElementById('modal-close-btn');
    this.modalBackdrop = document.getElementById('cinema-modal-backdrop');

    this.modalPlayBtn = document.getElementById('modal-play-btn');
    this.modalPlayIcon = document.getElementById('modal-play-icon');
    this.modalTimeCurrent = document.getElementById('modal-time-current');
    this.modalTimeDuration = document.getElementById('modal-time-duration');
    this.modalScrubber = document.getElementById('modal-scrubber');
    this.modalScrubberProgress = document.getElementById('modal-scrubber-progress');
    this.modalScrubberBuffered = document.getElementById('modal-scrubber-buffered');
    this.modalMuteBtn = document.getElementById('modal-mute-btn');
    this.modalMuteIcon = document.getElementById('modal-mute-icon');
    this.modalVolumeSlider = document.getElementById('modal-volume-slider');
    this.modalFullscreenBtn = document.getElementById('modal-fullscreen-btn');

    const closeModal = () => this.closeModal();

    if (this.modalCloseBtn) this.modalCloseBtn.addEventListener('click', closeModal);
    if (this.modalBackdrop) this.modalBackdrop.addEventListener('click', closeModal);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('is-open')) {
        closeModal();
      }
    });

    if (this.modalPlayer) {
      const togglePlay = (e) => {
        if (e) e.stopPropagation();
        if (this.modalPlayer.paused) {
          this.modalPlayer.play().catch(() => {});
        } else {
          this.modalPlayer.pause();
        }
      };

      if (this.modalPlayBtn) this.modalPlayBtn.addEventListener('click', togglePlay);
      this.modalPlayer.addEventListener('click', togglePlay);

      this.modalPlayer.addEventListener('play', () => {
        if (this.modalPlayIcon) this.modalPlayIcon.textContent = '❚❚';
      });

      this.modalPlayer.addEventListener('pause', () => {
        if (this.modalPlayIcon) this.modalPlayIcon.textContent = '▶';
      });

      const formatTime = (secs) => {
        if (isNaN(secs) || !isFinite(secs)) return '00:00';
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      };

      this.modalPlayer.addEventListener('timeupdate', () => {
        if (this.modalTimeCurrent) {
          this.modalTimeCurrent.textContent = formatTime(this.modalPlayer.currentTime);
        }
        if (this.modalScrubberProgress && this.modalPlayer.duration) {
          const pct = (this.modalPlayer.currentTime / this.modalPlayer.duration) * 100;
          this.modalScrubberProgress.style.width = `${pct}%`;
        }
      });

      this.modalPlayer.addEventListener('loadedmetadata', () => {
        if (this.modalTimeDuration) {
          this.modalTimeDuration.textContent = formatTime(this.modalPlayer.duration);
        }
      });

      this.modalPlayer.addEventListener('durationchange', () => {
        if (this.modalTimeDuration) {
          this.modalTimeDuration.textContent = formatTime(this.modalPlayer.duration);
        }
      });

      this.modalPlayer.addEventListener('progress', () => {
        if (this.modalScrubberBuffered && this.modalPlayer.buffered.length > 0 && this.modalPlayer.duration) {
          const bufEnd = this.modalPlayer.buffered.end(this.modalPlayer.buffered.length - 1);
          const bufPct = Math.min(100, (bufEnd / this.modalPlayer.duration) * 100);
          this.modalScrubberBuffered.style.width = `${bufPct}%`;
        }
      });

      if (this.modalScrubber) {
        let isSeeking = false;

        const seek = (e) => {
          const rect = this.modalScrubber.getBoundingClientRect();
          const clientX = e.touches ? e.touches[0].clientX : e.clientX;
          const clickX = clientX - rect.left;
          const pos = Math.max(0, Math.min(1, clickX / rect.width));
          if (this.modalPlayer.duration) {
            this.modalPlayer.currentTime = pos * this.modalPlayer.duration;
          }
        };

        this.modalScrubber.addEventListener('click', (e) => {
          seek(e);
        });

        this.modalScrubber.addEventListener('mousedown', (e) => {
          isSeeking = true;
          seek(e);
        });

        window.addEventListener('mousemove', (e) => {
          if (isSeeking) seek(e);
        });

        window.addEventListener('mouseup', () => {
          isSeeking = false;
        });
        this.modalScrubber.addEventListener('touchstart', (e) => {
          isSeeking = true;
          seek(e);
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
          if (isSeeking) seek(e);
        }, { passive: true });

        window.addEventListener('touchend', () => {
          isSeeking = false;
        });
      }

      const updateVolumeUI = () => {
        const isMuted = this.modalPlayer.muted || this.modalPlayer.volume === 0;
        if (this.modalMuteIcon) {
          this.modalMuteIcon.textContent = isMuted ? '🔈' : '🔊';
        }
        if (this.modalVolumeSlider) {
          this.modalVolumeSlider.value = this.modalPlayer.muted ? 0 : this.modalPlayer.volume;
        }
      };

      if (this.modalMuteBtn) {
        this.modalMuteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.modalPlayer.muted = !this.modalPlayer.muted;
          if (!this.modalPlayer.muted && this.modalPlayer.volume === 0) {
            this.modalPlayer.volume = 0.9;
          }
          updateVolumeUI();
        });
      }

      if (this.modalVolumeSlider) {
        this.modalVolumeSlider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          this.modalPlayer.volume = val;
          if (val > 0 && this.modalPlayer.muted) {
            this.modalPlayer.muted = false;
          }
          updateVolumeUI();
        });
      }

      this.modalPlayer.addEventListener('volumechange', updateVolumeUI);

      if (this.modalFullscreenBtn) {
        this.modalFullscreenBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const target = this.modalStage || this.modalPlayer;
          if (!document.fullscreenElement) {
            if (target.requestFullscreen) {
              target.requestFullscreen().catch(() => {});
            } else if (target.webkitRequestFullscreen) {
              target.webkitRequestFullscreen();
            }
          } else {
            if (document.exitFullscreen) {
              document.exitFullscreen().catch(() => {});
            } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen();
            }
          }
        });
      }
    }
  }

  openModalForFilm(data) {
    if (!this.modal || !data) return;

    if (this.modalTitle) this.modalTitle.textContent = data.title;

    const isPortrait = data.platform === 'Instagram' ||
      (data.videoSrc && (
        data.videoSrc.includes('skyhop') ||
        data.videoSrc.includes('ridermania') ||
        data.videoSrc.includes('iconworld') ||
        data.videoSrc.includes('samsung') ||
        data.videoSrc.includes('jamboree')
      ));

    if (isPortrait) {
      this.modal.classList.add('is-portrait');
    } else {
      this.modal.classList.remove('is-portrait');
    }

    if (data.videoType === 'local' && data.videoSrc) {
      if (this.modalIframeWrap) this.modalIframeWrap.style.display = 'none';
      if (this.modalIframe) this.modalIframe.src = '';

      if (this.modalPlayer) {
        this.modalPlayer.style.display = 'block';
        this.modalPlayer.src = data.videoSrc;
        this.modalPlayer.currentTime = 0;
        this.modalPlayer.volume = 0.9;
        this.modalPlayer.muted = false;

        const playPromise = this.modalPlayer.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[CinemaModal] Audio autoplay restricted by browser; playing muted:', err);
            this.modalPlayer.muted = true;
            this.modalPlayer.play().catch(() => {});
          });
        }

        if (this.modalMuteIcon) {
          this.modalMuteIcon.textContent = this.modalPlayer.muted ? '🔈' : '🔊';
        }
        if (this.modalVolumeSlider) {
          this.modalVolumeSlider.value = this.modalPlayer.muted ? 0 : this.modalPlayer.volume;
        }
      }

      if (this.modalPlayerBar) {
        this.modalPlayerBar.style.display = 'flex';
      }

      if (this.modalExtLink) {
        this.modalExtLink.href = data.postUrl || '#';
        if (this.modalExtText) {
          this.modalExtText.textContent = data.platform === 'Instagram' ? 'Open Reel on Instagram' : 'Watch on YouTube';
        }
      }
    } else if (data.ytId) {
      if (this.modalPlayer) {
        try { this.modalPlayer.pause(); } catch (_) {}
        this.modalPlayer.style.display = 'none';
        this.modalPlayer.src = '';
      }

      if (this.modalPlayerBar) {
        this.modalPlayerBar.style.display = 'none';
      }

      if (this.modalIframeWrap && this.modalIframe) {
        this.modalIframeWrap.style.display = 'block';
        this.modalIframe.src = `https://www.youtube-nocookie.com/embed/${data.ytId}?autoplay=1&rel=0`;
      }

      if (this.modalExtLink) {
        this.modalExtLink.href = `https://www.youtube.com/watch?v=${data.ytId}`;
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
    this.modal.classList.remove('is-portrait');
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
    if (this.modalScrubberProgress) {
      this.modalScrubberProgress.style.width = '0%';
    }
    if (this.modalScrubberBuffered) {
      this.modalScrubberBuffered.style.width = '0%';
    }
  }
}
