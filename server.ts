import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "2mb" }));

// Check whether a real GEMINI_API_KEY is configured in the server environment
function getConfiguredApiKey(): string {
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key || key === "MY_GEMINI_API_KEY" || key === "your_gemini_api_key_here") {
    return "";
  }
  return key;
}

function isGeminiConfigured(): boolean {
  return Boolean(getConfiguredApiKey());
}

// Shared server-side Gemini client service
let sharedAiClient: GoogleGenAI | null = null;
let lastUsedApiKey = "";

function getAiClient(): GoogleGenAI {
  const apiKey = getConfiguredApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  if (!sharedAiClient || lastUsedApiKey !== apiKey) {
    sharedAiClient = new GoogleGenAI({ apiKey });
    lastUsedApiKey = apiKey;
  }
  return sharedAiClient;
}

// Extract text from a Gemini Interactions API response
function extractInteractionText(interaction: any): string {
  if (!interaction) return "";
  let fullOutput = "";
  if (Array.isArray(interaction.steps)) {
    for (const step of interaction.steps) {
      if (step.type === "model_output" && Array.isArray(step.content)) {
        for (const c of step.content) {
          if (c.type === "text" && typeof c.text === "string") {
            fullOutput += c.text;
          }
        }
      }
    }
  }
  if (!fullOutput && typeof interaction.output_text === "string") {
    fullOutput = interaction.output_text;
  }
  return fullOutput.trim();
}

// Parse structured JSON returned by Gemini Interactions API without markdown wrappers
function parseStructuredJson(rawText: string): any {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error("Gemini returned an empty response.");
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    const match =
      trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i) ||
      trimmed.match(/(\{[\s\S]*\})/);
    if (match && match[1]) {
      return JSON.parse(match[1].trim());
    }
    throw new Error("Gemini returned invalid structured JSON.");
  }
}

// Convert Gemini / HTTP errors into clear, safe user-facing messages (never exposing the API key)
function formatGeminiError(error: any): { status: number; message: string } {
  const rawMsg = String(error?.message || error || "").replace(
    getConfiguredApiKey() || "__NO_KEY__",
    "[REDACTED]"
  );
  const status = Number(error?.status || error?.statusCode || 500);

  if (!isGeminiConfigured() || rawMsg.includes("GEMINI_API_KEY is not configured")) {
    return {
      status: 503,
      message: "GEMINI_API_KEY is not configured",
    };
  }
  if (
    status === 401 ||
    status === 403 ||
    /api_key_invalid|permission_denied|unauthenticated|invalid api key/i.test(rawMsg)
  ) {
    return {
      status: 401,
      message: "Gemini authentication failed. Check the configured GEMINI_API_KEY.",
    };
  }
  if (status === 429 || /quota|rate limit|resource_exhausted|429/i.test(rawMsg)) {
    return {
      status: 429,
      message: "The Gemini API is temporarily rate-limited. Please try again shortly.",
    };
  }
  if (/timeout|deadline_exceeded|etimedout/i.test(rawMsg)) {
    return {
      status: 504,
      message: "The Gemini request timed out. Please try again.",
    };
  }
  return {
    status: status >= 400 && status < 600 ? status : 500,
    message: rawMsg || "Gemini request failed. Please try again.",
  };
}

// Persistent local store for users, decisions, feedback, and privacy-safe analytics
const DATA_DIR = path.resolve(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: "user" | "admin";
  language: string;
  location: {
    country: string;
    state: string;
    city: string;
  };
  gender?: string;
  createdAt: string;
}

