/* Télécommande 3D (three.js) : construite en code, sans modèle externe.
   API : press(action), powerOn(), setAway(bool), dispose().
   Sans WebGL : une télécommande SVG prend le relais avec la même API. */
import * as THREE from '../vendor/three.min.js';

const ORANGE = 0xff5a1f;

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

function labelTexture(draw, size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function textLabel(text, color = '#e9e9ee', weight = 600, scale = 0.5) {
  return labelTexture((g, s) => {
    g.fillStyle = color;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `${weight} ${Math.round(s * scale)}px "Geist Mono", ui-monospace, monospace`;
    g.fillText(text, s / 2, s / 2 + s * 0.03);
  });
}

function iconLabel(kind, color = '#e9e9ee') {
  return labelTexture((g, s) => {
    g.strokeStyle = color;
    g.fillStyle = color;
    g.lineWidth = s * 0.07;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const m = s / 2;
    if (kind === 'power') {
      g.beginPath(); g.arc(m, m + s * 0.03, s * 0.22, -Math.PI * 0.32, Math.PI * 1.32); g.stroke();
      g.beginPath(); g.moveTo(m, m - s * 0.27); g.lineTo(m, m - s * 0.02); g.stroke();
    } else if (kind === 'home') {
      g.beginPath(); g.moveTo(m - s * 0.2, m - s * 0.02); g.lineTo(m, m - s * 0.22); g.lineTo(m + s * 0.2, m - s * 0.02);
      g.moveTo(m - s * 0.14, m - s * 0.06); g.lineTo(m - s * 0.14, m + s * 0.2); g.lineTo(m + s * 0.14, m + s * 0.2); g.lineTo(m + s * 0.14, m - s * 0.06); g.stroke();
    } else if (kind === 'menu') {
      [-0.12, 0, 0.12].forEach((d) => { g.beginPath(); g.moveTo(m - s * 0.17, m + s * d); g.lineTo(m + s * 0.17, m + s * d); g.stroke(); });
    } else if (kind === 'back') {
      g.beginPath(); g.moveTo(m + s * 0.18, m); g.lineTo(m - s * 0.16, m); g.moveTo(m - s * 0.04, m - s * 0.13); g.lineTo(m - s * 0.17, m); g.lineTo(m - s * 0.04, m + s * 0.13); g.stroke();
    } else if (kind === 'tri') {
      g.beginPath(); g.moveTo(m, m - s * 0.14); g.lineTo(m + s * 0.13, m + s * 0.09); g.lineTo(m - s * 0.13, m + s * 0.09); g.closePath(); g.fill();
    }
  });
}

/* ---------- Version SVG (sans WebGL) ---------- */
function createFallback(container) {
  const keys = [];
  const nums = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CH−', '0', 'CH+'];
  const actions = ['ch:1', 'ch:2', 'ch:3', 'ch:4', 'ch:5', 'ch:6', 'ch:7', 'ch:8', 'ch:9', 'ch-', 'ch:0', 'ch+'];
  let grid = '';
  nums.forEach((n, i) => {
    const x = 40 + (i % 3) * 40, y = 250 + Math.floor(i / 3) * 42;
    grid += `<g><circle class="k" data-action="${actions[i]}" cx="${x}" cy="${y}" r="15" fill="#3a3c43"/><text x="${x}" y="${y + 4}" text-anchor="middle" font-family="Geist Mono, monospace" font-size="${n.length > 1 ? 9 : 12}" fill="#e9e9ee">${n}</text></g>`;
  });
  container.innerHTML = `<div class="remote-fallback"><svg viewBox="0 0 160 520" role="img" aria-label="Télécommande">
    <rect x="10" y="10" width="140" height="500" rx="52" fill="#232429"/>
    <rect x="10" y="10" width="140" height="500" rx="52" fill="none" stroke="rgba(255,255,255,.08)"/>
    <circle class="k" data-action="power" cx="44" cy="62" r="14" fill="#ff5a1f"/>
    <circle class="led" cx="118" cy="58" r="4" fill="#5a2410"/>
    <circle cx="80" cy="142" r="46" fill="#2f3137"/>
    <circle class="k" data-action="ok" cx="80" cy="142" r="20" fill="#3a3c43"/>
    <text x="80" y="146" text-anchor="middle" font-family="Geist Mono, monospace" font-size="11" fill="#e9e9ee">OK</text>
    <circle class="k" data-action="back" cx="40" cy="206" r="11" fill="#3a3c43"/>
    <circle class="k" data-action="home" cx="80" cy="206" r="11" fill="#3a3c43"/>
    <circle class="k" data-action="menu" cx="120" cy="206" r="11" fill="#3a3c43"/>
    ${grid}
    <text x="80" y="470" text-anchor="middle" font-family="Geist Mono, monospace" font-size="10" letter-spacing="2" fill="#6c6e77">TV·CQ</text>
  </svg></div>`;
  container.querySelectorAll('.k').forEach((k) => keys.push(k));
  const led = container.querySelector('.led');
  return {
    isWebGL: false,
    press(action) {
      const k = keys.find((x) => x.dataset.action === action);
      if (k) { k.classList.add('on'); setTimeout(() => k.classList.remove('on'), 260); }
      if (led) { led.setAttribute('fill', '#ff5a1f'); setTimeout(() => led.setAttribute('fill', '#5a2410'), 320); }
    },
    powerOn() { this.press('power'); return null; },
    setAway(away) { container.style.opacity = away ? '0' : '1'; container.style.transition = 'opacity .5s'; },
    dispose() { container.innerHTML = ''; }
  };
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

export async function createRemote(container, opts = {}) {
  const calm = !!opts.calm;
  const variant = opts.variant || 'rail';
  if (opts.forceFallback || !webglAvailable() || /[?&]nowebgl\b/.test(location.search) || location.hash === '#sans-webgl') {
    return createFallback(container);
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'default' });
  } catch (e) {
    return createFallback(container);
  }

  try { await document.fonts.load('600 64px "Geist Mono"'); } catch (e) { /* police de secours */ }

  try {
    return build(container, opts, renderer, calm, variant);
  } catch (err) {
    if (window.console) console.warn('Télécommande 3D : version SVG affichée.', err);
    try { renderer.dispose(); renderer.domElement.remove(); } catch (e) { /* rien */ }
    return createFallback(container);
  }
}

