import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const RING_COLORS = ["#d4af37", "#4ade80", "#f472b6", "#a78bfa", "#60a5fa", "#fb923c"];

const STORY_TEXTS = [
  "Saw someone staring at me from across the bar. Turned out to be a Ghost member. We're meeting tomorrow 👻",
  "Three weeks in. Still don't know their real name. Best decision I ever made.",
  "Matched at 11pm. Coffee at 9am. Sometimes the night knows exactly what it's doing.",
  "Sent a rose at midnight. She replied in 30 seconds. That was 6 days ago. Still talking.",
  "First time trying Ghost and honestly I'm never going back to other apps.",
  "We matched on a Tuesday. Explored the whole city on Saturday. Zero pressure, just connection.",
  "The anonymity is what does it. You see who they really are before you see who they pretend to be.",
  "Typed 'hey' to 12 people on other apps. On Ghost I sent one real message and got one real reply.",
  "They told me their dreams before their name. That's the only way it should work.",
  "Week 1: curious. Week 2: hooked. Week 3: matched. This city is full of ghosts worth finding.",
  "The Cellar is a different universe. Walked in alone. Left with a story I'll tell for years.",
  "She said she liked my ghost ID before she liked my face. That meant more somehow.",
  "We figured out we'd been in the same coffee shop for 3 consecutive Sundays before we matched.",
  "Ghost Black was worth every cent. Top of the feed on Monday morning. Match by Tuesday night.",
  "My sister laughed when I joined. She asked me for the referral link two weeks later.",
  "I didn't want romance. I wanted honesty. Found both in the same ghost.",
  "Used to dread dating apps. Ghost is the first one I actually check with excitement.",
  "He sent a Crown gift at 2am. I laughed, then replied. Then didn't sleep.",
  "Floor chat is underrated. Had a real conversation at 1am with someone I'd never have met otherwise.",
  "Still anonymous. Still texting. Maybe forever.",
];

type Story = {
  id: string;
  name: string;
  city: string;
  seed: number;
  ring: string;
  isNew: boolean;
  text: string;
};

function seedHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return Math.abs(h);
}

const SEEDED_STORIES: Story[] = [
  { id: "s1",  name: "Ghost-3421", city: "Jakarta",       seed: 11, ring: RING_COLORS[0], isNew: true,  text: STORY_TEXTS[0]  },
  { id: "s2",  name: "Ghost-7782", city: "Bangkok",       seed: 28, ring: RING_COLORS[1], isNew: true,  text: STORY_TEXTS[1]  },
  { id: "s3",  name: "Ghost-1094", city: "Singapore",     seed: 45, ring: RING_COLORS[2], isNew: false, text: STORY_TEXTS[2]  },
  { id: "s4",  name: "Ghost-5513", city: "Kuala Lumpur",  seed: 33, ring: RING_COLORS[3], isNew: true,  text: STORY_TEXTS[3]  },
  { id: "s5",  name: "Ghost-8841", city: "Manila",        seed: 62, ring: RING_COLORS[4], isNew: false, text: STORY_TEXTS[4]  },
  { id: "s6",  name: "Ghost-2267", city: "Ho Chi Minh",   seed: 17, ring: RING_COLORS[5], isNew: true,  text: STORY_TEXTS[5]  },
  { id: "s7",  name: "Ghost-6690", city: "Bali",          seed: 54, ring: RING_COLORS[0], isNew: false, text: STORY_TEXTS[6]  },
  { id: "s8",  name: "Ghost-4432", city: "Tokyo",         seed: 39, ring: RING_COLORS[1], isNew: true,  text: STORY_TEXTS[7]  },
  { id: "s9",  name: "Ghost-9901", city: "London",        seed: 8,  ring: RING_COLORS[2], isNew: false, text: STORY_TEXTS[8]  },
  { id: "s10", name: "Ghost-3374", city: "Sydney",        seed: 71, ring: RING_COLORS[3], isNew: true,  text: STORY_TEXTS[9]  },
];

type MyStory = { text: string; createdAt: number };

function loadMyStories(): MyStory[] {
  try { return JSON.parse(localStorage.getItem("ghost_my_stories") || "[]"); } catch { return []; }
}
function saveMyStory(text: string) {
  const stories = loadMyStories();
  const now = Date.now();
  const fresh = stories.filter(s => now - s.createdAt < 24 * 60 * 60 * 1000);
  fresh.push({ text, createdAt: now });
  try { localStorage.setItem("ghost_my_stories", JSON.stringify(fresh)); } catch {}
}

