import gsap from 'gsap';

export class MobileMenu {
  constructor() {
    this.btn = document.getElementById('menu-btn');
    this.menu = document.getElementById('mobile-menu');

    if (!this.btn || !this.menu) return;

    this.isOpen = false;
    this.links = this.menu.querySelectorAll('.mobile-menu__link');
    this.btnSpans = this.btn.querySelectorAll('span');
    this._savedScrollY = 0;

    this.btn.addEventListener('click', () => this.toggle());

    this.links.forEach((link) => {
      link.addEventListener('click', () => this.close());
    });

    this._resizeHandler = () => {
      if (this.isOpen && window.innerWidth >= 768) {
        this.close();
      }
    };
    window.addEventListener('resize', this._resizeHandler, { passive: true });
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    this.menu.classList.add('is-open');
    this.btn.setAttribute('aria-label', 'Close menu');

    this._savedScrollY = window.scrollY;
    document.documentElement.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this._savedScrollY}px`;
    document.body.style.width = '100%';

    gsap.to(this.btnSpans[0], { rotation: 45, y: 7, duration: 0.3, ease: 'power2.out' });
    gsap.to(this.btnSpans[1], { opacity: 0, duration: 0.15 });
    gsap.to(this.btnSpans[2], { rotation: -45, y: -7, duration: 0.3, ease: 'power2.out' });

    gsap.fromTo(
      this.links,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'expo.out',
        stagger: 0.08,
        delay: 0.2,
      }
    );
  }

  close() {
    this.isOpen = false;
    this.menu.classList.remove('is-open');
    this.btn.setAttribute('aria-label', 'Open menu');

    document.documentElement.classList.remove('menu-open');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, this._savedScrollY);

    gsap.to(this.btnSpans[0], { rotation: 0, y: 0, duration: 0.3, ease: 'power2.out' });
    gsap.to(this.btnSpans[1], { opacity: 1, duration: 0.15, delay: 0.1 });
    gsap.to(this.btnSpans[2], { rotation: 0, y: 0, duration: 0.3, ease: 'power2.out' });
  }
}
