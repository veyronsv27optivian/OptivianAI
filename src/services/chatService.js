import { supabase } from './supabase';

const DEV_MODE = !import.meta.env.VITE_SUPABASE_URL;
const DEV_CONVERSATIONS_KEY = 'optivian_dev_conversations';
const DEV_MESSAGES_KEY = 'optivian_dev_messages';

function devGet(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
}

function devSet(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getDevProfile(user) {
  const profiles = devGet('optivian_dev_profiles');
  return profiles.find(p => p.user_id === user.id) || null;
}

export async function getConversations(user) {
  if (!user) return [];

  if (DEV_MODE) {
    const myProfile = getDevProfile(user);
    if (!myProfile) return [];

    const conversations = devGet(DEV_CONVERSATIONS_KEY);
    const profiles = devGet('optivian_dev_profiles');
    const myConvIds = new Set();

    for (const conv of conversations) {
      const parts = devGet(`${DEV_CONVERSATIONS_KEY}_participants_${conv.id}`);
      if (parts && parts.includes(myProfile.id)) {
        myConvIds.add(conv.id);
      }
    }

    return Array.from(myConvIds).map(id => {
      const conv = conversations.find(c => c.id === id);
      const participantIds = devGet(`${DEV_CONVERSATIONS_KEY}_participants_${conv.id}`) || [];
      const messages = devGet(`${DEV_MESSAGES_KEY}_${conv.id}`) || [];
      const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
      const otherIds = participantIds.filter(pid => pid !== myProfile.id);
      const otherProfiles = profiles.filter(p => otherIds.includes(p.id));

      return { ...conv, participantIds, participantsData: otherProfiles, lastMessage: lastMsg };
    });
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return [];

    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('profile_id', profile.id);

    if (!participations || participations.length === 0) return [];

    const convIds = participations.map(p => p.conversation_id);

    const { data: conversations } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('created_at', { ascending: false });

    const enriched = await Promise.all((conversations || []).map(async (conv) => {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('profile_id')
        .eq('conversation_id', conv.id);

      const pIds = (participants || []).map(p => p.profile_id);

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', pIds);

      const { data: lastMsgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);

      return {
        ...conv,
        participantIds: pIds,
        participantsData: profilesData || [],
        lastMessage: lastMsgs?.[0] || null,
      };
    }));

    return enriched;
  } catch (err) {
    console.error('Failed to load conversations:', err);
    return [];
  }
}

export async function getMessages(user, conversationId) {
  if (!user || !conversationId) return [];

  if (DEV_MODE) {
    return devGet(`${DEV_MESSAGES_KEY}_${conversationId}`) || [];
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to load messages:', err);
    return [];
  }
}

export async function sendMessage(user, conversationId, content, opts = {}) {
  if (!user || !conversationId) return { error: 'Invalid input' };
  const { replyTo, fileUrl, fileType, fileName } = opts;

  if (DEV_MODE) {
    const profile = getDevProfile(user);
    if (!profile) return { error: 'Profile not found' };

    const messages = devGet(`${DEV_MESSAGES_KEY}_${conversationId}`);
    const newMsg = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      sender_id: profile.id,
      content: content?.trim() || '',
      reply_to: replyTo || null,
      file_url: fileUrl || null,
      file_type: fileType || null,
      file_name: fileName || null,
      deleted_for_user_ids: [],
      created_at: new Date().toISOString(),
    };
    messages.push(newMsg);
    devSet(`${DEV_MESSAGES_KEY}_${conversationId}`, messages);
    return { data: newMsg, error: null };
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return { error: 'Profile not found' };

    const insertData = {
      conversation_id: conversationId,
      sender_id: profile.id,
      content: content?.trim() || null,
    };
    if (replyTo) insertData.reply_to = replyTo;
    if (fileUrl) insertData.file_url = fileUrl;
    if (fileType) insertData.file_type = fileType;
    if (fileName) insertData.file_name = fileName;

    const { data, error } = await supabase
      .from('messages')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('Failed to send message:', err);
    return { error: err.message };
  }
}

export async function editMessage(user, messageId, newContent) {
  if (!user || !messageId || !newContent?.trim()) return { error: 'Invalid input' };

  if (DEV_MODE) return { error: 'Edit not supported in dev mode' };

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return { error: 'Profile not found' };

    const { data, error } = await supabase
      .from('messages')
      .update({
        edited_at: new Date().toISOString(),
        edited_content: newContent.trim(),
      })
      .eq('id', messageId)
      .eq('sender_id', profile.id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('Failed to edit message:', err);
    return { error: err.message };
  }
}

