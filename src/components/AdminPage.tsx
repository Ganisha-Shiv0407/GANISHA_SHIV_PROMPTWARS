import React, { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import {
  Shield,
  Lock,
  RefreshCw,
  Search,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { UserProfile } from "../types";

interface AdminPageProps {
  user: UserProfile | null;
  token: string | null;
  darkMode: boolean;
  onNavigate: (path: string) => void;
}

type AdminSection = "overview" | "users" | "decisions" | "trends" | "feedback" | "health";

// Reusable single-chart card component for Admin analytics
const AdminChartCard: React.FC<{
  title: string;
  subtitle?: string;
  type: "bar" | "pie";
  horizontal?: boolean;
  labels: string[];
  values: number[];
  darkMode: boolean;
  colorMode?: "purple" | "pink" | "pie_palette";
}> = ({
  title,
  subtitle,
  type,
  horizontal = false,
  labels,
  values,
  darkMode,
  colorMode = "purple",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const hasData = labels.length > 0 && values.some((v) => v > 0);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }
    if (!canvasRef.current || !hasData) return;

    const textColor = darkMode ? "#EAE4F8" : "#251C38";
    const gridColor = darkMode ? "rgba(234, 228, 248, 0.14)" : "rgba(37, 28, 56, 0.11)";
    const purplePrimary = darkMode ? "#A58AFF" : "#6342E8";
    const violetSoft = darkMode ? "#C4B5FD" : "#8B5CF6";
    const pinkAccent = darkMode ? "#F09AC6" : "#C85A94";
    const amberAccent = darkMode ? "#F5B95F" : "#D97706";
    const lavenderMuted = darkMode ? "#7C6FA6" : "#9F8FEF";

    const palette = [purplePrimary, pinkAccent, amberAccent, violetSoft, lavenderMuted];

    if (type === "pie") {
      chartRef.current = new Chart(canvasRef.current, {
        type: "pie",
        data: {
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: labels.map((_, i) => palette[i % palette.length]),
              borderWidth: 2,
              borderColor: darkMode ? "#1E1830" : "#FAF8FD",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: textColor,
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 600 },
                padding: 12,
              },
            },
          },
        },
      });
    } else {
      chartRef.current = new Chart(canvasRef.current, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: title,
              data: values,
              backgroundColor:
                colorMode === "pink"
                  ? pinkAccent
                  : colorMode === "pie_palette"
                  ? labels.map((_, i) => palette[i % palette.length])
                  : purplePrimary,
              borderRadius: 8,
              maxBarThickness: horizontal ? 30 : 48,
            },
          ],
        },
        options: {
          indexAxis: horizontal ? "y" : "x",
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: textColor },
              grid: { color: horizontal ? gridColor : "transparent" },
            },
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                color: textColor,
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 600 },
              },
              grid: { color: horizontal ? "transparent" : gridColor },
            },
          },
          plugins: { legend: { display: false } },
        },
      });
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [title, type, horizontal, JSON.stringify(labels), JSON.stringify(values), darkMode, hasData]);

  return (
    <div className="rounded-2xl p-6 border border-[var(--border-hairline)] bg-[var(--bg-card)] flex flex-col justify-between space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
      </div>
      {!hasData ? (
        <div className="h-56 rounded-xl border border-dashed border-[var(--border-hairline)] flex items-center justify-center text-xs text-[var(--text-muted)]">
          No data available yet
        </div>
      ) : (
        <div className="h-60 w-full relative" aria-label={title}>
          <canvas ref={canvasRef} />
        </div>
      )}
    </div>
  );
};

