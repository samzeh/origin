import Image from "next/image";
import { Butterflies } from "./butterflies";
import { originFont } from "./fonts";
import { HeroWaitlist } from "./hero-waitlist";

export default function Home() {
  return (
    <main className="overflow-x-clip bg-[#fff6ed]">
      <section className="relative z-10 min-h-[calc(100svh+1px)]">
        <div
          className={`${originFont.className} absolute top-0 z-30 flex w-full flex-row items-center justify-between gap-2 px-4 py-3 text-lg leading-relaxed sm:px-6 sm:py-4 sm:text-xl md:text-2xl`}
        >
          <button className="cursor-pointer hover:underline">origin</button>
          <button className="cursor-pointer hover:underline">about</button>
          <button className="cursor-pointer hover:underline">faq</button>
          <div className="shrink-0 ">tbd apr &apos;27</div>
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

        <Butterflies />

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4">
          <HeroWaitlist />
        </div>
      </section>

      <div className="h-[160px] sm:h-[260px] md:h-[380px]" aria-hidden />

      <section
        className={`${originFont.className} relative z-20 flex flex-col items-start px-5 pt-10 sm:px-10 sm:pt-20`}
      >
        <h1 className="text-3xl font-bold sm:text-5xl md:text-6xl">
          Hackathons are DEAD!
        </h1>
        <p className="mt-3 text-lg text-gray-600 sm:mt-4 sm:text-6xl">
          The original intent of hackathons was to build community. However, nowadays, it seems like AI slop has taken over. That's why we started Origin, the first anti-AI-slop hackathon, focused on building with humans instead of AI
        </p>
      </section>
    </main>
  );
}
