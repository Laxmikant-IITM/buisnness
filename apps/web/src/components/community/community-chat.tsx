'use client';

/**
 * Real-Time Course Community Chat Room Component
 * Module: Community Real-time Chat (src/components/community/community-chat.tsx)
 *
 * Provides a high-performance SSE-driven live discussion room for enrolled students and instructors.
 * Features:
 * - Persistent SSE listener with automatic reconnection and keep-alive tracking.
 * - Smooth auto-scrolling with user scroll-lock detection.
 * - Pinned announcement banners with collapsible multi-pin drawer.
 * - Zero emojis: clean Lucide SVG reactions (Helpful, Insight, Flame, Heart).
 * - Threaded reply composer with parent quotation preview.
 * - Channel mute toggle with preference persistence.
 * - Distinct staff role badges (Instructor, Admin, Manager) to verify instructor answers.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Pin,
  Reply,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Radio,
  X,
  ChevronDown,
  Sparkles,
  ThumbsUp,
  Heart,
  Flame,
  Lightbulb,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export interface ChatUser {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
}

export interface ChatMessage {
  id: string;
  courseId: string;
  userId: string;
  content: string;
  imageUrl?: string | null;
  isPinned: boolean;
  isEdited: boolean;
  likes: number;
  reactions: Record<string, string[]>;
  replyToId?: string | null;
  isSystemDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  user: ChatUser;
  replyTo?: {
    id: string;
    content: string;
    userId: string;
    user: ChatUser | null;
  } | null;
}

export interface CommunityChatProps {
  courseId: string;
  courseTitle: string;
  currentUserId: string;
  currentUserRole: string;
  className?: string;
}

const REACTION_CONFIGS: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  helpful: { label: 'Helpful', icon: ThumbsUp, color: 'text-emerald-400' },
  insight: { label: 'Insight', icon: Lightbulb, color: 'text-amber-400' },
  fire: { label: 'Brilliant', icon: Flame, color: 'text-orange-400' },
  heart: { label: 'Thanks', icon: Heart, color: 'text-rose-400' },
};

const QUICK_REACTIONS = ['helpful', 'insight', 'fire', 'heart'];

/**
 * CommunityChat interactive real-time discussion component.
 */
