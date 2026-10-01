export interface IBeamCut {
  x: number;
  y: number;
  endX: number;
  endY: number;
  radius: number;
}

export const containsBeamCut = (
  beam: IBeamCut,
  x: number,
  y: number,
  inset = 0,
) => {
  const radius = beam.radius - inset;
  if (radius < 0) return false;
  const dx = beam.endX - beam.x,
    dy = beam.endY - beam.y;
  const t = Math.max(
    0,
    Math.min(
      1,
      ((x - beam.x) * dx + (y - beam.y) * dy) / (dx * dx + dy * dy || 1),
    ),
  );
  return (
    (x - beam.x - dx * t) ** 2 + (y - beam.y - dy * t) ** 2 <= radius * radius
  );
};

/** Exact intersection of a vertical line with the capsule used by the CSS beam mask. */
export const beamCutVerticalRange = (
  beam: IBeamCut,
  x: number,
): [number, number] | undefined => {
  let low = Infinity,
    high = -Infinity;
  const radiusSquared = beam.radius * beam.radius;
  let squared = radiusSquared - (x - beam.x) ** 2;
  if (squared >= 0) {
    const reach = Math.sqrt(squared);
    low = beam.y - reach;
    high = beam.y + reach;
  }
  squared = radiusSquared - (x - beam.endX) ** 2;
  if (squared >= 0) {
    const reach = Math.sqrt(squared);
    low = Math.min(low, beam.endY - reach);
    high = Math.max(high, beam.endY + reach);
  }
  const length = Math.hypot(beam.endX - beam.x, beam.endY - beam.y);
  if (length > 0.000001) {
    const dx = (beam.endX - beam.x) / length,
      dy = (beam.endY - beam.y) / length;
    let stripLow = -Infinity,
      stripHigh = Infinity,
      valid = true;
    const along = dx * (x - beam.x),
      across = -dy * (x - beam.x);
    if (Math.abs(dy) < 0.000001) {
      if (along < 0 || along > length) valid = false;
    } else {
      const first = -along / dy,
        second = (length - along) / dy;
      stripLow = Math.max(stripLow, Math.min(first, second));
      stripHigh = Math.min(stripHigh, Math.max(first, second));
    }
    if (Math.abs(dx) < 0.000001) {
      if (across < -beam.radius || across > beam.radius) valid = false;
    } else {
      const first = (-beam.radius - across) / dx,
        second = (beam.radius - across) / dx;
      stripLow = Math.max(stripLow, Math.min(first, second));
      stripHigh = Math.min(stripHigh, Math.max(first, second));
    }
    if (valid && stripLow <= stripHigh) {
      low = Math.min(low, beam.y + stripLow);
      high = Math.max(high, beam.y + stripHigh);
    }
  }
  return low <= high ? [low, high] : undefined;
};
