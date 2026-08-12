"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { originFont } from "./fonts";

type Layer = "static" | "transition" | "finished" | "reverse";

const MEDIA_CLASS =
  "pointer-events-none absolute inset-0 h-full w-full object-contain";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function waitForSeek(video: HTMLVideoElement, time: number) {
  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  const target = clamp(time, 0, Math.max(duration - 0.001, 0));

  if (video.readyState >= 2 && Math.abs(video.currentTime - target) < 0.02) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      video.removeEventListener("seeked", finish);
      video.removeEventListener("loadeddata", onLoaded);
      resolve();
    };

    const onLoaded = () => {
      if (Math.abs(video.currentTime - target) < 0.02) {
        finish();
      }
    };

    const timeout = window.setTimeout(finish, 400);
    video.addEventListener("seeked", finish);
    video.addEventListener("loadeddata", onLoaded);
    video.currentTime = target;
  });
}

export function WaitlistInput() {
  const transitionRef = useRef<HTMLVideoElement>(null);
  const finishedRef = useRef<HTMLVideoElement>(null);
  const reverseRef = useRef<HTMLVideoElement>(null);
  const hoveredRef = useRef(false);
  const layerRef = useRef<Layer>("static");
  const playIdRef = useRef(0);
  const [layer, setLayer] = useState<Layer>("static");
  const [under, setUnder] = useState<Layer | null>(null);

  const videoFor = useCallback((next: Exclude<Layer, "static">) => {
    if (next === "transition") return transitionRef.current;
    if (next === "finished") return finishedRef.current;
    return reverseRef.current;
  }, []);

  const armReverse = useCallback(() => {
    const reverse = reverseRef.current;
    if (!reverse) return;
    reverse.pause();
    reverse.loop = false;
    try {
      if (reverse.readyState >= 1) {
        reverse.currentTime = 0;
      }
    } catch {
      /* reverse may not be ready yet */
    }
  }, []);

  const playReverseImmediate = useCallback(async () => {
    const reverse = reverseRef.current;
    const finished = finishedRef.current;
    if (!reverse) return;

    const playId = ++playIdRef.current;
    const from = layerRef.current;

    if (finished) {
      finished.loop = false;
      finished.pause();
    }

    reverse.loop = false;
    try {
      if (reverse.readyState >= 1 && reverse.currentTime > 0.02) {
        reverse.currentTime = 0;
      }
    } catch {
      /* play from wherever reverse already is */
    }

    try {
      await reverse.play();
    } catch {
      /* AbortError when a play is interrupted by the next clip */
      return;
    }

    if (playId !== playIdRef.current) return;

    layerRef.current = "reverse";
    setUnder(from === "reverse" ? null : from);
    setLayer("reverse");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (playId !== playIdRef.current) return;
        setUnder(null);
        transitionRef.current?.pause();
        finishedRef.current?.pause();
      });
    });
  }, []);

  const showStatic = useCallback(() => {
    playIdRef.current += 1;
    const from = layerRef.current;
    layerRef.current = "static";
    setUnder(from === "static" ? null : from);
    setLayer("static");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setUnder(null);
        reverseRef.current?.pause();
        try {
          if (reverseRef.current) reverseRef.current.currentTime = 0;
        } catch {
          /* hidden reset */
        }
      });
    });
  }, []);

  useEffect(() => {
    const videos = [
      transitionRef.current,
      finishedRef.current,
      reverseRef.current,
    ];

    for (const video of videos) {
      if (!video) continue;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.load();

      const prime = async () => {
        try {
          await video.play();
          video.pause();
          video.currentTime = 0;
        } catch {
          /* autoplay can be blocked until a gesture; muted should succeed */
        }
      };
      void prime();
    }
  }, []);

  const playVideo = useCallback(
    async (next: Exclude<Layer, "static">, startAt = 0) => {
      const video = videoFor(next);
      if (!video) return;

      const playId = ++playIdRef.current;
      const from = layerRef.current;
      video.pause();
      video.loop = next === "finished" && hoveredRef.current;

      try {
        if (video.readyState < 1) {
          await new Promise<void>((resolve) => {
            const timeout = window.setTimeout(resolve, 400);
            video.addEventListener(
              "loadedmetadata",
              () => {
                window.clearTimeout(timeout);
                resolve();
              },
              { once: true },
            );
          });
        }
        if (playId !== playIdRef.current) return;
        await waitForSeek(video, startAt);
      } catch {
        return;
      }

      if (playId !== playIdRef.current) return;

      try {
        await video.play();
      } catch {
        /* AbortError when a play is interrupted by the next clip */
        return;
      }

      if (playId !== playIdRef.current) return;

      layerRef.current = next;
      setUnder(from === next ? null : from);
      setLayer(next);

      if (next === "finished") {
        armReverse();
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (playId !== playIdRef.current) return;
          setUnder(null);
          for (const other of [
            transitionRef.current,
            finishedRef.current,
            reverseRef.current,
          ]) {
            if (other && other !== video) {
              if (next === "finished" && other === reverseRef.current) continue;
              other.pause();
            }
          }
        });
      });
    },
    [armReverse, videoFor],
  );

  const reverseStartTime = useCallback(() => {
    const transition = transitionRef.current;
    const reverse = reverseRef.current;
    if (!transition || !reverse) return 0;

    const transitionDuration = transition.duration;
    const reverseDuration = reverse.duration;
    if (
      !transitionDuration ||
      !reverseDuration ||
      !Number.isFinite(transitionDuration) ||
      !Number.isFinite(reverseDuration)
    ) {
      return 0;
    }

    const progress = clamp(transition.currentTime / transitionDuration, 0, 1);
    return (1 - progress) * reverseDuration;
  }, []);

  const onEnter = () => {
    hoveredRef.current = true;

    if (layerRef.current === "finished") {
      if (finishedRef.current) {
        finishedRef.current.loop = true;
        void finishedRef.current.play().catch(() => {});
      }
      armReverse();
      return;
    }

    if (layerRef.current === "transition") {
      return;
    }

    void playVideo("transition", 0);
  };

  const onLeave = () => {
    hoveredRef.current = false;

    if (layerRef.current === "static" || layerRef.current === "reverse") {
      return;
    }

    if (layerRef.current === "finished") {
      void playReverseImmediate();
      return;
    }

    transitionRef.current?.pause();
    const startAt = reverseStartTime();
    const reverse = reverseRef.current;
    const reverseDuration = reverse?.duration ?? 0;
    if (
      !reverseDuration ||
      !Number.isFinite(reverseDuration) ||
      startAt >= reverseDuration - 0.04
    ) {
      showStatic();
      return;
    }

    void playVideo("reverse", startAt);
  };

  const isVisible = (name: Layer) => layer === name || under === name;

  return (
    <div className="relative w-[720px]">
      <Image
        src="/static input.png"
        alt="Input"
        width={3093}
        height={1400}
        priority
        className="pointer-events-none relative h-auto w-full select-none"
      />

      <video
        ref={transitionRef}
        src="/input transition.mp4"
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onEnded={() => {
          if (layerRef.current !== "transition") return;
          if (!hoveredRef.current) return;
          void playVideo("finished", 0);
        }}
        className={`${MEDIA_CLASS} ${isVisible("transition") ? "opacity-100" : "opacity-0"} ${layer === "transition" ? "z-[2]" : "z-[1]"}`}
      />

      <video
        ref={finishedRef}
        src="/finished input.mp4"
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onEnded={() => {
          if (layerRef.current !== "finished") return;
          if (hoveredRef.current) {
            const finished = finishedRef.current;
            if (!finished) return;
            finished.loop = true;
            try {
              finished.currentTime = 0;
            } catch {
              /* ignore */
            }
            void finished.play().catch(() => {});
            return;
          }
          void playReverseImmediate();
        }}
        className={`${MEDIA_CLASS} ${isVisible("finished") ? "opacity-100" : "opacity-0"} ${layer === "finished" ? "z-[2]" : "z-[1]"}`}
      />

      <video
        ref={reverseRef}
        src="/reverse input.mp4"
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onEnded={() => {
          if (layerRef.current !== "reverse") return;
          if (hoveredRef.current) {
            void playVideo("transition", 0);
            return;
          }
          showStatic();
        }}
        className={`${MEDIA_CLASS} ${isVisible("reverse") ? "opacity-100" : "opacity-0"} ${layer === "reverse" ? "z-[2]" : "z-[1]"}`}
      />

      <input
        type="text"
        placeholder="join the waitlist"
        className={`${originFont.className} absolute top-1/2 left-16 right-0 z-10 -translate-y-1/2 bg-transparent px-6 py-2 text-xl leading-[1.8] text-black placeholder-gray-500 focus:outline-none`}
      />

      <button
        type="button"
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 cursor-pointer"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        <Image src="/rsvp button.png" alt="RSVP" width={168} height={70} />
      </button>
    </div>
  );
}
