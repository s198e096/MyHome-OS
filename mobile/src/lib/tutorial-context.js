import { createContext, useContext, useState } from "react";
import { useRouter } from "expo-router";

const TutorialContext = createContext(null);

// null when the tutorial isn't running (already completed, or not yet
// started) — every screen treats that as "nothing to show here".
export function useTutorial() {
  return useContext(TutorialContext);
}

// One real tab per step — next() actually navigates there, instead of
// describing it from Home, so each step highlights its own real screen.
const STEP_ROUTES = ["/", "/tasks", "/costs", "/docs", "/account"];
export const TUTORIAL_STEPS = STEP_ROUTES.length;

export function TutorialProvider({ active, onFinish, children }) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  function next() {
    if (step < STEP_ROUTES.length - 1) {
      const n = step + 1;
      setStep(n);
      router.push(STEP_ROUTES[n]);
    } else {
      onFinish();
    }
  }

  return (
    <TutorialContext.Provider value={active ? { step, total: STEP_ROUTES.length, next, skip: onFinish } : null}>
      {children}
    </TutorialContext.Provider>
  );
}
