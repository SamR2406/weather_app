import { useEffect, useRef } from "react";

export function StarLayer({ density = 1, twinkleSpeed = 0.05, color = "rgba(255,255,255,0.9)" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let stars = [];
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

      const count = Math.max(80, Math.floor((width * height) / 8000 * density));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height * 0.7,
        r: Math.random() * 1.6 + 0.4,
        phase: Math.random() * Math.PI * 2,
        speed: twinkleSpeed + Math.random() * twinkleSpeed,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      stars.forEach((star) => {
        star.phase += star.speed;
        const alpha = 0.5 + 0.5 * Math.sin(star.phase);
        const alphaColor = color.startsWith("rgba(")
          ? color.replace(
              /rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/,
              (_, r, g, b) => `rgba(${r},${g},${b},${alpha.toFixed(2)})`
            )
          : color;
        ctx.fillStyle = alphaColor;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
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
  }, [color, density, twinkleSpeed]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none"
    />
  );
}
