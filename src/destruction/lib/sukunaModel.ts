/** Four cached side-view poses; the combat renderer draws one image per frame. */
export const createSukunaSprites = () => {
  const paint = (trueForm: boolean, casting: boolean) => {
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 128;
    const c = canvas.getContext("2d")!;
    const ink = "#291f32",
      skin = "#e6af92",
      shade = "#b87876",
      light = "#f9d2af";
    const robe = "#f0e6d2",
      fold = "#c6b8ac",
      deepFold = "#998899";
    const rect = (
      x: number,
      y: number,
      w: number,
      h: number,
      color: string,
    ) => {
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
    const line = (points: number[][], color: string, width = 2) => {
      c.strokeStyle = color;
      c.lineWidth = width;
      c.lineJoin = "miter";
      c.beginPath();
      points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.stroke();
    };
    // Feet remain visible beneath the long overlapping hem.
    shape(
      [
        [35, 103],
        [45, 103],
        [43, 119],
        [48, 122],
        [47, 126],
        [27, 126],
        [28, 122],
        [34, 119],
      ],
      shade,
      ink,
    );
    shape(
      [
        [49, 103],
        [58, 104],
        [59, 119],
        [68, 122],
        [69, 126],
        [49, 126],
        [47, 122],
      ],
      skin,
      ink,
    );
    rect(27, 124, 21, 3, "#272134");
    rect(49, 124, 21, 3, "#272134");
    line(
      [
        [33, 121],
        [43, 122],
      ],
      ink,
      3,
    );
    line(
      [
        [54, 121],
        [63, 122],
      ],
      ink,
      3,
    );
    rect(30, 126, 16, 1, "#78636c");
    rect(52, 126, 16, 1, "#78636c");
    // Far sleeve and hand sit behind the body, giving the profile depth.
    shape(
      [
        [35, 39],
        [26, 43],
        [21, 61],
        [27, 72],
        [39, 69],
        [44, 47],
      ],
      fold,
      ink,
    );
    shape(
      [
        [27, 66],
        [33, 67],
        [31, 80],
        [35, 88],
        [29, 91],
        [24, 84],
      ],
      shade,
      ink,
    );
    line(
      [
        [26, 76],
        [32, 77],
      ],
      ink,
      3,
    );
    if (trueForm) {
      shape(
        [
          [34, 64],
          [25, 68],
          [17, 83],
          [24, 89],
          [35, 75],
        ],
        deepFold,
        ink,
      );
      shape(
        [
          [19, 82],
          [24, 86],
          [20, 98],
          [13, 101],
          [11, 95],
        ],
        shade,
        ink,
      );
      line(
        [
          [15, 92],
          [21, 94],
        ],
        ink,
        3,
      );
    }
    // Long white robe, loose sleeves, a deep lapel and a dark obi.
    shape(
      [
        [35, 36],
        [51, 36],
        [61, 44],
        [60, 71],
        [67, 109],
        [61, 117],
        [44, 115],
        [36, 118],
        [23, 112],
        [30, 78],
        [29, 49],
      ],
      robe,
      ink,
    );
    shape(
      [
        [31, 49],
        [37, 45],
        [37, 76],
        [31, 108],
        [37, 116],
        [25, 111],
      ],
      fold,
    );
    shape(
      [
        [43, 77],
        [49, 77],
        [46, 111],
        [42, 115],
        [37, 114],
      ],
      "#ddd0bf",
    );
    shape(
      [
        [52, 78],
        [59, 78],
        [64, 110],
        [58, 113],
        [57, 95],
      ],
      fold,
    );
    line(
      [
        [35, 82],
        [30, 108],
        [34, 111],
      ],
      deepFold,
      1.5,
    );
    line(
      [
        [48, 86],
        [46, 105],
        [48, 111],
      ],
      fold,
      1.5,
    );
    line(
      [
        [57, 87],
        [61, 108],
      ],
      "#ad9ba0",
      1.5,
    );
    line(
      [
        [26, 111],
        [36, 115],
        [43, 112],
        [60, 114],
      ],
      "#fff6e3",
      2,
    );
    // Exposed neck and chest under the crossed collar.
    shape(
      [
        [41, 31],
        [53, 30],
        [52, 38],
        [57, 44],
        [48, 59],
        [39, 42],
      ],
      skin,
      ink,
    );
    shape(
      [
        [41, 35],
        [48, 36],
        [48, 49],
        [43, 44],
      ],
      shade,
    );
    line(
      [
        [48, 36],
        [46, 40],
        [49, 43],
        [47, 47],
      ],
      ink,
      2,
    );
    shape(
      [
        [35, 37],
        [41, 36],
        [49, 56],
        [45, 66],
        [39, 53],
        [32, 44],
      ],
      "#fff5df",
      fold,
    );
    shape(
      [
        [53, 37],
        [59, 42],
        [52, 54],
        [45, 69],
        [41, 71],
        [48, 52],
      ],
      fold,
    );
    line(
      [
        [56, 42],
        [50, 54],
        [44, 67],
      ],
      "#fff5e0",
      3,
    );
    shape(
      [
        [31, 72],
        [59, 72],
        [60, 80],
        [30, 80],
      ],
      "#35283e",
      ink,
    );
    rect(33, 74, 24, 2, "#695165");
    shape(
      [
        [53, 73],
        [59, 75],
        [56, 82],
        [52, 81],
      ],
      "#6e3a50",
      ink,
    );
    shape(
      [
        [55, 79],
        [58, 79],
        [61, 98],
        [57, 96],
        [54, 85],
        [49, 98],
        [46, 96],
      ],
      "#97465c",
    );
    line(
      [
        [55, 82],
        [57, 91],
      ],
      "#cd7780",
      1.5,
    );
    // Extra near arm emerges from a second sleeve in the awakened form.
    if (trueForm) {
      shape(
        [
          [54, 59],
          [63, 62],
          [67, 73],
          [60, 81],
          [53, 74],
        ],
        robe,
        ink,
      );
      line(
        [
          [61, 66],
          [64, 74],
          [60, 78],
        ],
        fold,
        2,
      );
      shape(
        casting
          ? [
              [61, 76],
              [65, 77],
              [72, 86],
              [81, 79],
              [84, 82],
              [79, 92],
              [71, 94],
              [60, 83],
            ]
          : [
              [61, 77],
              [66, 77],
              [74, 86],
              [81, 95],
              [78, 100],
              [72, 96],
              [64, 88],
            ],
        skin,
        ink,
      );
      line(
        casting
          ? [
              [72, 87],
              [76, 90],
            ]
          : [
              [73, 91],
              [78, 95],
            ],
        ink,
        3,
      );
      if (casting) {
        rect(80, 76, 3, 9, light);
        rect(84, 77, 2, 7, skin);
      }
    }
    // Near sleeve follows the body sideways; the cast extends toward the opponent.
    shape(
      [
        [40, 40],
        [49, 39],
        [56, 44],
        [61, 57],
        [55, 67],
        [42, 65],
        [38, 55],
      ],
      robe,
      ink,
    );
    shape(
      [
        [40, 48],
        [45, 45],
        [48, 57],
        [45, 64],
        [41, 61],
      ],
      fold,
    );
    line(
      [
        [49, 44],
        [53, 51],
        [55, 60],
      ],
      "#fff9e9",
      2,
    );
    line(
      [
        [43, 63],
        [54, 65],
      ],
      deepFold,
      2,
    );
    if (casting) {
      shape(
        [
          [51, 62],
          [57, 61],
          [64, 65],
          [78, 59],
          [82, 62],
          [81, 68],
          [65, 74],
          [54, 71],
        ],
        skin,
        ink,
      );
      line(
        [
          [57, 64],
          [59, 70],
        ],
        ink,
        3,
      );
      line(
        [
          [62, 67],
          [64, 72],
        ],
        ink,
        2,
      );
      line(
        [
          [64, 67],
          [75, 63],
        ],
        light,
        2,
      );
      shape(
        [
          [77, 60],
          [82, 58],
          [87, 58],
          [88, 60],
          [83, 62],
          [83, 65],
          [78, 66],
        ],
        light,
        ink,
      );
      line(
        [
          [83, 59],
          [91, 58],
        ],
        skin,
        2,
      );
      line(
        [
          [84, 62],
          [90, 61],
        ],
        light,
        2,
      );
    } else {
      shape(
        [
          [49, 64],
          [56, 64],
          [59, 80],
          [56, 88],
          [49, 85],
          [46, 75],
        ],
        skin,
        ink,
      );
      shape(
        [
          [50, 67],
          [53, 68],
          [55, 79],
          [52, 83],
          [50, 80],
        ],
        light,
      );
      line(
        [
          [48, 73],
          [57, 73],
        ],
        ink,
        3,
      );
      line(
        [
          [49, 77],
          [58, 77],
        ],
        ink,
        2,
      );
      shape(
        [
          [50, 83],
          [56, 84],
          [58, 89],
          [54, 94],
          [49, 90],
        ],
        light,
        ink,
      );
      line(
        [
          [51, 88],
          [52, 92],
        ],
        shade,
        1.5,
      );
    }
    // Side-view jaw, protruding nose, visible ear and a single pair of red eyes.
    shape(
      [
        [36, 14],
        [50, 12],
        [58, 17],
        [59, 23],
        [64, 27],
        [60, 30],
        [60, 34],
        [55, 38],
        [45, 37],
        [39, 32],
        [35, 23],
      ],
      skin,
      ink,
    );
    shape(
      [
        [36, 17],
        [41, 18],
        [42, 28],
        [47, 35],
        [53, 37],
        [45, 36],
        [39, 31],
      ],
      shade,
    );
    shape(
      [
        [44, 17],
        [52, 16],
        [57, 19],
        [56, 24],
        [47, 24],
      ],
      light,
    );
    shape(
      [
        [37, 23],
        [42, 23],
        [43, 29],
        [39, 31],
        [36, 28],
      ],
      skin,
      ink,
    );
    line(
      [
        [38, 25],
        [40, 26],
        [39, 28],
      ],
      shade,
      1,
    );
    line(
      [
        [48, 22],
        [56, 21],
        [59, 23],
      ],
      ink,
      2,
    );
    rect(50, 23, 7, 2, "#f9dcc0");
    rect(54, 23, 2, 2, "#dd264e");
    line(
      [
        [48, 27],
        [54, 27],
        [57, 29],
      ],
      ink,
      2,
    );
    rect(52, 27, 3, 1, "#f14864");
    line(
      [
        [44, 17],
        [46, 20],
        [44, 23],
      ],
      ink,
      2,
    );
    line(
      [
        [43, 27],
        [46, 30],
        [46, 33],
      ],
      ink,
      2,
    );
    line(
      [
        [48, 34],
        [52, 35],
        [57, 33],
      ],
      "#622b42",
      1.5,
    );
    line(
      [
        [50, 36],
        [52, 37],
        [53, 35],
      ],
      ink,
      1.5,
    );
    if (trueForm) {
      shape(
        [
          [46, 18],
          [48, 16],
          [51, 20],
          [49, 26],
          [47, 30],
          [44, 28],
        ],
        "#9b6167",
      );
      line(
        [
          [47, 21],
          [50, 21],
        ],
        "#ff526c",
        1.5,
      );
      line(
        [
          [45, 27],
          [48, 27],
        ],
        "#e93258",
        1.5,
      );
    }
    // Back-swept pink spikes emphasize the direction of the profile.
    shape(
      [
        [36, 24],
        [29, 20],
        [33, 16],
        [27, 13],
        [33, 12],
        [29, 7],
        [37, 10],
        [36, 4],
        [43, 8],
        [47, 2],
        [50, 9],
        [57, 6],
        [56, 12],
        [63, 12],
        [58, 18],
        [52, 17],
        [48, 20],
        [43, 18],
        [40, 21],
      ],
      "#7e3d59",
      ink,
    );
    shape(
      [
        [33, 16],
        [35, 12],
        [33, 10],
        [40, 13],
        [40, 8],
        [44, 12],
        [47, 7],
        [49, 13],
        [54, 10],
        [53, 15],
        [59, 14],
        [55, 17],
        [50, 15],
        [46, 17],
        [42, 15],
        [38, 18],
        [37, 22],
      ],
      "#e78490",
    );
    line(
      [
        [36, 12],
        [40, 15],
        [42, 14],
      ],
      "#ffc6b0",
      2,
    );
    line(
      [
        [46, 9],
        [47, 14],
        [50, 13],
      ],
      "#ffd6bd",
      2,
    );
    line(
      [
        [53, 13],
        [55, 15],
      ],
      "#ffb6a4",
      2,
    );
    return canvas;
  };
  return [
    [paint(false, false), paint(false, true)],
    [paint(true, false), paint(true, true)],
  ];
};