interface StoredDecision {
  id: string;
  userId: string | null;
  title: string;
  category: string;
  clarityLevel: "LOW CLARITY" | "MEDIUM CLARITY" | "HIGH CLARITY";
  version: number;
  inputs: {
    situation: string;
    positives: string;
    concerns: string;
    currentLeaning: string;
    reasoning: string;
    uncertainties: string;
    additionalOptions: string[];
  };
  qnaHistory: Array<{
    question: string;
    answer: string;
    round: number;
    angle?: string;
  }>;
  askedQuestions: string[];
  analysis: any;
  finalReflection?: {
    userSummary: string;
    decidedAt: string;
  };
  language: string;
  location: {
    country: string;
    state: string;
    city: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface StoredFeedback {
  id: string;
  decisionId?: string;
  category: string;
  usefulRating: number;
  discoveredBlindSpot: "yes" | "partially" | "no";
  questionsHelped: "yes" | "somewhat" | "no";
  confusingParts: string;
  improvements: string;
  createdAt: string;
}

interface StoreData {
  users: StoredUser[];
  sessions: Record<string, { userId: string; expiresAt: number }>;
  decisions: StoredDecision[];
  feedbacks: StoredFeedback[];
  analytics: {
    aiCallsCount: number;
    qnaRoundsGenerated: number;
    commonBlindSpotTags: Record<string, number>;
    unansweredQuestionTypes: Record<string, number>;
  };
}

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const usedSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, usedSalt, 64).toString("hex");
  return { hash, salt: usedSalt };
}

function loadStore(): StoreData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    const adminPass = hashPassword(process.env.ADMIN_PASSCODE || "BlindSpotAdmin2026!");
    const demoUserPass = hashPassword("DemoUser2026!");
    const initialData: StoreData = {
      users: [
        {
          id: "usr_admin_01",
          name: "Platform Administrator",
          email: "admin@blindspot.ai",
          passwordHash: adminPass.hash,
          salt: adminPass.salt,
          role: "admin",
          language: "English",
          location: { country: "India", state: "Maharashtra", city: "Pune" },
          gender: "Prefer not to say",
          createdAt: new Date().toISOString(),
        },
        {
          id: "usr_demo_01",
          name: "Aarav Deshmukh",
          email: "aarav@example.com",
          passwordHash: demoUserPass.hash,
          salt: demoUserPass.salt,
          role: "user",
          language: "English",
          location: { country: "India", state: "Maharashtra", city: "Pune" },
          gender: "Prefer not to say",
          createdAt: new Date().toISOString(),
        },
      ],
      sessions: {},
      decisions: [],
      feedbacks: [],
      analytics: {
        aiCallsCount: 0,
        qnaRoundsGenerated: 0,
        commonBlindSpotTags: {},
        unansweredQuestionTypes: {},
      },
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
  } catch {
    return {
      users: [],
      sessions: {},
      decisions: [],
      feedbacks: [],
      analytics: {
        aiCallsCount: 0,
        qnaRoundsGenerated: 0,
        commonBlindSpotTags: {},
        unansweredQuestionTypes: {},
      },
    };
  }
}

function saveStore(store: StoreData) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

function getAuthenticatedUser(req: express.Request, store: StoreData): StoredUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  const session = store.sessions[token];
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    delete store.sessions[token];
    saveStore(store);
    return null;
  }
  return store.users.find((u) => u.id === session.userId) || null;
}

