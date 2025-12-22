"use client";

import Image from "next/image";

export function HeroSection() {
  return (
    <div className="relative w-full h-[350px] sm:h-[450px] md:h-[550px] lg:h-[650px] xl:h-[700px] mb-8 sm:mb-12 -mt-4 sm:-mt-8 overflow-hidden">
      <Image
        src="/main.jpg"
        alt="חטיבון - עיתון התלמידים"
        fill
        className="object-cover"
        priority
        quality={90}
        sizes="100vw"
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSI2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIi8+"
      />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <div className="text-center text-white px-4 sm:px-6 will-animate">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl mb-4 sm:mb-6 animate-fade-in-up">
            ברוכים הבאים לחטיבון
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl xl:text-3xl animate-fade-in-up animate-delay-2">
            עיתון התלמידים של חטיבת הנדסאים
          </p>
        </div>
      </div>
    </div>
  );
}
