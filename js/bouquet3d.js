/* ============================================================
   BARBARYS — Three.js 3D Bouquets  (rewrite v2)
   BouquetScene  : product-card renderer, constructor(canvas, config)
   Bouquet3D     : product-page legacy viewer
   ============================================================ */

/* ═══════════════════════════════════════════════════════════
   SHARED GEOMETRY HELPERS
   ═══════════════════════════════════════════════════════════ */

function createPetalGeo(w, h, bend) {
  w    = w    !== undefined ? w    : 0.35;
  h    = h    !== undefined ? h    : 1.0;
  bend = bend !== undefined ? bend : 0.15;

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(-w * 0.8, h * 0.25, -w, h * 0.7, 0, h);
  shape.bezierCurveTo( w * 0.8, h * 0.7,   w, h * 0.25, 0, 0);

  const geo = new THREE.ShapeGeometry(shape, 16);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / h;
    pos.setZ(i, bend * t * t * h);
    pos.setX(i, pos.getX(i) * (1 - t * 0.25));
  }
  geo.computeVertexNormals();
  return geo;
}

function createRose(hexColor, size, extraLayers) {
  size        = size        !== undefined ? size        : 1.0;
  extraLayers = extraLayers !== undefined ? extraLayers : 0;

  const g = new THREE.Group();
  let layers = [
    { n: 5, r: 0.12, h: 0.48, tiltZ: 0.25, tiltX: 1.0 },
    { n: 6, r: 0.26, h: 0.62, tiltZ: 0.55, tiltX: 0.7 },
    { n: 7, r: 0.40, h: 0.75, tiltZ: 0.85, tiltX: 0.45 },
    { n: 8, r: 0.55, h: 0.82, tiltZ: 1.1,  tiltX: 0.2 },
    { n: 9, r: 0.68, h: 0.85, tiltZ: 1.3,  tiltX: 0.0 },
  ];
  for (let e = 0; e < extraLayers; e++) {
    layers.push({ n: 9 + e * 2, r: 0.78 + e * 0.12, h: 0.88, tiltZ: 1.45, tiltX: -0.15 });
  }

  layers.forEach((l, li) => {
    const geo = createPetalGeo(0.30 * size, l.h * size, 0.1 * size);
    const col = new THREE.Color(hexColor);
    const mat = new THREE.MeshStandardMaterial({
      color: col, roughness: 0.45, metalness: 0,
      side: THREE.DoubleSide, transparent: true, opacity: 0.95,
    });
    for (let i = 0; i < l.n; i++) {
      const a = (i / l.n) * Math.PI * 2 + li * 0.4;
      const p = new THREE.Mesh(geo, mat);
      p.position.set(Math.cos(a) * l.r * size, 0, Math.sin(a) * l.r * size);
      p.rotation.set(l.tiltX, -a, l.tiltZ);
      g.add(p);
    }
  });

  const pistilCol = new THREE.Color(hexColor);
  pistilCol.offsetHSL(0, 0, -0.15);
  g.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.07 * size, 8, 8),
    new THREE.MeshStandardMaterial({ color: pistilCol, roughness: 0.6 }),
  ));
  return g;
}

function createStem(x, yTop, z, yBottom, color) {
  yBottom = yBottom !== undefined ? yBottom : -1.4;
  color   = color   !== undefined ? color   : '#2d5a1b';
  const wobble = (Math.random() - 0.5) * 0.12;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(x, yTop, z),
    new THREE.Vector3(x + wobble, (yTop + yBottom) / 2, z + wobble),
    new THREE.Vector3(x * 0.6, yBottom, z * 0.6),
  ]);
  return new THREE.Mesh(
    new THREE.TubeGeometry(curve, 10, 0.018, 5, false),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8 }),
  );
}

function createLeaf(color, scale) {
  color = color !== undefined ? color : '#3a7a2a';
  scale = scale !== undefined ? scale : 1;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(-0.13, 0.09, -0.16, 0.28, 0, 0.48);
  shape.bezierCurveTo( 0.16, 0.28,  0.13, 0.09, 0,  0);
  const geo = new THREE.ShapeGeometry(shape, 10);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setZ(i, Math.pow(pos.getY(i) / 0.48, 2) * 0.06);
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo,
    new THREE.MeshStandardMaterial({ color, roughness: 0.7, side: THREE.DoubleSide }),
  );
  mesh.scale.setScalar(scale);
  return mesh;
}

