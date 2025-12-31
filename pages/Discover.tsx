import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../services/userService';
import { getUserPosts } from '../services/postService';
import { searchBooks } from '../openLibraryService';
import { User, Post, Book } from '../types';
import { Search, Sparkles, TrendingUp, Compass, Book as BookIcon, Zap, Loader2, ExternalLink, Users, Globe, Lock, Clock, X, ChevronRight, Ghost } from 'lucide-react';
import { ReliableImage } from '../components/ReliableImage';


export const Discover: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [bookResults, setBookResults] = useState<Book[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserPosts, setSelectedUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      const users = await getAllUsers();
      setAllUsers(users);
    };
    loadUsers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setSearching(true);
        const results = await searchBooks(searchQuery);
        setBookResults(results);
        setSearching(false);
      } else {
        setBookResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);



  const handleUserSelect = async (user: User) => {
    setSelectedUser(user);
    setLoadingPosts(true);
    const posts = await getUserPosts(user.id);
    // Filter only public posts
    setSelectedUserPosts(posts.filter(p => p.isPublic));
    setLoadingPosts(false);
  };

  const filteredUsers = searchQuery.length > 1
    ? allUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="max-w-5xl mx-auto pb-32">
      <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <h2 className="text-6xl font-black text-[#3e2723] mb-4 playfair tracking-tight">The Emporium</h2>
        <p className="text-[#ff7a59] font-black text-xl uppercase tracking-[0.2em]">Seek and you shall find.</p>
      </div>

      <div className="relative mb-8 group">
        <div className="absolute inset-0 grad-sunset blur-2xl opacity-10 group-focus-within:opacity-20 transition-opacity rounded-[4rem] pointer-events-none"></div>
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-[#ff7a59] pointer-events-none z-20" size={32} />
        <input
          type="text"
          placeholder="Search readers or book vibes..."
          className="w-full pl-20 pr-10 py-8 rounded-[3.5rem] border-4 border-[#fff5f0] bg-white shadow-2xl shadow-clay/10 focus:border-[#ff7a59] transition-all focus:outline-none font-bold text-2xl placeholder:text-[#8d6e63]/40 relative z-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* User Search Results */}
      {filteredUsers.length > 0 && !selectedUser && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 animate-in slide-in-from-top-4">
          {filteredUsers.map(u => (
            <button
              key={u.id}
              onClick={() => handleUserSelect(u)}
              className="flex items-center gap-5 p-6 bg-white rounded-[2.5rem] border-2 border-[#fff5f0] hover:border-[#ff7a59] transition-all text-left shadow-lg hover:shadow-2xl group"
            >
              <img src={u.avatar} alt={u.name} className="w-16 h-16 rounded-2xl object-cover shadow-md group-hover:scale-110 transition-transform" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-[#3e2723] text-lg truncate leading-tight">{u.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Globe size={12} className="text-[#7eb67d]" />
                  <p className="text-[10px] font-black text-[#7eb67d] uppercase tracking-widest">View Public Shelf</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-[#ffe0cc] group-hover:text-[#ff7a59] transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* Selected User's Shelf View */}
      {selectedUser && (
        <div className="bg-white rounded-[4rem] border-4 border-[#fff5f0] p-10 mb-16 shadow-2xl animate-in zoom-in-95">
          <div className="flex justify-between items-start mb-12">
            <div className="flex items-center gap-8">
              <img src={selectedUser.avatar} alt={selectedUser.name} className="w-24 h-24 rounded-[2rem] object-cover shadow-xl border-4 border-white ring-4 ring-[#fffaf8]" />
              <div>
                <h3 className="text-4xl font-black text-[#3e2723] playfair">{selectedUser.name}'s Shelf</h3>
                <p className="text-[#ff7a59] font-black uppercase text-xs tracking-widest mt-2">Public Collection</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="p-4 bg-[#fff5f0] text-[#ff7a59] rounded-2xl hover:bg-[#ff7a59] hover:text-white transition-all shadow-sm"
            >
              <X size={24} />
            </button>
          </div>

          {loadingPosts ? (
            <div className="text-center py-20">
              <Loader2 className="animate-spin text-[#ff7a59] mx-auto mb-4" size={40} />
              <p className="font-bold text-[#3e2723]">Scanning the library...</p>
            </div>
          ) : selectedUserPosts.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <BookIcon size={48} className="mx-auto mb-4 text-[#ff7a59]" />
              <p className="font-black italic">This reader's shelf is private or empty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {selectedUserPosts.map((post, i) => (
                <div key={post.id} className="group animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="relative aspect-[2/3] grad-sunset p-1 rounded-[1.5rem] shadow-lg group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-500">
                    <ReliableImage
                      src={post.book.cover_url}
                      alt={post.book.title}
                      className="w-full h-full rounded-[1.3rem]"
                    />
                    {post.page && (
                      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-[9px] font-black text-[#3e2723]">
                        P. {post.page}
                      </div>
                    )}
                  </div>
                  <h4 className="font-black text-[#3e2723] text-sm leading-tight line-clamp-2">{post.book.title}</h4>
                  <p className="text-[10px] font-bold text-[#ff7a59] italic mt-1">{post.book.author_name?.[0]}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Book Search Results */}
      {searchQuery.length > 2 && (
        <div className="mb-16 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-4 mb-8">
            <Sparkles className="text-[#ff7a59]" size={32} />
            <h3 className="text-3xl font-black text-[#3e2723] playfair">Vibes Found</h3>
          </div>

          {searching ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-[3rem] border-4 border-[#fff5f0]">
              <Loader2 className="animate-spin text-[#ff7a59] size-10" />
            </div>
          ) : bookResults.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-[#fff5f0] opacity-40">
              <Ghost className="mx-auto mb-4 text-[#ff7a59]" size={48} />
              <p className="font-black italic text-xl">No books found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {bookResults.map((book, i) => (
                <div key={book.key} className="group animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="relative aspect-[2/3] mb-4 overflow-hidden rounded-[1.5rem] shadow-lg border-2 border-white transition-all group-hover:shadow-2xl group-hover:-translate-y-2 bg-[#fff5f0]">
                    <ReliableImage
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-full"
                    />
                  </div>
                  <h4 className="font-black text-[#3e2723] text-xs leading-tight line-clamp-2">{book.title}</h4>
                  <p className="text-[9px] font-bold text-[#ff7a59] italic mt-1 truncate">{book.author_name?.[0]}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-10 mb-20">


        {/* Trending Section */}
        <div className="bg-white p-12 rounded-[4rem] border-4 border-[#fff5f0] relative overflow-hidden group shadow-xl">
          <TrendingUp className="absolute top-10 right-10 text-[#7eb67d]/20 group-hover:rotate-12 transition-transform" size={80} />
          <h3 className="text-3xl font-black text-[#3e2723] mb-6 playfair">Rising Echoes</h3>
          <div className="space-y-6">
            {[
              { title: "The Midnight Library", count: "2.4k readers", color: "text-[#7eb67d]" },
              { title: "Circe", count: "1.8k readers", color: "text-[#f48fb1]" },
              { title: "Tomorrow, and Tomorrow...", count: "3.1k readers", color: "text-[#ffc247]" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 group/item cursor-pointer">
                <div className={`w-12 h-12 rounded-2xl bg-[#fffaf8] flex items-center justify-center font-black ${item.color} border-2 border-[#fff5f0] group-hover/item:scale-110 transition-transform`}>
                  {i + 1}
                </div>
                <div>
                  <p className="font-black text-[#3e2723] group-hover/item:text-[#ff7a59] transition-colors">{item.title}</p>
                  <p className="text-xs font-bold text-[#a1887f] uppercase tracking-widest">{item.count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


    </div>
  );
};
