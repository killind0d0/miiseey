export class FilmGrain {
  constructor() {
    this.canvas = document.getElementById('grain-canvas');
    if (!this.canvas) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.isActive = false;

    this.config = {
      opacity: 0.035,      // Soft, subtle celluloid hum on black background only
      density: 0.35,       // Lightweight density
      speed: 80,           // Calm, organic flicker
      monochrome: true,
    };

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr * 0.5;
    this.canvas.height = window.innerHeight * dpr * 0.5;
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.canvas.classList.add('is-active');
    this.canvas.style.opacity = this.config.opacity;
    this.loop();
  }

  stop() {
    this.isActive = false;
    this.canvas.classList.remove('is-active');
  }

  loop() {
    if (!this.isActive) return;

    this.drawGrain();

    setTimeout(() => {
      requestAnimationFrame(() => this.loop());
    }, this.config.speed);
  }

  drawGrain() {
    const { width, height } = this.canvas;
    const imageData = this.ctx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      if (Math.random() > this.config.density) {
        data[i + 3] = 0; // Transparent pixel
        continue;
      }

      const value = Math.random() * 255;

      if (this.config.monochrome) {
        data[i] = value;     // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
      } else {
        data[i] = Math.random() * 255;
        data[i + 1] = Math.random() * 255;
        data[i + 2] = Math.random() * 255;
      }

      data[i + 3] = 255; // Full alpha (canvas opacity controls visibility)
    }

    this.ctx.putImageData(imageData, 0, 0);
  }
}
