import { useState, useEffect } from "react";
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../services/apiService';

/* ─────────────────────────────────────────────
   FoodItemCard — Mobile-first, fully interactive with cart integration
   Props: item (object)
─────────────────────────────────────────── */
const FoodItemCard = ({ item = {} }) => {
  const navigate = useNavigate();
  const { addItem, updateQuantity: updateCartQuantity, removeItem, cart } = useCart();
  
  const {
    id,
    name            = "Unnamed Item",
    description     = "No description available",
    price           = 0,
    image,
    isVegan         = false,
    isGlutenFree    = false,
    spiceLevel      = 0,
    preparationTime,
    calories,
    isAvailable     = true,
    categories      = [],
    ingredients     = [],
    allergens       = [],
    averageRating   = 0,
    reviewCount     = 0,
    isNew           = false,
    isHot           = false,
  } = item;

  // Get current quantity from cart
  const currentCartItem = cart.items.find(cartItem => cartItem.foodItemId === id);
  const cartQuantity = currentCartItem ? currentCartItem.quantity : 0;

  const [qty,           setQty]       = useState(cartQuantity);
  const [wishlisted,    setWish]      = useState(false);
  const [ingrOpen,      setIngrOpen]  = useState(false);
  const [alrgOpen,      setAlrgOpen]  = useState(false);
  const [imgErr,        setImgErr]    = useState(false);
  const [imgModal,      setImgModal]  = useState(false);

  // Sync quantity with cart changes
  useEffect(() => {
    setQty(cartQuantity);
  }, [cartQuantity]);

  const fmtTime = (m) => {
    if (!m || isNaN(m)) return "Varies";
    return m < 60 ? `${m} min` : `${Math.floor(m/60)}h${m%60?` ${m%60}m`:""}`;
  };

  const handleQuantityChange = (newQty) => {
    if (!isAuthenticated()) {
      navigate('/');
      return;
    }

    const cartIndex = cart.items.findIndex(
      cartItem => cartItem.foodItemId === id
    );

    if (newQty <= 0) {
      // Remove from cart
      if (cartIndex > -1) {
        removeItem(cartIndex);
      }
    } else if (newQty > qty) {
      // Adding items to cart
      const quantityToAdd = newQty - qty;
      addItem(item, quantityToAdd);
    } else if (newQty < qty && cartIndex > -1) {
      // Decreasing quantity
      updateCartQuantity(cartIndex, newQty);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated()) {
      navigate('/');
      return;
    }
    
    addItem(item, 1);
  };

  return (
    <div style={{
      background: "#fff",
      borderRadius: 24,
      overflow: "hidden",
      border: "1px solid #efefef",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>

      {/* ── Image Lightbox Modal ── */}
      {imgModal && image && !imgErr && (
        <div
          onClick={() => setImgModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, cursor: 'zoom-out',
          }}
        >
          <button
            onClick={() => setImgModal(false)}
            style={{
              position: 'absolute', top: 18, right: 18,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)',
              color: '#fff', fontSize: 20, lineHeight: 1,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Close image"
          >✕</button>
          <img
            src={image}
            alt={name}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '100%', maxHeight: '90vh',
              borderRadius: 16, objectFit: 'contain',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              cursor: 'default',
            }}
          />
          <div style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif", pointerEvents: 'none',
          }}>{name}</div>
        </div>
      )}

      {/* ── Image ── */}
      <div style={{ position: "relative", height: 200, background: "#f0eeea", overflow: "hidden" }}>
        {image && !imgErr ? (
          <img src={image} alt={name} onError={() => setImgErr(true)}
            onClick={() => setImgModal(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", cursor: 'zoom-in' }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", background: "#f0eeea" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="#ccc" strokeWidth="1.2"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="#ccc"/>
              <path d="M21 15l-5-5L5 21" stroke="#ccc" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
        )}

        {/* gradient */}
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(160deg,transparent 40%,rgba(0,0,0,.18) 100%)",
          pointerEvents:"none" }} />

        {/* Tags */}
        <div style={{ position:"absolute", top:12, left:12, display:"flex", gap:6 }}>
          {isHot && <span style={tagStyle("#fff3e0","#e65100")}>🔥 Hot</span>}
          {isVegan && <span style={tagStyle("#e8f5e9","#2e7d32")}>🌱 Vegan</span>}
          {isGlutenFree && <span style={tagStyle("#f3e8ff","#7c2d12")}>🌾 Gluten-Free</span>}
          {isNew && <span style={tagStyle("#e3f2fd","#1565c0")}>✨ New</span>}
        </div>

        {/* Wishlist */}
        <button onClick={() => setWish(w => !w)} style={{
          position:"absolute", top:12, right:12,
          width:38, height:38,
          background:"rgba(255,255,255,.9)",
          border:"none", borderRadius:"50%",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", WebkitTapHighlightColor:"transparent",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24"
            fill={wishlisted ? "#ef4444" : "none"}
            stroke={wishlisted ? "#ef4444" : "#555"}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
        </button>

        {/* Rating pill */}
        <div style={{
          position:"absolute", bottom:12, left:12,
          background:"rgba(255,255,255,.92)", backdropFilter:"blur(8px)",
          borderRadius:100, padding:"5px 10px",
          display:"flex", alignItems:"center", gap:5,
        }}>
          <span style={{ color:"#f5a623", fontSize:12 }}>★</span>
          <span style={{ fontSize:12, fontWeight:600, color:"#222" }}>{averageRating.toFixed(1)}</span>
          {reviewCount > 0 && <span style={{ fontSize:10, color:"#aaa" }}>({reviewCount})</span>}
        </div>

        {/* Time pill */}
        <div style={{
          position:"absolute", bottom:12, right:12,
          background:"rgba(255,255,255,.92)", backdropFilter:"blur(8px)",
          borderRadius:100, padding:"5px 10px",
          display:"flex", alignItems:"center", gap:4,
          fontSize:11, fontWeight:500, color:"#555",
        }}>
          <svg width="11" height="11" viewBox="0 0 20 20" fill="#888">
            <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"/>
          </svg>
          {fmtTime(preparationTime)}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding:16 }}>

        {/* Name + Price */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:6 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, color:"#111", lineHeight:1.2, flex:1, marginRight:10 }}>
            {name}
          </div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:700, color:"#111", whiteSpace:"nowrap" }}>
            ₹{price.toFixed(2)}
          </div>
        </div>
