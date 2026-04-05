# Backend endpoints – integration status

**For the backend team:** See **`BACKEND_PROMPT.md`** for a confirmation prompt. It lists (A) integrated endpoints with request/response details so you can verify our usage, and (B) non-integrated features so you can tell us which exist—we will integrate those and remove UI for the rest.

All paths are relative to `/api/v1`. Base URL: `NEXT_PUBLIC_API_BASE_URL`.

## ✅ Integrated (frontend calls these)

| Endpoint | Method | Where used | Purpose |
|----------|--------|------------|---------|
| `tenant/list` | GET | AuthContext | Resolve tenant ID when `NEXT_PUBLIC_TENANT_ID` not set |
| `auth/refresh` | POST | AuthContext | Refresh access token from stored refresh token |
| `user/profile` | GET | AuthContext | Load current user (after login/refresh) |
| `auth/otp` | POST | Registration, Checkout | Send OTP to phone |
| `auth/email` | POST | Registration, Checkout | Send OTP to email |
| `auth/otp` | PUT | Registration, Checkout | Verify phone OTP (sign in or register) |
| `auth/email` | PUT | Registration, Checkout | Verify email OTP (sign in or register) |
| `auth/register` | POST | Registration | Complete registration (name, email, etc.) with `registrationToken` |
| `menu/list?type=templates` | GET | usePlans (Cart, Checkout) | List meal plan templates (`data.templates`) for program selector |
| `menu/list` | GET | useMenuList (Program page) | Menu list (templates/recipes) for selected plan |
| `checkout/session` | POST | Checkout | Create Stripe Checkout Session; body: `templateId`, `amount`, `currency`, `productName`, `successUrl`, `cancelUrl`, optional `userId`, `tenantId`. Response: `data.url`, `data.orderId`. |
| `checkout/session/:sessionId` | GET | CheckoutSuccess | Get session details after payment (status, orderId) |

**Logout:** Frontend clears tokens locally (`clearTokens()`). No `POST /auth/logout` call unless the backend requires it for server-side session invalidation.

---

## ❌ Not integrated (UI only or hardcoded)

| Requirement | Status | Notes |
|-------------|--------|-------|
| **Forgot password** | UI only | Offcanvas exists; no API call. |
| **POST /auth/logout** | Not called | Logout only clears frontend tokens. |
| **Delivery time slots** | Hardcoded | Checkout dropdown uses static options (e.g. 3 AM–6 AM, 6 AM–9 AM). No `GET /config/delivery-slots`. |
| **Start dates** | Hardcoded | Cart “START DATE” uses static options. No API for next Mondays. |
| **Cart API** | None | Cart is client state only (no POST/GET cart). |
| **Pricing** | Client-side | Price from `cartUtils`; no `GET /programs/:id/price` or similar. |
| **Promo codes** | Not integrated | “Apply” does nothing; no validate/apply promo endpoint. |
| **GET /orders/:id** | Not used | Success page uses `GET checkout/session/:sessionId` only. |
| **User addresses** | Not integrated | “Existing address” / “New address” are UI only; no GET/POST addresses. |
| **Referral code** | Not integrated | Field exists; not sent to backend. |
| **Countries / cities** | Hardcoded | Delivery country/city dropdowns are static (e.g. UAE, Dubai). |
| **Newsletter / community** | Not integrated | Footer form not wired to an endpoint. |

---

## Summary

- **Auth:** Tenant, refresh, profile, OTP, verify, register – all integrated. Register body: do not send `phone`/`countryCode`. Forgot password offcanvas removed; no logout endpoint. See **`BACKEND_REPLY.md`** for backend reply and actions taken.
- **Plans & menu:** `menu/list?type=templates` (plans list) and `menu/list` (useMenuList) integrated. Delivery slots, start dates, pricing remain client-side/hardcoded.
- **Checkout:** Create session and get session by ID integrated. Promo input hidden; referral state removed; footer community form removed.
