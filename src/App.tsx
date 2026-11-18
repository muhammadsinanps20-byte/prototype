/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  Menu as MenuIcon,
  MessageCircle,
  Navigation,
  Phone,
  Search,
  Utensils,
  X,
} from 'lucide-react';
import AdminPortal from './components/admin/AdminPortal';
import { CustomCursor } from './components/CustomCursor';
import { GallerySection } from './components/GallerySection';
import { ReviewsSection } from './components/ReviewsSection';
import { SignatureSpotlight } from './components/SignatureSpotlight';
import {
  DEFAULT_SITE_SETTINGS,
  DietaryTag,
  DishCategory,
  DishItem,
  GalleryPhotoItem,
  HERO_IMAGE,
  INITIAL_DISHES,
  INITIAL_GALLERY,
  INITIAL_INQUIRIES,
  INITIAL_RESERVATIONS,
  InquiryItem,
  loadFromStorage,
  ReservationItem,
  saveToStorage,
  SiteSettingsData,
  STORAGE_KEYS,
} from './siteData';

const CATEGORY_TABS: Array<{ id: 'all' | DishCategory; label: string }> = [
  { id: 'all', label: 'All Cuisines' },
  { id: 'kerala', label: 'Kerala' },
  { id: 'arabian', label: 'Arabian' },
  { id: 'chinese', label: 'Chinese' },
  { id: 'dessert', label: 'Desserts' },
];

const DIETARY_FILTERS: Array<'All' | DietaryTag> = [
  'All',
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Spicy',
];

function isAdminHash(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hash === '#/admin' || window.location.hash.startsWith('#/admin/');
}

class AppErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#14110F] text-[#F6EFE3] flex items-center justify-center px-6">
          <div className="max-w-md rounded-2xl border border-[#F6EFE3]/15 bg-[#1C1714] p-8 text-center">
            <h1 className="font-display text-2xl font-semibold text-[#F6EFE3]">
              Newform Restaurant
            </h1>
            <p className="mt-2 text-sm text-[#F6EFE3]/70">
              Something interrupted the page view. Click below to reload cleanly.
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.hash = '';
                window.location.reload();
              }}
              className="mt-5 rounded-lg bg-[#D9A441] px-5 py-2.5 text-sm font-semibold text-[#14110F]"
            >
              Reload Homepage
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function RestaurantApp() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(isAdminHash);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Persistent shared state between Public Website and Staff Portal
  const [dishes, setDishes] = useState<DishItem[]>(() =>
    loadFromStorage<DishItem[]>(STORAGE_KEYS.dishes, INITIAL_DISHES)
  );
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhotoItem[]>(() =>
    loadFromStorage<GalleryPhotoItem[]>(STORAGE_KEYS.gallery, INITIAL_GALLERY)
  );
  const [reservations, setReservations] = useState<ReservationItem[]>(() =>
    loadFromStorage<ReservationItem[]>(STORAGE_KEYS.reservations, INITIAL_RESERVATIONS)
  );
  const [inquiries, setInquiries] = useState<InquiryItem[]>(() =>
    loadFromStorage<InquiryItem[]>(STORAGE_KEYS.inquiries, INITIAL_INQUIRIES)
  );
  const [siteSettings, setSiteSettings] = useState<SiteSettingsData>(() =>
    loadFromStorage<SiteSettingsData>(STORAGE_KEYS.settings, DEFAULT_SITE_SETTINGS)
  );

  // Hydrate public data from Express backend when available
  useEffect(() => {
    let cancelled = false;
    const loadPublicSite = async () => {
      try {
        const res = await fetch('/api/public/site');
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data.dishes) && data.dishes.length > 0) {
          setDishes((prev) => {
            const hiddenMap = new Map(prev.filter((d) => !d.available).map((d) => [d.id, d]));
            const merged = (data.dishes as DishItem[]).map((item) => item);
            hiddenMap.forEach((hiddenDish) => {
              if (!merged.some((d) => d.id === hiddenDish.id)) {
                merged.push(hiddenDish);
              }
            });
            return merged;
          });
        }
        if (Array.isArray(data.gallery) && data.gallery.length > 0) {
          setGalleryPhotos(data.gallery);
        }
        if (data.settings) {
          setSiteSettings((prev) => ({ ...prev, ...data.settings }));
        }
      } catch {
        // Fallback to localStorage / siteData defaults seamlessly
      }
    };
    void loadPublicSite();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sync changes to localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.dishes, dishes);
  }, [dishes]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.gallery, galleryPhotos);
  }, [galleryPhotos]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.reservations, reservations);
  }, [reservations]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.inquiries, inquiries);
  }, [inquiries]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.settings, siteSettings);
  }, [siteSettings]);

  // Menu filters
  const [selectedCategory, setSelectedCategory] = useState<'all' | DishCategory>('all');
  const [selectedDietary, setSelectedDietary] = useState<'All' | DietaryTag>('All');
  const [menuSearch, setMenuSearch] = useState('');

  // Reservation form state
  const [resName, setResName] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resDate, setResDate] = useState('2026-11-18');
  const [resTime, setResTime] = useState('19:30');
  const [resGuests, setResGuests] = useState(4);
  const [resSeating, setResSeating] = useState<ReservationItem['seatingArea']>('family-lounge');
  const [resNotes, setResNotes] = useState('');
  const [resError, setResError] = useState<string | null>(null);
  const [resConfirmed, setResConfirmed] = useState<string | null>(null);

  // Inquiry form state
  const [inqName, setInqName] = useState('');
  const [inqContact, setInqContact] = useState('');
  const [inqType, setInqType] = useState<InquiryItem['type']>('catering');
  const [inqMessage, setInqMessage] = useState('');
  const [inqConfirmed, setInqConfirmed] = useState(false);

  // Directions origin input
  const [startingPoint, setStartingPoint] = useState('');

  // Image fallback tracker
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleHashChange = () => {
      setIsAdminRoute(isAdminHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  const openAdminPortal = () => {
    setMobileMenuOpen(false);
    window.location.hash = '#/admin';
    setIsAdminRoute(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeAdminPortal = () => {
    window.location.hash = '';
    setIsAdminRoute(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const visibleDishes = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();
    return dishes.filter((dish) => {
      if (!dish.available) return false;
      if (selectedCategory !== 'all' && dish.category !== selectedCategory) return false;
      if (selectedDietary !== 'All' && !dish.dietaryTags.includes(selectedDietary)) return false;
      if (q) {
        return (
          dish.name.toLowerCase().includes(q) ||
          dish.description.toLowerCase().includes(q) ||
          (dish.malayalamName?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [dishes, selectedCategory, selectedDietary, menuSearch]);

  const handleReservationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResError(null);
    setResConfirmed(null);

    if (resName.trim().length < 2) {
      setResError('Please enter your full name.');
      return;
    }
    if (resPhone.trim().length < 8) {
      setResError('Please enter a valid contact phone number.');
      return;
    }

    const payload = {
      guestName: resName.trim(),
      guestPhone: resPhone.trim(),
      date: resDate,
      time: resTime,
      guests: Number(resGuests) || 2,
      seatingArea: resSeating,
      specialRequests: resNotes.trim() || undefined,
    };

    let createdBooking: ReservationItem = {
      id: `res-${Date.now()}`,
      ...payload,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        createdBooking = (await response.json()) as ReservationItem;
      }
    } catch {
      // Local persistence fallback
    }

    setReservations((prev) => [createdBooking, ...prev]);
    setResConfirmed(
      `Reservation request received for ${createdBooking.guestName} (${createdBooking.guests} guests on ${createdBooking.date} at ${createdBooking.time}).`
    );
    setResName('');
    setResPhone('');
    setResNotes('');
  };

  const handleInquirySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inqName.trim() || !inqContact.trim() || !inqMessage.trim()) return;

    const payload = {
      name: inqName.trim(),
      phoneOrEmail: inqContact.trim(),
      type: inqType,
      message: inqMessage.trim(),
    };

    let createdInquiry: InquiryItem = {
      id: `inq-${Date.now()}`,
      ...payload,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        createdInquiry = (await response.json()) as InquiryItem;
      }
    } catch {
      // Local persistence fallback
    }

    setInquiries((prev) => [createdInquiry, ...prev]);
    setInqName('');
    setInqContact('');
    setInqMessage('');
    setInqConfirmed(true);
    setTimeout(() => setInqConfirmed(false), 4000);
  };

  const handleAddPublicPhoto = async (payload: {
    title: string;
    caption: string;
    category: string;
    image: string;
  }) => {
    let createdPhoto: GalleryPhotoItem = {
      id: `gal-${Date.now()}`,
      title: payload.title,
      caption: payload.caption,
      category: payload.category,
      image: payload.image,
      visible: true,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch('/api/gallery/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        createdPhoto = (await response.json()) as GalleryPhotoItem;
      }
    } catch {
      // Local persistence fallback
    }

    setGalleryPhotos((prev) => [createdPhoto, ...prev]);
  };

  const scrollToMenu = (category?: DishCategory) => {
    if (category) {
      setSelectedCategory(category);
      setSelectedDietary('All');
    }
    const menuEl = document.getElementById('menu');
    menuEl?.scrollIntoView({ behavior: 'smooth' });
  };

  const directionsHref = useMemo(() => {
    const dest = encodeURIComponent('Newform Restaurant, Kalpetta, Wayanad, Kerala 673121');
    const origin = startingPoint.trim()
      ? `&origin=${encodeURIComponent(startingPoint.trim())}`
      : '';
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}${origin}`;
  }, [startingPoint]);

  const phoneHref = `tel:${siteSettings.phone.replace(/\s+/g, '')}`;
  const whatsappHref = `https://wa.me/${siteSettings.whatsappNumber.replace(/\D/g, '')}`;

  if (isAdminRoute) {
    return (
      <>
        <CustomCursor />
        <AdminPortal
          onBack={closeAdminPortal}
          dishes={dishes}
          onUpdateDishes={setDishes}
          galleryPhotos={galleryPhotos}
          onUpdateGalleryPhotos={setGalleryPhotos}
          reservations={reservations}
          onUpdateReservations={setReservations}
          inquiries={inquiries}
          onUpdateInquiries={setInquiries}
          siteSettings={siteSettings}
          onUpdateSiteSettings={setSiteSettings}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#14110F] text-[#F6EFE3] pb-16 sm:pb-0">
      <CustomCursor />

      {/* Optional Live Notice Banner */}
      {siteSettings.noticeBanner.trim() && (
        <div className="bg-[#D9A441] px-4 py-2 text-center text-xs font-semibold text-[#14110F]">
          {siteSettings.noticeBanner}
        </div>
      )}

      {/* Top Navigation Bar (Strict 3-Zone Contract) */}
      <header className="sticky top-0 z-40 border-b border-[#F6EFE3]/10 bg-[#14110F]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-4">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#top"
            className="font-display text-2xl font-semibold tracking-tight text-[#F6EFE3] whitespace-nowrap shrink-0"
          >
            Newform
          </a>

          {/* Zone 2: Single-line Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#F6EFE3]/75">
            <a
              href="#kitchens"
              className="hover:text-[#D9A441] transition-colors whitespace-nowrap shrink-0"
            >
              Kitchens
            </a>
            <a
              href="#menu"
              className="hover:text-[#D9A441] transition-colors whitespace-nowrap shrink-0"
            >
              Menu
            </a>
            <a
              href="#gallery"
              className="hover:text-[#D9A441] transition-colors whitespace-nowrap shrink-0"
            >
              Gallery
            </a>
            <a
              href="#reviews"
              className="hover:text-[#D9A441] transition-colors whitespace-nowrap shrink-0"
            >
              Reviews
            </a>
            <a
              href="#visit"
              className="hover:text-[#D9A441] transition-colors whitespace-nowrap shrink-0"
            >
              Visit
            </a>
          </nav>

          {/* Zone 3: Primary Action + Subtle Staff Portal Lock Icon */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#reserve"
              className="hidden sm:inline-flex items-center rounded-lg bg-[#D9A441] px-4 py-2 text-xs font-semibold text-[#14110F] transition-colors hover:bg-[#e5b556] whitespace-nowrap shrink-0"
            >
              Book a Table
            </a>
            <button
              type="button"
              onClick={openAdminPortal}
              aria-label="Staff & Admin Portal"
              title="Staff & Admin Portal"
              className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#F6EFE3]/15 text-[#F6EFE3]/65 transition-colors hover:border-[#D9A441]/50 hover:text-[#D9A441]"
            >
              <Lock className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#F6EFE3]/15 text-[#F6EFE3]"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#F6EFE3]/10 bg-[#1A1512] px-6 py-4 space-y-3">
            <a
              href="#kitchens"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-sm font-medium text-[#F6EFE3]/85"
            >
              Kitchens
            </a>
            <a
              href="#menu"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-sm font-medium text-[#F6EFE3]/85"
            >
              Menu
            </a>
            <a
              href="#gallery"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-sm font-medium text-[#F6EFE3]/85"
            >
              Gallery
            </a>
            <a
              href="#reviews"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-sm font-medium text-[#F6EFE3]/85"
            >
              Reviews
            </a>
            <a
              href="#visit"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-sm font-medium text-[#F6EFE3]/85"
            >
              Visit
            </a>
            <a
              href="#reserve"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-sm font-semibold text-[#D9A441]"
            >
              Book a Table
            </a>
            <button
              type="button"
              onClick={openAdminPortal}
              className="flex items-center gap-2 pt-2 border-t border-[#F6EFE3]/10 text-sm font-medium text-[#F6EFE3]/75 hover:text-[#D9A441] w-full text-left"
            >
              <Lock className="h-4 w-4" />
              Staff &amp; Admin Portal
            </button>
          </div>
        )}
      </header>

      {/* 1. Cinematic Hero Section */}
      <section id="top" className="mx-auto max-w-6xl px-6 pt-12 pb-16 lg:pt-16 lg:pb-20">
        <div className="grid items-stretch gap-10 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-center lg:col-span-5"
          >
            <p className="text-xs font-medium tracking-wider uppercase text-[#D9A441]">
              Kalpetta, Wayanad · {siteSettings.openingHours}
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.12] tracking-tight text-[#F6EFE3] sm:text-5xl text-balance">
              Two Food Cultures. One Unforgettable Table.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-[#F6EFE3]/75 max-w-prose">
              Authentic Kerala comfort classics — slow-roasted beef fry, flaky tawa parotta,
              and copper-pot Malabar dum biryani — served beside smoky Arabian Mandi in the heart
              of Kalpetta.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#reserve"
                className="inline-flex items-center gap-2 rounded-lg bg-[#D9A441] px-6 py-3 text-sm font-semibold text-[#14110F] transition-colors hover:bg-[#e5b556] whitespace-nowrap shrink-0"
              >
                Book a Table
              </a>
              <a
                href="#menu"
                className="inline-flex items-center gap-2 rounded-lg border border-[#F6EFE3]/20 px-6 py-3 text-sm font-medium text-[#F6EFE3] transition-colors hover:border-[#D9A441]/60 hover:text-[#D9A441] whitespace-nowrap shrink-0"
              >
                Explore Menu
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-[#F6EFE3]/60 border-t border-[#F6EFE3]/10 pt-5">
              <span className="tabular-nums font-semibold text-[#F6EFE3]">4.0 / 5.0 Google Rating</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">3,303+ Guest Reviews</span>
              <span aria-hidden="true">·</span>
              <span>Near Old Bus Stand</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7"
          >
            <div className="relative h-full min-h-[280px] overflow-hidden rounded-2xl border border-[#F6EFE3]/10 bg-[#1C1714]">
              {!failedImages['hero'] ? (
                <img
                  src={HERO_IMAGE}
                  alt="Newform Restaurant spread of Malabar Dum Biryani, flaky parotta with beef fry, and Arabian Chicken Mandi"
                  referrerPolicy="no-referrer"
                  onError={() => handleImageError('hero')}
                  className="h-full w-full object-cover aspect-[16/9] lg:aspect-auto"
                />
              ) : (
                <div className="flex h-full min-h-[320px] flex-col items-center justify-center bg-gradient-to-br from-[#231B16] to-[#14110F] p-8 text-center">
                  <Utensils className="h-10 w-10 text-[#D9A441]" />
                  <p className="mt-3 font-display text-xl text-[#F6EFE3]">Newform Restaurant Feast</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Two Kitchens Experience */}
      <section id="kitchens" className="border-t border-[#F6EFE3]/10 bg-[#191512] py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-wider text-[#D9A441]">
              Two Kitchens Under One Roof
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[#F6EFE3] sm:text-4xl text-balance">
              Malabar Spice Meets Arabian Ember
            </h2>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <motion.article
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col justify-between rounded-2xl border border-[#F6EFE3]/10 bg-[#14110F] p-8"
            >
              <div>
                <span className="text-xs font-medium text-[#D9A441]">01 · The Kerala Kitchen</span>
                <h3 className="mt-3 font-display text-2xl font-semibold text-[#F6EFE3]">
                  Tawa Parotta, Beef Fry &amp; Dum Biryani
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#F6EFE3]/75">
                  Prepared fresh from morning until night using Wayanad black pepper, roasted
                  coconut slivers, hand-pounded garam masala, and aromatic jeerakasala rice sealed
                  on gentle dum.
                </p>
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => scrollToMenu('kerala')}
                  className="text-sm font-semibold text-[#D9A441] hover:underline"
                >
                  View Kerala Dishes →
                </button>
              </div>
            </motion.article>

            <motion.article
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col justify-between rounded-2xl border border-[#F6EFE3]/10 bg-[#14110F] p-8"
            >
              <div>
                <span className="text-xs font-medium text-[#D9A441]">02 · The Arabian Kitchen</span>
                <h3 className="mt-3 font-display text-2xl font-semibold text-[#F6EFE3]">
                  Wood-Smoked Mandi &amp; Charcoal Al-Faham
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#F6EFE3]/75">
                  Tender spiced cuts slow-steamed over saffron and cardamom basmati rice, paired
                  with smoky charcoal-grilled Al-Faham chicken, house garlic toum, and fresh
                  tomato salsa.
                </p>
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => scrollToMenu('arabian')}
                  className="text-sm font-semibold text-[#D9A441] hover:underline"
                >
                  View Arabian Dishes →
                </button>
              </div>
            </motion.article>
          </div>
        </div>
      </section>

      {/* 3. Signature Dish Spotlight */}
      <SignatureSpotlight
        dishes={dishes}
        failedImages={failedImages}
        onImageError={handleImageError}
        onExploreMenu={() => scrollToMenu()}
      />

      {/* 4. Interactive Menu with Dietary & Category Filtering */}
      <section id="menu" className="border-t border-[#F6EFE3]/10 bg-[#191512] py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#D9A441]">
                Daily Kitchen Catalogue
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[#F6EFE3] sm:text-4xl">
                Our Menu
              </h2>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F6EFE3]/45" />
              <input
                type="search"
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                placeholder="Search biryani, mandi, parotta..."
                aria-label="Search menu dishes"
                className="w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] py-2 pl-10 pr-4 text-sm text-[#F6EFE3] placeholder:text-[#F6EFE3]/40 focus:border-[#D9A441] focus:outline-none"
              />
            </div>
          </div>

          {/* Filter Controls */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#F6EFE3]/10 bg-[#14110F] p-1">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === tab.id
                      ? 'bg-[#D9A441] text-[#14110F] font-semibold'
                      : 'text-[#F6EFE3]/70 hover:text-[#F6EFE3]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {DIETARY_FILTERS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedDietary(tag)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    selectedDietary === tag
                      ? 'border-[#D9A441] bg-[#D9A441]/15 text-[#D9A441]'
                      : 'border-[#F6EFE3]/10 bg-[#14110F] text-[#F6EFE3]/65 hover:text-[#F6EFE3]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Dish Grid */}
          {visibleDishes.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-[#F6EFE3]/10 bg-[#14110F] p-10 text-center">
              <p className="text-sm text-[#F6EFE3]/70">
                No dishes match your current filter selection.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedDietary('All');
                  setMenuSearch('');
                }}
                className="mt-4 rounded-lg border border-[#D9A441]/40 px-4 py-2 text-xs font-semibold text-[#D9A441] hover:bg-[#D9A441]/10"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleDishes.map((dish) => (
                <article
                  key={dish.id}
                  className="group overflow-hidden rounded-2xl border border-[#F6EFE3]/10 bg-[#14110F] transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#1C1714]">
                    {!failedImages[dish.id] ? (
                      <img
                        src={dish.image}
                        alt={dish.name}
                        referrerPolicy="no-referrer"
                        onError={() => handleImageError(dish.id)}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#231B16] text-[#D9A441]">
                        <Utensils className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#F6EFE3]/55">
                      <span className="capitalize">
                        {dish.category}
                        {dish.dietaryTags.length > 0
                          ? ` · ${dish.dietaryTags.join(' · ')}`
                          : ''}
                      </span>
                      {dish.isSignature && (
                        <span className="font-medium text-[#D9A441]">House Signature</span>
                      )}
                    </div>

                    <div className="mt-2 flex items-baseline justify-between gap-3">
                      <h3 className="font-display text-lg font-semibold text-[#F6EFE3]">
                        {dish.name}
                      </h3>
                      <span className="tabular-nums text-base font-semibold text-[#D9A441] shrink-0">
                        {dish.price}
                      </span>
                    </div>

                    {dish.malayalamName && (
                      <p className="mt-0.5 text-xs text-[#F6EFE3]/50">{dish.malayalamName}</p>
                    )}

                    <p className="mt-2.5 text-sm leading-relaxed text-[#F6EFE3]/70">
                      {dish.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Editorial Photography Gallery + Public Image Sharing */}
      <GallerySection
        photos={galleryPhotos}
        failedImages={failedImages}
        onImageError={handleImageError}
        onAddPublicPhoto={handleAddPublicPhoto}
      />

      {/* 6. Verified Guest Reviews */}
      <ReviewsSection />

      {/* 7. Table Reservations & Directions / Inquiries */}
      <section id="reserve" className="border-t border-[#F6EFE3]/10 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-6 grid gap-10 lg:grid-cols-12">
          {/* Table Reservation Form */}
          <div className="lg:col-span-7 rounded-2xl border border-[#F6EFE3]/10 bg-[#1C1714] p-8">
            <div className="flex items-center gap-2.5 text-[#D9A441]">
              <CalendarDays className="h-5 w-5" />
              <span className="text-xs font-medium uppercase tracking-wider">
                Table Reservations
              </span>
            </div>
            <h2 className="mt-2 font-display text-3xl font-semibold text-[#F6EFE3]">
              Reserve Your Table
            </h2>
            <p className="mt-2 text-sm text-[#F6EFE3]/70">
              Planning a family dinner or group Mandi feast? Send your preferred seating time
              and our Kalpetta host desk will confirm promptly.
            </p>

            <form onSubmit={handleReservationSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#F6EFE3]/80">
                    Guest Name
                  </label>
                  <input
                    type="text"
                    required
                    value={resName}
                    onChange={(e) => setResName(e.target.value)}
                    placeholder="Full name"
                    className="mt-1.5 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2.5 text-sm text-[#F6EFE3] placeholder:text-[#F6EFE3]/35 focus:border-[#D9A441] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#F6EFE3]/80">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={resPhone}
                    onChange={(e) => setResPhone(e.target.value)}
                    placeholder="+91 98470 00000"
                    className="mt-1.5 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2.5 text-sm text-[#F6EFE3] placeholder:text-[#F6EFE3]/35 focus:border-[#D9A441] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-[#F6EFE3]/80">Date</label>
                  <input
                    type="date"
                    required
                    value={resDate}
                    onChange={(e) => setResDate(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2.5 text-sm text-[#F6EFE3] focus:border-[#D9A441] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#F6EFE3]/80">Time</label>
                  <input
                    type="time"
                    required
                    value={resTime}
                    onChange={(e) => setResTime(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2.5 text-sm text-[#F6EFE3] focus:border-[#D9A441] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#F6EFE3]/80">Guests</label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    required
                    value={resGuests}
                    onChange={(e) => setResGuests(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2.5 text-sm tabular-nums text-[#F6EFE3] focus:border-[#D9A441] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#F6EFE3]/80">
                    Preferred Seating
                  </label>
                  <select
                    value={resSeating}
                    onChange={(e) =>
                      setResSeating(e.target.value as ReservationItem['seatingArea'])
                    }
                    className="mt-1.5 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2.5 text-sm text-[#F6EFE3] focus:border-[#D9A441] focus:outline-none"
                  >
                    <option value="family-lounge">Family Lounge</option>
                    <option value="indoor-ac">Indoor AC Hall</option>
                    <option value="arabian-majlis">Arabian Majlis</option>
                    <option value="open-terrace">Open Terrace</option>
                    <option value="no-preference">No Preference</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#F6EFE3]/80">
                    Special Requests (Optional)
                  </label>
                  <input
                    type="text"
                    value={resNotes}
                    onChange={(e) => setResNotes(e.target.value)}
                    placeholder="High chair, birthday, dietary note..."
                    className="mt-1.5 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2.5 text-sm text-[#F6EFE3] placeholder:text-[#F6EFE3]/35 focus:border-[#D9A441] focus:outline-none"
                  />
                </div>
              </div>

              {resError && (
                <p role="alert" className="text-sm text-red-300">
                  {resError}
                </p>
              )}

              {resConfirmed && (
                <div
                  role="status"
                  className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-200"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{resConfirmed}</span>
                </div>
              )}

              <button
                type="submit"
                className="rounded-lg bg-[#D9A441] px-6 py-3 text-sm font-semibold text-[#14110F] transition-colors hover:bg-[#e5b556] whitespace-nowrap"
              >
                Request Table Reservation
              </button>
            </form>
          </div>

          {/* Visit Us / Directions & Catering Inquiry */}
          <div id="visit" className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-[#F6EFE3]/10 bg-[#1C1714] p-7 space-y-4">
              <div className="flex items-center gap-2 text-[#D9A441]">
                <MapPin className="h-5 w-5" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  Visit Newform Restaurant
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[#F6EFE3]/85">
                {siteSettings.address}
              </p>
              <div className="flex items-center gap-2 text-xs text-[#F6EFE3]/65">
                <Clock className="h-4 w-4 text-[#D9A441]" />
                <span>{siteSettings.openingHours}</span>
              </div>

              <div className="overflow-hidden rounded-xl border border-[#F6EFE3]/10 bg-[#14110F]">
                <iframe
                  title="Newform Restaurant Kalpetta Location Map"
                  src="https://maps.google.com/maps?q=11.6137653,76.0828979&z=16&output=embed"
                  loading="lazy"
                  className="h-44 w-full border-0 grayscale contrast-125 opacity-90"
                />
              </div>

              <div className="pt-1 space-y-2.5">
                <label className="block text-xs font-medium text-[#F6EFE3]/75">
                  Directions from your starting location
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={startingPoint}
                    onChange={(e) => setStartingPoint(e.target.value)}
                    placeholder="e.g., Vythiri, Sulthan Bathery..."
                    className="flex-1 rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3 py-2 text-sm text-[#F6EFE3] placeholder:text-[#F6EFE3]/35 focus:border-[#D9A441] focus:outline-none"
                  />
                  <a
                    href={directionsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#D9A441] px-3.5 py-2 text-xs font-semibold text-[#14110F] hover:bg-[#e5b556] whitespace-nowrap shrink-0"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Directions
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <a
                  href={phoneHref}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-4 py-2 text-xs font-medium text-[#F6EFE3] hover:border-[#D9A441]/50 whitespace-nowrap"
                >
                  <Phone className="h-3.5 w-3.5 text-[#D9A441]" />
                  {siteSettings.phone}
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20 whitespace-nowrap"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
              </div>
            </div>

            {/* Catering / Guest Inquiry Form */}
            <form
              onSubmit={handleInquirySubmit}
              className="rounded-2xl border border-[#F6EFE3]/10 bg-[#1C1714] p-7 space-y-3.5"
            >
              <h3 className="font-display text-xl font-semibold text-[#F6EFE3]">
                Catering &amp; Group Inquiries
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  required
                  value={inqName}
                  onChange={(e) => setInqName(e.target.value)}
                  placeholder="Your name"
                  className="rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3 py-2 text-sm text-[#F6EFE3] placeholder:text-[#F6EFE3]/35 focus:border-[#D9A441] focus:outline-none"
                />
                <input
                  type="text"
                  required
                  value={inqContact}
                  onChange={(e) => setInqContact(e.target.value)}
                  placeholder="Phone or email"
                  className="rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3 py-2 text-sm text-[#F6EFE3] placeholder:text-[#F6EFE3]/35 focus:border-[#D9A441] focus:outline-none"
                />
              </div>
              <select
                value={inqType}
                onChange={(e) => setInqType(e.target.value as InquiryItem['type'])}
                className="w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3 py-2 text-sm text-[#F6EFE3] focus:border-[#D9A441] focus:outline-none"
              >
                <option value="catering">Catering Request</option>
                <option value="event">Family / Group Event</option>
                <option value="general">General Question</option>
                <option value="feedback">Dining Feedback</option>
              </select>
              <textarea
                rows={2}
                required
                value={inqMessage}
                onChange={(e) => setInqMessage(e.target.value)}
                placeholder="Tell us about your event, guest count, or question..."
                className="w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3 py-2 text-sm text-[#F6EFE3] placeholder:text-[#F6EFE3]/35 focus:border-[#D9A441] focus:outline-none"
              />
              {inqConfirmed && (
                <p className="text-xs text-emerald-300">
                  Inquiry sent to our Kalpetta management desk.
                </p>
              )}
              <button
                type="submit"
                className="rounded-lg border border-[#D9A441]/50 bg-[#D9A441]/10 px-4 py-2 text-xs font-semibold text-[#D9A441] hover:bg-[#D9A441]/20 whitespace-nowrap"
              >
                Send Inquiry
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-[#F6EFE3]/10 bg-[#100D0B] py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-xs text-[#F6EFE3]/60">
          <div>
            <span className="font-display text-base font-semibold text-[#F6EFE3]">
              Newform Restaurant
            </span>
            <span className="ml-2">· Kalpetta, Wayanad, Kerala</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <a href="#menu" className="hover:text-[#F6EFE3] transition-colors">
              Menu
            </a>
            <a href="#gallery" className="hover:text-[#F6EFE3] transition-colors">
              Gallery
            </a>
            <a href="#reserve" className="hover:text-[#F6EFE3] transition-colors">
              Reservations
            </a>
            <a href="#visit" className="hover:text-[#F6EFE3] transition-colors">
              Location
            </a>
            <button
              type="button"
              onClick={openAdminPortal}
              className="inline-flex items-center gap-1.5 text-[#F6EFE3]/60 hover:text-[#D9A441] transition-colors"
            >
              <Lock className="h-3.5 w-3.5" />
              Staff &amp; Admin Portal
            </button>
          </div>
        </div>
      </footer>

      {/* Compact Mobile Floating Action Bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex sm:hidden border-t border-[#F6EFE3]/15 bg-[#14110F]/95 px-4 py-2.5 gap-3 backdrop-blur-md">
        <a
          href={phoneHref}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-[#F6EFE3]/15 bg-[#1C1714] py-2 text-xs font-semibold text-[#F6EFE3]"
        >
          <Phone className="h-3.5 w-3.5 text-[#D9A441]" />
          Call Now
        </a>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#D9A441] py-2 text-xs font-semibold text-[#14110F]"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <RestaurantApp />
    </AppErrorBoundary>
  );
}
