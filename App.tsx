import React, { useState, useEffect, useRef } from 'react';
import { initializeChat, sendMessageToGemini } from './services/geminiService';
import { Message, AgentType } from './types';
import AgentBadge from './components/AgentBadge';
import Dashboard from './components/Dashboard';
import { Send, Plus, Loader2, FileDown, ShieldCheck, Activity, FileText, LayoutDashboard, MessageSquare, User, Calendar, CreditCard } from 'lucide-react';

// Use a fallback for development if env is missing (Best practice is .env, but for this demo:)
const API_KEY = process.env.API_KEY || ''; 

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'chat' | 'dashboard'>('chat');
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentType>(AgentType.COORDINATOR);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Gemini on mount
    if (API_KEY) {
        initializeChat(API_KEY);
    } else {
        // Add a system message if no key
        setMessages([{
            id: 'system-error',
            role: 'model',
            text: 'API Key tidak ditemukan. Pastikan process.env.API_KEY telah diatur.',
            timestamp: new Date(),
            activeAgent: AgentType.COORDINATOR
        }]);
    }

    // Initial Welcome Message
    setMessages([{
      id: 'welcome',
      role: 'model',
      text: 'Halo! Saya adalah Koordinator Sistem Rumah Sakit (SIMRS). Saya dapat membantu Anda dengan Informasi Pasien, Penjadwalan, Rekam Medis, atau Billing. Silakan pilih menu di bawah atau ketik permintaan Anda.',
      timestamp: new Date(),
      activeAgent: AgentType.COORDINATOR
    }]);
  }, []);

  useEffect(() => {
    if (currentView === 'chat') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentView]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textOverride) setInputText('');
    setIsLoading(true);
    setActiveAgent(AgentType.COORDINATOR); // Reset to coordinator initially

    try {
      const response = await sendMessageToGemini(userMsg.text);
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        timestamp: new Date(),
        activeAgent: response.agentUsed,
        groundingUrls: response.groundingUrls,
        generatedDocument: response.generatedDoc
      };

      setActiveAgent(response.agentUsed);
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Maaf, terjadi kesalahan saat menghubungkan ke server AI. Coba lagi nanti.",
        timestamp: new Date(),
        activeAgent: AgentType.COORDINATOR
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { 
        label: 'Info Pasien', 
        icon: User, 
        color: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100',
        text: 'Saya ingin mengecek informasi pendaftaran pasien.' 
    },
    { 
        label: 'Jadwal Dokter', 
        icon: Calendar, 
        color: 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100',
        text: 'Saya ingin membuat atau mengecek jadwal janji temu dokter.' 
    },
    { 
        label: 'Rekam Medis', 
        icon: FileText, 
        color: 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100',
        text: 'Saya butuh akses data rekam medis dan riwayat penyakit.' 
    },
    { 
        label: 'Billing & Asuransi', 
        icon: CreditCard, 
        color: 'bg-yellow-50 text-yellow-600 border-yellow-100 hover:bg-yellow-100',
        text: 'Cek status tagihan dan informasi cakupan asuransi.' 
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Context & Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white border-r border-slate-700 transition-all">
        <div className="p-4 border-b border-slate-700 flex items-center gap-2">
           <div className="bg-teal-500 p-1.5 rounded-lg">
             <Activity className="w-5 h-5 text-white" />
           </div>
           <div>
             <h1 className="font-bold text-lg leading-tight">SIMRS Agentic</h1>
             <p className="text-xs text-slate-400">FHIR Interoperable</p>
           </div>
        </div>
        
        {/* Navigation Menu */}
        <div className="p-4 space-y-2">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Menu Utama</h2>
            <button 
                onClick={() => setCurrentView('chat')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    currentView === 'chat' 
                    ? 'bg-teal-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
            >
                <MessageSquare className="w-4 h-4" />
                Asisten AI
            </button>
            <button 
                onClick={() => setCurrentView('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    currentView === 'dashboard' 
                    ? 'bg-teal-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
            >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard Admin
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Arsitektur Agen</h2>
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div> Koordinator Utama
                </div>
                <div className="ml-4 pl-2 border-l border-slate-700 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> Info Pasien
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Penjadwalan
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> Rekam Medis
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div> Billing
                    </div>
                </div>
            </div>
          </div>

          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
            <h3 className="text-xs font-semibold text-teal-400 mb-2 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Kepatuhan Regulasi
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
                Sistem ini mematuhi PMK No. 24 Tahun 2022 tentang Rekam Medis Elektronik dan terintegrasi dengan SATUSEHAT.
            </p>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-400 to-blue-500 flex items-center justify-center font-bold text-xs">
                    Dr
                </div>
                <div className="text-sm">
                    <p className="font-medium">Dr. Admin</p>
                    <p className="text-xs text-slate-400">Kepala Instalasi</p>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Mobile Header */}
        <div className="md:hidden p-4 bg-slate-900 text-white flex items-center justify-between">
            <span className="font-bold">SIMRS Agentic</span>
            <button onClick={() => setCurrentView(currentView === 'chat' ? 'dashboard' : 'chat')} className="p-2">
                {currentView === 'chat' ? <LayoutDashboard className="w-5 h-5"/> : <MessageSquare className="w-5 h-5"/>}
            </button>
        </div>

        {currentView === 'dashboard' ? (
            <Dashboard />
        ) : (
            <>
                {/* Chat Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                    <div className={`max-w-[85%] md:max-w-[70%] space-y-1`}>
                        
                        {msg.role === 'model' && msg.activeAgent && (
                            <div className="mb-1">
                                <AgentBadge type={msg.activeAgent} />
                            </div>
                        )}

                        <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.role === 'user' 
                            ? 'bg-slate-900 text-white rounded-tr-none' 
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                        }`}>
                        {msg.text}

                        {/* Generated Document Card */}
                        {msg.generatedDocument && (
                            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-red-100 p-2 rounded text-red-600">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">{msg.generatedDocument.title}</p>
                                        <p className="text-xs text-slate-500 uppercase">{msg.generatedDocument.type} Document</p>
                                    </div>
                                </div>
                                <button className="p-2 hover:bg-slate-200 rounded text-slate-600">
                                    <FileDown className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Grounding Sources */}
                        {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                                <p className="text-xs font-semibold text-slate-500 mb-1">Sumber:</p>
                                <div className="flex flex-wrap gap-2">
                                    {msg.groundingUrls.map((url, idx) => (
                                        <a 
                                            key={idx} 
                                            href={url} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded truncate max-w-[200px]"
                                        >
                                            {new URL(url).hostname}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                        </div>
                        
                        <p className={`text-[10px] text-slate-400 px-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                            {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex justify-start w-full">
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                        <span className="text-sm text-slate-500 font-medium">
                            {activeAgent === AgentType.COORDINATOR 
                                ? 'Koordinator sedang menganalisis...' 
                                : `${activeAgent} sedang memproses...`}
                        </span>
                    </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions & Input Area */}
                <div className="bg-white border-t border-slate-200">
                    {/* Quick Action Buttons - Only show for Coordinator or at start */}
                    {activeAgent === AgentType.COORDINATOR && !isLoading && (
                        <div className="px-4 pt-4 pb-2">
                             <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Pilih Layanan Sub-Agen:</p>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {quickActions.map((action, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSendMessage(action.text)}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all text-left shadow-sm ${action.color}`}
                                    >
                                        <action.icon className="w-4 h-4 flex-shrink-0" />
                                        <span>{action.label}</span>
                                    </button>
                                ))}
                             </div>
                        </div>
                    )}

                    <div className="p-4">
                        <div className="max-w-4xl mx-auto relative flex items-end gap-2 p-2 border border-slate-300 rounded-xl focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-transparent transition-all shadow-sm bg-slate-50">
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                                <Plus className="w-5 h-5" />
                            </button>
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Tanya info pasien, jadwal dokter, atau rekam medis..."
                                className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 py-2 text-sm text-slate-800 placeholder:text-slate-400"
                                rows={1}
                                style={{ minHeight: '44px' }}
                            />
                            <button 
                                onClick={() => handleSendMessage()}
                                disabled={!inputText.trim() || isLoading}
                                className={`p-2 rounded-lg transition-all ${
                                    !inputText.trim() || isLoading
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                                }`}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-center text-[10px] text-slate-400 mt-2">
                            SIMRS AI dapat membuat kesalahan. Harap verifikasi informasi medis penting.
                        </p>
                    </div>
                </div>
            </>
        )}
      </main>
    </div>
  );
};

export default App;