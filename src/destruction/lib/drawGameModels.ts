import { drawAcidGun } from "./drawAcid";
import { drawBlackHoleGun } from "./drawBlackHole";
import { drawNuclearBomb } from "./drawNuclearExplosion";
import { drawPixelWeapon } from "./drawPixelWeapon";
import { gallerySprites } from "./gallerySprites";
import { gamePalette as p } from "../constants/palette";

/** Модели рисуются на canvas и одинаково выглядят в руках и в панели оружия. */
export const drawWeaponModel = (
  ctx: CanvasRenderingContext2D,
  weapon: number,
  time = 0,
) => {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (weapon === 11) {
    drawAcidGun(ctx);
    ctx.restore();
    return;
  }
  if (weapon === 10) {
    drawBlackHoleGun(ctx, time);
    ctx.restore();
    return;
  }
  if (weapon === 9) {
    drawNuclearBomb(ctx);
    ctx.restore();
    return;
  }
  if (
    weapon === 8 &&
    gallerySprites.laser.complete &&
    gallerySprites.laser.naturalWidth
  ) {
    ctx.drawImage(gallerySprites.laser, -16, -22, 64, 48);
    ctx.restore();
    return;
  }
  if (weapon < 8) {
    drawPixelWeapon(ctx, weapon);
  } else {
    // Временный силуэт лазера до загрузки локального спрайта.
    ctx.fillStyle = p.armor;
    ctx.fillRect(-12, -9, 48, 16);
    ctx.fillStyle = p.cyan;
    ctx.shadowColor = p.cyan;
    ctx.shadowBlur = 8;
    ctx.fillRect(5, -6, 32, 3);
    ctx.globalAlpha = 0.7 + Math.sin(time * 0.004) * 0.3;
    ctx.fillRect(36, -5, 6, 9);
  }
  ctx.restore();
};

interface ICharacterPose {
  x: number;
  y: number;
  aimX: number;
  aimY: number;
  step: number;
  grounded: boolean;
  flying: boolean;
  weapon: number;
  recoil: number;
  time: number;
}

export const drawCharacterModel = (
  ctx: CanvasRenderingContext2D,
  pose: ICharacterPose,
) => {
  const { x, y, aimX, aimY, grounded, flying, step, weapon, recoil, time } =
    pose;
  const facing = aimX >= x ? 1 : -1;
  const stride = grounded ? Math.sin(step) * 10 : 5;
  const bob = grounded
    ? Math.abs(Math.sin(step)) * 1.5
    : Math.sin(time * 0.004);
  const limb = (points: number[], width: number, color: string) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const [lineWidth, stroke] of [
      [width + 3, p.ink],
      [width, color],
    ] as const) {
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = stroke;
      ctx.beginPath();
      ctx.moveTo(points[0], points[1]);
      for (let i = 2; i < points.length; i += 2) {
        ctx.lineTo(points[i], points[i + 1]);
      }
      ctx.stroke();
    }
  };
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.ellipse(0, 2, 18, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  limb([-3, -19, -6 + stride * 0.5, -9, -9 + stride, -1], 6, p.armor);
  limb([3, -19, 6 - stride * 0.5, -9, 9 - stride, -1], 6, p.armorLight);
  ctx.fillStyle = p.ink;
  ctx.fillRect(-14 + stride, -3, 12, 5);
  ctx.fillRect(4 - stride, -3, 12, 5);
  // Реактивный ранец и два сопла.
  ctx.fillStyle = p.ink;
  ctx.beginPath();
  ctx.roundRect(-facing * 13 - 5, -40, 11, 23, 4);
  ctx.fill();
  ctx.fillStyle = p.armor;
  ctx.fillRect(-facing * 13 - 3, -37, 7, 16);
  if (flying) {
    const flame = 12 + Math.random() * 14;
    const glow = ctx.createRadialGradient(
      -facing * 13,
      -12,
      1,
      -facing * 13,
      -12,
      30,
    );
    glow.addColorStop(0, "#75f4ff88");
    glow.addColorStop(1, "#75f4ff00");
    ctx.fillStyle = glow;
    ctx.fillRect(-facing * 13 - 30, -37, 60, 60);
    ctx.fillStyle = p.cyan;
    ctx.beginPath();
    ctx.moveTo(-facing * 13 - 4, -18);
    ctx.lineTo(-facing * 13, -18 + flame);
    ctx.lineTo(-facing * 13 + 4, -18);
    ctx.fill();
    ctx.fillStyle = p.white;
    ctx.fillRect(-facing * 13 - 2, -18, 4, 9);
  }
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.scale(facing, 1);
  if (gallerySprites.hero.complete && gallerySprites.hero.naturalWidth) {
    ctx.drawImage(gallerySprites.hero, -31, -64, 64, 64);
  }
  ctx.restore();
  const angle = Math.atan2(aimY - (y - 32), aimX - x);
  limb(
    [
      -facing * 6,
      -36,
      -facing * 8,
      -25,
      Math.cos(angle) * 12,
      -32 + Math.sin(angle) * 12,
    ],
    5,
    p.armor,
  );
  limb(
    [facing * 5, -36, Math.cos(angle) * 19, -32 + Math.sin(angle) * 19],
    5,
    p.armorLight,
  );
  ctx.translate(
    Math.cos(angle) * 16 - Math.cos(angle) * recoil * 4,
    -32 + Math.sin(angle) * 16,
  );
  ctx.rotate(angle);
  if (facing < 0) {
    ctx.scale(1, -1);
  }
  drawWeaponModel(ctx, weapon, time);
  ctx.restore();
};