function setupLighting(scene) {
  scene.add(new THREE.AmbientLight(0xfff5e6, 0.7));
  const key = new THREE.DirectionalLight(0xffe8d0, 1.5);
  key.position.set(3, 5, 3);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd0e0ff, 0.5);
  fill.position.set(-3, 2, -2);
  scene.add(fill);
  const rim = new THREE.PointLight(0x7B1020, 0.7, 10);
  rim.position.set(-1.5, -2, 2);
  scene.add(rim);
}

/* ── Eucalyptus sprig ── */
function createEucalyptus(x, z) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#4a7a5a', roughness: 0.7, side: THREE.DoubleSide });
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(x, -0.2, z),
    new THREE.Vector3(x + (Math.random() - 0.5) * 0.15, 0.6, z),
    new THREE.Vector3(x + (Math.random() - 0.5) * 0.1, 1.2, z),
  ]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.012, 4, false),
    new THREE.MeshStandardMaterial({ color: '#2d5a1b', roughness: 0.8 })));
  // small oval leaves along stem
  for (let j = 0; j < 5; j++) {
    const t = 0.2 + j * 0.18;
    const pt = curve.getPoint(t);
    const geo = new THREE.EllipsoidGeometry
      ? new THREE.EllipsoidGeometry(0.065, 0.04, 0.02, 8, 4)
      : new THREE.SphereGeometry(0.055, 6, 4);
    const leaf = new THREE.Mesh(geo, mat);
    leaf.position.copy(pt).add(new THREE.Vector3((Math.random() - 0.5) * 0.1, 0, 0));
    leaf.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, 0);
    g.add(leaf);
  }
  return g;
}

/* ── Wrap cone (paper/silk base) ── */
function createWrapCone(color, h, rBottom) {
  h       = h       !== undefined ? h       : 1.0;
  rBottom = rBottom !== undefined ? rBottom : 0.55;
  const geo = new THREE.ConeGeometry(rBottom, h, 20, 1, true);
  const mat = new THREE.MeshStandardMaterial({
    color, roughness: 0.9, side: THREE.DoubleSide, transparent: true, opacity: 0.88,
  });
  const cone = new THREE.Mesh(geo, mat);
  cone.position.y = -h / 2 - 0.05;
  return cone;
}

/* ═══════════════════════════════════════════════════════════
   6 BOUQUET BUILDERS
   ═══════════════════════════════════════════════════════════ */

/* bouquet1 — Кармінна ніч */
function buildBouquet1(scene) {
  const colors = ['#7B1020', '#9B1A2A', '#6B0E1A'];
  const positions = [
    // center high
    { x:  0.0, y: 0.50, z:  0.0, s: 1.0 },
    // inner ring 3
    { x:  0.28, y: 0.30, z:  0.0,  s: 0.92 },
    { x: -0.14, y: 0.30, z:  0.24, s: 0.95 },
    { x: -0.14, y: 0.30, z: -0.24, s: 0.92 },
    // outer ring 5
    { x:  0.60, y: 0.00, z:  0.0,  s: 0.88 },
    { x:  0.19, y: 0.00, z:  0.57, s: 0.90 },
    { x: -0.50, y: 0.00, z:  0.35, s: 0.88 },
    { x: -0.50, y: 0.00, z: -0.35, s: 0.90 },
    { x:  0.19, y: 0.00, z: -0.57, s: 0.88 },
  ];

  const group = new THREE.Group();
  positions.forEach((p, i) => {
    const rose = createRose(colors[i % 3], p.s);
    rose.position.set(p.x, p.y, p.z);
    rose.rotation.y = Math.random() * Math.PI * 2;
    group.add(rose);
    group.add(createStem(p.x, p.y - 0.1, p.z, -1.3, '#2d5a1b'));
  });

  // eucalyptus fillers
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    group.add(createEucalyptus(Math.cos(a) * 0.5, Math.sin(a) * 0.5));
  }

  group.add(createWrapCone('#1A0808', 0.9, 0.50));
  scene.add(group);
  return group;
}

