---
trigger: always_on
---

# 🎨 Proxy Dashboard UI Design Rules (HeroUI Flat Modern Compact System)

## 1. Design Philosophy

- Flat design, modern SaaS style
- Compact UI (dense information, không giãn quá nhiều)
- Functional-first, minimal visual noise
- Consistency > aesthetics
- Không dùng khoảng trắng lớn kiểu “landing page”
- **BẮT BUỘC: Sử dụng HeroUI (React Components) & Lucide Icons**
- **KHÔNG: Sử dụng Shopify Polaris hoặc Polaris Icons cho các giao diện mới**
- **Sử dụng Tailwind CSS v4 kết hợp với HeroUI làm mặc định**

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

[Sidebar (HeroUI & Lucide)]  
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

- Sử dụng HeroUI `<Card shadow="none" className="border border-slate-200 rounded-md bg-white p-3">`
- Hoặc sử dụng `div` trơn với class Tailwind: `bg-white border border-slate-200 rounded-md p-3`

Rules:

- No heavy shadows (luôn set `shadow="none"` hoặc tối đa `shadow="sm"`)
- No large padding
- Cards are data containers only

---

## 7. Table System (CORE COMPONENT)

- Sử dụng HeroUI `<Table removeWrapper selectionMode="none" ...>`
- Cấu trúc table: `<TableHeader>`, `<TableColumn>`, `<TableBody>`, `<TableRow>`, `<TableCell>`
- Row padding: custom padding nhỏ (`py-2 px-3` hoặc `h-10` max) để đảm bảo mật độ thông tin cao.
- Font: text-sm
- Borders: horizontal border bottom (`border-b border-slate-100`)
- Hover: bg-slate-50

Rules:

- Dense layout
- No boxed tables (luôn dùng `removeWrapper` để tránh shadow wrapper to của HeroUI)
- No shadows

---

## 8. Form System (COMPACT INPUTS)

Input:

- Sử dụng HeroUI `<Input size="sm" radius="sm" variant="bordered" classNames={{ inputWrapper: "h-9 border-slate-300" }} ...>`
- h-9
- text-sm
- focus:ring-1 focus:ring-blue-500

Label:

- Render label riêng bằng `<label className="block text-xs font-medium text-slate-600 mb-1">`
- Hoặc set `labelPlacement="outside"` trong HeroUI Input.

---

## 9. Button System (SMALL SIZE)

Sử dụng HeroUI `<Button size="sm" radius="sm" ...>`

Primary:

- `color="primary"` (mặc định xanh dương)
- h-9 px-3
- text-sm

Secondary:

- `variant="bordered"` hoặc `variant="flat"`
- h-9 px-3
- text-sm

Danger:

- `color="danger"`
- h-9 px-3
- text-sm

---

## 10. Sidebar (Compact Admin Style)

- Width: 220–240px
- Font: text-sm
- Padding: small
- Sử dụng Lucide Icons làm icon chỉ định.

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
