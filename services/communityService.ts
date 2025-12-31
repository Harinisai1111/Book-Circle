import { supabase } from '../supabaseClient';
import { Community } from '../types';

/**
 * Get all communities
 */
export async function getCommunities(): Promise<Community[]> {
    try {
        const { data, error } = await supabase
            .from('communities')
            .select(`
        *,
        community_members(user_id)
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((community: any) => ({
            id: community.id,
            name: community.name,
            description: community.description,
            category: community.category,
            image: community.image,
            members: community.community_members?.map((m: any) => m.user_id) || [],
        }));
    } catch (error) {
        console.error('Error fetching communities:', error);
        return [];
    }
}

/**
 * Get single community by ID
 */
export async function getCommunity(communityId: string): Promise<Community | null> {
    try {
        const { data, error } = await supabase
            .from('communities')
            .select(`
        *,
        community_members(user_id)
      `)
            .eq('id', communityId)
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            description: data.description,
            category: data.category,
            image: data.image,
            members: data.community_members?.map((m: any) => m.user_id) || [],
        };
    } catch (error) {
        console.error('Error fetching community:', error);
        return null;
    }
}

/**
 * Join a community
 */
export async function joinCommunity(communityId: string, userId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('community_members')
            .insert({
                community_id: communityId,
                user_id: userId,
            });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error joining community:', error);
        return false;
    }
}

/**
 * Leave a community
 */
export async function leaveCommunity(communityId: string, userId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('community_members')
            .delete()
            .eq('community_id', communityId)
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error leaving community:', error);
        return false;
    }
}

/**
 * Create a new community
 */
export async function createCommunity(
    name: string,
    description: string,
    category: string,
    image: string,
    createdBy: string
): Promise<Community | null> {
    try {
        const { data, error } = await supabase
            .from('communities')
            .insert({
                name,
                description,
                category,
                image,
                created_by: createdBy,
            })
            .select()
            .single();

        if (error) throw error;

        // Auto-join creator
        await joinCommunity(data.id, createdBy);

        return {
            id: data.id,
            name: data.name,
            description: data.description,
            category: data.category,
            image: data.image,
            members: [createdBy],
        };
    } catch (error) {
        console.error('Error creating community:', error);
        return null;
    }
}

/**
 * Check if user is member of community
 */
export async function isMember(communityId: string, userId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('community_members')
            .select('*')
            .eq('community_id', communityId)
            .eq('user_id', userId)
            .single();

        if (error) return false;
        return !!data;
    } catch (error) {
        return false;
    }
}
