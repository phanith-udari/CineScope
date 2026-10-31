# CineScope — Aesthetic Movie Journal & Discovery Sanctuary

A cute, aesthetic, and modern cinematic discovery platform and personal film diary handcrafted with gentle pastel aesthetics (lavender, blush pink, and warm cream).

---

## ✨ Features

- **Cinematic Discovery**: Live trending films, curated hidden gems, and mood-based film journeys powered by TMDB.
- **Advanced Search & Discovery**: Real-time debounced title search, genre multi-selection, year range filters, language filters, rating threshold sliders, and sorting options.
- **Dual Ratings Verification**: Compare community sentiment with verified TMDB and IMDb scores (`/api/omdb` secure proxy).
- **Intelligent Story Comparisons**: Side-by-side comparison cards for up to 3 films with qualitative story, tone, and thematic insights.
- **Spoiler-Free Stories**: Multi-provider AI (Google Gemini / OpenAI) narrative explanations with verified TMDB algorithmic fallbacks.
- **Personal Watchlist & Film Diary**: 100% client-side LocalStorage persistence, personal star ratings (out of 10), reviews, date watched logs, and custom collection management.
- **Personal Cinema Statistics**: Real-time statistics dashboard tracking total movies watched, watchlist counts, average personal rating, top genres, and watch time hours.

---

## 🚀 Deployment to Vercel

CineScope is configured for seamless deployment on [Vercel](https://vercel.com) as a Vite SPA with serverless API proxies for secret isolation.

### Option 1: Vercel Web Dashboard (Git Integration)

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In the Vercel Dashboard, click **Add New Project** and import the repository.
3. Vercel automatically detects the framework preset as **Vite**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and configure:
   - `VITE_TMDB_API_KEY`: Your TMDB API key (Required for client-side TMDB discovery).
   - `OMDB_API_KEY`: Your OMDb API key (Required for IMDb ratings).
   - `GEMINI_API_KEY`: *(Optional)* Google Gemini API key for spoiler-free story generation.
   - `OPENAI_API_KEY`: *(Optional)* OpenAI API key (alternative to Gemini).
5. Click **Deploy**.

### Option 2: Vercel CLI

```bash
# 1. Install Vercel CLI (if not already installed)
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy preview
vercel

# 4. Deploy to production
vercel --prod
```

When prompted, accept the default build settings (`dist` output folder).

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` for local development:

```bash
cp .env.example .env
```

| Variable | Scope | Required | Description |
| :--- | :--- | :---: | :--- |
| `VITE_TMDB_API_KEY` | Client & Build | **Yes** | TMDB developer API v3 key for movie catalog and posters. |
| `OMDB_API_KEY` | Serverless Only | **Yes** | OMDb API key for IMDb ratings via `/api/omdb`. Kept strictly server-side. |
| `GEMINI_API_KEY` | Serverless Only | *Optional* | Google Gemini API key for `/api/story`. Kept strictly server-side. |
| `OPENAI_API_KEY` | Serverless Only | *Optional* | OpenAI API key (alternative to Gemini) for `/api/story`. |

> [!IMPORTANT]
> Never prefix `OMDB_API_KEY`, `GEMINI_API_KEY`, or `OPENAI_API_KEY` with `VITE_`. Keeping them unprefixed guarantees they are never bundled into client-side JavaScript assets.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start Vite local development server with API middlewares
npm run dev

# Run oxlint check
npm run lint

# Compile production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 📜 TMDB Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
Movie posters and metadata courtesy of [The Movie Database (TMDB)](https://www.themoviedb.org/).
