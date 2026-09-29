import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDown, ArrowRight, ArrowUpDown, Check, ChevronDown, Heart, Leaf, LockKeyhole, Menu, Minus, Plus, Search, ShieldCheck, ShoppingBag, Sparkles, Star, Truck, UserRound, X } from 'lucide-react';
import './styles.css';

const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
async function request(url, options = {}) {
  const token = localStorage.getItem('northstar-token');
  const response = await fetch(`/api${url}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('northstar-cart') || '[]'));
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('northstar-user') || 'null'));
  const [modal, setModal] = useState('');
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== 'All') params.set('category', category);
    if (search.trim()) params.set('search', search.trim());
    if (sort !== 'featured') params.set('sort', sort);
    request(`/products?${params}`).then(data => { setProducts(data.products); setCategories(data.categories); }).catch(error => setNotice(error.message));
  }, [category, search, sort]);
  useEffect(() => { localStorage.setItem('northstar-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { if (user) localStorage.setItem('northstar-user', JSON.stringify(user)); else localStorage.removeItem('northstar-user'); }, [user]);
  useEffect(() => { if (!notice) return undefined; const timer = setTimeout(() => setNotice(''), 3300); return () => clearTimeout(timer); }, [notice]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  function scrollShop() { document.getElementById('shop').scrollIntoView({ behavior: 'smooth' }); }
  function chooseCategory(value) { setCategory(value); setMobileMenu(false); scrollShop(); }
  function addToCart(product) {
    setCart(current => { const found = current.find(item => item.id === product.id); return found ? current.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, quantity: 1 }]; });
    setNotice(`${product.name} added to your bag`);
  }
  function changeQuantity(id, amount) { setCart(current => current.map(item => item.id === id ? { ...item, quantity: item.quantity + amount } : item).filter(item => item.quantity > 0)); }
  async function submitAuth(event) {
    event.preventDefault(); setBusy(true);
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const data = await request(authMode === 'login' ? '/auth/login' : '/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      localStorage.setItem('northstar-token', data.token); setUser(data.user); setModal(''); setNotice(`Welcome${authMode === 'register' ? `, ${data.user.name.split(' ')[0]}` : ' back'}`);
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  }
  async function submitOrder(event) {
    event.preventDefault(); setBusy(true);
    const shipping = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const data = await request('/orders', { method: 'POST', body: JSON.stringify({ items: cart.map(({ id, quantity }) => ({ id, quantity })), shipping }) });
      setCart([]); setSelected(data.order); setModal('success');
    } catch (error) {
      if (error.message.includes('sign in')) { setAuthMode('login'); setModal('auth'); setNotice('Sign in to place your order'); }
      else setNotice(error.message);
    } finally { setBusy(false); }
  }
  function openAccount() { if (!user) { setAuthMode('login'); setModal('auth'); } else setModal('account'); }

  return <>
    <div className="announcement"><span>Good things, considered</span><span className="announcement-mid"><Sparkles size={13} /> Complimentary shipping on orders over $75</span><button onClick={scrollShop}>Explore the edit <ArrowRight size={13} /></button></div>
    <header className="header">
      <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X /> : <Menu />}</button>
      <nav className={`nav-left ${mobileMenu ? 'is-open' : ''}`}><button onClick={() => chooseCategory('All')}>Shop</button><button onClick={() => chooseCategory('Home')}>Home & living</button><button onClick={() => chooseCategory('Apparel')}>Wear</button><button onClick={() => chooseCategory('Outdoors')}>Outside</button></nav>
      <button className="wordmark" onClick={() => { setCategory('All'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>northstar<span>®</span></button>
      <div className="nav-right"><button className="search-trigger" onClick={() => document.getElementById('product-search').focus()}><Search size={18} /><span>Search</span></button><button className="icon-button account-trigger" aria-label="Account" onClick={openAccount}><UserRound size={19} /></button><button className="bag-trigger" aria-label={`Shopping bag, ${cartCount} items`} onClick={() => setModal('cart')}><ShoppingBag size={19} /><span>Bag</span><b>{cartCount}</b></button></div>
    </header>

    <main>
      <section className="hero"><img className="hero-image" src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=2200&q=90" alt="Sunlit living room with considered furniture and natural textures" /><div className="hero-shade" /><div className="hero-content"><p className="eyebrow hero-eyebrow"><span /> The everyday, elevated</p><h1>Find your<br />good things.</h1><p className="hero-copy">Objects with a point of view.<br />Made for the life you actually live.</p><button className="button button-cream" onClick={scrollShop}>Shop the collection <ArrowRight size={16} /></button></div><div className="hero-note"><span>01 / 04</span><span>Rooms to return to</span></div><div className="hero-vertical">A LITTLE MORE THOUGHTFUL, A LOT MORE YOU</div></section>
      <section className="promise-strip"><div><Leaf /><span>Considered by design</span></div><div><Truck /><span>Free shipping over $75</span></div><div><ShieldCheck /><span>Here for the long run</span></div><div><Heart /><span>Small brands, big heart</span></div></section>
      <section className="editorial"><div className="editorial-text"><p className="eyebrow">A slower kind of shopping</p><h2>Keep what<br />feels like you.</h2><p>Less, but better. We bring together independent makers and everyday essentials that earn their place in your home, your wardrobe, and your routine.</p><button className="text-link" onClick={scrollShop}>Meet your next favorite <ArrowRight size={16} /></button></div><div className="editorial-image-wrap"><img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1100&q=85" alt="Quiet, warmly lit home filled with natural materials" /><span className="image-caption">Made to be lived with <span>↗</span></span></div><div className="editorial-stamp">GOOD<br />THINGS<br /><span>ONLY</span></div></section>
      <section id="shop" className="shop-section"><div className="shop-heading"><div><p className="eyebrow">The Northstar edit</p><h2>Find your everyday.</h2></div><p className="shop-side-note">Thoughtful things for wherever<br />you are in the day.</p></div>
        <div className="category-row">{['All', ...categories].map(item => <button key={item} onClick={() => setCategory(item)} className={category === item ? 'active' : ''}>{item}</button>)}</div>
        <div className="filter-bar"><div className="results-count">Showing <strong>{products.length}</strong> good things</div><label className="search-field"><Search size={16} /><input id="product-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Find something..." /><button className={search ? 'visible' : ''} aria-label="Clear search" onClick={() => setSearch('')}><X size={14} /></button></label><label className="sort-select"><ArrowUpDown size={15} /><select value={sort} onChange={event => setSort(event.target.value)}><option value="featured">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="rating">Top rated</option></select><ChevronDown size={14} /></label></div>
        <div className="product-grid">{products.map((product, index) => <article className="product-card" key={product.id} style={{ animationDelay: `${Math.min(index % 12, 8) * 35}ms` }}><div className="product-image" onClick={() => { setSelected(product); setModal('product'); }}><img src={product.image} loading={index < 8 ? 'eager' : 'lazy'} alt={product.name} /><span className="product-badge">{product.badge || product.category}</span><button className={`favorite-button ${favorites.includes(product.id) ? 'favorited' : ''}`} aria-label={favorites.includes(product.id) ? 'Remove from favorites' : 'Add to favorites'} onClick={event => { event.stopPropagation(); setFavorites(current => current.includes(product.id) ? current.filter(id => id !== product.id) : [...current, product.id]); }}><Heart size={17} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} /></button><button className="quick-add" onClick={event => { event.stopPropagation(); addToCart(product); }}>Quick add <Plus size={15} /></button></div><button className="product-info" onClick={() => { setSelected(product); setModal('product'); }}><div className="product-meta"><span>{product.name}</span><span>{money(product.price)}</span></div><div className="product-submeta"><span>{product.category}</span><span className="rating"><Star size={12} fill="currentColor" /> {product.rating} <span>({product.reviews})</span></span></div></button></article>)}</div>
        {products.length === 0 && <div className="empty-results"><Search size={28} /><h3>Nothing here just yet.</h3><p>Try another search or clear your filters.</p><button className="text-link" onClick={() => { setSearch(''); setCategory('All'); }}>See everything <ArrowRight size={15} /></button></div>}
      </section>
      <section className="newsletter"><div className="newsletter-art"><span>n.</span><span>n.</span><span>n.</span></div><div className="newsletter-copy"><p className="eyebrow">A note from Northstar</p><h2>Good things,<br />once in a while.</h2><p>New finds, thoughtful ideas, and 10% off your first order.</p><form onSubmit={event => { event.preventDefault(); setNotice('You’re on the list. Keep an eye on your inbox.'); event.currentTarget.reset(); }}><input type="email" required placeholder="Your email address" aria-label="Your email address" /><button type="submit" aria-label="Subscribe"><ArrowRight size={19} /></button></form><small>By subscribing, you agree to our very occasional emails.</small></div><div className="newsletter-photo"><img src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=85" alt="Sunlight falling across a carefully arranged shelf" /></div></section>
    </main>
    <footer className="footer"><div className="footer-top"><div className="footer-brand"><button className="wordmark" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>northstar<span>®</span></button><p>A little more thoughtful.<br />A lot more you.</p></div><div className="footer-column"><h4>Explore</h4><button onClick={() => chooseCategory('All')}>Shop all</button><button onClick={() => chooseCategory('Home')}>Home & living</button><button onClick={() => chooseCategory('Apparel')}>Clothing</button></div><div className="footer-column"><h4>Good to know</h4><button onClick={() => setNotice('Free shipping on orders over $75. Returns accepted within 30 days.')}>Shipping & returns</button><button onClick={() => setNotice('We’re here for you: hello@northstar.shop')}>Get in touch</button><button onClick={() => setNotice('Thoughtfully sourced, always.')}>Our approach</button></div><div className="footer-signoff">A GOOD PLACE<br />TO BEGIN <ArrowDown size={16} /></div></div><div className="footer-bottom"><span>© 2025 Northstar Supply Co.</span><span>Made for the everyday.</span><div><button onClick={() => setNotice('Privacy details available at hello@northstar.shop')}>Privacy</button><button onClick={() => setNotice('Terms details available at hello@northstar.shop')}>Terms</button></div></div></footer>
    {notice && <div className="toast" role="status"><Check size={17} />{notice}<button aria-label="Dismiss" onClick={() => setNotice('')}><X size={15} /></button></div>}

    {modal && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setModal(''); }}><section className={`modal ${modal === 'cart' ? 'cart-modal' : ''}`} role="dialog" aria-modal="true">
      {modal === 'cart' && <><div className="modal-header"><div><p className="eyebrow">Your Northstar finds</p><h2>Your bag <span>({cartCount})</span></h2></div><button className="icon-button" aria-label="Close bag" onClick={() => setModal('')}><X /></button></div>{cart.length ? <><div className="cart-items">{cart.map(item => <div className="cart-item" key={item.id}><img src={item.image} alt={item.name} /><div className="cart-item-copy"><span>{item.name}</span><small>{item.category}</small><div className="quantity-control"><button aria-label="Decrease quantity" onClick={() => changeQuantity(item.id, -1)}><Minus size={13} /></button><span>{item.quantity}</span><button aria-label="Increase quantity" onClick={() => changeQuantity(item.id, 1)}><Plus size={13} /></button></div></div><strong>{money(item.price * item.quantity)}</strong></div>)}</div><div className="cart-summary"><p><span>Subtotal</span><strong>{money(subtotal)}</strong></p><p><span>Shipping</span><span>{subtotal >= 75 ? 'On us' : money(6)}</span></p><div className="shipping-progress">{subtotal >= 75 ? 'You unlocked complimentary shipping.' : `You’re ${money(75 - subtotal)} away from free shipping.`}<div><span style={{ width: `${Math.min(subtotal / 75 * 100, 100)}%` }} /></div></div><button className="button button-dark checkout-button" onClick={() => { if (!user) { setModal('auth'); setAuthMode('login'); setNotice('Sign in to place your order'); } else setModal('checkout'); }}>Continue to checkout <ArrowRight size={16} /></button></div></> : <div className="cart-empty"><ShoppingBag size={30} /><h3>Your bag is taking a little break.</h3><p>There are good things out there with your name on them.</p><button className="button button-dark" onClick={() => { setModal(''); scrollShop(); }}>Find your good things <ArrowRight size={16} /></button></div>}</>}
      {modal === 'product' && selected && <><button className="modal-close icon-button" aria-label="Close product details" onClick={() => setModal('')}><X /></button><div className="product-modal-grid"><img src={selected.image} alt={selected.name} /><div className="product-modal-copy"><p className="eyebrow">{selected.category} / Northstar edit</p><h2>{selected.name}</h2><div className="rating"><Star size={14} fill="currentColor" /> {selected.rating} <span>({selected.reviews} reviews)</span></div><p className="detail-price">{money(selected.price)} {selected.compareAt && <del>{money(selected.compareAt)}</del>}</p><p>{selected.description}</p><div className="detail-perks"><span><Truck size={15} /> Free shipping over $75</span><span><ShieldCheck size={15} /> 30-day easy returns</span></div><button className="button button-dark" onClick={() => { addToCart(selected); setModal('cart'); }}>Add to bag <ShoppingBag size={16} /></button><small><LockKeyhole size={13} /> Secure checkout, always</small></div></div></>}
      {modal === 'auth' && <><button className="modal-close icon-button" aria-label="Close sign in" onClick={() => setModal('')}><X /></button><div className="auth-panel"><div className="auth-mark">n.</div><p className="eyebrow">Your Northstar account</p><h2>{authMode === 'login' ? 'Welcome back.' : 'Make yourself at home.'}</h2><p>{authMode === 'login' ? 'Sign in to see your orders and check out.' : 'Create an account for a few more good things.'}</p><form className="stacked-form" onSubmit={submitAuth}>{authMode === 'register' && <label>Your name<input name="name" type="text" autoComplete="name" required placeholder="First and last name" /></label>}<label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label><label>Password<input name="password" type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength="8" required placeholder="At least 8 characters" /></label><button className="button button-dark" disabled={busy}>{busy ? 'One moment...' : authMode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={16} /></button></form><div className="auth-switch">{authMode === 'login' ? 'New around here?' : 'Already have an account?'} <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>{authMode === 'login' ? 'Create an account' : 'Sign in'}</button></div><small><LockKeyhole size={13} /> Your details stay yours.</small></div></>}
      {modal === 'checkout' && <><button className="modal-close icon-button" aria-label="Close checkout" onClick={() => setModal('cart')}><X /></button><div className="checkout-panel"><p className="eyebrow">Almost yours</p><h2>Delivery details.</h2><p>Shipping to your doorstep, with care.</p><form className="stacked-form" onSubmit={submitOrder}><label>Street address<input name="address" autoComplete="street-address" required placeholder="123 Main Street" /></label><div className="form-row"><label>City<input name="city" autoComplete="address-level2" required placeholder="Brooklyn" /></label><label>ZIP code<input name="postalCode" autoComplete="postal-code" required placeholder="11201" /></label></div><label>Country<input name="country" autoComplete="country-name" required defaultValue="United States" /></label><div className="checkout-total"><span>Total today</span><strong>{money(subtotal + (subtotal >= 75 ? 0 : 6))}</strong></div><p className="payment-note"><LockKeyhole size={14} /> Demo checkout. No payment is collected.</p><button className="button button-dark" disabled={busy}>{busy ? 'Placing your order...' : 'Place order'} <ArrowRight size={16} /></button></form></div></>}
      {modal === 'success' && selected && <div className="success-panel"><div className="success-icon"><Check size={27} /></div><p className="eyebrow">Order confirmed</p><h2>Good things are on their way.</h2><p>Order <strong>{selected.id}</strong> is confirmed. Thanks for shopping thoughtfully.</p><div className="success-total"><span>Order total</span><strong>{money(selected.total)}</strong></div><button className="button button-dark" onClick={() => { setModal(''); setSelected(null); }}>Back to the good things <ArrowRight size={16} /></button></div>}
      {modal === 'account' && <><button className="modal-close icon-button" aria-label="Close account" onClick={() => setModal('')}><X /></button><div className="account-panel"><div className="auth-mark">n.</div><p className="eyebrow">Your Northstar account</p><h2>Hello, {user?.name.split(' ')[0]}.</h2><p>{user?.email}</p><AccountOrders onError={setNotice} /><button className="button button-outline" onClick={() => { setUser(null); localStorage.removeItem('northstar-token'); setModal(''); setNotice('You’ve signed out. See you soon.'); }}>Sign out <ArrowRight size={16} /></button></div></>}
    </section></div>}
  </>;
}

function AccountOrders({ onError }) {
  const [orders, setOrders] = useState([]);
  useEffect(() => { request('/orders').then(data => setOrders(data.orders)).catch(error => onError(error.message)); }, [onError]);
  return <div className="order-list"><h3>Your orders</h3>{orders.length ? orders.map(order => <div className="order-row" key={order.id}><div><strong>{order.id}</strong><span>{new Date(order.createdAt).toLocaleDateString()}</span></div><span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span><strong>{money(order.total)}</strong></div>) : <p>No orders just yet. Yours will show up here.</p>}</div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