// ============================================================================
// DETERMINISTIC GEMINI RESPONSE SCHEMAS (NO DEPRECATED PARAMETERS)
// ============================================================================

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    situation_summary: { type: Type.STRING },
    category: { type: Type.STRING },
    user_goal: { type: Type.STRING },
    safety_or_emergency_notice: { type: Type.STRING },
    recommendation_mode: { type: Type.STRING },
    positive_factors: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    concerns: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    assumptions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          type: { type: Type.STRING },
          severity: { type: Type.STRING },
          explanation: { type: Type.STRING },
          if_wrong: { type: Type.STRING },
        },
        required: ["title", "type", "severity", "explanation", "if_wrong"],
      },
    },
    blind_spots: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          dimension: { type: Type.STRING },
          severity: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["title", "dimension", "severity", "description"],
      },
    },
    contradictions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          statement_a: { type: Type.STRING },
          statement_b: { type: Type.STRING },
          tension_explanation: { type: Type.STRING },
          severity: { type: Type.STRING },
        },
        required: ["statement_a", "statement_b", "tension_explanation", "severity"],
      },
    },
    missing_information: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING },
          why_it_matters: { type: Type.STRING },
          how_to_find_out: { type: Type.STRING },
          severity: { type: Type.STRING },
        },
        required: ["item", "why_it_matters", "how_to_find_out", "severity"],
      },
    },
    risks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          risk_name: { type: Type.STRING },
          category: { type: Type.STRING },
          severity: { type: Type.STRING },
          impact_score: { type: Type.NUMBER },
          mitigation: { type: Type.STRING },
        },
        required: ["risk_name", "category", "severity", "impact_score", "mitigation"],
      },
    },
    important_questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          question: { type: Type.STRING },
          why_asking: { type: Type.STRING },
          diagnostic_angle: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["id", "question", "why_asking", "diagnostic_angle", "options"],
      },
    },
    alternative_perspectives: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          lens_name: { type: Type.STRING },
          perspective: { type: Type.STRING },
        },
        required: ["lens_name", "perspective"],
      },
    },
    clarity_level: { type: Type.STRING },
    clarity_reason: { type: Type.STRING },
    verification_items: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    next_actions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          step: { type: Type.STRING },
          timeframe: { type: Type.STRING },
          purpose: { type: Type.STRING },
        },
        required: ["step", "timeframe", "purpose"],
      },
    },
    contextual_support: {
      type: Type.OBJECT,
      properties: {
        domain_title: { type: Type.STRING },
        practical_guidance: { type: Type.STRING },
        checklist_or_substitutions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        official_or_trusted_resources: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              what_to_check: { type: Type.STRING },
            },
            required: ["name", "description", "what_to_check"],
          },
        },
      },
      required: [
        "domain_title",
        "practical_guidance",
        "checklist_or_substitutions",
        "official_or_trusted_resources",
      ],
    },
    factor_weights: {
      type: Type.OBJECT,
      properties: {
        cost_financial: { type: Type.NUMBER },
        time_commitment: { type: Type.NUMBER },
        learning_growth: { type: Type.NUMBER },
        safety_wellbeing: { type: Type.NUMBER },
        convenience: { type: Type.NUMBER },
        long_term_benefit: { type: Type.NUMBER },
        personal_priority_fit: { type: Type.NUMBER },
      },
      required: [
        "cost_financial",
        "time_commitment",
        "learning_growth",
        "safety_wellbeing",
        "convenience",
        "long_term_benefit",
        "personal_priority_fit",
      ],
    },
    before_you_decide_reflection: {
      type: Type.OBJECT,
      properties: {
        originally_thought: { type: Type.STRING },
        what_you_discovered: { type: Type.STRING },
        what_remains_uncertain: { type: Type.STRING },
        self_reflection_questions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        what_could_change_decision: { type: Type.STRING },
      },
      required: [
        "originally_thought",
        "what_you_discovered",
        "what_remains_uncertain",
        "self_reflection_questions",
        "what_could_change_decision",
      ],
    },
  },
  required: [
    "situation_summary",
    "category",
    "user_goal",
    "safety_or_emergency_notice",
    "recommendation_mode",
    "positive_factors",
    "concerns",
    "assumptions",
    "blind_spots",
    "contradictions",
    "missing_information",
    "risks",
    "important_questions",
    "alternative_perspectives",
    "clarity_level",
    "clarity_reason",
    "verification_items",
    "next_actions",
    "contextual_support",
    "factor_weights",
    "before_you_decide_reflection",
  ],
};

const ADAPTIVE_QNA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    round_insight_summary: { type: Type.STRING },
    updated_clarity_level: { type: Type.STRING },
    updated_clarity_reason: { type: Type.STRING },
    new_discovered_blind_spots: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          dimension: { type: Type.STRING },
          severity: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["title", "dimension", "severity", "description"],
      },
    },
    important_questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          question: { type: Type.STRING },
          why_asking: { type: Type.STRING },
          diagnostic_angle: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["id", "question", "why_asking", "diagnostic_angle", "options"],
      },
    },
    closer_to_solution_synthesis: { type: Type.STRING },
  },
  required: [
    "round_insight_summary",
    "updated_clarity_level",
    "updated_clarity_reason",
    "new_discovered_blind_spots",
    "important_questions",
    "closer_to_solution_synthesis",
  ],
};

// ============================================================================
// DIAGNOSTIC & HEALTH ENDPOINTS
// ============================================================================

app.get("/api/health", (_req, res) => {
  const configured = isGeminiConfigured();
  return res.json({
    ok: true,
    server: true,
    geminiConfigured: configured,
    aiConfigured: configured,
  });
});

