import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, Upload, X, Link, Users, Lock, Unlock, Image, Video, ShieldOff, Copy, Check, MessageCircle, Settings, LogOut } from "lucide-react";
import { uploadGhostImage, deleteGhostImage, uploadGhostVideo, deleteGhostVideo, isSupabaseStorageUrl, uploadGhostFile, uploadGhostVoiceNote } from "../ghostStorage";
import {
  dbLoadImageFolders, dbCreateImageFolder, dbAddImageToFolder, dbDeleteImageFromFolder,
  dbLoadVideoFolders, dbCreateVideoFolder, dbAddVideoToFolder, dbDeleteVideoFromFolder,
  dbLoadFileFolders, dbCreateFileFolder, dbAddFileToFolder, dbDeleteFileFromFolder,
  dbLoadChatMessages, dbSendChatMessage,
  dbLoadVoiceNotes, dbSaveVoiceNote, dbDeleteVoiceNote,
  dbLoadInbox, dbSendInboxItem, dbUpdateInboxStatus,
  dbLogActivity, dbLoadActivityLog,
  dbLoadSharedItems, dbSaveSharedItem, dbDeleteSharedItem,
  dbLoadPrivateBio, dbSavePrivateBio,
  dbLoadMemories, dbSaveMemory, dbDeleteMemory,
  dbLoadVaultCode, dbSaveVaultCode,
} from "../vaultDbService";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import {
  RoomRequest, ShareAccessType, AccessedRoom, GhostMatch,
  InboxItem, ChatMessage, VoiceNote, ActivityEntry, PrivateBio, Memory, SharedVaultItem,
  RoomTier, RoomAmenity,
  VAULT_EXPIRY_MS, ROOM_TIERS, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES,
} from "./ghostRoomTypes";
import {
  hasRoomSub, activateRoomSub,
  isSessionValid, startSession, clearSession,
  mockSendOtp,
  getVideoDuration,
  KEYS,
  publishShareGrant, genCode, getMyGhostId,
  loadJson, saveJson,
  readCoins, writeCoins,
  VAULT_COSTS, FREE_IMAGES, FREE_VIDEOS,
  loadMatches, fmtAgo,
  inboxKey, loadInbox, saveInbox,
  getItemDaysLeft,
} from "./ghostRoomHelpers";
import { RoomPaywall, GhostRoomAuthGate, RoomWelcomePopup } from "./RoomVaultGuards";
import { SendMediaPanel, VideoUrlInput } from "./RoomVaultPanels";
import GhostRoomVaultPages from "./GhostRoomVaultPages";

const ROOM_BG        = "https://ik.imagekit.io/7grri5v7d/sfsadfasdfsdfasdfsdadsaw53245324234.png";
const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";
const WA_STORED_KEY = "ghost_room_whatsapp";

// ── All types, helpers and guard components live in separate files ─────────────
// See: ghostRoomTypes.ts | ghostRoomHelpers.ts | RoomVaultGuards.tsx
// See: RoomVaultPanels.tsx | GhostRoomVaultPages.tsx



