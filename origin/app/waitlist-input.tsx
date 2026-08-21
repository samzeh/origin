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
  const hoverCapableRef = useRef(false);
  const tapCycleRef = useRef(false);
  const layerRef = useRef<Layer>("static");
  const playIdRef = useRef(0);
  const [layer, setLayer] = useState<Layer>("static");
  const [under, setUnder] = useState<Layer | null>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    "idle",
  );
  const [statusMessage, setStatusMessage] = useState("");

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
    layerRef.current = "static";
    // Hide every video first. Seeking reverse/transition to 0 while they are
    // still the under layer flashes their bright opening frames.
    setUnder(null);
    setLayer("static");

    const reverse = reverseRef.current;
    const transition = transitionRef.current;
    const finished = finishedRef.current;
    reverse?.pause();
    transition?.pause();
    finished?.pause();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          if (reverse) reverse.currentTime = 0;
          if (transition) transition.currentTime = 0;
          if (finished) finished.currentTime = 0;
        } catch {
          /* hidden reset */
        }
      });
    });
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const syncHover = () => {
      hoverCapableRef.current = media.matches;
    };
    syncHover();
    media.addEventListener("change", syncHover);
    return () => media.removeEventListener("change", syncHover);
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
    if (!hoverCapableRef.current) return;
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
    if (!hoverCapableRef.current) return;
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

  const onTap = () => {
    if (hoverCapableRef.current) return;
    if (layerRef.current !== "static") return;

    tapCycleRef.current = true;
    hoveredRef.current = true;
    armReverse();
    void playVideo("transition", 0);
  };

  const onSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (status === "saving") return;

    const nextEmail = email.trim().toLowerCase();
    setEmail("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setStatus("error");
      setStatusMessage("please enter a valid email :(");
      return;
    }

    setStatus("saving");
    setStatusMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nextEmail }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        alreadyJoined?: boolean;
        error?: string;
      };

      if (result.alreadyJoined || response.status === 409) {
        setStatus("error");
        setStatusMessage("you've already registered, see you there ;)");
        return;
      }

      if (!response.ok || !result.ok) {
        setStatus("error");
        setStatusMessage("please enter a valid email :(");
        return;
      }

      setStatus("done");
      setStatusMessage("thanks! we'll let you know when apps drop :)");
    } catch {
      setStatus("error");
      setStatusMessage("please enter a valid email :(");
    }
  };

  const isVisible = (name: Layer) => layer === name || under === name;

  return (
    <form
      className="pointer-events-none relative w-full max-w-[720px]"
      onSubmit={onSubmit}
      noValidate
    >
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
          if (tapCycleRef.current) {
            tapCycleRef.current = false;
            hoveredRef.current = false;
            void playReverseImmediate();
            return;
          }
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
          const reverse = reverseRef.current;
          // Freeze on the last frame so the browser can't flash frame 0.
          if (reverse) {
            reverse.pause();
            try {
              if (Number.isFinite(reverse.duration) && reverse.duration > 0) {
                reverse.currentTime = Math.max(0, reverse.duration - 0.04);
              }
            } catch {
              /* ignore */
            }
          }
          if (hoveredRef.current) {
            void playVideo("transition", 0);
            return;
          }
          showStatic();
        }}
        className={`${MEDIA_CLASS} ${isVisible("reverse") ? "opacity-100" : "opacity-0"} ${layer === "reverse" ? "z-[2]" : "z-[1]"}`}
      />

      <input
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onFocus={() => {
          if (status !== "idle") {
            setStatus("idle");
            setStatusMessage("");
          }
        }}
        onChange={(event) => {
          setEmail(event.target.value);
          if (status !== "idle") {
            setStatus("idle");
            setStatusMessage("");
          }
        }}
        placeholder={statusMessage || "join the waitlist"}
        className={`${originFont.className} pointer-events-auto absolute top-1/2 left-8 right-[28%] z-10 -translate-y-1/2 bg-transparent px-3 py-1 text-sm leading-[1.8] text-black focus:outline-none sm:left-12 sm:right-[24%] sm:px-4 sm:text-lg md:left-16 md:right-[22%] md:px-6 md:text-xl ${
          status === "done"
            ? "placeholder:text-green-600"
            : status === "error"
              ? "placeholder:text-red-500"
              : "placeholder:text-gray-500"
        }`}
      />

      <button
        type="submit"
        className="pointer-events-auto absolute right-1.5 top-1/2 z-20 -translate-y-1/2 cursor-pointer sm:right-3"
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        onClick={onTap}
      >
        <Image
          src="/rsvp button.png"
          alt="RSVP"
          width={168}
          height={70}
          className="h-auto w-[88px] sm:w-[130px] md:w-[168px]"
        />
      </button>
    </form>
  );
}
