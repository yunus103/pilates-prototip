/* 3D reformer built from primitives (no model file). Head end is -x, foot end +x:
   the carriage is pulled toward the head end against springs anchored at the foot end. */
const SPRINGS = [
  { id: "red", name: "Kırmızı", k: 4, color: "#C8453C", on: true },
  { id: "green", name: "Yeşil", k: 3, color: "#4E9660", on: false },
  { id: "blue", name: "Mavi", k: 2, color: "#3D6DB3", on: true },
  { id: "yellow", name: "Sarı", k: 1, color: "#DDAE36", on: false }
];
const COIL_PATH = "M1 7 L4 2 L7 12 L10 2 L13 12 L16 2 L19 12 L22 2 L25 12 L28 2 L31 12 L33 7";
const totalK = () => SPRINGS.reduce((a, s) => a + (s.on ? s.k : 0), 0);
const levelName = k => k === 0 ? "Yay yok" : k <= 2 ? "Hafif direnç" : k <= 5 ? "Orta direnç" : k <= 8 ? "Ağır direnç" : "Çok ağır";

function renderSpringControls(onChange) {
  const box = $("#springs");
  const draw = () => {
    box.innerHTML = SPRINGS.map(s => `<button type="button" class="spring" data-id="${s.id}" aria-pressed="${s.on}" style="--c:${s.color}"><svg viewBox="0 0 34 14" aria-hidden="true"><path d="${COIL_PATH}"/></svg>${s.name}</button>`).join("");
    const k = totalK();
    $("#level").textContent = levelName(k);
    $("#meter").style.width = `${(k / 10) * 100}%`;
  };
  box.addEventListener("click", e => {
    const b = e.target.closest(".spring");
    if (!b) return;
    const s = SPRINGS.find(x => x.id === b.dataset.id);
    s.on = !s.on;
    draw();
    onChange();
  });
  draw();
}

/* ---------- geometry + material helpers ---------- */
// r128 has no colour management: hex colours must be converted to linear for sRGB output.
const lin = hex => new THREE.Color(hex).convertSRGBToLinear();
const mat = (color, roughness = 0.7, metalness = 0) => new THREE.MeshStandardMaterial({ color: lin(color), roughness, metalness });

// Box with rounded XY profile (radius r) and bevelled Z edges (b), centred like BoxGeometry.
function roundedBox(w, h, d, r, b = Math.min(r, 0.012)) {
  const x = w / 2 - b, y = h / 2 - b, rr = Math.max(0.001, Math.min(r - b, x, y));
  const s = new THREE.Shape();
  s.moveTo(-x + rr, -y);
  s.lineTo(x - rr, -y); s.quadraticCurveTo(x, -y, x, -y + rr);
  s.lineTo(x, y - rr); s.quadraticCurveTo(x, y, x - rr, y);
  s.lineTo(-x + rr, y); s.quadraticCurveTo(-x, y, -x, y - rr);
  s.lineTo(-x, -y + rr); s.quadraticCurveTo(-x, -y, -x + rr, -y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 6 });
  g.translate(0, 0, -(d - 2 * b) / 2);
  return g;
}

function canvasTexture(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  return new THREE.CanvasTexture(c);
}

// Procedural grain running along x; sine frequencies are whole periods so the texture tiles seamlessly.
function woodTexture() {
  const t = canvasTexture(512, 256, (g, w, h) => {
    g.fillStyle = "#D6A263";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 110; i++) {
      const y = Math.random() * h, amp = 1 + Math.random() * 5, ph = Math.random() * 6.3;
      const freq = (Math.PI * 2 * (1 + Math.floor(Math.random() * 3))) / w;
      g.strokeStyle = Math.random() < 0.6 ? `rgba(140, 86, 40, ${0.06 + Math.random() * 0.16})` : `rgba(245, 210, 150, ${0.08 + Math.random() * 0.14})`;
      g.lineWidth = 0.5 + Math.random() * 2;
      g.beginPath();
      for (let x = 0; x <= w; x += 8) g.lineTo(x, y + Math.sin(x * freq + ph) * amp);
      g.stroke();
    }
  });
  t.encoding = THREE.sRGBEncoding;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(0.8, 3);
  t.anisotropy = 4;
  return t;
}

// Soft dark ellipse under the frame so it sits on the floor even where the shadow map is thin.
function contactShadow() {
  const t = canvasTexture(128, 128, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    r.addColorStop(0, "rgba(51, 33, 28, .5)");
    r.addColorStop(1, "rgba(51, 33, 28, 0)");
    g.fillStyle = r;
    g.fillRect(0, 0, w, h);
  });
  t.encoding = THREE.sRGBEncoding;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.5), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

