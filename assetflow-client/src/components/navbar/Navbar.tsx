import { useState, useEffect, useRef, Fragment } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Sun, Moon, Bell, Search, Check, X
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useGlobalSearch, useNotifications, useMarkNotificationsRead } from '../../hooks/enterpriseHooks';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export function Navbar({ darkMode, setDarkMode }: NavbarProps) {
  const { user } = useAuthStore();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifContainerRef = useRef<HTMLDivElement>(null);

  // Fetch search matches when query changes
  const { data: searchResults, isFetching } = useGlobalSearch(searchQuery);
  const { data: notifData, refetch: refetchNotifs } = useNotifications({ limit: 5 });
  const markReadMutation = useMarkNotificationsRead();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkReadSingle = (id: string) => {
    markReadMutation.mutate([id], {
      onSuccess: () => refetchNotifs()
    });
  };

  const pathnames = location.pathname.split('/').filter((x) => x);
  const unreadCount = notifData?.unreadCount || 0;
  const recentNotifs = notifData?.notifications || [];

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors duration-300">
      
      {/* Dynamic breadcrumbs to aid workflow context location */}
      <div className="flex items-center gap-2 text-sm text-slate-550 dark:text-slate-400">
        <Link to="/dashboard" className="hover:text-blue-500 transition-colors">Home</Link>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;

          return (
            <Fragment key={to}>
              <span className="text-slate-350 dark:text-slate-600">/</span>
              {isLast ? (
                <span className="font-semibold text-slate-800 dark:text-slate-100 capitalize">
                  {value.replace('-', ' ')}
                </span>
              ) : (
                <Link to={to} className="hover:text-blue-500 capitalize transition-colors">
                  {value.replace('-', ' ')}
                </Link>
              )}
            </Fragment>
          );
        })}
      </div>

      <div ref={searchContainerRef} className="relative flex-1 max-w-md mx-6 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Assets, Categories, Departments..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
            onFocus={() => setIsSearchOpen(true)}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none text-xs text-slate-705 dark:text-slate-300 placeholder-slate-400 focus:border-blue-500/50"
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {isSearchOpen && searchQuery.trim().length > 0 && (
          <div className="absolute top-12 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-4 max-h-[380px] overflow-y-auto z-50 text-slate-800 dark:text-slate-250">
            {isFetching && (
              <span className="text-[10px] text-slate-400 block px-1 animate-pulse mb-2">Querying database...</span>
            )}
            
            <div className="space-y-4">
              {searchResults?.assets?.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 border-b border-slate-100 dark:border-slate-800 pb-1">Assets Directory</span>
                  <div className="space-y-1">
                    {searchResults.assets.map((asset: any) => (
                      <Link
                        key={asset._id}
                        to={`/assets`}
                        onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg transition-colors"
                      >
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{asset.name}</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">{asset.assetTag}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchResults?.departments?.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 border-b border-slate-100 dark:border-slate-800 pb-1">Departments</span>
                  <div className="space-y-1">
                    {searchResults.departments.map((dept: any) => (
                      <Link
                        key={dept._id}
                        to={`/organization`}
                        onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg transition-colors"
                      >
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{dept.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{dept.code}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {searchResults?.bookings?.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 border-b border-slate-100 dark:border-slate-800 pb-1">Reservations</span>
                  <div className="space-y-1">
                    {searchResults.bookings.map((booking: any) => (
                      <Link
                        key={booking._id}
                        to={`/bookings`}
                        onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg transition-colors"
                      >
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{booking.title}</span>
                        <span className="text-[10px] text-slate-400">{new Date(booking.startDate).toLocaleDateString()}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {(!searchResults || 
                (searchResults.assets?.length === 0 && 
                 searchResults.departments?.length === 0 && 
                 searchResults.bookings?.length === 0)) && (
                <span className="text-xs text-slate-450 block text-center py-4">No matching assets or bookings found.</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
        </button>

        <div ref={notifContainerRef} className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 relative transition-colors cursor-pointer"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-rose-500 text-[9px] text-white flex items-center justify-center rounded-full font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-12 w-[320px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 text-slate-800 dark:text-slate-250">
              <div className="bg-slate-50 dark:bg-slate-850 p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Bell className="h-4 w-4 text-purple-500" />
                  Notifications
                </span>
                <Link 
                  to="/notifications" 
                  onClick={() => setIsNotifOpen(false)}
                  className="text-[10px] text-purple-600 hover:underline dark:text-purple-400 font-bold"
                >
                  View All
                </Link>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[250px] overflow-y-auto">
                {recentNotifs.length > 0 ? (
                  recentNotifs.map((notif: any) => (
                    <div key={notif._id} className="p-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors flex items-start justify-between gap-2">
                      <div className="space-y-0.5 pr-2">
                        <strong className="block text-slate-800 dark:text-slate-205">{notif.title}</strong>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{notif.message}</p>
                        <span className="text-[9px] text-slate-400 block mt-1">{new Date(notif.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkReadSingle(notif._id)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 text-purple-500 rounded cursor-pointer"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-slate-450 text-[11px] block text-center py-6">No unread notifications.</span>
                )}
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4">
            <Link to="/profile" className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-600 to-indigo-650 flex items-center justify-center text-white font-bold text-sm shadow-md border border-blue-500/20 hover:scale-105 transition-transform">
              {user.firstName[0]}
            </Link>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-none">{user.firstName}</p>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1 block">{user.role.replace('_', ' ')}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
