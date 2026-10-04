export type ClarityLevel = "LOW CLARITY" | "MEDIUM CLARITY" | "HIGH CLARITY";
export type SeverityLevel = "Low" | "Moderate" | "Important";

export interface DecisionInputs {
  situation: string;
  positives: string;
  concerns: string;
  currentLeaning: string;
  reasoning: string;
  uncertainties: string;
  additionalOptions: string[];
}

export interface AssumptionItem {
  title: string;
  type: string;
  severity: SeverityLevel;
  explanation: string;
  if_wrong: string;
}

export interface BlindSpotItem {
  title: string;
  dimension: string;
  severity: SeverityLevel;
  description: string;
}

export interface ContradictionItem {
  statement_a: string;
  statement_b: string;
  tension_explanation: string;
  severity: SeverityLevel;
}

export interface MissingInfoItem {
  item: string;
  why_it_matters: string;
  how_to_find_out: string;
  severity: SeverityLevel;
}

export interface RiskItem {
  risk_name: string;
  category: string;
  severity: SeverityLevel;
  impact_score: number;
  mitigation: string;
}

export interface DiagnosticQuestion {
  id: string;
  question: string;
  why_asking: string;
  diagnostic_angle: string;
  options: string[];
}

export interface AlternativePerspective {
  lens_name: string;
  perspective: string;
}

export interface NextActionItem {
  step: string;
  timeframe: string;
  purpose: string;
}

export interface OfficialResource {
  name: string;
  description: string;
  what_to_check: string;
}

export interface ContextualSupport {
  domain_title: string;
  practical_guidance: string;
  checklist_or_substitutions: string[];
  official_or_trusted_resources: OfficialResource[];
}

export interface FactorWeights {
  cost_financial: number;
  time_commitment: number;
  learning_growth: number;
  safety_wellbeing: number;
  convenience: number;
  long_term_benefit: number;
  personal_priority_fit: number;
}

export interface BeforeYouDecideReflection {
  originally_thought: string;
  what_you_discovered: string;
  what_remains_uncertain: string;
  self_reflection_questions: string[];
  what_could_change_decision: string;
}

export interface DecisionAnalysis {
  situation_summary: string;
  category: string;
  user_goal: string;
  safety_or_emergency_notice: string;
  recommendation_mode: string;
  positive_factors: string[];
  concerns: string[];
  assumptions: AssumptionItem[];
  blind_spots: BlindSpotItem[];
  contradictions: ContradictionItem[];
  missing_information: MissingInfoItem[];
  risks: RiskItem[];
  important_questions: DiagnosticQuestion[];
  alternative_perspectives: AlternativePerspective[];
  clarity_level: ClarityLevel;
  clarity_reason: string;
  verification_items: string[];
  next_actions: NextActionItem[];
  contextual_support: ContextualSupport;
  factor_weights: FactorWeights;
  before_you_decide_reflection: BeforeYouDecideReflection;
}

export interface QnaHistoryEntry {
  question: string;
  answer: string;
  round: number;
  angle?: string;
}

export interface UserPreferences {
  language: string;
  location: {
    country: string;
    state: string;
    city: string;
  };
  gender: string;
  reducedMotion: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  language: string;
  location: {
    country: string;
    state: string;
    city: string;
  };
  gender?: string;
}