<p
  style={{
    maxHeight: "98px",
    overflowY: "auto",
    scrollBehavior: "smooth",
  }}
>
  {description}
</p>

        {/* Categories */}
        {categories.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:12 }}>
            {categories.map((category, i) => (
              <span key={i} style={{ 
                fontSize:10.5, fontWeight:500, padding:"3px 8px",
                borderRadius:100, background:"#f8fafc", color:"#475569",
                border:"1px solid #e2e8f0"
              }}>
                {category}
              </span>
            ))}
          </div>
        )}

        {/* Info Row: Spice & Calories */}
        {(spiceLevel > 0 || calories) && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            {spiceLevel > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:10.5, fontWeight:500, color:"#bbb", textTransform:"uppercase", letterSpacing:".8px" }}>Spice</span>
                <div style={{ display:"flex", gap:4 }}>
                  {[0,1,2,3,4].map(i => (
                    <div key={i} style={{ width:7, height:7, borderRadius:"50%",
                      background: i < spiceLevel ? "#f5a623" : "#e8e8e8" }} />
                  ))}
                </div>
              </div>
            )}
            {calories && (
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:10.5, fontWeight:500, color:"#bbb", textTransform:"uppercase", letterSpacing:".8px" }}>Calories</span>
                <span style={{ fontSize:12, fontWeight:600, color:"#666" }}>{calories}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ height:1, background:"#f4f4f4", marginBottom:12 }} />

        {/* Ingredients accordion */}
        {ingredients.length > 0 && (
          <>
            <div onClick={() => setIngrOpen(o => !o)}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                cursor:"pointer", padding:"2px 0", marginBottom:4 }}>
              <span style={{ fontSize:11, fontWeight:500, color:"#bbb", textTransform:"uppercase", letterSpacing:".8px" }}>
                Ingredients ({ingredients.length})
              </span>
              <span style={{ fontSize:16, color:"#ccc", transform: ingrOpen ? "rotate(180deg)" : "rotate(0deg)",
                display:"inline-block", transition:"transform .25s" }}>⌄</span>
            </div>
            {ingrOpen && (
              <p style={{ fontSize:11.5, color:"#aaa", lineHeight:1.65, paddingBottom:8 }}>
                {ingredients.join(", ")}
              </p>
            )}
          </>
        )}

        {/* Allergens accordion */}
        {allergens.length > 0 && (
          <>
            <div onClick={() => setAlrgOpen(o => !o)}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                cursor:"pointer", padding:"2px 0", marginBottom:4 }}>
              <span style={{ fontSize:11, fontWeight:500, color:"#bbb", textTransform:"uppercase", letterSpacing:".8px" }}>
                Allergens ({allergens.length})
              </span>
              <span style={{ fontSize:16, color:"#ccc", transform: alrgOpen ? "rotate(180deg)" : "rotate(0deg)",
                display:"inline-block", transition:"transform .25s" }}>⌄</span>
            </div>
            {alrgOpen && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:5, paddingBottom:8 }}>
                {allergens.map((a, i) => (
                  <span key={i} style={{ fontSize:10.5, fontWeight:500, padding:"3px 10px",
                    borderRadius:100, background:"#fff7ed", color:"#c2410c", border:"1px solid #fed7aa" }}>
                    ⚠️ {a}
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        <div style={{ height:1, background:"#f4f4f4", margin:"8px 0 12px" }} />

        {/* Quantity Selector - Full Width */}
        <div style={{ opacity: isAvailable ? 1 : 0.4 }}>
          {qty === 0 ? (
            // Add to Cart Button  
            <div>
              <button 
                onClick={handleAddToCart} 
                disabled={!isAvailable}
                style={{
                  width: '100%', 
                  height: 42, 
                  border: 'none', 
                  borderRadius: 13,
                  background: !isAvailable ? '#f0f0f0' : '#111',
                  color: !isAvailable ? '#bbb' : '#fff',
                  fontFamily: "'Syne',sans-serif", 
                  fontSize: 13.5, 
                  fontWeight: 700,
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                  letterSpacing: '.4px', 
                  transition: 'background .2s',
                }}
              >
                {!isAvailable ? 'Not Available' : '+ Add to Cart'}
              </button>
            </div>
          ) : (
            // Quantity Controls
            <div style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', borderRadius: 13, overflow: 'hidden' }}>
              <button 
                onClick={() => handleQuantityChange(Math.max(0, qty - 1))} 
                disabled={!isAvailable}
                style={{ 
                  width: 42, 
                  height: 42, 
                  border: 'none', 
                  background: 'none', 
                  fontSize: 20,
                  color: '#555', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 300 
                }}
              >
                −
              </button>
              <div style={{ 
                flex: 1, 
                textAlign: 'center', 
                fontFamily: "'Syne',sans-serif", 
                fontSize: 15, 
                fontWeight: 700, 
                color: '#111',
                padding: '0 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <span>{qty}</span>
                <span style={{ fontSize: 12, color: '#666' }}>·</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>
                  ₹{(price * qty).toFixed(2)}
                </span>
              </div>
              <button 
                onClick={() => handleQuantityChange(qty + 1)} 
                disabled={!isAvailable}
                style={{ 
                  width: 42, 
                  height: 42, 
                  border: 'none', 
                  background: 'none', 
                  fontSize: 20,
                  color: '#555', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 300 
                }}
              >
                +
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

const tagStyle = (bg, color) => ({
  fontSize:10, fontWeight:600, padding:"4px 10px",
  borderRadius:100, letterSpacing:".4px",
  textTransform:"uppercase", background:bg, color,
});

export default FoodItemCard;