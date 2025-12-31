import { supabase } from '../supabaseClient';
import { User } from '../types';

export interface ClerkUser {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string;
    emailAddresses: Array<{ emailAddress: string }>;
}

/**
 * Sync Clerk user with Supabase users table
 */
export async function syncClerkUser(clerkUser: ClerkUser): Promise<User | null> {
    try {
        const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Reader';
        const handle = clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] || `user${clerkUser.id.slice(0, 8)}`;

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', clerkUser.id)
            .single();

        if (existingUser) {
            // Update existing user
            const { data, error } = await supabase
                .from('users')
                .update({
                    name,
                    avatar: clerkUser.imageUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', clerkUser.id)
                .select()
                .single();

            if (error) throw error;
            return data as User;
        } else {
            // Create new user
            const { data, error } = await supabase
                .from('users')
                .insert({
                    id: clerkUser.id,
                    name,
                    handle,
                    avatar: clerkUser.imageUrl,
                    bio: 'Coffee and books.',
                    favorite_genres: ['Fiction'],
                })
                .select()
                .single();

            if (error) throw error;
            return data as User;
        }
    } catch (error) {
        console.error('Error syncing Clerk user:', error);
        return null;
    }
}

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<User | null> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data as User;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

/**
 * Get all users (for messaging, etc.)
 */
export async function getAllUsers(): Promise<User[]> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as User[];
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

/**
 * Update user profile
 */
export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data as User;
    } catch (error) {
        console.error('Error updating user:', error);
        return null;
    }
}

/**
 * Get user's posts
 */
export async function getUserPosts(userId: string) {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching user posts:', error);
        return [];
    }
}
