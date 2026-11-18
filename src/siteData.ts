export type DishCategory = 'kerala' | 'arabian' | 'chinese' | 'dessert';
export type DietaryTag = 'Vegetarian' | 'Vegan' | 'Gluten-Free' | 'Spicy';

export interface DishItem {
  id: string;
  name: string;
  malayalamName?: string;
  category: DishCategory;
  description: string;
  price: string;
  image: string;
  dietaryTags: DietaryTag[];
  isSignature?: boolean;
  available: boolean;
}

export interface GalleryPhotoItem {
  id: string;
  title: string;
  caption: string;
  category: string;
  image: string;
  visible: boolean;
  createdAt: string;
}

export interface ReservationItem {
  id: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  date: string;
  time: string;
  guests: number;
  seatingArea: 'indoor-ac' | 'family-lounge' | 'open-terrace' | 'arabian-majlis' | 'no-preference';
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface InquiryItem {
  id: string;
  name: string;
  phoneOrEmail: string;
  message: string;
  type: 'general' | 'catering' | 'event' | 'feedback';
  createdAt: string;
}

export interface SiteSettingsData {
  openingHours: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  noticeBanner: string;
}

export const HERO_IMAGE = '/src/assets/images/hero_newform_feast_1795009393342.jpg';

export const STORAGE_KEYS = {
  dishes: 'newform_dishes_v1',
  gallery: 'newform_gallery_v1',
  reservations: 'newform_reservations_v1',
  inquiries: 'newform_inquiries_v1',
  settings: 'newform_settings_v1',
} as const;

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota or restricted context errors gracefully
  }
}

/**
 * Resizes and compresses an uploaded image file via HTML5 canvas
 * so it stays lightweight (< 1 MB) for fast rendering and local/storage persistence.
 */
export function compressImageFile(file: File, maxDimension = 1200): Promise<{
  dataUrl: string;
  sizeKB: number;
}> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file (JPG, PNG, or WebP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid or unsupported image format.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas rendering is unavailable in this browser.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.82;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > 650_000 && quality > 0.4) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        const approximateBytes = Math.round((dataUrl.length * 3) / 4);
        resolve({
          dataUrl,
          sizeKB: Math.max(1, Math.round(approximateBytes / 1024)),
        });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  openingHours: 'Daily · 11:00 AM – 11:00 PM',
  phone: '+91 4936 204 848',
  whatsappNumber: '914936204848',
  email: 'info@newformrestaurant.com',
  address: 'Main Rd, Mandayapuram, Near Old Bus Stand, Kalpetta, Wayanad, Kerala 673121',
  noticeBanner: '',
};

