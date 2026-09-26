import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Diamond, Gift, History, ImagePlus, Package, Search, Send, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/App";
import {
  FALLBACK_REWARD_GIFTS,
  REWARD_STORE_ITEMS,
  RewardGift,
  RewardKind,
  RewardPayload,
  RewardStoreItem,
  getRewardGifts,
  searchUsers,
  sendRewardToUser,
  UserProfile,
} from "@/lib/adminService";

const CLOUDINARY_CLOUD_NAME = "dz1bhfpkc";
const CLOUDINARY_UPLOAD_PRESET = "Profile_pic";

const KIND_OPTIONS: { value: RewardKind; label: string; icon: string; hint: string }[] = [
  { value: "diamonds", label: "Diamonds", icon: "💎", hint: "Credit diamonds directly to the user's balance" },
  { value: "gift", label: "Existing gift", icon: "🎁", hint: "Send one of the gifts already available in the app" },
  { value: "store_item", label: "Store item", icon: "✨", hint: "Grant an item without charging the user" },
  { value: "image", label: "PNG reward", icon: "🖼️", hint: "Attach a persistent PNG reward image to the chat" },
];

function CatalogTile({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition-all ${
        selected ? "border-primary bg-primary/15 ring-1 ring-primary/40" : "border-border bg-background/40 hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}

export default function RewardAssistantPage() {
  const { toast } = useToast();
  const { isDemo, showDemoBlock, adminUser } = useAdmin();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [searching, setSearching] = useState(false);
  const [kind, setKind] = useState<RewardKind>("diamonds");
  const [amount, setAmount] = useState("100");
  const [gifts, setGifts] = useState<RewardGift[]>(FALLBACK_REWARD_GIFTS);
  const [giftId, setGiftId] = useState(FALLBACK_REWARD_GIFTS[0].id);
  const [itemId, setItemId] = useState(REWARD_STORE_ITEMS[0].id);
  const [imageUrl, setImageUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [recentRewards, setRecentRewards] = useState<Array<{ id: string; title: string; recipientUid: string; createdAt: number }>>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getRewardGifts().then(list => {
      setGifts(list);
      setGiftId(current => list.some(gift => gift.id === current) ? current : list[0]?.id || "");
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || selectedUser?.uid === trimmed) {
      setUsers([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        setUsers((await searchUsers(trimmed)).slice(0, 8));
      } catch {
        setUsers([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query, selectedUser?.uid]);

  const selectedGift = useMemo(() => gifts.find(gift => gift.id === giftId), [gifts, giftId]);
  const selectedItem = useMemo(() => REWARD_STORE_ITEMS.find(item => item.id === itemId), [itemId]);
  const currentOption = KIND_OPTIONS.find(option => option.value === kind)!;

  async function uploadPng(file: File) {
    if (file.type !== "image/png") {
      toast({ title: "Only PNG files are accepted", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "PNG must be 5MB or smaller", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok || !data.secure_url) throw new Error(data.error?.message || "Upload failed");
      setImageUrl(data.secure_url);
      setImageName(file.name);
      toast({ title: "PNG uploaded" });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "PNG upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  function buildPayload(): RewardPayload | null {
    if (kind === "diamonds") {
      const value = Number(amount);
      if (!Number.isInteger(value) || value < 1) return null;
      return { kind, title: `${value.toLocaleString()} Diamonds`, description: note.trim() || "A reward from Galaxy", amount: value, emoji: "💎" };
    }
    if (kind === "gift" && selectedGift) {
      return { kind, title: `${selectedGift.emoji} ${selectedGift.name}`, description: note.trim() || "A gift from Galaxy", emoji: selectedGift.emoji, imageUrl: selectedGift.url };
    }
    if (kind === "store_item" && selectedItem) {
      return {
        kind,
        title: `${selectedItem.icon} ${selectedItem.name}`,
        description: note.trim() || `A complimentary ${selectedItem.category} from Galaxy`,
        emoji: selectedItem.icon,
        itemId: selectedItem.id,
        itemCategory: selectedItem.category,
        rarity: selectedItem.rarity,
      };
    }
    if (kind === "image" && imageUrl) {
      return { kind, title: note.trim() || "A special PNG reward", description: "A reward image from Galaxy", imageUrl, emoji: "🖼️" };
    }
    return null;
  }

  async function handleSend() {
    if (isDemo) {
      showDemoBlock();
      return;
    }
    if (!selectedUser) {
      toast({ title: "Select a recipient first", variant: "destructive" });
      return;
    }
    const payload = buildPayload();
    if (!payload) {
      toast({ title: kind === "image" ? "Upload a PNG first" : "Complete the reward details", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const rewardId = await sendRewardToUser(selectedUser.uid, adminUser?.name || "Galaxy Admin", payload);
      setRecentRewards(current => [{ id: rewardId, title: payload.title, recipientUid: selectedUser.uid, createdAt: Date.now() }, ...current].slice(0, 8));
      toast({ title: `Reward sent to ${selectedUser.name || selectedUser.userId}` });
      setNote("");
      if (kind === "image") {
        setImageUrl("");
        setImageName("");
      }
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Reward could not be sent", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><Gift className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-bold text-white">Reward Assistant</h1>
            <p className="text-sm text-muted-foreground">Deliver a persistent reward directly into a user's assistant chat.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">1. Choose recipient</p>
                <p className="mt-1 text-xs text-muted-foreground">Search by Firebase UID, public user ID, name, or email.</p>
              </div>
              {selectedUser && <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">Ready to receive</span>}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={event => { setQuery(event.target.value); setSelectedUser(null); }} placeholder="Enter user ID or search..." className="h-10 bg-background pl-9" />
              {searching && <span className="absolute right-3 top-3 text-xs text-muted-foreground">Searching…</span>}
            </div>
            {users.length > 0 && !selectedUser && (
              <div className="mt-2 overflow-hidden rounded-xl border border-border bg-background">
                {users.map(user => (
                  <button key={user.uid} type="button" onClick={() => { setSelectedUser(user); setQuery(user.userId || user.uid); setUsers([]); }} className="flex w-full items-center gap-3 border-b border-border p-3 text-left last:border-0 hover:bg-primary/10">
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-lg">{user.avatar?.startsWith("http") ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : user.avatar || <UserRound className="h-4 w-4" />}</div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{user.name || "Unnamed user"}</p><p className="truncate text-xs text-muted-foreground">ID: {user.userId || user.uid} · {user.coins || 0} diamonds</p></div>
                  </button>
                ))}
              </div>
            )}
            {selectedUser && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/20 text-xl">{selectedUser.avatar?.startsWith("http") ? <img src={selectedUser.avatar} alt="" className="h-full w-full object-cover" /> : selectedUser.avatar || "✦"}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{selectedUser.name || "Unnamed user"}</p><p className="text-xs text-primary/80">User ID {selectedUser.userId || selectedUser.uid}</p></div>
                <button type="button" onClick={() => { setSelectedUser(null); setQuery(""); }} className="text-xs text-muted-foreground hover:text-white">Change</button>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4"><p className="text-sm font-semibold text-white">2. Choose reward</p><p className="mt-1 text-xs text-muted-foreground">{currentOption.hint}</p></div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {KIND_OPTIONS.map(option => <button key={option.value} type="button" onClick={() => setKind(option.value)} className={`rounded-xl border p-3 text-left transition-all ${kind === option.value ? "border-primary bg-primary/15" : "border-border hover:border-primary/50"}`}><span className="text-xl">{option.icon}</span><p className="mt-2 text-xs font-semibold text-white">{option.label}</p></button>)}
            </div>

            {kind === "diamonds" && (
              <div className="mt-5 space-y-2"><Label className="text-xs text-muted-foreground">Diamond amount</Label><div className="relative max-w-sm"><Diamond className="absolute left-3 top-3 h-4 w-4 text-cyan-400" /><Input type="number" min="1" step="1" value={amount} onChange={event => setAmount(event.target.value)} className="bg-background pl-9" /></div></div>
            )}
            {kind === "gift" && (
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {gifts.map(gift => <CatalogTile key={gift.id} selected={gift.id === giftId} onClick={() => setGiftId(gift.id)}><div className="flex items-center gap-2"><span className="text-2xl">{gift.url ? <img src={gift.url} alt="" className="h-9 w-9 object-contain" /> : gift.emoji}</span><div className="min-w-0"><p className="truncate text-xs font-semibold text-white">{gift.name}</p><p className="text-[11px] text-amber-300">💎 {gift.cost}</p></div></div></CatalogTile>)}
              </div>
            )}
            {kind === "store_item" && (
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {REWARD_STORE_ITEMS.map(item => <CatalogTile key={item.id} selected={item.id === itemId} onClick={() => setItemId(item.id)}><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-lg text-xl" style={{ background: item.preview }}>{item.icon}</span><div className="min-w-0"><p className="truncate text-xs font-semibold text-white">{item.name}</p><p className="text-[10px] capitalize text-muted-foreground">{item.category} · {item.rarity}</p></div></div></CatalogTile>)}
              </div>
            )}
            {kind === "image" && (
              <div className="mt-5 space-y-3">
                <input ref={fileRef} type="file" accept="image/png" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) uploadPng(file); event.target.value = ""; }} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 text-primary hover:bg-primary/10">{uploading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /> : <ImagePlus className="h-6 w-6" />}<span className="text-xs font-medium">{uploading ? "Uploading PNG…" : imageName || "Upload PNG reward image"}</span><span className="text-[10px] text-muted-foreground">PNG only · max 5MB</span></button>
                {imageUrl && <img src={imageUrl} alt="Reward preview" className="max-h-52 w-full rounded-xl border border-border object-contain bg-background p-2" />}
              </div>
            )}
            <div className="mt-5 space-y-2"><Label className="text-xs text-muted-foreground">Optional message shown with the reward</Label><Input value={note} onChange={event => setNote(event.target.value)} placeholder={kind === "image" ? "Example: Welcome to the Galaxy" : "Example: Thanks for being part of Galaxy"} className="bg-background" /></div>
          </section>

          <Button onClick={handleSend} disabled={sending || uploading} className="h-11 w-full bg-primary hover:bg-primary/90">
            {sending ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Sending reward…</span> : <span className="flex items-center gap-2"><Send className="h-4 w-4" />Send through Reward Assistant</span>}
          </Button>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2"><Package className="h-4 w-4 text-primary" /><p className="text-sm font-semibold text-white">Delivery preview</p></div>
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-cyan-500/10 p-4">
              <p className="text-[10px] uppercase tracking-widest text-primary/80">Reward Assistant</p>
              <div className="mt-4 flex items-center gap-3">{kind === "diamonds" ? <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-2xl">💎</div> : kind === "gift" ? <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-400/15 text-2xl">{selectedGift?.url ? <img src={selectedGift.url} alt="" className="h-10 w-10 object-contain" /> : selectedGift?.emoji}</div> : kind === "store_item" ? <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: selectedItem?.preview }}>{selectedItem?.icon}</div> : imageUrl ? <img src={imageUrl} alt="" className="h-12 w-12 rounded-2xl object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">🖼️</div>}<div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{buildPayload()?.title || "Your reward"}</p><p className="mt-1 text-xs text-muted-foreground">{selectedUser ? `For ${selectedUser.name || selectedUser.userId}` : "Choose a recipient to continue"}</p></div></div>
              <div className="mt-4 rounded-xl bg-background/50 p-3 text-xs leading-relaxed text-muted-foreground">This reward is persisted in the recipient's inventory, reward history, notification center, and assistant chat.</div>
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2"><History className="h-4 w-4 text-primary" /><p className="text-sm font-semibold text-white">This session</p></div>
            {recentRewards.length === 0 ? <p className="text-xs text-muted-foreground">Sent rewards will appear here for a quick audit trail.</p> : <div className="space-y-2">{recentRewards.map(reward => <div key={reward.id} className="flex items-start gap-2 rounded-lg bg-background/50 p-2.5"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /><div className="min-w-0"><p className="truncate text-xs font-medium text-white">{reward.title}</p><p className="text-[10px] text-muted-foreground">to {reward.recipientUid} · {new Date(reward.createdAt).toLocaleTimeString()}</p></div></div>)}</div>}
          </section>
        </aside>
      </div>
    </div>
  );
}