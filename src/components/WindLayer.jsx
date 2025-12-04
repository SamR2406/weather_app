import { useEffect, useRef } from "react";

export function WindLayer({
  intensity = 1,
  speed = 1,
  color = "rgba(255,255,255,0.35)",
  trailAlpha = 0.08,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    let rafId;
    let gusts = [];

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = Math.floor((width * height) / 18000);
      const count = Math.max(10, Math.floor(density * intensity));

      gusts = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        len: 90 + Math.random() * 140,
        arc: 10 + Math.random() * 20,
        thickness: 1 + Math.random() * 1.5,
        baseSpeed: 1 + Math.random() * 1.2,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.01 + Math.random() * 0.02,
        wobbleAmp: 4 + Math.random() * 10,
      }));
    };

    const draw = () => {
      // Clear without darkening the scene; optional fade via destination-out
      ctx.clearRect(0, 0, width, height);
      if (trailAlpha > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = `rgba(0,0,0,${trailAlpha})`;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      ctx.strokeStyle = color;
      ctx.lineCap = "round";

      gusts.forEach((g) => {
        g.wobblePhase += g.wobbleSpeed;
        const wobble = Math.sin(g.wobblePhase) * g.wobbleAmp;
        const sx = g.x;
        const sy = g.y;
        const ex = g.x + g.len;
        const ey = g.y + g.arc;
        const cx = sx + g.len * 0.4;
        const cy = sy + wobble;

        ctx.lineWidth = g.thickness;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(cx, cy, ex, ey);
        ctx.stroke();

        const delta = (g.baseSpeed + speed * 0.8) * 1.2;
        g.x += delta;
        g.y += (speed - 1) * 0.2;

        if (g.x > width + 40) {
          g.x = -60;
          g.y = Math.random() * height;
        } else if (g.y > height + 40) {
          g.y = -20;
        } else if (g.y < -40) {
          g.y = height + 20;
        }
      });

      rafId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [color, intensity, speed, trailAlpha]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none z-[5]"
    />
  );
}
