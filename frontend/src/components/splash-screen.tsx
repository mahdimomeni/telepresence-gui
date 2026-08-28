import { useEffect, useState } from "react";
import { Radio, Terminal, Cpu, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

const BOOT_STEPS = [
  { id: 1, text: "Initializing Wails native runtime...", icon: Cpu },
  { id: 2, text: "Scanning kubeconfig & active namespaces...", icon: ShieldCheck },
  { id: 3, text: "Hooking Telepresence daemon event streams...", icon: Terminal },
  { id: 4, text: "Kubernetes interceptor engine ready.", icon: Zap },
];

export function SplashScreen({ onComplete, durationMs = 2800 }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(100, Math.floor((elapsed / durationMs) * 100));
      setProgress(rawProgress);

      const stepIndex = Math.min(
        BOOT_STEPS.length - 1,
        Math.floor((elapsed / durationMs) * BOOT_STEPS.length)
      );
      setCurrentStepIndex(stepIndex);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          onComplete();
        }, 500); // smooth fade-out duration
      }
    }, 30);

    return () => clearInterval(interval);
  }, [durationMs, onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const CurrentStepIcon = BOOT_STEPS[currentStepIndex]?.icon || Terminal;

  return (
    <div
      id="telepresence-splash"
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center bg-background text-foreground select-none overflow-hidden transition-all duration-500 ease-out pt-11 ${
        isFadingOut ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Dynamic Cyber Grid Background */}
      <div className="absolute inset-0 cyber-grid-bg opacity-70 pointer-events-none" />

      {/* Atmospheric Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/25 rounded-full blur-[140px] pointer-events-none animate-aurora-1" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none animate-aurora-2" />

      {/* Skip Button */}
      <div className="absolute top-14 right-6 z-20 wails-no-drag">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted/70 backdrop-blur-md rounded-full border border-border/50 transition-all hover:scale-105 cursor-pointer shadow-xs"
        >
          Skip Boot
        </Button>
      </div>

      {/* Main Center Content Container */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center">
        {/* Futuristic Orbital Ring System */}
        <div className="relative size-44 mb-8 flex items-center justify-center">
          {/* Outer Segmented Dashed Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30 animate-spin-slow" />

          {/* Middle Counter-Rotating Orbital Ring with Satellites */}
          <div className="absolute inset-3 rounded-full border border-primary/20 animate-spin-reverse-slow">
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 size-3 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          </div>

          {/* Inner Glowing Scanning Radar */}
          <div className="absolute inset-6 rounded-full border border-primary/40 overflow-hidden">
            <div
              className="w-full h-full animate-radar-sweep origin-center"
              style={{
                background:
                  "conic-gradient(from 0deg, transparent 0deg, transparent 270deg, color-mix(in oklch, var(--primary) 40%, transparent) 360deg)",
              }}
            />
          </div>

          {/* Concentric Pulse Rings */}
          <div className="absolute inset-8 rounded-full border border-primary/30 animate-ripple pointer-events-none" />

          {/* Central Glowing Core Badge */}
          <div className="relative size-20 rounded-2xl bg-card/90 border-2 border-primary/60 shadow-[0_0_35px_-5px_color-mix(in_oklch,var(--primary)_60%,transparent)] flex items-center justify-center backdrop-blur-xl animate-energy-pulse">
            <Radio className="size-9 text-primary animate-pulse" />
          </div>
        </div>

        {/* Brand Title with Gradient Shimmer */}
        <div className="space-y-1.5 mb-6">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-gradient-shimmer">
              TELEPRESENCE
            </h1>
            <Badge
              variant="outline"
              className="text-[11px] h-5 px-1.5 font-bold font-mono text-primary border-primary/40 bg-primary/10 shadow-xs"
            >
              GUI
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground tracking-wide font-medium flex items-center justify-center gap-1.5">
            <Sparkles className="size-3 text-primary animate-pulse" />
            Kubernetes Local Interceptor Engine
          </p>
        </div>

        {/* Live Diagnostics Boot Step Box */}
        <div className="w-full bg-card/80 border border-border/80 rounded-xl p-3.5 backdrop-blur-md shadow-lg shadow-black/20 mb-5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <CurrentStepIcon className="size-4 text-primary animate-bounce" />
              <span className="truncate">{BOOT_STEPS[currentStepIndex]?.text}</span>
            </div>
            <span className="font-mono text-xs font-bold text-primary">{progress}%</span>
          </div>

          {/* Stepped Checkpoints */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {BOOT_STEPS.map((step, idx) => {
              const isPassed = idx < currentStepIndex || progress === 100;
              const isCurrent = idx === currentStepIndex && progress < 100;

              return (
                <div
                  key={step.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isPassed
                      ? "bg-primary shadow-[0_0_8px_var(--primary)]"
                      : isCurrent
                        ? "bg-primary/50 animate-pulse"
                        : "bg-muted"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Progress Bar with Shimmer Highlight */}
        <div className="w-full h-1.5 bg-muted/60 rounded-full overflow-hidden relative shadow-inner">
          <div
            className="h-full bg-linear-to-r from-primary/80 via-primary to-orange-400 transition-all duration-75 rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 skeleton-shimmer opacity-60" />
          </div>
        </div>

        {/* Footer Version Notice */}
        <div className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground/70 font-mono">
          <span className="inline-block size-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>v{__APP_VERSION__} • Desktop Client</span>
        </div>
      </div>
    </div>
  );
}
