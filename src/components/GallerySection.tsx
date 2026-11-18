import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Maximize2, X } from 'lucide-react';
import { GalleryPhotoItem } from '../siteData';

interface GallerySectionProps {
  photos: GalleryPhotoItem[];
  failedImages: Record<string, boolean>;
  onImageError: (id: string) => void;
}

export function GallerySection({
  photos,
  failedImages,
  onImageError,
}: GallerySectionProps) {
  const visiblePhotos = photos.filter((p) => p.visible);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (visiblePhotos.length === 0) {
    return null;
  }

  const activePhoto = activeIndex !== null ? visiblePhotos[activeIndex] ?? null : null;

  const handlePrev = () => {
    if (activeIndex === null) return;
    setActiveIndex((activeIndex - 1 + visiblePhotos.length) % visiblePhotos.length);
  };

  const handleNext = () => {
    if (activeIndex === null) return;
    setActiveIndex((activeIndex + 1) % visiblePhotos.length);
  };

  return (
    <section id="gallery" className="border-t border-[#F6EFE3]/10 bg-[#14110F] py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#D9A441]">
              Editorial Photography
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[#F6EFE3] sm:text-4xl">
              From Our Brassware &amp; Embers
            </h2>
          </div>
          <p className="text-xs text-[#F6EFE3]/60 tabular-nums">
            {visiblePhotos.length} curated kitchen frames
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePhotos.map((photo, index) => {
            const isLead = index === 0;
            return (
              <motion.button
                key={photo.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className={`group relative overflow-hidden rounded-2xl border border-[#F6EFE3]/10 bg-[#1C1714] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9A441] ${
                  isLead ? 'sm:col-span-2 lg:col-span-2' : ''
                }`}
              >
                <div className={`overflow-hidden ${isLead ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
                  {!failedImages[`gal-${photo.id}`] ? (
                    <img
                      src={photo.image}
                      alt={photo.title}
                      referrerPolicy="no-referrer"
                      onError={() => onImageError(`gal-${photo.id}`)}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#231B16] text-[#D9A441]">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
                  <div>
                    <span className="text-xs font-medium text-[#D9A441]">{photo.category}</span>
                    <h3 className="mt-0.5 font-display text-lg font-semibold text-[#F6EFE3]">
                      {photo.title}
                    </h3>
                    <p className="mt-0.5 line-clamp-1 text-xs text-[#F6EFE3]/75">
                      {photo.caption}
                    </p>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#F6EFE3]/20 bg-black/40 text-[#F6EFE3] opacity-80 transition-opacity group-hover:opacity-100">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Lightbox Preview Modal */}
      {activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activePhoto.title}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-[#F6EFE3]/15 bg-[#14110F]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#F6EFE3]/10 px-5 py-3.5">
              <div>
                <span className="text-xs text-[#D9A441]">{activePhoto.category}</span>
                <h3 className="font-display text-lg font-semibold text-[#F6EFE3]">
                  {activePhoto.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                aria-label="Close lightbox"
                className="rounded-lg border border-[#F6EFE3]/15 p-2 text-[#F6EFE3]/75 hover:text-[#F6EFE3]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative bg-black">
              <img
                src={activePhoto.image}
                alt={activePhoto.title}
                referrerPolicy="no-referrer"
                className="mx-auto max-h-[70vh] w-full object-contain"
              />

              {visiblePhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous photo"
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-[#F6EFE3]/20 bg-black/60 p-2.5 text-[#F6EFE3] hover:border-[#D9A441] hover:text-[#D9A441]"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next photo"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-[#F6EFE3]/20 bg-black/60 p-2.5 text-[#F6EFE3] hover:border-[#D9A441] hover:text-[#D9A441]"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm text-[#F6EFE3]/75">
              <p>{activePhoto.caption}</p>
              <span className="tabular-nums text-xs text-[#F6EFE3]/50 shrink-0">
                {(activeIndex ?? 0) + 1} / {visiblePhotos.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
