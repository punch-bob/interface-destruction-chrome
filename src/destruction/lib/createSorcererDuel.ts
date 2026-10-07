import { containsBeamCut, type IBeamCut } from "./beamCuts";
import { intersectsBeam } from "./beamGeometry";
import { createSukunaSprites } from "./sukunaModel";
import { createSukunaShrine } from "./sukunaShrine";

export interface IDuelHud {
  status: "idle" | "fighting" | "victory" | "defeat";
  health: number;
  bossHealth: number;
  infinity: number;
  infinityCooldown: number;
  domain: number;
  domainCooldown: number;
  technique: string;
  phase: number;
}
export const initialDuelHud: IDuelHud = {
  status: "idle",
  health: 240,
  bossHealth: 1800,
  infinity: 0,
  infinityCooldown: 0,
  domain: 0,
  domainCooldown: 0,
  technique: "",
  phase: 1,
};
type Cue =
  | "infinity"
  | "void"
  | "slash"
  | "furnace"
  | "shrine"
  | "hit"
  | "victory";
interface IBody {
  x: number;
  y: number;
}
interface IShot extends IBeamCut {
  age: number;
  life: number;
  speed: number;
  length: number;
  kind: "slash" | "flame";
  hit: boolean;
  stopped: boolean;
}
interface IFragmentBody extends IBody {
  centerX: number;
  centerY: number;
  vx: number;
  vy: number;
  infinityVelocity?: { vx: number; vy: number };
}
interface IOptions {
  hud: (value: IDuelHud) => void;
  cue: (kind: Cue) => void;
  cut: (beam: IBeamCut) => void;
  explode: (x: number, y: number, radius: number) => void;
}
const clamp = (v: number, low: number, high: number) =>
  Math.max(low, Math.min(high, v));
const TAU = Math.PI * 2;

