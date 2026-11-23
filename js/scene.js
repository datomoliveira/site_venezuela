/* ==========================================================================
   GET VENEZUELA — cenas 3D
   Three.js local. Um palco por página, materiais físicos e luz de estúdio.
   ========================================================================== */
import * as THREE from "../assets/vendor/three.module.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = window.matchMedia("(pointer: fine)").matches;

const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
if (fine) {
  window.addEventListener("pointermove", (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
}

const Y = new THREE.Vector3(0, 1, 0);

/* --------------------------------------------------------------------------
   Ambiente procedural (estúdio quente com janelas de luz)
   -------------------------------------------------------------------------- */
function makeEnvironment(renderer) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext("2d");

  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#fff6e2");
  g.addColorStop(0.34, "#d8cdb6");
  g.addColorStop(0.55, "#8e8674");
  g.addColorStop(0.72, "#4a463b");
  g.addColorStop(1, "#15140f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 512);

  const blob = (x, y, r, color) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, color);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  blob(748, 108, 250, "rgba(255,255,255,0.98)");
  blob(286, 168, 190, "rgba(255,224,186,0.9)");
  blob(980, 250, 150, "rgba(188,69,38,0.5)");
  ctx.fillStyle = "rgba(20,19,14,0.6)";
  ctx.fillRect(0, 382, 1024, 130);

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  tex.dispose();
  pmrem.dispose();
  return env;
}

/* --------------------------------------------------------------------------
   Sombra de contato
   -------------------------------------------------------------------------- */
let shadowMap = null;
function getShadowMap() {
  if (shadowMap) return shadowMap;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 4, 128, 128, 126);
  g.addColorStop(0, "rgba(20,19,14,0.55)");
  g.addColorStop(0.42, "rgba(20,19,14,0.28)");
  g.addColorStop(1, "rgba(20,19,14,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  shadowMap = new THREE.CanvasTexture(c);
  shadowMap.colorSpace = THREE.SRGBColorSpace;
  return shadowMap;
}

function contactShadow(size = 6, y = -2.1, opacity = 0.6) {
  const mat = new THREE.MeshBasicMaterial({
    map: getShadowMap(),
    transparent: true,
    opacity,
    depthWrite: false,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.renderOrder = -1;
  return mesh;
}

/* --------------------------------------------------------------------------
   Materiais
   -------------------------------------------------------------------------- */
function makeMaterials(env) {
  return {
    clay: new THREE.MeshPhysicalMaterial({
      color: 0xb84224,
      metalness: 0.5,
      roughness: 0.27,
      clearcoat: 0.65,
      clearcoatRoughness: 0.32,
      envMap: env,
      envMapIntensity: 1.05,
    }),
    clayMatte: new THREE.MeshStandardMaterial({
      color: 0xb23f22,
      metalness: 0.32,
      roughness: 0.55,
      envMap: env,
      envMapIntensity: 0.75,
    }),
    chrome: new THREE.MeshPhysicalMaterial({
      color: 0xece6d8,
      metalness: 1,
      roughness: 0.13,
      envMap: env,
      envMapIntensity: 1.45,
    }),
    bone: new THREE.MeshPhysicalMaterial({
      color: 0xe7dfcc,
      metalness: 0.18,
      roughness: 0.44,
      clearcoat: 0.25,
      envMap: env,
      envMapIntensity: 1,
    }),
    ink: new THREE.MeshPhysicalMaterial({
      color: 0x1a1813,
      metalness: 0.62,
      roughness: 0.34,
      envMap: env,
      envMapIntensity: 0.9,
    }),
  };
}

/* --------------------------------------------------------------------------
   Geometrias / composições
   -------------------------------------------------------------------------- */
function buildV(mats) {
  const g = new THREE.Group();

  const shape = new THREE.Shape();
  shape.moveTo(-1.5, 2.0);
  shape.lineTo(0, -1.82);
  shape.lineTo(1.5, 2.0);
  shape.lineTo(0.74, 2.0);
  shape.lineTo(0, 0.18);
  shape.lineTo(-0.74, 2.0);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.52,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.055,
    bevelSegments: 4,
    curveSegments: 18,
  });
  geo.center();

  const v = new THREE.Mesh(geo, mats.clay);
  v.rotation.set(-0.06, -0.34, -0.04);
  v.position.set(0, 0.08, 0);
  v.castShadow = true;
  g.add(v);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.022, 12, 128), mats.chrome);
  ring.rotation.set(1.18, 0.24, 0.18);
  g.add(ring);

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.86, 0.011, 8, 128), mats.ink);
  ring2.rotation.set(1.32, -0.5, -0.22);
  g.add(ring2);

  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 24), mats.chrome);
  dot.position.set(1.62, 1.15, 1.05);
  g.add(dot);

  g.position.y = 0.12;

  return {
    group: g,
    shadow: contactShadow(6.4, -2.03, 0.5),
    update(t, s) {
      g.rotation.y = -0.18 + Math.sin(t * 0.24) * 0.16 + pointer.x * 0.22 + s * 0.5;
      g.rotation.x = Math.sin(t * 0.18) * 0.045 + pointer.y * 0.08;
      g.position.y = 0.12 + Math.sin(t * 0.7) * 0.055;
      ring.rotation.z = 0.18 + t * 0.06;
      ring2.rotation.z = -0.22 - t * 0.045;
      dot.position.y = 1.15 + Math.sin(t * 0.9) * 0.12;
    },
  };
}

