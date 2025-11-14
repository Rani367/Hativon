'use client';

import Image from "next/image";
import { motion } from "framer-motion";
import { pageVariants } from "@/lib/utils";

export function HeroSection() {
  return (
    <div className="relative w-full h-[350px] sm:h-[450px] md:h-[550px] lg:h-[650px] xl:h-[700px] mb-8 sm:mb-12 -mt-4 sm:-mt-8 overflow-hidden">
      <Image
        src="/main.jpg"
        alt="חטיבון - עיתון התלמידים"
        fill
        className="object-cover"
        priority
        sizes="100vw"
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSI2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIi8+"
      />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <motion.div
          className="text-center text-white px-4 sm:px-6"
          variants={pageVariants}
          initial="initial"
          animate="animate"
        >
          <motion.h1
            className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl mb-4 sm:mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            ברוכים הבאים לחטיבון
          </motion.h1>
          <motion.p
            className="text-lg sm:text-xl md:text-2xl xl:text-3xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            עיתון התלמידים של חטיבת הנדסאים
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
