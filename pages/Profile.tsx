import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Post } from '../types';
import { getUserPosts } from '../services/postService';
import { BookOpen, Globe, Lock, Clock, Star, MapPin, Coffee } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadShelf = async () => {
      if (!user) return;
      setLoading(true);
      const userPosts = await getUserPosts(user.id);
      setPosts(userPosts);
      setLoading(false);
    };

    loadShelf();
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ff7a59] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#3e2723] font-bold">Organizing your shelf...</p>
        </div>
      </div>
    );
  }

  const publicCount = posts.filter(p => p.isPublic).length;
  const privateCount = posts.filter(p => !p.isPublic).length;

  return (
    <div className="max-w-5xl mx-auto pb-32">
      {/* Profile Header */}
      <div className="bg-white rounded-[3rem] p-10 border-4 border-[#fff5f0] shadow-xl shadow-clay/5 mb-12 animate-in fade-in slide-in-from-top-4">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="relative group">
            <div className="absolute inset-0 grad-sunset blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <img
              src={user?.imageUrl}
              alt={user?.fullName || 'Reader'}
              className="w-40 h-40 rounded-[2.5rem] border-4 border-white object-cover shadow-2xl relative z-10"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-4xl font-black text-[#3e2723] playfair mb-6">{user?.fullName}</h2>

            <div className="grid grid-cols-3 gap-6">
              <div className="bg-[#fffcf9] p-5 rounded-[2rem] border-2 border-[#fff5f0] text-center">
                <p className="text-small font-black text-[#ff7a59] uppercase tracking-widest mb-1">Books</p>
                <p className="text-2xl font-black text-[#3e2723]">{posts.length}</p>
              </div>
              <div className="bg-white p-5 rounded-[2rem] border-2 border-[#fff5f0] text-center shadow-sm">
                <p className="text-small font-black text-[#7eb67d] uppercase tracking-widest mb-1">Public</p>
                <p className="text-2xl font-black text-[#3e2723]">{publicCount}</p>
              </div>
              <div className="bg-indigo-50 p-5 rounded-[2rem] border-2 border-indigo-100 text-center">
                <p className="text-small font-black text-indigo-500 uppercase tracking-widest mb-1">Private</p>
                <p className="text-2xl font-black text-[#3e2723]">{privateCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My Shelf Section */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-black text-[#3e2723] playfair">My Virtual Shelf</h3>
          <p className="text-[#8d6e63] font-bold uppercase text-[10px] tracking-[0.2em] mt-1">A museum of your literary journeys</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-xs font-black text-[#ff7a59] bg-white px-4 py-2 rounded-full border-2 border-[#fff5f0]">
            <Star size={14} className="fill-current" /> Curated
          </div>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-[#fff5f0] border-dashed">
          <BookOpen className="text-[#ffe0cc] mx-auto mb-4" size={48} />
          <p className="text-xl font-black text-[#8d6e63]">Your shelf is waiting for its first story.</p>
          <p className="text-sm font-medium text-[#ff7a59] mt-2 tracking-wide uppercase">Add a post to see your collection grow!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {posts.map((post, i) => (
            <div
              key={post.id}
              className="bg-white p-4 rounded-[2.5rem] border-2 border-[#fff5f0] shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all group animate-in zoom-in-95"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="relative aspect-[2/3] mb-5 overflow-hidden rounded-[1.5rem] shadow-md">
                <img
                  src={post.book.cover_url}
                  alt={post.book.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {post.isPublic ? (
                    <div className="bg-white/90 backdrop-blur p-2 rounded-xl text-[#7eb67d] shadow-sm">
                      <Globe size={14} />
                    </div>
                  ) : (
                    <div className="bg-indigo-500/90 backdrop-blur p-2 rounded-xl text-white shadow-sm">
                      <Lock size={14} />
                    </div>
                  )}
                </div>
                {post.page && (
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-[10px] font-black text-[#3e2723] shadow-sm">
                    P. {post.page}
                  </div>
                )}
              </div>
              <h4 className="font-black text-[#3e2723] text-sm leading-tight line-clamp-2 mb-1 border-l-4 border-[#ff7a59] pl-3">
                {post.book.title}
              </h4>
              <p className="text-[10px] font-bold text-[#ff7a59] pl-4 italic truncate">
                {post.book.author_name?.[0]}
              </p>

              <div className="mt-4 flex items-center justify-between pt-4 border-t border-[#fff5f0]">
                <div className="flex items-center gap-1.5 text-[#a1887f]">
                  <Clock size={12} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {post.mood && (
                  <span className="text-[9px] font-black uppercase text-[#ff7a59] bg-[#fff5f0] px-2 py-0.5 rounded-lg">
                    {post.mood}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
