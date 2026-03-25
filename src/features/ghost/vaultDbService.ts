/**
 * Vault Database Service — Supabase persistence for all vault data.
 * Every function gracefully falls back to localStorage on error so the
 * vault stays functional even if Supabase is unreachable.
 */
import { ghostSupabase } from './ghostSupabase';

// ── Local helpers ──────────────────────────────────────────────────────────
function ls<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Types (mirrors GhostRoomPage internal types) ──────────────────────────
export type VaultImageFolder = { id: string; name: string; images: { url: string; uploadedAt: number }[] };
export type VaultVideoFolder = { id: string; name: string; videoUrls: string[] };
export type VaultFileItem    = { name: string; type: string; size: number; data: string; uploadedAt: number };
export type VaultFileFolder  = { id: string; name: string; files: VaultFileItem[] };
export type VaultChatMessage = { id: string; senderId: string; content: string; type: string; sentAt: number; expiresAt?: number; viewOnce?: boolean; viewed?: boolean };
export type VaultVoiceNote   = { id: string; audioData: string; duration: number; createdAt: number; label?: string };
export type VaultActivity    = { id: string; ghostId: string; action: string; at: number };
export type VaultSharedItem  = { id: string; uploadedBy: string; type: string; url: string; uploadedAt: number; caption?: string };
export type VaultPrivateBio  = { realName: string; phone: string; instagram: string; telegram: string; bio: string };
export type VaultMemory      = { id: string; title: string; content: string; date: string; mood: string; createdAt: number };
export type VaultInboxItem   = { id: string; senderGhostId: string; type: string; content: string; sentAt: number; status: string; acceptedAt?: number; note?: string; expiresAt?: number; viewOnce?: boolean };

// ── Vault Code ─────────────────────────────────────────────────────────────
export async function dbLoadVaultCode(ghostId: string): Promise<string | null> {
  try {
    const { data } = await ghostSupabase.from('vault_codes').select('code').eq('ghost_id', ghostId).maybeSingle();
    return data?.code ?? null;
  } catch { return null; }
}

export async function dbSaveVaultCode(ghostId: string, code: string): Promise<void> {
  lsSet('ghost_room_code', code);
  try {
    await ghostSupabase.from('vault_codes').upsert({ ghost_id: ghostId, code, updated_at: new Date().toISOString() }, { onConflict: 'ghost_id' });
  } catch {}
}

// ── Image Folders ──────────────────────────────────────────────────────────
export async function dbLoadImageFolders(ghostId: string): Promise<VaultImageFolder[]> {
  try {
    const { data: folders } = await ghostSupabase.from('vault_image_folders').select('id,name,created_at').eq('ghost_id', ghostId).order('created_at', { ascending: true });
    if (!folders?.length) return ls('ghost_vault_image_folders', []);
    const { data: images } = await ghostSupabase.from('vault_images').select('id,folder_id,url,uploaded_at').eq('ghost_id', ghostId);
    const result: VaultImageFolder[] = folders.map(f => ({
      id: f.id,
      name: f.name,
      images: (images || []).filter(i => i.folder_id === f.id).map(i => ({ url: i.url, uploadedAt: new Date(i.uploaded_at).getTime() })),
    }));
    lsSet('ghost_vault_image_folders', result);
    return result;
  } catch { return ls('ghost_vault_image_folders', []); }
}

export async function dbCreateImageFolder(ghostId: string, folder: VaultImageFolder): Promise<void> {
  try {
    await ghostSupabase.from('vault_image_folders').insert({ id: folder.id, ghost_id: ghostId, name: folder.name });
  } catch {}
}

export async function dbAddImageToFolder(ghostId: string, folderId: string, url: string): Promise<void> {
  try {
    await ghostSupabase.from('vault_images').insert({ ghost_id: ghostId, folder_id: folderId, url });
  } catch {}
}

export async function dbDeleteImageFromFolder(ghostId: string, folderId: string, url: string): Promise<void> {
  try {
    await ghostSupabase.from('vault_images').delete().eq('folder_id', folderId).eq('url', url);
  } catch {}
}