/* bouquet2 — Смарагдова весна */
function buildBouquet2(scene) {
  const group = new THREE.Group();
  const peonyPositions = [
    { x:  0.0,  y: 0.45, z:  0.0,  s: 1.3 },
    { x:  0.5,  y: 0.20, z:  0.0,  s: 1.2 },
    { x: -0.25, y: 0.20, z:  0.43, s: 1.25 },
    { x: -0.25, y: 0.20, z: -0.43, s: 1.2 },
    { x:  0.55, y: 0.00, z:  0.50, s: 1.15 },
    { x: -0.60, y: 0.00, z:  0.0,  s: 1.2 },
  ];
  peonyPositions.forEach(p => {
    const peony = createRose('#f2aab8', p.s, 1); // extra layer = peony fullness
    peony.position.set(p.x, p.y, p.z);
    peony.rotation.y = Math.random() * Math.PI * 2;
    group.add(peony);
    group.add(createStem(p.x, p.y - 0.1, p.z, -1.2, '#3d6b2a'));
  });

  // freesia — tiny 4-petal flowers
  const freesiaMat = new THREE.MeshStandardMaterial({ color: '#fff8f0', roughness: 0.5, side: THREE.DoubleSide });
  const freesiaGeo = createPetalGeo(0.07, 0.25, 0.04);
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI * 2;
    const fx = Math.cos(a0) * 0.75 + (Math.random() - 0.5) * 0.2;
    const fz = Math.sin(a0) * 0.75 + (Math.random() - 0.5) * 0.2;
    const ff = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const pm = new THREE.Mesh(freesiaGeo, freesiaMat);
      pm.position.set(Math.cos(a) * 0.04, 0, Math.sin(a) * 0.04);
      pm.rotation.set(0.8, -a, 0.3);
      ff.add(pm);
    }
    ff.position.set(fx, 0.1 + Math.random() * 0.3, fz);
    group.add(ff);
    group.add(createStem(fx, 0.05, fz, -1.1, '#4a7a40'));
  }

  // green leaves
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const lf = createLeaf('#3d7d3d', 1.2 + Math.random() * 0.5);
    lf.position.set(Math.cos(a) * 0.6, -0.2 + Math.random() * 0.4, Math.sin(a) * 0.6);
    lf.rotation.set(-0.3, a, 0.4);
    group.add(lf);
  }

  group.add(createWrapCone('#c4956a', 0.95, 0.55));
  scene.add(group);
  return group;
}

