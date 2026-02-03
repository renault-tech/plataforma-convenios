/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.0 formula
 */
function getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
        const val = c / 255
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null
}

/**
 * Determine if text should be black or white based on background color
 * Returns 'black' or 'white'
 */
export function getContrastColor(backgroundColor: string): 'black' | 'white' {
    // Handle different color formats
    let rgb: { r: number; g: number; b: number } | null = null

    if (backgroundColor.startsWith('#')) {
        rgb = hexToRgb(backgroundColor)
    } else if (backgroundColor.startsWith('rgb')) {
        // Extract RGB values from rgb() or rgba()
        const match = backgroundColor.match(/\d+/g)
        if (match && match.length >= 3) {
            rgb = {
                r: parseInt(match[0]),
                g: parseInt(match[1]),
                b: parseInt(match[2])
            }
        }
    }

    if (!rgb) {
        // Default to white if we can't parse the color
        return 'white'
    }

    const luminance = getLuminance(rgb.r, rgb.g, rgb.b)

    // WCAG recommends 0.5 as threshold
    // If luminance > 0.5, background is light, use black text
    // If luminance <= 0.5, background is dark, use white text
    return luminance > 0.5 ? 'black' : 'white'
}

/**
 * Get text color class for Tailwind based on background color
 */
export function getContrastTextClass(backgroundColor: string): string {
    const color = getContrastColor(backgroundColor)
    return color === 'black' ? 'text-slate-900' : 'text-white'
}
