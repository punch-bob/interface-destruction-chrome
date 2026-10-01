/** Точная проверка прямоугольника против отрезка с толщиной (включая скруглённые концы). */
export const intersectsBeam = (
  rect: DOMRect,
  x: number,
  y: number,
  endX: number,
  endY: number,
  radius: number,
) => {
  const dx = endX - x,
    dy = endY - y;
  if (
    Math.max(x, endX) + radius < rect.left ||
    Math.min(x, endX) - radius > rect.right ||
    Math.max(y, endY) + radius < rect.top ||
    Math.min(y, endY) - radius > rect.bottom
  )
    return false;
  let near = 0,
    far = 1;
  for (const [origin, delta, low, high] of [
    [x, dx, rect.left, rect.right],
    [y, dy, rect.top, rect.bottom],
  ]) {
    if (Math.abs(delta) < 1e-8) {
      if (origin < low || origin > high) {
        near = 2;
        break;
      }
    } else {
      near = Math.max(
        near,
        Math.min((low - origin) / delta, (high - origin) / delta),
      );
      far = Math.min(
        far,
        Math.max((low - origin) / delta, (high - origin) / delta),
      );
    }
  }
  if (near <= far) return true;
  const radiusSquared = radius * radius;
  for (const [px, py] of [
    [x, y],
    [endX, endY],
  ]) {
    if (
      (px - Math.max(rect.left, Math.min(px, rect.right))) ** 2 +
        (py - Math.max(rect.top, Math.min(py, rect.bottom))) ** 2 <=
      radiusSquared
    )
      return true;
  }
  const lengthSquared = dx * dx + dy * dy;
  for (const [px, py] of [
    [rect.left, rect.top],
    [rect.right, rect.top],
    [rect.left, rect.bottom],
    [rect.right, rect.bottom],
  ]) {
    const fraction = lengthSquared
      ? Math.max(
          0,
          Math.min(1, ((px - x) * dx + (py - y) * dy) / lengthSquared),
        )
      : 0;
    if (
      (px - x - dx * fraction) ** 2 + (py - y - dy * fraction) ** 2 <=
      radiusSquared
    )
      return true;
  }
  return false;
};
