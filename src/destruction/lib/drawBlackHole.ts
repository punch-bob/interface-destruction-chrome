export interface IBlackHoleVisual {
  x: number;
  y: number;
  age: number;
  radius: number;
}

export const drawBlackHoleGun = (ctx: CanvasRenderingContext2D, time = 0) => {
  ctx.save();
  ctx.fillStyle = "#161626";
  ctx.fillRect(-20, -11, 50, 23);
  ctx.fillStyle = "#6e568c";
  ctx.fillRect(-17, -9, 33, 5);
  ctx.fillRect(-14, 7, 26, 3);
  ctx.fillStyle = "#a6afc2";
  ctx.fillRect(-21, -7, 8, 13);
  ctx.fillRect(10, -13, 15, 4);
  ctx.fillRect(10, 10, 15, 4);
  ctx.fillStyle = "#343047";
  ctx.fillRect(-9, 9, 9, 13);
  ctx.strokeStyle = "#bc83ff";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#ad63ff";
  ctx.shadowBlur = 9;
  ctx.beginPath();
  ctx.ellipse(28, 0, 8, 13, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#070510";
  ctx.beginPath();
  ctx.arc(25, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#dec6ff";
  ctx.fillRect(-10, -4, 18, 3);
  ctx.globalAlpha = 0.7 + Math.sin(time * 0.005) * 0.3;
  ctx.fillRect(17, -3, 4, 6);
  ctx.restore();
};

export const drawBlackHole = (
  ctx: CanvasRenderingContext2D,
  hole: IBlackHoleVisual,
) => {
  const { x, y, age: t, radius } = hole;
  const fade = Math.min(1, t * 4, Math.max(0, (7 - t) * 2));
  const core = 26 + Math.min(36, t * 6);
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = fade;
  const halo = ctx.createRadialGradient(0, 0, core, 0, 0, radius);
  halo.addColorStop(0, "rgba(157,80,255,0.4)");
  halo.addColorStop(0.5, "rgba(88,46,150,0.12)");
  halo.addColorStop(1, "rgba(88,46,150,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  // Аккреционный диск и изгиб света вокруг тёмного ядра.
  ctx.rotate(-0.28);
  for (let i = 0; i < 7; i++) {
    ctx.strokeStyle = i % 2 ? "#ffcda3" : "#b176ff";
    ctx.globalAlpha = fade * (0.15 + i * 0.06);
    ctx.lineWidth = 2 + i * 0.5;
    ctx.shadowColor = "#b273ff";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      core * (1.5 + i * 0.13),
      core * (0.35 + i * 0.035),
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  for (let i = 0; i < 30; i++) {
    const phase = (t * 0.25 + i / 30) % 1;
    const distance = core + (radius - core) * (1 - phase);
    const a = i * 2.39996 + t * 1.1 + phase * 5;
    ctx.globalAlpha = fade * Math.sin(phase * Math.PI) * 0.75;
    ctx.strokeStyle = i % 3 ? "#be94ff" : "#ffe0c1";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, distance, a, a + 0.11);
    ctx.stroke();
  }
  ctx.globalAlpha = fade;
  ctx.fillStyle = "#030208";
  ctx.beginPath();
  ctx.arc(0, 0, core, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#efd5ff";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#a164ff";
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(0, 0, core + 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};
