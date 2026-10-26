import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "expo-router";
import { TAB_ORDER } from "./constants.js";

const TabTransitionContext = createContext({ activeTabKey: "home", direction: "right", navCount: 0 });

function pathToTabKey(pathname) {
  const first = pathname.split("/")[1] || "";
  return first === "" ? "home" : first;
}

// Tracks which top-level tab is active and which way the bottom tab bar moved
// (left/right, by TAB_ORDER), so each tab root can slide in the same way the
// web app's tabs do. navCount only increments on a real tab switch -- moving
// around inside a tab's own stack (e.g. opening a system, editing a task)
// keeps the same top-level segment, so it doesn't retrigger the slide.
export function TabTransitionProvider({ children }) {
  const pathname = usePathname();
  const tabKey = pathToTabKey(pathname);
  const prevIndexRef = useRef(TAB_ORDER.indexOf(tabKey));
  const isFirstRef = useRef(true);
  const settledTabRef = useRef(tabKey);
  const [state, setState] = useState({ activeTabKey: tabKey, direction: "right", navCount: 0 });

  useEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      return;
    }
    // The chat (/ask) is a full-screen page over the tabs, not a tab: leave the
    // tab state alone, so coming back doesn't replay the slide on the same tab.
    if (tabKey === "ask") return;
    if (tabKey === settledTabRef.current) return;
    settledTabRef.current = tabKey;
    const index = TAB_ORDER.indexOf(tabKey);
    const direction = index === -1 || index >= prevIndexRef.current ? "right" : "left";
    if (index !== -1) prevIndexRef.current = index;
    setState((s) => ({ activeTabKey: tabKey, direction, navCount: s.navCount + 1 }));
  }, [tabKey]);

  return <TabTransitionContext.Provider value={state}>{children}</TabTransitionContext.Provider>;
}

export function useTabTransition() {
  return useContext(TabTransitionContext);
}
