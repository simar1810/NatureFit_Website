/**
 * Cart/checkout helpers: pricing and deriving OrderSummary from CartState.
 * Single source for payable amount in AED and fils (Step 8).
 */
import type { CartState, OrderSummary } from "@/types/cart";
import type { Plan } from "@/types/plan";
import {
  PROTEINS,
  MEAL_TYPES,
} from "@/config/cartOptions";

const VAT_RATE = 0.05;
const DELIVERY_CHARGE_AED = 0;

/** Placeholder pricing when plan has no usable pricing (client-side formula). */
export function calculatePrice(params: {
  calories: number;
  mealsPerDay: number;
  daysPerWeek: number;
  weeks: number;
}) {
  const basePerMeal = 30; // AED
  const calorieFactor = params.calories / 400;
  const perMeal = basePerMeal * calorieFactor;
  const totalMeals =
    params.mealsPerDay * params.daysPerWeek * params.weeks;
  return perMeal * totalMeals;
}

function getTotalDeliveryDays(state: CartState): number {
  return state.daysPerWeek.days * state.weekCount.weeks;
}


export function resolveMealTierPrice(
  mealPricing: Record<string, number> | undefined,
  state: CartState
): number | null {
  if (!mealPricing || typeof mealPricing !== "object") return null;

  const totalDays = getTotalDeliveryDays(state);
  if (totalDays <= 0) return null;

  const weeks = state.weekCount.weeks;

  const numericKeys = Object.keys(mealPricing)
    .filter((k) => /^\d+$/.test(k))
    .map((k) => parseInt(k, 10))
    .sort((a, b) => a - b);

  if (numericKeys.length > 0) {
    const exact = mealPricing[String(totalDays)];
    if (typeof exact === "number" && exact > 0) return exact;

    const ceil = numericKeys.find((n) => n >= totalDays);
    if (ceil !== undefined) {
      const p = mealPricing[String(ceil)];
      if (typeof p === "number" && p > 0) return p;
    }

    const maxK = numericKeys[numericKeys.length - 1];
    const pMax = mealPricing[String(maxK)];
    if (typeof pMax === "number" && pMax > 0) return pMax;
  }

  const durationKey = weeks === 1 ? "1 week" : `${weeks} weeks`;
  const legacy =
    mealPricing[durationKey] ??
    mealPricing["1 week"] ??
    mealPricing[String(weeks)];

  if (typeof legacy === "number" && legacy > 0) return legacy;

  return null;
}

/**
 * Compute subtotal from plan.pricing when available.
 * Sums tier prices per selected meal (breakfast/lunch/dinner/snack). Uses numeric day tiers
 * from the API or legacy week keys. Meal slots without API pricing use an even share of the
 * client fallback total so snack-only gaps still work.
 * Returns null if the plan has no usable API prices (caller uses calculatePrice for the whole cart).
 */
export function computeSubTotalFromPlanPricing(
  plan: Plan | null | undefined,
  state: CartState
): number | null {
  const pricing = plan?.pricing;
  if (!pricing || typeof pricing !== "object") return null;

  const mealsPerDayCount = state.selectedMeals.length || 1;
  const fallbackTotal = calculatePrice({
    calories: state.selectedCalories.calories,
    mealsPerDay: mealsPerDayCount,
    daysPerWeek: state.daysPerWeek.days,
    weeks: state.weekCount.weeks,
  });
  const fallbackPerMealType = fallbackTotal / mealsPerDayCount;

  let anyApiPrice = false;
  let total = 0;

  for (const mealKey of state.selectedMeals) {
    const mealPricing = pricing[mealKey] as Record<string, number> | undefined;
    const resolved = resolveMealTierPrice(mealPricing, state);
    if (resolved != null && resolved > 0) {
      total += resolved;
      anyApiPrice = true;
    } else {
      total += fallbackPerMealType;
    }
  }

  if (!anyApiPrice) return null;
  return total;
}

/** Subtotal for cart/checkout display: API plan pricing when available, else calorie-based estimate. */
export function getCartSubtotal(
  plan: Plan | null | undefined,
  state: CartState
): number {
  const fromPlan = computeSubTotalFromPlanPricing(plan, state);
  if (fromPlan != null) return fromPlan;
  return calculatePrice({
    calories: state.selectedCalories.calories,
    mealsPerDay: state.selectedMeals.length || 1,
    daysPerWeek: state.daysPerWeek.days,
    weeks: state.weekCount.weeks,
  });
}

/**
 * Single source for payable amount. Use for checkout session (totalFils) and display (totalAed).
 */
export function getPayableFromSummary(summary: OrderSummary): {
  totalAed: number;
  totalFils: number;
} {
  const totalAed =
    summary.subTotal +
    summary.vat +
    summary.deliveryCharge -
    summary.promoAmt;
  const totalFils = Math.round(totalAed * 100);
  return { totalAed, totalFils };
}

/** Build order summary from cart state for checkout. Pass programName and optional plan (for pricing) in overrides. */
export function buildOrderSummaryFromCartState(
  state: CartState,
  overrides: Partial<OrderSummary> & { plan?: Plan | null } = {}
): OrderSummary {
  const programName =
    overrides.programName ?? "Program";
  const dietaryPreference = state.selectedProteins
    .map((k) => PROTEINS.find((p) => p.key === k)?.label ?? k)
    .join(", ")
    .toUpperCase();
  const mealsPerDay = state.selectedMeals
    .map((k) => MEAL_TYPES.find((m) => m.key === k)?.label ?? k)
    .join(", ")
    .toUpperCase();
  const caloriePerMeal = state.selectedCalories.calories;
  const mealsPerDayCount = state.selectedMeals.length || 1;
  const caloriePerDay = caloriePerMeal * mealsPerDayCount;
  const programLength = state.weekCount.label;
  const daysOfFood =
    state.daysPerWeek.days * state.weekCount.weeks;
  const weeksOfFood = state.weekCount.weeks;
  const startDate = state.startDate || "—";

  const subTotalFromPlan = computeSubTotalFromPlanPricing(overrides.plan ?? null, state);
  const subTotal =
    subTotalFromPlan ??
    calculatePrice({
      calories: state.selectedCalories.calories,
      mealsPerDay: mealsPerDayCount,
      daysPerWeek: state.daysPerWeek.days,
      weeks: state.weekCount.weeks,
    });

  const vat = subTotal * VAT_RATE;
  const deliveryCharge = DELIVERY_CHARGE_AED;
  const promoAmt = overrides.promoAmt ?? 0;
  const deliveryTimeSlot = overrides.deliveryTimeSlot ?? "";

  const { plan: _omitPlan, ...restOverrides } = overrides;
  return {
    programName,
    dietaryPreference,
    mealsPerDay,
    caloriePerMeal,
    caloriePerDay,
    programLength,
    daysOfFood,
    weeksOfFood,
    startDate,
    deliveryTimeSlot,
    subTotal,
    vat,
    deliveryCharge,
    promoAmt,
    ...restOverrides,
  };
}
