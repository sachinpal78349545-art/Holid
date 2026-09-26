import React, { ReactNode, useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Crown,
  Diamond,
  Image as ImageIcon,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { useToast } from "../lib/toastContext";
import { UserProfile } from "../lib/userService";
import { ref as dbRef, onValue, off, update } from "firebase/database";
import { db } from "../lib/firebase";

/* =========================================================
   TYPES
   ========================================================= */

type StoreTab = "frames" | "themes" | "effects" | "badges";

interface InventoryItem {
  itemId: string;
  purchasedAt: number;
  expiresAt: number;
  equipped: boolean;
}

interface FirebaseItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  icon?: string;
  tag?: string;
  desc?: string;
  enabled?: boolean;
  rarity?: string;
  iconType?: string;
  validity?: number;
  validityType?: "day" | "month" | "year";
}

type PreviewItem =
  | { type: "frame"; name: string; image: string; price: number }
  | { type: "theme"; name: string; image: string; price: number }
  | { type: "effect"; name: string; image: string; price: number }
  | { type: "badge"; name: string; icon: ReactNode; price: number };

interface Props {
  user: UserProfile;
  onBack: () => void;
  onUpdate: (u: UserProfile) => void;
}

/* =========================================================
   CONSTANTS
   ========================================================= */

const BADGE_ICONS: Record<string, ReactNode> = {
  crown: <Crown size={52} strokeWidth={1.7} />,
  shield: <ShieldCheck size={52} strokeWidth={1.7} />,
  sparkles: <Sparkles size={52} strokeWidth={1.7} />,
  zap: <Zap size={52} strokeWidth={1.7} />,
};

const computeExpiry = (
  validity: number = 1,
  type: "day" | "month" | "year" = "day"
): number => {
  const ms =
    type === "day" ? validity * 24 * 60 * 60 * 1000 :
    type === "month" ? validity * 30 * 24 * 60 * 60 * 1000 :
    validity * 365 * 24 * 60 * 60 * 1000;
  return Date.now() + ms;
};

/* =========================================================
   HELPER
   ========================================================= */

function truncateName(name: string, maxLength = 16) {
  if (!name) return "";
  if (name.length <= maxLength) return name;
  return `${name.slice(0, maxLength)}...`;
}

/* =========================================================
   MAIN STORE PAGE
   ========================================================= */

