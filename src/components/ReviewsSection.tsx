import React from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { GUEST_REVIEWS, RATING_STATS } from '../siteData';

export function ReviewsSection() {
  return (
    <section id="reviews" className="border-t border-[#F6EFE3]/10 bg-[#191512] py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-xs font-medium uppercase tracking-wider text-[#D9A441]">
              Verified Guest Reviews
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[#F6EFE3] sm:text-4xl">
              Trusted Across Wayanad
            </h2>
            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-display text-5xl font-semibold tabular-nums text-[#F6EFE3]">
                {RATING_STATS.average.toFixed(1)}
              </span>
              <span className="text-sm text-[#F6EFE3]/65 tabular-nums">
                / 5.0 · {RATING_STATS.total.toLocaleString()}+ Google Reviews
              </span>
            </div>

            <div className="mt-6 space-y-2.5">
              {RATING_STATS.breakdown.map((row) => {
                const pct = Math.round((row.count / RATING_STATS.total) * 100);
                return (
                  <div key={row.stars} className="flex items-center gap-3 text-xs">
                    <span className="w-8 tabular-nums text-[#F6EFE3]/80">{row.stars}★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#14110F]">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full origin-left rounded-full bg-[#D9A441]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-14 text-right tabular-nums text-[#F6EFE3]/60">
                      {row.count.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="mt-5 text-xs leading-relaxed text-[#F6EFE3]/55">
              Frequently praised by diners for flaky tawa parotta, tender beef fry, generous
              Mandi portions, and family-friendly pricing.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3 lg:col-span-7 lg:grid-cols-1">
            {GUEST_REVIEWS.map((review) => (
              <motion.blockquote
                key={review.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl border border-[#F6EFE3]/10 bg-[#14110F] p-6"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-[#F6EFE3]/60">
                  <span>
                    <strong className="font-semibold text-[#F6EFE3]">{review.author}</strong> ·{' '}
                    {review.context}
                  </span>
                  <span className="inline-flex items-center gap-1 tabular-nums text-[#D9A441]">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {review.rating}.0
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#F6EFE3]/80">
                  “{review.quote}”
                </p>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
