import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as workspaceService from '../services/workspace.service.js';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';

const STORAGE_KEY = 'linkpulse.activeWorkspace';

export const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  );
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const applyWorkspaces = useCallback((list) => {
    setWorkspaces(list);
    setActiveWorkspaceId((current) => {
      const exists = current && list.some((workspace) => workspace._id === current);
      const next = exists ? current : list[0]?._id ?? null;
      if (next) {
        localStorage.setItem(STORAGE_KEY, next);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      setReady(false);
      return;
    }

    setLoading(true);
    try {
      let list = await workspaceService.listWorkspaces();

      if (list.length === 0) {
        const fallbackName = user?.name
          ? `${user.name.split(' ')[0]}'s Workspace`
          : 'My Workspace';
        const created = await workspaceService.createWorkspace({ name: fallbackName });
        list = [created];
      }

      applyWorkspaces(list);
    } catch (error) {
      toast.error(error.message || 'Unable to load workspaces');
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, [isAuthenticated, user, applyWorkspaces, toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectWorkspace = useCallback((id) => {
    setActiveWorkspaceId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace._id === activeWorkspaceId) || null,
    [workspaces, activeWorkspaceId]
  );

  const value = useMemo(
    () => ({
      workspaces,
      activeWorkspace,
      activeWorkspaceId,
      selectWorkspace,
      refresh,
      loading,
      ready,
    }),
    [workspaces, activeWorkspace, activeWorkspaceId, selectWorkspace, refresh, loading, ready]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
