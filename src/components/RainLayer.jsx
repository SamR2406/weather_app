import { useEffect, useRef } from "react";

export function RainLayer({
  intensity = 1,
  wind = 0,
  color = "rgba(255,255,255,0.45)",
  trailAlpha = 0.04,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let drops = [];
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

      const density = Math.floor((width * height) / 8000);
      const count = Math.max(20, Math.floor(density * intensity));
      drops = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        len: 8 + Math.random() * 14,
        speed: 4 + Math.random() * 7,
        thickness: 0.8 + Math.random() * 0.9,
        drift: wind + (Math.random() - 0.5) * 0.6,
      }));
    };

    const draw = () => {
      // watch this just in case  destination-out
      ctx.clearRect(0, 0, width, height);
      if (trailAlpha > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = `rgba(0,0,0,${trailAlpha})`;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      ctx.strokeStyle = color;
      drops.forEach((drop) => {
        ctx.lineWidth = drop.thickness;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.drift * 2, drop.y + drop.len);
        ctx.stroke();

        drop.x += drop.drift;
        drop.y += drop.speed;

        if (drop.y > height + 20) {
          drop.y = -20;
          drop.x = Math.random() * width;
        } else if (drop.x > width + 20) {
          drop.x = -20;
        } else if (drop.x < -20) {
          drop.x = width + 20;
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
  }, [color, intensity, trailAlpha, wind]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none"
    />
  );
}
