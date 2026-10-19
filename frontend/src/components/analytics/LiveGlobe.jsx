import { useEffect, useRef, useState } from 'react';
import { feature } from 'topojson-client';
import worldData from 'world-atlas/countries-110m.json';
import indiaBoundary from '../../assets/india-boundary.json';
import { Maximize2, Minus, Pause, Play, Plus } from 'lucide-react';
import { alpha2ForCountryName, countryCentroid, countryCode } from '../../utils/geo.js';

const DEG = Math.PI / 180;
const TWO_PI = Math.PI * 2;
const PULSE_LIFETIME = 4200;

const DEFAULT_VIEW = { spin: 0.55, tiltX: -0.32, zoom: 1 };

const DEVICE_COLORS = {
  desktop: '#c1ff2e',
  mobile: '#22e6d0',
  tablet: '#eaffab',
  unknown: '#7d9391',
};

function lonLatToVec(lon, lat) {
  const phi = lat * DEG;
  const lambda = lon * DEG;
  const cosPhi = Math.cos(phi);
  return [cosPhi * Math.sin(lambda), Math.sin(phi), cosPhi * Math.cos(lambda)];
}

function lonLatRingsToVectors(rings) {
  return rings.map((ring) => ring.map(([lon, lat]) => lonLatToVec(lon, lat)));
}

const BOUNDARY_OVERRIDES = {
  IN: indiaBoundary.IN,
  PK: indiaBoundary.PK,
  CN: indiaBoundary.CN,
};

function buildCountries() {
  const collection = feature(worldData, worldData.objects.countries);
  const countries = [];

  for (const item of collection.features) {
    const properties = item.properties || {};
    const code = alpha2ForCountryName(properties.name);
    const geometry = item.geometry;
    if (!geometry) continue;

    const polygons =
      geometry.type === 'Polygon'
        ? [geometry.coordinates]
        : geometry.type === 'MultiPolygon'
          ? geometry.coordinates
          : [];

    const rings = [];
    for (const polygon of polygons) {
      for (const ring of polygon) {
        if (!Array.isArray(ring) || ring.length < 4) continue;
        const vectors = new Array(ring.length);
        for (let i = 0; i < ring.length; i += 1) {
          vectors[i] = lonLatToVec(ring[i][0], ring[i][1]);
        }
        rings.push(vectors);
      }
    }

    if (rings.length > 0) {
      countries.push({
        code,
        name: properties.name || code || 'Unknown',
        rings,
        screenRings: rings.map(() => []),
      });
    }
  }

  for (const country of countries) {
    const override = country.code ? BOUNDARY_OVERRIDES[country.code] : null;
    if (!override) continue;
    country.rings = lonLatRingsToVectors(override);
    country.screenRings = country.rings.map(() => []);
  }

  const indiaIndex = countries.findIndex((country) => country.code === 'IN');
  if (indiaIndex >= 0) {
    countries.push(countries.splice(indiaIndex, 1)[0]);
  }

  return countries;
}

const COUNTRIES = buildCountries();

const GRATICULE_LAT = [];
for (let lat = -60; lat <= 60; lat += 30) {
  const line = [];
  for (let lon = -180; lon <= 180; lon += 6) line.push(lonLatToVec(lon, lat));
  GRATICULE_LAT.push(line);
}

const GRATICULE_LON = [];
for (let lon = -150; lon < 180; lon += 30) {
  const line = [];
  for (let lat = -90; lat <= 90; lat += 6) line.push(lonLatToVec(lon, lat));
  GRATICULE_LON.push(line);
}

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function mixHex(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const r = Math.round(ca.r + (cb.r - ca.r) * t);
  const g = Math.round(ca.g + (cb.g - ca.g) * t);
  const bl = Math.round(ca.b + (cb.b - ca.b) * t);
  return `${r}, ${g}, ${bl}`;
}

