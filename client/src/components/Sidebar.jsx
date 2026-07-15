import React, { useRef, useEffect, useState } from 'react';
import DarkModeToggle from './DarkModeToggle';

const Sidebar = ({
  activeTab,
  onTabChange,
  onNavigate,
  chatSessions,
  chatSessionId,
  onLoadChatHistory,
  onCreateChat,
  onDeleteSession,
  onEditSessionTitle,
  onLogout,
  chatLoading,
  isOpen,
  onToggle
}) => {
  const [menuOpenId, setMenuOpenId] = useState(null);
  const menuRef = useRef();

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const sidebarItems = [
    { key: 'documents', label: 'Documents' },
    { key: 'chat', label: 'Chat' },
  ];

  const bottomNavItems = [
    { key: 'analytics', label: 'Analytics', path: '/analytics' },
    { key: 'settings', label: 'Settings', path: '/settings' },
    { key: 'profile', label: 'Profile', path: '/profile' },
  ];

  // Close sidebar when navigating on mobile
  const handleNavClick = (path) => {
    onNavigate(path);
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-40
        w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col h-full shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-700 dark:text-blue-400">IntelliDocs</h1>
          <button
            onClick={onToggle}
            className="md:hidden p-2 text-gray-600 dark:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex flex-col gap-2 px-4">
          {sidebarItems.map(item => (
            <button
              key={item.key}
              className={`text-left px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === item.key
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => onTabChange(item.key)}
            >
              {item.label}
            </button>
          ))}
          <div className="border-t my-2" />

          {/* Bottom Navigation Items */}
          {bottomNavItems.map(item => (
            <button
              key={item.key}
              className="text-left px-4 py-2 rounded-lg font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              onClick={() => handleNavClick(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Chat Session List */}
        {activeTab === 'chat' && (
          <>
            <button
              className="mt-4 mx-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-[90%]"
              onClick={onCreateChat}
              disabled={chatLoading}
            >
              {chatSessionId ? 'New Chat' : 'Start Chat'}
            </button>
            <div className="mt-4 px-4 flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Past Chats</h3>
              <div className="flex-1 flex flex-col gap-2 overflow-y-auto pb-4">
                {chatSessions.length === 0 && (
                  <div className="text-gray-400 text-sm">No past chats</div>
                )}
                {chatSessions.map(session => (
                  <div key={session._id} className="relative flex items-center group">
                    <button
                      className={`flex-1 text-left px-3 py-2 rounded-lg font-medium transition-colors w-full truncate text-sm ${
                        chatSessionId === session._id
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                      onClick={() => onLoadChatHistory(session._id)}
                    >
                      {session.title}
                    </button>
                    <button
                      className="ml-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded-full focus:outline-none"
                      onClick={() => setMenuOpenId(menuOpenId === session._id ? null : session._id)}
                      aria-label="Chat options"
                    >
                      <span style={{ fontSize: '1.5em', fontWeight: 'bold' }}>⋯</span>
                    </button>
                    {menuOpenId === session._id && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-10 z-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-48 border border-gray-100 dark:border-gray-700 flex flex-col py-2"
                        style={{ minWidth: '170px' }}
                      >
                        <button
                          className="flex items-center gap-3 px-5 py-3 text-gray-700 dark:text-gray-300 text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                          onClick={() => {
                            setMenuOpenId(null);
                            onEditSessionTitle(session._id, session.title);
                          }}
                        >
                          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M16.862 5.487l1.65 1.65a2.25 2.25 0 010 3.182l-8.25 8.25a2.25 2.25 0 01-1.591.659H5.25v-3.421a2.25 2.25 0 01.659-1.591l8.25-8.25a2.25 2.25 0 013.182 0z"></path>
                          </svg>
                          Rename
                        </button>
                        <div className="border-t mx-4 dark:border-gray-600" />
                        <button
                          className="flex items-center gap-3 px-5 py-3 text-red-600 text-base font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                          onClick={() => {
                            setMenuOpenId(null);
                            onDeleteSession(session._id);
                          }}
                        >
                          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M6 7h12M9 7V5a3 3 0 016 0v2m-7 0h8m-9 4v7a2 2 0 002 2h6a2 2 0 002-2v-7"></path>
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Logout button at the bottom */}
        <div className="p-4 mt-auto flex items-center justify-between border-t dark:border-gray-700">
          <DarkModeToggle />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;