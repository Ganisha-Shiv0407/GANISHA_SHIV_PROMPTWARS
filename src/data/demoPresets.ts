import { DecisionAnalysis, DecisionInputs } from "../types";

export interface ScenarioPreset {
  id: string;
  label: string;
  domain: string;
  inputs: DecisionInputs;
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "internship-college",
    label: "6-Month Internship vs. College",
    domain: "Education & Career",
    inputs: {
      situation:
        "I have been offered a 6-month internship. The stipend is good and the company is close to my home. I think it will help my career, but I am worried about college.",
      positives:
        "Good monthly stipend, office is only 15 minutes from my home, real industry exposure on my resume.",
      concerns:
        "My college has strict attendance and internal lab exams during these 6 months, and my grades could drop.",
      currentLeaning:
        "I am leaning toward accepting the internship right away and figuring out college attendance as I go.",
      reasoning:
        "The company is so close to home and pays well, so I feel like I shouldn't miss the opportunity.",
      uncertainties:
        "I don't know if my department HOD will grant an official NOC or if the company allows leave during exam weeks.",
      additionalOptions: [
        "Negotiate a part-time / hybrid 3-day-a-week internship schedule during semester months",
        "Defer the full-time internship to the summer break while doing a remote project now",
      ],
    },
  },
  {
    id: "career-freelance",
    label: "Full-Time Role vs. Starting Freelancing",
    domain: "Career",
    inputs: {
      situation:
        "I have a stable software role paying a steady salary, but two international clients offered me freelance contract work that pays 60% more per month. I want more autonomy and maximum learning.",
      positives:
        "Higher monthly income potential, flexible working hours, direct ownership of client projects.",
      concerns:
        "Client contracts are only guaranteed for 3 months initially; I also have a monthly family home loan contribution.",
      currentLeaning:
        "Resign next week to take both freelance contracts full-time.",
      reasoning:
        "The freelance work is repetitive theme customization I can do quickly, so it feels like easy high income.",
      uncertainties:
        "Notice period overlap, tax/GST compliance, and what happens if one client pauses after 90 days.",
      additionalOptions: [
        "Take one weekend advisory scope legally if employment terms permit, or build 6 months of loan runway before resigning",
      ],
    },
  },
  {
    id: "finance-trading",
    label: "Using Emergency Savings for Swing Trading",
    domain: "Finance & Trading",
    inputs: {
      situation:
        "I have saved 4 Lakhs in a liquid emergency fund. After seeing strong market momentum over the last two months, I am considering putting 75% of that fund into mid-cap swing trades to fund a major purchase in 5 months.",
      positives:
        "Could grow my capital much faster than a fixed deposit before my 5-month deadline.",
      concerns:
        "Market volatility could draw down my principal right when I need the cash in 5 months.",
      currentLeaning:
        "Deploy 3 Lakhs into 3 momentum stocks with mental stop-losses.",
      reasoning:
        "Recent trades on paper went up 18%, so I feel confident I can exit quickly if the market turns.",
      uncertainties:
        "Slippage during market gaps, tax on short-term capital gains, and what happens if an actual family emergency occurs.",
      additionalOptions: [
        "Keep 100% of the emergency fund in high-yield liquid instruments and only allocate surplus monthly savings (5–10%) to defined-risk trades",
      ],
    },
  },
  {
    id: "travel-monsoon",
    label: "High-Altitude Solo Trip on a Tight Schedule",
    domain: "Travel",
    inputs: {
      situation:
        "I have 4 days off next week and want to take an overnight bus and trek to a high-altitude valley before returning the morning of an important client presentation.",
      positives:
        "Much-needed break from screen fatigue, scenic photography, budget-friendly bus tickets available.",
      concerns:
        "Unpredictable mountain weather, roadblocks, and zero buffer time before my Monday 9 AM presentation.",
      currentLeaning:
        "Book the non-refundable tickets tonight and carry my work laptop just in case.",
      reasoning:
        "If I don't go now, my schedule is packed for the next two months.",
      uncertainties:
        "Cellular connectivity on the trail, acclimatization fatigue, and return highway reliability.",
      additionalOptions: [
        "Choose a closer 2-day restorative destination within 3 hours of home now, and schedule the high-altitude trek when I have a 2-day return buffer",
      ],
    },
  },
  {
    id: "cooking-adaptation",
    label: "Hosting a 10-Person Dinner with Missing Ingredients",
    domain: "Cooking & Hospitality",
    inputs: {
      situation:
        "I am hosting 10 guests tonight for a traditional slow-cooked feast, but I am missing saffron, heavy cream, and cashew paste, and two guests just mentioned one is vegan and one has a nut allergy.",
      positives:
        "Fresh vegetables, aromatic whole spices, coconut milk, and basmati rice are already prepped.",
      concerns:
        "Cross-contamination with nuts, richness of the gravy without cream/cashews, and only 3 hours left.",
      currentLeaning:
        "Use peanut butter as a thickener for the main curry and rush to the store for cream.",
      reasoning:
        "Peanut butter thickens curries quickly and saves a store trip for cashews.",
      uncertainties:
        "Whether the guest with a nut allergy also reacts to peanuts, and how to make the main dish safe for everyone.",
      additionalOptions: [
        "Use roasted pumpkin/onion-tomato puree + coconut milk or oat-based thickener so the entire main course is naturally nut-free and vegan-friendly, with dairy garnish served separately on the side",
      ],
    },
  },
  {
    id: "govt-docs",
    label: "Passport & Visa Address Discrepancy Before Application",
    domain: "Government Documentation",
    inputs: {
      situation:
        "I need to submit my student visa file in 18 days, but my current rental address on my bank statement differs from the permanent address printed on my passport and Aadhaar card.",
      positives:
        "Admission letter and tuition receipt are ready, and my passport is valid for 6 more years.",
      concerns:
        "Rejection or delay if the visa officer flags mismatched address proof across financial and identity documents.",
      currentLeaning:
        "Submit the documents as they are and hope the officer only checks the account balance.",
      reasoning:
        "Updating my passport address might take too long before the 18-day deadline.",
      uncertainties:
        "Whether the consulate accepts a registered rent agreement or bank branch attestation letter alongside permanent ID.",
      additionalOptions: [
        "Verify the exact consulate checklist today, obtain an official bank statement displaying the permanent address on record, and attach a notarized address continuity affidavit if required",
      ],
    },
  },
];

