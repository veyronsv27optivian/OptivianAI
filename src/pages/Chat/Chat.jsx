import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MessageSquare, Send, Search, Plus, ArrowLeft, User,
  Reply, Edit3, Trash2, X, Paperclip, Image as ImageIcon, File,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { supabase } from '../../services/supabase';
import {
  getConversations, getMessages, sendMessage,
  getOrCreateDirectConversation, createConversation,
  editMessage, deleteMessageForMe, deleteMessageForEveryone, uploadFile
} from '../../services/chatService';
import { markConversationRead, addListener, getUnreadCounts } from '../../services/chatUnreadTracker';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL;

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / 86400000);
  if (days > 0) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDateHeading(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function shouldShowDateHeading(prevDate, currentDate) {
  if (!prevDate) return true;
  const prev = new Date(prevDate);
  const curr = new Date(currentDate);
  return prev.toDateString() !== curr.toDateString();
}

function getConversationName(conv, myProfileId) {
  if (conv.name) return conv.name;
  const other = (conv.participantsData || []).find(p => p.id !== myProfileId);
  if (other) return other.email?.split('@')[0] || 'User';
  return 'Unknown';
}

function getOtherProfiles(conv, myProfileId) {
  return (conv.participantsData || []).filter(p => p.id !== myProfileId);
}

function senderEmail(senderId, messageSenders) {
  const p = messageSenders[senderId];
  return p?.email?.split('@')[0] || 'Unknown';
}

function senderProfile(senderId, messageSenders) {
  return messageSenders[senderId] || null;
}

function isImage(fileType) {
  return fileType?.startsWith('image/');
}

function getFileIcon(fileType) {
  if (isImage(fileType)) return ImageIcon;
  return File;
}

function messagePreview(msg) {
  if (msg?.content) return msg.content;
  if (msg?.file_name) {
    const ext = msg.file_name.split('.').pop()?.toUpperCase() || 'FILE';
    return `new ${ext} sent`;
  }
  if (msg?.file_url) return 'new file sent';
  return '';
}

export default function Chat() {
  const { user, getStaffMembers } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [staffMembers, setStaffMembers] = useState([]);
  const [myProfileId, setMyProfileId] = useState(null);
  const [messageSenders, setMessageSenders] = useState({});
  const [chatError, setChatError] = useState('');
  const [unreadMap, setUnreadMap] = useState({});
  const [typingProfiles, setTypingProfiles] = useState({});
  const [contextMenu, setContextMenu] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [trackerVersion, setTrackerVersion] = useState(0);

  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);
  const convChannelRef = useRef(null);
  const typingChannelRef = useRef(null);
  const typingTimersRef = useRef({});
  const contextMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const mountId = useRef(Date.now().toString(36));
  const lastReadTimestamps = useRef({});
  const manuallyReadRef = useRef(new Set());
  const unreadCountsRef = useRef({});

  // Fire event for bell when unread count changes
  const fireUnreadEvent = useCallback((map) => {
    const count = Object.values(map).filter(v => v > 0).length;
    window.dispatchEvent(new CustomEvent('chat-unread-update', { detail: count }));
  }, []);

  // Re-sync tracker counts when conversations load (handles late tracker init)
  useEffect(() => {
    if (conversations.length === 0) return;
    const c = getUnreadCounts();
    Object.assign(unreadCountsRef.current, c);
    setTrackerVersion(v => v + 1);
  }, [conversations.length]);

  // Initialize lastReadTimestamps for conversations that have no timestamp yet
  const initTimestamps = useCallback(() => {
    const now = new Date().toISOString();
    for (const conv of conversations) {
      if (!lastReadTimestamps.current[conv.id]) {
        lastReadTimestamps.current[conv.id] = now;
      }
    }
  }, [conversations]);

  initTimestamps();

  // Compute unread status whenever conversations change or selection changes
  useEffect(() => {
    const newMap = {};
    for (const conv of conversations) {
      const lastMsg = conv.lastMessage;
      if (!lastMsg) {
        newMap[conv.id] = 0;
        continue;
      }
      if (lastMsg.sender_id === myProfileId) {
        newMap[conv.id] = 0;
        continue;
      }
      if (conv.id === selectedConv?.id) {
        newMap[conv.id] = 0;
        continue;
      }
      if (manuallyReadRef.current.has(conv.id)) {
        newMap[conv.id] = 0;
        continue;
      }
      const lastRead = lastReadTimestamps.current[conv.id];
      const msgTime = new Date(lastMsg.created_at).getTime();
      const readTime = lastRead ? new Date(lastRead).getTime() : 0;
      const count = unreadCountsRef.current[conv.id] || 0;
      newMap[conv.id] = msgTime > readTime ? Math.max(count, 1) : count;
    }
    setUnreadMap(newMap);
    fireUnreadEvent(newMap);
  }, [conversations, selectedConv, myProfileId, fireUnreadEvent, trackerVersion]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load profile, staff, and conversations on mount
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function init() {
      if (DEV_MODE) {
        const profiles = JSON.parse(localStorage.getItem('optivian_dev_profiles') || '[]');
        const p = profiles.find(pr => pr.user_id === user.id);
        if (p) setMyProfileId(p.id);
      } else {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (data && !cancelled) setMyProfileId(data.id);
      }

      const staff = await getStaffMembers();
      if (!cancelled) setStaffMembers(staff || []);

      const convs = await getConversations(user);
      if (!cancelled) {
        setConversations(convs);
        setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [user, getStaffMembers]);

  // Subscribe to new conversations for the current user (realtime)
  useEffect(() => {
    if (!user || DEV_MODE || !myProfileId) return;

    convChannelRef.current = supabase
      .channel(`my-convs-${user.id}-${mountId.current}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'conversation_participants',
        filter: `profile_id=eq.${myProfileId}`,
      }, async () => {
        const convs = await getConversations(user);
        setConversations(convs);
      })
      .subscribe();

    return () => {
      if (convChannelRef.current) {
        supabase.removeChannel(convChannelRef.current);
      }
    };
  }, [user, myProfileId]);

  // Subscribe to new messages in the selected conversation
  useEffect(() => {
    if (!user || DEV_MODE || !selectedConv) return;

    channelRef.current = supabase
      .channel(`messages-${selectedConv.id}-${mountId.current}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConv.id}`,
      }, async (payload) => {
        const newMsg = payload.new;
        setMessages(prev => [...prev, newMsg]);

        setConversations(prev => prev.map(c =>
          c.id === selectedConv.id ? { ...c, lastMessage: newMsg } : c
        ));
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConv.id}`,
      }, async (payload) => {
        const updated = payload.new;
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConv.id}`,
      }, async (payload) => {
        const deletedId = payload.old.id;
        setMessages(prev => prev.filter(m => m.id !== deletedId));
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, selectedConv]);

  // Typing broadcast channel
  useEffect(() => {
    if (!user || DEV_MODE || !selectedConv || !myProfileId) return;

    const channel = supabase.channel(`typing-${selectedConv.id}-${mountId.current}`, {
      config: { broadcast: { self: false } },
    });

    channel.on('broadcast', { event: 'typing' }, (payload) => {
      const { profileId } = payload.payload;
      if (profileId === myProfileId) return;

      setTypingProfiles(prev => ({ ...prev, [profileId]: Date.now() }));

      if (typingTimersRef.current[profileId]) {
        clearTimeout(typingTimersRef.current[profileId]);
      }
      typingTimersRef.current[profileId] = setTimeout(() => {
        setTypingProfiles(prev => {
          const next = { ...prev };
          delete next[profileId];
          return next;
        });
        delete typingTimersRef.current[profileId];
      }, 3000);
    });

    channel.subscribe();
    typingChannelRef.current = channel;

    return () => {
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
      }
      Object.values(typingTimersRef.current).forEach(t => clearTimeout(t));
      typingTimersRef.current = {};
      setTypingProfiles({});
    };
  }, [user, selectedConv, myProfileId]);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

  // When a conversation is selected, load its messages
  useEffect(() => {
    if (!user || !selectedConv) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function load() {
      const msgs = await getMessages(user, selectedConv.id);
      if (!cancelled) {
        setMessages(msgs);
        const senderIds = [...new Set(msgs.map(m => m.sender_id).filter(Boolean))];
        if (senderIds.length > 0 && !DEV_MODE) {
          const { data: senders } = await supabase
            .from('profiles')
            .select('id, email, avatar_url')
            .in('id', senderIds);
          if (senders) {
            const map = {};
            senders.forEach(s => { map[s.id] = s; });
            setMessageSenders(map);
          }
        }
        if (DEV_MODE) {
          const profiles = JSON.parse(localStorage.getItem('optivian_dev_profiles') || '[]');
          const map = {};
          profiles.forEach(p => { map[p.id] = p; });
          setMessageSenders(map);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user, selectedConv]);

  // Sync global tracker counts into local ref (covers msgs received while Chat was unmounted)
  useEffect(() => {
    const sync = () => {
      const c = getUnreadCounts();
      Object.assign(unreadCountsRef.current, c);
      setTrackerVersion(v => v + 1);
    };
    sync();
    const remove = addListener((counts) => {
      Object.assign(unreadCountsRef.current, counts);
      setTrackerVersion(v => v + 1);
    });
    return remove;
  }, []);

  // Subscribe to all messages changes (to keep conv list / messages in sync)
  useEffect(() => {
    if (!user || DEV_MODE || !myProfileId) return;

    const allMsgChannel = supabase
      .channel(`all-msgs-${user.id}-${mountId.current}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, async (payload) => {
        const newMsg = payload.new;
        if (newMsg.sender_id !== myProfileId && newMsg.conversation_id !== selectedConv?.id) {
          unreadCountsRef.current[newMsg.conversation_id] = (unreadCountsRef.current[newMsg.conversation_id] || 0) + 1;
        }
        setConversations(prev => {
          const idx = prev.findIndex(c => c.id === newMsg.conversation_id);
          if (idx === -1) return prev;
          return prev.map((c, i) => i === idx ? { ...c, lastMessage: newMsg } : c);
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
      }, async (payload) => {
        const updated = payload.new;
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
        setConversations(prev => {
          const idx = prev.findIndex(c => c.id === updated.conversation_id);
          if (idx === -1) return prev;
          return prev.map((c, i) => i === idx ? { ...c, lastMessage: c.lastMessage?.id === updated.id ? updated : c.lastMessage } : c);
        });
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
      }, async (payload) => {
        const deleted = payload.old;
        setMessages(prev => prev.filter(m => m.id !== deleted.id));
        setConversations(prev => {
          const idx = prev.findIndex(c => c.id === deleted.conversation_id);
          if (idx === -1) return prev;
          if (prev[idx].lastMessage?.id !== deleted.id) return prev;
          return prev.map((c, i) => i === idx ? { ...c, lastMessage: null } : c);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(allMsgChannel);
    };
  }, [user, myProfileId]);

  // Poll for conversation updates (backup for realtime)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const convs = await getConversations(user);
      setConversations(convs);
    }, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Auto-focus input after sending completes or conversation selected
  useEffect(() => {
    if (selectedConv && !sending && !uploadingFile) {
      inputRef.current?.focus();
    }
  }, [selectedConv, sending, uploadingFile]);

  const broadcastTyping = useCallback(() => {
    if (DEV_MODE || !typingChannelRef.current || !myProfileId) return;
    typingChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { profileId: myProfileId },
    });
  }, [myProfileId]);

  const handleSend = useCallback(async () => {
    if ((!input.trim() && !uploadingFile) || sending || !selectedConv) return;
    setSending(true);
    const content = input;

    if (editingMsg) {
      let success = false;
      if (DEV_MODE) {
        setMessages(prev => prev.map(m =>
          m.id === editingMsg.id ? { ...m, edited_at: new Date().toISOString(), edited_content: content.trim() } : m
        ));
        success = true;
      } else {
        const { error } = await editMessage(user, editingMsg.id, content);
        success = !error;
      }
      if (success) {
        setMessages(prev => prev.map(m =>
          m.id === editingMsg.id ? { ...m, edited_at: new Date().toISOString(), edited_content: content.trim() } : m
        ));
      }
      setEditingMsg(null);
      setInput('');
      setSending(false);
      return;
    }

    setInput('');

    const { data, error } = await sendMessage(user, selectedConv.id, content, {
      replyTo: replyTo?.id || null,
    });
    if (error) {
      console.error('Failed to send:', error);
      setInput(content);
      setSending(false);
      return;
    }

    if (DEV_MODE && data) {
      setMessages(prev => [...prev, data]);
      setConversations(prev => prev.map(c =>
        c.id === selectedConv.id ? { ...c, lastMessage: data } : c
      ));
    }

    setReplyTo(null);
    setSending(false);
  }, [input, sending, selectedConv, user, replyTo, editingMsg, uploadingFile]);

  const handleSelectConv = (conv) => {
    lastReadTimestamps.current[conv.id] = new Date().toISOString();
    manuallyReadRef.current.add(conv.id);
    unreadCountsRef.current[conv.id] = 0;
    markConversationRead(conv.id);
    setSelectedConv(conv);
    setReplyTo(null);
    setEditingMsg(null);
    setContextMenu(null);
  };

  const handleClearChat = async () => {
    if (!selectedConv || DEV_MODE) return;
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', selectedConv.id);
    if (!error) {
      setMessages([]);
      setConversations(prev => prev.map(c =>
        c.id === selectedConv.id ? { ...c, lastMessage: null } : c
      ));
    }
    setShowHeaderMenu(false);
    setShowClearConfirm(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      if (editingMsg) {
        setEditingMsg(null);
        setInput('');
        setTimeout(() => inputRef.current?.focus(), 0);
      } else if (replyTo) {
        setReplyTo(null);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  };

  const handleStartChat = async (member) => {
    setChatError('');

    const profileId = member.profileId || member.id;
    if (!profileId) {
      setChatError('Could not identify user');
      return;
    }

    if (myProfileId) {
      const existing = conversations.find(conv => {
        if (conv.is_group) return false;
        const otherIds = getOtherProfiles(conv, myProfileId).map(p => p.id);
        return otherIds.length === 1 && otherIds[0] === profileId;
      });

      if (existing) {
        setShowNewChat(false);
        handleSelectConv(existing);
        return;
      }
    }

    const { data: conv, error } = await getOrCreateDirectConversation(user, profileId);
    if (error || !conv) {
      setChatError(error?.message || 'Failed to start conversation');
      return;
    }

    setShowNewChat(false);

    const convs = await getConversations(user);
    setConversations(convs);
    const found = convs.find(c => c.id === conv.id);
    handleSelectConv(found || { ...conv, participantIds: [], participantsData: [], lastMessage: null });
  };

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    const menuHeight = 200;
    const y = e.clientY + menuHeight > window.innerHeight ? e.clientY - menuHeight : e.clientY;
    setContextMenu({ x: e.clientX, y, msg });
  };

  const handleReply = (msg) => {
    setReplyTo(msg);
    setEditingMsg(null);
    setContextMenu(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleEdit = (msg) => {
    setEditingMsg(msg);
    setReplyTo(null);
    setInput(msg.edited_content || msg.content || '');
    setContextMenu(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleDeleteForMe = async (msg) => {
    setContextMenu(null);
    if (DEV_MODE) return;
    await deleteMessageForMe(user, msg.id);
    setMessages(prev => prev.map(m =>
      m.id === msg.id ? { ...m, deleted_for_user_ids: [...(m.deleted_for_user_ids || []), myProfileId] } : m
    ));
  };

  const handleDeleteForEveryone = async (msg) => {
    setContextMenu(null);
    if (DEV_MODE) return;
    const { error } = await deleteMessageForEveryone(user, msg.id);
    if (!error) {
      setMessages(prev => prev.filter(m => m.id !== msg.id));
    } else {
      setChatError(error);
      setTimeout(() => setChatError(''), 3000);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConv) return;
    setUploadingFile(true);

    const { data, error } = await uploadFile(user, file);
    if (error || !data) {
      setChatError(error || 'Upload failed');
      setTimeout(() => setChatError(''), 3000);
      setUploadingFile(false);
      return;
    }

    const { error: sendErr } = await sendMessage(user, selectedConv.id, '', {
      fileUrl: data.url,
      fileType: data.type,
      fileName: data.name,
      replyTo: replyTo?.id || null,
    });

    if (sendErr) {
      setChatError(sendErr);
      setTimeout(() => setChatError(''), 3000);
    } else {
      setReplyTo(null);
    }

    setUploadingFile(false);
    e.target.value = '';
  };

  const canEdit = (msg) => {
    if (DEV_MODE) return true;
    if (msg.sender_id !== myProfileId) return false;
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    return new Date(msg.created_at) > twoHoursAgo;
  };

  const canDeleteForEveryone = (msg) => {
    if (DEV_MODE) return true;
    if (msg.sender_id !== myProfileId) return false;
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    return new Date(msg.created_at) > twoHoursAgo;
  };

  const isDeletedForMe = (msg) => {
    return (msg.deleted_for_user_ids || []).includes(myProfileId);
  };

  const filteredConvs = conversations.filter(conv => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = getConversationName(conv, myProfileId).toLowerCase();
    return name.includes(q);
  });

  const sortedConvs = [...filteredConvs].sort((a, b) => {
    const aTime = a.lastMessage?.created_at || a.created_at;
    const bTime = b.lastMessage?.created_at || b.created_at;
    return new Date(bTime) - new Date(aTime);
  });

  // Typing indicator text
  const typingText = useMemo(() => {
    const typingIds = Object.keys(typingProfiles);
    if (typingIds.length === 0) return null;
    const names = typingIds.map(id => {
      const p = messageSenders[id];
      return p?.email?.split('@')[0] || 'Someone';
    });
    if (names.length === 1) return `${names[0]} is typing`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;
    return `${names[0]} and ${names.length - 1} others are typing`;
  }, [typingProfiles, messageSenders]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-8">
      {/* Conversation List */}
      <div className={`${selectedConv ? 'hidden md:flex' : 'flex'} w-full md:w-80 bg-white border-r border-slate-200 flex-col`}>
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900">Messages</h2>
            <button
              onClick={() => { setShowNewChat(v => !v); setChatError(''); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {showNewChat && (
          <div className="border-b border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Start a conversation</p>
            {chatError && (
              <p className="text-xs text-red-600 mb-2 bg-red-50 px-2 py-1 rounded">{chatError}</p>
            )}
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {staffMembers.length === 0 ? (
                <p className="text-xs text-slate-400 py-2 text-center">No team members available</p>
              ) : (
                staffMembers.map((member) => {
                  const pid = member.profileId || member.id;
                  const initial = member.email?.charAt(0).toUpperCase() || '?';
                  return (
                    <button
                      key={member.id}
                      onClick={() => handleStartChat(member)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {initial}
                      </div>
                      <span className="truncate">{member.email?.split('@')[0] || member.email}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading conversations...</p>
            </div>
          ) : sortedConvs.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare size={28} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No conversations yet</p>
              <p className="text-xs text-slate-400 mt-1">Click the + button to start chatting</p>
            </div>
          ) : (
            sortedConvs.map((conv) => {
              const name = getConversationName(conv, myProfileId);
              const initial = name.charAt(0).toUpperCase();
              const isActive = selectedConv?.id === conv.id;
              const lastContent = messagePreview(conv.lastMessage);
              const lastTime = conv.lastMessage?.created_at || conv.created_at;

              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConv(conv)}
                  className={`w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50 ${
                    isActive ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    {(() => {
                      const otherProfiles = getOtherProfiles(conv, myProfileId);
                      const avatarUrl = !conv.is_group && otherProfiles[0]?.avatar_url;
                      return avatarUrl ? (
                        <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          conv.is_group ? 'bg-violet-600' : 'bg-blue-600'
                        }`}>
                          {initial}
                        </div>
                      );
                    })()}
                    {unreadMap[conv.id] > 0 && (
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
                      <span className="text-xs text-slate-400 shrink-0">{formatTime(lastTime)}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${unreadMap[conv.id] > 0 ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
                      {unreadMap[conv.id] > 1 ? `${unreadMap[conv.id]} new messages` : (lastContent || 'No messages yet')}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${!selectedConv ? 'hidden md:flex' : 'flex'} flex-1 flex-col`}>
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConv(null)}
                  className="md:hidden p-1 -ml-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <ArrowLeft size={20} />
                </button>
                {(() => {
                  const otherProfiles = getOtherProfiles(selectedConv, myProfileId);
                  const avatarUrl = !selectedConv.is_group && otherProfiles[0]?.avatar_url;
                  return avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {getConversationName(selectedConv, myProfileId).charAt(0).toUpperCase()}
                    </div>
                  );
                })()}
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {getConversationName(selectedConv, myProfileId)}
                  </p>
                  {typingText ? (
                    <p className="text-xs text-blue-600">{typingText}<span className="typing-dot ml-1" /><span className="typing-dot" /><span className="typing-dot" /></p>
                  ) : (
                    !selectedConv.is_group && <p className="text-xs text-emerald-600">Online</p>
                  )}
                  {selectedConv.is_group && (
                    <p className="text-xs text-slate-400">
                      {selectedConv.participantIds?.length || 0} members
                    </p>
                  )}
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowHeaderMenu(v => !v)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                >
                  <MoreVertical size={18} />
                </button>
                {showHeaderMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
                    <button
                      onClick={() => { setShowHeaderMenu(false); setShowClearConfirm(true); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                      Clear chat
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 bg-slate-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-slate-400">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {messages.map((msg, i) => {
                    if (isDeletedForMe(msg)) return null;

                    const prevMsg = i > 0 ? messages[i - 1] : null;
                    const showDate = shouldShowDateHeading(prevMsg?.created_at, msg.created_at);
                    const isMine = msg.sender_id === myProfileId;
                    const senderName = senderEmail(msg.sender_id, messageSenders);
                    const showSender = !isMine && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
                    const isEdited = !!msg.edited_at;
                    const hasFile = !!msg.file_url;
                    const isImg = isImage(msg.file_type);

                    const replyMsg = msg.reply_to ? messages.find(m => m.id === msg.reply_to) : null;

                    return (
                      <div key={msg.id} id={`msg-${msg.id}`}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="text-xs text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">
                              {formatDateHeading(msg.created_at)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}
                          onContextMenu={(e) => handleContextMenu(e, msg)}
                        >
                          <div className="max-w-[75%]">
                            {showSender && !isMine && (
                              <p className="text-xs text-slate-500 mb-1 ml-1">{senderName}</p>
                            )}
                            {/* Reply preview */}
                            {replyMsg && (
                              <div
                                className={`mb-1 px-3 py-1.5 rounded-lg text-xs border-l-2 border-blue-400 bg-opacity-50 cursor-pointer ${isMine ? 'bg-blue-500/10 ml-auto' : 'bg-slate-100'} max-w-[90%]`}
                                onClick={() => {
                                  const el = document.getElementById(`msg-${msg.reply_to}`);
                                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}
                              >
                                <p className="text-blue-600 font-medium text-[10px]">{senderEmail(replyMsg.sender_id, messageSenders)}</p>
                                <p className="text-slate-500 truncate">{replyMsg.content || (replyMsg.file_name ? '📎 ' + replyMsg.file_name : '')}</p>
                              </div>
                            )}
                            {/* File attachment */}
                            {hasFile && (
                              <div className={`mb-1 ${isMine ? 'text-right' : ''}`}>
                                {isImg ? (
                                  <div className="relative group inline-block">
                                    <img src={msg.file_url} alt={msg.file_name} className="max-w-64 max-h-64 rounded-lg object-cover border border-slate-200 cursor-pointer"
                                      onClick={() => window.open(msg.file_url, '_blank')} />
                                    <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <a href={msg.file_url} download={msg.file_name || 'image'}
                                        className="p-1.5 bg-black/60 rounded text-white text-xs hover:bg-black/80"
                                        title="Download">
                                        <File size={12} />
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => window.open(msg.file_url, '_blank')}
                                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer ${
                                      isMine ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    <File size={16} />
                                    <span className="truncate max-w-40">{msg.file_name || 'File'}</span>
                                    <a href={msg.file_url} download={msg.file_name}
                                      className={`p-0.5 rounded ${isMine ? 'hover:bg-blue-400' : 'hover:bg-slate-200'}`}
                                      title="Download"
                                      onClick={e => e.stopPropagation()}>
                                      <File size={12} />
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                            {msg.content && (
                              <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                                isMine
                                  ? 'bg-blue-600 text-white rounded-br-md'
                                  : 'bg-white text-slate-900 border border-slate-200 rounded-bl-md'
                              }`}>
                                {msg.content}
                              </div>
                            )}
                            <p className={`text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 ${isMine ? 'justify-end mr-1' : 'ml-1'}`}>
                              {isEdited && <span className="italic">edited</span>}
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Typing indicator */}
                  {typingText && (
                    <div className="flex justify-start mb-1">
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                          <span className="typing-dot" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Reply/Edit indicator */}
            {(replyTo || editingMsg) && (
              <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 flex items-center gap-2">
                <Reply size={14} className="text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  {editingMsg ? (
                    <p className="text-sm text-blue-700">
                      Editing message <span className="text-blue-400">·</span> press <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Esc</kbd> to cancel
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-blue-500 font-medium">Replying to {senderEmail(replyTo.sender_id, messageSenders)}</p>
                      <p className="text-xs text-slate-500 truncate">{replyTo.content || (replyTo.file_name ? '📎 ' + replyTo.file_name : '')}</p>
                    </>
                  )}
                </div>
                <button
                  onClick={() => { setReplyTo(null); setEditingMsg(null); setInput(''); }}
                  className="p-1 rounded hover:bg-blue-100 text-blue-400 hover:text-blue-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-slate-200 bg-white">
              {chatError && (
                <p className="text-xs text-red-600 mb-2 bg-red-50 px-3 py-1.5 rounded-lg">{chatError}</p>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-50"
                  title="Attach file"
                >
                  {uploadingFile ? (
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                  ) : (
                    <Paperclip size={20} />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => { setInput(e.target.value); broadcastTyping(); }}
                  onKeyDown={handleKeyDown}
                  placeholder={editingMsg ? 'Edit your message...' : replyTo ? 'Reply...' : 'Type a message...'}
                  disabled={sending || uploadingFile}
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !uploadingFile) || sending}
                  className="p-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <MessageSquare size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Select a conversation</p>
              <p className="text-sm text-slate-400 mt-1">Choose a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Clear Chat Confirm Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm mx-4 p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-100">
                <Trash2 size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Clear chat</h3>
                <p className="text-xs text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              All messages in this conversation will be permanently deleted for everyone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleClearChat}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-all"
              >
                Delete all messages
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-40 animate-fade-in"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => handleReply(contextMenu.msg)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Reply size={14} className="text-slate-400" />
            Reply
          </button>
          {canEdit(contextMenu.msg) && (
            <button
              onClick={() => handleEdit(contextMenu.msg)}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Edit3 size={14} className="text-slate-400" />
              Edit
            </button>
          )}
          <div className="border-t border-slate-100 my-1" />
          <button
            onClick={() => handleDeleteForMe(contextMenu.msg)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Trash2 size={14} className="text-slate-400" />
            Delete for me
          </button>
          {canDeleteForEveryone(contextMenu.msg) && (
            <button
              onClick={() => handleDeleteForEveryone(contextMenu.msg)}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} className="text-red-400" />
              Delete for everyone
            </button>
          )}
        </div>
      )}
    </div>
  );
}
