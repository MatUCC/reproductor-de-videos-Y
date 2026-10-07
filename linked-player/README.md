# Linked Player

Music player built on a hand-written **Doubly Linked List** (TypeScript, OOP).

    npm install
    npm run dev        # open http://localhost:5173

API key: copy `.env.example` to `.env` and set `VITE_YOUTUBE_API_KEY`.
Restrict the key in Google Cloud Console (HTTP referrers + YouTube Data API v3 only),
because any key used from a frontend is visible to the browser.

Structure: `structures/` (Node, DoublyLinkedList) -> `player/MusicPlayer` -> `ui/PlayerView`;
`services/` wraps the YouTube Data API and the Iframe Player API.
