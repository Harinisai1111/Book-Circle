import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Post, Book } from '../types';
import { Heart, MessageCircle, Share2, Plus, X, Camera, Sparkles, Send, Search, BookOpen, Coffee, Ghost, Sun, Moon, Zap } from 'lucide-react';
import { searchBooks } from '../openLibraryService';
import { editBookPhoto } from '../geminiService';
import { getPosts, createPost, toggleLike, subscribeToPostUpdates, addComment, subscribeToComments, subscribeToLikes, subscribeToAllComments } from '../services/postService';
import { getAllUsers } from '../services/userService';
import { ReliableImage } from '../components/ReliableImage';

const MoodIcon = ({ mood }: { mood?: string }) => {

  if (!mood) return null;
  const m = mood.toLowerCase();
  if (m.includes('cozy') || m.includes('warm')) return <div className="p-1 bg-orange-100 rounded-full"><Coffee size={14} className="text-orange-500" /></div>;
  if (m.includes('spooky') || m.includes('ghost')) return <div className="p-1 bg-indigo-100 rounded-full"><Ghost size={14} className="text-indigo-500" /></div>;
  if (m.includes('happy') || m.includes('bright')) return <div className="p-1 bg-yellow-100 rounded-full"><Sun size={14} className="text-yellow-600" /></div>;
  if (m.includes('night') || m.includes('dark')) return <div className="p-1 bg-blue-100 rounded-full"><Moon size={14} className="text-blue-600" /></div>;
  return <div className="p-1 bg-pink-100 rounded-full"><Sparkles size={14} className="text-pink-500" /></div>;
};

