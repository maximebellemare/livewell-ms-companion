import { useRef, useState } from "react";

interface HoldButtonProps {
  onHold: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  /** Hold duration in ms — must match the ring-fill keyframe duration */
  duration?: number;
}

// circumference for SVG circle r=18: 2π×18 ≈ 113.1
const CIRCUMFERENCE = 113.1;

/**
 * A button that requires a sustained press (hold) to fire its action.
 * Shows a progress ring during the hold and plays a haptic pattern on fire.
 */
export default function HoldButton({
  onHold,
  disabled,
  className = "",
  children,
  duration = 500,
}: HoldButtonProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  const start = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsPressing(true);
    timer.current = setTimeout(() => {
      setIsPressing(false);
      navigator.vibrate?.([30, 50, 30]);
      onHold();
    }, duration);
  };

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    setIsPressing(false);
  };

  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onClick={(e) => e.preventDefault()}
      disabled={disabled}
      className={`relative overflow-hidden select-none ${className}`}
    >
      {children}

      {isPressing && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg
            width="36" height="36" viewBox="0 0 44 44"
            style={{ transform: "rotate(-90deg)", position: "absolute" }}
          >
            {/* Track */}
            <circle
              cx="22" cy="22" r="18" fill="none"
              stroke="hsl(var(--primary-foreground) / 0.25)"
              strokeWidth="3"
            />
            {/* Fill */}
            <circle
              cx="22" cy="22" r="18" fill="none"
              stroke="hsl(var(--primary-foreground))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              style={{ animation: `ring-fill ${duration}ms linear forwards` }}
            />
          </svg>
        </span>
      )}
    </button>
  );
}
