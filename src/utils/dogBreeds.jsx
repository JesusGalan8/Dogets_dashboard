// ============================================
// Dogets - Dog Breed Icons & Color System
// ============================================

// 12 vibrant, distinct colors for dogs in the calendar
const DOG_COLORS = [
    { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#60a5fa', name: 'Azul' },
    { bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', text: '#c084fc', name: 'Púrpura' },
    { bg: 'rgba(236, 72, 153, 0.15)', border: '#ec4899', text: '#f472b6', name: 'Rosa' },
    { bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e', text: '#4ade80', name: 'Verde' },
    { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fbbf24', name: 'Ámbar' },
    { bg: 'rgba(6, 182, 212, 0.15)', border: '#06b6d4', text: '#22d3ee', name: 'Cyan' },
    { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#f87171', name: 'Rojo' },
    { bg: 'rgba(132, 204, 22, 0.15)', border: '#84cc16', text: '#a3e635', name: 'Lima' },
    { bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316', text: '#fb923c', name: 'Naranja' },
    { bg: 'rgba(20, 184, 166, 0.15)', border: '#14b8a6', text: '#2dd4bf', name: 'Teal' },
    { bg: 'rgba(99, 102, 241, 0.15)', border: '#6366f1', text: '#818cf8', name: 'Índigo' },
    { bg: 'rgba(244, 63, 94, 0.15)', border: '#f43f5e', text: '#fb7185', name: 'Coral' },
];

// Get a consistent color for a dog based on its ID
export function getDogColor(dogId) {
    if (!dogId) return DOG_COLORS[0];
    let hash = 0;
    for (let i = 0; i < dogId.length; i++) {
        hash = dogId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return DOG_COLORS[Math.abs(hash) % DOG_COLORS.length];
}

// SVG breed icons - simple, recognizable silhouettes
const BREED_ICONS = {
    // Generic / Default
    default: `<svg viewBox="0 0 40 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20 6c-2 0-3.5 1-4.5 2.5C14 7 12 6.5 10.5 8 8.5 10 9 13 9 13s-3 2-3 5c0 4 3 6 5 7v4c0 1.5 1 3 3 3h12c2 0 3-1.5 3-3v-4c2-1 5-3 5-7 0-3-3-5-3-5s.5-3-1.5-5C27.5 6.5 26 7 24.5 8.5 23.5 7 22 6 20 6zm-4 16a2 2 0 110-4 2 2 0 010 4zm8 0a2 2 0 110-4 2 2 0 010 4zm-4 4c-1.5 0-3-1-3-1s1.5 2 3 2 3-2 3-2-1.5 1-3 1z"/></svg>`,

    // Small breeds
    chihuahua: `<svg viewBox="0 0 40 40" fill="currentColor"><path d="M12 8L8 4v6l2 2-1 4c0 3 2 6 5 7v5c0 1 1 2 2 2h8c1 0 2-1 2-2v-5c3-1 5-4 5-7l-1-4 2-2V4l-4 4H12zm4 12a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm8 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm-4 3.5c-1 0-2-.5-2-.5s1 1.5 2 1.5 2-1.5 2-1.5-1 .5-2 .5z"/></svg>`,

    // Large & medium breeds  
    labrador: `<svg viewBox="0 0 40 40" fill="currentColor"><path d="M14 6c-2 0-4 2-5 4L7 12c-1 1-1 3 0 4l2 1v3c0 4 3 7 6 8v4c0 1 1 2 2 2h6c1 0 2-1 2-2v-4c3-1 6-4 6-8v-3l2-1c1-1 1-3 0-4l-2-2c-1-2-3-4-5-4-1 0-2 .5-3 1.5h-4C17 6.5 16 6 14 6zm2 14a2 2 0 110-4 2 2 0 010 4zm8 0a2 2 0 110-4 2 2 0 010 4zm-4 4l-2-1h4l-2 1z"/></svg>`,

    golden: `<svg viewBox="0 0 40 40" fill="currentColor"><path d="M13 5c-2 0-3 1-4 3l-2 4c0 2 1 3 2 4v5c0 4 3 7 6 8v3c0 1 1 2 2 2h6c1 0 2-1 2-2v-3c3-1 6-4 6-8v-5c1-1 2-2 2-4l-2-4c-1-2-2-3-4-3-1.5 0-2.5 1-3.5 2h-3C19 6 18 5 16 5h-3zm3 15a2 2 0 110-4 2 2 0 010 4zm8 0a2 2 0 110-4 2 2 0 010 4zm-6 3h4c0 1-1 2-2 2s-2-1-2-2z"/></svg>`,

    pastor: `<svg viewBox="0 0 40 40" fill="currentColor"><path d="M12 4l-3 5-2 3c0 2 1 4 3 5v4c0 4 3 7 5 8v3c0 1 1 2 2 2h6c1 0 2-1 2-2v-3c2-1 5-4 5-8v-4c2-1 3-3 3-5l-2-3-3-5c-1 0-3 1-4 3h-4c-1-2-3-3-4-3l-4 0zm4 16a2 2 0 110-4 2 2 0 010 4zm8 0a2 2 0 110-4 2 2 0 010 4zm-4 3c-1 0-2.5-1-2.5-1s1 2 2.5 2 2.5-2 2.5-2-1.5 1-2.5 1z"/></svg>`,

    bulldog: `<svg viewBox="0 0 40 40" fill="currentColor"><path d="M10 10c-2 1-3 3-3 5v3c0 3 2 6 4 7v4c0 1 1 2 3 2h12c2 0 3-1 3-2v-4c2-1 4-4 4-7v-3c0-2-1-4-3-5l-1-3c-1-1-3-1-4 0h-8c-1-1-3-1-4 0l-2 3zm5 10a2 2 0 110-4 2 2 0 010 4zm10 0a2 2 0 110-4 2 2 0 010 4zm-7 3h4c0 2-1 3-2 3s-2-1-2-3z"/></svg>`,

    husky: `<svg viewBox="0 0 40 40" fill="currentColor"><path d="M11 4L7 8v4l2 2v6c0 4 3 7 6 8v4c0 1 1 2 2 2h6c1 0 2-1 2-2v-4c3-1 6-4 6-8v-6l2-2V8l-4-4-2 3h-4c-1-2-2-3-4-3l-4 0zm5 16a2 2 0 110-4 2 2 0 010 4zm8 0a2 2 0 110-4 2 2 0 010 4zm-4 3l-2.5-1.5h5L20 23z"/></svg>`,

    beagle: `<svg viewBox="0 0 40 40" fill="currentColor"><path d="M13 8c-2 0-4 1-5 3l-1 4c0 2 1 4 3 5v3c0 3 2 6 5 7v2c0 1 1 2 2 2h6c1 0 2-1 2-2v-2c3-1 5-4 5-7v-3c2-1 3-3 3-5l-1-4c-1-2-3-3-5-3l-2 1h-6l-2-1h-4zm3 13a2 2 0 110-4 2 2 0 010 4zm8 0a2 2 0 110-4 2 2 0 010 4zm-4 3c-1 0-2-1-2-1l2 2 2-2s-1 1-2 1z"/></svg>`,

    caniche: `<svg viewBox="0 0 40 40" fill="currentColor"><circle cx="20" cy="10" r="5"/><circle cx="14" cy="8" r="3"/><circle cx="26" cy="8" r="3"/><path d="M14 14c-2 1-4 4-4 7v2c0 3 2 5 4 6v3c0 1 1 2 2 2h8c1 0 2-1 2-2v-3c2-1 4-3 4-6v-2c0-3-2-6-4-7h-12zm2 10a2 2 0 110-4 2 2 0 010 4zm8 0a2 2 0 110-4 2 2 0 010 4z"/></svg>`,

    yorkshire: `<svg viewBox="0 0 40 40" fill="currentColor"><path d="M15 6c-2 0-3 1-4 3l-2 3c0 2 0 3 1 4-1 1-2 3-2 5v2c0 3 2 5 4 6v3c0 1 1 2 2 2h12c1 0 2-1 2-2v-10c0-4-2-7-5-9l-1-4c-1-2-2-3-4-3h-3zm1 16a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm8 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>`,

    boxer: `<svg viewBox="0 0 40 40" fill="currentColor"><path d="M12 7c-2 0-3 2-4 4l-1 4c0 2 1 4 2 4v4c0 4 3 7 6 8v2c0 1 1 2 2 2h6c1 0 2-1 2-2v-2c3-1 6-4 6-8v-4c1 0 2-2 2-4l-1-4c-1-2-2-4-4-4-2 0-3 1-4 3h-4c-1-2-2-3-4-3h-4zm4 13a2 2 0 110-4 2 2 0 010 4zm8 0a2 2 0 110-4 2 2 0 010 4zm-5 3h2v2c0 1-1 1-1 1s-1 0-1-1v-2z"/></svg>`,

    dalmata: `<svg viewBox="0 0 40 40" fill="currentColor"><path d="M14 6c-2 0-4 2-5 4l-1 3c0 2 1 4 2 5v4c0 4 3 7 5 8v2c0 1 1 2 2 2h6c1 0 2-1 2-2v-2c2-1 5-4 5-8v-4c1-1 2-3 2-5l-1-3c-1-2-3-4-5-4-1 0-2 1-3 2h-4c-1-1-2-2-3-2h-2z"/><circle cx="15" cy="13" r="1.5" fill="var(--bg-card)"/><circle cx="22" cy="15" r="1" fill="var(--bg-card)"/><circle cx="18" cy="22" r="1.2" fill="var(--bg-card)"/><circle cx="25" cy="20" r="1" fill="var(--bg-card)"/><circle cx="16" cy="19" r="2" /><circle cx="24" cy="19" r="2"/></svg>`,
};

// Breed name normalization map (Spanish common names → icon key)
const BREED_MAP = {
    'labrador': 'labrador',
    'golden': 'golden',
    'golden retriever': 'golden',
    'pastor': 'pastor',
    'pastor alemán': 'pastor',
    'pastor aleman': 'pastor',
    'pastor belga': 'pastor',
    'pastor australiano': 'pastor',
    'border collie': 'pastor',
    'bulldog': 'bulldog',
    'bulldog francés': 'bulldog',
    'bulldog frances': 'bulldog',
    'bulldog inglés': 'bulldog',
    'bulldog ingles': 'bulldog',
    'pug': 'bulldog',
    'husky': 'husky',
    'husky siberiano': 'husky',
    'malamute': 'husky',
    'akita': 'husky',
    'shiba': 'husky',
    'beagle': 'beagle',
    'basset': 'beagle',
    'chihuahua': 'chihuahua',
    'pomerania': 'chihuahua',
    'caniche': 'caniche',
    'poodle': 'caniche',
    'bichón': 'caniche',
    'bichon': 'caniche',
    'maltés': 'caniche',
    'maltes': 'caniche',
    'yorkshire': 'yorkshire',
    'yorkie': 'yorkshire',
    'terrier': 'yorkshire',
    'schnauzer': 'yorkshire',
    'boxer': 'boxer',
    'rottweiler': 'boxer',
    'dóberman': 'boxer',
    'doberman': 'boxer',
    'dálmata': 'dalmata',
    'dalmata': 'dalmata',
};

export function getBreedKey(breed) {
    if (!breed) return 'default';
    const normalized = breed.toLowerCase().trim();

    // Try exact match
    if (BREED_MAP[normalized]) return BREED_MAP[normalized];

    // Try partial match
    for (const [key, value] of Object.entries(BREED_MAP)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return value;
        }
    }

    return 'default';
}

export function getBreedIcon(breed) {
    const key = getBreedKey(breed);
    return BREED_ICONS[key] || BREED_ICONS.default;
}

// React component for inline SVG breed icon
export function BreedIconSVG({ breed, size = 24, color = 'currentColor', className = '' }) {
    const svgStr = getBreedIcon(breed);
    return (
        <span
            className={className}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: size,
                height: size,
                color,
            }}
            dangerouslySetInnerHTML={{ __html: svgStr }}
        />
    );
}

// Dog avatar component with breed icon and color
export function DogAvatar({ breed, dogId, size = 52, className = '' }) {
    const color = getDogColor(dogId);
    const svgStr = getBreedIcon(breed);

    return (
        <div
            className={className}
            style={{
                width: size,
                height: size,
                borderRadius: 12,
                background: color.bg,
                border: `2px solid ${color.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: color.text,
                flexShrink: 0,
            }}
            dangerouslySetInnerHTML={{ __html: svgStr }}
        />
    );
}
