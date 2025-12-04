import { useEffect, useRef } from "react";

export function CloudLayer({
  intensity = 1,
  wind = 3,
  color = "rgba(200,200,200,0.5)",
  trailAlpha = 0.03
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let clouds = [];
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

      const density = Math.floor((width * height) / 12000);
      const count = Math.max(10, Math.floor(density * intensity));

      clouds = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,

        radius: 100 + Math.random() * 80,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.1,
        opacity: 0.035 + Math.random() * 0.1,
      }));
    };

    const draw = () => {

      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0,0,0,${trailAlpha})`;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";

      clouds.forEach((cloud) => {
        const gradient = ctx.createRadialGradient(
          cloud.x, cloud.y, 0,
          cloud.x, cloud.y, cloud.radius
        );
        gradient.addColorStop(0, `rgba(210,210,210,1${cloud.opacity})`);
        gradient.addColorStop(1, "rgba(180,180,190,0)");
       
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
        ctx.fill();

        cloud.x += cloud.speedX;
        cloud.y += cloud.speedY;

        if (cloud.x > width + cloud.radius) cloud.x = -cloud.radius;
        if (cloud.x < -cloud.radius) cloud.x = width + cloud.radius;
        if (cloud.y > height + cloud.radius) cloud.y = -cloud.radius;
        if (cloud.y < -cloud.radius) cloud.y = height + cloud.radius;
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
