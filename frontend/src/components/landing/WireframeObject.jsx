import { useEffect, useRef } from 'react';

const TWO_PI = Math.PI * 2;

const FIT_RADIUS = 1.36;

const LIME = [205, 242, 63];
const CITRUS = [255, 210, 31];
const NODE = [242, 255, 184];
const ORBIT = [224, 249, 110];

function rotate(point, ax, ay) {
  const [x, y, z] = point;
  const cosY = Math.cos(ay);
  const sinY = Math.sin(ay);
  const x1 = x * cosY - z * sinY;
  const z1 = x * sinY + z * cosY;
  const cosX = Math.cos(ax);
  const sinX = Math.sin(ax);
  const y1 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;
  return [x1, y1, z2];
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function normalize(v) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

function slerp(a, b, t) {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  dot = Math.max(-1, Math.min(1, dot));
  const omega = Math.acos(dot);
  if (omega < 1e-4) return [a[0], a[1], a[2]];
  const sinOmega = Math.sin(omega);
  const w1 = Math.sin((1 - t) * omega) / sinOmega;
  const w2 = Math.sin(t * omega) / sinOmega;
  return [a[0] * w1 + b[0] * w2, a[1] * w1 + b[1] * w2, a[2] * w1 + b[2] * w2];
}

function latRing(latDeg, segments) {
  const lat = (latDeg * Math.PI) / 180;
  const r = Math.cos(lat);
  const y = Math.sin(lat);
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * TWO_PI;
    points.push([r * Math.cos(t), y, r * Math.sin(t)]);
  }
  return points;
}

function lonRing(lonDeg, segments) {
  const lon = (lonDeg * Math.PI) / 180;
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * TWO_PI;
    points.push([Math.cos(t) * Math.cos(lon), Math.sin(t), Math.cos(t) * Math.sin(lon)]);
  }
  return points;
}

function orbitRing(radius, tiltDeg, segments) {
  const tilt = (tiltDeg * Math.PI) / 180;
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * TWO_PI;
    const x = radius * Math.cos(t);
    const z = radius * Math.sin(t);
    points.push([x, z * Math.sin(tilt), z * Math.cos(tilt)]);
  }
  return points;
}

function buildArc(a, b, bulge, segments = 40) {
  const A = normalize(a);
  const B = normalize(b);
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const v = slerp(A, B, t);
    const r = 1 + bulge * Math.sin(Math.PI * t);
    points.push([v[0] * r, v[1] * r, v[2] * r]);
  }
  return points;
}

const LATITUDES = [-60, -30, 0, 30, 60];
const LONGITUDES = [0, 30, 60, 90, 120, 150];

const ARC_NODES = [
  [0.9, 0.3, 0.2],
  [-0.5, 0.6, 0.65],
  [0.25, -0.7, 0.7],
  [-0.85, -0.15, -0.5],
  [0.6, 0.5, -0.62],
  [0.1, 0.85, -0.5],
  [-0.6, 0.1, 0.8],
];

const ARC_PAIRS = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 0],
  [3, 6],
  [1, 4],
];

