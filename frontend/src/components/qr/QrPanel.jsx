import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Download, Loader2, RotateCw, Save } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Badge from '../ui/Badge.jsx';
import { useToast } from '../../hooks/useToast.js';
import { getLinkQr, saveLinkQr } from '../../services/link.service.js';
import {
  QR_DEFAULT_BG,
  QR_DEFAULT_ERROR_LEVEL,
  QR_DEFAULT_FG,
  QR_DEFAULT_SIZE,
  QR_ERROR_LEVELS,
  QR_MAX_SIZE,
  QR_MIN_SIZE,
  downloadDataUrl,
  downloadText,
  isHexColor,
  qrFileName,
} from '../../utils/qr.js';

const PRESET_COLORS = ['#000000', '#0f172a', '#4f46e5', '#0ea5e9', '#16a34a', '#dc2626'];

function initialColor(value, fallback) {
  return isHexColor(value) ? value : fallback;
}

export default function QrPanel({ link, canEdit = true, onSaved }) {
  const { toast } = useToast();

  const [fgColor, setFgColor] = useState(() => initialColor(link?.qr?.fgColor, QR_DEFAULT_FG));
  const [bgColor, setBgColor] = useState(() => initialColor(link?.qr?.bgColor, QR_DEFAULT_BG));
  const [size, setSize] = useState(() => link?.qr?.size || QR_DEFAULT_SIZE);
  const [level, setLevel] = useState(() => link?.qr?.errorCorrectionLevel || QR_DEFAULT_ERROR_LEVEL);

  const [assets, setAssets] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const requestId = useRef(0);

  useEffect(() => {
    if (!link?.id) return;
    setFgColor(initialColor(link.qr?.fgColor, QR_DEFAULT_FG));
    setBgColor(initialColor(link.qr?.bgColor, QR_DEFAULT_BG));
    setSize(link.qr?.size || QR_DEFAULT_SIZE);
    setLevel(link.qr?.errorCorrectionLevel || QR_DEFAULT_ERROR_LEVEL);
  }, [link?.id]);

  useEffect(() => {
    if (!link?.id) return undefined;

    const fgValid = isHexColor(fgColor);
    const bgValid = isHexColor(bgColor);
    if (!fgValid || !bgValid) {
      setError('Colors must be valid hex values such as #0f172a');
      return undefined;
    }
    if (fgColor.toLowerCase() === bgColor.toLowerCase()) {
      setError('Foreground and background colors must differ');
      return undefined;
    }

    setError('');
    const id = ++requestId.current;
    setLoading(true);
    const timer = setTimeout(() => {
      getLinkQr(link.id, {
        fgColor,
        bgColor,
        size,
        errorCorrectionLevel: level,
      })
        .then((data) => {
          if (id === requestId.current) setAssets(data.qr);
        })
        .catch((err) => {
          if (id === requestId.current) setError(err.message || 'Unable to generate the QR code');
        })
        .finally(() => {
          if (id === requestId.current) setLoading(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [link?.id, fgColor, bgColor, size, level]);

  async function handleSave() {
    setSaving(true);
    try {
      const data = await saveLinkQr(link.id, { fgColor, bgColor, size, errorCorrectionLevel: level });
      toast.success('QR settings saved for this link');
      onSaved?.(data);
    } catch (err) {
      toast.error(err.message || 'Unable to save QR settings');
    } finally {
      setSaving(false);
    }
  }

  if (!link) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-100">
              {link.title || link.code || 'Short link'}
            </p>
            <p className="truncate font-mono text-xs text-accent-400">{link.shortUrl}</p>
          </div>
          <Badge tone="accent">QR</Badge>
        </div>

        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField
              label="Foreground"
              value={fgColor}
              onChange={setFgColor}
            />
            <ColorField
              label="Background"
              value={bgColor}
              onChange={setBgColor}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setFgColor(preset)}
                className="h-6 w-6 rounded-full border border-base-600 transition hover:scale-110"
                style={{ backgroundColor: preset }}
                aria-label={`Use ${preset}`}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="qr-size">
            Size · {size}px
          </label>
          <input
            id="qr-size"
            type="range"
            min={QR_MIN_SIZE}
            max={QR_MAX_SIZE}
            step={32}
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
            className="w-full accent-accent-500"
          />
          <div className="mt-1 flex justify-between text-[11px] text-ink-500">
            <span>{QR_MIN_SIZE}px</span>
            <span>{QR_MAX_SIZE}px</span>
          </div>
        </div>

        <Select
          label="Error correction"
          value={level}
          options={QR_ERROR_LEVELS}
          onChange={(event) => setLevel(event.target.value)}
          hint="Higher levels survive more damage but add density."
        />

        <div className="flex flex-wrap gap-2">
          <Button
            icon={Download}
            disabled={!assets || loading}
            onClick={() => downloadDataUrl(assets.png, qrFileName(link, 'png'))}
          >
            Download PNG
          </Button>
          <Button
            variant="secondary"
            icon={Download}
            disabled={!assets || loading}
            onClick={() => downloadText(assets.svg, qrFileName(link, 'svg'), 'image/svg+xml')}
          >
            Download SVG
          </Button>
          {canEdit && (
            <Button
              variant="outline"
              icon={Save}
              loading={saving}
              disabled={loading}
              onClick={handleSave}
            >
              Save settings
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div
          className="flex aspect-square w-full max-w-[320px] items-center justify-center rounded-2xl border border-base-700 p-4"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
          }}
        >
          {assets?.png ? (
            <img src={assets.png} alt="QR code preview" className="h-full w-full object-contain" />
          ) : loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-ink-500" />
          )}
        </div>
        {error ? (
          <p className="flex items-center gap-1.5 text-xs text-danger-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            {error}
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-ink-500">
            <RotateCw className="h-3.5 w-3.5" />
            Updates automatically as you customize
          </p>
        )}
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  const valid = isHexColor(value);
  return (
    <div className="w-full">
      <label className="field-label">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={valid ? value : '#000000'}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-12 cursor-pointer rounded-xl border border-base-600 bg-base-850 p-1"
          aria-label={`${label} color picker`}
        />
        <Input
          value={value}
          error={valid ? undefined : 'Invalid hex color'}
          onChange={(event) => onChange(event.target.value)}
          className="flex-1"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
