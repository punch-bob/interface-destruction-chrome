import { intersectsBeam } from "./beamGeometry";
import {
  createFractureMask,
  type IFracturePoint,
  type IFractureMaskLayer,
} from "./panelFracture";
import { createFlyingLetter, type ILetter } from "./letterTargets";

export interface IInterfaceDamage {
  holes: readonly DOMRect[];
  burns: ReadonlyArray<{
    x: number;
    y: number;
    radius: number;
    endX?: number;
    endY?: number;
  }>;
  fractures: ReadonlyArray<{
    rect: DOMRect;
    points: readonly IFracturePoint[];
  }>;
}

/** Копия интерфейса целиком: прозрачные дочерние элементы остаются на своих фонах. */
export const cloneAppearance = (element: Element): HTMLElement => {
  const clone = element.cloneNode(true) as HTMLElement;
  const sources = [element, ...element.querySelectorAll("*")];
  const copies = [clone, ...clone.querySelectorAll("*")];
  sources.forEach((source, index) => {
    const copy = copies[index];
    if (!(copy instanceof HTMLElement || copy instanceof SVGElement)) {
      return;
    }
    const computed = getComputedStyle(source);
    for (const property of computed) {
      copy.style.setProperty(property, computed.getPropertyValue(property));
    }
    copy.removeAttribute("id");
    copy.removeAttribute("autofocus");
    copy.style.setProperty("pointer-events", "none", "important");
    copy.style.setProperty("animation", "none", "important");
    copy.style.setProperty("transition", "none", "important");
    if (
      source instanceof HTMLCanvasElement &&
      copy instanceof HTMLCanvasElement &&
      source.width &&
      source.height
    ) {
      copy.getContext("2d")?.drawImage(source, 0, 0);
    }
  });
  return clone;
};

export const getElementBackground = (element: Element): string => {
  let current: Element | null = element;
  while (current) {
    const color = getComputedStyle(current).backgroundColor;
    if (color !== "transparent" && !/rgba\([^)]*,\s*0\s*\)/.test(color)) {
      return color;
    }
    current = current.parentElement;
  }
  return "#ffffff";
};

const positionRoots = (source: Element, copy: Element) => {
  if (!(copy instanceof HTMLElement || copy instanceof SVGElement)) {
    return;
  }
  if (getComputedStyle(source).display === "contents") {
    [...source.children].forEach((child, index) => {
      const childCopy = copy.children[index];
      if (childCopy) {
        positionRoots(child, childCopy);
      }
    });
    return;
  }
  const rect = source.getBoundingClientRect();
  Object.assign(copy.style, {
    position: "absolute",
    inset: "auto",
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    margin: "0",
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    minWidth: "0",
    maxWidth: "none",
    minHeight: "0",
    maxHeight: "none",
    boxSizing: "border-box",
    transform: "none",
  });
};

