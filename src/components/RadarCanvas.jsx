import { useEffect, useRef } from "react";

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (x) => x * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearing(lat1, lon1, lat2, lon2) {
  const toRad = (x) => x * Math.PI / 180;

  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.cos(toRad(lon2 - lon1));

  return Math.atan2(y, x);
}

function RadarCanvas({ players, self }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const size = 300;
    const center = size / 2;
    const radarRadius = 120;
    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      // Draw background
      ctx.fillStyle = "rgba(0, 20, 0, 0.9)";
      ctx.beginPath();
      ctx.arc(center, center, radarRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw grid
      ctx.strokeStyle = "rgba(0, 255, 136, 0.2)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(center, center, radarRadius * i / 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(center, center - radarRadius);
      ctx.lineTo(center, center + radarRadius);
      ctx.moveTo(center - radarRadius, center);
      ctx.lineTo(center + radarRadius, center);
      ctx.stroke();

      // Draw center dot (You)
      ctx.fillStyle = "#00ff88";
      ctx.beginPath();
      ctx.arc(center, center, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw sweeping line
      const time = Date.now() / 1000;
      const sweepAngle = (time * Math.PI) % (Math.PI * 2);

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(sweepAngle);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radarRadius, 0, -0.6, true);
      ctx.lineTo(0, 0);

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radarRadius);
      gradient.addColorStop(0, "rgba(0, 255, 136, 0.6)");
      gradient.addColorStop(1, "rgba(0, 255, 136, 0)");
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Lead edge of sweep
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radarRadius, 0);
      ctx.strokeStyle = "rgba(0, 255, 136, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();

      if (self) {
        players.forEach((p) => {
          const dist = haversine(self.latitude, self.longitude, p.latitude, p.longitude);
          if (dist > 100) return;

          const ang = bearing(self.latitude, self.longitude, p.latitude, p.longitude);
          const r = (dist / 100) * radarRadius;

          const x = center + r * Math.cos(ang);
          const y = center + r * Math.sin(ang);

          // Glowing pulse effect
          const glow = Math.abs(Math.sin(time * 3));
          
          ctx.beginPath();
          ctx.arc(x, y, 6 + glow * 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 68, 68, ${0.3 + glow * 0.4})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#ff4444";
          ctx.fill();

          ctx.font = "bold 15px Orbitron, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          
          // Thick stroke outline for visibility
          ctx.lineWidth = 4;
          ctx.strokeStyle = "rgba(0, 0, 0, 0.9)";
          ctx.strokeText(p.playerNumber, x, y - 18);
          
          ctx.fillStyle = "white";
          ctx.fillText(p.playerNumber, x, y - 18);
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [players, self]);

  return (
    <div style={{
      position: "relative",
      marginTop: "20px",
      display: "inline-block",
      borderRadius: "50%",
      border: "4px solid #00ff88",
      boxShadow: "0 0 20px #00ff88, inset 0 0 30px #00ff88",
      background: "radial-gradient(circle, rgba(0,40,20,1) 0%, rgba(0,0,0,1) 100%)",
      overflow: "hidden"
    }}>
      <canvas ref={canvasRef} width={300} height={300} style={{ display: "block" }} />
      {/* Glitch CRT lines overlay over the radar itself */}
      <div className="crt-overlay" style={{ borderRadius: "50%", pointerEvents: "none" }} />
    </div>
  );
}

export default RadarCanvas;