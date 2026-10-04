import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Sun,
  Moon,
  Globe,
  MapPin,
  Sparkles,
  Check,
  RefreshCw,
  Plus,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  UserCheck,
  LogOut,
  Menu,
  X,
  Type as TypeIcon,
  Eye,
  Compass,
  HelpCircle,
  History as HistoryIcon,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Settings as SettingsIcon,
  Star,
  ShieldAlert,
  Play,
} from "lucide-react";
import {
  DecisionAnalysis,
  DecisionInputs,
  QnaHistoryEntry,
  UserPreferences,
  UserProfile,
} from "./types";
import { INITIAL_DEMO_ANALYSIS, SCENARIO_PRESETS } from "./data/demoPresets";
import { ChartsPanel } from "./components/ChartsPanel";
import { DashboardCharts } from "./components/DashboardCharts";
import { AdminPage } from "./components/AdminPage";

import droneHeroImg from "./assets/images/cinematic_drone_city_1791097019698.jpg";
import prismImg from "./assets/images/blind_spot_prism_1791097047905.jpg";

type PageRoute =
  | "/"
  | "/understand"
  | "/decision"
  | "/analysis"
  | "/blind-spots"
  | "/questions"
  | "/insights"
  | "/reflection"
  | "/dashboard"
  | "/history"
  | "/help"
  | "/feedback"
  | "/settings"
  | "/admin";

type FontSizeScale = "small" | "default" | "large" | "xlarge";

const FONT_SCALE_MAP: Record<FontSizeScale, number> = {
  small: 0.9,
  default: 1,
  large: 1.125,
  xlarge: 1.25,
};

const LOADING_MESSAGES = [
  "Thinking...",
  "Checking assumptions...",
  "Finding blind spots...",
  "Preparing insights...",
];

const DECISION_FLOW_STEPS: Array<{ path: PageRoute; label: string }> = [
  { path: "/decision", label: "DECISION" },
  { path: "/analysis", label: "ANALYSIS" },
  { path: "/blind-spots", label: "BLIND SPOTS" },
  { path: "/questions", label: "QUESTIONS" },
  { path: "/insights", label: "INSIGHTS" },
  { path: "/reflection", label: "REFLECTION" },
];

const TRAVEL_SAVINGS_PRESET: DecisionInputs = {
  situation:
    "I am thinking about traveling to another country, but I am worried about the cost and whether I should use my savings.",
  positives: "I like to travel and want the experience.",
  concerns: "Money problems and using too much of my savings.",
  currentLeaning: "I think I should save the money.",
  reasoning: "I am worried about financial problems.",
  uncertainties: "How much money I should keep as savings.",
  additionalOptions: ["Travel now", "Save money", "Travel later"],
};

