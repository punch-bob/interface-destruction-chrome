const loadSprite = (url: string) => {
  const image = new Image();
  image.src = url;
  return image;
};

export const gallerySprites = {
  hero: loadSprite(chrome.runtime.getURL("assets/mecha-hero.png")),
  laser: loadSprite(chrome.runtime.getURL("assets/plasma-gun.png")),
  ship: loadSprite(chrome.runtime.getURL("assets/interceptor.png")),
};