export const INITIAL_DEMO_ANALYSIS: DecisionAnalysis = {
  situation_summary:
    "You are evaluating a 6-month internship offer that provides strong financial compensation and an easy 15-minute commute from home, while weighing the risk of falling behind on mandatory college attendance, lab assessments, and semester exams.",
  category: "Education & Career",
  user_goal:
    "Gain meaningful real-world career momentum and financial independence without jeopardizing degree completion or academic standing.",
  safety_or_emergency_notice: "",
  recommendation_mode: "B. Decision Analysis Needed",
  positive_factors: [
    "Attractive monthly stipend that improves immediate financial independence",
    "Company is close to home (minimal commute fatigue and zero relocation cost)",
    "6 months of practical industry experience before graduation",
  ],
  concerns: [
    "Potential conflict with mandatory college attendance thresholds",
    "Overlap with internal lab evaluations and semester examinations",
    "Risk of accepting first and discovering college penalties too late",
  ],
  assumptions: [
    {
      title: "Assuming proximity to home automatically makes the workload manageable",
      type: "Optimistic",
      severity: "Important",
      explanation:
        "Living close saves transit time, but if the internship requires 9 AM–6 PM full-time presence during core lecture hours, a 15-minute commute still leaves you physically absent from college.",
      if_wrong:
        "You may be barred from sitting for semester finals due to attendance shortfall despite living nearby.",
    },
    {
      title: "Assuming the internship role guarantees high-value career learning",
      type: "Unverified",
      severity: "Moderate",
      explanation:
        "You noted you think it will help your career, but have not yet verified the actual projects, mentorship structure, or whether past interns received pre-placement offers (PPOs).",
      if_wrong:
        "You could risk your academic grades for 6 months of routine support tasks that add limited technical depth.",
    },
    {
      title: "Assuming college attendance can be 'figured out later' after signing",
      type: "Hidden",
      severity: "Important",
      explanation:
        "Universities rarely grant retroactive attendance waivers once an student misses weeks of labs without prior written No Objection Certificate (NOC) approval.",
      if_wrong:
        "You could be forced to quit the internship mid-way (burning industry bridges) or repeat a semester.",
    },
  ],
  blind_spots: [
    {
      title: "Missing Formal NOC & Academic Credit Policy Check",
      dimension: "Practical Constraint",
      severity: "Important",
      description:
        "Many colleges allow final- or pre-final-year internships ONLY if approved in advance via a formal Training & Placement NOC. You haven't checked whether this semester qualifies.",
    },
    {
      title: "Mentorship Quality vs. Stipend Halo Effect",
      dimension: "Second-Order Effect",
      severity: "Moderate",
      description:
        "A good stipend and short commute can create a 'halo effect' that masks crucial career questions: Who will mentor you? What codebase or domain will you own?",
    },
    {
      title: "Exam-Week Leave & Daily Schedule Flexibility",
      dimension: "Time Implication",
      severity: "Important",
      description:
        "You have not verified whether the manager will grant 1–2 weeks of exam leave or allow shifting hours on lab days.",
    },
    {
      title: "Hybrid / Part-Time Counter-Proposal Option",
      dimension: "Opportunity Cost",
      severity: "Moderate",
      description:
        "You are framing the choice as 'Accept as-is vs. Reject', overlooking the common middle ground of proposing 20–25 hours/week during classes and full-time during breaks.",
    },
  ],
  contradictions: [
    {
      statement_a: "I think this internship will strongly help my long-term career.",
      statement_b: "I am worried about college attendance and planning to figure out college rules after accepting.",
      tension_explanation:
        "There is a possible tension between building your career and risking an academic backlog or delayed graduation, as most graduate employers require a clean, on-time degree transcript alongside internship experience.",
      severity: "Important",
    },
  ],
  missing_information: [
    {
      item: "Written College Attendance & NOC Policy for Current Semester",
      why_it_matters:
        "Determines whether your department legally permits off-campus internships during instructional weeks.",
      how_to_find_out:
        "Speak with your Department Internship Coordinator or HOD with the written offer letter before signing.",
      severity: "Important",
    },
    {
      item: "Exact Daily Working Hours & Exam-Leave Flexibility",
      why_it_matters:
        "Clarifies whether you can attend morning labs/exams and complete deliverables asynchronously.",
      how_to_find_out:
        "Ask HR or your hiring manager in writing: 'How does the team handle university exam weeks and mandatory lab days?'",
      severity: "Important",
    },
    {
      item: "Day-to-Day Role Scope, Tech Stack & Mentorship",
      why_it_matters:
        "Confirms whether the 6 months will genuinely advance your target career skills beyond the stipend.",
      how_to_find_out:
        "Request a 15-minute call with your prospective team lead or message a current/former intern on LinkedIn.",
      severity: "Moderate",
    },
  ],
  risks: [
    {
      risk_name: "Academic Detention / Attendance Shortfall",
      category: "Known Risk",
      severity: "Important",
      impact_score: 9,
      mitigation: "Secure written HOD/T&P NOC and map out exact lab attendance requirements before signing.",
    },
    {
      risk_name: "Mid-Internship Burnout or Forced Resignation",
      category: "Unknown/Hidden Risk",
      severity: "Moderate",
      impact_score: 7,
      mitigation: "Agree on a realistic weekly hour cap (e.g., hybrid schedule during exam months).",
    },
    {
      risk_name: "Low-Learning Routine Work Despite Good Stipend",
      category: "Unknown/Hidden Risk",
      severity: "Moderate",
      impact_score: 6,
      mitigation: "Ask for a 30-60-90 day learning and deliverable outline before accepting.",
    },
  ],
  important_questions: [
    {
      id: "q_noc_status",
      question: "What is your college's official rule on attendance for students doing a 6-month internship in your current semester?",
      why_asking:
        "This single fact determines whether accepting full-time is structurally feasible or requires a hybrid counter-proposal.",
      diagnostic_angle: "Institutional Feasibility",
      options: [
        "Allowed with an official NOC from HOD / T&P Cell",
        "Strict 75% in-person attendance required no matter what",
        "Allowed only for lab/exam days if faculty agrees",
        "I haven't checked the official rule yet",
      ],
    },
    {
      id: "q_manager_flex",
      question: "Have you asked the company if they allow exam leave and flexible hours for mandatory college labs?",
      why_asking:
        "Knowing the employer's flexibility reveals whether college and the internship can coexist.",
      diagnostic_angle: "Schedule Compatibility",
      options: [
        "Yes, they confirmed flexible hours & exam leave",
        "They expect strict 9-to-6 office presence every weekday",
        "They might allow hybrid/evening hours if I ask",
        "Not discussed with HR or the manager yet",
      ],
    },
    {
      id: "q_role_depth",
      question: "Beyond the good stipend and short commute, how clear are you on the actual projects and mentor you will work with?",
      why_asking:
        "Separates short-term convenience from genuine long-term career value.",
      diagnostic_angle: "Career Value Verification",
      options: [
        "Very clear — spoke with the engineering/team lead about real projects",
        "Somewhat clear — only saw a general job description",
        "Not clear — mostly attracted by the stipend and proximity",
      ],
    },
    {
      id: "q_exit_clause",
      question: "What is the notice period or exit policy in the internship offer if college exams conflict severely?",
      why_asking:
        "Checks whether the decision is safely reversible or locks you into a penalty/withheld certificate.",
      diagnostic_angle: "Reversibility & Downside Protection",
      options: [
        "1–2 weeks notice with no penalty",
        "Strict 6-month lock-in; no certificate or stipend if left early",
        "No written terms provided yet",
      ],
    },
  ],
  alternative_perspectives: [
    {
      lens_name: "The 6-Month Future Self Lens",
      perspective:
        "Six months from now, during final semester exams, your future self will thank you if you took 48 hours today to get written clarity from both your HOD and your hiring manager rather than carrying secret stress every week.",
    },
    {
      lens_name: "The Hybrid Counter-Offer Lens",
      perspective:
        "Because the office is only 15 minutes from your home, you have a unique advantage: you can attend morning college labs and reach the office in 15 minutes for afternoon/evening sprints—if you negotiate this openly before signing.",
    },
    {
      lens_name: "The Hiring Manager Lens",
      perspective:
        "Managers strongly prefer a candidate who says upfront, 'I have university labs on Tuesdays/Thursdays and exams in May—here is how I will deliver 100% of my milestones' over an intern who suddenly disappears during exam month.",
    },
  ],
  clarity_level: "MEDIUM CLARITY",
  clarity_reason:
    "Your current decision has moderate clarity because your financial and commute benefits are clear, but two critical structural constraints—your college's NOC/attendance policy and the company's exam-week flexibility—remain unverified.",
  verification_items: [
    "Verify with your Department HOD / T&P Coordinator whether an official NOC or attendance relaxation is granted for 6-month internships in your current semester.",
    "Confirm in writing with the company's HR/Hiring Manager that you will receive leave during university exams and flexibility for mandatory lab sessions.",
    "Ask for a brief overview of your first 60 days of deliverables and who your direct mentor will be.",
    "Check the offer letter for any lock-in clause, original document submission (never hand over original academic certificates), or notice period terms.",
  ],
  next_actions: [
    {
      step: "Draft a polite question list for HR/Hiring Manager regarding exam leave, lab-day flexibility, and mentorship.",
      timeframe: "Today",
      purpose: "Test whether the workplace supports students before you commit.",
    },
    {
      step: "Meet your Academic Coordinator / HOD with the offer letter to check NOC eligibility.",
      timeframe: "Within 24–48 Hours",
      purpose: "Eliminate the risk of attendance detention.",
    },
    {
      step: "If full-time attendance isn't allowed, propose a hybrid schedule leveraging your 15-minute commute.",
      timeframe: "Before Signing Offer",
      purpose: "Capture both the career opportunity and academic safety.",
    },
  ],
  contextual_support: {
    domain_title: "Academic & Internship Alignment Toolkit",
    practical_guidance:
      "Because the company is close to your home, you can often turn a binary conflict into a structured weekly timetable. Use the checklist below during your conversation with both your college coordinator and the company HR team.",
    checklist_or_substitutions: [
      "Prepare a 1-page Weekly Time Matrix showing exactly which hours you have mandatory college labs vs. in-office internship hours.",
      "Ask if Saturday work or extended afternoon hours (1 PM – 7 PM) can offset morning college lectures.",
      "Ensure the offer letter explicitly states 'Student Intern' so academic examination dates are respected.",
      "Keep digital copies of all approved leave/NOC emails from faculty.",
    ],
    official_or_trusted_resources: [
      {
        name: "College Training & Placement (T&P) Cell & Academic Rules Handbook",
        description: "Official university guidelines on minimum attendance (typically 75%) and NOC exemptions.",
        what_to_check: "Check the exact clause for semester-long industry internships and internal assessment makeup dates.",
      },
      {
        name: "AICTE / University Internship Policy Guidelines",
        description: "Standard academic credit and internship alignment norms for higher education institutions.",
        what_to_check: "Verify whether your 6-month internship can be mapped to project/industrial training credits.",
      },
    ],
  },
  factor_weights: {
    cost_financial: 8,
    time_commitment: 9,
    learning_growth: 8,
    safety_wellbeing: 7,
    convenience: 9,
    long_term_benefit: 8,
    personal_priority_fit: 8,
  },
  before_you_decide_reflection: {
    originally_thought:
      "You initially saw a well-paying internship close to home and leaned toward accepting immediately while hoping to manage college attendance later.",
    what_you_discovered:
      "Proximity solves commute time, not classroom absence. The real hinge of this decision is written alignment between your college's NOC policy and your manager's exam/lab flexibility.",
    what_remains_uncertain:
      "Whether your HOD will approve an NOC for this semester and whether the company's work involves genuine mentorship or rigid shift coverage.",
    self_reflection_questions: [
      "If my college refuses attendance relaxation, am I willing and able to negotiate a hybrid schedule with this company?",
      "Would I still want this specific internship if the stipend were 30% lower, based purely on what I will learn?",
      "Have I spoken openly to both sides so I won't be forced to break a promise in 60 days?",
    ],
    what_could_change_decision:
      "Written confirmation of an NOC from college + exam flexibility from the company moves this toward a high-confidence 'Accept'; rigid 9-to-6 shifts with zero college support suggests proposing a part-time/summer alternative.",
  },
};