/* bouquet3 — Бузкові мрії */
function buildBouquet3(scene) {
  const group = new THREE.Group();
  const lisiColors = ['#9b7fc4', '#b89fe4', '#8a6ab8'];
  const lisiPos = [
    { x:  0.0,  y: 0.4,  z:  0.0  },
    { x:  0.45, y: 0.15, z:  0.0  },
    { x: -0.22, y: 0.15, z:  0.39 },
    { x: -0.22, y: 0.15, z: -0.39 },
    { x:  0.55, y:-0.05, z:  0.45 },
    { x: -0.55, y:-0.05, z:  0.25 },
    { x:  0.10, y:-0.05, z: -0.60 },
  ];
  lisiPos.forEach((p, i) => {
    // lisianthus: tighter inner layers → cup shape
    const lisi = new THREE.Group();
    const innerLayers = [
      { n: 5, r: 0.08, h: 0.55, tiltZ: 0.2,  tiltX: 0.9 },
      { n: 6, r: 0.18, h: 0.65, tiltZ: 0.45, tiltX: 0.55 },
      { n: 7, r: 0.28, h: 0.70, tiltZ: 0.7,  tiltX: 0.25 },
    ];
    const col = lisiColors[i % 3];
    innerLayers.forEach((l, li) => {
      const geo = createPetalGeo(0.28, l.h, 0.08);
      const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.4, side: THREE.DoubleSide, transparent: true, opacity: 0.93 });
      for (let k = 0; k < l.n; k++) {
        const a = (k / l.n) * Math.PI * 2 + li * 0.5;
        const pm = new THREE.Mesh(geo, mat);
        pm.position.set(Math.cos(a) * l.r, 0, Math.sin(a) * l.r);
        pm.rotation.set(l.tiltX, -a, l.tiltZ);
        lisi.add(pm);
      }
    });
    lisi.add(new THREE.Mesh(new THREE.SphereGeometry(0.055, 7, 7),
      new THREE.MeshStandardMaterial({ color: '#f5d56e', roughness: 0.5 })));
    lisi.position.set(p.x, p.y, p.z);
    lisi.rotation.y = Math.random() * Math.PI * 2;
    group.add(lisi);
    group.add(createStem(p.x, p.y - 0.05, p.z, -1.25, '#4a6a3a'));
  });

  // Hydrangea cluster — 40 tiny sphere+4petal in hemisphere
  const hydrGroup = new THREE.Group();
  const hydrMat = new THREE.MeshStandardMaterial({ color: '#c8b8e8', roughness: 0.5, side: THREE.DoubleSide });
  const hydrGeo = createPetalGeo(0.055, 0.18, 0.02);
  for (let i = 0; i < 40; i++) {
    const phi   = Math.acos(1 - Math.random() * 0.9);   // hemisphere
    const theta = Math.random() * Math.PI * 2;
    const r     = 0.28 + Math.random() * 0.12;
    const hf    = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const pm = new THREE.Mesh(hydrGeo, hydrMat);
      pm.position.set(Math.cos(a) * 0.03, 0, Math.sin(a) * 0.03);
      pm.rotation.set(0.6, -a, 0.2);
      hf.add(pm);
    }
    hf.add(new THREE.Mesh(new THREE.SphereGeometry(0.02, 5, 5),
      new THREE.MeshStandardMaterial({ color: '#f0e0ff', roughness: 0.5 })));
    hf.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta),
    );
    hydrGroup.add(hf);
  }
  hydrGroup.position.set(-0.15, -0.1, 0.15);
  group.add(hydrGroup);

  // dusty miller leaves
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const lf = createLeaf('#8a9a80', 1.3);
    lf.position.set(Math.cos(a) * 0.65, -0.25, Math.sin(a) * 0.65);
    lf.rotation.set(-0.2, a, 0.5);
    group.add(lf);
  }

  group.add(createWrapCone('#e8dff0', 0.9, 0.52));
  scene.add(group);
  return group;
}

/* bouquet4 — Золота осінь */
function buildBouquet4(scene) {
  const group = new THREE.Group();

  function createChrysanthemum(color, x, y, z, s) {
    s = s !== undefined ? s : 1;
    const cg = new THREE.Group();
    const rings = [
      { n: 12, r: 0.06, h: 0.9, tiltX: 0.9 },
      { n: 16, r: 0.22, h: 0.9, tiltX: 0.55 },
      { n: 20, r: 0.38, h: 0.9, tiltX: 0.25 },
      { n: 24, r: 0.54, h: 0.9, tiltX: -0.05 },
    ];
    rings.forEach((l, li) => {
      const geo = createPetalGeo(0.08 * s, l.h * s, 0.02 * s); // thin straight petals
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, side: THREE.DoubleSide });
      for (let i = 0; i < l.n; i++) {
        const a = (i / l.n) * Math.PI * 2 + li * 0.22;
        const pm = new THREE.Mesh(geo, mat);
        pm.position.set(Math.cos(a) * l.r * s, 0, Math.sin(a) * l.r * s);
        pm.rotation.set(l.tiltX, -a, 0);
        cg.add(pm);
      }
    });
    cg.add(new THREE.Mesh(new THREE.SphereGeometry(0.08 * s, 8, 8),
      new THREE.MeshStandardMaterial({ color: '#f5d560', roughness: 0.4 })));
    cg.position.set(x, y, z);
    group.add(cg);
    group.add(createStem(x, y - 0.05, z, -1.3, '#5a6a30'));
  }

  // 5 chrysanthemums
  const chryPositions = [
    { x:  0.0,  y: 0.4,  z:  0.0,  c: '#d4a020', s: 0.9 },
    { x:  0.5,  y: 0.15, z:  0.15, c: '#e06030', s: 0.85 },
    { x: -0.25, y: 0.15, z:  0.43, c: '#d4a020', s: 0.88 },
    { x: -0.25, y: 0.15, z: -0.43, c: '#e06030', s: 0.85 },
    { x:  0.55, y:-0.05, z: -0.40, c: '#d4a020', s: 0.82 },
  ];
  chryPositions.forEach(p => createChrysanthemum(p.c, p.x, p.y, p.z, p.s));

  // 3 gerbera daisies (same form, coral)
  const gerberPos = [
    { x: -0.55, y: 0.0,  z: -0.1  },
    { x:  0.15, y:-0.1,  z:  0.65 },
    { x: -0.50, y:-0.05, z:  0.55 },
  ];
  gerberPos.forEach(p => createChrysanthemum('#e05830', p.x, p.y, p.z, 0.78));

  // Amaranth drooping stems
  const amMat = new THREE.MeshStandardMaterial({ color: '#c03020', roughness: 0.75 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const sx = Math.cos(a) * 0.5;
    const sz = Math.sin(a) * 0.5;
    const droop = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx, 0.2, sz),
      new THREE.Vector3(sx + Math.cos(a) * 0.2, -0.15, sz + Math.sin(a) * 0.2),
      new THREE.Vector3(sx + Math.cos(a) * 0.3, -0.55, sz + Math.sin(a) * 0.3),
    ]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(droop, 8, 0.016, 5, false), amMat));
  }

  group.add(createWrapCone('#8a7a30', 0.9, 0.53));
  scene.add(group);
  return group;
}

