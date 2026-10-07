// Prefer an .env file (VITE_YOUTUBE_API_KEY); the fallback keeps the demo runnable.
export const YOUTUBE_API_KEY: string =
  import.meta.env.VITE_YOUTUBE_API_KEY ?? "AIzaSyAuHMwkp7TE7M5kDSdjzCsQszxBcPt6Po4";
