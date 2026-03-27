import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X, Link, Lock, Copy, Check, RefreshCw, MessageCircle } from "lucide-react";
import { uploadGhostVoiceNote } from "../ghostStorage";
import { dbSendChatMessage, dbSaveVoiceNote, dbDeleteVoiceNote, dbSavePrivateBio, dbSaveMemory, dbDeleteMemory } from "../vaultDbService";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import {
  ChatMessage, VoiceNote, ActivityEntry, PrivateBio, Memory, SharedVaultItem, AccessedRoom,
} from "./ghostRoomTypes";
import {
  KEYS, publishShareGrant, genCode,
  readCoins, writeCoins,
  VAULT_COSTS,
  loadMatches, saveJson,
} from "./ghostRoomHelpers";

const ROOM_BG = "https://ik.imagekit.io/7grri5v7d/sfsadfasdfsdfasdfsdadsaw53245324234.png";

// ── Types ─────────────────────────────────────────────────────────────────────

type FileItem = { name: string; type: string; size: number; data: string; uploadedAt: number };
type FileFolder = { id: string; name: string; files: FileItem[] };

interface Props {
  vaultPage: null | "video" | "image" | "ghosts" | "share" | "code" | "chat" | "voice" | "activity" | "shared" | "profile" | "memories" | "files" | "pricing";
  setVaultPage: (p: null | "video" | "image" | "ghosts" | "share" | "code" | "chat" | "voice" | "activity" | "shared" | "profile" | "memories" | "files" | "pricing") => void;
  chatContact: string | null;
  setChatContact: (c: string | null) => void;
  openImageFolder: string | null;
  setOpenImageFolder: (id: string | null) => void;
  openFileFolder: string | null;
  setOpenFileFolder: (id: string | null) => void;
  setSendingImage: (url: string | null) => void;
  setSendToCode: (code: string) => void;
  setSendResult: (r: "ok" | "err" | null) => void;

  // Image page
  showNewFolderInput: boolean;
  setShowNewFolderInput: (v: boolean | ((prev: boolean) => boolean)) => void;
  newFolderName: string;
  setNewFolderName: (v: string) => void;
  handleCreateImageFolder: () => void;
  imgRef: React.RefObject<HTMLInputElement>;
  handleImageUploadToFolder: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imageFolders: { id: string; name: string; images: { url: string; uploadedAt: number }[] }[];
  saveImageFolders: (f: { id: string; name: string; images: { url: string; uploadedAt: number }[] }[]) => void;
  setViewingImage: (url: string | null) => void;

  // Video page
  vidRef: React.RefObject<HTMLInputElement>;
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  videoFolders: { id: string; name: string; videoUrls: string[] }[];
  saveVideoFolders: (f: { id: string; name: string; videoUrls: string[] }[]) => void;
  activeVideoFolder: string | null;
  setActiveVideoFolder: (id: string | null) => void;
  vidUploading: boolean;
  vidProgress: number;
  myVideoUrls: string[];
  setViewingVideo: (url: string | null) => void;
  removeVideoUrl: (idx: number) => void;

  // Code page
  roomCode: string;
  codeCopied: boolean;
  setCodeCopied: (v: boolean) => void;
  showResetConfirm: boolean;
  setShowResetConfirm: (v: boolean) => void;
  resetCode: () => void;

  // Share page
  myImages: string[];
  imgShareCode: string;
  vidShareCode: string;
  bothShareCode: string;
  setImgShareCode: (c: string) => void;
  setVidShareCode: (c: string) => void;
  setBothShareCode: (c: string) => void;
  copiedShare: "img" | "vid" | "both" | null;
  setCopiedShare: (v: "img" | "vid" | "both" | null) => void;
  myGhostId: string;
  accessedRooms: AccessedRoom[];

  // Chat page
  chatMessages: Record<string, ChatMessage[]>;
  setChatMessages: (m: Record<string, ChatMessage[]>) => void;
  chatInput: string;
  setChatInput: (v: string) => void;
  chatMediaExpiry: "none" | "24h" | "view-once";
  setChatMediaExpiry: (v: "none" | "24h" | "view-once") => void;
  refreshCoins: () => void;

  // Voice page
  voiceNotes: VoiceNote[];
  setVoiceNotes: (v: VoiceNote[]) => void;
  isRecording: boolean;
  setIsRecording: (v: boolean) => void;
  recordingTime: number;
  setRecordingTime: (v: number | ((prev: number) => number)) => void;
  mediaRecorderRef: { current: MediaRecorder | null };
  audioChunksRef: { current: Blob[] };
  recordTimerRef: { current: ReturnType<typeof setInterval> | null };

  // Activity page
  activityLog: ActivityEntry[];
  setActivityLog: (v: ActivityEntry[]) => void;

  // Shared vault page
  sharedImgRef: React.RefObject<HTMLInputElement>;
  sharedItems: SharedVaultItem[];
  setSharedItems: (v: SharedVaultItem[] | ((prev: SharedVaultItem[]) => SharedVaultItem[])) => void;

  // Private bio page
  privateBio: PrivateBio;
  editingBio: boolean;
  setEditingBio: (v: boolean) => void;
  bioEdits: PrivateBio;
  setBioEdits: (v: PrivateBio | ((prev: PrivateBio) => PrivateBio)) => void;
  setPrivateBio: (v: PrivateBio) => void;

  // Memories page
  memories: Memory[];
  setMemories: (v: Memory[]) => void;
  newMemoryOpen: boolean;
  setNewMemoryOpen: (v: boolean) => void;
  memDraft: { title: string; content: string; date: string; mood: string };
  setMemDraft: (v: { title: string; content: string; date: string; mood: string } | ((prev: { title: string; content: string; date: string; mood: string }) => { title: string; content: string; date: string; mood: string })) => void;

  // Files page
  showNewFileFolderInput: boolean;
  setShowNewFileFolderInput: (v: boolean | ((prev: boolean) => boolean)) => void;
  newFileFolderName: string;
  setNewFileFolderName: (v: string) => void;
  handleCreateFileFolder: () => void;
  fileRef: React.RefObject<HTMLInputElement>;
  handleFileUploadToFolder: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileFolders: FileFolder[];
  saveFileFolders: (f: FileFolder[]) => void;
  ALLOWED_FILE_TYPES: Record<string, string>;
  FILE_ICONS: Record<string, string>;
  fmtSize: (bytes: number) => string;

