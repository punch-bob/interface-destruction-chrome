export interface INuclearExplosion {
  x: number;
  y: number;
  age: number;
  radius: number;
  reached: number;
}

/** Один и тот же пиксельный корпус для панели, персонажа и летящей бомбы. */
export const drawNuclearBomb = (ctx: CanvasRenderingContext2D) => {
  ctx.save();
  ctx.fillStyle = "#18202e";
  ctx.fillRect(-25, -11, 43, 22);
  ctx.fillStyle = "#b1b9a4";
  ctx.fillRect(-19, -9, 32, 18);
  ctx.fillStyle = "#e4e6bc";
  ctx.fillRect(-17, -7, 28, 4);
  ctx.fillStyle = "#64746c";
  ctx.fillRect(-17, 5, 28, 4);
  ctx.fillRect(13, -6, 8, 12);
  ctx.fillStyle = "#e9bc42";
  ctx.fillRect(-27, -15, 7, 9);
  ctx.fillRect(-27, 6, 7, 9);
  ctx.fillRect(-30, -3, 10, 6);
  ctx.beginPath();
  ctx.arc(-3, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#20242a";
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.arc(-3, 0, 6, a, a + 0.85);
    ctx.lineTo(-3, 0);
    ctx.fill();
  }
  ctx.fillStyle = "#e9bc42";
  ctx.beginPath();
  ctx.arc(-3, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#20242a";
  ctx.beginPath();
  ctx.arc(-3, 0, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const drawNuclearExplosion = (
  ctx: CanvasRenderingContext2D,
  blast: INuclearExplosion,
  width: number,
  height: number,
) => {
  const { x, y, age: t, radius } = blast;
  const fade = Math.min(1, Math.max(0, (8 - t) / 2));
  const growth = 1 - Math.exp(-t * 1.2);
  const size = Math.min(width * 0.3, height * 0.42, 340);
  const ground = Math.min(height - 15, y + size * 0.35);
  const top = ground - size * (0.25 + growth * 1.35);
  const cap = size * (0.12 + growth * 0.8);
  ctx.save();
  // Световая вспышка быстро переходит в тёплое послесвечение.
  if (t < 0.65) {
    ctx.fillStyle = `rgba(255,248,221,${Math.max(0, 1 - t / 0.65) * 0.95})`;
    ctx.fillRect(0, 0, width, height);
  }
  const glow = ctx.createRadialGradient(x, ground, 0, x, ground, size * 2.8);
  glow.addColorStop(0, `rgba(255,134,23,${0.5 * fade * Math.exp(-t * 0.25)})`);
  glow.addColorStop(1, "rgba(255,62,5,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  // Ударный фронт и кольцо пыли расходятся отдельно от облака.
  const wave = Math.min(1, t / 1.5);
  if (wave < 1) {
    ctx.strokeStyle = `rgba(255,245,203,${(1 - wave) * 0.9})`;
    ctx.lineWidth = 3 + (1 - wave) * 16;
    ctx.beginPath();
    ctx.arc(x, y, radius * wave, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = fade;
  ctx.strokeStyle = `rgba(159,120,92,${Math.max(0, 0.6 - t * 0.065)})`;
  ctx.lineWidth = 18 + t * 6;
  ctx.beginPath();
  ctx.ellipse(
    x,
    ground,
    size * (0.4 + t * 0.22),
    14 + t * 7,
    0,
    0,
    Math.PI * 2,
  );
  ctx.stroke();
  const puff = (px: number, py: number, r: number, lit: number) => {
    const g = ctx.createRadialGradient(
      px - r * 0.25,
      py - r * 0.3,
      r * 0.05,
      px,
      py,
      r,
    );
    const heat = Math.max(0, 1 - t / 5) * lit;
    g.addColorStop(
      0,
      heat > 0.2
        ? `rgb(255,${Math.round(100 + heat * 130)},${Math.round(24 + heat * 100)})`
        : "#74726f",
    );
    g.addColorStop(0.45, heat > 0.2 ? "#b6602d" : "#454b54");
    g.addColorStop(
      0.65,
      heat > 0.2 ? "rgba(96,58,39,0.85)" : "rgba(45,50,59,0.85)",
    );
    g.addColorStop(1, "rgba(29,32,40,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  };
  const stem = ctx.createLinearGradient(x, top, x, ground);
  stem.addColorStop(0, "#655349");
  stem.addColorStop(0.55, "#a56c40");
  stem.addColorStop(1, "#543c34");
  ctx.fillStyle = stem;
  ctx.beginPath();
  ctx.moveTo(x - cap * 0.28, top);
  ctx.bezierCurveTo(
    x - size * 0.08,
    top + size * 0.4,
    x - size * 0.1,
    ground - size * 0.22,
    x - size * 0.35,
    ground,
  );
  ctx.lineTo(x + size * 0.35, ground);
  ctx.bezierCurveTo(
    x + size * 0.1,
    ground - size * 0.22,
    x + size * 0.08,
    top + size * 0.4,
    x + cap * 0.28,
    top,
  );
  ctx.fill();
  // Ствол гриба: перекрывающиеся клубы дыма поднимаются к шляпке.
  for (let i = 0; i < 24; i++) {
    const q = i / 23;
    const sway =
      Math.sin(i * 2.1 + t * 0.8) * size * (0.04 + Math.sin(i * 3.4) * 0.025);
    puff(
      x + sway,
      ground + (top - ground) * q,
      size * (0.1 + q * 0.09 + Math.sin(i * 2.7) * 0.035) * growth + 6,
      0.8,
    );
  }
  puff(x, top - cap * 0.15, cap * 0.7, 0.7);
  // Объёмная шляпка с ярким нижним краем и тёмными верхними клубами.
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 11; i++) {
      const q = (i - 5) / 5;
      const wobble = Math.sin(i * 3.7 + row * 2.3 + t * 0.45);
      puff(
        x + q * cap * 0.8,
        top -
          Math.sqrt(Math.max(0, 1 - q * q)) * cap * (0.18 + row * 0.16) +
          wobble * cap * 0.04,
        cap * (0.3 + Math.sin(i * 7 + row) * 0.05),
        row === 0 ? 1 : 0.45,
      );
    }
  }
  // Огненное ядро и оседающие искры.
  if (t < 1.1) puff(x, y, size * (0.15 + t * 0.55), 1.6);
  for (let i = 0; i < 55; i++) {
    const a = i * 2.39996;
    const distance = size * (0.1 + (i % 9) / 9) * Math.min(1, t * 0.8);
    const px = x + Math.cos(a) * distance;
    const py =
      top +
      Math.sin(a) * distance * 0.4 +
      ((t * t * 12 + i * 11) % (size * 1.4));
    ctx.fillStyle = i % 3 ? "#ffbf58" : "#898885";
    ctx.globalAlpha = fade * (i % 3 ? 0.7 : 0.4);
    ctx.fillRect(px, py, 2, i % 3 ? 4 : 2);
  }
  ctx.restore();
};
