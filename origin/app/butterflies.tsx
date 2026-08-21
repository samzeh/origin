"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

type Flyer = {
  src: string;
  /** Alternate routes cycled each lap (0–100 viewBox). */
  paths: string[];
  facingOffset: number;
  flatten?: number;
  noseLift?: number;
  durationMs: number;
  /** Pause after finishing a lap before the next one. */
  pauseMs?: number;
  sizeClass: string;
  pathColor: string;
  delayMs?: number;
};

const FLYERS: Flyer[] = [
  {
    src: "/butterfly.gif",
    paths: [
      "M 108 24 C 90 18 78 26 66 38 C 52 54 36 64 18 66 C 8 67 2 64 -8 60",
      "M 108 32 C 92 28 80 34 70 42 C 58 52 40 58 20 60 C 10 61 2 58 -8 54",
      "M 108 20 C 88 16 76 28 64 44 C 50 62 34 70 16 72 C 6 73 0 70 -8 66",
      "M 108 40 C 94 34 82 32 70 40 C 55 52 38 62 18 64 C 8 65 2 62 -8 58",
    ],
    facingOffset: 25,
    flatten: 0.85,
    noseLift: 18,
    durationMs: 16000,
    pauseMs: 2000,
    sizeClass: "w-12 sm:w-16 md:w-20",
    pathColor: "#e11d48",
  },
  {
    src: "/butterfly2.gif",
    paths: [
      "M -8 12 C 14 18 30 34 44 46 C 58 58 74 64 90 60 C 98 58 104 56 108 54",
      "M -8 20 C 16 24 32 34 46 42 C 60 50 76 52 92 50 C 100 49 104 48 108 46",
      "M -8 10 C 12 22 28 42 44 56 C 58 68 74 70 90 64 C 98 62 104 58 108 56",
      "M -8 28 C 14 30 30 38 46 48 C 60 56 76 58 92 52 C 100 50 104 48 108 46",
    ],
    facingOffset: -30,
    flatten: 0.85,
    noseLift: 8,
    durationMs: 18000,
    pauseMs: 2000,
    sizeClass: "w-10 sm:w-14 md:w-[72px]",
    pathColor: "#7c3aed",
    delayMs: 2500,
  },
];

const FLATTEN = 0.7;
const NOSE_LIFT = 20;
const PAUSE_MS = 2000;

function sampleAngle(
  path: SVGPathElement,
  length: number,
  total: number,
): number {
  const a = path.getPointAtLength(Math.max(0, Math.min(length, total)));
  const b = path.getPointAtLength(
    Math.max(0, Math.min(length + Math.max(total * 0.002, 0.5), total)),
  );

  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

function flattenHeading(tangentDeg: number, amount: number) {
  const rad = (tangentDeg * Math.PI) / 180;
  const x = Math.cos(rad);
  const y = Math.sin(rad) * (1 - amount);

  return (Math.atan2(y, x) * 180) / Math.PI;
}

function liftNose(tangentDeg: number, liftDeg: number) {
  const rad = (tangentDeg * Math.PI) / 180;
  const cosT = Math.cos(rad);
  const sinT = Math.sin(rad);
  const goingRight = cosT >= 0;

  const downwardness = Math.max(0, sinT);
  const liftScale = 1 - downwardness * 0.85;

  const effectiveLift = liftDeg * liftScale;

  return tangentDeg + (goingRight ? -effectiveLift : effectiveLift);
}

export function Butterflies() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const ghostRefs = useRef<(SVGPathElement | null)[]>([]);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const routeRefs = useRef<number[]>(FLYERS.map(() => 0));
  const lapRefs = useRef<number[]>(FLYERS.map(() => -1));

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    let frame = 0;
    const started = performance.now();

    const setRoute = (flyerIndex: number, routeIndex: number) => {
      const flyer = FLYERS[flyerIndex];
      const d = flyer.paths[routeIndex % flyer.paths.length];

      const path = pathRefs.current[flyerIndex];
      const ghost = ghostRefs.current[flyerIndex];

      if (path) path.setAttribute("d", d);
      if (ghost) ghost.setAttribute("d", d);

      routeRefs.current[flyerIndex] =
        routeIndex % flyer.paths.length;
    };

    for (let i = 0; i < FLYERS.length; i++) {
      setRoute(i, i % FLYERS[i].paths.length);
    }

    const tick = (now: number) => {
      const width = root.clientWidth;
      const height = root.clientHeight;

      for (let i = 0; i < FLYERS.length; i++) {
        const flyer = FLYERS[i];
        const path = pathRefs.current[i];
        const node = nodeRefs.current[i];

        if (!path || !node) continue;

        const elapsed =
          now - started - (flyer.delayMs ?? 0);

        if (elapsed < 0) {
          node.style.visibility = "hidden";
          continue;
        }

        const pauseMs = flyer.pauseMs ?? PAUSE_MS;
        const cycleMs = flyer.durationMs + pauseMs;

        const lap = Math.floor(elapsed / cycleMs);

        if (lap !== lapRefs.current[i]) {
          lapRefs.current[i] = lap;
          setRoute(i, lap);
        }

        const inCycle = elapsed % cycleMs;

        if (inCycle >= flyer.durationMs) {
          node.style.visibility = "hidden";
          continue;
        }

        const total = path.getTotalLength();

        if (!total) continue;

        node.style.visibility = "visible";

        const t = inCycle / flyer.durationMs;
        const dist = t * total;

        const point = path.getPointAtLength(dist);
        const tangent = sampleAngle(path, dist, total);

        const heading = liftNose(
          flattenHeading(
            tangent,
            flyer.flatten ?? FLATTEN,
          ),
          flyer.noseLift ?? NOSE_LIFT,
        );

        const rotate =
          heading - flyer.facingOffset;

        const x = (point.x / 100) * width;
        const y = (point.y / 100) * height;

        node.style.transform = `
          translate3d(${x}px, ${y}px, 0)
          translate(-50%, -50%)
          rotate(${rotate}deg)
        `;
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-[2147483647] overflow-hidden"
      aria-hidden
    >
      {/* 
        Invisible SVG is still required because the animation
        uses SVGPathElement.getTotalLength() and getPointAtLength().
      */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {FLYERS.map((flyer, i) => (
          <g key={`path-${flyer.src}-${i}`}>
            <path
              ref={(el) => {
                pathRefs.current[i] = el;
              }}
              d={flyer.paths[0]}
              fill="none"
            />

            <path
              ref={(el) => {
                ghostRefs.current[i] = el;
              }}
              d={flyer.paths[0]}
              fill="none"
            />
          </g>
        ))}
      </svg>

      {FLYERS.map((flyer, i) => (
        <div
          key={flyer.src + i}
          ref={(el) => {
            nodeRefs.current[i] = el;
          }}
          className={`pointer-events-none absolute top-0 left-0 will-change-transform ${flyer.sizeClass}`}
          style={{
            visibility: "hidden",
          }}
        >
          <Image
            src={flyer.src}
            alt=""
            width={80}
            height={80}
            unoptimized
            draggable={false}
            className="pointer-events-none h-auto w-full select-none"
          />
        </div>
      ))}
    </div>
  );
}