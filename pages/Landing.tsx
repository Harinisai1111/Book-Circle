
import React, { useState } from 'react';
import { BookOpen, Coffee, Users, Sparkles, ArrowRight, Star, Heart } from 'lucide-react';
import { getStore, saveStore } from '../store';

export const Landing: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const handleEnter = () => {
    const store = getStore();
    store.isLoggedIn = true;
    saveStore(store);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fffcf9] overflow-hidden">
      {/* Playful Colorful Side */}
      <div className="hidden md:flex md:w-1/2 bg-[#ff7a59] items-center justify-center p-12 relative">
        {/* Animated Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-[#ffc247] blob opacity-30 animate-pulse"></div>
        <div className="absolute bottom-[5%] right-[-5%] w-80 h-80 bg-[#7eb67d] blob opacity-30"></div>
        <div className="absolute top-[40%] right-[10%] w-20 h-20 bg-[#f48fb1] blob opacity-50 animate-float"></div>
        
        <div className="relative z-10 text-center text-white max-w-lg">
          <div className="inline-block p-6 bg-white/20 backdrop-blur-md rounded-[3rem] shadow-2xl mb-10 animate-float">
            <BookOpen className="text-white" size={80} />
          </div>
          <h1 className="text-7xl font-bold mb-6 playfair drop-shadow-lg tracking-tight">BookCircle</h1>
          <p className="text-2xl text-white/90 font-medium leading-relaxed mb-12">
            The social network for people who love the smell of old paper and the thrill of a new chapter.
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-[2rem] border border-white/20">
               <Star className="text-[#ffc247] mb-2" />
               <p className="font-bold text-lg">Daily Recs</p>
               <p className="text-sm text-white/70">AI tailored to your soul.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-[2rem] border border-white/20">
               <Heart className="text-[#f48fb1] mb-2" />
               <p className="font-bold text-lg">Pure Vibes</p>
               <p className="text-sm text-white/70">Cozy, safe, and fun.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Form Side */}
      <div className="flex-1 flex items-center justify-center p-8 bg-pattern relative">
        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="text-center md:hidden mb-12">
             <div className="inline-block p-5 grad-sunset rounded-[2rem] shadow-lg mb-4 animate-float">
                <BookOpen className="text-white" size={40} />
             </div>
             <h1 className="text-5xl font-bold text-[#ff7a59] playfair">BookCircle</h1>
          </div>

          <div className="bg-white p-12 rounded-[4rem] shadow-[0_30px_60px_-15px_rgba(255,122,89,0.2)] border border-[#ffe0cc] relative overflow-hidden">
            {/* Corner Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffc247]/10 rounded-bl-[5rem]"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-[#3e2723] mb-2 serif">
                {isLogin ? 'Welcome Home' : 'Join the Club'}
              </h2>
              <p className="text-[#ff7a59] font-semibold mb-10 text-sm tracking-wide uppercase">
                {isLogin ? 'Time to pick up the bookmark.' : 'Create your digital library shelf.'}
              </p>

              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleEnter(); }}>
                {!isLogin && (
                  <div className="space-y-1">
                    <input 
                      type="text" 
                      placeholder="Your Name" 
                      className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-[#fff5f0] bg-[#fffaf8] focus:border-[#ff7a59] focus:outline-none transition-all font-medium"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-[#fff5f0] bg-[#fffaf8] focus:border-[#ff7a59] focus:outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <input 
                    type="password" 
                    placeholder="Secret Password" 
                    className="w-full px-6 py-4 rounded-[1.5rem] border-2 border-[#fff5f0] bg-[#fffaf8] focus:border-[#ff7a59] focus:outline-none transition-all font-medium"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full grad-sunset text-white py-5 rounded-[2rem] font-black text-lg hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 mt-6 shadow-clay shadow-xl"
                >
                  {isLogin ? 'Open the Bookshelf' : 'Start My Journey'}
                  <ArrowRight size={22} className="animate-pulse" />
                </button>
              </form>

              <div className="mt-10 text-center">
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="px-6 py-2 rounded-full text-sm font-bold text-[#ff7a59] border-2 border-[#ff7a59]/20 hover:bg-[#ff7a59] hover:text-white transition-all"
                >
                  {isLogin ? "Need an account? Sign Up" : "Already reading? Log In"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
