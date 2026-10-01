import { useState } from "react";
import { UserProfile } from "../../lib/userService";
import { equipItem, getRarityColor, getStoreItem, getPngFramePath, isAnimatedFrame, isPngFrame, unequipItem } from "../../lib/storeService";
import { FramePreview } from "../../components/frames/FrameAvatar";

type Category = "frame" | "entry" | "theme";

interface Props {
  user: UserProfile;
  onUpdate: (user: UserProfile) => void;
  onClose: () => void;
  onVisitStore: (category: Category) => void;
  showToast: (message: string, type?: "success" | "error" | "info" | "warning") => void;
}

export default function BackpackPage({ user, onUpdate, onClose, onVisitStore, showToast }: Props) {
  const [category, setCategory] = useState<Category>("frame");
  const [loadingItem, setLoadingItem] = useState<string | null>(null);

  const handleEquip = async (itemId: string) => {
    setLoadingItem(itemId);
    try {
      await equipItem(user.uid, itemId);
      const item = getStoreItem(itemId);
      const inventory = { ...(user.inventory || {}) };
      for (const [id, owned] of Object.entries(inventory)) {
        const existingItem = getStoreItem(owned.itemId);
        if (existingItem && item && existingItem.category === item.category) {
          inventory[id] = { ...owned, equipped: false };
        }
      }
      if (inventory[itemId]) inventory[itemId] = { ...inventory[itemId], equipped: true };
      const updates: Partial<UserProfile> = { inventory };
      if (item?.category === "frame") updates.equippedFrame = itemId;
      if (item?.category === "entry") updates.equippedEntry = itemId;
      if (item?.category === "theme") updates.equippedTheme = itemId;
      onUpdate({ ...user, ...updates });
      showToast(`${item?.name || "Item"} equipped!`, "success");
    } catch {
      showToast("Equip failed", "error");
    } finally {
      setLoadingItem(null);
    }
  };

  const handleUnequip = async (itemId: string) => {
    setLoadingItem(itemId);
    try {
      await unequipItem(user.uid, itemId);
      const item = getStoreItem(itemId);
      const inventory = { ...(user.inventory || {}) };
      if (inventory[itemId]) inventory[itemId] = { ...inventory[itemId], equipped: false };
      const updates: Partial<UserProfile> = { inventory };
      if (item?.category === "frame") updates.equippedFrame = undefined;
      if (item?.category === "entry") updates.equippedEntry = undefined;
      if (item?.category === "theme") updates.equippedTheme = undefined;
      onUpdate({ ...user, ...updates });
      showToast("Item unequipped", "info");
    } catch {
      showToast("Unequip failed", "error");
    } finally {
      setLoadingItem(null);
    }
  };

  const categoryItems = Object.values(user.inventory || {}).filter(owned => getStoreItem(owned.itemId)?.category === category);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "#0F0F1A", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "52px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onClose} aria-label="Close backpack" style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", cursor: "pointer", fontSize: 16, color: "#fff" }}>‹</button>
        <h2 style={{ fontSize: 18, fontWeight: 900 }}>🎒 Backpack</h2>
        <div style={{ width: 36 }} />
      </div>
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {([
          ["frame", "🖼️", "Frames"],
          ["entry", "⚡", "Entry FX"],
          ["theme", "🎨", "Themes"],
        ] as const).map(([value, icon, label]) => (
          <button key={value} onClick={() => setCategory(value)} style={{
            flex: 1, padding: "14px 0", border: "none", cursor: "pointer", fontFamily: "inherit",
            background: category === value ? "rgba(108,92,231,0.15)" : "transparent",
            borderBottom: category === value ? "2px solid #6C5CE7" : "2px solid transparent",
            color: category === value ? "#A29BFE" : "rgba(162,155,254,0.45)", fontSize: 13, fontWeight: 700,
          }}>{icon} {label}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
        {categoryItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <span style={{ fontSize: 48, opacity: 0.3 }}>📦</span>
            <p style={{ fontSize: 14, color: "rgba(162,155,254,0.4)", marginTop: 12 }}>No items yet</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => onVisitStore(category)}>Visit Store</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {categoryItems.map(owned => {
              const item = getStoreItem(owned.itemId);
              if (!item) return null;
              const rarityColor = getRarityColor(item.rarity);
              const animated = isAnimatedFrame(item.id);
              const pngPath = isPngFrame(item.id) ? getPngFramePath(item.id) : null;
              return (
                <div key={owned.itemId} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 16,
                  background: owned.equipped ? "rgba(108,92,231,0.1)" : "rgba(255,255,255,0.03)",
                  border: owned.equipped ? `1.5px solid ${rarityColor}50` : "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: animated ? "50%" : 14,
                    background: animated ? "transparent" : item.preview, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 26, border: animated ? "none" : `2px solid ${rarityColor}40`,
                    boxShadow: owned.equipped && !animated ? `0 0 16px ${rarityColor}30` : "none",
                    position: "relative", overflow: "visible",
                  }}>
                    {animated ? <FramePreview frameId={item.id} size={38} /> : pngPath ? <img src={pngPath} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{item.name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <span style={{ fontSize: 10, color: rarityColor, fontWeight: 700, textTransform: "uppercase" }}>{item.rarity}</span>
                      {owned.equipped && <span style={{ fontSize: 10, color: "#00e676", fontWeight: 700 }}>• Active</span>}
                    </div>
                  </div>
                  {owned.equipped ? (
                    <button onClick={() => handleUnequip(owned.itemId)} disabled={loadingItem === owned.itemId} style={{
                      padding: "8px 16px", borderRadius: 12, border: "1px solid rgba(255,100,130,0.3)",
                      cursor: "pointer", background: "rgba(255,100,130,0.1)", color: "#ff6482", fontSize: 12,
                      fontWeight: 800, fontFamily: "inherit",
                    }}>{loadingItem === owned.itemId ? "..." : "Remove"}</button>
                  ) : (
                    <button onClick={() => handleEquip(owned.itemId)} disabled={loadingItem === owned.itemId} style={{
                      padding: "8px 16px", borderRadius: 12, border: "none", cursor: "pointer",
                      background: "linear-gradient(135deg, #6C5CE7, #8B7CF6)", color: "#fff",
                      fontSize: 12, fontWeight: 800, fontFamily: "inherit", boxShadow: "0 0 12px rgba(108,92,231,0.3)",
                    }}>{loadingItem === owned.itemId ? "..." : animated ? "Apply" : "Equip"}</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}