// ExplorePage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  Share2,
  Video,
  X,
  Image as ImageIcon,
  Globe2,
  Users,
  UserRound,
  Search,
} from "lucide-react";
import {
  ref as dbRef,
  onValue,
  off,
  get,
  set,
  push,
  remove,
  update,
} from "firebase/database";
import { db, uploadWithAppCheck } from "../lib/firebase";
import { UserProfile } from "../lib/userService";
import { useToast } from "../lib/toastContext";

type PostType = "photo" | "video";
type Privacy = "public" | "followers" | "friends";

interface Comment {
  id: string; uid: string; userName: string; userAvatar: string; text: string; createdAt: number;
}

interface Post {
  id: string; uid: string; type: PostType; user: string; avatar: string; time: string; createdAt: number;
  description: string; media: string; likes: Record<string, boolean>; comments: number; following: boolean; privacy: Privacy;
}

interface Props { user: UserProfile; }

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function privacyLabel(privacy: Privacy) {
  if (privacy === "public") return "Public";
  if (privacy === "followers") return "Followers Only";
  return "Friends Only";
}

function timeAgo(timestamp: number) {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function ExplorePage({ user }: Props) {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState<"all" | "video" | "people" | "live">("all");

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPostType, setSelectedPostType] = useState<PostType | null>(null);
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("public");
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const [posting, setPosting] = useState(false);

  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const momentsRef = dbRef(db, "moments");
    const unsubscribe = onValue(momentsRef, (snapshot) => {
        if (!snapshot.exists()) { setPosts([]); setLoading(false); return; }
        const value = snapshot.val();
        const list: Post[] = Object.keys(value).map((id) => ({
            id, uid: value[id]?.uid || "", type: value[id]?.videoUrl ? "video" : "photo",
            user: value[id]?.userName || "Galaxy User", avatar: value[id]?.userAvatar || "",
            time: timeAgo(value[id]?.createdAt || Date.now()), createdAt: value[id]?.createdAt || Date.now(),
            description: value[id]?.text || "", media: value[id]?.videoUrl || value[id]?.imageUrl || "",
            likes: value[id]?.likes || {}, comments: Number(value[id]?.commentCount || 0),
            following: false, privacy: value[id]?.privacy || "public",
        }));
        list.sort((a, b) => b.createdAt - a.createdAt);
        const blockedList = user.blockedList || [];
        setPosts(list.filter((p) => !blockedList.includes(p.uid)));
        setLoading(false);
      }, () => { setLoading(false); showToast("Unable to load posts", "error"); }
    );
    return () => off(momentsRef);
  }, [user.blockedList, showToast]);

  useEffect(() => {
    if (!user.uid || !posts.length) return;
    const uids = Array.from(new Set(posts.map((p) => p.uid).filter((uid) => uid && uid !== user.uid)));
    if (!uids.length) return;
    const unsubs: Array<() => void> = [];
    uids.forEach((uid) => {
      const followRef = dbRef(db, `follows/${user.uid}/${uid}`);
      const unsub = onValue(followRef, (snap) => setFollowing((prev) => ({ ...prev, [uid]: snap.exists() && snap.val() === true })));
      unsubs.push(() => off(followRef));
    });
    return () => unsubs.forEach((fn) => fn());
  }, [user.uid, posts]);

  useEffect(() => {
    if (!commentPostId) { setComments([]); return; }
    setCommentsLoading(true);
    const commentsRef = dbRef(db, `momentComments/${commentPostId}`);
    const unsubscribe = onValue(commentsRef, (snapshot) => {
        if (!snapshot.exists()) { setComments([]); setCommentsLoading(false); return; }
        const value = snapshot.val();
        const list: Comment[] = Object.keys(value).map((id) => ({
          id, uid: value[id]?.uid || "", userName: value[id]?.userName || "Galaxy User",
          userAvatar: value[id]?.userAvatar || "", text: value[id]?.text || "", createdAt: Number(value[id]?.createdAt || 0),
        }));
        list.sort((a, b) => a.createdAt - b.createdAt);
        setComments(list); setCommentsLoading(false);
      }, () => { setCommentsLoading(false); showToast("Unable to load comments", "error"); }
    );
    return () => off(commentsRef);
  }, [commentPostId, showToast]);

  const filteredPosts = useMemo(() => {
    if (activeFilter === "video") return posts.filter((post) => post.type === "video");
    if (activeFilter === "live") return [];
    return posts;
  }, [posts, activeFilter]);

  const openCreatePost = () => { setShowCreatePost(true); setSelectedFile(null); setPreviewUrl(null); setSelectedPostType(null); setDescription(""); setPrivacy("public"); };
  const closeCreatePost = () => { if (previewUrl) URL.revokeObjectURL(previewUrl); setShowCreatePost(false); };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const type: PostType = file.type.startsWith("video/") ? "video" : "photo";
    const maxSize = type === "video" ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) { showToast(type === "video" ? "Video must be under 20MB" : "Image must be under 5MB", "warning"); event.target.value = ""; return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); setSelectedPostType(type);
  };

  const publishPost = async () => {
    if (!user.uid) return showToast("You must be logged in", "warning");
    if (!selectedFile && !description.trim()) return showToast("Add a photo, video or text", "warning");
    setPosting(true);
    try {
      let imageUrl = ""; let videoUrl = "";
      if (selectedFile) {
        const ext = selectedFile.name.split(".").pop() || (selectedPostType === "video" ? "mp4" : "jpg");
        const path = `moments/${user.uid}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const result = await uploadWithAppCheck(selectedFile, path);
        if (selectedPostType === "video") videoUrl = result.url; else imageUrl = result.url;
      }
      const momentRef = push(dbRef(db, "moments"));
      const postData: Record<string, unknown> = { uid: user.uid, userName: user.name || "Galaxy User", userAvatar: user.avatar || "", text: description.trim(), privacy, likes: {}, commentCount: 0, createdAt: Date.now() };
      if (imageUrl) postData.imageUrl = imageUrl;
      if (videoUrl) postData.videoUrl = videoUrl;
      await set(momentRef, postData);
      closeCreatePost();
      showToast("Post published ✨", "success");
    } catch (err) { showToast("Failed to publish", "error"); } finally { setPosting(false); }
  };

  const toggleLike = async (postId: string) => {
    try {
      const likeRef = dbRef(db, `moments/${postId}/likes/${user.uid}`);
      const snap = await get(likeRef);
      if (snap.exists()) await remove(likeRef); else await set(likeRef, true);
    } catch (err) { console.error(err); }
  };

  const toggleFollow = async (targetUid: string) => {
    if (!targetUid || targetUid === user.uid) return;
    try {
      const followRef = dbRef(db, `follows/${user.uid}/${targetUid}`);
      const snap = await get(followRef);
      if (snap.exists()) { await remove(followRef); showToast("Unfollowed", "info"); }
      else { await set(followRef, true); showToast("Following", "success"); }
    } catch (err) { showToast("Unable to update follow", "error"); }
  };

  const addComment = async () => {
    if (!commentPostId || !commentText.trim() || !user.uid) return;
    setSendingComment(true);
    try {
      const commentRef = push(dbRef(db, `momentComments/${commentPostId}`));
      await set(commentRef, { uid: user.uid, userName: user.name || "Galaxy User", userAvatar: user.avatar || "", text: commentText.trim(), createdAt: Date.now() });
      const snap = await get(dbRef(db, `momentComments/${commentPostId}`));
      await update(dbRef(db, `moments/${commentPostId}`), { commentCount: snap.exists() ? Object.keys(snap.val()).length : 0 });
      setCommentText("");
    } catch (err) { showToast("Failed to comment", "error"); } finally { setSendingComment(false); }
  };

  const sharePost = async (post: Post) => {
    const shareText = post.description ? `${post.user}: ${post.description}` : `Check out ${post.user}'s post!`;
    if (navigator.share) { try { await navigator.share({ title: "Galaxy", text: shareText, url: window.location.href }); return; } catch { return; } }
    try { await navigator.clipboard.writeText(shareText); showToast("Copied", "success"); } catch { showToast("Share not supported", "info"); }
  };

  return (
    <div className="min-h-screen bg-[#f8f8fc] text-[#171522] w-full box-border overflow-x-hidden">
      <div className="mx-auto min-h-screen w-full max-w-[520px] bg-[#f8f8fc] relative pb-[90px]">
        
        {/* HEADER - Exactly like Screenshot 2 */}
        <header className="bg-white px-5 pb-4 pt-[calc(16px+env(safe-area-inset-top))] shadow-sm w-full box-border sticky top-0 z-50">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h1 className="text-[32px] font-extrabold tracking-[-1px] text-[#171522]">Explore</h1>
            <button
              onClick={openCreatePost}
              className="flex h-[46px] items-center gap-1.5 rounded-full bg-[#713cff] px-5 text-[14px] font-extrabold text-white shadow-[0_4px_14px_rgba(113,60,255,0.3)] active:scale-95 shrink-0"
            >
              <Plus size={18} strokeWidth={3} /> Post
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[["all", "Posts"], ["video", "Videos"], ["people", "People"], ["live", "Live"]].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActiveFilter(id as any)}
                className={`shrink-0 rounded-full px-6 py-2.5 text-[13px] font-bold transition ${
                  activeFilter === id ? "bg-[#713cff] text-white shadow-md" : "bg-[#f1f0f6] text-[#6d6978]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        {/* FEED - Image will not crop now */}
        <main className="px-4 pt-4 w-full box-border">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-3">
               <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#713cff]/20 border-t-[#713cff]" />
               <p className="text-sm text-[#96929f] font-semibold">Loading posts...</p>
             </div>
          ) : filteredPosts.length === 0 ? (
            <div className="px-5 py-20 text-center text-[#96929f]">
              <div className="mb-3 text-[45px]">🔎</div>
              <p className="text-sm font-bold text-[#555]">No posts found</p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const liked = !!post.likes[user.uid];
              const likeCount = Object.keys(post.likes || {}).length;
              const isFollowing = !!following[post.uid];
              const isMine = post.uid === user.uid;

              return (
                <article key={post.id} className="mb-5 overflow-hidden rounded-[24px] bg-white p-3.5 shadow-[0_4px_20px_rgba(35,28,60,0.05)] border border-gray-100">
                  {/* USER */}
                  <div className="mb-3 flex items-center gap-3">
                    <img src={post.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user)}&background=713cff&color=fff`} alt={post.user} className="h-11 w-11 shrink-0 rounded-full object-cover border border-gray-100" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-extrabold text-[#171522]">{post.user}</span>
                        {!isMine && (
                          <button onClick={() => toggleFollow(post.uid)} className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-extrabold ${isFollowing ? "bg-[#f0edf8] text-[#77727f]" : "bg-[#713cff] text-white"}`}>
                            {isFollowing ? "Following" : "Follow"}
                          </button>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] font-medium text-[#92909a]">{post.time} · {privacyLabel(post.privacy)}</div>
                    </div>
                    <button onClick={() => setMenuPostId(post.id)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#77727f] hover:bg-[#f4f3f7]">
                      <MoreHorizontal size={22} />
                    </button>
                  </div>

                  {/* MEDIA - FIXED: object-contain aur max-h taake image poora dikhe */}
                  <div className="relative overflow-hidden rounded-[18px] bg-[#f4f3f7] flex justify-center w-full">
                    {post.type === "video" ? (
                       <video src={post.media} controls playsInline className="block w-full max-h-[480px] object-contain" />
                    ) : (
                       <img src={post.media} alt={post.description} className="block w-full max-h-[480px] object-contain" loading="lazy" />
                    )}
                    {post.type === "video" && (
                      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur-sm">
                        <Video size={12} /> Video
                      </div>
                    )}
                  </div>

                  {/* DESCRIPTION */}
                  {post.description && (
                    <div className="px-1 pt-3.5 text-[14px] leading-[1.5] text-[#413950] font-medium">
                      {post.description}
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="flex items-center gap-6 px-1 pb-1 pt-4">
                    <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-1.5 text-[13px] font-bold ${liked ? "text-[#ff3f69]" : "text-[#77727f]"}`}>
                      <Heart size={22} fill={liked ? "currentColor" : "none"} strokeWidth={2} /> {formatNumber(likeCount)}
                    </button>
                    <button onClick={() => setCommentPostId(post.id)} className="flex items-center gap-1.5 text-[13px] font-bold text-[#77727f]">
                      <MessageCircle size={22} strokeWidth={2} /> {formatNumber(post.comments)}
                    </button>
                    <button onClick={() => sharePost(post)} className="ml-auto flex items-center gap-1.5 text-[13px] font-bold text-[#77727f]">
                      <Share2 size={20} strokeWidth={2} /> Share
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </main>
      </div>

      {/* CREATE POST MODAL */}
      {showCreatePost && (
        <div className="fixed inset-0 z-[500] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={closeCreatePost}>
          <div className="max-h-[92vh] w-full max-w-[520px] overflow-y-auto rounded-t-[30px] bg-white px-5 pb-8 pt-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-gray-200" />
            <div className="mb-6 flex items-center justify-between">
              <div><h2 className="text-[22px] font-extrabold text-[#171522]">Create Post</h2><p className="text-[12px] text-[#928ba2] font-medium">Share something with the world</p></div>
              <button onClick={closeCreatePost} disabled={posting} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1eef7] text-[#716a83]"><X size={20} /></button>
            </div>

            {!selectedFile ? (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => fileInputRef.current?.click()} disabled={posting} className="flex min-h-[150px] flex-col items-center justify-center rounded-[22px] border border-dashed border-[#dcd7e8] bg-[#faf9fd] text-[#713cff] active:scale-[0.98]">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#eee9ff]"><ImageIcon size={26} /></div>
                  <span className="text-[14px] font-extrabold text-[#3b3450]">Photo</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} disabled={posting} className="flex min-h-[150px] flex-col items-center justify-center rounded-[22px] border border-dashed border-[#dcd7e8] bg-[#faf9fd] text-[#713cff] active:scale-[0.98]">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#eee9ff]"><Video size={26} /></div>
                  <span className="text-[14px] font-extrabold text-[#3b3450]">Video</span>
                </button>
              </div>
            ) : (
              <>
                <div className="relative overflow-hidden rounded-[22px] bg-[#f0eef5] flex justify-center">
                  {selectedPostType === "video" ? <video src={previewUrl || ""} controls className="max-h-[320px] w-full object-contain" /> : <img src={previewUrl || ""} alt="Preview" className="max-h-[320px] w-full object-contain" />}
                  <button onClick={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setSelectedFile(null); setPreviewUrl(null); setSelectedPostType(null); }} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"><X size={18} /></button>
                </div>
                <div className="mt-5">
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Write a caption..." maxLength={500} rows={3} disabled={posting} className="w-full resize-none rounded-[18px] border border-[#e7e2ef] bg-[#faf9fd] px-4 py-3 text-[14px] outline-none focus:border-[#9a72ef]" />
                </div>
                <button onClick={publishPost} disabled={posting} className="mt-5 flex h-[54px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#713cff] text-[15px] font-extrabold text-white shadow-md active:scale-[0.98] disabled:opacity-60">
                  {posting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Send size={18} />} Publish Post
                </button>
              </>
            )}
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
          </div>
        </div>
      )}

      {/* COMMENTS MODAL */}
      {commentPostId && (
        <div className="fixed inset-0 z-[600] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setCommentPostId(null); }}>
          <div className="max-h-[75vh] w-full max-w-[520px] rounded-t-[30px] bg-white px-5 pb-6 pt-4 flex flex-col">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-gray-200" />
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[20px] font-extrabold text-[#171522]">Comments</h2>
              <button onClick={() => setCommentPostId(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1eef7]"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-[200px] mb-4">
              {commentsLoading ? (
                 <div className="py-10 text-center text-[13px] text-[#9993a5]">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#f2eff8]"><MessageCircle size={24} className="text-[#713cff]" /></div>
                  <div className="text-[14px] font-bold text-[#77727f]">No comments yet</div>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="mb-4 flex gap-3">
                    <img src={comment.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userName)}&background=713cff&color=fff`} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-extrabold text-[#171522]">{comment.userName}</span>
                        <span className="text-[10px] font-medium text-[#9993a5]">{timeAgo(comment.createdAt)}</span>
                      </div>
                      <div className="mt-1 text-[13px] text-[#555] leading-relaxed">{comment.text}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center gap-2 rounded-[18px] bg-[#f4f3f8] p-1.5">
              <input value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment(); } }} placeholder="Write a comment..." disabled={sendingComment} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-[13px] outline-none" />
              <button onClick={addComment} disabled={sendingComment || !commentText.trim()} className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#713cff] text-white disabled:opacity-50"><ArrowUpRight size={18} /></button>
            </div>
          </div>
        </div>
      )}

      {/* MORE MENU */}
      {menuPostId && (
        <div className="fixed inset-0 z-[700] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setMenuPostId(null); }}>
          <div className="w-full max-w-[520px] rounded-t-[30px] bg-white px-5 pb-6 pt-4">
            <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-gray-200" />
            <button onClick={() => { setMenuPostId(null); showToast("Copied", "success"); }} className="w-full border-b border-gray-100 py-4 text-left text-[15px] font-bold text-[#3b3546]">🔗 Copy Link</button>
            <button onClick={() => { setMenuPostId(null); showToast("Hidden", "info"); }} className="w-full border-b border-gray-100 py-4 text-left text-[15px] font-bold text-[#3b3546]">🚫 Not Interested</button>
            <button onClick={() => { setMenuPostId(null); showToast("Reported", "success"); }} className="w-full border-b border-gray-100 py-4 text-left text-[15px] font-bold text-[#3b3546]">🚩 Report Post</button>
            {menuPostId && posts.find((p) => p.id === menuPostId)?.uid === user.uid && (
               <button onClick={async () => { await remove(dbRef(db, `moments/${menuPostId}`)); setMenuPostId(null); }} className="w-full border-b border-gray-100 py-4 text-left text-[15px] font-bold text-[#ff4757]">🗑️ Delete Post</button>
            )}
            <button onClick={() => setMenuPostId(null)} className="w-full py-4 text-center text-[15px] font-extrabold text-[#713cff]">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}