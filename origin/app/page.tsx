import Image from "next/image";
import { originFont } from "./fonts";
import { WaitlistInput } from "./waitlist-input";

export default function Home() {
  return (
    <main className="overflow-x-hidden bg-[#fff6ed]">
      <section className="relative z-10 min-h-dvh">
        <div
          className={`${originFont.className} absolute top-0 z-30 flex w-full flex-row items-center justify-between gap-2 px-3 py-3 text-sm leading-relaxed sm:px-4 sm:py-4 sm:text-lg md:text-xl`}
        >
          <button className="cursor-pointer">origin</button>
          <button className="cursor-pointer">about</button>
          <button className="cursor-pointer">faq</button>
          <div className="shrink-0">tbd apr &apos;27</div>
        </div>

        <Image
          src="/grass.gif"
          alt="grass"
          width={2000}
          height={918}
          className="absolute bottom-[-160px] left-1/2 z-0 h-auto w-[1100px] max-w-none -translate-x-1/2 sm:bottom-[-260px] sm:w-[1600px] md:bottom-[-380px] md:w-[2000px]"
        />

        <Image
          src="/picnic.gif"
          alt="picnic"
          width={500}
          height={500}
          className="absolute bottom-16 right-2 z-10 h-auto w-[200px] sm:-bottom-28 sm:right-6 sm:w-[320px] md:-bottom-40 md:right-10 md:w-[500px]"
        />

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 px-4">
          <WaitlistInput />
        </div>
      </section>

      <div className="h-[160px] sm:h-[260px] md:h-[380px]" aria-hidden />

      <section
        className={`${originFont.className} relative z-20 flex flex-col items-start px-5 pt-10 sm:px-10 sm:pt-20`}
      >
        <h1 className="text-3xl font-bold sm:text-5xl md:text-6xl">
          Hackathons are dead
        </h1>
        <p className="mt-3 text-lg text-gray-600 sm:mt-4 sm:text-2xl">
          Long live the hackathon!
        </p>
      </section>
    </main>
  );
}