export const createSorcererDuel = (options: IOptions) => {
  let hud = { ...initialDuelHud },
    boss = { x: 0, y: 0, vx: 0, hurt: 0 };
  let shots: IShot[] = [],
    enabled = false,
    age = 0,
    hudClock = 0,
    lastHud = "";
  let infinityTime = 0,
    infinityCooldown = 0,
    voidTime = 0,
    voidCast = 0,
    voidCooldown = 0;
  let shrineTime = 0,
    shrineTick = 0,
    shrineCooldown = 12,
    clash = 0;
  let attackClock = 1.6,
    cast:
      | {
          kind:
            | "slash"
            | "cleave"
            | "amplification"
            | "flame"
            | "shrine"
            | "heal";
          remaining: number;
          total: number;
          x: number;
          y: number;
        }
      | undefined;
  let dismantled = false,
    cleaved = false,
    attackNumber = 0,
    invulnerability = 0,
    healed = false;
  let player: IBody = { x: 90, y: 800 },
    width = 1440,
    height = 900;
  const sprites = createSukunaSprites(),
    shrine = createSukunaShrine();
  const publish = (force = false) => {
    const value = {
      ...hud,
      health: Math.ceil(hud.health),
      bossHealth: Math.ceil(hud.bossHealth),
      infinity: Math.ceil(infinityTime),
      infinityCooldown: Math.ceil(infinityCooldown),
      domain: Math.ceil(voidTime || voidCast),
      domainCooldown: Math.ceil(voidCooldown),
    };
    const serialized = JSON.stringify(value);
    if (force || serialized !== lastHud) {
      options.hud(value);
      lastHud = serialized;
    }
  };
  const finish = (status: "victory" | "defeat") => {
    hud.status = status;
    cast = undefined;
    shots = [];
    shrineTime = 0;
    voidTime = 0;
    voidCast = 0;
    hud.technique =
      status === "victory"
        ? "Король проклятий повержен"
        : "Сукуна победил · попробуй снова";
    if (status === "victory") options.cue("victory");
    publish(true);
  };
  const damageBoss = (amount: number) => {
    if (hud.status !== "fighting") return;
    hud.bossHealth = Math.max(0, hud.bossHealth - amount);
    boss.hurt = 0.18;
    if (hud.bossHealth <= 0) finish("victory");
  };
  const hitPlayer = (amount: number, bypass = false) => {
    if (
      hud.status !== "fighting" ||
      invulnerability > 0 ||
      (!bypass && infinityTime > 0)
    )
      return;
    hud.health = Math.max(0, hud.health - amount);
    invulnerability = 0.55;
    options.cue("hit");
    if (!hud.health) finish("defeat");
  };
  const spawnShot = (kind: "slash" | "flame", target: IBody) => {
    const x = boss.x,
      y = boss.y - 52,
      angle = Math.atan2(target.y - y, target.x - x);
    shots.push({
      x,
      y,
      endX: Math.cos(angle),
      endY: Math.sin(angle),
      radius: kind === "flame" ? 22 : 7,
      age: 0,
      life: 2.8,
      speed: kind === "flame" ? 410 : 720,
      length: 0,
      kind,
      hit: false,
      stopped: false,
    });
    options.cue(kind === "flame" ? "furnace" : "slash");
    if (kind === "slash") dismantled = true;
  };
  const activateInfinity = () => {
    if (!enabled || infinityCooldown > 0 || hud.status === "defeat") return;
    infinityTime = 6;
    infinityCooldown = 13;
    options.cue("infinity");
    publish(true);
  };
  const expandVoid = () => {
    if (!enabled || voidCooldown > 0 || voidCast > 0 || hud.status === "defeat")
      return;
    voidCast = 0.9;
    voidCooldown = 24;
    options.cue("void");
    publish(true);
  };
  const start = () => {
    if (!enabled) return;
    hud = {
      ...initialDuelHud,
      status: "fighting",
      technique: "Рёмен Сукуна · Король проклятий",
    };
    boss = {
      x: clamp(width - 170, 60, width - 35),
      y: height - 15,
      vx: 0,
      hurt: 0,
    };
    shots = [];
    cast = undefined;
    attackClock = 1.8;
    attackNumber = 0;
    age = 0;
    healed = false;
    shrineTime = 0;
    shrineCooldown = 12;
    voidTime = 0;
    voidCast = 0;
    voidCooldown = 0;
    infinityTime = 0;
    infinityCooldown = 0;
    invulnerability = 0;
    dismantled = false;
    cleaved = false;
    clash = 0;
    publish(true);
  };
  const beginCast = (
    kind: NonNullable<typeof cast>["kind"],
    duration: number,
  ) => {
    cast = {
      kind,
      remaining: duration,
      total: duration,
      x: player.x,
      y: player.y - 42,
    };
    hud.technique = {
      slash: "Разбор · Dismantle",
      cleave: "Рассечение · Cleave",
      amplification: "Усиление территории · ближний удар",
      flame: "Фуга · Божественное пламя",
      shrine: "Расширение территории · Зловещее святилище",
      heal: "Обратная проклятая техника",
    }[kind];
    if (kind === "shrine") options.cue("shrine");
  };
  const step = (
    dt: number,
    body: IBody,
    w: number,
    h: number,
    blue: ReadonlyArray<{
      x: number;
      y: number;
      radius: number;
      blue?: boolean;
    }>,
  ) => {
    player = body;
    width = w;
    height = h;
    if (!enabled) return;
    age += dt;
    boss.hurt = Math.max(0, boss.hurt - dt);
    invulnerability = Math.max(0, invulnerability - dt);
    infinityTime = Math.max(0, infinityTime - dt);
    infinityCooldown = Math.max(0, infinityCooldown - dt);
    voidCooldown = Math.max(0, voidCooldown - dt);
    clash = Math.max(0, clash - dt);
    if (voidCast > 0) {
      voidCast = Math.max(0, voidCast - dt);
      if (voidCast === 0) {
        voidTime = 5;
        hud.technique = "Неограниченная пустота";
      }
    }
    if (voidTime > 0) voidTime = Math.max(0, voidTime - dt);
    if (voidTime > 0 && shrineTime > 0) {
      voidTime = 0;
      shrineTime = 0;
      cast = undefined;
      clash = 1.4;
      attackClock = 2;
      hud.technique = "Столкновение территорий";
      options.cue("void");
    }
    if (hud.status === "fighting") {
      hud.phase = hud.bossHealth < 900 ? 2 : 1;
      for (const field of blue) {
        if (!field.blue) continue;
        const dx = field.x - boss.x,
          dy = field.y - (boss.y - 42),
          distance = Math.hypot(dx, dy);
        if (distance < field.radius) {
          const pull = Math.min(1, dt * 1.7);
          boss.x += dx * pull;
          boss.y += dy * pull;
          damageBoss(dt * 68);
        }
      }
      if (hud.status === "fighting" && voidTime === 0 && clash === 0) {
        shrineCooldown -= dt;
        if (shrineTime > 0) {
          shrineTime = Math.max(0, shrineTime - dt);
          shrineTick -= dt;
          if (shrineTick <= 0) {
            shrineTick = 0.32;
            const angle = age * 2.399,
              range = Math.min(width, height) * 0.46;
            options.cut({
              x: boss.x - Math.cos(angle) * range,
              y: boss.y - 55 - Math.sin(angle) * range,
              endX: boss.x + Math.cos(angle) * range,
              endY: boss.y - 55 + Math.sin(angle) * range,
              radius: 3,
            });
            if (Math.hypot(player.x - boss.x, player.y - boss.y) < range)
              hitPlayer(14, true);
          }
        }
        if (!cast) {
          const dx = player.x - boss.x,
            distance = Math.abs(dx);
          boss.vx = Math.sign(dx) * Math.min(185, distance * 1.6);
          if (distance > 105) boss.x += boss.vx * dt;
          boss.y +=
            (clamp(player.y, 100, height - 15) - boss.y) *
            Math.min(1, dt * 1.6);
          attackClock -= dt;
          if (attackClock <= 0) {
            attackNumber++;
            if (shrineCooldown <= 0) beginCast("shrine", 1.3);
            else if (hud.phase === 2 && !healed && hud.bossHealth < 650)
              beginCast("heal", 1.7);
            else if (dismantled && cleaved && attackNumber % 4 === 0)
              beginCast("flame", 1.3);
            else if (infinityTime > 0 && distance < 210)
              beginCast("amplification", 1);
            else if (distance < 165 || attackNumber % 3 === 0)
              beginCast("cleave", 0.85);
            else beginCast("slash", 0.65);
          }
        } else {
          if (cast.kind === "cleave" || cast.kind === "amplification") {
            boss.x += (cast.x - boss.x) * Math.min(1, dt * 5);
            boss.y += (cast.y + 42 - boss.y) * Math.min(1, dt * 5);
          }
          cast.remaining -= dt;
          if (cast.remaining <= 0) {
            const completed = cast;
            cast = undefined;
            attackClock = hud.phase === 2 ? 1.3 : 1.9;
            if (completed.kind === "slash") spawnShot("slash", completed);
            else if (completed.kind === "flame") spawnShot("flame", completed);
            else if (completed.kind === "amplification") {
              options.cue("hit");
              if (Math.hypot(player.x - boss.x, player.y - boss.y) < 125)
                hitPlayer(28, true);
            } else if (completed.kind === "cleave") {
              cleaved = true;
              options.cue("slash");
              options.cut({
                x: boss.x - 60,
                y: boss.y - 95,
                endX: boss.x + 60,
                endY: boss.y - 5,
                radius: 6,
              });
              if (Math.hypot(player.x - boss.x, player.y - boss.y) < 125)
                hitPlayer(32);
            } else if (completed.kind === "heal") {
              hud.bossHealth = Math.min(1800, hud.bossHealth + 250);
              healed = true;
            } else {
              shrineTime = 5;
              shrineTick = 0;
              shrineCooldown = 22;
            }
          }
        }
      }
      boss.x = clamp(boss.x, 35, width - 35);
      boss.y = clamp(boss.y, 95, height - 15);
    }
    // At most a few hostile projectiles: swept collision also catches fast crossing hits.
    shots = shots.filter((shot) => {
      shot.age += dt;
      shot.life -= dt;
      if (shot.life <= 0) return false;
      if (clash > 0) return true;
      const oldX = shot.x,
        oldY = shot.y;
      if (!shot.stopped) {
        shot.x += shot.endX * shot.speed * dt;
        shot.y += shot.endY * shot.speed * dt;
      }
      const distance = Math.hypot(shot.x - player.x, shot.y - (player.y - 42));
      if (
        infinityTime > 0 &&
        (distance < 100 ||
          containsBeamCut(
            {
              x: oldX,
              y: oldY,
              endX: shot.x,
              endY: shot.y,
              radius: 98 + shot.radius,
            },
            player.x,
            player.y - 42,
          ))
      ) {
        const dx = shot.x - player.x,
          dy = shot.y - player.y + 42,
          len = Math.hypot(dx, dy) || 1;
        shot.x = player.x + (dx / len) * 98;
        shot.y = player.y - 42 + (dy / len) * 98;
        shot.stopped = true;
        shot.life = Math.min(shot.life, 0.65);
        return true;
      }
      if (shot.stopped) {
        shot.stopped = false;
      }
      if (
        intersectsBeam(
          new DOMRect(player.x - 17, player.y - 86, 34, 80),
          oldX,
          oldY,
          shot.x,
          shot.y,
          shot.radius,
        )
      ) {
        hitPlayer(shot.kind === "flame" ? 48 : 24);
        if (shot.kind === "flame") options.explode(shot.x, shot.y, 140);
        else
          options.cut({
            x: oldX - shot.endX * 90,
            y: oldY - shot.endY * 90,
            endX: shot.x + shot.endX * 90,
            endY: shot.y + shot.endY * 90,
            radius: 5,
          });
        return false;
      }
      shot.length += shot.speed * dt;
      if (!shot.hit && shot.length >= 170) {
        shot.hit = true;
        if (shot.kind === "slash")
          options.cut({
            x: oldX - shot.endX * 150,
            y: oldY - shot.endY * 150,
            endX: shot.x + shot.endX * 180,
            endY: shot.y + shot.endY * 180,
            radius: 4,
          });
      }
      if (shot.x < 0 || shot.x > w || shot.y < 45 || shot.y > h) {
        if (shot.kind === "flame")
          options.explode(clamp(shot.x, 0, w), clamp(shot.y, 45, h), 140);
        return false;
      }
      return true;
    });
    if (hud.status === "victory" || hud.status === "defeat") shots = [];
    hudClock += dt;
    if (hudClock >= 0.1) {
      hudClock = 0;
      publish();
    }
  };
  const holdFragment = (piece: IFragmentBody) => {
    const restore = () => {
      if (piece.infinityVelocity) {
        piece.vx = piece.infinityVelocity.vx;
        piece.vy = piece.infinityVelocity.vy;
        piece.infinityVelocity = undefined;
      }
      return false;
    };
    if (!enabled || infinityTime <= 0) return restore();
    const dx = piece.x + piece.centerX - player.x,
      dy = piece.y + piece.centerY - (player.y - 42),
      distance = Math.hypot(dx, dy);
    if (
      !piece.infinityVelocity &&
      (distance > 104 || dx * piece.vx + dy * piece.vy >= 0)
    )
      return false;
    piece.infinityVelocity ??= { vx: piece.vx, vy: piece.vy };
    piece.x = player.x + (dx / (distance || 1)) * 102 - piece.centerX;
    piece.y = player.y - 42 + (dy / (distance || 1)) * 102 - piece.centerY;
    piece.vx = 0;
    piece.vy = 0;
    return true;
  };
  const drawBackground = (c: CanvasRenderingContext2D, time: number) => {
    if (!enabled) return;
    const t = time * 0.001;
    c.save();
    if (voidTime > 0 || voidCast > 0) {
      const strength =
        voidTime > 0 ? Math.min(1, voidTime * 2) : 1 - voidCast / 0.9;
      c.fillStyle = `rgba(3,5,22,${strength * 0.94})`;
      c.fillRect(0, 0, width, height);
      c.translate(width / 2, height / 2);
      c.strokeStyle = "#69d6ff";
      for (let i = 0; i < 7; i++) {
        c.globalAlpha = strength * (0.5 - i * 0.05);
        c.lineWidth = i === 0 ? 3 : 1;
        c.beginPath();
        c.ellipse(0, 0, 50 + i * 65, 20 + i * 28, t * 0.15 + i * 0.4, 0, TAU);
        c.stroke();
      }
      for (let i = 0; i < 96; i++) {
        const x = Math.sin(i * 127.1) * width * 0.6,
          y = Math.cos(i * 311.7) * height * 0.6;
        c.globalAlpha = strength * (0.3 + 0.7 * Math.sin(t + i) ** 2);
        c.fillStyle = i % 3 ? "#c9e8ff" : "#8d70ff";
        c.fillRect(x, y, i % 9 === 0 ? 3 : 1, i % 9 === 0 ? 3 : 1);
      }
      // Preserve the engine's shake/dpr transform after drawing the domain background.
      c.restore();
      c.save();
    }
    if (shrineTime > 0 || cast?.kind === "shrine") {
      c.globalAlpha = shrineTime > 0 ? 0.8 : 0.35;
      c.fillStyle = "#5b092f";
      c.fillRect(0, 0, width, height);
      c.globalAlpha = 0.9;
      c.imageSmoothingEnabled = false;
      c.drawImage(
        shrine,
        boss.x - 180,
        Math.min(height - 340, boss.y - 320),
        360,
        340,
      );
      c.strokeStyle = "#ff526a";
      c.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const angle = t * 0.6 + (i * Math.PI) / 4;
        c.beginPath();
        c.moveTo(boss.x, boss.y - 48);
        c.lineTo(
          boss.x + Math.cos(angle) * Math.max(width, height),
          boss.y - 48 + Math.sin(angle) * Math.max(width, height),
        );
        c.stroke();
      }
      c.globalAlpha = 1;
    }
    if (clash > 0) {
      c.fillStyle = `rgba(240,218,255,${(clash / 1.4) * 0.35})`;
      c.fillRect(0, 0, width, height);
      c.strokeStyle = "#d9b7ff";
      c.lineWidth = 5;
      c.beginPath();
      c.arc(width / 2, height / 2, (1.4 - clash) * 500, 0, TAU);
      c.stroke();
    }
    c.restore();
  };
  const draw = (c: CanvasRenderingContext2D, time: number) => {
    if (!enabled) return;
    const t = time * 0.001;
    c.save();
    if (infinityTime > 0) {
      c.save();
      c.translate(player.x, player.y - 42);
      c.strokeStyle = "#99eaff";
      for (let i = 0; i < 4; i++) {
        c.globalAlpha = 0.18 + i * 0.15;
        c.lineWidth = 1 + i * 0.5;
        c.beginPath();
        c.ellipse(
          0,
          0,
          98 + i * 2,
          82 + i * 3,
          t * (i % 2 ? 0.3 : -0.3),
          0,
          TAU,
        );
        c.stroke();
      }
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU + t * 0.3;
        c.fillStyle = "#e5faff";
        c.fillRect(Math.cos(a) * 103, Math.sin(a) * 90, 2, 2);
      }
      c.restore();
    }
    for (const shot of shots) {
      c.save();
      c.translate(shot.x, shot.y);
      c.rotate(Math.atan2(shot.endY, shot.endX));
      c.strokeStyle = shot.kind === "flame" ? "#ffb03b" : "#ff4063";
      c.lineWidth = shot.kind === "flame" ? 16 : 4;
      c.beginPath();
      c.moveTo(-45, 0);
      c.lineTo(20, 0);
      c.stroke();
      c.strokeStyle = "#fff1da";
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-30, 0);
      c.lineTo(18, 0);
      c.stroke();
      if (shot.kind === "flame") {
        c.fillStyle = "#ffd581";
        c.beginPath();
        c.moveTo(30, 0);
        c.lineTo(4, -14);
        c.lineTo(4, 14);
        c.fill();
      }
      c.restore();
    }
    if (hud.status !== "idle") {
      c.save();
      c.translate(
        boss.x,
        boss.y +
          (hud.status === "fighting" && !cast && voidTime === 0
            ? Math.sin(t * 13) * Math.min(2, Math.abs(boss.vx) / 80)
            : 0),
      );
      const facing = player.x >= boss.x ? 1 : -1;
      c.scale(facing, 1);
      c.imageSmoothingEnabled = false;
      c.globalAlpha = hud.status === "victory" ? 0.35 : 1;
      c.drawImage(sprites[hud.phase - 1][cast ? 1 : 0], -40, -110, 80, 110);
      c.restore();
      if (boss.hurt > 0) {
        c.strokeStyle = "#fff0d6";
        c.lineWidth = 2;
        c.strokeRect(boss.x - 28, boss.y - 94, 56, 84);
      }
      if (cast) {
        const ratio = 1 - cast.remaining / cast.total;
        c.strokeStyle =
          cast.kind === "heal"
            ? "#84f9c9"
            : cast.kind === "flame"
              ? "#ffc066"
              : "#ff4968";
        c.lineWidth = 3;
        c.beginPath();
        c.arc(
          boss.x,
          boss.y - 52,
          38 + ratio * 22,
          -Math.PI / 2,
          -Math.PI / 2 + ratio * TAU,
        );
        c.stroke();
        if (cast.kind === "slash" || cast.kind === "flame") {
          c.globalAlpha = 0.3 + ratio * 0.6;
          c.setLineDash([8, 8]);
          c.beginPath();
          c.moveTo(boss.x, boss.y - 52);
          c.lineTo(cast.x, cast.y);
          c.stroke();
          c.setLineDash([]);
          c.globalAlpha = 1;
        }
        if (cast.kind === "cleave" || cast.kind === "amplification") {
          c.globalAlpha = 0.25;
          c.fillStyle = "#fa3d64";
          c.beginPath();
          c.arc(cast.x, cast.y, 110, 0, TAU);
          c.fill();
          c.globalAlpha = 1;
        }
      }
    }
    if (invulnerability > 0) {
      c.globalAlpha = invulnerability * 0.18;
      c.fillStyle = "#ff264e";
      c.fillRect(0, 0, width, height);
    }
    c.restore();
  };
  return {
    step,
    draw,
    drawBackground,
    holdFragment,
    start,
    activateInfinity,
    expandVoid,
    get active() {
      return (
        enabled &&
        (hud.status !== "idle" ||
          voidTime > 0 ||
          voidCast > 0 ||
          infinityTime > 0)
      );
    },
    get defeated() {
      return hud.status === "defeat";
    },
    get fighting() {
      return hud.status === "fighting";
    },
    contains: (x: number, y: number, radius = 0) =>
      hud.status === "fighting" &&
      x >= boss.x - 28 - radius &&
      x <= boss.x + 28 + radius &&
      y >= boss.y - 105 - radius &&
      y <= boss.y + radius,
    beam: (beam: IBeamCut) => {
      if (
        hud.status === "fighting" &&
        intersectsBeam(
          new DOMRect(boss.x - 25, boss.y - 100, 50, 100),
          beam.x,
          beam.y,
          beam.endX,
          beam.endY,
          beam.radius,
        )
      )
        damageBoss(310);
    },
    red: (x: number, y: number) => {
      const dx = boss.x - x,
        dy = boss.y - 45 - y,
        d = Math.hypot(dx, dy);
      if (d < 240) {
        damageBoss(145 * (1 - d / 420));
        boss.x = clamp(boss.x + (dx / (d || 1)) * 100, 35, width - 35);
      }
    },
    setEnabled: (value: boolean) => {
      enabled = value;
      hud = { ...initialDuelHud };
      shots = [];
      cast = undefined;
      voidTime = 0;
      voidCast = 0;
      infinityTime = 0;
      infinityCooldown = 0;
      voidCooldown = 0;
      shrineTime = 0;
      clash = 0;
      publish(true);
    },
  };
};