// ── Video Folders ──────────────────────────────────────────────────────────
export async function dbLoadVideoFolders(ghostId: string): Promise<VaultVideoFolder[]> {
  try {
    const { data: folders } = await ghostSupabase.from('vault_video_folders').select('id,name,created_at').eq('ghost_id', ghostId).order('created_at', { ascending: true });
    if (!folders?.length) return ls('ghost_vault_video_folders', []);
    const { data: videos } = await ghostSupabase.from('vault_videos').select('id,folder_id,url').eq('ghost_id', ghostId);
    const result: VaultVideoFolder[] = folders.map(f => ({
      id: f.id,
      name: f.name,
      videoUrls: (videos || []).filter(v => v.folder_id === f.id).map(v => v.url),
    }));
    lsSet('ghost_vault_video_folders', result);
    return result;
  } catch { return ls('ghost_vault_video_folders', []); }
}

export async function dbCreateVideoFolder(ghostId: string, id: string, name: string): Promise<void> {
  try {
    await ghostSupabase.from('vault_video_folders').insert({ id, ghost_id: ghostId, name });
  } catch {}
}

export async function dbAddVideoToFolder(ghostId: string, folderId: string, url: string): Promise<void> {
  try {
    await ghostSupabase.from('vault_videos').insert({ ghost_id: ghostId, folder_id: folderId, url });
  } catch {}
}

export async function dbDeleteVideoFromFolder(folderId: string, url: string): Promise<void> {
  try {
    await ghostSupabase.from('vault_videos').delete().eq('folder_id', folderId).eq('url', url);
  } catch {}
}

// ── File Folders ───────────────────────────────────────────────────────────
export async function dbLoadFileFolders(ghostId: string): Promise<VaultFileFolder[]> {
  try {
    const { data: folders } = await ghostSupabase.from('vault_file_folders').select('id,name').eq('ghost_id', ghostId).order('created_at', { ascending: true });
    if (!folders?.length) return ls('ghost_vault_file_folders', []);
    const { data: files } = await ghostSupabase.from('vault_files').select('*').eq('ghost_id', ghostId);
    const result: VaultFileFolder[] = folders.map(f => ({
      id: f.id,
      name: f.name,
      files: (files || []).filter(fi => fi.folder_id === f.id).map(fi => ({
        name: fi.file_name,
        type: fi.file_type,
        size: fi.size_bytes,
        data: fi.public_url,   // use public URL instead of base64 for Supabase-backed files
        uploadedAt: new Date(fi.uploaded_at).getTime(),
      })),
    }));
    lsSet('ghost_vault_file_folders', result);
    return result;
  } catch { return ls('ghost_vault_file_folders', []); }
}

export async function dbCreateFileFolder(ghostId: string, id: string, name: string): Promise<void> {
  try {
    await ghostSupabase.from('vault_file_folders').insert({ id, ghost_id: ghostId, name });
  } catch {}
}

export async function dbAddFileToFolder(ghostId: string, folderId: string, file: VaultFileItem, storagePath: string, publicUrl: string): Promise<void> {
  try {
    await ghostSupabase.from('vault_files').insert({
      ghost_id: ghostId, folder_id: folderId,
      file_name: file.name, file_type: file.type,
      size_bytes: file.size, storage_path: storagePath, public_url: publicUrl,
    });
  } catch {}
}

export async function dbDeleteFileFromFolder(folderId: string, fileName: string): Promise<void> {
  try {
    await ghostSupabase.from('vault_files').delete().eq('folder_id', folderId).eq('file_name', fileName);
  } catch {}
}

// ── Chat Messages ──────────────────────────────────────────────────────────
export async function dbLoadChatMessages(ghostId: string): Promise<Record<string, VaultChatMessage[]>> {
  try {
    const { data } = await ghostSupabase
      .from('vault_chat_messages')
      .select('*')
      .or(`sender_ghost_id.eq.${ghostId},recipient_ghost_id.eq.${ghostId}`)
      .order('sent_at', { ascending: true });
    if (!data?.length) return ls('ghost_vault_chats', {});
    const threads: Record<string, VaultChatMessage[]> = {};
    for (const msg of data) {
      const contactId = msg.sender_ghost_id === ghostId ? msg.recipient_ghost_id : msg.sender_ghost_id;
      if (!threads[contactId]) threads[contactId] = [];
      threads[contactId].push({
        id: msg.id, senderId: msg.sender_ghost_id, content: msg.content,
        type: msg.message_type, sentAt: new Date(msg.sent_at).getTime(),
        expiresAt: msg.expires_at ? new Date(msg.expires_at).getTime() : undefined,
        viewOnce: msg.view_once, viewed: msg.viewed,
      });
    }
    lsSet('ghost_vault_chats', threads);
    return threads;
  } catch { return ls('ghost_vault_chats', {}); }
}

