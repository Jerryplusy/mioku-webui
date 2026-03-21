import { useEffect, useState } from "react";

function formatClock(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function AnimatedClockDigit({ value }: { value: string }) {
  const [restValue, setRestValue] = useState(value);
  const [outgoingValue, setOutgoingValue] = useState<string | null>(null);
  const [incomingValue, setIncomingValue] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (value === restValue) return;

    let frameId = 0;
    let timeoutId = 0;

    setOutgoingValue(restValue);
    setIncomingValue(value);
    setAnimating(false);

    frameId = window.requestAnimationFrame(() => {
      setAnimating(true);
    });

    timeoutId = window.setTimeout(() => {
      setRestValue(value);
      setOutgoingValue(null);
      setIncomingValue(null);
      setAnimating(false);
    }, 340);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [restValue, value]);

  if (!outgoingValue || !incomingValue) {
    return (
      <span className="flex h-full w-[0.72em] items-center justify-center">
        {restValue}
      </span>
    );
  }

  return (
    <span className="relative h-full w-[0.72em] overflow-hidden">
      <span
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
          animating ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        {outgoingValue}
      </span>
      <span
        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out ${
          animating ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        }`}
      >
        {incomingValue}
      </span>
    </span>
  );
}

function AnimatedClockColon({ delay }: { delay: string }) {
  return (
    <span className="-translate-x-[0.03em] flex h-full w-[0.42em] flex-col items-center justify-center gap-[0.3em]">
      <span
        className="h-[0.14em] w-[0.14em] rounded-full bg-current motion-reduce:animate-none"
        style={{
          animation: "topbarClockColonPulse 1.6s ease-in-out infinite",
          animationDelay: delay,
        }}
      />
      <span
        className="h-[0.14em] w-[0.14em] rounded-full bg-current motion-reduce:animate-none"
        style={{
          animation: "topbarClockColonPulse 1.6s ease-in-out infinite",
          animationDelay: delay,
        }}
      />
    </span>
  );
}

export function AnimatedClockChip() {
  const [timeText, setTimeText] = useState(() => formatClock(new Date()));
  const [colonDelay] = useState(() => {
    const now = Date.now();
    return `-${(now % 1000) / 1000}s`;
  });

  useEffect(() => {
    let timeoutId = 0;

    const scheduleNextTick = () => {
      const now = new Date();
      const delay =
        (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 24;

      timeoutId = window.setTimeout(() => {
        setTimeText(formatClock(new Date()));
        scheduleNextTick();
      }, delay);
    };

    scheduleNextTick();

    return () => window.clearTimeout(timeoutId);
  }, []);

  const chars = timeText.split("");

  return (
    <div className="pointer-events-none flex h-full items-center justify-center px-2">
      <div className="flex h-9 items-center font-semibold tabular-nums text-[1.45rem] leading-none tracking-[0.08em] text-foreground/88 sm:h-10 sm:text-[1.8rem]">
        <AnimatedClockDigit value={chars[0] ?? "0"} />
        <AnimatedClockDigit value={chars[1] ?? "0"} />
        <AnimatedClockColon delay={colonDelay} />
        <AnimatedClockDigit value={chars[3] ?? "0"} />
        <AnimatedClockDigit value={chars[4] ?? "0"} />
      </div>
    </div>
  );
}