export const drawSpaceBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  cameraX: number,
) => {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, p.sky);
  sky.addColorStop(1, p.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  const nebula = ctx.createRadialGradient(
    width * 0.72,
    height * 0.2,
    0,
    width * 0.72,
    height * 0.2,
    width * 0.55,
  );
  nebula.addColorStop(0, "#6b47793b");
  nebula.addColorStop(1, "#080e2000");
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 100; i++) {
    const x =
      ((((Math.sin(i * 127.1) * 43758.5453) % 1) + 1) * width -
        cameraX * ((i % 3) + 1) * 0.012 +
        width) %
      width;
    const y =
      ((((Math.cos(i * 311.7) * 26912.13) % 1) + 1) * height * 0.8) %
      (height * 0.8);
    ctx.globalAlpha = 0.35 + Math.sin(time * 0.0008 + i) * 0.2;
    ctx.fillStyle = i % 4 ? p.white : p.cyan;
    ctx.fillRect(x, y, i % 5 ? 1 : 2, i % 5 ? 1 : 2);
  }
  ctx.globalAlpha = 1;
  // Планета с кольцами, дальние горы и силуэты цеха на горизонте.
  ctx.save();
  ctx.translate(width * 0.82 - cameraX * 0.025, height * 0.26);
  const planet = ctx.createRadialGradient(-12, -18, 1, 0, 0, 65);
  planet.addColorStop(0, "#8299b9");
  planet.addColorStop(1, "#263650");
  ctx.fillStyle = planet;
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#9eb4d44d";
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.ellipse(0, 2, 83, 14, -0.35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  for (let layer = 0; layer < 3; layer++) {
    const baseY = height * (0.65 + layer * 0.1);
    ctx.fillStyle = ["#263650", "#1a2941", "#111d32"][layer];
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width + 80; x += 40) {
      const ridge =
        Math.sin((x + cameraX * 0.06 * (layer + 1)) * 0.012 + layer) * 45 +
        Math.cos(x * 0.027 + layer) * 20;
      ctx.lineTo(x, baseY + ridge);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#0c1628";
  for (let i = 0; i < 18; i++) {
    const x = i * (width / 16) - cameraX * 0.07;
    const towerHeight = 30 + ((i * 17) % 55);
    ctx.fillRect(x, height - 18 - towerHeight, 25 + (i % 3) * 9, towerHeight);
    ctx.fillStyle = "#75f4ff40";
    ctx.fillRect(x + 6, height - 12 - towerHeight, 4, 3);
    ctx.fillStyle = "#0c1628";
  }
  ctx.fillStyle = "#091321";
  ctx.fillRect(0, height - 15, width, 15);
  ctx.strokeStyle = "#75f4ff55";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height - 15);
  ctx.lineTo(width, height - 15);
  ctx.stroke();
  if (gallerySprites.ship.complete && gallerySprites.ship.naturalWidth) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 0.7;
    const shipX = width - ((time * 0.025) % (width + 140));
    ctx.drawImage(gallerySprites.ship, shipX, height * 0.15, 96, 96);
    ctx.restore();
  }
};
