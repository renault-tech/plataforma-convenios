import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getContrastYIQ(hexcolor: string) {
    hexcolor = hexcolor.replace("#", "")
    const r = parseInt(hexcolor.slice(0, 2), 16)
    const g = parseInt(hexcolor.slice(2, 4), 16)
    const b = parseInt(hexcolor.slice(4, 6), 16)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
    return (yiq >= 128) ? 'black' : 'white'
}