app.get("/api/ai-test", async (_req, res) => {
  if (!isGeminiConfigured()) {
    return res.status(503).json({
      ok: false,
      configured: false,
      model: "gemini-3.8-flash",
      error: "GEMINI_API_KEY is not configured",
      message: "GEMINI_API_KEY is not configured",
    });
  }
  try {
    const ai = getAiClient();
    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: "Reply with the single word OK.",
    });
    const text = extractInteractionText(interaction) || "OK";
    return res.json({
      ok: true,
      configured: true,
      model: "gemini-3.8-flash",
      message: "Gemini 3.8 Flash is connected",
      response: text,
    });
  } catch (error: any) {
    console.error("AI-TEST ERROR:", error);
    const formatted = formatGeminiError(error);
    return res.status(formatted.status).json({
      ok: false,
      configured: true,
      model: "gemini-3.8-flash",
      error: formatted.message,
      message: formatted.message,
    });
  }
});

// ============================================================================
// CORE AI ENDPOINTS (GEMINI 3.8 FLASH — INTERACTIONS API)
// ============================================================================

app.post("/api/analyze", async (req, res) => {
  try {
    if (!isGeminiConfigured()) {
      return res.status(503).json({
        ok: false,
        configured: false,
        error: "GEMINI_API_KEY is not configured",
        message: "GEMINI_API_KEY is not configured",
      });
    }

    const {
      inputs,
      qnaHistory = [],
      askedQuestions = [],
      language = "English",
      location = { country: "India", state: "Maharashtra", city: "Pune" },
      gender = "Prefer not to say",
      decisionId,
    } = req.body || {};

    if (!inputs || !inputs.situation || String(inputs.situation).trim().length < 5) {
      return res.status(400).json({
        ok: false,
        configured: true,
        error: "Please enter at least 5 characters describing your situation.",
        message: "Please enter at least 5 characters describing your situation.",
      });
    }

    const ai = getAiClient();
    const store = loadStore();
    const locationStr =
      [location?.city, location?.state, location?.country].filter(Boolean).join(", ") || "Global";

    const systemPrompt = `You are THE BLIND SPOT, an AI decision-reflection assistant.

Your purpose is NOT to make the final decision for the user.

Your purpose is to help the user see what they may have missed.

For every situation:
1. Understand the user's actual goal.
2. Summarize the situation accurately.
3. Identify positive factors.
4. Identify concerns.
5. Identify assumptions.
6. Identify blind spots.
7. Identify contradictions.
8. Identify missing information.
9. Identify risks.
10. Ask useful follow-up questions when information is insufficient.
11. Consider alternative perspectives.
12. Explain the current clarity level.
13. Suggest practical next actions.
14. Provide verification items when external facts should be checked.
15. Provide contextual support based on the user's situation.
16. Never pretend uncertain information is certain.
17. Never invent facts, statistics, laws, prices, policies, locations, or current information.
18. Clearly distinguish user-provided facts from assumptions and suggestions.
19. Do not make the final decision for the user.
20. Help the user make a more informed decision.

The response should be practical, concise, intelligent and personalized.
Respond in ${language}. Keep JSON keys in English, clarity_level strictly as 'LOW CLARITY', 'MEDIUM CLARITY', or 'HIGH CLARITY', and severity strictly as 'Low', 'Moderate', or 'Important'. Return pure JSON without Markdown code fences.`;

    const userPrompt = `Analyze this decision situation:
Situation: ${inputs.situation}
Positive factors: ${inputs.positives || "None specified"}
Concerns: ${inputs.concerns || "None specified"}
Current leaning: ${inputs.currentLeaning || "Undecided"}
Reasoning: ${inputs.reasoning || "None specified"}
Uncertainties: ${inputs.uncertainties || "None specified"}
Options: ${(inputs.additionalOptions || []).join("; ") || "None specified"}
Location context: ${locationStr}
Gender context: ${gender}
Previous Q&A: ${
      qnaHistory.length > 0
        ? qnaHistory.map((q: any, i: number) => `${i + 1}. Q: ${q.question} A: ${q.answer}`).join(" | ")
        : "None"
    }
Already asked questions (do NOT repeat): ${askedQuestions.join(" | ") || "None"}`;

    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: userPrompt,
      system_instruction: systemPrompt,
      response_format: ANALYSIS_SCHEMA,
    });

    const rawText = extractInteractionText(interaction);
    const analysis = parseStructuredJson(rawText);

    if (
      !analysis ||
      typeof analysis.situation_summary !== "string" ||
      !Array.isArray(analysis.blind_spots) ||
      !Array.isArray(analysis.important_questions)
    ) {
      throw new Error("Gemini returned incomplete structured analysis fields.");
    }

    analysis.safety_or_emergency_notice = analysis.safety_or_emergency_notice || "";
    analysis.recommendation_mode = analysis.recommendation_mode || "B. Decision Analysis Needed";

    store.analytics.aiCallsCount += 1;
    for (const bs of analysis.blind_spots) {
      const dim = bs.dimension || "Overlooked Factor";
      store.analytics.commonBlindSpotTags[dim] =
        (store.analytics.commonBlindSpotTags[dim] || 0) + 1;
    }

    const authedUser = getAuthenticatedUser(req, store);
    let savedDecision: StoredDecision | null = null;
    const allAsked = Array.from(
      new Set([
        ...askedQuestions,
        ...(analysis.important_questions || []).map((q: any) => q.question),
      ])
    );

    if (decisionId) {
      const existing = store.decisions.find((d) => d.id === decisionId);
      if (existing) {
        existing.inputs = inputs;
        existing.qnaHistory = qnaHistory;
        existing.askedQuestions = allAsked;
        existing.analysis = analysis;
        existing.category = analysis.category || existing.category;
        existing.clarityLevel = analysis.clarity_level || existing.clarityLevel;
        existing.version += 1;
        existing.updatedAt = new Date().toISOString();
        savedDecision = existing;
      }
    }

    if (!savedDecision) {
      savedDecision = {
        id: "dec_" + crypto.randomBytes(6).toString("hex"),
        userId: authedUser ? authedUser.id : null,
        title:
          String(inputs.situation).slice(0, 72) +
          (String(inputs.situation).length > 72 ? "…" : ""),
        category: analysis.category || "General Decision",
        clarityLevel: analysis.clarity_level || "MEDIUM CLARITY",
        version: 1,
        inputs,
        qnaHistory,
        askedQuestions: allAsked,
        analysis,
        language,
        location,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.decisions.unshift(savedDecision);
    }

    saveStore(store);

    return res.json({
      ok: true,
      configured: true,
      decisionId: savedDecision.id,
      version: savedDecision.version,
      askedQuestions: allAsked,
      analysis,
    });
  } catch (error: any) {
    console.error("ANALYZE ERROR:", error);
    const formatted = formatGeminiError(error);
    return res.status(formatted.status).json({
      ok: false,
      configured: isGeminiConfigured(),
      error: formatted.message,
      message: formatted.message,
    });
  }
});

