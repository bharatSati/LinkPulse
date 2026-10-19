import { EventEmitter } from 'node:events';

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

const CLICK_CHANNEL = 'workspace:click';

export function publishClick(workspaceId, click) {
  if (!workspaceId || !click) return;
  emitter.emit(CLICK_CHANNEL, { workspaceId: String(workspaceId), click });
}

export function subscribeToClicks(workspaceId, listener) {
  const scope = String(workspaceId);

  const handler = (payload) => {
    if (payload.workspaceId !== scope) return;
    listener(payload.click);
  };

  emitter.on(CLICK_CHANNEL, handler);

  return () => {
    emitter.off(CLICK_CHANNEL, handler);
  };
}
