import Image from "next/image";
import { originFont } from "./fonts";
import { WaitlistInput } from "./waitlist-input";

export default function Home() {
  return (
    <main className="bg-[#fff6ed]">
      <section className="relative z-10 min-h-screen">
        <div
          className={`${originFont.className} absolute top-0 z-30 flex w-full flex-row items-center justify-between px-4 py-4 text-xl leading-relaxed`}
        >
          <button className="cursor-pointer">origin</button>
          <button className="cursor-pointer">about</button>
          <button className="cursor-pointer">faq</button>
          <div>tbd apr &apos;27</div>
        </div>

        <Image
          src="/grass.gif"
          alt="grass"
          width={2000}
          height={918}
          className="absolute bottom-[-380px] left-1/2 z-0 h-auto w-[2000px] max-w-none -translate-x-1/2"
        />

        <Image
          src="/picnic.gif"
          alt="picnic"
          width={500}
          height={500}
          className="absolute -bottom-40 right-10 z-10 h-auto"
        />

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6">
          <WaitlistInput />
        </div>
      </section>

      <div className="h-[380px]" aria-hidden />

      <section className={`${originFont.className} relative z-20 flex flex-col items-start px-10 pt-20`}>
        <h1 className="text-6xl font-bold">Hackathons are dead</h1>
        <p className="mt-4 text-2xl text-gray-600">Long live the hackathon!</p>
      </section>
    </main>
  );
}