export default function GhostStoriesBar() {
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [progress, setProgress] = useState(0);
  const [showAddMyStory, setShowAddMyStory] = useState(false);
  const [myStoryText, setMyStoryText] = useState("");
  const [myStories, setMyStories] = useState<MyStory[]>(() => {
    const loaded = loadMyStories();
    const now = Date.now();
    return loaded.filter(s => now - s.createdAt < 24 * 60 * 60 * 1000);
  });

  useEffect(() => {
    if (!activeStory) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { setActiveStory(null); return 0; }
        return p + 100 / 40;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [activeStory]);

  const handleAddStory = () => {
    if (!myStoryText.trim()) return;
    saveMyStory(myStoryText.trim());
    const now = Date.now();
    setMyStories(loadMyStories().filter(s => now - s.createdAt < 24 * 60 * 60 * 1000));
    setMyStoryText("");
    setShowAddMyStory(false);
  };

  const myGhostId = (() => {
    try {
      const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
      const id = p.id || "anon";
      return `Ghost-${1000 + (seedHash(id) % 9000)}`;
    } catch { return "Ghost-???"; }
  })();

  const hasMyStory = myStories.length > 0;

  return (
    <>
      <div style={{ overflowX: "auto", scrollbarWidth: "none", margin: "10px 0 0" } as React.CSSProperties}>
        <style>{`.stories-row::-webkit-scrollbar{display:none}`}</style>
        <div className="stories-row" style={{ display: "flex", gap: 12, padding: "2px 14px 4px" }}>

          {/* My Story */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
            onClick={() => hasMyStory
              ? setActiveStory({ id: "my", name: myGhostId, city: "You", seed: 1, ring: "#d4af37", isNew: true, text: myStories[myStories.length - 1].text })
              : setShowAddMyStory(true)
            }
          >
            <div style={{
              width: 54, height: 54, borderRadius: "50%",
              border: hasMyStory ? "2px solid #d4af37" : "2px dashed rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: hasMyStory ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.04)",
              position: "relative",
            }}>
              {hasMyStory ? (
                <img
                  src={`https://i.pravatar.cc/60?img=1`}
                  alt=""
                  style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: 22, color: "rgba(255,255,255,0.4)" }}>+</span>
              )}
            </div>
            <span style={{ fontSize: 8, color: "rgba(255,255,255,0.45)", fontWeight: 700, whiteSpace: "nowrap", maxWidth: 58, overflow: "hidden", textOverflow: "ellipsis" }}>Your Story</span>
          </div>

          {/* Seeded stories */}
          {SEEDED_STORIES.map((story, i) => (
            <div
              key={story.id}
              style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
              onClick={() => setActiveStory(story)}
            >
              <motion.div
                animate={story.isNew ? { boxShadow: [`0 0 0 2px ${story.ring}`, `0 0 8px 3px ${story.ring}`, `0 0 0 2px ${story.ring}`] } : {}}
                transition={{ duration: 1.8, repeat: Infinity }}
                style={{
                  width: 54, height: 54, borderRadius: "50%",
                  border: `2.5px solid ${story.ring}`,
                  padding: 2,
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <img
                  src={`https://i.pravatar.cc/60?img=${story.seed}`}
                  alt=""
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", display: "block" }}
                />
              </motion.div>
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.45)", fontWeight: 700, whiteSpace: "nowrap", maxWidth: 62, overflow: "hidden", textOverflow: "ellipsis" }}>
                {story.name.replace("Ghost-", "G-")} · {story.city.split(" ")[0]}
              </span>
              {story.isNew && i < 4 && (
                <div style={{ position: "absolute", marginTop: -8, marginLeft: 32, width: 8, height: 8, borderRadius: "50%", background: story.ring, border: "1px solid #050508" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Story overlay */}
      <AnimatePresence>
        {activeStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveStory(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 9500,
              background: "rgba(0,0,0,0.95)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "0 24px",
            }}
          >
            {/* Progress bar */}
            <div style={{ position: "absolute", top: 52, left: 14, right: 14, height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2 }}>
              <div style={{ height: "100%", width: `${progress}%`, background: activeStory.ring, borderRadius: 2, transition: "width 0.1s linear" }} />
            </div>

            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}
            >
              <div style={{ width: 72, height: 72, borderRadius: "50%", border: `3px solid ${activeStory.ring}`, overflow: "hidden" }}>
                <img src={`https://i.pravatar.cc/80?img=${activeStory.seed}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: activeStory.ring }}>{activeStory.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{activeStory.city}</p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "18px 20px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.65, fontStyle: "italic" }}>
                  "{activeStory.text}"
                </p>
              </div>
              <button
                onClick={() => setActiveStory(null)}
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "8px 24px", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Tap to close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add my story sheet */}
      <AnimatePresence>
        {showAddMyStory && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAddMyStory(false)}
            style={{ position: "fixed", inset: 0, zIndex: 9400, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 480, background: "rgba(8,8,14,0.99)", borderRadius: "22px 22px 0 0", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none", padding: "20px 18px max(28px,env(safe-area-inset-bottom,28px))" }}
            >
              <p style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 900, color: "#d4af37" }}>✨ Add Your Story</p>
              <p style={{ margin: "0 0 10px", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Share something anonymous. Visible for 24h.</p>
              <textarea
                value={myStoryText}
                onChange={e => setMyStoryText(e.target.value)}
                placeholder="Something that happened tonight…"
                maxLength={200}
                rows={4}
                style={{ width: "100%", boxSizing: "border-box", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 13, padding: "12px 14px", outline: "none", fontFamily: "inherit", resize: "none", marginBottom: 12 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleAddStory}
                  disabled={!myStoryText.trim()}
                  style={{ flex: 1, height: 42, borderRadius: 12, background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.4)", color: "#d4af37", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                >
                  Share Story
                </button>
                <button
                  onClick={() => setShowAddMyStory(false)}
                  style={{ height: 42, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "0 16px" }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
