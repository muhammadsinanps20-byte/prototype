import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Maximize2,
  Upload,
  X,
} from 'lucide-react';
import { compressImageFile, GalleryPhotoItem } from '../siteData';

interface GallerySectionProps {
  photos: GalleryPhotoItem[];
  failedImages: Record<string, boolean>;
  onImageError: (id: string) => void;
  onAddPublicPhoto?: (payload: {
    title: string;
    caption: string;
    category: string;
    image: string;
  }) => Promise<void> | void;
}

export function GallerySection({
  photos,
  failedImages,
  onImageError,
  onAddPublicPhoto,
}: GallerySectionProps) {
  const visiblePhotos = photos.filter((p) => p.visible);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Public photo share modal state
  const [shareOpen, setShareOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Guest Moment');
  const [previewImage, setPreviewImage] = useState('');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveIndex(null);
      if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) =>
          prev === null ? null : (prev - 1 + visiblePhotos.length) % visiblePhotos.length
        );
      }
      if (e.key === 'ArrowRight') {
        setActiveIndex((prev) =>
          prev === null ? null : (prev + 1) % visiblePhotos.length
        );
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeIndex, visiblePhotos.length]);

  const activePhoto = activeIndex !== null ? visiblePhotos[activeIndex] ?? null : null;

  const handlePrev = () => {
    if (activeIndex === null || visiblePhotos.length === 0) return;
    setActiveIndex((activeIndex - 1 + visiblePhotos.length) % visiblePhotos.length);
  };

  const handleNext = () => {
    if (activeIndex === null || visiblePhotos.length === 0) return;
    setActiveIndex((activeIndex + 1) % visiblePhotos.length);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadStatus('Compressing photo...');
    try {
      const { dataUrl, sizeKB } = await compressImageFile(file, 1200);
      setPreviewImage(dataUrl);
      setUploadStatus(`Photo ready (${sizeKB} KB)`);
    } catch (err) {
      setUploadStatus(null);
      setUploadError(err instanceof Error ? err.message : 'Unable to process image.');
    }
  };

  const handleShareSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !previewImage) {
      setUploadError('Please enter a title and upload a photo first.');
      return;
    }

    setSubmitting(true);
    setUploadError(null);
    try {
      await onAddPublicPhoto?.({
        title: title.trim(),
        caption: caption.trim() || 'Shared from a table at Newform Restaurant, Kalpetta.',
        category,
        image: previewImage,
      });
      setTitle('');
      setCaption('');
      setPreviewImage('');
      setUploadStatus(null);
      setShareOpen(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload photo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="gallery" className="border-t border-[#F6EFE3]/10 bg-[#14110F] py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#D9A441]">
              Editorial &amp; Guest Photography
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[#F6EFE3] sm:text-4xl">
              From Our Brassware &amp; Embers
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-[#F6EFE3]/60 tabular-nums hidden sm:inline">
              {visiblePhotos.length} frames
            </span>
            {onAddPublicPhoto && (
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#D9A441]/50 bg-[#D9A441]/10 px-4 py-2 text-xs font-semibold text-[#D9A441] transition-colors hover:bg-[#D9A441]/20 whitespace-nowrap shrink-0"
              >
                <Upload className="h-3.5 w-3.5" />
                Share a Dining Photo
              </button>
            )}
          </div>
        </div>

        {visiblePhotos.length > 0 && (
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
        )}
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

      {/* Share a Dining Photo Modal */}
      {shareOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Share a Dining Photo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setShareOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#F6EFE3]/15 bg-[#1C1714] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#F6EFE3]/10 pb-3.5">
              <h3 className="font-display text-xl font-semibold text-[#F6EFE3]">
                Share a Dining Photo
              </h3>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                aria-label="Close share modal"
                className="rounded-lg border border-[#F6EFE3]/15 p-1.5 text-[#F6EFE3]/70 hover:text-[#F6EFE3]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleShareSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#F6EFE3]/80">
                  Photo Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Sunday Mandi Platter"
                  className="mt-1.5 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2 text-sm text-[#F6EFE3] placeholder:text-[#F6EFE3]/35 focus:border-[#D9A441] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#F6EFE3]/80">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2 text-sm text-[#F6EFE3] focus:border-[#D9A441] focus:outline-none"
                >
                  <option value="Guest Moment">Guest Moment</option>
                  <option value="Kerala Kitchen">Kerala Kitchen</option>
                  <option value="Arabian Kitchen">Arabian Kitchen</option>
                  <option value="Desserts">Desserts</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#F6EFE3]/80">
                  Caption (Optional)
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Tell diners what dish you enjoyed..."
                  className="mt-1.5 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2 text-sm text-[#F6EFE3] placeholder:text-[#F6EFE3]/35 focus:border-[#D9A441] focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#D9A441]/50 bg-[#D9A441]/10 px-4 py-2.5 text-xs font-semibold text-[#D9A441] hover:bg-[#D9A441]/15"
                >
                  <Upload className="h-4 w-4" />
                  Select Photo from Device
                </button>

                {uploadStatus && (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {uploadStatus}
                  </p>
                )}
                {uploadError && <p className="text-xs text-red-300">{uploadError}</p>}

                {previewImage && (
                  <img
                    src={previewImage}
                    alt="Selected dish preview"
                    className="h-36 w-full rounded-lg border border-[#F6EFE3]/10 object-cover"
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-[#D9A441] px-4 py-2.5 text-sm font-semibold text-[#14110F] hover:bg-[#e5b556] disabled:opacity-60"
              >
                {submitting ? 'Publishing...' : 'Publish Photo to Gallery'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
