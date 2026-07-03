/* ============================================================
   BARBARYS - Main JS
   Lenis + GSAP ScrollTrigger + SplitText + Catalog + Confetti
   ============================================================ */

/* ── Utility: SplitText — word-level split, preserves <br>, <em> ── */
function splitTextToWords(el) {
  el.setAttribute('aria-label', el.innerText);

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      const parts = node.textContent.split(/(\s+)/);
      parts.forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
        } else {
          const outer = document.createElement('span');
          outer.className = 'char';
          const inner = document.createElement('span');
          inner.className = 'char-inner';
          inner.textContent = part;
          outer.appendChild(inner);
          frag.appendChild(outer);
        }
      });
      node.replaceWith(frag);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'BR') {
      [...node.childNodes].forEach(processNode);
    }
    // BR and unknown nodes left intact
  }

  [...el.childNodes].forEach(processNode);
  return el.querySelectorAll('.char-inner');
}

/* ── DOM Ready ── */
document.addEventListener('DOMContentLoaded', () => {

  /* ── Lenis Smooth Scroll ── */
  let lenis;
  if (window.Lenis) {
    lenis = new Lenis({
      duration: 1.4,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothTouch: false,
    });

    if (window.ScrollTrigger) {
      // Use GSAP ticker only — do NOT also start a manual rAF loop (causes double-tick)
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      function lenisRaf(time) { lenis.raf(time); requestAnimationFrame(lenisRaf); }
      requestAnimationFrame(lenisRaf);
    }
  }

  /* ── Nav Scroll State ── */
  const nav = document.querySelector('.nav');
  if (nav) {
    const updateNav = () => nav.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
  }

  /* ── Hero Entrance Animation ── */
  const heroLabel  = document.querySelector('.hero-label');
  const heroTitle  = document.querySelector('.hero-title');
  const heroSub    = document.querySelector('.hero-sub');
  const heroAct    = document.querySelector('.hero-actions');
  const heroScroll = document.querySelector('.hero-scroll');

  if (heroTitle) {
    const chars = splitTextToWords(heroTitle);
    gsap.to(heroLabel, { opacity: 1, y: 0, duration: 0.8, delay: 0.3, ease: 'expo.out' });
    // Fix: also reset the translateY(30px) set in CSS on the wrapper
    gsap.to(heroTitle, { opacity: 1, y: 0, duration: 0.6, delay: 0.4, ease: 'expo.out' });
    gsap.to(chars, { y: 0, duration: 0.9, delay: 0.5, stagger: 0.025, ease: 'expo.out' });
    gsap.to(heroSub,    { opacity: 1, y: 0, duration: 0.8, delay: 0.9, ease: 'expo.out' });
    gsap.to(heroAct,    { opacity: 1, y: 0, duration: 0.8, delay: 1.1, ease: 'expo.out' });
    gsap.to(heroScroll, { opacity: 1,       duration: 0.8, delay: 1.5, ease: 'power2.out' });
  }

  /* ── GSAP ScrollTrigger Reveals ── */
  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('.reveal-up').forEach(el => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    });
    document.querySelectorAll('.reveal-left').forEach(el => {
      gsap.to(el, {
        opacity: 1, x: 0, duration: 0.9, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    });
    document.querySelectorAll('.reveal-right').forEach(el => {
      gsap.to(el, {
        opacity: 1, x: 0, duration: 0.9, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    });

    // Section headings char-by-char
    document.querySelectorAll('[data-split]').forEach(el => {
      const chars = splitTextToWords(el);
      gsap.set(el, { opacity: 1 });
      gsap.to(chars, {
        y: 0, duration: 0.8, stagger: 0.02, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 80%', once: true },
      });
    });

    // Catalog cards stagger
    gsap.from('.product-card', {
      opacity: 0, y: 60, duration: 0.8, stagger: 0.12, ease: 'expo.out',
      scrollTrigger: { trigger: '.catalog-grid', start: 'top 75%', once: true },
    });

    // Review cards stagger
    gsap.from('.review-card', {
      opacity: 0, y: 40, duration: 0.7, stagger: 0.1, ease: 'expo.out',
      scrollTrigger: { trigger: '.reviews-grid', start: 'top 75%', once: true },
    });

    // Process steps
    gsap.from('.process-step', {
      opacity: 0, y: 30, duration: 0.6, stagger: 0.15, ease: 'expo.out',
      scrollTrigger: { trigger: '.process-steps', start: 'top 80%', once: true },
    });

    // About stats counter
    document.querySelectorAll('.about-stat-num[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const obj = { val: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 80%', once: true,
        onEnter() {
          gsap.to(obj, {
            val: target, duration: 1.5, ease: 'power2.out',
            onUpdate() {
              const v = Math.round(obj.val);
              el.innerHTML = suffix ? `${v}<span>${suffix}</span>` : `${v}`;
            },
          });
        },
      });
    });

    // Parallax on about image wrapper (not the canvas itself)
    const aboutWrap = document.querySelector('.about-img-wrap');
    if (aboutWrap) {
      gsap.to(aboutWrap, {
        yPercent: -8, ease: 'none',
        scrollTrigger: {
          trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: true,
        },
      });
    }
  }

  /* ── Three.js: Celestial Bloom Hero Shader ── */
  const heroCanvas = document.getElementById('hero-canvas');
  if (heroCanvas && window.THREE && window.initCelestialBloom) {
    initCelestialBloom(heroCanvas);
  }

  /* ── Three.js: Hero Bouquet ── */
  const heroBouquet = document.getElementById('hero-bouquet');
  if (heroBouquet && window.THREE && window.Bouquet3D) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    heroBouquet.appendChild(canvas);
    // Small delay to let browser compute layout before reading dimensions
    requestAnimationFrame(() => new Bouquet3D(canvas, { rotate: true, alpha: true }));
  }

  /* ── Three.js: About Bouquet ── */
  const aboutCanvas = document.getElementById('about-canvas');
  if (aboutCanvas && window.THREE && window.Bouquet3D) {
    requestAnimationFrame(() => new Bouquet3D(aboutCanvas, { rotate: true, alpha: false, bg: 0x0d1a0e }));
  }

  /* ── Catalog WebGL Cards ── */
  initCatalogCards();

  /* ── Petal Confetti ── */
  initPetalConfetti();

  /* ── Order Form ── */
  initOrderForm();

  /* ── Custom Cursor ── */
  if (window.innerWidth > 768 && window.BarbarisFollower) {
    new BarbarisFollower();
  }

  /* ── Marquee: duplicate for seamless loop ── */
  const track = document.querySelector('.marquee-track');
  if (track) {
    track.innerHTML += track.innerHTML;
  }

});