export function CommunityChat({
  courseId,
  courseTitle,
  currentUserId,
  currentUserRole,
  className = '',
}: CommunityChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [isMuted, setIsMuted] = useState(false);

  // Composer state
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showPinnedDrawer, setShowPinnedDrawer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const userScrolledUpRef = useRef<boolean>(false);

  const isStaff =
    currentUserRole === 'ADMIN' ||
    currentUserRole === 'INSTRUCTOR' ||
    currentUserRole === 'MANAGER' ||
    currentUserRole === 'SUPER_MANAGER';

  /**
   * Smoothly scrolls to the bottom of the chat unless the user has scrolled up.
   */
  const scrollToBottom = useCallback((force = false) => {
    if (force || !userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    userScrolledUpRef.current = !isAtBottom;
  };

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/community/${courseId}/messages?limit=60`);
      if (!res.ok) {
        if (res.status === 403) {
          setError('You must be enrolled in this course to access the community chat room.');
        } else {
          setError('Failed to load community chat. Please try again.');
        }
        return;
      }
      const data = await res.json();
      setMessages(data.messages || []);
      setPinnedMessages(data.pinnedMessages || []);
      setIsMuted(Boolean(data.mutePreference?.isMuted));
      setTimeout(() => scrollToBottom(true), 100);
    } catch {
      setError('Network error: Unable to connect to course community.');
    } finally {
      setLoading(false);
    }
  }, [courseId, scrollToBottom]);

  useEffect(() => {
    fetchMessages();

    // Mark channel as read
    fetch(`/api/community/${courseId}/read`, { method: 'POST' }).catch(() => {});

    // SSE connection
    const streamUrl = `/api/community/${courseId}/stream`;
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    setConnectionStatus('connecting');

    es.onopen = () => {
      setConnectionStatus('connected');
    };

    es.addEventListener('message', (event) => {
      try {
        const newMsg: ChatMessage = JSON.parse(event.data);
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom();
      } catch (err) {
        console.error('[SSE:message] Parse error:', err);
      }
    });

    es.addEventListener('pin', (event) => {
      try {
        const payload = JSON.parse(event.data);
        setMessages((prev) =>
          prev.map((m) => (m.id === payload.messageId ? { ...m, isPinned: payload.isPinned } : m)),
        );
        if (payload.action === 'pin' && payload.message) {
          setPinnedMessages((prev) => [payload.message, ...prev.filter((m) => m.id !== payload.messageId)]);
        } else if (payload.action === 'unpin') {
          setPinnedMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
        }
      } catch (err) {
        console.error('[SSE:pin] Parse error:', err);
      }
    });

    es.addEventListener('reaction', (event) => {
      try {
        const payload = JSON.parse(event.data);
        setMessages((prev) =>
          prev.map((m) => (m.id === payload.messageId ? { ...m, reactions: payload.reactions } : m)),
        );
      } catch (err) {
        console.error('[SSE:reaction] Parse error:', err);
      }
    });

    es.onerror = () => {
      setConnectionStatus('disconnected');
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [courseId, fetchMessages, scrollToBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed && !imageUrl) return;

    try {
      setIsSending(true);
      const res = await fetch(`/api/community/${courseId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmed || (imageUrl ? 'Sent an attachment' : ''),
          imageUrl: imageUrl.trim() || undefined,
          replyToId: replyingTo?.id || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Failed to send message.');
        return;
      }

      setContent('');
      setImageUrl('');
      setShowImageInput(false);
      setReplyingTo(null);
      scrollToBottom(true);
    } catch {
      alert('Network failure while sending message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleReaction = async (messageId: string, reactionKey: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const currentReactions = { ...msg.reactions };
        const userList = Array.isArray(currentReactions[reactionKey]) ? [...currentReactions[reactionKey]] : [];
        const idx = userList.indexOf(currentUserId);
        if (idx >= 0) {
          userList.splice(idx, 1);
        } else {
          userList.push(currentUserId);
        }
        if (userList.length > 0) {
          currentReactions[reactionKey] = userList;
        } else {
          delete currentReactions[reactionKey];
        }
        return { ...msg, reactions: currentReactions };
      }),
    );

    try {
      await fetch(`/api/community/${courseId}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji: reactionKey }),
      });
    } catch {
      fetchMessages();
    }
  };

  const handleTogglePin = async (messageId: string, currentPinned: boolean) => {
    if (!isStaff) return;
    try {
      await fetch(`/api/community/${courseId}/messages/${messageId}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !currentPinned }),
      });
    } catch {
      alert('Failed to update pin state.');
    }
  };

  const handleToggleMute = async () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    try {
      await fetch(`/api/community/${courseId}/mute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMuted: nextState }),
      });
    } catch {
      setIsMuted(!nextState);
    }
  };

  const formatMessageTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRoleBadge = (role: string) => {
    if (role === 'INSTRUCTOR' || role === 'ADMIN' || role === 'MANAGER' || role === 'SUPER_MANAGER') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FDF0EB] text-[#E05A33] border border-[#F5B8A3] dark:bg-[#3A150C] dark:text-[#EE8E6E] dark:border-[#7D2F1A] font-mono">
          <Sparkles className="w-2.5 h-2.5 text-[#E05A33]" />
          Staff Mentor
        </span>
      );
    }
    return null;
  };

  return (
    <div className={`flex flex-col h-[700px] bg-white dark:bg-[#1C1C1A] rounded-2xl border border-[#E8E6E1] dark:border-[#2D2D2A] shadow-xs overflow-hidden ${className}`}>
      {/* Community Room Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#1C1C1A] border-b border-[#E8E6E1] dark:border-[#2D2D2A]">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#FDF0EB] border border-[#F5B8A3] text-[#E05A33] dark:bg-[#3A150C] dark:border-[#7D2F1A] dark:text-[#EE8E6E] font-bold text-sm">
            #
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-[#1A1A19] dark:text-[#F5F3EF] font-display">{courseTitle} Community</h2>
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                  connectionStatus === 'connected'
                    ? 'bg-[#FDF0EB] text-[#E05A33] border-[#F5B8A3] dark:bg-[#3A150C] dark:text-[#EE8E6E]'
                    : connectionStatus === 'connecting'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                <Radio className={`w-3 h-3 ${connectionStatus === 'connected' ? 'animate-pulse text-[#E05A33]' : ''}`} />
                <span className="capitalize">{connectionStatus}</span>
              </div>
            </div>
            <p className="text-xs text-[#8C8C87] font-body">Ask questions, share code solutions, and engage with mentors</p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {pinnedMessages.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPinnedDrawer(!showPinnedDrawer)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-amber-950/60 text-amber-300 border border-amber-800/80 hover:bg-amber-900/60 transition-colors"
            >
              <Pin className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{pinnedMessages.length} Pinned</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showPinnedDrawer ? 'rotate-180' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute community notifications' : 'Mute community notifications'}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              isMuted
                ? 'bg-stone-900 text-stone-500 border-stone-800'
                : 'bg-stone-900 text-stone-300 border-stone-700 hover:text-white hover:bg-stone-800'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Pinned Messages Collapsible Banner */}
      {showPinnedDrawer && pinnedMessages.length > 0 && (
        <div className="bg-amber-950/40 border-b border-amber-900/80 px-6 py-3 space-y-2 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
            <span className="flex items-center gap-1 font-mono">
              <Pin className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              Pinned Announcements
            </span>
            <button
              type="button"
              onClick={() => setShowPinnedDrawer(false)}
              className="text-amber-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {pinnedMessages.map((pm) => (
            <div key={pm.id} className="p-3 bg-stone-900/90 rounded-xl border border-amber-900/60 text-xs text-stone-200">
              <div className="flex items-center justify-between font-semibold mb-1">
                <span className="text-emerald-400 font-mono">{pm.user.name}</span>
                <span className="text-[10px] text-stone-500 font-mono">{formatMessageTime(pm.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap">{pm.content}</p>
              {isStaff && (
                <button
                  type="button"
                  onClick={() => handleTogglePin(pm.id, true)}
                  className="mt-1 text-[11px] text-rose-400 hover:underline font-mono"
                >
                  Unpin message
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chat Stream Body */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FAFAF7] dark:bg-[#111110]"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-[#8C8C87] gap-2">
            <div className="w-6 h-6 border-2 border-[#E05A33] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono">Loading course discussions...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
            <p className="text-sm font-semibold text-[#1A1A19] dark:text-[#F5F3EF]">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchMessages} className="mt-3 text-xs">
              Retry Connection
            </Button>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === currentUserId;

            return (
              <div
                key={msg.id}
                className={`group relative flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Author Avatar */}
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={msg.user.avatar || undefined} alt={msg.user.name} />
                  <AvatarFallback className="bg-[#FDF0EB] border border-[#F5B8A3] text-[#E05A33] dark:bg-[#3A150C] dark:border-[#7D2F1A] dark:text-[#EE8E6E] text-xs font-bold">
                    {msg.user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Message Bubble & Meta */}
                <div className={`max-w-[78%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Author Name + Role Badge + Timestamp */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#1A1A19] dark:text-[#F5F3EF]">{msg.user.name}</span>
                    {getRoleBadge(msg.user.role)}
                    <span className="text-[10px] text-[#8C8C87] font-mono">{formatMessageTime(msg.createdAt)}</span>
                    {msg.isPinned && (
                      <span title="Pinned announcement">
                        <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                      </span>
                    )}
                  </div>

                  {/* Reply Reference Bubble */}
                  {msg.replyTo && (
                    <div
                      className={`mb-1 px-3 py-1.5 rounded-lg text-xs border ${
                        isMe
                          ? 'bg-[#FDF0EB] border-[#F5B8A3] text-[#E05A33] dark:bg-[#3A150C] dark:border-[#7D2F1A] dark:text-[#EE8E6E]'
                          : 'bg-white dark:bg-[#1C1C1A] border-[#E8E6E1] dark:border-[#2D2D2A] text-[#6B6B66] dark:text-[#9E9D97]'
                      }`}
                    >
                      <span className="font-semibold text-[#E05A33] block text-[11px] font-mono">
                        @{msg.replyTo.user?.name || 'Learner'}
                      </span>
                      <p className="truncate max-w-xs">{msg.replyTo.content}</p>
                    </div>
                  )}

                  {/* Main Bubble */}
                  <div
                    className={`relative px-4 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-xs ${
                      isMe
                        ? 'bg-[#E05A33] text-white font-medium rounded-tr-xs'
                        : 'bg-white dark:bg-[#1C1C1A] text-[#1A1A19] dark:text-[#F5F3EF] border border-[#E8E6E1] dark:border-[#2D2D2A] rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Image Attachment */}
                    {msg.imageUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-black/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.imageUrl}
                          alt="Attachment"
                          className="max-h-60 w-auto object-cover rounded"
                        />
                      </div>
                    )}
                  </div>

                  {/* Reactions Pill Display */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {Object.entries(msg.reactions).map(([reactionKey, userIds]) => {
                        const hasReacted = userIds.includes(currentUserId);
                        const config = REACTION_CONFIGS[reactionKey] || {
                          label: reactionKey,
                          icon: ThumbsUp,
                          color: 'text-[#8C8C87]',
                        };
                        const Icon = config.icon;

                        return (
                          <button
                            key={reactionKey}
                            type="button"
                            onClick={() => handleToggleReaction(msg.id, reactionKey)}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] border font-mono transition-colors ${
                              hasReacted
                                ? 'bg-[#FDF0EB] text-[#E05A33] border-[#F5B8A3] dark:bg-[#3A150C] dark:text-[#EE8E6E] font-bold'
                                : 'bg-white dark:bg-[#1C1C1A] text-[#8C8C87] border-[#E8E6E1] dark:border-[#2D2D2A] hover:bg-[#FAFAF7]'
                            }`}
                          >
                            <Icon className={`w-3 h-3 ${config.color}`} />
                            <span>{userIds.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Hover Actions Toolbar with SVG Icons */}
                  <div
                    className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] rounded-xl shadow-lg p-1 z-10 ${
                      isMe ? 'right-full mr-2' : 'left-full ml-2'
                    }`}
                  >
                    {QUICK_REACTIONS.map((key) => {
                      const config = REACTION_CONFIGS[key];
                      const Icon = config.icon;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleToggleReaction(msg.id, key)}
                          title={config.label}
                          className="hover:scale-125 transition-transform p-1.5 rounded text-[#8C8C87] hover:text-[#1A1A19] dark:hover:text-white"
                        >
                          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setReplyingTo(msg)}
                      title="Reply"
                      className="p-1.5 hover:bg-[#F5F3EF] dark:hover:bg-[#252522] rounded text-[#8C8C87] hover:text-[#1A1A19] dark:hover:text-white"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>

                    {isStaff && (
                      <button
                        type="button"
                        onClick={() => handleTogglePin(msg.id, msg.isPinned)}
                        title={msg.isPinned ? 'Unpin' : 'Pin to top'}
                        className={`p-1.5 hover:bg-[#F5F3EF] dark:hover:bg-[#252522] rounded ${
                          msg.isPinned ? 'text-amber-500' : 'text-[#8C8C87] hover:text-[#1A1A19] dark:hover:text-white'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview Drawer */}
      {replyingTo && (
        <div className="flex items-center justify-between px-6 py-2 bg-[#FDF0EB] dark:bg-[#3A150C] border-t border-[#F5B8A3] dark:border-[#7D2F1A] text-xs text-[#1A1A19] dark:text-[#F5F3EF]">
          <div className="flex items-center gap-2 truncate">
            <Reply className="w-4 h-4 text-[#E05A33] shrink-0" />
            <span>
              Replying to <strong className="text-[#E05A33] font-mono">@{replyingTo.user.name}</strong>:{' '}
              <span className="italic text-[#6B6B66] dark:text-[#9E9D97] truncate max-w-sm">{replyingTo.content}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="text-[#8C8C87] hover:text-[#1A1A19] dark:hover:text-white p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Image URL attachment drawer */}
      {showImageInput && (
        <div className="px-6 py-2 bg-white dark:bg-[#1C1C1A] border-t border-[#E8E6E1] dark:border-[#2D2D2A] flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#8C8C87] shrink-0" />
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Paste public image URL (e.g. diagram, homework screenshot)..."
            className="flex-1 bg-[#FAFAF7] dark:bg-[#161615] border border-[#E8E6E1] dark:border-[#2D2D2A] rounded-lg px-3 py-1.5 text-xs text-[#1A1A19] dark:text-[#F5F3EF] placeholder-[#8C8C87] focus:outline-none focus:border-[#E05A33]"
          />
          <button
            type="button"
            onClick={() => {
              setImageUrl('');
              setShowImageInput(false);
            }}
            className="text-[#8C8C87] hover:text-[#1A1A19] dark:hover:text-white text-xs font-mono cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Message Composer Footer */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-[#1C1C1A] border-t border-[#E8E6E1] dark:border-[#2D2D2A] flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowImageInput(!showImageInput)}
          title="Attach image screenshot URL"
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            showImageInput || imageUrl
              ? 'bg-[#FDF0EB] text-[#E05A33] border border-[#F5B8A3] dark:bg-[#3A150C] dark:text-[#EE8E6E]'
              : 'text-[#8C8C87] hover:bg-[#FAFAF7] dark:hover:bg-[#252522] hover:text-[#1A1A19]'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Message #${courseTitle}...`}
          className="flex-1 bg-[#FAFAF7] dark:bg-[#161615] border border-[#E8E6E1] dark:border-[#2D2D2A] rounded-xl px-4 py-2.5 text-xs text-[#1A1A19] dark:text-[#F5F3EF] placeholder-[#8C8C87] focus:outline-none focus:border-[#E05A33] transition-all font-body"
        />

        <Button
          type="submit"
          disabled={isSending || (!content.trim() && !imageUrl)}
          className="bg-[#E05A33] hover:bg-[#C94A26] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </Button>
      </form>
    </div>
  );
}