export async function dbSendChatMessage(msg: VaultChatMessage, recipientId: string): Promise<void> {
  try {
    await ghostSupabase.from('vault_chat_messages').insert({
      id: msg.id, sender_ghost_id: msg.senderId, recipient_ghost_id: recipientId,
      content: msg.content, message_type: msg.type,
      expires_at: msg.expiresAt ? new Date(msg.expiresAt).toISOString() : null,
      view_once: msg.viewOnce ?? false,
      sent_at: new Date(msg.sentAt).toISOString(),
    });
  } catch {}
}

// ── Voice Notes ────────────────────────────────────────────────────────────
export async function dbLoadVoiceNotes(ghostId: string): Promise<VaultVoiceNote[]> {
  try {
    const { data } = await ghostSupabase.from('vault_voice_notes').select('*').eq('ghost_id', ghostId).order('created_at', { ascending: false });
    if (!data?.length) return ls('ghost_vault_voice_notes', []);
    const result = data.map(n => ({
      id: n.id, audioData: n.public_url, duration: n.duration_seconds,
      createdAt: new Date(n.created_at).getTime(), label: n.label ?? undefined,
    }));
    lsSet('ghost_vault_voice_notes', result);
    return result;
  } catch { return ls('ghost_vault_voice_notes', []); }
}

export async function dbSaveVoiceNote(ghostId: string, note: VaultVoiceNote, storagePath: string, publicUrl: string): Promise<void> {
  try {
    await ghostSupabase.from('vault_voice_notes').insert({
      id: note.id, ghost_id: ghostId, storage_path: storagePath,
      public_url: publicUrl, duration_seconds: note.duration, label: note.label ?? null,
    });
  } catch {}
}

export async function dbDeleteVoiceNote(noteId: string): Promise<void> {
  try {
    await ghostSupabase.from('vault_voice_notes').delete().eq('id', noteId);
  } catch {}
}

// ── Inbox ──────────────────────────────────────────────────────────────────
export async function dbLoadInbox(ghostId: string): Promise<VaultInboxItem[]> {
  try {
    const { data } = await ghostSupabase
      .from('vault_inbox').select('*')
      .eq('recipient_ghost_id', ghostId)
      .order('sent_at', { ascending: false });
    if (!data) return ls(`ghost_room_inbox_${ghostId}`, []);
    const result = data.map(i => ({
      id: i.id, senderGhostId: i.sender_ghost_id, type: i.item_type,
      content: i.content, sentAt: new Date(i.sent_at).getTime(),
      status: i.status, note: i.note ?? undefined,
      acceptedAt: i.accepted_at ? new Date(i.accepted_at).getTime() : undefined,
      expiresAt: i.expires_at ? new Date(i.expires_at).getTime() : undefined,
      viewOnce: i.view_once,
    }));
    localStorage.setItem(`ghost_room_inbox_${ghostId}`, JSON.stringify(result));
    return result;
  } catch { return ls(`ghost_room_inbox_${ghostId}`, []); }
}

export async function dbSendInboxItem(item: VaultInboxItem, recipientGhostId: string): Promise<void> {
  try {
    await ghostSupabase.from('vault_inbox').insert({
      id: item.id, recipient_ghost_id: recipientGhostId,
      sender_ghost_id: item.senderGhostId, item_type: item.type,
      content: item.content, note: item.note ?? null,
      expires_at: item.expiresAt ? new Date(item.expiresAt).toISOString() : null,
      view_once: item.viewOnce ?? false,
      sent_at: new Date(item.sentAt).toISOString(),
    });
  } catch {}
}

export async function dbUpdateInboxStatus(id: string, status: string, acceptedAt?: number): Promise<void> {
  try {
    await ghostSupabase.from('vault_inbox').update({
      status,
      accepted_at: acceptedAt ? new Date(acceptedAt).toISOString() : null,
    }).eq('id', id);
  } catch {}
}

// ── Activity Log ───────────────────────────────────────────────────────────
export async function dbLogActivity(ghostId: string, action: string): Promise<void> {
  try {
    await ghostSupabase.from('vault_activity_log').insert({ ghost_id: ghostId, action, at: new Date().toISOString() });
  } catch {}
}

