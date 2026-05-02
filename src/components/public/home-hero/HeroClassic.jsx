"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";
import AdaptiveImage from "@/components/ui/AdaptiveImage";

export default function HeroClassic({ slides, baseUrl }) {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  );

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.19, 1, 0.22, 1],
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (!slides || slides.length === 0) return null;

  const isSingleSlide = slides.length === 1;

  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="my-8 px-4"
    >
      <Carousel
        plugins={isSingleSlide ? [] : [plugin.current]}
        opts={{ align: "start", loop: !isSingleSlide }}
        className="group/carousel w-full max-w-7xl mx-auto overflow-hidden rounded-2xl border border-zinc-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-900 shadow-xl shadow-zinc-900/5 dark:shadow-black/40 ring-1 ring-black/[0.03] dark:ring-white/[0.06]"
      >
        <CarouselContent className="ml-0">
          {slides.map((slide) => (
            <CarouselItem key={slide.id} className="pl-0">
              <div className="flex flex-col md:flex-row items-stretch h-auto md:h-[400px] lg:h-[440px] divide-y md:divide-y-0 md:divide-x divide-zinc-100 dark:divide-slate-800">
                <div className="w-full md:w-1/2 relative h-60 md:h-full lg:h-full bg-zinc-100 dark:bg-slate-800 overflow-hidden shrink-0">
                  <motion.div
                    initial={{ scale: 1.08 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="w-full h-full relative"
                  >
                    <AdaptiveImage
                      src={slide.image}
                      alt={slide.title}
                      fill
                      className="object-cover"
                      priority
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/[0.12] via-transparent to-transparent opacity-80 md:opacity-100 md:group-hover/carousel:opacity-90 transition-opacity duration-500"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-0 ring-inset ring-black/[0.04] dark:ring-white/[0.05]"
                      aria-hidden
                    />
                  </motion.div>
                </div>

                <div className="w-full md:w-1/2 p-7 md:p-9 lg:p-11 flex flex-col justify-center bg-gradient-to-b from-white to-zinc-50/80 dark:from-slate-900 dark:to-slate-900/95 transition-colors duration-500">
                  <motion.span
                    variants={itemVariants}
                    className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-[0.32em] mb-3 inline-block"
                  >
                    {slide.subtitle}
                  </motion.span>
                  <motion.span
                    variants={itemVariants}
                    className="block w-10 h-px bg-zinc-900/80 dark:bg-white/50 mb-5"
                    aria-hidden
                  />

                  <motion.h2
                    variants={itemVariants}
                    className="text-2xl md:text-3xl lg:text-[2.1rem] font-black leading-[1.12] text-black dark:text-white uppercase tracking-tight mb-4 max-w-full lg:max-w-md"
                  >
                    {slide.title}
                  </motion.h2>

                  <motion.p
                    variants={itemVariants}
                    className="text-zinc-600 dark:text-zinc-400 text-sm md:text-[0.95rem] mb-7 max-w-md lg:max-w-sm leading-relaxed font-light"
                  >
                    {slide.description}
                  </motion.p>

                  <motion.div
                    variants={itemVariants}
                    className="flex flex-wrap items-center gap-4 mt-auto w-full"
                  >
                    <Button
                      asChild
                      className="group/btn flex-1 md:flex-none rounded-full px-8 h-12 text-[10px] font-black uppercase tracking-[0.2em] bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-900 dark:hover:bg-zinc-100 active:scale-[0.97] transition-all duration-300 shadow-md border border-transparent"
                    >
                      <Link
                        href={`${baseUrl}/products`}
                        prefetch={false}
                        className="flex items-center justify-center whitespace-nowrap gap-2"
                      >
                        Comprar ahora
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-black text-black dark:text-white">
                          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                        </span>
                      </Link>
                    </Button>

                    {!isSingleSlide && (
                      <div className="hidden min-[450px]:flex items-center gap-2 shrink-0">
                        <CarouselPrevious className="static translate-y-0 h-11 w-11 border-zinc-200 dark:border-slate-600 shadow-sm hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:border-black dark:hover:border-white transition-all duration-300 rounded-full" />
                        <CarouselNext className="static translate-y-0 h-11 w-11 border-zinc-200 dark:border-slate-600 shadow-sm hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:border-black dark:hover:border-white transition-all duration-300 rounded-full" />
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </motion.section>
  );
}