// Dashed rectangle just above the pad top: reads as upholstery stitching.
function stitch(w, d, y, inset) {
  const x = w / 2 - inset, z = d / 2 - inset;
  const pts = [[-x, -z], [x, -z], [x, z], [-x, z], [-x, -z]].map(([px, pz]) => new THREE.Vector3(px, y, pz));
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: lin("#9A897A"), dashSize: 0.014, gapSize: 0.009 }));
  line.computeLineDistances();
  return line;
}

/* ---------- model ---------- */
const REST_X = 0.22, TRAVEL = 0.9, ANCHOR_X = 1.03, SPRING_Z = [-0.15, -0.05, 0.05, 0.15];

function buildReformer(scene) {
  const grain = woodTexture();
  const wood = new THREE.MeshStandardMaterial({ map: grain, roughness: 0.55 });
  const woodDark = new THREE.MeshStandardMaterial({ map: grain, color: lin("#D8BC98"), roughness: 0.6 });
  const pad = mat("#D9CEC2", 0.92), rubber = mat("#2B2320", 0.85), steel = mat("#D4D1CC", 0.3, 0.9), strap = mat("#26201D", 0.75);
  const add = (parent, geo, material, x, y, z, shadow = true) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = shadow; m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const root = new THREE.Group();
  scene.add(root);

  // Frame: two rails with steel tracks, end caps, legs
  [-0.31, 0.31].forEach(z => {
    add(root, roundedBox(2.5, 0.13, 0.07, 0.025), wood, 0, 0.31, z);
    add(root, new THREE.BoxGeometry(2.3, 0.006, 0.03), steel, 0, 0.378, z, false);
  });
  [-1.25, 1.25].forEach(x => add(root, roundedBox(0.08, 0.2, 0.69, 0.02), woodDark, x, 0.3, 0));
  [[-1.18, -0.3], [-1.18, 0.3], [1.18, -0.3], [1.18, 0.3]].forEach(([x, z]) => add(root, roundedBox(0.08, 0.25, 0.08, 0.02), woodDark, x, 0.125, z));
  add(root, new THREE.BoxGeometry(2.4, 0.02, 0.5), woodDark, 0, 0.26, 0, false);

  // Foot bar: steel uprights, black foam-covered bar
  [-0.27, 0.27].forEach(z => add(root, new THREE.CylinderGeometry(0.018, 0.018, 0.5, 16), steel, 1.14, 0.62, z));
  add(root, new THREE.CylinderGeometry(0.04, 0.04, 0.62, 28), rubber, 1.14, 0.87, 0).rotation.x = Math.PI / 2;

  // Head end: rope posts with pulleys
  const pulleys = [-0.31, 0.31].map(z => {
    add(root, new THREE.CylinderGeometry(0.02, 0.02, 0.55, 16), steel, -1.25, 0.66, z);
    add(root, new THREE.SphereGeometry(0.035, 20, 14), steel, -1.25, 0.94, z);
    return new THREE.Vector3(-1.25, 0.94, z);
  });

  // Spring bar
  add(root, roundedBox(0.06, 0.06, 0.52, 0.015), woodDark, ANCHOR_X + 0.04, 0.34, 0);
  add(root, new THREE.CylinderGeometry(0.01, 0.01, 0.5, 12), steel, ANCHOR_X + 0.012, 0.34, 0, false).rotation.x = Math.PI / 2;

  // Carriage (sliding part)
  const carriage = new THREE.Group();
  root.add(carriage);
  add(carriage, roundedBox(0.82, 0.05, 0.6, 0.02), woodDark, 0, 0.405, 0);
  add(carriage, roundedBox(0.8, 0.07, 0.58, 0.035, 0.03), pad, 0, 0.465, 0);
  carriage.add(stitch(0.8, 0.58, 0.5015, 0.045));
  [-0.13, 0.13].forEach(z => {
    add(carriage, roundedBox(0.08, 0.15, 0.08, 0.03, 0.02), pad, -0.27, 0.575, z);
    const loop = add(carriage, new THREE.TorusGeometry(0.055, 0.008, 8, 28), strap, -0.27, 0.6, z);
    loop.rotation.x = Math.PI / 2;
  });
  add(carriage, roundedBox(0.16, 0.05, 0.26, 0.022, 0.02), pad, -0.36, 0.53, 0).rotation.z = -0.35;

  // Ropes from the pulleys to the strap loops; re-spanned every frame as the carriage moves.
  const ropeGeo = new THREE.CylinderGeometry(0.005, 0.005, 1, 6);
  const ropes = pulleys.map(() => add(root, ropeGeo, strap, 0, 0, 0));

  // Springs: one helix stretched along x, plus a hook at each end
  const curve = new THREE.Curve();
  curve.getPoint = (t, target = new THREE.Vector3()) => { const a = t * Math.PI * 2 * 18; return target.set(t, Math.sin(a) * 0.028, Math.cos(a) * 0.028); };
  const helix = new THREE.TubeGeometry(curve, 420, 0.006, 6, false);
  const hookGeo = new THREE.TorusGeometry(0.014, 0.003, 6, 16);
  const coils = [], hooks = [];
  SPRINGS.forEach((s, i) => {
    const m = mat(s.color, 0.35, 0.35);
    coils.push(add(root, helix, m, 0, 0.34, SPRING_Z[i]));
    hooks.push(add(root, hookGeo, steel, 0, 0.34, SPRING_Z[i], false));
    add(root, hookGeo, steel, ANCHOR_X + 0.012, 0.34, SPRING_Z[i], false);
  });

  root.position.y = -0.05;

  // Orients a unit-height Y cylinder so it spans from a to b.
  const up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3(), ropeEnd = new THREE.Vector3();
  const spanRope = (rope, a, b) => {
    dir.subVectors(b, a);
    rope.position.copy(a).addScaledVector(dir, 0.5);
    rope.scale.set(1, dir.length(), 1);
    rope.quaternion.setFromUnitVectors(up, dir.normalize());
  };

  // Moves the carriage by x (0 = at rest) and re-fits springs, hooks and ropes to it.
  return function pose(x) {
    carriage.position.x = REST_X - x;
    const front = carriage.position.x + 0.41;
    coils.forEach((m, i) => {
      const start = SPRINGS[i].on ? front : ANCHOR_X - 0.36;
      m.position.x = start;
      m.scale.x = ANCHOR_X - start;
      hooks[i].position.x = start - 0.012;
    });
    ropes.forEach((rope, i) => spanRope(rope, pulleys[i], ropeEnd.set(carriage.position.x - 0.325, 0.6, pulleys[i].z * 0.42)));
  };
}

