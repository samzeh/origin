"use client";

import { useState } from "react";
import { originFont } from "./fonts";
import { WaitlistInput } from "./waitlist-input";

export function HeroWaitlist() {
  const [showDefinition, setShowDefinition] = useState(false);

  return (
    <div className={`${originFont.className} relative w-full max-w-[720px]`}>
      <div className="pointer-events-none relative z-50">
        <WaitlistInput />
      </div>

      <button
        type="button"
        className="absolute top-[28%] left-[10%] cursor-pointer text-left text-xl leading-none sm:text-2xl md:text-3xl"
        onMouseEnter={() => setShowDefinition(true)}
        onMouseLeave={() => setShowDefinition(false)}
        onFocus={() => setShowDefinition(true)}
        onBlur={() => setShowDefinition(false)}
      >
        Origin
        <span className="relative -top-4 ml-0.75 text-[13px] leading-none sm:text-sm">
          [1]
        </span>
      </button>

      <h1 className="absolute top-[30%] right-[13%] max-w-[45%] text-right text-sm leading-relaxed sm:text-base md:text-lg">
        build with humans, not ai
      </h1>

      <div
        className={`absolute top-[62%] left-[11%] z-10 w-[82%] text-left leading-relaxed transition-opacity duration-300 ${
          showDefinition ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!showDefinition}
      >
        <h1 className="text-base leading-relaxed sm:text-lg">
          [1] Origin <span className="text-lg text-gray-600">noun</span>
        </h1>
        <p className="mt-0.5 text-lg leading-relaxed text-gray-600 sm:text-base">
          a starting point where ideas first meet people and begin to take
          shape
        </p>
      </div>
    </div>
  );
}
