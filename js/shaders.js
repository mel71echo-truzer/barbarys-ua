/* ============================================================
   BARBARYS — GLSL Shaders
   Celestial Bloom: procedural animated flower background
   ============================================================ */

window.SHADERS = {

  /* ── Celestial Bloom Fragment Shader ── */
  celestialBloomFrag: `
    precision highp float;
    uniform float u_time;
    uniform vec2  u_resolution;
    varying vec2  vUv;

    #define PI 3.14159265359
    #define TAU 6.28318530718

    // Hash noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
        mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p  = p * 2.1 + vec2(0.3, 0.7);
        a *= 0.5;
      }
      return v;
    }

    // Smooth step alias
    float ss(float e0, float e1, float x) {
      return smoothstep(e0, e1, x);
    }

    // Rose curve  r = cos(k * theta)
    float rosePetal(vec2 uv, float k, float size, float softness) {
      float r   = length(uv);
      float th  = atan(uv.y, uv.x);
      float rose = abs(cos(k * th)) * size;
      return ss(softness, 0.0, r - rose);
    }

    // Petal shimmer
    float shimmer(vec2 uv, float t) {
      float n = fbm(uv * 3.0 + t * 0.4);
      return n * 0.5 + 0.5;
    }

    void main() {
      vec2 uv = (vUv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0) * 2.0;

      float t = u_time * 0.3;

      // Slowly rotating coords
      float ca = cos(t * 0.15), sa = sin(t * 0.15);
      vec2 ruv = vec2(uv.x * ca - uv.y * sa, uv.x * sa + uv.y * ca);

      // Base dark gradient
      float vignette = 1.0 - smoothstep(0.5, 1.8, length(uv));
      vec3  col = vec3(0.031, 0.059, 0.035) * vignette;

      // ── Layer 1: large rose (5 petals) ──
      float r1 = rosePetal(ruv * 0.9, 5.0, 0.55, 0.04);
      float sh1 = shimmer(ruv * 2.0, t);
      vec3  c1  = mix(vec3(0.15, 0.3, 0.18), vec3(0.28, 0.55, 0.33), sh1);
      col += c1 * r1 * 0.45;

      // ── Layer 2: inner rose (6 petals, rotated) ──
      vec2 ruv2 = vec2(ruv.x * cos(t * 0.25 + 0.5) - ruv.y * sin(t * 0.25 + 0.5),
                       ruv.x * sin(t * 0.25 + 0.5) + ruv.y * cos(t * 0.25 + 0.5));
      float r2  = rosePetal(ruv2 * 1.4, 6.0, 0.38, 0.035);
      float sh2 = shimmer(ruv2 * 3.0, -t * 0.8);
      vec3  c2  = mix(vec3(0.12, 0.28, 0.16), vec3(0.35, 0.72, 0.45), sh2);
      col += c2 * r2 * 0.35;

      // ── Layer 3: tiny cream center ──
      float r3 = rosePetal(ruv * 3.0, 4.0, 0.45, 0.05);
      float sh3 = shimmer(ruv * 5.0, t * 1.2);
      vec3  c3  = mix(vec3(0.55, 0.48, 0.38), vec3(0.82, 0.77, 0.66), sh3);
      col += c3 * r3 * 0.25;

      // ── Radial shimmer spokes ──
      float th   = atan(uv.y, uv.x);
      float spokes = 0.0;
      for (int i = 0; i < 8; i++) {
        float phase = float(i) * PI / 4.0 + t * 0.2;
        float spoke = abs(sin(th * 8.0 + phase)) * 0.5 + 0.5;
        spokes += pow(spoke, 16.0);
      }
      float sRad = ss(1.2, 0.1, length(uv)) * 0.06;
      col += vec3(0.2, 0.45, 0.25) * spokes * sRad;

      // ── Floating pollen particles ──
      float pollen = 0.0;
      for (int i = 0; i < 12; i++) {
        float fi = float(i);
        vec2 seed = vec2(hash(vec2(fi, fi * 1.7)), hash(vec2(fi * 2.3, fi * 0.9)));
        vec2 pos  = (seed - 0.5) * 2.8;
        pos.x += sin(t * 0.6 + fi * 1.4) * 0.15;
        pos.y += cos(t * 0.5 + fi * 0.9) * 0.12;
        float d = length(uv - pos);
        pollen += ss(0.03, 0.0, d) * (0.4 + 0.6 * sin(t * 2.0 + fi));
      }
      col += vec3(0.7, 0.85, 0.55) * pollen * 0.12;

      // ── Global glow pulse ──
      float pulse = 0.03 * sin(t * 0.8) + 0.03;
      col += vec3(0.1, 0.25, 0.12) * pulse * vignette;

      // ── Tone map ──
      col = col / (col + 0.85);
      col = pow(col, vec3(0.9));

      gl_FragColor = vec4(col, 1.0);
    }
  `,

  celestialBloomVert: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  /* ── Card Distortion Shaders ── */
  distortFrag: `
    precision highp float;
    uniform sampler2D u_texture1;
    uniform sampler2D u_texture2;
    uniform sampler2D u_disp;
    uniform float u_progress;
    uniform float u_intensity;
    varying vec2 vUv;

    void main() {
      vec4 disp = texture2D(u_disp, vUv);
      vec2 dispVec = vec2(disp.r, disp.g);

      vec2 uv1 = vUv + u_intensity * dispVec * u_progress;
      vec2 uv2 = vUv - u_intensity * dispVec * (1.0 - u_progress);

      vec4 t1 = texture2D(u_texture1, uv1);
      vec4 t2 = texture2D(u_texture2, uv2);

      gl_FragColor = mix(t1, t2, u_progress);
    }
  `,

  distortVert: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

};

/* ── Celestial Bloom Three.js Scene ── */
window.initCelestialBloom = function(canvas) {
  if (!canvas) return;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const material = new THREE.ShaderMaterial({
    vertexShader:   SHADERS.celestialBloomVert,
    fragmentShader: SHADERS.celestialBloomFrag,
    uniforms: {
      u_time:       { value: 0 },
      u_resolution: { value: new THREE.Vector2(canvas.clientWidth, canvas.clientHeight) },
    },
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  let raf, startTime = performance.now();

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h);
    material.uniforms.u_resolution.value.set(w, h);
  }
  window.addEventListener('resize', resize);

  function tick() {
    raf = requestAnimationFrame(tick);
    material.uniforms.u_time.value = (performance.now() - startTime) / 1000;
    renderer.render(scene, camera);
  }
  tick();

  return {
    destroy() {
      cancelAnimationFrame(raf);
      renderer.dispose();
      window.removeEventListener('resize', resize);
    }
  };
};