export default function App() {
  // Current Route
  const [route, setRoute] = useState<PageRoute>(() => {
    const p = window.location.pathname as PageRoute;
    const valid: PageRoute[] = [
      "/",
      "/understand",
      "/decision",
      "/analysis",
      "/blind-spots",
      "/questions",
      "/insights",
      "/reflection",
      "/dashboard",
      "/history",
      "/help",
      "/feedback",
      "/settings",
      "/admin",
    ];
    return valid.includes(p) ? p : "/";
  });

  const navigate = (nextRoute: PageRoute) => {
    window.history.pushState({}, "", nextRoute);
    setRoute(nextRoute);
    setMenuOpen(false);
    setA11yOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const onPop = () => {
      const p = window.location.pathname as PageRoute;
      setRoute(p || "/");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Accessibility & Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("blindspot_theme") === "dark";
  });
  const [fontSize, setFontSize] = useState<FontSizeScale>(() => {
    return (localStorage.getItem("blindspot_font_scale") as FontSizeScale) || "default";
  });
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem("blindspot_high_contrast") === "true";
  });

  // Preferences
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem("blindspot_preferences");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      language: "English",
      location: { country: "India", state: "Maharashtra", city: "Pune" },
      gender: "Prefer not to say",
      reducedMotion: false,
    };
  });

  // Apply root CSS variables for font scale, theme, reduced motion, and high contrast
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--font-scale", String(FONT_SCALE_MAP[fontSize] || 1));
    localStorage.setItem("blindspot_font_scale", fontSize);

    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("blindspot_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("blindspot_theme", "light");
    }

    if (highContrast) {
      root.classList.add("high-contrast");
      localStorage.setItem("blindspot_high_contrast", "true");
    } else {
      root.classList.remove("high-contrast");
      localStorage.setItem("blindspot_high_contrast", "false");
    }

    if (preferences.reducedMotion) {
      root.classList.add("reduced-motion");
    } else {
      root.classList.remove("reduced-motion");
    }
  }, [fontSize, darkMode, highContrast, preferences.reducedMotion]);

  const updatePreferences = (next: UserPreferences) => {
    setPreferences(next);
    localStorage.setItem("blindspot_preferences", JSON.stringify(next));
  };

  // Opening Cinematic Drone Intro & Simplified Personalization Popup
  const [showDroneIntro, setShowDroneIntro] = useState<boolean>(() => {
    return !sessionStorage.getItem("blindspot_intro_seen");
  });
  const [introStep, setIntroStep] = useState<number>(0);
  const [showPersonalizationModal, setShowPersonalizationModal] = useState<boolean>(false);
  const droneImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!showDroneIntro) return;
    if (droneImageRef.current && !preferences.reducedMotion) {
      gsap.fromTo(
        droneImageRef.current,
        { scale: 1.08 },
        { scale: 1.0, duration: 6, ease: "power1.out" }
      );
    }
    const t1 = window.setTimeout(() => setIntroStep(1), 2200);
    const t2 = window.setTimeout(() => finishDroneIntro(), 5200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [showDroneIntro]);

  const finishDroneIntro = () => {
    sessionStorage.setItem("blindspot_intro_seen", "true");
    setShowDroneIntro(false);
    if (!localStorage.getItem("blindspot_personalized_done")) {
      setShowPersonalizationModal(true);
    }
  };

  // Navigation Menus
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [a11yOpen, setA11yOpen] = useState<boolean>(false);

  // AI Health Status (from GET /api/health)
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);

  const checkAiHealth = async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setAiConfigured(Boolean(data?.geminiConfigured ?? data?.aiConfigured));
    } catch {
      setAiConfigured(false);
    }
  };

  useEffect(() => {
    checkAiHealth();
  }, [route]);

  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("blindspot_token")
  );
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.authenticated && d.user) setUser(d.user);
      })
      .catch(() => {});
  }, [token]);

  // Core Decision Inputs (Persisted in localStorage so user input is NEVER lost)
  const [inputs, setInputs] = useState<DecisionInputs>(() => {
    const saved = localStorage.getItem("blindspot_draft_inputs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return SCENARIO_PRESETS[0].inputs;
  });

  useEffect(() => {
    localStorage.setItem("blindspot_draft_inputs", JSON.stringify(inputs));
  }, [inputs]);

  // Progressive disclosure count on /decision page (0 = only "What's happening?", 1..6 reveals more)
  const [revealedSteps, setRevealedSteps] = useState<number>(2);
  const [newOptionInput, setNewOptionInput] = useState<string>("");

  // Active Decision & Analysis State
  const [decisionId, setDecisionId] = useState<string | null>("dec_demo_internship");
  const [analysis, setAnalysis] = useState<DecisionAnalysis | null>(INITIAL_DEMO_ANALYSIS);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState<number>(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Stage index on /analysis page (0..4)
  const [analysisStageIdx, setAnalysisStageIdx] = useState<number>(0);

  // Expandable "Why?" on /blind-spots page
  const [expandedBlindSpots, setExpandedBlindSpots] = useState<Record<number, boolean>>({});

  // Q&A State on /questions page
  const [qnaRound, setQnaRound] = useState<number>(1);
  const [qnaHistory, setQnaHistory] = useState<QnaHistoryEntry[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<string[]>(
    INITIAL_DEMO_ANALYSIS.important_questions.map((q) => q.question)
  );
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [isGeneratingQna, setIsGeneratingQna] = useState<boolean>(false);
  const [qnaRoundSummary, setQnaRoundSummary] = useState<string | null>(null);

  // History list on /history and /dashboard
  const [historyList, setHistoryList] = useState<any[]>([]);

  const fetchHistoryList = async () => {
    try {
      const ids = JSON.parse(localStorage.getItem("blindspot_decision_ids") || "[]");
      const query = ids.length > 0 ? `?ids=${ids.join(",")}` : "";
      const res = await fetch(`/api/decisions${query}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.decisions || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (route === "/history" || route === "/dashboard" || route === "/insights") {
      fetchHistoryList();
    }
  }, [route, token]);

  // Final Reflection & Feedback State
  const [readyToDecide, setReadyToDecide] = useState<boolean>(false);
  const [finalSummaryText, setFinalSummaryText] = useState<string>("");
  const [reflectionSaved, setReflectionSaved] = useState<boolean>(false);

  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [discoveredBlindSpot, setDiscoveredBlindSpot] = useState<"yes" | "partially" | "no">("yes");
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [feedbackSent, setFeedbackSent] = useState<boolean>(false);

  // Help Accordions on /help
  const [openHelpIdx, setOpenHelpIdx] = useState<number | null>(0);

  // Cycle short loading messages during analysis
  useEffect(() => {
    if (!isAnalyzing) {
      setLoadingMsgIdx(0);
      return;
    }
    const interval = window.setInterval(() => {
      setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // ============================================================================
  // CORE AI HANDLERS (SAFE PARSING & REAL ERROR REPORTING)
  // ============================================================================

  const handleRunAnalysis = async (overrideInputs?: DecisionInputs) => {
    const targetInputs = overrideInputs || inputs;

    // Persist inputs before calling API so user work is never lost
    localStorage.setItem("blindspot_draft_inputs", JSON.stringify(targetInputs));

    if (!targetInputs.situation || targetInputs.situation.trim().length < 5) {
      setAnalysisError("Please enter at least a few words describing what is happening.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          decisionId: decisionId === "dec_demo_internship" ? null : decisionId,
          inputs: targetInputs,
          qnaHistory,
          askedQuestions,
          language: preferences.language,
          location: preferences.location,
          gender: preferences.gender,
        }),
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned an invalid response (${res.status}).`);
      }

      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || `Analysis failed with HTTP ${res.status}.`
        );
      }

      setDecisionId(data.decisionId);
      setAnalysis(data.analysis);
      setAskedQuestions(data.askedQuestions || []);
      setDraftAnswers({});
      setAnalysisStageIdx(0);

      const storedIds = JSON.parse(localStorage.getItem("blindspot_decision_ids") || "[]");
      if (data.decisionId && !storedIds.includes(data.decisionId)) {
        localStorage.setItem(
          "blindspot_decision_ids",
          JSON.stringify([data.decisionId, ...storedIds].slice(0, 20))
        );
      }

      navigate("/analysis");
    } catch (err: any) {
      setAnalysisError(err.message || "Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleContinueQuestions = async () => {
    if (!analysis) return;
    setIsGeneratingQna(true);
    setAnalysisError(null);

    try {
      const newlyAnswered: QnaHistoryEntry[] = [];
      for (const q of analysis.important_questions || []) {
        const ans = draftAnswers[q.id];
        if (ans && ans.trim().length > 0) {
          newlyAnswered.push({
            question: q.question,
            answer: ans.trim(),
            round: qnaRound,
            angle: q.diagnostic_angle,
          });
        }
      }

      const updatedHistory = [...qnaHistory, ...newlyAnswered];
      const nextRound = qnaRound + 1;

      const res = await fetch("/api/qna/next", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          decisionId: decisionId === "dec_demo_internship" ? null : decisionId,
          inputs,
          qnaHistory: updatedHistory,
          askedQuestions,
          round: nextRound,
          language: preferences.language,
          location: preferences.location,
        }),
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned an invalid response (${res.status}).`);
      }

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Could not generate next questions.");
      }

      const qnaRes = data.qnaResult;
      setQnaHistory(updatedHistory);
      setQnaRound(nextRound);
      setAskedQuestions(data.askedQuestions || askedQuestions);
      setDraftAnswers({});
      setQnaRoundSummary(qnaRes.closer_to_solution_synthesis || qnaRes.round_insight_summary);

      setAnalysis((prev) =>
        prev
          ? {
              ...prev,
              clarity_level: qnaRes.updated_clarity_level || prev.clarity_level,
              clarity_reason: qnaRes.updated_clarity_reason || prev.clarity_reason,
              important_questions:
                Array.isArray(qnaRes.important_questions) && qnaRes.important_questions.length > 0
                  ? qnaRes.important_questions
                  : prev.important_questions,
              blind_spots:
                Array.isArray(qnaRes.new_discovered_blind_spots) &&
                qnaRes.new_discovered_blind_spots.length > 0
                  ? [...qnaRes.new_discovered_blind_spots, ...prev.blind_spots].slice(0, 10)
                  : prev.blind_spots,
            }
          : prev
      );
    } catch (err: any) {
      setAnalysisError(err.message || "Could not generate next questions.");
    } finally {
      setIsGeneratingQna(false);
    }
  };

  // Auth Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...authForm,
          language: preferences.language,
          location: preferences.location,
          gender: preferences.gender,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("blindspot_token", data.token);
      setShowAuthModal(false);
      setAuthForm({ name: "", email: "", password: "" });
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem("blindspot_token");
  };

  const isDecisionFlowRoute = DECISION_FLOW_STEPS.some((s) => s.path === route);

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] relative flex flex-col selection:bg-[var(--accent-primary)] selection:text-white">
      {/* =====================================================================
          CINEMATIC OPENING EXPERIENCE (FAST & CLEAN)
      ===================================================================== */}
      {showDroneIntro && (
        <div
          className="fixed inset-0 z-50 bg-[#0D0A18] text-white flex flex-col justify-between overflow-hidden"
          role="region"
          aria-label="Opening cinematic introduction"
        >
          <div className="absolute inset-0 overflow-hidden">
            <img
              ref={droneImageRef}
              src={droneHeroImg}
              alt="Aerial twilight view of human-centric architecture"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0A18] via-[#0D0A18]/55 to-[#0D0A18]/40" />
          </div>

          <div className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
            <span className="font-display text-lg tracking-tight text-white/90">
              THE BLIND SPOT
            </span>
            <button
              type="button"
              onClick={finishDroneIntro}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-xs font-medium text-white transition-colors"
            >
              SKIP INTRO
            </button>
          </div>

          <div className="relative z-10 max-w-2xl mx-auto px-6 text-center my-auto space-y-5">
            {introStep === 0 ? (
              <h1 className="text-3xl md:text-5xl font-display font-normal leading-tight text-white">
                AI does not replace human thinking. AI helps humans see what they may have missed.
              </h1>
            ) : (
              <>
                <h1 className="text-4xl md:text-6xl font-display font-semibold tracking-tight text-white">
                  THE BLIND SPOT
                </h1>
                <p className="text-lg md:text-2xl text-purple-100/90 font-display italic">
                  “See What You’re Missing Before You Decide.”
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={finishDroneIntro}
                    className="px-6 py-3 rounded-xl bg-[#7C5CFF] hover:bg-[#6A48F5] text-white text-sm font-medium shadow-lg transition-all"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="relative z-10 px-6 md:px-12 py-5 flex items-center justify-center gap-2">
            <span className={`h-1.5 rounded-full ${introStep === 0 ? "w-8 bg-purple-300" : "w-2 bg-white/30"}`} />
            <span className={`h-1.5 rounded-full ${introStep >= 1 ? "w-8 bg-purple-300" : "w-2 bg-white/30"}`} />
          </div>
        </div>
      )}

      {/* =====================================================================
          SIMPLIFIED PERSONALIZATION POPUP
      ===================================================================== */}
      {showPersonalizationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Personalization"
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-card)] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-semibold">
                Let’s make Blind Spot feel like it was made for you.
              </h2>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("blindspot_personalized_done", "true");
                  setShowPersonalizationModal(false);
                }}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Language */}
              <div>
                <label className="flex items-center gap-1.5 font-semibold mb-2">
                  <Globe className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Language
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["English", "Hindi", "Marathi"].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => updatePreferences({ ...preferences, language: lang })}
                      className={`py-2 px-3 rounded-xl font-medium border transition-colors ${
                        preferences.language === lang
                          ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                          : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-hairline)]"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="flex items-center gap-1.5 font-semibold mb-2">
                  <MapPin className="w-3.5 h-3.5 text-[var(--accent-primary)]" /> Location
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={preferences.location.country}
                    onChange={(e) =>
                      updatePreferences({
                        ...preferences,
                        location: { ...preferences.location, country: e.target.value },
                      })
                    }
                    placeholder="Country"
                    className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2"
                  />
                  <input
                    type="text"
                    value={preferences.location.city}
                    onChange={(e) =>
                      updatePreferences({
                        ...preferences,
                        location: { ...preferences.location, city: e.target.value },
                      })
                    }
                    placeholder="City"
                    className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2"
                  />
                </div>
              </div>

              {/* Optional Gender */}
              <div>
                <label className="block font-semibold mb-2">○ Gender (Optional)</label>
                <div className="flex flex-wrap gap-2">
                  {["Prefer not to say", "Woman", "Man", "Non-binary"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => updatePreferences({ ...preferences, gender: g })}
                      className={`py-1.5 px-3 rounded-xl font-medium border ${
                        preferences.gender === g
                          ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                          : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-hairline)]"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                localStorage.setItem("blindspot_personalized_done", "true");
                setShowPersonalizationModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBTLE BACKGROUND FLOATING COMPANIONS (RESPECTS REDUCED MOTION)
      ===================================================================== */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-28 left-8 animate-float-slow opacity-25">
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="13" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
            <circle cx="18" cy="18" r="5" fill="currentColor" fillOpacity="0.2" />
          </svg>
        </div>
        <div
          className="absolute bottom-20 right-10 animate-float-slow opacity-20"
          style={{ animationDelay: "2.5s" }}
        >
          <svg width="30" height="30" viewBox="0 0 34 34" fill="none">
            <polygon
              points="17,4 30,27 4,27"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="currentColor"
              fillOpacity="0.08"
            />
          </svg>
        </div>
      </div>

      {/* =====================================================================
          PERSISTENT TOP NAVIGATION (LOGO · HOME · DECISION · ANALYSIS · DASHBOARD + A11Y + MENU)
      ===================================================================== */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)] whitespace-nowrap"
          >
            THE BLIND SPOT
          </button>

          {/* Desktop Primary Links (4 clean items) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium" aria-label="Main Navigation">
            {(
              [
                ["/", "Home"],
                ["/decision", "Decision"],
                ["/analysis", "Analysis"],
                ["/dashboard", "Dashboard"],
              ] as const
            ).map(([path, label]) => (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                className={`py-1 transition-colors whitespace-nowrap ${
                  route === path
                    ? "text-[var(--accent-primary)] font-semibold underline underline-offset-8"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Right Controls: Accessibility Icon + Sign In + Menu Icon */}
          <div className="flex items-center gap-2 relative">
            {/* Compact Accessibility Button */}
            <button
              type="button"
              onClick={() => {
                setA11yOpen(!a11yOpen);
                setMenuOpen(false);
              }}
              className="p-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label="Accessibility Settings"
              title="Text Size, Contrast & Motion"
            >
              <TypeIcon className="w-4 h-4" />
            </button>

            {/* Auth Button */}
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] text-xs font-medium"
                title={`Signed in as ${user.name}`}
              >
                <UserCheck className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span className="max-w-[84px] truncate">{user.name}</span>
                <LogOut className="w-3 h-3 text-[var(--text-muted)]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthModal(true);
                }}
                className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold whitespace-nowrap"
              >
                Sign In
              </button>
            )}

            {/* Menu Button */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(!menuOpen);
                setA11yOpen(false);
              }}
              className="p-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-card)] text-[var(--text-primary)] flex items-center gap-1.5 text-xs font-medium"
              aria-label="Open Navigation Menu"
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span className="hidden sm:inline">Menu</span>
            </button>

            {/* COMPACT ACCESSIBILITY POPOVER */}
            {a11yOpen && (
              <div className="absolute right-0 top-13 w-72 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-card)] shadow-2xl p-4 space-y-4 z-50 text-xs">
                <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2">
                  <span className="font-semibold">Accessibility</span>
                  <button type="button" onClick={() => setA11yOpen(false)}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Text Size Controls */}
                <div>
                  <span className="block text-[var(--text-muted)] mb-1.5">Text Size</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(
                      [
                        ["small", "A−"],
                        ["default", "A"],
                        ["large", "A+"],
                        ["xlarge", "A++"],
                      ] as const
                    ).map(([sz, label]) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setFontSize(sz)}
                        className={`py-1.5 rounded-lg font-semibold border ${
                          fontSize === sz
                            ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                            : "bg-[var(--bg-elevated)] border-[var(--border-hairline)]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme Toggle */}
                <div className="flex items-center justify-between">
                  <span>Theme</span>
                  <button
                    type="button"
                    onClick={() => setDarkMode(!darkMode)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] flex items-center gap-1.5 font-medium"
                  >
                    {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    {darkMode ? "Light Mode" : "Dark Mode"}
                  </button>
                </div>

                {/* Reduced Motion */}
                <div className="flex items-center justify-between">
                  <span>Reduced Motion</span>
                  <button
                    type="button"
                    onClick={() =>
                      updatePreferences({
                        ...preferences,
                        reducedMotion: !preferences.reducedMotion,
                      })
                    }
                    className={`px-3 py-1 rounded-lg font-semibold border ${
                      preferences.reducedMotion
                        ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                        : "bg-[var(--bg-elevated)] border-[var(--border-hairline)]"
                    }`}
                  >
                    {preferences.reducedMotion ? "On" : "Off"}
                  </button>
                </div>

                {/* High Contrast */}
                <div className="flex items-center justify-between">
                  <span>High Contrast</span>
                  <button
                    type="button"
                    onClick={() => setHighContrast(!highContrast)}
                    className={`px-3 py-1 rounded-lg font-semibold border ${
                      highContrast
                        ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                        : "bg-[var(--bg-elevated)] border-[var(--border-hairline)]"
                    }`}
                  >
                    {highContrast ? "On" : "Off"}
                  </button>
                </div>
              </div>
            )}

            {/* SECONDARY NAVIGATION MENU DROPDOWN */}
            {menuOpen && (
              <div className="absolute right-0 top-13 w-60 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-card)] shadow-2xl p-2 z-50 text-xs space-y-1">
                <div className="md:hidden border-b border-[var(--border-hairline)] pb-1 mb-1">
                  {(
                    [
                      ["/", "Home"],
                      ["/decision", "Decision"],
                      ["/analysis", "Analysis"],
                      ["/dashboard", "Dashboard"],
                    ] as const
                  ).map(([p, lbl]) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => navigate(p)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-surface)] font-medium"
                    >
                      {lbl}
                    </button>
                  ))}
                </div>

                {(
                  [
                    ["/understand", "Understand", Compass],
                    ["/blind-spots", "Blind Spots", Eye],
                    ["/questions", "Questions", MessageSquare],
                    ["/insights", "Insights", BarChart3],
                    ["/reflection", "Final Reflection", Sparkles],
                    ["/history", "History", HistoryIcon],
                    ["/help", "Help & Support", HelpCircle],
                    ["/feedback", "Feedback", Star],
                    ["/settings", "Settings", SettingsIcon],
                  ] as const
                ).map(([p, lbl, Icon]) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => navigate(p)}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition-colors ${
                      route === p
                        ? "bg-[var(--accent-soft)] text-[var(--accent-primary)] font-semibold"
                        : "hover:bg-[var(--bg-surface)] text-[var(--text-primary)]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{lbl}</span>
                  </button>
                ))}

                {user?.role === "admin" && (
                  <div className="border-t border-[var(--border-hairline)] pt-1 mt-1">
                    <button
                      type="button"
                      onClick={() => navigate("/admin")}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-[var(--bg-surface)] text-[var(--accent-primary)] font-semibold flex items-center gap-2.5"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>Admin Panel</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SMALL DECISION PROCESS BREADCRUMB BAR */}
        {isDecisionFlowRoute && (
          <div className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)]/50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto text-[11px] font-medium">
              {DECISION_FLOW_STEPS.map((step, idx) => {
                const active = route === step.path;
                return (
                  <React.Fragment key={step.path}>
                    <button
                      type="button"
                      onClick={() => navigate(step.path)}
                      className={`whitespace-nowrap transition-colors ${
                        active
                          ? "text-[var(--accent-primary)] font-bold"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {step.label}
                    </button>
                    {idx < DECISION_FLOW_STEPS.length - 1 && (
                      <span className="text-[var(--text-muted)]/60" aria-hidden="true">
                        →
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* =====================================================================
          MULTI-PAGE ROUTER VIEWPORT (ONE PAGE · ONE PURPOSE · ONE ACTION)
      ===================================================================== */}
      <main className="flex-1 relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* -------------------------------------------------------------------
            PAGE 1 — HOME (/)
        ------------------------------------------------------------------- */}
        {route === "/" && (
          <div className="page-transition py-6 sm:py-12 flex flex-col items-center text-center space-y-8">
            <div className="w-full max-w-3xl rounded-2xl overflow-hidden border border-[var(--border-hairline)] bg-[var(--bg-card)] shadow-lg relative">
              <img
                src={droneHeroImg}
                alt="Cinematic AI decision reflection visual"
                referrerPolicy="no-referrer"
                className="w-full h-64 sm:h-80 object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setIntroStep(0);
                  setShowDroneIntro(true);
                }}
                className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-black/55 hover:bg-black/75 text-white text-xs font-medium backdrop-blur-xs flex items-center gap-1.5"
              >
                <Play className="w-3 h-3" /> Intro
              </button>
            </div>

            <div className="space-y-3 max-w-xl">
              <h1 className="text-4xl sm:text-6xl font-display font-semibold tracking-tight">
                THE BLIND SPOT
              </h1>
              <p className="text-base sm:text-xl text-[var(--text-secondary)]">
                AI that helps you see what you may have missed.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate("/decision")}
                className="px-7 py-3.5 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-sm font-semibold shadow-md transition-all"
              >
                Start Thinking
              </button>
              <button
                type="button"
                onClick={() => navigate("/understand")}
                className="px-6 py-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] text-sm font-medium transition-colors"
              >
                How It Works
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            PAGE 2 — UNDERSTAND (/understand)
        ------------------------------------------------------------------- */}
        {route === "/understand" && (
          <div className="page-transition py-6 space-y-10 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <h1 className="text-3xl sm:text-5xl font-display font-semibold">
                See the Blind Spot
              </h1>
              <p className="text-base text-[var(--text-secondary)]">
                Every decision has something you haven't seen yet.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl p-6 border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-2">
                <Compass className="w-6 h-6 text-[var(--accent-primary)]" />
                <h2 className="text-lg font-semibold">ASSUMPTIONS</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  What are you taking for granted?
                </p>
              </div>

              <div className="rounded-2xl p-6 border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-2">
                <Eye className="w-6 h-6 text-[var(--accent-primary)]" />
                <h2 className="text-lg font-semibold">BLIND SPOTS</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  What might you be missing?
                </p>
              </div>

              <div className="rounded-2xl p-6 border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-2">
                <MessageSquare className="w-6 h-6 text-[var(--accent-primary)]" />
                <h2 className="text-lg font-semibold">QUESTIONS</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  What should you ask before deciding?
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[var(--border-hairline)] bg-[var(--bg-card)] grid grid-cols-1 md:grid-cols-12 items-center">
              <img
                src={prismImg}
                alt="Optical prism refracting light"
                referrerPolicy="no-referrer"
                className="md:col-span-5 w-full h-48 object-cover"
              />
              <div className="md:col-span-7 p-6 space-y-4">
                <p className="text-sm text-[var(--text-primary)] font-medium">
                  “AI doesn’t make your decision. It helps you see the decision more clearly.”
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/decision")}
                  className="px-6 py-3 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold"
                >
                  Start My Decision
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            PAGE 3 — YOUR DECISION (/decision)
        ------------------------------------------------------------------- */}
        {route === "/decision" && (
          <div className="page-transition max-w-3xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-display font-semibold">Tell us what's happening.</h1>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Find what you're missing.
                </p>
              </div>

              {/* AI ENGINE STATUS INDICATOR */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-card)] text-xs">
                <span className="font-mono-tabular font-semibold text-[var(--text-muted)]">
                  AI ENGINE
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    aiConfigured ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                <span className="font-medium">
                  {aiConfigured === null
                    ? "Checking..."
                    : aiConfigured
                    ? "Connected"
                    : "Configuration required"}
                </span>
              </div>
            </div>

            {/* Quick Example Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setInputs(TRAVEL_SAVINGS_PRESET);
                  setRevealedSteps(6);
                  setAnalysisError(null);
                }}
                className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] text-xs font-medium"
              >
                Example: Travel vs. Savings
              </button>
              {SCENARIO_PRESETS.slice(0, 3).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setInputs(preset.inputs);
                    setRevealedSteps(4);
                    setAnalysisError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] text-xs font-medium"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Progressive Disclosure Decision Card */}
            <div className="rounded-2xl p-6 sm:p-8 border border-[var(--border-hairline)] bg-[var(--bg-card)] shadow-xs space-y-5">
              {/* Primary Field: What's happening? */}
              <div>
                <label className="block text-sm font-semibold mb-2">What's happening?</label>
                <textarea
                  rows={3}
                  value={inputs.situation}
                  onChange={(e) => setInputs({ ...inputs, situation: e.target.value })}
                  placeholder="Describe the situation or choice you are facing…"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                />
              </div>

              {/* Step 1: What looks good? */}
              {revealedSteps >= 1 && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5">What looks good?</label>
                  <input
                    type="text"
                    value={inputs.positives}
                    onChange={(e) => setInputs({ ...inputs, positives: e.target.value })}
                    placeholder="Positive points you see…"
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-xs"
                  />
                </div>
              )}

              {/* Step 2: What worries you? */}
              {revealedSteps >= 2 && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5">What worries you?</label>
                  <input
                    type="text"
                    value={inputs.concerns}
                    onChange={(e) => setInputs({ ...inputs, concerns: e.target.value })}
                    placeholder="Risks or concerns on your mind…"
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-xs"
                  />
                </div>
              )}

              {/* Step 3: What do you think you should do? */}
              {revealedSteps >= 3 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      What do you think you should do?
                    </label>
                    <input
                      type="text"
                      value={inputs.currentLeaning}
                      onChange={(e) => setInputs({ ...inputs, currentLeaning: e.target.value })}
                      placeholder="Current leaning…"
                      className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Why?</label>
                    <input
                      type="text"
                      value={inputs.reasoning}
                      onChange={(e) => setInputs({ ...inputs, reasoning: e.target.value })}
                      placeholder="Main reason…"
                      className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: What's unclear? */}
              {revealedSteps >= 4 && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5">What's unclear?</label>
                  <input
                    type="text"
                    value={inputs.uncertainties}
                    onChange={(e) => setInputs({ ...inputs, uncertainties: e.target.value })}
                    placeholder="What are you unsure about?"
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-xs"
                  />
                </div>
              )}

              {/* Step 5+: Other options? */}
              {revealedSteps >= 5 && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Other options?</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(inputs.additionalOptions || []).map((opt, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs"
                      >
                        {opt}
                        <button
                          type="button"
                          onClick={() =>
                            setInputs({
                              ...inputs,
                              additionalOptions: inputs.additionalOptions.filter(
                                (_, i) => i !== idx
                              ),
                            })
                          }
                          aria-label="Remove option"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newOptionInput}
                      onChange={(e) => setNewOptionInput(e.target.value)}
                      placeholder="Add an option…"
                      className="flex-1 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3.5 py-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newOptionInput.trim()) return;
                        setInputs({
                          ...inputs,
                          additionalOptions: [
                            ...(inputs.additionalOptions || []),
                            newOptionInput.trim(),
                          ],
                        });
                        setNewOptionInput("");
                      }}
                      className="px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                </div>
              )}

              {/* Error Banner + Retry Button (Never loses user input) */}
              {analysisError && (
                <div className="rounded-xl p-4 border border-amber-500/40 bg-amber-500/10 space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200 font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Analysis failed: {analysisError}</span>
                  </div>
                  <p className="text-[var(--text-secondary)]">
                    Your information is safe. Fix the connection and try again.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleRunAnalysis()}
                      className="px-3.5 py-1.5 rounded-lg bg-[var(--accent-primary)] text-white font-semibold"
                    >
                      Try Analysis Again
                    </button>
                    {analysis && (
                      <button
                        type="button"
                        onClick={() => navigate("/analysis")}
                        className="px-3.5 py-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] font-medium"
                      >
                        View Current Loaded Analysis
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Progressive Disclosure Controls: [Add More] [Skip] [Analyze] */}
              <div className="pt-3 border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {revealedSteps < 5 && (
                    <button
                      type="button"
                      onClick={() => setRevealedSteps((s) => Math.min(5, s + 1))}
                      className="px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-medium"
                    >
                      + Add More Details
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRunAnalysis()}
                    className="px-3.5 py-2 rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    Skip Optional Fields
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => handleRunAnalysis()}
                  className="px-6 py-3 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-md transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{LOADING_MESSAGES[loadingMsgIdx]}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Run 7-Stage Blind Spot Analysis</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            PAGE 4 — AI ANALYSIS (/analysis) — STAGE BY STAGE STEPPER
        ------------------------------------------------------------------- */}
        {route === "/analysis" && (
          <div className="page-transition max-w-3xl mx-auto space-y-6">
            {!analysis ? (
              <div className="rounded-2xl p-10 border border-[var(--border-hairline)] bg-[var(--bg-card)] text-center space-y-4">
                <p className="text-base font-semibold">No decision yet.</p>
                <button
                  type="button"
                  onClick={() => navigate("/decision")}
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold"
                >
                  Start a Decision
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {analysis.category} · {analysis.clarity_level}
                    </p>
                    <h1
                      id="your-blind-spot-analysis"
                      className="text-2xl sm:text-3xl font-display font-semibold"
                    >
                      Your Blind Spot Analysis
                    </h1>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/decision")}
                    className="px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] text-xs font-medium self-start"
                  >
                    Edit Decision
                  </button>
                </div>

                {/* 5-Stage Stepper Tabs */}
                <div className="grid grid-cols-5 gap-1.5 p-1.5 rounded-xl bg-[var(--bg-surface)] text-[11px] font-semibold">
                  {(
                    [
                      "UNDERSTAND",
                      "ASSUMPTIONS",
                      "BLIND SPOTS",
                      "RISKS",
                      "MISSING INFO",
                    ] as const
                  ).map((label, idx) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setAnalysisStageIdx(idx)}
                      className={`py-2 px-2 rounded-lg text-center truncate transition-colors ${
                        analysisStageIdx === idx
                          ? "bg-[var(--bg-elevated)] text-[var(--accent-primary)] shadow-xs"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Stage Content Card */}
                <div className="rounded-2xl p-6 sm:p-8 border border-[var(--border-hairline)] bg-[var(--bg-card)] min-h-[280px] flex flex-col justify-between space-y-6">
                  {analysisStageIdx === 0 && (
                    <div className="space-y-4">
                      <span className="text-xs font-semibold text-[var(--accent-primary)]">
                        Stage 1 · Understand
                      </span>
                      <p className="text-base leading-relaxed">{analysis.situation_summary}</p>
                      <div className="p-4 rounded-xl bg-[var(--bg-surface)]/60 text-xs space-y-1">
                        <span className="text-[var(--text-muted)] block">Your Core Goal</span>
                        <strong className="text-sm text-[var(--text-primary)]">
                          {analysis.user_goal}
                        </strong>
                      </div>
                      <div className="p-4 rounded-xl border border-[var(--border-hairline)] text-xs">
                        <strong className="block mb-1">{analysis.clarity_level}</strong>
                        <span className="text-[var(--text-secondary)]">
                          {analysis.clarity_reason}
                        </span>
                      </div>
                    </div>
                  )}

                  {analysisStageIdx === 1 && (
                    <div className="space-y-4">
                      <span className="text-xs font-semibold text-[var(--accent-primary)]">
                        Stage 2 · Assumptions ({analysis.assumptions?.length || 0})
                      </span>
                      <div className="space-y-3">
                        {(analysis.assumptions || []).map((asmp, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <strong className="text-sm">{asmp.title}</strong>
                              <span className="text-[var(--text-muted)]">{asmp.type}</span>
                            </div>
                            <p className="text-[var(--text-secondary)]">{asmp.explanation}</p>
                            <p className="text-[var(--accent-primary)] font-medium">
                              If wrong: {asmp.if_wrong}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisStageIdx === 2 && (
                    <div className="space-y-4">
                      <span className="text-xs font-semibold text-[var(--accent-primary)]">
                        Stage 3 · Blind Spots & Contradictions
                      </span>
                      <div className="space-y-3">
                        {(analysis.blind_spots || []).map((bs, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <strong className="text-sm">{bs.title}</strong>
                              <span className="text-[var(--text-muted)]">{bs.severity}</span>
                            </div>
                            <p className="text-[var(--text-secondary)]">{bs.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisStageIdx === 3 && (
                    <div className="space-y-4">
                      <span className="text-xs font-semibold text-[var(--accent-primary)]">
                        Stage 4 · Risks ({analysis.risks?.length || 0})
                      </span>
                      <div className="space-y-3">
                        {(analysis.risks || []).map((r, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <strong className="text-sm">{r.risk_name}</strong>
                              <span className="font-mono-tabular">{r.impact_score}/10</span>
                            </div>
                            <p className="text-[var(--text-secondary)]">
                              Mitigation: {r.mitigation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysisStageIdx === 4 && (
                    <div className="space-y-4">
                      <span className="text-xs font-semibold text-[var(--accent-primary)]">
                        Stage 5 · Missing Information ({analysis.missing_information?.length || 0})
                      </span>
                      <div className="space-y-3">
                        {(analysis.missing_information || []).map((mi, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] space-y-1 text-xs"
                          >
                            <strong className="text-sm block">{mi.item}</strong>
                            <p className="text-[var(--text-secondary)]">{mi.why_it_matters}</p>
                            <p className="text-[var(--accent-primary)] font-medium">
                              Verify: {mi.how_to_find_out}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Previous / Next Navigation */}
                  <div className="pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between">
                    <button
                      type="button"
                      disabled={analysisStageIdx === 0}
                      onClick={() => setAnalysisStageIdx((i) => Math.max(0, i - 1))}
                      className="px-4 py-2 rounded-xl border border-[var(--border-hairline)] disabled:opacity-40 text-xs font-semibold flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Previous
                    </button>

                    {analysisStageIdx < 4 ? (
                      <button
                        type="button"
                        onClick={() => setAnalysisStageIdx((i) => Math.min(4, i + 1))}
                        className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold flex items-center gap-1"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate("/blind-spots")}
                        className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold flex items-center gap-1"
                      >
                        Explore Blind Spots <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            PAGE 5 — BLIND SPOTS (/blind-spots)
        ------------------------------------------------------------------- */}
        {route === "/blind-spots" && (
          <div className="page-transition max-w-3xl mx-auto space-y-6">
            {!analysis || (analysis.blind_spots || []).length === 0 ? (
              <div className="rounded-2xl p-10 border border-[var(--border-hairline)] bg-[var(--bg-card)] text-center space-y-4">
                <p className="text-base font-semibold">No major blind spots identified yet.</p>
                <button
                  type="button"
                  onClick={() => navigate("/decision")}
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold"
                >
                  Start a Decision
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-display font-semibold">Your Blind Spots</h1>
                  <button
                    type="button"
                    onClick={() => navigate("/questions")}
                    className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold flex items-center gap-1"
                  >
                    Questions <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {analysis.blind_spots.map((bs, idx) => {
                    const isExpanded = !!expandedBlindSpots[idx];
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl p-5 border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <ShieldAlert className="w-5 h-5 text-[var(--accent-primary)] shrink-0" />
                            <h2 className="text-base font-semibold">{bs.title}</h2>
                          </div>
                          <span className="text-xs font-medium text-[var(--text-muted)]">
                            {bs.severity}
                          </span>
                        </div>

                        <p className="text-sm text-[var(--text-secondary)]">
                          {bs.description.split(".")[0]}.
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedBlindSpots((prev) => ({
                                ...prev,
                                [idx]: !isExpanded,
                              }))
                            }
                            className="px-3 py-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--accent-primary)]"
                          >
                            {isExpanded ? "Hide Why" : "Why?"}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-xs text-[var(--text-secondary)] space-y-1">
                            <p>
                              <strong className="text-[var(--text-primary)]">Dimension:</strong>{" "}
                              {bs.dimension}
                            </p>
                            <p>{bs.description}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            PAGE 6 — QUESTIONS (/questions)
        ------------------------------------------------------------------- */}
        {route === "/questions" && (
          <div className="page-transition max-w-3xl mx-auto space-y-6">
            {!analysis ? (
              <div className="rounded-2xl p-10 border border-[var(--border-hairline)] bg-[var(--bg-card)] text-center space-y-4">
                <p className="text-base font-semibold">No decision yet.</p>
                <button
                  type="button"
                  onClick={() => navigate("/decision")}
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold"
                >
                  Start a Decision
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Round {qnaRound}</p>
                    <h1 className="text-3xl font-display font-semibold">Questions Worth Asking</h1>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/insights")}
                    className="px-4 py-2 rounded-xl border border-[var(--border-hairline)] text-xs font-semibold"
                  >
                    View Insights →
                  </button>
                </div>

                {qnaRoundSummary && (
                  <div className="p-4 rounded-xl border border-[var(--accent-primary)]/40 bg-[var(--accent-soft)]/30 text-xs">
                    <strong className="block mb-0.5 text-[var(--accent-primary)]">
                      Updated Insight
                    </strong>
                    {qnaRoundSummary}
                  </div>
                )}

                {analysisError && (
                  <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs">
                    {analysisError}
                  </div>
                )}

                <div className="space-y-4">
                  {(analysis.important_questions || []).slice(0, 4).map((q) => {
                    const currentAns = draftAnswers[q.id] || "";
                    return (
                      <div
                        key={q.id}
                        className="rounded-2xl p-5 border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-3"
                      >
                        <h2 className="text-base font-semibold">{q.question}</h2>
                        <div className="flex flex-wrap gap-2">
                          {(q.options || []).map((opt) => {
                            const active = currentAns === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() =>
                                  setDraftAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: active ? "" : opt,
                                  }))
                                }
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                                  active
                                    ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                                    : "bg-[var(--bg-elevated)] border-[var(--border-hairline)]"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        <input
                          type="text"
                          value={currentAns}
                          onChange={(e) =>
                            setDraftAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          placeholder="Or write your answer…"
                          className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2 text-xs"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={isGeneratingQna}
                    onClick={handleContinueQuestions}
                    className="px-6 py-3 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-60 text-white text-xs font-semibold flex items-center gap-2"
                  >
                    {isGeneratingQna ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Generating Next Questions…
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            PAGE 7 — INSIGHTS (/insights)
        ------------------------------------------------------------------- */}
        {route === "/insights" && (
          <div className="page-transition max-w-4xl mx-auto space-y-6">
            {!analysis ? (
              <div className="rounded-2xl p-10 border border-[var(--border-hairline)] bg-[var(--bg-card)] text-center space-y-4">
                <p className="text-base font-semibold">No decision yet.</p>
                <button
                  type="button"
                  onClick={() => navigate("/decision")}
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold"
                >
                  Start a Decision
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-display font-semibold">Insights</h1>
                  <button
                    type="button"
                    onClick={() => navigate("/reflection")}
                    className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold"
                  >
                    Final Reflection →
                  </button>
                </div>
                <ChartsPanel
                  analysis={analysis}
                  darkMode={darkMode}
                  historyList={historyList}
                />
              </>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            PAGE 7B — FINAL REFLECTION (/reflection)
        ------------------------------------------------------------------- */}
        {route === "/reflection" && (
          <div className="page-transition max-w-3xl mx-auto space-y-6">
            {!analysis ? (
              <div className="rounded-2xl p-10 border border-[var(--border-hairline)] bg-[var(--bg-card)] text-center space-y-4">
                <p className="text-base font-semibold">No decision yet.</p>
                <button
                  type="button"
                  onClick={() => navigate("/decision")}
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold"
                >
                  Start a Decision
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-display font-semibold">Before You Decide</h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-5 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-1">
                    <strong className="block text-sm">What you originally thought</strong>
                    <p className="text-[var(--text-secondary)]">
                      {analysis.before_you_decide_reflection?.originally_thought}
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-1">
                    <strong className="block text-sm">What you discovered</strong>
                    <p className="text-[var(--text-secondary)]">
                      {analysis.before_you_decide_reflection?.what_you_discovered}
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-1">
                    <strong className="block text-sm">What remains uncertain</strong>
                    <p className="text-[var(--text-secondary)]">
                      {analysis.before_you_decide_reflection?.what_remains_uncertain}
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-1">
                    <strong className="block text-sm">What could change your decision</strong>
                    <p className="text-[var(--text-secondary)]">
                      {analysis.before_you_decide_reflection?.what_could_change_decision}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl p-6 border border-[var(--border-hairline)] bg-[var(--bg-surface)]/70 text-center space-y-4">
                  <p className="text-lg font-display italic">“Your decision is yours.”</p>
                  {!readyToDecide ? (
                    <button
                      type="button"
                      onClick={() => setReadyToDecide(true)}
                      className="px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold"
                    >
                      I'm Ready With My Decision
                    </button>
                  ) : (
                    <div className="space-y-3 text-left max-w-lg mx-auto">
                      <textarea
                        rows={2}
                        value={finalSummaryText}
                        onChange={(e) => setFinalSummaryText(e.target.value)}
                        placeholder="Summarize your decision in your own words…"
                        className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-3 text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReflectionSaved(true);
                            setTimeout(() => navigate("/feedback"), 900);
                          }}
                          className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold"
                        >
                          Save & Continue
                        </button>
                      </div>
                      {reflectionSaved && (
                        <p className="text-xs text-emerald-600 font-semibold">
                          Decision recorded. Redirecting to feedback…
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            PAGE 8 — MY DASHBOARD (/dashboard) — SUMMARY ONLY
        ------------------------------------------------------------------- */}
        {route === "/dashboard" && (
          <div className="page-transition max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-display font-semibold">My Dashboard</h1>
              <button
                type="button"
                onClick={() => navigate("/decision")}
                className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold"
              >
                New Decision
              </button>
            </div>

            {!analysis ? (
              <div className="rounded-2xl p-10 border border-[var(--border-hairline)] bg-[var(--bg-card)] text-center space-y-4">
                <p className="text-base font-semibold">No decision yet.</p>
                <button
                  type="button"
                  onClick={() => navigate("/decision")}
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold"
                >
                  Start a Decision
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Current Decision */}
                <div className="rounded-2xl p-6 border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-2">
                  <span className="text-xs text-[var(--text-muted)]">Current Decision</span>
                  <h2 className="text-base font-semibold line-clamp-2">{inputs.situation}</h2>
                  <button
                    type="button"
                    onClick={() => navigate("/analysis")}
                    className="text-xs font-semibold text-[var(--accent-primary)] pt-2 inline-block"
                  >
                    Open Analysis →
                  </button>
                </div>

                {/* 2. Decision Clarity */}
                <div className="rounded-2xl p-6 border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-2">
                  <span className="text-xs text-[var(--text-muted)]">Decision Clarity</span>
                  <h2 className="text-xl font-display font-semibold text-[var(--accent-primary)]">
                    {analysis.clarity_level}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                    {analysis.clarity_reason}
                  </p>
                </div>

                {/* 3. Top Blind Spots */}
                <div className="rounded-2xl p-6 border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Top Blind Spots</span>
                    <button
                      type="button"
                      onClick={() => navigate("/blind-spots")}
                      className="text-xs font-semibold text-[var(--accent-primary)]"
                    >
                      View All
                    </button>
                  </div>
                  <ul className="space-y-1.5 text-xs pt-1">
                    {(analysis.blind_spots || []).slice(0, 3).map((b, i) => (
                      <li key={i} className="truncate font-medium">
                        · {b.title}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. Open Questions */}
                <div className="rounded-2xl p-6 border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-muted)]">Open Questions</span>
                    <button
                      type="button"
                      onClick={() => navigate("/questions")}
                      className="text-xs font-semibold text-[var(--accent-primary)]"
                    >
                      Answer
                    </button>
                  </div>
                  <ul className="space-y-1.5 text-xs pt-1">
                    {(analysis.important_questions || []).slice(0, 3).map((q, i) => (
                      <li key={i} className="truncate font-medium">
                        · {q.question}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 5. Recent Decisions */}
                <div className="md:col-span-2 rounded-2xl p-6 border border-[var(--border-hairline)] bg-[var(--bg-card)] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[var(--text-muted)]">Recent Decisions</span>
                    <p className="text-sm font-semibold mt-0.5">
                      {historyList.length} saved decisions in history
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/history")}
                    className="px-4 py-2 rounded-xl border border-[var(--border-hairline)] text-xs font-semibold"
                  >
                    Open History
                  </button>
                </div>

                {/* 6. Personal Decision Analytics (Real Data Charts) */}
                <div className="md:col-span-2">
                  <DashboardCharts
                    decisions={
                      historyList.length > 0
                        ? historyList
                        : [
                            {
                              id: decisionId || "current",
                              title: inputs.situation,
                              category: analysis.category,
                              clarityLevel: analysis.clarity_level,
                              askedQuestions,
                              qnaHistory,
                              analysis,
                            },
                          ]
                    }
                    darkMode={darkMode}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            PAGE 9 — HISTORY (/history)
        ------------------------------------------------------------------- */}
        {route === "/history" && (
          <div className="page-transition max-w-3xl mx-auto space-y-6">
            <h1 className="text-3xl font-display font-semibold">History</h1>
            {historyList.length === 0 ? (
              <div className="rounded-2xl p-10 border border-[var(--border-hairline)] bg-[var(--bg-card)] text-center space-y-4">
                <p className="text-base font-semibold">No previous decisions.</p>
                <button
                  type="button"
                  onClick={() => navigate("/decision")}
                  className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold"
                >
                  Start Your First Decision
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl p-5 border border-[var(--border-hairline)] bg-[var(--bg-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <h2 className="text-sm font-semibold">{item.title}</h2>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-1">
                        <span className="font-mono-tabular">
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </span>
                        <span>·</span>
                        <span>{item.category}</span>
                        <span>·</span>
                        <span>{item.clarityLevel}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (item.inputs) setInputs(item.inputs);
                        if (item.analysis) setAnalysis(item.analysis);
                        setDecisionId(item.id);
                        navigate("/analysis");
                      }}
                      className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold whitespace-nowrap"
                    >
                      View Analysis
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            PAGE 10 — HELP & SUPPORT (/help) — ACCORDIONS
        ------------------------------------------------------------------- */}
        {route === "/help" && (
          <div className="page-transition max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-display font-semibold">Help & Support</h1>
            <div className="space-y-3">
              {[
                {
                  title: "How It Works",
                  body: "Enter your situation on the Decision page. THE BLIND SPOT identifies hidden assumptions, blind spots, and questions worth asking so you can decide with clarity.",
                },
                {
                  title: "How AI Analysis Works",
                  body: "Our backend uses Gemini 3.8 Flash structured analysis across 5 diagnostic stages without making the decision for you.",
                },
                {
                  title: "Privacy",
                  body: "Location and gender are optional. Personal situation text is never exposed in admin telemetry.",
                },
                {
                  title: "Safety",
                  body: "THE BLIND SPOT does not provide medical, legal, or guaranteed financial advice. Always verify critical requirements with qualified professionals.",
                },
                {
                  title: "Contact / Support",
                  body: "Use the Feedback page to report issues or check /api/health for live AI engine status.",
                },
              ].map((item, idx) => {
                const open = openHelpIdx === idx;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-card)] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenHelpIdx(open ? null : idx)}
                      className="w-full p-5 text-left flex items-center justify-between text-sm font-semibold"
                    >
                      <span>{item.title}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
                      />
                    </button>
                    {open && (
                      <div className="px-5 pb-5 text-xs text-[var(--text-secondary)] border-t border-[var(--border-hairline)] pt-3">
                        {item.body}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            PAGE 11 — FEEDBACK (/feedback) — MINIMAL
        ------------------------------------------------------------------- */}
        {route === "/feedback" && (
          <div className="page-transition max-w-md mx-auto space-y-6">
            <h1 className="text-3xl font-display font-semibold">Feedback</h1>
            <div className="rounded-2xl p-6 border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-5">
              {feedbackSent ? (
                <div className="space-y-3 text-center py-4">
                  <Check className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-sm font-semibold">Thank you for your feedback.</p>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await fetch("/api/feedback", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        decisionId,
                        category: analysis?.category || "General",
                        usefulRating: feedbackRating,
                        discoveredBlindSpot,
                        improvements: feedbackText,
                      }),
                    }).catch(() => {});
                    setFeedbackSent(true);
                  }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-semibold mb-2">Was this useful?</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className={`text-2xl transition-transform hover:scale-110 ${
                            star <= feedbackRating
                              ? "text-amber-400"
                              : "text-[var(--text-muted)]/30"
                          }`}
                          aria-label={`${star} stars`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-2">
                      Did you discover a blind spot?
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {(
                        [
                          ["yes", "Yes"],
                          ["partially", "Partially"],
                          ["no", "No"],
                        ] as const
                      ).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setDiscoveredBlindSpot(val)}
                          className={`py-2 px-3 rounded-xl font-semibold border transition-colors ${
                            discoveredBlindSpot === val
                              ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                              : "bg-[var(--bg-elevated)] border-[var(--border-hairline)]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      What should we improve? (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Your thoughts…"
                      className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-3 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold"
                  >
                    Submit
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            PAGE 12 — SETTINGS (/settings) — FULL PERSONALIZATION & FONT SCALING
        ------------------------------------------------------------------- */}
        {route === "/settings" && (
          <div className="page-transition max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-display font-semibold">Settings</h1>

            <div className="rounded-2xl p-6 border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-6 text-xs">
              {/* TEXT SIZE */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  TEXT SIZE (Scales Entire Application)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      ["small", "Small (A−)"],
                      ["default", "Default (A)"],
                      ["large", "Large (A+)"],
                      ["xlarge", "Extra Large (A++)"],
                    ] as const
                  ).map(([scale, label]) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => setFontSize(scale)}
                      className={`py-2.5 px-3 rounded-xl font-semibold border transition-colors ${
                        fontSize === scale
                          ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                          : "bg-[var(--bg-elevated)] border-[var(--border-hairline)]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* THEME & ACCESSIBILITY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[var(--border-hairline)]">
                <button
                  type="button"
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] flex items-center justify-between font-semibold"
                >
                  <span>Theme</span>
                  <span>{darkMode ? "Dark" : "Light"}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updatePreferences({
                      ...preferences,
                      reducedMotion: !preferences.reducedMotion,
                    })
                  }
                  className="p-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] flex items-center justify-between font-semibold"
                >
                  <span>Reduced Motion</span>
                  <span>{preferences.reducedMotion ? "On" : "Off"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHighContrast(!highContrast)}
                  className="p-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] flex items-center justify-between font-semibold"
                >
                  <span>High Contrast</span>
                  <span>{highContrast ? "On" : "Off"}</span>
                </button>
              </div>

              {/* LANGUAGE & LOCATION */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--border-hairline)]">
                <div>
                  <label className="block font-semibold mb-1.5">Language</label>
                  <select
                    value={preferences.language}
                    onChange={(e) =>
                      updatePreferences({ ...preferences, language: e.target.value })
                    }
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="Marathi">Marathi (मराठी)</option>
                    <option value="Spanish">Español</option>
                    <option value="French">Français</option>
                    <option value="German">Deutsch</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1.5">Country</label>
                  <input
                    type="text"
                    value={preferences.location.country}
                    onChange={(e) =>
                      updatePreferences({
                        ...preferences,
                        location: { ...preferences.location, country: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1.5">City</label>
                  <input
                    type="text"
                    value={preferences.location.city}
                    onChange={(e) =>
                      updatePreferences({
                        ...preferences,
                        location: { ...preferences.location, city: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2"
                  />
                </div>
              </div>

              {/* GENDER PREFERENCE */}
              <div className="pt-4 border-t border-[var(--border-hairline)]">
                <label className="block font-semibold mb-2">Gender Preference (Optional)</label>
                <div className="flex flex-wrap gap-2">
                  {["Prefer not to say", "Woman", "Man", "Non-binary"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => updatePreferences({ ...preferences, gender: g })}
                      className={`py-2 px-3.5 rounded-xl font-medium border ${
                        preferences.gender === g
                          ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                          : "bg-[var(--bg-elevated)] border-[var(--border-hairline)]"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* ADMIN ROUTE LINK */}
              <div className="pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Platform Administration</span>
                <button
                  type="button"
                  onClick={() => navigate("/admin")}
                  className="text-[var(--accent-primary)] font-semibold hover:underline"
                >
                  Open Admin Panel (/admin) →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            SEPARATE ADMIN PANEL (/admin)
        ------------------------------------------------------------------- */}
        {route === "/admin" && (
          <AdminPage
            user={user}
            token={token}
            darkMode={darkMode}
            onNavigate={(p) => navigate(p as PageRoute)}
          />
        )}
      </main>

      {/* =====================================================================
          MINIMAL FOOTER
      ===================================================================== */}
      <footer className="border-t border-[var(--border-hairline)] py-6 px-4 sm:px-6 text-xs text-[var(--text-muted)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-display font-semibold text-[var(--text-primary)]">
            THE BLIND SPOT
          </span>
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => navigate("/help")}>
              Help
            </button>
            <button type="button" onClick={() => navigate("/feedback")}>
              Feedback
            </button>
            <button type="button" onClick={() => navigate("/settings")}>
              Settings
            </button>
          </div>
        </div>
      </footer>

      {/* =====================================================================
          AUTH MODAL (LOGIN / SIGNUP)
      ===================================================================== */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Sign In"
        >
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-card)] p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-semibold">
                {authMode === "login" ? "Sign In" : "Create Account"}
              </h2>
              <button type="button" onClick={() => setShowAuthModal(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {authMode === "signup" && (
                <input
                  type="text"
                  required
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  placeholder="Name"
                  className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3.5 py-2.5"
                />
              )}
              <input
                type="email"
                required
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                placeholder="Email"
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3.5 py-2.5"
              />
              <input
                type="password"
                required
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                placeholder="Password"
                className="w-full rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3.5 py-2.5"
              />
              {authError && <p className="text-rose-500 font-medium">{authError}</p>}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-semibold"
              >
                {authLoading ? "Please wait…" : authMode === "login" ? "Sign In" : "Sign Up"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === "login" ? "signup" : "login");
                setAuthError(null);
              }}
              className="w-full text-center text-[var(--accent-primary)] font-semibold pt-1"
            >
              {authMode === "login" ? "Create an account" : "Sign in instead"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
