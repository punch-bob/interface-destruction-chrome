import { type FC, type RefObject, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { destructionLabels } from "../../constants/labels";

import { WeaponModel } from "./WeaponModel";
import { createDestructionGame } from "../../lib/createDestructionGame";

import useStyles from "./DestructionMode.styles";

export interface IDestructionModeProps {
  rootRef: RefObject<HTMLElement | null>;
  portalRoot?: Element | DocumentFragment;
  initialActive?: boolean;
  onClose?: () => void;
  onReady?: () => void;
  onError?: () => void;
}

export const DestructionMode: FC<IDestructionModeProps> = ({
  rootRef,
  portalRoot = document.body,
  initialActive = false,
  onClose,
  onReady,
  onError,
}) => {
  const classes = useStyles();
  const t = (key: keyof typeof destructionLabels) => destructionLabels[key];
  const [active, setActive] = useState(initialActive);
  const [droneActive, setDroneActive] = useState(false);
  const [cinematic, setCinematic] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [weapon, setWeapon] = useState(1);
  const [gojo, setGojo] = useState(false);
  const [muted, setMuted] = useState(false);
  const [round, setRound] = useState(0);
  const backgroundRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fragmentsRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<ReturnType<typeof createDestructionGame> | undefined>(
    undefined,
  );

  useEffect(() => {
    if (
      !active ||
      !rootRef.current ||
      !canvasRef.current ||
      !fragmentsRef.current ||
      !backgroundRef.current ||
      !sceneRef.current
    ) {
      return undefined;
    }
    const previousFocus = document.activeElement;
    const preventScroll = (event: WheelEvent | TouchEvent) =>
      event.preventDefault();
    window.addEventListener("wheel", preventScroll, { passive: false });
    window.addEventListener("touchmove", preventScroll, { passive: false });
    canvasRef.current.focus();
    try {
      gameRef.current = createDestructionGame({
        root: rootRef.current,
        canvas: canvasRef.current,
        background: backgroundRef.current,
        scene: sceneRef.current,
        fragments: fragmentsRef.current,
        onProgress: setProgress,
        onPause: setPaused,
        onWeapon: setWeapon,
        onMode: setGojo,
        onCinematic: setCinematic,
        onDrone: setDroneActive,
      });
      gameRef.current?.setMode(gojo);
      gameRef.current?.setMuted(muted);
      setPaused(false);
      setCinematic(false);
      setDroneActive(false);
      onReady?.();
    } catch (error) {
      console.error("Не удалось подготовить страницу", error);
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      onError?.();
    }

    return () => {
      gameRef.current?.dispose();
      gameRef.current = undefined;
      window.removeEventListener("wheel", preventScroll);
      window.removeEventListener("touchmove", preventScroll);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, [active, rootRef, round]);

  if (!active) {
    return (
      <div className={classes.launcher}>
        <button
          type="button"
          className={classes.controlButton}
          onClick={() => setActive(true)}
        >
          {t("launch")}
        </button>
      </div>
    );
  }

  const weaponIds = gojo ? [10, 6, 8] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const weapons = gojo
    ? ["Синяя · Притяжение", "Красная · Отталкивание", "Фиолетовая · Полый луч"]
    : [
        t("pistol"),
        t("shotgun"),
        t("rifle"),
        t("sniper"),
        t("flamethrower"),
        t("rocket"),
        t("grenadeLauncher"),
        t("laser"),
        t("nuclear"),
        t("blackHole"),
        t("acid"),
      ];

  return createPortal(
    <div className={classes.game} data-gojo={gojo}>
      <div className={classes.worldLayer}>
        <canvas
          ref={backgroundRef}
          className={classes.background}
          aria-hidden="true"
        />
        <div ref={sceneRef} className={classes.scene} aria-hidden="true" />
      </div>
      <div className={classes.effectsLayer}>
        <div
          ref={fragmentsRef}
          className={classes.fragments}
          aria-hidden="true"
        />
        <canvas
          ref={canvasRef}
          className={classes.canvas}
          tabIndex={0}
          aria-label={t("title")}
        />
      </div>

      <div className={classes.toolbar} data-destruction-controls>
        <div className={classes.heading}>
          <b>{gojo ? "САТОРУ ГОДЖО · БЕЗГРАНИЧНОСТЬ" : t("title")}</b>
          <span className={classes.score}>{progress}%</span>
        </div>
        <div className={classes.progress}>
          <div
            className={classes.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className={classes.actions}>
          {weapons.map((name, index) => (
            <button
              key={name}
              type="button"
              className={classes.weaponButton}
              data-active={weapon === weaponIds[index]}
              aria-pressed={weapon === weaponIds[index]}
              title={name}
              onClick={() => {
                gameRef.current?.setWeapon(weaponIds[index]);
                canvasRef.current?.focus();
              }}
            >
              <span className={classes.weaponNumber}>
                {index === 10 ? "−" : (index + 1) % 10}
              </span>
              <WeaponModel
                weapon={weaponIds[index]}
                technique={gojo ? index + 1 : undefined}
                className={classes.weaponModel}
              />
              <span className={classes.weaponLabel}>{name}</span>
            </button>
          ))}
          <button
            type="button"
            className={classes.controlButton}
            data-active={gojo}
            onClick={() => {
              gameRef.current?.setMode(!gojo);
              canvasRef.current?.focus();
            }}
          >
            {gojo ? "Обычный режим" : "Режим Сатору Годжо"}
          </button>
          {!gojo && (
            <button
              type="button"
              className={classes.controlButton}
              data-active={droneActive}
              onClick={() => {
                gameRef.current?.launchDrone();
                canvasRef.current?.focus();
              }}
            >
              {t(droneActive ? "detonateDrone" : "launchDrone")}
            </button>
          )}
          <button
            type="button"
            className={classes.controlButton}
            aria-pressed={!muted}
            onClick={() => {
              const value = !muted;
              setMuted(value);
              gameRef.current?.setMuted(value);
              canvasRef.current?.focus();
            }}
          >
            {muted ? "Звук: выкл" : "Звук: вкл"}
          </button>
          <button
            type="button"
            className={classes.controlButton}
            onClick={() => gameRef.current?.pause()}
          >
            {t("pause")}
          </button>
          <button
            type="button"
            className={classes.controlButton}
            onClick={() => setRound((value) => value + 1)}
          >
            {t("restart")}
          </button>
          <button
            type="button"
            className={classes.controlButton}
            onClick={() => {
              setActive(false);
              onClose?.();
            }}
          >
            {t("exit")}
          </button>
        </div>
      </div>

      <div className={classes.hints}>
        {gojo && <span>Фиолетовая: один клик · слияние 0,45 с</span>}
        {droneActive && <span>{t("droneHint")}</span>}
        <span>
          <kbd>A</kbd> <kbd>D</kbd> {t("move")}
        </span>
        <span>
          <kbd>Space</kbd> {t("fly")}
        </span>
        <span>{t("shoot")}</span>
        {!gojo && <span>{t("grenade")}</span>}
        <span>
          <kbd>{gojo ? "1–3" : "1–9, 0, −"}</kbd> / {t("wheel")}
        </span>
        <span>
          <kbd>Esc</kbd> {t("pause")}
        </span>
      </div>

      {(paused || (progress === 100 && !cinematic)) && (
        <div className={classes.message} data-destruction-controls>
          <b>{progress === 100 && !cinematic ? t("complete") : t("paused")}</b>
          <span>
            {progress === 100 && !cinematic
              ? t("completeHint")
              : t("pausedHint")}
          </span>
          <div className={classes.actions}>
            {paused && (progress < 100 || cinematic) && (
              <button
                type="button"
                className={classes.controlButton}
                data-primary="true"
                onClick={() => {
                  gameRef.current?.resume();
                  canvasRef.current?.focus();
                }}
              >
                {t("resume")}
              </button>
            )}
            <button
              type="button"
              className={classes.controlButton}
              onClick={() => setRound((value) => value + 1)}
            >
              {t("restart")}
            </button>
            <button
              type="button"
              className={classes.controlButton}
              onClick={() => {
                setActive(false);
                onClose?.();
              }}
            >
              {t("exit")}
            </button>
          </div>
        </div>
      )}
    </div>,
    portalRoot,
  );
};
