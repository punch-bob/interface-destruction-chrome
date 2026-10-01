export interface IDrone {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
}
export const drawDrone = (ctx: CanvasRenderingContext2D, drone: IDrone) => {
  ctx.save();
  ctx.translate(drone.x, drone.y);
  ctx.rotate(Math.max(-0.25, Math.min(0.25, drone.vx / 1200)));
  ctx.fillStyle = "#343e54";
  ctx.fillRect(-28, -4, 56, 7);
  ctx.fillRect(-9, -8, 18, 18);
  ctx.fillStyle = "#a4b3c8";
  ctx.fillRect(-8, -7, 16, 4);
  ctx.fillRect(-25, -6, 6, 12);
  ctx.fillRect(19, -6, 6, 12);
  ctx.fillStyle = "#e2b347";
  ctx.fillRect(-5, 3, 10, 10);
  ctx.fillStyle = "#ff685e";
  ctx.shadowColor = "#ff685e";
  ctx.shadowBlur = 8;
  ctx.fillRect(-3, -2, 6, 4);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#75f4ff";
  ctx.lineWidth = 2;
  for (const x of [-22, 22]) {
    ctx.beginPath();
    ctx.ellipse(
      x,
      -8,
      14,
      2.5 + Math.sin(drone.age * 80) * 1.5,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
  ctx.rotate(-Math.max(-0.25, Math.min(0.25, drone.vx / 1200)));
  ctx.fillStyle = "#ffd5cf";
  ctx.font = "bold 12px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.ceil(Math.max(0, 8 - drone.age))}с`, 0, -24);
  ctx.restore();
};
