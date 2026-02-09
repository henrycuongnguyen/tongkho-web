# Scout Report: Province Selector Migration Edge Cases

**Date:** 2026-02-08
**Changed File:** `src/components/listing/sidebar/location-selector.astro`
**Focus:** Edge cases, memory leaks, View Transitions, HTMX interactions

## Relevant Files

### Direct Dependencies
- `src/components/listing/sidebar/location-selector.astro` - Modified component
- `src/components/listing/location-autocomplete.astro` - Sibling component in same parent
- `src/pages/api/location/districts.ts` - HTMX endpoint for district loading
- `src/components/listing/listing-filter.astro` - Parent component importing location-selector

### Related Components with Similar Patterns
- `src/components/home/featured-project-section.astro` - Uses `astro:page-load` for carousel init (reference implementation)

## Edge Cases Discovered

### 1. HTMX Window Global Access (Lines 244-258, 274-286)
**Risk:** `window.htmx` check assumes HTMX is loaded globally. If HTMX fails to load or loads after component init, district loading silently falls back to fetch.

**Scenario:**
- Slow network loads Astro bundle before HTMX script
- Component initializes, tries district refresh
- `window.htmx` is undefined → uses fetch fallback
- No user feedback that HTMX feature failed

**Current Mitigation:** Fetch fallback exists but no error logging or user notification.

### 2. AbortController Browser Compatibility (Line 166)
**Risk:** AbortController not supported in older browsers (IE11, Safari <11.1).

**Impact:** Cleanup handler fails silently, event listeners leak on View Transitions in unsupported browsers.

**Current Status:** No fallback for unsupported browsers.

### 3. Initialization Guard Race Condition (Lines 137-138)
**Risk:** `data-initialized` attribute check is synchronous, but DOM manipulation during View Transition can be async.

**Scenario:**
- Fast navigation between listing pages
- View Transition starts before cleanup completes
- New page loads, sees `data-initialized="true"` from previous instance
- Component never initializes on new page

**Current Mitigation:** `astro:before-swap` cleanup removes attribute (line 178), but timing depends on event order.

### 4. District Panel HTMX Attribute Mutation (Lines 99-101)
**Risk:** HTMX parses `hx-get` and `hx-trigger` on page load. Manual district refresh (lines 243-258) bypasses HTMX attributes, using imperative `htmx.ajax()` instead.

**Scenario:**
- User selects province A → HTMX loads districts via attribute
- User selects province A again (line 232: "Already on this province page")
- Manual `htmx.ajax()` call (line 247)
- If HTMX config changes (e.g., custom headers, error handlers), manual call won't inherit them

**Inconsistency:** HTMX used declaratively on first load, imperatively on refresh.

### 5. Loading State Missing Reset Handler (Lines 217-228)
**Risk:** Loading state set before navigation (`data-state="loading"`), but no error handler if navigation fails.

**Scenario:**
- User clicks province with slow network
- Loading spinner shows (line 217)
- Browser blocks navigation (popup blocker, extension)
- Loading state never resets → button permanently disabled

**Current Mitigation:** None. `data-[state=loading]:pointer-events-none` makes button unclickable forever if navigation fails.

### 6. Location Autocomplete Component Isolation (location-autocomplete.astro)
**Finding:** Autocomplete component uses inline `<script is:inline define:vars>` (line 89), which means it does NOT have View Transition awareness.

**Risk:** If autocomplete is on same page as location-selector:
- View Transition navigates between listing pages
- Autocomplete event listeners NOT cleaned up (no `astro:before-swap` handler)
- Memory leak accumulates on each soft navigation
- localStorage keys proliferate (tab-scoped but not cleaned)

**Reference:** MEMORY.md notes autocomplete has "Event listener memory leak... not critical" but provides no timeline for fix.

### 7. Province Selection Style Update Logic (Lines 198-203)
**Risk:** Style update removes classes from ALL province items then adds to selected one. If selection happens during View Transition DOM swap, class mutations may apply to stale DOM.

**Scenario:**
- User clicks province during View Transition
- DOM swap begins mid-execution
- `provinceItems.forEach(p => p.classList.remove(...))` targets old DOM
- `item.classList.add(...)` targets new DOM
- Visual state inconsistent (no item appears selected)

**Current Mitigation:** None. Click handler doesn't check if View Transition is active.

### 8. District Panel Empty State Inconsistency (Lines 103-113 vs 292)
**Finding:** Initial empty state (line 112) uses `text-xs`, but reset state (line 292) uses `text-secondary-500` without size class.

**Impact:** Visual inconsistency when user selects "Tất cả tỉnh thành" vs initial load.

### 9. Navigation URL Check Mismatch (Lines 212, 295)
**Risk:** Province navigation checks `currentUrl !== targetUrl` (line 215) using only `pathname`, but reset check uses `pathname + search` (line 295).

**Scenario:**
- User on `/mua-ban/ha-noi?dtnn=50`
- Selects province Hà Nội again
- Line 212: `currentUrl = /mua-ban/ha-noi` (pathname only)
- Line 215: `targetUrl = /mua-ban/ha-noi` → considers "already on page"
- But query params differ → should reload to clear filters

