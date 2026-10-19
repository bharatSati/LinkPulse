import { getRecentClicks } from '../services/analytics.service.js';
import { subscribeToClicks } from '../services/realtime.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import { isValidObjectId } from '../utils/validators.js';

const HEARTBEAT_MS = 25000;

export const streamClicks = asyncHandler(async (req, res) => {
  const workspaceId = String(req.workspace.id);
  const linkId = req.query.linkId ? String(req.query.linkId) : null;

  if (linkId && !isValidObjectId(linkId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid linkId filter',
      errors: [],
    });
  }

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let closed = false;
  let ready = false;
  const pending = [];

  const write = (chunk) => {
    if (closed) return;
    try {
      res.write(chunk);
    } catch {
      closed = true;
    }
  };

  const sendEvent = (event, data) => {
    write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const unsubscribe = subscribeToClicks(workspaceId, (click) => {
    if (linkId && click.linkId !== linkId) return;

    if (!ready) {
      pending.push(click);
      if (pending.length > 50) pending.shift();
      return;
    }
    sendEvent('click', click);
  });

  const heartbeat = setInterval(() => write(': ping\n\n'), HEARTBEAT_MS);

  const cleanup = () => {
    if (closed) return;
    closed = true;
    clearInterval(heartbeat);
    unsubscribe();
  };

  req.on('close', cleanup);
  res.on('close', cleanup);

  write(': connected\n\n');

  let snapshot = [];
  try {
    snapshot = await getRecentClicks({ workspaceId, linkId, limit: 20 });
  } catch {
    snapshot = [];
  }

  if (closed) return;

  sendEvent('snapshot', { clicks: snapshot, generatedAt: new Date().toISOString() });

  ready = true;
  for (const click of pending.splice(0)) sendEvent('click', click);
});
