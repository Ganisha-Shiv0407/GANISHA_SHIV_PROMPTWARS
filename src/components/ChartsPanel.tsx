import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { DecisionAnalysis } from "../types";

interface ChartsPanelProps {
  analysis: DecisionAnalysis;
  darkMode: boolean;
  historyList?: any[];
}

type InsightQuestionTab =
  | "factor_importance"
  | "considered_vs_overlooked"
  | "risk_impact"
  | "risk_distribution"
  | "blind_spot_severity"
  | "clarity_level";

export const ChartsPanel: React.FC<ChartsPanelProps> = ({
  analysis,
  darkMode,
  historyList = [],
}) => {
  const [activeTab, setActiveTab] = useState<InsightQuestionTab>("factor_importance");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const risks = analysis.risks || [];
  const blindSpots = analysis.blind_spots || [];
  const positives = analysis.positive_factors || [];
  const concerns = analysis.concerns || [];
  const missingInfo = analysis.missing_information || [];
  const assumptions = analysis.assumptions || [];

  // Non-double-counted rollups
  const consideredCount = positives.length + concerns.length;
  const overlookedCount = blindSpots.length + missingInfo.length;
  const assumptionsCount = assumptions.length;

  // Sorted risks (highest impact_score first)
  const sortedRisks = [...risks].sort(
    (a, b) => (Number(b.impact_score) || 0) - (Number(a.impact_score) || 0)
  );

  // Risk severity distribution counts
  const riskSeverityCounts = {
    Low: risks.filter((r) => r.severity === "Low").length,
    Moderate: risks.filter((r) => r.severity === "Moderate").length,
    Important: risks.filter((r) => r.severity === "Important").length,
  };

  // Blind spot severity distribution counts
  const blindSpotSeverityCounts = {
    Low: blindSpots.filter((b) => b.severity === "Low").length,
    Moderate: blindSpots.filter((b) => b.severity === "Moderate").length,
    Important: blindSpots.filter((b) => b.severity === "Important").length,
  };

  // Historical clarity counts (if multiple decisions exist)
  const historicalClarityCounts = {
    "Low Clarity": historyList.filter((d) => d.clarityLevel === "LOW CLARITY").length,
    "Medium Clarity": historyList.filter((d) => d.clarityLevel === "MEDIUM CLARITY").length,
    "High Clarity": historyList.filter((d) => d.clarityLevel === "HIGH CLARITY").length,
  };
  const hasMultipleHistory = historyList.length >= 2;

  // Determine whether the active tab has chartable data
  const hasChartData = (() => {
    if (activeTab === "factor_importance") return Boolean(analysis.factor_weights);
    if (activeTab === "considered_vs_overlooked") {
      return consideredCount + overlookedCount + assumptionsCount > 0;
    }
    if (activeTab === "risk_impact") return sortedRisks.length > 0;
    if (activeTab === "risk_distribution") return risks.length > 0;
    if (activeTab === "blind_spot_severity") return blindSpots.length > 0;
    if (activeTab === "clarity_level") return hasMultipleHistory;
    return false;
  })();

  useEffect(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }
    if (!canvasRef.current || !hasChartData) return;

    const textColor = darkMode ? "#EAE4F8" : "#251C38";
    const gridColor = darkMode ? "rgba(234, 228, 248, 0.14)" : "rgba(37, 28, 56, 0.11)";
    const purplePrimary = darkMode ? "#A58AFF" : "#6342E8";
    const violetSoft = darkMode ? "#C4B5FD" : "#8B5CF6";
    const pinkAccent = darkMode ? "#F09AC6" : "#C85A94";
    const amberAccent = darkMode ? "#F5B95F" : "#D97706";
    const lavenderMuted = darkMode ? "#7C6FA6" : "#9F8FEF";

    if (activeTab === "factor_importance") {
      const fw = analysis.factor_weights;
      const factorPairs = [
        { label: "Cost / Financial", value: Number(fw?.cost_financial ?? 0) },
        { label: "Time Commitment", value: Number(fw?.time_commitment ?? 0) },
        { label: "Learning / Growth", value: Number(fw?.learning_growth ?? 0) },
        { label: "Safety / Wellbeing", value: Number(fw?.safety_wellbeing ?? 0) },
        { label: "Convenience", value: Number(fw?.convenience ?? 0) },
        { label: "Long-Term Benefit", value: Number(fw?.long_term_benefit ?? 0) },
        { label: "Personal Priority Fit", value: Number(fw?.personal_priority_fit ?? 0) },
      ].sort((a, b) => b.value - a.value);

      chartInstanceRef.current = new Chart(canvasRef.current, {
        type: "bar",
        data: {
          labels: factorPairs.map((f) => f.label),
          datasets: [
            {
              label: "Importance Weight (1–10)",
              data: factorPairs.map((f) => f.value),
              backgroundColor: factorPairs.map((_, i) =>
                i === 0 || i === 1 ? purplePrimary : i < 4 ? violetSoft : lavenderMuted
              ),
              borderRadius: 8,
              maxBarThickness: 32,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              min: 0,
              max: 10,
              ticks: { stepSize: 2, color: textColor },
              grid: { color: gridColor },
            },
            y: {
              ticks: {
                color: textColor,
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: 600 },
              },
              grid: { display: false },
            },
          },
          plugins: {
            legend: { display: false },
          },
        },
      });
    } else if (activeTab === "considered_vs_overlooked") {
      chartInstanceRef.current = new Chart(canvasRef.current, {
        type: "bar",
        data: {
          labels: [
            "Positive Factors",
            "Concerns",
            "Blind Spots",
            "Missing Info",
            "Assumptions",
          ],
          datasets: [
            {
              label: "Items Identified",
              data: [
                positives.length,
                concerns.length,
                blindSpots.length,
                missingInfo.length,
                assumptions.length,
              ],
              backgroundColor: [
                purplePrimary,
                violetSoft,
                pinkAccent,
                amberAccent,
                lavenderMuted,
              ],
              borderRadius: 8,
              maxBarThickness: 52,
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
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: 600 },
              },
              grid: { display: false },
            },
          },
          plugins: {
            legend: { display: false },
          },
        },
      });
    } else if (activeTab === "risk_impact") {
      chartInstanceRef.current = new Chart(canvasRef.current, {
        type: "bar",
        data: {
          labels: sortedRisks.map((r) =>
            r.risk_name.length > 38 ? r.risk_name.slice(0, 36) + "…" : r.risk_name
          ),
          datasets: [
            {
              label: "Impact Score (1–10)",
              data: sortedRisks.map((r) => Number(r.impact_score) || 0),
              backgroundColor: sortedRisks.map((r) =>
                r.severity === "Important"
                  ? pinkAccent
                  : r.severity === "Moderate"
                  ? amberAccent
                  : purplePrimary
              ),
              borderRadius: 8,
              maxBarThickness: 32,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              min: 0,
              max: 10,
              ticks: { stepSize: 2, color: textColor },
              grid: { color: gridColor },
            },
            y: {
              ticks: {
                color: textColor,
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: 600 },
              },
              grid: { display: false },
            },
          },
          plugins: {
            legend: { display: false },
          },
        },
      });
    } else if (activeTab === "risk_distribution") {
      chartInstanceRef.current = new Chart(canvasRef.current, {
        type: "pie",
        data: {
          labels: ["Important Severity", "Moderate Severity", "Low Severity"],
          datasets: [
            {
              data: [
                riskSeverityCounts.Important,
                riskSeverityCounts.Moderate,
                riskSeverityCounts.Low,
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
                padding: 16,
              },
            },
          },
        },
      });
    } else if (activeTab === "blind_spot_severity") {
      chartInstanceRef.current = new Chart(canvasRef.current, {
        type: "pie",
        data: {
          labels: ["Important Severity", "Moderate Severity", "Low Severity"],
          datasets: [
            {
              data: [
                blindSpotSeverityCounts.Important,
                blindSpotSeverityCounts.Moderate,
                blindSpotSeverityCounts.Low,
              ],
              backgroundColor: [pinkAccent, amberAccent, violetSoft],
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
                padding: 16,
              },
            },
          },
        },
      });
    } else if (activeTab === "clarity_level" && hasMultipleHistory) {
      chartInstanceRef.current = new Chart(canvasRef.current, {
        type: "pie",
        data: {
          labels: ["Low Clarity", "Medium Clarity", "High Clarity"],
          datasets: [
            {
              data: [
                historicalClarityCounts["Low Clarity"],
                historicalClarityCounts["Medium Clarity"],
                historicalClarityCounts["High Clarity"],
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
                padding: 16,
              },
            },
          },
        },
      });
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [activeTab, analysis, darkMode, hasChartData, historyList]);

  const tabs: Array<{ id: InsightQuestionTab; label: string }> = [
    { id: "factor_importance", label: "What factors matter most?" },
    { id: "considered_vs_overlooked", label: "Considered vs Overlooked" },
    { id: "risk_impact", label: "Biggest Downside Risk" },
    { id: "risk_distribution", label: "Risk Distribution" },
    { id: "blind_spot_severity", label: "Blind Spot Severity" },
    { id: "clarity_level", label: "Decision Clarity" },
  ];

  return (
    <div className="space-y-6">
      {/* Segmented Selector (ONE VISUAL = ONE CLEAR QUESTION) */}
      <div
        className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[var(--bg-surface)]"
        role="tablist"
        aria-label="Decision analysis visualizations"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Single Focused Visual Container */}
      <div className="rounded-2xl p-6 sm:p-8 border border-[var(--border-hairline)] bg-[var(--bg-card)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-display font-semibold text-[var(--text-primary)]">
              {activeTab === "factor_importance" && "What factors matter most?"}
              {activeTab === "considered_vs_overlooked" && "What did you consider vs overlook?"}
              {activeTab === "risk_impact" && "Where is the biggest downside risk?"}
              {activeTab === "risk_distribution" && "How are the identified risks distributed?"}
              {activeTab === "blind_spot_severity" && "How severe are the blind spots?"}
              {activeTab === "clarity_level" && "Decision Clarity Composition"}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {activeTab === "factor_importance" &&
                "Horizontal bar ranking of the 7 decision factor weights (1–10) from your analysis."}
              {activeTab === "considered_vs_overlooked" &&
                `Considered (${consideredCount} = ${positives.length} positives + ${concerns.length} concerns) vs Overlooked (${overlookedCount} = ${blindSpots.length} blind spots + ${missingInfo.length} missing info) and ${assumptionsCount} assumptions.`}
              {activeTab === "risk_impact" &&
                "Identified risks sorted from highest impact score (1–10) to lowest."}
              {activeTab === "risk_distribution" &&
                "Proportion of Low, Moderate, and Important risks in this decision."}
              {activeTab === "blind_spot_severity" &&
                "Proportion of Low, Moderate, and Important blind spots uncovered."}
              {activeTab === "clarity_level" &&
                "Current decision clarity state and historical clarity distribution."}
            </p>
          </div>
          <span className="text-xs font-semibold text-[var(--accent-primary)]">
            {analysis.clarity_level}
          </span>
        </div>

        {/* Special handling for Clarity Level when only 1 decision is active vs multiple */}
        {activeTab === "clarity_level" && !hasMultipleHistory ? (
          <div className="space-y-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["LOW CLARITY", "MEDIUM CLARITY", "HIGH CLARITY"] as const).map((lvl) => {
                const isCurrent = analysis.clarity_level === lvl;
                return (
                  <div
                    key={lvl}
                    className={`p-5 rounded-2xl border text-center transition-all ${
                      isCurrent
                        ? "border-[var(--accent-primary)] bg-[var(--accent-soft)]/50 shadow-xs"
                        : "border-[var(--border-hairline)] bg-[var(--bg-elevated)] opacity-55"
                    }`}
                  >
                    <p className="text-xs font-mono-tabular text-[var(--text-muted)]">
                      {isCurrent ? "ACTIVE STATUS" : "STAGE"}
                    </p>
                    <p className="text-base font-display font-semibold mt-1">{lvl}</p>
                  </div>
                );
              })}
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-xs space-y-1">
              <strong className="block text-[var(--text-primary)]">Why this clarity level:</strong>
              <p className="text-[var(--text-secondary)]">{analysis.clarity_reason}</p>
              <p className="text-[var(--text-muted)] pt-1">
                Analyze 2 or more decisions to unlock your multi-decision Clarity Distribution pie chart.
              </p>
            </div>
          </div>
        ) : !hasChartData ? (
          <div className="h-64 rounded-xl border border-dashed border-[var(--border-hairline)] flex items-center justify-center text-xs text-[var(--text-muted)]">
            No data available yet
          </div>
        ) : (
          <div
            className="h-80 w-full relative"
            aria-label={`Chart for ${activeTab.replace(/_/g, " ")}`}
          >
            <canvas ref={canvasRef} />
          </div>
        )}

        {/* Accessible Textual Summary Footer */}
        <div className="pt-4 border-t border-[var(--border-hairline)] text-xs text-[var(--text-secondary)]">
          {activeTab === "factor_importance" && (
            <span>
              <strong className="text-[var(--text-primary)]">Summary:</strong> Time Commitment (
              <span className="font-mono-tabular">
                {analysis.factor_weights?.time_commitment ?? 0}/10
              </span>
              ), Long-Term Benefit (
              <span className="font-mono-tabular">
                {analysis.factor_weights?.long_term_benefit ?? 0}/10
              </span>
              ), and Cost / Financial (
              <span className="font-mono-tabular">
                {analysis.factor_weights?.cost_financial ?? 0}/10
              </span>
              ).
            </span>
          )}
          {activeTab === "considered_vs_overlooked" && (
            <span>
              <strong className="text-[var(--text-primary)]">Non-overlapping breakdown:</strong>{" "}
              Considered = <span className="font-mono-tabular">{consideredCount}</span> · Overlooked
              = <span className="font-mono-tabular">{overlookedCount}</span> · Unverified
              Assumptions = <span className="font-mono-tabular">{assumptionsCount}</span>.
            </span>
          )}
          {activeTab === "risk_impact" && (
            <span>
              {sortedRisks[0] ? (
                <>
                  <strong className="text-[var(--text-primary)]">Highest risk:</strong>{" "}
                  {sortedRisks[0].risk_name} (Impact{" "}
                  <span className="font-mono-tabular">{sortedRisks[0].impact_score}/10</span>,{" "}
                  {sortedRisks[0].severity}) — Mitigation: {sortedRisks[0].mitigation}
                </>
              ) : (
                "No risks identified yet."
              )}
            </span>
          )}
          {activeTab === "risk_distribution" && (
            <span>
              <strong className="text-[var(--text-primary)]">Risk breakdown:</strong>{" "}
              <span className="font-mono-tabular">{riskSeverityCounts.Important}</span> Important ·{" "}
              <span className="font-mono-tabular">{riskSeverityCounts.Moderate}</span> Moderate ·{" "}
              <span className="font-mono-tabular">{riskSeverityCounts.Low}</span> Low.
            </span>
          )}
          {activeTab === "blind_spot_severity" && (
            <span>
              <strong className="text-[var(--text-primary)]">Blind spot breakdown:</strong>{" "}
              <span className="font-mono-tabular">{blindSpotSeverityCounts.Important}</span>{" "}
              Important ·{" "}
              <span className="font-mono-tabular">{blindSpotSeverityCounts.Moderate}</span> Moderate
              · <span className="font-mono-tabular">{blindSpotSeverityCounts.Low}</span> Low.
            </span>
          )}
          {activeTab === "clarity_level" && (
            <span>
              <strong className="text-[var(--text-primary)]">Current Decision Clarity:</strong>{" "}
              {analysis.clarity_level}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