export const UI_TRANSLATIONS: Record<
  string,
  {
    tagline: string;
    heroSubtitle: string;
    tellUsHeading: string;
    situationPrompt: string;
    analyzeBtn: string;
    recalculateBtn: string;
    qnaHeading: string;
    qnaSubheading: string;
    dashboardHeading: string;
    beforeDecideHeading: string;
  }
> = {
  English: {
    tagline: "See What You’re Missing Before You Decide.",
    heroSubtitle:
      "AI does not replace human thinking. AI helps humans see the assumptions, contradictions, and overlooked factors hidden beneath visible choices.",
    tellUsHeading: "Tell me what you’re dealing with.",
    situationPrompt: "What situation are you trying to understand?",
    analyzeBtn: "Run 7-Stage Blind Spot Analysis",
    recalculateBtn: "Recalculate Analysis with Updates",
    qnaHeading: "Adaptive Diagnostic Q&A",
    qnaSubheading:
      "Every round generates fresh, non-repetitive questions targeted at your remaining uncertainties to bring you closer to a clear solution.",
    dashboardHeading: "THE BLIND SPOT DASHBOARD",
    beforeDecideHeading: "BEFORE YOU DECIDE",
  },
  Hindi: {
    tagline: "निर्णय लेने से पहले वह देखें जो आप अनदेखा कर रहे हैं।",
    heroSubtitle:
      "AI मानवीय सोच की जगह नहीं लेता। AI आपको उन छिपी हुई मान्यताओं, विरोधाभासों और अनदेखे पहलुओं को देखने में मदद करता है जो अक्सर छूट जाते हैं।",
    tellUsHeading: "मुझे बताएं कि आप किस स्थिति का सामना कर रहे हैं।",
    situationPrompt: "आप किस स्थिति या निर्णय को समझने की कोशिश कर रहे हैं?",
    analyzeBtn: "7-चरणीय ब्लाइंड स्पॉट विश्लेषण करें",
    recalculateBtn: "अपडेट के साथ विश्लेषण पुनः करें",
    qnaHeading: "अनुकूली प्रश्नोत्तर (Adaptive Q&A)",
    qnaSubheading:
      "हर राउंड में नए और महत्वपूर्ण प्रश्न पूछे जाते हैं ताकि आप अपने समाधान के और करीब पहुँच सकें।",
    dashboardHeading: "द ब्लाइंड स्पॉट डैशबोर्ड",
    beforeDecideHeading: "निर्णय लेने से पहले",
  },
  Marathi: {
    tagline: "निर्णय घेण्यापूर्वी तुम्ही काय गमावत आहात ते पहा.",
    heroSubtitle:
      "AI मानवी विचारांची जागा घेत नाही. AI तुम्हाला लपलेले गृहीतक, विरोधाभास आणि दुर्लक्षित घटक स्पष्टपणे पाहण्यास मदत करतो.",
    tellUsHeading: "तुम्ही कोणत्या परिस्थितीचा सामना करत आहात ते सांगा.",
    situationPrompt: "तुम्ही कोणती परिस्थिती किंवा निर्णय समजून घेण्याचा प्रयत्न करत आहात?",
    analyzeBtn: "७-स्तरीय ब्लाइंड स्पॉट विश्लेषण करा",
    recalculateBtn: "नवीन माहितीसह पुन्हा विश्लेषण करा",
    qnaHeading: "संवादात्मक महत्त्वाचे प्रश्न (Adaptive Q&A)",
    qnaSubheading:
      "प्रत्येक फेरीत नवीन आणि न परतणारे महत्त्वाचे प्रश्न विचारले जातात जेणेकरून तुम्ही योग्य उपायाच्या अधिक जवळ जाल.",
    dashboardHeading: "ब्लाइंड स्पॉट डॅशबोर्ड",
    beforeDecideHeading: "अंतिम निर्णय घेण्यापूर्वी",
  },
};
