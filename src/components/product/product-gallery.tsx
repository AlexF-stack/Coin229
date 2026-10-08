"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
  alt: string;
};

function fallbackToPlaceholder(e: React.SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src && !img.src.includes("placeholder-product")) {
    img.srcset = "";
    img.src = "/placeholder-product.svg";
  }
}

/** Glisser à gauche / à droite (mobile) */
function swipeHandler(onPrev: () => void, onNext: () => void) {
  return (e: React.TouchEvent) => {
    const startX = e.touches[0].clientX;
    const onEnd = (ev: TouchEvent) => {
      const dx = ev.changedTouches[0].clientX - startX;
      if (dx < -40) onNext();
      if (dx > 40) onPrev();
      document.removeEventListener("touchend", onEnd);
    };
    document.addEventListener("touchend", onEnd);
  };
}

const arrowClass =
  "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-md transition hover:bg-white disabled:pointer-events-none disabled:opacity-0";

export function ProductGallery({ images, alt }: Props) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const photos = images.length ? images : ["/placeholder-product.svg"];
  const many = photos.length > 1;
  const prev = () => setIndex((v) => Math.max(v - 1, 0));
  const next = () => setIndex((v) => Math.min(v + 1, photos.length - 1));
  const hasRealPhoto = images.length > 0;

  useEffect(() => {
    const el = dialogRef.current;
    if (zoomed && el && !el.open) el.showModal();
  }, [zoomed]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    }
  }

  return (
    <div className="space-y-3">
      <div
        className="group relative aspect-square overflow-hidden rounded-b-[20px] bg-card md:rounded-[20px]"
        role="region"
        aria-roledescription="galerie"
        aria-label={`Photos : ${alt}`}
        tabIndex={many ? 0 : undefined}
        onKeyDown={onKeyDown}
        onTouchStart={swipeHandler(prev, next)}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {photos.map((src, i) => (
            <button
              key={src + i}
              type="button"
              tabIndex={i === index ? 0 : -1}
              aria-hidden={i !== index}
              disabled={!hasRealPhoto}
              onClick={() => setZoomed(true)}
              aria-label={`Agrandir la photo ${i + 1}`}
              className="relative h-full w-full shrink-0 cursor-zoom-in disabled:cursor-default"
            >
              <Image
                src={src}
                alt={`${alt} ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized={src.startsWith("/uploads/")}
                className="object-cover"
                draggable={false}
                onError={fallbackToPlaceholder}
              />
            </button>
          ))}
        </div>

        {hasRealPhoto && (
          <span className="pointer-events-none absolute right-3 top-3 hidden h-9 w-9 items-center justify-center rounded-full bg-white/85 text-navy opacity-0 shadow transition group-hover:opacity-100 md:flex">
            <ZoomIn className="h-4 w-4" />
          </span>
        )}

        {many && (
          <>
            <button
              type="button"
              onClick={prev}
              disabled={index === 0}
              aria-label="Photo précédente"
              className={cn(arrowClass, "left-3 hidden md:flex")}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              disabled={index === photos.length - 1}
              aria-label="Photo suivante"
              className={cn(arrowClass, "right-3 hidden md:flex")}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Photo ${i + 1}`}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "h-1.5 rounded-full shadow-sm transition-all",
                    i === index ? "w-5 bg-amber" : "w-1.5 bg-white/70"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Miniatures (ordinateur) */}
      {many && (
        <div className="hidden gap-2 md:flex">
          {photos.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Voir la photo ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "relative h-16 w-16 overflow-hidden rounded-[10px] bg-card ring-offset-2 transition",
                i === index ? "ring-2 ring-navy" : "opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="64px"
                unoptimized={src.startsWith("/uploads/")}
                className="object-cover"
                onError={fallbackToPlaceholder}
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom plein écran */}
      {zoomed && (
        <dialog
          ref={dialogRef}
          aria-label={`Photo agrandie : ${alt}`}
          onClose={() => setZoomed(false)}
          onKeyDown={onKeyDown}
          onTouchStart={swipeHandler(prev, next)}
          onClick={(e) => {
            if (e.target === e.currentTarget) dialogRef.current?.close();
          }}
          className="m-0 h-dvh max-h-none w-screen max-w-none bg-black p-0 backdrop:bg-black"
        >
          <div className="pointer-events-none relative h-full w-full">
            <Image
              key={photos[index]}
              src={photos[index]}
              alt={`${alt} ${index + 1}`}
              fill
              sizes="100vw"
              quality={90}
              unoptimized={photos[index].startsWith("/uploads/")}
              className="object-contain"
              onError={fallbackToPlaceholder}
            />
          </div>
          <button
            type="button"
            autoFocus
            onClick={() => dialogRef.current?.close()}
            aria-label="Fermer"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>
          {many && (
            <>
              <button
                type="button"
                onClick={prev}
                disabled={index === 0}
                aria-label="Photo précédente"
                className={cn(arrowClass, "left-4 flex")}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={next}
                disabled={index === photos.length - 1}
                aria-label="Photo suivante"
                className={cn(arrowClass, "right-4 flex")}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-white/70">
                {index + 1} / {photos.length}
              </p>
            </>
          )}
        </dialog>
      )}
    </div>
  );
}
