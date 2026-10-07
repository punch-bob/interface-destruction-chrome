/** Detailed shrine cached once, at the same size as the original model. */
export const createSukunaShrine = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 180;
  canvas.height = 170;
  const c = canvas.getContext("2d")!;
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  };
  const shape = (points: number[][], color: string, outline = "") => {
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fillStyle = color;
    c.fill();
    if (outline) {
      c.strokeStyle = outline;
      c.lineWidth = 1.5;
      c.stroke();
    }
  };
  const line = (points: number[][], color: string, width = 1) => {
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
  };
  const skull = (x: number, y: number, scale = 1) => {
    c.save();
    c.translate(x, y);
    c.scale(scale, scale);
    shape(
      [
        [-7, -7],
        [-3, -10],
        [3, -10],
        [7, -7],
        [8, -1],
        [5, 3],
        [4, 8],
        [-4, 8],
        [-5, 3],
        [-8, -1],
      ],
      "#d7bba1",
      "#4b2539",
    );
    shape(
      [
        [-7, -3],
        [-2, -4],
        [-1, 0],
        [-4, 2],
        [-7, 0],
      ],
      "#321b29",
    );
    shape(
      [
        [2, -4],
        [7, -3],
        [7, 0],
        [4, 2],
        [1, 0],
      ],
      "#321b29",
    );
    shape(
      [
        [0, 0],
        [2, 4],
        [-2, 4],
      ],
      "#6d3b44",
    );
    rect(-4, 5, 8, 1, "#fff0cc");
    for (let x = -3; x <= 3; x += 2) rect(x, 5, 1, 4, "#74434a");
    line(
      [
        [-5, -7],
        [-2, -8],
        [2, -8],
      ],
      "#f8dec0",
      1.5,
    );
    c.restore();
  };
  // Layered stone plinth and wide stairs, with visible chips and joins.
  shape(
    [
      [24, 128],
      [156, 128],
      [165, 145],
      [15, 145],
    ],
    "#482538",
    "#211321",
  );
  rect(18, 143, 144, 8, "#a96766");
  rect(12, 151, 156, 8, "#663c4f");
  rect(5, 159, 170, 9, "#b77d72");
  rect(18, 143, 144, 2, "#e6a287");
  rect(12, 151, 156, 2, "#bd8b80");
  rect(5, 159, 170, 2, "#edb495");
  for (let x = 19; x < 170; x += 24) {
    line(
      [
        [x, 161],
        [x - 3, 166],
      ],
      "#70434b",
    );
    line(
      [
        [x + 5, 145],
        [x + 3, 149],
      ],
      "#70434b",
    );
  }
  // Recessed walls and a fang-lined mouth instead of a flat doorway.
  rect(27, 64, 126, 73, "#4d2036");
  rect(33, 74, 114, 59, "#281424");
  shape(
    [
      [58, 86],
      [66, 75],
      [114, 75],
      [122, 86],
      [124, 127],
      [118, 137],
      [62, 137],
      [56, 127],
    ],
    "#100e1b",
    "#a25a5e",
  );
  shape(
    [
      [65, 85],
      [74, 79],
      [107, 79],
      [115, 85],
      [113, 129],
      [67, 129],
    ],
    "#211021",
  );
  shape(
    [
      [67, 111],
      [78, 105],
      [100, 105],
      [112, 112],
      [106, 124],
      [73, 124],
    ],
    "#471b2d",
  );
  line(
    [
      [69, 118],
      [78, 114],
      [98, 114],
      [109, 118],
    ],
    "#912c42",
    3,
  );
  for (let x = 64; x < 118; x += 10) {
    shape(
      [
        [x, 83],
        [x + 7, 83],
        [x + 3, 95 + (x % 3)],
      ],
      "#d9baa1",
      "#6e3c49",
    );
    shape(
      [
        [x, 132],
        [x + 7, 132],
        [x + 4, 122],
      ],
      "#c3a08e",
    );
  }
  // Bone columns, jointed supports and curled side ribs.
  for (const x of [39, 135]) {
    rect(x - 6, 68, 12, 67, "#8e5559");
    rect(x - 3, 72, 5, 61, "#dfb49a");
    rect(x - 1, 77, 2, 49, "#fae0b8");
    for (let y = 83; y < 127; y += 12) {
      shape(
        [
          [x - 7, y],
          [x - 3, y - 2],
          [x + 5, y],
          [x + 7, y + 4],
          [x - 5, y + 5],
        ],
        "#c19482",
        "#593040",
      );
    }
    rect(x - 9, 128, 18, 8, "#5e3446");
    rect(x - 7, 128, 14, 2, "#e3ae8e");
    skull(x, 71, 1.05);
  }
  for (let side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const x = 90 + side * (59 + i * 5),
        y = 94 + i * 12;
      line(
        [
          [x, y - 7],
          [x + side * 7, y],
          [x + side * 6, y + 8],
          [x, y + 12],
        ],
        "#211421",
        6,
      );
      line(
        [
          [x, y - 7],
          [x + side * 7, y],
          [x + side * 6, y + 8],
          [x, y + 12],
        ],
        "#b88677",
        3,
      );
    }
  }
  // Ornate upward-curving eaves in two tiers; the roof has individual tile rows.
  shape(
    [
      [7, 46],
      [25, 49],
      [45, 39],
      [74, 22],
      [90, 10],
      [106, 22],
      [136, 39],
      [155, 49],
      [173, 46],
      [167, 59],
      [145, 63],
      [35, 63],
      [13, 59],
    ],
    "#241828",
    "#ae555c",
  );
  shape(
    [
      [26, 48],
      [48, 38],
      [75, 23],
      [90, 16],
      [105, 23],
      [132, 38],
      [154, 48],
      [135, 52],
      [45, 52],
    ],
    "#583044",
  );
  for (let i = 0; i < 5; i++) {
    const y = 29 + i * 5,
      spread = 12 + i * 10;
    line(
      [
        [90 - spread, y],
        [90, y - 4],
        [90 + spread, y],
      ],
      "#995461",
      1.5,
    );
  }
  for (let side of [-1, 1])
    for (let i = 1; i < 6; i++)
      line(
        [
          [90 + side * i * 6, 25 + i * 3],
          [90 + side * i * 11, 49],
        ],
        "#352035",
        1,
      );
  line(
    [
      [10, 48],
      [24, 54],
      [44, 56],
      [90, 54],
      [136, 56],
      [156, 54],
      [170, 48],
    ],
    "#e5937e",
    3,
  );
  rect(28, 59, 124, 6, "#7c3046");
  rect(31, 60, 118, 2, "#d27e74");
  for (let x = 48; x < 137; x += 21) {
    rect(x - 4, 63, 8, 8, "#ad6464");
    rect(x - 2, 63, 4, 3, "#edb294");
  }
  shape(
    [
      [46, 55],
      [64, 43],
      [90, 29],
      [116, 43],
      [134, 55],
      [130, 68],
      [112, 64],
      [90, 61],
      [68, 64],
      [50, 68],
    ],
    "#3d2134",
    "#8e4856",
  );
  line(
    [
      [49, 57],
      [66, 49],
      [90, 37],
      [114, 49],
      [131, 57],
    ],
    "#d18a78",
    2,
  );
  shape(
    [
      [69, 59],
      [80, 47],
      [90, 43],
      [100, 47],
      [111, 59],
    ],
    "#562c3d",
    "#b96e66",
  );
  skull(90, 53, 0.7);
  // Horned finial and carved skull brackets under the eaves.
  shape(
    [
      [84, 17],
      [80, 11],
      [81, 4],
      [86, 9],
      [90, 11],
      [95, 8],
      [99, 3],
      [99, 11],
      [95, 17],
    ],
    "#c6a08c",
    "#5e3447",
  );
  skull(90, 19, 0.55);
  skull(21, 61, 0.7);
  skull(159, 61, 0.7);
  line(
    [
      [57, 72],
      [90, 68],
      [123, 72],
    ],
    "#b46c65",
    2,
  );
  return canvas;
};
