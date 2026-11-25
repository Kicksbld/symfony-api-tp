// La watchlist d'un profil est publique : sa clé ne dépend pas de la session.
export function watchlistKey(username: string): readonly ["users", string, "watchlist"] {
    return ["users", username, "watchlist"];
}