function build(container, opts, renderer, calm, variant) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(variant === 'hero' ? 26 : 27, 1, 0.1, 200);
  camera.position.set(0, 0, variant === 'hero' ? 40 : 41);

  /* Lumières */
  scene.add(new THREE.HemisphereLight(0xf2f2f5, 0x1b1c20, 1.5));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
  keyLight.position.set(6, 10, 14);
  scene.add(keyLight);
  const coolLight = new THREE.DirectionalLight(0xa9b8ff, 0.9);
  coolLight.position.set(-9, 6, -4);
  scene.add(coolLight);
  const rim = new THREE.PointLight(ORANGE, 160, 40, 2);
  rim.position.set(-6.5, -4, 6);
  scene.add(rim);

  /* Corps */
  const W = 4.6, H = 17.6, DEPTH = 0.8, BEVEL = 0.36;
  const bodyGeo = new THREE.ExtrudeGeometry(roundedRect(W, H, 1.75), {
    depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: 0.34, bevelSegments: 10, curveSegments: 40
  });
  bodyGeo.center();
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x24252a, roughness: 0.42, metalness: 0.18, clearcoat: 0.75, clearcoatRoughness: 0.32 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);

  const remote = new THREE.Group();
  remote.add(body);
  const FRONT = DEPTH / 2 + BEVEL;

  /* Façade légèrement plus mate */
  const plateGeo = new THREE.ShapeGeometry(roundedRect(W - 0.5, H - 0.6, 1.5), 40);
  const plate = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({ color: 0x1f2025, roughness: 0.78, metalness: 0.05 }));
  plate.position.z = FRONT + 0.002;
  remote.add(plate);

  /* Touches */
  const keyMat = new THREE.MeshStandardMaterial({ color: 0x3a3c43, roughness: 0.62, metalness: 0.05 });
  const keyMatHover = new THREE.MeshStandardMaterial({ color: 0x4a4c55, roughness: 0.55, metalness: 0.05 });
  const powerMat = new THREE.MeshStandardMaterial({ color: ORANGE, roughness: 0.48, metalness: 0.05, emissive: 0x3a1206, emissiveIntensity: 0.4 });
  const keys = [];

  function addKey(x, y, r, action, tex, opt = {}) {
    const h = opt.h || 0.3;
    const geo = new THREE.CylinderGeometry(r, r * 1.02, h, 48);
    geo.rotateX(Math.PI / 2);
    const mat = opt.mat || keyMat;
    const mesh = new THREE.Mesh(geo, mat);
    const z = FRONT + h / 2 + 0.01;
    mesh.position.set(x, y, z);
    mesh.userData = { action, baseZ: z, baseMat: mat };
    if (tex) {
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(r * 1.7, r * 1.7), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
      lab.position.z = h / 2 + 0.006;
      mesh.add(lab);
    }
    remote.add(mesh);
    keys.push(mesh);
    return mesh;
  }

  // alimentation et LED
  addKey(-1.25, 7.15, 0.46, 'power', iconLabel('power', '#1b0c05'), { mat: powerMat });
  const ledMat = new THREE.MeshStandardMaterial({ color: 0x3a1408, emissive: ORANGE, emissiveIntensity: 0.12, roughness: 0.3 });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), ledMat);
  led.position.set(1.3, 7.3, FRONT + 0.05);
  remote.add(led);

  // croix directionnelle
  const ringGeo = new THREE.CylinderGeometry(1.6, 1.62, 0.24, 72);
  ringGeo.rotateX(Math.PI / 2);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ color: 0x2e3036, roughness: 0.5, metalness: 0.1 }));
  ring.position.set(0, 4.15, FRONT + 0.13);
  remote.add(ring);
  const tri = iconLabel('tri', '#9ea0aa');
  [[0, 1.18, 0], [0, -1.18, Math.PI], [-1.18, 0, Math.PI / 2], [1.18, 0, -Math.PI / 2]].forEach(([dx, dy, rot]) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: tri, transparent: true, depthWrite: false, toneMapped: false }));
    p.position.set(dx, 4.15 + dy, FRONT + 0.26);
    p.rotation.z = rot;
    remote.add(p);
  });
  addKey(0, 4.15, 0.7, 'ok', textLabel('OK', '#e9e9ee', 700, 0.36), { h: 0.42 });

  // retour, accueil, menu
  addKey(-1.3, 1.75, 0.36, 'back', iconLabel('back'));
  addKey(0, 1.75, 0.36, 'home', iconLabel('home'));
  addKey(1.3, 1.75, 0.36, 'menu', iconLabel('menu'));

  // pavé numérique
  const labels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CH−', '0', 'CH+'];
  const actions = ['ch:1', 'ch:2', 'ch:3', 'ch:4', 'ch:5', 'ch:6', 'ch:7', 'ch:8', 'ch:9', 'ch-', 'ch:0', 'ch+'];
  labels.forEach((lb, i) => {
    const x = -1.3 + (i % 3) * 1.3;
    const y = 0.05 - Math.floor(i / 3) * 1.38;
    addKey(x, y, 0.52, actions[i], textLabel(lb, '#e9e9ee', 600, lb.length > 1 ? 0.26 : 0.46));
  });

  // gravure
  const brand = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshBasicMaterial({
    map: labelTexture((g, s) => {
      g.fillStyle = '#6c6e77'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `600 ${Math.round(s * 0.11)}px "Geist Mono", monospace`;
      g.fillText('T V · C Q', s / 2, s / 2);
    }, 256), transparent: true, depthWrite: false, toneMapped: false
  }));
  brand.scale.set(1, 1, 1);
  brand.position.set(0, -6.7, FRONT + 0.004);
  remote.add(brand);

  const holder = new THREE.Group();
  holder.add(remote);
  scene.add(holder);

  /* Position de base */
  const base = variant === 'hero'
    ? { rx: -0.35, ry: 0.25, rz: -0.62, x: 0, y: 0 }
    : { rx: -0.22, ry: -0.38, rz: 0.14, x: 0.2, y: 0 };
  holder.rotation.set(base.rx, base.ry, base.rz);
  holder.position.set(base.x, base.y, 0);

  const state = { away: 0, intro: 1, wob: 0, px: 0, py: 0, tpx: 0, tpy: 0 };
  const gsap = window.gsap;

  /* Taille */
  function resize() {
    const r = container.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // garder la télécommande entière dans un rail étroit
    const need = variant === 'hero' ? Math.max(38, 17 / camera.aspect) : Math.max(41, 20 / camera.aspect * 0.95);
    camera.position.z = need;
    camera.updateProjectionMatrix();
    kick(200);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  /* Survol et clic des touches */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered = null;
  function pick(e) {
    const r = renderer.domElement.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom || state.away > 0.5) return null;
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(keys, false)[0];
    return hit ? hit.object : null;
  }
  function onMove(e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    const r = container.getBoundingClientRect();
    state.tpx = ((e.clientX - r.left) / Math.max(1, r.width)) - 0.5;
    state.tpy = ((e.clientY - r.top) / Math.max(1, r.height)) - 0.5;
    kick(400);
    const k = opts.onKey ? pick(e) : null;
    if (k !== hovered) {
      if (hovered) hovered.material = hovered.userData.baseMat;
      hovered = k;
      if (hovered && hovered.userData.baseMat === keyMat) hovered.material = keyMatHover;
      document.body.classList.toggle('remote-hover', !!hovered);
      document.body.style.cursor = hovered ? 'pointer' : '';
      kick(300);
    }
  }
  function onClick(e) {
    if (!opts.onKey) return;
    const k = pick(e);
    if (!k) return;
    press(k.userData.action);
    opts.onKey(k.userData.action);
  }
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('click', onClick);

  /* Actions */
  function press(action) {
    const k = keys.find((x) => x.userData.action === action);
    if (k && gsap) {
      gsap.killTweensOf(k.position);
      gsap.fromTo(k.position, { z: k.userData.baseZ }, { z: k.userData.baseZ - 0.17, duration: 0.09, yoyo: true, repeat: 1, ease: 'power2.out', onUpdate: () => kick(60) });
    }
    if (gsap) {
      // un seul éclair de la LED par pression
      gsap.fromTo(ledMat, { emissiveIntensity: 3.4 }, { emissiveIntensity: 0.12, duration: 0.55, ease: 'power2.out', onUpdate: () => kick(60) });
      if (!calm) gsap.fromTo(state, { wob: 1 }, { wob: 0, duration: 0.9, ease: 'power3.out' });
    }
    kick(700);
  }

  function powerOn() {
    if (!gsap || calm) { state.intro = 0; ledMat.emissiveIntensity = 0.12; kick(200); return null; }
    state.intro = 1;
    const tl = gsap.timeline();
    tl.fromTo(state, { intro: 1 }, { intro: 0, duration: 1.4, ease: 'power3.out' })
      .add(() => press('power'), 0.55);
    return tl;
  }

  function setAway(away) {
    if (!gsap || calm) { state.away = away ? 1 : 0; kick(300); return; }
    gsap.to(state, { away: away ? 1 : 0, duration: away ? 0.8 : 1, ease: away ? 'power3.in' : 'power3.out' });
  }

  /* Boucle de rendu */
  let renderUntil = 0;
  function kick(ms) { renderUntil = Math.max(renderUntil, performance.now() + ms); }
  let inView = true;
  const io = new IntersectionObserver((en) => { inView = en[0].isIntersecting; kick(100); });
  io.observe(container);

  let raf = 0;
  let lastDraw = 0;
  let scrollMax = 1;
  const measureScroll = () => { scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); };
  measureScroll();
  window.addEventListener('resize', measureScroll);
  window.addEventListener('load', measureScroll);
  if (window.ScrollTrigger) window.ScrollTrigger.addEventListener('refresh', measureScroll);
  const onScroll = () => kick(250);
  window.addEventListener('scroll', onScroll, { passive: true });
  let running = true;
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const animate = !calm;
    if (!inView || document.hidden) return;
    const busy = now < renderUntil || (gsap && gsap.isTweening(state));
    if (!animate && !busy) return;
    // au repos, le léger balancement n'a pas besoin de 60 images par seconde
    if (!busy && now - lastDraw < 50) return;
    lastDraw = now;

    const t = now / 1000;
    state.px += (state.tpx - state.px) * 0.06;
    state.py += (state.tpy - state.py) * 0.06;
    const docH = scrollMax;
    const p = Math.min(1, Math.max(0, window.scrollY / docH));

    const scrollTurn = variant === 'hero' ? 0 : (p - 0.5) * 1.1;
    const bob = animate ? Math.sin(t * 0.9) * 0.22 : 0;
    const sway = animate ? Math.sin(t * 0.55) * 0.035 : 0;
    const wob = Math.sin(t * 22) * 0.05 * state.wob;

    holder.rotation.x = base.rx + (animate ? state.py * 0.25 : 0) + state.intro * 0.4;
    holder.rotation.y = base.ry + scrollTurn + (animate ? state.px * 0.45 : 0) - state.intro * 1.9 + state.away * 1.4 + wob;
    holder.rotation.z = base.rz + sway + state.intro * 0.25;
    holder.position.x = base.x + state.away * 16;
    holder.position.y = base.y + bob - state.intro * 3;
    const s = 1 - state.intro * 0.12;
    holder.scale.set(s, s, s);

    renderer.render(scene, camera);
  }
  resize();
  raf = requestAnimationFrame(frame);

  return {
    isWebGL: true,
    press, powerOn, setAway,
    dispose() {
      running = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onMove); window.removeEventListener('click', onClick);
      window.removeEventListener('resize', measureScroll); window.removeEventListener('scroll', onScroll);
      renderer.dispose(); renderer.domElement.remove();
    }
  };
}
