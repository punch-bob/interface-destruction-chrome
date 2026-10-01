import { getElementClip } from "./letterTargets";

export interface IBorderPart {
  element: HTMLElement;
  side: "top" | "bottom";
  index: number;
  count: number;
  color: string;
  thickness: number;
  collapsed: boolean;
  clip: DOMRect;
}

export const getBorderRect = (border: IBorderPart) => {
  const bounds = border.element.getBoundingClientRect();
  const width = bounds.width / border.count;
  const y = border.side === "top" ? bounds.top : bounds.bottom;
  const offset = border.collapsed
    ? border.thickness / 2
    : border.side === "bottom"
      ? border.thickness
      : 0;
  const left = Math.max(border.clip.left, bounds.left + width * border.index);
  const right = Math.min(
    border.clip.right,
    bounds.left + width * (border.index + 1),
  );
  const top = Math.max(border.clip.top, y - offset);
  const bottom = Math.min(border.clip.bottom, y - offset + border.thickness);
  return new DOMRect(
    left,
    top,
    Math.max(0, right - left),
    Math.max(0, bottom - top),
  );
};

/** Горизонтальные границы разбиваются на независимые платформы длиной около 40px. */
export const collectBorders = (
  root: HTMLElement,
  viewTop = 0,
  viewHeight = window.innerHeight,
): IBorderPart[] => {
  const viewport = new DOMRect(0, viewTop, window.innerWidth, viewHeight);
  const borders: IBorderPart[] = [];
  const seen = new Set<string>();
  const clipCache = new WeakMap<HTMLElement, DOMRect>();
  for (const element of [root, ...root.querySelectorAll<HTMLElement>("*")]) {
    if (!(element instanceof HTMLElement)) {
      continue;
    }
    const bounds = element.getBoundingClientRect();
    if (
      bounds.bottom < viewTop ||
      bounds.top > viewTop + viewHeight ||
      bounds.width < 5 ||
      bounds.height < 1 ||
      bounds.right <= 0 ||
      bounds.left >= window.innerWidth
    ) {
      continue;
    }
    const style = getComputedStyle(element);
    if (
      style.visibility === "hidden" ||
      style.display === "none" ||
      Number(style.opacity) === 0
    ) {
      continue;
    }
    const table = element.closest("table");
    const collapsed =
      element.matches("td, th") &&
      !!table &&
      getComputedStyle(table).borderCollapse === "collapse";
    const clip = getElementClip(
      element.parentElement ?? element,
      clipCache,
      viewport,
    );
    const count = Math.max(1, Math.ceil(bounds.width / 40));
    for (const side of ["top", "bottom"] as const) {
      const thickness = parseFloat(
        side === "top" ? style.borderTopWidth : style.borderBottomWidth,
      );
      const color =
        side === "top" ? style.borderTopColor : style.borderBottomColor;
      const lineStyle =
        side === "top" ? style.borderTopStyle : style.borderBottomStyle;
      if (
        !thickness ||
        lineStyle === "none" ||
        color === "transparent" ||
        /rgba\([^)]*,\s*0\s*\)/.test(color)
      ) {
        continue;
      }
      for (let index = 0; index < count; index++) {
        const border = {
          element,
          side,
          index,
          count,
          thickness,
          color,
          collapsed,
          clip,
        };
        const rect = getBorderRect(border);
        if (
          rect.width <= 0 ||
          rect.height <= 0 ||
          rect.bottom < viewTop ||
          rect.top > viewTop + viewHeight ||
          rect.right < 0 ||
          rect.left > window.innerWidth
        ) {
          continue;
        }
        const key = `${rect.x.toFixed(1)}:${rect.y.toFixed(1)}:${rect.width.toFixed(1)}`;
        if (!seen.has(key)) {
          seen.add(key);
          borders.push(border);
        }
      }
    }
  }
  return borders;
};
