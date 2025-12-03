import { useEffect, useRef } from "react";

export function SunLayer({
  intensity = 120,               
  color = "rgba(255, 220, 80, 0.35)", 
  rayLength = "",              
  rayWidth = 35,              
  pulseSpeed = 0.005,           
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    let rafId;
    let rays = [];

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const maxRayLength = Math.sqrt(width * width + height * height);

      const count = Math.max(10, Math.floor(intensity * 20));

      rays = Array.from({ length: count }, (_, i) => ({
        angle: (Math.PI / 2) * (i / (count - 1)), 
        alpha: Math.random() * 0.5 + 0.2,   
        alphaDir: Math.random() > 0.5 ? 1 : -1, 
        length: maxRayLength,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.shadowBlur = 45;
      ctx.shadowColor = "rgba(255, 240, 150, 0.5)";

      ctx.globalCompositeOperation = "lighter";

      rays.forEach((ray) => {
        // Update alpha for pulse
        ray.alpha += ray.alphaDir * pulseSpeed;
        if (ray.alpha > 0.8) ray.alphaDir = -1;
        if (ray.alpha < 0.1) ray.alphaDir = 1;

        // Calculate end point based on angle
        const x2 = Math.cos(ray.angle) * ray.length;
        const y2 = Math.sin(ray.angle) * ray.length;

        // Gradient along the ray
        const gradient = ctx.createLinearGradient(0, 0, x2, y2);
        gradient.addColorStop(0, `rgba(255, 230, 120, ${ray.alpha})`);
        gradient.addColorStop(0.3, `rgba(255, 230, 120, ${ray.alpha * 0.4})`);
        gradient.addColorStop(1, "rgba(255, 230, 120, 0)");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = rayWidth;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(x2, y2);
        ctx.stroke();
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
  }, [intensity, color, rayLength, rayWidth, pulseSpeed]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
