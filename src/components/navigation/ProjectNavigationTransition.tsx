import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import type { Student } from "../../data/students";
import { posterThemes } from "../../data/posterThemes";
import "./ProjectNavigationTransition.css";

type FlightPhase = "initial" | "expanded" | "revealing";

type Flight = {
  student: Student;
  phase: FlightPhase;
  // Insets relative to the viewport reproduce the clicked card's position.
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type TransitionContextValue = {
  openStudent: (student: Student, element: HTMLElement) => void;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function useProjectNavigation() {
  const context = useContext(TransitionContext);
  if (!context) throw new Error("Missing ProjectNavigationProvider");
  return context;
}

export function ProjectNavigationProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [flight, setFlight] = useState<Flight | null>(null);
  const activeRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const originalOverflow = useRef<string | null>(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current = [];
  }, []);

  const unlock = useCallback(() => {
    if (originalOverflow.current !== null) {
      document.body.style.overflow = originalOverflow.current;
      originalOverflow.current = null;
    }
  }, []);

  useEffect(() => () => {
    clearTimers();
    unlock();
  }, [clearTimers, unlock]);

  const openStudent = useCallback((student: Student, element: HTMLElement) => {
    if (activeRef.current) return;
    const url = `/proyectos/${student.id}`;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      navigate(url);
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }

    activeRef.current = true;
    clearTimers();
    const rect = element.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bounds = {
      top: Math.max(0, rect.top),
      right: Math.max(0, vw - rect.right),
      bottom: Math.max(0, vh - rect.bottom),
      left: Math.max(0, rect.left),
    };

    originalOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setFlight({ student, phase: "initial", ...bounds });

    const schedule = (callback: () => void, ms: number) => {
      timersRef.current.push(window.setTimeout(callback, ms));
    };

    // Let the browser paint the original poster rectangle before expanding it.
    schedule(() => setFlight((prev) => prev ? { ...prev, phase: "expanded" } : prev), 45);

    schedule(() => {
      navigate(url);
      window.scrollTo({ top: 0, behavior: "instant" });
      // Keep the full-screen poster up while the new page mounts.
      schedule(() => setFlight((prev) => prev ? { ...prev, phase: "revealing" } : prev), 100);
    }, 1080);

    schedule(() => {
      setFlight(null);
      activeRef.current = false;
      unlock();
    }, 1750);
  }, [navigate, clearTimers, unlock]);

  const contextValue = useMemo(() => ({ openStudent }), [openStudent]);
  const theme = flight ? posterThemes[flight.student.artwork] : null;
  const style = flight && theme ? {
    "--flight-top": `${flight.top}px`,
    "--flight-right": `${flight.right}px`,
    "--flight-bottom": `${flight.bottom}px`,
    "--flight-left": `${flight.left}px`,
    "--flight-bg": theme.bg,
    "--flight-ink": theme.ink,
    "--flight-accent": theme.accent,
    "--flight-accent2": theme.accent2,
  } as CSSProperties : undefined;

  return (
    <TransitionContext.Provider value={contextValue}>
      {children}
      {flight && (
        <div
          className={`project-flight project-flight--${flight.phase}`}
          style={style}
          aria-hidden="true"
        >
          <div className="project-flight__shape project-flight__shape--one" />
          <div className="project-flight__shape project-flight__shape--two" />
          <span className="project-flight__initials">
            {flight.student.firstName.charAt(0)}{flight.student.lastName.charAt(0)}
          </span>
          <div className="project-flight__content">
            <span className="project-flight__meta">PROYECTO FINAL / 9.º {flight.student.group.slice(-1)}</span>
            <strong>{flight.student.firstName}<span>{flight.student.lastName}</span></strong>
          </div>
        </div>
      )}
    </TransitionContext.Provider>
  );
}