export default function StorePage({ user, onBack, onUpdate }: Props) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<StoreTab>("frames");
  const [selectedItem, setSelectedItem] = useState<PreviewItem | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  /* Real user data */
  const diamonds = (user as any).diamonds ?? user.coins ?? 0;
  const userAvatar = user.avatar || "https://i.pravatar.cc/300";
  const userName = user.name || "User";
  const inventory: Record<string, InventoryItem> = (user.inventory || {}) as any;

  /* Firebase items */
  const [frameItems, setFrameItems] = useState<FirebaseItem[]>([]);
  const [themeItems, setThemeItems] = useState<FirebaseItem[]>([]);
  const [effectItems, setEffectItems] = useState<FirebaseItem[]>([]);
  const [badgeItems, setBadgeItems] = useState<FirebaseItem[]>([]);

  const [loadingItems, setLoadingItems] = useState({
    frames: true,
    themes: true,
    effects: true,
    badges: true,
  });

  /* ── Load Frames ── */
  useEffect(() => {
    const r = dbRef(db, "appConfig/frames");
    const unsub = onValue(r, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const items: FirebaseItem[] = Object.values(data)
          .filter((f: any) => f.enabled !== false)
          .map((f: any) => ({
            id: f.id,
            name: f.name,
            price: f.price || 0,
            imageUrl: f.imageUrl,
            tag: f.tag,
            enabled: true,
            rarity: f.rarity || "rare",
            validity: f.validity || 1,
            validityType: f.validityType || "day",
          }));
        setFrameItems(items);
      } else {
        setFrameItems([]);
      }
      setLoadingItems((p) => ({ ...p, frames: false }));
    });
    return () => off(r, "value", unsub);
  }, []);

  /* ── Load Themes ── */
  useEffect(() => {
    const r = dbRef(db, "appConfig/themes");
    const unsub = onValue(r, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const items: FirebaseItem[] = Object.values(data)
          .filter((t: any) => t.enabled !== false)
          .map((t: any) => ({
            id: t.id,
            name: t.name,
            price: t.price || 0,
            imageUrl: t.imageUrl || t.preview,
            tag: t.tag,
            enabled: true,
            rarity: t.rarity || "common",
            validity: t.validity || 1,
            validityType: t.validityType || "day",
          }));
        setThemeItems(items);
      } else {
        setThemeItems([]);
      }
      setLoadingItems((p) => ({ ...p, themes: false }));
    });
    return () => off(r, "value", unsub);
  }, []);

  /* ── Load Effects ── */
  useEffect(() => {
    const r = dbRef(db, "appConfig/entries");
    const unsub = onValue(r, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const items: FirebaseItem[] = Object.values(data)
          .filter((e: any) => e.enabled !== false)
          .map((e: any) => ({
            id: e.id,
            name: e.name,
            price: e.price || 0,
            imageUrl: e.imageUrl,
            icon: e.icon || "🎉",
            tag: e.tag,
            desc: e.desc,
            enabled: true,
            rarity: e.rarity || "common",
            validity: e.validity || 1,
            validityType: e.validityType || "day",
          }));
        setEffectItems(items);
      } else {
        setEffectItems([]);
      }
      setLoadingItems((p) => ({ ...p, effects: false }));
    });
    return () => off(r, "value", unsub);
  }, []);

  /* ── Load Badges ── */
  useEffect(() => {
    const r = dbRef(db, "appConfig/badges");
    const unsub = onValue(r, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const items: FirebaseItem[] = Object.values(data)
          .filter((b: any) => b.enabled !== false)
          .map((b: any) => ({
            id: b.id,
            name: b.name,
            price: b.price || 0,
            imageUrl: b.imageUrl,
            iconType: b.iconType || "sparkles",
            tag: b.tag,
            enabled: true,
            rarity: b.rarity || "rare",
            validity: b.validity || 1,
            validityType: b.validityType || "day",
          }));
        setBadgeItems(items);
      } else {
        setBadgeItems([]);
      }
      setLoadingItems((p) => ({ ...p, badges: false }));
    });
    return () => off(r, "value", unsub);
  }, []);

  /* Current tab items */
  const currentItems = useMemo(() => {
    if (activeTab === "frames") return frameItems;
    if (activeTab === "themes") return themeItems;
    if (activeTab === "effects") return effectItems;
    return badgeItems;
  }, [activeTab, frameItems, themeItems, effectItems, badgeItems]);

  const isLoadingCurrent = loadingItems[
    activeTab === "frames" ? "frames" :
    activeTab === "themes" ? "themes" :
    activeTab === "effects" ? "effects" : "badges"
  ];

  const tabs = [
    { id: "frames" as StoreTab, label: "Frames", icon: <ImageIcon size={16} /> },
    { id: "themes" as StoreTab, label: "Themes", icon: <Sparkles size={16} /> },
    { id: "effects" as StoreTab, label: "Entry FX", icon: <Zap size={16} /> },
    { id: "badges" as StoreTab, label: "Badges", icon: <Crown size={16} /> },
  ];

  /* =========================================================
     BUY (Real Firebase update)
     ========================================================= */
  const handleBuy = async (item: FirebaseItem) => {
    if (diamonds < item.price) {
      showToast("Not enough 💎 Diamonds!", "warning");
      return;
    }
    if (inventory[item.id]) {
      showToast("Already owned!", "info");
      return;
    }

    setLoading(item.id);
    try {
      const newBalance = diamonds - item.price;
      const expiresAt = computeExpiry(item.validity || 1, item.validityType || "day");

      const newInventory: Record<string, InventoryItem> = {
        ...inventory,
        [item.id]: {
          itemId: item.id,
          purchasedAt: Date.now(),
          expiresAt,
          equipped: false,
        },
      };

      const updates: any = { inventory: newInventory };
      if ((user as any).diamonds !== undefined) updates.diamonds = newBalance;
      if (user.coins !== undefined) updates.coins = newBalance;

      await update(dbRef(db, `users/${user.uid}`), updates);

      const updatedUser: any = { ...user, inventory: newInventory };
      if ((user as any).diamonds !== undefined) updatedUser.diamonds = newBalance;
      if (user.coins !== undefined) updatedUser.coins = newBalance;
      onUpdate(updatedUser);

      showToast(`${item.name} purchased! ✨`, "success");
      setSelectedItem(null);
    } catch (err) {
      console.error("Purchase error:", err);
      showToast("Purchase failed", "error");
    } finally {
      setLoading(null);
    }
  };

  /* =========================================================
     EQUIP / UNEQUIP (Real Firebase)
     ========================================================= */
  const handleEquip = async (item: FirebaseItem, itemType: StoreTab) => {
    setLoading(item.id);
    const isEquipped = inventory[item.id]?.equipped;

    try {
      const newInventory: Record<string, InventoryItem> = { ...inventory };

      if (!isEquipped) {
        // Unequip others of same category
        for (const [id, inv] of Object.entries(newInventory)) {
          const otherItem =
            frameItems.find((f) => f.id === id) ||
            themeItems.find((t) => t.id === id) ||
            effectItems.find((e) => e.id === id) ||
            badgeItems.find((b) => b.id === id);
          if (!otherItem) continue;

          const isSameCategory =
            (itemType === "frames" && frameItems.some((f) => f.id === id)) ||
            (itemType === "themes" && themeItems.some((t) => t.id === id)) ||
            (itemType === "effects" && effectItems.some((e) => e.id === id)) ||
            (itemType === "badges" && badgeItems.some((b) => b.id === id));

          if (isSameCategory) {
            newInventory[id] = { ...inv, equipped: false };
          }
        }
      }

      newInventory[item.id] = {
        ...newInventory[item.id],
        equipped: !isEquipped,
      };

      const updates: any = { inventory: newInventory };

      const category = itemType === "frames" ? "frame" : itemType === "themes" ? "theme" : itemType === "effects" ? "entry" : "badge";

      if (category === "frame") updates.equippedFrame = isEquipped ? null : item.id;
      if (category === "entry") updates.equippedEntry = isEquipped ? null : item.id;
      if (category === "theme") updates.equippedTheme = isEquipped ? null : item.id;
      if (category === "badge") updates.equippedBadge = isEquipped ? null : item.id;

      await update(dbRef(db, `users/${user.uid}`), updates);

      onUpdate({ ...user, inventory: newInventory, ...updates } as any);
      showToast(
        isEquipped ? `${item.name} unequipped` : `${item.name} equipped! ✨`,
        "success"
      );
    } catch (err) {
      console.error("Equip error:", err);
      showToast("Failed", "error");
    } finally {
      setLoading(null);
    }
  };

  /* =========================================================
     AUTO-CLEAN EXPIRED ITEMS
     ========================================================= */
  useEffect(() => {
    const now = Date.now();
    let changed = false;
    const newInventory: Record<string, InventoryItem> = {};

    for (const [id, data] of Object.entries(inventory)) {
      if (data.expiresAt && data.expiresAt < now) {
        changed = true;
        continue;
      }
      newInventory[id] = data;
    }

    if (changed) {
      update(dbRef(db, `users/${user.uid}`), { inventory: newInventory }).catch(console.error);
      onUpdate({ ...user, inventory: newInventory } as any);
    }
  }, []);

  /* =========================================================
     RENDER
     ========================================================= */
  return (
    <div className="store-page">
      {/* HEADER */}
      <header className="store-header">
        <button type="button" onClick={onBack} className="store-icon-btn">
          <ArrowLeft size={22} />
        </button>

        <div className="store-title-wrap">
          <div className="store-title-icon">
            <ShoppingBag size={22} strokeWidth={2.3} />
          </div>
          <h1 className="store-title">Galaxy Store</h1>
        </div>

        <button type="button" className="store-icon-btn">
          <ShoppingBag size={22} />
        </button>
      </header>

      {/* BALANCE */}
      <section className="store-balance-wrap">
        <div className="store-balance-card">
          <div>
            <p className="store-balance-label">Available Diamonds</p>
            <div className="store-balance-value">
              <Diamond size={20} fill="#7545e8" stroke="#7545e8" />
              <span>{diamonds.toLocaleString()}</span>
            </div>
          </div>
          <button type="button" className="store-recharge-btn">
            Recharge
            <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* SUBTITLE */}
      <h2 className="store-subtitle">Choose your favourite assets</h2>

      {/* TABS */}
      <div className="store-tabs-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`store-tab ${activeTab === tab.id ? "active" : ""}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* GRID */}
      <main className="store-grid">
        {isLoadingCurrent ? (
          <div className="store-loading">
            <div className="store-spinner" />
            <p>Loading store...</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="store-loading">
            <div style={{ fontSize: 48 }}>🛍️</div>
            <p>No items available</p>
          </div>
        ) : (
          currentItems.map((item) => {
            const invData = inventory[item.id];
            const isOwned = !!invData;
            const isEquipped = !!invData?.equipped;
            const isExpired = invData?.expiresAt ? invData.expiresAt < Date.now() : false;

            if (activeTab === "badges") {
              return (
                <BadgeCard
                  key={item.id}
                  name={item.name}
                  price={item.price}
                  tag={item.tag || "NEW"}
                  icon={BADGE_ICONS[item.iconType || "sparkles"] || BADGE_ICONS.sparkles}
                  owned={isOwned}
                  equipped={isEquipped}
                  expired={isExpired}
                  loading={loading === item.id}
                  onPreview={() =>
                    setSelectedItem({
                      type: "badge",
                      name: item.name,
                      icon: BADGE_ICONS[item.iconType || "sparkles"] || BADGE_ICONS.sparkles,
                      price: item.price,
                    })
                  }
                  onBuy={() => handleBuy(item)}
                  onEquip={() => handleEquip(item, "badges")}
                />
              );
            }

            const assetType: "frame" | "theme" | "effect" =
              activeTab === "frames" ? "frame" :
              activeTab === "themes" ? "theme" : "effect";

            return (
              <AssetCard
                key={item.id}
                image={item.imageUrl || ""}
                name={item.name}
                price={item.price}
                tag={item.tag || "NEW"}
                assetType={assetType}
                owned={isOwned}
                equipped={isEquipped}
                expired={isExpired}
                loading={loading === item.id}
                onPreview={() =>
                  setSelectedItem({
                    type: assetType,
                    name: item.name,
                    image: item.imageUrl || "",
                    price: item.price,
                  })
                }
                onBuy={() => handleBuy(item)}
                onEquip={() => handleEquip(item, activeTab)}
              />
            );
          })
        )}
      </main>

      {/* PREVIEW MODAL */}
      {selectedItem && (
        <PreviewModal
          item={selectedItem}
          userName={userName}
          userDp={userAvatar}
          onClose={() => setSelectedItem(null)}
          onBuy={() => {
            const item = currentItems.find((i) => i.name === selectedItem.name);
            if (item) handleBuy(item);
          }}
        />
      )}

      {/* STYLES */}
      <style>{`
        .store-page {
          width: 100%;
          max-width: 520px;
          margin: 0 auto;
          background: #f4f5ff;
          color: #29264c;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          height: 100dvh;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 40px;
        }
        .store-page * { box-sizing: border-box; }

        .store-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 16px;
          background: rgba(244,245,255,0.95);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 40;
          border-bottom: 1px solid rgba(255,255,255,0.8);
        }
        .store-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #fff;
          border: none;
          cursor: pointer;
          color: #29264c;
          box-shadow: 0 4px 16px rgba(70,60,130,0.10);
        }
        .store-icon-btn:active { transform: scale(0.95); }
        .store-title-wrap { display: flex; align-items: center; gap: 10px; }
        .store-title-icon {
          display: flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 14px;
          background: #fff;
          box-shadow: 0 4px 12px rgba(70,60,130,0.08);
        }
        .store-title { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; margin: 0; }

        .store-balance-wrap { padding: 16px 16px 0; }
        .store-balance-card {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 18px;
          background: rgba(255,255,255,0.85);
          border: 1px solid #fff;
          border-radius: 20px;
          box-shadow: 0 4px 14px rgba(70,60,130,0.06);
        }
        .store-balance-label { font-size: 12px; font-weight: 700; color: #9995b4; margin: 0 0 6px 0; }
        .store-balance-value { display: flex; align-items: center; gap: 8px; }
        .store-balance-value span { font-size: 22px; font-weight: 900; }
        .store-recharge-btn {
          display: flex; align-items: center; gap: 4px;
          height: 40px; padding: 0 16px;
          background: #7441e8; color: #fff;
          border: none; border-radius: 999px;
          font-size: 14px; font-weight: 800; cursor: pointer;
        }
        .store-recharge-btn:active { transform: scale(0.95); }

        .store-subtitle {
          font-size: 15px; font-weight: 700; color: #8a87a4;
          padding: 20px 20px 12px; margin: 0;
        }

        .store-tabs-wrap {
          display: flex; gap: 8px; overflow-x: auto;
          padding: 0 16px 16px;
          scrollbar-width: none;
        }
        .store-tabs-wrap::-webkit-scrollbar { display: none; }
        .store-tab {
          display: flex; align-items: center; gap: 6px;
          flex-shrink: 0; padding: 10px 16px;
          background: #fff; color: #77738f;
          border: none; border-radius: 999px;
          font-size: 13px; font-weight: 800;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(70,60,130,0.06);
          transition: all 0.2s;
        }
        .store-tab.active {
          background: #7441e8; color: #fff;
          box-shadow: 0 6px 16px rgba(116,65,232,0.25);
        }
        .store-tab:active { transform: scale(0.97); }

        .store-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding: 0 16px 20px;
        }
        .store-loading {
          grid-column: span 2;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 60px 20px;
          gap: 12px;
          color: #8a87a4; font-size: 13px; font-weight: 700;
        }
        .store-spinner {
          width: 32px; height: 32px;
          border: 3px solid rgba(116,65,232,0.15);
          border-top-color: #7441e8;
          border-radius: 50%;
          animation: storeSpin 0.8s linear infinite;
        }
        @keyframes storeSpin { to { transform: rotate(360deg); } }

        .store-card {
          background: #fff;
          border: 1px solid #fff;
          border-radius: 22px;
          padding: 10px;
          box-shadow: 0 4px 14px rgba(65,55,120,0.06);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .store-card-preview {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 16px;
          overflow: hidden;
          background: #f5f3ff;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .store-card-preview:active { transform: scale(0.98); }
        .store-card-preview.theme-bg { background: #000; }
        .store-card-preview.effect-bg { background: #090612; }
        .store-card-preview.badge-bg {
          background: linear-gradient(135deg, #f0eaff 0%, #ffffff 50%, #e8e1ff 100%);
        }
        .store-card-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 8px;
        }
        .store-card-img.cover {
          object-fit: cover;
          padding: 0;
        }
        .store-card-tag {
          position: absolute;
          top: 8px;
          left: 8px;
          padding: 4px 10px;
          background: #7541e8;
          color: #fff;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.3px;
          z-index: 2;
        }
        .store-card-equipped {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 3px 8px;
          background: #00c853;
          color: #fff;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 900;
          z-index: 2;
        }
        .store-card-badge-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: #fff;
          color: #7541e8;
          box-shadow: 0 8px 24px rgba(116,65,232,0.15);
        }
        .store-card-info { padding: 10px 4px 2px; }
        .store-card-name {
          font-size: 13px;
          font-weight: 900;
          color: #29264c;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .store-card-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          margin-top: 8px;
          min-width: 0;
        }
        .store-card-price {
          display: flex;
          align-items: center;
          gap: 3px;
          min-width: 0;
          flex: 1;
        }
        .store-card-price svg { flex-shrink: 0; }
        .store-card-price span {
          font-size: 12px;
          font-weight: 900;
          color: #29264c;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .store-buy-btn {
          flex-shrink: 0;
          padding: 6px 12px;
          background: #7441e8;
          color: #fff;
          border: none;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(116,65,232,0.22);
          white-space: nowrap;
        }
        .store-buy-btn:active { transform: scale(0.95); }
        .store-buy-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .store-equip-btn {
          flex: 1;
          padding: 6px 12px;
          background: #7441e8;
          color: #fff;
          border: none;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(116,65,232,0.22);
          white-space: nowrap;
        }
        .store-equip-btn.equipped {
          background: #a8a0c8;
          box-shadow: none;
        }
        .store-equip-btn:active { transform: scale(0.95); }
        .store-equip-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .store-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .store-modal {
          position: relative;
          width: 100%;
          max-width: 520px;
          background: #fff;
          border-radius: 28px 28px 0 0;
          overflow: hidden;
          box-shadow: 0 -10px 40px rgba(0,0,0,0.15);
          z-index: 100000;
          animation: storeModalIn 0.3s cubic-bezier(0.32, 0.72, 0, 1);
        }
        @keyframes storeModalIn {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .store-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.95);
          border: none;
          cursor: pointer;
          color: #29264c;
          box-shadow: 0 4px 14px rgba(0,0,0,0.12);
        }
        .store-modal-close:active { transform: scale(0.95); }

        .store-modal-preview {
          position: relative;
          height: 440px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .store-modal-preview.frame-dark {
          background: linear-gradient(135deg, #10051f 0%, #211040 50%, #080512 100%);
        }
        .store-modal-preview.theme-dark { background: #000; }
        .store-modal-preview.effect-dark { background: #080514; }
        .store-modal-preview.badge-light {
          background: linear-gradient(135deg, #f1eaff 0%, #fff 50%, #eee8ff 100%);
        }

        .store-modal-frame-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(132,65,255,0.28), transparent 58%);
          pointer-events: none;
        }
        .store-modal-frame-wrap {
          position: relative;
          z-index: 10;
          width: 280px;
          height: 280px;
        }
        .store-modal-frame-avatar {
          position: absolute;
          left: 50%;
          top: 50%;
          z-index: 1;
          width: 60%;
          height: 60%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          object-fit: cover;
        }
        .store-modal-frame-img {
          position: absolute;
          inset: 0;
          z-index: 2;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .store-modal-frame-name {
          position: relative;
          z-index: 20;
          margin-top: 16px;
          max-width: 82%;
          font-size: 22px;
          font-weight: 900;
          color: #fff;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .store-modal-frame-subname {
          position: relative;
          z-index: 20;
          margin-top: 6px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
        }
        .store-modal-theme-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .store-modal-theme-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 40px 24px 24px;
          background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
          color: #fff;
        }
        .store-modal-theme-badge {
          display: inline-block;
          padding: 4px 12px;
          background: rgba(255,255,255,0.2);
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .store-modal-theme-title {
          font-size: 24px;
          font-weight: 900;
          margin: 0;
        }
        .store-modal-effect-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          z-index: 1;
        }
        .store-modal-effect-name-overlay {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 5;
          width: 80%;
          font-size: 30px;
          font-weight: 900;
          color: #fff;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-shadow: 0 3px 15px rgba(0,0,0,0.8);
        }
        .store-modal-effect-label {
          position: absolute;
          bottom: 20px;
          left: 0;
          right: 0;
          z-index: 5;
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          color: rgba(255,255,255,0.8);
        }
        .store-modal-badge-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: #fff;
          color: #7541e8;
          box-shadow: 0 16px 48px rgba(116,65,232,0.20);
        }
        .store-modal-badge-title {
          margin-top: 24px;
          font-size: 22px;
          font-weight: 900;
          color: #28254b;
        }
        .store-modal-badge-sub {
          margin-top: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #9792aa;
        }
        .store-modal-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 22px;
          border-top: 1px solid #eeeef5;
          background: #fff;
        }
        .store-modal-price-label {
          font-size: 11px;
          font-weight: 800;
          color: #aaa6ba;
          margin: 0 0 4px 0;
        }
        .store-modal-price {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .store-modal-price span {
          font-size: 20px;
          font-weight: 900;
          color: #28254b;
        }
        .store-modal-buy {
          flex: 1;
          height: 48px;
          background: #7441e8;
          color: #fff;
          border: none;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 8px 22px rgba(116,65,232,0.25);
        }
        .store-modal-buy:active { transform: scale(0.98); }
      `}</style>
    </div>
  );
}

