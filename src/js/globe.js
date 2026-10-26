// Canvas 2D globe: land dots, routes out of Saudi Arabia, HTML labels on top.
import landDots from '../data/land-dots.json';

const RAD = Math.PI / 180;
const HUB = [24.7136, 46.6753];
const PLACES = {
  gcc: [25.2048, 55.2708],
  eg: [30.0444, 31.2357],
  jo: [31.9454, 35.9284],
  eu: [50.1109, 8.6821],
};

const toVec = ([lat, lng]) => [Math.cos(lat * RAD) * Math.sin(lng * RAD), Math.sin(lat * RAD), Math.cos(lat * RAD) * Math.cos(lng * RAD)];

function slerp(a, b, t) {
  const dot = Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]);
  const omega = Math.acos(dot);
  if (omega < 1e-6) return a;
  const s = Math.sin(omega);
  const k1 = Math.sin((1 - t) * omega) / s;
  const k2 = Math.sin(t * omega) / s;
  return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
}

export function mountGlobe(el, { reduceMotion }) {
  const canvas = el.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const labels = new Map([...el.querySelectorAll('[data-place]')].map((l) => [l.dataset.place, l]));

  const dots = [];
  for (let i = 0; i < landDots.length; i += 2) dots.push(toVec([landDots[i] / 10, landDots[i + 1] / 10]));

  const hub = toVec(HUB);
  const routes = Object.entries(PLACES).map(([id, place]) => {
    const target = toVec(place);
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      const p = slerp(hub, target, t);
      const lift = 1 + 0.16 * Math.sin(Math.PI * t);
      pts.push([p[0] * lift, p[1] * lift, p[2] * lift]);
    }
    return { id, target, pts };
  });
  const markers = [{ id: 'sa', v: hub, hub: true }, ...routes.map((r) => ({ id: r.id, v: r.target }))];

  let size = 0;
  let dpr = 1;
  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    size = canvas.clientWidth;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
  };
  resize();
  window.addEventListener('resize', () => {
    resize();
    if (!running || reduceMotion) draw(performance.now());
  });

  const baseYaw = -HUB[1] * RAD;
  const tilt = 30 * RAD;
  let drag = 0;
  let dragTarget = 0;
  let t = 0;
  const born = performance.now();
  let running = false;
  let raf = 0;

  // rotate: yaw about the vertical axis, then tilt about the horizontal axis
  const project = (v, cosY, sinY, cosT, sinT) => {
    const x = v[0] * cosY + v[2] * sinY;
    const z0 = -v[0] * sinY + v[2] * cosY;
    const y = v[1] * cosT - z0 * sinT;
    const z = v[1] * sinT + z0 * cosT;
    return [x, y, z];
  };

  const draw = (now) => {
    const w = size * dpr;
    const R = w * 0.4;
    const cx = w / 2;
    const cy = w / 2;
    if (!reduceMotion) t += 0.0035;
    drag += (dragTarget - drag) * 0.08;
    const yaw = baseYaw + Math.sin(t) * 0.35 + drag;
    const cY = Math.cos(yaw);
    const sY = Math.sin(yaw);
    const cT = Math.cos(tilt);
    const sT = Math.sin(tilt);

    ctx.clearRect(0, 0, w, w);

    // atmosphere + sphere
    const glow = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.25);
    glow.addColorStop(0, 'rgba(0,196,214,0.28)');
    glow.addColorStop(1, 'rgba(0,196,214,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, w);
    const body = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    body.addColorStop(0, '#14314d');
    body.addColorStop(1, '#07121d');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,196,214,0.45)';
    ctx.lineWidth = 1.2 * dpr;
    ctx.stroke();

    // land dots
    const d = 1.7 * dpr;
    for (const v of dots) {
      const [x, y, z] = project(v, cY, sY, cT, sT);
      if (z <= 0) continue;
      ctx.globalAlpha = 0.18 + z * 0.7;
      ctx.fillStyle = '#9fd9e4';
      ctx.fillRect(cx + x * R - d / 2, cy - y * R - d / 2, d, d);
    }
    ctx.globalAlpha = 1;

    // routes draw in, then a dot travels along each one
    const age = reduceMotion ? 10 : (now - born) / 1000;
    routes.forEach((route, i) => {
      const progress = Math.min(1, Math.max(0, (age - i * 0.25) / 1.4));
      const n = Math.max(2, Math.round(progress * route.pts.length));
      ctx.beginPath();
      for (let k = 0; k < n; k++) {
        const [x, y] = project(route.pts[k], cY, sY, cT, sT);
        const px = cx + x * R;
        const py = cy - y * R;
        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.strokeStyle = '#00c4d6';
      ctx.lineWidth = 2 * dpr;
      ctx.lineCap = 'round';
      ctx.stroke();

      if (progress === 1 && !reduceMotion) {
        const k = Math.floor(((age * 0.5 + i * 0.3) % 1) * (route.pts.length - 1));
        const [x, y] = project(route.pts[k], cY, sY, cT, sT);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + x * R, cy - y * R, 2.6 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // markers + labels
    for (const m of markers) {
      const [x, y, z] = project(m.v, cY, sY, cT, sT);
      const px = cx + x * R;
      const py = cy - y * R;
      if (z > 0) {
        if (m.hub) {
          const pulse = reduceMotion ? 0 : (age % 2) / 2;
          ctx.strokeStyle = `rgba(0,196,214,${0.6 * (1 - pulse)})`;
          ctx.lineWidth = 1.5 * dpr;
          ctx.beginPath();
          ctx.arc(px, py, (8 + pulse * 18) * dpr, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = m.hub ? '#ffffff' : '#00c4d6';
        ctx.beginPath();
        ctx.arc(px, py, (m.hub ? 6 : 4.5) * dpr, 0, Math.PI * 2);
        ctx.fill();
        if (m.hub) {
          ctx.strokeStyle = '#00c4d6';
          ctx.lineWidth = 3 * dpr;
          ctx.stroke();
        }
      }
      const label = labels.get(m.id);
      if (label) {
        label.style.transform = `translate(${px / dpr}px, ${py / dpr}px)`;
        label.style.opacity = z > 0.05 ? '1' : '0';
      }
    }

    if (running && !reduceMotion) raf = requestAnimationFrame(draw);
  };

  const start = () => {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(draw);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(el);
  draw(born);
  canvas.classList.add('is-ready');

  // drag to spin
  let pointerX = null;
  canvas.addEventListener('pointerdown', (e) => {
    pointerX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (pointerX === null) return;
    dragTarget += (e.clientX - pointerX) / 160;
    pointerX = e.clientX;
    if (reduceMotion) requestAnimationFrame(draw);
  });
  const release = () => (pointerX = null);
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
}
