import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  RefreshCw,
  UploadCloud,
  X,
} from 'lucide-react';
import Dialog from '../ui/Dialog.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';
import { cn } from '../../utils/cn.js';
import { useToast } from '../../hooks/useToast.js';
import { downloadImportTemplate, importLinksCsv } from '../../services/link.service.js';
import { triggerDownload } from '../../utils/qr.js';

const MAX_CLIENT_FILE_BYTES = 5 * 1024 * 1024;

function splitCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (inQuotes) {
      if (char === '"') {
        if (line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function inspectCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length === 0) return { columns: [], rowCount: 0 };
  const columns = splitCsvLine(lines[0]).map((cell) => cell.trim().replace(/^"|"$/g, ''));
  return { columns, rowCount: Math.max(lines.length - 1, 0) };
}

function buildErrorCsv(errors) {
  const escape = (value) => `"${String(value).replace(/"/g, '""')}"`;
  return ['row,error', ...errors.map((item) => `${item.row},${escape(item.message)}`)].join('\n');
}

export default function ImportLinksDialog({ open, workspaceId, canEdit, onClose, onImported }) {
  const { toast } = useToast();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileError, setFileError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview(null);
      setFileError('');
      setUploading(false);
      setError('');
      setResult(null);
      setDragActive(false);
    }
  }, [open]);

  function reset() {
    setFile(null);
    setPreview(null);
    setFileError('');
    setError('');
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleFile(nextFile) {
    if (!nextFile) return;
    setFileError('');
    setError('');

    const isCsv = /\.csv$/i.test(nextFile.name) || nextFile.type === 'text/csv';
    if (!isCsv) {
      setFile(null);
      setPreview(null);
      setFileError('Only .csv files are supported');
      return;
    }
    if (nextFile.size > MAX_CLIENT_FILE_BYTES) {
      setFile(null);
      setPreview(null);
      setFileError('This file is larger than the 5MB browser limit');
      return;
    }

    setFile(nextFile);
    try {
      const text = await nextFile.text();
      setPreview(inspectCsv(text));
    } catch {
      setPreview(null);
    }
  }

  function onInputChange(event) {
    handleFile(event.target.files?.[0]);
  }

  function onDrop(event) {
    event.preventDefault();
    setDragActive(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  async function handleDownloadTemplate() {
    setTemplateLoading(true);
    try {
      const response = await downloadImportTemplate(workspaceId);
      const disposition = response.headers?.['content-disposition'] || '';
      const match = /filename="?([^";]+)"?/.exec(disposition);
      triggerDownload(response.data, match?.[1] || 'linkpulse-import-template.csv');
    } catch (err) {
      toast.error(err.message || 'Unable to download the template');
    } finally {
      setTemplateLoading(false);
    }
  }

  async function handleImport() {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const data = await importLinksCsv(workspaceId, file);
      setResult(data);
      if (data.imported > 0) {
        onImported?.();
      }
    } catch (err) {
      setError(err.message || 'The import could not be processed');
    } finally {
      setUploading(false);
    }
  }

  const missingHeader =
    preview && !preview.columns.some((column) => column.toLowerCase().replace(/[^a-z0-9]/g, '') === 'originalurl');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="max-w-2xl"
      title="Import links from CSV"
      description="Upload a CSV to create many links at once. Rows are validated individually."
    >
      {result ? (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <SummaryStat label="Imported" value={result.imported} tone="accent" />
            <SummaryStat label="Failed" value={result.failed} tone={result.failed ? 'danger' : 'neutral'} />
            <SummaryStat label="Skipped" value={result.skipped} tone="neutral" />
          </div>

          <p className="text-sm text-ink-400">
            {result.totalRows} row{result.totalRows === 1 ? '' : 's'} processed from{' '}
            <span className="text-ink-200">{result.fileName}</span> in {result.durationMs}ms.
          </p>

          {result.errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink-200">
                  Row errors ({result.errors.length}
                  {result.errorCountTruncated ? '+' : ''})
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  onClick={() =>
                    triggerDownload(
                      new Blob([buildErrorCsv(result.errors)], { type: 'text/csv;charset=utf-8' }),
                      'linkpulse-import-errors.csv'
                    )
                  }
                >
                  Error report
                </Button>
              </div>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-base-700">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-base-850 text-ink-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Row</th>
                      <th className="px-3 py-2 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((item, index) => (
                      <tr key={`${item.row}-${index}`} className="border-t border-base-800">
                        <td className="px-3 py-2 text-ink-400">{item.row}</td>
                        <td className="px-3 py-2 text-danger-400">{item.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" icon={RefreshCw} onClick={reset}>
              Import another file
            </Button>
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-base-700 bg-base-900/60 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-ink-300">
              <FileSpreadsheet className="h-4 w-4 text-accent-500" />
              Start with the template
            </div>
            <Button variant="secondary" size="sm" icon={Download} loading={templateLoading} onClick={handleDownloadTemplate}>
              Download template
            </Button>
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={cn(
              'flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition',
              dragActive ? 'border-accent-500 bg-accent-500/10' : 'border-base-700 bg-base-900/40'
            )}
          >
            <UploadCloud className="mb-3 h-8 w-8 text-ink-400" />
            {file ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink-100">{file.name}</span>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded p-1 text-ink-500 hover:bg-base-800 hover:text-ink-200"
                  aria-label="Remove file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-ink-300">Drag and drop a CSV here, or</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => inputRef.current?.click()}>
                  Choose file
                </Button>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={onInputChange}
            />
          </div>

          {fileError && (
            <p className="flex items-center gap-1.5 text-sm text-danger-400">
              <AlertTriangle className="h-4 w-4" />
              {fileError}
            </p>
          )}

          {preview && (
            <div className="rounded-xl border border-base-700 bg-base-900/50 p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-ink-300">Detected columns:</span>
                {preview.columns.map((column) => (
                  <Badge key={column} tone="neutral">
                    {column || '(empty)'}
                  </Badge>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-500">
                {preview.rowCount} data row{preview.rowCount === 1 ? '' : 's'} detected.
              </p>
              {missingHeader ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-danger-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  The required <span className="font-medium">originalUrl</span> column was not found.
                </p>
              ) : (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-accent-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Required columns look good.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
              {error}
            </div>
          )}

          {uploading && (
            <div className="h-1.5 w-full overflow-hidden rounded-none bg-base-800">
              <div className="h-full w-1/3 animate-pulse rounded-none bg-accent-500" />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button
              icon={UploadCloud}
              loading={uploading}
              disabled={!file || !canEdit || missingHeader}
              onClick={handleImport}
            >
              Import links
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function SummaryStat({ label, value, tone }) {
  const tones = {
    accent: 'text-accent-300',
    danger: 'text-danger-400',
    neutral: 'text-ink-100',
  };
  return (
    <div className="rounded-xl border border-base-700 bg-base-900/50 px-4 py-3 text-center">
      <p className={cn('text-2xl font-semibold', tones[tone])}>{value}</p>
      <p className="mt-0.5 text-xs uppercase tracking-wide text-ink-500">{label}</p>
    </div>
  );
}