app.post("/api/qna/next", async (req, res) => {
  try {
    if (!isGeminiConfigured()) {
      return res.status(503).json({
        ok: false,
        configured: false,
        error: "GEMINI_API_KEY is not configured",
        message: "GEMINI_API_KEY is not configured",
      });
    }

    const {
      decisionId,
      inputs,
      qnaHistory = [],
      askedQuestions = [],
      round = 1,
      focusAngle = "auto",
      language = "English",
      location = { country: "India", state: "Maharashtra", city: "Pune" },
    } = req.body || {};

    if (!inputs || !inputs.situation) {
      return res.status(400).json({
        ok: false,
        configured: true,
        error: "Situation context is required to generate adaptive questions.",
        message: "Situation context is required to generate adaptive questions.",
      });
    }

    const ai = getAiClient();
    const store = loadStore();
    const locationStr =
      [location?.city, location?.state, location?.country].filter(Boolean).join(", ") || "Global";

    const diagnosticLenses = [
      "Hidden Second-Order Consequences & Daily Reality",
      "Worst-Case Downside & Reversibility Test",
      "Unwritten Rules, Stakeholder Expectations & Commitments",
      "Opportunity Cost & Alternative Path Comparison",
      "Resource, Financial & Energy Sustainability",
    ];
    const chosenLens =
      focusAngle && focusAngle !== "auto"
        ? focusAngle
        : diagnosticLenses[(round + askedQuestions.length) % diagnosticLenses.length];

    const systemPrompt = `You are THE BLIND SPOT, an AI decision-reflection assistant.
Generate 4 completely NEW, non-repetitive questions that have NOT been asked yet, helping the user see what they may have missed and get closer to an informed decision.
Respond in ${language}. Keep JSON keys in English and updated_clarity_level strictly as 'LOW CLARITY', 'MEDIUM CLARITY', or 'HIGH CLARITY'. Return pure JSON without Markdown code fences.`;

    const userPrompt = `Situation: ${inputs.situation}
Positives: ${inputs.positives || "None"}
Concerns: ${inputs.concerns || "None"}
Current leaning: ${inputs.currentLeaning || "Undecided"}
Location: ${locationStr}
Focus Lens: ${chosenLens}
Answers so far: ${
      qnaHistory.length > 0
        ? qnaHistory.map((q: any) => `Q: ${q.question} -> A: ${q.answer}`).join(" | ")
        : "None yet"
    }
Already asked questions (NEVER repeat): ${askedQuestions.join(" | ") || "None"}`;

    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: userPrompt,
      system_instruction: systemPrompt,
      response_format: ADAPTIVE_QNA_SCHEMA,
    });

    const rawText = extractInteractionText(interaction);
    const parsed = parseStructuredJson(rawText);

    store.analytics.qnaRoundsGenerated += 1;

    const updatedAsked = Array.from(
      new Set([
        ...askedQuestions,
        ...(parsed.important_questions || []).map((q: any) => q.question),
      ])
    );

    if (decisionId) {
      const existing = store.decisions.find((d) => d.id === decisionId);
      if (existing) {
        existing.qnaHistory = qnaHistory;
        existing.askedQuestions = updatedAsked;
        existing.clarityLevel = parsed.updated_clarity_level || existing.clarityLevel;
        if (existing.analysis) {
          existing.analysis.clarity_level =
            parsed.updated_clarity_level || existing.analysis.clarity_level;
          existing.analysis.clarity_reason =
            parsed.updated_clarity_reason || existing.analysis.clarity_reason;
          existing.analysis.important_questions = parsed.important_questions;
          if (
            Array.isArray(parsed.new_discovered_blind_spots) &&
            parsed.new_discovered_blind_spots.length > 0
          ) {
            existing.analysis.blind_spots = [
              ...parsed.new_discovered_blind_spots,
              ...(existing.analysis.blind_spots || []),
            ].slice(0, 10);
          }
        }
        existing.version += 1;
        existing.updatedAt = new Date().toISOString();
      }
    }

    saveStore(store);

    return res.json({
      ok: true,
      configured: true,
      round,
      chosenLens,
      askedQuestions: updatedAsked,
      qnaResult: parsed,
    });
  } catch (error: any) {
    console.error("QNA ERROR:", error);
    const formatted = formatGeminiError(error);
    return res.status(formatted.status).json({
      ok: false,
      configured: isGeminiConfigured(),
      error: formatted.message,
      message: formatted.message,
    });
  }
});

