"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  format = (n) => n.toLocaleString(),
  duration = 0.9,
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}
