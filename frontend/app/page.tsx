"use client";

import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const [formData, setFormData] = useState({ symbol: "", quantity: "", price: "", type: "BUY" });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:8000/transactions/add?symbol=${formData.symbol}&quantity=${formData.quantity}&price=${formData.price}&type=${formData.type}`, {
        method: "POST"
      });
      if (res.ok) {
        setShowManualModal(false);
        setFormData({ symbol: "", quantity: "", price: "", type: "BUY" });
        alert("Transação salva com sucesso!");
      }
    } catch (err) {
      alert("Erro ao salvar transação.");
    }
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
      } else {
        setAnswer("Erro ao processar nota: " + data.error);
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
      const res = await fetch("http://localhost:8000/ai/ask?question=" + encodeURIComponent(question), {
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
    <main className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-br from-white to-gray-500 bg-clip-text text-transparent">
              Carteira
            </h1>
            <p className="text-gray-500 mt-2 text-lg">Gestão inteligente de patrimônio.</p>
          </div>
          <div className="flex gap-4">
            {session ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 mr-4">
                  <span className="text-xs text-gray-400 uppercase tracking-widest">IA AI</span>
                  <button 
                    onClick={() => setAiEnabled(!aiEnabled)}
                    className={`w-10 h-5 rounded-full transition-all relative ${aiEnabled ? 'bg-blue-600' : 'bg-gray-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${aiEnabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                <img src={session.user?.image || ""} alt="" className="w-8 h-8 rounded-full border border-white/20" />
                <button 
                  onClick={() => signOut()}
                  className="bg-[#1a1a1a] hover:bg-[#252525] border border-gray-800 px-6 py-2 rounded-full text-sm font-medium transition-all"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button 
                onClick={() => signIn("google")}
                className="bg-[#1a1a1a] hover:bg-[#252525] border border-gray-800 px-6 py-2 rounded-full text-sm font-medium transition-all"
              >
                Login com Google
              </button>
            )}
            <button 
              onClick={() => setShowManualModal(true)}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-blue-900/20 transition-all"
            >
              Nova Transação
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Dashboard Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Balance Card */}
            <div className="relative group overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-8 rounded-[2rem] border border-white/5 shadow-2xl">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
              <div className="relative z-10">
                <p className="text-gray-400 font-medium">Patrimônio Total</p>
                <div className="text-5xl font-black mt-2">R$ 44.550,00</div>
                <div className="flex items-center gap-2 mt-4 text-green-400 font-semibold bg-green-500/10 w-fit px-3 py-1 rounded-full text-sm">
                  <span className="text-xs">▲</span> +2.4% este mês
                </div>
              </div>
            </div>

            {/* Asset Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Ações", value: "R$ 15.200", icon: "📈", color: "from-green-500/20" },
                { label: "Cripto", value: "R$ 4.350", icon: "₿", color: "from-orange-500/20" },
                { label: "FIIs", value: "R$ 12.000", icon: "🏢", color: "from-blue-500/20" },
                { label: "Tesouro", value: "R$ 13.000", icon: "🏦", color: "from-yellow-500/20" },
              ].map((asset) => (
                <div key={asset.label} className={`bg-gradient-to-br ${asset.color} to-transparent bg-opacity-5 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer`}>
                  <div className="text-2xl mb-2">{asset.icon}</div>
                  <div className="text-gray-400 text-sm font-medium">{asset.label}</div>
                  <div className="text-xl font-bold mt-1">{asset.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Sidepanel */}
          <div className={`lg:col-span-1 transition-all duration-500 ${aiEnabled ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="bg-[#0f0f0f] border border-white/10 rounded-[2rem] p-8 h-full flex flex-col shadow-2xl">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                GPT OSS 20B
              </h2>
              
              <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                <div className="bg-[#1a1a1a] p-4 rounded-2xl rounded-tl-none border border-white/5 text-sm leading-relaxed text-gray-300">
                  Olá! Eu sou seu copiloto de investimentos. Como posso ajudar com sua carteira hoje?
                </div>
                {answer && (
                  <div className="bg-blue-600/10 p-4 rounded-2xl rounded-tr-none border border-blue-500/20 text-sm leading-relaxed text-blue-100 italic">
                    {answer}
                  </div>
                )}
              </div>

              <div className="relative mt-auto">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), askAI())}
                  placeholder="Ex: Qual foi o lucro da Vale no 3T23?"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none h-32 pr-12"
                />
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <label className="cursor-pointer bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                  </label>
                  <button
                    onClick={askAI}
                    disabled={loading}
                    className="bg-white text-black p-2 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    {loading ? "..." : "→"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 10px;
        }
      `}</style>
      {/* Manual Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowManualModal(false)} />
          <div className="relative bg-[#111] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-2xl font-bold mb-6">Lançamento Manual</h3>
            <form className="space-y-4" onSubmit={handleManualSubmit}>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold">Ativo</label>
                <input 
                  type="text" 
                  value={formData.symbol}
                  onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                  placeholder="PETR4, BTC, etc" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold">Qtd</label>
                  <input 
                    type="number" 
                    step="any" 
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold">Preço</label>
                  <input 
                    type="number" 
                    step="any" 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500" 
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold mt-4 shadow-lg shadow-blue-900/20 transition-all"
              >
                Salvar Transação
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
