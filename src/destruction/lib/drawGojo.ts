export const techniqueColors = ["#38aaff", "#ff3459", "#be6bff"] as const;

// Энергетическая сфера: яркое ядро, разорванные кольца и направленные всполохи.
export const drawTechniqueOrb = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  technique: number,
  time: number,
) => {
  const color = techniqueColors[technique - 1] ?? techniqueColors[2];
  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = "lighter";
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 2.1);
  glow.addColorStop(0, "#ffffff");
  glow.addColorStop(0.18, color);
  glow.addColorStop(0.5, `${color}80`);
  glow.addColorStop(1, `${color}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(-radius * 2.1, -radius * 2.1, radius * 4.2, radius * 4.2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const angle = time * 0.0015 * (i % 2 ? -1 : 1) + i * 2;
    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      radius * (1.05 + i * 0.13),
      radius * 0.55,
      angle,
      0.2,
      5.3,
    );
    ctx.stroke();
  }
  ctx.strokeStyle = "#e7e9ff";
  ctx.lineWidth = 1.3;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const phase = (time * 0.0008 + i * 0.137) % 1;
    const r =
      technique === 1
        ? radius * (2.3 - phase * 1.3)
        : radius * (1 + phase * 1.4);
    ctx.globalAlpha = Math.sin(phase * Math.PI) * 0.8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(
      Math.cos(a) * (r + radius * 0.35),
      Math.sin(a) * (r + radius * 0.35),
    );
    ctx.stroke();
  }
  ctx.restore();
};

const polygonFlightCoat = (ctx: CanvasRenderingContext2D, time: number) => {
  const sway = Math.sin(time * 0.004) * 3;
  ctx.fillStyle = "#1a1931";
  ctx.beginPath();
  ctx.moveTo(-12, -56);
  ctx.lineTo(-19, -43);
  ctx.lineTo(-22 + sway, -30);
  ctx.lineTo(-9, -35);
  ctx.closePath();
  ctx.fill();
};

// Local centre of the sphere just beyond the casting hand.
const getCastPoint = (angle: number) => ({
  x: 13 + Math.cos(angle) * 41,
  y: -56 + Math.sin(angle) * 41,
});

export const getGojoCastOrigin = (
  player: { x: number; y: number; flying?: boolean },
  angle: number,
  time: number,
) => {
  const facing = Math.cos(angle) >= 0 ? 1 : -1;
  const local = getCastPoint(
    Math.atan2(Math.sin(angle), Math.cos(angle) * facing),
  );
  const tilt = player.flying ? -0.05 : 0;
  return {
    x:
      player.x + facing * (local.x * Math.cos(tilt) - local.y * Math.sin(tilt)),
    y:
      player.y +
      (player.flying ? Math.sin(time * 0.003) * 2 : 0) +
      local.x * Math.sin(tilt) +
      local.y * Math.cos(tilt),
  };
};

export const drawGojo = (
  ctx: CanvasRenderingContext2D,
  player: { x: number; y: number; step: number; flying?: boolean },
  aim: { x: number; y: number },
  technique: number,
  casting: number,
  charge: number,
  time: number,
) => {
  ctx.save();
  ctx.translate(player.x, player.y);
  const facing = aim.x >= player.x ? 1 : -1;
  ctx.scale(facing, 1);
  if (player.flying) {
    ctx.translate(0, Math.sin(time * 0.003) * 2);
    ctx.rotate(-0.05);
    ctx.save();
    ctx.strokeStyle = "#7aaaff";
    ctx.lineWidth = 1;
    for (let i = 0; i < 2; i++) {
      ctx.globalAlpha = 0.18 + i * 0.05;
      ctx.beginPath();
      ctx.ellipse(
        0,
        -45,
        26 + i * 5,
        42 + i * 3,
        Math.sin(time * 0.0015) * 0.1,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    ctx.restore();
    polygonFlightCoat(ctx, time);
  }
  const stride = player.flying
      ? 3 + Math.sin(time * 0.002) * 1.5
      : Math.sin(player.step) * 4,
    breath = Math.sin(time * 0.002) * 0.7;
  const active = casting > 0 || charge > 0;
  const polygon = (points: number[][], fill: string, outline = "#111324") => {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (outline) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  };
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // Брюки с отдельными коленями, складками и ботинками.
  polygon(
    [
      [-10, -32],
      [-1, -32],
      [-2 + stride * 0.3, -18],
      [-5 + stride, -5],
      [-13 + stride, -5],
      [-11, -18],
    ],
    "#191a2e",
  );
  polygon(
    [
      [0, -32],
      [10, -31],
      [10, -19],
      [12 - stride, -5],
      [4 - stride, -5],
      [1, -19],
    ],
    "#23243e",
  );
  ctx.strokeStyle = "#44445f";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-8, -27);
  ctx.lineTo(-7 + stride * 0.3, -17);
  ctx.moveTo(5, -27);
  ctx.lineTo(7, -18);
  ctx.stroke();
  polygon(
    [
      [-13 + stride, -7],
      [-5 + stride, -7],
      [-2 + stride, -2],
      [-2 + stride, 0],
      [-17 + stride, 0],
      [-17 + stride, -3],
    ],
    "#0a0b15",
  );
  polygon(
    [
      [4 - stride, -7],
      [12 - stride, -7],
      [18 - stride, -3],
      [18 - stride, 0],
      [3 - stride, 0],
    ],
    "#10111e",
  );
  ctx.strokeStyle = "#676579";
  ctx.beginPath();
  ctx.moveTo(-16 + stride, -1);
  ctx.lineTo(-3 + stride, -1);
  ctx.moveTo(4 - stride, -1);
  ctx.lineTo(17 - stride, -1);
  ctx.stroke();
  ctx.translate(0, breath);
  // Высокий воротник, асимметричный шов и светлые кромки тёмного костюма.
  polygon(
    [
      [-11, -66],
      [8, -68],
      [15, -56],
      [13, -38],
      [16, -31],
      [2, -29],
      [-15, -32],
      [-13, -51],
    ],
    "#27233f",
  );
  polygon(
    [
      [-11, -65],
      [-4, -62],
      [-4, -34],
      [-13, -35],
    ],
    "#17182d",
    "",
  );
  polygon(
    [
      [3, -61],
      [9, -60],
      [11, -39],
      [5, -32],
      [-1, -32],
    ],
    "#363052",
    "",
  );
  ctx.strokeStyle = "#615777";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(7, -62);
  ctx.lineTo(5, -34);
  ctx.moveTo(-10, -48);
  ctx.lineTo(-7, -39);
  ctx.moveTo(3, -37);
  ctx.lineTo(11, -38);
  ctx.stroke();
  ctx.fillStyle = "#a39bb1";
  ctx.fillRect(7, -56, 1.5, 1.5);
  ctx.fillRect(6, -47, 1.5, 1.5);
  polygon(
    [
      [-4, -74],
      [6, -74],
      [5, -63],
      [-4, -64],
    ],
    "#e3bdb0",
  );
  // Лицо в профиль: подбородок, нос, ухо и повязка с узлом.
  polygon(
    [
      [-9, -91],
      [6, -92],
      [11, -84],
      [13, -80],
      [9, -78],
      [8, -71],
      [3, -68],
      [-5, -71],
      [-8, -78],
    ],
    "#f3d8cd",
  );
  polygon(
    [
      [-8, -84],
      [-4, -82],
      [-5, -74],
      [-8, -77],
    ],
    "#d6ab9e",
    "",
  );
  ctx.fillStyle = "#f8dfd2";
  ctx.beginPath();
  ctx.ellipse(-8, -79, 2.8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#b48985";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-9, -80);
  ctx.lineTo(-7, -79);
  ctx.moveTo(5, -73);
  ctx.lineTo(9, -74);
  ctx.stroke();
  polygon(
    [
      [-11, -86],
      [8, -88],
      [11, -83],
      [9, -79],
      [-10, -78],
    ],
    "#111321",
  );
  ctx.strokeStyle = "#41455e";
  ctx.beginPath();
  ctx.moveTo(-8, -83);
  ctx.lineTo(7, -85);
  ctx.stroke();
  polygon(
    [
      [-10, -84],
      [-16, -82],
      [-13, -78],
      [-10, -80],
    ],
    "#1b1b2e",
  );
  polygon(
    [
      [-14, -80],
      [-21, -72 + Math.sin(time * 0.005) * 2],
      [-16, -75],
      [-12, -80],
    ],
    "#1c1d31",
  );
  // Несколько слоёв серебристых прядей вместо плоского силуэта.
  polygon(
    [
      [-10, -83],
      [-16, -92],
      [-10, -92],
      [-13, -99],
      [-5, -97],
      [-5, -105],
      [1, -100],
      [5, -108],
      [9, -99],
      [16, -103],
      [14, -96],
      [20, -96],
      [13, -89],
      [10, -83],
      [5, -88],
      [-1, -85],
    ],
    "#dceaf6",
    "#8fa6c2",
  );
  polygon(
    [
      [-10, -93],
      [-6, -99],
      [-3, -93],
      [-2, -103],
      [3, -97],
      [6, -105],
      [9, -95],
      [15, -99],
      [10, -90],
      [5, -91],
      [2, -86],
      [-2, -91],
    ],
    "#ffffff",
    "",
  );
  ctx.strokeStyle = "#aebfd4";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-9, -91);
  ctx.lineTo(-4, -87);
  ctx.moveTo(-2, -98);
  ctx.lineTo(1, -89);
  ctx.moveTo(7, -97);
  ctx.lineTo(6, -89);
  ctx.moveTo(13, -95);
  ctx.lineTo(9, -87);
  ctx.stroke();
  polygon(
    [
      [-11, -71],
      [1, -67],
      [9, -70],
      [12, -62],
      [4, -59],
      [-10, -63],
    ],
    "#282440",
  );
  ctx.strokeStyle = "#6b5b82";
  ctx.beginPath();
  ctx.moveTo(-9, -69);
  ctx.lineTo(1, -64);
  ctx.lineTo(9, -67);
  ctx.stroke();
  const angle = Math.atan2(
    aim.y - (player.y - 48),
    (aim.x - player.x) * facing,
  );
  const elbow = { x: 13 + Math.cos(angle) * 13, y: -56 + Math.sin(angle) * 13 };
  const hand = { x: 13 + Math.cos(angle) * 29, y: -56 + Math.sin(angle) * 29 };
  ctx.strokeStyle = "#18192e";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(8, -62);
  ctx.lineTo(elbow.x, elbow.y);
  ctx.lineTo(hand.x - Math.cos(angle) * 6, hand.y - Math.sin(angle) * 6);
  ctx.stroke();
  ctx.strokeStyle = "#4e456b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, -64);
  ctx.lineTo(elbow.x + 1, elbow.y - 3);
  ctx.stroke();
  ctx.save();
  ctx.translate(hand.x, hand.y);
  ctx.rotate(angle);
  polygon(
    [
      [-7, -4],
      [-1, -4],
      [3, -1],
      [3, 3],
      [-6, 4],
    ],
    "#efd0c1",
    "#b89591",
  );
  ctx.strokeStyle = "#f9dfd1";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(active ? 9 : 6, -3);
  ctx.moveTo(0, 1);
  ctx.lineTo(active ? 8 : 5, 0);
  ctx.stroke();
  ctx.restore();
  // Вторая рука помогает сливать техники, в покое остаётся у бедра.
  ctx.strokeStyle = "#1c1c31";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-9, -62);
  if (active && technique === 3) {
    ctx.lineTo(-8, -51);
    ctx.lineTo(hand.x - 5, hand.y + 11);
  } else {
    ctx.lineTo(-16, -47);
    ctx.lineTo(-11, -34);
  }
  ctx.stroke();
  ctx.fillStyle = "#edcbbd";
  ctx.beginPath();
  ctx.ellipse(
    active && technique === 3 ? hand.x - 4 : -11,
    active && technique === 3 ? hand.y + 10 : -33,
    3,
    4,
    0.3,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  if (active) {
    const { x, y } = getCastPoint(angle);
    if (technique === 3 && charge < 0.45) {
      const separation = 18 * (1 - Math.min(1, charge / 0.45));
      drawTechniqueOrb(ctx, x, y - separation, 5, 1, time);
      drawTechniqueOrb(ctx, x, y + separation, 5, 2, time);
    } else
      drawTechniqueOrb(
        ctx,
        x,
        y,
        8 + Math.min(0.5, charge) * 8,
        technique,
        time,
      );
  }
  ctx.restore();
};

export const drawRedImpact = (
  ctx: CanvasRenderingContext2D,
  impact: { x: number; y: number; age: number; radius: number },
) => {
  const t = impact.age / 0.7;
  ctx.save();
  ctx.translate(impact.x, impact.y);
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = Math.max(0, 1 - t);
  ctx.strokeStyle = "#ff3459";
  ctx.lineWidth = 6 * (1 - t) + 1;
  ctx.beginPath();
  ctx.arc(0, 0, impact.radius * Math.min(1, t * 1.6), 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const r = impact.radius * t;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }
  if (t < 0.3)
    drawTechniqueOrb(ctx, 0, 0, 18 * (1 - t / 0.3), 2, impact.age * 1000);
  ctx.restore();
};

export const drawPurpleBeam = (
  ctx: CanvasRenderingContext2D,
  beam: { x: number; y: number; endX: number; endY: number; radius: number },
  time: number,
) => {
  const angle = Math.atan2(beam.endY - beam.y, beam.endX - beam.x);
  const length = Math.hypot(beam.endX - beam.x, beam.endY - beam.y);
  ctx.save();
  ctx.translate(beam.x, beam.y);
  ctx.rotate(angle);
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (const [w, color] of [
    [beam.radius * 2 + 18, "#8238ff30"],
    [beam.radius * 2 + 6, "#ad46ff80"],
    [beam.radius * 2, "#bc7bff"],
    [7, "#f7eaff"],
  ] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length, 0);
    ctx.stroke();
  }
  ctx.strokeStyle = "#d9b7ff";
  ctx.lineWidth = 1.5;
  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath();
    for (let x = 0; x <= length; x += 22) {
      const y =
        side * (beam.radius + 5) + Math.sin(x * 0.08 - time * 0.025) * 4;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  drawTechniqueOrb(ctx, 0, 0, 18, 3, time);
  drawTechniqueOrb(ctx, length, 0, 24, 3, time);
  ctx.restore();
};
