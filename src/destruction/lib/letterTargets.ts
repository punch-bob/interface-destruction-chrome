export interface ILetter {
  node: Text;
  start: number;
  end: number;
  text: string;
  rect: DOMRect;
  style: CSSStyleDeclaration;
  clip: DOMRect;
}

export const getLetterRect = (
  letter: Pick<ILetter, "node" | "start" | "end">,
) => {
  const range = document.createRange();
  range.setStart(letter.node, letter.start);
  range.setEnd(letter.node, letter.end);
  return range.getBoundingClientRect();
};

export const getElementClip = (
  element: HTMLElement,
  cache = new WeakMap<HTMLElement, DOMRect>(),
  viewport = new DOMRect(0, 0, window.innerWidth, window.innerHeight),
): DOMRect => {
  const cached = cache.get(element);
  if (cached) return cached;
  const parent = element.parentElement
    ? getElementClip(element.parentElement, cache, viewport)
    : viewport;
  let { left, top, right, bottom } = parent;
  const overflow = getComputedStyle(element);
  if (overflow.overflowX !== "visible" || overflow.overflowY !== "visible") {
    const bounds = element.getBoundingClientRect();
    if (overflow.overflowX !== "visible") {
      left = Math.max(left, bounds.left + element.clientLeft);
      right = Math.min(
        right,
        bounds.left + element.clientLeft + element.clientWidth,
      );
    }
    if (overflow.overflowY !== "visible") {
      top = Math.max(top, bounds.top + element.clientTop);
      bottom = Math.min(
        bottom,
        bounds.top + element.clientTop + element.clientHeight,
      );
    }
  }
  const clip = new DOMRect(
    left,
    top,
    Math.max(0, right - left),
    Math.max(0, bottom - top),
  );
  cache.set(element, clip);
  return clip;
};

export const collectLetters = (
  root: HTMLElement,
  viewTop = 0,
  viewHeight = window.innerHeight,
): ILetter[] => {
  const viewport = new DOMRect(0, viewTop, window.innerWidth, viewHeight);
  const letters: ILetter[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const clipCache = new WeakMap<HTMLElement, DOMRect>();
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parent = node.parentElement;
    if (
      !parent ||
      parent.closest(
        'svg, script, style, textarea, select, [aria-hidden="true"]',
      )
    ) {
      continue;
    }
    if (!node.data.trim()) continue;
    const bounds = parent.getBoundingClientRect();
    if (
      bounds.width > 0 &&
      bounds.height > 0 &&
      (bounds.bottom < viewTop ||
        bounds.top > viewTop + viewHeight ||
        bounds.right < 0 ||
        bounds.left > window.innerWidth)
    )
      continue;
    const style = getComputedStyle(parent);
    if (
      style.visibility === "hidden" ||
      style.display === "none" ||
      Number(style.opacity) === 0
    ) {
      continue;
    }
    let clip = clipCache.get(parent);
    if (!clip) {
      clip = getElementClip(parent, clipCache, viewport);
    }
    if (clip.width <= 0 || clip.height <= 0) continue;
    for (const { segment: text, index: start } of segmenter.segment(
      node.data,
    )) {
      if (!text.trim()) {
        continue;
      }
      const end = start + text.length;
      const rect = getLetterRect({ node, start, end });
      if (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > clip.top &&
        rect.top < clip.bottom &&
        rect.right > clip.left &&
        rect.left < clip.right
      ) {
        letters.push({ node, start, end, text, rect, style, clip });
      }
    }
  }
  return letters;
};

export const createFlyingLetter = (letter: ILetter) => {
  const element = document.createElement("span");
  element.textContent = letter.text;
  const { style, rect } = letter;
  Object.assign(element.style, {
    position: "absolute",
    left: "0",
    top: "0",
    pointerEvents: "none",
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    lineHeight: `${rect.height}px`,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    color: style.color,
    letterSpacing: "0",
    textShadow: style.textShadow,
    textTransform: style.textTransform,
    whiteSpace: "pre",
    background: "transparent",
  });
  return element;
};

/** На осколках рамки нет текста: каждый символ летит самостоятельно. */
export const removeText = (element: HTMLElement) => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }
  nodes.forEach((node) => {
    node.data = "";
  });
};
