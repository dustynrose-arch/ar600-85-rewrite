export const PANE_SESSION_KEY = "ar60085.panes";

export type PaneCollapseState = {
  leftCollapsed: boolean;
  rightCollapsed: boolean;
};

export const DEFAULT_PANE_STATE: PaneCollapseState = {
  leftCollapsed: false,
  rightCollapsed: false,
};

export function readPaneSession(): PaneCollapseState {
  if (typeof window === "undefined") return DEFAULT_PANE_STATE;
  try {
    const raw = window.sessionStorage.getItem(PANE_SESSION_KEY);
    if (!raw) return DEFAULT_PANE_STATE;
    const parsed = JSON.parse(raw) as Partial<PaneCollapseState>;
    return {
      leftCollapsed: Boolean(parsed.leftCollapsed),
      rightCollapsed: Boolean(parsed.rightCollapsed),
    };
  } catch {
    return DEFAULT_PANE_STATE;
  }
}

export function writePaneSession(state: PaneCollapseState): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PANE_SESSION_KEY, JSON.stringify(state));
  } catch {
    /* private-mode or locked-down browsers may block session storage */
  }
}
