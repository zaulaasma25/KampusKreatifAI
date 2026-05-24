"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Trash2, 
  History, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  Share2, 
  RefreshCw, 
  FileText, 
  Instagram, 
  Twitter, 
  Layers, 
  Monitor, 
  HelpCircle, 
  ExternalLink,
  BookOpen,
  DollarSign,
  Users,
  MessageSquare,
  Zap,
  Phone,
  Edit2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Local storage key
const STORAGE_KEY = "kampus_kreatif_ai_history3";

// Types
interface CaptionOption {
  optionNumber: number;
  style: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
}

interface CaptionResult {
  captions: CaptionOption[];
  generalDraftNotes: string;
}

interface ContentIdea {
  title: string;
  hook: string;
  visualBrief: string;
  explanation: string;
  estimatedEffort: string;
}

interface IdeaStrategy {
  dos: string[];
  donts: string[];
  bestTime: string;
  interactionHack: string;
}

interface IdeaResult {
  theme: string;
  targetAudience: string;
  blueprintTitle: string;
  ideas: ContentIdea[];
  strategy: IdeaStrategy;
}

interface HistoryItem {
  id: string;
  timestamp: string;
  mode: "caption" | "ideas";
  topic: string;
  organization: string;
  context: string;
  tone?: string;
  platform?: string;
  data: CaptionResult | IdeaResult;
}

