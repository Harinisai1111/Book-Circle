# 📚 BookCircle - Social Reading PWA

BookCircle is a premium social reading platform that connects bibliophiles through a beautiful, real-time interface. Built with **React**, **Supabase**, and **Clerk**, it offers a seamless blend of community interaction and personal reading tracking.

![BookCircle Logo](/public/icon-512.png)

## ✨ Core Features

- **🚀 PWA Ready**: Install BookCircle on your phone or desktop for a native-like experience.
- **🔍 Intelligent Search**: Powered by **Google Books API** for lightning-fast results and high-fidelity covers.
- **✉️ Secret Mail**: Real-time 1-to-1 messaging with live unread notification badges.
- **🖼️ AI Image Processing**: Enhance and optimize your book photos using **Google Gemini**.
- **⭕ Circles**: Join genre-themed communities and chat with like-minded readers.
- **🛡️ Resilience**: Built-in 3-second image timeouts and local fallbacks ensure the app works even on poor connections.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js installed.
- A **Supabase** project.
- A **Clerk** application.
- A **Google AI Studio** API Key (for Gemini).

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### 3. Database Setup (Supabase)
Run the contents of [database-schema.sql](file:///c:/Users/Harini%20Sai%20Haran/Downloads/bookcircle/database-schema.sql) in your Supabase SQL Editor.

> [!IMPORTANT]
> **Enable Realtime for Notifications:**
> 1. Go to **Database > Publications**.
> 2. Click on `supabase_realtime`.
> 3. Ensure the `messages`, `posts`, `likes`, and `comments` tables are checked.

### 4. Running the App
```bash
npm run dev
```

## 📱 Progressive Web App (PWA)
BookCircle is a fully compliant PWA. 
- **iOS**: Tap "Share" -> "Add to Home Screen".
- **Android/Chrome**: Click the "Install" icon in the address bar.
- **Offline**: Basic app shell and core assets are cached for faster loading.

## 🛠️ Built With
- **Frontend**: React, Tailwind CSS, Lucide React
- **Auth**: Clerk (Social & Email)
- **Backend/DB**: Supabase (PostgreSQL + Realtime)
- **AI**: Google Gemini Pro & Flash
- **Book Data**: Google Books API

---
*Created with ❤️ for the global reading community.*
