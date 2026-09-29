import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import appInsights from 'applicationinsights';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET = process.env.JWT_SECRET || 'northstar-development-secret-change-me';
const dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(dirname, 'data.json');
const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: true }
}) : null;
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
    .setAutoCollectRequests(true)
    .setAutoCollectDependencies(true)
    .start();
}
app.use(cors());
app.use(express.json());
if (process.env.ORIGIN_VERIFY_TOKEN) {
  app.use((req, res, next) => {
    if (req.path === '/api/health' || req.path === '/api/ready') return next();
    if (req.get('x-northstar-origin') !== process.env.ORIGIN_VERIFY_TOKEN) return res.status(403).json({ error: 'Forbidden.' });
    next();
  });
}

const catalog = [
  ['Home', ['Arc table lamp', 'Stillwater vase', 'Cove cushion', 'Sunday throw', 'Pebble incense holder', 'Form ceramic bowl', 'Softline mirror', 'Everyday candle', 'Morrow clock', 'Dune side table'], ['photo-1600210492486-724fe5c67fb0', 'photo-1494438639946-1ebd1d20bf85', 'photo-1602874801007-bd458bb1b8b6', 'photo-1616486338812-3dadae4b4ace']],
  ['Apparel', ['Studio cotton tee', 'Daybreak overshirt', 'Weekend trouser', 'Field jacket', 'Cloud knit sweater', 'Everyday hoodie', 'Rib tank', 'Linen button-down', 'Transit short', 'Canvas chore coat'], ['photo-1529139574466-a303027c1d8b', 'photo-1542291026-7eec264c27ff', 'photo-1521572163474-6864f9cf17ab', 'photo-1551028719-00167b16eac5']],
  ['Tech', ['Quiet wireless headphones', 'Analog watch', 'Compact speaker', 'Desk charging dock', 'Pocket camera strap', 'Travel power bank', 'Studio keyboard', 'Reading light', 'Everyday earbuds', 'Soundbar mini'], ['photo-1505740420928-5e560c06d30e', 'photo-1523275335684-37898b6baf30', 'photo-1503602642458-232111445657', 'photo-1547887538-e3a2f32cb1cc']],
  ['Kitchen', ['Market tote', 'Sunday serving board', 'Pour-over kettle', 'Stoneware mug', 'Prep knife set', 'Linen apron', 'Daily glass set', 'Olive oil cruet', 'Baker mixing bowl', 'Press coffee maker'], ['photo-1490645935967-10de6ba17061', 'photo-1556911220-e15b29be8c8f', 'photo-1547592180-85f173990554', 'photo-1556912172-45b7abe8b7e1']],
  ['Outdoors', ['Trail daypack', 'Camp enamel mug', 'Weekender blanket', 'Field water bottle', 'Coast picnic set', 'Summit cap', 'Pocket binoculars', 'Ridge hiking socks', 'Trail thermos', 'Garden gloves'], ['photo-1472396961693-142e6e269027', 'photo-1500530855697-b586d89ba3ee', 'photo-1511497584788-876760111969', 'photo-1470770841072-f978cf4d019e']],
  ['Beauty', ['Daily face oil', 'Botanical hand cream', 'Mineral sunscreen', 'Gentle cleanser', 'Night recovery balm', 'Rosewater mist', 'Soft cotton rounds', 'Body polish', 'Lip care duo', 'Travel skincare kit'], ['photo-1608248543803-ba4f8c70ae0b', 'photo-1596462502278-27bfdc403348', 'photo-1601049541289-9b1b7bbbfe19']],
  ['Accessories', ['Everyday leather wallet', 'Market crossbody', 'Classic metal watch', 'Silk neck scarf', 'Slim card case', 'Weekender bag', 'Tortoise sunglasses', 'Leather belt', 'Canvas cap', 'Woven key loop'], ['photo-1523170335258-f5ed11844a49', 'photo-1548036328-c9fa89d128fa', 'photo-1524592094714-0f0654e20314', 'photo-1506629905607-d9e36a44f3f7']],
  ['Kids', ['Little explorer set', 'Woodland puzzle', 'Soft knit blanket', 'Tiny canvas backpack', 'Storytime lamp', 'Wood block set', 'Rainy day boots', 'Cotton play mat', 'Bedtime book bundle', 'Mini garden kit'], ['photo-1516627145497-ae6968895b74', 'photo-1503919005314-30d93d07d823', 'photo-1471286174890-9c112ffca5b4', 'photo-1519689680058-324335c77eba']],
  ['Stationery', ['Daily planner', 'Hardcover notebook', 'Brass desk pen', 'Weekly note pad', 'Pocket sketchbook', 'Desk organizer', 'Letter writing set', 'Color study pencils', 'Reading journal', 'Paper calendar'], ['photo-1455390582262-044cdead277a', 'photo-1517842645767-c639042777db', 'photo-1456324504439-367cee3b3c32', 'photo-1499951360447-b19be8fe80f5']],
  ['Wellness', ['Unwind yoga mat', 'Scented bath salts', 'Linen eye pillow', 'Daily stretch band', 'Breathwork cards', 'Soft robe', 'Calm essential oil', 'Recovery roller', 'Sleep mask', 'Mindful journal'], ['photo-1544367567-0f2fcb009e0b', 'photo-1540555700478-4be289fbecef', 'photo-1506126613408-eca07ce68773', 'photo-1518611012118-696072aa579a']]
];
const categories = catalog.map(([name]) => name);
const products = catalog.flatMap(([category, names, images], group) => names.map((name, index) => ({
  id: `${category.toLowerCase()}-${index + 1}`, name, category,
  price: 18 + ((group * 17 + index * 13) % 83),
  compareAt: index % 4 === 0 ? 34 + ((group * 17 + index * 13) % 83) : null,
  rating: Number((4.5 + ((index + group) % 5) / 10).toFixed(1)),
  reviews: 18 + ((index * 19 + group * 7) % 230),
  badge: index === 0 ? 'Bestseller' : index === 4 ? 'Just in' : null,
  image: `https://images.unsplash.com/${images[index % images.length]}?auto=format&fit=crop&w=800&q=85`,
  description: `A thoughtful ${name.toLowerCase()} designed for everyday rituals. Made with considered materials and a little more care.`
})));

