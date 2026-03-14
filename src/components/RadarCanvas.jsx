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

    ctx.clearRect(0, 0, size, size);

    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 1;

    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(center, center, radarRadius * i / 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "#00ff88";
    ctx.beginPath();
    ctx.arc(center, center, 5, 0, Math.PI * 2);
    ctx.fill();

    if (!self) return;

    players.forEach((p) => {

      const dist = haversine(
        self.latitude,
        self.longitude,
        p.latitude,
        p.longitude
      );

      if (dist > 100) return;

      const ang = bearing(
        self.latitude,
        self.longitude,
        p.latitude,
        p.longitude
      );

      const r = (dist / 100) * radarRadius;

      const x = center + r * Math.cos(ang);
      const y = center + r * Math.sin(ang);

      ctx.fillStyle = "#ff4444";

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

    });

  }, [players, self]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      style={{
        marginTop: "20px",
        border: "1px solid #00ff88",
        borderRadius: "50%"
      }}
    />
  );

}

export default RadarCanvas;