function heatColor(t) {
  if (t <= 0) return '193, 255, 46';
  if (t < 0.5) return mixHex('#c1ff2e', '#22e6d0', t / 0.5);
  return mixHex('#22e6d0', '#ff5c85', (t - 0.5) / 0.5);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pointInFlat(x, y, flat) {
  let inside = false;
  const count = flat.length / 2;

  for (let i = 0, j = count - 1; i < count; j = i, i += 1) {
    const xi = flat[i * 2];
    const yi = flat[i * 2 + 1];
    const xj = flat[j * 2];
    const yj = flat[j * 2 + 1];

    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

export default function LiveGlobe({
  clicks = [],
  countryCounts = {},
  selectedCountry = null,
  onSelectCountry,
  className = '',
}) {
  const canvasRef = useRef(null);
  const tooltipRef = useRef(null);
  const pulsesRef = useRef([]);
  const seenRef = useRef(new Set());
  const countsRef = useRef({});
  const maxCountRef = useRef(1);
  const selectedRef = useRef(null);
  const selectHandlerRef = useRef(onSelectCountry);
  const hoverRef = useRef(null);
  const viewRef = useRef({ ...DEFAULT_VIEW, spinVelocity: 0, dragging: false });

  const [hover, setHover] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [spinEnabled, setSpinEnabled] = useState(true);
  const spinEnabledRef = useRef(true);

  useEffect(() => {
    countsRef.current = countryCounts || {};
    const values = Object.values(countsRef.current);
    maxCountRef.current = values.length ? Math.max(1, ...values) : 1;
  }, [countryCounts]);

  useEffect(() => {
    selectedRef.current = selectedCountry ? countryCode(selectedCountry) : null;
  }, [selectedCountry]);

  useEffect(() => {
    selectHandlerRef.current = onSelectCountry;
  }, [onSelectCountry]);

  useEffect(() => {
    const now = performance.now();

    for (const click of clicks) {
      if (!click?.id || seenRef.current.has(click.id)) continue;
      seenRef.current.add(click.id);

      const center = countryCentroid(click.country);
      if (!center) continue;

      const timestamp = new Date(click.timestamp).getTime();
      const isFresh = Number.isFinite(timestamp) && now - timestamp < 15000;
      if (!isFresh) continue;

      pulsesRef.current.push({
        id: click.id,
        lat: center[0],
        lon: center[1],
        color: DEVICE_COLORS[click.deviceType] || DEVICE_COLORS.unknown,
        code: countryCode(click.country),
        born: now,
      });
    }

    if (pulsesRef.current.length > 30) {
      pulsesRef.current.splice(0, pulsesRef.current.length - 30);
    }

    if (seenRef.current.size > 400) {
      seenRef.current = new Set([...seenRef.current].slice(-200));
    }
  }, [clicks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const view = viewRef.current;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let last = performance.now();
    let hoverCode = null;
    let hoverCount = -1;
    let hoverDirty = true;
    let hitPaths = [];

    const pointer = { x: 0, y: 0, inside: false };

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeProjector(angleX, angleY, radius) {
      const cx = width / 2;
      const cy = height / 2;
      const sinX = Math.sin(angleX);
      const cosX = Math.cos(angleX);
      const sinY = Math.sin(angleY);
      const cosY = Math.cos(angleY);
      const out = { x: 0, y: 0, z: 0 };

      return function project(vec) {
        const [vx, vy, vz] = vec;
        const x1 = vx * cosY - vz * sinY;
        const z1 = vx * sinY + vz * cosY;
        const y1 = vy * cosX - z1 * sinX;
        const z2 = vy * sinX + z1 * cosX;
        const perspective = 3.2 / (3.2 - z2);

        out.x = cx + x1 * radius * perspective;
        out.y = cy - y1 * radius * perspective;
        out.z = z2;
        return out;
      };
    }

    function frame(now) {
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;

      if (!view.dragging) {
        if (spinEnabledRef.current && !reduceMotion) view.spin += dt * 0.12;
        view.spin += view.spinVelocity;
        view.spinVelocity *= 0.94;
      } else {
        view.spinVelocity *= 0.6;
      }

      const angleY = view.spin;
      const angleX = view.tiltX;
      const baseRadius = Math.min(width * 0.38, height * 0.42);
      const radius = baseRadius * view.zoom;
      const cx = width / 2;
      const cy = height / 2;
      const project = makeProjector(angleX, angleY, radius);

      ctx.clearRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius * 1.34);
      glow.addColorStop(0, 'rgba(34, 230, 208, 0.12)');
      glow.addColorStop(0.55, 'rgba(193, 255, 46, 0.04)');
      glow.addColorStop(1, 'rgba(34, 230, 208, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.34, 0, TWO_PI);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, TWO_PI);
      const ocean = ctx.createRadialGradient(cx, cy, radius * 0.05, cx, cy, radius);
      ocean.addColorStop(0, 'rgba(20, 29, 36, 0.92)');
      ocean.addColorStop(0.5, 'rgba(11, 18, 23, 0.96)');
      ocean.addColorStop(1, 'rgba(4, 7, 10, 1)');
      ctx.fillStyle = ocean;
      ctx.fill();
      ctx.clip();

      drawGraticule(project);
      drawCountries(project, cx, cy);

      ctx.restore();

      ctx.strokeStyle = 'rgba(193, 255, 46, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, TWO_PI);
      ctx.stroke();

      drawOrbits(cx, cy, radius, angleY, reduceMotion);
      drawPulses(project, now, cx, cy);

      updateHover();

      raf = window.requestAnimationFrame(frame);
    }

    function drawGraticule(project) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(193, 255, 46, 0.13)';

      for (const line of GRATICULE_LAT) {
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < line.length; i += 1) {
          const point = project(line[i]);
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
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(34, 230, 208, 0.1)';

      for (const line of GRATICULE_LON) {
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < line.length; i += 1) {
          const point = project(line[i]);
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
        ctx.stroke();
      }
    }

    function drawCountries(project) {
      hitPaths = [];
      const max = maxCountRef.current;

      for (const country of COUNTRIES) {
        ctx.beginPath();
        let visible = false;

        for (let r = 0; r < country.rings.length; r += 1) {
          const ring = country.rings[r];
          const screen = country.screenRings[r];
          screen.length = 0;
          let started = false;

          for (let i = 0; i < ring.length; i += 1) {
            const point = project(ring[i]);
            if (point.z <= 0) {
              started = false;
              continue;
            }
            if (!started) {
              ctx.moveTo(point.x, point.y);
              started = true;
            } else {
              ctx.lineTo(point.x, point.y);
            }
            screen.push(point.x, point.y);
            visible = true;
          }
        }

        if (!visible) continue;

        const code = country.code;
        const count = code ? countsRef.current[code] || 0 : 0;
        const intensity = count > 0 ? 0.35 + 0.65 * (count / max) : 0;
        const isSelected = Boolean(code && selectedRef.current === code);
        const isHovered = Boolean(code && hoverCode === code);
        const active = isSelected || isHovered;

        if (intensity > 0 || active) {
          const rgb = heatColor(intensity);
          const alpha = active ? 0.42 : 0.1 + intensity * 0.32;
          ctx.fillStyle = `rgba(${rgb}, ${alpha.toFixed(3)})`;
          ctx.fill('evenodd');
        }

        if (active) {
          ctx.shadowColor = 'rgba(193, 255, 46, 0.85)';
          ctx.shadowBlur = 12;
        }

        ctx.strokeStyle = isSelected
          ? '#eaffab'
          : isHovered
            ? '#d4ff5e'
            : intensity > 0
              ? `rgba(${heatColor(intensity)}, 0.85)`
              : 'rgba(193, 255, 46, 0.28)';
        ctx.lineWidth = isSelected ? 1.5 : isHovered ? 1.2 : 0.7;
        ctx.stroke();
        ctx.shadowBlur = 0;

        hitPaths.push(country);
      }
    }

    function drawOrbits(cx, cy, radius, angleY, still) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(still ? 0.4 : angleY * 0.5);
      ctx.setLineDash([4, 12]);
      ctx.strokeStyle = 'rgba(34, 230, 208, 0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.12, 0, TWO_PI);
      ctx.stroke();
      ctx.setLineDash([]);

      for (let i = 0; i < 3; i += 1) {
        const angle = still ? i * 2.1 : angleY * 0.5 + i * 2.1;
        const x = Math.cos(angle) * radius * 1.12;
        const y = Math.sin(angle) * radius * 1.12;
        ctx.fillStyle = i === 0 ? '#c1ff2e' : 'rgba(34, 230, 208, 0.8)';
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      }

      ctx.restore();
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

        const point = project(lonLatToVec(pulse.lon, pulse.lat));
        if (point.z <= 0.02) continue;

        const progress = age / PULSE_LIFETIME;
        const alpha = 1 - progress;

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = pulse.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3 + progress * 30, 0, TWO_PI);
        ctx.stroke();

        const dx = point.x - cx;
        const dy = point.y - cy;
        const length = Math.hypot(dx, dy) || 1;
        const beam = 10 + progress * 26;

        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(point.x + (dx / length) * beam, point.y + (dy / length) * beam);
        ctx.stroke();

        ctx.globalAlpha = alpha;
        ctx.fillStyle = pulse.color;
        ctx.shadowColor = pulse.color;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2.6, 0, TWO_PI);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (pulse.code && progress < 0.7) {
          ctx.globalAlpha = alpha * 0.9;
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillStyle = '#eef6f5';
          ctx.fillText(pulse.code, point.x + 9, point.y - 9);
        }

        ctx.globalAlpha = 1;
      }
    }

    function hitTest(x, y) {
      for (let i = hitPaths.length - 1; i >= 0; i -= 1) {
        const country = hitPaths[i];
        for (const ring of country.screenRings) {
          if (ring.length >= 6 && pointInFlat(x, y, ring)) {
            return country;
          }
        }
      }
      return null;
    }

    function updateHover() {
      let found = hoverRef.current;

      if (hoverDirty) {
        hoverDirty = false;
        found = pointer.inside && !view.dragging ? hitTest(pointer.x, pointer.y) : null;
        hoverRef.current = found;
      }

      const key = found ? found.code || found.name : null;

      if (key !== hoverCode) {
        hoverCode = key;

        if (found) {
          const count = found.code ? countsRef.current[found.code] || 0 : 0;
          hoverCount = count;
          setHover({ code: found.code, name: found.name, count });
        } else {
          hoverCount = -1;
          setHover(null);
        }
      } else if (found) {
        const count = found.code ? countsRef.current[found.code] || 0 : 0;
        if (count !== hoverCount) {
          hoverCount = count;
          setHover({ code: found.code, name: found.name, count });
        }
      }

      canvas.style.cursor = view.dragging ? 'grabbing' : found ? 'pointer' : 'grab';

      if (found && tooltipRef.current) {
        tooltipRef.current.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -130%)`;
      }
    }

    function onPointerDown(event) {
      view.dragging = true;
      view.downAt = performance.now();
      view.moved = 0;
      view.lastX = event.clientX;
      view.lastY = event.clientY;
      view.spinVelocity = 0;
      hoverDirty = true;
      canvas.setPointerCapture?.(event.pointerId);
    }

    function onPointerMove(event) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.inside = true;
      hoverDirty = true;

      if (!view.dragging) return;

      const dx = event.clientX - view.lastX;
      const dy = event.clientY - view.lastY;
      view.lastX = event.clientX;
      view.lastY = event.clientY;
      view.moved += Math.abs(dx) + Math.abs(dy);
      view.spin += dx * 0.006;
      view.spinVelocity = dx * 0.0009;
      view.tiltX = clamp(view.tiltX + dy * 0.005, -1.1, 1.1);
    }

    function onPointerUp(event) {
      const wasDragging = view.dragging;
      const quick = performance.now() - view.downAt < 350;

      view.dragging = false;
      hoverDirty = true;
      canvas.releasePointerCapture?.(event.pointerId);

      if (wasDragging && view.moved < 6 && quick && hoverRef.current?.code) {
        selectHandlerRef.current?.(hoverRef.current.code);
      }
    }

    function onPointerLeave() {
      pointer.inside = false;
      hoverDirty = true;
    }

    function onWheel(event) {
      event.preventDefault();
      const next = clamp(view.zoom - event.deltaY * 0.0012, 0.75, 1.9);
      view.zoom = next;
      setZoom(next);
    }

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, []);

  function zoomBy(delta) {
    const view = viewRef.current;
    const next = clamp(view.zoom + delta, 0.75, 1.9);
    view.zoom = next;
    setZoom(next);
  }

  function resetView() {
    const view = viewRef.current;
    view.spin = DEFAULT_VIEW.spin;
    view.tiltX = DEFAULT_VIEW.tiltX;
    view.zoom = DEFAULT_VIEW.zoom;
    view.spinVelocity = 0;
    setZoom(DEFAULT_VIEW.zoom);
  }

  function toggleSpin() {
    setSpinEnabled((current) => {
      spinEnabledRef.current = !current;
      return !current;
    });
  }

  const controlClass =
    'flex h-7 w-7 items-center justify-center border border-base-700 bg-base-900/80 text-ink-300 backdrop-blur transition hover:border-accent-600 hover:text-accent-300 active:scale-95';

  return (
    <div className={`relative h-[300px] w-full sm:h-[360px] lg:h-[400px] ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(193,255,46,0.06) 0px, rgba(193,255,46,0.06) 1px, transparent 1px, transparent 3px)',
        }}
        aria-hidden="true"
      />

      <canvas ref={canvasRef} className="relative block h-full w-full touch-none" aria-hidden="true" />

      <div className="pointer-events-none absolute left-3 top-3 border border-base-800 bg-base-950/70 px-2.5 py-1.5 backdrop-blur">
        <p className="text-[9px] uppercase tracking-[0.28em] text-accent-400">Orbital view</p>
        <p className="mt-0.5 font-mono text-[10px] text-ink-400">
          {hover ? `${hover.code || '——'} · ${hover.name}` : 'drag · scroll · click'}
        </p>
      </div>

      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 border border-base-800 bg-base-950/70 px-2 py-1 backdrop-blur">
        <span className="text-[9px] uppercase tracking-[0.2em] text-ink-600">low</span>
        <span
          className="h-1.5 w-16"
          style={{ background: 'linear-gradient(90deg, rgba(193,255,46,0.25), #22e6d0, #ff5c85)' }}
        />
        <span className="text-[9px] uppercase tracking-[0.2em] text-ink-600">high</span>
      </div>

      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5">
        <button type="button" onClick={() => zoomBy(0.15)} className={controlClass} aria-label="Zoom in">
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => zoomBy(-0.15)} className={controlClass} aria-label="Zoom out">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={toggleSpin} className={controlClass} aria-label="Toggle rotation">
          {spinEnabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={resetView} className={controlClass} aria-label="Reset view">
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <span className="pointer-events-none absolute right-3 top-3 font-mono text-[10px] text-ink-600">
        ZOOM {Math.round(zoom * 100)}%
      </span>

      <div
        ref={tooltipRef}
        className="pointer-events-none absolute left-0 top-0 z-10"
        style={{ transform: 'translate3d(-9999px, -9999px, 0)' }}
      >
        {hover && (
          <div className="min-w-[9rem] border border-accent-600/60 bg-base-950/95 px-2.5 py-2 shadow-glow">
            <p className="text-[11px] font-medium text-ink-100">{hover.name}</p>
            <p className="mt-0.5 font-mono text-[10px] text-accent-400">
              {hover.count > 0 ? `${hover.count} live click${hover.count === 1 ? '' : 's'}` : 'no live clicks'}
            </p>
            <p className="mt-0.5 text-[9px] uppercase tracking-widest text-ink-600">click to filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
