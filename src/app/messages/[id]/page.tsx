'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/useAuth';
import { fetchMessages, fetchConversations, uploadChatMedia } from '@/lib/api/messageApi';
import { blockUser, unblockUser, fetchBlockStatus, reportUser } from '@/lib/api/userApi';
import { getSocket } from '@/lib/socket';

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
    </svg>
  );
}
function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
    </svg>
  );
}
function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v1a7 7 0 0014 0v-1" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" />
    </svg>
  );
}
function formatDuration(totalSeconds: number) {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0;
  const m = Math.floor(safe / 60);
  const sec = Math.floor(safe % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function VoiceMessagePlayer({ url, duration, isMine }: { url: string; duration?: number | null; isMine: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    function onTime() {
      if (!audio) return;
      setCurrentTime(audio.currentTime);
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    }
    function onEnded() {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    }
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  const displaySeconds = currentTime > 0 ? currentTime : duration || 0;

  return (
    <div className="flex min-w-[168px] items-center gap-2 py-1">
      <audio ref={audioRef} src={url} preload="metadata" className="hidden" />
      <button
        onClick={toggle}
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${isMine ? 'bg-green-700/20 text-green-900' : 'bg-slate-300 text-slate-700'}`}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <div className="flex-1">
        <div className={`h-1 w-full overflow-hidden rounded-full ${isMine ? 'bg-green-700/20' : 'bg-slate-300'}`}>
        <div className={`h-full rounded-full ${isMine ? 'bg-green-700' : 'bg-slate-600'}`} style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      <span className="flex-shrink-0 text-[11px]">{formatDuration(displaySeconds)}</span>
    </div>
  );
}

// WhatsApp-style ticks: one grey = sent, two grey = delivered, two blue = read.
function Ticks({ status }: { status: 'sent' | 'delivered' | 'read' }) {
  const color = status === 'read' ? '#4fc3f7' : '#8b9a8f';
  if (status === 'sent') {
    return (
      <svg width="13" height="10" viewBox="0 0 16 11" fill="none" className="flex-shrink-0">
        <path d="M1 5.5L5 9.5L15 1" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="17" height="10" viewBox="0 0 20 11" fill="none" className="flex-shrink-0">
      <path d="M1 5.5L5 9.5L15 1" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 5.5L10 9.5L20 1" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'voice' | null;
  voiceDuration?: number | null;
  isDeleted?: boolean;
  createdAt: string;
  sender?: { id: string; username: string; displayName: string; profilePictureUrl?: string };
}
interface OtherUser {
  id: string;
  username: string;
  displayName: string;
  profilePictureUrl?: string;
  isOnline: boolean;
  lastActiveAt?: string | null;
}
interface Toast {
  message: string;
  type: 'success' | 'error';
}

const REPORT_REASONS: { value: string; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'violence', label: 'Violence' },
  { value: 'nudity', label: 'Nudity or sexual content' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'other', label: 'Something else' },
];

function formatLastSeen(dateStr?: string | null) {
  if (!dateStr) return 'Offline';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Last seen just now';
  if (mins < 60) return `Last seen ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Last seen ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Last seen ${days}d ago`;
}

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function messageStatus(
  message: Message,
  otherLastReadAt: Date | null,
  otherLastDeliveredAt: Date | null
): 'sent' | 'delivered' | 'read' {
  const createdAt = new Date(message.createdAt);
  if (otherLastReadAt && otherLastReadAt >= createdAt) return 'read';
  if (otherLastDeliveredAt && otherLastDeliveredAt >= createdAt) return 'delivered';
  return 'sent';
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockActionLoading, setBlockActionLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [otherLastReadAt, setOtherLastReadAt] = useState<Date | null>(null);
  const [otherLastDeliveredAt, setOtherLastDeliveredAt] = useState<Date | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [deleteMenuFor, setDeleteMenuFor] = useState<Message | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function showToast(message: string, type: 'success' | 'error') {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ message, type });
    toastTimeout.current = setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    fetchMessages(conversationId).then((result) => {
      if (result.success) {
        setMessages(result.data.messages);
        setOtherLastReadAt(result.data.otherLastReadAt ? new Date(result.data.otherLastReadAt) : null);
        setOtherLastDeliveredAt(result.data.otherLastDeliveredAt ? new Date(result.data.otherLastDeliveredAt) : null);
      }
      setLoading(false);
    });

    fetchConversations().then((result) => {
      if (result.success) {
        const convo = result.data.find((c: any) => c.id === conversationId);
        if (convo?.otherUser) {
          setOtherUser(convo.otherUser);
          fetchBlockStatus(convo.otherUser.id).then((res) => {
            if (res.success) setIsBlocked(!!res.data.blockedByMe);
          });
        }
      }
    });

    const socket = getSocket();

    function handleNewMessage(message: Message) {
      if (message.conversationId !== conversationId) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      if (message.senderId !== user?.id) {
        socket.emit('conversation:read', { conversationId });
      }
    }
    function handleTypingStart({ conversationId: cid, userId }: { conversationId: string; userId: string }) {
      if (cid === conversationId && userId !== user?.id) setOtherTyping(true);
    }
    function handleTypingStop({ conversationId: cid, userId }: { conversationId: string; userId: string }) {
      if (cid === conversationId && userId !== user?.id) setOtherTyping(false);
    }
    function handlePresenceOnline({ userId }: { userId: string }) {
      setOtherUser((prev) => (prev && prev.id === userId ? { ...prev, isOnline: true } : prev));
    }
    function handlePresenceOffline({ userId, lastActiveAt }: { userId: string; lastActiveAt: string }) {
      setOtherUser((prev) => (prev && prev.id === userId ? { ...prev, isOnline: false, lastActiveAt } : prev));
    }
    // The other person opened this chat (or the app came online and caught
    // up) — flip our sent messages' ticks to reflect that.
    function handleConversationRead({ conversationId: cid, userId, readAt }: { conversationId: string; userId: string; readAt: string }) {
      if (cid !== conversationId || userId === user?.id) return;
      const at = new Date(readAt);
      setOtherLastReadAt(at);
      setOtherLastDeliveredAt(at);
    }
    function handleConversationDelivered({ conversationId: cid, userId, deliveredAt }: { conversationId: string; userId: string; deliveredAt: string }) {
      if (cid !== conversationId || userId === user?.id) return;
      setOtherLastDeliveredAt(new Date(deliveredAt));
    }

    function handleMessageDeleted({ messageId }: { messageId: string }) {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true, content: '', mediaUrl: null, mediaType: null } : m)));
    }

    socket.on('message:new', handleNewMessage);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('presence:online', handlePresenceOnline);
    socket.on('presence:offline', handlePresenceOffline);
    socket.on('conversation:read', handleConversationRead);
    socket.on('conversation:delivered', handleConversationDelivered);
    socket.emit('conversation:read', { conversationId });

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('presence:online', handlePresenceOnline);
      socket.off('presence:offline', handlePresenceOffline);
      socket.off('conversation:read', handleConversationRead);
      socket.off('conversation:delivered', handleConversationDelivered);
    };
  }, [conversationId, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Stop any in-progress recording (mic + timer) if this page unmounts
  // mid-recording, e.g. the user navigates away with the back button.
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null;
        recorder.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function handleTyping(value: string) {
    setText(value);
    const socket = getSocket();
    socket.emit('typing:start', { conversationId });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId });
    }, 1500);
  }

  function sendMessage() {
    const content = text.trim();
    if (!content) return;
    const socket = getSocket();
    socket.emit(
      'message:send',
      { conversationId, content },
      (res: { success: boolean; data?: Message; error?: string; delivered?: boolean }) => {
        if (res.success && res.data) {
          setMessages((prev) => (prev.some((m) => m.id === res.data!.id) ? prev : [...prev, res.data!]));
          if (res.delivered) setOtherLastDeliveredAt(new Date());
        } else if (res.error === 'BLOCKED') {
          showToast("You can't send messages to this user.", 'error');
        }
      }
    );
    setText('');
    socket.emit('typing:stop', { conversationId });
  }

  function sendMediaMessage(mediaUrl: string, mediaType: 'image' | 'voice', voiceDuration?: number) {
    const socket = getSocket();
    socket.emit(
      'message:send',
      { conversationId, content: '', mediaUrl, mediaType, voiceDuration },
      (res: { success: boolean; data?: Message; error?: string; delivered?: boolean }) => {
        if (res.success && res.data) {
          setMessages((prev) => (prev.some((m) => m.id === res.data!.id) ? prev : [...prev, res.data!]));
          if (res.delivered) setOtherLastDeliveredAt(new Date());
        } else if (res.error === 'BLOCKED') {
          showToast("You can't send messages to this user.", 'error');
        }
      }
    );
  }

  async function handlePickImage(file: File) {
    setUploadingMedia(true);
    const result = await uploadChatMedia(file, file.name);
    setUploadingMedia(false);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (!result.success) {
      showToast(result.error?.message || 'Could not upload photo.', 'error');
      return;
    }
    sendMediaMessage(result.data.url, 'image');
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      const startedAt = Date.now();
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds(Math.floor((Date.now() - startedAt) / 1000));
      }, 500);
      (recorder as any)._startedAt = startedAt;
    } catch {
      showToast('Microphone permission denied.', 'error');
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    const startedAt = (recorder as any)._startedAt || Date.now();
    const duration = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setRecording(false);
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      chunksRef.current = [];
      if (blob.size === 0) return;
      setUploadingMedia(true);
      const result = await uploadChatMedia(blob, 'voice-message.webm');
      setUploadingMedia(false);
      if (!result.success) {
        showToast(result.error?.message || 'Could not upload voice message.', 'error');
        return;
      }
      sendMediaMessage(result.data.url, 'voice', duration);
    };
    recorder.stop();
  }

  function handleMicClick() {
    if (recording) stopRecording();
    else startRecording();
  }

  function startLongPress(m: Message) {
    if (m.isDeleted) return;
    longPressTimer.current = setTimeout(() => setDeleteMenuFor(m), 450);
  }
  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }
  function handleDeleteForMe() {
    if (!deleteMenuFor) return;
    const id = deleteMenuFor.id;
    setDeleteMenuFor(null);
    const socket = getSocket();
    socket.emit('message:delete', { messageId: id, mode: 'me' }, (res: { success: boolean; error?: string }) => {
      if (res.success) setMessages((prev) => prev.filter((m) => m.id !== id));
      else showToast('Could not delete message.', 'error');
    });
  }
  function handleDeleteForEveryone() {
    if (!deleteMenuFor) return;
    const id = deleteMenuFor.id;
    setDeleteMenuFor(null);
    const socket = getSocket();
    socket.emit('message:delete', { messageId: id, mode: 'everyone' }, (res: { success: boolean; error?: string }) => {
      if (!res.success) showToast('Could not delete message.', 'error');
    });
  }

  function openReportModal() {
    setMoreOpen(false);
    setReportReason(null);
    setReportDetails('');
    setReportModalOpen(true);
  }

  async function submitReport() {
    if (!otherUser || !reportReason || reportSubmitting) return;
    setReportSubmitting(true);
    const details = reportReason === 'other' ? reportDetails.trim() || undefined : undefined;
    const result = await reportUser(otherUser.id, reportReason, details);
    setReportSubmitting(false);
    setReportModalOpen(false);
    if (result.success) showToast('Reported. Thank you.', 'success');
    else showToast(result.error?.message || 'Could not report this user.', 'error');
  }

  async function handleBlock() {
    if (!otherUser || blockActionLoading) return;
    setMoreOpen(false);
    if (!confirm(`Block ${otherUser.displayName || otherUser.username}?`)) return;
    setBlockActionLoading(true);
    const result = await blockUser(otherUser.id);
    setBlockActionLoading(false);
    if (result.success) {
      setIsBlocked(true);
      showToast(`You blocked ${otherUser.displayName || otherUser.username}.`, 'success');
    } else {
      showToast(result.error?.message || 'Could not block this user.', 'error');
    }
  }

  async function handleUnblock() {
    if (!otherUser || blockActionLoading) return;
    setMoreOpen(false);
    setBlockActionLoading(true);
    const result = await unblockUser(otherUser.id);
    setBlockActionLoading(false);
    if (result.success) {
      setIsBlocked(false);
      showToast(`You unblocked ${otherUser.displayName || otherUser.username}.`, 'success');
    } else {
      showToast(result.error?.message || 'Could not unblock this user.', 'error');
    }
  }

  const displayName = otherUser?.displayName || otherUser?.username || 'Chat';
  const statusText = otherTyping ? 'Typing...' : otherUser?.isOnline ? 'Online' : formatLastSeen(otherUser?.lastActiveAt);

  return (
    <div className="mx-auto flex h-[100dvh] max-w-xl flex-col">
      {toast && (
        <div
          className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg transition-opacity ${
            toast.type === 'success' ? 'bg-slate-900' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-b bg-white px-3 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/messages')} aria-label="Back">
            <BackIcon />
          </button>
          <div>
            <p className="font-semibold leading-tight">{displayName}</p>
            <p className={`text-xs leading-tight ${otherUser?.isOnline ? 'text-green-600' : 'text-slate-400'}`}>{statusText}</p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setMoreOpen(!moreOpen)} aria-label="More options" className="p-1 text-slate-600">
            <MoreIcon />
          </button>
          {moreOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border bg-white py-1 shadow-lg" onMouseLeave={() => setMoreOpen(false)}>
              {otherUser && (
                <Link
                  href={`/u/${otherUser.username}`}
                  onClick={() => setMoreOpen(false)}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  View profile
                </Link>
              )}
              {isBlocked ? (
                <button onClick={handleUnblock} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                  Unblock user
                </button>
              ) : (
                <button onClick={handleBlock} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50">
                  Block user
                </button>
              )}
              <button onClick={openReportModal} className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                Report
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {!loading && otherUser && (
          <div className="flex flex-col items-center gap-2 py-6">
            {otherUser.profilePictureUrl ? (
              <img
                src={otherUser.profilePictureUrl}
                alt={displayName}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-2xl font-semibold text-slate-600">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <p className="text-lg font-semibold text-slate-900">{displayName}</p>
            <Link
              href={`/u/${otherUser.username}`}
              className="rounded-full border px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View profile
            </Link>
          </div>
        )}

        {loading && <p className="text-center text-slate-500">Loading...</p>}
        {!loading && messages.length === 0 && (
          <p className="text-center text-slate-500">Say hi 👋</p>
        )}
        <div className="space-y-2">
          {messages.map((m) => {
            const isMine = m.senderId === user?.id;
            const status = isMine ? messageStatus(m, otherLastReadAt, otherLastDeliveredAt) : null;
            const isImage = m.mediaType === 'image' && m.mediaUrl;
            const isVoice = m.mediaType === 'voice' && m.mediaUrl;
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  onTouchStart={() => startLongPress(m)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  onContextMenu={(e) => { e.preventDefault(); if (!m.isDeleted) setDeleteMenuFor(m); }}
                  className={`max-w-[75%] rounded-2xl text-[15px] leading-snug ${
                    m.isDeleted ? 'bg-slate-100 italic text-slate-400' :
                    isImage || isVoice ? '' : isMine ? 'bg-[#dcf8c6] text-[#111827]' : 'bg-slate-100 text-slate-800'
                  } ${m.isDeleted ? 'px-3 py-2' : isImage ? 'p-1.5' : isVoice ? 'px-1 py-1' : 'px-3 py-2'}`}
                >
                  {m.isDeleted ? (
                    <p>This message was deleted</p>
                  ) : (
                    <>
                      {isImage && (
                        <img src={m.mediaUrl!} alt="" className="max-h-72 w-full rounded-xl object-cover" />
                      )}
                      {isVoice && (
                        <VoiceMessagePlayer url={m.mediaUrl!} duration={m.voiceDuration} isMine={isMine} />
                      )}
                      {m.content && <p className={isImage ? 'px-1.5 pt-1' : ''}>{m.content}</p>}
                      <div className={`flex items-center justify-end gap-1 ${isMine ? 'text-slate-500' : 'text-slate-400'} ${isImage ? 'px-1.5 pb-0.5 pt-1' : 'mt-1'}`}>
                        <span className="text-[11px]">{formatMessageTime(m.createdAt)}</span>
                        {isMine && status && <Ticks status={status} />}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div ref={bottomRef} />
      </div>

      {isBlocked ? (
        <div className="border-t bg-white p-3">
          <button
            onClick={handleUnblock}
            disabled={blockActionLoading}
            className="w-full rounded-full bg-slate-900 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            Unblock to send messages
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-t bg-white p-3">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handlePickImage(e.target.files[0])}
          />
          {recording ? (
            <>
              <div className="flex flex-1 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                Recording... {recordSeconds}s
              </div>
              <button onClick={stopRecording} className="rounded-full bg-red-600 p-2.5 text-white" aria-label="Stop and send">
                <SendIcon />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingMedia}
                className="p-2 text-slate-500 disabled:opacity-40"
                aria-label="Send photo"
              >
                <ImageIcon />
              </button>
              <input
                value={text}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Message..."
                className="flex-1 rounded-full border px-4 py-2 text-sm"
              />
              {text.trim() ? (
                <button onClick={sendMessage} className="rounded-full bg-slate-900 p-2.5 text-white" aria-label="Send">
                  <SendIcon />
                </button>
              ) : (
                <button
                  onClick={handleMicClick}
                  disabled={uploadingMedia}
                  className="rounded-full bg-slate-900 p-2.5 text-white disabled:opacity-40"
                  aria-label="Record voice message"
                >
                  <MicIcon />
                </button>
              )}
            </>
          )}
        </div>
      )}

      {reportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setReportModalOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-t-2xl bg-white p-4 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-3 text-center text-sm font-semibold text-slate-800">
              Report {otherUser?.displayName || otherUser?.username}
            </p>
            <div className="max-h-[45vh] overflow-y-auto">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReportReason(r.value)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm ${
                    reportReason === r.value ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {r.label}
                  {reportReason === r.value && <CheckIcon />}
                </button>
              ))}
            </div>
            {reportReason === 'other' && (
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Tell us more (optional)"
                rows={3}
                className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              />
            )}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setReportModalOpen(false)}
                className="flex-1 rounded-full border py-2.5 text-sm font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                disabled={!reportReason || reportSubmitting}
                className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-medium text-white disabled:opacity-40"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteMenuFor && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setDeleteMenuFor(null)}
        >
          <div
            className="w-full max-w-xl rounded-t-2xl bg-white p-2 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center pt-2 pb-1">
              <span className="h-1 w-10 rounded-full bg-slate-300" />
            </div>
            <button
              onClick={handleDeleteForMe}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-slate-800 hover:bg-slate-50"
            >
              Delete for me
            </button>
            {deleteMenuFor.senderId === user?.id && (
              <button
                onClick={handleDeleteForEveryone}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-red-600 hover:bg-slate-50"
              >
                Delete for everyone
              </button>
            )}
            <button
              onClick={() => setDeleteMenuFor(null)}
              className="mt-1 flex w-full items-center justify-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
