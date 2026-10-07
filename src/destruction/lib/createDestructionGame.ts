import { createSorcererDuel, type IDuelHud } from "./createSorcererDuel";
import {
  beamCutVerticalRange,
  containsBeamCut,
  type IBeamCut,
} from "./beamCuts";
import { createWeaponAudio } from "./createWeaponAudio";
import {
  drawGojo,
  getGojoCastOrigin,
  drawTechniqueOrb,
  drawRedImpact,
  drawPurpleBeam,
} from "./drawGojo";
import {
  containsFracturePoint,
  fractureSurfaceY,
  intersectsFractureBeam,
  splitPanel,
  type IFracturePoint,
} from "./panelFracture";
import { drawAcidPool } from "./drawAcid";
import { drawDrone, type IDrone } from "./drawDrone";
import { drawBlackHole } from "./drawBlackHole";
import { intersectsBeam } from "./beamGeometry";
import {
  drawNuclearBomb,
  drawNuclearExplosion,
  type INuclearExplosion,
} from "./drawNuclearExplosion";
import { colors } from "../constants/colors";

import {
  collectBorders,
  getBorderRect,
  type IBorderPart,
} from "./borderTargets";
import {
  createInterfaceLayer,
  getElementBackground,
  type IInterfaceDamage,
} from "./createInterfaceLayer";
import { drawCharacterModel, drawSpaceBackground } from "./drawGameModels";
import {
  collectLetters,
  createFlyingLetter,
  getLetterRect,
  type ILetter,
  removeText,
} from "./letterTargets";
import { gamePalette } from "../constants/palette";

interface ITarget {
  element: HTMLElement | SVGElement;
  rect: DOMRect;
  health: number;
  destroyed: boolean;
  letter?: ILetter;
  cell: boolean;
  surfaceRect?: DOMRect;
  shape?: IFracturePoint[];
  fractureGroup?: { parts: ITarget[] };
  surfacePart?: { left: number; top: number; right: number; bottom: number };
  border?: IBorderPart;
  beamCuts?: Set<string>;
}

interface IProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  damage: number;
  blastRadius: number;
  gravity: number;
  color: string;
  size: number;
  hitTargets: Set<ITarget>;
  penetration: number;
  remainingRange?: number;
  nuclear?: boolean;
  acid?: boolean;
  acidDrop?: boolean;
  acidDrips?: number;
  dripClock?: number;
  blackHole?: boolean;
  gojoBlue?: boolean;
  gojoRed?: boolean;
  destination?: { x: number; y: number };
}

interface IParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  kind: "spark" | "smoke" | "shell";
  size: number;
}

interface IFragment {
  element: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  life: number;
  centerX: number;
  centerY: number;
  radius: number;
  mass?: number;
  infinityVelocity?: { vx: number; vy: number };
  orbit?: { holeId: number; angle: number; distance: number };
  repulsion?: number;
}

interface IGameOptions {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  background: HTMLCanvasElement;
  scene: HTMLDivElement;
  fragments: HTMLDivElement;
  onProgress: (progress: number) => void;
  onPause: (paused: boolean) => void;
  onWeapon: (weapon: number) => void;
  onMode: (gojo: boolean) => void;
  onCinematic: (active: boolean) => void;
  onDrone: (active: boolean) => void;
  onDuel: (hud: IDuelHud) => void;
}

const TARGET_SELECTOR = [
  "button",
  "input",
  "textarea",
  "select",
  "img",
  "svg",
  "td",
  "th",
  '[role="cell"]',
  '[role="columnheader"]',
  '[role="button"]',
  '[role="tab"]',
  '[role="treeitem"]',
].join(",");
const GRAVITY = 1000;
const MAX_FRAGMENTS = 120;

const WEAPONS = [
  {
    speed: 1100,
    life: 2,
    cooldown: 0.14,
    pellets: 1,
    spread: 0,
    damage: 1,
    blastRadius: 0,
    gravity: 0,
    color: colors.G600,
    size: 3,
  },
  {
    speed: 950,
    life: 0.7,
    cooldown: 0.55,
    pellets: 8,
    spread: 0.08,
    damage: 1,
    blastRadius: 0,
    gravity: 0,
    color: colors.O500,
    size: 3,
  },
  {
    speed: 1300,
    life: 2,
    cooldown: 0.055,
    pellets: 1,
    spread: 0.045,
    damage: 1,
    blastRadius: 0,
    gravity: 0,
    color: colors.G600,
    size: 2,
  },
  {
    speed: 3000,
    life: 2,
    cooldown: 0.7,
    pellets: 1,
    spread: 0,
    damage: 12,
    penetration: 24,
    blastRadius: 0,
    gravity: 0,
    color: gamePalette.white,
    size: 4,
  },
  {
    speed: 450,
    life: 0.38,
    cooldown: 0.045,
    pellets: 3,
    spread: 0.18,
    damage: 1,
    blastRadius: 0,
    gravity: -80,
    color: colors.O500,
    size: 7,
  },
  {
    speed: 650,
    life: 3,
    cooldown: 0.7,
    pellets: 1,
    spread: 0,
    damage: 5,
    blastRadius: 135,
    gravity: 0,
    color: colors.O500,
    size: 6,
  },
  {
    speed: 520,
    life: 1.5,
    cooldown: 0.55,
    pellets: 1,
    spread: 0,
    damage: 5,
    blastRadius: 160,
    gravity: 650,
    color: colors.G600,
    size: 6,
  },
  {
    speed: 0,
    life: 0,
    cooldown: 0,
    pellets: 0,
    spread: 0,
    damage: 14,
    blastRadius: 0,
    gravity: 0,
    color: gamePalette.cyan,
    size: 6,
  },
  {
    speed: 720,
    life: 3,
    cooldown: 9,
    pellets: 1,
    spread: 0,
    damage: 100,
    blastRadius: 600,
    gravity: 0,
    color: "#ffd65c",
    size: 10,
  },
  {
    speed: 650,
    life: 3,
    cooldown: 2.8,
    pellets: 1,
    spread: 0,
    damage: 0,
    blastRadius: 1,
    gravity: 0,
    color: "#ba83ff",
    size: 9,
  },
  {
    speed: 700,
    life: 1.4,
    cooldown: 0.45,
    pellets: 1,
    spread: 0.035,
    damage: 0,
    blastRadius: 0,
    gravity: 120,
    color: "#a2f54b",
    size: 6,
  },
];

