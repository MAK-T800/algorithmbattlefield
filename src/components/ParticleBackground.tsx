import { useRef, useEffect, useCallback } from "react";
import { useTheme } from "./ThemeProvider";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  layer: number;
  baseAlpha: number;
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -10000, y: -10000 });
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const initParticles = useCallback((w: number, h: number) => {
    // Calmer density — fewer particles
    const count = Math.min(Math.floor((w * h) / 16000), 90);
    particlesRef.current = Array.from({ length: count }, () => {
      const layer = Math.floor(Math.random() * 3);
      const speed = 0.08 + layer * 0.06;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        size: 0.8 + layer * 0.6 + Math.random() * 0.6,
        layer,
        baseAlpha: 0.2 + layer * 0.15,
      };
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true })!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = window.innerWidth;
    let h = window.innerHeight;

    const setSize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();
    initParticles(w, h);

    const onResize = () => {
      setSize();
      initParticles(w, h);
    };
    const onMouse = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    const onLeave = () => {
      mouseRef.current.x = -10000;
      mouseRef.current.y = -10000;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("mouseleave", onLeave);

    const draw = () => {
      const isDark = themeRef.current === "dark";
      ctx.clearRect(0, 0, w, h);

      // Color palette per theme
      const dotColor = isDark ? "200, 220, 255" : "60, 90, 160";
      const lineColor = isDark ? "120, 160, 220" : "80, 110, 180";
      const cursorColor = isDark ? "120, 200, 255" : "80, 130, 220";

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // Update + draw particles
      for (const p of particles) {
        // Very subtle mouse influence (gentle pull, not jittery)
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = 140;
        if (dist < influence && dist > 0) {
          const force = ((influence - dist) / influence) * 0.008;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        p.x += p.vx;
        p.y += p.vy;
        // Gentle damping keeps motion calm
        p.vx *= 0.985;
        p.vy *= 0.985;

        // Drift back toward base micro-motion if too slow (keeps flow alive)
        const minSpeed = 0.02 + p.layer * 0.015;
        const sp = Math.hypot(p.vx, p.vy);
        if (sp < minSpeed) {
          const a = Math.random() * Math.PI * 2;
          p.vx += Math.cos(a) * 0.01;
          p.vy += Math.sin(a) * 0.01;
        }

        // Wrap
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Draw dot (no aggressive glow)
        const a = isDark ? p.baseAlpha : p.baseAlpha * 0.55;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotColor}, ${a})`;
        ctx.fill();

        // Soft glow only in dark mode and only near layer
        if (isDark && p.layer === 2) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
          g.addColorStop(0, `rgba(${dotColor}, ${a * 0.6})`);
          g.addColorStop(1, `rgba(${dotColor}, 0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Connections (thin, subtle)
      const maxDist = 120;
      const lineMaxAlpha = isDark ? 0.18 : 0.08;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          if (Math.abs(a.layer - b.layer) > 1) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = ((maxDist - dist) / maxDist) * lineMaxAlpha;
            ctx.strokeStyle = `rgba(${lineColor}, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Subtle cursor connection
      if (mouse.x > -1000) {
        for (const p of particles) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = ((130 - dist) / 130) * (isDark ? 0.25 : 0.12);
            ctx.strokeStyle = `rgba(${cursorColor}, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
