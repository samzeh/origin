"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from "react";

const PSFLOWER_MS = 1430;
const WATERING_MS = 1000;
const FLOWER_OFFSET_Y = 96;
const CURSOR_SIZE = 72;
const PLANT_ZONE_TOP = 0.22;
const PLANT_ZONE_BOTTOM = 0.72;
const FLOWER_COLORS = ["b", "p", "w", "y"] as const;

type FlowerColor = (typeof FLOWER_COLORS)[number];
type CursorMode = "can" | "watering";

type Flower = {
  id: number;
  x: number;
  y: number;
  color: FlowerColor;
  stage: "sprout" | "bloom";
};

function pickFlowerColor(): FlowerColor {
  return FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];
}

function flowerSrc(color: FlowerColor, stage: "sprout" | "bloom") {
  return stage === "sprout"
    ? `/flower/${color}sflower.gif`
    : `/flower/${color}flower.gif`;
}

function inPlantBand(y: number, height: number) {
  return (
    y >= height * PLANT_ZONE_TOP && y <= height * PLANT_ZONE_BOTTOM
  );
}

export function GrassGarden() {
  const areaRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const wateringTimer = useRef<number | null>(null);
  const [inPlantZone, setInPlantZone] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [cursorMode, setCursorMode] = useState<CursorMode>("can");
  const [flowers, setFlowers] = useState<Flower[]>([]);

  useEffect(() => {
    return () => {
      if (wateringTimer.current !== null) {
        window.clearTimeout(wateringTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const area = areaRef.current;
    const overlay = overlayRef.current;
    if (!area || !overlay) return;

    const sync = () => {
      overlay.style.height = `${area.offsetHeight}px`;
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(area);
    return () => observer.disconnect();
  }, []);

  const isPlantZone = useCallback((clientY: number) => {
    const area = areaRef.current;
    if (!area) return false;
    const rect = area.getBoundingClientRect();
    return inPlantBand(clientY - rect.top, rect.height);
  }, []);

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const area = areaRef.current;
      if (!area) return;
      const rect = area.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setCursor({ x, y });
      setInPlantZone(inPlantBand(y, rect.height));
    },
    [],
  );

  const onPointerEnter = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      onPointerMove(event);
    },
    [onPointerMove],
  );

  const onPointerLeave = useCallback(() => {
    setInPlantZone(false);
    if (wateringTimer.current !== null) {
      window.clearTimeout(wateringTimer.current);
      wateringTimer.current = null;
    }
    setCursorMode("can");
  }, []);

  const onClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!isPlantZone(event.clientY)) return;

      const area = areaRef.current;
      if (!area) return;

      const rect = area.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top + FLOWER_OFFSET_Y;
      const id = nextId.current++;
      const color = pickFlowerColor();

      setFlowers((prev) => [
        ...prev,
        { id, x, y, color, stage: "sprout" },
      ]);

      window.setTimeout(() => {
        setFlowers((prev) =>
          prev.map((flower) =>
            flower.id === id ? { ...flower, stage: "bloom" } : flower,
          ),
        );
      }, PSFLOWER_MS);

      setCursorMode("watering");
      if (wateringTimer.current !== null) {
        window.clearTimeout(wateringTimer.current);
      }
      wateringTimer.current = window.setTimeout(() => {
        setCursorMode("can");
        wateringTimer.current = null;
      }, WATERING_MS);
    },
    [isPlantZone],
  );

  const gardenBoxClass =
    "absolute bottom-[100px] left-1/2 w-[1100px] max-w-none -translate-x-1/2 sm:bottom-0 sm:w-[1600px] md:bottom-[-100px] md:w-[2000px]";

  return (
    <>
      <div
        ref={areaRef}
        className={`${gardenBoxClass} z-0 ${inPlantZone ? "cursor-none" : ""}`}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onPointerMove={onPointerMove}
        onClick={onClick}
      >
        <Image
          src="/grass animation.gif"
          alt="grass"
          width={2000}
          height={918}
          className="pointer-events-none relative h-auto w-full select-none"
          unoptimized
          priority
        />
      </div>

      <div
        ref={overlayRef}
        className={`${gardenBoxClass} pointer-events-none z-40`}
        aria-hidden
      >
        {flowers.map((flower) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${flower.id}-${flower.stage}`}
            src={flowerSrc(flower.color, flower.stage)}
            alt=""
            className={`absolute h-auto w-10 -translate-x-1/2 -translate-y-full sm:w-12 ${
              flower.stage === "sprout" ? "mix-blend-screen" : ""
            }`}
            style={{ left: flower.x, top: flower.y }}
            draggable={false}
          />
        ))}

        {inPlantZone ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={
              cursorMode === "watering"
                ? "/flower/watering.gif"
                : "/flower/can.gif"
            }
            alt=""
            className={`absolute ${
              cursorMode === "watering" ? "mix-blend-screen" : ""
            }`}
            style={{
              left: cursor.x,
              top: cursor.y,
              width: CURSOR_SIZE,
              height: CURSOR_SIZE,
              transform: "translate(-35%, -35%)",
            }}
            draggable={false}
          />
        ) : null}
      </div>
    </>
  );
}