/* bouquet5 — Морська лазур */
function buildBouquet5(scene) {
  const group = new THREE.Group();

  function createIris(x, y, z) {
    const ig = new THREE.Group();
    // 3 upright inner petals
    const innerGeo = createPetalGeo(0.20, 0.72, 0.12);
    const innerMat = new THREE.MeshStandardMaterial({ color: '#6878d8', roughness: 0.4, side: THREE.DoubleSide, transparent: true, opacity: 0.92 });
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      const pm = new THREE.Mesh(innerGeo, innerMat);
      pm.position.set(Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08);
      pm.rotation.set(0.3, -a, 0.15);
      ig.add(pm);
    }
    // 3 outer falling petals
    const outerGeo = createPetalGeo(0.28, 0.85, 0.18);
    const outerMat = new THREE.MeshStandardMaterial({ color: '#4858c8', roughness: 0.45, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + Math.PI / 3;
      const pm = new THREE.Mesh(outerGeo, outerMat);
      pm.position.set(Math.cos(a) * 0.14, 0, Math.sin(a) * 0.14);
      pm.rotation.set(-0.5, -a, 0.4);
      ig.add(pm);
    }
    ig.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 7, 7),
      new THREE.MeshStandardMaterial({ color: '#f5f0a0', roughness: 0.5 })));
    ig.position.set(x, y, z);
    ig.rotation.y = Math.random() * Math.PI * 2;
    group.add(ig);
    group.add(createStem(x, y - 0.05, z, -1.3, '#3a6a5a'));
  }

  // 5 iris
  const irisPos = [
    { x:  0.0,  y: 0.5,  z:  0.0  },
    { x:  0.48, y: 0.2,  z:  0.0  },
    { x: -0.24, y: 0.2,  z:  0.42 },
    { x: -0.24, y: 0.2,  z: -0.42 },
    { x:  0.55, y: 0.0,  z: -0.48 },
  ];
  irisPos.forEach(p => createIris(p.x, p.y, p.z));

  // Delphinium: vertical stem + 8 small 5-petal flowers along Y
  for (let di = 0; di < 3; di++) {
    const da = (di / 3) * Math.PI * 2 + 0.5;
    const dx = Math.cos(da) * 0.6;
    const dz = Math.sin(da) * 0.6;
    const delphiniumCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(dx, -0.3, dz),
      new THREE.Vector3(dx + (Math.random() - 0.5) * 0.08, 0.6, dz),
      new THREE.Vector3(dx, 1.3, dz),
    ]);
    group.add(new THREE.Mesh(
      new THREE.TubeGeometry(delphiniumCurve, 10, 0.015, 5, false),
      new THREE.MeshStandardMaterial({ color: '#3a6a5a', roughness: 0.8 }),
    ));
    const dGeo = createPetalGeo(0.09, 0.28, 0.04);
    const dMat = new THREE.MeshStandardMaterial({ color: '#7888e0', roughness: 0.45, side: THREE.DoubleSide });
    for (let j = 0; j < 8; j++) {
      const t = 0.2 + j * 0.1;
      const pt = delphiniumCurve.getPoint(t);
      const flr = new THREE.Group();
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        const pm = new THREE.Mesh(dGeo, dMat);
        pm.position.set(Math.cos(a) * 0.04, 0, Math.sin(a) * 0.04);
        pm.rotation.set(0.6, -a, 0.2);
        flr.add(pm);
      }
      flr.position.copy(pt);
      group.add(flr);
    }
  }

  // Silver dusty miller leaves
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const lf = createLeaf('#8898a8', 1.2);
    lf.position.set(Math.cos(a) * 0.7, -0.2, Math.sin(a) * 0.7);
    lf.rotation.set(-0.2, a, 0.4);
    group.add(lf);
  }

  group.add(createWrapCone('#1a2840', 0.9, 0.52));
  scene.add(group);
  return group;
}