export default function KampusKreatifPage() {
  // Input states
  const [activeTab, setActiveTab] = useState<"caption" | "ideas">("caption");
  const [organization, setOrganization] = useState("");
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("Kehidupan Kampus/Umum");
  const [tone, setTone] = useState("Santai & Asik");
  const [platform, setPlatform] = useState("Instagram Carousel");
  const [customInstructions, setCustomInstructions] = useState("");

  // Generation status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active workspace results
  const [captionResult, setCaptionResult] = useState<CaptionResult | null>(null);
  const [ideaResult, setIdeaResult] = useState<IdeaResult | null>(null);

  // Editing mode for captions (allows direct fine-tuning before copying!)
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedHook, setEditedHook] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [editedCta, setEditedCta] = useState("");
  const [editedHashtags, setEditedHashtags] = useState("");

  // Social Preview Emulator Context
  const [selectedCaptionPreview, setSelectedCaptionPreview] = useState<number>(1);
  const [selectedIdeaPreview, setSelectedIdeaPreview] = useState<number>(0);
  const [previewPlatform, setPreviewPlatform] = useState<"instagram" | "tiktok" | "twitter">("instagram");
  const [simulatedLikes, setSimulatedLikes] = useState<number>(187);
  const [simulatedComments, setSimulatedComments] = useState<number>(42);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Copy success animation triggers
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // History state
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Starter templates (gimmicks for fast populating)
  const starters = {
    caption: [
      {
        label: "Sambatan KRS Crash",
        icon: "🚨",
        context: "Akademik & Curhat Kampus",
        tone: "Humoris",
        topic: "Udah bangun subuh demi rebutan KRS kelas Dosbing killer, tapi pas login web Siakad-nya malah 'Service Unavailable'. Mana bayaran UKT naik mulu!",
        org: "BEM / Curhat Mahasiswa"
      },
      {
        label: "Danusan Risol Mayo",
        icon: "🥟",
        context: "Danusan & Proker",
        tone: "Santai & Asik",
        topic: "Danusan jualan risol mayo crispy buatan panitia makrab HMJ yang lumer, murah cuma goban dapet 3 biji buat nambahin dana kas proker.",
        org: "HMJ Manajemen Kreatif"
      },
      {
        label: "Oprec Staff Ormawa",
        icon: "📣",
        context: "Rekrutmen & Oprec",
        tone: "Inspiratif & Ambis",
        topic: "Open recruitment pengurus BEM periode baru. Dicari mahasiswa aktif yang bertanggung jawab, komunikatif, mau belajar, tahan banting, dan no-drama.",
        org: "BEM Universitas Muda"
      },
      {
        label: "Kritik Tugas Menumpuk",
        icon: "📚",
        context: "Humor/Curhat Kampus",
        tone: "FOMO",
        topic: "Diberondong tugas makalah, slide presentasi, review jurnal internasional, dan kuis mingguan. Tiap malem begadang ditemani mie instan dan kopi.",
        org: "Anak Semester Tua"
      }
    ],
    ideas: [
      {
        label: "Daya Tarik Makrab Jurusan",
        icon: "🪵",
        context: "Program Kerja/Kehidupan Mahasiswa",
        platform: "Instagram Reels",
        topic: "Mempromosikan event Malam Keakraban (Makrab) biar maba berbondong-bondong daftar dan ga ngerasa dipaksa kating.",
        org: "HIMA Sastra"
      },
      {
        label: "Trik Jitu Skripsi Kilat",
        icon: "🎓",
        context: "Tips Mahasiswa/Edukasi",
        platform: "TikTok Viral",
        topic: "Tips and tricks cara menyiasati dosen pembimbing killer yang susah dicari, cara translate jurnal ilmiah cepet, dan lolos uji plagiarism turnitin.",
        org: "Klub Penulis Kampus"
      },
      {
        label: "Kampanye BEM Go Green",
        icon: "🌳",
        context: "Program Kerja/Kehidupan Mahasiswa",
        platform: "Instagram Carousel",
        topic: "Mengajak mahasiswa mengumpulkan sampah botol plastik di sekitar kampus dan menukarkannya dengan e-wallet/snack sehat.",
        org: "Kementerian LHK BEM"
      }
    ]
  };

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHistoryList(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Gagal membaca history:", e);
    }
  }, []);

  // Save history helper
  const saveHistory = (newItem: HistoryItem) => {
    try {
      const updated = [newItem, ...historyList].slice(0, 15); // limit to 15
      setHistoryList(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Gagal menyimpan history:", e);
    }
  };

  // Clear history
  const clearHistory = () => {
    if (confirm("Apakah kamu yakin ingin menghapus semua riwayat draft?")) {
      setHistoryList([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleApplyStarter = (item: any) => {
    setOrganization(item.org);
    setTopic(item.topic);
    setContext(item.context);
    setTone(item.tone || "Santai & Asik");
    if (item.platform) {
      setPlatform(item.platform);
    }
    setErrorMsg(null);
  };

  // Run the generation API call
  const generateSocialContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setErrorMsg("Harap isi topik atau deskripsi event terlebih dahulu!");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setEditingIndex(null); // Reset edit state

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: activeTab,
          organization: organization || "Mahasiswa Kreatif",
          topic,
          context,
          tone: activeTab === "caption" ? tone : undefined,
          platform: activeTab === "ideas" ? platform : undefined,
          customInstructions
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Terjadi kesalahan pada server.");
      }

      const timestampLabel = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

      if (activeTab === "caption") {
        setCaptionResult(data);
        setIdeaResult(null);
        setSelectedCaptionPreview(1);
        
        // Save to History
        const hist: HistoryItem = {
          id: Math.random().toString(36).substring(3),
          timestamp: timestampLabel,
          mode: "caption",
          topic,
          organization: organization || "Mahasiswa Kreatif",
          context,
          tone,
          data
        };
        saveHistory(hist);
      } else {
        setIdeaResult(data);
        setCaptionResult(null);
        setSelectedIdeaPreview(0);

        // Save to History
        const hist: HistoryItem = {
          id: Math.random().toString(36).substring(3),
          timestamp: timestampLabel,
          mode: "ideas",
          topic,
          organization: organization || "Mahasiswa Kreatif",
          context,
          platform,
          data
        };
        saveHistory(hist);
      }

      // Roll custom simulated values for interactions to feel responsive
      setSimulatedLikes(Math.floor(Math.random() * 450) + 50);
      setSimulatedComments(Math.floor(Math.random() * 80) + 12);
      setIsLiked(false);
      setIsBookmarked(false);

    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Gagal terkoneksi dengan asisten kecerdasan KampusKreatif AI. Coba beberapa saat lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Copy text utility with feedback
  const copyToClipboard = (text: string, elementId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(elementId);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Formats caption option as raw copyable text block
  const getFormattedCaptionText = (cap: { style: string; hook: string; body: string; cta: string; hashtags: string[] }) => {
    return `${cap.hook}\n\n${cap.body}\n\n${cap.cta}\n\n${cap.hashtags.join(" ")}`;
  };

  // Custom Editable Save
  const handleStartEdit = (index: number, cap: CaptionOption) => {
    setEditingIndex(index);
    setEditedHook(cap.hook);
    setEditedBody(cap.body);
    setEditedCta(cap.cta);
    setEditedHashtags(cap.hashtags.join(" "));
  };

  const handleSaveEdit = (index: number) => {
    if (!captionResult) return;
    
    const updatedCaptions = [...captionResult.captions];
    updatedCaptions[index] = {
      ...updatedCaptions[index],
      hook: editedHook,
      body: editedBody,
      cta: editedCta,
      hashtags: editedHashtags.split(" ").filter(t => t.startsWith("#") || t.length > 0).map(t => t.startsWith("#") ? t : `#${t}`)
    };

    setCaptionResult({
      ...captionResult,
      captions: updatedCaptions
    });
    setEditingIndex(null);
  };

  // Load old item from history
  const loadHistoryItem = (item: HistoryItem) => {
    setActiveTab(item.mode);
    setTopic(item.topic);
    setOrganization(item.organization);
    setContext(item.context);
    if (item.tone) setTone(item.tone);
    if (item.platform) setPlatform(item.platform);

    if (item.mode === "caption") {
      setCaptionResult(item.data as CaptionResult);
      setIdeaResult(null);
      setSelectedCaptionPreview(1);
    } else {
      setIdeaResult(item.data as IdeaResult);
      setCaptionResult(null);
      setSelectedIdeaPreview(0);
    }
    setIsHistoryOpen(false);
  };

  // Interactive style preview generators
  const getActivePreviewCaption = () => {
    if (!captionResult) return null;
    const activeCap = captionResult.captions.find(c => c.optionNumber === selectedCaptionPreview);
    return activeCap || captionResult.captions[0];
  };

  const getActivePreviewIdea = () => {
    if (!ideaResult) return null;
    return ideaResult.ideas[selectedIdeaPreview] || ideaResult.ideas[0];
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans" id="kampus-kreatif-root">
      
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-emerald-100" id="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <Sparkles className="w-5.5 h-5.5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 font-heading">
                KampusKreatif <span className="text-emerald-600">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider -mt-1 hidden sm:block">
                OFFICIAL SOCIAL MEDIA STRATEGIST V2.0 // EST. 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              title="Lihat Riwayat Draft"
              id="btn-history-toggle"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Riwayat Draft</span>
              {historyList.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-emerald-500 text-white rounded-full text-[9px]">
                  {historyList.length}
                </span>
              )}
            </button>
            <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-mono font-semibold text-slate-500 hidden md:block">
              🇮🇩 INDONESIA CLASS
            </div>
          </div>
        </div>
      </header>

      {/* CORE FRAME CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6" id="core-main">
        
        {/* HERO BANNER SECTION */}
        <section id="banner-section" className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-xl shadow-teal-900/10 overflow-hidden">
          {/* Subtle design visuals (no tech jargon indicators, clean geometry only) */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute -bottom-8 left-1/3 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-200 text-xs font-semibold mb-4 border border-white/10">
              <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
              #AntiRibetAntiKaku - Khusus Maba, BEM, HIMA & UKM Kreatif
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading leading-tight">
              Racik Copywriting Dan Ide Konten Viral Kampusmu!
            </h2>
            <p className="mt-2 text-sm sm:text-base text-emerald-50/95 leading-relaxed">
              Mulai dari sambatan KRS, jualan risol danusan kas, oprec panitia yang seru, hingga program kerja mentereng BEM. Tulis caption asik dengan 3 variasi gaya bahasa auto-lolos revisi dosen pembimbing!
            </p>
          </div>
        </section>

        {/* WORKSPACE METADATA & GRID CONTAINER */}
        <div id="workspace-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: CREATIVE CONTROLS PANEL (5/12) */}
          <div className="lg:col-span-5 flex flex-col gap-5" id="creative-inputs-column">
            
            {/* WORKSPACE SELECTION TABS */}
            <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex" id="panel-tabs">
              <button
                onClick={() => {
                  setActiveTab("caption");
                  setErrorMsg(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "caption"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
                id="tab-btn-caption"
              >
                <FileText className="w-4 h-4" />
                Pembuat Caption 3 Gaya
              </button>
              <button
                onClick={() => {
                  setActiveTab("ideas");
                  setErrorMsg(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "ideas"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-100/10"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
                id="tab-btn-ideas"
              >
                <Layers className="w-4 h-4" />
                Ide Konten & Strategy
              </button>
            </div>

            {/* FORM CARD */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4" id="form-card">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700">
                    {activeTab === "caption" ? <FileText className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {activeTab === "caption" ? "Briefing Copywriting Caption" : "Pengaturan Ide Konten"}
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md">
                  Form Input
                </span>
              </div>

              {/* STARTERS / TEMPLATE QUICK ACCESS */}
              <div className="flex flex-col gap-1.5" id="starter-kit">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  🚀 Template Cepat (Khasiat Instan)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(activeTab === "caption" ? starters.caption : starters.ideas).map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyStarter(item)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer"
                      title={item.topic}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={generateSocialContent} className="flex flex-col gap-4">
                
                {/* INITIATOR */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    Penerbit / Nama Organisasi
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Contoh: BEM Fakultas, HMJ Kimia, UKM Musik, Anak Semester Tua"
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                    id="input-org"
                  />
                </div>

                {/* TARGET PLATFORM (ONLY FOR IDEAS) */}
                {activeTab === "ideas" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Monitor className="w-3.5 h-3.5 text-emerald-600" />
                      Platform Media Sosial Utama
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {["Instagram Carousel", "TikTok Viral Reels", "Twitter/X Thread"].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPlatform(p)}
                          className={`py-2 rounded-xl text-[11px] font-semibold border transition-all ${
                            platform === p
                              ? "bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-400/10"
                              : "bg-white text-slate-500 border-slate-100 hover:border-slate-300"
                          }`}
                        >
                          {p.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* CONTEXT CATEGORY */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    Kategori Konteks / Fokus Posting
                  </label>
                  <select
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    id="select-context"
                  >
                    <option value="Kehidupan Kampus/Umum">Kehidupan Kampus / Umum 🎒</option>
                    <option value="Akademik & Perkuliahan">Akademik & Perkuliahan (KRS, IPK, Skripsi) 📚</option>
                    <option value="Program Kerja & Event">Program Kerja & Event Ormawa BEM/HIMA 🎪</option>
                    <option value="Danusan Ormawa">Danusan & Jualan Pendanaan Kas 🥟</option>
                    <option value="Rekrutmen & Oprec Staff">Oprec Kepanitiaan & Staff Baru 📣</option>
                    <option value="Curhat & Sambat Kampus">Curhatan / Humor / Kehidupan Kos 🥣</option>
                  </select>
                </div>

                {/* TONE SELECTION (ONLY FOR CAPTION) */}
                {activeTab === "caption" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      Gaya Bahasa Utama (Tone)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {["Santai & Asik", "Humoris", "Inspiratif & Ambis", "FOMO", "Serius tapi Sopan"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTone(t)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            tone === t
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-slate-50 text-slate-600 border-slate-200/60 hover:border-slate-300"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* THE CORE TOPIC DESCRIPTION */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1 justify-between">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      Ceritakan Topik atau Masalah Kampusmu
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">Wajib</span>
                  </label>
                  <textarea
                    rows={4}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Contoh: Bikin postingan ngingetin oprec panitia d-3 tutup pendaftaran. Targetnya maba males ikutan birokrat kampus biar terpancing aktif berorganisasi."
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 leading-relaxed resize-none"
                    id="input-topic"
                  />
                </div>

                {/* TAILORED / CUSTOM INSTRUCTIONS */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    Pesan Tambahan / Aturan Main (Optional)
                  </label>
                  <input
                    type="text"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Contoh: Sisipkan slang 'bjir' / 'menyala abangkuh' / batasi maks 150 kata"
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                    id="input-custom-instruction"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium" id="alert-error">
                    ⚠️ {errorMsg}
                  </div>
                )}

                {/* BUTTON SUBMIT */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    isLoading 
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20"
                  }`}
                  id="btn-submit"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sedang Meracik Kreativitas Kampus...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 fill-current" />
                      {activeTab === "caption" ? "Mulai Racik 3 Varian Caption ✨" : "Buat Rencana Konten Taktis 📊"}
                    </>
                  )}
                </button>

              </form>
            </div>

            {/* QUICK ACADEMIC VALUE CHEAT SHEET */}
            <div className="p-4 bg-slate-100 rounded-2xl text-[11px] text-slate-500 leading-relaxed flex items-start gap-2.5 border border-slate-200/50" id="cheat-sheet">
              <span className="text-base">💡</span>
              <div>
                <strong className="text-slate-800">Tips Viral Kampus Keren:</strong> Mahasiswa menyukai konten yang <span className="text-emerald-700 font-semibold">Humor Relatable</span> (beban IPK, revisi, danusan) & <span className="text-emerald-700 font-semibold">Visual Unik</span>. Gunakan copywriting kami, lalu saksikan pendaftaran proker & danusan meningkat drastis!
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: INTERACTIVE PREVIEW & PLAYGROUND (7/12) */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-6 items-start" id="creative-outputs-column">
            
            {/* INCOMING RESULTS & EDITS PANEL (7/12 is splitting internally: left for result text, right for simulated phone) */}
            <div className="md:col-span-12 lg:col-span-12 flex flex-col gap-6 w-full">
              
              <div className="flex flex-col gap-6">

                {/* NO RESULT PLACEHOLDER */}
                {!captionResult && !ideaResult && !isLoading && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center gap-4 py-16"
                    id="placeholder-empty"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl">
                      🧙‍♂️
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Menunggu Brief Kreatifmu</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                        Silakan pilih slata kartu template cepat di samping atau buat deskripsi mandiri. KampusKreatif AI siap menyulap ide dasar menjadi caption viral dalam sedetik!
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* LOADING PLACEHOLDER STATE */}
                {isLoading && (
                  <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center gap-4 py-20" id="loading-state">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center text-emerald-600 font-bold text-xs">
                        🚀
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-extrabold text-slate-900">Sedang Menganalisis Tren Mahasiswa...</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto animate-pulse">
                        Menyesuaikan kosa kata gaul, merapikan struktur Hook, Body, dan CTA sesuai mandat resmi KampusKreatif AI.
                      </p>
                    </div>
                  </div>
                )}

                {/* CORE CONTENT RETRIEVED CONTAINER */}
                {((captionResult && activeTab === "caption") || (ideaResult && activeTab === "ideas")) && !isLoading && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="result-visual-split">
                    
                    {/* RESULT CARD (CAPTION OR PLANS) - 7/12 of internal row */}
                    <div className="md:col-span-7 flex flex-col gap-5">
                      
                      {/* CAPTIONS RETRIEVED LIST */}
                      {captionResult && activeTab === "caption" && (
                        <div className="flex flex-col gap-5" id="captions-block">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              3 Varian Hasil Caption Kami
                            </h3>
                          </div>

                          {captionResult.captions.map((cap, idx) => {
                            const isCurrentlySelected = selectedCaptionPreview === cap.optionNumber;
                            const isEditingNow = editingIndex === idx;

                            return (
                              <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`bg-white rounded-2xl p-4 border transition-all flex flex-col gap-3 relative overflow-hidden ${
                                  isCurrentlySelected 
                                    ? "border-emerald-500 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/10" 
                                    : "border-slate-100 shadow-sm hover:border-slate-200"
                                }`}
                              >
                                {/* Header of specific Option */}
                                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                                      Opsi {cap.optionNumber}
                                    </span>
                                    <span className="text-xs font-bold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/30">
                                      {cap.style}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => setSelectedCaptionPreview(cap.optionNumber)}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                        isCurrentlySelected
                                          ? "bg-emerald-600 text-white"
                                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                      }`}
                                    >
                                      <Monitor className="w-3 h-3" />
                                      Pratinjau
                                    </button>
                                  </div>
                                </div>

                                {/* EDITING PANEL VS TEXT DISPLAY PANEL */}
                                {isEditingNow ? (
                                  <div className="space-y-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200">
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-slate-400 block uppercase">Hook</label>
                                      <textarea
                                        className="w-full p-2 bg-white text-xs border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                        value={editedHook}
                                        onChange={(e) => setEditedHook(e.target.value)}
                                        rows={2}
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-slate-400 block uppercase">Body</label>
                                      <textarea
                                        className="w-full p-2 bg-white text-xs border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                        value={editedBody}
                                        onChange={(e) => setEditedBody(e.target.value)}
                                        rows={4}
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-slate-400 block uppercase">Call To Action (CTA)</label>
                                      <input
                                        type="text"
                                        className="w-full p-2 bg-white text-xs border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                        value={editedCta}
                                        onChange={(e) => setEditedCta(e.target.value)}
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-slate-400 block uppercase">Hashtags</label>
                                      <input
                                        type="text"
                                        className="w-full p-2 bg-white text-xs border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                        value={editedHashtags}
                                        onChange={(e) => setEditedHashtags(e.target.value)}
                                        placeholder="Separated with space e.g. #HIMA #KRS"
                                      />
                                    </div>
                                    <div className="flex gap-1.5 justify-end pt-1">
                                      <button
                                        onClick={() => setEditingIndex(null)}
                                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-bold transition-all cursor-pointer"
                                      >
                                        Batal
                                      </button>
                                      <button
                                        onClick={() => handleSaveEdit(idx)}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                                      >
                                        Simpan
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs space-y-2.5 leading-relaxed text-slate-700">
                                    <div className="font-extrabold text-slate-900 border-l-2 border-emerald-500 pl-2">
                                      {cap.hook}
                                    </div>
                                    <div className="whitespace-pre-line text-slate-600 text-[11px] bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/30">
                                      {cap.body}
                                    </div>
                                    <div className="font-semibold text-emerald-800 italic text-[11px]">
                                      👉 {cap.cta}
                                    </div>
                                    <div className="flex flex-wrap gap-1 text-[10px] font-bold text-emerald-600 font-mono">
                                      {cap.hashtags.join(" ")}
                                    </div>
                                  </div>
                                )}

                                {/* Card footer actions */}
                                <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
                                  <button
                                    onClick={() => handleStartEdit(idx, cap)}
                                    className="text-slate-500 hover:text-emerald-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                    title="Edit Draft Caption Ini"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    Ubah Kalimat
                                  </button>

                                  <button
                                    onClick={() => copyToClipboard(getFormattedCaptionText(cap), `cap-${idx}`)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 border transition-all cursor-pointer ${
                                      copiedId === `cap-${idx}`
                                        ? "bg-emerald-500 text-white border-emerald-500"
                                        : "bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100"
                                    }`}
                                    id={`btn-copy-${idx}`}
                                  >
                                    {copiedId === `cap-${idx}` ? (
                                      <>
                                        <Check className="w-3.5 h-3.5" />
                                        Tersalin!
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        Salin Opsi {cap.optionNumber}
                                      </>
                                    )}
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}

                          {/* Notes from KampusKreatif AI */}
                          {captionResult.generalDraftNotes && (
                            <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 text-xs text-amber-950 flex gap-2">
                              <span>🧙‍♂️</span>
                              <div>
                                <strong className="font-bold">Rekomendasi Strategis KampusKreatif AI:</strong>
                                <p className="mt-1 leading-relaxed text-amber-900/90 text-[11px]">
                                  {captionResult.generalDraftNotes}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* BLUEPRINT RETRIEVED CONTAINER */}
                      {ideaResult && activeTab === "ideas" && (
                        <div className="flex flex-col gap-5" id="ideas-block">
                          <div className="flex flex-col gap-1.5">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                              Blueprint Konten Kampus Viral
                            </h3>
                            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">JUDUL BLUEPRINT</span>
                              <h4 className="text-sm font-extrabold text-slate-900">{ideaResult.blueprintTitle}</h4>
                              <div className="flex gap-2 mt-2">
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                                  Tema: {ideaResult.theme}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-600 text-[10px] font-bold">
                                  Audiens: {ideaResult.targetAudience}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Main list of strategic ideas */}
                          <div className="flex flex-col gap-4">
                            {ideaResult.ideas.map((idea, idx) => {
                              const isCurrentlySelected = selectedIdeaPreview === idx;
                              return (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, y: 15 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  className={`bg-white rounded-2xl p-4 border transition-all flex flex-col gap-3 relative overflow-hidden ${
                                    isCurrentlySelected
                                      ? "border-emerald-500 shadow-md ring-1 ring-emerald-500/10"
                                      : "border-slate-100 shadow-sm hover:border-slate-200"
                                  }`}
                                >
                                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-extrabold text-slate-700 font-mono">
                                        {idx + 1}
                                      </span>
                                      <h5 className="text-xs font-extrabold text-slate-900 leading-tight">
                                        {idea.title}
                                      </h5>
                                    </div>
                                    <span className="text-[9px] font-bold font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">
                                      Effort: {idea.estimatedEffort}
                                    </span>
                                  </div>

                                  <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                                    <div>
                                      <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider text-emerald-800">Ide Hook Visual / Awal</span>
                                      <p className="border-l-2 border-emerald-500 pl-2 mt-0.5 font-semibold text-slate-900">{idea.hook}</p>
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">Visual Brief / Panduan</span>
                                      <p className="mt-0.5 text-slate-500 text-[11px] bg-slate-50 p-2 rounded-xl">{idea.visualBrief}</p>
                                    </div>
                                    <div>
                                      <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">Penjelasan Detail & Eksekusi</span>
                                      <p className="mt-0.5 text-[11px]">{idea.explanation}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between border-t border-slate-50 pt-2 mt-1">
                                    <button
                                      onClick={() => setSelectedIdeaPreview(idx)}
                                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                        isCurrentlySelected
                                          ? "bg-emerald-600 text-white"
                                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                                      }`}
                                    >
                                      <Monitor className="w-3.5 h-3.5" />
                                      Pratinjau Visual Ini
                                    </button>

                                    <button
                                      onClick={() => copyToClipboard(`Ide Konten: ${idea.title}\nHook: ${idea.hook}\nVisual: ${idea.visualBrief}\nPenjelasan: ${idea.explanation}`, `idea-${idx}`)}
                                      className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                                        copiedId === `idea-${idx}`
                                          ? "bg-emerald-500 text-white border-emerald-500"
                                          : "bg-slate-50 text-slate-600 border-slate-200/50 hover:bg-slate-100"
                                      }`}
                                    >
                                      {copiedId === `idea-${idx}` ? "Tersalin!" : "Salin Ide"}
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>

                          {/* Strategy execution: Dos & Donts */}
                          <div className="bg-slate-900 rounded-2xl p-4 text-white flex flex-col gap-3.5 shadow-md">
                            <h5 className="text-xs font-bold text-amber-300 uppercase tracking-widest border-b border-slate-800 pb-2">
                              🛡️ Strategi Publikasi & Interaction Hack
                            </h5>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <span className="text-[10px] font-extrabold text-emerald-400 block uppercase tracking-wider">DO (Lakukan!)</span>
                                <ul className="space-y-1 list-none p-0 text-[10.5px]">
                                  {ideaResult.strategy.dos.map((d, i) => (
                                    <li key={i} className="flex gap-1.5">
                                      <span className="text-emerald-400">✅</span>
                                      <span>{d}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-extrabold text-rose-400 block uppercase tracking-wider">DON&apos;T (Hindari!)</span>
                                <ul className="space-y-1 list-none p-0 text-[10.5px]">
                                  {ideaResult.strategy.donts.map((d, i) => (
                                    <li key={i} className="flex gap-1.5">
                                      <span className="text-rose-400">❌</span>
                                      <span>{d}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div className="border-t border-slate-800 pt-3 flex flex-col md:flex-row gap-3">
                              <div className="flex-1 space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Jam Posting Terbaik</span>
                                <p className="text-[11px] text-amber-200">{ideaResult.strategy.bestTime}</p>
                              </div>
                              <div className="flex-1 space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Trik Dongkrak Komen (Hack)</span>
                                <p className="text-[11px] text-teal-200">{ideaResult.strategy.interactionHack}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* INTERACTIVE SOCIAL MEDIA EMULATOR (5/12 of internal row) */}
                    <div className="md:col-span-5 flex flex-col gap-4">
                      
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          📱 Live Post Emulator
                        </h4>
                        
                        {/* Selector for Preview Shell */}
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border">
                          <button
                            onClick={() => setPreviewPlatform("instagram")}
                            className={`px-2 py-1 rounded text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              previewPlatform === "instagram"
                                ? "bg-white text-emerald-800 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                            }`}
                          >
                            <Instagram className="w-3 h-3" />
                            Insta
                          </button>
                          <button
                            onClick={() => setPreviewPlatform("twitter")}
                            className={`px-2 py-1 rounded text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              previewPlatform === "twitter"
                                ? "bg-white text-emerald-800 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                            }`}
                          >
                            <Twitter className="w-3 h-3" />
                            Tweet
                          </button>
                        </div>
                      </div>

                      {/* SIMULATED PHONE WRAPPER */}
                      <div className="relative mx-auto w-full max-w-[290px] rounded-[32px] bg-slate-950 p-2.5 shadow-2xl border-4 border-slate-800 overflow-hidden" id="phone-shell">
                        {/* Speaker Notch */}
                        <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-slate-950 rounded-full z-20 flex items-center justify-center">
                          <div className="w-8 h-1 bg-slate-800 rounded-full" />
                        </div>

                        {/* Screen Area */}
                        <div className="rounded-[24px] bg-slate-900 text-slate-100 overflow-hidden text-xs relative pt-4 flex flex-col min-h-[440px]" id="phone-screen">
                          
                          {/* Top Status Bar Mock */}
                          <div className="px-3 py-1 flex justify-between text-[9px] text-slate-400 font-mono">
                            <span>07.35</span>
                            <div className="flex gap-1 items-center">
                              <span>📶</span>
                              <span>🔋 99%</span>
                            </div>
                          </div>

                          {/* INSTAGRAM EMULATION */}
                          {previewPlatform === "instagram" && (
                            <div className="flex-1 flex flex-col bg-slate-950 text-white relative">
                              {/* Post Header */}
                              <div className="p-2 flex items-center justify-between border-b border-slate-900">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-500 p-0.5">
                                    <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold font-mono">
                                      🎒
                                    </div>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-[10px] lowercase text-slate-200">
                                      {organization ? `@${organization.toLowerCase().replace(/\s+/g, "_")}` : "@bem_anak_muda"}
                                    </div>
                                    <div className="text-[7px] text-slate-400">Kampus Terpadu</div>
                                  </div>
                                </div>
                                <span className="text-slate-400 text-sm">•••</span>
                              </div>

                              {/* Instapost Graphic Square */}
                              <div className="aspect-square w-full relative bg-gradient-to-tr from-emerald-950 via-slate-900 to-cyan-950 flex flex-col items-center justify-center text-center p-4 border-b border-slate-900">
                                <div className="absolute inset-0 bg-slate-950/20" />
                                <div className="relative z-10 space-y-2">
                                  {/* College Mock Logo */}
                                  <div className="mx-auto w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">
                                    ⚔️
                                  </div>
                                  <span className="text-[7px] font-mono tracking-widest text-emerald-400 block uppercase">
                                    {context.split(" ")[0]}
                                  </span>
                                  <h6 className="text-[12px] font-extrabold tracking-tight px-3 text-slate-100 line-clamp-3 leading-snug font-sans">
                                    {activeTab === "caption" ? (getActivePreviewCaption()?.hook || "Revolusi Konten Kampus Pintar!") : (getActivePreviewIdea()?.hook || "Tips Lolos Skripsi!")}
                                  </h6>
                                  <span className="inline-block text-[7px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/30">
                                    {activeTab === "caption" ? getActivePreviewCaption()?.style : "MOCK BLUEPRINT"}
                                  </span>
                                </div>
                              </div>

                              {/* Interactivity Bar */}
                              <div className="p-2 flex items-center justify-between text-slate-200">
                                <div className="flex gap-2.5">
                                  <button onClick={() => {
                                    setSimulatedLikes(prev => isLiked ? prev - 1 : prev + 1);
                                    setIsLiked(!isLiked);
                                  }} className="hover:scale-110 active:scale-90 transition-transform cursor-pointer">
                                    <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                                  </button>
                                  <button onClick={() => setSimulatedComments(prev => prev + 1)} className="hover:scale-110 transition-transform cursor-pointer">
                                    <MessageCircle className="w-4 h-4" />
                                  </button>
                                  <Send className="w-4 h-4 text-slate-300" />
                                </div>
                                <button onClick={() => setIsBookmarked(!isBookmarked)} className="cursor-pointer">
                                  <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-teal-400 text-teal-400" : ""}`} />
                                </button>
                              </div>

                              {/* Likes Description */}
                              <div className="px-2 text-[8px] font-extrabold text-slate-200">
                                {simulatedLikes.toLocaleString("id-ID")} Suka
                              </div>

                              {/* Caption Text Section */}
                              <div className="px-2 pb-3 overflow-y-auto max-h-[80px] text-[8px] space-y-0.5 text-slate-300 pointer-events-auto">
                                <span className="font-extrabold lowercase text-white mr-1.5">
                                  {organization ? `@${organization.toLowerCase().replace(/\s+/g, "_")}` : "@bem_anak_muda"}
                                </span>
                                {activeTab === "caption" ? (
                                  <>
                                    <span className="font-bold text-emerald-400 mr-1">{getActivePreviewCaption()?.hook}</span>
                                    <span>{getActivePreviewCaption()?.body}</span>
                                    <span className="block mt-1 font-bold text-yellow-300">{getActivePreviewCaption()?.cta}</span>
                                    <span className="block text-emerald-500/90 font-mono mt-1 font-semibold">{getActivePreviewCaption()?.hashtags.join(" ")}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-bold text-emerald-400 mr-1">{getActivePreviewIdea()?.title}</span>
                                    <span>{getActivePreviewIdea()?.explanation}</span>
                                    <span className="block text-[7px] text-slate-400 italic">Visual: {getActivePreviewIdea()?.visualBrief}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )}

                          {/* TWITTER / X EMULATION */}
                          {previewPlatform === "twitter" && (
                            <div className="flex-1 flex flex-col bg-slate-950 text-white p-3 space-y-2 pointer-events-auto">
                              
                              <div className="flex gap-2">
                                <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-xs">
                                  ✊
                                </div>
                                <div className="flex-1 text-[9px]">
                                  <span className="font-bold text-slate-100 block text-[10px]">
                                    {organization || "Anak Kampus Ambis"}
                                  </span>
                                  <span className="text-slate-500">
                                    {organization ? `@${organization.toLowerCase().replace(/\s+/g, "")}` : "@bem_maba"} • Just now
                                  </span>
                                </div>
                              </div>

                              <div className="text-[10px] text-slate-200 whitespace-pre-wrap leading-relaxed">
                                {activeTab === "caption" ? (
                                  <>
                                    <p className="font-bold text-emerald-400 mb-1">{getActivePreviewCaption()?.hook}</p>
                                    <p className="text-slate-300">{getActivePreviewCaption()?.body}</p>
                                    <p className="font-bold text-amber-300 mt-1">{getActivePreviewCaption()?.cta}</p>
                                    <p className="text-teal-400 font-mono text-[9px] mt-1.5">{getActivePreviewCaption()?.hashtags.join(" ")}</p>
                                  </>
                                ) : (
                                  <>
                                    <p className="font-bold text-emerald-400 mb-1">📢 {getActivePreviewIdea()?.title}</p>
                                    <p className="text-slate-300 mb-1">{getActivePreviewIdea()?.explanation}</p>
                                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[8px] text-slate-400 italic">
                                      Visual Brief: {getActivePreviewIdea()?.visualBrief}
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Twitter interaction mock buttons */}
                              <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-900 text-[8px] items-center">
                                <div className="flex items-center gap-1.5 hover:text-emerald-500 transition-colors cursor-pointer">
                                  <span>💬</span>
                                  <span>{simulatedComments}</span>
                                </div>
                                <div className="flex items-center gap-1.5 hover:text-green-500 transition-colors cursor-pointer">
                                  <span>🔁</span>
                                  <span>12</span>
                                </div>
                                <button onClick={() => {
                                  setSimulatedLikes(prev => isLiked ? prev - 1 : prev + 1);
                                  setIsLiked(!isLiked);
                                }} className="flex items-center gap-1.5 hover:text-rose-500 transition-colors cursor-pointer">
                                  <span>{isLiked ? "❤️" : "🖤"}</span>
                                  <span>{simulatedLikes}</span>
                                </button>
                                <div>📤</div>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 text-center leading-normal">
                        Atur target postinganmu, klik <span className="font-semibold text-slate-600">Pratinjau / Visual</span> untuk meng-update simulasi handphone di atas.
                      </div>

                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>

        </div>

      </main>

      {/* DRAWER / MODAL RIWAYAT DRAFT */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden" id="modal-history">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsHistoryOpen(false)}
            />
            
            <div className="absolute inset-y-0 right-0 max-w-full pl-10 flex">
              <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-screen max-w-md bg-white flex flex-col shadow-2xl"
              >
                
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">Riwayat Draft Kreatif</h3>
                      <p className="text-[10px] text-slate-400">Tersimpan di storage lokal browser kamu.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsHistoryOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer text-xs font-semibold"
                  >
                    Tutup
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {historyList.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-2.5">
                      <span className="text-2xl">🍿</span>
                      <p className="text-xs">Kamu belum memiliki riwayat draf apapun.</p>
                    </div>
                  ) : (
                    historyList.map((item, idx) => (
                      <div 
                        key={idx}
                        className="p-3.5 bg-slate-50 border border-slate-200/50 hover:border-emerald-300 rounded-2xl flex flex-col gap-2.5 transition-all text-xs"
                      >
                        <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            item.mode === "caption" ? "bg-emerald-100 text-emerald-800" : "bg-purple-100 text-purple-800"
                          }`}>
                            {item.mode === "caption" ? "Caption 3 Gaya" : "Blueprint Ide"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono font-semibold">
                            ⏰ {item.timestamp}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Penerbit</span>
                          <span className="text-slate-800 font-bold text-[11px] block">{item.organization}</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Topik / Masalah</span>
                          <p className="text-slate-600 text-[10.5px] line-clamp-2 leading-relaxed italic">
                            &ldquo;{item.topic}&rdquo;
                          </p>
                        </div>

                        <div className="flex gap-1.5 justify-end border-t border-slate-200/50 pt-2.5">
                          <button
                            onClick={() => loadHistoryItem(item)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            Gunakan Draft Ini
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer History */}
                {historyList.length > 0 && (
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <button
                      onClick={clearHistory}
                      className="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      Hapus Riwayat
                    </button>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Max 15 Draft Tersimpan
                    </span>
                  </div>
                )}

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER GENERAL */}
      <footer className="bg-white border-t border-slate-100 mt-12 py-6 text-center" id="footer">
        <div className="max-w-7xl mx-auto px-4 text-xs text-slate-400 space-y-2">
          <p className="font-semibold text-slate-500">
            KampusKreatif AI - Dibuat untuk melayani mahasiswa seluruh Indonesia 🇮🇩
          </p>
          <p className="text-[10px]">
            © 2026 KampusKreatif AI. All rights reserved. Powered by Google Gemini 3.5 Flash Model on server-side.
          </p>
        </div>
      </footer>

    </div>
  );
}
