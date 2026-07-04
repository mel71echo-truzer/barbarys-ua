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
   ORDER FORM - Web3Forms
   ──────────────────────────────────────────── */
function initOrderForm() {
  const form = document.getElementById('order-form');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn        = this.querySelector('button[type="submit"], .btn-submit');
    const successMsg = document.getElementById('form-success')
      || this.querySelector('.form-success, .success-message');

    btn.disabled = true;
    const btnSpan = btn.querySelector('span');
    if (btnSpan) btnSpan.textContent = 'Надсилаємо…';
    else btn.textContent = 'Надсилаємо…';

    const res  = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: new FormData(this),
    });
    const json = await res.json();

    if (json.success) {
      this.reset();
      btn.style.display = 'none';
      if (successMsg) {
        successMsg.style.display = 'block';
        if (window.gsap) gsap.from(successMsg, { opacity: 0, y: 20, duration: 0.6, ease: 'expo.out' });
      }
      if (window._fireConfetti) window._fireConfetti();
    } else {
      btn.disabled = false;
      if (btnSpan) btnSpan.textContent = 'Замовити букет';
      else btn.textContent = 'Замовити букет →';
      alert('Помилка: ' + (json.message || 'спробуйте ще раз'));
    }
  });
}