**Inconsistency:** Different URL comparison strategies for province vs reset.

### 10. HTMX Trigger "load once" Race Condition (Line 100)
**Risk:** `hx-trigger="load once"` fires on component mount, but if province changes via client-side navigation (View Transition), trigger doesn't re-fire.

**Scenario:**
- User on `/mua-ban` (no province)
- Navigates to `/mua-ban/ha-noi` via View Transition
- Component re-renders with `selectedProvince` prop set
- `hx-trigger="load once"` already fired on previous page → districts don't load
- User sees loading spinner forever

**Current Mitigation:** Manual `htmx.ajax()` call on "already on this province" (line 247) partially addresses this, but only if URL pathname matches.

## Data Flow Risks

### HTMX → Component State
- District panel controlled by HTMX via `innerHTML` swap
- Component script also manipulates `innerHTML` manually (lines 234, 264)
- No synchronization mechanism → race condition if HTMX request completes mid-script update

### Component → API → Component
- Province selection triggers navigation (line 230)
- Navigation reloads page with new props
- New component instance doesn't know about previous selection in-progress state
- If user rapidly clicks provinces, multiple navigations queue up

## Boundary Conditions

| Condition | Handling | Risk |
|-----------|----------|------|
| No provinces in list | Not checked | Could cause empty dropdown |
| Province without districts | API returns "Không có quận/huyện" | OK |
| HTMX script fails to load | Fetch fallback | No error notification |
| AbortController unsupported | Cleanup fails | Memory leak |
| View Transition disabled | Works (uses page reload) | OK |
| Multiple location-selectors on page | Each initialized independently | OK if DOM stable |

## Async Race Conditions

### Race 1: Navigation vs HTMX Request
- User selects province → navigation starts (line 230)
- HTMX district request fires before page unload
- Page unloads mid-request
- Request completes after new page loads
- HTMX tries to swap into stale element → fails silently

### Race 2: Cleanup vs Initialization
- View Transition starts → `astro:before-swap` fires (line 176)
- AbortController aborts listeners
- DOM swap happens
- `astro:page-load` fires → `initLocationSelectors()` runs
- But if swap is slow, cleanup might remove `data-initialized` after new init checks it

### Race 3: Manual District Refresh vs Attribute-Based Load
- User selects province A on page load
- HTMX `hx-trigger="load once"` fires → districts load
- User selects province B → navigation
- User back-navigates to province A
- Component sees "already on this province" (line 232)
- Triggers manual `htmx.ajax()` (line 247)
- But `hx-trigger="load once"` won't fire again → depends on manual call

## State Mutations

| State | Mutated By | Cleanup | Risk |
|-------|------------|---------|------|
| `isOpen` | Click handlers | Scoped to function | OK |
| `data-initialized` | Init guard | `astro:before-swap` | Race condition risk |
| `data-state` | Loading handler | Never reset on error | Permanent disabled state |
| District panel `innerHTML` | HTMX + manual script | None | Race condition |
| Province item classes | Selection logic | None during View Transition | Visual inconsistency |

## Memory Leaks

### Confirmed Fixes
✅ Outside-click listener uses AbortController (line 166)
✅ Cleanup handler on `astro:before-swap` (line 176)
✅ Initialization guard prevents duplicate listeners (line 137)

### Potential Leaks
❌ If AbortController unsupported, outside-click listener never cleaned
❌ If `astro:before-swap` doesn't fire (View Transitions disabled), cleanup never runs
❌ Sibling autocomplete component has no cleanup (per MEMORY.md)

### HTMX-Specific
- HTMX manages its own event listeners on `hx-get` elements
- If district panel element destroyed during View Transition, HTMX should cleanup
- But manual `htmx.ajax()` calls create one-off listeners → verify HTMX cleans these

## Browser Compatibility Gaps

| Feature | Support | Fallback |
|---------|---------|----------|
| AbortController | Modern browsers (2017+) | None |
| `astro:page-load` | Astro View Transitions only | Won't init if VT disabled |
| Optional chaining `?.` | ES2020+ | Build transpiles |
| `{ signal }` in addEventListener | Chrome 90+, Safari 15+ | None |

## Unresolved Questions

1. **AbortController fallback:** Should component detect lack of support and use manual cleanup?
2. **HTMX failure notification:** Should user see error toast if district loading fails?
3. **Loading state reset:** How to detect failed navigation and reset `data-state`?
4. **Autocomplete cleanup:** When will memory leak fix be implemented (MEMORY.md says "not critical")?
5. **View Transition disabled mode:** Does `astro:page-load` fire if user disables View Transitions in browser settings?
6. **HTMX attribute consistency:** Should all district loading use declarative `hx-*` attributes instead of imperative `htmx.ajax()`?
7. **URL comparison strategy:** Should province selection use pathname+search like reset does (line 295)?
8. **Rapid navigation queue:** What happens if user clicks 5 provinces rapidly before first navigation completes?
9. **District panel race condition:** Can HTMX request complete while manual script is updating `innerHTML`?
10. **Cross-component state:** Does autocomplete's localStorage isolation (`tab-instance-id`) interact with location-selector navigation?
