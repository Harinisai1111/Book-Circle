import { supabase } from '../supabaseClient';
import { GroupMessage } from '../types';

/**
 * Get messages for a community
 */
export async function getCommunityMessages(communityId: string): Promise<GroupMessage[]> {
    try {
        const { data, error } = await supabase
            .from('community_messages')
            .select('*, users(name, avatar)')
            .eq('community_id', communityId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data.map(transformGroupMessage);
    } catch (error) {
        console.error('Error fetching community messages:', error);
        return [];
    }
}

/**
 * Send a message to a community
 */
export async function sendCommunityMessage(communityId: string, userId: string, text: string, imageUrl?: string): Promise<GroupMessage | null> {
    try {
        const { data, error } = await supabase
            .from('community_messages')
            .insert({
                community_id: communityId,
                user_id: userId,
                text,
                image_url: imageUrl,
            })
            .select()
            .single();


        if (error) throw error;
        return transformGroupMessage(data);
    } catch (error) {
        console.error('Error sending community message:', error);
        return null;
    }
}

/**
 * Subscribe to real-time community messages
 */
export function subscribeToCommunityMessages(communityId: string, callback: (message: GroupMessage) => void) {
    const channel = supabase
        .channel(`community-${communityId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'community_messages',
                filter: `community_id=eq.${communityId}`
            },
            async (payload) => {
                // Fetch user details for the new message as joins don't work in real-time payloads
                const { data: userData } = await supabase
                    .from('users')
                    .select('name, avatar')
                    .eq('id', payload.new.user_id)
                    .single();

                const fullMsg = {
                    ...payload.new,
                    users: userData
                };
                callback(transformGroupMessage(fullMsg));
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Transform database message to app GroupMessage type
 */
function transformGroupMessage(dbMsg: any): GroupMessage {
    return {
        id: dbMsg.id,
        communityId: dbMsg.community_id,
        userId: dbMsg.user_id,
        userName: dbMsg.users?.name || 'Reader',
        userAvatar: dbMsg.users?.avatar,
        text: dbMsg.text,
        imageUrl: dbMsg.image_url,
        createdAt: new Date(dbMsg.created_at).getTime(),
    };
}