export async function dbLoadActivityLog(ghostId: string): Promise<VaultActivity[]> {
  try {
    const { data } = await ghostSupabase.from('vault_activity_log').select('*').eq('ghost_id', ghostId).order('at', { ascending: false }).limit(50);
    if (!data?.length) return ls('ghost_vault_activity', []);
    return data.map(e => ({ id: e.id, ghostId: e.ghost_id, action: e.action, at: new Date(e.at).getTime() }));
  } catch { return ls('ghost_vault_activity', []); }
}

// ── Shared Vault ───────────────────────────────────────────────────────────
export async function dbLoadSharedItems(ghostId: string): Promise<VaultSharedItem[]> {
  try {
    const { data } = await ghostSupabase.from('vault_shared_items').select('*')
      .or(`uploaded_by_ghost_id.eq.${ghostId},shared_with_ghost_id.eq.${ghostId}`)
      .order('uploaded_at', { ascending: false });
    if (!data?.length) return ls('ghost_vault_shared', []);
    return data.map(i => ({ id: i.id, uploadedBy: i.uploaded_by_ghost_id, type: i.item_type, url: i.url, uploadedAt: new Date(i.uploaded_at).getTime(), caption: i.caption ?? undefined }));
  } catch { return ls('ghost_vault_shared', []); }
}

export async function dbSaveSharedItem(ghostId: string, item: VaultSharedItem): Promise<void> {
  try {
    await ghostSupabase.from('vault_shared_items').insert({
      id: item.id, uploaded_by_ghost_id: item.uploadedBy, shared_with_ghost_id: ghostId,
      item_type: item.type, url: item.url, caption: item.caption ?? null,
    });
  } catch {}
}

export async function dbDeleteSharedItem(id: string): Promise<void> {
  try {
    await ghostSupabase.from('vault_shared_items').delete().eq('id', id);
  } catch {}
}

// ── Private Bio ────────────────────────────────────────────────────────────
export async function dbLoadPrivateBio(ghostId: string): Promise<VaultPrivateBio> {
  const empty: VaultPrivateBio = { realName: '', phone: '', instagram: '', telegram: '', bio: '' };
  try {
    const { data } = await ghostSupabase.from('vault_private_bio').select('*').eq('ghost_id', ghostId).maybeSingle();
    if (!data) return ls('ghost_vault_bio', empty);
    const result: VaultPrivateBio = { realName: data.real_name, phone: data.phone, instagram: data.instagram, telegram: data.telegram, bio: data.bio };
    lsSet('ghost_vault_bio', result);
    return result;
  } catch { return ls('ghost_vault_bio', empty); }
}

export async function dbSavePrivateBio(ghostId: string, bio: VaultPrivateBio): Promise<void> {
  lsSet('ghost_vault_bio', bio);
  try {
    await ghostSupabase.from('vault_private_bio').upsert({
      ghost_id: ghostId, real_name: bio.realName, phone: bio.phone,
      instagram: bio.instagram, telegram: bio.telegram, bio: bio.bio,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'ghost_id' });
  } catch {}
}

// ── Memories ───────────────────────────────────────────────────────────────
export async function dbLoadMemories(ghostId: string): Promise<VaultMemory[]> {
  try {
    const { data } = await ghostSupabase.from('vault_memories').select('*').eq('ghost_id', ghostId).order('created_at', { ascending: false });
    if (!data?.length) return ls('ghost_vault_memories', []);
    const result = data.map(m => ({ id: m.id, title: m.title, content: m.content, date: m.memory_date ?? '', mood: m.mood, createdAt: new Date(m.created_at).getTime() }));
    lsSet('ghost_vault_memories', result);
    return result;
  } catch { return ls('ghost_vault_memories', []); }
}

export async function dbSaveMemory(ghostId: string, memory: VaultMemory): Promise<void> {
  try {
    await ghostSupabase.from('vault_memories').insert({ id: memory.id, ghost_id: ghostId, title: memory.title, content: memory.content, memory_date: memory.date || null, mood: memory.mood });
  } catch {}
}

export async function dbDeleteMemory(id: string): Promise<void> {
  try {
    await ghostSupabase.from('vault_memories').delete().eq('id', id);
  } catch {}
}