/** Временная визуальная игра: исходные DOM-узлы остаются на месте, разрушается визуальная копия. */
export const createDestructionGame = ({
  root,
  canvas,
  background,
  scene,
  fragments,
  onProgress,
  onPause,
  onWeapon,
  onMode,
  onCinematic,
  onDrone,
  onDuel,
}: IGameOptions) => {
  const context = canvas.getContext("2d");
  if (!context) {
    return undefined;
  }
  const ctx = context;
  const backgroundCtx = background.getContext("2d");
  let width = window.innerWidth;
  let height = window.innerHeight;
  let frame = 0;
  let previousTime = performance.now();
  let paused = false;
  let weapon = 1;
  let gojoMode = false;
  let castTimer = 0;
  let redImpacts: Array<{ x: number; y: number; age: number; radius: number }> =
    [];
  const gojoWeapons = [10, 6, 8];
  let shooting = false;
  let cooldown = 0;
  let destroyedCount = 0;
  let screenShake = 0;
  let recoil = 0;
  let laser:
    | { x: number; y: number; endX: number; endY: number; radius: number }
    | undefined;
  let purpleShot:
    | {
        age: number;
        angle: number;
        beam?: NonNullable<typeof laser>;
      }
    | undefined;
  let laserCharge = 0;
  let laserStroke = 0;
  let lastLaserCutKey = "";
  let drone: IDrone | undefined;
  let stepId = 0;
  const ignitions = new Map<
    ITarget,
    {
      age: number;
      heat: number;
      fuel: number;
      spots: Map<string, { x: number; y: number }>;
    }
  >();
  const flamePatches = new Map<
    string,
    {
      x: number;
      y: number;
      heat: number;
      frame: number;
      age: number;
      fuel: number;
      color: string;
    }
  >();
  const backgroundFlame = document.createElement("canvas");
  backgroundFlame.width = 96;
  backgroundFlame.height = 128;
  const flameContext = backgroundFlame.getContext("2d");
  if (flameContext) {
    const glow = flameContext.createRadialGradient(48, 85, 2, 48, 64, 56);
    glow.addColorStop(0, "rgba(255,234,131,0.95)");
    glow.addColorStop(0.35, "rgba(255,124,22,0.8)");
    glow.addColorStop(1, "rgba(255,40,0,0)");
    flameContext.fillStyle = glow;
    flameContext.beginPath();
    flameContext.ellipse(48, 64, 36, 58, 0, 0, Math.PI * 2);
    flameContext.fill();
  }
  // Свечение готовится один раз; на границе прожига нет частиц и дорогих теней.
  const smolderGlow = document.createElement("canvas");
  smolderGlow.width = smolderGlow.height = 24;
  const smolderContext = smolderGlow.getContext("2d");
  if (smolderContext) {
    const glow = smolderContext.createRadialGradient(12, 12, 0, 12, 12, 12);
    glow.addColorStop(0, "rgba(255,210,95,0.9)");
    glow.addColorStop(0.2, "rgba(255,110,22,0.65)");
    glow.addColorStop(0.55, "rgba(210,46,8,0.25)");
    glow.addColorStop(1, "rgba(150,25,0,0)");
    smolderContext.fillStyle = glow;
    smolderContext.fillRect(0, 0, 24, 24);
  }
  let acidPoolId = 0;
  let acidPools: Array<{
    id: number;
    x: number;
    y: number;
    age: number;
    radius: number;
    life: number;
    maxRadius: number;
    maxDamage: number;
    doses: Map<ITarget, number>;
  }> = [];
  let blackHoleId = 0;
  let blackHoles: Array<{
    id: number;
    x: number;
    y: number;
    age: number;
    radius: number;
    budget: number;
    cursor: number;
    queue: Array<{ target: ITarget; distance: number }>;
    blue?: boolean;
  }> = [];
  let nuclearBlastId = 0;
  let nuclearBlasts: Array<
    INuclearExplosion & {
      id: number;
      queue?: Array<{ target: ITarget; distance: number }>;
      cursor?: number;
    }
  > = [];
  let shockwaves: Array<{
    x: number;
    y: number;
    radius: number;
    life: number;
  }> = [];
  let flashes: Array<{
    x: number;
    y: number;
    angle: number;
    life: number;
    color: string;
    size: number;
  }> = [];
  const audio = createWeaponAudio();
  const keys = new Set<string>();
  const aim = { x: width * 0.65, y: height * 0.4 };
  const player = { x: 90, y: height - 70, vy: 0, grounded: false, step: 0 };
  let projectiles: IProjectile[] = [];
  let particles: IParticle[] = [];
  let debris: IFragment[] = [];
  let fragmentBudget = MAX_FRAGMENTS;

  // Крупные контейнеры остаются на месте: мишенями становятся видимые элементы интерфейса.
  const candidates = [
    ...root.querySelectorAll<HTMLElement | SVGElement>(TARGET_SELECTOR),
  ].filter((element) => {
    const rect = element.getBoundingClientRect();
    if (
      rect.bottom < 0 ||
      rect.top > height ||
      rect.right < 0 ||
      rect.left > width
    )
      return false;
    const style = getComputedStyle(element);
    return (
      rect.width > 4 &&
      rect.height > 4 &&
      rect.width < width * 0.95 &&
      rect.bottom > 0 &&
      rect.top < height &&
      rect.right > 0 &&
      rect.left < width &&
      style.visibility !== "hidden" &&
      style.display !== "none" &&
      Number(style.opacity) > 0
    );
  });
  const candidateSet = new Set<Element>(candidates);
  const targets: ITarget[] = candidates
    .filter((element) => {
      let parent = element.parentElement;
      while (parent && parent !== root) {
        if (candidateSet.has(parent)) return false;
        parent = parent.parentElement;
      }
      return true;
    })
    .slice(0, 450)
    .flatMap((element): ITarget[] => {
      const rect = element.getBoundingClientRect(),
        cell = element.matches('td, th, [role="cell"], [role="columnheader"]');
      const health = cell
        ? 3
        : Math.min(4, Math.max(1, Math.ceil(rect.width / 180)));
      const columns = Math.min(12, Math.max(1, Math.ceil(rect.width / 96))),
        rows = Math.min(8, Math.max(1, Math.ceil(rect.height / 72)));
      if (columns * rows === 1)
        return [{ element, rect, health, destroyed: false, cell }];
      const parts: ITarget[] = [];
      for (let row = 0; row < rows; row++)
        for (let column = 0; column < columns; column++)
          parts.push({
            element,
            health,
            cell,
            destroyed: false,
            surfaceRect: rect,
            surfacePart: {
              left: column / columns,
              top: row / rows,
              right: (column + 1) / columns,
              bottom: (row + 1) / rows,
            },
            rect: new DOMRect(
              rect.x + (rect.width * column) / columns,
              rect.y + (rect.height * row) / rows,
              rect.width / columns,
              rect.height / rows,
            ),
          });
      return parts;
    });

  const letters = collectLetters(root);
  targets.unshift(
    ...letters.map((letter) => ({
      element: letter.node.parentElement!,
      rect: letter.rect,
      health: 1,
      destroyed: false,
      letter,
      cell: false,
    })),
  );
  const borders = collectBorders(root);
  const borderedElements = new Set<Element>(
    borders.map((border) => border.element),
  );
  targets.unshift(
    ...borders.map((border) => ({
      element: border.element,
      rect: getBorderRect(border),
      health: 1,
      destroyed: false,
      cell: false,
      border,
    })),
  );
  // Связи строятся один раз проходом по предкам, а не contains() по всей матрице мишеней.
  const surfaceLetters = new Map<ITarget, ITarget[]>();
  const surfaceBorders = new Map<ITarget, ITarget[]>();
  const surfacesByElement = new Map<Element, ITarget[]>();
  targets.forEach((target) => {
    if (!target.letter && !target.border) {
      const siblings = surfacesByElement.get(target.element) ?? [];
      siblings.push(target);
      surfacesByElement.set(target.element, siblings);
      surfaceLetters.set(target, []);
      surfaceBorders.set(target, []);
    }
  });
  targets.forEach((target) => {
    if (!target.letter && !target.border) return;
    let parent: Element | null = target.element;
    while (parent) {
      const surfaces = surfacesByElement.get(parent);
      if (surfaces) {
        const x = target.rect.x + target.rect.width / 2,
          y = target.rect.y + target.rect.height / 2;
        const surface = surfaces.find(
          (p) =>
            x >= p.rect.left &&
            x <= p.rect.right &&
            y >= p.rect.top &&
            y <= p.rect.bottom,
        );
        if (surface)
          (target.letter ? surfaceLetters : surfaceBorders)
            .get(surface)
            ?.push(target);
        break;
      }
      parent = parent.parentElement;
    }
  });
  const interfaceLayer = createInterfaceLayer(root, scene);
  const burns = new Map<
    string,
    {
      x: number;
      y: number;
      radius: number;
      color: string;
      heat: number;
      endX?: number;
      endY?: number;
    }
  >();
  const targetContains = (
    target: ITarget,
    x: number,
    y: number,
    ignoreCuts = false,
  ) =>
    (!target.shape ||
      containsFracturePoint(
        target.shape,
        (x - target.rect.x) / target.rect.width,
        (y - target.rect.y) / target.rect.height,
      )) &&
    (ignoreCuts ||
      !target.beamCuts ||
      !nearbyBurns(x, y).some(
        (burn) => isBeamCut(burn) && containsBeamCut(burn, x, y),
      ));
  const targetIntersects = (
    target: ITarget,
    x: number,
    y: number,
    endX: number,
    endY: number,
    radius: number,
    ignoreCuts = false,
  ) =>
    intersectsBeam(target.rect, x, y, endX, endY, radius) &&
    (!target.shape ||
      intersectsFractureBeam(
        target.shape,
        target.rect,
        x,
        y,
        endX,
        endY,
        radius,
      )) &&
    (ignoreCuts ||
      !target.beamCuts ||
      !nearbyBurns(x, y).some(
        (burn) =>
          isBeamCut(burn) &&
          containsBeamCut(burn, x, y, radius) &&
          containsBeamCut(burn, endX, endY, radius),
      ));
  const surfaceTop = (target: ITarget, x: number) => {
    let top = target.shape
      ? target.rect.y +
        fractureSurfaceY(
          target.shape,
          (x - target.rect.x) / target.rect.width,
        ) *
          target.rect.height
      : target.rect.top;
    if (!target.beamCuts) return top;
    while (top <= target.rect.bottom) {
      let next = top;
      target.beamCuts.forEach((key) => {
        const burn = burns.get(key);
        if (!burn || !isBeamCut(burn)) return;
        const range = beamCutVerticalRange(burn, x);
        if (range && range[0] <= top && range[1] >= top)
          next = Math.max(next, range[1] + 0.01);
      });
      if (next === top)
        return targetContains(
          target,
          x,
          Math.min(target.rect.bottom, top + 0.001),
        )
          ? top
          : Infinity;
      top = next;
    }
    return Infinity;
  };
  let voidRevision = 0;
  let maskDirty = false;
  let surfaceMaskDirty = true;
  let surfaceRevision = 0;
  const flameVoidCache = new Map<string, { revision: number; gone: boolean }>();
  let cachedHoles: DOMRect[] = [];
  let cachedFractures: Array<{
    rect: DOMRect;
    points: readonly IFracturePoint[];
  }> = [];
  const dirtyBurns = new Set<string>();
  const indexedBurns = new Map<
    string,
    NonNullable<ReturnType<typeof burns.get>>
  >();
  const setBurn = (
    key: string,
    burn: NonNullable<ReturnType<typeof burns.get>>,
  ) => {
    const previous = burns.get(key);
    if (
      !previous ||
      previous.x !== burn.x ||
      previous.y !== burn.y ||
      previous.radius !== burn.radius ||
      previous.endX !== burn.endX ||
      previous.endY !== burn.endY
    ) {
      voidRevision++;
      dirtyBurns.add(key);
    }
    burns.set(key, burn);
  };
  const updateHoles = (surfaces = true) => {
    if (surfaces) {
      surfaceMaskDirty = true;
      surfaceRevision++;
    }
    maskDirty = true;
  };

  const targetGrid = new Map<string, ITarget[]>();
  const nearbyTargets = (x: number, y: number) =>
    targetGrid.get(`${Math.floor(x / 64)}:${Math.floor(y / 64)}`) ?? [];
  const voidGrid = new Map<
    string,
    Array<{
      x: number;
      y: number;
      radius: number;
      endX?: number;
      endY?: number;
    }>
  >();
  let indexedVoidRevision = -1;
  const nearbyBurns = (x: number, y: number) => {
    if (indexedVoidRevision !== voidRevision) {
      const visitCells = (
        burn: NonNullable<ReturnType<typeof burns.get>>,
        visit: (key: string) => void,
      ) => {
        const left = Math.max(
          0,
          Math.min(burn.x, burn.endX ?? burn.x) - burn.radius,
        );
        const top = Math.max(
          0,
          Math.min(burn.y, burn.endY ?? burn.y) - burn.radius,
        );
        const right = Math.min(
          width,
          Math.max(burn.x, burn.endX ?? burn.x) + burn.radius,
        );
        const bottom = Math.min(
          height,
          Math.max(burn.y, burn.endY ?? burn.y) + burn.radius,
        );
        for (let bx = Math.floor(left / 64); bx <= Math.floor(right / 64); bx++)
          for (
            let by = Math.floor(top / 64);
            by <= Math.floor(bottom / 64);
            by++
          )
            visit(`${bx}:${by}`);
      };
      dirtyBurns.forEach((key) => {
        const previous = indexedBurns.get(key);
        if (previous)
          visitCells(previous, (cell) => {
            const bucket = voidGrid.get(cell);
            if (!bucket) return;
            const index = bucket.indexOf(previous);
            if (index >= 0) bucket.splice(index, 1);
            if (!bucket.length) voidGrid.delete(cell);
          });
        const burn = burns.get(key);
        if (!burn) {
          indexedBurns.delete(key);
          return;
        }
        visitCells(burn, (cell) => {
          const bucket = voidGrid.get(cell) ?? [];
          bucket.push(burn);
          voidGrid.set(cell, bucket);
        });
        indexedBurns.set(key, burn);
      });
      dirtyBurns.clear();
      indexedVoidRevision = voidRevision;
    }
    return voidGrid.get(`${Math.floor(x / 64)}:${Math.floor(y / 64)}`) ?? [];
  };
  const isBeamCut = (burn: {
    x: number;
    y: number;
    radius: number;
    endX?: number;
    endY?: number;
  }): burn is IBeamCut => burn.endX !== undefined && burn.endY !== undefined;
  const isBackgroundGone = (x: number, y: number) => {
    const nearby = nearbyBurns(x, y);
    if (
      (
        platformGrid.get(`${Math.floor(x / 64)}:${Math.floor(y / 64)}`) ?? []
      ).some(
        (target) =>
          target.destroyed &&
          x >= target.rect.left &&
          x <= target.rect.right &&
          y >= target.rect.top &&
          y <= target.rect.bottom &&
          targetContains(target, x, y),
      )
    )
      return true;
    return nearby.some((burn) => {
      if (isBeamCut(burn)) return containsBeamCut(burn, x, y);
      return (x - burn.x) ** 2 + (y - burn.y) ** 2 <= burn.radius ** 2;
    });
  };
  const platformGrid = new Map<string, ITarget[]>();
  const nearbyPlatforms = (x: number, top: number, bottom: number) => {
    const result = new Set<ITarget>();
    const column = Math.floor(x / 64);
    for (let y = Math.floor(top / 64); y <= Math.floor(bottom / 64); y++)
      (platformGrid.get(`${column}:${y}`) ?? []).forEach((target) =>
        result.add(target),
      );
    return result;
  };
  const backgroundColors = new WeakMap<Element, string>();
  const platforms = targets.filter((target) => !target.letter);
  const resizeCanvas = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * scale;
    canvas.height = height * scale;
    background.width = width * scale;
    background.height = height * scale;
    backgroundCtx?.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const elementRects = new Map<Element, DOMRect>();
    targets.forEach((target) => {
      if (
        !target.letter &&
        !target.border &&
        !elementRects.has(target.element)
      ) {
        elementRects.set(
          target.element,
          target.element.getBoundingClientRect(),
        );
      }
      target.rect = target.letter
        ? getLetterRect(target.letter)
        : target.border
          ? getBorderRect(target.border)
          : elementRects.get(target.element)!;
      if (target.surfacePart) {
        const { left, top, right, bottom } = target.surfacePart;
        const rect = target.rect;
        target.surfaceRect = rect;
        target.rect = new DOMRect(
          rect.x + rect.width * left,
          rect.y + rect.height * top,
          rect.width * (right - left),
          rect.height * (bottom - top),
        );
      }
      if (target.letter) {
        target.letter.rect = target.rect;
      }
    });
    voidRevision++;
    voidGrid.clear();
    indexedBurns.clear();
    burns.forEach((_, key) => dirtyBurns.add(key));
    targetGrid.clear();
    platformGrid.clear();
    nuclearBlasts.forEach((blast) => {
      blast.queue = undefined;
      blast.cursor = 0;
    });
    targets.forEach((target) => {
      const rect = target.rect;
      for (
        let x = Math.floor(rect.left / 64);
        x <= Math.floor(rect.right / 64);
        x++
      ) {
        for (
          let y = Math.floor((rect.top - 3) / 64);
          y <= Math.floor((rect.bottom + 3) / 64);
          y++
        ) {
          const key = `${x}:${y}`;
          const bucket = targetGrid.get(key) ?? [];
          bucket.push(target);
          targetGrid.set(key, bucket);
          if (!target.letter) {
            const platforms = platformGrid.get(key) ?? [];
            platforms.push(target);
            platformGrid.set(key, platforms);
          }
        }
      }
    });
    interfaceLayer.capture(letters, [
      ...new Set(targets.map((target) => target.element)),
    ]);
    targets.forEach((target) => {
      if (target.destroyed && target.letter) {
        interfaceLayer.hideLetter(target.letter);
      }
    });
    updateHoles();
    player.x = Math.min(player.x, width - 20);
    player.y = Math.min(player.y, height - 30);
  };
  resizeCanvas();

  const spark = (
    x: number,
    y: number,
    amount: number,
    color: string = colors.G600,
  ) => {
    for (let index = 0; index < amount && particles.length < 500; index++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 330;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.6,
        color,
        kind: "spark",
        size: 2 + Math.random() * 2,
      });
    }
    if (particles.length > 500) {
      particles = particles.slice(-500);
    }
  };

  const smoke = (x: number, y: number, amount = 3) => {
    for (let i = 0; i < amount; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 65,
        vy: -25 - Math.random() * 60,
        life: 0.5 + Math.random() * 0.5,
        color: "#9ba9ba",
        kind: "smoke",
        size: 5 + Math.random() * 7,
      });
    }
  };

  const fragmentDamage = (rect: DOMRect): IInterfaceDamage => {
    const overlaps = (other: DOMRect) =>
      other.right >= rect.left &&
      other.left <= rect.right &&
      other.bottom >= rect.top &&
      other.top <= rect.bottom;
    const candidates = new Set<ITarget>();
    for (
      let x = Math.floor(rect.left / 64);
      x <= Math.floor(rect.right / 64);
      x++
    )
      for (
        let y = Math.floor((rect.top - 3) / 64);
        y <= Math.floor((rect.bottom + 3) / 64);
        y++
      )
        platformGrid.get(`${x}:${y}`)?.forEach((target) => {
          if (target.destroyed && !target.letter && overlaps(target.rect))
            candidates.add(target);
        });
    const holes: DOMRect[] = [],
      fractures: IInterfaceDamage["fractures"][number][] = [];
    candidates.forEach((target) => {
      if (target.shape)
        fractures.push({ rect: target.rect, points: target.shape });
      else holes.push(target.rect);
    });
    const cuts = [...burns.values()].filter((burn) =>
      isBeamCut(burn)
        ? intersectsBeam(
            rect,
            burn.x,
            burn.y,
            burn.endX,
            burn.endY,
            burn.radius,
          )
        : burn.x + burn.radius >= rect.left &&
          burn.x - burn.radius <= rect.right &&
          burn.y + burn.radius >= rect.top &&
          burn.y - burn.radius <= rect.bottom,
    );
    return { holes, fractures, burns: cuts };
  };
  const damageCoversRect = (damage: IInterfaceDamage, rect: DOMRect) => {
    if (
      damage.holes.some(
        (hole) =>
          hole.left <= rect.left &&
          hole.right >= rect.right &&
          hole.top <= rect.top &&
          hole.bottom >= rect.bottom,
      )
    )
      return true;
    const points = [
      [rect.left, rect.top],
      [rect.right, rect.top],
      [rect.right, rect.bottom],
      [rect.left, rect.bottom],
    ];
    return damage.burns.some((burn) =>
      points.every(([x, y]) =>
        isBeamCut(burn)
          ? containsBeamCut(burn, x, y, burn.radius * 0.01)
          : (x - burn.x) ** 2 + (y - burn.y) ** 2 <= (burn.radius * 0.99) ** 2,
      ),
    );
  };

  const destroy = (
    target: ITarget,
    hitX = target.rect.x + target.rect.width / 2,
    hitY = target.rect.y + target.rect.height / 2,
    force = 1,
    absorb = false,
    impact?: { x: number; y: number },
    previousDamage?: IInterfaceDamage,
  ): void => {
    if (target.destroyed) {
      return;
    }
    const previousPieces = absorb ? new Set(debris) : undefined;
    const { rect, element } = target;
    // Snapshot surviving material before this destruction or its child cascade changes the mask.
    const canAnimate = fragmentBudget > (target.letter ? 40 : 0);
    const damage = canAnimate
      ? (previousDamage ?? fragmentDamage(rect))
      : undefined;
    const directionX = impact?.x ?? rect.x + rect.width / 2 - hitX,
      directionY = impact?.y ?? rect.y + rect.height / 2 - hitY;
    const directionLength = Math.hypot(directionX, directionY),
      impulseX = directionLength > 0.001 ? directionX / directionLength : 1,
      impulseY = directionLength > 0.001 ? directionY / directionLength : 0;
    if (
      target.surfacePart &&
      !target.shape &&
      !absorb &&
      !nuclearBlasts.length
    ) {
      const [detached, attached] = splitPanel(
        rect,
        hitX,
        hitY,
        impulseX,
        impulseY,
      );
      if (attached.length) {
        target.shape = detached;
        const remaining: ITarget = {
          ...target,
          shape: attached,
          destroyed: false,
          health: target.cell ? 3 : 2,
        };
        const group = { parts: [target, remaining] };
        target.fractureGroup = remaining.fractureGroup = group;
        targets.push(remaining);
        platforms.push(remaining);
        for (
          let x = Math.floor(rect.left / 64);
          x <= Math.floor(rect.right / 64);
          x++
        )
          for (
            let y = Math.floor((rect.top - 3) / 64);
            y <= Math.floor((rect.bottom + 3) / 64);
            y++
          ) {
            const key = `${x}:${y}`;
            targetGrid.get(key)?.push(remaining);
            platformGrid.get(key)?.push(remaining);
          }
        for (const ownership of [surfaceLetters, surfaceBorders]) {
          const children = ownership.get(target) ?? [],
            stays = children.filter(
              (child) =>
                !targetContains(
                  target,
                  child.rect.x + child.rect.width / 2,
                  child.rect.y + child.rect.height / 2,
                  true,
                ),
            ),
            staySet = new Set(stays);
          ownership.set(
            target,
            children.filter((child) => !staySet.has(child)),
          );
          ownership.set(remaining, stays);
        }
      }
    }
    target.destroyed = true;
    destroyedCount++;
    const animate =
      canAnimate && damage !== undefined && !damageCoversRect(damage, rect);
    if (!animate) {
      if (target.letter) interfaceLayer.hideLetter(target.letter);
      else {
        updateHoles();
        if (!target.border) {
          surfaceBorders
            .get(target)
            ?.forEach((child) =>
              destroy(child, hitX, hitY, force, false, undefined, damage),
            );
          surfaceLetters
            .get(target)
            ?.forEach((child) =>
              destroy(child, hitX, hitY, force, false, undefined, damage),
            );
        }
      }
      return;
    }
    if (target.letter) {
      fragmentBudget--;
      interfaceLayer.hideLetter(target.letter);
      const piece = createFlyingLetter(target.letter);
      interfaceLayer.maskFragment(piece, rect, damage!);
      fragments.append(piece);
      debris.push({
        element: piece,
        x: rect.x,
        y: rect.y,
        vx:
          (rect.x + rect.width / 2 - hitX) * 5 +
          (Math.random() - 0.5) * 230 * force,
        vy: -140 - Math.random() * 200 * force,
        angle: 0,
        spin: (Math.random() - 0.5) * 16,
        life: 3 + Math.random(),
        centerX: rect.width / 2,
        centerY: rect.height / 2,
        radius: 3,
      });
      spark(hitX, hitY, 3, target.letter.style.color);
    } else if (target.border) {
      updateHoles();
      for (let index = 0; index < 2 && fragmentBudget > 0; index++) {
        fragmentBudget--;
        const piece = document.createElement("div");
        Object.assign(piece.style, {
          position: "absolute",
          left: "0",
          top: "0",
          width: `${rect.width / 2}px`,
          height: `${Math.max(2, rect.height)}px`,
          background: target.border.color,
          pointerEvents: "none",
        });
        interfaceLayer.maskFragment(
          piece,
          new DOMRect(
            rect.x + (index * rect.width) / 2,
            rect.y,
            rect.width / 2,
            Math.max(2, rect.height),
          ),
          damage!,
        );
        fragments.append(piece);
        debris.push({
          element: piece,
          x: rect.x + (index * rect.width) / 2,
          y: rect.y,
          vx: (index ? 1 : -1) * (60 + Math.random() * 100) * force,
          vy: -80 - Math.random() * 160 * force,
          angle: 0,
          spin: (Math.random() - 0.5) * 18,
          life: 2.5,
          centerX: rect.width / 4,
          centerY: rect.height / 2,
          radius: 2,
        });
      }
    } else {
      surfaceBorders
        .get(target)
        ?.forEach((child) =>
          destroy(child, hitX, hitY, force, false, undefined, damage),
        );
      // Текст отделяется от поверхности, включая ещё не сбитые символы.
      surfaceLetters
        .get(target)
        ?.forEach((child) =>
          destroy(child, hitX, hitY, force, false, undefined, damage),
        );
      const surfaceColor =
        backgroundColors.get(element) ?? getElementBackground(element);
      backgroundColors.set(element, surfaceColor);
      const appearance = interfaceLayer.getAppearance(element);
      removeText(appearance);
      updateHoles();

      if (target.surfacePart) {
        if (fragmentBudget > 0) {
          fragmentBudget--;
          const fullRect = target.surfaceRect ?? target.rect,
            piece = document.createElement("div");
          piece.setAttribute("aria-hidden", "true");
          Object.assign(piece.style, {
            position: "absolute",
            left: "0",
            top: "0",
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            overflow: "hidden",
            pointerEvents: "none",
            backgroundColor: surfaceColor,
            transformOrigin: "center",
            clipPath: target.shape
              ? `polygon(${target.shape.map((p) => `${p.x * 100}% ${p.y * 100}%`).join(",")})`
              : "none",
          });
          Object.assign(appearance.style, {
            position: "absolute",
            left: `${fullRect.x - rect.x}px`,
            top: `${fullRect.y - rect.y}px`,
            margin: "0",
            width: `${fullRect.width}px`,
            height: `${fullRect.height}px`,
            minWidth: "0",
            minHeight: "0",
            maxWidth: "none",
            maxHeight: "none",
            boxSizing: "border-box",
            transform: "none",
            opacity: "1",
          });
          piece.append(appearance);
          interfaceLayer.maskFragment(piece, rect, damage!);
          fragments.append(piece);
          debris.push({
            element: piece,
            x: rect.x,
            y: rect.y,
            vx: impulseX * 90 * force + (Math.random() - 0.5) * 25,
            vy: impulseY * 55 * force + 20,
            angle: 0,
            spin:
              (((hitX - rect.x - rect.width / 2) * impulseY -
                (hitY - rect.y - rect.height / 2) * impulseX) /
                Math.max(rect.width, rect.height)) *
                3 *
                force +
              (Math.random() - 0.5),
            life: 4,
            centerX: rect.width / 2,
            centerY: rect.height / 2,
            radius: Math.min(
              18,
              Math.max(3, Math.min(rect.width, rect.height) / 4),
            ),
          });
        }
      } else {
        // Фрагменты поверхности сохраняют фон, границы и иконки; текст летит отдельно.
        const count = Math.min(
          12,
          Math.max(5, Math.ceil(Math.sqrt(rect.width * rect.height) / 12)),
        );
        const centerX = Math.max(
          rect.width * 0.2,
          Math.min(rect.width * 0.8, hitX - rect.x),
        );
        const centerY = Math.max(
          rect.height * 0.2,
          Math.min(rect.height * 0.8, hitY - rect.y),
        );
        const perimeter = 2 * (rect.width + rect.height);
        const edgePoint = (edgeDistance: number) => {
          let distance = edgeDistance;
          if (distance < rect.width) {
            return [distance, 0];
          }
          distance -= rect.width;
          if (distance < rect.height) {
            return [rect.width, distance];
          }
          distance -= rect.height;
          if (distance < rect.width) {
            return [rect.width - distance, rect.height];
          }
          return [0, rect.height - (distance - rect.width)];
        };
        const distances = Array.from(
          { length: count },
          (_, index) =>
            ((index + (index ? Math.random() * 0.4 : 0)) * perimeter) / count,
        );
        distances.push(
          rect.width,
          rect.width + rect.height,
          rect.width * 2 + rect.height,
          perimeter,
        );
        const edges = [...new Set(distances)]
          .sort((a, b) => a - b)
          .map(edgePoint);
        for (
          let index = 0;
          index < edges.length - 1 && fragmentBudget > 0;
          index++
        ) {
          fragmentBudget--;
          const pivotX = (centerX + edges[index][0] + edges[index + 1][0]) / 3;
          const pivotY = (centerY + edges[index][1] + edges[index + 1][1]) / 3;
          const piece = document.createElement("div");
          const copy = appearance.cloneNode(true) as HTMLElement;
          piece.setAttribute("aria-hidden", "true");
          Object.assign(piece.style, {
            position: "absolute",
            left: "0",
            top: "0",
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            pointerEvents: "none",
            transformOrigin: `${pivotX}px ${pivotY}px`,
            backgroundColor: surfaceColor,
            overflow: "hidden",
            clipPath: `polygon(${centerX}px ${centerY}px, ${edges[index][0]}px ${edges[index][1]}px, ${edges[index + 1][0]}px ${edges[index + 1][1]}px)`,
          });
          Object.assign(copy.style, {
            position: "static",
            margin: "0",
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            minWidth: "0",
            minHeight: "0",
            maxWidth: "none",
            maxHeight: "none",
            boxSizing: "border-box",
            transform: "none",
            opacity: "1",
          });
          piece.append(copy);
          interfaceLayer.maskFragment(piece, rect, damage!);
          fragments.append(piece);
          debris.push({
            element: piece,
            x: rect.x,
            y: rect.y,
            vx:
              ((edges[index][0] - centerX) / Math.max(rect.width, 1)) *
              (180 + Math.random() * 220) *
              force,
            vy:
              ((edges[index][1] - centerY) / Math.max(rect.height, 1)) *
                180 *
                force -
              170 -
              Math.random() * 150,
            angle: 0,
            spin: (Math.random() - 0.5) * 12,
            life: 3 + Math.random() * 1.5,
            centerX: pivotX,
            centerY: pivotY,
            radius: Math.min(
              18,
              Math.max(3, Math.sqrt((rect.width * rect.height) / count) / 4),
            ),
          });
        }
      }
    }
    if (previousPieces)
      debris.forEach((piece) => {
        if (!previousPieces.has(piece)) {
          piece.vx = (hitX - piece.x - piece.centerX) * 1.5;
          piece.vy = (hitY - piece.y - piece.centerY) * 1.5;
          piece.life = 6;
        }
      });
    while (debris.length > MAX_FRAGMENTS) {
      let smallest = 0;
      debris.forEach((piece, index) => {
        piece.mass ??= Math.max(
          1,
          (parseFloat(piece.element.style.width) || piece.radius * 2) *
            (parseFloat(piece.element.style.height) || piece.radius * 2),
        );
        if (piece.mass < (debris[smallest].mass ?? Infinity)) smallest = index;
      });
      debris.splice(smallest, 1)[0].element.remove();
    }
    if (!target.letter) {
      spark(hitX, hitY, 16, gamePalette.amber);
      smoke(hitX, hitY, 6);
    }
  };

  const ignite = (target: ITarget, hitX: number, hitY: number) => {
    const x = Math.max(target.rect.left, Math.min(hitX, target.rect.right));
    const y = Math.max(target.rect.top, Math.min(hitY, target.rect.bottom));
    if (target.destroyed || isBackgroundGone(x, y)) return;
    let state = ignitions.get(target);
    if (state) {
      state.heat = Math.min(1, state.heat + 0.08);
      state.fuel = 3.5;
    } else {
      state = { age: 0, heat: 0.25, fuel: 3.5, spots: new Map() };
      ignitions.set(target, state);
    }
    // Огонь только там, где пламя действительно касалось поверхности.
    const key = `${Math.floor(x / 32)}:${Math.floor(y / 32)}`;
    if (!state.spots.has(key)) {
      if (state.spots.size >= 6)
        state.spots.delete(state.spots.keys().next().value!);
      state.spots.set(key, { x, y });
    }
  };
  const burnBackground = (
    x: number,
    y: number,
    radius: number,
    color: string,
    dt: number,
  ) => {
    if (x < 0 || x > width || y < 0 || y > height) return;
    // Греется вся площадь частицы, а не только ячейка под её центром.
    for (
      let bx = Math.floor((x - radius) / 20);
      bx <= Math.floor((x + radius) / 20);
      bx++
    ) {
      for (
        let by = Math.floor((y - radius) / 20);
        by <= Math.floor((y + radius) / 20);
        by++
      ) {
        const px = (bx + 0.5) * 20,
          py = (by + 0.5) * 20;
        if (
          px < 0 ||
          px > width ||
          py < 0 ||
          py > height ||
          Math.hypot(px - x, py - y) > radius + 10
        )
          continue;
        const key = `flame:${bx}:${by}`;
        const revision = voidRevision + surfaceRevision;
        let cached = flameVoidCache.get(key);
        if (!cached || cached.revision !== revision) {
          cached = { revision, gone: isBackgroundGone(px, py) };
          flameVoidCache.set(key, cached);
        }
        if (cached.gone) continue;
        const patch = flamePatches.get(key) ?? {
          x: px,
          y: py,
          heat: 0.1,
          frame: -1,
          age: 0,
          fuel: 0,
          color,
        };
        if (patch.frame !== stepId) {
          patch.heat = Math.min(2, patch.heat + dt * 2.5 + 0.035);
          patch.frame = stepId;
        }
        patch.fuel = 3;
        flamePatches.set(key, patch);
      }
    }
    // Пламя нагревает, а не наносит мгновенный урон.
    for (
      let bx = Math.floor((x - radius) / 64);
      bx <= Math.floor((x + radius) / 64);
      bx++
    ) {
      for (
        let by = Math.floor((y - radius) / 64);
        by <= Math.floor((y + radius) / 64);
        by++
      ) {
        for (const target of targetGrid.get(`${bx}:${by}`) ?? []) {
          if (
            !target.destroyed &&
            (target.letter || target.border) &&
            Math.hypot(
              Math.max(target.rect.left, Math.min(x, target.rect.right)) - x,
              Math.max(target.rect.top, Math.min(y, target.rect.bottom)) - y,
            ) < radius
          )
            ignite(target, x, y);
        }
      }
    }
  };

  const explode = (
    x: number,
    y: number,
    radius: number,
    pierceBackground = false,
    sound: "default" | "drone" = "default",
  ) => {
    const damage =
      fragmentBudget > 0
        ? fragmentDamage(
            new DOMRect(x - radius, y - radius, radius * 2, radius * 2),
          )
        : undefined;
    if (sound === "drone") audio.droneExplosion();
    else audio.explosion();
    if (pierceBackground) {
      const craterId = `rocket:${burns.size}`;
      const craterRadius = radius * 0.78;
      setBurn(craterId, {
        x,
        y,
        radius: craterRadius,
        color: gamePalette.amber,
        heat: 0.7,
      });
      // Неровные края пробоины отличаются от круглого прожига лазера.
      for (let index = 0; index < 12; index++) {
        const angle = (index * Math.PI) / 6;
        const edgeRadius = craterRadius * (0.15 + Math.random() * 0.15);
        setBurn(`${craterId}:${index}`, {
          x: x + Math.cos(angle) * craterRadius * 0.9,
          y: y + Math.sin(angle) * craterRadius * 0.9,
          radius: edgeRadius,
          color: gamePalette.amber,
          heat: 0.7,
        });
      }
      updateHoles(false);
    }
    screenShake = 12;
    shockwaves.push({ x, y, radius, life: 0.6 });
    spark(x, y, 55, colors.O500);
    smoke(x, y, 18);
    targets.forEach((target) => {
      const closestX = Math.max(
        target.rect.left,
        Math.min(x, target.rect.right),
      );
      const closestY = Math.max(
        target.rect.top,
        Math.min(y, target.rect.bottom),
      );
      if (Math.hypot(x - closestX, y - closestY) < radius) {
        destroy(target, x, y, 2.3, false, undefined, damage);
      }
    });
  };

  const splashAcid = (x: number, y: number, drop = false) => {
    if (x < 0 || x > width || y < 0) return;
    acidPools.push({
      id: ++acidPoolId,
      x,
      y: Math.min(height - 3, y),
      age: 0,
      radius: drop ? 4 : 7,
      life: drop ? 2.7 : 5,
      maxRadius: drop ? 18 : 48,
      maxDamage: drop ? 1.2 : 2,
      doses: new Map(),
    });
    if (acidPools.length > 32) acidPools.shift();
    spark(x, y, drop ? 4 : 12, "#acfa4e");
  };
  const detonateDrone = () => {
    if (!drone) return;
    const { x, y } = drone;
    drone = undefined;
    onDrone(false);
    explode(x, y, 175, true, "drone");
  };
  const launchDrone = () => {
    if (gojoMode) return;
    if (paused) return;
    audio.unlock();
    if (drone) {
      detonateDrone();
      return;
    }
    const angle = Math.atan2(aim.y - (player.y - 32), aim.x - player.x);
    drone = {
      x: Math.max(20, Math.min(width - 20, player.x + Math.cos(angle) * 60)),
      y: Math.max(25, Math.min(height - 25, player.y - 50)),
      vx: Math.cos(angle) * 230,
      vy: Math.sin(angle) * 230,
      age: 0,
    };
    shooting = false;
    keys.clear();
    onDrone(true);
  };
  const detonate = (bullet: IProjectile) => {
    if (bullet.blackHole) {
      const radius = Math.min(225, Math.min(width, height) * 0.32);
      const x = bullet.destination?.x ?? bullet.x,
        y = bullet.destination?.y ?? bullet.y;
      // Поверхность должна целиком помещаться в радиус: широкая ячейка не тянет за собой всю строку.
      const nearby = new Set<ITarget>();
      for (
        let bx = Math.floor((x - radius) / 64);
        bx <= Math.floor((x + radius) / 64);
        bx++
      )
        for (
          let by = Math.floor((y - radius) / 64);
          by <= Math.floor((y + radius) / 64);
          by++
        )
          (targetGrid.get(`${bx}:${by}`) ?? []).forEach((target) =>
            nearby.add(target),
          );
      const queue = [...nearby]
        .filter((target) => !target.destroyed)
        .map((target) => ({
          target,
          distance: Math.hypot(
            Math.max(
              Math.abs(target.rect.left - x),
              Math.abs(target.rect.right - x),
            ),
            Math.max(
              Math.abs(target.rect.top - y),
              Math.abs(target.rect.bottom - y),
            ),
          ),
        }))
        .filter((item) => item.distance <= radius)
        .sort((a, b) => a.distance - b.distance);
      blackHoles.push({
        id: ++blackHoleId,
        x,
        y,
        age: 0,
        radius,
        budget: 0,
        cursor: 0,
        queue,
        blue: bullet.gojoBlue,
      });
      spark(x, y, 12, bullet.gojoBlue ? "#38aaff" : "#bd8cff");
      return;
    }
    if (bullet.gojoRed) {
      duel.red(bullet.x, bullet.y);
      explode(bullet.x, Math.min(bullet.y, height - 5), 165, true);
      redImpacts.push({ x: bullet.x, y: bullet.y, age: 0, radius: 190 });
      redImpacts = redImpacts.slice(-5);
      debris.forEach((piece) => {
        const dx = piece.x + piece.centerX - bullet.x,
          dy = piece.y + piece.centerY - bullet.y,
          d = Math.hypot(dx, dy);
        if (d < 240) {
          const force = 900 * (1 - d / 300);
          piece.orbit = undefined;
          piece.repulsion = 0.65;
          piece.vx = (dx / (d || 1)) * force;
          piece.vy = (dy / (d || 1)) * force - 80;
          piece.spin += (Math.random() - 0.5) * 8;
        }
      });
      spark(bullet.x, bullet.y, 24, "#ff3459");
      return;
    }
    if (!bullet.nuclear) {
      explode(
        bullet.x,
        Math.min(bullet.y, height - 5),
        bullet.blastRadius,
        true,
      );
      return;
    }
    const radius = Math.hypot(width, height) * 0.8;
    audio.explosion(true);
    nuclearBlasts.push({
      id: ++nuclearBlastId,
      x: bullet.x,
      y: Math.min(bullet.y, height - 20),
      age: 0,
      radius,
      reached: 0,
    });
    onCinematic(true);
    screenShake = 30;
    spark(bullet.x, bullet.y, 80, "#ffcd65");
  };

  const fire = (grenade = false) => {
    if (duel.defeated) return;
    if (gojoMode) grenade = false;
    if (
      !grenade &&
      weapon === 10 &&
      blackHoles.length +
        projectiles.filter((bullet) => bullet.blackHole).length >=
        3
    ) {
      cooldown = 0.2;
      return;
    }
    audio.play(grenade ? 7 : weapon, gojoMode);
    recoil = 1;
    const angle = Math.atan2(aim.y - (player.y - 32), aim.x - player.x);
    const baseConfig = WEAPONS[grenade ? 6 : weapon - 1];
    const config =
      gojoMode && weapon === 6
        ? {
            ...baseConfig,
            speed: 950,
            blastRadius: 165,
            size: 11,
            color: "#ff3459",
            cooldown: 0.9,
          }
        : baseConfig;
    if (gojoMode) castTimer = 0.55;
    const isFlame = !grenade && weapon === 5;
    const aimDistance = Math.hypot(aim.x - player.x, aim.y - (player.y - 32));
    const startDistance =
      !grenade && weapon === 10 ? Math.min(58, aimDistance * 0.5) : 58;
    for (let index = 0; index < config.pellets; index++) {
      const spread =
        (Math.random() - 0.5) * config.spread * Math.max(config.pellets, 1);
      projectiles.push({
        x: player.x + Math.cos(angle) * startDistance,
        y: player.y - 32 + Math.sin(angle) * startDistance,
        vx: Math.cos(angle + spread) * config.speed,
        vy:
          Math.sin(angle + spread) * config.speed -
          (config.gravity > 0 && (grenade || weapon === 7) ? 180 : 0),
        life:
          !grenade && weapon === 10
            ? Math.max(config.life, aimDistance / config.speed + 0.25)
            : config.life,
        damage: config.damage,
        blastRadius: config.blastRadius,
        gravity: config.gravity,
        color: config.color,
        size: config.size,
        acid: !grenade && weapon === 11,
        acidDrips: 0,
        dripClock: 0.1 + Math.random() * 0.12,
        nuclear: !grenade && weapon === 9,
        blackHole: !grenade && weapon === 10,
        gojoBlue: gojoMode && weapon === 10,
        gojoRed: gojoMode && weapon === 6,
        destination:
          !grenade && weapon === 10 ? { x: aim.x, y: aim.y } : undefined,
        hitTargets: new Set(),
        penetration: config.penetration ?? 0,
        // Ракета взрывается у курсора даже при попадании в пустой фон.
        remainingRange:
          !grenade && weapon === 10
            ? Math.max(0, aimDistance - startDistance)
            : config.blastRadius && config.gravity === 0
              ? Math.max(
                  30,
                  Math.hypot(aim.x - player.x, aim.y - (player.y - 32)) - 58,
                )
              : undefined,
      });
    }
    const muzzleX = player.x + Math.cos(angle) * 58;
    const muzzleY = player.y - 32 + Math.sin(angle) * 58;
    if (!isFlame) {
      flashes.push({
        x: muzzleX,
        y: muzzleY,
        angle,
        life: 0.085,
        color: config.color,
        size: config.blastRadius ? 28 : weapon === 2 ? 25 : 16,
      });
      smoke(muzzleX, muzzleY, config.blastRadius ? 6 : 1);
    }
    if (!grenade && weapon <= 4) {
      particles.push({
        x: player.x + Math.cos(angle) * 20,
        y: player.y - 32,
        vx: -Math.cos(angle) * 80 + (Math.random() - 0.5) * 90,
        vy: -130,
        life: 0.65,
        color: gamePalette.amber,
        kind: "shell",
        size: 4,
      });
    }
    // Правой кнопкой можно бросить гранату независимо от выбранного оружия.
    if (!grenade) {
      cooldown = config.cooldown;
    }
    spark(
      player.x + Math.cos(angle) * 58,
      player.y - 32 + Math.sin(angle) * 58,
      isFlame ? 1 : 4,
      colors.O500,
    );
  };

  const setPaused = (value: boolean) => {
    paused = value;
    if (value) audio.ambience({});
    if (!purpleShot) laserCharge = 0;
    keys.clear();
    shooting = false;
    onPause(value);
  };
  const keyDown = (event: KeyboardEvent) => {
    const eventTarget = event.composedPath()[0] ?? event.target;
    if (
      event.code !== "Escape" &&
      eventTarget instanceof HTMLElement &&
      eventTarget.closest("[data-destruction-controls]")
    ) {
      return;
    }
    if (
      ![
        "KeyA",
        "KeyD",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Space",
        "KeyW",
        "KeyS",
        "KeyE",
        "KeyR",
        "KeyB",
        "Escape",
        "Digit1",
        "Digit2",
        "Digit3",
        "Digit4",
        "Digit5",
        "Digit6",
        "Digit7",
        "Digit8",
        "Digit9",
        "Digit0",
        "Minus",
      ].includes(event.code)
    ) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.code === "Escape" && !event.repeat) {
      setPaused(!paused);
      return;
    }
    if (paused) {
      return;
    }
    if (gojoMode && !event.repeat) {
      if (event.code === "KeyE") {
        activateInfinity();
        return;
      }
      if (event.code === "KeyR") {
        expandDomain();
        return;
      }
      if (event.code === "KeyB") {
        summonSukuna();
        return;
      }
    }
    keys.add(event.code);
    if (event.code === "Minus" || /^Digit[0-9]$/.test(event.code)) {
      if (purpleShot) return;
      laserCharge = 0;
      const number = Number(event.code.slice(-1));
      if (gojoMode) {
        if (number < 1 || number > 3 || event.code === "Minus") return;
        weapon = gojoWeapons[number - 1];
      } else weapon = event.code === "Minus" ? 11 : number || 10;
      purpleShot = undefined;
      onWeapon(weapon);
    }
  };
  const keyUp = (event: KeyboardEvent) => {
    keys.delete(event.code);
  };
  const pointerMove = (event: PointerEvent) => {
    aim.x = event.clientX;
    aim.y = event.clientY;
  };
  const pointerDown = (event: PointerEvent) => {
    audio.unlock();
    if (drone && event.button === 0 && !paused) {
      detonateDrone();
      return;
    }
    if (paused || duel.defeated) {
      return;
    }
    event.preventDefault();
    if (
      gojoMode &&
      weapon === 8 &&
      (event.button === 0 || event.button === 2)
    ) {
      if (!purpleShot && cooldown <= 0) {
        const angle = Math.atan2(
          event.clientY - (player.y - 48),
          event.clientX - player.x,
        );
        audio.charge();
        purpleShot = {
          age: 0,
          angle,
        };
        laserCharge = 0;
        lastLaserCutKey = "";
        cooldown = 1.1;
        shooting = false;
      }
      return;
    }
    if (event.button === 0) {
      aim.x = event.clientX;
      aim.y = event.clientY;
      shooting = true;
      // A quick click must fire even when down/up both arrive between two frames.
      if (weapon !== 8 && cooldown <= 0) fire();
    }
    if (event.button === 2) {
      if (gojoMode) shooting = true;
      else fire(true);
    }
  };
  const wheel = (event: WheelEvent) => {
    event.preventDefault();
    if (purpleShot) return;
    if (paused) {
      return;
    }
    laserCharge = 0;
    weapon = gojoMode
      ? gojoWeapons[
          (gojoWeapons.indexOf(weapon) + Math.sign(event.deltaY) + 3) % 3
        ]
      : ((weapon - 1 + Math.sign(event.deltaY) + WEAPONS.length) %
          WEAPONS.length) +
        1;
    purpleShot = undefined;
    onWeapon(weapon);
  };
  const pointerUp = () => {
    shooting = false;
    if (!purpleShot) laserCharge = 0;
  };
  const contextMenu = (event: MouseEvent) => {
    event.preventDefault();
  };
  const blur = () => {
    setPaused(true);
  };

  const drawPlayer = (time: number) =>
    gojoMode
      ? drawGojo(
          ctx,
          { ...player, flying: !player.grounded && player.y < height - 25 },
          purpleShot
            ? {
                x: player.x + Math.cos(purpleShot.angle) * 1000,
                y: player.y - 48 + Math.sin(purpleShot.angle) * 1000,
              }
            : aim,
          gojoWeapons.indexOf(weapon) + 1,
          castTimer,
          laserCharge,
          time,
        )
      : drawCharacterModel(ctx, {
          ...player,
          aimX: aim.x,
          aimY: aim.y,
          weapon,
          recoil,
          time,
          flying: keys.has("Space") || keys.has("KeyW"),
        });

  const applyBeamDamage = (cutKey: string, beam: IBeamCut) => {
    const { x, y, endX, endY, radius } = beam;
    const distance = Math.hypot(endX - x, endY - y);
    const dx = (endX - x) / (distance || 1),
      dy = (endY - y) / (distance || 1);
    const visitedCells = new Set<string>(),
      beamTargets = new Set<ITarget>();
    const padding = Math.ceil((radius + 3) / 64),
      steps = Math.max(1, Math.ceil(distance / 32));
    for (let i = 0; i <= steps; i++) {
      const bx = Math.floor((x + ((endX - x) * i) / steps) / 64),
        by = Math.floor((y + ((endY - y) * i) / steps) / 64);
      for (let ox = -padding; ox <= padding; ox++)
        for (let oy = -padding; oy <= padding; oy++) {
          const key = `${bx + ox}:${by + oy}`;
          if (visitedCells.has(key)) continue;
          visitedCells.add(key);
          targetGrid.get(key)?.forEach((target) => {
            if (!target.destroyed) beamTargets.add(target);
          });
        }
    }
    // Surface material is removed only by the exact beam mask; glyphs still detach individually.
    beamTargets.forEach((target) => {
      if (
        target.destroyed ||
        !targetIntersects(target, x, y, endX, endY, radius, true)
      )
        return;
      if (!target.letter) {
        (target.beamCuts ??= new Set()).add(cutKey);
        const points = target.shape ?? [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ];
        if (
          points.every((point) =>
            containsBeamCut(
              beam,
              target.rect.x + point.x * target.rect.width,
              target.rect.y + point.y * target.rect.height,
            ),
          )
        ) {
          target.destroyed = true;
          destroyedCount++;
          updateHoles();
        }
        return;
      }
      const fraction = Math.max(
        0,
        Math.min(
          distance,
          (target.rect.x + target.rect.width / 2 - x) * dx +
            (target.rect.y + target.rect.height / 2 - y) * dy,
        ),
      );
      destroy(target, x + dx * fraction, y + dy * fraction, 1.3);
    });
  };
  let sorcererCutId = 0;
  const duel = createSorcererDuel({
    hud: onDuel,
    cue: audio.duel,
    cut: (beam) => {
      const key = `sukuna:${++sorcererCutId}`;
      setBurn(key, { ...beam, color: "#ff4265", heat: 0.45 });
      updateHoles(false);
      applyBeamDamage(key, beam);
    },
    explode: (x, y, radius) => explode(x, y, radius, true),
  });
  const activateInfinity = () => {
    if (gojoMode && !paused) {
      audio.unlock();
      duel.activateInfinity();
    }
  };
  const expandDomain = () => {
    if (gojoMode && !paused && !purpleShot) {
      audio.unlock();
      duel.expandVoid();
    }
  };
  const summonSukuna = () => {
    if (gojoMode && !paused && !purpleShot && !duel.fighting) {
      audio.unlock();
      shooting = false;
      projectiles = [];
      blackHoles = [];
      duel.start();
    }
  };
  const fireLaser = (dt: number, shot?: { angle: number }) => {
    if (!shot) laserCharge += dt;
    if (gojoMode && laserCharge < 0.45) return;
    if (gojoMode || laserCharge <= dt) audio.play(8, gojoMode);
    const radius = gojoMode ? 18 : Math.min(80, 6 + laserCharge * 22);
    const angle =
      shot?.angle ?? Math.atan2(aim.y - (player.y - 32), aim.x - player.x);
    const dx = Math.cos(angle),
      dy = Math.sin(angle);
    // Resolve the hand position when the cast completes; the shot direction stays locked.
    const origin = shot
      ? getGojoCastOrigin(
          { ...player, flying: !player.grounded && player.y < height - 25 },
          angle,
          previousTime,
        )
      : { x: player.x + dx * 58, y: player.y - 32 + dy * 58 };
    const { x, y } = origin;
    // Курсор задаёт направление; конец луча всегда на границе экрана.
    const distance = Math.max(
      0,
      Math.min(
        dx > 1e-8 ? (width - x) / dx : dx < -1e-8 ? -x / dx : Infinity,
        dy > 1e-8 ? (height - y) / dy : dy < -1e-8 ? -y / dy : Infinity,
      ),
    );
    const endX = x + dx * distance,
      endY = y + dy * distance;
    laser = { x, y, endX, endY, radius };
    const previous = burns.get(lastLaserCutKey);
    const sameLine =
      previous?.endX !== undefined &&
      previous.endY !== undefined &&
      Math.hypot(previous.x - x, previous.y - y) < 0.5 &&
      Math.hypot(previous.endX - endX, previous.endY - endY) < 0.5;
    if (!sameLine) lastLaserCutKey = `laser:${++laserStroke}`;
    const cutRadius = sameLine ? Math.max(radius, previous!.radius) : radius;
    setBurn(lastLaserCutKey, {
      x,
      y,
      endX,
      endY,
      radius: cutRadius,
      color: gojoMode ? "#be6bff" : gamePalette.cyan,
      heat: 0.7,
    });
    if (!sameLine || cutRadius !== previous?.radius) updateHoles(false);
    // Пространственная сетка проверяет только полосу луча, включая его полную толщину.
    // Для неподвижного луча прежней толщины все попадания уже обработаны.
    if (!sameLine || radius > (previous?.radius ?? 0)) {
      applyBeamDamage(lastLaserCutKey, laser);
    }
    if (gojoMode) duel.beam(laser);
    const fraction = Math.random();
    spark(
      x + (endX - x) * fraction,
      y + (endY - y) * fraction,
      2,
      gojoMode ? "#be6bff" : gamePalette.cyan,
    );
  };

  const step = (dt: number) => {
    stepId++;
    flameVoidCache.clear();
    fragmentBudget = MAX_FRAGMENTS;
    castTimer = Math.max(0, castTimer - dt);
    redImpacts = redImpacts.filter((impact) => {
      impact.age += dt;
      return impact.age < 0.7;
    });
    if (drone) {
      drone.age += dt;
      const horizontal =
        Number(keys.has("KeyD") || keys.has("ArrowRight")) -
        Number(keys.has("KeyA") || keys.has("ArrowLeft"));
      const vertical =
        Number(keys.has("KeyS") || keys.has("ArrowDown")) -
        Number(keys.has("KeyW") || keys.has("ArrowUp"));
      if (horizontal || vertical) {
        const length = Math.hypot(horizontal, vertical);
        const blend = 1 - Math.exp(-dt * 6);
        drone.vx += ((horizontal / length) * 320 - drone.vx) * blend;
        drone.vy += ((vertical / length) * 320 - drone.vy) * blend;
      }
      const oldX = drone.x,
        oldY = drone.y;
      drone.x += drone.vx * dt;
      drone.y += drone.vy * dt;
      const collision =
        drone.age > 0.25 &&
        platforms.some(
          (target) =>
            !target.destroyed &&
            targetIntersects(target, oldX, oldY, drone!.x, drone!.y, 10),
        );
      if (
        collision ||
        drone.age >= 8 ||
        drone.x < 12 ||
        drone.x > width - 12 ||
        drone.y < 12 ||
        drone.y > height - 12
      ) {
        drone.x = Math.max(12, Math.min(width - 12, drone.x));
        drone.y = Math.max(12, Math.min(height - 12, drone.y));
        detonateDrone();
      }
    }
    ignitions.forEach((fire, target) => {
      if (target.destroyed) {
        ignitions.delete(target);
        return;
      }
      fire.age += dt;
      fire.fuel -= dt;
      fire.heat = Math.min(1, fire.heat + dt * 0.22);
      if (
        fire.age >= (target.letter || target.border ? 1.2 : 2) &&
        fire.heat >= 0.75
      ) {
        const spot = fire.spots.values().next().value!;
        destroy(target, spot.x, spot.y, 0.6);
        ignitions.delete(target);
      } else if (fire.fuel <= 0) ignitions.delete(target);
    });
    flamePatches.forEach((patch, key) => {
      patch.age += dt;
      patch.fuel = Math.max(0, patch.fuel - dt);
      const burning = patch.heat >= 0.32 && patch.fuel > 0;
      if (burning) {
        patch.heat = Math.min(2, patch.heat + dt * 0.35);
        // Нагретый участок продолжает тлеть даже без новой частицы в той же ячейке.
        const previous = burns.get(key);
        const radius = Math.min(
          42,
          Math.max(
            previous?.radius ?? 0,
            Math.min(
              (patch.heat - 0.25) * 34,
              Math.max(0, patch.age - 0.6) * 22,
            ),
          ),
        );
        if (radius > 0) {
          setBurn(key, {
            x: patch.x,
            y: patch.y,
            radius,
            color: patch.color,
            heat: 0.7,
          });
          if (!previous || previous.radius !== radius) updateHoles(false);
        }
      } else if (patch.frame < stepId - 1)
        patch.heat = Math.max(0, patch.heat - dt * 0.5);
      if (patch.heat <= 0) flamePatches.delete(key);
    });
    acidPools = acidPools.filter((pool) => {
      pool.age += dt;
      pool.radius = Math.min(
        pool.maxRadius,
        (pool.maxRadius === 18 ? 4 : 7) + pool.age * 9,
      );
      if (pool.age > 0.4) {
        const visited = new Set<ITarget>();
        for (
          let bx = Math.floor((pool.x - pool.radius) / 64);
          bx <= Math.floor((pool.x + pool.radius) / 64);
          bx++
        )
          for (
            let by = Math.floor((pool.y - pool.radius) / 64);
            by <= Math.floor((pool.y + pool.radius) / 64);
            by++
          ) {
            for (const target of targetGrid.get(`${bx}:${by}`) ?? []) {
              if (target.destroyed || visited.has(target)) continue;
              visited.add(target);
              if (
                Math.hypot(
                  Math.max(
                    target.rect.left,
                    Math.min(pool.x, target.rect.right),
                  ) - pool.x,
                  Math.max(
                    target.rect.top,
                    Math.min(pool.y, target.rect.bottom),
                  ) - pool.y,
                ) > pool.radius
              )
                continue;
              // Большие ячейки разъедаются только через локальный прожиг фона.
              if (
                !target.letter &&
                !target.border &&
                Math.hypot(
                  Math.max(
                    Math.abs(target.rect.left - pool.x),
                    Math.abs(target.rect.right - pool.x),
                  ),
                  Math.max(
                    Math.abs(target.rect.top - pool.y),
                    Math.abs(target.rect.bottom - pool.y),
                  ),
                ) > pool.radius
              )
                continue;
              const used = pool.doses.get(target) ?? 0;
              const damage = Math.min(pool.maxDamage - used, dt * 0.55);
              if (damage <= 0) continue;
              pool.doses.set(target, used + damage);
              target.health -= damage;
              if (target.health <= 0) destroy(target, pool.x, pool.y, 0.4);
            }
          }
        const key = `acid:${pool.id}`;
        const radius = Math.min(pool.maxRadius * 0.8, (pool.age - 0.4) * 9);
        const previous = burns.get(key);
        setBurn(key, {
          x: pool.x,
          y: pool.y,
          radius,
          color: "#a7ed45",
          heat: Math.min(0.6, pool.life - pool.age),
        });
        if (!previous || previous.radius !== radius) updateHoles(false);
      }
      return pool.age < pool.life;
    });
    cooldown -= dt;
    recoil = Math.max(0, recoil - dt * 9);
    if (!drone && shooting && weapon !== 8 && cooldown <= 0) {
      fire();
    }
    const direction = drone
      ? 0
      : Number(keys.has("KeyD") || keys.has("ArrowRight")) -
        Number(keys.has("KeyA") || keys.has("ArrowLeft"));
    player.x = Math.max(
      15,
      Math.min(width - 15, player.x + direction * 260 * dt),
    );
    player.step += Math.abs(direction) * dt * 15;
    const oldY = player.y;
    if (!drone && (keys.has("Space") || keys.has("KeyW"))) {
      player.vy = Math.max(
        -380,
        player.vy - (player.grounded ? 420 : 1550 * dt),
      );
      if (!gojoMode) spark(player.x, player.y, 1, colors.O500);
    }
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;
    player.grounded = false;
    if (player.vy >= 0 && !keys.has("KeyS")) {
      let floor = height - 15;
      for (const target of nearbyPlatforms(player.x, oldY - 3, player.y + 3)) {
        const rect = target.rect;
        if (
          target.destroyed ||
          target.letter ||
          (!target.border && borderedElements.has(target.element)) ||
          (!target.border && rect.width < 35) ||
          player.x < rect.left ||
          player.x > rect.right
        )
          continue;
        const top = surfaceTop(target, player.x);
        if (
          !target.destroyed &&
          !target.letter &&
          (target.border || !borderedElements.has(target.element)) &&
          (target.border || rect.width >= 35) &&
          player.x >= rect.left &&
          player.x <= rect.right &&
          oldY <= top + 3 &&
          player.y >= top
        ) {
          floor = Math.min(floor, top);
        }
      }
      if (player.y >= floor) {
        player.y = floor;
        player.vy = 0;
        player.grounded = true;
      }
    }
    if (player.y > height - 15) {
      player.y = height - 15;
      player.vy = 0;
      player.grounded = true;
    }
    if (player.y < 55) {
      player.y = 55;
      player.vy = 0;
    }

    laser = undefined;
    if (purpleShot) {
      purpleShot.age += dt;
      laserCharge = Math.min(0.45, purpleShot.age);
      if (purpleShot.age >= 0.45 && !purpleShot.beam) {
        fireLaser(0, purpleShot);
        purpleShot.beam = laser;
        castTimer = 0.25;
        screenShake = Math.max(screenShake, 6);
      }
      if (purpleShot.age >= 0.78) {
        purpleShot = undefined;
        laserCharge = 0;
      } else laser = purpleShot.beam;
    } else if (!gojoMode && !drone && shooting && weapon === 8) {
      fireLaser(dt);
    } else {
      laserCharge = 0;
    }
    blackHoles = blackHoles.filter((hole) => {
      hole.age += dt;
      const reach =
        hole.radius * Math.min(1, 0.3 + hole.age / (hole.blue ? 1.4 : 3.5));
      hole.budget = Math.min(3, hole.budget + dt * (hole.blue ? 40 : 24));
      while (hole.budget >= 1 && hole.cursor < hole.queue.length) {
        const item = hole.queue[hole.cursor];
        if (item.distance > reach) break;
        hole.cursor++;
        if (item.target.destroyed) continue;
        destroy(item.target, hole.x, hole.y, 0.5, true);
        hole.budget--;
      }
      const key = `black-hole:${hole.id}`;
      const radius = 20 + Math.min(65, hole.age * 10);
      const previous = burns.get(key);
      setBurn(key, {
        x: hole.x,
        y: hole.y,
        radius,
        color: hole.blue ? "#38aaff" : "#a66cff",
        heat: Math.max(0, Math.min(0.6, 7 - hole.age)),
      });
      if (!previous || radius - previous.radius > 0) updateHoles(false);
      return hole.age < 7;
    });
    nuclearBlasts = nuclearBlasts.filter((blast) => {
      blast.age += dt;
      const reached = blast.radius * Math.min(1, blast.age / 1.5);
      if (blast.age < 1.6) {
        screenShake = Math.max(screenShake, 22 * (1 - blast.age / 1.6));
        if (!blast.queue) {
          blast.queue = targets
            .filter((target) => !target.destroyed)
            .map((target) => ({
              target,
              distance: Math.hypot(
                Math.max(
                  target.rect.left,
                  Math.min(blast.x, target.rect.right),
                ) - blast.x,
                Math.max(
                  target.rect.top,
                  Math.min(blast.y, target.rect.bottom),
                ) - blast.y,
              ),
            }))
            .filter((item) => item.distance <= blast.radius)
            .sort((a, b) => a.distance - b.distance);
          blast.cursor = 0;
        }
        while ((blast.cursor ?? 0) < blast.queue.length) {
          const item = blast.queue[blast.cursor ?? 0];
          if (item.distance > reached) break;
          blast.cursor = (blast.cursor ?? 0) + 1;
          if (!item.target.destroyed) destroy(item.target, blast.x, blast.y, 4);
        }
        setBurn(`nuclear:${blast.id}`, {
          x: blast.x,
          y: blast.y,
          radius: reached * 0.82,
          color: "#ff9c33",
          heat: 1,
        });
        if (
          reached - blast.reached > 20 ||
          (reached === blast.radius && blast.reached < reached)
        ) {
          updateHoles(false);
          blast.reached = reached;
        }
      }
      return blast.age < 8;
    });
    duel.step(dt, player, width, height, blackHoles);
    if (duel.defeated) shooting = false;
    onCinematic(
      duel.active ||
        nuclearBlasts.length > 0 ||
        blackHoles.length > 0 ||
        acidPools.length > 0 ||
        !!drone ||
        !!laser ||
        redImpacts.length > 0 ||
        !!purpleShot,
    );
    onProgress(
      targets.length
        ? Math.floor((destroyedCount / targets.length) * 100)
        : 100,
    );
    flashes = flashes.filter((flash) => {
      flash.life -= dt;
      return flash.life > 0;
    });
    shockwaves = shockwaves.filter((wave) => {
      wave.life -= dt;
      return wave.life > 0;
    });

    burns.forEach((burn) => {
      burn.heat = Math.max(0, burn.heat - dt);
    });
    const fallingDrops: IProjectile[] = [];
    projectiles = projectiles.filter((bullet) => {
      if (bullet.acid && !bullet.acidDrop && (bullet.acidDrips ?? 0) < 3) {
        bullet.dripClock = (bullet.dripClock ?? 0) - dt;
        if (bullet.dripClock <= 0) {
          bullet.acidDrips = (bullet.acidDrips ?? 0) + 1;
          bullet.dripClock = 0.15 + Math.random() * 0.2;
          fallingDrops.push({
            x: bullet.x,
            y: bullet.y + 4,
            vx: bullet.vx * 0.12,
            vy: 45,
            life: 2.2,
            damage: 0,
            blastRadius: 0,
            gravity: 700,
            color: "#b2ef50",
            size: 3,
            hitTargets: new Set(),
            penetration: 0,
            acid: true,
            acidDrop: true,
          });
        }
      }
      if (bullet.gravity < 0) {
        burnBackground(
          bullet.x,
          bullet.y,
          12 + (0.38 - bullet.life) * 28,
          gamePalette.amber,
          dt,
        );
      }
      // Подшаги не дают быстрой пуле проскочить через маленькую подпись.
      const steps = Math.max(
        1,
        Math.ceil((Math.hypot(bullet.vx, bullet.vy) * dt) / 3),
      );
      for (let index = 0; index < steps; index++) {
        bullet.x += (bullet.vx * dt) / steps;
        bullet.y += (bullet.vy * dt) / steps;
        if (bullet.gojoRed && duel.contains(bullet.x, bullet.y, bullet.size)) {
          detonate(bullet);
          return false;
        }
        const hit = bullet.blackHole
          ? undefined
          : nearbyTargets(bullet.x, bullet.y).find(
              (target) =>
                !target.destroyed &&
                !bullet.hitTargets.has(target) &&
                (!target.cell ||
                  Math.min(
                    bullet.x - (target.surfaceRect ?? target.rect).left,
                    (target.surfaceRect ?? target.rect).right - bullet.x,
                    bullet.y - (target.surfaceRect ?? target.rect).top,
                    (target.surfaceRect ?? target.rect).bottom - bullet.y,
                  ) < 4) &&
                bullet.x >= target.rect.left &&
                bullet.x <= target.rect.right &&
                bullet.y >= target.rect.top - (target.border ? 3 : 0) &&
                bullet.y <= target.rect.bottom + (target.border ? 3 : 0) &&
                targetContains(target, bullet.x, bullet.y),
            );
        if (hit) {
          if (bullet.acid) {
            splashAcid(bullet.x, bullet.y, bullet.acidDrop);
            return false;
          }
          if (bullet.blastRadius) {
            detonate(bullet);
          } else if (bullet.gravity < 0) {
            if (!isBackgroundGone(bullet.x, bullet.y))
              ignite(hit, bullet.x, bullet.y);
          } else {
            hit.health -= bullet.damage;
            spark(bullet.x, bullet.y, 8, bullet.color);
            flashes.push({
              x: bullet.x,
              y: bullet.y,
              angle: Math.atan2(bullet.vy, bullet.vx),
              life: 0.12,
              color: bullet.color,
              size: 12,
            });
            if (hit.health <= 0) {
              destroy(
                hit,
                bullet.x,
                bullet.y,
                Math.min(1.8, bullet.damage),
                false,
                { x: bullet.vx, y: bullet.vy },
              );
            }
          }
          if (bullet.penetration > 0) {
            // Буквы и тонкие границы почти не тормозят снайперскую пулю.
            bullet.penetration -= hit.letter ? 0.15 : hit.border ? 0.35 : 3;
            bullet.hitTargets.add(hit);
            if (bullet.penetration <= 0) {
              return false;
            }
          } else if (hit.cell && !bullet.blastRadius) {
            bullet.hitTargets.add(hit);
          } else {
            return false;
          }
        }
        if (bullet.remainingRange !== undefined) {
          bullet.remainingRange -=
            (Math.hypot(bullet.vx, bullet.vy) * dt) / steps;
          if (bullet.remainingRange <= 0) {
            detonate(bullet);
            return false;
          }
        }
      }
      if (bullet.blastRadius && bullet.gravity === 0) {
        smoke(bullet.x, bullet.y, 1);
      }
      bullet.life -= dt;
      bullet.vy += bullet.gravity * dt;
      if (bullet.life <= 0 || (!bullet.blackHole && bullet.y > height - 5)) {
        if (bullet.acid) splashAcid(bullet.x, bullet.y, bullet.acidDrop);
        else if (bullet.blastRadius) {
          detonate(bullet);
        }
        return false;
      }
      return bullet.x > -20 && bullet.x < width + 20 && bullet.y > -30;
    });
    projectiles.push(...fallingDrops);
    particles = particles.filter((particle) => {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += (particle.kind === "smoke" ? -35 : GRAVITY * 0.5) * dt;
      if (particle.kind === "smoke") {
        particle.size += dt * 15;
      }
      return particle.life > 0;
    });
    debris = debris.filter((piece) => {
      if (duel.holdFragment(piece)) {
        piece.element.style.transform = `translate(${piece.x}px, ${piece.y}px) rotate(${piece.angle}rad)`;
        return true;
      }
      piece.repulsion = Math.max(0, (piece.repulsion ?? 0) - dt);
      const hole =
        piece.repulsion > 0
          ? undefined
          : piece.orbit
            ? blackHoles.find((hole) => hole.id === piece.orbit!.holeId)
            : blackHoles.find(
                (hole) =>
                  Math.hypot(
                    hole.x - piece.x - piece.centerX,
                    hole.y - piece.y - piece.centerY,
                  ) < hole.radius,
              );
      let suctionScale = 1;
      if (hole) {
        const orbit = piece.orbit ?? {
          holeId: hole.id,
          angle: Math.atan2(
            piece.y + piece.centerY - hole.y,
            piece.x + piece.centerX - hole.x,
          ),
          distance: Math.hypot(
            piece.x + piece.centerX - hole.x,
            piece.y + piece.centerY - hole.y,
          ),
        };
        piece.orbit = orbit;
        orbit.distance *= Math.exp(-dt * (hole.blue ? 2.8 : 0.75));
        if (!hole.blue)
          orbit.angle += dt * (2 + 3 * (1 - orbit.distance / hole.radius));
        if (orbit.distance < 10) {
          piece.element.remove();
          return false;
        }
        const nextX =
          hole.x + Math.cos(orbit.angle) * orbit.distance - piece.centerX;
        const nextY =
          hole.y + Math.sin(orbit.angle) * orbit.distance - piece.centerY;
        piece.vx = (nextX - piece.x) / dt;
        piece.vy = (nextY - piece.y) / dt;
        piece.x = nextX;
        piece.y = nextY;
        piece.spin = hole.blue ? 0 : 3 + 3 * (1 - orbit.distance / hole.radius);
        suctionScale = Math.min(1, orbit.distance / 55);
      } else {
        piece.orbit = undefined;
        piece.x += piece.vx * dt;
        piece.y += piece.vy * dt;
        piece.vy += GRAVITY * dt * 0.6;
      }
      piece.life -= dt;
      // Осколки отскакивают от нижней границы и от ещё целых платформ.
      const centerY = piece.y + piece.centerY;
      let floor = height - 6;
      if (!hole && piece.vy > 0) {
        for (const target of nearbyPlatforms(
          piece.x + piece.centerX,
          centerY - piece.vy * dt - piece.radius,
          centerY + piece.radius,
        )) {
          const x = piece.x + piece.centerX;
          if (
            target.destroyed ||
            target.letter ||
            (!target.border && borderedElements.has(target.element)) ||
            x <= target.rect.left ||
            x >= target.rect.right
          )
            continue;
          const top = surfaceTop(target, x);
          if (
            !target.destroyed &&
            !target.letter &&
            (target.border || !borderedElements.has(target.element)) &&
            x > target.rect.left &&
            x < target.rect.right &&
            centerY - piece.vy * dt + piece.radius <= top &&
            centerY + piece.radius >= top
          ) {
            floor = Math.min(floor, top);
          }
        }
        if (centerY + piece.radius >= floor) {
          piece.y = floor - piece.radius - piece.centerY;
          piece.vy *= -0.38;
          piece.vx *= 0.7;
          piece.spin *= 0.55;
        }
      }
      if (piece.x + piece.centerX < 0 || piece.x + piece.centerX > width) {
        piece.vx *= -0.7;
      }
      piece.angle += piece.spin * dt;
      piece.element.style.transform = `translate(${piece.x}px, ${piece.y}px) rotate(${piece.angle}rad) scale(${suctionScale})`;
      piece.element.style.opacity = String(Math.min(1, piece.life * 2));
      if (piece.life <= 0 || piece.y > height + 100) {
        piece.element.remove();
        return false;
      }
      return true;
    });
    audio.ambience({
      drone: drone ? 1 : 0,
      laser: !gojoMode && !drone && shooting && weapon === 8 ? 1 : 0,
      flame: !gojoMode && !drone && shooting && weapon === 5 ? 1 : 0,
      suction: blackHoles.some((hole) => !hole.blue) ? 1 : 0,
      blue: blackHoles.some((hole) => hole.blue) ? 1 : 0,
      acid: acidPools.some((pool) => pool.age > 0.4 && pool.age < pool.life)
        ? 1
        : 0,
    });
    screenShake = Math.max(0, screenShake - dt * 40);
  };

  const render = (time: number) => {
    const dt = Math.min((time - previousTime) / 1000, 0.035);
    previousTime = time;
    if (!paused) {
      step(dt);
    }
    if (maskDirty) {
      if (surfaceMaskDirty) {
        const holes: DOMRect[] = [],
          fractures: Array<{
            rect: DOMRect;
            points: readonly IFracturePoint[];
          }> = [],
          completed = new Set<ITarget["fractureGroup"]>();
        targets.forEach((target) => {
          if (!target.destroyed || target.letter) return;
          if (!target.shape) holes.push(target.rect);
          else if (target.fractureGroup?.parts.every((p) => p.destroyed)) {
            if (!completed.has(target.fractureGroup)) {
              holes.push(target.rect);
              completed.add(target.fractureGroup);
            }
          } else fractures.push({ rect: target.rect, points: target.shape });
        });
        cachedHoles = holes;
        cachedFractures = fractures;
        surfaceMaskDirty = false;
      }
      interfaceLayer.cut(cachedHoles, [...burns.values()], cachedFractures);
      maskDirty = false;
    }
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(
      (Math.random() - 0.5) * screenShake,
      (Math.random() - 0.5) * screenShake,
    );
    if (backgroundCtx) {
      drawSpaceBackground(
        backgroundCtx,
        width,
        height,
        paused ? previousTime : time,
        player.x,
      );
    }
    duel.drawBackground(ctx, time);
    let smolderSamples = 0;
    let smolderDraws = 0;
    const smolderStride = Math.max(
      1,
      Math.ceil((flamePatches.size * 30) / 640),
    );
    for (const [key, burn] of burns) {
      if (key.startsWith("flame:")) {
        if (burn.heat <= 0 || burn.radius <= 0 || smolderDraws >= 320) continue;
        const count = Math.min(
          30,
          Math.max(6, Math.ceil((burn.radius * Math.PI * 2) / 9)),
        );
        for (let index = 0; index < count; index++) {
          if (smolderSamples++ % smolderStride !== 0 || smolderDraws >= 320)
            continue;
          const angle = (index / count) * Math.PI * 2;
          const dx = Math.cos(angle);
          const dy = Math.sin(angle);
          // Перекрытые соседней пробоиной дуги не тлеют: только общий внешний край.
          if (
            isBackgroundGone(
              burn.x + dx * (burn.radius + 1.5),
              burn.y + dy * (burn.radius + 1.5),
            )
          )
            continue;
          const x = burn.x + dx * burn.radius;
          const y = burn.y + dy * burn.radius;
          const pulse =
            0.75 + Math.sin(time * 0.005 + x * 0.17 + y * 0.13) * 0.25;
          ctx.globalAlpha = Math.min(1, burn.heat / 0.7) * pulse;
          ctx.drawImage(smolderGlow, x - 8, y - 8, 16, 16);
          ctx.fillStyle = "#ffc46b";
          ctx.fillRect(x - 1, y - 1, 2, 2);
          smolderDraws++;
        }
        ctx.globalAlpha = 1;
        continue;
      }
      if (burn.heat <= 0) {
        continue;
      }
      ctx.save();
      ctx.globalAlpha = burn.heat;
      ctx.strokeStyle = burn.color;
      ctx.shadowColor = burn.color;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (burn.endX !== undefined && burn.endY !== undefined) {
        const angle = Math.atan2(burn.endY - burn.y, burn.endX - burn.x);
        for (const side of [-1, 1]) {
          const offsetX = -Math.sin(angle) * burn.radius * side;
          const offsetY = Math.cos(angle) * burn.radius * side;
          ctx.moveTo(burn.x + offsetX, burn.y + offsetY);
          ctx.lineTo(burn.endX + offsetX, burn.endY + offsetY);
        }
      } else ctx.arc(burn.x, burn.y, burn.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // Несколько соседних горящих букв/ячеек используют один готовый спрайт.
    // Физика нагрева и прожига остаётся независимой от числа видимых огоньков.
    const visibleFlames = new Map<
      string,
      { x: number; y: number; size: number; heat: number; alpha: number }
    >();
    const addFlame = (
      x: number,
      y: number,
      size: number,
      heat: number,
      alpha: number,
    ) => {
      if (isBackgroundGone(x, y)) return;
      const key = `${Math.floor(x / 60)}:${Math.floor(y / 60)}`;
      const previous = visibleFlames.get(key);
      if (!previous || heat > previous.heat)
        visibleFlames.set(key, { x, y, size, heat, alpha });
    };
    ignitions.forEach((fire) => {
      fire.spots.forEach((spot) =>
        addFlame(spot.x, spot.y, 8 + fire.heat * 10, fire.heat, 0.85),
      );
    });
    ctx.save();
    for (const flame of [...visibleFlames.values()]
      .sort((a, b) => b.heat - a.heat)
      .slice(0, 28)) {
      const size =
        flame.size * (0.9 + Math.sin(time * 0.013 + flame.x + flame.y) * 0.1);
      ctx.globalAlpha = flame.alpha;
      ctx.drawImage(
        backgroundFlame,
        flame.x - size * 0.65,
        flame.y - size * 1.6,
        size * 1.3,
        size * 1.8,
      );
    }
    ctx.restore();
    acidPools.forEach((pool) => drawAcidPool(ctx, pool));
    drawPlayer(time);
    if (drone) drawDrone(ctx, drone);
    if (laser && gojoMode) {
      ctx.save();
      ctx.globalAlpha = Math.min(
        1,
        Math.max(0, (0.78 - (purpleShot?.age ?? 0.45)) / 0.18),
      );
      drawPurpleBeam(ctx, laser, time);
      ctx.restore();
    }
    if (laser && !gojoMode) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      for (const [lineWidth, color, glowBlur] of [
        [laser.radius * 2 + 12, "#75f4ff33", 20],
        [laser.radius * 2, gamePalette.cyan, 12],
        [Math.max(2, laser.radius * 0.6), gamePalette.white, 0],
      ] as const) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.shadowColor = gamePalette.cyan;
        ctx.shadowBlur = glowBlur;
        ctx.beginPath();
        ctx.moveTo(laser.x, laser.y);
        ctx.lineTo(laser.endX, laser.endY);
        ctx.stroke();
      }
      const glow = ctx.createRadialGradient(
        laser.endX,
        laser.endY,
        0,
        laser.endX,
        laser.endY,
        26,
      );
      glow.addColorStop(0, gamePalette.white);
      glow.addColorStop(0.2, gamePalette.cyan);
      glow.addColorStop(1, "#75f4ff00");
      ctx.fillStyle = glow;
      ctx.fillRect(laser.endX - 26, laser.endY - 26, 52, 52);
      ctx.strokeStyle = gamePalette.cyan;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(laser.x, laser.y, 6 + Math.sin(time * 0.03) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    for (const wave of shockwaves) {
      const phase = 1 - wave.life / 0.6;
      ctx.save();
      ctx.globalAlpha = 1 - phase;
      const glow = ctx.createRadialGradient(
        wave.x,
        wave.y,
        0,
        wave.x,
        wave.y,
        wave.radius * (0.25 + phase),
      );
      glow.addColorStop(0, "#fff1ca88");
      glow.addColorStop(0.3, "#ff9e4544");
      glow.addColorStop(1, "#ff9e4500");
      ctx.fillStyle = glow;
      ctx.fillRect(
        wave.x - wave.radius * 2,
        wave.y - wave.radius * 2,
        wave.radius * 4,
        wave.radius * 4,
      );
      ctx.strokeStyle = gamePalette.amber;
      ctx.lineWidth = 3 * (1 - phase);
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.radius * phase, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    for (const flash of flashes) {
      ctx.save();
      ctx.translate(flash.x, flash.y);
      ctx.rotate(flash.angle);
      ctx.globalAlpha = Math.min(1, flash.life * 12);
      ctx.shadowColor = flash.color;
      ctx.shadowBlur = 18;
      ctx.fillStyle = gamePalette.amber;
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(flash.size * 0.4, -flash.size * 0.4);
      ctx.lineTo(flash.size * 0.3, -3);
      ctx.lineTo(flash.size, 0);
      ctx.lineTo(flash.size * 0.3, 3);
      ctx.lineTo(flash.size * 0.4, flash.size * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = gamePalette.white;
      ctx.fillRect(0, -2, flash.size * 0.5, 4);
      ctx.restore();
    }
    let flameProjectiles = 0;
    for (const bullet of projectiles) {
      if (bullet.gravity < 0) {
        // Все частицы греют фон; видима одна из трёх, без дорогой тени.
        if (flameProjectiles++ % 3 !== 0) continue;
        const size = 9 + (0.38 - bullet.life) * 12;
        ctx.drawImage(
          backgroundFlame,
          bullet.x - size * 0.6,
          bullet.y - size,
          size * 1.2,
          size * 1.8,
        );
        continue;
      }
      ctx.save();
      if (bullet.gojoBlue || bullet.gojoRed) {
        drawTechniqueOrb(
          ctx,
          bullet.x,
          bullet.y,
          bullet.gojoBlue ? 12 : 15,
          bullet.gojoBlue ? 1 : 2,
          time,
        );
        ctx.restore();
        continue;
      }
      if (bullet.blackHole) {
        ctx.fillStyle = "#05030e";
        ctx.strokeStyle = "#bc83ff";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#bd8cff";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        continue;
      }
      if (bullet.nuclear) {
        ctx.translate(bullet.x, bullet.y);
        ctx.rotate(Math.atan2(bullet.vy, bullet.vx));
        ctx.scale(0.65, 0.65);
        drawNuclearBomb(ctx);
        ctx.restore();
        continue;
      }
      ctx.strokeStyle = bullet.color;
      ctx.lineWidth = Math.max(1, bullet.size * 0.7);
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.moveTo(bullet.x - bullet.vx * 0.025, bullet.y - bullet.vy * 0.025);
      ctx.lineTo(bullet.x, bullet.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (const particle of particles) {
      ctx.globalAlpha =
        Math.min(1, particle.life * 2) * (particle.kind === "smoke" ? 0.2 : 1);
      ctx.fillStyle = particle.color;
      if (particle.kind === "smoke") {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(
          particle.x,
          particle.y,
          particle.size,
          particle.kind === "shell" ? 2 : particle.size,
        );
      }
    }
    ctx.globalAlpha = 1;
    blackHoles.forEach((hole) =>
      hole.blue
        ? drawTechniqueOrb(
            ctx,
            hole.x,
            hole.y,
            26 + Math.min(24, hole.age * 10),
            1,
            time,
          )
        : drawBlackHole(ctx, hole),
    );
    redImpacts.forEach((impact) => drawRedImpact(ctx, impact));
    nuclearBlasts.forEach((blast) =>
      drawNuclearExplosion(ctx, blast, width, height),
    );
    duel.draw(ctx, time);
    ctx.strokeStyle = colors.G600;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(aim.x, aim.y, 8, 0, Math.PI * 2);
    ctx.moveTo(aim.x - 13, aim.y);
    ctx.lineTo(aim.x - 4, aim.y);
    ctx.moveTo(aim.x + 4, aim.y);
    ctx.lineTo(aim.x + 13, aim.y);
    ctx.moveTo(aim.x, aim.y - 13);
    ctx.lineTo(aim.x, aim.y - 4);
    ctx.moveTo(aim.x, aim.y + 4);
    ctx.lineTo(aim.x, aim.y + 13);
    ctx.stroke();
    ctx.restore();
    frame = requestAnimationFrame(render);
  };

  document.addEventListener("keydown", keyDown, true);
  document.addEventListener("keyup", keyUp, true);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("contextmenu", contextMenu);
  canvas.addEventListener("wheel", wheel, { passive: false });
  window.addEventListener("pointerup", pointerUp);
  window.addEventListener("blur", blur);
  window.addEventListener("resize", resizeCanvas);
  onProgress(targets.length ? 0 : 100);
  frame = requestAnimationFrame(render);

  return {
    launchDrone,
    activateInfinity,
    expandDomain,
    summonSukuna,
    setMuted: audio.setMuted,
    resume: () => setPaused(false),
    pause: () => setPaused(true),
    setMode: (gojo: boolean) => {
      if (purpleShot) return;
      gojoMode = gojo;
      duel.setEnabled(gojo);
      shooting = false;
      laserCharge = 0;
      purpleShot = undefined;
      lastLaserCutKey = "";
      laser = undefined;
      cooldown = 0;
      castTimer = 0;
      projectiles = [];
      blackHoles = [];
      redImpacts = [];
      nuclearBlasts = [];
      acidPools = [];
      ignitions.clear();
      flamePatches.clear();
      drone = undefined;
      onDrone(false);
      onCinematic(false);
      weapon = gojo ? 10 : 1;
      onWeapon(weapon);
      onMode(gojo);
    },
    setWeapon: (value: number) => {
      if (purpleShot) return;
      if (gojoMode && !gojoWeapons.includes(value)) return;
      if (value !== weapon) {
        laserCharge = 0;
        purpleShot = undefined;
      }
      weapon = value;
      onWeapon(value);
    },
    dispose: () => {
      audio.dispose();
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", keyDown, true);
      document.removeEventListener("keyup", keyUp, true);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("contextmenu", contextMenu);
      canvas.removeEventListener("wheel", wheel);
      window.removeEventListener("pointerup", pointerUp);
      window.removeEventListener("blur", blur);
      window.removeEventListener("resize", resizeCanvas);
      debris.forEach((piece) => piece.element.remove());
      interfaceLayer.dispose();
      backgroundCtx?.clearRect(0, 0, width, height);
      ctx.clearRect(0, 0, width, height);
    },
  };
};