/* ────────────────────────────────────────────
   CATALOG CARDS - procedural gradient + hover WebGL distortion
   ──────────────────────────────────────────── */
function initCatalogCards() {
  const cards = document.querySelectorAll('.product-card-canvas');

  const palettes = [
    ['#1a3320', '#3d6b47', '#c23b5e', '#e87fa0'],
    ['#0f2218', '#2e5e38', '#8b2252', '#d4699a'],
    ['#1c3d22', '#4a8a55', '#c04060', '#f09ab0'],
    ['#0d1f12', '#2a5c30', '#d44a72', '#f5b0c8'],
    ['#162b1a', '#356040', '#a52a4a', '#d86090'],
    ['#1a3820', '#4a7850', '#bc3858', '#f08098'],
  ];

  cards.forEach((canvas, i) => {
    if (!window.THREE) return;

    const pal = palettes[i % palettes.length];
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(1);

    // Read parent size (canvas has width:100%;height:100% from CSS)
    const parent = canvas.parentElement;
    const W = parent ? parent.clientWidth : (canvas.clientWidth || 300);
    const H = parent ? parent.clientHeight : (canvas.clientHeight || 400);
    renderer.setSize(W, H, false); // false = don't override CSS

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        u_time:   { value: 0 },
        u_mouse:  { value: new THREE.Vector2(0.5, 0.5) },
        u_color1: { value: new THREE.Color(pal[0]) },
        u_color2: { value: new THREE.Color(pal[1]) },
        u_color3: { value: new THREE.Color(pal[2]) },
        u_color4: { value: new THREE.Color(pal[3]) },
        u_hover:  { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
      `,
      fragmentShader: `
        precision mediump float;
        uniform float u_time, u_hover;
        uniform vec2  u_mouse;
        uniform vec3  u_color1, u_color2, u_color3, u_color4;
        varying vec2  vUv;

        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float snoise(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p);
          vec2 u = f*f*(3.0-2.0*f);
          return mix(mix(noise(i),noise(i+vec2(1,0)),u.x),
                     mix(noise(i+vec2(0,1)),noise(i+vec2(1,1)),u.x),u.y);
        }

        void main() {
          vec2 uv = vUv;
          float t = u_time * 0.3;

          float dist = length(uv - u_mouse);
          float wave = sin(dist * 12.0 - t * 4.0) * u_hover * 0.06 / (dist + 0.3);
          uv += vec2(wave);

          float n1 = snoise(uv * 2.5 + t);
          float n2 = snoise(uv * 4.0 - t * 0.7 + 0.5);
          float n  = n1 * 0.6 + n2 * 0.4;

          vec3 col = mix(u_color1, u_color2, uv.y + n * 0.3);
          col = mix(col, u_color3, smoothstep(0.4, 0.8, n + uv.y * 0.5 - 0.2));
          col += u_color4 * 0.12 * smoothstep(0.6, 1.0, n);

          float v = 1.0 - smoothstep(0.4, 1.0, length((uv - 0.5) * 1.4));
          col *= v * 0.85 + 0.15;

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

    let hover = 0, targetHover = 0;
    const card = canvas.closest('.product-card');
    if (card) {
      card.addEventListener('mouseenter', () => { targetHover = 1; });
      card.addEventListener('mouseleave', () => { targetHover = 0; });
      card.addEventListener('mousemove', e => {
        const r = canvas.getBoundingClientRect();
        mat.uniforms.u_mouse.value.set(
          (e.clientX - r.left) / r.width,
          1 - (e.clientY - r.top) / r.height
        );
      });
    }

    const startT = performance.now();
    function tick() {
      requestAnimationFrame(tick);
      hover += (targetHover - hover) * 0.06;
      mat.uniforms.u_time.value  = (performance.now() - startT) / 1000;
      mat.uniforms.u_hover.value = hover;
      renderer.render(scene, camera);
    }
    tick();

    // Resize observer for responsive canvas
    if (window.ResizeObserver && parent) {
      new ResizeObserver(() => {
        renderer.setSize(parent.clientWidth, parent.clientHeight, false);
      }).observe(parent);
    }
  });
}

/* ────────────────────────────────────────────
   PETAL CONFETTI (tsParticles v2 compatible)
   ──────────────────────────────────────────── */
function initPetalConfetti() {
  if (!window.tsParticles) return;

  async function fireConfetti() {
    const id = 'confetti-' + Date.now();
    const container = await tsParticles.load({
      id,
      options: {
        fullScreen: { enable: true, zIndex: 9999 },
        background: { color: { value: 'transparent' } },
        fpsLimit: 60,
        particles: {
          number: { value: 0 },
          color: { value: ['#5a9b6a', '#3d6b47', '#d4c5a9', '#c23b5e', '#e87fa0', '#7bc48a', '#f0ebe2'] },
          shape: { type: ['circle', 'square', 'triangle'] },
          opacity: { value: { min: 0.5, max: 0.9 } },
          size: { value: { min: 4, max: 11 } },
          rotate: {
            value: { min: 0, max: 360 },
            direction: 'random',
            animation: { enable: true, speed: 25, sync: false },
          },
          move: {
            enable: true,
            speed: { min: 3, max: 7 },
            direction: 'bottom',
            random: true,
            straight: false,
            outModes: { default: 'out' },
            gravity: { enable: true, acceleration: 2.5 },
            drift: { min: -2, max: 2 },
          },
          wobble: { enable: true, distance: 12, speed: { angle: 8, move: 4 } },
          life: { duration: { sync: false, value: 5 }, count: 1 },
        },
        emitters: {
          position: { x: 50, y: 25 },
          rate: { quantity: 6, delay: 0.06 },
          life: { count: 1, duration: 2 },
        },
      },
    });
    setTimeout(() => container?.destroy(), 7000);
  }

  document.querySelectorAll('.confetti-trigger').forEach(btn => {
    btn.addEventListener('click', fireConfetti);
  });

  // Expose for programmatic use (form submit)
  window._fireConfetti = fireConfetti;
}

/* ────────────────────────────────────────────
   ORDER FORM - Telegram webhook
   ──────────────────────────────────────────── */
function initOrderForm() {
  const form = document.getElementById('order-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const btn     = form.querySelector('.btn-submit');
    const success = form.querySelector('.form-success');

    const data = {
      name:    form.querySelector('[name=name]')?.value.trim(),
      phone:   form.querySelector('[name=phone]')?.value.trim(),
      product: form.querySelector('[name=product]')?.value,
      date:    form.querySelector('[name=date]')?.value,
      message: form.querySelector('[name=message]')?.value.trim(),
    };

    btn.disabled = true;
    btn.querySelector('span').textContent = 'Відправляємо…';

    try {
      const res = await fetch('https://formspree.io/f/xvgzqkwp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        form.querySelectorAll('.form-group').forEach(g => g.style.display = 'none');
        form.querySelector('.form-submit-wrap').style.display = 'none';
        if (success) {
          success.style.display = 'block';
          if (window.gsap) gsap.from(success, { opacity: 0, y: 20, duration: 0.6, ease: 'expo.out' });
        }
        if (window._fireConfetti) window._fireConfetti();
      } else {
        throw new Error('Server error');
      }
    } catch {
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Замовити';
      alert('Щось пішло не так. Спробуйте ще раз або зателефонуйте нам.');
    }
  });
}
