import { supabase } from '../supabaseClient';
import { Post, Book } from '../types';

export interface CreatePostData {
    userId: string;
    book: Book;
    caption?: string;
    page?: number;
    mood?: string;
    imageUrl?: string;
    isPublic?: boolean;
}

/**
 * Create a new post
 */
export async function createPost(data: CreatePostData): Promise<Post | null> {
    try {
        const { data: post, error } = await supabase
            .from('posts')
            .insert({
                user_id: data.userId,
                book_key: data.book.key,
                book_title: data.book.title,
                book_author: data.book.author_name?.[0] || 'Unknown',
                book_cover_url: data.book.cover_url,
                book_description: data.book.description,
                book_subjects: data.book.subjects || [],
                caption: data.caption || '',
                page_number: data.page,
                mood: data.mood,
                image_url: data.imageUrl,
                is_public: data.isPublic ?? true,
            })
            .select()
            .single();

        if (error) throw error;
        return transformPost(post);
    } catch (error) {
        console.error('Error creating post:', error);
        return null;
    }
}

/**
 * Get posts for feed with pagination (Only public posts)
 */
export async function getPosts(limit: number = 20, offset: number = 0): Promise<Post[]> {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select(`
        *,
        likes:likes(user_id),
        comments:comments(
          id,
          user_id,
          text,
          created_at
        )
      `)
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data.map(transformPost);
    } catch (error) {
        console.error('Error fetching posts:', error);
        return [];
    }
}

/**
 * Get single post by ID
 */
export async function getPost(postId: string): Promise<Post | null> {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select(`
        *,
        likes:likes(user_id),
        comments:comments(
          id,
          user_id,
          text,
          created_at
        )
      `)
            .eq('id', postId)
            .single();

        if (error) throw error;
        return transformPost(data);
    } catch (error) {
        console.error('Error fetching post:', error);
        return null;
    }
}

/**
 * Toggle like on a post
 */
export async function toggleLike(postId: string, userId: string): Promise<boolean> {
    try {
        // Check if already liked
        const { data: existingLike } = await supabase
            .from('likes')
            .select('*')
            .eq('post_id', postId)
            .eq('user_id', userId)
            .single();

        if (existingLike) {
            // Unlike
            const { error } = await supabase
                .from('likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', userId);

            if (error) throw error;
            return false;
        } else {
            // Like
            const { error } = await supabase
                .from('likes')
                .insert({ post_id: postId, user_id: userId });

            if (error) throw error;
            return true;
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        return false;
    }
}

/**
 * Add comment to post
 */
export async function addComment(postId: string, userId: string, text: string) {
    try {
        const { data, error } = await supabase
            .from('comments')
            .insert({
                post_id: postId,
                user_id: userId,
                text,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error adding comment:', error);
        return null;
    }
}

/**
 * Delete post
 */
export async function deletePost(postId: string, userId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting post:', error);
        return false;
    }
}

/**
 * Subscribe to real-time post updates
 */
export function subscribeToPostUpdates(callback: (payload: { event: string, post?: Post, postId?: string }) => void) {
    const channel = supabase
        .channel('posts-all-changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'posts' },
            (payload) => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    callback({ event: payload.eventType, post: transformPost(payload.new) });
                } else if (payload.eventType === 'DELETE') {
                    callback({ event: 'DELETE', postId: payload.old.id });
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Subscribe to likes for a post
 */
export function subscribeToLikes(callback: (payload: { event: string, like: any }) => void) {
    const channel = supabase
        .channel('likes-changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'likes' },
            (payload) => {
                callback({
                    event: payload.eventType,
                    like: payload.eventType === 'DELETE' ? payload.old : payload.new
                });
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}


/**
 * Subscribe to comments for a post
 */
export function subscribeToComments(postId: string, callback: (comment: any) => void) {
    const channel = supabase
        .channel(`comments-${postId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'comments',
                filter: `post_id=eq.${postId}`
            },
            (payload) => {
                callback({
                    id: payload.new.id,
                    userId: payload.new.user_id,
                    text: payload.new.text,
                    createdAt: new Date(payload.new.created_at).getTime(),
                });
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Subscribe to all comments (for feed updates)
 */
export function subscribeToAllComments(callback: (comment: any) => void) {
    const channel = supabase
        .channel('all-comments-channel')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'comments',
            },
            (payload) => {
                callback({
                    id: payload.new.id,
                    postId: payload.new.post_id,
                    userId: payload.new.user_id,
                    text: payload.new.text,
                    createdAt: new Date(payload.new.created_at).getTime(),
                });
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Transform database post to app Post type
 */

function transformPost(dbPost: any): Post {
    return {
        id: dbPost.id,
        userId: dbPost.user_id,
        book: {
            key: dbPost.book_key,
            title: dbPost.book_title,
            author_name: [dbPost.book_author],
            cover_url: dbPost.book_cover_url,
            description: dbPost.book_description,
            subjects: dbPost.book_subjects || [],
        },
        caption: dbPost.caption,
        page: dbPost.page_number,
        mood: dbPost.mood,
        imageUrl: dbPost.image_url,
        isPublic: dbPost.is_public,
        likes: dbPost.likes?.map((l: any) => l.user_id) || [],
        comments: dbPost.comments?.map((c: any) => ({
            id: c.id,
            userId: c.user_id,
            text: c.text,
            createdAt: new Date(c.created_at).getTime(),
        })) || [],
        createdAt: new Date(dbPost.created_at).getTime(),
    };
}


/**
 * Get all posts for a specific user (including private ones) for My Shelf
 */
export async function getUserPosts(userId: string): Promise<Post[]> {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                likes:likes(user_id),
                comments:comments(id, user_id, text, created_at)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(transformPost);
    } catch (error) {
        console.error('Error fetching user posts:', error);
        return [];
    }
}
