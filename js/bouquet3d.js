/* ============================================================
   BARBARYS — Three.js 3D Bouquets
   BouquetScene  : product-card per-color procedural renderer
   Bouquet3D     : product-page full bouquet (legacy, kept for product.html)
   ============================================================ */

/* ── BouquetScene ─────────────────────────────────────────── */

window.BouquetScene = class BouquetScene {

  constructor(canvas, config = {}) {
    this._canvas = canvas;
    this._cfg = Object.assign({
      primaryColor: '#C0392B',
      rotateSpeed:  0.005,
      hoverSpeed:   0.015,
    }, config);

    this._t         = 0;
    this._rotSpeed  = this._cfg.rotateSpeed;
    this._leafMats  = [];
    this._raf       = null;
    this._paused    = false;

    this._init();
  }

  /* ── helpers ── */

  _dims() {
    const p = this._canvas.parentElement;
    const W = (p ? p.clientWidth  : 0) || this._canvas.clientWidth  || 400;
    const H = (p ? p.clientHeight : 0) || this._canvas.clientHeight || 400;
    return { W: W || 400, H: H || 400 };
  }

  _hex(str) { return new THREE.Color(str); }

  /* ── setup ── */

  _init() {
    const { W, H } = this._dims();
    const c = this._canvas;

    this._renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
    this._renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this._renderer.setSize(W, H, false);
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    this._renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 1.1;

    this._scene  = new THREE.Scene();
    this._camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 50);
    this._camera.position.set(0, 0.8, 4.8);
    this._camera.lookAt(0, 0.6, 0);

    /* OrbitControls (loaded via CDN as THREE.OrbitControls) */
    if (typeof THREE !== 'undefined' && THREE.OrbitControls) {
      this._controls = new THREE.OrbitControls(this._camera, c);
      this._controls.enableDamping  = true;
      this._controls.dampingFactor  = 0.06;
      this._controls.enableZoom     = false;
      this._controls.enablePan      = false;
      this._controls.rotateSpeed    = 0.6;
      this._controls.autoRotate     = false;
    }

    this._addLights();

    this._group = new THREE.Group();
    this._group.position.y = -0.5;
    this._scene.add(this._group);

    this._buildBouquet();
    this._addEventListeners();

    if (window.ResizeObserver) {
      this._ro = new ResizeObserver(() => this._onResize());
      this._ro.observe(c.parentElement || c);
    }

    /* Pause RAF when card is off-screen */
    if (window.IntersectionObserver) {
      this._io = new IntersectionObserver(([e]) => {
        this._paused = !e.isIntersecting;
      }, { threshold: 0.05 });
      this._io.observe(c);
    }

    this._animate();
  }

  _addLights() {
    const pc = this._hex(this._cfg.primaryColor);

    this._scene.add(new THREE.AmbientLight(0xfff5e6, 2.2));

    const key = new THREE.DirectionalLight(0xffffff, 4.0);
    key.position.set(3, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(512, 512);
    this._scene.add(key);

    const fill = new THREE.DirectionalLight(0xffeedd, 1.5);
    fill.position.set(-4, 2, 3);
    this._scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 1.0);
    rim.position.set(0, -2, -4);
    this._scene.add(rim);

    /* Colored point light that pulses */
    this._glow = new THREE.PointLight(pc, 3.0, 7, 2);
    this._glow.position.set(0, 1.5, 1.5);
    this._scene.add(this._glow);
  }

  /* ── bouquet construction ── */

  _buildBouquet() {
    const pc    = this._hex(this._cfg.primaryColor);
    const count = 8 + Math.floor(Math.random() * 5); // 8-12

    this._buildWrapper();
    this._buildStems(count);
    this._buildLeaves(7);
    this._buildFlowers(count, pc);
  }

  _buildFlowers(count, pc) {
    for (let i = 0; i < count; i++) {
      const flower = new THREE.Group();

      /* IcosahedronGeometry flower center */
      const centerColor = pc.clone().lerp(new THREE.Color(0xf5d56e), 0.25);
      const center = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.3, 1),
        new THREE.MeshStandardMaterial({
          color:     centerColor,
          roughness: 0.55,
          metalness: 0.05,
        })
      );
      center.castShadow = true;
      flower.add(center);

      /* LatheGeometry petals — 6 per flower */
      this._buildPetals(flower, pc);

      /* Hemisphere placement: phi ∈ [0, π/2], theta spread */
      const phi   = Math.random() * Math.PI * 0.55;
      const theta = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.7;
      const R     = 0.25 + Math.random() * 0.45;

      flower.position.set(
        Math.sin(phi) * Math.cos(theta) * R,
        1.85 + Math.cos(phi) * R * 0.6 + Math.random() * 0.35,
        Math.sin(phi) * Math.sin(theta) * R
      );
      flower.rotation.x  = Math.random() * 0.5 - 0.1;
      flower.rotation.y  = Math.random() * Math.PI * 2;
      flower.rotation.z  = (Math.random() - 0.5) * 0.3;
      flower.scale.setScalar(0.65 + Math.random() * 0.55);

      this._group.add(flower);
    }
  }

  _buildPetals(flowerGroup, pc) {
    /* Profile for LatheGeometry: teardrop outline */
    const profile = [];
    const segments = 10;
    for (let j = 0; j < segments; j++) {
      const t = j / (segments - 1);
      const r = Math.sin(t * Math.PI) * 0.19;
      const y = t * 0.38 - 0.05;
      profile.push(new THREE.Vector2(r, y));
    }

    const petalCount  = 6;
    const sweepAngle  = (Math.PI * 2) / petalCount; // each petal arc
    const petalColor  = pc.clone().lerp(new THREE.Color(0xffffff), 0.18);

    for (let p = 0; p < petalCount; p++) {
      const geo = new THREE.LatheGeometry(profile, 3, 0, sweepAngle);
      const mat = new THREE.MeshStandardMaterial({
        color:     petalColor.clone().multiplyScalar(0.92 + Math.random() * 0.16),
        roughness: 0.65,
        side:      THREE.DoubleSide,
      });
      const petal = new THREE.Mesh(geo, mat);
      petal.rotation.y   = p * sweepAngle;
      petal.rotation.x   = 0.55 + Math.random() * 0.25;
      petal.castShadow   = true;
      flowerGroup.add(petal);
    }
  }

  _buildStems(count) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x2a5c30, roughness: 0.85 });
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r     = 0.06 + Math.random() * 0.14;
      const stem  = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.03, 1.2, 6),
        mat
      );
      stem.position.set(
        Math.cos(angle) * r,
        0.6,   // center: bottom=0, top=1.2
        Math.sin(angle) * r
      );
      stem.rotation.z = (Math.random() - 0.5) * 0.22;
      stem.rotation.x = (Math.random() - 0.5) * 0.18;
      stem.castShadow = true;
      this._group.add(stem);
    }
  }

  _buildLeaves(count) {
    /* PlaneGeometry with custom vertex shader for organic wave */
    const vsLeaf = /* glsl */`
      varying vec2 vUv;
      uniform float uTime;
      void main() {
        vUv = uv;
        vec3 pos = position;
        pos.z += sin(pos.y * 7.0 + uTime * 1.3) * 0.035 * (pos.y + 0.2);
        pos.x += cos(pos.y * 4.5 + uTime * 0.85) * 0.018;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;
    const fsLeaf = /* glsl */`
      varying vec2 vUv;
      void main() {
        /* Elliptical leaf shape mask */
        vec2 uv2 = (vUv - 0.5) * 2.0;
        float mask = 1.0 - smoothstep(0.7, 1.0, length(uv2 * vec2(1.0, 0.55)));
        if (mask < 0.05) discard;
        vec3 dark  = vec3(0.12, 0.32, 0.16);
        vec3 light = vec3(0.22, 0.50, 0.26);
        gl_FragColor = vec4(mix(dark, light, vUv.y) * mask, 0.92);
      }
    `;

    for (let i = 0; i < count; i++) {
      const mat = new THREE.ShaderMaterial({
        vertexShader:   vsLeaf,
        fragmentShader: fsLeaf,
        uniforms:       { uTime: { value: 0 } },
        side:           THREE.DoubleSide,
        transparent:    true,
      });
      this._leafMats.push(mat);

      const leaf  = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.44, 4, 8), mat);
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.8;
      const r     = 0.18 + Math.random() * 0.32;

      leaf.position.set(
        Math.cos(angle) * r,
        0.45 + Math.random() * 1.1,
        Math.sin(angle) * r
      );
      leaf.rotation.y  = angle + Math.PI * 0.5;
      leaf.rotation.x  = 0.35 + Math.random() * 0.45;
      leaf.rotation.z  = (Math.random() - 0.5) * 0.35;
      leaf.castShadow  = true;
      this._group.add(leaf);
    }
  }

  _buildWrapper() {
    /* Paper cone */
    const wrapMat = new THREE.MeshStandardMaterial({
      color: 0xd4c5a9, roughness: 0.9, transparent: true, opacity: 0.52, side: THREE.DoubleSide,
    });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.44, 1.85, 22, 1, true), wrapMat);
    cone.position.y = 0.12;
    this._group.add(cone);

    /* Ruffle edge */
    const ruffMat = new THREE.MeshStandardMaterial({ color: 0xe0d4bc, roughness: 0.9, transparent: true, opacity: 0.75 });
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const r = new THREE.Mesh(new THREE.SphereGeometry(0.055, 5, 4), ruffMat);
      r.position.set(Math.cos(a) * 0.47, 1.0, Math.sin(a) * 0.47);
      r.scale.set(1.4, 0.55, 1.4);
      this._group.add(r);
    }

    /* Ribbon */
    const ribbon = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.022, 7, 18),
      new THREE.MeshStandardMaterial({ color: 0x7B1020, roughness: 0.55, metalness: 0.1 })
    );
    ribbon.position.set(0, 0.82, 0.3);
    ribbon.rotation.x = Math.PI * 0.5;
    this._group.add(ribbon);
  }

  /* ── events ── */

  _addEventListeners() {
    const c = this._canvas;
    c.addEventListener('mouseenter', () => { this._rotSpeed = this._cfg.hoverSpeed; });
    c.addEventListener('mouseleave', () => { this._rotSpeed = this._cfg.rotateSpeed; });
  }

  _onResize() {
    const { W, H } = this._dims();
    if (!W || !H) return;
    this._camera.aspect = W / H;
    this._camera.updateProjectionMatrix();
    this._renderer.setSize(W, H, false);
  }

  /* ── render loop ── */

  _animate() {
    this._raf = requestAnimationFrame(() => this._animate());
    if (this._paused) return;

    this._t += 0.016;

    /* Manual Y rotation (hover speeds up) */
    this._group.rotation.y += this._rotSpeed;

    /* Gentle float */
    this._group.position.y = -0.5 + Math.sin(this._t * 0.6) * 0.055;

    /* Update leaf wave uniforms */
    for (const m of this._leafMats) m.uniforms.uTime.value = this._t;

    /* Glow pulse */
    if (this._glow) this._glow.intensity = 2.8 + Math.sin(this._t * 1.8) * 0.7;

    if (this._controls) this._controls.update();

    this._renderer.render(this._scene, this._camera);
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    this._ro?.disconnect();
    this._io?.disconnect();
    if (this._controls) this._controls.dispose();
    this._renderer.dispose();
  }
};


/* ── Bouquet3D (product-page full viewer, unchanged) ──────── */

window.Bouquet3D = class Bouquet3D {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.opts   = Object.assign({
      rotate:      true,
      bg:          0x0f0405,
      alpha:       true,
      interactive: true,
    }, options);

    this._mouse  = new THREE.Vector2();
    this._target = new THREE.Vector2();
    this._raf    = null;
    this._t      = 0;

    this._init();
  }

  _dims() {
    const p = this.canvas.parentElement;
    const W = (p ? p.clientWidth  : 0) || this.canvas.clientWidth  || 600;
    const H = (p ? p.clientHeight : 0) || this.canvas.clientHeight || 600;
    return { W, H };
  }

  _init() {
    const { canvas, opts } = this;
    const { W, H } = this._dims();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: opts.alpha });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(W, H, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.scene = new THREE.Scene();
    if (!opts.alpha) this.scene.background = new THREE.Color(opts.bg);

    this.camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    this.camera.position.set(0, 1.5, 6.5);
    this.camera.lookAt(0, 0.5, 0);

    this.scene.fog = new THREE.FogExp2(0x0f0405, 0.12);

    this._addLights();

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this._buildWrapper();
    this._buildStems(7);
    this._buildRoses(5);
    this._buildFillers(12);
    this._buildLeaves(8);

    if (opts.interactive) {
      canvas.addEventListener('mousemove', e => this._onMouse(e));
      canvas.addEventListener('mouseleave', () => this._target.set(0, 0));
    }

    if (window.ResizeObserver) {
      this._ro = new ResizeObserver(() => this._onResize());
      this._ro.observe(canvas.parentElement || canvas);
    } else {
      window.addEventListener('resize', () => this._onResize());
    }

    this._animate();
  }

  _addLights() {
    const s = this.scene;
    s.add(new THREE.AmbientLight(0x3a1a0a, 2.5));
    const key = new THREE.DirectionalLight(0xfff5e0, 3);
    key.position.set(3, 8, 5); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
    s.add(key);
    const fill = new THREE.DirectionalLight(0xd4a882, 1.5);
    fill.position.set(-4, 2, 3); s.add(fill);
    const rim = new THREE.DirectionalLight(0x7B1020, 2);
    rim.position.set(0, -2, -5); s.add(rim);
    const pt = new THREE.PointLight(0xc4884a, 2, 6, 2);
    pt.position.set(0, 1, 2); s.add(pt);
    this._glowLight = pt;
  }

  _petalGeometry(w, h) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(-w * 0.8, h * 0.2, -w, h * 0.7, 0, h);
    shape.bezierCurveTo(w, h * 0.7, w * 0.8, h * 0.2, 0, 0);
    const geo = new THREE.ShapeGeometry(shape, 12);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin((pos.getY(i) / h) * Math.PI) * w * 0.4);
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }

  _buildRose(radius = 0.35) {
    const group  = new THREE.Group();
    const colors = [0xc23b5e, 0xa52a4a, 0xd44a72, 0xe87fa0, 0xf0a8c0];
    const roseColor = colors[Math.floor(Math.random() * colors.length)];
    for (let l = 0; l < 4; l++) {
      const layerR = radius * (0.3 + l * 0.22);
      const count  = 5 + l * 3;
      for (let i = 0; i < count; i++) {
        const angle    = (i / count) * Math.PI * 2 + l * 0.4;
        const petalGeo = this._petalGeometry(0.12 + l * 0.04, 0.18 + l * 0.06);
        const petalMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(roseColor).multiplyScalar(l === 0 ? 0.6 : 1.0),
          roughness: 0.5, metalness: 0.05, side: THREE.DoubleSide,
        });
        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.set(Math.cos(angle) * layerR, l * 0.06 + Math.sin(i * 0.7) * 0.015, Math.sin(angle) * layerR);
        petal.rotation.y = angle + Math.PI * 0.5;
        petal.rotation.x = 0.25 + l * 0.2 + Math.random() * 0.15;
        petal.rotation.z = (Math.random() - 0.5) * 0.2;
        petal.castShadow = true;
        group.add(petal);
      }
    }
    group.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshStandardMaterial({ color: 0xf5d56e, roughness: 0.3 })));
    return group;
  }

  _buildRoses(count) {
    const positions = [
      { x:  0,    y: 2.8,  z:  0,    s: 1.0  },
      { x:  0.55, y: 2.5,  z:  0.2,  s: 0.85 },
      { x: -0.55, y: 2.4,  z:  0.15, s: 0.85 },
      { x:  0.25, y: 2.65, z: -0.3,  s: 0.9  },
      { x: -0.25, y: 2.6,  z: -0.25, s: 0.9  },
    ];
    for (let i = 0; i < Math.min(count, positions.length); i++) {
      const rose = this._buildRose(0.28 + Math.random() * 0.08);
      const { x, y, z, s } = positions[i];
      rose.position.set(x, y, z); rose.scale.setScalar(s); rose.rotation.y = Math.random() * Math.PI * 2;
      this.group.add(rose);
    }
  }

  _buildStems(count) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x2a5c30, roughness: 0.8 });
    for (let i = 0; i < count; i++) {
      const angle  = (i / count) * Math.PI * 2;
      const spread = 0.15 + Math.random() * 0.2;
      const pts = [0, 0.8, 1.6, 2.4, 2.8].map((y, j) => {
        const r = spread * [0.3, 0.6, 0.4, 0.2, 0.1][j];
        return new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);
      });
      const stem = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.018 + Math.random() * 0.01, 8, false), mat
      );
      stem.castShadow = true;
      this.group.add(stem);
    }
  }

  _buildLeaves(count) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x2e6635, roughness: 0.75, side: THREE.DoubleSide });
    for (let i = 0; i < count; i++) {
      const lw = 0.06 + Math.random() * 0.04, lh = 0.18 + Math.random() * 0.12;
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.bezierCurveTo(-lw * 1.2, lh * 0.3, -lw, lh * 0.75, 0, lh);
      shape.bezierCurveTo(lw, lh * 0.75, lw * 1.2, lh * 0.3, 0, 0);
      const leaf  = new THREE.Mesh(new THREE.ShapeGeometry(shape, 10), mat);
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.8;
      const sp    = 0.2 + Math.random() * 0.35;
      leaf.position.set(Math.cos(angle) * sp, 0.8 + Math.random() * 1.6, Math.sin(angle) * sp);
      leaf.rotation.y = angle + Math.PI; leaf.rotation.x = 0.4 + Math.random() * 0.5;
      leaf.rotation.z = (Math.random() - 0.5) * 0.4; leaf.castShadow = true;
      this.group.add(leaf);
    }
  }

  _buildFillers(count) {
    const mats = [
      new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: 0.6 }),
      new THREE.MeshStandardMaterial({ color: 0x4a8a55, roughness: 0.9 }),
    ];
    for (let i = 0; i < count; i++) {
      const angle  = Math.random() * Math.PI * 2, sp = 0.35 + Math.random() * 0.4;
      const filler = new THREE.Mesh(new THREE.SphereGeometry(0.025 + Math.random() * 0.02, 6, 6), mats[i % 4 === 0 ? 1 : 0]);
      filler.position.set(Math.cos(angle) * sp, 2.0 + Math.random() * 0.9, Math.sin(angle) * sp);
      this.group.add(filler);
    }
  }

  _buildWrapper() {
    const wrapMat = new THREE.MeshStandardMaterial({ color: 0xd4c5a9, roughness: 0.9, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.2, 24, 1, true), wrapMat);
    cone.position.y = -0.3; this.group.add(cone);
    const ribbon = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 20), new THREE.MeshStandardMaterial({ color: 0x7B1020, roughness: 0.6, metalness: 0.1 }));
    ribbon.position.set(0, 0.8, 0.35); ribbon.rotation.x = Math.PI * 0.5; this.group.add(ribbon);
    const ruffMat = new THREE.MeshStandardMaterial({ color: 0xe0d4bc, roughness: 0.9, transparent: true, opacity: 0.8 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), ruffMat);
      r.position.set(Math.cos(a) * 0.52, 0.75, Math.sin(a) * 0.52);
      r.scale.set(1.5, 0.6, 1.5); this.group.add(r);
    }
  }

  _onMouse(e) {
    const r = this.canvas.getBoundingClientRect();
    this._target.set(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * -2);
  }

  _onResize() {
    const { W, H } = this._dims();
    if (!W || !H) return;
    this.camera.aspect = W / H; this.camera.updateProjectionMatrix();
    this.renderer.setSize(W, H, false);
  }

  _animate() {
    this._raf = requestAnimationFrame(() => this._animate());
    this._t  += 0.005;
    this._mouse.lerp(this._target, 0.05);
    if (this.opts.rotate) this.group.rotation.y += 0.003;
    this.group.rotation.x = this._mouse.y * 0.15;
    this.group.rotation.z = this._mouse.x * -0.08;
    if (this._glowLight) this._glowLight.intensity = 2 + Math.sin(this._t * 2) * 0.6;
    this.group.position.y = Math.sin(this._t * 0.8) * 0.06;
    this.renderer.render(this.scene, this.camera);
  }

  destroy() { cancelAnimationFrame(this._raf); this._ro?.disconnect(); this.renderer.dispose(); }
};
