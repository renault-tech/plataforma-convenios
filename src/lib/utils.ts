import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getContrastYIQ(hexcolor: string) {
    if (!hexcolor) return 'black'
    hexcolor = hexcolor.replace("#", "")
    if (hexcolor.length === 3) hexcolor = hexcolor.split('').map(c => c + c).join('')

    // Fallback for invalid
    if (hexcolor.length !== 6) return 'black'

    const r = parseInt(hexcolor.slice(0, 2), 16)
    const g = parseInt(hexcolor.slice(2, 4), 16)
    const b = parseInt(hexcolor.slice(4, 6), 16)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
    // Standard threshold is 128. Returns black for light bg, white for dark bg.
    return (yiq >= 128) ? 'black' : 'white'
}

// Darken a hex color by amount (0-100)
export function darkenColor(hex: string, amount: number) {
    let color = hex.replace("#", "");
    if (color.length === 3) color = color.split('').map(c => c + c).join('');

    // Parse
    let r = parseInt(color.substring(0, 2), 16);
    let g = parseInt(color.substring(2, 4), 16);
    let b = parseInt(color.substring(4, 6), 16);

    // Darken
    r = Math.floor(r * (1 - amount / 100));
    g = Math.floor(g * (1 - amount / 100));
    b = Math.floor(b * (1 - amount / 100));

    // Clamp
    r = r < 0 ? 0 : r;
    g = g < 0 ? 0 : g;
    b = b < 0 ? 0 : b;

    // To Hex
    const RR = (r.toString(16).length === 1) ? "0" + r.toString(16) : r.toString(16);
    const GG = (g.toString(16).length === 1) ? "0" + g.toString(16) : g.toString(16);
    const BB = (b.toString(16).length === 1) ? "0" + b.toString(16) : b.toString(16);

    return "#" + RR + GG + BB;
}

// Returns a safe color to use as TEXT on a WHITE background
export function getLegibleTextColor(hex: string) {
    if (!hex) return 'inherit'

    // Check if the color is light (would return 'black' text if used as bg)
    const contrast = getContrastYIQ(hex);

    if (contrast === 'black') {
        // It's a light color. Darken it to make it readable on white.
        return darkenColor(hex, 45);
    }

    return hex;
}
