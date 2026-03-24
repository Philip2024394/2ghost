// ── Connect 4 · Games Room ────────────────────────────────────────────────────

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";

// ── Constants ──────────────────────────────────────────────────────────────────
const ROWS = 6;
const COLS = 7;
const EMPTY = 0 as const;
const PLAYER = 1 as const;
const AI = 2 as const;

const PLAYER_COLOR = "#ef4444";
const AI_COLOR     = "#facc15";
const BOARD_FACE   = "#0b0d26";

const BUTLER_IMG = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdfccc-removebg-preview.png";

const GIFTS = [
  { id: "cigarettes", img: "https://ik.imagekit.io/7grri5v7d/Untitledsdadd-removebg-preview.png", name: "Cigarettes", price: 8  },
  { id: "beer",       img: "https://ik.imagekit.io/7grri5v7d/Untitledsdfsdss-removebg-preview.png", name: "Beer",     price: 15 },
  { id: "brandy",     img: "https://ik.imagekit.io/7grri5v7d/sds-removebg-preview.png",             name: "Brandy",   price: 25 },
];

const BET_OPTIONS = [0, 5, 10, 25, 50];

// ── Game logic ─────────────────────────────────────────────────────────────────
type Cell  = 0 | 1 | 2;
type Board = Cell[][];
type WinLine = [number, number][] | null;

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY) as Cell[]);
}

function dropPiece(board: Board, col: number, player: Cell): Board | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === EMPTY) {
      const next = board.map(row => [...row]) as Board;
      next[r][col] = player;
      return next;
    }
  }
  return null;
}

function checkWin(board: Board, player: Cell): WinLine {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== player) continue;
      for (const [dr, dc] of dirs) {
        const line: [number,number][] = [[r,c]];
        for (let k = 1; k < 4; k++) {
          const nr = r + dr*k, nc = c + dc*k;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== player) break;
          line.push([nr,nc]);
        }
        if (line.length === 4) return line;
      }
    }
  }
  return null;
}

function isFull(board: Board): boolean { return board[0].every(c => c !== EMPTY); }

function scoreWindow(window: Cell[], player: Cell): number {
  const opp = player === PLAYER ? AI : PLAYER;
  const p = window.filter(c => c === player).length;
  const o = window.filter(c => c === opp).length;
  const e = window.filter(c => c === EMPTY).length;
  if (p === 4) return 100;
  if (p === 3 && e === 1) return 5;
  if (p === 2 && e === 2) return 2;
  if (o === 3 && e === 1) return -4;
  return 0;
}

function scoreBoard(board: Board, player: Cell): number {
  let score = 0;
  const center = board.map(r => r[Math.floor(COLS/2)]);
  score += center.filter(c => c === player).length * 3;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c <= COLS-4; c++)
      score += scoreWindow([board[r][c],board[r][c+1],board[r][c+2],board[r][c+3]], player);
  for (let c = 0; c < COLS; c++)
    for (let r = 0; r <= ROWS-4; r++)
      score += scoreWindow([board[r][c],board[r+1][c],board[r+2][c],board[r+3][c]], player);
  for (let r = 0; r <= ROWS-4; r++)
    for (let c = 0; c <= COLS-4; c++)
      score += scoreWindow([board[r][c],board[r+1][c+1],board[r+2][c+2],board[r+3][c+3]], player);
  for (let r = 3; r < ROWS; r++)
    for (let c = 0; c <= COLS-4; c++)
      score += scoreWindow([board[r][c],board[r-1][c+1],board[r-2][c+2],board[r-3][c+3]], player);
  return score;
}

function minimax(board: Board, depth: number, alpha: number, beta: number, maximizing: boolean): number {
  if (checkWin(board, AI))     return 1000 + depth;
  if (checkWin(board, PLAYER)) return -1000 - depth;
  if (isFull(board) || depth === 0) return scoreBoard(board, AI);
  const cols = Array.from({length: COLS}, (_,i) => i).filter(c => board[0][c] === EMPTY);
  if (maximizing) {
    let best = -Infinity;
    for (const c of cols) {
      best = Math.max(best, minimax(dropPiece(board,c,AI)!, depth-1, alpha, beta, false));
      alpha = Math.max(alpha, best);
      if (alpha >= beta) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const c of cols) {
      best = Math.min(best, minimax(dropPiece(board,c,PLAYER)!, depth-1, alpha, beta, true));
      beta = Math.min(beta, best);
      if (alpha >= beta) break;
    }
    return best;
  }
}

function bestAIMove(board: Board): number {
  const cols = Array.from({length: COLS}, (_,i) => i).filter(c => board[0][c] === EMPTY);
  let bestScore = -Infinity, bestCol = cols[0];
  for (const c of cols) {
    const score = minimax(dropPiece(board,c,AI)!, 5, -Infinity, Infinity, false);
    if (score > bestScore) { bestScore = score; bestCol = c; }
  }
  return bestCol;
}

function getDropRow(board: Board, col: number): number {
  for (let r = ROWS-1; r >= 0; r--) if (board[r][col] === EMPTY) return r;
  return -1;
}

// ── Coin fall seed data ────────────────────────────────────────────────────────
function makeCoinData(seed: number) {
  return Array.from({ length: 35 }, (_, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    return {
      left:     (col / (COLS-1)) * 84 + 8 + Math.sin((i + seed) * 2.1) * 2.5,
      delay:    row * 0.065 + col * 0.022,
      duration: 0.36 + (i % 5) * 0.065,
      color:    [PLAYER_COLOR, AI_COLOR, "rgba(255,255,255,0.65)"][i % 3],
      size:     8 + (i % 4) * 3,
    };
  });
}

// ── Countries ─────────────────────────────────────────────────────────────────
const WORLD_COUNTRIES = [
  { code:"GB", flag:"🇬🇧", name:"UK"          },
  { code:"US", flag:"🇺🇸", name:"USA"         },
  { code:"JP", flag:"🇯🇵", name:"Japan"       },
  { code:"DE", flag:"🇩🇪", name:"Germany"     },
  { code:"FR", flag:"🇫🇷", name:"France"      },
  { code:"BR", flag:"🇧🇷", name:"Brazil"      },
  { code:"IN", flag:"🇮🇳", name:"India"       },
  { code:"AU", flag:"🇦🇺", name:"Australia"   },
  { code:"CA", flag:"🇨🇦", name:"Canada"      },
  { code:"SG", flag:"🇸🇬", name:"Singapore"   },
  { code:"AE", flag:"🇦🇪", name:"UAE"         },
  { code:"ZA", flag:"🇿🇦", name:"S. Africa"   },
  { code:"MX", flag:"🇲🇽", name:"Mexico"      },
  { code:"IT", flag:"🇮🇹", name:"Italy"       },
  { code:"ES", flag:"🇪🇸", name:"Spain"       },
  { code:"KR", flag:"🇰🇷", name:"S. Korea"    },
  { code:"NG", flag:"🇳🇬", name:"Nigeria"     },
  { code:"AR", flag:"🇦🇷", name:"Argentina"   },
  { code:"TR", flag:"🇹🇷", name:"Turkey"      },
  { code:"NL", flag:"🇳🇱", name:"Netherlands" },
];
function getCountryFlag(code: string) {
  return WORLD_COUNTRIES.find(c => c.code === code)?.flag ?? "";
}

// ── Players data ──────────────────────────────────────────────────────────────
// ── Skill levels ──────────────────────────────────────────────────────────────
function skillLevel(wins: number): { label: string; color: string } {
  if (wins >= 50) return { label: "Elite",    color: "#f59e0b" };
  if (wins >= 30) return { label: "Pro",      color: "#a78bfa" };
  if (wins >= 15) return { label: "Medium",   color: "#34d399" };
  if (wins >= 5)  return { label: "Amateur",  color: "#60a5fa" };
  return                  { label: "Beginner", color: "rgba(255,255,255,0.35)" };
}

// ── Game record ───────────────────────────────────────────────────────────────
type GameRecord = {
  id: string;
  opponent: string;
  result: "win" | "loss" | "draw" | "forfeit";
  wager: number;
  ts: number; // timestamp
};

