"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { StockChart } from "./components/StockChart";
import { 
  TrendingUp, 
  Wallet, 
  Plus, 
  LogOut, 
  Bot, 
  Send, 
  FileText, 
  PieChart, 
  Bitcoin, 
  Building2, 
  Landmark,
  CloudUpload,
  Settings,
  Globe,
  Server
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

export default function Home() {
  const { data: session } = useSession();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [formData, setFormData] = useState({ symbol: "", quantity: "", price: "", type: "BUY" });
  
  // App Settings State
  const [appSettings, setAppSettings] = useState({
    walletName: "AI WALLET",
    language: "pt-br",
    lmStudioUrl: "http://localhost:1234/v1"
  });

  // Load settings on mount
  useEffect(() => {
    const saved = localStorage.getItem("ai_wallet_settings");
    if (saved) {
      try {
        setAppSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
  }, []);

  // Save settings
  const saveSettings = (newSettings: typeof appSettings) => {
    setAppSettings(newSettings);
    localStorage.setItem("ai_wallet_settings", JSON.stringify(newSettings));
    setShowSettingsModal(false);
  };

  // Mock data for the chart
  const chartData = [
    { time: '2024-01-01', value: 38000 },
    { time: '2024-02-01', value: 40500 },
    { time: '2024-03-01', value: 39000 },
    { time: '2024-04-01', value: 42000 },
    { time: '2024-05-01', value: 44550 },
  ];

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/transactions/add?symbol=${formData.symbol}&quantity=${formData.quantity}&price=${formData.price}&type=${formData.type}`, {
        method: "POST"
      });
      if (res.ok) {
        setShowManualModal(false);
        setFormData({ symbol: "", quantity: "", price: "", type: "BUY" });
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setLoading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/brokerage/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.status === "success") {
        setAnswer(`Extraí ${data.extracted_data.length} transação(ões) da nota ${file.name}.`);
      }
    } catch (err) {
      setAnswer("Erro ao enviar arquivo.");
    }
    setLoading(false);
  };

  const askAI = async () => {
    if (!question) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/ai/ask?question=${encodeURIComponent(question)}&base_url=${encodeURIComponent(appSettings.lmStudioUrl)}`, {
        method: "POST",
      });
      const data = await res.json();
      setAnswer(data.answer || data.error);
    } catch (err) {
      setAnswer("Erro ao conectar com o backend.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen text-white overflow-hidden bg-dot-white/[0.05]">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 glass p-6 rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-2xl neon-border">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter neon-text uppercase">
                {appSettings.walletName}
              </h1>
              <p className="text-gray-400 text-sm font-medium tracking-wide">SMART ASSET MANAGEMENT</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="p-3 glass rounded-xl cursor-pointer hover:bg-white/5 transition-all group"
              title="Configurações"
            >
              <Settings className="w-5 h-5 text-gray-400 group-hover:rotate-90 transition-transform duration-500" />
            </button>

            <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 px-4">
              <Bot className={`w-5 h-5 ${aiEnabled ? 'text-primary' : 'text-gray-500'}`} />
              <button 
                onClick={() => setAiEnabled(!aiEnabled)}
                className={`w-10 h-5 rounded-full transition-all relative ${aiEnabled ? 'bg-primary' : 'bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${aiEnabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            {session ? (
              <img src={session.user?.image || ""} className="w-10 h-10 rounded-xl border-2 border-primary/50 p-0.5" alt="Profile" />
            ) : (
              <button onClick={() => signIn("google")} className="glass-card !p-3 !rounded-xl hover:bg-white/10">
                <Plus className="w-5 h-5" />
              </button>
            )}

            <button 
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-2 bg-primary hover:opacity-90 px-6 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> NOVO ATIVO
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Dashboard */}
          <div className="lg:col-span-8 space-y-8">
            {/* Portfolio Summary Card */}
            <div className="glass-card flex flex-col md:flex-row gap-8 items-center lg:items-stretch">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Patrimônio Total</span>
                </div>
                <h2 className="text-5xl font-black tabular-nums">R$ 44.550,00</h2>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 bg-green-500/10 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-green-500/20">
                    +2.4% (Hoje)
                  </span>
                  <span className="text-gray-500 text-xs">Atualizado há 5 min</span>
                </div>
              </div>
              <div className="w-full md:w-2/3 h-[200px] md:h-auto">
                <StockChart data={chartData} />
              </div>
            </div>

            {/* Asset Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Ações", value: "R$ 15.200", icon: <TrendingUp className="w-5 h-5 text-green-400" />, trend: "+1.2%" },
                { label: "Cripto", value: "R$ 4.350", icon: <Bitcoin className="w-5 h-5 text-orange-400" />, trend: "-0.5%" },
                { label: "FIIs", value: "R$ 12.000", icon: <Building2 className="w-5 h-5 text-blue-400" />, trend: "+0.8%" },
                { label: "Fixa", value: "R$ 13.000", icon: <Landmark className="w-5 h-5 text-yellow-500" />, trend: "+0.2%" },
              ].map((asset) => (
                <div key={asset.label} className="glass-card hover:scale-[1.02] active:scale-[0.98]">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/10">{asset.icon}</div>
                    <span className={`text-[10px] font-bold ${asset.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.trend}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{asset.label}</p>
                  <p className="text-xl font-black mt-1">{asset.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Sidepanel */}
          <div className="lg:col-span-4 h-full">
            <AnimatePresence>
              {aiEnabled && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="glass-card h-full flex flex-col !p-0 overflow-hidden min-h-[500px]"
                >
                  <div className="p-6 border-b border-white/5 bg-white/5">
                    <h2 className="text-lg font-black flex items-center gap-3 tracking-tighter">
                      <Bot className="w-6 h-6 text-primary" />
                      AI ASSISTANT
                    </h2>
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
                    <div className="glass bg-white/5 p-4 rounded-3xl rounded-tl-none text-sm leading-relaxed border-white/5">
                      Olá! Sou seu assistente financeiro. Como posso analisar sua carteira hoje?
                    </div>
                    {answer && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-primary/10 p-4 rounded-3xl rounded-tr-none text-sm leading-relaxed border border-primary/20 text-blue-100"
                      >
                        {answer}
                      </motion.div>
                    )}
                  </div>

                  <div className="p-6 bg-black/20">
                    <div className="relative">
                      <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), askAI())}
                        placeholder="Pergunte qualquer coisa..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none h-24 pr-12"
                      />
                      <div className="absolute bottom-3 right-3 flex gap-2">
                        <label className="cursor-pointer hover:bg-white/10 p-2 rounded-xl transition-all">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                        </label>
                        <button
                          onClick={askAI}
                          disabled={loading}
                          className="bg-primary text-white p-2 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showManualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
              onClick={() => setShowManualModal(false)} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative glass-card max-w-md w-full !p-8 animate-neon-glow"
            >
              <h3 className="text-3xl font-black mb-8 tracking-tighter">Lançamento de Ativo</h3>
              <form className="space-y-6" onSubmit={handleManualSubmit}>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Símbolo do Ativo</label>
                  <input 
                    type="text" 
                    value={formData.symbol}
                    onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                    placeholder="Ex: PETR4, BTC, AAPL" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-1 focus:ring-primary uppercase font-bold" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Quantidade</label>
                    <input 
                      type="number" step="any" 
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-1 focus:ring-primary font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Preço Pago</label>
                    <input 
                      type="number" step="any" 
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-1 focus:ring-primary font-bold" 
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary py-5 rounded-2xl font-black text-sm uppercase tracking-widest mt-4 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Confirmar Lançamento
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
              onClick={() => setShowSettingsModal(false)} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative glass-card max-w-md w-full !p-8"
            >
              <div className="flex items-center gap-3 mb-8">
                <Settings className="w-8 h-8 text-primary" />
                <h3 className="text-3xl font-black tracking-tighter">Configurações</h3>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                    <Wallet className="w-3 h-3" /> Nome da Carteira
                  </label>
                  <input 
                    type="text" 
                    value={appSettings.walletName}
                    onChange={(e) => setAppSettings({...appSettings, walletName: e.target.value})}
                    placeholder="Ex: Minha Carteira" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-1 focus:ring-primary font-bold" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Idioma
                  </label>
                  <select 
                    value={appSettings.language}
                    onChange={(e) => setAppSettings({...appSettings, language: e.target.value})}
                    className="w-full bg-[#111] border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-1 focus:ring-primary font-bold appearance-none"
                  >
                    <option value="pt-br">Português (Brasil)</option>
                    <option value="english">English</option>
                    <option value="spanish">Español</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                    <Server className="w-3 h-3" /> LM Studio Server URL
                  </label>
                  <input 
                    type="text" 
                    value={appSettings.lmStudioUrl}
                    onChange={(e) => setAppSettings({...appSettings, lmStudioUrl: e.target.value})}
                    placeholder="http://localhost:1234/v1" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs" 
                  />
                </div>

                <button 
                  onClick={() => saveSettings(appSettings)}
                  className="w-full bg-primary py-5 rounded-2xl font-black text-sm uppercase tracking-widest mt-4 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        @keyframes neon-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.1); }
          50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.2); }
        }
        .animate-neon-glow { animation: neon-glow 4s infinite; }
      `}</style>
    </main>
  );
}