export default function WireframeObject({ className }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let angleY = 0.4;
    let angleX = -0.35;
    let clock = 0;
    const target = { x: 0, y: 0 };
    const pointer = { x: 0, y: 0 };
    let last = performance.now();

    const sphereLat = LATITUDES.map((lat) => latRing(lat, 60));
    const sphereLon = LONGITUDES.map((lon) => lonRing(lon, 48));
    const orbits = [
      { ring: orbitRing(1.3, 76, 96), dash: false, alpha: 0.55 },
      { ring: orbitRing(1.12, 20, 96), dash: true, alpha: 0.32 },
    ];
    const arcs = ARC_PAIRS.map(([i, j], index) => ({
      points: buildArc(ARC_NODES[i], ARC_NODES[j], 0.28),
      speed: 0.18 + (index % 3) * 0.06,
      offset: index * 0.37,
    }));
    const nodes = ARC_NODES.concat([
      [0.35, 0.2, 0.92],
      [-0.2, -0.9, 0.35],
    ]).map(normalize);

    const particles = Array.from({ length: 46 }, (_, index) => {
      const y = 1 - (index / 45) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = index * 2.399963;
      const dist = 1.02 + ((index * 37) % 26) / 100;
      return [Math.cos(theta) * radius * dist, y * dist, Math.sin(theta) * radius * dist];
    });

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function project(point, scale, cx, cy) {
      const [x, y, z] = rotate(point, angleX, angleY);
      const perspective = 3.4 / (3.4 - z);
      const depth = Math.max(0, Math.min(1, (z + 1.2) / 2.4));
      return { x: cx + x * scale * perspective, y: cy + y * scale * perspective, depth };
    }

    function drawPolyline(points, scale, cx, cy, back, front, alphaScale, dashed) {
      let prev = null;
      for (let i = 0; i < points.length; i += 1) {
        if (dashed && i % 2 === 1) {
          prev = null;
          continue;
        }
        const p = project(points[i], scale, cx, cy);
        if (prev) {
          const c = mix(back, front, prev.depth);
          const alpha = Math.max(0.05, prev.depth) * alphaScale;
          ctx.strokeStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha.toFixed(3)})`;
          ctx.lineWidth = prev.depth > 0.62 ? 1.6 : 1;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
        prev = p;
      }
    }

    function drawCore(scale, cx, cy) {
      const radius = scale * 1.25;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, 'rgba(205, 242, 63, 0.22)');
      gradient.addColorStop(0.45, 'rgba(255, 210, 31, 0.08)');
      gradient.addColorStop(1, 'rgba(205, 242, 63, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, TWO_PI);
      ctx.fill();
    }

    function drawParticles(scale, cx, cy) {
      particles.forEach((particle, index) => {
        const drift = reduceMotion ? 0 : clock * 0.05;
        const p = rotate(particle, angleX + drift * 0.3, angleY + drift + index * 0.02);
        const perspective = 3.4 / (3.4 - p[2]);
        const sx = cx + p[0] * scale * perspective;
        const sy = cy + p[1] * scale * perspective;
        const depth = Math.max(0, Math.min(1, (p[2] + 1.8) / 3.6));
        ctx.fillStyle = `rgba(224, 249, 110, ${(depth * 0.5).toFixed(3)})`;
        ctx.fillRect(sx, sy, depth > 0.6 ? 2 : 1, depth > 0.6 ? 2 : 1);
      });
    }

    function drawArcs(scale, cx, cy) {
      arcs.forEach((arc) => {
        drawPolyline(arc.points, scale, cx, cy, CITRUS, LIME, 0.6, false);

        if (!reduceMotion) {
          const cycle = ((clock * arc.speed + arc.offset) % 1 + 1) % 1;
          const index = cycle * (arc.points.length - 1);
          const lo = Math.max(0, Math.min(arc.points.length - 1, Math.floor(index)));
          const hi = Math.min(lo + 1, arc.points.length - 1);
          const f = index - lo;
          const world = [
            arc.points[lo][0] + (arc.points[hi][0] - arc.points[lo][0]) * f,
            arc.points[lo][1] + (arc.points[hi][1] - arc.points[lo][1]) * f,
            arc.points[lo][2] + (arc.points[hi][2] - arc.points[lo][2]) * f,
          ];
          const p = project(world, scale, cx, cy);
          ctx.beginPath();
          ctx.fillStyle = 'rgba(242, 255, 184, 0.95)';
          ctx.shadowColor = 'rgba(255, 210, 31, 0.9)';
          ctx.shadowBlur = 12;
          ctx.arc(p.x, p.y, 2.6, 0, TWO_PI);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
    }

    function drawNodes(scale, cx, cy) {
      nodes.forEach((node) => {
        const p = project(node, scale, cx, cy);
        const radius = 2.2 + p.depth * 2;
        ctx.beginPath();
        ctx.fillStyle = `rgba(242, 255, 184, ${(0.25 + p.depth * 0.75).toFixed(3)})`;
        ctx.shadowColor = 'rgba(205, 242, 63, 0.9)';
        ctx.shadowBlur = 14 * p.depth;
        ctx.arc(p.x, p.y, radius, 0, TWO_PI);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    }

    function frame(now) {
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;
      if (!reduceMotion) clock += dt;

      pointer.x += (target.x - pointer.x) * 0.06;
      pointer.y += (target.y - pointer.y) * 0.06;

      if (!reduceMotion) angleY += dt * 0.32;
      angleX = -0.35 + pointer.y * 0.5;
      const tiltY = angleY + pointer.x * 0.6;

      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const scale = ((Math.min(width, height) * 0.5) / FIT_RADIUS) * 0.98;

      const saveAngleY = angleY;
      angleY = tiltY;

      drawCore(scale, cx, cy);
      drawParticles(scale, cx, cy);

      sphereLat.forEach((ring) => drawPolyline(ring, scale, cx, cy, LIME, CITRUS, 0.45, false));
      sphereLon.forEach((ring) => drawPolyline(ring, scale, cx, cy, LIME, CITRUS, 0.28, false));

      orbits.forEach((orbit) =>
        drawPolyline(orbit.ring, scale, cx, cy, ORBIT, ORBIT, orbit.alpha, orbit.dash)
      );

      try {
        drawArcs(scale, cx, cy);
        drawNodes(scale, cx, cy);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('GLOBE_DEBUG', err && err.stack ? err.stack : err);
        throw err;
      }

      angleY = saveAngleY;

      raf = window.requestAnimationFrame(frame);
    }

    function onPointer(event) {
      const rect = canvas.getBoundingClientRect();
      const rawX = (event.clientX - rect.left) / rect.width - 0.5;
      const rawY = (event.clientY - rect.top) / rect.height - 0.5;
      target.x = Math.max(-0.5, Math.min(0.5, rawX)) * 2;
      target.y = Math.max(-0.5, Math.min(0.5, rawY)) * 2;
    }

    function onLeave() {
      target.x = 0;
      target.y = 0;
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener('pointermove', onPointer);
    canvas.addEventListener('pointerleave', onLeave);
    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
