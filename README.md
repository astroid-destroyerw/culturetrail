# CultureTrail 🗺️

CultureTrail is a modern, responsive web application built to help travelers discover authentic, hyper-local destinations, stories, and cultural heritage. Powered by Google Gemini AI, it generates custom cultural guides containing offbeat attractions, local folk tales, heritage context, seasonal festivals, and interactive activities.

---

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router, Client Components, Server-Side API Handlers)
- **Styling**: Tailwind CSS (Earthy Dark Theme & Tailwind CSS printing stylesheet configurations)
- **Programming Language**: TypeScript
- **AI Engine**: Google Gemini API SDK (using `gemini-2.5-flash` for high-speed response resolution)
- **Icons**: Lucide React

---

## 🛠️ Getting Started & Local Setup

### 1. Prerequisites
Ensure you have **Node.js** (v18.x or later) and **npm** installed on your local environment.

### 2. Environment Configuration
Create a `.env.local` file in the root of the project:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(You can duplicate `.env.local.example` as a template. Note that `.env.local` is pre-configured to be ignored by git).*

### 3. Install Dependencies
Navigate to the project directory and run:
```bash
npm install
```

### 4. Start the Development Server
Execute the development command:
```bash
npm run dev
```
Open your browser and navigate to the printed local port (typically [http://localhost:3000](http://localhost:3000)) to explore the app.

---

## 🏛️ Architectural Decisions

### 1. Client-Side Stateless Cache (`sessionStorage`)
To keep the application scalable and serverless-friendly, CultureTrail does not require an active database connection for user guides. Instead:
- When a search is submitted, the API returns the parsed guide JSON.
- The client component stores it inside `sessionStorage` under the `"cultureGuideData"` key.
- The `/results` page hydrates using this sessionStorage cache.
- Wiping the data (via "New Search") instantly resets application state.

### 2. Structured JSON Output Constraints
Rather than parsing markdown text streams (which can break due to unstructured prose, extra formatting, or markdown backticks), the Gemini integration in `lib/gemini.ts` explicitly enforces the API parameters:
- Configures `responseMimeType: "application/json"`.
- Requests a strictly defined JSON outline containing structured attractions, gems, folklore narrative text, and schedule arrays.
- This results in a 100% predictable parseable model response.

### 3. Zero-Dependency Scroll Reveal Components
Entrance animations are handled by a lightweight [FadeIn.tsx](components/FadeIn.tsx) wrapper that uses a native browser `IntersectionObserver` instance combined with smooth Tailwind transform classes. This yields premium transitions as the user scrolls, while avoiding large bundles like Framer Motion.

### 4. Input Sanitization & 422 Error Guards
- Requests sent to `/api/generate-guide` pass through string checks verifying size limits (e.g. destinations under 100 characters, notes under 500 characters).
- Input inputs are stripped of HTML/script elements using custom regex sanitizers to prevent cross-site scripting (XSS).
- If Gemini returns empty/malformed text structure due to nonsense destinations, the route handler intercepts the throw and responds with a `422 Unprocessable Entity` status, suggesting more specific queries.

### 5. Print Optimization
The dashboard includes a customized print layout via Tailwind's built-in `print:` selectors. Entering Print mode (`Ctrl + P`) automatically hides headers, navigation buttons, and decorative glows, while formatting cards cleanly for ink-saving paper printing or PDF export.