/* bouquet6 — Ніжний шовк (PREMIUM) */
function buildBouquet6(scene) {
  const group = new THREE.Group();
  const SCALE = 1.15;

  // 5 oversized white peonies (7 layers)
  const peonyPos = [
    { x:  0.0,  y: 0.55, z:  0.0  },
    { x:  0.55, y: 0.22, z:  0.0  },
    { x: -0.28, y: 0.22, z:  0.48 },
    { x: -0.28, y: 0.22, z: -0.48 },
    { x:  0.60, y: 0.00, z: -0.52 },
  ];
  const peonyColors = ['#fdf0f5', '#fce8ee'];
  peonyPos.forEach((p, i) => {
    const peony = createRose(peonyColors[i % 2], 1.5 * SCALE, 2);
    peony.position.set(p.x * SCALE, p.y * SCALE, p.z * SCALE);
    peony.rotation.y = Math.random() * Math.PI * 2;
    group.add(peony);
    group.add(createStem(p.x * SCALE, p.y * SCALE - 0.1, p.z * SCALE, -1.4, '#3a5a2a'));
  });

  // 8 white tulips — LatheGeometry tulip silhouette
  const tulipProfile = [];
  const pts = [[0, 0], [0.12, 0.05], [0.20, 0.2], [0.22, 0.4], [0.20, 0.6], [0.14, 0.75], [0.04, 0.88], [0, 0.88]];
  pts.forEach(([x, y]) => tulipProfile.push(new THREE.Vector2(x, y)));
  const tulipGeo = new THREE.LatheGeometry(tulipProfile, 10);
  const tulipMat = new THREE.MeshStandardMaterial({ color: '#fefefe', roughness: 0.35, side: THREE.DoubleSide });

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.3;
    const r = 0.48 + (i % 2) * 0.18;
    const tx = Math.cos(a) * r * SCALE;
    const tz = Math.sin(a) * r * SCALE;
    const ty = (0.05 - (r - 0.48) * 0.2) * SCALE;
    const tulip = new THREE.Mesh(tulipGeo, tulipMat);
    tulip.scale.setScalar(0.55 * SCALE);
    tulip.position.set(tx, ty, tz);
    tulip.rotation.set(-0.1, a, 0.08 * (Math.random() - 0.5));
    group.add(tulip);
    group.add(createStem(tx, ty - 0.03, tz, -1.35, '#4a7a3a'));
  }

  // White hydrangea cluster
  const hydrGroup = new THREE.Group();
  const hydrMat = new THREE.MeshStandardMaterial({ color: '#f5f5f5', roughness: 0.5, side: THREE.DoubleSide });
  const hydrGeo = createPetalGeo(0.065, 0.20, 0.02);
  for (let i = 0; i < 35; i++) {
    const phi   = Math.acos(1 - Math.random() * 0.85);
    const theta = Math.random() * Math.PI * 2;
    const r     = 0.30 + Math.random() * 0.10;
    const hf    = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const pm = new THREE.Mesh(hydrGeo, hydrMat);
      pm.position.set(Math.cos(a) * 0.035, 0, Math.sin(a) * 0.035);
      pm.rotation.set(0.55, -a, 0.2);
      hf.add(pm);
    }
    hf.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 5, 5),
      new THREE.MeshStandardMaterial({ color: '#fff8f8', roughness: 0.4 })));
    hf.position.set(
      r * Math.sin(phi) * Math.cos(theta) * SCALE,
      r * Math.cos(phi) * SCALE,
      r * Math.sin(phi) * Math.sin(theta) * SCALE,
    );
    hydrGroup.add(hf);
  }
  hydrGroup.position.set(-0.2 * SCALE, -0.15 * SCALE, 0.2 * SCALE);
  group.add(hydrGroup);

  // Ivory silk ribbon — flat wide ribbon geometry
  const ribbonShape = new THREE.Shape();
  ribbonShape.moveTo(-0.5, 0);
  ribbonShape.bezierCurveTo(-0.3, 0.08, 0.3, 0.08, 0.5, 0);
  ribbonShape.bezierCurveTo(0.3, -0.04, -0.3, -0.04, -0.5, 0);
  const ribbonGeo = new THREE.ShapeGeometry(ribbonShape, 8);
  const ribbonMat = new THREE.MeshStandardMaterial({ color: '#f0e0d0', roughness: 0.6, side: THREE.DoubleSide });
  for (let r = 0; r < 3; r++) {
    const rib = new THREE.Mesh(ribbonGeo, ribbonMat);
    rib.scale.setScalar(SCALE * 0.75);
    rib.position.set(0, -0.55 * SCALE + r * 0.06, 0);
    rib.rotation.set(0.1, r * 1.1, 0);
    group.add(rib);
  }

  group.add(createWrapCone('#f0e0d0', 1.0 * SCALE, 0.58 * SCALE));
  scene.add(group);
  return group;
}

