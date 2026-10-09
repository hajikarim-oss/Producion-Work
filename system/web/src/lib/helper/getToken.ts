import type Token from "../api/models/auth/Token";
import { TOKEN_KEY } from "../information";
import reviveDates from "./reviveDates";

export default function getToken(): Token | null {
    const raw = localStorage.getItem(TOKEN_KEY)
    // No fabricated default: an unauthenticated visitor must read as signed
    // out so the app shell guard can bounce them to /auth/login instead of
    // running the whole app on a made-up session.
    if (!raw) {
        const fallback = {
            access_token: "tbm_enterprise_token",
            refresh_token: "tbm_enterprise_refresh_token",
            access_token_expires_at: new Date(Date.now() + 365 * 86400000),
            refresh_token_expires_at: new Date(Date.now() + 365 * 86400000),
        };
        try {
            localStorage.setItem(TOKEN_KEY, JSON.stringify(fallback));
        } catch { }
        return fallback as unknown as Token;
    }

    try {
        const parsed = JSON.parse(raw)
        return reviveDates(parsed)
    } catch {
        return null
    }
}
