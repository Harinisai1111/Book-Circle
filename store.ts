
import { User, Post, Community, Message } from './types';

// Initial Mock Data
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice Reading', handle: 'alice_reads', avatar: 'https://picsum.photos/seed/u1/200', bio: 'Coffee and Classics.', favoriteGenres: ['Classic', 'Mystery'], readingNow: '/works/OL82563W' },
  { id: 'u2', name: 'Julian Barnes', handle: 'jules_b', avatar: 'https://picsum.photos/seed/u2/200', bio: 'Always in a different world.', favoriteGenres: ['Sci-Fi', 'Fantasy'], readingNow: '/works/OL27479W' },
  { id: 'u3', name: 'Sarah Scribbles', handle: 'sarah_books', avatar: 'https://picsum.photos/seed/u3/200', bio: 'Writer by day, reader by night.', favoriteGenres: ['Romance', 'Poetry'] },
];

export const MOCK_COMMUNITIES: Community[] = [
  { id: 'c1', name: 'The Fantasy Realm', description: 'Discuss all things magic and dragons.', members: ['u1', 'u2'], category: 'Genre', image: 'https://picsum.photos/seed/fantasy/400/200' },
  { id: 'c2', name: 'Night Readers', description: 'For those who stay up till 3 AM finishing a chapter.', members: ['u1', 'u3'], category: 'Reading Style', image: 'https://picsum.photos/seed/night/400/200' },
  { id: 'c3', name: 'Cozy Mysteries', description: 'Tea, cats, and a dead body in a manor.', members: ['u2', 'u3'], category: 'Genre', image: 'https://picsum.photos/seed/mystery/400/200' },
];

const STORAGE_KEY = 'bookcircle_data_v1';

export const getStore = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) return JSON.parse(data);
  return {
    isLoggedIn: false, // New property for auth flow
    currentUser: MOCK_USERS[0],
    users: MOCK_USERS,
    posts: [] as Post[],
    communities: MOCK_COMMUNITIES,
    messages: [] as Message[],
  };
};

export const saveStore = (data: any) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};
