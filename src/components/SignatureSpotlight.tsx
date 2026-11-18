import React from 'react';
import { motion } from 'motion/react';
import { Utensils } from 'lucide-react';
import { DishItem } from '../siteData';

interface SignatureSpotlightProps {
  dishes: DishItem[];
  failedImages: Record<string, boolean>;
  onImageError: (id: string) => void;
  onExploreMenu: () => void;
}

export function SignatureSpotlight({
  dishes,
  failedImages,
  onImageError,
  onExploreMenu,
}: SignatureSpotlightProps) {
  const signatureDishes = dishes
    .filter((d) => d.available && d.isSignature)
    .slice(0, 3);

  if (signatureDishes.length === 0) {
    return null;
  }

  return (
    <section id="signature" className="border-t border-[#F6EFE3]/10 bg-[#14110F] py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-wider text-[#D9A441]">
              Signature Dish Spotlight
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[#F6EFE3] sm:text-4xl text-balance">
              Crafted for Every Table in Kalpetta
            </h2>
          </div>

          <button
            type="button"
            onClick={onExploreMenu}
            className="text-sm font-semibold text-[#D9A441] hover:underline whitespace-nowrap shrink-0"
          >
            Browse Full Menu →
          </button>
        </div>

        <div className="mt-10 space-y-10">
          {signatureDishes.map((dish, idx) => {
            const isReversed = idx % 2 === 1;
            return (
              <motion.article
                key={dish.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="grid items-stretch gap-8 rounded-2xl border border-[#F6EFE3]/10 bg-[#191512] p-6 sm:p-8 lg:grid-cols-12"
              >
                <div
                  className={`lg:col-span-6 ${
                    isReversed ? 'lg:order-2' : 'lg:order-1'
                  }`}
                >
                  <div className="h-full overflow-hidden rounded-xl border border-[#F6EFE3]/10 bg-[#14110F]">
                    {!failedImages[`sig-${dish.id}`] ? (
                      <img
                        src={dish.image}
                        alt={dish.name}
                        referrerPolicy="no-referrer"
                        onError={() => onImageError(`sig-${dish.id}`)}
                        className="h-full w-full object-cover aspect-[4/3] lg:aspect-auto transition-transform duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full min-h-[240px] items-center justify-center bg-[#231B16] text-[#D9A441]">
                        <Utensils className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={`flex flex-col justify-center lg:col-span-6 ${
                    isReversed ? 'lg:order-1' : 'lg:order-2'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#F6EFE3]/60">
                    <span className="font-medium text-[#D9A441] uppercase tracking-wider">
                      0{idx + 1} · {dish.category} Kitchen
                    </span>
                    {dish.dietaryTags.length > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{dish.dietaryTags.join(' · ')}</span>
                      </>
                    )}
                  </div>

                  <div className="mt-3 flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-2xl font-semibold text-[#F6EFE3] sm:text-3xl">
                      {dish.name}
                    </h3>
                    <span className="tabular-nums text-xl font-semibold text-[#D9A441] shrink-0">
                      {dish.price}
                    </span>
                  </div>

                  {dish.malayalamName && (
                    <p className="mt-1 text-sm text-[#F6EFE3]/55">{dish.malayalamName}</p>
                  )}

                  <p className="mt-4 text-sm leading-relaxed text-[#F6EFE3]/75 sm:text-base">
                    {dish.description}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