/* ── bouquet selector by primary color ── */
const BOUQUET_MAP = {
  '#C0392B': buildBouquet1,
  '#4CAF50': buildBouquet2,
  '#9B59B6': buildBouquet3,
  '#E67E22': buildBouquet4,
  '#2980B9': buildBouquet5,
  '#E8B4B4': buildBouquet6,
};

/* ═══════════════════════════════════════════════════════════
   BouquetScene — product-card renderer
   Keeps same calling convention: new BouquetScene(canvas, { primaryColor })
   ═══════════════════════════════════════════════════════════ */

window.BouquetScene = class BouquetScene {

  constructor(canvas, config) {
    config = config || {};
    this._canvas = canvas;
    this._color  = (config.primaryColor || '#C0392B').toUpperCase();
    // Normalize to uppercase key
    const key    = Object.keys(BOUQUET_MAP).find(
      k => k.toUpperCase() === this._color
    ) || '#C0392B';
    this._builder = BOUQUET_MAP[key] || buildBouquet1;

    this._raf    = null;
    this._paused = false;
    this._group  = null;

    this._init();
  }

  _dims() {
    const p = this._canvas.parentElement;
    const W = (p ? p.clientWidth  : 0) || this._canvas.clientWidth  || 400;
    const H = (p ? p.clientHeight : 0) || this._canvas.clientHeight || 400;
    return { W: W || 400, H: H || 400 };
  }

  _init() {
    const { W, H } = this._dims();
    const c = this._canvas;

    this._renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
    this._renderer.physicallyCorrectLights = true;
    this._renderer.toneMapping            = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure    = 1.3;
    this._renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this._renderer.setSize(W, H, false);

    this._scene = new THREE.Scene();
    setupLighting(this._scene);

    this._camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 50);
    this._camera.position.set(0, 0.3, 3.8);

    this._group = this._builder(this._scene);

    // Resize observer
    if (window.ResizeObserver) {
      this._ro = new ResizeObserver(() => this._onResize());
      this._ro.observe(c.parentElement || c);
    } else {
      window.addEventListener('resize', () => this._onResize());
    }

    // IntersectionObserver — pause when off-screen
    if (window.IntersectionObserver) {
      this._io = new IntersectionObserver(([e]) => {
        this._paused = !e.isIntersecting;
      }, { threshold: 0 });
      this._io.observe(c);
    }

    // Hover speed-up
    const parent = c.parentElement;
    if (parent) {
      parent.addEventListener('mouseenter', () => { this._hovered = true; });
      parent.addEventListener('mouseleave', () => { this._hovered = false; });
    }

    this._tick();
  }

  _onResize() {
    const { W, H } = this._dims();
    if (!W || !H) return;
    this._renderer.setSize(W, H, false);
    this._camera.aspect = W / H;
    this._camera.updateProjectionMatrix();
  }

  _tick() {
    if (!this._paused) {
      if (this._group) this._group.rotation.y += this._hovered ? 0.012 : 0.006;
      this._renderer.render(this._scene, this._camera);
    }
    this._raf = requestAnimationFrame(() => this._tick());
  }

  dispose() {
    cancelAnimationFrame(this._raf);
    if (this._ro) this._ro.disconnect();
    if (this._io) this._io.disconnect();
    this._renderer.dispose();
  }
};

