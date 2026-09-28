// ─── Scroll Animations — GSAP ScrollTrigger ────────────────────
// Handles all scroll-triggered reveals:
//   - [data-reveal] elements fade up on scroll
//   - Counter animations for stats
//   - Parallax effects
//   - Divider line reveals

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class ScrollAnimations {
  constructor() {
    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.showAllImmediately();
      return;
    }

    this.init();
  }

  init() {
    this.revealElements();
    this.animateCounters();
    this.animateDividers();
    this.heroParallax();
    this.aboutScrollChoreography();
    this.actionSpotlightParallax();
    this.serviceRowHovers();

    // ── Scroll Progress Bar ──
    const progressBar = document.getElementById('scroll-progress');
    if (progressBar) {
      ScrollTrigger.create({
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          progressBar.style.width = `${self.progress * 100}%`;
        },
      });
    }
  }

  revealElements() {
    const elements = document.querySelectorAll('[data-reveal="fade-up"]');

    elements.forEach((el) => {
      gsap.fromTo(
        el,
        {
          y: 60,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            end: 'top 20%',
            toggleActions: 'play none none none',
          },
          onComplete: () => {
            el.classList.add('is-revealed');
          },
        }
      );
    });
  }

  animateCounters() {
    const counters = document.querySelectorAll('[data-counter]');

    counters.forEach((el) => {
      const target = parseInt(el.dataset.counter, 10);

      ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          const obj = { value: 0 };
          gsap.to(obj, {
            value: target,
            duration: 2,
            ease: 'power2.out',
            onUpdate: () => {
              el.textContent = Math.floor(obj.value);
            },
            onComplete: () => {
              el.textContent = target;
            },
          });
        },
      });
    });
  }

  animateDividers() {
    const dividers = document.querySelectorAll('.divider');

    dividers.forEach((el) => {
      gsap.fromTo(
        el,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.5,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
          onComplete: () => {
            el.classList.add('is-revealed');
          },
        }
      );
    });
  }

  heroParallax() {
    const heroVideo = document.querySelector('.hero__video-wrap');
    if (!heroVideo) return;

    gsap.to(heroVideo, {
      y: '15%',
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero__screen',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.5,
      },
    });
  }

  aboutScrollChoreography() {
    const isMob = window.innerWidth < 768 || window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const about = document.querySelector('.about');
    if (about) {
      about.querySelectorAll('[data-reveal]').forEach((el) => el.removeAttribute('data-reveal'));
      const header = about.querySelector('.about__header');
      const slate = about.querySelector('.about__slate');
      const narrative = about.querySelector('.about__narrative');
      const stats = about.querySelector('.about__stats');
      const scrollCue = about.querySelector('.about__scroll-cue');

      if (isMob) {
        // On mobile: immediately reveal to avoid blank flash or delayed scroll jank
        [header, slate, narrative, stats, scrollCue].forEach((el) => {
          if (el) {
            el.style.opacity = '1';
            el.style.transform = 'none';
          }
        });
      } else {
        const targets = [header, slate, narrative, stats, scrollCue].filter(Boolean);
        gsap.set(targets, { opacity: 0, y: 25 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: about,
            start: 'top 75%',
            once: true,
          },
        });

        if (header) tl.to(header, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0);
        if (slate) tl.to(slate, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.15);
        if (narrative) tl.to(narrative, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.25);
        if (stats) tl.to(stats, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.4);
        if (scrollCue) tl.to(scrollCue, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 0.55);
      }
    }

    const leaders = document.querySelectorAll('.leader-spotlight');
    leaders.forEach((leader) => {
      leader.querySelectorAll('[data-reveal]').forEach((el) => el.removeAttribute('data-reveal'));
      const portrait = leader.querySelector('.leader-spotlight__portrait-wrap');
      const info = leader.querySelector('.leader-spotlight__info');
      if (portrait && info) {
        if (isMob) {
          portrait.style.opacity = '1';
          portrait.style.transform = 'none';
          info.style.opacity = '1';
          info.style.transform = 'none';
        } else {
          gsap.set([portrait, info], { opacity: 0, y: 35 });
          const tlLeader = gsap.timeline({
            scrollTrigger: {
              trigger: leader,
              start: 'top 75%',
              once: true,
            },
          });
          tlLeader
            .to(portrait, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0)
            .to(info, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 0.2);
        }
      }
    });
  }

  actionSpotlightParallax() {
    const sections = document.querySelectorAll('.action-spotlight');
    if (!sections.length) return;

    ScrollTrigger.matchMedia({
      // Desktop (>= 1024px): Photo sustains much longer across the section and only fades out late
      '(min-width: 1024px)': () => {
        sections.forEach((section) => {
          const bgWrap = section.querySelector('.action-spotlight__bg');
          const bgImg = section.querySelector('.action-spotlight__bg img');
          if (!bgWrap) return;

          // Desktop timeline: Enters at top 85%, reaches full opacity,
          // sustains visibility throughout the entire reading experience,
          // and only gently fades out when the section exits towards the top
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
              end: 'bottom 5%',
              scrub: 0.8,
            },
          });

          tl.fromTo(
            bgWrap,
            { opacity: 0 },
            { opacity: 0.72, duration: 1, ease: 'power2.out' }
          )
            // Extended sustain window so Shrey and Vikrant photos remain clearly visible while reading
            .to(bgWrap, { opacity: 0.72, duration: 4.5 })
            // Soft late fade out only as section exits viewport
            .to(bgWrap, { opacity: 0, duration: 1.2, ease: 'power2.in' });

          if (bgImg) {
            gsap.fromTo(
              bgImg,
              { scale: 1, y: '-8%' },
              {
                scale: 1.08,
                y: '8%',
                ease: 'none',
                scrollTrigger: {
                  trigger: section,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 0.5,
                },
              }
            );
          }
        });
      },

      // Mobile / Tablet (< 1024px): Flawless timing kept exactly untouched
      '(max-width: 1023px)': () => {
        sections.forEach((section) => {
          const bgWrap = section.querySelector('.action-spotlight__bg');
          const bgImg = section.querySelector('.action-spotlight__bg img');
          if (!bgWrap) return;

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top 90%',
              end: 'bottom 10%',
              scrub: 0.8,
            },
          });

          tl.fromTo(
            bgWrap,
            { opacity: 0 },
            { opacity: 0.65, duration: 1, ease: 'power2.inOut' }
          )
            .to(bgWrap, { opacity: 0.65, duration: 1.4 })
            .to(bgWrap, { opacity: 0, duration: 1, ease: 'power2.inOut' });

          if (bgImg) {
            gsap.fromTo(
              bgImg,
              { scale: 1, y: '-6%' },
              {
                scale: 1.08,
                y: '6%',
                ease: 'none',
                scrollTrigger: {
                  trigger: section,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 0.5,
                },
              }
            );
          }
        });
      },
    });
  }

  serviceRowHovers() {
    // Stagger service rows on scroll
    const rows = document.querySelectorAll('.service-row');
    if (!rows.length) return;

    gsap.fromTo(
      rows,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: rows[0],
          start: 'top 80%',
          once: true,
        },
      }
    );
  }

  showAllImmediately() {
    // For reduced-motion: just show everything
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.classList.add('is-revealed');
    });

    document.querySelectorAll('.divider').forEach((el) => {
      el.style.transform = 'scaleX(1)';
      el.classList.add('is-revealed');
    });

    document.querySelectorAll('[data-counter]').forEach((el) => {
      el.textContent = el.dataset.counter;
    });
  }
}
