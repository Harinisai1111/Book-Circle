
export interface Book {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  cover_url?: string;
  description?: string;
  subjects?: string[];
}

export interface User {
  id: string; // Clerk user ID
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  favoriteGenres: string[];
  readingNow?: string; // Book key
  created_at?: string;
  updated_at?: string;
}

export interface Post {
  id: string;
  userId: string;
  book: Book;
  caption: string;
  page?: number;
  mood?: string;
  imageUrl?: string;
  likes: string[]; // User IDs
  comments: Comment[];
  isPublic: boolean;
  createdAt: number;
}

export interface GroupMessage {
  id: string;
  communityId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  text: string;
  imageUrl?: string;
  createdAt: number;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: number;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  members: string[]; // User IDs
  category: string;
  image: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  imageUrl?: string;
  isRead?: boolean;
  createdAt: number;
}
