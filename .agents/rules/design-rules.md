---
trigger: always_on
---

# 🎨 Proxy Dashboard UI Design Rules (Flat Modern Compact System)

## 1. Design Philosophy

- Flat design, modern SaaS style
- Compact UI (dense information, không giãn quá nhiều)
- Functional-first, minimal visual noise
- Consistency > aesthetics
- Không dùng khoảng trắng lớn kiểu “landing page”

---

## 2. Color System (Flat & Soft)

Background: #F8FAFC  
Surface: #FFFFFF  
Border: #E2E8F0  
Text Primary: #0F172A  
Text Secondary: #64748B  
Accent: #3B82F6  
Success: #22C55E  
Warning: #F59E0B  
Danger: #EF4444

---

## 3. Layout System (COMPACT)

### Global Layout

- Max width: 1280px
- Page padding: 16px (p-4)
- Section spacing: 12–16px max
- Background: #F8FAFC

---

### Page Structure

[Sidebar]  
[Header (compact)]  
[Content]

---

## 4. Spacing Rules (VERY IMPORTANT)

- Page padding: p-4
- Section gap: space-y-4
- Card padding: p-3 or p-4 max
- List gap: space-y-2
- Table row padding: py-2 px-3
- Form gap: 12px–16px max

❌ KHÔNG dùng:

- space-y-8+
- p-6+
- large empty sections

---

## 5. Typography (Dense but readable)

H1: text-lg font-semibold  
H2: text-base font-medium  
Body: text-sm text-slate-700  
Muted: text-xs text-slate-500

---

## 6. Card System (Flat Compact)

- bg-white
- border border-slate-200
- rounded-md
- p-3

Rules:

- No heavy shadows (optional shadow-sm only)
- No large padding
- Cards are data containers only

---

## 7. Table System (CORE COMPONENT)

- Header: bg-slate-50
- Row padding: py-2 px-3
- Font: text-sm
- Borders: horizontal only
- Hover: bg-slate-50

Rules:

- Dense layout
- No boxed tables
- No shadows

---

## 8. Form System (COMPACT INPUTS)

Input:

- h-9
- text-sm
- border border-slate-300
- rounded-md
- px-2.5
- focus:ring-1 focus:ring-blue-500

Label:

- text-xs text-slate-600
- mb-1

---

## 9. Button System (SMALL SIZE)

Primary:

- h-9 px-3
- text-sm
- bg-blue-600 text-white
- hover:bg-blue-700
- rounded-md

Secondary:

- h-9 px-3
- text-sm
- bg-white border border-slate-300
- text-slate-700

Danger:

- h-9 px-3
- text-sm
- bg-red-600 text-white

---

## 10. Sidebar (Compact Admin Style)

- Width: 220–240px
- Font: text-sm
- Padding: small

Active state:

- bg-slate-100
- text-blue-600

---

## 11. Header (Minimal)

- Height: 48–56px
- Title left, actions right only
- No hero sections

Example:

Servers [Add Server]

---

## 12. Interaction Rules

- Hover: subtle (slate-50)
- Transition: max 150ms
- No heavy animations
- No motion UI effects

---

## 13. Anti-Patterns (STRICTLY FORBIDDEN)

- large whitespace sections
- shadow-heavy UI
- gradient backgrounds
- glassmorphism
- oversized cards
- animation-heavy interfaces
- inconsistent spacing per page

---

## 14. Core Principle

UI must feel like an engineering SaaS tool, not a marketing website.

---

## 15. Golden Rule

If unsure:

- choose smaller
- choose tighter
- choose simpler

Never choose “prettier but more spacious”
