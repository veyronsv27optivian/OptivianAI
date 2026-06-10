import { useState } from 'react';
import {
  MessageSquare, Send, Search, Plus, Paperclip, MoreHorizontal
} from 'lucide-react';

export default function Chat() {
  const [conversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');

  return (
    <div className="flex h-[calc(100vh-12rem)] -m-8">
      {/* Conversation List */}
      <div className="w-80 bg-white/[0.02] border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">Messages</h2>
            <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No conversations yet</p>
              <p className="text-xs text-slate-500 mt-1">Start a new conversation to begin chatting</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedChat(conv)}
                className={`w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-white/[0.03] ${
                  selectedChat?.id === conv.id ? 'bg-blue-500/10 border-l-2 border-blue-500' : 'border-l-2 border-transparent'
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                    {conv.name?.charAt(0) || '?'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white truncate">{conv.name}</p>
                    <span className="text-xs text-slate-500 shrink-0">{conv.time}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{conv.lastMsg}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-blue-500 text-[10px] font-bold text-white rounded-full">
                    {conv.unread}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {selectedChat.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{selectedChat.name}</p>
                  <p className="text-xs text-emerald-400">Online</p>
                </div>
              </div>
              <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                <MoreHorizontal size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-slate-500">No messages yet. Start the conversation!</p>
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                  <Paperclip size={18} />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all"
                  />
                </div>
                <button className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Select a conversation</p>
              <p className="text-sm text-slate-500 mt-1">Choose a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
