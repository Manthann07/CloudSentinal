import { useEffect, useRef } from "react";

export default function CyberBackground({ theme = "cyber-neon", isInjecting = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Color theme maps
    const themeColors = {
      "cyber-neon": {
        primary: "rgba(0, 240, 255, ",
        secondary: "rgba(157, 78, 223, ",
        cloudFill: "rgba(0, 240, 255, 0.03)",
        cloudStroke: "rgba(0, 240, 255, 0.25)",
        grid: "rgba(0, 240, 255, 0.03)",
        beam: "rgba(0, 240, 255, 0.08)",
      },
      "quantum-gold": {
        primary: "rgba(255, 183, 3, ",
        secondary: "rgba(255, 140, 0, ",
        cloudFill: "rgba(255, 183, 3, 0.03)",
        cloudStroke: "rgba(255, 183, 3, 0.25)",
        grid: "rgba(255, 183, 3, 0.03)",
        beam: "rgba(255, 183, 3, 0.08)",
      },
      "crimson-alert": {
        primary: "rgba(255, 42, 109, ",
        secondary: "rgba(255, 90, 0, ",
        cloudFill: "rgba(255, 42, 109, 0.04)",
        cloudStroke: "rgba(255, 42, 109, 0.3)",
        grid: "rgba(255, 42, 109, 0.03)",
        beam: "rgba(255, 42, 109, 0.08)",
      },
      "matrix-emerald": {
        primary: "rgba(0, 255, 157, ",
        secondary: "rgba(0, 200, 100, ",
        cloudFill: "rgba(0, 255, 157, 0.03)",
        cloudStroke: "rgba(0, 255, 157, 0.25)",
        grid: "rgba(0, 255, 157, 0.03)",
        beam: "rgba(0, 255, 157, 0.08)",
      },
    };

    const currentPalette = themeColors[theme] || themeColors["cyber-neon"];

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Interactive mouse state
    const mouse = { x: width / 2, y: height / 2, radius: 200, active: false };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const handleMouseLeave = () => {
      mouse.active = false;
    };

    // Click shockwave pulses
    let shockwaves = [];
    const handleClick = (e) => {
      shockwaves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 10,
        maxRadius: 240,
        alpha: 0.85,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("click", handleClick);

    // Floating Vector Clouds system
    const cloudCount = Math.max(4, Math.floor(width / 320));
    const clouds = Array.from({ length: cloudCount }, (_, idx) => ({
      x: (idx * (width / cloudCount)) + Math.random() * 80,
      y: 60 + Math.random() * (height * 0.55),
      scale: 0.6 + Math.random() * 0.7,
      speedX: (Math.random() * 0.3 + 0.15) * (idx % 2 === 0 ? 1 : -1),
      speedY: Math.sin(idx) * 0.08,
      pulsePhase: Math.random() * Math.PI * 2,
      bubbles: [
        { offsetX: 0, offsetY: 0, r: 45 },
        { offsetX: 35, offsetY: -18, r: 35 },
        { offsetX: -35, offsetY: -12, r: 32 },
        { offsetX: 60, offsetY: 8, r: 28 },
        { offsetX: -55, offsetY: 10, r: 25 },
      ],
    }));

    // Particle system
    const particleCount = Math.floor(Math.min(width, 1600) / 20);
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 1,
      alpha: Math.random() * 0.6 + 0.2,
      pulse: Math.random() * 0.03 + 0.01,
      colorType: Math.random() > 0.3 ? "primary" : "secondary",
    }));

    let scanlineY = 0;
    let frameCount = 0;

    const render = () => {
      frameCount++;
      ctx.clearRect(0, 0, width, height);

      // 1. Grid horizon lines
      const gridSize = 65;
      ctx.strokeStyle = currentPalette.grid;
      ctx.lineWidth = 1;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Floating Cyber Vector Cloud Shapes
      for (const cloud of clouds) {
        cloud.x += cloud.speedX;
        cloud.y += Math.sin(frameCount * 0.01 + cloud.pulsePhase) * 0.2;

        if (cloud.x > width + 150) cloud.x = -150;
        if (cloud.x < -150) cloud.x = width + 150;

        ctx.save();
        ctx.translate(cloud.x, cloud.y);
        ctx.scale(cloud.scale, cloud.scale);

        // Cloud ambient aura glow
        const glowRad = 90;
        const cloudGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, glowRad);
        cloudGlow.addColorStop(0, `${currentPalette.primary}0.12)`);
        cloudGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = cloudGlow;
        ctx.beginPath();
        ctx.arc(0, 0, glowRad, 0, Math.PI * 2);
        ctx.fill();

        // Cloud bubble clusters path
        ctx.beginPath();
        for (const b of cloud.bubbles) {
          ctx.moveTo(b.offsetX + b.r, b.offsetY);
          ctx.arc(b.offsetX, b.offsetY, b.r, 0, Math.PI * 2);
        }

        ctx.fillStyle = currentPalette.cloudFill;
        ctx.shadowBlur = 18;
        ctx.shadowColor = `${currentPalette.primary}0.35)`;
        ctx.fill();

        ctx.strokeStyle = currentPalette.cloudStroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Cloud Internal Data Pulse Ring
        const pulseR = 15 + Math.sin(frameCount * 0.04 + cloud.pulsePhase) * 6;
        ctx.beginPath();
        ctx.arc(0, -5, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = `${currentPalette.primary}0.4)`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Optional lightning spark during injection
        if (isInjecting && Math.random() < 0.15) {
          ctx.beginPath();
          ctx.moveTo(0, 10);
          ctx.lineTo(-8, 25);
          ctx.lineTo(4, 25);
          ctx.lineTo(-5, 42);
          ctx.strokeStyle = `${currentPalette.primary}0.9)`;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 12;
          ctx.shadowColor = `${currentPalette.primary}1)`;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      }

      // 3. Scanner Beam Line
      scanlineY = (scanlineY + 1.2) % height;
      const gradient = ctx.createLinearGradient(0, scanlineY - 60, 0, scanlineY + 60);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(0.5, currentPalette.beam);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanlineY - 60, width, 120);

      // 4. Click shockwaves
      shockwaves = shockwaves.filter((wave) => wave.alpha > 0.02);
      for (const wave of shockwaves) {
        wave.radius += 7;
        wave.alpha *= 0.94;

        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${currentPalette.primary}${wave.alpha})`;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 18;
        ctx.shadowColor = `${currentPalette.primary}0.9)`;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 5. Particles & Dynamic Laser Connections
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse interaction
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const angle = Math.atan2(dy, dx);
            const force = (mouse.radius - dist) / mouse.radius;
            p.x -= Math.cos(angle) * force * 3.5;
            p.y -= Math.sin(angle) * force * 3.5;
          }
        }

        // Draw particle node
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        const col = currentPalette[p.colorType];
        ctx.fillStyle = `${col}${p.alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `${col}0.8)`;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 125) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const lineAlpha = (1 - dist / 125) * 0.18;
            ctx.strokeStyle = `${currentPalette.primary}${lineAlpha})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, isInjecting]);

  return <canvas ref={canvasRef} className="cyber-canvas" aria-hidden="true" />;
}
