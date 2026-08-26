"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
  alt: string;
};

export function ProductGallery({ images, alt }: Props) {
  const [index, setIndex] = useState(0);
  const photos = images.length ? images : ["/placeholder-product.svg"];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-b-[20px] bg-card md:rounded-[20px]">
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {photos.map((src, i) => (
            <div key={src + i} className="relative h-full w-full shrink-0">
              <Image
                src={src}
                alt={`${alt} ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(max-width: 512px) 100vw, 512px"
                className="object-cover"
                draggable={false}
                onTouchStart={(e) => {
                  const startX = e.touches[0].clientX;
                  const onEnd = (ev: TouchEvent) => {
                    const dx = ev.changedTouches[0].clientX - startX;
                    if (dx < -40) setIndex((v) => Math.min(v + 1, photos.length - 1));
                    if (dx > 40) setIndex((v) => Math.max(v - 1, 0));
                    document.removeEventListener("touchend", onEnd);
                  };
                  document.addEventListener("touchend", onEnd);
                }}
              />
            </div>
          ))}
        </div>
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Photo ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-5 bg-amber" : "w-1.5 bg-white/40"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