// ── Main page ─────────────────────────────────────────────────────────────────
export default function GhostRoomPage() {
  const a = useGenderAccent();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hasSub, setHasSub] = useState(hasRoomSub);
  const [verified, setVerified] = useState(isSessionValid);
  const [showRoomWelcome, setShowRoomWelcome] = useState(false);
  const [showSideDrawer, setShowSideDrawer] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgShareCode, setImgShareCode] = useState<string>(() => {
    try { return localStorage.getItem(KEYS.imgShare) || genCode(); } catch { return genCode(); }
  });
  const [vidShareCode, setVidShareCode] = useState<string>(() => {
    try { return localStorage.getItem(KEYS.vidShare) || genCode(); } catch { return genCode(); }
  });
  const [bothShareCode, setBothShareCode] = useState<string>(() => {
    try { return localStorage.getItem(KEYS.bothShare) || genCode(); } catch { return genCode(); }
  });
  const [copiedShare, setCopiedShare] = useState<"img" | "vid" | "both" | null>(null);
  const [copiedSoulPack, setCopiedSoulPack] = useState<string | null>(null);
  const [videoFolders, setVideoFolders] = useState<{ id: string; name: string; videoUrls: string[] }[]>(() => {
    try { return JSON.parse(localStorage.getItem("ghost_vault_video_folders") || "[]"); } catch { return []; }
  });
  const [imageFolders, setImageFolders] = useState<{ id: string; name: string; images: { url: string; uploadedAt: number }[] }[]>(() => {
    try { return JSON.parse(localStorage.getItem("ghost_vault_image_folders") || "[]"); } catch { return []; }
  });
  const [activeVideoFolder, setActiveVideoFolder] = useState<string | null>(null);
  const [vaultPage, setVaultPage] = useState<null | "video" | "image" | "ghosts" | "share" | "code" | "chat" | "voice" | "activity" | "shared" | "profile" | "memories" | "files" | "pricing">(null);
  const [openImageFolder, setOpenImageFolder] = useState<string | null>(null);
  const [sendingImage, setSendingImage] = useState<string | null>(null);
  const [sendToCode, setSendToCode] = useState("");
  const [sendResult, setSendResult] = useState<"ok" | "err" | null>(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  // ── Chat state ──────────────────────────────────────────────────────────
  const [chatContact, setChatContact] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>(() =>
    loadJson("ghost_vault_chats", {})
  );
  const [chatInput, setChatInput] = useState("");
  const [chatMediaExpiry, setChatMediaExpiry] = useState<"none" | "24h" | "view-once">("none");

  // ── Voice notes state ────────────────────────────────────────────────────
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>(() => loadJson("ghost_vault_voice_notes", []));
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Activity log ─────────────────────────────────────────────────────────
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>(() => loadJson("ghost_vault_activity", []));

  // ── Shared vault ─────────────────────────────────────────────────────────
  const [sharedItems, setSharedItems] = useState<SharedVaultItem[]>(() => loadJson("ghost_vault_shared", []));
  const sharedImgRef = useRef<HTMLInputElement>(null);

  // ── Private bio ──────────────────────────────────────────────────────────
  const [privateBio, setPrivateBio] = useState<PrivateBio>(() =>
    loadJson("ghost_vault_bio", { realName: "", phone: "", instagram: "", telegram: "", bio: "" })
  );
  const [editingBio, setEditingBio] = useState(false);
  const [bioEdits, setBioEdits] = useState<PrivateBio>({ realName: "", phone: "", instagram: "", telegram: "", bio: "" });

  // ── Memories ─────────────────────────────────────────────────────────────
  const [memories, setMemories] = useState<Memory[]>(() => loadJson("ghost_vault_memories", []));
  const [newMemoryOpen, setNewMemoryOpen] = useState(false);
  const [memDraft, setMemDraft] = useState({ title: "", content: "", date: new Date().toISOString().slice(0, 10), mood: "❤️" });

  // ── PIN ──────────────────────────────────────────────────────────────────
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinSetupVal, setPinSetupVal] = useState("");
  const [pinSetupConfirm, setPinSetupConfirm] = useState("");
  const [pinSetupStep, setPinSetupStep] = useState<"enter" | "confirm">("enter");
  const [pinSetupError, setPinSetupError] = useState("");

  // ── Disappearing media (send modal) ──────────────────────────────────────
  const [sendExpiry, setSendExpiry] = useState<"never" | "24h" | "view-once">("never");
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingVideo, setViewingVideo] = useState<string | null>(null);
  const [tab, setTab] = useState<"my" | "enter" | "matches" | "inbox">("my");

  // All hooks must be declared before any conditional return
  const myGhostId = getMyGhostId();

  // My room state
  const [roomCode, setRoomCode] = useState<string>(() => {
    const v = localStorage.getItem(KEYS.code);
    return v || genCode();
  });
  const [myImages, setMyImages] = useState<string[]>(() => loadJson(KEYS.images, []));
  const [myVideoUrls, setMyVideoUrls] = useState<string[]>(() => loadJson(KEYS.videoUrls, []));
  const [roomTier] = useState<RoomTier>(() => {
    try {
      const ht = localStorage.getItem("ghost_house_tier");
      if (ht === "gold" || ht === "suite") return ht;
      return "free";
    } catch { return "free"; }
  });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [requests, setRequests] = useState<RoomRequest[]>(() => loadJson(KEYS.requests, []));
  const [granted, setGranted] = useState<string[]>(() => loadJson(KEYS.granted, []));
  const [expiry, setExpiry] = useState<"24h" | "7d" | "never">(() =>
    (localStorage.getItem(KEYS.expiry) as "24h" | "7d" | "never") || "never"
  );
  const [codeCopied, setCodeCopied] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Enter room / request — pre-fill from ?code= URL param (shared vault links)
  const [enterInput, setEnterInput] = useState(() => {
    const code = searchParams.get("code");
    return code ? code.toUpperCase() : "";
  });
  const [accessedRooms, setAccessedRooms] = useState<AccessedRoom[]>(() => loadJson(KEYS.accessed, []));
  const [enterError, setEnterError] = useState("");
  const [enterSuccess, setEnterSuccess] = useState("");
  const [requestSent, setRequestSent] = useState<string[]>([]);

  // Switch to Enter tab if a ?code= param was provided
  useEffect(() => {
    if (searchParams.get("code")) setTab("enter");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto sign-out when user leaves the vault (component unmounts)
  useEffect(() => {
    return () => { clearSession(); };
  }, []);

  // Inbox — items sent TO me by other Room Vault holders
  const [inbox, setInbox] = useState<InboxItem[]>(() => loadInbox(myGhostId));

  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── File folders ─────────────────────────────────────────────────────────
  type FileItem = { name: string; type: string; size: number; data: string; uploadedAt: number };
  type FileFolder = { id: string; name: string; files: FileItem[] };
  const [fileFolders, setFileFolders] = useState<FileFolder[]>(() => loadJson("ghost_vault_file_folders", []));
  const [openFileFolder, setOpenFileFolder] = useState<string | null>(null);
  const [showNewFileFolderInput, setShowNewFileFolderInput] = useState(false);
  const [newFileFolderName, setNewFileFolderName] = useState("");
  const saveFileFolders = (f: FileFolder[]) => { setFileFolders(f); saveJson("ghost_vault_file_folders", f); };

  const [imgUploading, setImgUploading] = useState(false);
  const [vidUploading, setVidUploading] = useState(false);
  const [vidProgress, setVidProgress] = useState(0);

  // ── Coin balance ──────────────────────────────────────────────────────────
  const [coinBalance, setCoinBalance] = useState(readCoins);
  const refreshCoins = () => setCoinBalance(readCoins());

  // Persist room code on first load + sync to Supabase
  useEffect(() => {
    if (!localStorage.getItem(KEYS.code)) {
      localStorage.setItem(KEYS.code, roomCode);
    }
    if (verified) {
      dbSaveVaultCode(myGhostId, roomCode);
    }
  }, [roomCode, verified]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load all vault data from Supabase on first verified mount
  useEffect(() => {
    if (!verified) return;
    (async () => {
      const [imgF, vidF, fileF, chats, voiceN, inboxItems, activity, shared, bio, mems] = await Promise.all([
        dbLoadImageFolders(myGhostId),
        dbLoadVideoFolders(myGhostId),
        dbLoadFileFolders(myGhostId),
        dbLoadChatMessages(myGhostId),
        dbLoadVoiceNotes(myGhostId),
        dbLoadInbox(myGhostId),
        dbLoadActivityLog(myGhostId),
        dbLoadSharedItems(myGhostId),
        dbLoadPrivateBio(myGhostId),
        dbLoadMemories(myGhostId),
      ]);
      if (imgF.length)   setImageFolders(imgF);
      if (vidF.length)   setVideoFolders(vidF as typeof videoFolders);
      if (fileF.length)  setFileFolders(fileF as typeof fileFolders);
      if (Object.keys(chats).length) setChatMessages(chats as typeof chatMessages);
      if (voiceN.length) setVoiceNotes(voiceN);
      if (inboxItems.length) setInbox(inboxItems as typeof inbox);
      if (activity.length)   setActivityLog(activity as typeof activityLog);
      if (shared.length)     setSharedItems(shared as typeof sharedItems);
      if (bio.realName || bio.phone || bio.instagram || bio.telegram || bio.bio) setPrivateBio(bio);
      if (mems.length)  setMemories(mems);
    })();
  }, [verified]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-purge expired vault items on mount (free users only)
  useEffect(() => {
    if (roomTier === "gold") return;
    const now = Date.now();
    const cleaned = loadInbox(myGhostId).filter((item) => {
      if (item.status !== "accepted") return true;
      const from = item.acceptedAt || item.sentAt;
      return now - from < VAULT_EXPIRY_MS;
    });
    const full = loadInbox(myGhostId);
    if (cleaned.length < full.length) {
      setInbox(cleaned);
      saveInbox(myGhostId, cleaned);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll inbox every 10s — also clean expired items each tick
  useEffect(() => {
    const t = setInterval(() => {
      const fresh = loadInbox(myGhostId);
      if (roomTier !== "gold") {
        const now = Date.now();
        const cleaned = fresh.filter((item) => {
          if (item.status !== "accepted") return true;
          const from = item.acceptedAt || item.sentAt;
          return now - from < VAULT_EXPIRY_MS;
        });
        if (cleaned.length < fresh.length) {
          saveInbox(myGhostId, cleaned);
          setInbox(cleaned);
          return;
        }
        setInbox(cleaned);
      } else {
        setInbox(fresh);
      }
    }, 10000);
    return () => clearInterval(t);
  }, [myGhostId, roomTier]);

  // Pull in requests written for my Guest ID
  useEffect(() => {
    try {
      const reqKey = `ghost_room_requests_for_${myGhostId}`;
      const incoming: RoomRequest[] = loadJson(reqKey, []);
      if (incoming.length > 0) {
        setRequests((prev) => {
          const merged = [...prev];
          for (const r of incoming) {
            if (!merged.find((m) => m.ghostId === r.ghostId)) merged.push(r);
          }
          return merged;
        });
      }
    } catch {}
  }, [myGhostId]);

  // Keep share grants published whenever files or codes change
  useEffect(() => {
    if (!verified) return;
    publishShareGrant(imgShareCode, myGhostId, "image", myImages, myVideoUrls);
    publishShareGrant(vidShareCode, myGhostId, "video", myImages, myVideoUrls);
    publishShareGrant(bothShareCode, myGhostId, "both", myImages, myVideoUrls);
    try {
      localStorage.setItem(KEYS.imgShare, imgShareCode);
      localStorage.setItem(KEYS.vidShare, vidShareCode);
      localStorage.setItem(KEYS.bothShare, bothShareCode);
    } catch {}
  }, [verified, imgShareCode, vidShareCode, bothShareCode, myImages, myVideoUrls, myGhostId]);

  // Show auth gate if session expired — must be after ALL hooks
  if (!verified) return <GhostRoomAuthGate onVerified={() => {
    setVerified(true);
    setShowRoomWelcome(true);
    // Log login activity
    const entry: ActivityEntry = { id: Date.now().toString(), ghostId: myGhostId, action: "login", at: Date.now() };
    const prev: ActivityEntry[] = loadJson("ghost_vault_activity", []);
    saveJson("ghost_vault_activity", [entry, ...prev].slice(0, 50));
    setActivityLog([entry, ...activityLog].slice(0, 50));
    dbLogActivity(myGhostId, "login");
    // Offer PIN setup if not set
    if (!localStorage.getItem("ghost_vault_pin")) {
      setTimeout(() => setShowPinSetup(true), 1800);
    }
  }} />;

  // Derived values (only used when verified)
  const tierInfo = ROOM_TIERS[roomTier];
  const imageLimit = tierInfo.images;
  const videoLimit = tierInfo.videos;
  const atImageLimit = myImages.length >= imageLimit;
  const atVideoLimit = myVideoUrls.length >= videoLimit;
  const pendingInbox = inbox.filter((i) => i.status === "pending");
  const matches = loadMatches();

  // ── Inbox actions ─────────────────────────────────────────────────────────
  const acceptItem = (id: string) => {
    const item = inbox.find((i) => i.id === id);
    if (!item) return;
    if (item.type === "image") {
      const next = [...myImages, item.content];
      setMyImages(next);
      saveJson(KEYS.images, next);
    } else {
      const next = [...myVideoUrls, item.content];
      setMyVideoUrls(next);
      saveJson(KEYS.videoUrls, next);
    }
    const updated = inbox.map((i) => i.id === id ? { ...i, status: "accepted" as const, acceptedAt: Date.now() } : i);
    setInbox(updated);
    saveInbox(myGhostId, updated);
  };

  const declineItem = (id: string) => {
    const updated = inbox.map((i) => i.id === id ? { ...i, status: "declined" as const } : i);
    setInbox(updated);
    saveInbox(myGhostId, updated);
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const saveVideoFolders = (f: typeof videoFolders) => {
    setVideoFolders(f);
    try { localStorage.setItem("ghost_vault_video_folders", JSON.stringify(f)); } catch {}
  };
  const saveImageFolders = (f: typeof imageFolders) => {
    setImageFolders(f);
    try { localStorage.setItem("ghost_vault_image_folders", JSON.stringify(f)); } catch {}
  };

  const handleCreateImageFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder = { id: Date.now().toString(), name: newFolderName.trim(), images: [] as { url: string; uploadedAt: number }[] };
    saveImageFolders([...imageFolders, newFolder]);
    setOpenImageFolder(newFolder.id);
    setNewFolderName("");
    setShowNewFolderInput(false);
    dbCreateImageFolder(myGhostId, newFolder);
    imgRef.current?.click();
  };

  const handleImageUploadToFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !openImageFolder) return;
    e.target.value = "";
    for (const file of files) {
      const totalImgs = imageFolders.reduce((s, f) => s + (f.images?.length ?? 0), 0);
      if (totalImgs >= FREE_IMAGES) {
        const cur = readCoins();
        if (cur < VAULT_COSTS.imageUpload) {
          alert(`You've used your ${FREE_IMAGES} free image slots.\nExtra images cost ${VAULT_COSTS.imageUpload} coins each.\nYou have ${cur} coins — visit the Coin Shop to top up.`);
          return;
        }
        writeCoins(cur - VAULT_COSTS.imageUpload);
        refreshCoins();
      }
      setImgUploading(true);
      try {
        const url = await uploadGhostImage(file, myGhostId);
        const now = Date.now();
        const next = myImages.includes(url) ? myImages : [...myImages, url];
        setMyImages(next);
        saveJson(KEYS.images, next);
        const updated = imageFolders.map(f => f.id === openImageFolder ? { ...f, images: [...f.images, { url, uploadedAt: now }] } : f);
        saveImageFolders(updated);
        dbAddImageToFolder(myGhostId, openImageFolder, url);
      } catch (err) {
        console.error(err);
      } finally {
        setImgUploading(false);
      }
    }
  };

  const handleCreateFileFolder = () => {
    if (!newFileFolderName.trim()) return;
    const folder: FileFolder = { id: Date.now().toString(), name: newFileFolderName.trim(), files: [] };
    saveFileFolders([...fileFolders, folder]);
    setOpenFileFolder(folder.id);
    setNewFileFolderName("");
    setShowNewFileFolderInput(false);
    dbCreateFileFolder(myGhostId, folder.id, folder.name);
    fileRef.current?.click();
  };

  const ALLOWED_FILE_TYPES: Record<string, string> = {
    "application/pdf": "PDF",
    "application/vnd.ms-excel": "XLS",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
    "application/msword": "DOC",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
    "text/csv": "CSV",
    "text/plain": "TXT",
    "application/vnd.ms-powerpoint": "PPT",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  };

  const FILE_ICONS: Record<string, string> = {
    PDF: "📄", XLS: "📊", XLSX: "📊", DOC: "📝", DOCX: "📝",
    CSV: "📋", TXT: "📃", PPT: "📑", PPTX: "📑",
  };

  const fmtSize = (bytes: number) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const handleFileUploadToFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !openFileFolder) return;
    e.target.value = "";
    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) { alert(`${file.name} exceeds 25 MB limit`); continue; }
      const curF = readCoins();
      if (curF < VAULT_COSTS.fileUpload) {
        alert(`File uploads cost ${VAULT_COSTS.fileUpload} coins each.\nYou have ${curF} coins — visit the Coin Shop to top up.`);
        continue;
      }
      writeCoins(curF - VAULT_COSTS.fileUpload);
      refreshCoins();
      try {
        const { path, publicUrl } = await uploadGhostFile(file, myGhostId);
        const item: FileItem = { name: file.name, type: file.type, size: file.size, data: publicUrl, uploadedAt: Date.now() };
        const fid = openFileFolder;
        setFileFolders(prev => {
          const updated = prev.map(f => f.id === fid ? { ...f, files: [...f.files, item] } : f);
          saveJson("ghost_vault_file_folders", updated);
          return updated;
        });
        dbAddFileToFolder(myGhostId, fid, item, path, publicUrl);
      } catch {
        // Fallback to base64 if Supabase upload fails
        const reader = new FileReader();
        const fid = openFileFolder;
        reader.onload = ev => {
          const item: FileItem = { name: file.name, type: file.type, size: file.size, data: ev.target?.result as string, uploadedAt: Date.now() };
          setFileFolders(prev => {
            const updated = prev.map(f => f.id === fid ? { ...f, files: [...f.files, item] } : f);
            saveJson("ghost_vault_file_folders", updated);
            return updated;
          });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const resetCode = () => {
    const newCode = genCode();
    setRoomCode(newCode);
    localStorage.setItem(KEYS.code, newCode);
    // Revoke all granted access — new code invalidates everything
    setGranted([]);
    saveJson(KEYS.granted, []);
    setShowResetConfirm(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (atImageLimit) { setShowUpgrade(true); e.target.value = ""; return; }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert("Only JPG, PNG, and WEBP images are supported.");
      e.target.value = ""; return;
    }
    const maxMB = tierInfo.imageMaxMB;
    if (file.size > maxMB * 1024 * 1024) {
      alert(`Image too large. Your plan allows max ${maxMB} MB per image.`);
      e.target.value = ""; return;
    }
    e.target.value = "";
    setImgUploading(true);
    try {
      const url = await uploadGhostImage(file, myGhostId);
      const next = [...myImages, url];
      setMyImages(next);
      saveJson(KEYS.images, next);
    } catch (err) {
      console.error(err);
    } finally {
      setImgUploading(false);
    }
  };

  const removeImage = async (idx: number) => {
    const url = myImages[idx];
    const next = myImages.filter((_, i) => i !== idx);
    setMyImages(next);
    saveJson(KEYS.images, next);
    if (isSupabaseStorageUrl(url)) {
      await deleteGhostImage(url).catch(() => {});
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (atVideoLimit) { setShowUpgrade(true); e.target.value = ""; return; }
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      alert("Only MP4, MOV, and WEBM videos are supported.");
      e.target.value = ""; return;
    }
    const maxMB = tierInfo.videoMaxMB;
    if (file.size > maxMB * 1024 * 1024) {
      alert(`Video too large. Your plan allows max ${maxMB} MB per video.`);
      e.target.value = ""; return;
    }
    const duration = await getVideoDuration(file);
    const maxSec = tierInfo.videoMaxSec;
    if (duration > maxSec) {
      const label = maxSec >= 60 ? `${Math.floor(maxSec / 60)} min` : `${maxSec} sec`;
      alert(`Video too long. Your plan allows max ${label} per video.`);
      e.target.value = ""; return;
    }
    e.target.value = "";
    // Coin check for paid video slots
    if (myVideoUrls.length >= FREE_VIDEOS) {
      const cur = readCoins();
      if (cur < VAULT_COSTS.videoUpload) {
        alert(`You've used your ${FREE_VIDEOS} free video slot.\nExtra videos cost ${VAULT_COSTS.videoUpload} coins each.\nYou have ${cur} coins — visit the Coin Shop to top up.`);
        return;
      }
      writeCoins(cur - VAULT_COSTS.videoUpload);
      refreshCoins();
    }
    setVidUploading(true);
    setVidProgress(0);
    try {
      const url = await uploadGhostVideo(file, myGhostId, setVidProgress);
      const next = [...myVideoUrls, url];
      setMyVideoUrls(next);
      saveJson(KEYS.videoUrls, next);
    } catch (err) {
      console.error(err);
    } finally {
      setVidUploading(false);
      setVidProgress(0);
    }
  };

  const removeVideoUrl = async (idx: number) => {
    const url = myVideoUrls[idx];
    const next = myVideoUrls.filter((_, i) => i !== idx);
    setMyVideoUrls(next);
    saveJson(KEYS.videoUrls, next);
    if (isSupabaseStorageUrl(url)) {
      await deleteGhostVideo(url).catch(() => {});
    }
  };

  const upgradeTier = (_tier: RoomTier) => {
    setShowUpgrade(false);
  };

  const grantRequest = (ghostId: string) => {
    const next = requests.map((r) => r.ghostId === ghostId ? { ...r, status: "granted" as const } : r);
    setRequests(next);
    saveJson(KEYS.requests, next);
    const nextGranted = [...new Set([...granted, ghostId])];
    setGranted(nextGranted);
    saveJson(KEYS.granted, nextGranted);
    // In production: push room code to their accessed_rooms via server
    // For local demo: store in a shared key they can read
    try {
      const sharedKey = `ghost_room_grant_${ghostId}`;
      localStorage.setItem(sharedKey, JSON.stringify({
        ghostId: myGhostId, roomCode, grantedAt: Date.now(),
        images: myImages, videoUrls: myVideoUrls,
      }));
    } catch {}
  };

  const denyRequest = (ghostId: string) => {
    const next = requests.map((r) => r.ghostId === ghostId ? { ...r, status: "denied" as const } : r);
    setRequests(next);
    saveJson(KEYS.requests, next);
  };

  const revokeAccess = (ghostId: string) => {
    const next = granted.filter((g) => g !== ghostId);
    setGranted(next);
    saveJson(KEYS.granted, next);
    const nextReqs = requests.map((r) => r.ghostId === ghostId ? { ...r, status: "denied" as const } : r);
    setRequests(nextReqs);
    saveJson(KEYS.requests, nextReqs);
    try { localStorage.removeItem(`ghost_room_grant_${ghostId}`); } catch {}
  };

  const handleEnterRoom = () => {
    const val = enterInput.trim().toUpperCase();
    setEnterError("");
    setEnterSuccess("");

    if (!val) { setEnterError("Enter a room code or Guest ID"); return; }

    // If it's a Guest-XXXX ID → send access request
    if (val.startsWith("GHOST-")) {
      const normalized = val.replace("GHOST-", "Guest-");
      if (normalized === myGhostId) { setEnterError("That's your own Guest ID"); return; }
      if (requestSent.includes(normalized)) { setEnterError("Request already sent"); return; }

      // Write request into that user's request list (shared localStorage key)
      try {
        const reqKey = `ghost_room_requests_for_${normalized}`;
        const existing: RoomRequest[] = loadJson(reqKey, []);
        if (!existing.find((r) => r.ghostId === myGhostId)) {
          existing.push({ ghostId: myGhostId, name: myGhostId, requestedAt: Date.now(), status: "pending" });
          saveJson(reqKey, existing);
        }
      } catch {}

      setRequestSent((p) => [...p, normalized]);
      setEnterSuccess(`Access request sent to ${normalized}`);
      setEnterInput("");
      return;
    }

    // Check new typed share code system
    try {
      const shareData = loadJson<{ ownerGhostId: string; accessType: ShareAccessType; images: string[]; videoUrls: string[]; createdAt: number } | null>(`ghost_room_share_${val}`, null);
      if (shareData && shareData.ownerGhostId && shareData.ownerGhostId !== myGhostId) {
        const already = accessedRooms.find(r => r.ghostId === shareData.ownerGhostId && r.accessType === shareData.accessType);
        if (!already) {
          const newRoom: AccessedRoom = {
            ghostId: shareData.ownerGhostId,
            roomCode: val,
            accessType: shareData.accessType,
            grantedAt: Date.now(),
            images: shareData.images || [],
            videoUrls: shareData.videoUrls || [],
          };
          const next = [...accessedRooms, newRoom];
          setAccessedRooms(next);
          saveJson(KEYS.accessed, next);
        }
        const label = shareData.accessType === "image" ? "Image Room" : shareData.accessType === "video" ? "Video Room" : "Full Room";
        setEnterSuccess(`✓ ${label} access granted from ${shareData.ownerGhostId}`);
        setEnterInput("");
        return;
      }
    } catch {}

    // Legacy grant fallback
    try {
      const grantKey = `ghost_room_grant_${myGhostId}`;
      const grant = loadJson<{ ghostId: string; roomCode: string; grantedAt: number; images: string[]; videoUrl?: string; videoUrls?: string[] } | null>(grantKey, null);
      if (grant && grant.roomCode === val) {
        const already = accessedRooms.find((r) => r.ghostId === grant.ghostId);
        if (!already) {
          const newRoom: AccessedRoom = {
            ghostId: grant.ghostId,
            roomCode: val,
            accessType: "both",
            grantedAt: grant.grantedAt || Date.now(),
            images: grant.images || [],
            videoUrls: grant.videoUrls || (grant.videoUrl ? [grant.videoUrl] : []),
          };
          const next = [...accessedRooms, newRoom];
          setAccessedRooms(next);
          saveJson(KEYS.accessed, next);
        }
        setEnterSuccess(`✓ Full Room access granted from ${grant.ghostId}`);
        setEnterInput("");
        return;
      }
    } catch {}

    setEnterError("Code not found — check the code and try again");
  };

  const saveExpiry = (v: "24h" | "7d" | "never") => {
    setExpiry(v);
    try { localStorage.setItem(KEYS.expiry, v); } catch {}
  };

  const deactivateAccount = () => {
    // Wipe everything
    Object.values(KEYS).forEach((k) => { try { localStorage.removeItem(k); } catch {} });
    ["ghost_profile","ghost_gender","ghost_mode_until","ghost_matches","ghost_passed_ids",
      "ghost_tonight_until","ghost_boost_until","ghost_flash_until","ghost_flash_contacts_used",
      "ghost_house_tier","ghost_interest","ghost_room_code"].forEach((k) => {
      try { localStorage.removeItem(k); } catch {};
    });
    // Remove any grants we issued
    granted.forEach((gId) => {
      try { localStorage.removeItem(`ghost_room_grant_${gId}`); } catch {}
    });
    navigate("/ghost/auth", { replace: true });
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const S = {
    page: { height: "100dvh", overflow: "hidden", backgroundImage: `url(${ROOM_BG})`, backgroundSize: "cover", backgroundPosition: "center top", color: "#fff", display: "flex", flexDirection: "column" as const, position: "relative" as const },
    header: {
      position: "sticky" as const, top: 0, zIndex: 50,
      background: "rgba(5,5,8,0.96)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px",
      paddingTop: `max(12px, env(safe-area-inset-top, 12px))`,
      display: "flex", alignItems: "center", gap: 12,
    },
    card: {
      background: "rgba(6,6,10,0.72)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 16, padding: "14px 16px", marginBottom: 12,
    },
    label: { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 6, display: "block" },
    greenCard: {
      background: "rgba(6,6,10,0.72)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
      border: `1px solid ${tierInfo.borderRgba}`,
      borderRadius: 16, padding: "14px 16px", marginBottom: 12, position: "relative" as const,
    },
    input: {
      width: "100%", height: 46, borderRadius: 12,
      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
      color: "#fff", fontSize: 15, padding: "0 14px", outline: "none", boxSizing: "border-box" as const,
    },
  };

  const pending = requests.filter((r) => r.status === "pending");
  const grantedReqs = requests.filter((r) => r.status === "granted");

  // Free tier — all users get in without a subscription gate

  return (
    <div translate="no" style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(0.7)}}.ghost-no-save img{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;pointer-events:none}.ghost-no-save{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}`}</style>
      {showRoomWelcome && <RoomWelcomePopup onClose={() => setShowRoomWelcome(false)} />}

      {/* ── PIN Setup prompt (shown once after first login if no PIN) ── */}
      <AnimatePresence>
        {showPinSetup && (
          <motion.div key="pin-setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
              style={{ width: "100%", maxWidth: 480, background: "rgba(6,4,4,0.97)", border: "1px solid rgba(220,20,20,0.25)", borderTop: "3px solid rgba(220,20,20,0.8)", borderRadius: "22px 22px 0 0", padding: "24px 24px max(28px,env(safe-area-inset-bottom,28px))" }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>Set a Quick PIN</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>A 4-digit PIN lets you re-enter the vault faster. Skip if you prefer password only.</p>
              {pinSetupStep === "enter" ? (
                <>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "0 0 10px", fontWeight: 700 }}>Enter a 4-digit PIN</p>
                  <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 20 }}>
                    {[0,1,2,3].map(i => (
                      <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: i < pinSetupVal.length ? "#e01010" : "rgba(255,255,255,0.15)", border: `2px solid ${i < pinSetupVal.length ? "#e01010" : "rgba(255,255,255,0.2)"}` }} />
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
                      <motion.button key={i} whileTap={{ scale: 0.88 }}
                        onClick={() => {
                          if (d === "⌫") { setPinSetupVal(p => p.slice(0,-1)); setPinSetupError(""); }
                          else if (d) {
                            const next = pinSetupVal + d;
                            setPinSetupVal(next);
                            if (next.length === 4) { setPinSetupStep("confirm"); setPinSetupError(""); }
                          }
                        }}
                        disabled={!d}
                        style={{ height: 52, borderRadius: 12, background: d ? "rgba(255,255,255,0.06)" : "transparent", border: d ? "1px solid rgba(255,255,255,0.09)" : "none", color: "#fff", fontSize: d === "⌫" ? 18 : 20, fontWeight: 700, cursor: d ? "pointer" : "default", opacity: d ? 1 : 0 }}>
                        {d}
                      </motion.button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "0 0 10px", fontWeight: 700 }}>Confirm your PIN</p>
                  <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 20 }}>
                    {[0,1,2,3].map(i => (
                      <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: i < pinSetupConfirm.length ? "#e01010" : "rgba(255,255,255,0.15)", border: `2px solid ${i < pinSetupConfirm.length ? "#e01010" : "rgba(255,255,255,0.2)"}` }} />
                    ))}
                  </div>
                  {pinSetupError && <p style={{ fontSize: 12, color: "#f87171", textAlign: "center", margin: "0 0 12px", fontWeight: 700 }}>{pinSetupError}</p>}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
                      <motion.button key={i} whileTap={{ scale: 0.88 }}
                        onClick={() => {
                          if (d === "⌫") { setPinSetupConfirm(p => p.slice(0,-1)); setPinSetupError(""); }
                          else if (d) {
                            const next = pinSetupConfirm + d;
                            setPinSetupConfirm(next);
                            if (next.length === 4) {
                              if (next === pinSetupVal) {
                                localStorage.setItem("ghost_vault_pin", next);
                                setShowPinSetup(false); setPinSetupVal(""); setPinSetupConfirm(""); setPinSetupStep("enter");
                              } else {
                                setPinSetupError("PINs don't match — try again"); setPinSetupConfirm(""); setPinSetupStep("enter"); setPinSetupVal("");
                              }
                            }
                          }
                        }}
                        disabled={!d}
                        style={{ height: 52, borderRadius: 12, background: d ? "rgba(255,255,255,0.06)" : "transparent", border: d ? "1px solid rgba(255,255,255,0.09)" : "none", color: "#fff", fontSize: d === "⌫" ? 18 : 20, fontWeight: 700, cursor: d ? "pointer" : "default", opacity: d ? 1 : 0 }}>
                        {d}
                      </motion.button>
                    ))}
                  </div>
                </>
              )}
              <button onClick={() => setShowPinSetup(false)}
                style={{ width: "100%", marginTop: 14, background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 12, cursor: "pointer", padding: "4px 0" }}>
                Skip — use password only
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full-screen image viewer ── */}
      <AnimatePresence>
        {viewingImage && (
          <motion.div key="img-viewer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 600, background: "#000", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "max(16px,env(safe-area-inset-top,16px)) 16px 12px", display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(to bottom,rgba(0,0,0,0.85),transparent)", zIndex: 2 }}>
              <button onClick={() => setViewingImage(null)} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
                <ArrowLeft size={16} />
              </button>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Image</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginLeft: "auto" }}>🔒 Private</span>
            </div>
            <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={viewingImage} alt="" draggable="false" className="ghost-no-save" style={{ width: "100%", height: "100%", objectFit: "contain" }} onContextMenu={e => e.preventDefault()} />
              {/* Watermark — deters screenshot misuse */}
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", pointerEvents: "none", paddingBottom: 12 }}>
                <div style={{ background: "rgba(0,0,0,0.35)", borderRadius: 8, padding: "4px 12px" }}>
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.08em", userSelect: "none" }}>🔒 {myGhostId} · Room Vault · Private</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full-screen video viewer ── */}
      <AnimatePresence>
        {viewingVideo && (
          <motion.div key="vid-viewer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 600, background: "#000", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "max(16px,env(safe-area-inset-top,16px)) 16px 12px", display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(to bottom,rgba(0,0,0,0.85),transparent)", zIndex: 2 }}>
              <button onClick={() => setViewingVideo(null)} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
                <ArrowLeft size={16} />
              </button>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Video</span>
              <span style={{ fontSize: 10, color: "rgba(168,85,247,0.8)", marginLeft: "auto", fontWeight: 700 }}>🔒 Not saved to device</span>
            </div>
            <video src={viewingVideo} controls autoPlay controlsList="nodownload nofullscreen" disablePictureInPicture
              style={{ flex: 1, width: "100%", objectFit: "contain" }} onContextMenu={e => e.preventDefault()} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Side Drawer ── */}
      <AnimatePresence>
        {showSideDrawer && (
          <>
            {/* Backdrop */}
            <motion.div key="drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSideDrawer(false)}
              style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }} />

            {/* Drawer panel — slides from right, home menu only */}
            <motion.div key="drawer-panel"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "85vw", maxWidth: 360, zIndex: 501, background: "rgba(6,6,10,0.97)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.06)", borderTop: "3px solid rgba(220,20,20,0.85)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

              <div style={{ padding: "max(20px,env(safe-area-inset-top,20px)) 18px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <button onClick={() => setShowSideDrawer(false)}
                  style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)", flexShrink: 0 }}>
                  <X size={14} />
                </button>
                <span style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>Vault</span>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px max(24px,env(safe-area-inset-bottom,24px))" }}>
                {([
                  { page: "files"    as const, icon: "📁", label: "Files",         sub: `${fileFolders.length} folder${fileFolders.length !== 1 ? "s" : ""}` },
                  { page: "chat"     as const, icon: "🔐", label: "Secret Messages", sub: "Disappearing · private" },
                  { page: "voice"    as const, icon: "🎙️", label: "Voice Notes",   sub: `${voiceNotes.length} recorded` },
                  { page: "image"    as const, icon: "🖼️", label: "Images",        sub: `${myImages.length} saved` },
                  { page: "video"    as const, icon: "🎬", label: "Videos",        sub: `${myVideoUrls.length} saved` },
                  { page: "shared"   as const, icon: "🔗", label: "Shared Vault",  sub: `${sharedItems.length} shared` },
                  { page: "memories" as const, icon: "📖", label: "Memories",      sub: `${memories.length} notes` },
                  { page: "profile"  as const, icon: "🪪", label: "Private Bio",   sub: privateBio.realName || "Set up profile" },
                  { page: "activity" as const, icon: "📋", label: "Activity Log",  sub: activityLog.length > 0 ? `Last: ${new Date(activityLog[0]?.at ?? 0).toLocaleDateString()}` : "No activity yet" },
                  { page: "code"     as const, icon: "🔑", label: "Vault Code",    sub: "Share access" },
                  { page: "share"    as const, icon: "📤", label: "Share Room",    sub: "Send links" },
                  { page: "ghosts"   as const, icon: "👥", label: "My Contacts",   sub: `${matches.length} contacts` },
                  { page: "pricing"  as const, icon: "💰", label: "Vault Pricing",  sub: "Feature costs & free limits" },
                ] as const).map(({ page, icon, label, sub }) => (
                  <motion.button key={page} whileTap={{ scale: 0.97 }}
                    onClick={() => { setShowSideDrawer(false); setVaultPage(page); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "rgba(10,6,6,0.82)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.07)", borderTop: "1px solid rgba(220,20,20,0.35)", borderRadius: 14, cursor: "pointer", marginBottom: 10, textAlign: "left", boxShadow: "inset 0 1px 0 rgba(220,20,20,0.18)" }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#fff" }}>{label}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{sub}</p>
                    </div>
                    <span style={{ fontSize: 16, color: "rgba(255,255,255,0.2)" }}>›</span>
                  </motion.button>
                ))}
                {/* PIN management */}
                <div style={{ marginTop: 6, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => { setShowSideDrawer(false); setShowPinSetup(true); setPinSetupVal(""); setPinSetupConfirm(""); setPinSetupStep("enter"); setPinSetupError(""); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "rgba(220,20,20,0.06)", border: "1px solid rgba(220,20,20,0.2)", borderRadius: 12, cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontSize: 18 }}>🔐</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{localStorage.getItem("ghost_vault_pin") ? "Change PIN" : "Set Quick PIN"}</p>
                      <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{localStorage.getItem("ghost_vault_pin") ? "Update your 4-digit PIN" : "Faster re-entry with PIN"}</p>
                    </div>
                  </motion.button>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Vault full-screen pages ── */}
      <AnimatePresence>
        {vaultPage !== null && (
          <GhostRoomVaultPages
            vaultPage={vaultPage}
            setVaultPage={setVaultPage}
            chatContact={chatContact}
            setChatContact={setChatContact}
            openImageFolder={openImageFolder}
            setOpenImageFolder={setOpenImageFolder}
            openFileFolder={openFileFolder}
            setOpenFileFolder={setOpenFileFolder}
            setSendingImage={setSendingImage}
            setSendToCode={setSendToCode}
            setSendResult={setSendResult}
            showNewFolderInput={showNewFolderInput}
            setShowNewFolderInput={setShowNewFolderInput}
            newFolderName={newFolderName}
            setNewFolderName={setNewFolderName}
            handleCreateImageFolder={handleCreateImageFolder}
            imgRef={imgRef}
            handleImageUploadToFolder={handleImageUploadToFolder}
            imageFolders={imageFolders}
            saveImageFolders={saveImageFolders}
            setViewingImage={setViewingImage}
            vidRef={vidRef}
            handleVideoUpload={handleVideoUpload}
            videoFolders={videoFolders}
            saveVideoFolders={saveVideoFolders}
            activeVideoFolder={activeVideoFolder}
            setActiveVideoFolder={setActiveVideoFolder}
            vidUploading={vidUploading}
            vidProgress={vidProgress}
            myVideoUrls={myVideoUrls}
            setViewingVideo={setViewingVideo}
            removeVideoUrl={removeVideoUrl}
            roomCode={roomCode}
            codeCopied={codeCopied}
            setCodeCopied={setCodeCopied}
            showResetConfirm={showResetConfirm}
            setShowResetConfirm={setShowResetConfirm}
            resetCode={resetCode}
            myImages={myImages}
            imgShareCode={imgShareCode}
            vidShareCode={vidShareCode}
            bothShareCode={bothShareCode}
            setImgShareCode={setImgShareCode}
            setVidShareCode={setVidShareCode}
            setBothShareCode={setBothShareCode}
            copiedShare={copiedShare}
            setCopiedShare={setCopiedShare}
            myGhostId={myGhostId}
            accessedRooms={accessedRooms}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            chatMediaExpiry={chatMediaExpiry}
            setChatMediaExpiry={setChatMediaExpiry}
            refreshCoins={refreshCoins}
            voiceNotes={voiceNotes}
            setVoiceNotes={setVoiceNotes}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            recordingTime={recordingTime}
            setRecordingTime={setRecordingTime}
            mediaRecorderRef={mediaRecorderRef}
            audioChunksRef={audioChunksRef}
            recordTimerRef={recordTimerRef}
            activityLog={activityLog}
            setActivityLog={setActivityLog}
            sharedImgRef={sharedImgRef}
            sharedItems={sharedItems}
            setSharedItems={setSharedItems}
            privateBio={privateBio}
            editingBio={editingBio}
            setEditingBio={setEditingBio}
            bioEdits={bioEdits}
            setBioEdits={setBioEdits}
            setPrivateBio={setPrivateBio}
            memories={memories}
            setMemories={setMemories}
            newMemoryOpen={newMemoryOpen}
            setNewMemoryOpen={setNewMemoryOpen}
            memDraft={memDraft}
            setMemDraft={setMemDraft}
            showNewFileFolderInput={showNewFileFolderInput}
            setShowNewFileFolderInput={setShowNewFileFolderInput}
            newFileFolderName={newFileFolderName}
            setNewFileFolderName={setNewFileFolderName}
            handleCreateFileFolder={handleCreateFileFolder}
            fileRef={fileRef}
            handleFileUploadToFolder={handleFileUploadToFolder}
            fileFolders={fileFolders}
            saveFileFolders={saveFileFolders}
            ALLOWED_FILE_TYPES={ALLOWED_FILE_TYPES}
            FILE_ICONS={FILE_ICONS}
            fmtSize={fmtSize}
            coinBalance={coinBalance}
          />
        )}
      </AnimatePresence>

      {/* ── Send image modal ── */}
      <AnimatePresence>
        {sendingImage && (
          <motion.div key="send-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
              style={{ width: "100%", maxWidth: 480, background: "#08080e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "22px 22px 0 0", padding: "20px 20px max(28px,env(safe-area-inset-bottom,28px))" }}>
              <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>Send Image</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 16px" }}>Enter the vault code of the person to send to</p>
              <img src={sendingImage} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 12, marginBottom: 14 }} />
              <input value={sendToCode} onChange={e => { setSendToCode(e.target.value.toUpperCase()); setSendResult(null); }}
                placeholder="VAULT CODE"
                style={{ width: "100%", height: 48, borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 16, padding: "0 14px", outline: "none", marginBottom: 10, boxSizing: "border-box", letterSpacing: "0.1em", fontWeight: 800 }} />
              {sendResult === "ok" && <p style={{ fontSize: 12, color: "#4ade80", margin: "0 0 8px", fontWeight: 700 }}>✓ Sent successfully</p>}
              {sendResult === "err" && <p style={{ fontSize: 12, color: "#f87171", margin: "0 0 8px", fontWeight: 700 }}>✕ Code not found — check and try again</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setSendingImage(null); setSendToCode(""); setSendResult(null); }}
                  style={{ flex: 1, height: 46, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => {
                  if (!sendToCode.trim()) return;
                  try {
                    const item = { id: Date.now().toString(), type: "image" as const, content: sendingImage!, senderGhostId: myGhostId, sentAt: Date.now(), status: "pending" as const };
                    const recipientInbox = loadInbox(sendToCode);
                    recipientInbox.push(item);
                    saveInbox(sendToCode, recipientInbox);
                    dbSendInboxItem(item, sendToCode);
                    setSendResult("ok");
                    setTimeout(() => { setSendingImage(null); setSendToCode(""); setSendResult(null); }, 1500);
                  } catch { setSendResult("err"); }
                }}
                  style={{ flex: 1, height: 46, borderRadius: 12, background: a.gradient, border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                  Send
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ ...S.header, position: "relative", zIndex: 1 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <h1 style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: 0 }}>Room Vault</h1>
            <span style={{ fontSize: 10, background: a.glow(0.15), border: `1px solid ${a.glow(0.3)}`, borderRadius: 6, padding: "1px 6px", color: a.glow(0.9), fontWeight: 800 }}>PRIVATE</span>
          </div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>{myGhostId} · code-gated vault</p>
        </div>
        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Coin balance chip */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.32)", borderRadius: 20, padding: "4px 10px" }}>
            <span style={{ fontSize: 12, lineHeight: 1 }}>🪙</span>
            <span style={{ fontSize: 12, fontWeight: 900, color: "#d4af37", letterSpacing: "0.02em", fontVariantNumeric: "tabular-nums" }}>{coinBalance.toLocaleString()}</span>
          </div>
          {pending.length > 0 && (
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>
              {pending.length}
            </div>
          )}
          <button
            onClick={() => setShowSideDrawer(true)}
            title="Vault Settings"
            style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}
          >
            <Settings size={15} />
          </button>
          {/* Log out — clears session and returns to home */}
          <button
            onClick={() => { clearSession(); navigate("/ghost/mode"); }}
            title="Lock Vault"
            style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#f87171" }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,8,0.9)", position: "relative", zIndex: 1 }}>
        {([
          { key: "my",      label: "My Room",  icon: Lock },
          { key: "enter",   label: "Enter",    icon: Unlock },
          { key: "inbox",   label: "Inbox",    icon: MessageCircle },
          { key: "matches", label: "Matches",  icon: Users },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, height: 44, border: "none", cursor: "pointer",
              background: "none",
              borderBottom: tab === key ? `2px solid ${a.glow(0.9)}` : "2px solid transparent",
              color: tab === key ? a.glow(0.95) : "rgba(255,255,255,0.35)",
              fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              position: "relative",
            }}
          >
            <Icon size={12} />
            {label}
            {key === "my" && pending.length > 0 && (
              <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#ef4444", fontSize: 8, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", top: 6, right: "18%" }}>
                {pending.length}
              </span>
            )}
            {key === "inbox" && pendingInbox.length > 0 && (
              <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#ef4444", fontSize: 8, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", top: 6, right: "18%" }}>
                {pendingInbox.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px max(20px, env(safe-area-inset-bottom, 20px))", position: "relative", zIndex: 1 }}>

        {/* ── MY ROOM TAB ── */}
        {tab === "my" && (
          <div>
            {/* Room code block */}
            <div style={S.greenCard}>
              <p style={S.label}>Your Room Vault Code</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  flex: 1, height: 52, borderRadius: 12,
                  background: a.glow(0.08), border: `1px solid ${a.glow(0.3)}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: a.glow(0.95), letterSpacing: "0.2em", fontVariantNumeric: "tabular-nums" }}>
                    {roomCode}
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={copyCode}
                  style={{ width: 44, height: 52, borderRadius: 12, border: `1px solid ${a.glow(0.3)}`, background: a.glow(0.1), color: a.glow(0.9), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {codeCopied ? <Check size={16} /> : <Copy size={16} />}
                </motion.button>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 10px" }}>
                Share this code only with people you trust. Anyone with this code can view your room.
              </p>
              {/* Share vault link button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const link = `${window.location.origin}/ghost/room?code=${roomCode}`;
                  navigator.clipboard.writeText(link).catch(() => {});
                  setCodeCopied(true);
                  setTimeout(() => setCodeCopied(false), 2000);
                }}
                style={{ display: "flex", alignItems: "center", gap: 7, background: a.glow(0.1), border: `1px solid ${a.glow(0.25)}`, borderRadius: 10, padding: "7px 12px", color: a.glow(0.9), fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: 10 }}
              >
                <Link size={12} />
                {codeCopied ? "Link copied!" : "Copy Vault Link — share with your match"}
              </motion.button>
              {/* Reset code */}
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "7px 12px", color: "rgba(239,68,68,0.8)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  <RefreshCw size={12} />
                  Reset Code — revokes all access
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={resetCode} style={{ flex: 1, height: 36, borderRadius: 10, border: "none", background: "rgba(239,68,68,0.2)", color: "#f87171", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                    Yes, reset &amp; revoke all
                  </button>
                  <button onClick={() => setShowResetConfirm(false)} style={{ flex: 1, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div style={{ ...S.card, padding: "12px 16px" }}>
              <p style={{ ...S.label, marginBottom: 10 }}>Vault Overview</p>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { icon: "🖼️", count: myImages.length, label: "Images", limit: imageLimit, onTap: () => setVaultPage("image") },
                  { icon: "🎬", count: myVideoUrls.length, label: "Videos", limit: videoLimit, onTap: () => setVaultPage("video") },
                  { icon: "👥", count: matches.length, label: "Contacts", limit: null, onTap: () => setVaultPage("ghosts") },
                ].map(({ icon, count, label, limit, onTap }) => (
                  <motion.button key={label} whileTap={{ scale: 0.95 }} onClick={onTap}
                    style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 8px", cursor: "pointer", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 18 }}>{icon}</p>
                    <p style={{ margin: "4px 0 2px", fontSize: 16, fontWeight: 900, color: "#fff" }}>{count}</p>
                    <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>
                      {label}{limit !== null ? ` · ${limit} max` : ""}
                    </p>
                  </motion.button>
                ))}
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowSideDrawer(true)}
                style={{ width: "100%", marginTop: 10, height: 38, borderRadius: 10, background: a.glow(0.08), border: `1px solid ${a.glow(0.2)}`, color: a.glow(0.9), fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                Open Vault →
              </motion.button>
            </div>

            {/* Access requests */}
            <div style={S.card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>Access Requests</p>
                {pending.length > 0 && (
                  <span style={{ background: "#ef4444", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 800, color: "#fff" }}>
                    {pending.length} pending
                  </span>
                )}
              </div>

              {requests.length === 0 && (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0, textAlign: "center", padding: "10px 0" }}>
                  No requests yet — share your Guest ID so others can request access
                </p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {requests.map((req) => (
                  <div
                    key={req.ghostId}
                    style={{
                      background: req.status === "pending" ? a.glow(0.04) : "rgba(255,255,255,0.02)",
                      border: `1px solid ${req.status === "pending" ? a.glow(0.2) : req.status === "granted" ? a.glow(0.15) : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 12, padding: "10px 12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>{req.ghostId}</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                          Requested {fmtAgo(req.requestedAt)} ·{" "}
                          <span style={{ color: req.status === "granted" ? a.glow(0.8) : req.status === "denied" ? "#f87171" : "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                            {req.status}
                          </span>
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {req.status === "pending" && (
                          <>
                            <button
                              onClick={() => grantRequest(req.ghostId)}
                              style={{ height: 30, borderRadius: 8, padding: "0 10px", border: "none", background: a.glow(0.2), color: a.glow(0.95), fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                            >
                              Grant
                            </button>
                            <button
                              onClick={() => denyRequest(req.ghostId)}
                              style={{ height: 30, borderRadius: 8, padding: "0 10px", border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "rgba(255,255,255,0.35)", fontSize: 11, cursor: "pointer" }}
                            >
                              Deny
                            </button>
                          </>
                        )}
                        {req.status === "granted" && (
                          <button
                            onClick={() => revokeAccess(req.ghostId)}
                            style={{ height: 30, borderRadius: 8, padding: "0 10px", border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                          >
                            <ShieldOff size={10} />
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Who I've granted */}
              {grantedReqs.length > 0 && (
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "10px 0 0" }}>
                  {grantedReqs.length} {grantedReqs.length === 1 ? "person has" : "people have"} access to your room
                </p>
              )}
            </div>

          </div>
        )}

        {/* ── ENTER ROOM TAB ── */}
        {tab === "enter" && (
          <div>
            <div style={S.greenCard}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>Enter a Room Vault</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 14px" }}>
                Paste a 6-character room code to view their private room — or enter someone's Guest ID (Guest-XXXX) to request access.
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  style={S.input}
                  placeholder="ROOM CODE or Guest-XXXX"
                  value={enterInput}
                  onChange={(e) => { setEnterInput(e.target.value.toUpperCase()); setEnterError(""); setEnterSuccess(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleEnterRoom(); }}
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEnterRoom}
                  style={{ height: 46, borderRadius: 12, padding: "0 18px", border: "none", background: `linear-gradient(135deg, ${a.accentDark}, ${a.accentMid})`, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
                >
                  Enter
                </motion.button>
              </div>
              {enterError && (
                <p style={{ fontSize: 11, color: "#f87171", margin: 0, fontWeight: 700 }}>✕ {enterError}</p>
              )}
              {enterSuccess && (
                <p style={{ fontSize: 11, color: a.glow(0.9), margin: 0, fontWeight: 700 }}>✓ {enterSuccess}</p>
              )}
            </div>

            {/* My Guest ID (to share so others can request) */}
            <div style={S.card}>
              <p style={S.label}>Your Guest ID — share this so others can request your room</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 44, borderRadius: 10, background: a.glow(0.06), border: `1px solid ${a.glow(0.2)}`, display: "flex", alignItems: "center", paddingLeft: 14 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: a.glow(0.9) }}>{myGhostId}</span>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(myGhostId).catch(() => {}); }}
                  style={{ width: 44, height: 44, borderRadius: 10, border: `1px solid ${a.glow(0.2)}`, background: a.glow(0.08), color: a.glow(0.8), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            {/* Rooms I've been granted access to */}
            {accessedRooms.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "16px 0 8px" }}>
                  Rooms You Have Access To
                </p>
                {accessedRooms.map((room) => (
                  <div key={room.ghostId} style={S.card}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 800, color: a.glow(0.9), margin: 0 }}>{room.ghostId}'s Room</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>Granted {fmtAgo(room.grantedAt)}</p>
                      </div>
                    </div>

                    {/* Their images */}
                    {room.images.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                        {room.images.map((src, i) => (
                          <img key={i} src={src} alt="" style={{ width: 72, height: 72, borderRadius: 8, objectFit: "cover", border: `1px solid ${a.glow(0.2)}` }} />
                        ))}
                      </div>
                    )}

                    {/* Their videos */}
                    {room.videoUrls && room.videoUrls.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {room.videoUrls.map((url, vi) => (
                          <div key={vi} style={{ borderRadius: 10, overflow: "hidden", background: "rgba(0,0,0,0.4)" }}>
                            <video src={url} controls style={{ width: "100%", maxHeight: 180, display: "block" }} />
                          </div>
                        ))}
                      </div>
                    )}

                    {room.images.length === 0 && (!room.videoUrls || room.videoUrls.length === 0) && (
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>This room has no content yet</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pending requests I sent */}
            {requestSent.length > 0 && (
              <div style={S.card}>
                <p style={S.label}>Requests Sent</p>
                {requestSent.map((id) => (
                  <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>{id}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Waiting...</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── INBOX TAB ── */}
        {tab === "inbox" && (
          <div>
            <div style={{ ...S.card, marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.6 }}>
                When another Room Vault holder sends you an image or video, it appears here. Accept to save it to your room — decline to remove it permanently.
              </p>
            </div>

            {inbox.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <span style={{ fontSize: 40 }}>📭</span>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", marginTop: 12 }}>No media received yet</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>When someone sends you content, it will appear here</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {inbox.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: item.status === "pending" ? a.glow(0.04) : "rgba(255,255,255,0.02)",
                    border: `1px solid ${item.status === "pending" ? a.glow(0.2) : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 16, overflow: "hidden",
                  }}
                >
                  {/* Header */}
                  <div style={{ padding: "12px 14px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{item.type === "image" ? "🖼️" : item.type === "video" ? "🎬" : "💬"}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: item.status === "pending" ? a.glow(0.9) : "rgba(255,255,255,0.5)", margin: 0 }}>
                          From {item.senderGhostId}
                        </p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                          {fmtAgo(item.sentAt)} ·{" "}
                          <span style={{
                            fontWeight: 700,
                            color: item.status === "pending" ? "rgba(255,165,0,0.9)" : item.status === "accepted" ? a.glow(0.8) : "#f87171",
                          }}>
                            {item.status}
                          </span>
                        </p>
                      </div>
                    </div>
                    {item.status === "accepted" && (() => {
                      const daysLeft = getItemDaysLeft(item, roomTier);
                      if (daysLeft === null) {
                        // Gold — permanent
                        return (
                          <span style={{ fontSize: 9, background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 5, padding: "2px 7px", color: "#d4af37", fontWeight: 800 }}>
                            🔑 Permanent
                          </span>
                        );
                      }
                      const urgent = daysLeft <= 3;
                      const warning = daysLeft <= 8;
                      return (
                        <span style={{
                          fontSize: 9, borderRadius: 5, padding: "2px 7px", fontWeight: 800,
                          background: urgent ? "rgba(239,68,68,0.15)" : warning ? "rgba(251,191,36,0.12)" : a.glow(0.12),
                          border: `1px solid ${urgent ? "rgba(239,68,68,0.4)" : warning ? "rgba(251,191,36,0.3)" : a.glow(0.25)}`,
                          color: urgent ? "#f87171" : warning ? "#fbbf24" : a.glow(0.85),
                        }}>
                          {urgent ? `🔴 ${daysLeft}d left` : warning ? `⏳ ${daysLeft}d left` : `✅ ${daysLeft}d left`}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Preview */}
                  <div style={{ margin: "0 14px 12px", borderRadius: 10, overflow: "hidden", background: "rgba(0,0,0,0.4)" }}>
                    {item.type === "note" ? (
                      <div style={{ padding: "14px 16px" }}>
                        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>
                          {item.content}
                        </p>
                      </div>
                    ) : item.type === "image" ? (
                      <img
                        src={item.content} alt=""
                        style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <video src={item.content} controls style={{ width: "100%", maxHeight: 200, display: "block" }} />
                    )}
                  </div>
                  {/* Caption / memory note attached to media */}
                  {item.note && item.type !== "note" && (
                    <div style={{ margin: "-4px 14px 12px", padding: "8px 12px", borderRadius: 8, background: a.glow(0.06), border: `1px solid ${a.glow(0.15)}` }}>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                        "{item.note}"
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {item.status === "pending" && (
                    <div style={{ display: "flex", gap: 8, padding: "0 14px 14px" }}>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => acceptItem(item.id)}
                        style={{ flex: 1, height: 40, borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${a.accentDark}, ${a.accentMid})`, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                      >
                        <Check size={14} /> Accept & Save to Room
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => declineItem(item.id)}
                        style={{ width: 72, height: 40, borderRadius: 10, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        Decline
                      </motion.button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MATCHES TAB ── */}
        {tab === "matches" && (
          <div>
            <div style={{ ...S.card, marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                All your active matches — connections expire after 48h if WhatsApp isn't opened. Tap to open WhatsApp or grant Room Vault access.
              </p>
            </div>

            {matches.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <p style={{ fontSize: 44, margin: "0 0 12px" }}>👻</p>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", margin: 0 }}>No active matches yet</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Go back to the feed and start liking</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {matches.map((m) => {
                const { profile } = m;
                const ghostId = (() => {
                  let h = 0;
                  for (let i = 0; i < profile.id.length; i++) { h = Math.imul(31, h) + profile.id.charCodeAt(i) | 0; }
                  return `Guest-${1000 + Math.abs(h) % 9000}`;
                })();
                const isGranted = granted.includes(ghostId);
                const timeLeft = Math.max(0, m.matchedAt + 48 * 60 * 60 * 1000 - Date.now());
                const hoursLeft = Math.floor(timeLeft / 3600000);
                const minsLeft = Math.floor((timeLeft % 3600000) / 60000);

                return (
                  <div key={m.id} style={S.card}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <img
                          src={profile.image} alt=""
                          style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: `2px solid ${a.glow(0.3)}` }}
                          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                        />
                        <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 12 }}>{profile.countryFlag}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <p style={{ fontSize: 13, fontWeight: 800, color: a.glow(0.9), margin: 0 }}>{ghostId}</p>
                          {isGranted && (
                            <span style={{ fontSize: 9, background: a.glow(0.15), border: `1px solid ${a.glow(0.3)}`, borderRadius: 4, padding: "1px 5px", color: a.glow(0.8), fontWeight: 700 }}>Room Access</span>
                          )}
                        </div>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "1px 0" }}>
                          {profile.age} · {profile.city}
                        </p>
                        <p style={{ fontSize: 10, color: hoursLeft < 6 ? "#f87171" : "rgba(255,255,255,0.25)", margin: 0 }}>
                          Expires in {hoursLeft}h {minsLeft}m
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => window.open(`https://wa.me/?text=Hey%20from%202Ghost!`, "_blank")}
                        style={{ flex: 1, height: 36, borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${a.accentDark}, ${a.accentMid})`, color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                      >
                        <span>💬</span> WhatsApp
                      </motion.button>
                      {!isGranted ? (
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => grantRequest(ghostId)}
                          style={{ flex: 1, height: 36, borderRadius: 10, border: `1px solid ${a.glow(0.25)}`, background: a.glow(0.08), color: a.glow(0.9), fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                        >
                          <span>🚪</span> Give Room Access
                        </motion.button>
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => revokeAccess(ghostId)}
                          style={{ flex: 1, height: 36, borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                        >
                          <ShieldOff size={11} /> Revoke
                        </motion.button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
