import { useEffect, useState } from 'react';
import { baseURL, getStoredToken } from '../services/api.js';

const MAX_EVENTS = 40;
const RETRY_BASE_MS = 1200;
const RETRY_MAX_MS = 15000;

function parseEvent(block) {
  if (!block || block.startsWith(':')) return null;

  let event = 'message';
  const dataLines = [];

  for (const rawLine of block.split('\n')) {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
  }

  if (dataLines.length === 0) return null;

  try {
    return { event, data: JSON.parse(dataLines.join('\n')) };
  } catch {
    return null;
  }
}

export default function useLiveClicks({ workspaceId, linkId = null, enabled = true }) {
  const [clicks, setClicks] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!workspaceId || !enabled) {
      setStatus('idle');
      return undefined;
    }

    const token = getStoredToken();
    if (!token) {
      setStatus('error');
      setError('Sign in again to watch live clicks.');
      return undefined;
    }

    let disposed = false;
    let controller = null;
    let retryTimer = null;
    let attempt = 0;

    setClicks([]);
    setError('');

    const safeLinkId =
      typeof linkId === 'string' && /^[a-f0-9]{24}$/i.test(linkId) ? linkId : null;

    const url = `${baseURL.replace(/\/+$/, '')}/analytics/stream?workspaceId=${encodeURIComponent(
      workspaceId
    )}${safeLinkId ? `&linkId=${encodeURIComponent(safeLinkId)}` : ''}`;

    const scheduleRetry = () => {
      if (disposed) return;
      const delay = Math.min(RETRY_BASE_MS * 2 ** Math.min(attempt, 4), RETRY_MAX_MS);
      attempt += 1;
      setStatus('reconnecting');
      retryTimer = window.setTimeout(connect, delay);
    };

    const handleBlock = (block) => {
      const parsed = parseEvent(block);
      if (!parsed) return;
      const { event, data } = parsed;

      if (event === 'snapshot') {
        setClicks((data.clicks || []).slice(0, MAX_EVENTS));
        return;
      }

      if (event === 'click' && data?.id) {
        setClicks((current) => {
          if (current.some((item) => item.id === data.id)) return current;
          return [data, ...current].slice(0, MAX_EVENTS);
        });
      }
    };

    const connect = async () => {
      if (disposed) return;

      controller?.abort();
      controller = new AbortController();
      setStatus((current) => (current === 'live' ? current : 'connecting'));

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
          signal: controller.signal,
        });

        if (response.status === 401 || response.status === 403) {
          setStatus('error');
          setError('Live stream access was denied. Refresh the page to reconnect.');
          return;
        }

        if (!response.ok || !response.body) {
          throw new Error(`Live stream failed (${response.status})`);
        }

        attempt = 0;
        setError('');
        setStatus('live');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!disposed) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          buffer = buffer.replace(/\r\n/g, '\n');

          let boundary = buffer.indexOf('\n\n');
          while (boundary !== -1) {
            handleBlock(buffer.slice(0, boundary));
            buffer = buffer.slice(boundary + 2);
            boundary = buffer.indexOf('\n\n');
          }
        }

        if (!disposed) scheduleRetry();
      } catch (streamError) {
        if (disposed || streamError?.name === 'AbortError') return;
        scheduleRetry();
      }
    };

    connect();

    return () => {
      disposed = true;
      controller?.abort();
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [workspaceId, linkId, enabled]);

  return { clicks, status, error };
}
