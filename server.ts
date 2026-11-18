import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DEFAULT_SITE_SETTINGS,
  INITIAL_DISHES,
  INITIAL_GALLERY,
  INITIAL_INQUIRIES,
  INITIAL_RESERVATIONS,
} from './src/siteData.ts';
import type {
  DishItem,
  GalleryPhotoItem,
  InquiryItem,
  ReservationItem,
  SiteSettingsData,
} from './src/siteData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSCODE = '2244';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  crypto.createHash('sha256').update(`newform-kalpetta-${__dirname}`).digest('hex');

interface StoreData {
  dishes: DishItem[];
  gallery: GalleryPhotoItem[];
  reservations: ReservationItem[];
  inquiries: InquiryItem[];
  settings: SiteSettingsData;
}

const DATA_DIR = path.resolve(__dirname, '.data');
const STORE_PATH = path.join(DATA_DIR, 'newform-store.json');

function readStore(): StoreData {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<StoreData>;
      return {
        dishes: Array.isArray(parsed.dishes) ? parsed.dishes : INITIAL_DISHES,
        gallery: Array.isArray(parsed.gallery) ? parsed.gallery : INITIAL_GALLERY,
        reservations: Array.isArray(parsed.reservations)
          ? parsed.reservations
          : INITIAL_RESERVATIONS,
        inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries : INITIAL_INQUIRIES,
        settings: parsed.settings ? { ...DEFAULT_SITE_SETTINGS, ...parsed.settings } : DEFAULT_SITE_SETTINGS,
      };
    }
  } catch {
    // Fall back to defaults if store file is unreadable
  }

  return {
    dishes: [...INITIAL_DISHES],
    gallery: [...INITIAL_GALLERY],
    reservations: [...INITIAL_RESERVATIONS],
    inquiries: [...INITIAL_INQUIRIES],
    settings: { ...DEFAULT_SITE_SETTINGS },
  };
}

function writeStore(data: StoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // Ignore read-only filesystem errors gracefully
  }
}

let store: StoreData = readStore();
writeStore(store);

interface AdminTokenPayload {
  email: string;
  role: 'admin';
  exp: number;
}

