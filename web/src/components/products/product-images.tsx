"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

interface ProductImagesProps {
  images: string[];
  name: string;
}

export function ProductImages({ images, name }: ProductImagesProps) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <div className="bg-muted flex aspect-square items-center justify-center rounded-lg">
        <span className="text-muted-foreground">No image available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-muted relative aspect-square overflow-hidden rounded-lg">
        <Image
          src={images[selected]}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={cn(
                "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2",
                i === selected ? "border-primary" : "border-transparent",
              )}
            >
              <Image
                src={img}
                alt={`${name} ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
