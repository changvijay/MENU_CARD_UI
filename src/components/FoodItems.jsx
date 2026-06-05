import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { foodItemsApi, categoriesApi, transformFoodItem, transformCategory } from '../services/apiService';
import FoodItemCard from './FoodItemCard';

/* ─── Inline design tokens (no Tailwind overrides needed) ─── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');

  .fi-root {
    --brand:    #D94F1E;
    --brand-lt: #FEF0EB;
    --brand-hv: #B83E14;
    --gold:     #B07B12;
    --gold-lt:  #FDF6E3;
    --bg:       #F6F3EE;
    --surface:  #FFFFFF;
    --surf2:    #F0EDE8;
    --border:   #E5E0D8;
    --bdr-str:  #CAC4BB;
    --txt:      #1C1815;
    --txt-2:    #5A534C;
    --txt-3:    #9B938C;
    --green:    #22A24A;
    --green-lt: #EDFAF2;
    --r-sm:     8px;
    --r-md:     14px;
    --r-lg:     20px;
    --r-xl:     28px;
    --r-full:   999px;
    --sh-xs:    0 1px 3px rgba(28,24,21,.06);
    --sh-sm:    0 3px 10px rgba(28,24,21,.08);
    --sh-md:    0 8px 28px rgba(28,24,21,.11);
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    min-height: 100vh;
  }

  /* ── PAGE WRAPPER ── */
  .fi-page { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
  .fi-page.with-cart { padding-bottom: 120px; } /* Extra space when cart is visible */

  /* ── HERO HEADER ── */
  .fi-hero {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 16px; margin-bottom: 32px;
  }
  .fi-hero-left {}
  .fi-hero-eyebrow {
    font-size: 11px; font-weight: 700; letter-spacing: 1.6px;
    text-transform: uppercase; color: var(--brand);
    margin-bottom: 6px; display: flex; align-items: center; gap: 6px;
  }
  .fi-hero-eyebrow::before {
    content: ''; display: inline-block;
    width: 18px; height: 2px; background: var(--brand); border-radius: 2px;
  }
  .fi-hero-title {
    font-family: 'Fraunces', Georgia, serif;
    font-size: clamp(32px, 5vw, 48px);
    font-weight: 700; line-height: 1.1;
    color: var(--txt); letter-spacing: -.5px;
    margin: 0;
  }
  .fi-hero-title em { font-style: normal; color: var(--brand); }
  .fi-hero-sub {
    font-size: 15px; color: var(--txt-2); margin-top: 8px; line-height: 1.5;
  }
  .fi-hero-badge {
    flex-shrink: 0;
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--r-lg);
    padding: 12px 20px;
    text-align: center;
    box-shadow: var(--sh-xs);
    display: none;
  }
  @media(min-width:640px){ .fi-hero-badge { display: block; } }
  .fi-hero-badge-num {
    font-family: 'Fraunces', serif;
    font-size: 28px; font-weight: 700; color: var(--brand); line-height: 1;
  }
  .fi-hero-badge-lbl {
    font-size: 11px; font-weight: 600; color: var(--txt-3);
    text-transform: uppercase; letter-spacing: .8px; margin-top: 2px;
  }

  /* ── FILTER / SORT BAR ── */
  .fi-bar {
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--r-lg);
    padding: 16px 18px;
    margin-bottom: 24px;
    box-shadow: var(--sh-xs);
  }
  .fi-bar-top {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 14px; gap: 12px;
  }
  .fi-search-wrap { flex: 1; position: relative; }
  .fi-search-icon {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    color: var(--txt-3); font-size: 15px; pointer-events: none;
  }
  .fi-search {
    width: 100%;
    background: var(--surf2);
    border: 1.5px solid var(--border);
    border-radius: var(--r-md);
    padding: 9px 12px 9px 36px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; color: var(--txt);
    outline: none; transition: border-color .2s, box-shadow .2s;
  }
  .fi-search::placeholder { color: var(--txt-3); }
  .fi-search:focus {
    border-color: var(--brand);
    box-shadow: 0 0 0 3px rgba(217,79,30,.1);
  }

  .fi-sort-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 9px 14px;
    background: var(--surf2);
    border: 1.5px solid var(--border);
    border-radius: var(--r-md);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600; color: var(--txt-2);
    cursor: pointer; white-space: nowrap;
    transition: all .2s;
    flex-shrink: 0;
  }
  .fi-sort-btn:hover { border-color: var(--bdr-str); color: var(--txt); }
  .fi-sort-btn.active { border-color: var(--gold); color: var(--gold); background: var(--gold-lt); }
  .fi-sort-icon { font-size: 15px; }

  /* Filter chips */
  .fi-chips { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
  .fi-chips::-webkit-scrollbar { display: none; }
  .fi-chip {
    flex-shrink: 0; display: flex; align-items: center; gap: 6px;
    padding: 7px 14px;
    background: var(--surf2);
    border: 1.5px solid var(--border);
    border-radius: var(--r-full);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600; color: var(--txt-2);
    cursor: pointer; transition: all .2s; user-select: none;
  }
  .fi-chip:hover { border-color: var(--bdr-str); color: var(--txt); }
  .fi-chip.on {
    background: var(--brand-lt); border-color: rgba(217,79,30,.35);
    color: var(--brand);
  }
  .fi-chip-dot {
    width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
    background: currentColor; display: none;
  }
  .fi-chip.on .fi-chip-dot { display: block; }

  /* bottom meta row */
  .fi-bar-foot {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 12px; padding-top: 12px;
    border-top: 1px solid var(--border);
  }
  .fi-count { font-size: 13px; color: var(--txt-3); font-weight: 500; }
  .fi-count b { color: var(--txt); font-weight: 700; }
  .fi-clear {
    font-size: 12px; font-weight: 700; color: var(--brand);
    background: var(--brand-lt); border: 1.5px solid rgba(217,79,30,.15);
    border-radius: var(--r-full); padding: 4px 12px;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: all .15s;
  }
  .fi-clear:hover { background: rgba(217,79,30,.12); }

  /* ── SORT SHEET ── */
  .fi-overlay {
    position: fixed; inset: 0;
    background: rgba(28,24,21,.4); backdrop-filter: blur(6px);
    z-index: 40; opacity: 0; pointer-events: none; transition: opacity .3s;
  }
  .fi-overlay.show { opacity: 1; pointer-events: all; }
  .fi-sheet {
    position: fixed; bottom: 0; left: 50%;
    transform: translateX(-50%) translateY(110%);
    width: 100%; max-width: 480px;
    background: var(--surface);
    border-radius: var(--r-xl) var(--r-xl) 0 0;
    padding: 0 0 34px; z-index: 50;
    transition: transform .35s cubic-bezier(.32,.72,0,1);
    box-shadow: 0 -6px 40px rgba(28,24,21,.14);
  }
  .fi-sheet.open { transform: translateX(-50%) translateY(0); }
  .fi-sheet-pill {
    width: 36px; height: 4px; background: var(--bdr-str);
    border-radius: 2px; margin: 14px auto 0;
  }
  .fi-sheet-head {
    padding: 14px 22px 14px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .fi-sheet-title {
    font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700;
    color: var(--txt);
  }
  .fi-sheet-close {
    width: 32px; height: 32px;
    background: var(--surf2); border: 1.5px solid var(--border);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 16px; color: var(--txt-2);
    transition: all .15s;
  }
  .fi-sheet-close:hover { border-color: var(--bdr-str); color: var(--txt); }
  .fi-sort-opts { padding: 12px 18px 0; display: flex; flex-direction: column; gap: 6px; }
  .fi-sort-opt {
    display: flex; align-items: center; gap: 14px;
    padding: 13px 16px;
    background: var(--surf2); border: 1.5px solid var(--border);
    border-radius: var(--r-md); cursor: pointer;
    transition: all .18s; font-family: 'DM Sans', sans-serif;
  }
  .fi-sort-opt:hover { border-color: var(--bdr-str); background: var(--bg); }
  .fi-sort-opt.active { background: var(--gold-lt); border-color: var(--gold); }
  .fi-sort-opt-icon { font-size: 20px; flex-shrink: 0; }
  .fi-sort-opt-info {}
  .fi-sort-opt-name { font-size: 14px; font-weight: 700; color: var(--txt); }
  .fi-sort-opt-desc { font-size: 11px; color: var(--txt-3); margin-top: 1px; }
  .fi-sort-opt.active .fi-sort-opt-name { color: var(--gold); }
  .fi-sort-check {
    margin-left: auto; width: 20px; height: 20px;
    background: var(--gold); border-radius: 50%;
    display: none; align-items: center; justify-content: center;
    color: #fff; font-size: 11px;
  }
  .fi-sort-opt.active .fi-sort-check { display: flex; }

  /* ── GRID ── */
  .fi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
  @media(max-width:600px){ .fi-grid { grid-template-columns: 1fr; } }

  /* ── EMPTY STATE ── */
  .fi-empty {
    grid-column: 1/-1;
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: var(--r-xl); padding: 64px 32px;
    text-align: center; box-shadow: var(--sh-xs);
  }
  .fi-empty-icon { font-size: 52px; margin-bottom: 16px; }
  .fi-empty-title {
    font-family: 'Fraunces', serif;
    font-size: 22px; font-weight: 700; color: var(--txt); margin-bottom: 8px;
  }
  .fi-empty-sub { font-size: 14px; color: var(--txt-3); line-height: 1.6; }
  .fi-empty-btn {
    margin-top: 20px; padding: 10px 22px;
    background: var(--brand); color: #fff;
    border: none; border-radius: var(--r-full);
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: background .2s;
  }
  .fi-empty-btn:hover { background: var(--brand-hv); }

  /* ── LOADING STATE ── */
  .fi-skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
  .fi-skel {
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: var(--r-lg); overflow: hidden;
    animation: shimmer 1.5s infinite;
  }
  .fi-skel-img { height: 180px; background: var(--surf2); }
  .fi-skel-body { padding: 16px; }
  .fi-skel-line {
    height: 14px; background: var(--surf2);
    border-radius: var(--r-full); margin-bottom: 10px;
  }
  .fi-skel-line.short { width: 55%; }
  @keyframes shimmer {
    0%,100% { opacity: 1; } 50% { opacity: .55; }
  }

  /* ── ERROR STATE ── */
  .fi-error {
    background: #FFF5F3; border: 1.5px solid #FCCAB8;
    border-radius: var(--r-xl); padding: 48px 32px;
    text-align: center; max-width: 480px; margin: 0 auto;
  }
  .fi-error-icon { font-size: 44px; margin-bottom: 14px; }
  .fi-error-title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700; color: var(--txt); margin-bottom: 8px; }
  .fi-error-msg { font-size: 14px; color: var(--txt-2); margin-bottom: 20px; line-height: 1.6; }
  .fi-retry {
    padding: 11px 24px;
    background: var(--brand); color: #fff;
    border: none; border-radius: var(--r-full);
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: background .2s;
  }
  .fi-retry:hover { background: var(--brand-hv); }

  /* ── ACTIVE SORT LABEL ── */
  .fi-sort-label {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: .8px; color: var(--gold); margin-left: 2px;
  }
`;

/* ── Sort config ── */
const SORT_OPTIONS = [
  { value: 'name',   label: 'Name',   desc: 'A to Z alphabetically',  icon: '🔤' },
  { value: 'price',  label: 'Price',  desc: 'Lowest price first',      icon: '💰' },
  { value: 'rating', label: 'Rating', desc: 'Highest rated first',     icon: '⭐' },
];

/* ── Filter config ── */
const FILTER_CHIPS = [
  { key: 'vegan',         label: '🌱 Vegan'       },
  { key: 'glutenFree',    label: '🌾 Gluten-Free' },
  { key: 'availableOnly', label: '✅ Available'   },
];

const FoodItems = () => {
  const { token } = useAuth();
  const { itemCount, finalAmount } = useCart();
  const navigate = useNavigate();
  
  const [foodItems,   setFoodItems]   = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [query,       setQuery]       = useState('');
  const [filters,     setFilters]     = useState({ 
    vegan: false, 
    glutenFree: false, 
    availableOnly: true,
    category: null
  });
  const [sortBy,      setSortBy]      = useState('name');
  const [showSort,    setShowSort]    = useState(false);
  const searchRef = useRef(null);

  useEffect(() => { 
    fetchData(); 
  }, [token]);

  const fetchData = async () => {
    // if (!isAuthenticated()) {
    //   setError('Please log in to view menu items');
    //   setLoading(false);
    //   return;
    // }
    try {
      setLoading(true); setError(null);
      
      // Fetch both food items and categories in parallel
      const [apiData, categoriesData] = await Promise.all([
        foodItemsApi.getAll(),
        categoriesApi.getAll()
      ]);
      
      setFoodItems(apiData.map(transformFoodItem));
      setCategories(categoriesData.map(transformCategory).filter(cat => cat.isActive));
    } catch (err) {
      setError(err.message || 'Failed to fetch menu data');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedItems = foodItems
    .filter(item => {
      if (query && !item.name?.toLowerCase().includes(query.toLowerCase())) return false;
      if (filters.vegan         && !item.isVegan)     return false;
      if (filters.glutenFree    && !item.isGlutenFree) return false;
      if (filters.availableOnly && !item.isAvailable)  return false;
      if (filters.category && !item.categories.includes(filters.category)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price')  return (a.price || 0) - (b.price || 0);
      if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
      return (a.name || '').localeCompare(b.name || '');
    });

  const toggleFilter = key => setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleCategory = categoryName => {
    setFilters(prev => ({ 
      ...prev, 
      category: prev.category === categoryName ? null : categoryName 
    }));
  };
  const clearAll = () => {
    setFilters({ vegan: false, glutenFree: false, availableOnly: true, category: null });
    setQuery('');
    if (searchRef.current) searchRef.current.value = '';
  };
  const activeFilterCount = Object.values(filters).filter(val => val && val !== null).length;
  const sortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label;

  /* ── Loading ── */
  if (loading) return (
    <div className="fi-root">
      <style>{css}</style>
      <div className="fi-page">
        <div className="fi-hero" style={{ marginBottom: 32 }}>
          <div>
            <div className="fi-hero-eyebrow">Our Menu</div>
            <h1 className="fi-hero-title">Loading <em>dishes…</em></h1>
          </div>
        </div>
        <div className="fi-skeleton-grid">
          {[1,2,3,4,5,6].map(i => (
            <div className="fi-skel" key={i} style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="fi-skel-img" />
              <div className="fi-skel-body">
                <div className="fi-skel-line" />
                <div className="fi-skel-line short" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className="fi-root">
      <style>{css}</style>
      <div className="fi-page" style={{ display:'flex', justifyContent:'center', paddingTop: 80 }}>
        <div className="fi-error">
          <div className="fi-error-icon">⚠️</div>
          <div className="fi-error-title">Couldn&apos;t load menu</div>
          <div className="fi-error-msg">{error}</div>
          <button className="fi-retry" onClick={fetchData}>Try Again</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fi-root">
      <style>{css}</style>
      <div className={`fi-page ${itemCount > 0 ? 'with-cart' : ''}`}>

        {/* ── Hero Header ── */}
        <div className="fi-hero">
          <div className="fi-hero-left">
            <div className="fi-hero-eyebrow">Today&apos;s Selection</div>
            <h1 className="fi-hero-title">Our <em>Menu</em></h1>
            <p className="fi-hero-sub">Freshly curated dishes, crafted with care</p>
          </div>
          <div className="fi-hero-badge">
            <div className="fi-hero-badge-num">{filteredAndSortedItems.length}</div>
            <div className="fi-hero-badge-lbl">Items Found</div>
          </div>
        </div>

        {/* ── Filter / Sort Bar ── */}
        <div className="fi-bar">

          {/* Search + Sort button */}
          <div className="fi-bar-top">
            <div className="fi-search-wrap">
              <span className="fi-search-icon">🔍</span>
              <input
                ref={searchRef}
                className="fi-search"
                type="text"
                placeholder="Search dishes…"
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <button
              className={`fi-sort-btn ${activeFilterCount > 0 || sortBy !== 'name' ? 'active' : ''}`}
              onClick={() => setShowSort(true)}
            >
              <span className="fi-sort-icon">↕️</span>
              Sort
              {sortBy !== 'name' && <span className="fi-sort-label">{sortLabel}</span>}
            </button>
          </div>

          {/* Filter chips */}
          <div className="fi-chips">
            {/* Static filter chips */}
            {FILTER_CHIPS.map(({ key, label }) => (
              <button
                key={key}
                className={`fi-chip ${filters[key] ? 'on' : ''}`}
                onClick={() => toggleFilter(key)}
              >
                <span className="fi-chip-dot" />
                {label}
              </button>
            ))}
            
            {/* Dynamic category chips */}
            {categories.map((category) => (
              <button
                key={category.id}
                className={`fi-chip ${filters.category === category.name ? 'on' : ''}`}
                onClick={() => toggleCategory(category.name)}
              >
                <span className="fi-chip-dot" />
                🍽️ {category.name}
              </button>
            ))}
          </div>

          {/* Footer meta */}
          <div className="fi-bar-foot">
            <span className="fi-count">
              <b>{filteredAndSortedItems.length}</b> of <b>{foodItems.length}</b> items
            </span>
            {(activeFilterCount > 0 || query || sortBy !== 'name') && (
              <button className="fi-clear" onClick={clearAll}>Reset all</button>
            )}
          </div>
        </div>

        {/* ── Food Grid ── */}
        <div className="fi-grid">
          {filteredAndSortedItems.length === 0 ? (
            <div className="fi-empty">
              <div className="fi-empty-icon">🍽️</div>
              <div className="fi-empty-title">
                {foodItems.length === 0 ? 'Menu is empty' : 'No matches found'}
              </div>
              <p className="fi-empty-sub">
                {foodItems.length === 0
                  ? 'No menu items are currently available.'
                  : 'Try adjusting your filters or search term.'}
              </p>
              {foodItems.length > 0 && (
                <button className="fi-empty-btn" onClick={clearAll}>Clear Filters</button>
              )}
            </div>
          ) : (
            filteredAndSortedItems.map((item, index) => (
              <FoodItemCard 
                key={item.id || index} 
                item={item} 
              />
            ))
          )}
        </div>
      </div>
      {/* cart div */}
      {itemCount > 0 && (
  <div
    style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '1200px',
      zIndex: 1000,
      padding: '0 16px 16px',
      pointerEvents: 'none',
    }}
  >
    <style>{`
      /* ── Keyframes ── */
      @keyframes cartSlideUp {
        from { opacity: 0; transform: translateY(100%) scale(0.96); }
        to   { opacity: 1; transform: translateY(0)   scale(1);    }
      }
      @keyframes auraBreath {
        0%,100% { opacity: 0.55; transform: scaleX(1)   scaleY(1);   }
        50%     { opacity: 0.80; transform: scaleX(1.04) scaleY(1.3); }
      }
      @keyframes iconFloat {
        0%,100% { transform: translateY(0);   }
        50%     { transform: translateY(-3px); }
      }
      @keyframes badgePop {
        0%         { transform: scale(0) rotate(-15deg); opacity: 0; }
        65%        { transform: scale(1.25) rotate(4deg);  opacity: 1; }
        100%       { transform: scale(1) rotate(0deg);   opacity: 1; }
      }
      @keyframes shimmerSweep {
        0%   { left: -80%; }
        100% { left: 160%; }
      }
      @keyframes progressFill {
        from { width: 0%; }
        to   { width: var(--progress-w, 62%); }
      }
      @keyframes rippleOut {
        to { transform: scale(3.5); opacity: 0; }
      }
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes spinCoin {
        0%  { transform: rotateY(0deg);   }
        50% { transform: rotateY(180deg); }
        100%{ transform: rotateY(360deg); }
      }

      /* ── Outer shell ── */
      .cart-bar-root {
        position: relative;
        animation: cartSlideUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        pointer-events: all;
      }

      /* Ambient glow halo beneath card */
      .cart-bar-root::before {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 75%;
        height: 40px;
        background: radial-gradient(ellipse at center, rgba(251,172,24,0.55) 0%, transparent 70%);
        animation: auraBreath 3s ease-in-out infinite;
        pointer-events: none;
        z-index: -1;
        filter: blur(6px);
      }

      /* ── Card ── */
      .cart-bar-inner {
        position: relative;
        overflow: hidden;
        border-radius: 24px;
        background: linear-gradient(155deg,
          rgba(255,253,245,0.97) 0%,
          rgba(255,248,225,0.97) 50%,
          rgba(255,238,190,0.97) 100%);
        border: 1.5px solid rgba(255,185,60,0.55);
        box-shadow:
          0 2px 0 0 rgba(255,255,255,0.9) inset,
          0 -1px 0 0 rgba(210,140,20,0.25) inset,
          0 8px 32px rgba(200,120,0,0.14),
          0 2px 8px  rgba(200,120,0,0.08);
        padding: 0;
      }

      /* Noise texture overlay */
      .cart-bar-inner::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 24px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
        pointer-events: none;
        z-index: 0;
        opacity: 0.5;
      }

      /* ── Progress strip (top accent) ── */
      .cart-progress-strip {
        position: relative;
        height: 3px;
        background: rgba(200,140,20,0.12);
        border-radius: 24px 24px 0 0;
        overflow: hidden;
      }
      .cart-progress-fill {
        height: 100%;
        width: var(--progress-w, 62%);
        background: linear-gradient(90deg, #FBAC18, #FFD966, #E67E00);
        border-radius: 24px;
        animation: progressFill 1.1s cubic-bezier(0.34,1.1,0.64,1) 0.3s both;
        position: relative;
      }
      .cart-progress-fill::after {
        content: '';
        position: absolute;
        right: 0; top: 0; bottom: 0;
        width: 6px;
        background: rgba(255,255,255,0.7);
        border-radius: 50%;
        filter: blur(2px);
      }

      /* ── Body row ── */
      .cart-body {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px 14px 14px;
      }

      /* ── Icon ── */
      .cart-icon-wrap {
        position: relative;
        width: 52px;
        height: 52px;
        border-radius: 18px;
        background: linear-gradient(145deg, #FFD060 0%, #F59200 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        flex-shrink: 0;
        animation: iconFloat 3s ease-in-out infinite;
        box-shadow:
          0 4px 14px rgba(245,146,0,0.35),
          0 1px 0 rgba(255,255,255,0.6) inset;
      }
      .cart-badge {
        position: absolute;
        top: -7px;
        right: -7px;
        min-width: 22px;
        height: 22px;
        padding: 0 6px;
        background: linear-gradient(135deg, #fff 0%, #FFF3C4 100%);
        color: #974A00;
        border-radius: 30px;
        font-size: 11px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Syne', sans-serif;
        box-shadow: 0 2px 8px rgba(180,100,0,0.3), 0 0 0 1.5px rgba(255,185,60,0.5);
        animation: badgePop 0.45s cubic-bezier(0.22,1,0.36,1) both;
        transform-origin: center;
      }

      /* ── Text zone ── */
      .cart-text-block { flex: 1; min-width: 0; }
      .cart-price {
        font-family: 'Syne', sans-serif;
        font-size: 22px;
        font-weight: 800;
        background: linear-gradient(120deg, #B85C00 10%, #E8930A 55%, #C96A00 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        letter-spacing: -0.8px;
        line-height: 1.1;
        animation: fadeInUp 0.4s 0.15s both;
      }
      .cart-sub {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        color: #A06020;
        font-weight: 600;
        margin-top: 5px;
        letter-spacing: 0.15px;
        background: rgba(255,185,60,0.18);
        padding: 3px 10px 3px 8px;
        border-radius: 20px;
        border: 1px solid rgba(255,185,60,0.35);
        animation: fadeInUp 0.4s 0.22s both;
      }
      .cart-sub-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #E8930A;
        display: inline-block;
        flex-shrink: 0;
      }

      /* ── Divider ── */
      .cart-divider {
        width: 1px;
        height: 36px;
        background: linear-gradient(180deg, transparent, rgba(210,140,20,0.3), transparent);
        flex-shrink: 0;
      }

      /* ── Free delivery note ── */
      .cart-delivery-note {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        flex-shrink: 0;
        padding: 0 4px;
        animation: fadeInUp 0.4s 0.28s both;
      }
      .cart-delivery-icon {
        font-size: 15px;
        animation: spinCoin 4s linear infinite;
        display: inline-block;
      }
      .cart-delivery-text {
        font-size: 9.5px;
        font-weight: 700;
        color: #7A4700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        text-align: center;
        line-height: 1.2;
        opacity: 0.75;
      }

      /* ── Checkout button ── */
      .cart-checkout-btn {
        position: relative;
        overflow: hidden;
        border: none;
        border-radius: 16px;
        padding: 14px 24px;
        font-family: 'Syne', sans-serif;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 0.2px;
        color: #5A2800;
        cursor: pointer;
        flex-shrink: 0;
        background: linear-gradient(160deg, #FFD060 0%, #FBAC18 45%, #F08000 100%);
        box-shadow:
          0 6px 20px rgba(240,128,0,0.4),
          0 1px 0 rgba(255,255,255,0.55) inset,
          0 -2px 0 rgba(160,80,0,0.25) inset;
        transition: transform 0.18s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.18s;
        animation: fadeInUp 0.4s 0.32s both;
      }
      /* Shimmer sweep */
      .cart-checkout-btn::before {
        content: '';
        position: absolute;
        top: 0; bottom: 0;
        width: 50%;
        background: linear-gradient(90deg, transparent, rgba(255,255,220,0.55), transparent);
        transform: skewX(-15deg);
        animation: shimmerSweep 2.4s ease-in-out infinite;
        pointer-events: none;
      }
      /* Ripple layer */
      .cart-checkout-btn::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 16px;
        background: radial-gradient(circle at center, rgba(255,255,255,0.4) 0%, transparent 65%);
        opacity: 0;
        transition: opacity 0.2s;
      }
      .cart-checkout-btn:hover {
        transform: scale(1.04) translateY(-2px);
        box-shadow:
          0 12px 28px rgba(240,128,0,0.5),
          0 1px 0 rgba(255,255,255,0.6) inset,
          0 -2px 0 rgba(160,80,0,0.3) inset;
      }
      .cart-checkout-btn:hover::after { opacity: 1; }
      .cart-checkout-btn:active {
        transform: scale(0.96) translateY(0);
        box-shadow: 0 3px 10px rgba(240,128,0,0.3);
      }
      .cart-btn-inner {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 9px;
      }
      .cart-btn-label { white-space: nowrap; }
      .cart-btn-arrow {
        display: inline-flex;
        align-items: center;
        width: 22px;
        height: 22px;
        border-radius: 8px;
        background: rgba(90,40,0,0.12);
        justify-content: center;
        font-size: 13px;
        transition: transform 0.2s cubic-bezier(0.34,1.3,0.64,1);
      }
      .cart-checkout-btn:hover .cart-btn-arrow {
        transform: translateX(3px);
        background: rgba(90,40,0,0.18);
      }
    `}</style>

    <div className="cart-bar-root">
      <div className="cart-bar-inner">

        {/* Top progress strip */}
        <div className="cart-progress-strip">
          <div
            className="cart-progress-fill"
            style={{ '--progress-w': `${Math.min((finalAmount / 50) * 100, 100)}%` }}
          />
        </div>

        {/* Main body */}
        <div className="cart-body">

          {/* Cart icon + badge */}
          <div className="cart-icon-wrap">
            🛒
            <div className="cart-badge" key={itemCount}>
              {itemCount}
            </div>
          </div>

          {/* Price + item count */}
          <div className="cart-text-block">
            <div className="cart-price">₹{finalAmount.toFixed(2)}</div>
            <div className="cart-sub">
              <span className="cart-sub-dot" />
              {itemCount} item{itemCount !== 1 ? 's' : ''} selected
            </div>
          </div>

          {/* Vertical rule */}
          <div className="cart-divider" aria-hidden="true" />

          {/* CTA */}
          <button
            className="cart-checkout-btn"
            onClick={() => navigate('/checkout')}
            aria-label={`Proceed to checkout — ${itemCount} item${itemCount !== 1 ? 's' : ''}, total ₹${finalAmount.toFixed(2)}`}
          >
            <span className="cart-btn-inner">
              <span className="cart-btn-label">Checkout</span>
              <span className="cart-btn-arrow">→</span>
            </span>
          </button>

        </div>
      </div>
    </div>
  </div>
)}
      {/* ── Sort Bottom Sheet ── */}
      <div className={`fi-overlay ${showSort ? 'show' : ''}`} onClick={() => setShowSort(false)} />
      <div className={`fi-sheet ${showSort ? 'open' : ''}`}>
        <div className="fi-sheet-pill" />
        <div className="fi-sheet-head">
          <div className="fi-sheet-title">Sort By</div>
          <div className="fi-sheet-close" onClick={() => setShowSort(false)}>✕</div>
        </div>
        <div className="fi-sort-opts">
          {SORT_OPTIONS.map(opt => (
            <div
              key={opt.value}
              className={`fi-sort-opt ${sortBy === opt.value ? 'active' : ''}`}
              onClick={() => { setSortBy(opt.value); setShowSort(false); }}
            >
              <span className="fi-sort-opt-icon">{opt.icon}</span>
              <div className="fi-sort-opt-info">
                <div className="fi-sort-opt-name">{opt.label}</div>
                <div className="fi-sort-opt-desc">{opt.desc}</div>
              </div>
              <span className="fi-sort-check">✓</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FoodItems;