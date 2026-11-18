import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  Globe,
  Image as ImageIcon,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Trash2,
  Upload,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import {
  compressImageFile,
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
  ReservationItem,
  SiteSettingsData,
} from '../../siteData';

export interface AdminPortalProps {
  onAuthenticated?: (email: string) => void;
  onBack?: () => void;
  dishes?: DishItem[];
  onUpdateDishes?: React.Dispatch<React.SetStateAction<DishItem[]>>;
  galleryPhotos?: GalleryPhotoItem[];
  onUpdateGalleryPhotos?: React.Dispatch<React.SetStateAction<GalleryPhotoItem[]>>;
  reservations?: ReservationItem[];
  onUpdateReservations?: React.Dispatch<React.SetStateAction<ReservationItem[]>>;
  inquiries?: InquiryItem[];
  siteSettings?: SiteSettingsData;
  onUpdateSiteSettings?: (settings: SiteSettingsData) => void;
}

type AdminTab = 'menu' | 'gallery' | 'bookings' | 'inquiries' | 'settings';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADMIN_PASSCODE = '2244';
const SESSION_KEY = 'newform_admin_email_session';

const ALL_DIETARY_TAGS: DietaryTag[] = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Spicy'];

interface DishFormState {
  id?: string;
  name: string;
  malayalamName: string;
  category: DishCategory;
  price: string;
  description: string;
  image: string;
  dietaryTags: DietaryTag[];
  isSignature: boolean;
  available: boolean;
}

const EMPTY_DISH_FORM: DishFormState = {
  name: '',
  malayalamName: '',
  category: 'kerala',
  price: '₹220',
  description: '',
  image: HERO_IMAGE,
  dietaryTags: [],
  isSignature: false,
  available: true,
};

