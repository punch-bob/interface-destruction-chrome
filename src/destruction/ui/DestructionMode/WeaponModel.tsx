import { drawTechniqueOrb } from "../../lib/drawGojo";
import { type FC, useEffect, useRef } from "react";

import { drawWeaponModel } from "../../lib/drawGameModels";
import { gallerySprites } from "../../lib/gallerySprites";

interface IWeaponModelProps {
  weapon: number;
  technique?: number;
  className: string;
}

export const WeaponModel: FC<IWeaponModelProps> = ({
  weapon,
  className,
  technique,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }
    const draw = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = 108 * scale;
      canvas.height = 44 * scale;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.translate(43, 22);
      ctx.scale(1.1, 1.1);
      if (technique) drawTechniqueOrb(ctx, 0, 0, 10, technique, 500);
      else drawWeaponModel(ctx, weapon);
    };
    draw();
    gallerySprites.laser.addEventListener("load", draw);
    return () => gallerySprites.laser.removeEventListener("load", draw);
  }, [weapon, technique]);
  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
};
