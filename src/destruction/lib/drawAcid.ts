export interface IAcidPoolVisual {
  x: number;
  y: number;
  age: number;
  radius: number;
  life: number;
}
export const drawAcidGun = (ctx: CanvasRenderingContext2D) => {
  ctx.save();
  ctx.fillStyle = "#182c27";
  ctx.fillRect(-18, -8, 46, 17);
  ctx.fillRect(-9, 8, 8, 13);
  ctx.fillStyle = "#839d8f";
  ctx.fillRect(-16, -7, 34, 4);
  ctx.fillRect(24, -5, 12, 11);
  ctx.fillStyle = "#d2ead5";
  ctx.fillRect(-13, -21, 22, 14);
  ctx.fillStyle = "#74ed38";
  ctx.shadowColor = "#91ff45";
  ctx.shadowBlur = 7;
  ctx.fillRect(-10, -16, 16, 7);
  ctx.fillRect(5, -3, 21, 3);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#32453a";
  ctx.fillRect(-15, -23, 26, 4);
  ctx.fillStyle = "#edf7bc";
  ctx.fillRect(-6, -19, 3, 8);
  ctx.fillRect(30, -3, 7, 2);
  ctx.restore();
};
export const drawAcidPool = (
  ctx: CanvasRenderingContext2D,
  pool: IAcidPoolVisual,
) => {
  const { x, y, age, radius, life } = pool;
  const alpha = Math.min(0.75, age * 3, Math.max(0, (life - age) * 0.8));
  ctx.save();
  ctx.globalAlpha = alpha;
  const glow = ctx.createRadialGradient(x, y, 1, x, y, radius + 9);
  glow.addColorStop(0, "rgba(105,235,35,0.8)");
  glow.addColorStop(0.6, "rgba(98,190,21,0.5)");
  glow.addColorStop(1, "rgba(94,200,21,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius + 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#b3ff5a";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 7; i++) {
    const phase = (age * 0.7 + i * 0.19) % 1;
    const a = i * 2.39996;
    const bx = x + Math.cos(a) * radius * 0.6,
      by = y + Math.sin(a) * radius * 0.6 - phase * 14;
    ctx.globalAlpha = alpha * (1 - phase);
    ctx.beginPath();
    ctx.arc(bx, by, 1.5 + phase * 3.5, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
};