// ============================================================================
// DECISIONS, AUTH, FEEDBACK & PRIVACY-SAFE REAL ADMIN ANALYTICS
// ============================================================================

app.post("/api/decisions/:id/reflect", (req, res) => {
  const store = loadStore();
  const decision = store.decisions.find((d) => d.id === req.params.id);
  if (!decision) {
    return res.status(404).json({ error: "Decision session not found." });
  }
  const { userSummary } = req.body || {};
  decision.finalReflection = {
    userSummary: String(userSummary || "").trim(),
    decidedAt: new Date().toISOString(),
  };
  decision.updatedAt = new Date().toISOString();
  saveStore(store);
  return res.json({ success: true, decision });
});

app.get("/api/decisions", (req, res) => {
  const store = loadStore();
  const user = getAuthenticatedUser(req, store);
  const idsParam =
    typeof req.query.ids === "string" ? req.query.ids.split(",").filter(Boolean) : [];

  const list = store.decisions.filter((d) => {
    if (user && d.userId === user.id) return true;
    if (idsParam.includes(d.id)) return true;
    return false;
  });

  return res.json({ decisions: list.slice(0, 25) });
});

app.post("/api/auth/signup", (req, res) => {
  try {
    const { name, email, password, language, location, gender } = req.body || {};
    if (!name || !email || !password || String(password).length < 6) {
      return res.status(400).json({
        error: "Please provide your name, a valid email, and a password of at least 6 characters.",
      });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const store = loadStore();
    if (store.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return res.status(409).json({
        error: "An account with this email already exists. Please log in instead.",
      });
    }

    const { hash, salt } = hashPassword(String(password));
    const newUser: StoredUser = {
      id: "usr_" + crypto.randomBytes(6).toString("hex"),
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash: hash,
      salt,
      role: normalizedEmail.includes("admin") ? "admin" : "user",
      language: language || "English",
      location: location || { country: "India", state: "Maharashtra", city: "Pune" },
      gender: gender || "Prefer not to say",
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);
    const token = crypto.randomBytes(24).toString("hex");
    store.sessions[token] = {
      userId: newUser.id,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
    };
    saveStore(store);

    return res.json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        language: newUser.language,
        location: newUser.location,
        gender: newUser.gender,
      },
    });
  } catch {
    return res.status(500).json({ error: "Could not complete sign-up right now." });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Please enter both email and password." });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const store = loadStore();
    const user = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    const { hash } = hashPassword(String(password), user.salt);
    if (hash !== user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = crypto.randomBytes(24).toString("hex");
    store.sessions[token] = {
      userId: user.id,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
    };
    saveStore(store);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language,
        location: user.location,
        gender: user.gender,
      },
    });
  } catch {
    return res.status(500).json({ error: "Login failed due to a server error." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  const store = loadStore();
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    delete store.sessions[token];
    saveStore(store);
  }
  return res.json({ success: true });
});

