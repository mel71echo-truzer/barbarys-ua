/* ============================================================
   BARBARYS — Custom Cursor
   transform3d only — no layout-triggering left/top in tick loop
   ============================================================ */

window.BarbarisFollower = class BarbarisFollower {
  constructor() {
    this.pos    = { x: -200, y: -200 }; // ring (lerped)
    this.target = { x: -200, y: -200 }; // dot  (instant)
    this._raf   = null;

    this._build();
    this._bind();
    this._tick();
  }

  _build() {
    // ── Outer ring (lerped trailing) ──
    this.ring = document.createElement('div');
    this.ring.className = 'bc-ring';
    Object.assign(this.ring.style, {
      position:           'fixed',
      top:                '0',
      left:               '0',
      width:              '40px',
      height:             '40px',
      borderRadius:       '50%',
      border:             '1px solid rgba(155,26,42,0.7)',
      pointerEvents:      'none',
      zIndex:             '9999',
      transform:          'translate(calc(-200px - 50%), calc(-200px - 50%))',
      transition:         'width 0.4s cubic-bezier(0.16,1,0.3,1), height 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.3s, opacity 0.3s, background 0.4s',
      willChange:         'transform',
      backfaceVisibility: 'hidden',
      mixBlendMode:       'normal',
    });

    // ── Center label inside ring ──
    this.label = document.createElement('span');
    this.label.className = 'bc-label';
    Object.assign(this.label.style, {
      position:      'absolute',
      top:           '50%',
      left:          '50%',
      transform:     'translate(-50%, -50%)',
      fontFamily:    "'DM Sans', sans-serif",
      fontSize:      '10px',
      fontWeight:    '500',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color:         '#f0e8d8',
      whiteSpace:    'nowrap',
      opacity:       '0',
      transition:    'opacity 0.25s',
      pointerEvents: 'none',
    });
    this.ring.appendChild(this.label);

    // ── Dot (instant, no lerp) ──
    this.dot = document.createElement('div');
    this.dot.className = 'bc-dot';
    Object.assign(this.dot.style, {
      position:           'fixed',
      top:                '0',
      left:               '0',
      width:              '5px',
      height:             '5px',
      borderRadius:       '50%',
      background:         '#9B1A2A',
      pointerEvents:      'none',
      zIndex:             '10000',
      transform:          'translate(calc(-200px - 50%), calc(-200px - 50%))',
      willChange:         'transform',
      backfaceVisibility: 'hidden',
      transition:         'opacity 0.3s',
    });

    // ── Media preview ──
    this.media = document.createElement('div');
    this.media.className = 'bc-media';
    Object.assign(this.media.style, {
      position:      'fixed',
      top:           '0',
      left:          '0',
      width:         '140px',
      height:        '160px',
      borderRadius:  '12px',
      overflow:      'hidden',
      background:    '#1a0808',
      pointerEvents: 'none',
      zIndex:        '9997',
      transform:     'translate(calc(-200px - 50%), calc(-200px - 50%)) scale(0)',
      transition:    'transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.3s',
      border:        '1px solid rgba(123,16,32,0.4)',
      willChange:    'transform',
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
      this.ring.style.transform = `translate(calc(${this.pos.x}px - 50%), calc(${this.pos.y}px - 50%)) scale(0.85)`;
    });
    document.addEventListener('mouseup', () => {
      this.ring.style.transform = `translate(calc(${this.pos.x}px - 50%), calc(${this.pos.y}px - 50%)) scale(1)`;
    });

    // Hover targets
    document.querySelectorAll('a, button, [data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => this._setState(el));
      el.addEventListener('mouseleave', () => this._setState(null));
    });

    // Media preview targets
    document.querySelectorAll('[data-cursor-media]').forEach(el => {
      el.addEventListener('mouseenter', () => {
        const src = el.dataset.cursorMedia;
        if (src && src.startsWith('#')) {
          this.mediaInner.style.background = src;
          this.mediaInner.innerHTML = '';
        } else if (src) {
          this.mediaInner.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover">`;
        }
        this._mediaVisible = true;
      });
      el.addEventListener('mouseleave', () => {
        this._mediaVisible = false;
        this.media.style.transform = `translate(calc(${this.pos.x + 90}px - 50%), calc(${this.pos.y - 60}px - 50%)) scale(0)`;
        this.media.style.opacity = '0';
      });
    });
  }

  _setState(el) {
    if (!el) {
      this.ring.style.width  = '40px';
      this.ring.style.height = '40px';
      this.ring.style.background   = 'transparent';
      this.ring.style.borderColor  = 'rgba(155,26,42,0.7)';
      this.label.style.opacity = '0';
      this.dot.style.opacity   = '1';
      return;
    }

    const cursor = el.dataset.cursor;
    if (cursor === 'view' || el.classList.contains('product-card')) {
      this.ring.style.width  = '80px';
      this.ring.style.height = '80px';
      this.ring.style.background  = 'rgba(123,16,32,0.85)';
      this.ring.style.borderColor = 'transparent';
      this.label.textContent   = 'Детальніше';
      this.label.style.opacity = '1';
      this.dot.style.opacity   = '0';
    } else if (el.tagName === 'A' || el.tagName === 'BUTTON') {
      this.ring.style.width  = '54px';
      this.ring.style.height = '54px';
      this.ring.style.background  = 'rgba(123,16,32,0.15)';
      this.ring.style.borderColor = 'rgba(155,26,42,1)';
      this.label.style.opacity = '0';
      this.dot.style.opacity   = '1';
    }
  }

  _tick() {
    const lerp = (a, b, t) => a + (b - a) * t;

    // Ring: lerp factor 1.0 — instant, no trail
    this.pos.x = lerp(this.pos.x, this.target.x, 1.0);
    this.pos.y = lerp(this.pos.y, this.target.y, 1.0);

    // Ring — translate3d via calc to stay centered without touching top/left
    this.ring.style.transform = `translate(calc(${this.pos.x}px - 50%), calc(${this.pos.y}px - 50%))`;

    // Dot — instant (lerp factor = 1), no trailing
    this.dot.style.transform = `translate(calc(${this.target.x}px - 50%), calc(${this.target.y}px - 50%))`;

    // Media preview follows ring with offset
    if (this._mediaVisible) {
      this.media.style.transform = `translate(calc(${this.pos.x + 90}px - 50%), calc(${this.pos.y - 60}px - 50%)) scale(1)`;
      this.media.style.opacity = '1';
    }

    this._raf = requestAnimationFrame(() => this._tick());
  }
};