  // Pricing page
  coinBalance: number;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function GhostRoomVaultPages(props: Props) {
  const {
    vaultPage, setVaultPage,
    chatContact, setChatContact,
    openImageFolder, setOpenImageFolder,
    openFileFolder, setOpenFileFolder,
    setSendingImage, setSendToCode, setSendResult,
    showNewFolderInput, setShowNewFolderInput,
    newFolderName, setNewFolderName,
    handleCreateImageFolder, imgRef, handleImageUploadToFolder,
    imageFolders, saveImageFolders, setViewingImage,
    vidRef, handleVideoUpload,
    videoFolders, saveVideoFolders,
    activeVideoFolder, setActiveVideoFolder,
    vidUploading, vidProgress,
    myVideoUrls, setViewingVideo, removeVideoUrl,
    roomCode, codeCopied, setCodeCopied,
    showResetConfirm, setShowResetConfirm, resetCode,
    myImages, imgShareCode, vidShareCode, bothShareCode,
    setImgShareCode, setVidShareCode, setBothShareCode,
    copiedShare, setCopiedShare, myGhostId, accessedRooms,
    chatMessages, setChatMessages, chatInput, setChatInput,
    chatMediaExpiry, setChatMediaExpiry, refreshCoins,
    voiceNotes, setVoiceNotes,
    isRecording, setIsRecording, recordingTime, setRecordingTime,
    mediaRecorderRef, audioChunksRef, recordTimerRef,
    activityLog, setActivityLog,
    sharedImgRef, sharedItems, setSharedItems,
    privateBio, editingBio, setEditingBio, bioEdits, setBioEdits, setPrivateBio,
    memories, setMemories, newMemoryOpen, setNewMemoryOpen, memDraft, setMemDraft,
    showNewFileFolderInput, setShowNewFileFolderInput,
    newFileFolderName, setNewFileFolderName,
    handleCreateFileFolder, fileRef, handleFileUploadToFolder,
    fileFolders, saveFileFolders,
    ALLOWED_FILE_TYPES, FILE_ICONS, fmtSize,
    coinBalance,
  } = props;

  const a = useGenderAccent();
  const navigate = useNavigate();
  const matches = loadMatches();

  return (
          <motion.div key="vault-page"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            style={{ position: "fixed", inset: 0, zIndex: 490, background: "#06060a", backgroundImage: `url(${ROOM_BG})`, backgroundSize: "cover", backgroundPosition: "center top", display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Page header */}
            <div style={{ padding: "max(16px,env(safe-area-inset-top,16px)) 16px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(6,6,10,0.95)", backdropFilter: "blur(20px)", flexShrink: 0 }}>
              <button onClick={() => {
                if (vaultPage === "chat" && chatContact) { setChatContact(null); return; }
                if (vaultPage === "image" && openImageFolder) { setOpenImageFolder(null); return; }
                if (vaultPage === "files" && openFileFolder) { setOpenFileFolder(null); return; }
                setVaultPage(null); setOpenImageFolder(null); setOpenFileFolder(null); setSendingImage(null); setChatContact(null);
              }}
                style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)", flexShrink: 0 }}>
                <ArrowLeft size={16} />
              </button>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#fff", flex: 1 }}>
                {vaultPage === "image" ? (openImageFolder ? (imageFolders.find(f => f.id === openImageFolder)?.name ?? "Folder") : "🖼️ Images")
                  : vaultPage === "video" ? "🎬 Videos"
                  : vaultPage === "code" ? "🔑 Vault Code"
                  : vaultPage === "ghosts" ? "👥 My Contacts"
                  : vaultPage === "share" ? "📤 Share Room"
                  : vaultPage === "chat" ? (chatContact ? `🔐 ${chatContact}` : "🔐 Secret Messages")
                  : vaultPage === "voice" ? "🎙️ Voice Notes"
                  : vaultPage === "activity" ? "📋 Activity Log"
                  : vaultPage === "shared" ? "🔗 Shared Vault"
                  : vaultPage === "profile" ? "🪪 Private Bio"
                  : vaultPage === "memories" ? "📖 Memories"
                  : vaultPage === "files" ? (openFileFolder ? (fileFolders.find(f => f.id === openFileFolder)?.name ?? "Folder") : "📁 Files")
                  : vaultPage === "pricing" ? "💰 Vault Pricing"
                  : "Vault"}
              </span>
              {vaultPage === "image" && !openImageFolder && (
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => { setShowNewFolderInput(v => !v); setNewFolderName(""); }}
                  style={{ height: 34, padding: "0 14px", borderRadius: 10, background: a.gradient, border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                  + New Folder
                </motion.button>
              )}
              {vaultPage === "video" && (
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => vidRef.current?.click()}
                  style={{ height: 34, padding: "0 14px", borderRadius: 10, background: a.gradient, border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <Upload size={12} /> Upload
                </motion.button>
              )}
              {vaultPage === "files" && !openFileFolder && (
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => { setShowNewFileFolderInput(v => !v); setNewFileFolderName(""); }}
                  style={{ height: 34, padding: "0 14px", borderRadius: 10, background: a.gradient, border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                  + New Folder
                </motion.button>
              )}
              {vaultPage === "files" && openFileFolder && (
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => fileRef.current?.click()}
                  style={{ height: 34, padding: "0 14px", borderRadius: 10, background: a.gradient, border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <Upload size={12} /> Upload
                </motion.button>
              )}
            </div>

            {/* ── IMAGE PAGE ── */}
            {vaultPage === "image" && (() => {
              if (showNewFolderInput) return (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>Name your folder</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 20px" }}>Then choose images to upload into it</p>
                  <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleCreateImageFolder(); }}
                    placeholder="e.g. Memories, Selfies…"
                    style={{ width: "100%", height: 50, borderRadius: 14, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 16, padding: "0 16px", outline: "none", marginBottom: 12, boxSizing: "border-box" }} />
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreateImageFolder}
                    style={{ width: "100%", height: 50, borderRadius: 50, background: a.gradient, border: "none", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: `0 4px 20px ${a.glowMid(0.4)}` }}>
                    Create Folder & Upload
                  </motion.button>
                  <input ref={imgRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageUploadToFolder} />
                </div>
              );

              if (openImageFolder) {
                const folder = imageFolders.find(f => f.id === openImageFolder);
                const images = folder?.images ?? [];
                return (
                  <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => imgRef.current?.click()}
                      style={{ width: "100%", height: 44, borderRadius: 12, background: a.glow(0.08), border: `1px dashed ${a.glow(0.3)}`, color: a.glow(0.9), fontSize: 13, fontWeight: 800, cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <Upload size={14} /> Add More Images
                    </motion.button>
                    <input ref={imgRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageUploadToFolder} />
                    {images.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <p style={{ fontSize: 32 }}>🖼️</p>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>No images yet</p>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                        {images.map(({ url, uploadedAt }) => (
                          <div key={url} style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "rgba(6,6,10,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <img src={url} alt="" draggable="false" className="ghost-no-save"
                              onClick={() => setViewingImage(url)}
                              style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block", cursor: "pointer" }}
                              onContextMenu={e => e.preventDefault()} onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                            <div style={{ padding: "4px 6px 6px", background: "rgba(0,0,0,0.6)" }}>
                              <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
                                {new Date(uploadedAt).toLocaleDateString()} {new Date(uploadedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                                <button onClick={() => { setSendingImage(url); setSendToCode(""); setSendResult(null); }}
                                  style={{ flex: 1, height: 22, borderRadius: 6, background: a.glow(0.12), border: `1px solid ${a.glow(0.25)}`, color: a.glow(0.9), fontSize: 9, fontWeight: 800, cursor: "pointer" }}>
                                  Send
                                </button>
                                <button onClick={() => {
                                  const updated = imageFolders.map(f => f.id === openImageFolder ? { ...f, images: f.images.filter(i => i.url !== url) } : f);
                                  saveImageFolders(updated);
                                }}
                                  style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <X size={9} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                  {imageFolders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0" }}>
                      <p style={{ fontSize: 40 }}>📁</p>
                      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", margin: "8px 0 4px" }}>No folders yet</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Tap "+ New Folder" to create one</p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {imageFolders.map(folder => {
                        const imgs = folder.images ?? [];
                        const preview = imgs[0]?.url;
                        return (
                          <motion.button key={folder.id} whileTap={{ scale: 0.97 }}
                            onClick={() => setOpenImageFolder(folder.id)}
                            style={{ textAlign: "left", background: "rgba(6,6,10,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, overflow: "hidden", cursor: "pointer", padding: 0 }}>
                            <div style={{ width: "100%", aspectRatio: "16/9", background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                              {preview
                                ? <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📁</div>}
                            </div>
                            <div style={{ padding: "8px 12px 10px" }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{folder.name}</p>
                              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{imgs.length} image{imgs.length !== 1 ? "s" : ""}</p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── VIDEO PAGE ── */}
            {vaultPage === "video" && (
              <>
                <input ref={vidRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleVideoUpload} />
                {/* Folder tabs */}
                <div style={{ display: "flex", gap: 8, padding: "10px 14px", overflowX: "auto", scrollbarWidth: "none", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <button onClick={() => setActiveVideoFolder(null)}
                    style={{ flexShrink: 0, height: 30, padding: "0 12px", borderRadius: 20, background: activeVideoFolder === null ? a.gradient : "rgba(255,255,255,0.06)", border: activeVideoFolder === null ? "none" : "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    All
                  </button>
                  {videoFolders.map(f => (
                    <button key={f.id} onClick={() => setActiveVideoFolder(f.id)}
                      style={{ flexShrink: 0, height: 30, padding: "0 12px", borderRadius: 20, background: activeVideoFolder === f.id ? a.gradient : "rgba(255,255,255,0.06)", border: activeVideoFolder === f.id ? "none" : "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      📁 {f.name}
                    </button>
                  ))}
                  <button onClick={() => setShowNewFolderInput(v => !v)}
                    style={{ flexShrink: 0, height: 30, padding: "0 12px", borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    + Folder
                  </button>
                </div>
                {showNewFolderInput && (
                  <div style={{ display: "flex", gap: 8, padding: "8px 14px", flexShrink: 0 }}>
                    <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && newFolderName.trim()) { const f = { id: Date.now().toString(), name: newFolderName.trim(), videoUrls: [] }; saveVideoFolders([...videoFolders, f]); setNewFolderName(""); setShowNewFolderInput(false); } }}
                      placeholder="Folder name…"
                      style={{ flex: 1, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 13, padding: "0 10px", outline: "none" }} />
                    <button onClick={() => { if (newFolderName.trim()) { const f = { id: Date.now().toString(), name: newFolderName.trim(), videoUrls: [] }; saveVideoFolders([...videoFolders, f]); setNewFolderName(""); setShowNewFolderInput(false); } }}
                      style={{ height: 34, padding: "0 12px", borderRadius: 9, background: a.gradient, border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                      Add
                    </button>
                  </div>
                )}
                <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                  {vidUploading && (
                    <div style={{ marginBottom: 10, background: a.glow(0.08), border: `1px solid ${a.glow(0.2)}`, borderRadius: 12, padding: "10px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>Uploading…</span>
                        <span style={{ fontSize: 12, color: a.glow(0.8), fontWeight: 800 }}>{vidProgress}%</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
                        <div style={{ height: "100%", borderRadius: 2, background: a.gradient, width: `${vidProgress}%`, transition: "width 0.3s" }} />
                      </div>
                    </div>
                  )}
                  {(() => {
                    const allVideos = myVideoUrls.map((url, i) => ({ url, uploadedAt: Date.now() - i * 3600000 * 24 }));
                    const displayed = activeVideoFolder
                      ? (videoFolders.find(f => f.id === activeVideoFolder)?.videoUrls ?? []).map(url => ({ url, uploadedAt: 0 }))
                      : allVideos;
                    if (displayed.length === 0) return (
                      <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <p style={{ fontSize: 28 }}>🎬</p>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 }}>No videos yet</p>
                      </div>
                    );
                    return displayed.map(({ url }) => {
                      const globalIdx = myVideoUrls.indexOf(url);
                      const uploadedAgo = globalIdx >= 0 ? `${Math.floor((Date.now() - (Date.now() - globalIdx * 3600000 * 24)) / 3600000)}h ago` : "recently";
                      return (
                        <div key={url} style={{ background: "rgba(6,6,10,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, marginBottom: 10, overflow: "hidden" }}>
                          <video src={url} style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block" }}
                            onClick={() => setViewingVideo(url)} onContextMenu={e => e.preventDefault()} />
                          <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#fff" }}>Video {globalIdx + 1}</p>
                              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Uploaded {uploadedAgo}</p>
                            </div>
                            {activeVideoFolder && (
                              <button onClick={() => {
                                const updated = videoFolders.map(f => f.id === activeVideoFolder ? { ...f, videoUrls: f.videoUrls.filter(u => u !== url) } : f);
                                saveVideoFolders(updated);
                              }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11 }}>Remove</button>
                            )}
                            {!activeVideoFolder && (
                              <>
                                {videoFolders.length > 0 && (
                                  <select onChange={e => { const fid = e.target.value; if (!fid) return; const updated = videoFolders.map(f => f.id === fid && !f.videoUrls.includes(url) ? { ...f, videoUrls: [...f.videoUrls, url] } : f); saveVideoFolders(updated); e.target.value = ""; }}
                                    style={{ height: 28, borderRadius: 7, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 10, padding: "0 6px", cursor: "pointer" }}>
                                    <option value="">+ Folder</option>
                                    {videoFolders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                  </select>
                                )}
                                <button onClick={() => removeVideoUrl(globalIdx)}
                                  style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <X size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </>
            )}

            {/* ── CODE PAGE ── */}
            {vaultPage === "code" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                <div style={{ background: "rgba(6,6,10,0.72)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "14px 16px", marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8, display: "block", margin: "0 0 8px" }}>Your Room Code</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ flex: 1, fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "0.2em", fontFamily: "monospace" }}>{roomCode}</span>
                    <button onClick={() => { navigator.clipboard.writeText(roomCode).catch(() => {}); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }}
                      style={{ height: 34, padding: "0 12px", borderRadius: 9, background: codeCopied ? "rgba(74,222,128,0.15)" : a.glow(0.1), border: `1px solid ${codeCopied ? "rgba(74,222,128,0.4)" : a.glow(0.25)}`, color: codeCopied ? "#4ade80" : "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                      {codeCopied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { const url = `${window.location.origin}/room?code=${roomCode}`; navigator.clipboard.writeText(url).catch(() => {}); }}
                    style={{ flex: 1, height: 44, borderRadius: 12, background: a.glow(0.08), border: `1px solid ${a.glow(0.2)}`, color: a.glow(0.9), fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Link size={13} /> Copy Share Link
                  </button>
                  {!showResetConfirm ? (
                    <button onClick={() => setShowResetConfirm(true)}
                      style={{ flex: 1, height: 44, borderRadius: 12, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                      Reset Code
                    </button>
                  ) : (
                    <button onClick={() => { resetCode(); setShowResetConfirm(false); }}
                      style={{ flex: 1, height: 44, borderRadius: 12, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", fontSize: 12, fontWeight: 900, cursor: "pointer" }}>
                      Confirm Reset
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── GHOSTS PAGE ── */}
            {vaultPage === "ghosts" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                {matches.length === 0 && accessedRooms.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <p style={{ fontSize: 40, margin: "0 0 14px" }}>👥</p>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", margin: 0 }}>No guest connections yet</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)" }}>Match with ghosts to see them here</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      ...matches.map(m => ({ ghostId: m.profile.id, name: m.profile.name, city: m.profile.city, country: m.profile.countryFlag, age: m.profile.age, image: m.profile.image, at: m.matchedAt })),
                      ...accessedRooms.map(r => ({ ghostId: r.ghostId, name: r.ghostId, city: "", country: "", age: 0, image: "", at: r.grantedAt })),
                    ].map((c, i) => {
                      const isActive = i % 3 !== 2;
                      return (
                        <motion.div key={i} initial={{ x: -36, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.055 }}
                          style={{ display: "flex", alignItems: "center", gap: 12, background: isActive ? a.glow(0.04) : "rgba(255,255,255,0.03)", border: `1px solid ${isActive ? a.glow(0.15) : "rgba(255,255,255,0.07)"}`, borderRadius: 16, padding: "12px 14px" }}>
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", border: `2px solid ${isActive ? a.glow(0.5) : "rgba(255,255,255,0.12)"}` }}>
                              {c.image ? <img src={c.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <div style={{ width: "100%", height: "100%", background: a.glow(0.1), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>👻</div>}
                            </div>
                            {isActive && <span style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: a.accent, border: "2px solid #050508", animation: "pulse-dot 1.4s ease-in-out infinite" }} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 900, color: "#fff", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name || c.ghostId}</p>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 4px" }}>{c.ghostId}{c.city ? ` · ${c.city}` : ""}{c.age ? `, ${c.age}` : ""}{c.country ? ` ${c.country}` : ""}</p>
                            <span style={{ fontSize: 9, borderRadius: 6, padding: "2px 7px", fontWeight: 700, background: isActive ? a.glow(0.1) : "rgba(255,255,255,0.05)", border: `1px solid ${isActive ? a.glow(0.2) : "rgba(255,255,255,0.08)"}`, color: isActive ? a.glow(0.85) : "rgba(255,255,255,0.3)" }}>
                              {isActive ? "● Active now" : "Offline"}
                            </span>
                          </div>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: a.glow(0.08), border: `1px solid ${a.glow(0.2)}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                            <MessageCircle size={15} color={a.glow(0.7)} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── SHARE PAGE ── */}
            {vaultPage === "share" && (() => {
              const shareOptions: Array<{
                key: "img" | "vid" | "both";
                label: string; desc: string; code: string;
                setCode: (c: string) => void; storageKey: string;
                accent: string; border: string; bg: string; count: string;
              }> = [
                { key: "img", label: "🖼 Image Room", desc: "Recipient sees your images only — videos stay locked", code: imgShareCode, setCode: setImgShareCode, storageKey: KEYS.imgShare, accent: "#e01010", border: "rgba(220,20,20,0.3)", bg: "rgba(6,4,4,0.82)", count: `${myImages.length} image${myImages.length !== 1 ? "s" : ""}` },
                { key: "vid", label: "🎬 Video Room", desc: "Recipient sees your videos only — images stay locked", code: vidShareCode, setCode: setVidShareCode, storageKey: KEYS.vidShare, accent: "#e01010", border: "rgba(220,20,20,0.3)", bg: "rgba(6,4,4,0.82)", count: `${myVideoUrls.length} video${myVideoUrls.length !== 1 ? "s" : ""}` },
                { key: "both", label: "🔗 Full Room", desc: "Recipient sees both images and videos", code: bothShareCode, setCode: setBothShareCode, storageKey: KEYS.bothShare, accent: "#e01010", border: "rgba(220,20,20,0.3)", bg: "rgba(6,4,4,0.82)", count: `${myImages.length} images · ${myVideoUrls.length} videos` },
              ];
              const resetShareCode = (opt: typeof shareOptions[0]) => {
                const newCode = genCode(); opt.setCode(newCode);
                try { localStorage.setItem(opt.storageKey, newCode); } catch {}
                publishShareGrant(newCode, myGhostId, opt.key === "img" ? "image" : opt.key === "vid" ? "video" : "both", myImages, myVideoUrls);
              };
              const copyShareCode = (opt: typeof shareOptions[0]) => {
                navigator.clipboard.writeText(opt.code).catch(() => {});
                setCopiedShare(opt.key); setTimeout(() => setCopiedShare(null), 2000);
              };
              return (
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(6,4,4,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(220,20,20,0.25)", borderRadius: 12, padding: "10px 14px", marginBottom: 16 }}>
                    <Lock size={13} color="#e01010" style={{ marginTop: 1, flexShrink: 0 }} />
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.5 }}>
                      Each code grants access <span style={{ color: "#ff4444", fontWeight: 800 }}>only</span> to the selected room type. Share only with ghosts you trust — codes can be reset at any time.
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {shareOptions.map(opt => (
                      <div key={opt.key} style={{ background: opt.bg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: `1px solid ${opt.border}`, borderTop: "1px solid rgba(220,20,20,0.45)", borderRadius: 18, overflow: "hidden", boxShadow: "inset 0 1px 0 rgba(220,20,20,0.12)" }}>
                        <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${opt.border}` }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{opt.label}</span>
                            <span style={{ fontSize: 10, color: "#e01010", fontWeight: 700, background: "rgba(220,20,20,0.12)", border: "1px solid rgba(220,20,20,0.25)", borderRadius: 6, padding: "2px 8px" }}>{opt.count}</span>
                          </div>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", margin: 0 }}>{opt.desc}</p>
                        </div>
                        <div style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 44, borderRadius: 10, background: "rgba(0,0,0,0.3)", border: `1px solid ${opt.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ fontSize: 18, fontWeight: 900, color: opt.accent, letterSpacing: "0.22em" }}>{opt.code}</span>
                            </div>
                            <motion.button whileTap={{ scale: 0.93 }} onClick={() => copyShareCode(opt)}
                              style={{ width: 44, height: 44, borderRadius: 10, border: `1px solid ${opt.border}`, background: copiedShare === opt.key ? opt.bg : "rgba(0,0,0,0.3)", color: opt.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {copiedShare === opt.key ? <Check size={15} /> : <Copy size={15} />}
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.93 }} onClick={() => resetShareCode(opt)}
                              title="Reset code — old code stops working"
                              style={{ width: 44, height: 44, borderRadius: 10, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)", color: "rgba(239,68,68,0.7)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <RefreshCw size={14} />
                            </motion.button>
                          </div>
                          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", margin: "7px 0 0", textAlign: "center" }}>Reset code to revoke all current access for this room</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ── CHAT PAGE ── */}
            {vaultPage === "chat" && (() => {
              const allContacts = [
                ...matches.map(m => ({ id: m.profile.id, name: m.profile.name, image: m.profile.image })),
              ];
              const FROSTED = { background: "rgba(6,4,4,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(220,20,20,0.2)", borderRadius: 14 };

              if (!chatContact) return (
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>🔐 Disappearing messages only — nothing stored permanently. Select a contact to start.</p>
                  {allContacts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0" }}>
                      <p style={{ fontSize: 36 }}>🔐</p>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>No contacts yet — match with ghosts first</p>
                    </div>
                  ) : allContacts.map(c => (
                    <motion.button key={c.id} whileTap={{ scale: 0.97 }}
                      onClick={() => setChatContact(c.id)}
                      style={{ ...FROSTED, width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 10, cursor: "pointer", textAlign: "left" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: "rgba(220,20,20,0.1)", flexShrink: 0, border: "2px solid rgba(220,20,20,0.3)" }}>
                        {c.image ? <img src={c.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👻</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#fff" }}>{c.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{(chatMessages[c.id] || []).length} messages</p>
                      </div>
                      <span style={{ fontSize: 14, color: "rgba(220,20,20,0.6)" }}>›</span>
                    </motion.button>
                  ))}
                </div>
              );

              const msgs: ChatMessage[] = chatMessages[chatContact] || [];
              const sendChat = () => {
                if (!chatInput.trim()) return;
                const curChat = readCoins();
                if (curChat < VAULT_COSTS.chatMessage) {
                  alert(`Vault chat messages cost ${VAULT_COSTS.chatMessage} coins.\nYou have ${curChat} coins — visit the Coin Shop to top up.`);
                  return;
                }
                writeCoins(curChat - VAULT_COSTS.chatMessage);
                refreshCoins();
                const msg: ChatMessage = {
                  id: Date.now().toString(),
                  senderId: myGhostId,
                  content: chatInput.trim(),
                  type: "text",
                  sentAt: Date.now(),
                  expiresAt: chatMediaExpiry === "24h" ? Date.now() + 86400000 : undefined,
                  viewOnce: chatMediaExpiry === "view-once",
                };
                const updated = { ...chatMessages, [chatContact]: [...msgs, msg] };
                setChatMessages(updated);
                saveJson("ghost_vault_chats", updated);
                setChatInput("");
                dbSendChatMessage(msg, chatContact);
              };

              return (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  {/* Expiry toggle */}
                  <div style={{ padding: "8px 16px", display: "flex", gap: 6, borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
                    {(["none","24h","view-once"] as const).map(v => (
                      <button key={v} onClick={() => setChatMediaExpiry(v)}
                        style={{ height: 26, padding: "0 10px", borderRadius: 8, border: `1px solid ${chatMediaExpiry === v ? "rgba(220,20,20,0.5)" : "rgba(255,255,255,0.08)"}`, background: chatMediaExpiry === v ? "rgba(220,20,20,0.12)" : "rgba(255,255,255,0.04)", color: chatMediaExpiry === v ? "#ff4444" : "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                        {v === "none" ? "Normal" : v === "24h" ? "⏱ 24h" : "👁 View once"}
                      </button>
                    ))}
                  </div>
                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8, scrollbarWidth: "none" }}>
                    {msgs.length === 0 && <p style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 40 }}>No messages yet — say something private 💬</p>}
                    {msgs.map(msg => {
                      const isMine = msg.senderId === myGhostId;
                      return (
                        <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                          <div style={{ maxWidth: "75%", background: isMine ? "rgba(220,20,20,0.18)" : "rgba(6,4,4,0.82)", backdropFilter: "blur(12px)", border: `1px solid ${isMine ? "rgba(220,20,20,0.35)" : "rgba(255,255,255,0.08)"}`, borderRadius: isMine ? "14px 4px 14px 14px" : "4px 14px 14px 14px", padding: "9px 13px" }}>
                            <p style={{ margin: 0, fontSize: 13, color: "#fff", lineHeight: 1.5 }}>{msg.content}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                              <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                              {msg.viewOnce && <span style={{ fontSize: 9, color: "rgba(220,20,20,0.6)", fontWeight: 700 }}>👁 once</span>}
                              {msg.expiresAt && !msg.viewOnce && <span style={{ fontSize: 9, color: "rgba(255,180,0,0.7)", fontWeight: 700 }}>⏱ 24h</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Input */}
                  <div style={{ padding: "10px 16px max(16px,env(safe-area-inset-bottom,16px))", display: "flex", gap: 8, borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(6,4,4,0.9)", flexShrink: 0 }}>
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendChat(); }}
                      placeholder="Type a private message…"
                      style={{ flex: 1, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, padding: "0 14px", outline: "none" }} />
                    <motion.button whileTap={{ scale: 0.93 }} onClick={sendChat}
                      style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(220,20,20,0.2)", border: "1px solid rgba(220,20,20,0.4)", color: "#ff4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 18 }}>↑</span>
                    </motion.button>
                  </div>
                </div>
              );
            })()}

            {/* ── VOICE NOTES PAGE ── */}
            {vaultPage === "voice" && (() => {
              const FROSTED = { background: "rgba(6,4,4,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(220,20,20,0.2)", borderRadius: 14 };
              const startRec = async () => {
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                  const mr = new MediaRecorder(stream);
                  audioChunksRef.current = [];
                  mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
                  mr.onstop = async () => {
                    const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                    stream.getTracks().forEach(t => t.stop());
                    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
                    const dur = recordingTime;
                    setRecordingTime(0);
                    // Coin check for voice notes
                    const curC = readCoins();
                    if (curC < VAULT_COSTS.voiceNote) {
                      alert(`Voice notes cost ${VAULT_COSTS.voiceNote} coins each.\nYou have ${curC} coins — visit the Coin Shop to top up.`);
                      return;
                    }
                    writeCoins(curC - VAULT_COSTS.voiceNote);
                    refreshCoins();
                    try {
                      const { path, publicUrl } = await uploadGhostVoiceNote(blob, myGhostId);
                      const note: VoiceNote = { id: Date.now().toString(), audioData: publicUrl, duration: dur, createdAt: Date.now() };
                      const updated = [note, ...voiceNotes];
                      setVoiceNotes(updated);
                      saveJson("ghost_vault_voice_notes", updated);
                      dbSaveVoiceNote(myGhostId, note, path, publicUrl);
                    } catch {
                      // Fallback to base64
                      const reader = new FileReader();
                      reader.onload = ev => {
                        const audioData = ev.target?.result as string;
                        const note: VoiceNote = { id: Date.now().toString(), audioData, duration: dur, createdAt: Date.now() };
                        const updated = [note, ...voiceNotes];
                        setVoiceNotes(updated);
                        saveJson("ghost_vault_voice_notes", updated);
                      };
                      reader.readAsDataURL(blob);
                    }
                  };
                  mediaRecorderRef.current = mr;
                  mr.start();
                  setIsRecording(true);
                  setRecordingTime(0);
                  recordTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
                } catch { alert("Microphone access denied"); }
              };
              const stopRec = () => {
                mediaRecorderRef.current?.stop();
                setIsRecording(false);
              };
              const fmtDur = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
              return (
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                  {/* Record button */}
                  <div style={{ ...FROSTED, padding: "20px 16px", marginBottom: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                    <motion.button whileTap={{ scale: 0.93 }}
                      onClick={isRecording ? stopRec : startRec}
                      animate={isRecording ? { scale: [1, 1.08, 1], boxShadow: ["0 0 0px rgba(220,20,20,0)", "0 0 20px rgba(220,20,20,0.6)", "0 0 0px rgba(220,20,20,0)"] } : {}}
                      transition={isRecording ? { duration: 1.2, repeat: Infinity } : {}}
                      style={{ width: 72, height: 72, borderRadius: "50%", background: isRecording ? "rgba(220,20,20,0.25)" : "rgba(220,20,20,0.12)", border: `2px solid rgba(220,20,20,${isRecording ? 0.7 : 0.4})`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 28 }}>
                      {isRecording ? "⏹" : "🎙️"}
                    </motion.button>
                    <p style={{ margin: 0, fontSize: 13, color: isRecording ? "#ff4444" : "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                      {isRecording ? `Recording… ${fmtDur(recordingTime)}` : "Tap to record a voice note"}
                    </p>
                  </div>
                  {/* Saved notes */}
                  {voiceNotes.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0" }}>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>No voice notes yet</p>
                    </div>
                  ) : voiceNotes.map((note, i) => (
                    <div key={note.id} style={{ ...FROSTED, padding: "12px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
                      <button onClick={() => { const a = new Audio(note.audioData); a.play(); }}
                        style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(220,20,20,0.15)", border: "1px solid rgba(220,20,20,0.35)", color: "#ff4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>▶</button>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff" }}>Voice Note {voiceNotes.length - i}</p>
                        <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{fmtDur(note.duration)} · {new Date(note.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => { const updated = voiceNotes.filter(v => v.id !== note.id); setVoiceNotes(updated); saveJson("ghost_vault_voice_notes", updated); dbDeleteVoiceNote(note.id); }}
                        style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* ── ACTIVITY LOG PAGE ── */}
            {vaultPage === "activity" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                {activityLog.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <p style={{ fontSize: 36 }}>📋</p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>No activity recorded yet</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {activityLog.map((entry, i) => {
                      const icons: Record<ActivityEntry["action"], string> = { login: "🔓", code_shared: "🔑", image_sent: "🖼️", voice_sent: "🎙️", chat_opened: "💬" };
                      const labels: Record<ActivityEntry["action"], string> = { login: "Vault unlocked", code_shared: "Code shared", image_sent: "Image sent", voice_sent: "Voice note sent", chat_opened: "Chat opened" };
                      return (
                        <div key={entry.id} style={{ background: "rgba(6,4,4,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(220,20,20,0.15)", borderLeft: i === 0 ? "3px solid rgba(220,20,20,0.7)" : "3px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 20, flexShrink: 0 }}>{icons[entry.action]}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff" }}>{labels[entry.action]}</p>
                            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{entry.ghostId} · {new Date(entry.at).toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                    <button onClick={() => { setActivityLog([]); saveJson("ghost_vault_activity", []); }}
                      style={{ marginTop: 8, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "9px 0", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Clear log
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── SHARED VAULT PAGE ── */}
            {vaultPage === "shared" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                <div style={{ background: "rgba(6,4,4,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(220,20,20,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>🔗</span>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.5 }}>Shared vault is a joint space between you and your matched contacts. Both can upload — only mutual vault connections can see it.</p>
                </div>
                <input ref={sharedImgRef} type="file" accept="image/*,video/*" multiple style={{ display: "none" }}
                  onChange={async e => {
                    const files = Array.from(e.target.files || []);
                    for (const file of files) {
                      const reader = new FileReader();
                      reader.onload = ev => {
                        const item: SharedVaultItem = { id: Date.now().toString() + Math.random(), uploadedBy: myGhostId, type: file.type.startsWith("video") ? "video" : "image", url: ev.target?.result as string, uploadedAt: Date.now() };
                        setSharedItems(prev => { const u = [item, ...prev]; saveJson("ghost_vault_shared", u); return u; });
                      };
                      reader.readAsDataURL(file);
                    }
                    e.target.value = "";
                  }}
                />
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => sharedImgRef.current?.click()}
                  style={{ width: "100%", height: 46, borderRadius: 12, background: "rgba(220,20,20,0.1)", border: "1px dashed rgba(220,20,20,0.4)", color: "#ff4444", fontSize: 13, fontWeight: 800, cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Upload size={14} /> Add to Shared Vault
                </motion.button>
                {sharedItems.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <p style={{ fontSize: 36 }}>🔗</p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>Nothing shared yet</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {sharedItems.map(item => (
                      <div key={item.id} style={{ background: "rgba(6,4,4,0.72)", backdropFilter: "blur(12px)", border: "1px solid rgba(220,20,20,0.15)", borderRadius: 12, overflow: "hidden", position: "relative" }}>
                        {item.type === "image"
                          ? <img src={item.url} alt="" onClick={() => setViewingImage(item.url)} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", cursor: "pointer" }} />
                          : <video src={item.url} style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} />}
                        <div style={{ padding: "6px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{new Date(item.uploadedAt).toLocaleDateString()}</p>
                          <button onClick={() => { const u = sharedItems.filter(s => s.id !== item.id); setSharedItems(u); saveJson("ghost_vault_shared", u); }}
                            style={{ background: "none", border: "none", color: "rgba(239,68,68,0.6)", cursor: "pointer", padding: 0 }}>
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── PRIVATE BIO PAGE ── */}
            {vaultPage === "profile" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                {!editingBio ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ background: "rgba(6,4,4,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(220,20,20,0.2)", borderRadius: 14, padding: "16px" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(220,20,20,0.7)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>Private Profile</p>
                      {[
                        { label: "Real Name", value: privateBio.realName, icon: "👤" },
                        { label: "Phone", value: privateBio.phone, icon: "📱" },
                        { label: "Instagram", value: privateBio.instagram, icon: "📸" },
                        { label: "Telegram", value: privateBio.telegram, icon: "✈️" },
                        { label: "About me", value: privateBio.bio, icon: "💭" },
                      ].map(f => (
                        <div key={f.label} style={{ display: "flex", gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{f.icon}</span>
                          <div>
                            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>{f.label}</p>
                            <p style={{ margin: 0, fontSize: 13, color: f.value ? "#fff" : "rgba(255,255,255,0.2)" }}>{f.value || "Not set"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setEditingBio(true); setBioEdits({ ...privateBio }); }}
                      style={{ width: "100%", height: 46, borderRadius: 12, background: "rgba(220,20,20,0.1)", border: "1px solid rgba(220,20,20,0.35)", color: "#ff4444", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                      Edit Private Bio
                    </motion.button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { key: "realName" as const, label: "Real Name", placeholder: "Your real name", type: "text" },
                      { key: "phone" as const, label: "Phone", placeholder: "+1 234 567 8901", type: "tel" },
                      { key: "instagram" as const, label: "Instagram", placeholder: "@yourhandle", type: "text" },
                      { key: "telegram" as const, label: "Telegram", placeholder: "@username", type: "text" },
                    ].map(f => (
                      <div key={f.key}>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 5px", fontWeight: 700 }}>{f.label}</p>
                        <input type={f.type} value={bioEdits[f.key]} onChange={e => setBioEdits(b => ({ ...b, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          style={{ width: "100%", height: 46, borderRadius: 11, background: "rgba(6,4,4,0.72)", border: "1px solid rgba(220,20,20,0.2)", color: "#fff", fontSize: 14, padding: "0 14px", outline: "none", boxSizing: "border-box" }} />
                      </div>
                    ))}
                    <div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 5px", fontWeight: 700 }}>About Me</p>
                      <textarea value={bioEdits.bio} onChange={e => setBioEdits(b => ({ ...b, bio: e.target.value }))}
                        placeholder="Something private about yourself…"
                        style={{ width: "100%", height: 80, borderRadius: 11, background: "rgba(6,4,4,0.72)", border: "1px solid rgba(220,20,20,0.2)", color: "#fff", fontSize: 13, padding: "10px 14px", outline: "none", boxSizing: "border-box", resize: "none" }} />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setEditingBio(false)}
                        style={{ flex: 1, height: 46, borderRadius: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>
                        Cancel
                      </button>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setPrivateBio(bioEdits); saveJson("ghost_vault_bio", bioEdits); setEditingBio(false); dbSavePrivateBio(myGhostId, bioEdits); }}
                        style={{ flex: 2, height: 46, borderRadius: 11, background: "rgba(220,20,20,0.2)", border: "1px solid rgba(220,20,20,0.4)", color: "#ff4444", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                        Save Bio
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── MEMORIES PAGE ── */}
            {vaultPage === "memories" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                {!newMemoryOpen ? (
                  <>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setNewMemoryOpen(true)}
                      style={{ width: "100%", height: 46, borderRadius: 12, background: "rgba(220,20,20,0.1)", border: "1px dashed rgba(220,20,20,0.4)", color: "#ff4444", fontSize: 13, fontWeight: 800, cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      + New Memory
                    </motion.button>
                    {memories.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <p style={{ fontSize: 36 }}>📖</p>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>No memories saved yet</p>
                      </div>
                    ) : memories.map(mem => (
                      <div key={mem.id} style={{ background: "rgba(6,4,4,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(220,20,20,0.15)", borderLeft: "3px solid rgba(220,20,20,0.5)", borderRadius: 14, padding: "13px 15px", marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div>
                            <span style={{ fontSize: 18, marginRight: 6 }}>{mem.mood}</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{mem.title}</span>
                          </div>
                          <button onClick={() => { const u = memories.filter(m => m.id !== mem.id); setMemories(u); saveJson("ghost_vault_memories", u); dbDeleteMemory(mem.id); }}
                            style={{ background: "none", border: "none", color: "rgba(239,68,68,0.5)", cursor: "pointer" }}>
                            <X size={12} />
                          </button>
                        </div>
                        <p style={{ margin: "0 0 6px", fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{mem.content}</p>
                        <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{mem.date}</p>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>New Memory</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      {["❤️","💫","🥂","🌙","😊","🔥"].map(m => (
                        <button key={m} onClick={() => setMemDraft(d => ({ ...d, mood: m }))}
                          style={{ fontSize: 22, background: memDraft.mood === m ? "rgba(220,20,20,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${memDraft.mood === m ? "rgba(220,20,20,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "6px 10px", cursor: "pointer" }}>
                          {m}
                        </button>
                      ))}
                    </div>
                    <input value={memDraft.title} onChange={e => setMemDraft(d => ({ ...d, title: e.target.value }))} placeholder="Memory title…"
                      style={{ height: 46, borderRadius: 11, background: "rgba(6,4,4,0.72)", border: "1px solid rgba(220,20,20,0.2)", color: "#fff", fontSize: 14, padding: "0 14px", outline: "none", boxSizing: "border-box" }} />
                    <input type="date" value={memDraft.date} onChange={e => setMemDraft(d => ({ ...d, date: e.target.value }))}
                      style={{ height: 46, borderRadius: 11, background: "rgba(6,4,4,0.72)", border: "1px solid rgba(220,20,20,0.2)", color: "#fff", fontSize: 14, padding: "0 14px", outline: "none", boxSizing: "border-box" }} />
                    <textarea value={memDraft.content} onChange={e => setMemDraft(d => ({ ...d, content: e.target.value }))} placeholder="What happened? How did it feel?"
                      style={{ height: 100, borderRadius: 11, background: "rgba(6,4,4,0.72)", border: "1px solid rgba(220,20,20,0.2)", color: "#fff", fontSize: 13, padding: "10px 14px", outline: "none", boxSizing: "border-box", resize: "none" }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setNewMemoryOpen(false)}
                        style={{ flex: 1, height: 46, borderRadius: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>
                        Cancel
                      </button>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => {
                        if (!memDraft.title.trim()) return;
                        const curM = readCoins();
                        if (curM < VAULT_COSTS.memoryNote) {
                          alert(`Memory notes cost ${VAULT_COSTS.memoryNote} coins each.\nYou have ${curM} coins — visit the Coin Shop to top up.`);
                          return;
                        }
                        writeCoins(curM - VAULT_COSTS.memoryNote);
                        refreshCoins();
                        const mem: Memory = { id: Date.now().toString(), ...memDraft, createdAt: Date.now() };
                        const u = [mem, ...memories]; setMemories(u); saveJson("ghost_vault_memories", u);
                        dbSaveMemory(myGhostId, mem);
                        setNewMemoryOpen(false); setMemDraft({ title: "", content: "", date: new Date().toISOString().slice(0, 10), mood: "❤️" });
                      }}
                        style={{ flex: 2, height: 46, borderRadius: 11, background: "rgba(220,20,20,0.2)", border: "1px solid rgba(220,20,20,0.4)", color: "#ff4444", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                        Save Memory
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── FILES PAGE ── */}
            {vaultPage === "files" && (() => {
              const FROSTED: React.CSSProperties = { background: "rgba(6,4,4,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(220,20,20,0.2)", borderRadius: 14 };

              if (showNewFileFolderInput) return (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>Name your folder</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 20px" }}>Then choose files to upload into it</p>
                  <input autoFocus value={newFileFolderName} onChange={e => setNewFileFolderName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleCreateFileFolder(); }}
                    placeholder="e.g. Documents, Contracts…"
                    style={{ width: "100%", height: 50, borderRadius: 14, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 16, padding: "0 16px", outline: "none", marginBottom: 12, boxSizing: "border-box" }} />
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreateFileFolder}
                    style={{ width: "100%", height: 50, borderRadius: 50, background: a.gradient, border: "none", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: `0 4px 20px ${a.glowMid(0.4)}` }}>
                    Create Folder &amp; Upload
                  </motion.button>
                  <input ref={fileRef} type="file" multiple accept=".pdf,.xls,.xlsx,.doc,.docx,.csv,.txt,.ppt,.pptx" style={{ display: "none" }} onChange={handleFileUploadToFolder} />
                </div>
              );

              if (openFileFolder) {
                const folder = fileFolders.find(f => f.id === openFileFolder);
                const files = folder?.files ?? [];
                return (
                  <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                    <input ref={fileRef} type="file" multiple accept=".pdf,.xls,.xlsx,.doc,.docx,.csv,.txt,.ppt,.pptx" style={{ display: "none" }} onChange={handleFileUploadToFolder} />
                    {files.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <p style={{ fontSize: 32 }}>📁</p>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>No files yet — tap Upload to add</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {files.map((file, idx) => {
                          const ext = (ALLOWED_FILE_TYPES[file.type] ?? file.name.split(".").pop()?.toUpperCase() ?? "FILE");
                          const icon = FILE_ICONS[ext] ?? "📎";
                          return (
                            <div key={idx} style={{ ...FROSTED, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(220,20,20,0.12)", border: "1px solid rgba(220,20,20,0.25)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
                                <span style={{ fontSize: 7, color: "rgba(220,20,20,0.8)", fontWeight: 800, letterSpacing: "0.05em" }}>{ext}</span>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</p>
                                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                                  {fmtSize(file.size)} · {new Date(file.uploadedAt).toLocaleDateString()} {new Date(file.uploadedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                <button onClick={() => {
                                  const a = document.createElement("a");
                                  a.href = file.data; a.download = file.name; a.click();
                                }}
                                  style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(220,20,20,0.12)", border: "1px solid rgba(220,20,20,0.25)", color: "#ff4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <span style={{ fontSize: 13 }}>↓</span>
                                </button>
                                <button onClick={() => {
                                  const updated = fileFolders.map(f => f.id === openFileFolder ? { ...f, files: f.files.filter((_, i) => i !== idx) } : f);
                                  saveFileFolders(updated);
                                }}
                                  style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <X size={11} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Folder grid
              return (
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                  {fileFolders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0" }}>
                      <p style={{ fontSize: 40 }}>📁</p>
                      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", margin: "8px 0 4px" }}>No folders yet</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Tap "+ New Folder" to create one</p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {fileFolders.map(folder => (
                        <motion.button key={folder.id} whileTap={{ scale: 0.97 }}
                          onClick={() => setOpenFileFolder(folder.id)}
                          style={{ ...FROSTED, textAlign: "left", cursor: "pointer", padding: "14px 14px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(220,20,20,0.1)", border: "1px solid rgba(220,20,20,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                            📁
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{folder.name}</p>
                            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
                              {folder.files.length} file{folder.files.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── PRICING PAGE ── */}
            {vaultPage === "pricing" && (() => {
              const FROSTED: React.CSSProperties = { background: "rgba(6,4,4,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(220,20,20,0.18)", borderRadius: 14, padding: "16px 16px" };
              const FREE_COLOR = "#4ade80";
              const COIN_COLOR = "#d4af37";
              const sections: { title: string; emoji: string; rows: { label: string; detail: string; cost: string; free?: boolean }[] }[] = [
                {
                  title: "Images", emoji: "🖼️",
                  rows: [
                    { label: "First 3 images", detail: "Included with your vault — no coins needed", cost: "FREE", free: true },
                    { label: "Additional images", detail: "Each image beyond your 3 free slots", cost: `${VAULT_COSTS.imageUpload} coins` },
                    { label: "Image folders", detail: "Create & organise folders", cost: "FREE", free: true },
                  ],
                },
                {
                  title: "Videos", emoji: "🎬",
                  rows: [
                    { label: "First video", detail: "Included with your vault — no coins needed", cost: "FREE", free: true },
                    { label: "Additional videos", detail: "Each video beyond your 1 free slot", cost: `${VAULT_COSTS.videoUpload} coins` },
                    { label: "Video folders", detail: "Create & organise folders", cost: "FREE", free: true },
                  ],
                },
                {
                  title: "Voice Notes", emoji: "🎙️",
                  rows: [
                    { label: "Record voice note", detail: "Each recording saved to vault", cost: `${VAULT_COSTS.voiceNote} coins` },
                    { label: "Playback & delete", detail: "Listen or remove your notes", cost: "FREE", free: true },
                  ],
                },
                {
                  title: "Files", emoji: "📁",
                  rows: [
                    { label: "File upload", detail: "PDF, Excel, Word, CSV, PPT, TXT — up to 25 MB", cost: `${VAULT_COSTS.fileUpload} coins` },
                    { label: "File folders", detail: "Create & organise folders", cost: "FREE", free: true },
                    { label: "Download & delete", detail: "Manage your uploaded files", cost: "FREE", free: true },
                  ],
                },
                {
                  title: "Secret Messages", emoji: "🔐",
                  rows: [
                    { label: "Send secret message", detail: "Each message sent in the disappearing secret channel", cost: `${VAULT_COSTS.chatMessage} coins` },
                    { label: "Disappearing messages", detail: "Set 24h expiry or view-once", cost: "FREE", free: true },
                  ],
                },
                {
                  title: "Calls (Chat header)", emoji: "📞",
                  rows: [
                    { label: "Voice call", detail: "Per minute — accessed from any chat thread header", cost: "15 coins/min" },
                    { label: "Video call", detail: "Per minute — premium quality private video", cost: "25 coins/min" },
                    { label: "Call ends automatically", detail: "Auto-ends when balance too low", cost: "FREE", free: true },
                  ],
                },
                {
                  title: "Memories", emoji: "📖",
                  rows: [
                    { label: "Save memory note", detail: "Each new memory added to vault", cost: `${VAULT_COSTS.memoryNote} coins` },
                    { label: "Read & delete", detail: "Browse or remove memories", cost: "FREE", free: true },
                  ],
                },
                {
                  title: "Shared Vault", emoji: "🔗",
                  rows: [
                    { label: "Post to shared vault", detail: "Share image or video with your match", cost: `${VAULT_COSTS.sharedVault} coins` },
                    { label: "View shared items", detail: "Browse what your match has shared", cost: "FREE", free: true },
                  ],
                },
                {
                  title: "Always Free", emoji: "✅",
                  rows: [
                    { label: "Vault Code", detail: "Generate & share your access code", cost: "FREE", free: true },
                    { label: "Private Bio", detail: "Store your real contact details", cost: "FREE", free: true },
                    { label: "Activity Log", detail: "Track vault access history", cost: "FREE", free: true },
                    { label: "Quick PIN", detail: "4-digit fast-entry setup", cost: "FREE", free: true },
                    { label: "Screenshot Watermark", detail: "Invisible ID on full-screen photos", cost: "FREE", free: true },
                  ],
                },
              ];
              return (
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                  {/* Balance banner */}
                  <div style={{ ...FROSTED, display: "flex", alignItems: "center", gap: 14, marginBottom: 16, borderColor: "rgba(212,175,55,0.3)" }}>
                    <span style={{ fontSize: 32 }}>🪙</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>YOUR COIN BALANCE</p>
                      <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: COIN_COLOR, fontVariantNumeric: "tabular-nums" }}>{coinBalance.toLocaleString()}</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => navigate("/mode")}
                      style={{ padding: "8px 14px", background: "rgba(212,175,55,0.14)", border: "1px solid rgba(212,175,55,0.35)", borderRadius: 10, color: COIN_COLOR, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                      Get Coins
                    </motion.button>
                  </div>

                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 14px", lineHeight: 1.6 }}>
                    The first 3 images and 1 video are always free. All other vault features deduct coins from your balance at the time of use.
                  </p>

                  {sections.map(sec => (
                    <div key={sec.title} style={{ marginBottom: 14 }}>
                      <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {sec.emoji} {sec.title}
                      </p>
                      <div style={{ ...FROSTED, padding: 0, overflow: "hidden" }}>
                        {sec.rows.map((row, ri) => (
                          <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: ri < sec.rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{row.label}</p>
                              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{row.detail}</p>
                            </div>
                            <div style={{ background: row.free ? "rgba(74,222,128,0.1)" : "rgba(212,175,55,0.1)", border: `1px solid ${row.free ? "rgba(74,222,128,0.3)" : "rgba(212,175,55,0.3)"}`, borderRadius: 8, padding: "4px 10px", flexShrink: 0 }}>
                              <span style={{ fontSize: 12, fontWeight: 900, color: row.free ? FREE_COLOR : COIN_COLOR }}>
                                {row.free ? "FREE" : <>{row.cost.replace(" coins", "")} <span style={{ fontSize: 11 }}>🪙</span></>}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 8 }}>Prices in coins · Earn coins daily by staying active</p>
                </div>
              );
            })()}

          </motion.div>
  );
}
