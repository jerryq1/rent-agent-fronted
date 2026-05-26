# RentAgent Dashboard Design System (Web3 Glassmorphism Edition)

This document defines the premium Web3-style design system for the RentAgent property console. It serves as the master source of truth for all styles, assets, and components.

---

## 1. Visual & Color System
We adopt a **Web3 Glassmorphism** aesthetic, combining deep midnight blue/violet backdrops with glowing neon-blue/violet radial spots, highly polished frosted glass cards, and crisp neon highlights.

| Token | Value / Class | Usage |
| :--- | :--- | :--- |
| **Global Background** | `#090D26` to `#050714` (Deep Indigo Gradient) | Base canvas with rich gradient depth |
| **Glow Spots** | Radial `rgba(59, 130, 246, 0.15)` & `rgba(139, 92, 246, 0.15)` | Glowing ambient background lights |
| **Glass Card Bg** | `rgba(10, 15, 41, 0.6)` | Translucent dark-blue container background |
| **Glass Card Border**| `rgba(59, 130, 246, 0.12)` | Delicate neon-blue card border |
| **Backdrop Blur** | `backdrop-blur-lg` (16px) | Premium frosted glass refraction |
| **Text Primary** | `#FFFFFF` | Bright white headings and critical text |
| **Text Secondary** | `#94A3B8` (slate-400) | Muted captions, details, labels |
| **Accent Primary** | `#3B82F6` (blue-500) | Web3 interactive highlights, buttons, user chat bubbles |
| **Accent Violet** | `#8B5CF6` (purple-500) | Secondary action highlights, crystal gradients |
| **Accent Success** | `#10B981` (emerald-500) | INFO log tags, positive indicators, node success dots |
| **Accent Warning** | `#F59E0B` (amber-500) | WARN log tags, node running dots |
| **Accent Danger** | `#EF4444` (red-500) | ERROR log tags, node failure dots |

---

## 2. Typography
Modern, high-contrast typography suited for financial/Web3 data-dense dashboards.

*   **Primary Font Family**: `Outfit`, `Plus Jakarta Sans`, sans-serif
*   **Monospace Font**: `Fira Code`, `JetBrains Mono`, monospace
*   **Scale**:
    *   `text-2xl` (1.5rem, Bold) - Page / Panel title
    *   `text-sm` (0.875rem) - Base text, table cells, chats
    *   `text-xs` (0.75rem) - Console log logs

---

## 3. Scientific Screen Layout
To maximize screen real estate and prioritize user interaction:
*   **Header Bar**: Top full-width bar containing:
    *   Left: Logo + Title (`RentAgent.AI`) + Connection status tag (`http://localhost:8000`).
    *   Right: Sleek **"Star on GitHub"** button with official GitHub SVG icon.
*   **Main Dashboard Body**: Split into a 2-column layout:
    *   **Left Column (55% width)**: Real-estate rental listings table styled like a Web3 swap/assets list.
    *   **Right Column (45% width)**: Full-height AI Chatbot dialogue window. Focuses entirely on chat bubbles, user questions, and the agent's progress node checklist.
*   **Collapsible Console Drawer (Bottom Sheet)**:
    *   Tucked away in the footer, showing a single status line: `"● API Stream Connected"` and a toggle button.
    *   When clicked, it slides up to reveal the full developer terminal log with syntax colors. This prevents raw JSON logs from taking up permanent space, while keeping them readily available.

---

## 4. Specific Component Styles

### A. Swap-Style Rental Table
*   **Row Items**: Individual rounded glass panels (`rounded-xl bg-opacity-60 border border-blue-500/10`) with thin outlines.
*   **Spacing**: 8px margin-bottom between cards.
*   **Hover State**: Row scale transitions (`hover:scale-[1.01] hover:border-blue-500/30`) with a subtle blue inner glow.

### B. Chatbot Interface with Agent Node States
*   **Dialogue Area**: Flex-col container, spacing `gap-4`, overflow-y-auto.
*   **User Bubbles**: Aligned right, styled with dark royal blue gradient (`bg-gradient-to-r from-blue-600 to-indigo-650`).
*   **AI Bubbles**: Aligned left, styled as semi-transparent dark gray-blue glass bubbles (`bg-slate-900/60 border border-slate-800/40`).
*   **Agent Node Pipeline (Inside AI Message)**: A clean, rounded nested status card listing the active reasoning steps. Each node has a glowing bullet indicator.

### C. Web3 Console Log (Sliding Drawer)
*   **Background**: Solid translucent dark slate (`bg-[#0B0F24] border-t border-blue-900/40`).
*   **Syntax colors**:
    *   `[INFO]` -> `#10B981` (emerald)
    *   `[WARN]` -> `#F59E0B` (amber)
    *   `[ERROR]` -> `#EF4444` (red)

---

## 5. Anti-Patterns to Avoid
1.  **No flat grey borders**: Use semi-transparent blue/indigo accents for border lines to maintain the neon depth.
2.  **No solid background overlays**: Avoid blocky dark containers. Keep glass opacities under 70% to preserve background aura reflections.
3.  **No default icons**: Always use premium outlined vector SVGs.
