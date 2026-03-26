/**
 * DateIdeasFeed — Hotel Information Center
 * Activities & Places feed with likes, comments, ratings, photo contributions.
 */
import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import DateIdeaPlaceReportSheet from "./DateIdeaPlaceReportSheet";
import FlagFeedSheet from "./FlagFeedSheet";
import SendDateInviteSheet, { type PostRef } from "./SendDateInviteSheet";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DateIdeaPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAge?: number;
  authorGuestId?: string;
  authorCity?: string;
  authorFlag?: string;
  authorImage?: string;
  isGlobal?: boolean;         // Mr. Butlas / admin posts visible in all cities
  title: string;
  location: string;
  description: string;
  mainImage: string;
  gallery: string[];
  tags: string[];
  likes: number;
  ratingSum: number;
  ratingCount: number;
  commentCount: number;
  createdAt: number;
  pendingPhotos?: { id: string; url: string; submittedBy: string }[];
}

interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: number;
  reported?: boolean;
}

interface UserInteractions {
  likedPosts: string[];
  ratedPosts: Record<string, number>;
  reportedPosts: string[];
  reportedComments: string[];
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_POSTS: DateIdeaPost[] = [
  {
    id: "seed1",
    authorId: "GH-204817",
    authorName: "Sari",
    authorAge: 26,
    authorGuestId: "GH-204817",
    authorCity: "Jakarta",
    authorFlag: "🇮🇩",
    authorImage: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&q=80",
    isGlobal: false,
    title: "Sunset Rooftop Cocktails",
    location: "Skye Restaurant & Bar, Jakarta",
    description: "Nothing beats watching the Jakarta skyline glow at golden hour with a cold drink in hand. Perfect first date — relaxed, visual, and easy to talk. Ask for the corner table.",
    mainImage: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80",
    gallery: [],
    tags: ["Romantic", "Nightlife"],
    likes: 42,
    ratingSum: 187,
    ratingCount: 40,
    commentCount: 2,
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: "seed2",
    authorId: "GH-391042",
    authorName: "Rizky",
    authorAge: 28,
    authorGuestId: "GH-391042",
    authorCity: "Bali",
    authorFlag: "🇮🇩",
    authorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    isGlobal: false,
    title: "Sunrise Kayaking at Sanur Beach",
    location: "Sanur Beach, Bali",
    description: "Rent a kayak for two before 7am. The water is glass-flat, the colours are insane and you'll beat every tourist. Bring snacks, there's a reef to stop at halfway.",
    mainImage: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    gallery: [],
    tags: ["Outdoor", "Adventure", "Cheap"],
    likes: 31,
    ratingSum: 140,
    ratingCount: 28,
    commentCount: 1,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: "seed3",
    authorId: "GH-117293",
    authorName: "Ayu",
    authorAge: 24,
    authorGuestId: "GH-117293",
    authorCity: "Bandung",
    authorFlag: "🇮🇩",
    authorImage: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&q=80",
    isGlobal: false,
    title: "Art District Gallery Walk",
    location: "Dago Art House, Bandung",
    description: "Bandung's gallery scene is underrated. Free entry on Fridays, often with live acoustic sets. Walk through 3–4 galleries in one evening — never runs out of things to say.",
    mainImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    gallery: [],
    tags: ["Cultural", "Romantic", "Cheap"],
    likes: 28,
    ratingSum: 125,
    ratingCount: 24,
    commentCount: 0,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: "seed4",
    authorId: "GH-582901",
    authorName: "Dewi",
    authorAge: 27,
    authorGuestId: "GH-582901",
    authorCity: "Yogyakarta",
    authorFlag: "🇮🇩",
    authorImage: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&q=80",
    isGlobal: false,
    title: "Picnic at Prambanan at Dusk",
    location: "Prambanan Temple Complex, Yogyakarta",
    description: "The temples turn golden at 5pm. Pack a mat and some snacks, sit on the grass across from the main complex. Completely free after entry. One of the most romantic spots in Java.",
    mainImage: "https://images.unsplash.com/photo-1520637836862-4d197d17c35a?w=800&q=80",
    gallery: [],
    tags: ["Outdoor", "Cultural", "Romantic"],
    likes: 55,
    ratingSum: 245,
    ratingCount: 49,
    commentCount: 3,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: "seed5",
    authorId: "GH-763410",
    authorName: "Farhan",
    authorAge: 30,
    authorGuestId: "GH-763410",
    authorCity: "Surabaya",
    authorFlag: "🇮🇩",
    authorImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    isGlobal: false,
    title: "Pasar Atom Night Market Tour",
    location: "Pasar Atom, Surabaya",
    description: "Walk through the night market trying stalls together. Dirt cheap, full of energy. Buy the same skewer from 3 different spots and argue about which is best — it works every time.",
    mainImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    gallery: [],
    tags: ["Foodie", "Cheap", "Group"],
    likes: 71,
    ratingSum: 298,
    ratingCount: 60,
    commentCount: 5,
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: "seed6",
    authorId: "GH-445187",
    authorName: "Nadia",
    authorAge: 25,
    authorGuestId: "GH-445187",
    authorCity: "Jakarta",
    authorFlag: "🇮🇩",
    authorImage: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&q=80",
    isGlobal: false,
    title: "Escape Room at FunEscape JKT",
    location: "FunEscape, Sudirman, Jakarta",
    description: "60 minutes locked in solving puzzles. Reveals how someone thinks under pressure — in the best way. We did the Haunted Hotel room, came out laughing for an hour after.",
    mainImage: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80",
    gallery: [],
    tags: ["Adventure", "Group"],
    likes: 38,
    ratingSum: 172,
    ratingCount: 34,
    commentCount: 2,
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: "seed7",
    authorId: "GH-829056",
    authorName: "Putri",
    authorAge: 23,
    authorGuestId: "GH-829056",
    authorCity: "Bali",
    authorFlag: "🇮🇩",
    authorImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
    isGlobal: false,
    title: "Balinese Dance Class for Two",
    location: "Ubud Dance Studio, Bali",
    description: "Book a private intro class — you don't need experience. The hand movements alone take 20 minutes to learn. You'll both look ridiculous and love it. The teacher is hilarious.",
    mainImage: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=800&q=80",
    gallery: [],
    tags: ["Romantic", "Adventure", "Cultural"],
    likes: 49,
    ratingSum: 220,
    ratingCount: 43,
    commentCount: 4,
    createdAt: Date.now() - 86400000 * 6,
  },
  {
    id: "seed8",
    authorId: "GH-194723",
    authorName: "Bagas",
    authorAge: 29,
    authorGuestId: "GH-194723",
    authorCity: "Malang",
    authorFlag: "🇮🇩",
    authorImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80",
    isGlobal: false,
    title: "Bromo Viewpoint Hike & Breakfast",
    location: "Mount Bromo, East Java",
    description: "Leave at 3am, reach the viewpoint by 5am. The sunrise over the crater is unlike anything. Bring a jacket — it's freezing. Stop at the warung at the base for hot bakso afterwards.",
    mainImage: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80",
    gallery: [],
    tags: ["Outdoor", "Adventure"],
    likes: 44,
    ratingSum: 196,
    ratingCount: 39,
    commentCount: 2,
    createdAt: Date.now() - 86400000 * 8,
  },
  {
    id: "seed9",
    authorId: "GH-672038",
    authorName: "Intan",
    authorAge: 26,
    authorGuestId: "GH-672038",
    authorCity: "Bandung",
    authorFlag: "🇮🇩",
    authorImage: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&q=80",
    isGlobal: false,
    title: "Pottery Class at Studio Tanah",
    location: "Studio Tanah Liat, Bandung",
    description: "Yes, like Ghost the movie. Cheesy? Maybe. We went as a joke and ended up staying 3 hours. You both leave with something you made together. Book the weekend slot.",
    mainImage: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80",
    gallery: [],
    tags: ["Cultural", "Romantic"],
    likes: 62,
    ratingSum: 275,
    ratingCount: 54,
    commentCount: 6,
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: "seed10",
    authorId: "GH-338821",
    authorName: "Dimas",
    authorAge: 31,
    authorGuestId: "GH-338821",
    authorCity: "Jakarta",
    authorFlag: "🇮🇩",
    authorImage: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&q=80",
    isGlobal: false,
    title: "Rooftop Cinema at Kinosaurus",
    location: "Kinosaurus, Kemang, Jakarta",
    description: "Open-air screenings on the rooftop — usually indie or classic films. Bring a jacket for the AC. Get there early, the terrace fills up fast. One of the best nights I've had in this city.",
    mainImage: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80",
    gallery: [],
    tags: ["Romantic", "Nightlife"],
    likes: 83,
    ratingSum: 365,
    ratingCount: 72,
    commentCount: 9,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: "seed11",
    authorId: "GH-910274",
    authorName: "Lestari",
    authorAge: 27,
    authorGuestId: "GH-910274",
    authorCity: "Surabaya",
    authorFlag: "🇮🇩",
    authorImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
    isGlobal: false,
    title: "Cooking Class at Bumbu Desa",
    location: "Bumbu Desa Cooking Studio, Surabaya",
    description: "We cooked rendang and gado-gado from scratch. Two hours, side by side, then ate everything. You get to see how someone handles chaos in a kitchen — very telling.",
    mainImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    gallery: [],
    tags: ["Foodie", "Romantic"],
    likes: 57,
    ratingSum: 252,
    ratingCount: 50,
    commentCount: 3,
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    id: "seed12",
    authorId: "GH-557093",
    authorName: "Arief",
    authorAge: 32,
    authorGuestId: "GH-557093",
    authorCity: "Bali",
    authorFlag: "🇮🇩",
    authorImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80",
    isGlobal: false,
    title: "Jazz Night at Jukung Bali",
    location: "Jukung Bali Jazz Bar, Seminyak",
    description: "Small intimate space, great live band on Thursdays. Sit at the bar, dress slightly up. The music does all the work — you barely notice two hours passing.",
    mainImage: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&q=80",
    gallery: [],
    tags: ["Nightlife", "Romantic", "Cultural"],
    likes: 66,
    ratingSum: 290,
    ratingCount: 57,
    commentCount: 4,
    createdAt: Date.now() - 86400000 * 3,
  },
];

const SEED_COMMENTS: Record<string, Comment[]> = {
  seed1: [
    { id: "c1", postId: "seed1", authorId: "system", authorName: "Sofia M.", text: "Went here last Friday — the view was stunning. Highly recommend!", createdAt: Date.now() - 86400000 * 2 },
    { id: "c2", postId: "seed1", authorId: "system", authorName: "James K.", text: "Great idea for a first date. Low pressure, beautiful scenery.", createdAt: Date.now() - 86400000 },
  ],
  seed2: [
    { id: "c3", postId: "seed2", authorId: "system", authorName: "Priya L.", text: "Done this twice now. Always a hit!", createdAt: Date.now() - 86400000 * 5 },
  ],
  seed4: [
    { id: "c4", postId: "seed4", authorId: "system", authorName: "Marco T.", text: "Best free date in the city honestly.", createdAt: Date.now() - 86400000 * 10 },
    { id: "c5", postId: "seed4", authorId: "system", authorName: "Aisha B.", text: "Bring bug spray 😄 but yes totally worth it.", createdAt: Date.now() - 86400000 * 8 },
    { id: "c6", postId: "seed4", authorId: "system", authorName: "Tom H.", text: "We stayed till sunset. Magical.", createdAt: Date.now() - 86400000 * 3 },
  ],
  seed5: [
    { id: "c7",  postId: "seed5", authorId: "system", authorName: "Lena C.", text: "Did this on our second date. We just kept walking and trying things for 3 hours!", createdAt: Date.now() - 86400000 },
    { id: "c8",  postId: "seed5", authorId: "system", authorName: "Raj P.", text: "The dumplings stall near the entrance is 🔥 do not skip it.", createdAt: Date.now() - 86400000 * 2 },
    { id: "c9",  postId: "seed5", authorId: "system", authorName: "Nina W.", text: "Go hungry. Seriously.", createdAt: Date.now() - 86400000 * 1 },
  ],
  seed6: [
    { id: "c10", postId: "seed6", authorId: "system", authorName: "Dev S.", text: "We failed spectacularly but laughed the whole time. 10/10 would recommend.", createdAt: Date.now() - 86400000 * 4 },
    { id: "c11", postId: "seed6", authorId: "system", authorName: "Cara M.", text: "Book the Horror room if you want an excuse to hold hands 😂", createdAt: Date.now() - 86400000 * 3 },
  ],
  seed7: [
    { id: "c12", postId: "seed7", authorId: "system", authorName: "Tomas R.", text: "Neither of us could dance at all. That made it 10× more fun.", createdAt: Date.now() - 86400000 * 7 },
    { id: "c13", postId: "seed7", authorId: "system", authorName: "Yuki T.", text: "Stayed for the social after-class. Met the most interesting people.", createdAt: Date.now() - 86400000 * 6 },
    { id: "c14", postId: "seed7", authorId: "system", authorName: "Fatima A.", text: "Best date I've ever been on. Full stop.", createdAt: Date.now() - 86400000 * 5 },
  ],
  seed9: [
    { id: "c15", postId: "seed9", authorId: "system", authorName: "Olga N.", text: "My vase looked terrible. His was worse. We couldn't stop laughing.", createdAt: Date.now() - 86400000 * 15 },
    { id: "c16", postId: "seed9", authorId: "system", authorName: "Ben H.", text: "We kept ours. Still on my shelf 6 months later.", createdAt: Date.now() - 86400000 * 12 },
  ],
  seed10: [
    { id: "c17", postId: "seed10", authorId: "system", authorName: "Mia K.", text: "Bring a blanket! It gets cold even in summer once the sun drops.", createdAt: Date.now() - 86400000 * 5 },
    { id: "c18", postId: "seed10", authorId: "system", authorName: "Luke D.", text: "Watched La La Land here. Perfect film for a date night.", createdAt: Date.now() - 86400000 * 4 },
    { id: "c19", postId: "seed10", authorId: "system", authorName: "Sara V.", text: "The vibe before the film starts is almost better than the film itself.", createdAt: Date.now() - 86400000 * 2 },
  ],
  seed12: [
    { id: "c20", postId: "seed12", authorId: "system", authorName: "Felix B.", text: "Arrived at 9pm on a Thursday. Perfect crowd. Not too loud, not too quiet.", createdAt: Date.now() - 86400000 * 20 },
    { id: "c21", postId: "seed12", authorId: "system", authorName: "Ines T.", text: "This completely changed the energy of our date. Magic.", createdAt: Date.now() - 86400000 * 14 },
  ],
};

// ── Storage ───────────────────────────────────────────────────────────────────

const POSTS_KEY        = "ghost_date_ideas_posts";
const COMMENTS_KEY     = "ghost_date_ideas_comments";
const INTERACTIONS_KEY = "ghost_date_ideas_interactions";

function loadPosts(): DateIdeaPost[] {
  try {
    const stored = localStorage.getItem(POSTS_KEY);
    const posts: DateIdeaPost[] = stored ? JSON.parse(stored) : [];
    const ids = new Set(posts.map(p => p.id));
    const merged = [...posts];
    for (const s of SEED_POSTS) { if (!ids.has(s.id)) merged.push(s); }
    return merged;
  } catch { return [...SEED_POSTS]; }
}

function savePosts(posts: DateIdeaPost[]) {
  try { localStorage.setItem(POSTS_KEY, JSON.stringify(posts)); } catch {}
}

function loadComments(postId: string): Comment[] {
  try {
    const all: Record<string, Comment[]> = JSON.parse(localStorage.getItem(COMMENTS_KEY) || "{}");
    const stored = all[postId] ?? [];
    const seeded = SEED_COMMENTS[postId] ?? [];
    const ids = new Set(stored.map(c => c.id));
    return [...stored, ...seeded.filter(c => !ids.has(c.id))].sort((a, b) => b.createdAt - a.createdAt);
  } catch { return SEED_COMMENTS[postId] ?? []; }
}

function saveComment(comment: Comment) {
  try {
    const all: Record<string, Comment[]> = JSON.parse(localStorage.getItem(COMMENTS_KEY) || "{}");
    all[comment.postId] = [comment, ...(all[comment.postId] ?? [])];
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
  } catch {}
}

function loadInteractions(): UserInteractions {
  try {
    const raw = JSON.parse(localStorage.getItem(INTERACTIONS_KEY) || "{}");
    return { likedPosts: [], ratedPosts: {}, reportedPosts: [], reportedComments: [], ...raw };
  } catch { return { likedPosts: [], ratedPosts: {}, reportedPosts: [], reportedComments: [] }; }
}

function saveInteractions(i: UserInteractions) {
  try { localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(i)); } catch {}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMyInfo() {
  try {
    const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    return {
      id:      p.ghost_id || p.phone || "guest",
      name:    p.name || p.display_name || "Ghost",
      age:     typeof p.age === "number" ? p.age : (p.age ? parseInt(p.age) : undefined) as number | undefined,
      city:    p.city || "",
      flag:    p.country_flag || p.countryFlag || "",
      guestId: p.ghost_id || p.phone || "",
      image:   p.image || p.profile_image || "",
    };
  } catch { return { id: "guest", name: "Ghost", age: undefined, city: "", flag: "", guestId: "", image: "" }; }
}

function getMyCity(): string {
  try {
    const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    return p.city || "";
  } catch { return ""; }
}

function avgRating(post: DateIdeaPost): number {
  if (!post.ratingCount) return 0;
  return Math.round((post.ratingSum / post.ratingCount) * 10) / 10;
}

function trendingScore(post: DateIdeaPost): number {
  const hours = (Date.now() - post.createdAt) / 3600000;
  return (post.likes + post.ratingCount * 2) / Math.pow(hours + 2, 1.2);
}

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Stars({ rating, interactive, onRate, size = 13 }: {
  rating: number; interactive?: boolean; onRate?: (n: number) => void; size?: number;
}) {
  const [hover, setHover] = useState(0);
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          onClick={() => interactive && onRate?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          style={{
            fontSize: size,
            color: i <= (hover || Math.round(rating)) ? "#fbbf24" : "rgba(255,255,255,0.2)",
            cursor: interactive ? "pointer" : "default",
            transition: "color 0.1s",
          }}
        >★</span>
      ))}
    </span>
  );
}


