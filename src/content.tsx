import { createRoot } from "react-dom/client";

import { DestructionMode } from "./destruction";
import css from "./destruction/ui/DestructionMode/DestructionMode.css?inline";

const state = globalThis as typeof globalThis & {
  __interfaceDestructionExtension?: { close: () => void };
};

if (state.__interfaceDestructionExtension) {
  state.__interfaceDestructionExtension.close();
} else if (document.body) {
  const host = document.createElement("div");
  host.setAttribute("data-interface-destruction-host", "");
  host.style.setProperty("display", "contents", "important");
  const shadow = host.attachShadow({ mode: "open" });
  const stylesheet = new CSSStyleSheet();
  stylesheet.replaceSync(
    ":host { all: initial; display: contents !important; } " + css,
  );
  shadow.adoptedStyleSheets = [stylesheet];
  const loader = document.createElement("div");
  loader.className = "destruction-loader";
  loader.setAttribute("role", "status");
  loader.setAttribute("aria-live", "polite");
  const spinner = document.createElement("span");
  spinner.className = "destruction-spinner";
  spinner.setAttribute("aria-hidden", "true");
  const label = document.createElement("strong");
  label.textContent = "Готовим страницу к разрушению…";
  const detail = document.createElement("span");
  detail.textContent =
    "Создаём снимок интерфейса. Большой странице может понадобиться больше времени.";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Отмена";
  loader.append(spinner, label, detail, cancel);
  shadow.append(loader);
  let firstFrame = 0;
  let secondFrame = 0;
  const mount = document.createElement("div");
  shadow.append(mount);
  const reactRoot = createRoot(mount);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    cancelAnimationFrame(firstFrame);
    cancelAnimationFrame(secondFrame);
    reactRoot.unmount();
    host.remove();
    delete state.__interfaceDestructionExtension;
    window.removeEventListener("pagehide", close);
  };
  cancel.addEventListener("click", close);
  state.__interfaceDestructionExtension = { close };
  window.addEventListener("pagehide", close, { once: true });
  document.body.append(host);
  // Два кадра дают браузеру отрисовать загрузчик до синхронного чтения DOM.
  firstFrame = requestAnimationFrame(() => {
    secondFrame = requestAnimationFrame(() => {
      if (closed) return;
      reactRoot.render(
        <DestructionMode
          rootRef={{ current: document.body }}
          portalRoot={shadow}
          initialActive
          onReady={() =>
            requestAnimationFrame(() => {
              if (!closed) loader.remove();
            })
          }
          onError={() => {
            spinner.remove();
            label.textContent = "Не удалось подготовить страницу";
            detail.textContent =
              "Закройте игру и попробуйте запустить расширение ещё раз.";
            cancel.textContent = "Закрыть";
          }}
          onClose={() => queueMicrotask(close)}
        />,
      );
    });
  });
}