/* =========================================================
   ASSET CARD
   ========================================================= */
function AssetCard({
  image, name, price, tag, assetType, owned, equipped, expired, loading,
  onPreview, onBuy, onEquip,
}: {
  image: string;
  name: string;
  price: number;
  tag: string;
  assetType: "frame" | "theme" | "effect";
  owned?: boolean;
  equipped?: boolean;
  expired?: boolean;
  loading?: boolean;
  onPreview: () => void;
  onBuy: () => void;
  onEquip?: () => void;
}) {
  const previewClass =
    assetType === "theme" ? "theme-bg" :
    assetType === "effect" ? "effect-bg" : "";

  return (
    <div className="store-card">
      <button
        type="button"
        onClick={onPreview}
        className={`store-card-preview ${previewClass}`}
      >
        {tag && <div className="store-card-tag">{tag}</div>}
        {equipped && <div className="store-card-equipped">✓</div>}

        {image ? (
          <img
            src={image}
            alt={name}
            className={`store-card-img ${assetType === "theme" ? "cover" : ""}`}
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
        ) : (
          <div style={{ fontSize: 40, opacity: 0.3 }}>🖼️</div>
        )}
      </button>

      <div className="store-card-info">
        <h3 className="store-card-name">{name}</h3>

        <div className="store-card-bottom">
          {owned && !expired ? (
            <button
              type="button"
              onClick={onEquip}
              disabled={loading}
              className={`store-equip-btn ${equipped ? "equipped" : ""}`}
            >
              {loading ? "…" : equipped ? "Unequip" : "Equip"}
            </button>
          ) : (
            <>
              <div className="store-card-price">
                <Diamond size={13} fill="#7441e8" stroke="#7441e8" />
                <span>{price.toLocaleString()}</span>
              </div>
              <button
                type="button"
                onClick={onBuy}
                className="store-buy-btn"
                disabled={loading}
              >
                {loading ? "…" : "Buy"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   BADGE CARD
   ========================================================= */
function BadgeCard({
  name, price, tag, icon, owned, equipped, expired, loading,
  onPreview, onBuy, onEquip,
}: {
  name: string;
  price: number;
  tag: string;
  icon: ReactNode;
  owned?: boolean;
  equipped?: boolean;
  expired?: boolean;
  loading?: boolean;
  onPreview: () => void;
  onBuy: () => void;
  onEquip?: () => void;
}) {
  return (
    <div className="store-card">
      <button
        type="button"
        onClick={onPreview}
        className="store-card-preview badge-bg"
      >
        {tag && <div className="store-card-tag">{tag}</div>}
        {equipped && <div className="store-card-equipped">✓</div>}

        <div className="store-card-badge-icon">
          <div style={{ transform: "scale(0.7)" }}>{icon}</div>
        </div>
      </button>

      <div className="store-card-info">
        <h3 className="store-card-name">{name}</h3>

        <div className="store-card-bottom">
          {owned && !expired ? (
            <button
              type="button"
              onClick={onEquip}
              disabled={loading}
              className={`store-equip-btn ${equipped ? "equipped" : ""}`}
            >
              {loading ? "…" : equipped ? "Unequip" : "Equip"}
            </button>
          ) : (
            <>
              <div className="store-card-price">
                <Diamond size={13} fill="#7441e8" stroke="#7441e8" />
                <span>{price.toLocaleString()}</span>
              </div>
              <button
                type="button"
                onClick={onBuy}
                className="store-buy-btn"
                disabled={loading}
              >
                {loading ? "…" : "Buy"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PREVIEW MODAL
   ========================================================= */
function PreviewModal({
  item, userName, userDp, onClose, onBuy,
}: {
  item: PreviewItem;
  userName: string;
  userDp: string;
  onClose: () => void;
  onBuy: () => void;
}) {
  return (
    <div className="store-modal-overlay" onClick={onClose}>
      <div className="store-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="store-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        {item.type === "frame" && (
          <div className="store-modal-preview frame-dark">
            <div className="store-modal-frame-glow" />
            <div className="store-modal-frame-wrap">
              <img src={userDp} alt={userName} className="store-modal-frame-avatar" />
              <img src={item.image} alt={item.name} className="store-modal-frame-img" />
            </div>
            <div className="store-modal-frame-name">{truncateName(userName, 18)}</div>
            <p className="store-modal-frame-subname">{item.name}</p>
          </div>
        )}

        {item.type === "theme" && (
          <div className="store-modal-preview theme-dark">
            <img src={item.image} alt={item.name} className="store-modal-theme-img" />
            <div className="store-modal-theme-overlay">
              <div className="store-modal-theme-badge">Galaxy Theme</div>
              <h2 className="store-modal-theme-title">{item.name}</h2>
            </div>
          </div>
        )}

        {item.type === "effect" && (
          <div className="store-modal-preview effect-dark">
            <img src={item.image} alt={item.name} className="store-modal-effect-img" />
            <div className="store-modal-effect-name-overlay">{truncateName(userName, 16)}</div>
            <div className="store-modal-effect-label">{item.name}</div>
          </div>
        )}

        {item.type === "badge" && (
          <div className="store-modal-preview badge-light">
            <div className="store-modal-badge-icon">
              <div style={{ transform: "scale(1.4)" }}>{item.icon}</div>
            </div>
            <h2 className="store-modal-badge-title">{item.name}</h2>
            <p className="store-modal-badge-sub">Profile Badge</p>
          </div>
        )}

        <div className="store-modal-bottom">
          <div>
            <p className="store-modal-price-label">Price</p>
            <div className="store-modal-price">
              <Diamond size={20} fill="#7441e8" stroke="#7441e8" />
              <span>{item.price.toLocaleString()}</span>
            </div>
          </div>
          <button type="button" onClick={onBuy} className="store-modal-buy">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}