export const INITIAL_DISHES: DishItem[] = [
  {
    id: 'kerala-beef-fry-parotta',
    name: 'Beef Fry & Flaky Parotta',
    malayalamName: 'ബീഫ് ഫ്രൈ & പൊറോട്ട',
    category: 'kerala',
    description:
      'Slow-roasted tender beef tossed with cracked black pepper, caramelized shallots, coconut slivers, and crisp curry leaves, paired with golden layered tawa parotta.',
    price: '₹260',
    image: '/src/assets/images/dish_kerala_beef_parotta_1795009394539.jpg',
    dietaryTags: ['Spicy'],
    isSignature: true,
    available: true,
  },
  {
    id: 'malabar-dum-biryani',
    name: 'Malabar Dum Beef Biryani',
    malayalamName: 'മലബാർ ദം ബിരിയാണി',
    category: 'kerala',
    description:
      'Fragrant jeerakasala short-grain rice sealed in a traditional copper pot with spiced beef, ghee-roasted cashews, crispy fried onions, and cooling cucumber raita.',
    price: '₹280',
    image: '/src/assets/images/dish_malabar_biryani_1795009395343.jpg',
    dietaryTags: ['Gluten-Free', 'Spicy'],
    isSignature: true,
    available: true,
  },
  {
    id: 'arabian-chicken-mandi',
    name: 'Smoked Arabian Chicken Mandi',
    malayalamName: 'അറേബ്യൻ ചിക്കൻ മന്തി',
    category: 'arabian',
    description:
      'Charcoal-kissed spiced chicken served over saffron and cumin long-grain basmati rice, finished with toasted almonds, golden raisins, garlic toum, and tomato salsa.',
    price: '₹290',
    image: '/src/assets/images/dish_arabian_mandi_1795009394994.jpg',
    dietaryTags: ['Gluten-Free'],
    isSignature: true,
    available: true,
  },
  {
    id: 'arabian-mutton-mandi',
    name: 'Slow-Braised Mutton Mandi',
    malayalamName: 'മട്ടൺ മന്തി',
    category: 'arabian',
    description:
      'Melt-in-the-mouth Yemen-style spiced mutton shoulder steamed gently above aromatic mandi rice, served with house green chili chutney and fresh salad.',
    price: '₹420',
    image: '/src/assets/images/dish_arabian_mandi_1795009394994.jpg',
    dietaryTags: ['Gluten-Free'],
    available: true,
  },
  {
    id: 'wayanad-veg-kurma-appam',
    name: 'Vegetable Stew & Lace Appam',
    malayalamName: 'വെജിറ്റബിൾ സ്റ്റൂ & അപ്പം',
    category: 'kerala',
    description:
      'Fresh Wayanad garden vegetables simmered in first-press coconut milk infused with cardamom, cloves, and curry leaves alongside soft-centered lacy appams.',
    price: '₹160',
    image: '/src/assets/images/hero_newform_feast_1795009393342.jpg',
    dietaryTags: ['Vegetarian', 'Vegan', 'Gluten-Free'],
    available: true,
  },
  {
    id: 'arabian-al-faham',
    name: 'Charcoal Al-Faham Chicken',
    malayalamName: 'അൽ ഫഹം ചിക്കൻ',
    category: 'arabian',
    description:
      'Quarter chicken marinated overnight in Arabian seven-spice paste, grilled over glowing embers, and served with warm kuboos, hummus, and pickled turnips.',
    price: '₹240',
    image: '/src/assets/images/dish_arabian_mandi_1795009394994.jpg',
    dietaryTags: ['Spicy'],
    available: true,
  },
  {
    id: 'chinese-schezwan-noodles',
    name: 'Wok-Tossed Vegetable Schezwan Noodles',
    malayalamName: 'ഷെസ്വാൻ നൂഡിൽസ്',
    category: 'chinese',
    description:
      'High-flame wok noodles tossed with crisp bell peppers, spring onions, cabbage, roasted garlic, and house-made smoky red chili sauce.',
    price: '₹170',
    image: '/src/assets/images/hero_newform_feast_1795009393342.jpg',
    dietaryTags: ['Vegetarian', 'Vegan', 'Spicy'],
    available: true,
  },
  {
    id: 'chinese-chilli-chicken',
    name: 'Dry Pepper Chilli Chicken',
    malayalamName: 'ചില്ലി ചിക്കൻ',
    category: 'chinese',
    description:
      'Crisp boneless chicken seared with crushed ginger, green chilies, soy glaze, and spring onion greens — a Wayanad evening staple.',
    price: '₹220',
    image: '/src/assets/images/dish_kerala_beef_parotta_1795009394539.jpg',
    dietaryTags: ['Spicy'],
    available: true,
  },
  {
    id: 'kerala-palada-payasam',
    name: 'Warm Palada Payasam',
    malayalamName: 'പാലട പായസം',
    category: 'dessert',
    description:
      'Slow-reduced milk pudding simmered with tender rice ada, fragrant Wayanad green cardamom, and ghee-toasted cashews and plump raisins.',
    price: '₹120',
    image: '/src/assets/images/dish_kerala_payasam_1795009394886.jpg',
    dietaryTags: ['Vegetarian', 'Gluten-Free'],
    available: true,
  },
  {
    id: 'arabian-kunafa',
    name: 'Pistachio Cream Kunafa',
    malayalamName: 'കുനാഫ',
    category: 'dessert',
    description:
      'Crisp golden shredded pastry layered over warm sweet cheese, drizzled with orange-blossom syrup and crushed roasted pistachios.',
    price: '₹190',
    image: '/src/assets/images/dish_kerala_payasam_1795009394886.jpg',
    dietaryTags: ['Vegetarian'],
    available: true,
  },
];