/* ---------- scene, camera, interaction ---------- */
// Camera stops; scroll blends between them. wide/narrow are view offsets (fraction of the viewport)
// that push the reformer away from the beat text: right on desktop, down on phones.
const SHOTS = [
  { pos: [2.35, 1.75, 3.3], look: [0.05, 0.35, 0], wide: [-0.14, 0.05], narrow: [0, -0.2] },
  { pos: [1.85, 0.85, 1.25], look: [0.72, 0.38, 0], wide: [-0.16, 0.02], narrow: [0, -0.04] },
  { pos: [-0.2, 3.9, 1.1], look: [0.0, 0.3, 0], wide: [-0.14, 0.03], narrow: [0, -0.17] }
];

function initReformer() {
  const canvas = $("#reformer");
  let renderer = null;
  if (window.THREE) { try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" }); } catch { renderer = null; } }
  if (!renderer) { $("#panel").hidden = true; $("#hint").hidden = true; return; }
  const coarse = matchMedia("(pointer: coarse)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 60);
  scene.add(new THREE.HemisphereLight(lin("#FFF4EC"), lin("#C49F8D"), 0.75));
  const sun = new THREE.DirectionalLight(lin("#FFF8F0"), 1.25);
  sun.position.set(1.6, 4, 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -1.8, right: 1.8, top: 1.8, bottom: -1.8, near: 0.5, far: 10 });
  scene.add(sun);
  const fill = new THREE.DirectionalLight(lin("#FFE7DA"), 0.4);
  fill.position.set(-3, 2, -2);
  scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.18 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.05; floor.receiveShadow = true;
  scene.add(floor);
  const blob = contactShadow();
  blob.position.y = -0.048;
  scene.add(blob);

  const pose = buildReformer(scene);

  let vw = 1, vh = 1, wideLayout = true, dist = 1, dirty = true;
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    vw = w; vh = h;
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    wideLayout = vw > 900;
    dist = clamp(1.5 / camera.aspect, 1, 2.7);   // pull back on portrait screens so the whole frame fits
    dirty = true;
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  // Physics
  let x = 0, v = 0, dragging = false, dragStartX = 0, dragStartDisp = 0, lastMove = 0, touched = false, lastT = performance.now();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  canvas.addEventListener("pointerdown", e => {
    dragging = true;
    dragStartX = e.clientX; dragStartDisp = x; v = 0; lastMove = performance.now();
    canvas.classList.add("dragging");
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", e => {
    if (!dragging) return;
    // Only a real horizontal pull stops the autoplay; a touch that turns into a scroll does not.
    if (!touched) { touched = true; $("#hint").classList.add("gone"); }
    const now = performance.now();
    const give = 3.2 / (1.4 + totalK() * 0.35);                    // heavier springs: same pull, less travel
    const next = clamp(dragStartDisp + ((dragStartX - e.clientX) / canvas.clientWidth) * give, 0, TRAVEL);
    v = (next - x) / Math.max((now - lastMove) / 1000, 0.008);
    x = next; lastMove = now;
  });
  const end = () => { dragging = false; canvas.classList.remove("dragging"); };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);

  renderSpringControls(() => { touched = true; dirty = true; });

  const scene3 = $("#scene"), stage = $("#stage"), beats = [...document.querySelectorAll(".beat")], breath = $("#breath");
  let beatNow = 0;
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();

  function placeCamera(p) {
    const t = clamp(p / 0.8, 0, 1) * (SHOTS.length - 1);
    const i = Math.min(SHOTS.length - 2, Math.floor(t));
    const f = smooth(t - i);
    const A = SHOTS[i], B = SHOTS[i + 1];
    camLook.copy(a.fromArray(A.look)).lerp(b.fromArray(B.look), f);
    camPos.copy(a.fromArray(A.pos)).lerp(b.fromArray(B.pos), f).sub(camLook).multiplyScalar(dist).add(camLook);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    const oA = wideLayout ? A.wide : A.narrow, oB = wideLayout ? B.wide : B.narrow;
    camera.setViewOffset(vw, vh, (oA[0] + (oB[0] - oA[0]) * f) * vw, (oA[1] + (oB[1] - oA[1]) * f) * vh, vw, vh);
  }
  function showBeat(p) {
    const idx = p < 0.3 ? 0 : p < 0.64 ? 1 : 2;
    if (idx === beatNow) return;
    beatNow = idx;
    stage.dataset.beat = idx;
    beats.forEach((el, i) => { el.classList.toggle("off", i !== idx); el.setAttribute("aria-hidden", i !== idx); });
  }
  function stepPhysics(now, dt) {
    if (dragging) return;
    if (!touched && !reduced) {
      const target = 0.38 * (0.5 - 0.5 * Math.cos(now / 1000 * 1.25));  // footwork loop until the visitor takes over
      v = (target - x) / Math.max(dt, 0.001); x = target;
      return;
    }
    const k = totalK();
    const acc = -k * 9 * x - v * (k ? 3.2 : 2.2);
    v += acc * dt; x += v * dt;
    if (x < 0) { x = 0; v = Math.abs(v) * 0.15; }
    if (x > TRAVEL) { x = TRAVEL; v = 0; }
  }
  function breathText() {
    return v < -0.08 || (x > 0.02 && !dragging && v < -0.02) ? "Nefes al" : v > 0.08 ? "Nefes ver" : x > 0.05 ? "Kontrol et" : "";
  }

  let visible = false, running = false, drawnX = -1, drawnP = -1;
  function tick(now) {
    if (!visible) { running = false; return; }
    const dt = Math.min(0.033, (now - lastT) / 1000); lastT = now;
    stepPhysics(now, dt);
    const scrollSpan = scene3.offsetHeight - window.innerHeight;
    const p = scrollSpan > 0 ? clamp(-scene3.getBoundingClientRect().top / scrollSpan, 0, 1) : 0;
    showBeat(p);
    const text = breathText();
    if (breath.textContent !== text) breath.textContent = text;
    // Skip the GPU work when nothing moved: carriage at rest, no scroll, no spring change.
    if (dirty || Math.abs(x - drawnX) > 1e-5 || p !== drawnP) {
      pose(x);
      placeCamera(p);
      renderer.render(scene, camera);
      drawnX = x; drawnP = p; dirty = false;
    }
    requestAnimationFrame(tick);
  }
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !running) { running = true; lastT = performance.now(); requestAnimationFrame(tick); }
  }).observe(scene3);
}
