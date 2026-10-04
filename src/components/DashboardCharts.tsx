import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";

interface DashboardChartsProps {
  decisions: any[];
  darkMode: boolean;
}

type DashboardChartTab = "categories" | "clarity" | "blind_spots" | "questions";

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ decisions, darkMode }) => {
  const [activeTab, setActiveTab] = useState<DashboardChartTab>("categories");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  const safeDecisions = Array.isArray(decisions) ? decisions : [];

  // 1. Decisions by Category
  const categoryMap: Record<string, number> = {};
  // 2. Clarity Distribution
  const clarityMap: Record<string, number> = {
    "Low Clarity": 0,
    "Medium Clarity": 0,
    "High Clarity": 0,
  };
  // 3. Blind Spots per Category / Decision
  const blindSpotsByCategory: Record<string, number> = {};
  // 4. Questions Exploration per Decision
  const qnaItems = safeDecisions
    .map((d) => ({
      label:
        String(d.title || d.category || "Decision").length > 26
          ? String(d.title || d.category).slice(0, 24) + "…"
          : String(d.title || d.category || "Decision"),
      generated: Array.isArray(d.askedQuestions)
        ? d.askedQuestions.length
        : Array.isArray(d.analysis?.important_questions)
        ? d.analysis.important_questions.length
        : 0,
      answered: Array.isArray(d.qnaHistory) ? d.qnaHistory.length : 0,
    }))
    .filter((item) => item.generated > 0 || item.answered > 0)
    .slice(0, 8);

  for (const d of safeDecisions) {
    const cat = d.category || d.analysis?.category || "General";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;

    const cl = d.clarityLevel || d.analysis?.clarity_level || "MEDIUM CLARITY";
    if (cl === "LOW CLARITY") clarityMap["Low Clarity"] += 1;
    else if (cl === "HIGH CLARITY") clarityMap["High Clarity"] += 1;
    else clarityMap["Medium Clarity"] += 1;

    const bsCount = Array.isArray(d.analysis?.blind_spots) ? d.analysis.blind_spots.length : 0;
    blindSpotsByCategory[cat] = (blindSpotsByCategory[cat] || 0) + bsCount;
  }

  const hasDataForTab = (() => {
    if (safeDecisions.length === 0) return false;
    if (activeTab === "categories") return Object.keys(categoryMap).length > 0;
    if (activeTab === "clarity") return safeDecisions.length > 0;
    if (activeTab === "blind_spots") {
      return Object.values(blindSpotsByCategory).some((v) => v > 0);
    }
    if (activeTab === "questions") return qnaItems.length > 0;
    return false;
  })();

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }
    if (!canvasRef.current || !hasDataForTab) return;

    const textColor = darkMode ? "#EAE4F8" : "#251C38";
    const gridColor = darkMode ? "rgba(234, 228, 248, 0.14)" : "rgba(37, 28, 56, 0.11)";
    const purplePrimary = darkMode ? "#A58AFF" : "#6342E8";
    const violetSoft = darkMode ? "#C4B5FD" : "#8B5CF6";
    const pinkAccent = darkMode ? "#F09AC6" : "#C85A94";
    const amberAccent = darkMode ? "#F5B95F" : "#D97706";

    if (activeTab === "categories") {
      const entries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
      chartRef.current = new Chart(canvasRef.current, {
        type: "bar",
        data: {
          labels: entries.map(([k]) => k),
          datasets: [
            {
              label: "Decisions Analyzed",
              data: entries.map(([, v]) => v),
              backgroundColor: purplePrimary,
              borderRadius: 8,
              maxBarThickness: 48,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: textColor },
              grid: { color: gridColor },
            },
            x: {
              ticks: {
                color: textColor,
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 600 },
              },
              grid: { display: false },
            },
          },
          plugins: { legend: { display: false } },
        },
      });
    } else if (activeTab === "clarity") {
      chartRef.current = new Chart(canvasRef.current, {
        type: "pie",
        data: {
          labels: ["Low Clarity", "Medium Clarity", "High Clarity"],
          datasets: [
            {
              data: [
                clarityMap["Low Clarity"],
                clarityMap["Medium Clarity"],
                clarityMap["High Clarity"],
              ],
              backgroundColor: [pinkAccent, amberAccent, purplePrimary],
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
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: 600 },
                padding: 14,
              },
            },
          },
        },
      });
    } else if (activeTab === "blind_spots") {
      const entries = Object.entries(blindSpotsByCategory).sort((a, b) => b[1] - a[1]);
      chartRef.current = new Chart(canvasRef.current, {
        type: "bar",
        data: {
          labels: entries.map(([k]) => k),
          datasets: [
            {
              label: "Blind Spots Uncovered",
              data: entries.map(([, v]) => v),
              backgroundColor: pinkAccent,
              borderRadius: 8,
              maxBarThickness: 48,
            },
          ],
        },
        options: {
          indexAxis: entries.length > 3 ? "y" : "x",
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: textColor },
              grid: { color: gridColor },
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: textColor,
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 600 },
              },
              grid: { display: false },
            },
          },
          plugins: { legend: { display: false } },
        },
      });
    } else if (activeTab === "questions") {
      chartRef.current = new Chart(canvasRef.current, {
        type: "bar",
        data: {
          labels: qnaItems.map((i) => i.label),
          datasets: [
            {
              label: "Questions Generated",
              data: qnaItems.map((i) => i.generated),
              backgroundColor: violetSoft,
              borderRadius: 6,
              maxBarThickness: 36,
            },
            {
              label: "Questions Answered",
              data: qnaItems.map((i) => i.answered),
              backgroundColor: purplePrimary,
              borderRadius: 6,
              maxBarThickness: 36,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: textColor },
              grid: { color: gridColor },
            },
            x: {
              ticks: {
                color: textColor,
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 600 },
              },
              grid: { display: false },
            },
          },
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: textColor, font: { size: 11 } },
            },
          },
        },
      });
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [activeTab, decisions, darkMode, hasDataForTab]);

  return (
    <div className="rounded-2xl p-6 border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs text-[var(--text-muted)]">Personal Decision Analytics</span>
          <h2 className="text-lg font-display font-semibold mt-0.5">
            {activeTab === "categories" && "What kinds of decisions do you analyze most?"}
            {activeTab === "clarity" && "How clear are your decisions?"}
            {activeTab === "blind_spots" && "Where are blind spots appearing most often?"}
            {activeTab === "questions" && "How much exploration did each decision require?"}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-surface)]">
          {(
            [
              ["categories", "Categories"],
              ["clarity", "Clarity"],
              ["blind_spots", "Blind Spots"],
              ["questions", "Q&A Depth"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTab === id
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!hasDataForTab ? (
        <div className="h-56 rounded-xl border border-dashed border-[var(--border-hairline)] flex items-center justify-center text-xs text-[var(--text-muted)]">
          No data available yet — run an analysis to populate your decision charts.
        </div>
      ) : (
        <div className="h-64 w-full relative">
          <canvas ref={canvasRef} />
        </div>
      )}
    </div>
  );
};