type MockPlayer = {
  id: string; name: string; floor: string; fc: string;
  isPlaying: boolean; likedMe: boolean; wins: number;
  country: string; isCountryChamp: boolean; pendingDefense: boolean;
};
const MOCK_PLAYERS: MockPlayer[] = [
  // Champions
  { id:"p1",  name:"Aria K.",     floor:"penthouse", fc:"#a78bfa", isPlaying:true,  likedMe:true,  wins:47, country:"SG", isCountryChamp:true,  pendingDefense:false },
  { id:"p2",  name:"Marcus T.",   floor:"suite",     fc:"#60a5fa", isPlaying:true,  likedMe:false, wins:31, country:"US", isCountryChamp:true,  pendingDefense:true  },
  { id:"p3",  name:"Yuki M.",     floor:"loft",      fc:"#34d399", isPlaying:false, likedMe:true,  wins:28, country:"JP", isCountryChamp:true,  pendingDefense:false },
  { id:"p4",  name:"Dev S.",      floor:"kings",     fc:"#facc15", isPlaying:true,  likedMe:false, wins:24, country:"IN", isCountryChamp:true,  pendingDefense:true  },
  { id:"p5",  name:"Lena P.",     floor:"cellar",    fc:"#fb923c", isPlaying:false, likedMe:false, wins:17, country:"DE", isCountryChamp:true,  pendingDefense:false },
  { id:"p6",  name:"Mia C.",      floor:"kings",     fc:"#facc15", isPlaying:true,  likedMe:false, wins:12, country:"AU", isCountryChamp:true,  pendingDefense:false },
  { id:"p7",  name:"Hugo L.",     floor:"suite",     fc:"#f472b6", isPlaying:true,  likedMe:true,  wins:22, country:"FR", isCountryChamp:true,  pendingDefense:false },
  { id:"p8",  name:"Oliver B.",   floor:"loft",      fc:"#a78bfa", isPlaying:false, likedMe:false, wins:19, country:"GB", isCountryChamp:true,  pendingDefense:true  },
  { id:"p9",  name:"Rafael C.",   floor:"penthouse", fc:"#34d399", isPlaying:false, likedMe:true,  wins:26, country:"BR", isCountryChamp:true,  pendingDefense:false },
  { id:"p10", name:"Nadia V.",    floor:"suite",     fc:"#60a5fa", isPlaying:true,  likedMe:false, wins:14, country:"NL", isCountryChamp:true,  pendingDefense:false },
  { id:"p11", name:"Kwame A.",    floor:"kings",     fc:"#fb923c", isPlaying:false, likedMe:true,  wins:20, country:"NG", isCountryChamp:true,  pendingDefense:false },
  { id:"p12", name:"Tariq M.",    floor:"loft",      fc:"#facc15", isPlaying:true,  likedMe:false, wins:33, country:"AE", isCountryChamp:true,  pendingDefense:true  },
  { id:"p13", name:"Elena V.",    floor:"penthouse", fc:"#a78bfa", isPlaying:false, likedMe:true,  wins:15, country:"ES", isCountryChamp:true,  pendingDefense:false },
  { id:"p14", name:"Marco R.",    floor:"suite",     fc:"#f472b6", isPlaying:true,  likedMe:false, wins:18, country:"IT", isCountryChamp:true,  pendingDefense:false },
  { id:"p15", name:"Jin W.",      floor:"standard",  fc:"rgba(255,255,255,0.35)", isPlaying:false, likedMe:false, wins:15, country:"KR", isCountryChamp:true, pendingDefense:false },
  { id:"p16", name:"Kenji T.",    floor:"loft",      fc:"#34d399", isPlaying:true,  likedMe:true,  wins:21, country:"JP", isCountryChamp:false, pendingDefense:false },
  { id:"p17", name:"Valeria P.",  floor:"suite",     fc:"#fb923c", isPlaying:false, likedMe:false, wins:16, country:"AR", isCountryChamp:true,  pendingDefense:true  },
  { id:"p18", name:"Emre K.",     floor:"kings",     fc:"#60a5fa", isPlaying:true,  likedMe:false, wins:13, country:"TR", isCountryChamp:true,  pendingDefense:false },
  { id:"p19", name:"Amara D.",    floor:"cellar",    fc:"#34d399", isPlaying:false, likedMe:true,  wins:11, country:"ZA", isCountryChamp:true,  pendingDefense:false },
  { id:"p20", name:"Lucia F.",    floor:"penthouse", fc:"#a78bfa", isPlaying:true,  likedMe:false, wins:9,  country:"MX", isCountryChamp:true,  pendingDefense:false },
  { id:"p21", name:"Elias M.",    floor:"suite",     fc:"#facc15", isPlaying:false, likedMe:true,  wins:29, country:"CA", isCountryChamp:true,  pendingDefense:false },
  // Non-champions
  { id:"p22", name:"Sofia R.",    floor:"suite",     fc:"#f472b6", isPlaying:false, likedMe:true,  wins:19, country:"BR", isCountryChamp:false, pendingDefense:false },
  { id:"p23", name:"Priya N.",    floor:"loft",      fc:"#34d399", isPlaying:false, likedMe:false, wins:8,  country:"IN", isCountryChamp:false, pendingDefense:false },
  { id:"p24", name:"Carlos B.",   floor:"penthouse", fc:"#a78bfa", isPlaying:false, likedMe:true,  wins:10, country:"AR", isCountryChamp:false, pendingDefense:false },
  { id:"p25", name:"Yara H.",     floor:"kings",     fc:"#fb923c", isPlaying:true,  likedMe:false, wins:7,  country:"AE", isCountryChamp:false, pendingDefense:false },
  { id:"p26", name:"Tom H.",      floor:"standard",  fc:"rgba(255,255,255,0.35)", isPlaying:false, likedMe:false, wins:4, country:"GB", isCountryChamp:false, pendingDefense:false },
  { id:"p27", name:"Hana B.",     floor:"loft",      fc:"#60a5fa", isPlaying:true,  likedMe:true,  wins:6,  country:"DE", isCountryChamp:false, pendingDefense:false },
  { id:"p28", name:"Sam W.",      floor:"suite",     fc:"#34d399", isPlaying:false, likedMe:false, wins:3,  country:"US", isCountryChamp:false, pendingDefense:false },
  { id:"p29", name:"Ren Y.",      floor:"kings",     fc:"#facc15", isPlaying:true,  likedMe:false, wins:12, country:"KR", isCountryChamp:false, pendingDefense:false },
  { id:"p30", name:"Layla O.",    floor:"cellar",    fc:"#f472b6", isPlaying:false, likedMe:true,  wins:5,  country:"NG", isCountryChamp:false, pendingDefense:false },
];

// ── Player row ─────────────────────────────────────────────────────────────────
function PlayerRow({ p, onInvite }: { p: MockPlayer; onInvite: () => void }) {
  const flag  = getCountryFlag(p.country);
  const skill = skillLevel(p.wins);
  return (
    <motion.div initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }}
      style={{ display:"flex", alignItems:"center", gap:10,
        padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ position:"relative", flexShrink:0 }}>
        <div style={{ width:38, height:38, borderRadius:12, overflow:"hidden",
          background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>
          👤
        </div>
        {p.isPlaying && (
          <motion.div animate={{ scale:[1,1.5,1], opacity:[1,0.4,1] }}
            transition={{ duration:1.2, repeat:Infinity }}
            style={{ position:"absolute", bottom:-2, right:-2, width:9, height:9,
              borderRadius:"50%", background:"#22c55e", border:"1.5px solid #05050f" }} />
        )}
        {p.isCountryChamp && (
          <div style={{ position:"absolute", top:-5, left:-5, fontSize:13, lineHeight:1,
            filter:"drop-shadow(0 1px 3px rgba(0,0,0,0.8))" }}>{flag}</div>
        )}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <p style={{ margin:0, fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.85)",
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {p.name}
          </p>
          {p.isCountryChamp && <span style={{ fontSize:12, lineHeight:1 }}>{flag}</span>}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:2, flexWrap:"wrap" }}>
          <span style={{ fontSize:9, fontWeight:600, color:"rgba(255,255,255,0.35)",
            padding:"1px 5px", borderRadius:4, background:"rgba(255,255,255,0.05)",
            border:"1px solid rgba(255,255,255,0.08)" }}>
            {p.floor}
          </span>
          <span style={{ fontSize:9, fontWeight:700, color:skill.color,
            padding:"1px 5px", borderRadius:4,
            background:`${skill.color}18`, border:`1px solid ${skill.color}30` }}>
            {skill.label}
          </span>
          {p.likedMe && <span style={{ fontSize:9, color:"rgba(239,68,68,0.7)" }}>❤</span>}
          {p.isPlaying && <span style={{ fontSize:9, color:"rgba(134,239,172,0.75)", fontWeight:600 }}>● live</span>}
          {p.pendingDefense && (
            <motion.span animate={{ opacity:[1,0.4,1] }} transition={{ duration:1.1, repeat:Infinity }}
              style={{ fontSize:9, color:"rgba(251,146,60,0.9)", fontWeight:700 }}>⚠ must defend</motion.span>
          )}
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:4, flexShrink:0 }}>
        <motion.button whileTap={{ scale:0.88 }} onClick={onInvite}
          style={{ height:28, padding:"0 10px", borderRadius:8, cursor:"pointer",
            background: p.isCountryChamp ? "rgba(250,204,21,0.10)" : "rgba(255,255,255,0.05)",
            border: p.isCountryChamp ? "1px solid rgba(250,204,21,0.35)" : "1px solid rgba(255,255,255,0.1)",
            color: p.isCountryChamp ? "#facc15" : "rgba(255,255,255,0.55)",
            fontSize:10, fontWeight:700 }}>
          {p.isCountryChamp ? "⚔ Challenge" : p.isPlaying ? "Join" : "Invite"}
        </motion.button>
        <p style={{ margin:0, fontSize:8, color:"rgba(255,255,255,0.25)", textAlign:"center",
          fontWeight:600 }}>{p.wins}W</p>
      </div>
    </motion.div>
  );
}

