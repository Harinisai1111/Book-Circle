import { supabase } from '../supabaseClient';
import { Message } from '../types';

export interface Conversation {
    userId: string;
    userName: string;
    userAvatar: string;
    lastMessage: string;
    lastMessageTime: number;
    unreadCount: number;
}

/**
 * Get all conversations for a user
 */
export async function getConversations(userId: string): Promise<Conversation[]> {
    try {
        // Get all unique conversation partners
        const { data: messages, error } = await supabase
            .from('messages')
            .select('sender_id, receiver_id, text, created_at')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by conversation partner
        const conversationMap = new Map<string, any>();

        messages.forEach((msg: any) => {
            const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;

            if (!conversationMap.has(partnerId)) {
                conversationMap.set(partnerId, {
                    userId: partnerId,
                    lastMessage: msg.text,
                    lastMessageTime: new Date(msg.created_at).getTime(),
                });
            }
        });

        // Fetch user details for each partner
        const partnerIds = Array.from(conversationMap.keys());
        const { data: users } = await supabase
            .from('users')
            .select('id, name, avatar')
            .in('id', partnerIds);

        const conversations: Conversation[] = [];
        conversationMap.forEach((conv, partnerId) => {
            const user = users?.find((u: any) => u.id === partnerId);
            if (user) {
                conversations.push({
                    userId: partnerId,
                    userName: user.name,
                    userAvatar: user.avatar,
                    lastMessage: conv.lastMessage,
                    lastMessageTime: conv.lastMessageTime,
                    unreadCount: 0, // TODO: implement unread tracking
                });
            }
        });

        return conversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return [];
    }
}

/**
 * Get messages between two users and mark them as read
 */
export async function getMessages(userId1: string, userId2: string): Promise<Message[]> {
    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Mark messages sent to userId1 by userId2 as read
        await supabase
            .from('messages')
            .update({ is_read: true })
            .match({ receiver_id: userId1, sender_id: userId2, is_read: false });

        return data.map((msg: any) => ({
            id: msg.id,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            text: msg.text,
            imageUrl: msg.image_url,
            isRead: msg.is_read,
            createdAt: new Date(msg.created_at).getTime(),
        }));
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
}

/**
 * Get total unread messages count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
    try {
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return count || 0;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
    }
}

/**
 * Send a message
 */
export async function sendMessage(
    senderId: string,
    receiverId: string,
    text: string,
    imageUrl?: string
): Promise<Message | null> {
    try {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                sender_id: senderId,
                receiver_id: receiverId,
                text,
                image_url: imageUrl,
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            senderId: data.sender_id,
            receiverId: data.receiver_id,
            text: data.text,
            imageUrl: data.image_url,
            createdAt: new Date(data.created_at).getTime(),
        };
    } catch (error) {
        console.error('Error sending message:', error);
        return null;
    }
}

/**
 * Subscribe to real-time messages for a user
 */
export function subscribeToMessages(userId: string, callback: (message: Message) => void) {
    const channel = supabase
        .channel(`messages-${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
            },
            (payload) => {
                const msg = payload.new;
                // Only trigger callback if the user is involved in the message
                if (msg.sender_id === userId || msg.receiver_id === userId) {
                    callback({
                        id: msg.id,
                        senderId: msg.sender_id,
                        receiverId: msg.receiver_id,
                        text: msg.text,
                        imageUrl: msg.image_url,
                        createdAt: new Date(msg.created_at).getTime(),
                    });
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