function loadData() {
  try { return JSON.parse(fs.readFileSync(dataPath, 'utf8')); }
  catch { return { users: [], orders: [] }; }
}
let database = loadData();
function saveData() { fs.writeFileSync(dataPath, JSON.stringify(database, null, 2)); }
async function initializeDatabase() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      password text NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES users(id),
      created_at timestamptz NOT NULL,
      order_data jsonb NOT NULL
    );
    CREATE INDEX IF NOT EXISTS orders_user_created_idx ON orders (user_id, created_at DESC);
  `);
}
async function findUserByEmail(email) {
  if (!pool) return database.users.find(user => user.email === email);
  const result = await pool.query('SELECT id, name, email, password FROM users WHERE email = $1', [email]);
  return result.rows[0];
}
async function findUserById(id) {
  if (!pool) return database.users.find(user => user.id === id);
  const result = await pool.query('SELECT id, name, email, password FROM users WHERE id = $1', [id]);
  return result.rows[0];
}
async function saveUser(user) {
  if (!pool) { database.users.push(user); saveData(); return; }
  await pool.query('INSERT INTO users (id, name, email, password) VALUES ($1, $2, $3, $4)', [user.id, user.name, user.email, user.password]);
}
async function findOrdersByUser(userId) {
  if (!pool) return database.orders.filter(order => order.userId === userId).reverse();
  const result = await pool.query('SELECT order_data FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return result.rows.map(row => row.order_data);
}
async function saveOrder(order) {
  if (!pool) { database.orders.push(order); saveData(); return; }
  await pool.query('INSERT INTO orders (id, user_id, created_at, order_data) VALUES ($1, $2, $3, $4)', [order.id, order.userId, order.createdAt, order]);
}
function safeUser(user) { return { id: user.id, name: user.name, email: user.email }; }
function tokenFor(user) { return jwt.sign({ id: user.id }, SECRET, { expiresIn: '7d' }); }
async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const payload = jwt.verify(token, SECRET);
    req.user = await findUserById(payload.id);
    if (!req.user) return res.status(401).json({ error: 'Account not found.' });
    next();
  } catch { return res.status(401).json({ error: 'Please sign in to continue.' }); }
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', products: products.length }));
app.get('/api/ready', async (_req, res) => {
  try {
    if (pool) await pool.query('SELECT 1');
    res.json({ status: 'ready' });
  } catch { res.status(503).json({ status: 'not-ready' }); }
});
app.get('/api/products', (req, res) => {
  const { category, search, sort, min, max } = req.query;
  let result = products.filter(product => (!category || category === 'All' || product.category === category)
    && (!search || `${product.name} ${product.category}`.toLowerCase().includes(String(search).toLowerCase()))
    && (!min || product.price >= Number(min)) && (!max || product.price <= Number(max)));
  if (sort === 'price-asc') result = [...result].sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') result = [...result].sort((a, b) => b.price - a.price);
  if (sort === 'rating') result = [...result].sort((a, b) => b.rating - a.rating);
  res.json({ products: result, total: result.length, categories });
});
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || !password || password.length < 8)
    return res.status(400).json({ error: 'Enter your name, a valid email, and a password of at least 8 characters.' });
  const normalizedEmail = email.toLowerCase();
  if (await findUserByEmail(normalizedEmail)) return res.status(409).json({ error: 'An account with this email already exists.' });
  const user = { id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: name.trim(), email: normalizedEmail, password: await bcrypt.hash(password, 10) };
  try {
    await saveUser(user);
    res.status(201).json({ token: tokenFor(user), user: safeUser(user) });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'An account with this email already exists.' });
    throw error;
  }
});
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = await findUserByEmail(String(email || '').toLowerCase());
  if (!user || !await bcrypt.compare(password || '', user.password)) return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.json({ token: tokenFor(user), user: safeUser(user) });
});
app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: safeUser(req.user) }));
app.get('/api/orders', requireAuth, async (req, res) => res.json({ orders: await findOrdersByUser(req.user.id) }));
app.post('/api/orders', requireAuth, async (req, res) => {
  const { items, shipping } = req.body || {};
  if (!Array.isArray(items) || !items.length || items.length > 100) return res.status(400).json({ error: 'Your cart is empty.' });
  if (!shipping?.address?.trim() || !shipping?.city?.trim() || !shipping?.postalCode?.trim()) return res.status(400).json({ error: 'Complete the shipping address to place your order.' });
  const normalized = [];
  for (const item of items) {
    const product = products.find(entry => entry.id === item.id);
    const quantity = Math.min(20, Math.max(1, Number(item.quantity) || 1));
    if (product) normalized.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity });
  }
  if (!normalized.length) return res.status(400).json({ error: 'No valid products were found in your cart.' });
  const subtotal = normalized.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = { id: `NS-${Date.now().toString().slice(-8)}`, userId: req.user.id, items: normalized, subtotal, shippingCost: subtotal >= 75 ? 0 : 6, total: subtotal + (subtotal >= 75 ? 0 : 6), shipping, status: 'Confirmed', createdAt: new Date().toISOString() };
  await saveOrder(order);
  res.status(201).json({ order });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(dirname, '../dist'), {
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-store');
      else res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }));
}
initializeDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => console.log(`Northstar API listening on http://localhost:${PORT}`));
}).catch(error => {
  console.error('Database initialization failed:', error);
  process.exit(1);
});