// ── Create Post Sheet ─────────────────────────────────────────────────────────

function CreatePostSheet({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (post: DateIdeaPost) => void;
}) {
  const a       = useGenderAccent();
  const me      = getMyInfo();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title,    setTitle]    = useState("");
  const [location, setLocation] = useState("");
  const [desc,     setDesc]     = useState("");
  const [images,   setImages]   = useState<string[]>([]);   // up to 4 data URLs
  const [activeImg, setActiveImg] = useState<string>("");

  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(false);


  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4 - images.length);
    if (!files.length) return;
    setLoading(true);
    let done = 0;
    const results: string[] = [];
    files.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = ev => {
        results[i] = ev.target?.result as string;
        done++;
        if (done === files.length) {
          setImages(prev => {
            const next = [...prev, ...results.filter(Boolean)].slice(0, 4);
            if (!activeImg) setActiveImg(next[0]);
            return next;
          });
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (activeImg === prev[idx]) setActiveImg(next[0] ?? "");
      return next;
    });
  };

  const submit = () => {
    const e: Record<string, string> = {};
    if (!title.trim())    e.title  = "Required";
    if (!desc.trim())     e.desc   = "Required";
    if (!images.length)   e.images = "Add at least one photo";
    if (Object.keys(e).length) { setErrors(e); return; }
    onCreated({
      id: crypto.randomUUID(),
      authorId:      me.id,
      authorName:    me.name,
      authorAge:     me.age,
      authorGuestId: me.guestId,
      authorCity:    me.city,
      authorFlag:    me.flag,
      authorImage:   me.image,
      isGlobal:      false,
      title: title.trim(), location: location.trim(),
      description: desc.trim(),
      mainImage: images[0],
      gallery:   images.slice(1),
      tags: [],
      likes: 0, ratingSum: 0, ratingCount: 0, commentCount: 0,
      createdAt: Date.now(),
    });
  };

  const inp = (err?: string): React.CSSProperties => ({
    width: "100%", borderRadius: 12, border: `1px solid ${err ? "#ef4444" : "rgba(255,255,255,0.12)"}`,
    background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13,
    padding: "10px 14px", outline: "none", boxSizing: "border-box",
  });
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5, display: "block" };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="ghost-flash-scroll"
        style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 480,
          background: "rgba(4,8,4,0.99)", borderRadius: "22px 22px 0 0",
          border: `1px solid ${a.glow(0.25)}`, borderBottom: "none",
          padding: "0 20px max(36px, env(safe-area-inset-bottom, 36px))",
          maxHeight: "94vh", overflowY: "auto",
        }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)`, marginLeft: -20, marginRight: -20 }} />
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 34, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff" }}>Post Date Idea</h2>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Share a place with the hotel</p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        {/* Poster info strip */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
          {me.image ? (
            <img src={me.image} alt={me.name} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `1.5px solid ${a.glow(0.3)}` }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: a.glow(0.15), border: `1.5px solid ${a.glow(0.3)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: a.accent, flexShrink: 0 }}>{me.name[0]}</div>
          )}
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#fff" }}>{me.name}{me.age ? <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.4)", marginLeft: 5 }}>{me.age}</span> : null}</p>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{me.flag} {me.city}{me.guestId ? <span style={{ marginLeft: 6, color: "rgba(255,255,255,0.15)" }}>ID: {me.guestId}</span> : null}</p>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Posting as you</span>
        </div>

        {/* Photos — file picker */}
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Photos (up to 4) *</label>
          {errors.images && <p style={{ margin: "-2px 0 8px", fontSize: 10, color: "#ef4444" }}>{errors.images}</p>}

          {/* Main preview */}
          {activeImg && (
            <div style={{ position: "relative", height: 180, borderRadius: 14, overflow: "hidden", marginBottom: 10 }}>
              <img src={activeImg} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", borderRadius: 6, padding: "2px 8px", fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>
                {activeImg === images[0] ? "MAIN PHOTO" : `PHOTO ${images.indexOf(activeImg) + 1}`}
              </div>
            </div>
          )}

          {/* Thumbnail row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {images.map((img, i) => (
              <div key={i} style={{ position: "relative", flexShrink: 0 }}>
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setActiveImg(img)}
                  style={{
                    width: 64, height: 64, borderRadius: 10, overflow: "hidden", cursor: "pointer",
                    border: activeImg === img ? `2px solid ${a.accent}` : "2px solid rgba(255,255,255,0.1)",
                    boxShadow: activeImg === img ? `0 0 10px ${a.glow(0.4)}` : "none",
                  }}
                >
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </motion.div>
                {/* Remove button */}
                <button
                  onClick={() => removeImage(i)}
                  style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: "50%", background: "#e01010", border: "none", color: "#fff", fontSize: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
                  ✕
                </button>
                {i === 0 && <div style={{ position: "absolute", bottom: 2, left: 2, background: "rgba(0,0,0,0.7)", borderRadius: 4, padding: "1px 4px", fontSize: 7, color: "#fff", fontWeight: 800 }}>MAIN</div>}
              </div>
            ))}
            {images.length < 4 && (
              <motion.div
                whileTap={{ scale: 0.93 }}
                onClick={() => fileRef.current?.click()}
                style={{
                  width: 64, height: 64, borderRadius: 10, flexShrink: 0, cursor: "pointer",
                  border: `2px dashed ${errors.images ? "#ef4444" : "rgba(255,255,255,0.15)"}`,
                  background: "rgba(255,255,255,0.03)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                }}
              >
                {loading ? (
                  <span style={{ fontSize: 18 }}>⏳</span>
                ) : (
                  <>
                    <span style={{ fontSize: 20 }}>📷</span>
                    <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>ADD</span>
                  </>
                )}
              </motion.div>
            )}
          </div>
          <p style={{ margin: "0 0 0", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
            First photo is the main image · tap to preview · {4 - images.length} slot{4 - images.length !== 1 ? "s" : ""} remaining
          </p>

          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            style={{ display: "none" }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} maxLength={80}
            placeholder="e.g. Sunset kayaking at the harbour"
            style={{ ...inp(errors.title), height: 44 }} />
          {errors.title && <p style={{ margin: "3px 0 0", fontSize: 10, color: "#ef4444" }}>{errors.title}</p>}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Location (optional)</label>
          <input value={location} onChange={e => setLocation(e.target.value)} maxLength={80}
            placeholder="e.g. Skye Bar, Jakarta"
            style={{ ...inp(), height: 44 }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>
            Description * <span style={{ color: desc.length > 280 ? "#ef4444" : "rgba(255,255,255,0.3)", fontWeight: 400 }}>({desc.length}/300)</span>
          </label>
          <textarea value={desc} onChange={e => setDesc(e.target.value.slice(0, 300))}
            placeholder="Describe the vibe, what to expect, tips..."
            style={{ ...inp(errors.desc), height: 90, resize: "none" }} />
          {errors.desc && <p style={{ margin: "3px 0 0", fontSize: 10, color: "#ef4444" }}>{errors.desc}</p>}
        </div>


        <motion.button whileTap={{ scale: 0.97 }} onClick={submit}
          style={{ width: "100%", height: 52, borderRadius: 50, border: "none", background: a.gradient, color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", marginBottom: 4, boxShadow: `0 4px 20px ${a.glow(0.35)}` }}>
          Post Date Idea 💝
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Detail Sheet ──────────────────────────────────────────────────────────────

function DetailSheet({ post, onClose, onUpdate }: {
  post: DateIdeaPost;
  onClose: () => void;
  onUpdate: (updated: DateIdeaPost) => void;
}) {
  const a   = useGenderAccent();
  const me  = getMyInfo();
  const [interactions, setInteractions] = useState(() => loadInteractions());
  const [comments,     setComments]     = useState(() => loadComments(post.id));
  const [localPost,    setLocalPost]    = useState(post);
  const [commentText,  setCommentText]  = useState("");
  const [photoUrl,     setPhotoUrl]     = useState("");
  const [showPhotoInput, setShowPhotoInput] = useState(false);
  const [photoDone,    setPhotoDone]    = useState(false);
  const [tab,          setTab]          = useState<"comments" | "photos">("comments");
  const [showReport,   setShowReport]   = useState(false);
  const [activeImg,    setActiveImg]    = useState(post.mainImage);

  // All images = mainImage + gallery (deduplicated)
  const allImages = [localPost.mainImage, ...(localPost.gallery ?? [])].filter(Boolean);

  const liked  = interactions.likedPosts.includes(localPost.id);
  const myRate = interactions.ratedPosts[localPost.id] ?? 0;
  const avg    = avgRating(localPost);

  const toggleLike = () => {
    const next = { ...interactions };
    const updated = { ...localPost };
    if (liked) {
      next.likedPosts = next.likedPosts.filter(x => x !== localPost.id);
      updated.likes   = Math.max(0, updated.likes - 1);
    } else {
      next.likedPosts = [...next.likedPosts, localPost.id];
      updated.likes  += 1;
    }
    setInteractions(next); saveInteractions(next);
    setLocalPost(updated); onUpdate(updated);
  };

  const handleRate = (stars: number) => {
    if (myRate === stars) return;
    const next    = { ...interactions };
    const updated = { ...localPost };
    if (myRate) {
      updated.ratingSum = updated.ratingSum - myRate + stars;
    } else {
      updated.ratingSum  += stars;
      updated.ratingCount += 1;
    }
    next.ratedPosts = { ...next.ratedPosts, [localPost.id]: stars };
    setInteractions(next); saveInteractions(next);
    setLocalPost(updated); onUpdate(updated);
  };

  const submitComment = () => {
    const text = commentText.trim();
    if (!text) return;
    const c: Comment = { id: crypto.randomUUID(), postId: localPost.id, authorId: me.id, authorName: me.name, text, createdAt: Date.now() };
    saveComment(c);
    setComments(prev => [c, ...prev]);
    const updated = { ...localPost, commentCount: localPost.commentCount + 1 };
    setLocalPost(updated); onUpdate(updated);
    setCommentText("");
  };

  const submitPhoto = () => {
    if (!photoUrl.trim()) return;
    const pending = { id: crypto.randomUUID(), url: photoUrl.trim(), submittedBy: me.name };
    const updated = { ...localPost, pendingPhotos: [...(localPost.pendingPhotos ?? []), pending] };
    setLocalPost(updated); onUpdate(updated);
    setPhotoUrl(""); setShowPhotoInput(false); setPhotoDone(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 650, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="ghost-flash-scroll"
        style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 480,
          background: "rgba(4,8,4,0.99)", borderRadius: "22px 22px 0 0",
          border: `1px solid ${a.glow(0.2)}`, borderBottom: "none",
          maxHeight: "92vh", overflowY: "auto",
        }}
      >
        {/* Main image */}
        <div style={{ position: "relative", width: "100%", height: 240 }}>
          <motion.img
            key={activeImg}
            initial={{ opacity: 0.6, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            src={activeImg}
            alt={localPost.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "22px 22px 0 0" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.65))", borderRadius: "22px 22px 0 0" }} />
          {/* Close */}
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          {/* Image counter */}
          {allImages.length > 1 && (
            <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,0.6)", borderRadius: 20, padding: "4px 10px", fontSize: 10, color: "#fff", fontWeight: 700 }}>
              {allImages.indexOf(activeImg) + 1} / {allImages.length}
            </div>
          )}
          {/* Share photo badge */}
          <button
            onClick={() => { setShowPhotoInput(true); setTab("photos"); }}
            style={{ position: "absolute", bottom: 12, right: 12, display: "flex", alignItems: "center", gap: 5, background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, padding: "5px 12px", cursor: "pointer" }}
          >
            <span style={{ fontSize: 12 }}>📷</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>Add photo</span>
          </button>
        </div>

        {/* Thumbnail strip */}
        {allImages.length > 1 && (
          <div style={{ display: "flex", gap: 6, padding: "8px 12px", background: "rgba(0,0,0,0.6)", overflowX: "auto", scrollbarWidth: "none" }}>
            {allImages.map((img, i) => (
              <motion.div
                key={i}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveImg(img)}
                style={{
                  width: 52, height: 52, borderRadius: 8, overflow: "hidden", flexShrink: 0, cursor: "pointer",
                  border: activeImg === img ? "2px solid #e01010" : "2px solid rgba(255,255,255,0.1)",
                  boxShadow: activeImg === img ? "0 0 8px rgba(220,20,20,0.5)" : "none",
                  transition: "border 0.15s",
                }}
              >
                <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </motion.div>
            ))}
          </div>
        )}

        <div style={{ padding: "16px 20px max(32px, env(safe-area-inset-bottom, 32px))" }}>
          {/* Title + location */}
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>{localPost.title}</h2>
          {localPost.location && (
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.45)" }}>📍 {localPost.location}</p>
          )}

          {/* Stats bar: rating · reviews · distance */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            {avg > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Stars rating={avg} size={13} />
                <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{avg}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>({localPost.ratingCount} reviews)</span>
              </div>
            )}
            {avg > 0 && <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 11 }}>·</span>}
            {localPost.likes > 0 && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>❤️ {localPost.likes} likes</span>
            )}
            {localPost.authorCity && (
              <>
                <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 11 }}>·</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  {localPost.authorCity === getMyCity() ? "📍 Same city as you" : `🌏 ${localPost.authorCity}`}
                </span>
              </>
            )}
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginLeft: "auto" }}>{timeAgo(localPost.createdAt)}</span>
          </div>

          {/* Author profile card */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "12px 14px", marginBottom: 14 }}>
            {localPost.authorId === "system" ? (
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(212,175,55,0.12)", border: "1.5px solid rgba(212,175,55,0.3)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎩</div>
            ) : localPost.authorImage ? (
              <img src={localPost.authorImage} alt={localPost.authorName}
                style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${a.glow(0.35)}` }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: a.glow(0.15), border: `2px solid ${a.glow(0.35)}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: a.accent }}>
                {localPost.authorName[0]}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 900, color: "#fff" }}>
                {localPost.authorId === "system" ? "Mr. Butlas" : localPost.authorName}
                {localPost.authorAge && localPost.authorId !== "system" && (
                  <span style={{ fontWeight: 500, fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 6 }}>{localPost.authorAge}</span>
                )}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                {localPost.authorCity && localPost.authorId !== "system"
                  ? `${localPost.authorFlag ?? ""} ${localPost.authorCity}`
                  : <span style={{ color: "rgba(212,175,55,0.6)" }}>Hotel Concierge · Global</span>
                }
              </p>
              {localPost.authorGuestId && localPost.authorId !== "system" && (
                <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.04em" }}>ID: {localPost.authorGuestId}</p>
              )}
            </div>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", flexShrink: 0, textAlign: "right" as const }}>{timeAgo(localPost.createdAt)}</span>
          </div>


          {/* Description */}
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{localPost.description}</p>

          {/* Rating + Like row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14 }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {myRate ? "Your rating" : "Tap to rate"}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Stars rating={myRate || avg} interactive onRate={handleRate} size={20} />
                {avg > 0 && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{avg} ({localPost.ratingCount})</span>}
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleLike}
              style={{ display: "flex", alignItems: "center", gap: 6, background: liked ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)", border: `1px solid ${liked ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 50, padding: "7px 14px", cursor: "pointer" }}>
              <span style={{ fontSize: 16 }}>{liked ? "❤️" : "🤍"}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: liked ? "#ef4444" : "rgba(255,255,255,0.5)" }}>{localPost.likes}</span>
            </motion.button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, marginBottom: 14, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 3 }}>
            {(["comments", "photos"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, height: 34, borderRadius: 10, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 800,
                background: tab === t ? a.glow(0.15) : "transparent",
                color: tab === t ? a.accent : "rgba(255,255,255,0.4)",
              }}>
                {t === "comments" ? `💬 Comments (${comments.length})` : `📷 Photos (${(localPost.pendingPhotos?.length ?? 0)})`}
              </button>
            ))}
          </div>

          {tab === "comments" && (
            <>
              {/* Add comment */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value.slice(0, 200))}
                  onKeyDown={e => e.key === "Enter" && submitComment()}
                  placeholder="Add a comment..."
                  style={{ flex: 1, height: 40, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 12, padding: "0 12px", outline: "none" }}
                />
                <motion.button whileTap={{ scale: 0.95 }} onClick={submitComment}
                  style={{ height: 40, paddingInline: 16, borderRadius: 12, border: "none", background: a.glow(0.2), color: a.accent, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                  Post
                </motion.button>
              </div>

              {/* Comments list */}
              {comments.length === 0
                ? <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "20px 0" }}>No comments yet — be the first!</p>
                : comments.map(c => (
                  <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: a.glow(0.15), border: `1px solid ${a.glow(0.3)}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: a.accent }}>
                      {c.authorName[0]}
                    </div>
                    <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "8px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{c.authorName}</span>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{timeAgo(c.createdAt)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{c.text}</p>
                    </div>
                  </div>
                ))
              }
            </>
          )}

          {tab === "photos" && (
            <div>
              {showPhotoInput && !photoDone && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "0 0 8px" }}>
                    Submit a photo of this place. If approved it may become the cover image.
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)}
                      placeholder="Paste image URL..."
                      style={{ flex: 1, height: 40, borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 12, padding: "0 12px", outline: "none" }} />
                    <motion.button whileTap={{ scale: 0.95 }} onClick={submitPhoto}
                      style={{ height: 40, paddingInline: 14, borderRadius: 12, border: "none", background: a.glow(0.2), color: a.accent, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                      Submit
                    </motion.button>
                  </div>
                </div>
              )}
              {photoDone && (
                <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>📸</div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#4ade80", margin: "0 0 4px" }}>Photo submitted!</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>Under review — may become the cover image.</p>
                </div>
              )}
              {(localPost.pendingPhotos?.length ?? 0) === 0 && !showPhotoInput && (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No photos submitted yet.</p>
                  <button onClick={() => setShowPhotoInput(true)} style={{ marginTop: 8, height: 36, paddingInline: 18, borderRadius: 50, border: `1px solid ${a.glow(0.3)}`, background: a.glow(0.08), color: a.accent, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                    Be the first 📷
                  </button>
                </div>
              )}
              {(localPost.pendingPhotos ?? []).map(ph => (
                <div key={ph.id} style={{ marginBottom: 10, borderRadius: 14, overflow: "hidden", position: "relative" }}>
                  <img src={ph.url} alt="submitted" style={{ width: "100%", height: 160, objectFit: "cover" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)", padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>by {ph.submittedBy}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#fbbf24", background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 20, padding: "2px 8px" }}>Pending review</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Report button */}
          <button onClick={() => setShowReport(true)}
            style={{ marginTop: 12, width: "100%", height: 34, borderRadius: 50, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
            🚩 Report this place
          </button>
        </div>
      </motion.div>

      {/* Place report — full-screen slide-in */}
      <DateIdeaPlaceReportSheet
        show={showReport}
        postId={localPost.id}
        postTitle={localPost.title}
        onClose={() => setShowReport(false)}
      />
    </motion.div>
  );
}

// ── Main Feed ─────────────────────────────────────────────────────────────────

export default function DateIdeasFeed({ onBack }: { onBack: () => void }) {
  const a    = useGenderAccent();
  const city = getMyCity();

  const [posts,        setPosts]        = useState<DateIdeaPost[]>(() => loadPosts());
  const [sort,         setSort]         = useState<"newest" | "top" | "trending">("newest");
  const [selectedPost, setSelectedPost] = useState<DateIdeaPost | null>(null);
  const [showCreate,   setShowCreate]   = useState(false);
  const [browseCity,   setBrowseCity]   = useState<string>(city || "");
  const [showFilter,   setShowFilter]   = useState(false);
  const [showFlagSheet, setShowFlagSheet] = useState(false);
  const [invitePost,    setInvitePost]    = useState<PostRef | null>(null);
  const [interactions, setInteractions] = useState(() => loadInteractions());

  // Dynamic city list — user's city first, then rest sorted
  const availableCities = useMemo(() => {
    const s = new Set<string>();
    posts.forEach(p => { if (p.authorCity) s.add(p.authorCity); });
    if (city) s.add(city);
    const others = Array.from(s).filter(c => c !== city).sort();
    return city ? [city, ...others] : others;
  }, [posts, city]);

  const sorted = useMemo(() => {
    let list = posts;
    if (browseCity) {
      list = list.filter(p => p.isGlobal || (p.authorCity ?? "").toLowerCase() === browseCity.toLowerCase());
    }
    if (sort === "newest")   return [...list].sort((a, b) => b.createdAt - a.createdAt);
    if (sort === "top")      return [...list].sort((a, b) => avgRating(b) - avgRating(a));
    if (sort === "trending") return [...list].sort((a, b) => trendingScore(b) - trendingScore(a));
    return list;
  }, [posts, sort, browseCity]);

  const handleCreate = (post: DateIdeaPost) => {
    const next = [post, ...posts];
    setPosts(next); savePosts(next);
    setShowCreate(false);
  };

  const handleUpdate = (updated: DateIdeaPost) => {
    const next = posts.map(p => p.id === updated.id ? updated : p);
    setPosts(next); savePosts(next);
    if (selectedPost?.id === updated.id) setSelectedPost(updated);
  };

  const toggleLikeCard = (post: DateIdeaPost, e: React.MouseEvent) => {
    e.stopPropagation();
    const i    = { ...interactions };
    const liked = i.likedPosts.includes(post.id);
    const updated = { ...post, likes: liked ? Math.max(0, post.likes - 1) : post.likes + 1 };
    i.likedPosts = liked ? i.likedPosts.filter(x => x !== post.id) : [...i.likedPosts, post.id];
    setInteractions(i); saveInteractions(i);
    handleUpdate(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "#020602",
        display: "flex", flexDirection: "column",
        overflowY: "auto",
        scrollbarWidth: "none",
      }}
      className="ghost-flash-scroll"
    >
      {/* ── Header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(2,6,2,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${a.glow(0.15)}`,
        padding: "max(48px, env(safe-area-inset-top, 48px)) 16px 0",
      }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <motion.button whileTap={{ scale: 0.93 }} onClick={onBack}
            style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, border: `1px solid ${a.glow(0.25)}`, background: a.glow(0.08), color: a.accent, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ←
          </motion.button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>
              Hotel Information Center
            </h1>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Activities &amp; Places{city ? ` · ${city}` : ""}
            </p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowCreate(true)}
            style={{ height: 34, paddingInline: 14, borderRadius: 50, border: "none", background: a.gradient, color: "#fff", fontSize: 11, fontWeight: 900, cursor: "pointer", flexShrink: 0 }}>
            + Post
          </motion.button>
        </div>

        {/* ── Single filter bar: flag · city dropdown · filter btn ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, paddingBottom: 12 }}>

          {/* Flag button — opens flag/report sheet */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setShowFlagSheet(true)}
            title="Flag a post"
            style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0, cursor: "pointer",
              border: "1px solid rgba(220,20,20,0.35)",
              background: "rgba(220,20,20,0.08)",
              fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            🚩
          </motion.button>

          {/* City / country select */}
          <div style={{ flex: 1, position: "relative" }}>
            <select
              value={browseCity}
              onChange={e => setBrowseCity(e.target.value)}
              style={{
                width: "100%", height: 34, borderRadius: 10,
                border: browseCity ? `1px solid ${a.glow(0.35)}` : "1px solid rgba(255,255,255,0.12)",
                background: browseCity ? a.glow(0.08) : "rgba(255,255,255,0.05)",
                color: browseCity ? "#fff" : "rgba(255,255,255,0.45)",
                fontSize: 12, fontWeight: 700,
                padding: "0 10px",
                appearance: "none", WebkitAppearance: "none",
                cursor: "pointer", outline: "none",
              }}
            >
              <option value="">🌍 All Cities</option>
              {availableCities.map(c => (
                <option key={c} value={c}>{c === city ? `📍 ${c}` : c}</option>
              ))}
            </select>
            {/* chevron */}
            <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", fontSize: 9, color: "rgba(255,255,255,0.35)", pointerEvents: "none" }}>▼</span>
          </div>

          {/* Filter button */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setShowFilter(true)}
            style={{
              height: 34, paddingInline: 13, borderRadius: 10, flexShrink: 0, cursor: "pointer",
              border: sort !== "newest" ? `1px solid ${a.accent}` : "1px solid rgba(255,255,255,0.12)",
              background: sort !== "newest" ? a.glow(0.12) : "rgba(255,255,255,0.05)",
              color: sort !== "newest" ? a.accent : "rgba(255,255,255,0.55)",
              fontSize: 12, fontWeight: 800,
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <span style={{ fontSize: 13 }}>⚙</span>
            <span>Filter</span>
            {sort !== "newest" && (
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: a.accent, flexShrink: 0 }} />
            )}
          </motion.button>
        </div>
      </div>

      {/* ── Hero banner ── */}
      <div style={{
        position: "relative",
        margin: "0 0 4px",
        overflow: "hidden",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Background image with dark overlay */}
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=60"
          alt=""
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
            filter: "brightness(0.22) saturate(0.7)",
          }}
        />
        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(2,6,2,0.3) 0%, rgba(2,6,2,0.85) 100%)",
        }} />

        {/* Content */}
        <div style={{ position: "relative", padding: "26px 20px 22px", display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Ms. Vera badge row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img
              src="https://ik.imagekit.io/7grri5v7d/asddsasdd.png"
              alt="Ms. Vera"
              style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: "1.5px solid rgba(180,140,255,0.5)", flexShrink: 0 }}
            />
            <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(180,140,255,0.9)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              Ms. Vera · Hotel Information
            </span>
          </div>

          {/* Main heading */}
          <div>
            <h2 style={{ margin: "0 0 5px", fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
              Discover Places to<br />Take a Date
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
              Real spots recommended by hotel guests{city ? ` in ${city}` : ""}. Find your next adventure.
            </p>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
            {[
              { value: sorted.length.toString(), label: "Places" },
              { value: availableCities.length.toString(), label: "Cities" },
              { value: "💌", label: "Invite any guest" },
            ].map(({ value, label }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>{value}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter sheet ── */}
      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowFilter(false)}
            style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              onClick={e => e.stopPropagation()}
              style={{
                position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
                width: "100%", maxWidth: 480,
                background: "rgba(4,8,4,0.99)", borderRadius: "20px 20px 0 0",
                border: `1px solid ${a.glow(0.2)}`, borderBottom: "none",
                padding: "0 18px max(32px, env(safe-area-inset-bottom, 32px))",
              }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)`, marginLeft: -18, marginRight: -18 }} />
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
                <div style={{ width: 32, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>Sort & Filter</p>
                <button onClick={() => setSort("newest")} style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}>
                  Reset
                </button>
              </div>

              {/* Sort */}
              <p style={{ margin: "0 0 8px", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Sort by</p>
              <div style={{ display: "flex", gap: 7, marginBottom: 18 }}>
                {(["newest", "top", "trending"] as const).map(s => (
                  <button key={s} onClick={() => setSort(s)} style={{
                    flex: 1, height: 36, borderRadius: 50, cursor: "pointer", fontSize: 11, fontWeight: 800,
                    border: sort === s ? `1px solid ${a.accent}` : "1px solid rgba(255,255,255,0.12)",
                    background: sort === s ? a.glow(0.15) : "rgba(255,255,255,0.04)",
                    color: sort === s ? a.accent : "rgba(255,255,255,0.45)",
                  }}>
                    {s === "newest" ? "🕐 Newest" : s === "top" ? "⭐ Top" : "🔥 Hot"}
                  </button>
                ))}
              </div>


              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowFilter(false)}
                style={{ width: "100%", height: 44, borderRadius: 50, border: "none", background: a.gradient, color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                Apply
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Feed ── */}
      <div style={{ flex: 1, padding: "12px 12px max(80px, env(safe-area-inset-bottom, 80px))" }}>
        {sorted.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💝</div>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>No ideas yet</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>Be the first to post a date idea</p>
            <button onClick={() => setShowCreate(true)} style={{ height: 42, paddingInline: 24, borderRadius: 50, border: "none", background: a.gradient, color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
              Post Date Idea
            </button>
          </div>
        )}

        {sorted.map((post, idx) => {
          const liked = interactions.likedPosts.includes(post.id);
          const avg   = avgRating(post);
          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPost(post)}
              style={{
                marginBottom: 14, borderRadius: 18, overflow: "hidden",
                background: "rgba(8,14,8,0.9)",
                border: `1px solid ${a.glow(0.12)}`,
                cursor: "pointer",
              }}
            >
              {/* Image */}
              <div style={{ position: "relative", height: 190 }}>
                <img src={post.mainImage} alt={post.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy" />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.75))" }} />
                {/* Rating badge */}
                {avg > 0 && (
                  <div style={{ position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "4px 10px" }}>
                    <span style={{ fontSize: 11, color: "#fbbf24" }}>★</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{avg}</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)" }}>({post.ratingCount})</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: "12px 14px 14px" }}>
                <h3 style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>{post.title}</h3>
                {post.location && (
                  <p style={{ margin: "0 0 6px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>📍 {post.location}</p>
                )}
                <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {post.description}
                </p>

                {/* Author chip */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  {post.authorId === "system" ? (
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🎩</div>
                  ) : post.authorImage ? (
                    <img src={post.authorImage} alt={post.authorName}
                      style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `1.5px solid ${a.glow(0.3)}` }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: a.glow(0.15), border: `1.5px solid ${a.glow(0.3)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: a.accent, flexShrink: 0 }}>
                      {post.authorName[0]}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>
                        {post.authorId === "system" ? "Mr. Butlas" : post.authorName}
                      </span>
                      {post.authorAge && post.authorId !== "system" && (
                        <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>{post.authorAge}</span>
                      )}
                      {post.authorCity && post.authorId !== "system" && (
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{post.authorFlag} {post.authorCity}</span>
                      )}
                    </div>
                    {post.authorGuestId && post.authorId !== "system" && (
                      <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.04em" }}>ID: {post.authorGuestId}</p>
                    )}
                  </div>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>{timeAgo(post.createdAt)}</span>
                </div>

                {/* Action row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <motion.button whileTap={{ scale: 0.88 }} onClick={e => toggleLikeCard(post, e)}
                    style={{ display: "flex", alignItems: "center", gap: 5, height: 30, paddingInline: 12, borderRadius: 50, border: `1px solid ${liked ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.1)"}`, background: liked ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)", cursor: "pointer" }}>
                    <span style={{ fontSize: 13 }}>{liked ? "❤️" : "🤍"}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: liked ? "#ef4444" : "rgba(255,255,255,0.45)" }}>{post.likes}</span>
                  </motion.button>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, height: 30, paddingInline: 10, borderRadius: 50, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                    <span style={{ fontSize: 12 }}>💬</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>{post.commentCount}</span>
                  </div>
                  {avg > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ fontSize: 11, color: "#fbbf24" }}>★</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>{avg}</span>
                    </div>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={e => {
                      e.stopPropagation();
                      setInvitePost({ id: post.id, title: post.title, image: post.mainImage, location: post.location, authorId: post.authorId, authorName: post.authorName });
                    }}
                    style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, height: 30, paddingInline: 12, borderRadius: 50, border: "1px solid rgba(220,20,20,0.35)", background: "rgba(220,20,20,0.08)", cursor: "pointer" }}>
                    <span style={{ fontSize: 12 }}>💌</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#f87171" }}>Invite Guest</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Sheets ── */}
      <AnimatePresence>
        {showCreate && (
          <CreatePostSheet
            key="create"
            onClose={() => setShowCreate(false)}
            onCreated={handleCreate}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPost && (
          <DetailSheet
            key={selectedPost.id}
            post={selectedPost}
            onClose={() => setSelectedPost(null)}
            onUpdate={handleUpdate}
          />
        )}
      </AnimatePresence>

      <FlagFeedSheet
        show={showFlagSheet}
        posts={posts.map(p => ({ id: p.id, title: p.title, mainImage: p.mainImage, location: p.location, authorName: p.authorName }))}
        onClose={() => setShowFlagSheet(false)}
      />

      <SendDateInviteSheet
        show={!!invitePost}
        post={invitePost ?? { id: "", title: "", image: "", location: "", authorId: "", authorName: "" }}
        onClose={() => setInvitePost(null)}
      />
    </motion.div>
  );
}
