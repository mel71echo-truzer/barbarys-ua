/* ============================================================
   BARBARYS — Main JS
   Lenis + GSAP ScrollTrigger + SplitText + Catalog + Confetti
   ============================================================ */

/* ── Utility: SplitText (lightweight implementation) ── */
function splitTextToChars(el) {
  const text = el.textContent;
  el.textContent = '';
  el.setAttribute('aria-label', text);
  [...text].forEach(char => {
    const outer = document.createElement('span');
    outer.className = 'char';
    const inner = document.createElement('span');
    inner.className = 'char-inner';
    inner.textContent = char === ' ' ? ' ' : char;
    outer.appendChild(inner);
    el.appendChild(outer);
  });
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
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
    });
    function lenisRaf(time) {
      lenis.raf(time);
      requestAnimationFrame(lenisRaf);
    }
    requestAnimationFrame(lenisRaf);

    // Connect Lenis to GSAP ScrollTrigger
    if (window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ── Nav Scroll State ── */
  const nav = document.querySelector('.nav');
  if (nav) {
    const updateNav = () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    };
    window.addEventListener('scroll', updateNav, { passive: true });
    updateNav();
  }

  /* ── Hero Entrance Animation ── */
  const heroLabel = document.querySelector('.hero-label');
  const heroTitle = document.querySelector('.hero-title');
  const heroSub   = document.querySelector('.hero-sub');
  const heroAct   = document.querySelector('.hero-actions');
  const heroScroll= document.querySelector('.hero-scroll');

  if (heroTitle) {
    const chars = splitTextToChars(heroTitle);
    gsap.to(heroLabel, { opacity: 1, y: 0, duration: 0.8, delay: 0.3, ease: 'expo.out' });
    gsap.to(chars, {
      y: 0,
      duration: 0.9,
      delay: 0.5,
      stagger: 0.025,
      ease: 'expo.out',
    });
    gsap.to(heroTitle, { opacity: 1, duration: 0.1, delay: 0.5 });
    gsap.to(heroSub, { opacity: 1, y: 0, duration: 0.8, delay: 0.9, ease: 'expo.out' });
    gsap.to(heroAct, { opacity: 1, y: 0, duration: 0.8, delay: 1.1, ease: 'expo.out' });
    gsap.to(heroScroll, { opacity: 1, duration: 0.8, delay: 1.5, ease: 'power2.out' });
  }

  /* ── GSAP ScrollTrigger Reveals ── */
  if (window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    // Generic reveals
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
      const chars = splitTextToChars(el);
      gsap.set(el, { opacity: 1 });
      gsap.to(chars, {
        y: 0,
        duration: 0.8,
        stagger: 0.02,
        ease: 'expo.out',
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
      const obj    = { val: 0 };
      const suffix = el.dataset.suffix || '';
      ScrollTrigger.create({
        trigger: el,
        start: 'top 80%',
        once: true,
        onEnter() {
          gsap.to(obj, {
            val: target, duration: 1.5, ease: 'power2.out',
            onUpdate() { el.innerHTML = Math.round(obj.val) + suffix + (el.querySelector('span') ? '<span>+</span>' : ''); },
          });
        },
      });
    });

    // Parallax on about image
    const aboutCanvas = document.getElementById('about-canvas');
    if (aboutCanvas) {
      gsap.to(aboutCanvas, {
        yPercent: -15, ease: 'none',
        scrollTrigger: {
          trigger: '#about',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
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
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    heroBouquet.appendChild(canvas);
    new Bouquet3D(canvas, { rotate: true, alpha: true });
  }

  /* ── Three.js: About Bouquet ── */
  const aboutCanvas = document.getElementById('about-canvas');
  if (aboutCanvas && window.THREE && window.Bouquet3D) {
    new Bouquet3D(aboutCanvas, { rotate: true, alpha: false, bg: 0x0d1a0e });
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

  /* ── Marquee: duplicate items for seamless loop ── */
  const track = document.querySelector('.marquee-track');
  if (track) {
    track.innerHTML += track.innerHTML;
  }

});

/* ────────────────────────────────────────────
   CATALOG CARDS — procedural gradient previews
   + hover distortion via Three.js plane
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
    renderer.setSize(canvas.clientWidth || 300, canvas.clientHeight || 400);

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

          // Distortion wave from mouse on hover
          float dist  = length(uv - u_mouse);
          float wave  = sin(dist * 12.0 - t * 4.0) * u_hover * 0.06 / (dist + 0.3);
          uv += vec2(wave);

          float n1 = snoise(uv * 2.5 + t);
          float n2 = snoise(uv * 4.0 - t * 0.7 + 0.5);
          float n  = n1 * 0.6 + n2 * 0.4;

          vec3 col = mix(u_color1, u_color2, uv.y + n * 0.3);
          col = mix(col, u_color3, smoothstep(0.4, 0.8, n + uv.y * 0.5 - 0.2));
          col += u_color4 * 0.12 * smoothstep(0.6, 1.0, n);

          // Vignette
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
  });
}

/* ────────────────────────────────────────────
   PETAL CONFETTI (tsParticles)
   ──────────────────────────────────────────── */
function initPetalConfetti() {
  const triggers = document.querySelectorAll('.confetti-trigger');
  if (!triggers.length || !window.tsParticles) return;

  triggers.forEach(btn => {
    btn.addEventListener('click', async () => {
      const container = await tsParticles.load({
        id: 'petal-confetti-' + Date.now(),
        options: {
          fullScreen: { enable: true, zIndex: 9999 },
          background: { color: { value: 'transparent' } },
          fpsLimit: 60,
          particles: {
            number: { value: 80 },
            color: { value: ['#5a9b6a','#3d6b47','#d4c5a9','#c23b5e','#e87fa0','#7bc48a','#f0ebe2'] },
            shape: {
              type: 'custom',
              custom: {
                petal: {
                  draw(context, particle, radius) {
                    const r = radius;
                    context.beginPath();
                    context.moveTo(0, 0);
                    context.bezierCurveTo(-r * 0.8, r * 0.3, -r, r * 0.8, 0, r * 1.2);
                    context.bezierCurveTo(r, r * 0.8, r * 0.8, r * 0.3, 0, 0);
                    context.closePath();
                    context.fillStyle = particle.getFillColor()?.toString() || '#5a9b6a';
                    context.fill();
                  },
                },
              },
            },
            opacity: { value: { min: 0.6, max: 1 } },
            size: { value: { min: 6, max: 14 } },
            move: {
              enable: true,
              speed: { min: 2, max: 6 },
              direction: 'bottom',
              random: true,
              straight: false,
              outModes: { default: 'out' },
              gravity: { enable: true, acceleration: 1.5 },
              drift: { min: -1, max: 1 },
            },
            rotate: {
              value: { min: 0, max: 360 },
              direction: 'random',
              animation: { enable: true, speed: 15, sync: false },
            },
            wobble: { enable: true, distance: 10, speed: { angle: 10, move: 3 } },
            life: { duration: { value: 4, sync: false }, count: 1 },
          },
          emitters: {
            position: { x: 50, y: 30 },
            rate: { quantity: 3, delay: 0.05 },
            life: { count: 1, duration: 1.5 },
          },
        },
      });

      // Auto destroy
      setTimeout(() => container?.destroy(), 5000);
    });
  });
}

/* ────────────────────────────────────────────
   ORDER FORM — Telegram webhook
   ──────────────────────────────────────────── */
function initOrderForm() {
  const form = document.getElementById('order-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const btn = form.querySelector('.btn-submit');
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
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        form.querySelectorAll('.form-group').forEach(g => g.style.display = 'none');
        form.querySelector('.form-submit-wrap').style.display = 'none';
        if (success) {
          success.style.display = 'block';
          gsap.from(success, { opacity: 0, y: 20, duration: 0.6, ease: 'expo.out' });
        }

        // Trigger confetti
        const confettiBtn = document.createElement('button');
        confettiBtn.className = 'confetti-trigger';
        document.body.appendChild(confettiBtn);
        initPetalConfetti();
        confettiBtn.click();
        setTimeout(() => confettiBtn.remove(), 5100);
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
