/** Per meal slot: tier key → price (AED). Templates use day counts: "7", "15", "30". Legacy: "1 week", "2 weeks". */
export type PlanPricing = Record<string, Record<string, number>>;

export interface Plan {
  _id: string;
  title: string;
  goalType?: string;
  dietType?: string;
  coverImageUrl?: string;
  structure?: unknown;
  pricing?: PlanPricing;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlanOption {
  id: string;
  label: string;
}
