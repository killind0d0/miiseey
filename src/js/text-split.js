export class TextSplitter {
  constructor() {
    this.splitWords();
    this.splitLines();
  }

  splitWords() {
    const elements = document.querySelectorAll('[data-split-text]');

    elements.forEach((el) => {
      const rawHTML = el.innerHTML;
      if (rawHTML.includes('<br')) {
        const parts = rawHTML.split(/<br\s*\/?>/i);
        el.innerHTML = parts
          .map((part) => {
            const temp = document.createElement('div');
            temp.innerHTML = part;
            const words = temp.textContent.trim().split(/\s+/);
            return words
              .filter(Boolean)
              .map((word) => `<span class="word">${word}</span>`)
              .join(' ');
          })
          .join('<br />');
      } else {
        const text = el.textContent.trim();
        const words = text.split(/\s+/);

        el.innerHTML = words
          .filter(Boolean)
          .map((word) => `<span class="word">${word}</span>`)
          .join(' ');
      }
    });
  }

  splitLines() {
    const elements = document.querySelectorAll('[data-split-lines]');

    elements.forEach((el) => {
      const text = el.textContent.trim();
      el.innerHTML = `<span class="line">${text}</span>`;
    });
  }
}