export const INITIAL_GALLERY: GalleryPhotoItem[] = [
  {
    id: 'gal-1',
    title: 'Evening Feast at Kalpetta',
    caption: 'Malabar Dum Biryani, tawa parotta with beef fry, and smoked Arabian Mandi.',
    category: 'Dining Spread',
    image: '/src/assets/images/hero_newform_feast_1795009393342.jpg',
    visible: true,
    createdAt: '2026-11-18T00:00:00Z',
  },
  {
    id: 'gal-2',
    title: 'Nadan Beef Fry & Flaky Parotta',
    caption: 'Slow-roasted with Wayanad black pepper, shallots, and crisp curry leaves.',
    category: 'Kerala Kitchen',
    image: '/src/assets/images/dish_kerala_beef_parotta_1795009394539.jpg',
    visible: true,
    createdAt: '2026-11-18T00:01:00Z',
  },
  {
    id: 'gal-3',
    title: 'Wood-Smoked Arabian Mandi',
    caption: 'Saffron basmati rice crowned with ember-charred chicken, almonds, and raisins.',
    category: 'Arabian Kitchen',
    image: '/src/assets/images/dish_arabian_mandi_1795009394994.jpg',
    visible: true,
    createdAt: '2026-11-18T00:02:00Z',
  },
  {
    id: 'gal-4',
    title: 'Copper-Pot Dum Biryani',
    caption: 'Sealed in brassware with caramelized onions, cashews, and cooling raita.',
    category: 'Kerala Kitchen',
    image: '/src/assets/images/dish_malabar_biryani_1795009395343.jpg',
    visible: true,
    createdAt: '2026-11-18T00:03:00Z',
  },
  {
    id: 'gal-5',
    title: 'Palada Payasam in Brass Uruli',
    caption: 'Traditional Wayanad cardamom milk dessert with ghee-toasted cashews.',
    category: 'Desserts',
    image: '/src/assets/images/dish_kerala_payasam_1795009394886.jpg',
    visible: true,
    createdAt: '2026-11-18T00:04:00Z',
  },
];

export const RATING_STATS = {
  average: 4.0,
  total: 3303,
  breakdown: [
    { stars: 5, count: 1398 },
    { stars: 4, count: 1094 },
    { stars: 3, count: 432 },
    { stars: 2, count: 120 },
    { stars: 1, count: 259 },
  ],
};

export const GUEST_REVIEWS = [
  {
    id: 'rev-1',
    author: 'Arjun Menon',
    context: 'Family Dinner · Kalpetta',
    rating: 5,
    quote:
      'The beef fry and flaky parotta are unmatched in Kalpetta. Generous portions, quick table service, and very reasonable prices for families.',
  },
  {
    id: 'rev-2',
    author: 'Fathima N.',
    context: 'Weekend Feast · Wayanad',
    rating: 4,
    quote:
      'Ordered the Arabian Chicken Mandi and Malabar Dum Biryani for a group of six. Both arrived piping hot with authentic spice balance.',
  },
  {
    id: 'rev-3',
    author: 'Rohan Nair',
    context: 'Traveller · Kozhikode Road',
    rating: 5,
    quote:
      'Conveniently right near the old bus stand. Clean dining hall, warm staff, and the Palada Payasam was the perfect finish.',
  },
];

export const INITIAL_RESERVATIONS: ReservationItem[] = [
  {
    id: 'res-101',
    guestName: 'Siddharth Varma',
    guestPhone: '+91 98470 11223',
    date: '2026-11-18',
    time: '19:30',
    guests: 4,
    seatingArea: 'family-lounge',
    specialRequests: 'Window table if available',
    status: 'pending',
    createdAt: '2026-11-18T05:10:00Z',
  },
  {
    id: 'res-102',
    guestName: 'Amina Rasheed',
    guestPhone: '+91 94462 78901',
    date: '2026-11-18',
    time: '20:15',
    guests: 6,
    seatingArea: 'arabian-majlis',
    specialRequests: 'Mutton Mandi pre-order',
    status: 'confirmed',
    createdAt: '2026-11-18T04:40:00Z',
  },
];

export const INITIAL_INQUIRIES: InquiryItem[] = [
  {
    id: 'inq-201',
    name: 'Meera Krishnan',
    phoneOrEmail: '+91 98950 44510',
    type: 'catering',
    message: 'Looking for Malabar Biryani and Payasam catering for 45 guests in Vythiri this Saturday.',
    createdAt: '2026-11-18T03:55:00Z',
  },
];