function buildGrid(mats) {
  const g = new THREE.Group();
  const N = 11;
  const step = 0.43;
  const count = N * N;
  const dummy = new THREE.Object3D();

  const clayMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 1, 0.3), mats.clayMatte, count);
  const boneMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 1, 0.3), mats.bone, count);
  clayMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  boneMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  let ci = 0;
  let bi = 0;
  const cells = [];

  for (let ix = 0; ix < N; ix++) {
    for (let iz = 0; iz < N; iz++) {
      const x = (ix - (N - 1) / 2) * step;
      const z = (iz - (N - 1) / 2) * step;
      const dist = Math.sqrt(x * x + z * z);
      const h = 0.24 + Math.max(0, Math.sin(dist * 1.5 - 0.5)) * 1.35 + Math.random() * 0.06;
      const isClay = (ix * 3 + iz * 5) % 11 === 0;
      cells.push({ x, z, h, dist, isClay, ix, iz });
    }
  }

  for (const cell of cells) {
    dummy.position.set(cell.x, cell.h / 2, cell.z);
    dummy.scale.set(1, cell.h, 1);
    dummy.rotation.y = 0;
    dummy.updateMatrix();
    if (cell.isClay) {
      clayMesh.setMatrixAt(ci++, dummy.matrix);
    } else {
      boneMesh.setMatrixAt(bi++, dummy.matrix);
    }
  }
  clayMesh.count = ci;
  boneMesh.count = bi;
  clayMesh.instanceMatrix.needsUpdate = true;
  boneMesh.instanceMatrix.needsUpdate = true;
  g.add(clayMesh, boneMesh);

  g.rotation.set(0.32, 0.62, 0);
  g.position.y = -0.35;

  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.62, 0.015, 10, 140), mats.clay);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -1.62;
  g.add(ring);

  return {
    group: g,
    shadow: contactShadow(6.8, -2.25, 0.36),
    update(t, s) {
      g.rotation.y = 0.62 + t * 0.055 + pointer.x * 0.16 + s * 0.6;
      g.rotation.x = 0.32 + Math.sin(t * 0.25) * 0.03 + pointer.y * 0.06;

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const wave = Math.sin(t * 0.9 + cell.dist * 2.1 + cell.ix * 0.18 + cell.iz * 0.12);
        const h = Math.max(0.16, cell.h + wave * 0.16);
        dummy.position.set(cell.x, h / 2, cell.z);
        dummy.scale.set(1, h, 1);
        dummy.updateMatrix();
        // reenvia todas as instâncias (barato: 121)
        // índice original preservado em cell.slot
        cell.h2 = h;
      }
      let c2 = 0;
      let b2 = 0;
      for (const cell of cells) {
        const h = cell.h2;
        dummy.position.set(cell.x, h / 2, cell.z);
        dummy.scale.set(1, h, 1);
        dummy.updateMatrix();
        if (cell.isClay) clayMesh.setMatrixAt(c2++, dummy.matrix);
        else boneMesh.setMatrixAt(b2++, dummy.matrix);
      }
      clayMesh.instanceMatrix.needsUpdate = true;
      boneMesh.instanceMatrix.needsUpdate = true;
    },
  };
}

