export interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  limits: {
    leads: number;
    ai: number;
  };
  features: string[];
}

export const PLANS: Record<string, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceAnnual: 0,
    limits: {
      leads: 999999,
      ai: 999999,
    },
    features: [
      "Unlimited leads found",
      "Unlimited AI email drafts",
      "All search modes (Radius, City, Polygon, Multi-city)",
      "Auto email verification & scoring",
      "Unlimited connected Gmail accounts",
      "CRM Pipeline & open tracking",
      "Auto reply detection & AI replier",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthly: 0,
    priceAnnual: 0,
    limits: {
      leads: 999999,
      ai: 999999,
    },
    features: [
      "Unlimited leads found",
      "Unlimited AI email drafts",
      "All search modes",
      "Auto email verification & scoring",
      "Unlimited connected Gmail accounts",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 0,
    priceAnnual: 0,
    limits: {
      leads: 999999,
      ai: 999999,
    },
    features: [
      "Unlimited leads found",
      "Unlimited AI email drafts",
      "All search modes",
      "Auto email verification & scoring",
      "Unlimited connected Gmail accounts",
    ],
  },
  agency: {
    id: "agency",
    name: "Agency",
    priceMonthly: 0,
    priceAnnual: 0,
    limits: {
      leads: 999999,
      ai: 999999,
    },
    features: [
      "Unlimited leads found",
      "Unlimited AI email drafts",
      "All search modes",
      "Auto email verification & scoring",
      "Unlimited connected Gmail accounts",
    ],
  },
};