export const Feed: React.FC = () => {
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [caption, setCaption] = useState('');
  const [page, setPage] = useState<number | ''>('');
  const [mood, setMood] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [activeCommentsPost, setActiveCommentsPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState('');

  // Load posts and users
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [postsData, usersData] = await Promise.all([
        getPosts(50),
        getAllUsers(),
      ]);
      setPosts(postsData);
      setUsers(usersData);
      setLoading(false);
    };

    loadData();

    // Subscribe to real-time post updates (Inserts, Updates, Deletes)
    const unsubscribePosts = subscribeToPostUpdates((payload) => {
      if (payload.event === 'INSERT') {
        setPosts(prev => {
          if (prev.some(p => p.id === payload.post!.id)) return prev;
          return [payload.post!, ...prev];
        });
      } else if (payload.event === 'UPDATE') {
        setPosts(prev => prev.map(p => p.id === payload.post!.id ? { ...p, ...payload.post } : p));
      } else if (payload.event === 'DELETE') {
        setPosts(prev => prev.filter(p => p.id !== payload.postId));
      }
    });

    // Subscribe to real-time likes
    const unsubscribeLikes = subscribeToLikes((payload) => {
      const { like, event } = payload;
      setPosts(prev => prev.map(p => {
        if (p.id === like.post_id) {
          const alreadyHasLike = p.likes.includes(like.user_id);
          if (event === 'INSERT' && alreadyHasLike) return p;
          if (event === 'DELETE' && !alreadyHasLike) return p;

          const newLikes = event === 'INSERT'
            ? [...p.likes, like.user_id]
            : p.likes.filter(id => id !== like.user_id);

          return { ...p, likes: Array.from(new Set(newLikes)) };
        }
        return p;
      }));
    });

    return () => {
      unsubscribePosts();
      unsubscribeLikes();
    };
  }, []);

  // Subscribe to all comments for feed counts
  useEffect(() => {
    const unsubscribe = subscribeToAllComments((newComment) => {
      setPosts(prev => prev.map(p => {
        if (p.id === newComment.postId) {
          if (p.comments.some(c => c.id === newComment.id)) return p;
          return { ...p, comments: [...p.comments, newComment] };
        }
        return p;
      }));
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to comments for active post
  useEffect(() => {
    if (!activeCommentsPost) return;

    const unsubscribe = subscribeToComments(activeCommentsPost.id, (newComment) => {
      setPosts(prev => prev.map(p => {
        if (p.id === activeCommentsPost.id) {
          if (p.comments.some(c => c.id === newComment.id)) return p;
          return { ...p, comments: [...p.comments, newComment] };
        }
        return p;
      }));

      setActiveCommentsPost(prev => {
        if (prev?.id === activeCommentsPost.id) {
          if (prev.comments.some(c => c.id === newComment.id)) return prev;
          return { ...prev, comments: [...prev.comments, newComment] };
        }
        return prev;
      });
    });

    return () => unsubscribe();
  }, [activeCommentsPost]);



  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2) {
        const results = await searchBooks(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiEdit = async () => {
    if (!image || !aiPrompt) return;
    setIsAiEditing(true);
    const base64 = image.split(',')[1];
    const edited = await editBookPhoto(base64, aiPrompt);
    if (edited) setImage(edited);
    setIsAiEditing(false);
    setAiPrompt('');
  };

  const handlePost = async () => {
    if (!selectedBook || !user) return;

    const newPost = await createPost({
      userId: user.id,
      book: selectedBook,
      caption,
      page: page === '' ? undefined : page,
      mood: mood || undefined,
      imageUrl: image || undefined,
      isPublic: isPublic,
    });

    if (newPost) {
      setPosts([newPost, ...posts]);
      setIsPosting(false);
      setSelectedBook(null);
      setCaption('');
      setPage('');
      setMood('');
      setImage(null);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) return;
    const isLiked = posts.find(p => p.id === postId)?.likes.includes(user.id);

    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likes: isLiked ? p.likes.filter(id => id !== user.id) : [...p.likes, user.id]
        };
      }
      return p;
    }));

    await toggleLike(postId, user.id);
  };

  const handleAddComment = async () => {
    if (!activeCommentsPost || !commentText.trim() || !user) return;
    const newComment = await addComment(activeCommentsPost.id, user.id, commentText);
    if (newComment) {
      setCommentText('');
      // Update local state
      const commentObj = {
        id: newComment.id,
        userId: user.id,
        text: commentText,
        createdAt: Date.now()
      };
      setPosts(prev => prev.map(p => {
        if (p.id === activeCommentsPost.id) {
          return { ...p, comments: [...p.comments, commentObj] };
        }
        return p;
      }));
      setActiveCommentsPost(prev => prev ? { ...prev, comments: [...prev.comments, commentObj] } : null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ff7a59] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#3e2723] font-bold">Loading your feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-10 flex justify-between items-center">
        <div className="animate-in slide-in-from-left-4 duration-500">
          <h2 className="text-4xl font-black text-[#3e2723] playfair tracking-tight">Morning, Reader!</h2>
          <p className="text-[#ff7a59] font-bold uppercase text-xs tracking-[0.2em] mt-1">Today's Chapter Awaits...</p>
        </div>
        <button
          onClick={() => setIsPosting(true)}
          className="grad-sunset text-white px-8 py-4 rounded-[2rem] font-black shadow-xl shadow-clay hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
        >
          <Plus size={24} />
          <span>New Post</span>
        </button>
      </div>

      {/* New Post Modal */}
      {isPosting && (
        <div className="fixed inset-0 bg-[#3e2723]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-300 overflow-y-auto max-h-[90vh] border-4 border-[#fff5f0]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black playfair text-[#3e2723]">Reading Log</h3>
              <button onClick={() => setIsPosting(false)} className="bg-[#ff7a59]/10 text-[#ff7a59] p-2.5 rounded-full hover:bg-[#ff7a59] hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            {!selectedBook ? (
              <div className="space-y-6">
                <p className="text-[#8d6e63] font-black uppercase text-xs tracking-widest ml-1">Search for your current read</p>
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ff7a59]" size={20} />
                  <input
                    type="text"
                    placeholder="Search by Title or Author..."
                    className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] border-2 border-[#fff5f0] bg-[#fffaf8] focus:border-[#ff7a59] focus:outline-none transition-all font-bold text-base"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scroll">
                  {searchResults.length === 0 && searchQuery.length > 2 ? (
                    <div className="text-center py-12 px-6">
                      <div className="bg-[#ff7a59]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Ghost className="text-[#ff7a59]" size={32} />
                      </div>
                      <p className="font-black text-[#3e2723] italic">No books found for "{searchQuery}"</p>
                      <p className="text-[10px] font-bold text-[#ff7a59] mt-2 italic px-8">Tip: Check your internet connection if searches continue to fail.</p>
                    </div>
                  ) : (
                    searchResults.map(book => (
                      <button
                        key={book.key}
                        onClick={() => setSelectedBook(book)}
                        className="w-full flex items-center gap-5 p-5 bg-[#fffaf8] hover:bg-[#ff7a59]/5 rounded-[2rem] border-2 border-[#fff5f0] hover:border-[#ff7a59]/30 transition-all text-left group"
                      >
                        <ReliableImage
                          src={book.cover_url}
                          alt={book.title}
                          className="w-14 h-20 rounded-xl shadow-md group-hover:scale-110 transition-transform"
                        />
                        <div>
                          <p className="font-black text-[#3e2723] text-lg leading-tight mb-1">{book.title}</p>
                          <p className="text-sm font-bold text-[#ff7a59]">{book.author_name?.[0]}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-4 p-5 grad-sunset rounded-[2rem] text-white shadow-lg">
                  <img src={selectedBook.cover_url} alt={selectedBook.title} className="w-20 h-28 object-cover rounded-xl shadow-xl ring-2 ring-white/20" />
                  <div className="flex-1 py-1">
                    <h4 className="font-black text-xl line-clamp-2 leading-none mb-1">{selectedBook.title}</h4>
                    <p className="font-bold text-sm text-white/80">{selectedBook.author_name?.[0]}</p>
                    <button onClick={() => setSelectedBook(null)} className="text-[9px] font-black uppercase tracking-[0.2em] mt-4 bg-white/20 px-2.5 py-1 rounded-full hover:bg-white/40 border border-white/20">Change Book</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[#ff7a59] uppercase tracking-widest ml-3">Progress</label>
                    <input
                      type="number"
                      placeholder="Page #"
                      className="w-full px-5 py-3 rounded-[1.2rem] border-2 border-[#fff5f0] bg-[#fffaf8] focus:border-[#ff7a59] focus:outline-none font-bold text-sm"
                      value={page}
                      onChange={(e) => setPage(e.target.value === '' ? '' : parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[#ff7a59] uppercase tracking-widest ml-3">The Vibe</label>
                    <input
                      type="text"
                      placeholder="Cozy, Thrilled..."
                      className="w-full px-5 py-3 rounded-[1.2rem] border-2 border-[#fff5f0] bg-[#fffaf8] focus:border-[#ff7a59] focus:outline-none font-bold text-sm"
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-[#ff7a59] uppercase tracking-widest ml-3">Privacy</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsPublic(true)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all border-2 ${isPublic ? 'bg-[#ff7a59]/10 border-[#ff7a59] text-[#ff7a59]' : 'bg-[#fffaf8] border-[#fff5f0] text-[#8d6e63]'}`}
                    >
                      <Sun size={16} /> Public
                    </button>
                    <button
                      onClick={() => setIsPublic(false)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all border-2 ${!isPublic ? 'bg-indigo-50 border-indigo-400 text-indigo-600' : 'bg-[#fffaf8] border-[#fff5f0] text-[#8d6e63]'}`}
                    >
                      <Moon size={16} /> Private
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-[#ff7a59] uppercase tracking-widest ml-3">Your Thoughts</label>
                  <textarea
                    placeholder="Spill the tea..."
                    className="w-full p-5 rounded-[1.5rem] border-2 border-[#fff5f0] bg-[#fffaf8] focus:border-[#ff7a59] focus:outline-none h-28 resize-none font-medium text-sm"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  {!image ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-3 border-dashed border-[#fff5f0] rounded-[2rem] cursor-pointer hover:bg-[#fff5f0] transition-all group overflow-hidden bg-[#fffaf8]">
                      <Camera className="text-[#ff7a59] group-hover:scale-110 transition-transform mb-1" size={32} />
                      <span className="text-[10px] font-black text-[#ff7a59] uppercase tracking-widest">Share the Scene</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative rounded-[3rem] overflow-hidden group shadow-2xl border-4 border-white">
                        <img src={image} alt="Reading update" className="w-full h-56 object-cover" />
                        <button onClick={() => setImage(null)} className="absolute top-4 right-4 p-3 bg-black/50 text-white rounded-full backdrop-blur-md">
                          <X size={20} />
                        </button>
                      </div>

                      <div className="p-6 grad-forest rounded-[2.5rem] shadow-lg text-white">
                        <div className="flex items-center gap-3 mb-4">
                          <Zap size={20} className="fill-current" />
                          <p className="font-black uppercase text-xs tracking-[0.2em]">Aesthetic AI Filter</p>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. 'moody film', 'sunlit garden'"
                            className="flex-1 text-sm px-5 py-3 rounded-2xl bg-white/20 border border-white/20 text-white placeholder-white/60 focus:outline-none font-bold"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                          />
                          <button
                            onClick={handleAiEdit}
                            disabled={isAiEditing || !aiPrompt}
                            className="bg-white text-[#4caf50] px-6 py-3 rounded-2xl font-black text-sm hover:scale-105 transition-all disabled:opacity-50"
                          >
                            {isAiEditing ? 'Magic...' : 'Zap it!'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handlePost}
                  disabled={!selectedBook}
                  className="w-full grad-sunset text-white py-4 rounded-2xl font-black text-lg hover:shadow-xl shadow-clay/20 transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-3"
                >
                  <Send size={20} />
                  Post to Circle
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feed Posts */}
      <div className="space-y-12 mb-32">
        {posts.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[4rem] border-4 border-[#fff5f0] shadow-sm animate-in fade-in duration-1000">
            <div className="bg-[#ff7a59]/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 animate-float">
              <BookOpen className="text-[#ff7a59]" size={48} />
            </div>
            <p className="text-3xl font-black text-[#3e2723] mb-3 playfair">Tumbleweeds...</p>
            <p className="text-[#ff7a59] font-bold">Be the spark! Share what you're reading now.</p>
          </div>
        ) : (
          posts.map(post => {
            const postUser = users.find(u => u.id === post.userId);
            return (
              <div key={post.id} className="bg-white rounded-[3.5rem] shadow-[0_20px_40px_-15px_rgba(255,122,89,0.1)] border-2 border-[#fff5f0] overflow-hidden group hover:shadow-2xl transition-all duration-500 animate-in slide-in-from-bottom-8">
                <div className="p-6 flex items-center gap-5">
                  <div className="relative group/avatar">
                    <img src={postUser?.avatar} alt={postUser?.name} className="w-16 h-16 rounded-[1.5rem] border-4 border-[#fff5f0] object-cover group-hover/avatar:rotate-6 transition-transform shadow-md" />
                    {post.mood && (
                      <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-lg border-2 border-[#fff5f0]">
                        <MoodIcon mood={post.mood} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-black text-[#3e2723] text-xl leading-none">{postUser?.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm font-bold text-[#ff7a59] italic">Exploring "{post.book.title}"</p>
                      {!post.isPublic && (
                        <div className="flex items-center gap-1 text-[10px] font-black text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          <Moon size={10} fill="currentColor" /> PRIVATE
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-auto text-[10px] font-black uppercase tracking-widest text-[#ff7a59] bg-[#fff5f0] px-4 py-2 rounded-full border border-[#ffe0cc]">
                    {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {post.imageUrl && (
                  <div className="px-6 pb-6 overflow-hidden">
                    <img src={post.imageUrl} alt="Post content" className="w-full aspect-[4/3] object-cover rounded-[3rem] shadow-2xl group-hover:scale-105 transition-transform duration-700 ring-4 ring-[#fffaf8]" />
                  </div>
                )}

                <div className="px-8 pb-8 pt-2">
                  <div className="flex gap-6 mb-6">
                    <div className="relative w-24 aspect-[2/3] flex-shrink-0 group-hover:rotate-2 transition-transform duration-500 bg-[#fff5f0] rounded-2xl overflow-hidden">
                      <ReliableImage
                        src={post.book.cover_url}
                        alt={post.book.title}
                        className="w-full h-full rounded-2xl shadow-2xl bg-white border-4 border-white"
                      />
                    </div>
                    {post.page && (
                      <div className="absolute -top-3 -right-3 grad-sunset text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xl ring-2 ring-white">
                        P.{post.page}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 pt-4">
                    <p className="text-[#3e2723] text-lg font-medium leading-relaxed mb-3">
                      {post.caption}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-black text-[#ff7a59] uppercase tracking-widest px-3 py-1 bg-[#ff7a59]/5 rounded-lg border border-[#ff7a59]/10">by {post.book.author_name?.[0]}</span>
                      {post.mood && (
                        <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-1.5 border border-indigo-100 italic">
                          <MoodIcon mood={post.mood} /> {post.mood}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 px-8 pb-8 pt-6 border-t-2 border-[#fffaf8]">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className={`flex items-center gap-2.5 text-base font-black transition-all hover:scale-110 active:scale-90 ${post.likes.includes(user?.id || '') ? 'text-[#f48fb1]' : 'text-[#8d6e63] hover:text-[#f48fb1]'}`}
                  >
                    <Heart size={24} fill={post.likes.includes(user?.id || '') ? 'currentColor' : 'none'} />
                    <span>{post.likes.length}</span>
                  </button>
                  <button
                    onClick={() => setActiveCommentsPost(post)}
                    className="flex items-center gap-2.5 text-[#8d6e63] hover:text-[#7eb67d] text-base font-black transition-all hover:scale-110"
                  >
                    <MessageCircle size={24} />
                    <span>{post.comments.length}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>


      {/* Comments Modal */}
      {
        activeCommentsPost && (
          <div className="fixed inset-0 bg-[#3e2723]/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl animate-in zoom-in duration-300 border-4 border-[#fff5f0] flex flex-col max-h-[80vh]">
              <div className="p-8 border-b-2 border-[#fffaf8] flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black playfair text-[#3e2723]">Discussion</h3>
                  <p className="text-[10px] font-black text-[#ff7a59] uppercase tracking-widest mt-1">
                    On "{activeCommentsPost.book.title}"
                  </p>
                </div>
                <button onClick={() => setActiveCommentsPost(null)} className="bg-[#ff7a59]/10 text-[#ff7a59] p-2.5 rounded-full hover:bg-[#ff7a59] hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scroll bg-[#fffcf9]/30">
                {activeCommentsPost.comments.length === 0 ? (
                  <div className="text-center py-12 opacity-40">
                    <MessageCircle size={48} className="mx-auto mb-4 text-[#ff7a59]" />
                    <p className="font-black italic">No thoughts shared yet. Be the first!</p>
                  </div>
                ) : (
                  activeCommentsPost.comments.map(comment => {
                    const commentUser = users.find(u => u.id === comment.userId);
                    return (
                      <div key={comment.id} className="flex gap-4 group">
                        <img src={commentUser?.avatar} alt={commentUser?.name} className="w-10 h-10 rounded-xl object-cover shadow-sm ring-2 ring-[#fffaf8]" />
                        <div className="flex-1 bg-white p-4 rounded-2xl border-2 border-[#fff5f0] group-hover:border-[#ff7a59]/20 transition-all">
                          <div className="flex justify-between items-center mb-1">
                            <p className="font-black text-[#3e2723] text-sm">{commentUser?.name || 'Reader'}</p>
                            <p className="text-[9px] font-bold text-[#8d6e63]">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <p className="text-[#5d4037] text-sm leading-relaxed">{comment.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-8 border-t-2 border-[#fffaf8] bg-white rounded-b-[3rem]">
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Add to the chapter..."
                    className="flex-1 bg-[#fffaf8] border-2 border-[#fff5f0] rounded-2xl px-6 py-4 font-bold text-[#3e2723] focus:outline-none focus:border-[#ff7a59] transition-all"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className={`p-4 rounded-2xl transition-all ${commentText.trim() ? 'grad-sunset text-white shadow-lg active:scale-95' : 'bg-gray-100 text-gray-300'}`}
                  >
                    <Send size={24} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};