function buildRings(mats) {
  const g = new THREE.Group();

  const specs = [
    { r: 2.15, tube: 0.042, mat: mats.clay, rot: [1.2, 0.2, 0.25], speed: 0.11 },
    { r: 1.68, tube: 0.028, mat: mats.chrome, rot: [0.55, 1.1, -0.35], speed: -0.16 },
    { r: 1.2, tube: 0.05, mat: mats.ink, rot: [1.45, -0.4, 0.6], speed: 0.22 },
  ];

  const rings = specs.map((spec) => {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(spec.r, spec.tube, 16, 160), spec.mat);
    mesh.rotation.set(...spec.rot);
    g.add(mesh);
    return { mesh, spec };
  });

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.36, 48, 48), mats.clay);
  g.add(core);

  const small = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 20), mats.chrome);
  small.position.set(2.1, 0.25, 0.15);
  g.add(small);

  g.position.y = 0.16;

  return {
    group: g,
    shadow: contactShadow(6.6, -2.19, 0.42),
    update(t, s) {
      g.rotation.y = t * 0.06 + pointer.x * 0.18 + s * 0.3;
      g.rotation.x = Math.sin(t * 0.2) * 0.06 + pointer.y * 0.06;
      g.position.y = 0.16 + Math.sin(t * 0.6) * 0.05;
      rings.forEach(({ mesh, spec }, i) => {
        mesh.rotation.z += spec.speed * 0.008;
        mesh.rotation.x = spec.rot[0] + Math.sin(t * 0.3 + i) * 0.12;
      });
      small.position.y = 0.25 + Math.sin(t * 0.8) * 0.3;
    },
  };
}

function buildDots(mats) {
  const g = new THREE.Group();
  const total = 760;
  const geo = new THREE.SphereGeometry(0.032, 10, 10);
  const mesh = new THREE.InstancedMesh(geo, mats.clay, total);
  const dummy = new THREE.Object3D();

  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < total; i++) {
    const y = 1 - (i / (total - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    const radius = 1.98;
    dummy.position.set(x * radius, y * radius, z * radius);
    const sc = 0.7 + Math.random() * 0.9;
    dummy.scale.setScalar(sc);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  g.add(mesh);

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.62, 48, 48), mats.chrome);
  g.add(core);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.22, 0.012, 8, 160), mats.ink);
  ring.rotation.set(1.35, 0.3, 0);
  g.add(ring);

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.42, 0.008, 8, 160), mats.clay);
  ring2.rotation.set(0.6, 1.15, 0.4);
  g.add(ring2);

  g.rotation.set(0.18, 0.4, 0);
  g.position.y = 0.1;

  return {
    group: g,
    shadow: contactShadow(6.2, -2.15, 0.36),
    update(t, s) {
      g.rotation.y = 0.4 + t * 0.09 + pointer.x * 0.25 + s * 0.4;
      g.rotation.x = 0.18 + Math.sin(t * 0.3) * 0.05;
      g.position.y = 0.1 + Math.sin(t * 0.55) * 0.06;
      ring.rotation.z = t * 0.05;
      ring2.rotation.z = -t * 0.035;
    },
  };
}

