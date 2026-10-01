export interface IFracturePoint {
  x: number;
  y: number;
}
export const containsFracturePoint = (
  p: readonly IFracturePoint[],
  x: number,
  y: number,
) => {
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const a = p[i],
      b = p[j];
    if (
      a.y > y !== b.y > y &&
      x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
};
export const splitPanel = (
  rect: DOMRect,
  hitX: number,
  hitY: number,
  dx: number,
  dy: number,
): [IFracturePoint[], IFracturePoint[]] => {
  const length = Math.hypot(dx, dy) || 1,
    nx = dx / length,
    ny = dy / length;
  const cx =
    rect.width * 0.5 +
    Math.max(
      -rect.width * 0.12,
      Math.min(rect.width * 0.12, (hitX - rect.x - rect.width / 2) * 0.2),
    );
  const cy =
    rect.height * 0.5 +
    Math.max(
      -rect.height * 0.12,
      Math.min(rect.height * 0.12, (hitY - rect.y - rect.height / 2) * 0.2),
    );
  const distance = (p: IFracturePoint) => (p.x - cx) * nx + (p.y - cy) * ny;
  const corners = [
    { x: 0, y: 0 },
    { x: rect.width, y: 0 },
    { x: rect.width, y: rect.height },
    { x: 0, y: rect.height },
  ];
  const intersections: IFracturePoint[] = [];
  const clip = (side: number) => {
    const result: IFracturePoint[] = [];
    corners.forEach((a, i) => {
      const b = corners[(i + 1) % 4],
        da = distance(a),
        db = distance(b);
      if (da * side >= 0) result.push(a);
      if (da >= 0 !== db >= 0) {
        const t = da / (da - db),
          p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        result.push(p);
        if (side === 1) intersections.push(p);
      }
    });
    return result;
  };
  const positive = clip(1),
    negative = clip(-1);
  const [a, b] = intersections;
  if (!a || !b)
    return [
      corners.map((p) => ({ x: p.x / rect.width, y: p.y / rect.height })),
      [],
    ];
  const amplitude = Math.min(rect.width, rect.height) * 0.09;
  const jagged = [0.25, 0.5, 0.75].map((t, i) => {
    const offset = amplitude * (i % 2 ? -1 : 1) * (0.6 + Math.random() * 0.4);
    return {
      x: a.x + (b.x - a.x) * t + nx * offset,
      y: a.y + (b.y - a.y) * t + ny * offset,
    };
  });
  const finish = (polygon: IFracturePoint[]) =>
    polygon.flatMap((p, i) => {
      const q = polygon[(i + 1) % polygon.length];
      const edge =
        Math.abs(distance(p)) < 0.001 && Math.abs(distance(q)) < 0.001;
      const added = edge
        ? Math.hypot(p.x - a.x, p.y - a.y) < 0.001
          ? jagged
          : [...jagged].reverse()
        : [];
      return [p, ...added].map((v) => ({
        x: v.x / rect.width,
        y: v.y / rect.height,
      }));
    });
  return distance({ x: hitX - rect.x, y: hitY - rect.y }) > 0
    ? [finish(positive), finish(negative)]
    : [finish(negative), finish(positive)];
};
export interface IFractureMaskLayer {
  image: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
export const createFractureMask = (
  points: readonly IFracturePoint[],
  width: number,
  height: number,
): IFractureMaskLayer[] => {
  const vertices = points.map((p) => ({ x: p.x * width, y: p.y * height }));
  const ys = [...new Set(vertices.map((p) => p.y))].sort((a, b) => a - b);
  const layers: IFractureMaskLayer[] = [];
  const triangle = (
    a: IFracturePoint,
    b: IFracturePoint,
    c: IFracturePoint,
  ) => {
    const x = Math.min(a.x, b.x, c.x),
      y = Math.min(a.y, b.y, c.y),
      w = Math.max(a.x, b.x, c.x) - x,
      h = Math.max(a.y, b.y, c.y) - y;
    if (
      w < 0.001 ||
      h < 0.001 ||
      Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) < 0.001
    )
      return;
    const angle = (p: IFracturePoint) =>
      ((Math.atan2(p.x - a.x, a.y - p.y) * 180) / Math.PI + 360) % 360;
    let start = angle(b),
      sweep = (angle(c) - start + 360) % 360;
    if (sweep > 180) {
      start = angle(c);
      sweep = 360 - sweep;
    }
    layers.push({
      image: `conic-gradient(from ${start}deg at ${((a.x - x) / w) * 100}% ${((a.y - y) / h) * 100}%, #fff 0deg ${sweep}deg, transparent ${sweep}deg 360deg)`,
      x,
      y,
      width: w,
      height: h,
    });
  };
  for (let i = 0; i < ys.length - 1; i++) {
    const top = ys[i],
      bottom = ys[i + 1],
      middle = (top + bottom) / 2;
    if (bottom - top < 0.001) continue;
    const edges = vertices
      .flatMap((a, index) => {
        const b = vertices[(index + 1) % vertices.length];
        if (middle <= Math.min(a.y, b.y) || middle >= Math.max(a.y, b.y))
          return [];
        const at = (y: number) => a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y);
        return [{ top: at(top), bottom: at(bottom), middle: at(middle) }];
      })
      .sort((a, b) => a.middle - b.middle);
    for (let j = 0; j < edges.length - 1; j += 2) {
      const l = edges[j],
        r = edges[j + 1];
      triangle(
        { x: l.bottom, y: bottom },
        { x: l.top, y: top },
        { x: r.top, y: top },
      );
      triangle(
        { x: r.top, y: top },
        { x: l.bottom, y: bottom },
        { x: r.bottom, y: bottom },
      );
    }
  }
  return layers;
};
export const fractureSurfaceY = (
  points: readonly IFracturePoint[],
  x: number,
) => {
  let top = Infinity;
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length];
    if (x < Math.min(a.x, b.x) || x > Math.max(a.x, b.x)) return;
    if (Math.abs(b.x - a.x) < 0.000001) top = Math.min(top, a.y, b.y);
    else top = Math.min(top, a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x));
  });
  return top;
};
export const intersectsFractureBeam = (
  points: readonly IFracturePoint[],
  rect: DOMRect,
  x: number,
  y: number,
  endX: number,
  endY: number,
  radius: number,
) => {
  if (
    containsFracturePoint(
      points,
      (x - rect.x) / rect.width,
      (y - rect.y) / rect.height,
    ) ||
    containsFracturePoint(
      points,
      (endX - rect.x) / rect.width,
      (endY - rect.y) / rect.height,
    )
  )
    return true;
  const start = { x, y },
    end = { x: endX, y: endY };
  const distance = (
    p: IFracturePoint,
    a: IFracturePoint,
    b: IFracturePoint,
  ) => {
    const dx = b.x - a.x,
      dy = b.y - a.y,
      t = Math.max(
        0,
        Math.min(
          1,
          ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1),
        ),
      );
    return (p.x - a.x - dx * t) ** 2 + (p.y - a.y - dy * t) ** 2;
  };
  const cross = (a: IFracturePoint, b: IFracturePoint, c: IFracturePoint) =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  return points.some((p, i) => {
    const q = points[(i + 1) % points.length],
      a = { x: rect.x + p.x * rect.width, y: rect.y + p.y * rect.height },
      b = { x: rect.x + q.x * rect.width, y: rect.y + q.y * rect.height };
    return (
      (cross(start, end, a) * cross(start, end, b) < 0 &&
        cross(a, b, start) * cross(a, b, end) < 0) ||
      Math.min(
        distance(a, start, end),
        distance(b, start, end),
        distance(start, a, b),
        distance(end, a, b),
      ) <=
        radius * radius
    );
  });
};
