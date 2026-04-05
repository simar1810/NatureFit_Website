"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/SiteShell";
import { getCartSubtotal } from "@/lib/cartUtils";
import type { ProteinKey, MealTypeKey } from "@/types/cart";
import type { ProgramOption } from "@/types/cart";
import {
  PROTEINS,
  CALORIES,
  MEAL_TYPES,
  DAYS_PER_WEEK,
  WEEKS_OF_FOOD,
  WEEKDAYS,
  CUSTOMIZATIONS,
} from "@/config/cartOptions";
import { usePlans } from "@/hooks/usePlans";

export default function CartPage() {
  const router = useRouter();
  const { cartState, setCartState, showCartToast } = useCart();
  const { plans, loading: plansLoading } = usePlans();
  const {
    programId,
    selectedProteins,
    selectedCalories,
    selectedMeals,
    daysPerWeek,
    weekCount,
    weekdays,
    startDate,
    customization,
    additionalInfo,
  } = cartState;

  const mealsPerDayCount = selectedMeals.length || 1;

  const programOptions: ProgramOption[] = useMemo(
    () => plans.map((p) => ({ id: p._id, label: p.title })),
    [plans],
  );

  const selectedPlan = useMemo(
    () => plans.find((p) => p._id === programId) ?? null,
    [plans, programId],
  );

  useEffect(() => {
    if (plansLoading || programOptions.length === 0) return;
    const currentValid = programOptions.some((p) => p.id === programId);
    if (!currentValid) {
      setCartState((prev) => ({ ...prev, programId: programOptions[0].id }));
      showCartToast("Cart updated");
    }
  }, [plansLoading, programId, programOptions, setCartState, showCartToast]);

  const totalPrice = useMemo(
    () => getCartSubtotal(selectedPlan, cartState),
    [selectedPlan, cartState],
  );

  const updateCart = <K extends keyof typeof cartState>(
    key: K,
    value: (typeof cartState)[K],
  ) => {
    setCartState((prev) => ({ ...prev, [key]: value }));
    showCartToast("Cart updated");
  };

  const handleToggleProtein = (key: ProteinKey) => {
    setCartState((prev) => ({
      ...prev,
      selectedProteins: prev.selectedProteins.includes(key)
        ? prev.selectedProteins.filter((p) => p !== key)
        : [...prev.selectedProteins, key],
    }));
    showCartToast("Cart updated");
  };

  const handleToggleMeal = (key: MealTypeKey) => {
    setCartState((prev) => ({
      ...prev,
      selectedMeals: prev.selectedMeals.includes(key)
        ? prev.selectedMeals.filter((m) => m !== key)
        : [...prev.selectedMeals, key],
    }));
    showCartToast("Cart updated");
  };

  const handleToggleWeekday = (key: string) => {
    setCartState((prev) => ({
      ...prev,
      weekdays: prev.weekdays.includes(key)
        ? prev.weekdays.filter((d) => d !== key)
        : [...prev.weekdays, key],
    }));
    showCartToast("Cart updated");
  };

  const handleCheckoutClick = () => {
    router.push("/Home/CheckOut");
  };

  const dailyKcal = selectedCalories.calories * mealsPerDayCount;

  return (
    <main className="nf-cart-page">
      <div className="nf-cart-layout">
        {/* Left: Hero image */}
        <div className="nf-cart-hero">
          <div
            className="nf-cart-hero-bg"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBRClx7DOvEyU8uUiDuYvpVKL_xwtMAut9cYzj7AoyJRNL_4uPHtVXx0-0SjEeRZT9v-QWoPexwgRB5n2zwnfrty6_MpP39YhuuBPXc_NeSPrXalZNVUj7hb5amUEtDbnMA6FsvlTtlgx5hh4vL24U11EP3Q4k3vi_-tDpmIhy-Y8NyQRK_uqpBbvwiCJtTC1AphTbSytsmrxEGjHY_25tCJOhMcX_Sf6QMakG_0cIcoKn-TGpRearOjcDZFxfbChF08Pox9d4Z-f75')",
            }}
          >
            <div className="nf-cart-hero-overlay" />
          </div>
          <div className="nf-cart-hero-copy">
            <h1>
              Elevate your daily <br />
              nutrition.
            </h1>
            <p>
              Boutique meal plans designed by nutritionists, prepared by gourmet
              chefs, and delivered to your doorstep.
            </p>
          </div>
        </div>

        {/* Right: Configuration */}
        <div className="nf-cart-config">
          <div className="nf-cart-config-scroll">
            <div className="nf-cart-sections">
              {/* 1. Program Selection */}
              <section className="nf-cart-section">
                <p className="nf-cart-label">Program Selection</p>
                {plansLoading ? (
                  <div className="nf-cart-empty-state">
                    <p>Loading plans…</p>
                  </div>
                ) : programOptions.length === 0 ? (
                  <div className="nf-cart-empty-state">
                    <p>No plans available right now.</p>
                    <p className="nf-cart-empty-sub">New plans will be added soon — check back shortly!</p>
                  </div>
                ) : (
                  <div className="nf-cart-program-list">
                    {programOptions.map((p) => (
                      <label
                        key={p.id}
                        className={`nf-cart-program-card ${
                          programId === p.id ? "selected" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="ProgramType"
                          checked={programId === p.id}
                          onChange={() => updateCart("programId", p.id)}
                        />
                        <div className="nf-cart-radio-dot" />
                        <div className="nf-cart-program-info">
                          <p className="nf-cart-program-title">{p.label}</p>
                          <p className="nf-cart-program-desc">
                            Balanced nutrition plan for overall wellness.
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </section>

              {/* 2. Protein Preference */}
              <section className="nf-cart-section">
                <p className="nf-cart-label">Protein Preference</p>
                <div className="nf-cart-chips">
                  {PROTEINS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      className={`nf-chip-pill ${
                        selectedProteins.includes(p.key) ? "selected" : ""
                      }`}
                      onClick={() => handleToggleProtein(p.key as ProteinKey)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* 3. Calorie Range */}
              <section className="nf-cart-section">
                <p className="nf-cart-label">Calorie Range (Daily)</p>
                <div className="nf-cart-chips">
                  {CALORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`nf-chip-rect ${
                        selectedCalories.id === c.id ? "selected" : ""
                      }`}
                      onClick={() => updateCart("selectedCalories", c)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* 4. Meals Per Day */}
              <section className="nf-cart-section">
                <p className="nf-cart-label">Meals Per Day</p>
                <div className="nf-cart-chips">
                  {MEAL_TYPES.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      className={`nf-chip-meal ${
                        selectedMeals.includes(m.key) ? "selected" : ""
                      }`}
                      onClick={() => handleToggleMeal(m.key as MealTypeKey)}
                    >
                      <span className="nf-chip-check" />
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* 5. Program Length */}
              <section className="nf-cart-section nf-cart-length">
                <div className="nf-cart-length-grid">
                  <div>
                    <p className="nf-cart-label">Days Per Week</p>
                    <div className="nf-cart-num-row">
                      {DAYS_PER_WEEK.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className={`nf-num-btn ${
                            daysPerWeek.id === d.id ? "selected" : ""
                          }`}
                          onClick={() => updateCart("daysPerWeek", d)}
                        >
                          {d.days}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="nf-cart-label">Duration (Weeks)</p>
                    <div className="nf-cart-num-row">
                      {WEEKS_OF_FOOD.map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          className={`nf-num-btn ${
                            weekCount.id === w.id ? "selected" : ""
                          }`}
                          onClick={() => updateCart("weekCount", w)}
                        >
                          {w.weeks}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="nf-cart-label">Schedule</p>
                  <div className="nf-cart-schedule-row">
                    {WEEKDAYS.map((d) => (
                      <button
                        key={d.key}
                        type="button"
                        className={`nf-schedule-btn ${
                          weekdays.includes(d.key) ? "selected" : ""
                        }`}
                        onClick={() => handleToggleWeekday(d.key)}
                      >
                        {d.label.charAt(0)}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* 6. Start Date */}
              <section className="nf-cart-section">
                <p className="nf-cart-label">Start Date</p>
                <input
                  type="date"
                  className="nf-cart-date"
                  value={startDate}
                  onChange={(e) => {
                    setCartState((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }));
                    showCartToast("Cart updated");
                  }}
                />
              </section>

              {/* 7. Dietary Requirements */}
              <section className="nf-cart-section">
                <p className="nf-cart-label">Dietary Requirements</p>
                <div className="nf-cart-diet-grid">
                  {CUSTOMIZATIONS.map((c) => (
                    <label
                      key={c.id}
                      className={`nf-cart-diet-option ${
                        customization === c.id ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="customization"
                        checked={customization === c.id}
                        onChange={() => updateCart("customization", c.id)}
                      />
                      <span>{c.label}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* 8. Additional Instructions */}
              <section className="nf-cart-section">
                <p className="nf-cart-label">Additional Instructions</p>
                <textarea
                  className="nf-cart-textarea"
                  placeholder="Allergies, dislikes, or delivery notes..."
                  value={additionalInfo}
                  onChange={(e) => {
                    setCartState((prev) => ({
                      ...prev,
                      additionalInfo: e.target.value,
                    }));
                  }}
                />
              </section>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="nf-cart-sticky-footer">
            <div className="nf-cart-footer-inner">
              <div className="nf-cart-footer-price">
                <div className="nf-cart-price-row">
                  <span className="nf-cart-price-amount">
                    {totalPrice.toLocaleString()}
                  </span>
                  <span className="nf-cart-price-currency">AED</span>
                </div>
                <div className="nf-cart-kcal-row">
                  <span className="nf-cart-kcal-dot" />
                  <span>Est. {dailyKcal.toLocaleString()} KCAL / DAY</span>
                </div>
              </div>
              <button
                type="button"
                className="nf-cart-checkout-btn"
                onClick={handleCheckoutClick}
              >
                Checkout →
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
