import {
    Camera,
    Clapperboard,
    Compass,
    Drama,
    Fingerprint,
    Flame,
    Heart,
    House,
    Landmark,
    Laugh,
    Music,
    Palette,
    Rocket,
    Search,
    Skull,
    Sunset,
    Swords,
    Tv,
    WandSparkles,
    Zap,
    type LucideIcon,
} from "lucide-react";

// Noms des genres importés depuis TMDB en français. Un genre absent de la liste garde une icône de cinéma.
const GENRE_ICONS: Record<string, LucideIcon> = {
    Action: Flame,
    Animation: Palette,
    Aventure: Compass,
    Comédie: Laugh,
    Crime: Fingerprint,
    Documentaire: Camera,
    Drame: Drama,
    Familial: House,
    Fantastique: WandSparkles,
    Guerre: Swords,
    Histoire: Landmark,
    Horreur: Skull,
    Musique: Music,
    Mystère: Search,
    Romance: Heart,
    "Science-Fiction": Rocket,
    Thriller: Zap,
    Téléfilm: Tv,
    Western: Sunset,
};

export function genreIcon(name: string): LucideIcon {
    return GENRE_ICONS[name] ?? Clapperboard;
}