app.get("/api/auth/me", (req, res) => {
  const store = loadStore();
  const user = getAuthenticatedUser(req, store);
  if (!user) {
    return res.status(401).json({ authenticated: false });
  }
  return res.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      language: user.language,
      location: user.location,
      gender: user.gender,
    },
  });
});

app.post("/api/feedback", (req, res) => {
  try {
    const {
      decisionId,
      category,
      usefulRating,
      discoveredBlindSpot,
      questionsHelped,
      confusingParts,
      improvements,
    } = req.body || {};
    const store = loadStore();
    const fb: StoredFeedback = {
      id: "fb_" + crypto.randomBytes(6).toString("hex"),
      decisionId,
      category: category || "General",
      usefulRating: Number(usefulRating) || 5,
      discoveredBlindSpot: discoveredBlindSpot || "yes",
      questionsHelped: questionsHelped || "yes",
      confusingParts: String(confusingParts || "").trim(),
      improvements: String(improvements || "").trim(),
      createdAt: new Date().toISOString(),
    };
    store.feedbacks.unshift(fb);
    saveStore(store);
    return res.json({ success: true, feedback: fb });
  } catch {
    return res.status(500).json({ error: "Unable to save feedback right now." });
  }
});

// Admin statistics calculated strictly from real store.json data (no hardcoded fake metrics)
app.get("/api/admin/stats", (req, res) => {
  const store = loadStore();
  const user = getAuthenticatedUser(req, store);
  const adminKeyHeader = req.headers["x-admin-passcode"];
  const isAuthorizedAdmin =
    (user && user.role === "admin") ||
    adminKeyHeader === (process.env.ADMIN_PASSCODE || "blindspot-admin-2026");

  if (!isAuthorizedAdmin) {
    return res.status(403).json({
      error: "Administrator authorization required.",
    });
  }

  const categoryCounts: Record<string, number> = {};
  const languageCounts: Record<string, number> = {};
  const clarityDistribution: Record<string, number> = {
    "LOW CLARITY": 0,
    "MEDIUM CLARITY": 0,
    "HIGH CLARITY": 0,
  };
  const blindSpotSeverityCounts: Record<string, number> = {
    Low: 0,
    Moderate: 0,
    Important: 0,
  };
  const commonBlindSpots: Record<string, number> = {};
  const activityByDate: Record<string, number> = {};

  // Aggregate user languages from registered users
  for (const u of store.users) {
    const lang = u.language || "English";
    languageCounts[lang] = (languageCounts[lang] || 0) + 1;
  }

  // Aggregate real decisions from store.decisions
  for (const d of store.decisions) {
    const cat = d.category || "General";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    const lang = d.language || "English";
    languageCounts[lang] = (languageCounts[lang] || 0) + 1;

    const cl = d.clarityLevel || "MEDIUM CLARITY";
    clarityDistribution[cl] = (clarityDistribution[cl] || 0) + 1;

    const dateKey = (d.createdAt || "").slice(0, 10);
    if (dateKey) {
      activityByDate[dateKey] = (activityByDate[dateKey] || 0) + 1;
    }

    if (Array.isArray(d.analysis?.blind_spots)) {
      for (const bs of d.analysis.blind_spots) {
        const dim = bs.dimension || bs.title || "Overlooked Factor";
        commonBlindSpots[dim] = (commonBlindSpots[dim] || 0) + 1;
        const sev = bs.severity;
        if (sev === "Low" || sev === "Moderate" || sev === "Important") {
          blindSpotSeverityCounts[sev] = (blindSpotSeverityCounts[sev] || 0) + 1;
        }
      }
    }
  }

  // Merge any stored analytics blind spot tags if store.decisions is empty
  for (const [dim, count] of Object.entries(store.analytics.commonBlindSpotTags || {})) {
    if (!(dim in commonBlindSpots)) {
      commonBlindSpots[dim] = count;
    }
  }

  // Aggregate feedback ratings (1-5 stars) and usefulness distribution from real feedbacks
  const feedbackRatingCounts: Record<string, number> = {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
  };
  const usefulDistribution: Record<string, number> = {
    yes: 0,
    partially: 0,
    no: 0,
  };

  for (const fb of store.feedbacks) {
    const r = String(Math.min(5, Math.max(1, Math.round(Number(fb.usefulRating) || 5))));
    feedbackRatingCounts[r] = (feedbackRatingCounts[r] || 0) + 1;
    const disc = fb.discoveredBlindSpot || "yes";
    if (disc in usefulDistribution) {
      usefulDistribution[disc] += 1;
    }
    const dateKey = (fb.createdAt || "").slice(0, 10);
    if (dateKey) {
      activityByDate[dateKey] = (activityByDate[dateKey] || 0) + 1;
    }
  }

  const activeSessionsCount = Object.values(store.sessions).filter(
    (s) => s.expiresAt > Date.now()
  ).length;

  const avgSatisfaction =
    store.feedbacks.length > 0
      ? Number(
          (
            store.feedbacks.reduce((acc, item) => acc + (Number(item.usefulRating) || 5), 0) /
            store.feedbacks.length
          ).toFixed(2)
        )
      : null;

  const anonymizedLogs = store.decisions.slice(0, 25).map((d) => ({
    id: d.id,
    category: d.category,
    clarityLevel: d.clarityLevel,
    language: d.language,
    region: d.location?.country || "Unspecified",
    qnaRoundsCompleted: d.qnaHistory?.length || 0,
    blindSpotsCount: d.analysis?.blind_spots?.length || 0,
    contradictionsCount: d.analysis?.contradictions?.length || 0,
    version: d.version,
    createdAt: d.createdAt,
  }));

  return res.json({
    totalUsers: store.users.length,
    activeSessions: activeSessionsCount,
    decisionsAnalyzed: store.decisions.length,
    aiCallsCount: store.analytics.aiCallsCount,
    qnaRoundsGenerated: store.analytics.qnaRoundsGenerated,
    avgSatisfaction,
    categoryCounts,
    languageCounts,
    clarityDistribution,
    commonBlindSpots,
    blindSpotSeverityCounts,
    feedbackRatingCounts,
    usefulDistribution,
    activityByDate,
    unansweredQuestionTypes: store.analytics.unansweredQuestionTypes || {},
    feedbacks: store.feedbacks.slice(0, 20),
    anonymizedLogs,
    systemHealth: {
      status: isGeminiConfigured() ? "Nominal" : "AI Key Missing",
      aiConfigured: isGeminiConfigured(),
      aiEngine: "gemini-3.8-flash",
      storeExists: fs.existsSync(STORE_PATH),
      uptimeSeconds: Math.round(process.uptime()),
    },
  });
});

// Ensure unknown /api/* routes always return JSON, never HTML
app.all("/api/*", (_req, res) => {
  return res.status(404).json({ error: "API endpoint not found." });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `THE BLIND SPOT server running on http://0.0.0.0:${PORT} (AI Configured: ${isGeminiConfigured()})`
    );
  });
}

startServer();