// ── Players side drawer ────────────────────────────────────────────────────────
function PlayersDrawer({ onClose, onInvite, gameHistory }: {
  onClose:      () => void;
  onInvite:     (name: string) => void;
  gameHistory:  GameRecord[];
}) {
  const [tab, setTab] = useState<"live"|"leaders"|"world"|"guests"|"log">("live");
  const [selectedCountry, setSelectedCountry] = useState<string|null>(WORLD_COUNTRIES[0].code);

  // ── Wheel picker ─────────────────────────────────────────────────────────
  const WHEEL_ITEM_H = 56;
  const WHEEL_VISIBLE = 5;
  const WHEEL_H = WHEEL_ITEM_H * WHEEL_VISIBLE;
  const N_COUNTRIES = WORLD_COUNTRIES.length;

  const [wheelIdx, setWheelIdx] = useState(0);
  const motionIdx  = useMotionValue(0);
  const springIdx  = useSpring(motionIdx, { stiffness: 300, damping: 28 });
  const listY      = useTransform(springIdx, v =>
    WHEEL_H / 2 - WHEEL_ITEM_H / 2 - v * WHEEL_ITEM_H
  );

  const dragStartY   = useRef(0);
  const dragStartIdx = useRef(0);
  const isDragging   = useRef(false);

  function wheelPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    isDragging.current  = true;
    dragStartY.current  = e.clientY;
    dragStartIdx.current = motionIdx.get();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function wheelPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging.current) return;
    const delta    = dragStartY.current - e.clientY;
    const newFloat = Math.max(0, Math.min(N_COUNTRIES - 1, dragStartIdx.current + delta / WHEEL_ITEM_H));
    motionIdx.set(newFloat);
    setWheelIdx(Math.round(newFloat));
  }
  function wheelPointerUp() {
    if (!isDragging.current) return;
    isDragging.current = false;
    const idx = Math.round(motionIdx.get());
    motionIdx.set(idx);
    setWheelIdx(idx);
    setSelectedCountry(WORLD_COUNTRIES[idx].code);
  }

  const champsByCountry = Object.fromEntries(
    MOCK_PLAYERS.filter(p => p.isCountryChamp).map(p => [p.country, p])
  );
  const lists = {
    live:    MOCK_PLAYERS.filter(p => p.isPlaying),
    leaders: [...MOCK_PLAYERS].sort((a, b) => b.wins - a.wins),
    guests:  MOCK_PLAYERS,
    world:   [] as MockPlayer[],
    log:     [] as MockPlayer[],
  };
  const worldPlayers = selectedCountry ? MOCK_PLAYERS.filter(p => p.country === selectedCountry) : [];

  const TABS = [
    { id:"live"    as const, icon:"🟢", label:"Live"  },
    { id:"leaders" as const, icon:"👑", label:"Top"   },
    { id:"world"   as const, icon:"🌍", label:"World" },
    { id:"guests"  as const, icon:"✨", label:"All"   },
    { id:"log"     as const, icon:"📋", label:"Log"   },
  ];

  return (
    <>
      <style>{`.drawer-scroll::-webkit-scrollbar{display:none}.drawer-scroll{scrollbar-width:none;-ms-overflow-style:none}`}</style>
      <motion.div key="bd" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose}
        style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.65)",
          backdropFilter:"blur(5px)", WebkitBackdropFilter:"blur(5px)" }} />

      <motion.div key="panel"
        initial={{ x:"100%" }} animate={{ x:0 }} exit={{ x:"100%" }}
        transition={{ type:"spring", stiffness:320, damping:32 }}
        style={{ position:"fixed", top:0, right:0, bottom:0, zIndex:201,
          width:"min(310px, 88vw)", background:"rgba(4,4,16,0.99)",
          borderLeft:"1px solid rgba(255,255,255,0.07)",
          display:"flex", flexDirection:"column",
          paddingBottom:"max(24px,env(safe-area-inset-bottom,24px))" }}>

        {/* Header */}
        <div style={{ flexShrink:0, padding:"max(env(safe-area-inset-top,14px),14px) 14px 0",
          borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <p style={{ margin:0, fontSize:15, fontWeight:900, color:"#fff" }}>Find a Game</p>
            <button onClick={onClose}
              style={{ width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,0.06)",
                border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)",
                fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              ✕
            </button>
          </div>
          <div style={{ display:"flex", gap:5, marginBottom:10 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); if (t.id !== "world") setSelectedCountry(null); }}
                style={{ flex:1, height:30, borderRadius:9, fontSize:10, fontWeight:700, cursor:"pointer",
                  background: tab===t.id ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.04)",
                  border: tab===t.id ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.07)",
                  color: tab===t.id ? "#a78bfa" : "rgba(255,255,255,0.4)" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Play vs Butler — always visible */}
        <div style={{ flexShrink:0, padding:"10px 14px 0" }}>
          <motion.button whileTap={{ scale:0.97 }}
            onClick={() => { onInvite("Butler"); onClose(); }}
            style={{ width:"100%", height:48, borderRadius:14, cursor:"pointer",
              background:"linear-gradient(135deg,rgba(239,68,68,0.16),rgba(192,38,211,0.10))",
              border:"1px solid rgba(239,68,68,0.3)",
              display:"flex", alignItems:"center", gap:12, padding:"0 14px" }}>
            <img src={BUTLER_IMG} alt="" style={{ width:30, height:30, borderRadius:9,
              objectFit:"cover", objectPosition:"top", flexShrink:0 }} />
            <div style={{ textAlign:"left" }}>
              <p style={{ margin:0, fontSize:12, fontWeight:900, color:"#f472b6" }}>Play vs Butler</p>
              <p style={{ margin:0, fontSize:9, color:"rgba(255,255,255,0.28)" }}>Always available · 3🪙 table fee</p>
            </div>
          </motion.button>
        </div>

        {/* ── World tab ── */}
        {tab === "world" ? (
          <div className="drawer-scroll" style={{ flex:1, overflowY:"auto", padding:"10px 14px" }}>
            <p style={{ margin:"0 0 8px", fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.28)",
              textTransform:"uppercase", letterSpacing:"0.1em" }}>🌍 Scroll to a Country</p>

            {/* ── Wheel picker ── */}
            <div style={{ position:"relative", height: WHEEL_H, marginBottom:14,
              borderRadius:16, overflow:"hidden",
              background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)",
              cursor:"grab", userSelect:"none", touchAction:"none" }}
              onPointerDown={wheelPointerDown}
              onPointerMove={wheelPointerMove}
              onPointerUp={wheelPointerUp}
              onPointerCancel={wheelPointerUp}>

              {/* Centre highlight bar */}
              <div style={{ position:"absolute", top:"50%", left:0, right:0,
                height: WHEEL_ITEM_H, transform:"translateY(-50%)",
                background:"rgba(250,204,21,0.07)",
                border:"1px solid rgba(250,204,21,0.2)",
                borderRadius:10, zIndex:1, pointerEvents:"none" }} />

              {/* Top/bottom fade masks */}
              <div style={{ position:"absolute", top:0, left:0, right:0, height:"30%", zIndex:2, pointerEvents:"none",
                background:"linear-gradient(to bottom, rgba(5,5,18,0.95), transparent)" }} />
              <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"30%", zIndex:2, pointerEvents:"none",
                background:"linear-gradient(to top, rgba(5,5,18,0.95), transparent)" }} />

              {/* Scrolling list */}
              <motion.div style={{ y: listY, position:"relative", zIndex:0 }}>
                {WORLD_COUNTRIES.map((c, i) => {
                  const dist = Math.abs(i - wheelIdx);
                  const scale   = dist >= 3 ? 0.72 : 1 - dist * 0.09;
                  const opacity = dist >= 3 ? 0.08 : dist >= 2 ? 0.28 : dist >= 1 ? 0.55 : 1;
                  const champ   = champsByCountry[c.code];
                  return (
                    <div key={c.code}
                      style={{ height: WHEEL_ITEM_H,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        gap:10, paddingInline:18,
                        transform:`scale(${scale})`, opacity,
                        transition:"transform 0.12s, opacity 0.12s" }}>
                      <span style={{ fontSize:24 }}>{c.flag}</span>
                      <span style={{ fontSize:15, fontWeight: dist === 0 ? 900 : 600,
                        color: dist === 0 ? "#fff" : "rgba(255,255,255,0.7)" }}>
                        {c.name}
                      </span>
                      {champ && <span style={{ fontSize:11, marginLeft:"auto" }}>👑</span>}
                    </div>
                  );
                })}
              </motion.div>
            </div>

            {/* Country detail */}
            <AnimatePresence mode="wait">
              {selectedCountry && (() => {
                const country = WORLD_COUNTRIES.find(c => c.code === selectedCountry)!;
                const champ   = champsByCountry[selectedCountry];
                return (
                  <motion.div key={selectedCountry}
                    initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                    exit={{ opacity:0 }} transition={{ duration:0.15 }}>

                    {/* Champion card */}
                    {champ ? (
                      <div style={{ marginBottom:14, padding:12, borderRadius:14,
                        background:"rgba(250,204,21,0.07)", border:"1px solid rgba(250,204,21,0.22)" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                          <span style={{ fontSize:26 }}>{country.flag}</span>
                          <div style={{ flex:1 }}>
                            <p style={{ margin:0, fontSize:9, color:"rgba(250,204,21,0.65)", fontWeight:700,
                              textTransform:"uppercase", letterSpacing:"0.08em" }}>
                              {country.name} Champion
                            </p>
                            <p style={{ margin:0, fontSize:15, fontWeight:900, color:"#fff" }}>{champ.name}</p>
                          </div>
                          <p style={{ margin:0, fontSize:14, fontWeight:900, color:"#facc15" }}>{champ.wins}W</p>
                        </div>
                        {champ.pendingDefense && (
                          <motion.div animate={{ opacity:[1,0.5,1] }} transition={{ duration:1.2, repeat:Infinity }}
                            style={{ padding:"5px 10px", borderRadius:8, marginBottom:8,
                              background:"rgba(251,146,60,0.1)", border:"1px solid rgba(251,146,60,0.3)",
                              fontSize:10, color:"rgba(251,146,60,0.9)", fontWeight:700, textAlign:"center" }}>
                            ⚠ Open defense — respond within 24h or title is forfeited
                          </motion.div>
                        )}
                        <motion.button whileTap={{ scale:0.95 }}
                          onClick={() => { onInvite(champ.name); onClose(); }}
                          style={{ width:"100%", height:36, borderRadius:10, cursor:"pointer",
                            background:"rgba(250,204,21,0.14)", border:"1px solid rgba(250,204,21,0.45)",
                            color:"#facc15", fontSize:12, fontWeight:900 }}>
                          ⚔ Challenge Champion
                        </motion.button>
                      </div>
                    ) : (
                      <div style={{ padding:14, borderRadius:14, textAlign:"center", marginBottom:14,
                        background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                        <p style={{ margin:"0 0 4px", fontSize:24 }}>{country.flag}</p>
                        <p style={{ margin:"0 0 10px", fontSize:12, color:"rgba(255,255,255,0.4)" }}>
                          No champion yet — be the first to claim {country.name}
                        </p>
                        <motion.button whileTap={{ scale:0.95 }}
                          onClick={() => { onInvite("Butler"); onClose(); }}
                          style={{ height:32, padding:"0 18px", borderRadius:10, cursor:"pointer",
                            background:"rgba(139,92,246,0.14)", border:"1px solid rgba(139,92,246,0.35)",
                            color:"#a78bfa", fontSize:11, fontWeight:900 }}>
                          Claim This Country
                        </motion.button>
                      </div>
                    )}

                    {/* Players from this country */}
                    {worldPlayers.length > 0 && (
                      <>
                        <p style={{ margin:"0 0 4px", fontSize:9, fontWeight:700,
                          color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"0.1em" }}>
                          Players from {country.name}
                        </p>
                        {worldPlayers.map(p => (
                          <PlayerRow key={p.id} p={p}
                            onInvite={() => { onInvite(p.name); onClose(); }} />
                        ))}
                      </>
                    )}
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>

        ) : tab === "log" ? (
          /* ── Game Log tab ── */
          <div className="drawer-scroll" style={{ flex:1, overflowY:"auto", padding:"10px 14px" }}>
            <p style={{ margin:"0 0 10px", fontSize:9, fontWeight:700,
              color:"rgba(255,255,255,0.28)", textTransform:"uppercase", letterSpacing:"0.1em" }}>
              📋 Match History · This Session
            </p>
            {gameHistory.length === 0 ? (
              <div style={{ textAlign:"center", padding:"28px 0" }}>
                <p style={{ margin:"0 0 6px", fontSize:22 }}>🎮</p>
                <p style={{ margin:0, fontSize:12, color:"rgba(255,255,255,0.25)" }}>
                  No games played yet
                </p>
              </div>
            ) : (
              [...gameHistory].reverse().map((g, i) => {
                const resultColor =
                  g.result === "win"    ? "#86efac" :
                  g.result === "loss"   ? "#fca5a5" :
                  g.result === "forfeit"? "#fb923c" : "rgba(255,255,255,0.5)";
                const resultLabel =
                  g.result === "win"    ? "You Won"    :
                  g.result === "loss"   ? "Butler Won" :
                  g.result === "forfeit"? "Forfeited"  : "Draw";
                const mins = Math.floor((Date.now() - g.ts) / 60000);
                const timeAgo = mins < 1 ? "just now" : `${mins}m ago`;
                return (
                  <motion.div key={g.id}
                    initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ display:"flex", alignItems:"center", gap:10,
                      padding:"9px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ width:32, height:32, borderRadius:10, flexShrink:0,
                      background:`${resultColor}18`, border:`1px solid ${resultColor}44`,
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>
                      {g.result === "win" ? "🏆" : g.result === "forfeit" ? "⏱" : g.result === "draw" ? "🤝" : "🎩"}
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:0, fontSize:12, fontWeight:700, color:resultColor }}>{resultLabel}</p>
                      <p style={{ margin:0, fontSize:9, color:"rgba(255,255,255,0.3)" }}>
                        vs {g.opponent} · {timeAgo}
                      </p>
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      {g.wager > 0 ? (
                        <p style={{ margin:0, fontSize:12, fontWeight:900,
                          color: g.result === "win" ? "#86efac" : g.result === "loss" ? "#fca5a5" : "rgba(255,255,255,0.4)" }}>
                          {g.result === "win" ? "+" : g.result === "loss" ? "−" : ""}{g.wager > 0 ? `${g.wager}🪙` : ""}
                        </p>
                      ) : (
                        <p style={{ margin:0, fontSize:9, color:"rgba(255,255,255,0.2)" }}>Free</p>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

        ) : (
          /* ── Live / Leaders / All tabs ── */
          <>
            <p style={{ flexShrink:0, margin:"10px 14px 4px", fontSize:9, fontWeight:700,
              color:"rgba(255,255,255,0.28)", textTransform:"uppercase", letterSpacing:"0.1em" }}>
              {tab==="live"    ? `🟢 ${lists.live.length} Playing Right Now`
               : tab==="leaders" ? "👑 March 2026 Leaders"
               : "✨ All Guests"}
            </p>
            <div className="drawer-scroll" style={{ flex:1, overflowY:"auto", padding:"0 14px" }}>
              <AnimatePresence mode="wait">
                <motion.div key={tab}
                  initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                  exit={{ opacity:0, y:-4 }} transition={{ duration:0.15 }}>
                  {lists[tab].length === 0
                    ? <p style={{ margin:"20px 0", textAlign:"center", fontSize:12,
                        color:"rgba(255,255,255,0.25)" }}>No players right now</p>
                    : lists[tab].map(p => (
                        <PlayerRow key={p.id} p={p}
                          onInvite={() => { onInvite(p.name); onClose(); }} />
                      ))
                  }
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        )}
      </motion.div>
    </>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function Connect4Page() {
  const navigate = useNavigate();

  // Game
  const [board,    setBoard]    = useState<Board>(emptyBoard);
  const [turn,     setTurn]     = useState<"player"|"ai">("player");
  const [winLine,  setWinLine]  = useState<WinLine>(null);
  const [draw,     setDraw]     = useState(false);
  const [dropping, setDropping] = useState(false);
  const [lastDrop, setLastDrop] = useState<[number,number]|null>(null);

  // Visuals
  const [legsOpen,       setLegsOpen]       = useState(false);
  const [coinFall,       setCoinFall]       = useState(false);
  const [gameKey,        setGameKey]        = useState(0);
  const [showSheet,      setShowSheet]      = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(true);

  // Timer + history
  const [timeLeft,    setTimeLeft]    = useState(30);
  const [forfeit,     setForfeit]     = useState(false);
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);

  // UI
  const [showDrawer,    setShowDrawer]    = useState(false);
  const [betAmount,     setBetAmount]     = useState(0);
  const [chatUnlocked,  setChatUnlocked]  = useState(false);
  const [messages,      setMessages]      = useState<{ from: "you"|"butler"; text: string; isNudge?: boolean }[]>([]);
  const [msgInput,      setMsgInput]      = useState("");
  const [showGifts,     setShowGifts]     = useState(false);
  const giftsTimerRef = useRef<ReturnType<typeof setTimeout>>();
  type TableItem = { key: string; id: string; img: string; name: string; delivered: boolean };
  const [playerItems,   setPlayerItems]   = useState<TableItem[]>([]);
  const [butlerItems,   setButlerItems]   = useState<TableItem[]>([]);
  const orderArrivalRef = useRef<ReturnType<typeof setTimeout>>();
  const chatEndRef      = useRef<HTMLDivElement>(null);
  const chatScrollRef   = useRef<HTMLDivElement>(null);

  // Coins & wager
  const [playerCoins, setPlayerCoins] = useState(150);
  const [butlerCoins, setButlerCoins] = useState(150);
  const [betStatus,   setBetStatus]   = useState<"idle"|"pending"|"accepted">("idle");
  const coinsSettledRef = useRef(false);

  const isOver    = winLine !== null || draw || forfeit;
  const winSet    = new Set(winLine?.map(([r,c]) => `${r},${c}`) ?? []);
  const playerWon = !!winLine && !!checkWin(board, PLAYER) && !forfeit;
  const aiWon     = (!!winLine && !!checkWin(board, AI)) || forfeit;
  const winColor  = draw ? "rgba(255,255,255,0.7)" : playerWon ? PLAYER_COLOR : AI_COLOR;

  // ── Sizing ────────────────────────────────────────────────────────────────
  const profileW = 46;
  const containerW = Math.min(typeof window !== "undefined" ? window.innerWidth : 375, 440);
  const boardContainerW = containerW - 24 - (profileW + 8) * 2;
  const cellSize = Math.min(36, Math.max(26, Math.floor((boardContainerW - 12 - 4*(COLS-1)) / COLS)));
  const coinData = useMemo(() => makeCoinData(gameKey), [gameKey]);

  // ── Game over cascade ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOver) { setShowSheet(false); return; }
    const t1 = setTimeout(() => setLegsOpen(true),  700);
    const t2 = setTimeout(() => setCoinFall(true),  1060);
    const t3 = setTimeout(() => setShowSheet(true), 2200); // sheet after coin cascade
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isOver]);

  // ── Coin settlement on game end ──────────────────────────────────────────
  useEffect(() => {
    if (!isOver) { coinsSettledRef.current = false; return; }
    if (coinsSettledRef.current) return;
    coinsSettledRef.current = true;
    if (betAmount > 0 && betStatus === "accepted") {
      if (playerWon)  { setPlayerCoins(c => c + betAmount); setButlerCoins(c => c - betAmount); }
      else if (aiWon) { setPlayerCoins(c => c - betAmount); setButlerCoins(c => c + betAmount); }
    }
    const result: GameRecord["result"] = forfeit ? "forfeit" : playerWon ? "win" : aiWon ? "loss" : "draw";
    setGameHistory(h => [...h, { id: `g${Date.now()}`, opponent: "Butler", result, wager: betAmount, ts: Date.now() }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOver]);

  // ── Butler nudge ─────────────────────────────────────────────────────────
  const nudgeRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (turn !== "player" || isOver) return;
    nudgeRef.current = setTimeout(() => {
      if (!chatUnlocked) return;
      setMessages(m => [...m, { from: "butler", text: "Your move is awaited, guest. The game requires your attention.", isNudge: true }]);
    }, 22000);
    return () => clearTimeout(nudgeRef.current);
  }, [turn, isOver, chatUnlocked]);

  // ── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (turn !== "player" || isOver) { setTimeLeft(30); return; }
    if (timeLeft <= 0) {
      setForfeit(true);
      setMessages(m => [...m, { from: "butler", text: "Time expired. The butler claims the victory.", isNudge: true }]);
      if (!chatUnlocked) setChatUnlocked(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, isOver, timeLeft]);

  // ── Forfeit: auto-reset + open drawer after 3 s ──────────────────────────
  useEffect(() => {
    if (!forfeit) return;
    const t = setTimeout(() => {
      reset();
      setShowDrawer(true);
    }, 3000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forfeit]);

  // ── Auto scroll chat ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  // ── Player move ───────────────────────────────────────────────────────────
  const playerMove = useCallback((col: number) => {
    if (dropping || turn !== "player" || isOver || board[0][col] !== EMPTY) return;
    setTimeLeft(30); // reset timer on each move
    const next = dropPiece(board, col, PLAYER)!;
    const row  = getDropRow(board, col);
    setLastDrop([row, col]);
    setDropping(true);
    setBoard(next);
    const win = checkWin(next, PLAYER);
    if (win) { setWinLine(win); setDropping(false); return; }
    if (isFull(next)) { setDraw(true); setDropping(false); return; }
    setTurn("ai");
    setTimeout(() => {
      const aiCol   = bestAIMove(next);
      const aiBoard = dropPiece(next, aiCol, AI)!;
      setLastDrop([getDropRow(next, aiCol), aiCol]);
      setBoard(aiBoard);
      const aiWin = checkWin(aiBoard, AI);
      if (aiWin) setWinLine(aiWin);
      else if (isFull(aiBoard)) setDraw(true);
      else setTurn("player");
      setDropping(false);
    }, 620);
  }, [board, dropping, turn, isOver]);

  function reset() {
    setBoard(emptyBoard());
    setTurn("player");
    setWinLine(null);
    setDraw(false);
    setDropping(false);
    setLastDrop(null);
    setLegsOpen(false);
    setCoinFall(false);
    setGameKey(k => k + 1);
    setBetAmount(0);
    setBetStatus("idle");
    setForfeit(false);
    setTimeLeft(30);
    setShowSheet(false);
  }

  function selectBet(b: number) {
    if (isOver) return;
    const gameStarted = board.some(row => row.some(c => c !== EMPTY));
    if (gameStarted) return; // lock bet once game is underway
    setBetAmount(b);
    if (b === 0) { setBetStatus("idle"); return; }
    setBetStatus("pending");
    setTimeout(() => {
      setBetStatus("accepted");
      if (!chatUnlocked) setChatUnlocked(true);
      setMessages(m => [...m, {
        from: "butler",
        text: `The butler accepts your wager of ${b}🪙. May fortune favour you.`,
      }]);
    }, 1400);
  }

  function unlockChat() {
    setChatUnlocked(true);
    setMessages([{ from: "butler", text: "Chat is now open. The butler thanks you for the coin. Speak freely." }]);
  }

  function sendMessage() {
    if (!msgInput.trim() || !chatUnlocked) return;
    const text = msgInput.trim();
    setMsgInput("");
    setMessages(m => [...m, { from: "you", text }]);
    setTimeout(() => {
      setMessages(m => [...m, { from: "butler", text: "The butler notes your message with discretion." }]);
    }, 1400);
  }

  function openGiftsTray() {
    clearTimeout(giftsTimerRef.current);
    setShowGifts(true);
    giftsTimerRef.current = setTimeout(() => setShowGifts(false), 5000);
  }

  function orderGift(id: string, name: string, price: number) {
    clearTimeout(giftsTimerRef.current);
    clearTimeout(orderArrivalRef.current);
    const img = GIFTS.find(g => g.id === id)?.img ?? "";
    const itemKey = `${id}-${Date.now()}`;
    setPlayerCoins(c => Math.max(0, c - price));
    setPlayerItems(items => [...items, { key: itemKey, id, img, name, delivered: false }]);
    setMessages(m => [...m, { from: "butler", text: `Your ${name} is on its way. −${price}🪙` }]);
    if (!chatUnlocked) setChatUnlocked(true);
    setShowGifts(false);
    // Mark as delivered after 8 seconds
    orderArrivalRef.current = setTimeout(() => {
      setPlayerItems(items => items.map(it => it.key === itemKey ? { ...it, delivered: true } : it));
      setMessages(m => [...m, { from: "butler", text: `Your ${name} has arrived. Tap it to gift to the butler.` }]);
    }, 8000);
  }

  function giftToButler(itemKey: string) {
    const item = playerItems.find(it => it.key === itemKey);
    if (!item || !item.delivered) return;
    setPlayerItems(items => items.filter(it => it.key !== itemKey));
    setButlerItems(items => [...items, { ...item, key: `gift-${Date.now()}` }]);
    setMessages(m => [...m, { from: "butler", text: `The butler graciously receives your ${item.name}. A kind gesture.` }]);
  }

  function handleInvite(playerName: string) {
    if (!chatUnlocked) setChatUnlocked(true);
    setMessages(m => [...m, {
      from: "butler",
      text: playerName === "Butler"
        ? "The butler accepts your challenge. The game is ready."
        : `Your invitation has been delivered to ${playerName}. The butler will notify you when they respond.`,
    }]);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      height: "100dvh",
      background: "linear-gradient(180deg, #050510 0%, #09091f 100%)",
      color: "#fff",
      display: "flex", flexDirection: "column", alignItems: "center",
      overflow: "hidden",
    }}>

      {/* ── Header ── */}
      <div style={{
        width: "100%", maxWidth: 480,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "max(env(safe-area-inset-top,14px),14px) 14px 10px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <button onClick={() => navigate("/ghost/mode")}
          style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)",
            fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ✕
        </button>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff" }}>Connect 4</p>
          <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.25)" }}>vs Butler</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowDrawer(true)}
            style={{ width: 32, height: 32, borderRadius: 10,
              background: showDrawer ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)",
              border: showDrawer ? "1px solid rgba(139,92,246,0.45)" : "1px solid rgba(255,255,255,0.1)",
              color: showDrawer ? "#a78bfa" : "rgba(255,255,255,0.55)",
              fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative" }}>
            👥
            {/* Live indicator dot */}
            <motion.div animate={{ scale: [1,1.4,1], opacity: [1,0.4,1] }}
              transition={{ duration: 1.3, repeat: Infinity }}
              style={{ position: "absolute", top: 4, right: 4, width: 6, height: 6,
                borderRadius: "50%", background: "#22c55e", border: "1px solid #050510" }} />
          </motion.button>
        </div>
      </div>

      {/* ── Bet bar ── */}
      <div style={{
        width: "100%", maxWidth: 480,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.1em" }}>Wager</span>
          <AnimatePresence mode="wait">
            {betStatus === "pending" && (
              <motion.span key="pending"
                initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ fontSize: 9, color: "rgba(250,204,21,0.7)", fontWeight: 700 }}>
                Considering…
              </motion.span>
            )}
            {betStatus === "accepted" && betAmount > 0 && (
              <motion.span key="accepted"
                initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ fontSize: 9, color: "rgba(134,239,172,0.8)", fontWeight: 700 }}>
                ✓ Accepted
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {BET_OPTIONS.map(b => {
            const locked = betStatus !== "idle" && b !== 0;
            return (
              <button key={b} onClick={() => selectBet(b)}
                disabled={locked && betAmount !== b}
                style={{
                  height: 26, padding: "0 8px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                  cursor: (locked && betAmount !== b) ? "default" : "pointer",
                  background: betAmount === b
                    ? betStatus === "accepted" ? "rgba(134,239,172,0.12)" : "rgba(250,204,21,0.12)"
                    : "rgba(255,255,255,0.04)",
                  border: betAmount === b
                    ? betStatus === "accepted" ? "1px solid rgba(134,239,172,0.4)" : "1px solid rgba(250,204,21,0.35)"
                    : "1px solid rgba(255,255,255,0.06)",
                  color: betAmount === b
                    ? betStatus === "accepted" ? "#86efac" : "rgba(250,204,21,0.85)"
                    : "rgba(255,255,255,0.3)",
                  opacity: (locked && betAmount !== b) ? 0.35 : 1,
                  transition: "all 0.12s",
                }}>
                {b === 0 ? "Free" : `${b}🪙`}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Game area: profiles + board ── */}
      <div style={{
        width: "100%", maxWidth: 480,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "14px 12px 0", gap: 8,
      }}>

        {/* Player profile – left */}
        <div style={{ width: profileW, flexShrink: 0, display: "flex", flexDirection: "column",
          alignItems: "center", gap: 5, paddingTop: 6, position: "relative" }}>
          {/* Winner coin rain — floats down the full profile slider */}
          {coinFall && playerWon && Array.from({ length: 12 }, (_, i) => (
            <motion.div key={`pcoin-${gameKey}-${i}`}
              initial={{ y: (i % 4) * 14, x: (i % 5 - 2) * 10, opacity: 1, scale: 1 }}
              animate={{ y: 300 + (i % 3) * 25, rotate: i % 2 === 0 ? 200 : -200 }}
              transition={{ delay: i * 0.06, duration: 0.55 + (i % 4) * 0.08, ease: [0.22, 0, 0.88, 0.85] }}
              style={{ position: "absolute", top: 0, left: "50%", marginLeft: -6,
                width: 13, height: 13, borderRadius: "50%", pointerEvents: "none", zIndex: 10,
                background: `radial-gradient(circle at 38% 32%, #fef08a, ${AI_COLOR} 55%, #b45309)`,
                boxShadow: `0 0 7px ${AI_COLOR}99` }}
            />
          ))}
          {/* Player coin balance */}
          <motion.div key={playerCoins}
            initial={{ scale: 1.25 }} animate={{ scale: 1 }} transition={{ duration: 0.35 }}
            style={{ padding: "2px 7px", borderRadius: 8,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
              fontSize: 11, fontWeight: 900, color: AI_COLOR, whiteSpace: "nowrap" }}>
            <span style={{ color: PLAYER_COLOR }}>🪙</span>{playerCoins}
          </motion.div>
          <motion.div
            animate={{ borderColor: turn === "player" && !isOver ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.07)" }}
            transition={{ duration: 0.3 }}
            style={{ width: 44, height: 44, borderRadius: 14, overflow: "hidden",
              border: "1.5px solid", background: "rgba(255,255,255,0.04)", flexShrink: 0 }}>
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 22 }}>👻</div>
          </motion.div>
          <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>You</span>
          <AnimatePresence>
            {turn === "player" && !isOver && (
              <motion.div key="timer-player"
                initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }} transition={{ duration: 0.2 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <motion.span
                  animate={{ opacity: [0.9,0.2,0.9] }}
                  transition={{ duration: 0.85, repeat: Infinity }}
                  style={{ fontSize: 9, fontWeight: 900, color: "rgba(239,68,68,0.7)", letterSpacing: "0.04em" }}>
                  GO
                </motion.span>
                <motion.span
                  key={timeLeft}
                  initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }}
                  style={{ fontSize: 13, fontWeight: 900, lineHeight: 1,
                    color: timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#fb923c" : "rgba(255,255,255,0.55)" }}>
                  {timeLeft}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
          {playerWon && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0,15,-15,0] }}
              transition={{ scale: { type: "spring", stiffness: 300 }, rotate: { delay: 0.1, duration: 0.5 } }}
              style={{ fontSize: 18 }}>🏆</motion.span>
          )}
          {/* Table items — arriving + delivered + giftable */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
            <AnimatePresence>
              {playerItems.map(item => (
                <motion.div key={item.key}
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.4 }}
                  transition={{ type: "spring", stiffness: 340, damping: 22 }}
                  onClick={() => item.delivered && giftToButler(item.key)}
                  title={item.delivered ? `Gift ${item.name} to butler` : "Arriving…"}
                  style={{ width: 28, height: 28, borderRadius: 8, cursor: item.delivered ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
                    background: item.delivered ? "rgba(239,68,68,0.12)" : "rgba(250,204,21,0.08)",
                    border: item.delivered ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(250,204,21,0.25)",
                    position: "relative" }}>
                  <img src={item.img} alt={item.name} style={{ width: 18, height: 18, objectFit: "contain" }} />
                  {!item.delivered && (
                    <motion.div animate={{ opacity: [1,0.3,1] }} transition={{ duration: 1.1, repeat: Infinity }}
                      style={{ position: "absolute", bottom: -2, right: -2, width: 6, height: 6,
                        borderRadius: "50%", background: "#facc15", border: "1px solid #05050f" }} />
                  )}
                  {item.delivered && (
                    <div style={{ position: "absolute", top: -5, right: -5, width: 12, height: 12,
                      borderRadius: "50%", background: "rgba(4,4,14,0.9)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "1px solid rgba(239,68,68,0.4)", fontSize: 7 }}>
                      🎁
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Board column */}
        <div style={{ position: "relative", flexShrink: 0, display: "flex", flexDirection: "column" }}>

          {/* Board face */}
          <div style={{
            background: BOARD_FACE,
            borderRadius: "14px 14px 0 0",
            padding: 6,
            boxShadow: "0 16px 48px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderBottom: "none",
          }}>
            {Array.from({ length: ROWS }, (_, row) => (
              <div key={row} style={{ display: "flex", gap: 4, marginBottom: row < ROWS-1 ? 4 : 0 }}>
                {Array.from({ length: COLS }, (_, col) => {
                  const cell  = board[row][col];
                  const isWin = winSet.has(`${row},${col}`);
                  const isLast = lastDrop?.[0] === row && lastDrop?.[1] === col;
                  return (
                    <div key={col} onClick={() => playerMove(col)}
                      style={{ width: cellSize, height: cellSize, borderRadius: "50%",
                        background: "#030310",
                        boxShadow: "inset 0 2px 8px rgba(0,0,0,0.75), inset 0 0 0 1px rgba(0,0,10,0.5)",
                        cursor: "pointer", position: "relative", overflow: "hidden" }}>
                      {/* Column number in top row — hidden once a piece lands */}
                      {row === 0 && cell === EMPTY && (
                        <span style={{ position: "absolute", inset: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: Math.floor(cellSize * 0.36), fontWeight: 900,
                          color: "rgba(255,255,255,0.2)", pointerEvents: "none",
                          userSelect: "none", zIndex: 0 }}>
                          {col + 1}
                        </span>
                      )}
                      <AnimatePresence>
                        {cell !== EMPTY && (
                          <motion.div
                            key={`${row}-${col}-${cell}`}
                            initial={isLast ? { y: -(cellSize * (row+1) + 4 * row + 10) } : { opacity: 1 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 380, damping: 26 }}
                            style={{
                              position: "absolute", inset: 2, borderRadius: "50%",
                              background: cell === PLAYER
                                ? `radial-gradient(circle at 38% 32%, #fca5a5, ${PLAYER_COLOR} 55%, #991b1b)`
                                : `radial-gradient(circle at 38% 32%, #fef08a, ${AI_COLOR} 55%, #b45309)`,
                              boxShadow: isWin
                                ? `0 0 14px ${cell === PLAYER ? PLAYER_COLOR : AI_COLOR}, 0 0 6px rgba(255,255,255,0.25)`
                                : `inset 0 -3px 6px rgba(0,0,0,0.35), inset 0 2px 5px rgba(255,255,255,0.18)`,
                            }}
                          />
                        )}
                      </AnimatePresence>
                      {isWin && (
                        <motion.div
                          animate={{ scale: [1, 1.3, 1], opacity: [0.85, 0, 0.85] }}
                          transition={{ duration: 0.85, repeat: Infinity }}
                          style={{ position: "absolute", inset: 0, borderRadius: "50%",
                            border: `1.5px solid ${cell === PLAYER ? PLAYER_COLOR : AI_COLOR}` }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Bottom rail + legs */}
          <div style={{
            background: "#080921",
            borderRadius: "0 0 10px 10px",
            border: "1px solid rgba(255,255,255,0.06)",
            borderTop: "2px solid rgba(0,0,0,0.6)",
            padding: "2px 16px 0",
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            boxShadow: "0 6px 24px rgba(0,0,0,0.6)",
          }}>
            {[
              { origin: "50% 0%", rotate: legsOpen ? -24 : 0, tx: legsOpen ? -10 : 0 },
              { origin: "50% 0%", rotate: legsOpen ? 24  : 0, tx: legsOpen ?  10 : 0 },
            ].map((leg, i) => (
              <motion.div key={i}
                animate={{ rotate: leg.rotate, x: leg.tx }}
                transition={{ type: "spring", stiffness: 180, damping: 16 }}
                style={{
                  width: 9, height: 32,
                  background: "linear-gradient(180deg, #1c1e3e 0%, #0a0b1c 100%)",
                  borderRadius: "0 0 5px 5px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  transformOrigin: leg.origin,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
                }}
              />
            ))}
          </div>


          {/* Countdown overlay — shown on the board when ≤ 5 s remain */}
          <AnimatePresence>
            {turn === "player" && !isOver && timeLeft <= 5 && timeLeft > 0 && (
              <motion.div
                key={`cd-${timeLeft}`}
                initial={{ scale: 1.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                style={{
                  position: "absolute", inset: 0, zIndex: 25,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  pointerEvents: "none",
                  background: "rgba(0,0,0,0.38)",
                  borderRadius: "14px 14px 0 0",
                }}>
                <motion.span
                  animate={{ textShadow: [
                    `0 0 24px #ef444499`,
                    `0 0 64px #ef4444cc`,
                    `0 0 24px #ef444499`,
                  ]}}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  style={{
                    fontSize: 88,
                    fontWeight: 900,
                    color: timeLeft <= 2 ? "#ef4444" : timeLeft <= 3 ? "#fb923c" : "#facc15",
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                    userSelect: "none",
                  }}>
                  {timeLeft}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Coin cascade overlay */}
          {coinFall && coinData.map((c, i) => (
            <motion.div key={`coin-${gameKey}-${i}`}
              initial={{ y: 0, opacity: 1, scale: 1 }}
              animate={{ y: 540, scale: 0.6, rotate: i % 2 === 0 ? 240 : -240 }}
              transition={{ delay: c.delay, duration: c.duration + 0.12, ease: [0.22, 0, 0.92, 0.88] }}
              style={{
                position: "absolute", bottom: 30,
                left: `${c.left}%`,
                width: c.size, height: c.size,
                borderRadius: "50%",
                background: `radial-gradient(circle at 38% 32%, ${c.color}cc, ${c.color})`,
                boxShadow: `0 0 5px ${c.color}55`,
                zIndex: 20, pointerEvents: "none",
              }}
            />
          ))}
        </div>

        {/* Butler profile – right */}
        <div style={{ width: profileW, flexShrink: 0, display: "flex", flexDirection: "column",
          alignItems: "center", gap: 5, paddingTop: 6 }}>
          {/* Butler coin balance */}
          <motion.div key={butlerCoins}
            initial={{ scale: 1.25 }} animate={{ scale: 1 }} transition={{ duration: 0.35 }}
            style={{ padding: "2px 7px", borderRadius: 8,
              background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.22)",
              fontSize: 11, fontWeight: 900, color: AI_COLOR, whiteSpace: "nowrap" }}>
            <span style={{ color: AI_COLOR }}>🪙</span>{butlerCoins}
          </motion.div>
          <motion.div
            animate={{ borderColor: turn === "ai" && !isOver ? "rgba(250,204,21,0.4)" : "rgba(255,255,255,0.07)" }}
            transition={{ duration: 0.3 }}
            style={{ width: 44, height: 44, borderRadius: 14, overflow: "hidden",
              border: "1.5px solid", background: "rgba(255,255,255,0.04)", flexShrink: 0 }}>
            <img src={BUTLER_IMG} alt="" style={{ width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "top" }} />
          </motion.div>
          <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>Butler</span>
          <AnimatePresence>
            {turn === "ai" && !isOver && (
              <motion.span key="go-ai"
                initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: [0.9,0.2,0.9], scale: 1 }}
                transition={{ opacity: { duration: 0.85, repeat: Infinity }, scale: { duration: 0.2 } }}
                style={{ fontSize: 10, fontWeight: 900, color: "rgba(250,204,21,0.65)", letterSpacing: "0.04em" }}>
                GO
              </motion.span>
            )}
          </AnimatePresence>
          {aiWon && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0,15,-15,0] }}
              transition={{ scale: { type: "spring", stiffness: 300 }, rotate: { delay: 0.1, duration: 0.5 } }}
              style={{ fontSize: 18 }}>🏆</motion.span>
          )}
          {/* Gifted items received by butler */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
            <AnimatePresence>
              {butlerItems.map(item => (
                <motion.div key={item.key}
                  initial={{ opacity: 0, scale: 0.5, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.4 }}
                  transition={{ type: "spring", stiffness: 340, damping: 22 }}
                  title={item.name}
                  style={{ width: 28, height: 28, borderRadius: 8,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(250,204,21,0.1)",
                    border: "1px solid rgba(250,204,21,0.3)" }}>
                  <img src={item.img} alt={item.name} style={{ width: 18, height: 18, objectFit: "contain" }} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Full-width column buttons ── */}
      <div style={{
        width: "100%", maxWidth: 480,
        padding: "12px 14px 0",
        display: "flex", gap: 6,
      }}>
        {Array.from({ length: COLS }, (_, col) => {
          const active = turn === "player" && !isOver && !dropping && board[0][col] === EMPTY;
          return (
            <motion.button key={col} whileTap={{ scale: 0.86 }}
              onClick={() => playerMove(col)}
              disabled={!active}
              style={{
                flex: 1, height: 52, borderRadius: 14,
                fontSize: 15, fontWeight: 900,
                cursor: active ? "pointer" : "not-allowed",
                background: active ? "rgba(239,68,68,0.13)" : "rgba(255,255,255,0.03)",
                border: active
                  ? "1px solid rgba(239,68,68,0.38)"
                  : "1px solid rgba(255,255,255,0.06)",
                color: active ? PLAYER_COLOR : "rgba(255,255,255,0.18)",
                transition: "all 0.13s",
              }}>
              {col + 1}
            </motion.button>
          );
        })}
      </div>


      {/* ── Game-over bottom sheet ── */}
      <AnimatePresence>
        {showSheet && (
          <>
            <motion.div key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, zIndex: 98,
                background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)" }}
            />
            <motion.div key="sheet"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 99,
                background: "rgba(6,6,18,0.99)",
                borderRadius: "26px 26px 0 0",
                border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
                paddingBottom: "max(32px,env(safe-area-inset-bottom,32px))" }}>

              {/* Colour line */}
              <div style={{ height: 3, background:
                `linear-gradient(90deg, transparent, ${winColor}, transparent)` }} />

              <div style={{ padding: "28px 24px 0", textAlign: "center" }}>

                {/* Glow avatar */}
                <motion.div
                  animate={{ boxShadow: [
                    `0 0 24px ${winColor}44`,
                    `0 0 64px ${winColor}88`,
                    `0 0 24px ${winColor}44`,
                  ]}}
                  transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                  style={{ width: 76, height: 76, borderRadius: "50%",
                    margin: "0 auto 18px",
                    background: `radial-gradient(circle at 38% 32%, ${winColor}44, ${winColor}1a)`,
                    border: `2px solid ${winColor}55`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 34, overflow: "hidden" }}>
                  {draw ? "🤝" : playerWon ? "🏆" : (
                    <img src="https://ik.imagekit.io/7grri5v7d/Skeleton%20in%20tuxedo%20flips%20Connect%204%20disc.png"
                      alt="Butler wins"
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                  )}
                </motion.div>

                {/* Result text with pulsing glow */}
                <motion.p
                  animate={{ textShadow: [
                    `0 0 16px ${winColor}55`,
                    `0 0 44px ${winColor}99`,
                    `0 0 16px ${winColor}55`,
                  ]}}
                  transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                  style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 900, color: winColor }}>
                  {draw ? "It's a draw" : playerWon ? "You win!" : "Butler wins"}
                </motion.p>

                <p style={{ margin: "0 0 22px", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                  {betAmount > 0 && !draw
                    ? `${playerWon ? "+" : "−"}${betAmount * (playerWon ? 2 : 1)} 🪙`
                    : "No wager this round"}
                </p>

                {/* Play Again — always gold */}
                <motion.button whileTap={{ scale: 0.96 }} onClick={reset}
                  style={{ width: "100%", height: 58, borderRadius: 18, cursor: "pointer",
                    background: "linear-gradient(135deg, rgba(250,204,21,0.22), rgba(250,204,21,0.10))",
                    border: "1.5px solid rgba(250,204,21,0.55)",
                    color: AI_COLOR, fontSize: 17, fontWeight: 900,
                    boxShadow: "0 6px 28px rgba(250,204,21,0.25)" }}>
                  Play Again
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Chat (fills remaining height) ── */}
      <div style={{
        width: "100%", maxWidth: 480, flex: 1, minHeight: 0,
        padding: "10px 12px",
        paddingBottom: "max(16px,env(safe-area-inset-bottom,16px))",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ flex: 1, minHeight: 0, borderRadius: 16,
          border: "1px solid rgba(139,92,246,0.18)",
          background: "rgba(5,5,18,0.97)", overflow: "hidden",
          display: "flex", flexDirection: "column" }}>

          {/* Chat header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "9px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)" }}>
              💬 Table Chat
            </span>
            <motion.button whileTap={{ scale: 0.88 }} onClick={openGiftsTray}
              style={{ height: 28, padding: "0 10px", borderRadius: 9, cursor: "pointer",
                background: showGifts ? "rgba(250,204,21,0.14)" : "rgba(255,255,255,0.06)",
                border: showGifts ? "1px solid rgba(250,204,21,0.35)" : "1px solid rgba(255,255,255,0.1)",
                color: showGifts ? AI_COLOR : "rgba(255,255,255,0.5)",
                fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
              <span>🧃</span>
              <span style={{ fontSize: 10 }}>Mini Bar</span>
            </motion.button>
          </div>

          {/* Body — messages OR gifts tray */}
          <AnimatePresence mode="wait">
            {showGifts ? (
              <motion.div key="gifts"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)",
                  gap: 8, padding: "10px 10px 8px" }}>
                  {GIFTS.map(g => {
                    const pending = playerItems.some(it => it.id === g.id && !it.delivered);
                    return (
                      <motion.button key={g.id} whileTap={{ scale: 0.92 }}
                        onClick={() => !pending && orderGift(g.id, g.name, g.price)}
                        style={{ height: 64, borderRadius: 12, cursor: pending ? "default" : "pointer",
                          background: pending ? "rgba(250,204,21,0.08)" : "rgba(255,255,255,0.04)",
                          border: pending ? "1px solid rgba(250,204,21,0.25)" : "1px solid rgba(255,255,255,0.07)",
                          display: "flex", flexDirection: "column", alignItems: "center",
                          justifyContent: "center", gap: 3 }}>
                        <img src={g.img} alt={g.name} style={{ width: 36, height: 36, objectFit: "contain" }} />
                        <span style={{ fontSize: 9, fontWeight: 700,
                          color: pending ? AI_COLOR : "rgba(255,255,255,0.4)" }}>
                          {pending ? "On way…" : `${g.price}🪙`}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
                <p style={{ margin: 0, padding: "0 0 8px", textAlign: "center",
                  fontSize: 9, color: "rgba(255,255,255,0.2)" }}>
                  Returns to chat in 5 seconds
                </p>
              </motion.div>
            ) : (
              <motion.div key="messages"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                <div ref={chatScrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "10px 12px",
                  display: "flex", flexDirection: "column", gap: 6 }}>
                  {messages.length === 0 && (
                    <p style={{ margin: "auto", fontSize: 11, color: "rgba(255,255,255,0.2)",
                      textAlign: "center" }}>
                      {chatUnlocked ? "No messages yet" : "Unlock chat to speak with your opponent"}
                    </p>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} style={{ display: "flex",
                      justifyContent: m.from === "you" ? "flex-end" : "flex-start" }}>
                      <motion.div
                        animate={m.isNudge ? { boxShadow: [
                          "0 0 0px rgba(250,204,21,0)",
                          "0 0 10px rgba(250,204,21,0.45)",
                          "0 0 0px rgba(250,204,21,0)",
                        ]} : {}}
                        transition={m.isNudge ? { duration: 1.8, repeat: 4, ease: "easeInOut" } : {}}
                        style={{ maxWidth: "78%", padding: "6px 10px", borderRadius: 10, fontSize: 12,
                          background: m.from === "you" ? "rgba(239,68,68,0.13)" : m.isNudge ? "rgba(250,204,21,0.07)" : "rgba(255,255,255,0.05)",
                          border: m.from === "you" ? "1px solid rgba(239,68,68,0.22)" : m.isNudge ? "1px solid rgba(250,204,21,0.35)" : "1px solid rgba(255,255,255,0.07)",
                          color: m.from === "you" ? PLAYER_COLOR : m.isNudge ? "rgba(250,204,21,0.9)" : "rgba(255,255,255,0.5)" }}>
                        {m.from === "butler" && (
                          <span style={{ fontSize: 9, display: "block", marginBottom: 2,
                            color: m.isNudge ? "rgba(250,204,21,0.5)" : "rgba(255,255,255,0.3)", fontWeight: 700 }}>Butler</span>
                        )}
                        {m.text}
                      </motion.div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input row */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "7px 10px" }}>
            {chatUnlocked ? (
              <div style={{ display: "flex", gap: 6 }}>
                <input value={msgInput} onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Say something…"
                  style={{ flex: 1, height: 34, borderRadius: 9, padding: "0 10px",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "#fff", fontSize: 12, outline: "none" }} />
                <button onClick={sendMessage}
                  style={{ width: 34, height: 34, borderRadius: 9, cursor: "pointer",
                    background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.3)",
                    color: "#a78bfa", fontSize: 15, display: "flex", alignItems: "center",
                    justifyContent: "center" }}>↑</button>
              </div>
            ) : (
              <button onClick={unlockChat}
                style={{ width: "100%", height: 34, borderRadius: 9, cursor: "pointer",
                  background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)",
                  color: "#a78bfa", fontSize: 12, fontWeight: 700 }}>
                Unlock Chat · 1🪙
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Players drawer ── */}
      <AnimatePresence>
        {showDrawer && (
          <PlayersDrawer
            onClose={() => setShowDrawer(false)}
            onInvite={handleInvite}
            gameHistory={gameHistory}
          />
        )}
      </AnimatePresence>

      {/* ── How It Works — auto-shows on first visit ── */}
      <AnimatePresence>
        {showHowItWorks && (
          <motion.div
            key="hiw-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 9800,
              background: "rgba(0,0,0,0.75)", backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "24px 20px" }}>

            <motion.div
              key="hiw-panel"
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              style={{ width: "100%", maxWidth: 360,
                background: "rgba(6,6,20,0.99)",
                borderRadius: 24,
                border: "1px solid rgba(250,204,21,0.18)",
                overflow: "hidden" }}>

              <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #facc15, transparent)" }} />

              <div style={{ padding: "24px 22px 28px" }}>
                <p style={{ margin: "0 0 3px", fontSize: 18, fontWeight: 900, color: "#fff" }}>Connect 4</p>
                <p style={{ margin: "0 0 22px", fontSize: 11, fontWeight: 700, color: "#facc15", letterSpacing: "0.05em" }}>
                  The Icebreaker
                </p>

                {/* 4 win-direction mini boards */}
                {(() => {
                  const S = 10, G = 3, COLS4 = 4, ROWS4 = 4;
                  type Dir = { label: string; cells: [number,number][] };
                  const dirs: Dir[] = [
                    { label: "Horizontal →", cells: [[3,0],[3,1],[3,2],[3,3]] },
                    { label: "Vertical ↓",   cells: [[0,1],[1,1],[2,1],[3,1]] },
                    { label: "Diagonal ↘",   cells: [[0,0],[1,1],[2,2],[3,3]] },
                    { label: "Diagonal ↙",   cells: [[0,3],[1,2],[2,1],[3,0]] },
                  ];
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
                      {dirs.map(dir => {
                        const winSet = new Set(dir.cells.map(([r,c]) => `${r},${c}`));
                        return (
                          <div key={dir.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                            <div style={{ background: "#0b0d26", borderRadius: 10, padding: 8,
                              border: "1px solid rgba(255,255,255,0.06)" }}>
                              {Array.from({ length: ROWS4 }, (_, r) => (
                                <div key={r} style={{ display: "flex", gap: G, marginBottom: r < ROWS4-1 ? G : 0 }}>
                                  {Array.from({ length: COLS4 }, (_, c) => {
                                    const hit = winSet.has(`${r},${c}`);
                                    return (
                                      <div key={c} style={{ width: S, height: S, borderRadius: "50%", flexShrink: 0,
                                        background: hit
                                          ? "radial-gradient(circle at 35% 30%, #fef08a, #facc15 55%, #b45309)"
                                          : "rgba(255,255,255,0.07)",
                                        boxShadow: hit ? "0 0 6px rgba(250,204,21,0.65)" : "none" }} />
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", fontWeight: 700,
                              textAlign: "center", letterSpacing: "0.03em" }}>
                              {dir.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 900, color: "rgba(255,255,255,0.9)", lineHeight: 1.5 }}>
                  Drop a disc. Connect four. Break the ice.
                </p>
                <p style={{ margin: "0 0 22px", fontSize: 12.5, color: "rgba(255,255,255,0.42)", lineHeight: 1.8 }}>
                  Challenge a house ghost or invite that someone special. Take turns, think ahead, and let the game do what introductions never quite manage. Connect 4 isn't just a move — it's the start of a conversation.
                </p>

                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => setShowHowItWorks(false)}
                  style={{ width: "100%", height: 52, borderRadius: 16, cursor: "pointer",
                    background: "linear-gradient(135deg, #facc15, #f59e0b 55%, #d97706)",
                    border: "none", color: "#1a0f00", fontSize: 15, fontWeight: 900,
                    boxShadow: "0 6px 24px rgba(250,204,21,0.35)" }}>
                  Got it — let's play
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