export function AdminPortal({
  onAuthenticated,
  onBack,
  dishes: propDishes,
  onUpdateDishes,
  galleryPhotos: propGalleryPhotos,
  onUpdateGalleryPhotos,
  reservations: propReservations,
  onUpdateReservations,
  inquiries: propInquiries,
  siteSettings: propSiteSettings,
  onUpdateSiteSettings,
}: AdminPortalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticatedEmail, setAuthenticatedEmail] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return window.sessionStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<AdminTab>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | DishCategory>('all');
  const [confirmRestoreMenu, setConfirmRestoreMenu] = useState(false);

  // Standalone fallback states when AdminPortal is mounted without props
  const [localDishes, setLocalDishes] = useState<DishItem[]>(INITIAL_DISHES);
  const [localGallery, setLocalGallery] = useState<GalleryPhotoItem[]>(INITIAL_GALLERY);
  const [localReservations, setLocalReservations] = useState<ReservationItem[]>(INITIAL_RESERVATIONS);
  const [localSettings, setLocalSettings] = useState<SiteSettingsData>(DEFAULT_SITE_SETTINGS);

  const dishes = propDishes ?? localDishes;
  const setDishes = onUpdateDishes ?? setLocalDishes;
  const galleryPhotos = propGalleryPhotos ?? localGallery;
  const setGalleryPhotos = onUpdateGalleryPhotos ?? setLocalGallery;
  const reservations = propReservations ?? localReservations;
  const setReservations = onUpdateReservations ?? setLocalReservations;
  const inquiries = propInquiries ?? INITIAL_INQUIRIES;
  const currentSettings = propSiteSettings ?? localSettings;

  // Dish Create / Edit Modal state
  const [dishModalOpen, setDishModalOpen] = useState(false);
  const [dishForm, setDishForm] = useState<DishFormState>(EMPTY_DISH_FORM);
  const [dishUploadStatus, setDishUploadStatus] = useState<string | null>(null);
  const [dishUploadError, setDishUploadError] = useState<string | null>(null);
  const dishFileInputRef = useRef<HTMLInputElement | null>(null);

  // Gallery upload modal/form state
  const [galTitle, setGalTitle] = useState('');
  const [galCaption, setGalCaption] = useState('');
  const [galCategory, setGalCategory] = useState('Kerala Kitchen');
  const [galImage, setGalImage] = useState('');
  const [galUploadStatus, setGalUploadStatus] = useState<string | null>(null);
  const [galUploadError, setGalUploadError] = useState<string | null>(null);
  const galleryFileInputRef = useRef<HTMLInputElement | null>(null);

  // Settings draft state
  const [settingsDraft, setSettingsDraft] = useState<SiteSettingsData>(currentSettings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password !== ADMIN_PASSCODE) {
      setError('Incorrect password. Please enter the valid admin access code.');
      return;
    }

    try {
      window.sessionStorage.setItem(SESSION_KEY, trimmedEmail);
    } catch {
      // Ignore restricted sessionStorage
    }
    setAuthenticatedEmail(trimmedEmail);
    setSettingsDraft(currentSettings);
    onAuthenticated?.(trimmedEmail);
  };

  const handleSignOut = () => {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore restricted sessionStorage
    }
    setAuthenticatedEmail(null);
    setPassword('');
    setError(null);
  };

  const openAddDishModal = () => {
    setDishForm(EMPTY_DISH_FORM);
    setDishUploadStatus(null);
    setDishUploadError(null);
    setDishModalOpen(true);
  };

  const openEditDishModal = (dish: DishItem) => {
    setDishForm({
      id: dish.id,
      name: dish.name,
      malayalamName: dish.malayalamName ?? '',
      category: dish.category,
      price: dish.price,
      description: dish.description,
      image: dish.image,
      dietaryTags: dish.dietaryTags,
      isSignature: Boolean(dish.isSignature),
      available: dish.available,
    });
    setDishUploadStatus(null);
    setDishUploadError(null);
    setDishModalOpen(true);
  };

  const handleDishImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setDishUploadError(null);
    setDishUploadStatus('Compressing photo...');

    try {
      const { dataUrl, sizeKB } = await compressImageFile(file, 1100);
      setDishForm((prev) => ({ ...prev, image: dataUrl }));
      setDishUploadStatus(`Photo ready (${sizeKB} KB · optimized for web)`);
    } catch (err) {
      setDishUploadStatus(null);
      setDishUploadError(err instanceof Error ? err.message : 'Image upload failed.');
    }
  };

  const handleToggleDietaryTag = (tag: DietaryTag) => {
    setDishForm((prev) => ({
      ...prev,
      dietaryTags: prev.dietaryTags.includes(tag)
        ? prev.dietaryTags.filter((t) => t !== tag)
        : [...prev.dietaryTags, tag],
    }));
  };

  const handleSaveDishModal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dishForm.name.trim() || !dishForm.description.trim()) return;

    if (dishForm.id) {
      setDishes((prev) =>
        prev.map((d) =>
          d.id === dishForm.id
            ? {
                ...d,
                name: dishForm.name.trim(),
                malayalamName: dishForm.malayalamName.trim() || undefined,
                category: dishForm.category,
                price: dishForm.price.trim() || '₹180',
                description: dishForm.description.trim(),
                image: dishForm.image.trim() || HERO_IMAGE,
                dietaryTags: dishForm.dietaryTags,
                isSignature: dishForm.isSignature,
                available: dishForm.available,
              }
            : d
        )
      );
    } else {
      const newDish: DishItem = {
        id: `dish-${Date.now()}`,
        name: dishForm.name.trim(),
        malayalamName: dishForm.malayalamName.trim() || undefined,
        category: dishForm.category,
        price: dishForm.price.trim() || '₹180',
        description: dishForm.description.trim(),
        image: dishForm.image.trim() || HERO_IMAGE,
        dietaryTags: dishForm.dietaryTags,
        isSignature: dishForm.isSignature,
        available: dishForm.available,
      };
      setDishes((prev) => [newDish, ...prev]);
    }

    setDishModalOpen(false);
  };

  const handleDeleteDish = (id: string) => {
    setDishes((prev) => prev.filter((d) => d.id !== id));
    setDishModalOpen(false);
  };

  const handleToggleAvailability = (id: string) => {
    setDishes((prev) =>
      prev.map((dish) =>
        dish.id === id ? { ...dish, available: !dish.available } : dish
      )
    );
  };

  const handleImportDefaultMenu = () => {
    setDishes(INITIAL_DISHES);
    setConfirmRestoreMenu(false);
  };

  const handleGalleryFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setGalUploadError(null);
    setGalUploadStatus('Compressing image...');

    try {
      const { dataUrl, sizeKB } = await compressImageFile(file, 1280);
      setGalImage(dataUrl);
      setGalUploadStatus(`Image ready (${sizeKB} KB)`);
    } catch (err) {
      setGalUploadStatus(null);
      setGalUploadError(err instanceof Error ? err.message : 'Image upload failed.');
    }
  };

  const handleAddGalleryPhoto = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!galTitle.trim() || !galImage.trim()) {
      setGalUploadError('Please provide a photo title and upload an image (or enter an image URL).');
      return;
    }

    const newPhoto: GalleryPhotoItem = {
      id: `gal-${Date.now()}`,
      title: galTitle.trim(),
      caption: galCaption.trim() || 'Captured fresh from Newform Restaurant kitchen.',
      category: galCategory,
      image: galImage.trim(),
      visible: true,
      createdAt: new Date().toISOString(),
    };

    setGalleryPhotos((prev) => [newPhoto, ...prev]);
    setGalTitle('');
    setGalCaption('');
    setGalImage('');
    setGalUploadStatus(null);
    setGalUploadError(null);
    if (galleryFileInputRef.current) {
      galleryFileInputRef.current.value = '';
    }
  };

  const handleToggleGalleryVisibility = (id: string) => {
    setGalleryPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p))
    );
  };

  const handleDeleteGalleryPhoto = (id: string) => {
    setGalleryPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleConfirmReservation = (id: string) => {
    setReservations((prev) =>
      prev.map((res) =>
        res.id === id ? { ...res, status: 'confirmed' } : res
      )
    );
  };

  const handleSaveSettings = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onUpdateSiteSettings) {
      onUpdateSiteSettings(settingsDraft);
    } else {
      setLocalSettings(settingsDraft);
    }
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  if (!authenticatedEmail) {
    return (
      <div className="min-h-screen bg-[#14110F] text-[#F6EFE3] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-[#F6EFE3]/10 bg-[#1C1714] p-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D9A441]/30 bg-[#D9A441]/10 text-[#D9A441]">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight text-[#F6EFE3]">
                Staff &amp; Admin Login
              </h1>
              <p className="text-sm text-[#F6EFE3]/65">
                Sign in with your email and access code.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-sm font-medium text-[#F6EFE3]/85"
              >
                Email Address
              </label>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F6EFE3]/45" />
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="staff@newformrestaurant.com"
                  className="w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] py-2.5 pl-10 pr-3.5 text-sm text-[#F6EFE3] placeholder:text-[#F6EFE3]/35 transition-colors focus:border-[#D9A441] focus:outline-none focus:ring-1 focus:ring-[#D9A441]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium text-[#F6EFE3]/85"
              >
                Password
              </label>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F6EFE3]/45" />
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter admin password"
                  className="w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] py-2.5 pl-10 pr-11 text-sm text-[#F6EFE3] placeholder:text-[#F6EFE3]/35 transition-colors focus:border-[#D9A441] focus:outline-none focus:ring-1 focus:ring-[#D9A441]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#F6EFE3]/55 transition-colors hover:text-[#F6EFE3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9A441]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#D9A441] px-4 py-2.5 text-sm font-semibold text-[#14110F] transition-colors hover:bg-[#e5b556] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9A441] whitespace-nowrap"
            >
              Sign In to Admin Portal
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {onBack && (
            <div className="mt-6 border-t border-[#F6EFE3]/10 pt-5 text-center">
              <button
                type="button"
                onClick={onBack}
                className="text-sm font-medium text-[#F6EFE3]/65 transition-colors hover:text-[#D9A441]"
              >
                Return to Website
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const filteredDishes = dishes.filter((dish) => {
    if (categoryFilter !== 'all' && dish.category !== categoryFilter) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      dish.name.toLowerCase().includes(q) ||
      dish.category.toLowerCase().includes(q) ||
      dish.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#14110F] text-[#F6EFE3]">
      {/* Portal Top Bar */}
      <header className="border-b border-[#F6EFE3]/10 bg-[#1A1512]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="font-display text-xl font-semibold text-[#F6EFE3] whitespace-nowrap shrink-0">
              Newform Staff Portal
            </span>
            <span className="text-xs text-[#F6EFE3]/55 hidden sm:inline">
              · {authenticatedEmail}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-lg border border-[#F6EFE3]/15 bg-[#221C18] px-4 py-2 text-xs font-medium text-[#F6EFE3] transition-colors hover:border-[#D9A441]/50 hover:text-[#D9A441] whitespace-nowrap shrink-0"
              >
                <Globe className="h-3.5 w-3.5" />
                View Website
              </button>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D9A441] px-4 py-2 text-xs font-semibold text-[#14110F] transition-colors hover:bg-[#e5b556] whitespace-nowrap shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#F6EFE3]/10 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'menu'
                ? 'bg-[#D9A441] text-[#14110F] font-semibold'
                : 'bg-[#1C1714] text-[#F6EFE3]/75 hover:text-[#F6EFE3]'
            }`}
          >
            <UtensilsCrossed className="h-4 w-4" />
            Menu &amp; Prices
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'gallery'
                ? 'bg-[#D9A441] text-[#14110F] font-semibold'
                : 'bg-[#1C1714] text-[#F6EFE3]/75 hover:text-[#F6EFE3]'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            Gallery Photos ({galleryPhotos.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'bookings'
                ? 'bg-[#D9A441] text-[#14110F] font-semibold'
                : 'bg-[#1C1714] text-[#F6EFE3]/75 hover:text-[#F6EFE3]'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Table Bookings ({reservations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inquiries')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'inquiries'
                ? 'bg-[#D9A441] text-[#14110F] font-semibold'
                : 'bg-[#1C1714] text-[#F6EFE3]/75 hover:text-[#F6EFE3]'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Guest Inquiries ({inquiries.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'settings'
                ? 'bg-[#D9A441] text-[#14110F] font-semibold'
                : 'bg-[#1C1714] text-[#F6EFE3]/75 hover:text-[#F6EFE3]'
            }`}
          >
            <Settings className="h-4 w-4" />
            Site Settings
          </button>
        </div>

        {/* Tab 1: Menu & Prices */}
        {activeTab === 'menu' && (
          <section className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative w-full max-w-xs">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#F6EFE3]/45" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dishes..."
                    className="w-full rounded-lg border border-[#F6EFE3]/15 bg-[#1C1714] py-2 pl-10 pr-4 text-sm text-[#F6EFE3] placeholder:text-[#F6EFE3]/40 focus:border-[#D9A441] focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[#F6EFE3]/10 bg-[#1C1714] p-1">
                  {(['all', 'kerala', 'arabian', 'chinese', 'dessert'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                        categoryFilter === cat
                          ? 'bg-[#D9A441] text-[#14110F] font-semibold'
                          : 'text-[#F6EFE3]/70 hover:text-[#F6EFE3]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {!confirmRestoreMenu ? (
                  <button
                    type="button"
                    onClick={() => setConfirmRestoreMenu(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#F6EFE3]/15 bg-[#1C1714] px-3.5 py-2 text-xs font-medium text-[#F6EFE3]/80 hover:border-[#D9A441]/50 hover:text-[#D9A441] whitespace-nowrap"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Import Default Menu
                  </button>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs">
                    <span className="text-amber-200">Reset to default dishes?</span>
                    <button
                      type="button"
                      onClick={handleImportDefaultMenu}
                      className="rounded bg-[#D9A441] px-2.5 py-1 font-semibold text-[#14110F]"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmRestoreMenu(false)}
                      className="text-[#F6EFE3]/70 hover:text-[#F6EFE3]"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={openAddDishModal}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#D9A441] px-4 py-2 text-sm font-semibold text-[#14110F] transition-colors hover:bg-[#e5b556] whitespace-nowrap shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  Add New Dish
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#F6EFE3]/10 bg-[#1C1714]">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#F6EFE3]/10 text-xs uppercase tracking-wider text-[#F6EFE3]/55">
                  <tr>
                    <th className="px-5 py-3.5 font-medium">Dish</th>
                    <th className="px-5 py-3.5 font-medium">Category</th>
                    <th className="px-5 py-3.5 font-medium">Price</th>
                    <th className="px-5 py-3.5 font-medium">Website Visibility</th>
                    <th className="px-5 py-3.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F6EFE3]/10">
                  {filteredDishes.map((dish) => (
                    <tr key={dish.id} className="hover:bg-[#241E1A]/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={dish.image}
                            alt={dish.name}
                            referrerPolicy="no-referrer"
                            className="h-12 w-16 rounded-lg border border-[#F6EFE3]/10 object-cover shrink-0 bg-[#14110F]"
                          />
                          <div>
                            <div className="font-medium text-[#F6EFE3]">{dish.name}</div>
                            {dish.malayalamName && (
                              <div className="text-xs text-[#F6EFE3]/50">{dish.malayalamName}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 capitalize text-[#F6EFE3]/75">{dish.category}</td>
                      <td className="px-5 py-4 tabular-nums font-medium text-[#D9A441]">
                        {dish.price}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(dish.id)}
                          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                            dish.available
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-red-500/15 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {dish.available ? 'Visible' : 'Hidden'}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEditDishModal(dish)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-[#F6EFE3]/15 px-3 py-1.5 text-xs font-medium text-[#F6EFE3]/85 hover:border-[#D9A441]/50 hover:text-[#D9A441] transition-colors whitespace-nowrap"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Tab 2: Gallery Photos */}
        {activeTab === 'gallery' && (
          <section className="mt-6 grid gap-8 lg:grid-cols-12">
            <form
              onSubmit={handleAddGalleryPhoto}
              className="lg:col-span-5 rounded-xl border border-[#F6EFE3]/10 bg-[#1C1714] p-6 space-y-4 h-fit"
            >
              <h2 className="font-display text-xl font-semibold text-[#F6EFE3]">
                Upload Public Gallery Photo
              </h2>
              <p className="text-xs text-[#F6EFE3]/65">
                Photos uploaded here are compressed automatically and published live to the
                website gallery.
              </p>

              <div>
                <label className="block text-xs font-medium text-[#F6EFE3]/80">
                  Photo Title
                </label>
                <input
                  type="text"
                  required
                  value={galTitle}
                  onChange={(e) => setGalTitle(e.target.value)}
                  placeholder="e.g., Charcoal Al-Faham Platter"
                  className="mt-1.5 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2 text-sm text-[#F6EFE3] placeholder:text-[#F6EFE3]/35 focus:border-[#D9A441] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#F6EFE3]/80">
                  Category Label
                </label>
                <select
                  value={galCategory}
                  onChange={(e) => setGalCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2 text-sm text-[#F6EFE3] focus:border-[#D9A441] focus:outline-none"
                >
                  <option value="Kerala Kitchen">Kerala Kitchen</option>
                  <option value="Arabian Kitchen">Arabian Kitchen</option>
                  <option value="Dining Spread">Dining Spread</option>
                  <option value="Desserts">Desserts</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#F6EFE3]/80">
                  Caption
                </label>
                <input
                  type="text"
                  value={galCaption}
                  onChange={(e) => setGalCaption(e.target.value)}
                  placeholder="Short description shown on gallery card..."
                  className="mt-1.5 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2 text-sm text-[#F6EFE3] placeholder:text-[#F6EFE3]/35 focus:border-[#D9A441] focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#F6EFE3]/80">
                  Upload Photo File
                </label>
                <input
                  ref={galleryFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => galleryFileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#D9A441]/50 bg-[#D9A441]/10 px-4 py-2.5 text-xs font-semibold text-[#D9A441] hover:bg-[#D9A441]/15"
                >
                  <Upload className="h-4 w-4" />
                  Upload New Photo
                </button>

                {galUploadStatus && (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {galUploadStatus}
                  </p>
                )}
                {galUploadError && (
                  <p className="text-xs text-red-300">{galUploadError}</p>
                )}

                <input
                  type="url"
                  value={galImage.startsWith('data:') ? '' : galImage}
                  onChange={(e) => setGalImage(e.target.value)}
                  placeholder="Or paste an image URL..."
                  className="w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3 py-2 text-xs text-[#F6EFE3] placeholder:text-[#F6EFE3]/35 focus:border-[#D9A441] focus:outline-none"
                />

                {galImage && (
                  <img
                    src={galImage}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="h-36 w-full rounded-lg border border-[#F6EFE3]/15 object-cover"
                  />
                )}
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[#D9A441] px-4 py-2.5 text-sm font-semibold text-[#14110F] hover:bg-[#e5b556] whitespace-nowrap"
              >
                Publish to Public Gallery
              </button>
            </form>

            <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2 h-fit">
              {galleryPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-xl border border-[#F6EFE3]/10 bg-[#1C1714]"
                >
                  <img
                    src={photo.image}
                    alt={photo.title}
                    referrerPolicy="no-referrer"
                    className="aspect-[4/3] w-full object-cover bg-[#14110F]"
                  />
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs text-[#D9A441]">{photo.category}</span>
                        <h3 className="font-medium text-sm text-[#F6EFE3]">{photo.title}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteGalleryPhoto(photo.id)}
                        aria-label={`Delete ${photo.title}`}
                        className="rounded-md p-1.5 text-[#F6EFE3]/55 hover:bg-red-500/15 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[#F6EFE3]/65 line-clamp-2">{photo.caption}</p>
                    <button
                      type="button"
                      onClick={() => handleToggleGalleryVisibility(photo.id)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                        photo.visible
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/15 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {photo.visible ? 'Visible on Site' : 'Hidden'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tab 3: Table Bookings */}
        {activeTab === 'bookings' && (
          <section className="mt-6 space-y-4">
            {reservations.length === 0 ? (
              <div className="rounded-xl border border-[#F6EFE3]/10 bg-[#1C1714] p-8 text-center text-sm text-[#F6EFE3]/60">
                No table reservations yet.
              </div>
            ) : (
              reservations.map((res) => {
                const cleanPhone = res.guestPhone.replace(/\D/g, '');
                const waText = encodeURIComponent(
                  `Hello ${res.guestName}, your table reservation at Newform Restaurant Kalpetta for ${res.guests} guests on ${res.date} at ${res.time} is CONFIRMED. We look forward to welcoming you!`
                );

                return (
                  <div
                    key={res.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#F6EFE3]/10 bg-[#1C1714] p-5"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[#F6EFE3]">{res.guestName}</span>
                        <span className="text-xs text-[#F6EFE3]/55 tabular-nums">
                          · {res.guestPhone}
                        </span>
                        <span className="text-xs text-[#F6EFE3]/55">
                          · {res.guests} guests
                        </span>
                      </div>
                      <p className="text-xs text-[#F6EFE3]/65 tabular-nums">
                        {res.date} at {res.time} · Seating: {res.seatingArea.replace('-', ' ')}
                        {res.specialRequests ? ` · Note: ${res.specialRequests}` : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${
                          res.status === 'confirmed' ? 'text-emerald-300' : 'text-amber-300'
                        }`}
                      >
                        {res.status}
                      </span>

                      {res.status !== 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => handleConfirmReservation(res.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors whitespace-nowrap"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Confirm
                        </button>
                      )}

                      <a
                        href={`https://wa.me/${cleanPhone}?text=${waText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Send WhatsApp Confirmation"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20 whitespace-nowrap"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>

                      <a
                        href={`tel:${res.guestPhone.replace(/\s+/g, '')}`}
                        title="Call Guest"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3 py-1.5 text-xs font-medium text-[#F6EFE3]/85 hover:border-[#D9A441]/50 whitespace-nowrap"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}

        {/* Tab 4: Guest Inquiries */}
        {activeTab === 'inquiries' && (
          <section className="mt-6 space-y-4">
            {inquiries.length === 0 ? (
              <div className="rounded-xl border border-[#F6EFE3]/10 bg-[#1C1714] p-8 text-center text-sm text-[#F6EFE3]/60">
                No guest inquiries yet.
              </div>
            ) : (
              inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="rounded-xl border border-[#F6EFE3]/10 bg-[#1C1714] p-5 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-[#F6EFE3]">
                      {inq.name}{' '}
                      <span className="font-normal text-[#F6EFE3]/60">
                        · {inq.phoneOrEmail}
                      </span>
                    </div>
                    <span className="text-xs uppercase tracking-wider text-[#D9A441]">
                      {inq.type}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-[#F6EFE3]/80">{inq.message}</p>
                </div>
              ))
            )}
          </section>
        )}

        {/* Tab 5: Site Settings */}
        {activeTab === 'settings' && (
          <section className="mt-6">
            <form
              onSubmit={handleSaveSettings}
              className="max-w-2xl rounded-xl border border-[#F6EFE3]/10 bg-[#1C1714] p-6 space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-[#F6EFE3]/85">
                  Top Website Notice Banner
                </label>
                <input
                  type="text"
                  value={settingsDraft.noticeBanner}
                  onChange={(e) =>
                    setSettingsDraft((prev) => ({ ...prev, noticeBanner: e.target.value }))
                  }
                  placeholder="Leave empty to hide banner, or enter special announcement..."
                  className="mt-2 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2.5 text-sm text-[#F6EFE3] placeholder:text-[#F6EFE3]/35 focus:border-[#D9A441] focus:outline-none"
                />
                {settingsDraft.noticeBanner.trim() && (
                  <div className="mt-3">
                    <p className="text-xs text-[#F6EFE3]/55 mb-1">Live Banner Preview</p>
                    <div className="rounded-lg bg-[#D9A441] px-4 py-2 text-center text-xs font-semibold text-[#14110F]">
                      {settingsDraft.noticeBanner}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[#F6EFE3]/85">
                    Opening Hours
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.openingHours}
                    onChange={(e) =>
                      setSettingsDraft((prev) => ({ ...prev, openingHours: e.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2.5 text-sm text-[#F6EFE3] focus:border-[#D9A441] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#F6EFE3]/85">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.phone}
                    onChange={(e) =>
                      setSettingsDraft((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2.5 text-sm text-[#F6EFE3] focus:border-[#D9A441] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[#F6EFE3]/85">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={settingsDraft.whatsappNumber}
                    onChange={(e) =>
                      setSettingsDraft((prev) => ({ ...prev, whatsappNumber: e.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2.5 text-sm text-[#F6EFE3] focus:border-[#D9A441] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#F6EFE3]/85">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={settingsDraft.email}
                    onChange={(e) =>
                      setSettingsDraft((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2.5 text-sm text-[#F6EFE3] focus:border-[#D9A441] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F6EFE3]/85">
                  Restaurant Address
                </label>
                <input
                  type="text"
                  value={settingsDraft.address}
                  onChange={(e) =>
                    setSettingsDraft((prev) => ({ ...prev, address: e.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2.5 text-sm text-[#F6EFE3] focus:border-[#D9A441] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  className="rounded-lg bg-[#D9A441] px-5 py-2.5 text-sm font-semibold text-[#14110F] hover:bg-[#e5b556] transition-colors whitespace-nowrap"
                >
                  Save Settings
                </button>
                {settingsSaved && (
                  <span className="text-sm text-emerald-300">Settings saved live.</span>
                )}
              </div>
            </form>
          </section>
        )}
      </main>

      {/* Add / Edit Dish Modal */}
      {dishModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={dishForm.id ? 'Edit Dish' : 'Add New Dish'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setDishModalOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#F6EFE3]/15 bg-[#1C1714] p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#F6EFE3]/10 pb-4">
              <h2 className="font-display text-2xl font-semibold text-[#F6EFE3]">
                {dishForm.id ? 'Edit Dish' : 'Add New Dish'}
              </h2>
              <button
                type="button"
                onClick={() => setDishModalOpen(false)}
                aria-label="Close modal"
                className="rounded-lg border border-[#F6EFE3]/15 p-2 text-[#F6EFE3]/70 hover:text-[#F6EFE3]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDishModal} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#F6EFE3]/80">
                    Dish Name (English)
                  </label>
                  <input
                    type="text"
                    required
                    value={dishForm.name}
                    onChange={(e) => setDishForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Mutton Biryani with Raita"
                    className="mt-1.5 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2 text-sm text-[#F6EFE3] focus:border-[#D9A441] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#F6EFE3]/80">
                    Malayalam Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={dishForm.malayalamName}
                    onChange={(e) =>
                      setDishForm((prev) => ({ ...prev, malayalamName: e.target.value }))
                    }
                    placeholder="e.g., മട്ടൺ ബിരിയാണി"
                    className="mt-1.5 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2 text-sm text-[#F6EFE3] focus:border-[#D9A441] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#F6EFE3]/80">
                    Cuisine Category
                  </label>
                  <select
                    value={dishForm.category}
                    onChange={(e) =>
                      setDishForm((prev) => ({
                        ...prev,
                        category: e.target.value as DishCategory,
                      }))
                    }
                    className="mt-1.5 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2 text-sm text-[#F6EFE3] focus:border-[#D9A441] focus:outline-none"
                  >
                    <option value="kerala">Kerala Kitchen</option>
                    <option value="arabian">Arabian Kitchen</option>
                    <option value="chinese">Chinese Flavours</option>
                    <option value="dessert">Desserts &amp; Sweets</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#F6EFE3]/80">
                    Display Price
                  </label>
                  <input
                    type="text"
                    required
                    value={dishForm.price}
                    onChange={(e) => setDishForm((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="e.g., ₹280"
                    className="mt-1.5 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2 text-sm tabular-nums text-[#F6EFE3] focus:border-[#D9A441] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#F6EFE3]/80">
                  Dish Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={dishForm.description}
                  onChange={(e) =>
                    setDishForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Describe spices, ingredients, and preparation..."
                  className="mt-1.5 w-full rounded-lg border border-[#F6EFE3]/15 bg-[#14110F] px-3.5 py-2 text-sm text-[#F6EFE3] focus:border-[#D9A441] focus:outline-none"
                />
              </div>

              {/* Photo Upload + Preview */}
              <div className="rounded-xl border border-[#F6EFE3]/10 bg-[#14110F] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-medium text-[#F6EFE3]/85">Dish Photography</span>
                  <input
                    ref={dishFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleDishImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => dishFileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#D9A441]/50 bg-[#D9A441]/10 px-3.5 py-1.5 text-xs font-semibold text-[#D9A441] hover:bg-[#D9A441]/20"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload New Photo
                  </button>
                </div>

                {dishUploadStatus && (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {dishUploadStatus}
                  </p>
                )}
                {dishUploadError && (
                  <p className="text-xs text-red-300">{dishUploadError}</p>
                )}

                <div className="grid gap-3 sm:grid-cols-3 items-center">
                  <img
                    src={dishForm.image || HERO_IMAGE}
                    alt="Dish preview"
                    referrerPolicy="no-referrer"
                    className="h-24 w-full rounded-lg border border-[#F6EFE3]/10 object-cover bg-[#1C1714]"
                  />
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-[#F6EFE3]/55 mb-1">
                      Or Image URL / Path
                    </label>
                    <input
                      type="text"
                      value={dishForm.image.startsWith('data:') ? '' : dishForm.image}
                      onChange={(e) =>
                        setDishForm((prev) => ({ ...prev, image: e.target.value }))
                      }
                      placeholder={
                        dishForm.image.startsWith('data:')
                          ? 'Uploaded custom photo active'
                          : '/src/assets/images/...'
                      }
                      className="w-full rounded-lg border border-[#F6EFE3]/15 bg-[#1C1714] px-3 py-2 text-xs text-[#F6EFE3] placeholder:text-[#F6EFE3]/40 focus:border-[#D9A441] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Dietary Tags & Signature Spotlight */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                  {ALL_DIETARY_TAGS.map((tag) => (
                    <label
                      key={tag}
                      className="inline-flex items-center gap-1.5 text-xs text-[#F6EFE3]/80 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={dishForm.dietaryTags.includes(tag)}
                        onChange={() => handleToggleDietaryTag(tag)}
                        className="accent-[#D9A441]"
                      />
                      {tag}
                    </label>
                  ))}
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#D9A441] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dishForm.isSignature}
                    onChange={(e) =>
                      setDishForm((prev) => ({ ...prev, isSignature: e.target.checked }))
                    }
                    className="accent-[#D9A441]"
                  />
                  Signature Dish Spotlight
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F6EFE3]/10 pt-5">
                {dishForm.id ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteDish(dishForm.id!)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Dish
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDishModalOpen(false)}
                    className="rounded-lg border border-[#F6EFE3]/15 px-4 py-2 text-xs font-medium text-[#F6EFE3]/80 hover:text-[#F6EFE3]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#D9A441] px-5 py-2 text-xs font-semibold text-[#14110F] hover:bg-[#e5b556]"
                  >
                    {dishForm.id ? 'Update Dish' : 'Create Dish'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPortal;
