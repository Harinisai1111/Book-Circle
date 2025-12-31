
import React from 'react';
import { Home, Search, Users, MessageSquare, User, BookOpen, Coffee } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import { useNotifications } from './NotificationContext';

const NavItem = ({ to, icon: Icon, label, active, color, activeTextColor, badgeCount }: { to: string, icon: any, label: string, active: boolean, color: string, activeTextColor: string, badgeCount?: number }) => (
  <Link
    to={to}
    className={`flex flex-col md:flex-row items-center gap-4 p-4 rounded-[2rem] transition-all duration-300 relative group ${active
      ? `bg-white shadow-xl scale-105 border-2 border-[#fff5f0]`
      : `text-[#8d6e63] hover:bg-white/50`
      }`}
  >
    <div className={`p-2 rounded-xl transition-all relative ${active ? color + ' text-white shadow-md' : 'bg-transparent group-hover:scale-110'}`}>
      <Icon size={24} />
      {badgeCount !== undefined && badgeCount > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce-subtle">
          {badgeCount > 9 ? '9+' : badgeCount}
        </div>
      )}
    </div>
    <span className={`text-[10px] md:text-base font-bold tracking-tight ${active ? activeTextColor : 'opacity-70 group-hover:opacity-100 text-[#8d6e63]'}`}>
      {label}
    </span>
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user } = useUser();
  const { unreadCount } = useNotifications();

  return (
    <div className="min-h-screen flex flex-col md:flex-row max-w-7xl mx-auto md:px-4 bg-pattern">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 h-[100dvh] sticky top-0 py-4 px-6 border-r border-[#ffe0cc] z-40 bg-[#fffcf9]/80 backdrop-blur-md overflow-hidden">
        <div className="flex items-center gap-3 mb-6 px-1 group cursor-pointer">
          <div className="grad-sunset text-white p-2.5 rounded-[1.2rem] group-hover:rotate-12 transition-transform shadow-lg shadow-clay/20">
            <BookOpen size={28} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-[#3e2723] playfair">BookCircle</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem to="/" icon={Home} label="The Feed" active={location.pathname === '/'} color="grad-sunset" activeTextColor="text-[#ff7a59]" />
          <NavItem to="/discover" icon={Search} label="Discover" active={location.pathname === '/discover'} color="grad-forest" activeTextColor="text-[#7eb67d]" />
          <NavItem to="/communities" icon={Users} label="The Circles" active={location.pathname === '/communities'} color="grad-berry" activeTextColor="text-[#f48fb1]" />
          <NavItem to="/messages" icon={MessageSquare} label="Secret Mail" active={location.pathname === '/messages'} color="bg-indigo-500" activeTextColor="text-indigo-500" badgeCount={unreadCount} />
          <NavItem to="/profile" icon={User} label="My Shelf" active={location.pathname === '/profile'} color="bg-amber-500" activeTextColor="text-amber-600" />
        </nav>

        <div className="mt-2 space-y-3 pb-2">
          <div className="p-4 grad-sunset rounded-[2rem] text-white relative overflow-hidden group shadow-lg shadow-clay/10">
            <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-white/20 blob"></div>
            <p className="text-[10px] font-bold italic relative z-10 leading-tight">"One more chapter..."</p>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] mt-1.5 opacity-80 relative z-10">— Every Reader</p>
          </div>

          {/* Clerk User Button */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border-2 border-[#fff5f0] shadow-sm">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 rounded-xl",
                  userButtonPopoverCard: "rounded-2xl border-2 border-[#fff5f0]",
                }
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-black text-[#3e2723] text-sm truncate">{user?.firstName || 'Reader'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 pb-32 md:pb-12 pt-12 px-4 md:px-12 overflow-y-auto">
        {children}
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-6 left-4 right-4 h-20 bg-white/95 backdrop-blur-xl border-2 border-[#fff5f0] rounded-[3rem] flex justify-around items-center px-2 z-50 shadow-2xl">
        <NavItem to="/" icon={Home} label="Feed" active={location.pathname === '/'} color="grad-sunset" activeTextColor="text-[#ff7a59]" />
        <NavItem to="/discover" icon={Search} label="Find" active={location.pathname === '/discover'} color="grad-forest" activeTextColor="text-[#7eb67d]" />
        <NavItem to="/communities" icon={Users} label="Circles" active={location.pathname === '/communities'} color="grad-berry" activeTextColor="text-[#f48fb1]" />
        <NavItem to="/messages" icon={MessageSquare} label="Mail" active={location.pathname === '/messages'} color="bg-indigo-500" activeTextColor="text-indigo-500" badgeCount={unreadCount} />
        <NavItem to="/profile" icon={User} label="Shelf" active={location.pathname === '/profile'} color="bg-amber-500" activeTextColor="text-amber-600" />
      </nav>
    </div>
  );
};