export const createInterfaceLayer = (
  root: HTMLElement,
  scene: HTMLDivElement,
) => {
  let textCopies = new Map<Text, Text>();
  let letterCopies = new Map<ILetter, HTMLSpanElement>();
  let elementCopies = new Map<Element, HTMLElement | SVGElement>();
  const capture = (
    letters: readonly ILetter[],
    visibleElements: readonly Element[] = [],
  ) => {
    // У видимой fixed/absolute мишени может быть родитель за пределами экрана.
    const retainedAncestors = new Set<Element>();
    for (const element of [
      ...visibleElements,
      ...letters.map((letter) => letter.node.parentElement!),
    ]) {
      let parent: Element | null = element;
      while (parent && !retainedAncestors.has(parent)) {
        retainedAncestors.add(parent);
        parent = parent.parentElement;
      }
    }
    textCopies = new Map();
    letterCopies = new Map();
    elementCopies = new Map();
    // Клонируем только видимое дерево, не создавая сперва копию огромной страницы.
    const bounds = new WeakMap<Element, DOMRect>();
    const styles = new WeakMap<Element, CSSStyleDeclaration>();
    const rectOf = (element: Element) => {
      let rect = bounds.get(element);
      if (!rect) {
        rect = element.getBoundingClientRect();
        bounds.set(element, rect);
      }
      return rect;
    };
    const styleOf = (element: Element) => {
      let style = styles.get(element);
      if (!style) {
        style = getComputedStyle(element);
        styles.set(element, style);
      }
      return style;
    };
    const cloneVisible = (
      source: Element,
    ): HTMLElement | SVGElement | undefined => {
      if (
        source.matches(
          "script, style, link, meta, noscript, template, [data-interface-destruction-host]",
        )
      )
        return;
      const rect = rectOf(source);
      const computed = styleOf(source);
      if (
        source !== root &&
        (computed.display === "none" ||
          computed.visibility === "hidden" ||
          computed.opacity === "0" ||
          (!retainedAncestors.has(source) &&
            computed.display !== "contents" &&
            rect.width > 0 &&
            rect.height > 0 &&
            (rect.bottom < 0 ||
              rect.top > window.innerHeight ||
              rect.right < 0 ||
              rect.left > window.innerWidth)))
      )
        return;
      const node = source.cloneNode(false);
      if (!(node instanceof HTMLElement || node instanceof SVGElement)) return;
      elementCopies.set(source, node);
      for (const property of computed)
        node.style.setProperty(property, computed.getPropertyValue(property));
      node.removeAttribute("id");
      node.removeAttribute("autofocus");
      node.style.setProperty("pointer-events", "none", "important");
      node.style.setProperty("animation", "none", "important");
      node.style.setProperty("transition", "none", "important");
      if (
        source !== root &&
        (source instanceof HTMLElement || source instanceof SVGSVGElement) &&
        computed.display !== "contents"
      ) {
        let parent = source.parentElement;
        while (parent && styleOf(parent).display === "contents")
          parent = parent.parentElement;
        const parentRect = parent ? rectOf(parent) : undefined;
        Object.assign(node.style, {
          position: "absolute",
          display: "block",
          inset: "auto",
          margin: "0",
          left: `${rect.left - (parentRect?.left ?? 0) - (parent?.clientLeft ?? 0) + (parent?.scrollLeft ?? 0)}px`,
          top: `${rect.top - (parentRect?.top ?? 0) - (parent?.clientTop ?? 0) + (parent?.scrollTop ?? 0)}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          minWidth: "0",
          minHeight: "0",
          maxWidth: "none",
          maxHeight: "none",
          boxSizing: "border-box",
          transform: "none",
        });
      }
      for (const child of source.childNodes) {
        if (child instanceof Element) {
          const childCopy = cloneVisible(child);
          if (childCopy) node.append(childCopy);
        } else if (child instanceof Text) {
          const textCopy = child.cloneNode() as Text;
          textCopies.set(child, textCopy);
          node.append(textCopy);
        }
      }
      if (
        source instanceof HTMLInputElement &&
        node instanceof HTMLInputElement
      ) {
        node.value = source.value;
        node.checked = source.checked;
      }
      if (
        source instanceof HTMLSelectElement &&
        node instanceof HTMLSelectElement
      )
        node.value = source.value;
      if (
        source instanceof HTMLTextAreaElement &&
        node instanceof HTMLTextAreaElement
      )
        node.value = source.value;
      if (
        source instanceof HTMLCanvasElement &&
        node instanceof HTMLCanvasElement &&
        source.width &&
        source.height
      ) {
        try {
          node.getContext("2d")?.drawImage(source, 0, 0);
        } catch {
          /* WebGL/отсоединённый canvas остаётся пустым. */
        }
      }
      return node;
    };
    const copy = cloneVisible(root);
    if (!copy) return;
    positionRoots(root, copy);
    scene.style.backgroundColor = getElementBackground(root);
    scene.replaceChildren(copy);
    elementCopies.forEach((node, source) => {
      if (source instanceof HTMLElement && node instanceof HTMLElement) {
        node.scrollTop = source.scrollTop;
        node.scrollLeft = source.scrollLeft;
      }
    });
    const textLayer = document.createElement("div");
    Object.assign(textLayer.style, {
      position: "absolute",
      inset: "0",
      pointerEvents: "none",
    });
    const wrapped = new Set<Text>();
    letters.forEach((letter) => {
      const textCopy = textCopies.get(letter.node);
      if (!textCopy) return;
      if (textCopy && !wrapped.has(letter.node)) {
        const hidden = document.createElement("span");
        hidden.style.setProperty("display", "contents", "important");
        hidden.style.setProperty("color", "transparent", "important");
        hidden.style.setProperty(
          "-webkit-text-fill-color",
          "transparent",
          "important",
        );
        hidden.style.setProperty("text-shadow", "none", "important");
        textCopy.replaceWith(hidden);
        hidden.append(textCopy);
        wrapped.add(letter.node);
      }
      // Символы стоят по координатам Range исходной строки, поэтому переносы не меняются.
      const glyph = createFlyingLetter(letter);
      glyph.style.left = `${letter.rect.x}px`;
      glyph.style.top = `${letter.rect.y}px`;
      const { rect, clip } = letter;
      glyph.style.clipPath = `inset(${Math.max(0, clip.top - rect.top)}px ${Math.max(0, rect.right - clip.right)}px ${Math.max(0, rect.bottom - clip.bottom)}px ${Math.max(0, clip.left - rect.left)}px)`;
      textLayer.append(glyph);
      letterCopies.set(letter, glyph);
    });
    // Стили страницы не должны попадать в изолированное меню расширения.
    copy
      .querySelectorAll(
        'script, style, link[rel="stylesheet"], [data-interface-destruction-host]',
      )
      .forEach((node) => node.remove());
    scene.append(textLayer);
  };
  const fractureMaskCache = new WeakMap<
    readonly IFracturePoint[],
    { width: number; height: number; layers: IFractureMaskLayer[] }
  >();
  const maskValues = new WeakMap<HTMLElement, Map<string, string>>();
  const setMaskProperty = (
    node: HTMLElement,
    property: string,
    value: string,
  ) => {
    let values = maskValues.get(node);
    if (!values) {
      values = new Map();
      maskValues.set(node, values);
    }
    if (values.get(property) === value) return;
    node.style.setProperty(property, value);
    values.set(property, value);
  };
  const cut = (
    holes: readonly DOMRect[],
    burns: ReadonlyArray<{
      x: number;
      y: number;
      radius: number;
      endX?: number;
      endY?: number;
    }>,
    fractures: ReadonlyArray<{
      rect: DOMRect;
      points: readonly IFracturePoint[];
    }> = [],
    maskNode: HTMLElement = scene,
  ) => {
    const prefix = CSS.supports("mask-composite", "subtract")
      ? "mask"
      : "-webkit-mask";
    if (!holes.length && !burns.length && !fractures.length) {
      for (const property of [
        "image",
        "position",
        "size",
        "repeat",
        "composite",
      ]) {
        maskNode.style.removeProperty(`${prefix}-${property}`);
      }
      maskValues.delete(maskNode);
      return;
    }
    // Градиенты не используют data: или blob: URL, которые CSP сайта может блокировать.
    // Верхний сплошной слой вычитает объединение всех отверстий под ним.
    const images = ["linear-gradient(#fff, #fff)"];
    const positions = ["0 0"];
    const sizes = ["100% 100%"];
    const merged: DOMRect[] = [];
    // Полностью покрытые круглой пробоиной отверстия уже входят в маску.
    const uniqueCircles = new Map<
      string,
      { x: number; y: number; radius: number }
    >();
    const addCircle = (x: number, y: number, radius: number) => {
      const key = `${x}:${y}:${radius}`;
      if (!uniqueCircles.has(key)) uniqueCircles.set(key, { x, y, radius });
    };
    burns.forEach((burn) => {
      addCircle(burn.x, burn.y, burn.radius);
      if (burn.endX !== undefined && burn.endY !== undefined)
        addCircle(burn.endX, burn.endY, burn.radius);
    });
    const circles = [...uniqueCircles.values()];
    const circleGrid = new Map<string, typeof circles>();
    circles.forEach((burn) => {
      for (
        let x = Math.floor((burn.x - burn.radius) / 128);
        x <= Math.floor((burn.x + burn.radius) / 128);
        x++
      )
        for (
          let y = Math.floor((burn.y - burn.radius) / 128);
          y <= Math.floor((burn.y + burn.radius) / 128);
          y++
        ) {
          const key = `${x}:${y}`;
          const bucket = circleGrid.get(key) ?? [];
          bucket.push(burn);
          circleGrid.set(key, bucket);
        }
    });
    const sorted = holes
      .filter(
        (rect) =>
          !circleGrid
            .get(
              `${Math.floor((rect.left + rect.width / 2) / 128)}:${Math.floor((rect.top + rect.height / 2) / 128)}`,
            )
            ?.some((burn) => {
              if (
                rect.left < burn.x - burn.radius ||
                rect.right > burn.x + burn.radius ||
                rect.top < burn.y - burn.radius ||
                rect.bottom > burn.y + burn.radius
              )
                return false;
              const dx = Math.max(
                Math.abs(rect.left - burn.x),
                Math.abs(rect.right - burn.x),
              );
              const dy = Math.max(
                Math.abs(rect.top - burn.y),
                Math.abs(rect.bottom - burn.y),
              );
              return dx * dx + dy * dy <= burn.radius * burn.radius;
            }),
      )
      .sort((a, b) => a.y - b.y || a.height - b.height || a.x - b.x);
    for (const rect of sorted) {
      const last = merged[merged.length - 1];
      if (
        last &&
        Math.abs(last.y - rect.y) < 0.5 &&
        Math.abs(last.height - rect.height) < 0.5 &&
        rect.x <= last.right + 0.05
      ) {
        last.width = Math.max(last.right, rect.right) - last.x;
      } else merged.push(new DOMRect(rect.x, rect.y, rect.width, rect.height));
    }
    const vertical: DOMRect[] = [];
    merged.sort((a, b) => a.x - b.x || a.width - b.width || a.y - b.y);
    for (const rect of merged) {
      const last = vertical[vertical.length - 1];
      if (
        last &&
        Math.abs(last.x - rect.x) < 0.05 &&
        Math.abs(last.width - rect.width) < 0.05 &&
        rect.top <= last.bottom + 0.05
      ) {
        last.height = Math.max(last.bottom, rect.bottom) - last.y;
      } else vertical.push(rect);
    }
    // Осколки бордеров внутри уже разрушенной ячейки не требуют отдельного слоя.
    const coverGrid = new Map<string, DOMRect[]>();
    const compact: DOMRect[] = [];
    vertical.sort((a, b) => b.width * b.height - a.width * a.height);
    for (const rect of vertical) {
      const key = `${Math.floor((rect.left + rect.width / 2) / 128)}:${Math.floor((rect.top + rect.height / 2) / 128)}`;
      if (
        coverGrid
          .get(key)
          ?.some(
            (cover) =>
              cover.left <= rect.left &&
              cover.top <= rect.top &&
              cover.right >= rect.right &&
              cover.bottom >= rect.bottom,
          )
      )
        continue;
      compact.push(rect);
      for (
        let x = Math.floor(rect.left / 128);
        x <= Math.floor(rect.right / 128);
        x++
      )
        for (
          let y = Math.floor(rect.top / 128);
          y <= Math.floor(rect.bottom / 128);
          y++
        ) {
          const key = `${x}:${y}`;
          const bucket = coverGrid.get(key) ?? [];
          bucket.push(rect);
          coverGrid.set(key, bucket);
        }
    }
    compact.forEach((rect) => {
      if (rect.width <= 0 || rect.height <= 0) return;
      images.push("linear-gradient(#fff, #fff)");
      positions.push(`${rect.x}px ${rect.y}px`);
      sizes.push(`${rect.width}px ${rect.height}px`);
    });
    fractures.forEach(({ rect, points }) => {
      const key = `${Math.floor((rect.left + rect.width / 2) / 128)}:${Math.floor((rect.top + rect.height / 2) / 128)}`;
      if (
        coverGrid
          .get(key)
          ?.some(
            (c) =>
              c.left <= rect.left &&
              c.right >= rect.right &&
              c.top <= rect.top &&
              c.bottom >= rect.bottom,
          )
      )
        return;
      if (
        circleGrid
          .get(key)
          ?.some((b) =>
            points.every(
              (p) =>
                (rect.x + p.x * rect.width - b.x) ** 2 +
                  (rect.y + p.y * rect.height - b.y) ** 2 <=
                b.radius * b.radius,
            ),
          )
      )
        return;
      let cached = fractureMaskCache.get(points);
      if (
        !cached ||
        cached.width !== rect.width ||
        cached.height !== rect.height
      ) {
        cached = {
          width: rect.width,
          height: rect.height,
          layers: createFractureMask(points, rect.width, rect.height),
        };
        fractureMaskCache.set(points, cached);
      }
      cached.layers.forEach((layer) => {
        images.push(layer.image);
        positions.push(`${rect.x + layer.x}px ${rect.y + layer.y}px`);
        sizes.push(`${layer.width}px ${layer.height}px`);
      });
    });
    burns.forEach((burn) => {
      if (burn.endX !== undefined && burn.endY !== undefined) {
        const dx = burn.endX - burn.x,
          dy = burn.endY - burn.y;
        const angle = 180 + (Math.atan2(dy, dx) * 180) / Math.PI;
        const r = burn.radius;
        images.push(
          `linear-gradient(${angle}deg, transparent calc(50% - ${r}px), #fff calc(50% - ${r}px), #fff calc(50% + ${r}px), transparent calc(50% + ${r}px))`,
        );
        positions.push(
          `${Math.min(burn.x, burn.endX) - r}px ${Math.min(burn.y, burn.endY) - r}px`,
        );
        sizes.push(`${Math.abs(dx) + r * 2}px ${Math.abs(dy) + r * 2}px`);
      }
    });
    const circleCovers = new Map<string, typeof circles>();
    circles
      .sort((a, b) => b.radius - a.radius)
      .forEach((circle) => {
        const { x, y, radius } = circle;
        if (
          radius <= 0 ||
          x + radius < 0 ||
          y + radius < 0 ||
          x - radius > window.innerWidth ||
          y - radius > window.innerHeight
        )
          return;
        const key = `${Math.floor(x / 128)}:${Math.floor(y / 128)}`;
        if (
          circleCovers
            .get(key)
            ?.some(
              (cover) =>
                Math.hypot(cover.x - x, cover.y - y) + radius <=
                cover.radius * 0.99,
            )
        )
          return;
        if (
          coverGrid
            .get(key)
            ?.some(
              (rect) =>
                rect.left <= x - radius &&
                rect.right >= x + radius &&
                rect.top <= y - radius &&
                rect.bottom >= y + radius,
            )
        )
          return;
        images.push(
          "radial-gradient(circle closest-side, #fff 99%, transparent 100%)",
        );
        positions.push(`${x - radius}px ${y - radius}px`);
        sizes.push(`${radius * 2}px ${radius * 2}px`);
        for (
          let bx = Math.floor((x - radius) / 128);
          bx <= Math.floor((x + radius) / 128);
          bx++
        )
          for (
            let by = Math.floor((y - radius) / 128);
            by <= Math.floor((y + radius) / 128);
            by++
          ) {
            const bucketKey = `${bx}:${by}`,
              bucket = circleCovers.get(bucketKey) ?? [];
            bucket.push(circle);
            circleCovers.set(bucketKey, bucket);
          }
      });
    setMaskProperty(maskNode, `${prefix}-image`, images.join(","));
    setMaskProperty(maskNode, `${prefix}-position`, positions.join(","));
    setMaskProperty(maskNode, `${prefix}-size`, sizes.join(","));
    setMaskProperty(maskNode, `${prefix}-repeat`, "no-repeat");
    const composites = images.map((_, index) =>
      prefix === "mask"
        ? index === 0
          ? "subtract"
          : "add"
        : index === 0
          ? "source-out"
          : "source-over",
    );
    setMaskProperty(maskNode, `${prefix}-composite`, composites.join(","));
  };
  return {
    capture,
    cut,
    maskFragment: (
      node: HTMLElement,
      rect: DOMRect,
      damage: IInterfaceDamage,
    ) => {
      const overlaps = (other: DOMRect) =>
        other.right >= rect.left &&
        other.left <= rect.right &&
        other.bottom >= rect.top &&
        other.top <= rect.bottom;
      const holes = damage.holes.filter(overlaps);
      const fractures = damage.fractures.filter((fracture) =>
        overlaps(fracture.rect),
      );
      const burns = damage.burns.filter((burn) =>
        burn.endX !== undefined && burn.endY !== undefined
          ? intersectsBeam(
              rect,
              burn.x,
              burn.y,
              burn.endX,
              burn.endY,
              burn.radius,
            )
          : (Math.max(rect.left, Math.min(burn.x, rect.right)) - burn.x) ** 2 +
              (Math.max(rect.top, Math.min(burn.y, rect.bottom)) - burn.y) **
                2 <=
            burn.radius ** 2,
      );
      // Fresh fragments need no mask when all parent damage is outside their bounds.
      if (!holes.length && !fractures.length && !burns.length) return;
      cut(
        holes.map(
          (hole) =>
            new DOMRect(
              hole.x - rect.x,
              hole.y - rect.y,
              hole.width,
              hole.height,
            ),
        ),
        burns.map((burn) => ({
          ...burn,
          x: burn.x - rect.x,
          y: burn.y - rect.y,
          endX: burn.endX === undefined ? undefined : burn.endX - rect.x,
          endY: burn.endY === undefined ? undefined : burn.endY - rect.y,
        })),
        fractures.map((fracture) => ({
          ...fracture,
          rect: new DOMRect(
            fracture.rect.x - rect.x,
            fracture.rect.y - rect.y,
            fracture.rect.width,
            fracture.rect.height,
          ),
        })),
        node,
      );
    },
    hideLetter: (letter: ILetter) => {
      const copy = letterCopies.get(letter);
      copy?.style.setProperty("opacity", "0", "important");
      copy?.style.setProperty(
        "-webkit-text-fill-color",
        "transparent",
        "important",
      );
      copy?.style.setProperty("text-shadow", "none", "important");
      copy?.style.setProperty("text-decoration", "none", "important");
    },
    getAppearance: (element: Element) => {
      const copy = elementCopies.get(element);
      return copy
        ? (copy.cloneNode(true) as HTMLElement)
        : cloneAppearance(element);
    },
    dispose: () => {
      scene.replaceChildren();
      scene.style.removeProperty("mask-image");
      scene.style.removeProperty("background-color");
    },
  };
};
