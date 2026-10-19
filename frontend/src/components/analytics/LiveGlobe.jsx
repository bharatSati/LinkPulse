import { useEffect, useRef } from 'react';
import { countryCentroid, countryCode } from '../../utils/geo.js';

const DEG = Math.PI / 180;
const TWO_PI = Math.PI * 2;
const PULSE_LIFETIME = 4200;
const HOTSPOT_LIFETIME = 90000;

const DEVICE_COLORS = {
  desktop: '#cdf23f',
  mobile: '#ffd21f',
  tablet: '#f2ffb8',
  unknown: '#9dac78',
};

function rotate([x, y, z], ax, ay) {
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

function dotColor(alpha) {
  return `rgba(205, 242, 63, ${alpha.toFixed(3)})`;
}

export default function LiveGlobe({ clicks = [], className = '' }) {
  const canvasRef = useRef(null);
  const pulsesRef = useRef([]);
  const seenRef = useRef(new Set());
  const hotspotsRef = useRef(new Map());

  useEffect(() => {
    const now = performance.now();

    for (const click of clicks) {
      if (!click?.id || seenRef.current.has(click.id)) continue;
      seenRef.current.add(click.id);

      const center = countryCentroid(click.country);
      if (!center) continue;

      const [lat, lon] = center;
      const color = DEVICE_COLORS[click.deviceType] || DEVICE_COLORS.unknown;
      const code = countryCode(click.country);
      const timestamp = new Date(click.timestamp).getTime();
      const isFresh = Number.isFinite(timestamp) && now - timestamp < 15000;

      if (isFresh) {
        pulsesRef.current.push({
          id: click.id,
          lat,
          lon,
          color,
          code,
          born: now,
        });
      }

      if (code) {
        hotspotsRef.current.set(code, { lat, lon, color, seen: now });
      }
    }

    if (pulsesRef.current.length > 30) {
      pulsesRef.current.splice(0, pulsesRef.current.length - 30);
    }

    if (seenRef.current.size > 400) {
      seenRef.current = new Set([...seenRef.current].slice(-200));
    }

    for (const [code, entry] of hotspotsRef.current) {
      if (now - entry.seen > HOTSPOT_LIFETIME) hotspotsRef.current.delete(code);
    }
  }, [clicks]);

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
    let last = performance.now();
    let spin = 0.55;
    const tilt = { x: -0.3, y: 0 };
    const pointer = { x: 0, y: 0 };

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeProjector(angleX, angleY) {
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width * 0.38, height * 0.42);

      return function project(lat, lon) {
        const phi = lat * DEG;
        const lambda = lon * DEG;
        const x = Math.cos(phi) * Math.sin(lambda);
        const y = Math.sin(phi);
        const z = Math.cos(phi) * Math.cos(lambda);
        const [rx, ry, rz] = rotate([x, y, z], angleX, angleY);
        const perspective = 3.1 / (3.1 - rz);

        return {
          x: cx + rx * radius * perspective,
          y: cy - ry * radius * perspective,
          z: rz,
          radius,
          depth: Math.max(0, Math.min(1, (rz + 1) / 2)),
        };
      };
    }

    function drawSurface(project) {
      for (let lat = -80; lat <= 80; lat += 8) {
        for (let lon = -180; lon < 180; lon += 8) {
          const point = project(lat, lon);

          if (point.z <= 0.01) {
            ctx.fillStyle = dotColor(0.018);
            ctx.fillRect(point.x, point.y, 1, 1);
            continue;
          }

          const alpha = 0.05 + point.depth * 0.2;
          const size = point.z > 0.72 ? 1.6 : 1;
          ctx.fillStyle = dotColor(alpha);
          ctx.fillRect(point.x, point.y, size, size);
        }
      }
    }

    function drawGraticule(project) {
      ctx.lineWidth = 1;

      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let started = false;

        for (let lon = -180; lon <= 180; lon += 6) {
          const point = project(lat, lon);
          if (point.z <= 0.02) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(point.x, point.y);
            started = true;
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }

        ctx.strokeStyle = 'rgba(205, 242, 63, 0.16)';
        ctx.stroke();
      }

      for (let lon = -150; lon < 180; lon += 30) {
        ctx.beginPath();
        let started = false;

        for (let lat = -90; lat <= 90; lat += 6) {
          const point = project(lat, lon);
          if (point.z <= 0.02) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(point.x, point.y);
            started = true;
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }

        ctx.strokeStyle = 'rgba(205, 242, 63, 0.12)';
        ctx.stroke();
      }
    }

    function drawHotspots(project, now) {
      let labels = 0;

      for (const [code, entry] of hotspotsRef.current) {
        if (now - entry.seen > HOTSPOT_LIFETIME) continue;

        const point = project(entry.lat, entry.lon);
        if (point.z <= 0.04) continue;

        const alpha = 0.35 + point.depth * 0.55;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = entry.color;
        ctx.shadowColor = entry.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(point.x - 1.5, point.y - 1.5, 3, 3);
        ctx.shadowBlur = 0;

        if (labels < 5 && point.z > 0.35) {
          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.fillStyle = 'rgba(244, 252, 224, 0.72)';
          ctx.fillText(code, point.x + 6, point.y - 6);
          labels += 1;
        }

        ctx.globalAlpha = 1;
      }
    }

    function drawPulses(project, now, cx, cy) {
      const pulses = pulsesRef.current;

      for (let index = pulses.length - 1; index >= 0; index -= 1) {
        const pulse = pulses[index];
        const age = now - pulse.born;

        if (age > PULSE_LIFETIME) {
          pulses.splice(index, 1);
          continue;
        }

        const point = project(pulse.lat, pulse.lon);
        if (point.z <= 0.02) continue;

        const progress = age / PULSE_LIFETIME;
        const alpha = 1 - progress;

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = pulse.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3 + progress * 26, 0, TWO_PI);
        ctx.stroke();

        const dx = point.x - cx;
        const dy = point.y - cy;
        const length = Math.hypot(dx, dy) || 1;
        const beam = 8 + progress * 22;

        ctx.strokeStyle = pulse.color;
        ctx.globalAlpha = alpha * 0.55;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(point.x + (dx / length) * beam, point.y + (dy / length) * beam);
        ctx.stroke();

        ctx.globalAlpha = alpha;
        ctx.fillStyle = pulse.color;
        ctx.shadowColor = pulse.color;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2.4, 0, TWO_PI);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (pulse.code && progress < 0.7) {
          ctx.globalAlpha = alpha * 0.9;
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillStyle = '#f4fce0';
          ctx.fillText(pulse.code, point.x + 9, point.y - 9);
        }

        ctx.globalAlpha = 1;
      }
    }

    function frame(now) {
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;

      if (!reduceMotion) spin += dt * 0.18;

      pointer.x += (tilt.y - pointer.x) * 0.06;
      pointer.y += (tilt.x - pointer.y) * 0.06;

      const angleY = spin + pointer.x * 0.55;
      const angleX = -0.3 + pointer.y * 0.45;
      const project = makeProjector(angleX, angleY);
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width * 0.38, height * 0.42);

      ctx.clearRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.25);
      glow.addColorStop(0, 'rgba(205, 242, 63, 0.12)');
      glow.addColorStop(0.55, 'rgba(205, 242, 63, 0.04)');
      glow.addColorStop(1, 'rgba(205, 242, 63, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.25, 0, TWO_PI);
      ctx.fill();

      ctx.strokeStyle = 'rgba(205, 242, 63, 0.34)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, TWO_PI);
      ctx.stroke();

      drawSurface(project);
      drawGraticule(project);
      drawHotspots(project, now);
      drawPulses(project, now, cx, cy);

      raf = window.requestAnimationFrame(frame);
    }

    function onPointerMove(event) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      tilt.y = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      tilt.x = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    }

    function onPointerLeave() {
      tilt.x = 0;
      tilt.y = 0;
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <div className={`relative h-[280px] w-full sm:h-[340px] lg:h-[380px] ${className}`}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(205,242,63,0.08), transparent 65%)',
        }}
        aria-hidden="true"
      />
      <canvas ref={canvasRef} className="relative block h-full w-full" aria-hidden="true" />
    </div>
  );
}