export const AdminPage: React.FC<AdminPageProps> = ({
  user,
  token,
  darkMode,
  onNavigate,
}) => {
  const [section, setSection] = useState<AdminSection>("overview");
  const [passcode, setPasscode] = useState("blindspot-admin-2026");
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiTestResult, setAiTestResult] = useState<any | null>(null);
  const [testingAi, setTestingAi] = useState(false);

  const fetchAdminStats = async (overrideCode?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "x-admin-passcode": overrideCode ?? passcode,
        },
      });
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Invalid response from /api/admin/stats (${res.status})`);
      }
      if (!res.ok) {
        setError(data.error || "Unauthorized");
        setStats(null);
      } else {
        setStats(data);
      }
    } catch (err: any) {
      setError(err.message || "Could not load admin telemetry.");
    } finally {
      setLoading(false);
    }
  };

  const runLiveAiDiagnostic = async () => {
    setTestingAi(true);
    try {
      const res = await fetch("/api/ai-test");
      const text = await res.text();
      const data = JSON.parse(text);
      setAiTestResult(data);
    } catch (e: any) {
      setAiTestResult({ ok: false, message: e.message || "Could not reach /api/ai-test" });
    } finally {
      setTestingAi(false);
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  // Prepare real sorted data arrays from stats
  const categoryEntries = Object.entries(stats?.categoryCounts || {}).sort(
    (a: any, b: any) => b[1] - a[1]
  );
  const languageEntries = Object.entries(stats?.languageCounts || {}).sort(
    (a: any, b: any) => b[1] - a[1]
  );
  const clarityEntries = [
    ["Low Clarity", Number(stats?.clarityDistribution?.["LOW CLARITY"] || 0)],
    ["Medium Clarity", Number(stats?.clarityDistribution?.["MEDIUM CLARITY"] || 0)],
    ["High Clarity", Number(stats?.clarityDistribution?.["HIGH CLARITY"] || 0)],
  ] as Array<[string, number]>;

  const blindSpotEntries = Object.entries(stats?.commonBlindSpots || {}).sort(
    (a: any, b: any) => b[1] - a[1]
  );
  const blindSpotSeverityEntries = [
    ["Important", Number(stats?.blindSpotSeverityCounts?.Important || 0)],
    ["Moderate", Number(stats?.blindSpotSeverityCounts?.Moderate || 0)],
    ["Low", Number(stats?.blindSpotSeverityCounts?.Low || 0)],
  ] as Array<[string, number]>;

  const ratingEntries = [
    ["1 Star", Number(stats?.feedbackRatingCounts?.["1"] || 0)],
    ["2 Stars", Number(stats?.feedbackRatingCounts?.["2"] || 0)],
    ["3 Stars", Number(stats?.feedbackRatingCounts?.["3"] || 0)],
    ["4 Stars", Number(stats?.feedbackRatingCounts?.["4"] || 0)],
    ["5 Stars", Number(stats?.feedbackRatingCounts?.["5"] || 0)],
  ] as Array<[string, number]>;

  const usefulEntries = [
    ["Discovered Blind Spot (Yes)", Number(stats?.usefulDistribution?.yes || 0)],
    ["Partially", Number(stats?.usefulDistribution?.partially || 0)],
    ["No", Number(stats?.usefulDistribution?.no || 0)],
  ] as Array<[string, number]>;

  const activityEntries = Object.entries(stats?.activityByDate || {}).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <div className="page-transition py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-5">
        <div>
          <p className="text-xs text-[var(--text-muted)]">
            Admin Analytics Console · Real Store Data
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold">
            Platform Administration
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-card)] px-3 py-1.5">
            <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Passcode"
              aria-label="Admin passcode"
              className="bg-transparent text-xs w-36 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => fetchAdminStats(passcode)}
            className="px-3.5 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => onNavigate("/")}
            className="px-3.5 py-2 rounded-xl border border-[var(--border-hairline)] text-xs font-medium"
          >
            Exit Admin
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[var(--bg-surface)] w-fit">
        {(
          [
            ["overview", "Overview"],
            ["users", "Users"],
            ["decisions", "Decisions"],
            ["trends", "Blind Spot Trends"],
            ["feedback", "Feedback"],
            ["health", "System Health"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              section === id
                ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl p-4 border border-amber-500/40 bg-amber-500/10 text-xs">
          {error} (Default passcode: <code className="font-mono-tabular">blindspot-admin-2026</code>)
        </div>
      )}

      {stats && (
        <>
          {/* 1. OVERVIEW */}
          {section === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="rounded-2xl p-5 border border-[var(--border-hairline)] bg-[var(--bg-card)]">
                  <p className="text-xs text-[var(--text-muted)]">Registered Users</p>
                  <p className="text-2xl font-semibold font-mono-tabular mt-1">
                    {stats.totalUsers}
                  </p>
                </div>
                <div className="rounded-2xl p-5 border border-[var(--border-hairline)] bg-[var(--bg-card)]">
                  <p className="text-xs text-[var(--text-muted)]">Active Sessions</p>
                  <p className="text-2xl font-semibold font-mono-tabular mt-1">
                    {stats.activeSessions}
                  </p>
                </div>
                <div className="rounded-2xl p-5 border border-[var(--border-hairline)] bg-[var(--bg-card)]">
                  <p className="text-xs text-[var(--text-muted)]">Decisions Analyzed</p>
                  <p className="text-2xl font-semibold font-mono-tabular mt-1">
                    {stats.decisionsAnalyzed}
                  </p>
                </div>
                <div className="rounded-2xl p-5 border border-[var(--border-hairline)] bg-[var(--bg-card)]">
                  <p className="text-xs text-[var(--text-muted)]">Q&A Rounds</p>
                  <p className="text-2xl font-semibold font-mono-tabular mt-1">
                    {stats.qnaRoundsGenerated}
                  </p>
                </div>
                <div className="rounded-2xl p-5 border border-[var(--border-hairline)] bg-[var(--bg-card)]">
                  <p className="text-xs text-[var(--text-muted)]">Avg Rating</p>
                  <p className="text-2xl font-semibold font-mono-tabular mt-1">
                    {stats.avgSatisfaction !== null ? `${stats.avgSatisfaction} / 5` : "No ratings"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AdminChartCard
                  title="Decisions by category"
                  subtitle="Real decision count grouped by AI-detected category"
                  type="bar"
                  labels={categoryEntries.map(([k]) => k)}
                  values={categoryEntries.map(([, v]) => Number(v))}
                  darkMode={darkMode}
                />
                <AdminChartCard
                  title="Decision clarity distribution"
                  subtitle="Proportion of Low, Medium, and High clarity decisions"
                  type="pie"
                  labels={clarityEntries.map(([k]) => k)}
                  values={clarityEntries.map(([, v]) => v)}
                  darkMode={darkMode}
                />
              </div>
            </div>
          )}

          {/* 2. USERS */}
          {section === "users" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AdminChartCard
                title="User language distribution"
                subtitle="Preferred language across registered users and sessions"
                type="pie"
                labels={languageEntries.map(([k]) => k)}
                values={languageEntries.map(([, v]) => Number(v))}
                darkMode={darkMode}
              />

              <div className="rounded-2xl p-6 border border-[var(--border-hairline)] bg-[var(--bg-card)] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">User & Privacy Statistics</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
                      <span className="text-[var(--text-muted)] block">Total Accounts</span>
                      <strong className="text-xl font-mono-tabular mt-1 block">
                        {stats.totalUsers}
                      </strong>
                    </div>
                    <div className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
                      <span className="text-[var(--text-muted)] block">Active Tokens</span>
                      <strong className="text-xl font-mono-tabular mt-1 block">
                        {stats.activeSessions}
                      </strong>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2 pt-2">
                    <Shield className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                    Passwords are scrypt-hashed and personal situation text is omitted from admin logs.
                  </p>
                </div>
                <div className="text-xs text-[var(--text-muted)] border-t border-[var(--border-hairline)] pt-3">
                  Active Operator: {user ? user.email : "Passcode Session"}
                </div>
              </div>
            </div>
          )}

          {/* 3. DECISIONS */}
          {section === "decisions" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AdminChartCard
                  title="Decisions by category"
                  type="bar"
                  labels={categoryEntries.map(([k]) => k)}
                  values={categoryEntries.map(([, v]) => Number(v))}
                  darkMode={darkMode}
                />
                <AdminChartCard
                  title="Decision clarity distribution"
                  type="pie"
                  labels={clarityEntries.map(([k]) => k)}
                  values={clarityEntries.map(([, v]) => v)}
                  darkMode={darkMode}
                />
              </div>

              <div className="rounded-2xl p-6 border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-base font-semibold">Anonymized Decision Sessions</h2>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter category…"
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-xs"
                    />
                  </div>
                </div>

                {(stats.anonymizedLogs || []).length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] py-6 text-center">
                    No decision sessions recorded in store.json yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                          <th className="py-2.5 pr-4">ID</th>
                          <th className="py-2.5 pr-4">Category</th>
                          <th className="py-2.5 pr-4">Clarity</th>
                          <th className="py-2.5 pr-4">Region</th>
                          <th className="py-2.5 text-right">Blind Spots</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(stats.anonymizedLogs || [])
                          .filter(
                            (r: any) =>
                              !searchQuery ||
                              String(r.category)
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase())
                          )
                          .map((row: any) => (
                            <tr key={row.id} className="border-b border-[var(--border-hairline)]">
                              <td className="py-2.5 pr-4 font-mono-tabular">{row.id}</td>
                              <td className="py-2.5 pr-4">{row.category}</td>
                              <td className="py-2.5 pr-4">{row.clarityLevel}</td>
                              <td className="py-2.5 pr-4">{row.region}</td>
                              <td className="py-2.5 text-right font-mono-tabular">
                                {row.blindSpotsCount}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. BLIND SPOT TRENDS */}
          {section === "trends" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AdminChartCard
                title="Most common blind spots"
                subtitle="Sorted from highest occurrence to lowest"
                type="bar"
                horizontal={true}
                colorMode="pink"
                labels={blindSpotEntries.map(([k]) => k)}
                values={blindSpotEntries.map(([, v]) => Number(v))}
                darkMode={darkMode}
              />
              <AdminChartCard
                title="Blind spot severity distribution"
                subtitle="Important vs Moderate vs Low severity across analyzed decisions"
                type="pie"
                labels={blindSpotSeverityEntries.map(([k]) => k)}
                values={blindSpotSeverityEntries.map(([, v]) => v)}
                darkMode={darkMode}
              />
            </div>
          )}

          {/* 5. FEEDBACK */}
          {section === "feedback" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AdminChartCard
                  title="User feedback ratings"
                  subtitle="1 to 5 star ratings from real user submissions"
                  type="bar"
                  colorMode="pie_palette"
                  labels={ratingEntries.map(([k]) => k)}
                  values={ratingEntries.map(([, v]) => v)}
                  darkMode={darkMode}
                />
                <AdminChartCard
                  title="Did users discover a blind spot?"
                  subtitle="Distribution of usefulness responses"
                  type="pie"
                  labels={usefulEntries.map(([k]) => k)}
                  values={usefulEntries.map(([, v]) => v)}
                  darkMode={darkMode}
                />
              </div>

              <div className="rounded-2xl p-6 border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-3">
                <h2 className="text-base font-semibold">Recent Feedback Submissions</h2>
                {(stats.feedbacks || []).length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">No feedback submitted yet.</p>
                ) : (
                  (stats.feedbacks || []).map((fb: any) => (
                    <div
                      key={fb.id}
                      className="p-3.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold">{fb.category}</span>
                        <span className="mx-2">·</span>
                        <span>{fb.improvements || "Rated useful"}</span>
                      </div>
                      <span className="font-mono-tabular font-semibold">{fb.usefulRating} ★</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 6. SYSTEM HEALTH */}
          {section === "health" && (
            <div className="space-y-6">
              <div className="rounded-2xl p-6 border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">System & Gemini 3.8 Flash Health</h2>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Active Model:{" "}
                      <span className="font-mono-tabular">{stats.systemHealth?.aiEngine}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={testingAi}
                    onClick={runLiveAiDiagnostic}
                    className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    {testingAi ? "Testing /api/ai-test…" : "Run /api/ai-test"}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
                    <p className="text-[var(--text-muted)]">API Status</p>
                    <p className="font-semibold mt-1">{stats.systemHealth?.status}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
                    <p className="text-[var(--text-muted)]">Gemini Key Configured</p>
                    <p className="font-semibold mt-1">
                      {stats.systemHealth?.aiConfigured ? "Yes (Ready)" : "No (Missing)"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
                    <p className="text-[var(--text-muted)]">Store Database</p>
                    <p className="font-semibold mt-1">
                      {stats.systemHealth?.storeExists ? "Connected (store.json)" : "Initializing"}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
                    <p className="text-[var(--text-muted)]">Total AI Calls</p>
                    <p className="font-mono-tabular font-semibold mt-1">{stats.aiCallsCount}</p>
                  </div>
                </div>

                {aiTestResult && (
                  <div
                    className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
                      aiTestResult.ok
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-amber-500/40 bg-amber-500/10"
                    }`}
                  >
                    {aiTestResult.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>
                      {aiTestResult.ok
                        ? `${aiTestResult.message || "Gemini 3.8 Flash is working"} (${
                            aiTestResult.model
                          } → "${aiTestResult.response}")`
                        : `Diagnostic: ${aiTestResult.message || aiTestResult.error}`}
                    </span>
                  </div>
                )}
              </div>

              <AdminChartCard
                title="Q&A and Analysis Activity by Date"
                subtitle="Real recorded timestamps from decisions and feedback"
                type="bar"
                labels={activityEntries.map(([k]) => k)}
                values={activityEntries.map(([, v]) => Number(v))}
                darkMode={darkMode}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
