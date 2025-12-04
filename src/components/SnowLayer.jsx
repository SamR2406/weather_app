import { useEffect, useRef } from "react";

export function SnowLayer({
  intensity = 1,
  wind = 0,
  color = "rgba(255,255,255,0.9)",
  trailAlpha = 0.0,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let flakes = [];
    let width = 0;
    let height = 0;
    let rafId;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = Math.floor((width * height) / 9000);
      const count = Math.max(50, Math.floor(density * intensity));
      flakes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1.2 + Math.random() * 2.2,
        speedY: 0.4 + Math.random() * 1.1,
        driftPhase: Math.random() * Math.PI * 2,
        driftSpeed: 0.004 + Math.random() * 0.008,
        driftAmp: 0.6 + Math.random() * 1.1,
      }));
    };

    const draw = () => {
      if (trailAlpha > 0) {
        ctx.fillStyle = `rgba(0,0,0,${trailAlpha})`;
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.clearRect(0, 0, width, height);
      }

      ctx.fillStyle = color;
      flakes.forEach((flake) => {
        flake.driftPhase += flake.driftSpeed;
        const driftX = Math.sin(flake.driftPhase) * flake.driftAmp + wind * 0.06;

        flake.x += driftX;
        flake.y += flake.speedY;

        if (flake.y > height + 10) {
          flake.y = -10;
          flake.x = Math.random() * width;
        } else if (flake.x > width + 10) {
          flake.x = -10;
        } else if (flake.x < -10) {
          flake.x = width + 10;
        }

        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
        ctx.fill();
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
  }, [color, intensity, trailAlpha, wind]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none"
    />
  );
}
