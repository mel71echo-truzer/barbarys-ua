/* ============================================================
   BARBARYS — Custom Cursor
   Cuberto MouseFollower-style with media preview
   ============================================================ */

window.BarbarisFollower = class BarbarisFollower {
  constructor() {
    this.pos   = { x: -100, y: -100 };
    this.target= { x: -100, y: -100 };
    this.scale = 1;
    this.state = 'default'; // default | hover | text | media | hidden

    this._build();
    this._bind();
    this._tick();
  }

  _build() {
    // Outer ring
    this.ring = document.createElement('div');
    this.ring.className = 'bc-ring';
    Object.assign(this.ring.style, {
      position: 'fixed',
      top: '0', left: '0',
      width: '40px', height: '40px',
      borderRadius: '50%',
      border: '1px solid rgba(90,155,106,0.7)',
      pointerEvents: 'none',
      zIndex: '9999',
      transform: 'translate(-50%, -50%)',
      transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1), height 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.3s, opacity 0.3s, background 0.4s',
      willChange: 'transform',
      mixBlendMode: 'normal',
    });

    // Dot
    this.dot = document.createElement('div');
    this.dot.className = 'bc-dot';
    Object.assign(this.dot.style, {
      position: 'fixed',
      top: '0', left: '0',
      width: '5px', height: '5px',
      borderRadius: '50%',
      background: '#5a9b6a',
      pointerEvents: 'none',
      zIndex: '10000',
      transform: 'translate(-50%, -50%)',
      willChange: 'transform',
      transition: 'opacity 0.3s, transform 0.15s',
    });

    // Label
    this.label = document.createElement('span');
    this.label.className = 'bc-label';
    Object.assign(this.label.style, {
      position: 'absolute',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '10px',
      fontWeight: '500',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: '#f0ebe2',
      whiteSpace: 'nowrap',
      opacity: '0',
      transition: 'opacity 0.25s',
      pointerEvents: 'none',
    });
    this.ring.appendChild(this.label);

    // Media preview
    this.media = document.createElement('div');
    this.media.className = 'bc-media';
    Object.assign(this.media.style, {
      position: 'fixed',
      top: '0', left: '0',
      width: '140px', height: '160px',
      borderRadius: '12px',
      overflow: 'hidden',
      background: '#0d1a0e',
      pointerEvents: 'none',
      zIndex: '9997',
      transform: 'translate(-50%, -50%) scale(0)',
      transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.3s',
      border: '1px solid rgba(61,107,71,0.4)',
    });
    this.mediaInner = document.createElement('div');
    Object.assign(this.mediaInner.style, { width: '100%', height: '100%' });
    this.media.appendChild(this.mediaInner);

    document.body.appendChild(this.ring);
    document.body.appendChild(this.dot);
    document.body.appendChild(this.media);
  }

  _bind() {
    document.addEventListener('mousemove', e => {
      this.target.x = e.clientX;
      this.target.y = e.clientY;
    });

    document.addEventListener('mousedown', () => {
      this.ring.style.transform = `translate(-50%,-50%) scale(0.85)`;
    });
    document.addEventListener('mouseup', () => {
      this.ring.style.transform = `translate(-50%,-50%) scale(1)`;
    });

    // Hover targets
    document.querySelectorAll('a, button, [data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => this._setState(el));
      el.addEventListener('mouseleave', () => this._setState(null));
    });

    // Media targets
    document.querySelectorAll('[data-cursor-media]').forEach(el => {
      el.addEventListener('mouseenter', () => {
        const src = el.dataset.cursorMedia;
        this.mediaInner.style.background = `linear-gradient(135deg, #0d1a0e, #1a3320)`;
        if (src.startsWith('#')) {
          this.mediaInner.style.background = src;
        } else {
          this.mediaInner.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover">`;
        }
        this.media.style.transform = 'translate(-50%,-50%) scale(1)';
        this.media.style.opacity = '1';
      });
      el.addEventListener('mouseleave', () => {
        this.media.style.transform = 'translate(-50%,-50%) scale(0)';
        this.media.style.opacity = '0';
      });
    });
  }

  _setState(el) {
    if (!el) {
      // Reset
      this.ring.style.width = '40px';
      this.ring.style.height = '40px';
      this.ring.style.background = 'transparent';
      this.ring.style.borderColor = 'rgba(90,155,106,0.7)';
      this.label.style.opacity = '0';
      this.dot.style.opacity = '1';
      return;
    }

    const cursor = el.dataset.cursor;
    if (cursor === 'view' || el.classList.contains('product-card')) {
      this.ring.style.width = '80px';
      this.ring.style.height = '80px';
      this.ring.style.background = 'rgba(61,107,71,0.85)';
      this.ring.style.borderColor = 'transparent';
      this.label.textContent = 'Детальніше';
      this.label.style.opacity = '1';
      this.dot.style.opacity = '0';
    } else if (el.tagName === 'A' || el.tagName === 'BUTTON') {
      this.ring.style.width = '54px';
      this.ring.style.height = '54px';
      this.ring.style.background = 'rgba(61,107,71,0.15)';
      this.ring.style.borderColor = 'rgba(90,155,106,1)';
      this.label.style.opacity = '0';
      this.dot.style.opacity = '1';
    }
  }

  _tick() {
    const lerp = (a, b, t) => a + (b - a) * t;
    this.pos.x = lerp(this.pos.x, this.target.x, 0.12);
    this.pos.y = lerp(this.pos.y, this.target.y, 0.12);

    const tx = `translate(-50%, -50%)`;
    this.ring.style.left = `${this.pos.x}px`;
    this.ring.style.top  = `${this.pos.y}px`;

    // Dot follows directly
    this.dot.style.left = `${this.target.x}px`;
    this.dot.style.top  = `${this.target.y}px`;

    // Media follows ring
    this.media.style.left = `${this.pos.x + 90}px`;
    this.media.style.top  = `${this.pos.y - 60}px`;

    requestAnimationFrame(() => this._tick());
  }
};
