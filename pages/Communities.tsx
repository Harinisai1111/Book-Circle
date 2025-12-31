import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { getCommunities, joinCommunity, leaveCommunity, isMember } from '../services/communityService';
import { getCommunityMessages, sendCommunityMessage, subscribeToCommunityMessages } from '../services/communityMessageService';
import { Community, GroupMessage } from '../types';
import { MessageSquare, Send, ChevronLeft, Search, Users, Plus, Sparkles, Camera, Smile, X } from 'lucide-react';

export const Communities: React.FC = () => {
  const { user } = useUser();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [membershipStatus, setMembershipStatus] = useState<Record<string, boolean>>({});
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  useEffect(() => {
    const loadCommunities = async () => {
      setLoading(true);
      const data = await getCommunities();
      setCommunities(data);

      if (user) {
        const status: Record<string, boolean> = {};
        for (const circle of data) {
          status[circle.id] = await isMember(circle.id, user.id);
        }
        setMembershipStatus(status);
      }
      setLoading(false);
    };

    loadCommunities();
  }, [user]);

  // Load messages and subscribe when community selected
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadMessages = async () => {
      if (selectedCommunity) {
        const msgs = await getCommunityMessages(selectedCommunity.id);
        setMessages(msgs);

        unsubscribe = subscribeToCommunityMessages(selectedCommunity.id, (msg) => {
          setMessages(prev => [...prev.filter(m => m.id !== msg.id), msg]);
        });
      }
    };

    loadMessages();
    return () => unsubscribe?.();
  }, [selectedCommunity]);

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
    if ((!newMessage.trim() && !image) || !selectedCommunity || !user) return;
    const msg = await sendCommunityMessage(selectedCommunity.id, user.id, newMessage, image || undefined);
    if (msg) {
      setNewMessage('');
      setImage(null);
    }
  };


  const handleToggleMembership = async (communityId: string) => {
    if (!user) return;

    if (membershipStatus[communityId]) {
      const success = await leaveCommunity(communityId, user.id);
      if (success) {
        setMembershipStatus(prev => ({ ...prev, [communityId]: false }));
      }
    } else {
      const success = await joinCommunity(communityId, user.id);
      if (success) {
        setMembershipStatus(prev => ({ ...prev, [communityId]: true }));
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ff7a59] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#3e2723] font-bold">Opening the circle...</p>
        </div>
      </div>
    );
  }

  if (selectedCommunity) {
    return (
      <div className="max-w-4xl mx-auto h-[calc(100vh-10rem)] flex flex-col bg-white rounded-[3rem] border-4 border-[#fff5f0] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4">
        {/* Chat Header */}
        <div className="p-6 border-b-2 border-[#fffaf8] flex items-center justify-between bg-[#fffcf9]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedCommunity(null)}
              className="p-3 bg-white text-[#ff7a59] rounded-2xl hover:bg-[#ff7a59] hover:text-white transition-all shadow-sm border border-[#fff5f0]"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-4">
              <img src={selectedCommunity.image} alt={selectedCommunity.name} className="w-12 h-12 rounded-xl object-cover shadow-inner" />
              <div>
                <h3 className="text-xl font-black text-[#3e2723] playfair leading-none">{selectedCommunity.name}</h3>
                <p className="text-[10px] font-black text-[#ff7a59] uppercase tracking-widest mt-1">
                  {selectedCommunity.members.length} Members Online
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
              <MessageSquare size={48} className="text-[#ff7a59] mb-4" />
              <p className="text-[#3e2723] font-black italic">The circle is quiet. Start the discussion!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.userId === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm animate-in ${msg.userId === user?.id
                  ? 'bg-[#ff7a59] text-white rounded-tr-none'
                  : 'bg-[#ff7a59]/5 text-[#3e2723] border border-[#ff7a59]/10 rounded-tl-none'}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-tighter mb-1 opacity-70">
                    {msg.userId === user?.id ? 'You' : (msg.userName || 'Member')} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {msg.imageUrl && (
                    <div className="mb-3 rounded-2xl overflow-hidden shadow-md">
                      <img src={msg.imageUrl} alt="Shared content" className="w-full h-auto max-h-60 object-cover" />
                    </div>
                  )}
                  <p className="font-medium text-sm leading-relaxed">{msg.text}</p>
                </div>

              </div>
            ))
          )}
        </div>

        <div className="px-6 pt-4">
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
        <div className="p-6 border-t-2 border-[#fffaf8] bg-white">
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
              className="p-4 bg-[#fffaf8] text-[#ff7a59] rounded-2xl hover:bg-[#ff7a59]/10 transition-all"
            >
              <Camera size={24} />
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Message the circle..."
                className="w-full bg-[#fffaf8] border-2 border-[#fff5f0] rounded-2xl pl-6 pr-14 py-4 font-bold text-[#3e2723] focus:outline-none focus:border-[#ff7a59] transition-all"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a1887f] hover:text-[#ff7a59] transition-colors">
                <Smile size={24} />
              </button>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className={`p-4 rounded-2xl shadow-lg transition-all ${newMessage.trim() ? 'grad-sunset text-white shadow-clay/20 hover:scale-105 active:scale-95' : 'bg-gray-100 text-gray-300'}`}
            >
              <Send size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div>
          <h1 className="text-6xl font-black text-[#3e2723] playfair mb-4 tracking-tight">Reading Circles</h1>
          <p className="text-xl text-[#8d6e63] font-medium max-w-xl">Join community book chats and find your literary family.</p>
        </div>
        <div className="relative group min-w-[300px]">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#ff7a59] group-focus-within:scale-110 transition-transform" />
          <input
            type="text"
            placeholder="Find a circle..."
            className="w-full pl-16 pr-8 py-5 bg-white border-2 border-[#fff5f0] rounded-[2rem] text-lg font-bold shadow-xl shadow-clay/5 focus:outline-none focus:border-[#ff7a59] transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {communities.map((circle, i) => (
          <div
            key={circle.id}
            onClick={() => membershipStatus[circle.id] && setSelectedCommunity(circle)}
            className={`bg-white rounded-[3.5rem] border-2 border-[#fff5f0] overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group animate-in fade-in ${membershipStatus[circle.id] ? 'cursor-pointer' : 'cursor-default'}`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="h-48 w-full relative overflow-hidden">
              <img src={circle.image} alt={circle.name} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#3e2723]/80 via-transparent to-transparent flex items-end p-8">
                <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 text-white text-xs font-black uppercase tracking-widest">
                  <Users size={14} /> {circle.members.length} Readers
                </div>
              </div>
            </div>

            <div className="p-10">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-3xl font-black text-[#3e2723] playfair">{circle.name}</h2>
                <span className="px-5 py-2 bg-[#fff5f0] text-[#ff7a59] rounded-full text-xs font-black uppercase tracking-widest border border-[#ffe0cc]">
                  {circle.category}
                </span>
              </div>
              <p className="text-lg text-[#8d6e63] font-medium leading-relaxed mb-8 line-clamp-2 italic">"{circle.description}"</p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleMembership(circle.id);
                }}
                className={`w-full py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-all ${membershipStatus[circle.id]
                  ? 'bg-[#fff5f0] text-[#ff7a59] border-2 border-[#ff7a59]/20 hover:bg-[#ff7a59] hover:text-white'
                  : 'grad-sunset text-white shadow-clay/20 hover:scale-[1.02] active:scale-95'
                  }`}
              >
                {membershipStatus[circle.id] ? 'In Circle' : 'Join Circle'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