function signAdminToken(email: string): string {
  const payload: AdminTokenPayload = {
    email,
    role: 'admin',
    exp: Date.now() + 12 * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyAdminToken(token: string): AdminTokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as AdminTokenPayload;
    if (payload.role !== 'admin' || typeof payload.exp !== 'number' || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

interface AuthenticatedRequest extends Request {
  adminEmail?: string;
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: admin bearer token required.' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const payload = verifyAdminToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized: invalid or expired admin session.' });
    return;
  }

  req.adminEmail = payload.email;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'newform-restaurant' });
  });

  // ---------------------------------------------------------------------------
  // PUBLIC READ ENDPOINT (Never exposes reservations, inquiries, or hidden items)
  // ---------------------------------------------------------------------------
  app.get('/api/public/site', (_req, res) => {
    res.json({
      dishes: store.dishes.filter((d) => d.available),
      gallery: store.gallery.filter((g) => g.visible),
      settings: store.settings,
    });
  });

  // ---------------------------------------------------------------------------
  // PUBLIC WRITE ENDPOINTS (Validated guest submissions)
  // ---------------------------------------------------------------------------
  app.post('/api/reservations', (req, res) => {
    const { guestName, guestPhone, guestEmail, date, time, guests, seatingArea, specialRequests } =
      req.body ?? {};

    if (typeof guestName !== 'string' || guestName.trim().length < 2 || guestName.length > 100) {
      res.status(400).json({ error: 'Valid guest name is required (2–100 characters).' });
      return;
    }
    if (typeof guestPhone !== 'string' || guestPhone.trim().length < 8 || guestPhone.length > 20) {
      res.status(400).json({ error: 'Valid contact phone number is required.' });
      return;
    }
    if (typeof date !== 'string' || date.length < 8 || typeof time !== 'string' || time.length < 3) {
      res.status(400).json({ error: 'Valid reservation date and time are required.' });
      return;
    }

    const parsedGuests = Number(guests);
    if (!Number.isFinite(parsedGuests) || parsedGuests < 1 || parsedGuests > 50) {
      res.status(400).json({ error: 'Party size must be between 1 and 50 guests.' });
      return;
    }

    const allowedSeating = [
      'indoor-ac',
      'family-lounge',
      'open-terrace',
      'arabian-majlis',
      'no-preference',
    ];
    const safeSeating = allowedSeating.includes(seatingArea) ? seatingArea : 'family-lounge';

    const reservation: ReservationItem = {
      id: `res-${Date.now()}`,
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      guestEmail: typeof guestEmail === 'string' && guestEmail.trim() ? guestEmail.trim() : undefined,
      date: date.trim(),
      time: time.trim(),
      guests: Math.round(parsedGuests),
      seatingArea: safeSeating,
      specialRequests:
        typeof specialRequests === 'string' && specialRequests.trim()
          ? specialRequests.trim().slice(0, 500)
          : undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    store.reservations = [reservation, ...store.reservations];
    writeStore(store);
    res.status(201).json(reservation);
  });

  app.post('/api/inquiries', (req, res) => {
    const { name, phoneOrEmail, message, type } = req.body ?? {};
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
      res.status(400).json({ error: 'Valid sender name is required.' });
      return;
    }
    if (typeof phoneOrEmail !== 'string' || phoneOrEmail.trim().length < 5 || phoneOrEmail.length > 120) {
      res.status(400).json({ error: 'Valid phone or email is required.' });
      return;
    }
    if (typeof message !== 'string' || message.trim().length < 2 || message.length > 2000) {
      res.status(400).json({ error: 'Message must be between 2 and 2000 characters.' });
      return;
    }

    const allowedTypes = ['general', 'catering', 'event', 'feedback'];
    const inquiry: InquiryItem = {
      id: `inq-${Date.now()}`,
      name: name.trim(),
      phoneOrEmail: phoneOrEmail.trim(),
      type: allowedTypes.includes(type) ? type : 'general',
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    store.inquiries = [inquiry, ...store.inquiries];
    writeStore(store);
    res.status(201).json(inquiry);
  });

  app.post('/api/gallery/public', (req, res) => {
    const { title, caption, category, image } = req.body ?? {};
    if (typeof title !== 'string' || title.trim().length < 2 || title.length > 120) {
      res.status(400).json({ error: 'Photo title must be between 2 and 120 characters.' });
      return;
    }
    if (typeof image !== 'string' || !image.trim() || image.length > 1_200_000) {
      res.status(400).json({ error: 'Valid photo payload under 1 MB is required.' });
      return;
    }

    const photo: GalleryPhotoItem = {
      id: `gal-${Date.now()}`,
      title: title.trim(),
      caption:
        typeof caption === 'string' && caption.trim()
          ? caption.trim().slice(0, 300)
          : 'Shared by a Newform Restaurant guest in Kalpetta.',
      category:
        typeof category === 'string' && category.trim()
          ? category.trim().slice(0, 60)
          : 'Guest Moment',
      image: image.trim(),
      visible: true,
      createdAt: new Date().toISOString(),
    };

    store.gallery = [photo, ...store.gallery];
    writeStore(store);
    res.status(201).json(photo);
  });

  // ---------------------------------------------------------------------------
  // ADMIN AUTHENTICATION ENDPOINT (Any valid email + strictly "2244")
  // ---------------------------------------------------------------------------
  app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body ?? {};
    const trimmedEmail = typeof email === 'string' ? email.trim() : '';

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    if (password !== ADMIN_PASSCODE) {
      res.status(401).json({ error: 'Incorrect password. Please enter the valid admin access code.' });
      return;
    }

    const token = signAdminToken(trimmedEmail);
    res.json({ token, email: trimmedEmail });
  });

  // ---------------------------------------------------------------------------
  // PROTECTED ADMIN ROUTES (Require valid Bearer token)
  // ---------------------------------------------------------------------------
  app.get('/api/admin/bootstrap', requireAdmin, (_req, res) => {
    res.json(store);
  });

  app.post('/api/admin/dishes', requireAdmin, (req, res) => {
    const body = req.body ?? {};
    if (typeof body.name !== 'string' || body.name.trim().length < 2) {
      res.status(400).json({ error: 'Dish name is required.' });
      return;
    }

    const dish: DishItem = {
      id: typeof body.id === 'string' && body.id.trim() ? body.id.trim() : `dish-${Date.now()}`,
      name: body.name.trim(),
      malayalamName:
        typeof body.malayalamName === 'string' && body.malayalamName.trim()
          ? body.malayalamName.trim()
          : undefined,
      category: ['kerala', 'arabian', 'chinese', 'dessert'].includes(body.category)
        ? body.category
        : 'kerala',
      description: typeof body.description === 'string' ? body.description.trim() : '',
      price: typeof body.price === 'string' && body.price.trim() ? body.price.trim() : '₹180',
      image:
        typeof body.image === 'string' && body.image.trim()
          ? body.image.trim()
          : '/src/assets/images/hero_newform_feast_1795009393342.jpg',
      dietaryTags: Array.isArray(body.dietaryTags) ? body.dietaryTags : [],
      isSignature: Boolean(body.isSignature),
      available: body.available !== false,
    };

    store.dishes = [dish, ...store.dishes];
    writeStore(store);
    res.status(201).json(dish);
  });

  app.put('/api/admin/dishes/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const body = req.body ?? {};
    const index = store.dishes.findIndex((d) => d.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Dish not found.' });
      return;
    }

    const updated: DishItem = {
      ...store.dishes[index],
      ...body,
      id,
    };
    store.dishes[index] = updated;
    writeStore(store);
    res.json(updated);
  });

  app.delete('/api/admin/dishes/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    store.dishes = store.dishes.filter((d) => d.id !== id);
    writeStore(store);
    res.json({ deleted: id });
  });

  app.post('/api/admin/dishes/reset', requireAdmin, (_req, res) => {
    store.dishes = [...INITIAL_DISHES];
    writeStore(store);
    res.json(store.dishes);
  });

  app.post('/api/admin/gallery', requireAdmin, (req, res) => {
    const body = req.body ?? {};
    if (typeof body.title !== 'string' || !body.title.trim() || typeof body.image !== 'string' || !body.image.trim()) {
      res.status(400).json({ error: 'Title and image are required.' });
      return;
    }

    const photo: GalleryPhotoItem = {
      id: `gal-${Date.now()}`,
      title: body.title.trim(),
      caption: typeof body.caption === 'string' ? body.caption.trim() : '',
      category: typeof body.category === 'string' ? body.category.trim() : 'Kerala Kitchen',
      image: body.image.trim(),
      visible: body.visible !== false,
      createdAt: new Date().toISOString(),
    };

    store.gallery = [photo, ...store.gallery];
    writeStore(store);
    res.status(201).json(photo);
  });

  app.patch('/api/admin/gallery/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const index = store.gallery.findIndex((g) => g.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Gallery photo not found.' });
      return;
    }

    store.gallery[index] = {
      ...store.gallery[index],
      ...req.body,
      id,
    };
    writeStore(store);
    res.json(store.gallery[index]);
  });

  app.delete('/api/admin/gallery/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    store.gallery = store.gallery.filter((g) => g.id !== id);
    writeStore(store);
    res.json({ deleted: id });
  });

  app.patch('/api/admin/reservations/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const { status } = req.body ?? {};
    const index = store.reservations.findIndex((r) => r.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Reservation not found.' });
      return;
    }

    if (['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      store.reservations[index] = { ...store.reservations[index], status };
      writeStore(store);
    }
    res.json(store.reservations[index]);
  });

  app.put('/api/admin/settings', requireAdmin, (req, res) => {
    store.settings = {
      ...store.settings,
      ...(req.body ?? {}),
    };
    writeStore(store);
    res.json(store.settings);
  });

  // ---------------------------------------------------------------------------
  // VITE / STATIC SERVING
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Newform Restaurant server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Newform Restaurant server:', err);
  process.exit(1);
});