/* ═══════════════════════════════════════════════════════════
   Bouquet3D — product-page legacy viewer (unchanged interface)
   ═══════════════════════════════════════════════════════════ */

window.Bouquet3D = class Bouquet3D {
  constructor(canvas, options) {
    options = options || {};
    this.canvas = canvas;
    this.opts = Object.assign({
      rotate:      true,
      bg:          0x0f0405,
      alpha:       true,
      interactive: true,
    }, options);
    this._t      = 0;
    this._mouse  = new THREE.Vector2();
    this._target = new THREE.Vector2();
    this._raf    = null;
    this._init();
  }

  _dims() {
    const p = this.canvas.parentElement;
    const W = (p ? p.clientWidth  : 0) || this.canvas.clientWidth  || 600;
    const H = (p ? p.clientHeight : 0) || this.canvas.clientHeight || 600;
    return { W: W || 600, H: H || 600 };
  }

  _init() {
    const { canvas, opts } = this;
    const { W, H } = this._dims();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: opts.alpha });
    this.renderer.physicallyCorrectLights = true;
    this.renderer.toneMapping            = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure    = 1.2;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(W, H, false);
    if (!opts.alpha) this.renderer.setClearColor(opts.bg);
    this.renderer.shadowMap.enabled = true;

    this.scene  = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(opts.bg, 0.10);

    this.camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 50);
    this.camera.position.set(0, 0.5, 4.2);

    setupLighting(this.scene);
    // extra point for product page
    const pt2 = new THREE.PointLight(0xfff0d0, 1.0, 8);
    pt2.position.set(2, 3, 2);
    this.scene.add(pt2);

    // build bouquet1 as default product view
    this._group = buildBouquet1(this.scene);

    if (opts.interactive && window.THREE && THREE.OrbitControls) {
      this._controls = new THREE.OrbitControls(this.camera, canvas);
      this._controls.enableDamping = true;
      this._controls.dampingFactor = 0.08;
      this._controls.minDistance   = 2;
      this._controls.maxDistance   = 8;
      this._controls.enablePan     = false;
    }

    if (window.ResizeObserver) {
      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(canvas.parentElement || canvas);
    } else {
      window.addEventListener('resize', () => this._resize());
    }

    this._loop();
  }

  _resize() {
    const { W, H } = this._dims();
    if (!W || !H) return;
    this.renderer.setSize(W, H, false);
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
  }

  _loop() {
    this._t += 0.006;
    if (this.opts.rotate && this._group && !this._controls) {
      this._group.rotation.y += 0.006;
    }
    if (this._controls) this._controls.update();
    this.renderer.render(this.scene, this.camera);
    this._raf = requestAnimationFrame(() => this._loop());
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    if (this._ro) this._ro.disconnect();
    if (this._controls) this._controls.dispose();
    this.renderer.dispose();
  }
};