/* --------------------------------------------------------------------------
   Palco
   -------------------------------------------------------------------------- */
class Stage {
  constructor(el) {
    this.el = el;
    this.type = el.dataset.scene || "v";
    this.visible = true;
    this.build();
    this.bind();
    this.loop = this.loop.bind(this);
    this.last = performance.now();
    this.t = Math.random() * 10;
    this.playing = !reduced;

    if (reduced) {
      this.render(0);
    } else {
      requestAnimationFrame(this.loop);
    }
  }

  build() {
    const canvas = this.el.querySelector("canvas");
    if (!canvas) throw new Error("Palco sem canvas");

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);

    const env = makeEnvironment(this.renderer);
    this.scene.environment = env;
    const mats = makeMaterials(env);

    this.scene.add(new THREE.HemisphereLight(0xfff1d8, 0x2a261c, 0.55));

    const key = new THREE.DirectionalLight(0xfff0d8, 2.6);
    key.position.set(4.5, 6, 5.5);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0xbc4526, 2.2);
    rim.position.set(-5.5, -1.5, 3.5);
    this.scene.add(rim);

    const fill = new THREE.DirectionalLight(0xdfe7ff, 0.6);
    fill.position.set(0, 2, -6);
    this.scene.add(fill);

    this.camera.position.set(0, 0.1, 8.6);
    this.camera.lookAt(0, 0, 0);

    const builders = { v: buildV, grid: buildGrid, rings: buildRings, dots: buildDots };
    const builder = builders[this.type] || buildV;
    this.content = builder(mats);
    this.scene.add(this.content.group);
    if (this.content.shadow) this.scene.add(this.content.shadow);

    if (this.type === "grid") {
      this.camera.position.set(0, 3.3, 7.8);
      this.camera.lookAt(0, -0.2, 0);
      this.content.group.scale.setScalar(0.95);
    }
    if (this.type === "dots") {
      this.camera.position.set(0, 0.3, 8.2);
    }
    if (this.type === "rings") {
      this.camera.position.set(0, 0.2, 8.1);
      this.content.group.scale.setScalar(0.98);
    }

    this.resize();
  }

  bind() {
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.el);

    if ("IntersectionObserver" in window) {
      this.io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { this.visible = e.isIntersecting; });
      }, { rootMargin: "120px" });
      this.io.observe(this.el);
    }

    document.addEventListener("visibilitychange", () => {
      this.playing = !document.hidden && !reduced;
      this.last = performance.now();
    });
  }

  resize() {
    const w = this.el.clientWidth || 1;
    const h = this.el.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    if (reduced) this.render(0);
  }

  render(t) {
    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;
    const s = Math.min(1, window.scrollY / Math.max(1, window.innerHeight));
    this.content.update(t, s);
    this.renderer.render(this.scene, this.camera);
  }

  loop(now) {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;
    if (!this.visible || !this.playing) return;
    this.render(this.t);
  }
}

/* --------------------------------------------------------------------------
   Montagem
   -------------------------------------------------------------------------- */
const mounted = new WeakSet();

export function mountAll() {
  document.querySelectorAll("[data-scene]").forEach((el) => {
    if (mounted.has(el)) return;
    // palco oculto (display:none no mobile) não deve abrir contexto WebGL
    if (el.clientWidth < 2 || el.clientHeight < 2) return;
    mounted.add(el);
    try {
      new Stage(el);
    } catch (err) {
      console.warn("Falha ao montar cena:", err);
      el.classList.add("is-fallback");
    }
  });
}

let retry = 0;
window.addEventListener("resize", () => {
  clearTimeout(retry);
  retry = window.setTimeout(mountAll, 280);
}, { passive: true });
