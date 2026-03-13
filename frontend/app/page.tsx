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
  Server,
  Activity,
  DollarSign,
  Briefcase,
  LineChart,
  List,
  FileBadge
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
  const [activeTab, setActiveTab] = useState("resumo");
  const [formData, setFormData] = useState({ 
    symbol: "", 
    quantity: "", 
    price: "", 
    fees: "", 
    category: "stocks", 
    date: new Date().toISOString().split('T')[0],
    type: "buy" 
  });
  
  // Transaction Wizard State
  const [transactionStep, setTransactionStep] = useState(1);
  const [validationError, setValidationError] = useState("");
  
  // Autocomplete State
  const [searchResults, setSearchResults] = useState<{symbol: string, search_symbol: string, name: string, type?: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Ticker search debounce
  useEffect(() => {
    if (transactionStep !== 1 || !formData.symbol || formData.symbol.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`http://localhost:8000/api/stock/search?query=${formData.symbol}&category=${formData.category}`);
        const data = await res.json();
        if (data.results) {
          setSearchResults(data.results);
          setShowSuggestions(true);
        }
      } catch (e) {
        console.error("Error searching ticker", e);
      }
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.symbol, formData.category, transactionStep]);

  const handleValidationStep = async () => {
    if (!formData.symbol) return setValidationError("Ticker obrigatório");
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/stock/validate?symbol=${formData.symbol}&category=${formData.category}`);
      const data = await res.json();
      if (data.valid) {
        setValidationError("");
        // Salva o search_symbol (.SA) caso seja B3 para buscar a cotação correta
        setFormData(prev => ({...prev, symbol: data.search_symbol || data.symbol}));
        setTransactionStep(2);
      } else {
        setValidationError("Ticker não encontrado");
      }
    } catch (error) {
      setValidationError("Erro ao validar ticker");
    }
    setLoading(false);
  };



  // App Settings State
  const [appSettings, setAppSettings] = useState({
    walletName: "AI WALLET",
    language: "pt-br",
    lmStudioUrl: "http://127.0.0.1:1234/v1"
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
      const payload = {
        symbol: formData.symbol,
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        type: formData.type,
        category: formData.category,
        date: formData.date,
        fees: formData.fees ? parseFloat(formData.fees) : 0.0
      };
      const res = await fetch(`http://localhost:8000/transactions/add?${new URLSearchParams(payload as any)}`, { method: "POST" });
      if (res.ok) {
        // Trigger auto-sync
        if (session?.accessToken) {
            fetch(`http://localhost:8000/sync?access_token=${session.accessToken}`, { method: "POST" }).catch(console.error);
        }
        setTransactionStep(3);
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
              <div className="flex items-center gap-3">
                <div className="p-3 glass rounded-xl cursor-pointer hover:bg-white/5 transition-all group" title="Backup no Google Drive">
                  <CloudUpload className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <img src={session.user?.image || ""} className="w-10 h-10 rounded-xl border-2 border-primary/50 p-0.5" alt="Profile" />
              </div>
            ) : (
              <button 
                onClick={() => signIn("google")} 
                className="glass-card !p-3 !rounded-xl hover:bg-white/10 flex items-center gap-2 group" 
                title="Login com Google para Backup"
              >
                <CloudUpload className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
              </button>
            )}

            <button 
              onClick={() => setShowManualModal(true)}
              className="bg-primary hover:opacity-90 p-3 rounded-2xl transition-all flex items-center justify-center shadow-lg shadow-primary/20"
              title="Nova Transação"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* --- TABS NAVIGATION --- */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-8 custom-scrollbar scroll-smooth">
          {[
            { id: "resumo", label: "Resumo", icon: <TrendingUp className="w-4 h-4" /> },
            { id: "proventos", label: "Proventos", icon: <DollarSign className="w-4 h-4" /> },
            { id: "patrimonio", label: "Patrimônio", icon: <Briefcase className="w-4 h-4" /> },
            { id: "rentabilidade", label: "Rentabilidade", icon: <LineChart className="w-4 h-4" /> },
            { id: "lancamentos", label: "Lançamentos", icon: <List className="w-4 h-4" /> },
            { id: "irpf", label: "IRPF", icon: <FileBadge className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "glass text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Dashboard Content Area */}
          <div className="lg:col-span-8 space-y-8">
            
            {activeTab === "resumo" && (
              <>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: "Ações BR", value: "R$ 15.200", icon: <TrendingUp className="w-5 h-5 text-green-400" />, trend: "+1.2%" },
                { label: "Stocks (US)", value: "$ 1.450", icon: <PieChart className="w-5 h-5 text-indigo-400" />, trend: "+2.1%" },
                { label: "Cripto", value: "R$ 4.350", icon: <Bitcoin className="w-5 h-5 text-orange-400" />, trend: "-0.5%" },
                { label: "FIIs", value: "R$ 12.000", icon: <Building2 className="w-5 h-5 text-blue-400" />, trend: "+0.8%" },
                { label: "Fixa", value: "R$ 13.000", icon: <Landmark className="w-5 h-5 text-yellow-500" />, trend: "+0.2%" },
              ].map((asset) => (
                <div key={asset.label} className="glass-card hover:scale-[1.02] active:scale-[0.98] !p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">{asset.icon}</div>
                    <span className={`text-[9px] font-bold ${asset.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.trend}
                    </span>
                  </div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest truncate">{asset.label}</p>
                  <p className="text-lg font-black mt-1">{asset.value}</p>
                </div>
              ))}
            </div>
            </>
            )}

            {activeTab === "proventos" && (
              <div className="space-y-6">
                <div className="glass-card flex items-center justify-between p-6">
                  <div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Recebido (2024)</h3>
                    <p className="text-3xl font-black mt-1">R$ 1.250,00</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-green-400 opacity-50" />
                </div>
                
                <div className="glass-card p-6 min-h-[300px] flex flex-col justify-center items-center text-gray-500">
                  <div className="w-full mb-4 flex justify-between items-center">
                    <h4 className="font-bold text-white">Evolução de Proventos</h4>
                    <span className="text-xs bg-white/10 px-3 py-1 rounded-full">Mensal</span>
                  </div>
                  <div className="flex-1 w-full flex items-end justify-between gap-2 pt-4 border-t border-white/10">
                    {/* Mock Bar Chart */}
                    {[10, 25, 40, 30, 60, 45, 80, 50, 90, 70, 110, 100].map((h, i) => (
                      <div key={i} className="w-full flex flex-col items-center gap-2 group">
                        <div className="w-full bg-primary/40 hover:bg-primary rounded-t-sm transition-all relative" style={{ height: `${h}px` }}>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            R$ {h * 1.5}
                          </div>
                        </div>
                        <span className="text-[8px] text-gray-500">{['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h4 className="font-bold text-white mb-4">Últimos Pagamentos</h4>
                  <div className="space-y-3">
                    {[
                      { ticker: "PETR4", type: "Dividendo", amount: "R$ 45,00", date: "15 Mai 2024" },
                      { ticker: "MXRF11", type: "Rendimento", amount: "R$ 12,50", date: "14 Mai 2024" },
                      { ticker: "BBAS3", type: "JCP", amount: "R$ 30,00", date: "02 Mai 2024" }
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-black text-xs text-primary">{item.ticker.substring(0,4)}</div>
                          <div>
                            <p className="font-bold text-sm">{item.ticker}</p>
                            <p className="text-xs text-gray-400">{item.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-400">{item.amount}</p>
                          <p className="text-xs text-gray-500">{item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "patrimonio" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-6 flex flex-col justify-center items-center">
                    <Briefcase className="w-12 h-12 text-primary opacity-50 mb-4" />
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Custo Total</h3>
                    <p className="text-2xl font-black mt-1">R$ 40.000,00</p>
                  </div>
                  <div className="glass-card p-6 flex flex-col justify-center items-center">
                    <TrendingUp className="w-12 h-12 text-green-400 opacity-50 mb-4" />
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Lucro Aberto</h3>
                    <p className="text-2xl font-black mt-1 text-green-400">+ R$ 4.550,00</p>
                  </div>
                </div>

                <div className="glass-card p-0 overflow-hidden">
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h4 className="font-bold text-white">Meus Ativos</h4>
                    <button className="text-xs bg-primary px-3 py-1.5 rounded-lg font-bold hover:bg-primary/80 transition-all flex items-center gap-1">
                      <Plus className="w-3 h-3"/> Novo Ativo
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-400 uppercase bg-black/20 font-black">
                        <tr>
                          <th className="px-6 py-4">Ativo</th>
                          <th className="px-6 py-4">Preço Médio</th>
                          <th className="px-6 py-4">Qtd.</th>
                          <th className="px-6 py-4">Total</th>
                          <th className="px-6 py-4 text-right">Rentabilidade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { ticker: "PETR4", name: "Petrobras", pm: "30,00", qty: "100", total: "3.500,00", rent: "+16.6%" },
                          { ticker: "WEGE3", name: "WEG", pm: "35,00", qty: "50", total: "1.900,00", rent: "+8.5%" },
                          { ticker: "MXRF11", name: "Maxi Renda", pm: "10,20", qty: "300", total: "3.150,00", rent: "+2.9%" },
                          { ticker: "BTC", name: "Bitcoin", pm: "300.000", qty: "0.01", total: "4.350,00", rent: "+45.0%" },
                        ].map((row, i) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-bold">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px]">{row.ticker.substring(0,1)}</div>
                                <div>
                                  <div>{row.ticker}</div>
                                  <div className="text-xs text-gray-500 font-normal">{row.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">R$ {row.pm}</td>
                            <td className="px-6 py-4">{row.qty}</td>
                            <td className="px-6 py-4 font-bold">R$ {row.total}</td>
                            <td className={`px-6 py-4 text-right font-bold ${row.rent.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                              {row.rent}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "rentabilidade" && (
              <div className="space-y-6">
                <div className="glass-card flex items-center justify-between p-6">
                  <div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Rentabilidade da Carteira</h3>
                    <p className="text-3xl font-black mt-1 text-green-400">+ 15.4%</p>
                  </div>
                  <LineChart className="w-10 h-10 text-green-400 opacity-50" />
                </div>
                
                <div className="glass-card p-6 min-h-[300px] flex flex-col justify-center items-center text-gray-500">
                  <div className="w-full mb-4 flex justify-between items-center">
                    <h4 className="font-bold text-white">Carteira x IBOV x CDI</h4>
                  </div>
                  <div className="flex-1 w-full h-[200px] bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                    {/* Placeholder for actual multi-line chart */}
                    <p className="text-xs">Gráfico Comparativo (Carteira em Verde, IBOV em Azul, CDI em Amarelo)</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "lancamentos" && (
              <div className="glass-card p-0 overflow-hidden">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                  <h4 className="font-bold text-white">Histórico de Lançamentos</h4>
                  <div className="flex gap-2">
                    <button className="text-xs glass px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2">
                       Filtrar <TrendingUp className="w-3 h-3"/>
                    </button>
                    <button 
                      onClick={() => setShowManualModal(true)}
                      className="text-xs bg-primary px-3 py-1.5 rounded-lg font-bold hover:bg-primary/80 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3"/> Novo
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-white/5">
                  {[
                    { type: "Compra", asset: "PETR4", qty: "100", price: "R$ 35,00", date: "10 Mai 2024", total: "R$ -3.500,00" },
                    { type: "Venda", asset: "WEGE3", qty: "50", price: "R$ 40,00", date: "05 Mai 2024", total: "R$ +2.000,00" },
                    { type: "Compra", asset: "BTC", qty: "0.01", price: "R$ 300.000", date: "01 Mai 2024", total: "R$ -3.000,00" },
                  ].map((tx, i) => (
                    <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4 mb-2 sm:mb-0">
                        <div className={`w-2 h-10 rounded-full ${tx.type === 'Compra' ? 'bg-primary' : 'bg-orange-500'}`} />
                        <div>
                          <p className="font-bold text-sm flex items-center gap-2">
                            {tx.asset} <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400 font-normal">{tx.type}</span>
                          </p>
                          <p className="text-xs text-gray-500">{tx.date} • {tx.qty} cotas a {tx.price}</p>
                        </div>
                      </div>
                      <p className={`font-bold ${tx.type === 'Compra' ? 'text-white' : 'text-green-400'}`}>
                        {tx.total}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "irpf" && (
              <div className="space-y-6">
                <div className="glass-card flex items-center justify-between p-6">
                  <div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Ano Base</h3>
                    <select className="bg-transparent text-xl font-black mt-1 text-white outline-none">
                      <option>2023</option>
                      <option>2022</option>
                    </select>
                  </div>
                  <FileBadge className="w-10 h-10 text-blue-400 opacity-50" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-6 border border-blue-500/30 bg-blue-500/5">
                    <h4 className="font-bold text-blue-400 mb-2">Bens e Direitos</h4>
                    <p className="text-xs text-gray-400 mb-4">Resumo da sua posição acionária no último dia do ano para declaração.</p>
                    <button className="text-xs bg-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-500 transition-all w-full">Ver Relatório</button>
                  </div>
                  <div className="glass-card p-6 border border-green-500/30 bg-green-500/5">
                    <h4 className="font-bold text-green-400 mb-2">Rendimentos Isentos</h4>
                    <p className="text-xs text-gray-400 mb-4">Total de dividendos e rendimentos isentos recebidos no ano.</p>
                    <button className="text-xs bg-green-600 px-4 py-2 rounded-lg font-bold hover:bg-green-500 transition-all w-full">Ver Relatório</button>
                  </div>
                </div>
              </div>
            )}
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
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black tracking-tighter">Lançamento de Ativo</h3>
                <div className="flex gap-1">
                  {[1, 2].map(step => (
                     <div key={step} className={`h-2 w-8 rounded-full ${transactionStep >= step ? 'bg-primary' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>

              {validationError && (
                <div className="bg-red-500/20 text-red-400 p-3 rounded-xl text-xs font-bold mb-6 text-center border border-red-500/30">
                  {validationError}
                </div>
              )}

              {transactionStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Categoria</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value, symbol: ''})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-1 focus:ring-primary font-bold text-sm text-white appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}
                    >
                      <option value="stocks" className="bg-[#0d0f17]">Ações B3</option>
                      <option value="stocks_us" className="bg-[#0d0f17]">Stocks US</option>
                      <option value="crypto" className="bg-[#0d0f17]">Cripto</option>
                      <option value="fii" className="bg-[#0d0f17]">FIIs</option>
                      <option value="etf" className="bg-[#0d0f17]">ETFs</option>
                    </select>
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Símbolo do Ativo</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={formData.symbol}
                        onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                        onFocus={() => { if(formData.symbol.length >= 2) setShowSuggestions(true); }}
                        placeholder="Ex: PETR4, BTC, AAPL" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-1 focus:ring-primary uppercase font-bold text-center text-xl tracking-widest relative z-10" 
                      />
                      {isSearching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
                          <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        </div>
                      )}
                    </div>
                    
                    {/* Autocomplete Dropdown */}
                    <AnimatePresence>
                      {showSuggestions && searchResults.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute w-full mt-2 bg-[#1a1c29] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                          {searchResults.map((result, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setFormData({...formData, symbol: result.symbol});
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors flex justify-between items-center group cursor-pointer"
                            >
                              <div>
                                <p className="font-bold text-white group-hover:text-primary transition-colors">{result.symbol}</p>
                                <p className="text-xs text-gray-400 truncate max-w-[200px]">{result.name}</p>
                              </div>
                              <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-500 uppercase">{result.type}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <button 
                    onClick={handleValidationStep}
                    disabled={loading || !formData.symbol}
                    className="w-full bg-primary py-5 rounded-2xl font-black text-sm uppercase tracking-widest mt-4 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? 'Validando...' : 'Próximo Passo'}
                  </button>
                </div>
              )}

              {transactionStep === 2 && (
                <form className="space-y-5" onSubmit={handleManualSubmit}>
                  <div className="bg-white/5 p-3 rounded-2xl text-center border border-white/10">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Ativo Selecionado</p>
                    <p className="text-lg font-black text-white mt-0.5">{formData.symbol}</p>
                  </div>

                  <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl">
                     <button
                        type="button"
                        onClick={() => setFormData({...formData, type: "buy"})}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${formData.type === "buy" ? "bg-primary text-white shadow" : "text-gray-400 hover:text-white"}`}
                      >COMPRA</button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, type: "sell"})}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all ${formData.type === "sell" ? "bg-orange-500 text-white shadow" : "text-gray-400 hover:text-white"}`}
                      >VENDA</button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Data da Operação</label>
                    <input 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-1 focus:ring-primary font-bold text-center text-lg" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Quantidade</label>
                      <input 
                        type="number" step="any" 
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                        placeholder="0"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus:outline-none focus:ring-1 focus:ring-primary font-bold text-center text-xl" 
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Preço Unitário</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">R$</span>
                        <input 
                          type="number" step="any" 
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          placeholder="0.00"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-4 focus:outline-none focus:ring-1 focus:ring-primary font-bold text-xl" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Taxas / Emolumentos</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">R$</span>
                      <input 
                        type="number" step="any" 
                        value={formData.fees}
                        onChange={(e) => setFormData({...formData, fees: e.target.value})}
                        placeholder="0.00"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-4 focus:outline-none focus:ring-1 focus:ring-primary font-bold text-sm" 
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 mt-4">
                    <button 
                      type="button"
                      onClick={() => setTransactionStep(1)}
                      className="flex-1 bg-white/5 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button 
                      type="submit"
                      disabled={loading || !formData.quantity || !formData.price}
                      className="flex-[2] bg-primary py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Salvando...' : 'Confirmar Lançamento'}
                    </button>
                  </div>
                </form>
              )}

              {/* Success Screen */}
              {transactionStep === 3 && (
                <div className="space-y-8 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white">Lançamento Registrado!</h4>
                      <p className="text-sm text-gray-400 mt-1">Operação salva com sucesso.</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => {
                        setFormData({ symbol: '', quantity: '', price: '', fees: '', category: formData.category, date: new Date().toISOString().split('T')[0], type: 'buy' });
                        setTransactionStep(1);
                        setValidationError('');
                      }}
                      className="w-full bg-primary py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Lançar Nova Ordem
                    </button>
                    <button 
                      onClick={() => {
                        setShowManualModal(false);
                        setTransactionStep(1);
                        setFormData({ symbol: '', quantity: '', price: '', fees: '', category: 'stocks', date: new Date().toISOString().split('T')[0], type: 'buy' });
                        setValidationError('');
                      }}
                      className="w-full bg-white/5 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer text-gray-400"
                    >
                      Fechar Lançamento
                    </button>
                  </div>
                </div>
              )}
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
