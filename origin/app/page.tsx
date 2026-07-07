import Image from "next/image";

export default function Home() {
  return (
    <main className="bg-[#fff6ed]">
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute top-0 z-30 flex w-full flex-row justify-between items-center py-4 px-4">
          <button className="cursor-pointer">origin</button>
          <button className="cursor-pointer">about</button>
          <button className="cursor-pointer">faq</button>
          <div>tbd apr '27</div>
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
          <div className="relative">
            <Image src="/input.png" alt="Input" width={500} height={80} />

            <input
              type="text"
              placeholder="join the waitlist"
              className="absolute top-0 bottom-5 left-10 right-0 bg-transparent px-6 text-lg text-black placeholder-gray-500 focus:outline-none"
            />

            <button className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
              <Image src="/rsvp_button.png" alt="RSVP" width={120} height={50} />
            </button>
          </div>
        </div>
      </section>

      <section className="relative z-30 flex flex-col items-start bg-[#fff6ed] px-10 pt-20">
        <h1 className="text-6xl font-bold">Hackathons are dead</h1>
        <p className="mt-4 text-xl text-gray-600">Long live the hackathon!</p>
      </section>
    </main>
  );
}