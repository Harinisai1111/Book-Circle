import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Search, Send, Image as ImageIcon, MessageCircle, ChevronLeft, MapPin, Info, Phone, Video, Camera, Smile, X } from 'lucide-react';
import { getConversations, getMessages, sendMessage, subscribeToMessages } from '../services/messageService';
import { getAllUsers } from '../services/userService';
import { User, Message } from '../types';

export const Messages: React.FC = () => {
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers.filter(u => u.id !== currentUser?.id));
      setLoading(false);
    };
    loadData();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToMessages(currentUser.id, (msg) => {
      // Update active chat messages
      if (selectedChat && (msg.senderId === selectedChat.id || msg.receiverId === selectedChat.id)) {
        setMessages(prev => [...prev.filter(m => m.id !== msg.id), msg]);
      }

      // We could also trigger a sound or a notification here
      console.log("[Messages] New real-time message received:", msg);
    });

    return () => unsubscribe();
  }, [currentUser, selectedChat]); // We still need selectedChat to update the closure or use a ref

  useEffect(() => {
    if (!selectedChat || !currentUser) return;

    const loadMessages = async () => {
      const msgs = await getMessages(currentUser.id, selectedChat.id);
      setMessages(msgs);
    };

    loadMessages();
  }, [selectedChat, currentUser]);


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

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !image) || !selectedChat || !currentUser) return;
    const msg = await sendMessage(currentUser.id, selectedChat.id, newMessage, image || undefined);
    if (msg) {
      setNewMessage('');
      setImage(null);
    }
  };


  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ff7a59] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#3e2723] font-bold">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex bg-white rounded-[3.5rem] border-4 border-[#fff5f0] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Sidebar - Contacts */}
      <div className={`w-full md:w-96 flex flex-col border-r-4 border-[#fffaf8] bg-[#fffcf9] ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-8 pb-4">
          <h2 className="text-3xl font-black text-[#3e2723] playfair mb-6 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-200">
              <MessageCircle size={24} />
            </div>
            Secret Mail
          </h2>
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#ff7a59] group-focus-within:scale-110 transition-transform" size={18} />
            <input
              type="text"
              placeholder="Search library members..."
              className="w-full pl-14 pr-6 py-4 rounded-2xl border-2 border-[#fff5f0] bg-white text-sm font-bold text-[#3e2723] focus:outline-none focus:border-[#ff7a59] transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scroll">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <Search size={40} className="mx-auto mb-4 text-[#ff7a59]" />
              <p className="font-black text-xs uppercase tracking-widest text-[#3e2723]">No readers found</p>
            </div>
          ) : (
            filteredUsers.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedChat(u)}
                className={`w-full p-5 rounded-[2rem] flex items-center gap-5 transition-all group ${selectedChat?.id === u.id ? 'bg-[#ff7a59] text-white shadow-xl shadow-clay/20' : 'hover:bg-[#fff5f0] text-[#3e2723]'}`}
              >
                <div className="relative shrink-0">
                  <img src={u.avatar} alt={u.name} className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-white/20" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm ring-2 ring-green-500/20"></div>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-black text-base truncate leading-none">{u.name}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`flex-1 flex flex-col bg-white relative ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b-2 border-[#fffaf8] flex items-center justify-between bg-white z-10 shadow-sm">
              <div className="flex items-center gap-5">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-3 bg-[#fff5f0] text-[#ff7a59] rounded-xl hover:bg-[#ff7a59] hover:text-white transition-all shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <img src={selectedChat.avatar} alt={selectedChat.name} className="w-12 h-12 rounded-xl object-cover shadow-inner" />
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-[#3e2723] playfair leading-none truncate">{selectedChat.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest leading-none">Reading Now</p>
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <button className="p-3 text-[#ff7a59] hover:bg-[#fff5f0] rounded-xl transition-all"><Info size={20} /></button>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#fffcf9]/30 custom-scroll">
              {messages.map((msg, i) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className={`max-w-[70%] p-5 rounded-[2rem] shadow-sm relative group ${msg.senderId === currentUser?.id
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-200'
                    : 'bg-white text-[#3e2723] border-2 border-[#fff5f0] rounded-bl-none shadow-[#fff5f0]/50'}`}
                  >
                    {msg.imageUrl && (
                      <div className="mb-3 rounded-2xl overflow-hidden shadow-md">
                        <img src={msg.imageUrl} alt="Shared content" className="w-full h-auto max-h-60 object-cover" />
                      </div>
                    )}
                    <p className="font-bold text-sm leading-relaxed">{msg.text}</p>
                    <p className={`text-[9px] font-black uppercase mt-3 tracking-widest opacity-60 ${msg.senderId === currentUser?.id ? 'text-white' : 'text-[#8d6e63]'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                </div>
              ))}
            </div>

            <div className="px-8 pt-4">
              {image && (
                <div className="relative inline-block">
                  <img src={image} alt="Preview" className="w-20 h-20 object-cover rounded-2xl border-4 border-[#fff5f0] shadow-lg" />
                  <button
                    onClick={() => setImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-md hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-8 border-t-2 border-[#fffaf8] bg-white">
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 text-[#ff7a59] bg-[#fff5f0] rounded-2xl hover:bg-[#ff7a59] hover:text-white transition-all shadow-sm"
                >
                  <Camera size={24} />
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Whisper your thoughts..."
                    className="w-full bg-[#fffcf9] border-2 border-[#fff5f0] rounded-3xl px-8 py-5 font-bold text-[#3e2723] focus:outline-none focus:border-[#ff7a59] transition-all"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 grad-sunset text-white rounded-2xl shadow-lg hover:rotate-12 transition-all active:scale-90"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]">
            <div className="w-32 h-32 bg-indigo-50 rounded-[3rem] flex items-center justify-center mb-10 border-4 border-dashed border-indigo-200 animate-pulse">
              <MessageCircle className="text-indigo-400" size={56} />
            </div>
            <h3 className="text-4xl font-black text-[#3e2723] playfair mb-6 tracking-tight">Your Secret Library</h3>
            <p className="max-w-sm text-lg text-[#8d6e63] font-medium leading-relaxed italic">
              "Books are a uniquely portable magic. Pick a fellow reader to start a conversation."
            </p>
            <div className="mt-12 flex gap-4">
              <div className="px-6 py-2 bg-indigo-50 text-indigo-500 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100">End-to-End Encrypted</div>
              <div className="px-6 py-2 bg-[#fff5f0] text-[#ff7a59] rounded-full text-xs font-black uppercase tracking-widest border border-[#ffe0cc]">Book Lover Focused</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
