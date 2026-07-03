/* ============================================================
   BARBARYS — Three.js 3D Bouquet
   Procedural roses, stems, wrapper
   ============================================================ */

window.Bouquet3D = class Bouquet3D {
  constructor(canvas, options = {}) {
    this.canvas  = canvas;
    this.opts    = Object.assign({
      rotate:     true,
      bg:         0x080f09,
      alpha:      true,
      interactive: true,
    }, options);

    this._mouse  = new THREE.Vector2();
    this._target = new THREE.Vector2();
    this._raf    = null;
    this._t      = 0;

    this._init();
  }

  _init() {
    const { canvas, opts } = this;
    const W = canvas.clientWidth || 600;
    const H = canvas.clientHeight || 600;

    /* Renderer */
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: opts.alpha,
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(W, H);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    /* Scene */
    this.scene = new THREE.Scene();
    if (!opts.alpha) this.scene.background = new THREE.Color(opts.bg);

    /* Camera */
    this.camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    this.camera.position.set(0, 1.5, 6.5);
    this.camera.lookAt(0, 0.5, 0);

    /* Fog */
    this.scene.fog = new THREE.FogExp2(0x080f09, 0.12);

    /* Lights */
    this._addLights();

    /* Build bouquet */
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this._buildWrapper();
    this._buildStems(7);
    this._buildRoses(5);
    this._buildFillers(12);
    this._buildLeaves(8);

    /* Events */
    if (opts.interactive) {
      canvas.addEventListener('mousemove', e => this._onMouse(e));
      canvas.addEventListener('mouseleave', () => {
        this._target.set(0, 0);
      });
    }

    window.addEventListener('resize', () => this._onResize());
    this._animate();
  }

  _addLights() {
    const scene = this.scene;

    // Ambient
    scene.add(new THREE.AmbientLight(0x2d4a30, 2.5));

    // Key light (warm top)
    const key = new THREE.DirectionalLight(0xfff5e0, 3);
    key.position.set(3, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    // Fill (cool side)
    const fill = new THREE.DirectionalLight(0xa8d5b5, 1.5);
    fill.position.set(-4, 2, 3);
    scene.add(fill);

    // Rim (back green)
    const rim = new THREE.DirectionalLight(0x3d8a52, 2);
    rim.position.set(0, -2, -5);
    scene.add(rim);

    // Point (center glow)
    const pt = new THREE.PointLight(0x7bc48a, 2, 6, 2);
    pt.position.set(0, 1, 2);
    scene.add(pt);
    this._glowLight = pt;
  }

  /* ── Rose Geometry ── */
  _buildRose(radius = 0.35) {
    const group = new THREE.Group();
    const petals = 18;
    const layers = 4;

    const colors = [0xc23b5e, 0xa52a4a, 0xd44a72, 0xe87fa0, 0xf0a8c0];
    const roseColor = colors[Math.floor(Math.random() * colors.length)];

    for (let l = 0; l < layers; l++) {
      const layerR = radius * (0.3 + l * 0.22);
      const count  = 5 + l * 3;
      const height = l * 0.06;
      const tilt   = 0.25 + l * 0.2;

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + l * 0.4;

        // Petal shape using custom BufferGeometry
        const petalGeo = this._petalGeometry(0.12 + l * 0.04, 0.18 + l * 0.06);
        const dark = l === 0 ? 0.6 : 1.0;
        const petalMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(roseColor).multiplyScalar(dark),
          roughness: 0.5,
          metalness: 0.05,
          side: THREE.DoubleSide,
        });

        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.set(
          Math.cos(angle) * layerR,
          height + Math.sin(i * 0.7) * 0.015,
          Math.sin(angle) * layerR
        );
        petal.rotation.y   = angle + Math.PI * 0.5;
        petal.rotation.x   = tilt + Math.random() * 0.15;
        petal.rotation.z   = (Math.random() - 0.5) * 0.2;
        petal.castShadow   = true;
        group.add(petal);
      }
    }

    // Center stamen
    const stamenGeo = new THREE.SphereGeometry(0.07, 8, 8);
    const stamenMat = new THREE.MeshStandardMaterial({ color: 0xf5d56e, roughness: 0.3 });
    group.add(new THREE.Mesh(stamenGeo, stamenMat));

    return group;
  }

  _petalGeometry(w, h) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(-w * 0.8, h * 0.2, -w, h * 0.7, 0, h);
    shape.bezierCurveTo(w, h * 0.7, w * 0.8, h * 0.2, 0, 0);

    const geo = new THREE.ShapeGeometry(shape, 12);
    // Add slight curve via vertex displacement
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / h;
      pos.setZ(i, Math.sin(y * Math.PI) * w * 0.4);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }

  _buildRoses(count) {
    const positions = [
      { x: 0,    y: 2.8, z: 0,    s: 1.0 },
      { x: 0.55, y: 2.5, z: 0.2,  s: 0.85 },
      { x:-0.55, y: 2.4, z: 0.15, s: 0.85 },
      { x: 0.25, y: 2.65,z:-0.3,  s: 0.9 },
      { x:-0.25, y: 2.6, z:-0.25, s: 0.9 },
    ];

    for (let i = 0; i < Math.min(count, positions.length); i++) {
      const rose = this._buildRose(0.28 + Math.random() * 0.08);
      const { x, y, z, s } = positions[i];
      rose.position.set(x, y, z);
      rose.scale.setScalar(s);
      rose.rotation.y = Math.random() * Math.PI * 2;
      this.group.add(rose);
    }
  }

  _buildStems(count) {
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x2a5c30,
      roughness: 0.8,
      metalness: 0,
    });

    for (let i = 0; i < count; i++) {
      const angle  = (i / count) * Math.PI * 2;
      const spread = 0.15 + Math.random() * 0.2;

      // Catmull-Rom curve for organic stems
      const pts = [
        new THREE.Vector3(Math.cos(angle) * spread * 0.3, 0.0, Math.sin(angle) * spread * 0.3),
        new THREE.Vector3(Math.cos(angle) * spread * 0.6, 0.8, Math.sin(angle) * spread * 0.6),
        new THREE.Vector3(Math.cos(angle) * spread * 0.4, 1.6, Math.sin(angle) * spread * 0.4),
        new THREE.Vector3(Math.cos(angle) * spread * 0.2, 2.4, Math.sin(angle) * spread * 0.2),
        new THREE.Vector3(Math.cos(angle) * spread * 0.1, 2.8, Math.sin(angle) * spread * 0.1),
      ];

      const curve  = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.018 + Math.random() * 0.01, 8, false);
      const stem   = new THREE.Mesh(tubeGeo, stemMat);
      stem.castShadow = true;
      this.group.add(stem);
    }
  }

  _buildLeaves(count) {
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x2e6635,
      roughness: 0.75,
      metalness: 0,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < count; i++) {
      const shape = new THREE.Shape();
      const lw = 0.06 + Math.random() * 0.04;
      const lh = 0.18 + Math.random() * 0.12;
      shape.moveTo(0, 0);
      shape.bezierCurveTo(-lw * 1.2, lh * 0.3, -lw, lh * 0.75, 0, lh);
      shape.bezierCurveTo(lw, lh * 0.75, lw * 1.2, lh * 0.3, 0, 0);
      const geo  = new THREE.ShapeGeometry(shape, 10);
      const leaf = new THREE.Mesh(geo, leafMat);

      const angle  = (i / count) * Math.PI * 2 + Math.random() * 0.8;
      const spread = 0.2 + Math.random() * 0.35;
      const h      = 0.8 + Math.random() * 1.6;

      leaf.position.set(
        Math.cos(angle) * spread,
        h,
        Math.sin(angle) * spread
      );
      leaf.rotation.y = angle + Math.PI;
      leaf.rotation.x = 0.4 + Math.random() * 0.5;
      leaf.rotation.z = (Math.random() - 0.5) * 0.4;
      leaf.castShadow = true;
      this.group.add(leaf);
    }
  }

  _buildFillers(count) {
    // Baby's breath / filler flowers
    const fillerMat = new THREE.MeshStandardMaterial({
      color: 0xf5f0e8,
      roughness: 0.6,
    });
    const greenMat = new THREE.MeshStandardMaterial({
      color: 0x4a8a55,
      roughness: 0.9,
    });

    for (let i = 0; i < count; i++) {
      const angle  = Math.random() * Math.PI * 2;
      const spread = 0.35 + Math.random() * 0.4;
      const h      = 2.0 + Math.random() * 0.9;

      const geo   = new THREE.SphereGeometry(0.025 + Math.random() * 0.02, 6, 6);
      const mat   = i % 4 === 0 ? greenMat : fillerMat;
      const filler = new THREE.Mesh(geo, mat);
      filler.position.set(
        Math.cos(angle) * spread,
        h,
        Math.sin(angle) * spread
      );
      this.group.add(filler);
    }
  }

  _buildWrapper() {
    // Translucent paper/fabric cone wrapper
    const wrapMat = new THREE.MeshStandardMaterial({
      color: 0xd4c5a9,
      roughness: 0.9,
      metalness: 0,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });

    // Cone (wrap body)
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 2.2, 24, 1, true),
      wrapMat
    );
    cone.position.y = -0.3;
    this.group.add(cone);

    // Ribbon bow
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0x3d6b47,
      roughness: 0.6,
      metalness: 0.1,
    });
    const ribbonGeo = new THREE.TorusGeometry(0.12, 0.025, 8, 20);
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.position.set(0, 0.8, 0.35);
    ribbon.rotation.x = Math.PI * 0.5;
    this.group.add(ribbon);

    // Wrapper ruffles (decorative edges)
    for (let i = 0; i < 12; i++) {
      const angle  = (i / 12) * Math.PI * 2;
      const ruffle = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 4),
        new THREE.MeshStandardMaterial({ color: 0xe0d4bc, roughness: 0.9, transparent: true, opacity: 0.8 })
      );
      ruffle.position.set(
        Math.cos(angle) * 0.52,
        0.75,
        Math.sin(angle) * 0.52
      );
      ruffle.scale.set(1.5, 0.6, 1.5);
      this.group.add(ruffle);
    }
  }

  _onMouse(e) {
    const r = this.canvas.getBoundingClientRect();
    this._target.set(
      ((e.clientX - r.left) / r.width  - 0.5) * 2,
      ((e.clientY - r.top)  / r.height - 0.5) * -2
    );
  }

  _onResize() {
    const W = this.canvas.clientWidth;
    const H = this.canvas.clientHeight;
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(W, H);
  }

  _animate() {
    this._raf = requestAnimationFrame(() => this._animate());
    this._t += 0.005;

    // Smooth mouse follow
    this._mouse.lerp(this._target, 0.05);

    // Rotation
    if (this.opts.rotate) {
      this.group.rotation.y += 0.003;
    }
    // Interactive tilt
    this.group.rotation.x = this._mouse.y * 0.15;
    this.group.rotation.z = this._mouse.x * -0.08;

    // Glow light pulse
    if (this._glowLight) {
      this._glowLight.intensity = 2 + Math.sin(this._t * 2) * 0.6;
    }

    // Gentle bob
    this.group.position.y = Math.sin(this._t * 0.8) * 0.06;

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    this.renderer.dispose();
  }
};