export async function deleteMessageForMe(user, messageId) {
  if (!user || !messageId) return { error: 'Invalid input' };

  if (DEV_MODE) return { error: 'Delete for me not supported in dev mode' };

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return { error: 'Profile not found' };

    const { data: msg } = await supabase
      .from('messages')
      .select('deleted_for_user_ids')
      .eq('id', messageId)
      .single();

    if (!msg) return { error: 'Message not found' };

    const current = msg.deleted_for_user_ids || [];
    if (current.includes(profile.id)) return { data: msg, error: null };

    const { data, error } = await supabase
      .from('messages')
      .update({ deleted_for_user_ids: [...current, profile.id] })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('Failed to delete message for me:', err);
    return { error: err.message };
  }
}

export async function deleteMessageForEveryone(user, messageId) {
  if (!user || !messageId) return { error: 'Invalid input' };

  if (DEV_MODE) return { error: 'Delete for everyone not supported in dev mode' };

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return { error: 'Profile not found' };

    const { data: msg } = await supabase
      .from('messages')
      .select('created_at, sender_id')
      .eq('id', messageId)
      .single();

    if (!msg) return { error: 'Message not found' };
    if (msg.sender_id !== profile.id) return { error: 'Not your message' };

    // Check 2-hour limit
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const msgTime = new Date(msg.created_at);
    if (msgTime < twoHoursAgo) return { error: 'Can only delete messages within 2 hours' };

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', profile.id);

    if (error) throw error;
    return { data: { id: messageId, deleted: true }, error: null };
  } catch (err) {
    console.error('Failed to delete message:', err);
    return { error: err.message };
  }
}

export async function uploadFile(user, file) {
  if (!user || !file) return { error: 'Invalid input' };

  if (DEV_MODE) return { error: 'File upload not supported in dev mode' };

  try {
    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('chat_files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('chat_files')
      .getPublicUrl(data.path);

    return { data: { url: urlData.publicUrl, path: data.path, name: file.name, type: file.type }, error: null };
  } catch (err) {
    console.error('Failed to upload file:', err);
    return { error: err.message };
  }
}

export async function createConversation(user, participantIds, name = null, isGroup = false) {
  if (!user || !participantIds?.length) return { error: 'Invalid input' };

  if (DEV_MODE) {
    const myProfile = getDevProfile(user);
    const conversations = devGet(DEV_CONVERSATIONS_KEY);
    const newConv = {
      id: crypto.randomUUID(),
      name,
      is_group: isGroup,
      created_by: myProfile?.id || null,
      created_at: new Date().toISOString(),
    };
    conversations.push(newConv);
    devSet(DEV_CONVERSATIONS_KEY, conversations);
    devSet(`${DEV_CONVERSATIONS_KEY}_participants_${newConv.id}`, participantIds);
    devSet(`${DEV_MESSAGES_KEY}_${newConv.id}`, []);
    return { data: newConv, error: null };
  }

  try {
    // Use the RPC function which runs with SECURITY DEFINER (bypasses RLS)
    const { data, error } = await supabase.rpc('create_conversation_rpc', {
      p_name: name,
      p_is_group: isGroup,
      p_participant_ids: participantIds,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    console.error('Failed to create conversation:', err);
    return { error: err.message };
  }
}

export async function getOrCreateDirectConversation(user, otherProfileId) {
  if (!user || !otherProfileId) return { error: 'Invalid input' };

  if (DEV_MODE) {
    const myProfile = getDevProfile(user);
    if (!myProfile) return { error: 'Profile not found' };

    const conversations = devGet(DEV_CONVERSATIONS_KEY);
    for (const conv of conversations) {
      if (conv.is_group) continue;
      const parts = devGet(`${DEV_CONVERSATIONS_KEY}_participants_${conv.id}`) || [];
      if (parts.includes(myProfile.id) && parts.includes(otherProfileId)) {
        return { data: conv, error: null };
      }
    }
    return await createConversation(user, [myProfile.id, otherProfileId], null, false);
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return { error: 'Profile not found' };

    const { data: myParts } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('profile_id', profile.id);

    if (myParts?.length > 0) {
      const convIds = myParts.map(p => p.conversation_id);

      const { data: otherParts } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .in('conversation_id', convIds)
        .eq('profile_id', otherProfileId);

      if (otherParts?.length > 0) {
        const { data: conv } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', otherParts[0].conversation_id)
          .eq('is_group', false)
          .maybeSingle();

        if (conv) return { data: conv, error: null };
      }
    }

    return await createConversation(user, [profile.id, otherProfileId], null, false);
  } catch (err) {
    console.error('Failed to get/create DM:', err);
    return { error: err.message };
  }
}
