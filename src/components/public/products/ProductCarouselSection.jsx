"use client";

import { useState, useEffect, useRef } from "react";
import ProductCard from "@/components/public/products/ProductCard";

export default function ProductCarouselSection({
  title,
  products = [],
  categories = [],
  direction = "left",
}) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const dragDistance = useRef(0);

  if (!products || products.length === 0) return null;

  const items = hasOverflow ? [...products, ...products] : products;

  const isPaused = isHovered || isTouched || isSheetOpen || !hasOverflow;

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const computeOverflow = () => {
      const nextHasOverflow = track.scrollWidth > container.clientWidth + 2;
      setHasOverflow(nextHasOverflow);
      if (!nextHasOverflow) {
        container.scrollLeft = 0;
      }
    };

    computeOverflow();
    const resizeObserver = new ResizeObserver(computeOverflow);
    resizeObserver.observe(container);
    resizeObserver.observe(track);
    window.addEventListener("resize", computeOverflow);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", computeOverflow);
    };
  }, [products]);

  useEffect(() => {
    if (isSheetOpen) {
      setIsHovered(false);
      setIsTouched(false);
      isDragging.current = false;
      return;
    }

    // Ensure autoplay restarts immediately after closing the sheet,
    // especially on touch devices where touchend may not fire.
    setIsHovered(false);
    setIsTouched(false);
    isDragging.current = false;
    dragDistance.current = 0;
  }, [isSheetOpen]);

  // JS-based smooth auto-scroll with frame rate matching and drag/trackpad support
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasOverflow) return;

    let animationFrameId;

    // Adjust speed (pixels per frame)
    // 0.8 is standard speed, negative for scrolling right
    const speed = direction === "left" ? 0.8 : -0.8;

    const step = () => {
      if (!isDragging.current) {
        const halfWidth = container.scrollWidth / 2;

        if (!isPaused) {
          container.scrollLeft += speed;
        }

        // Wrap around seamlessly
        if (direction === "left") {
          if (container.scrollLeft >= halfWidth) {
            container.scrollLeft -= halfWidth;
          }
        } else {
          if (container.scrollLeft <= 0) {
            container.scrollLeft += halfWidth;
          }
        }
      } else {
        // Even when dragging, keep the wrap-around active
        const halfWidth = container.scrollWidth / 2;
        if (container.scrollLeft >= halfWidth) {
          container.scrollLeft -= halfWidth;
        } else if (container.scrollLeft <= 0) {
          container.scrollLeft += halfWidth;
        }
      }

      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, direction, hasOverflow]);

  // Drag to scroll handlers
  const handleMouseDown = (e) => {
    if (!hasOverflow) return;
    isDragging.current = true;
    dragDistance.current = 0;
    startX.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeftStart.current = containerRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !hasOverflow) return;
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // Sensitivity multiplier
    dragDistance.current = Math.abs(walk);
    containerRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  // Prevent navigations if the user dragged
  const handleCaptureClick = (e) => {
    if (dragDistance.current > 10) {
      e.preventDefault();
      e.stopPropagation();
      dragDistance.current = 0;
    }
  };

  return (
    <div className="space-y-8 my-20 px-4 select-none">
      {/* Header Container (aligned inside standard page margins) */}
      <div className="flex flex-col gap-4 px-2 md:px-2">
        {/* Heading (Sleek minimalist style) */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-50 leading-none">
            {title}
          </h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            {products.length} {products.length === 1 ? "producto" : "productos"}
          </span>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative w-full overflow-hidden py-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-3 bg-linear-to-r from-white via-white/70 to-transparent dark:from-black dark:via-black/70" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-3 bg-linear-to-l from-white via-white/70 to-transparent dark:from-black dark:via-black/70" />
        <div
          ref={containerRef}
          className={`overflow-x-auto scrollbar-none select-none ${hasOverflow ? "cursor-grab active:cursor-grabbing" : ""}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={() => {
            handleMouseUpOrLeave();
            setIsHovered(false);
          }}
          onClickCapture={handleCaptureClick}
          onMouseEnter={() => setIsHovered(true)}
          onTouchStart={() => setIsTouched(true)}
          onTouchEnd={() => setIsTouched(false)}
          onTouchCancel={() => setIsTouched(false)}
          onDragStart={(e) => e.preventDefault()}
        >
          <div ref={trackRef} className="flex">
            {items.map((product, idx) => (
              <div
                key={`${product.id}-${idx}`}
                className="w-[200px] sm:w-[230px] md:w-[300px] lg:w-[340px] xl:w-[380px] shrink-0 px-1 sm:px-2 md:px-3"
              >
                <ProductCard
                  product={product}
                  index={idx}
                  allCategories={categories}
                  onSheetOpenChange={setIsSheetOpen}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
