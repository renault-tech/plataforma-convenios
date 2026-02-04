import { toPng } from 'html-to-image'

export const generateDashboardSnapshot = async (elementId: string): Promise<string | null> => {
    const node = document.getElementById(elementId)
    if (!node) return null

    try {
        const dataUrl = await toPng(node, {
            quality: 0.95,
            backgroundColor: '#ffffff',
            style: {
                transform: 'scale(1)', // Avoid scaling issues
            }
        })
        return dataUrl
    } catch (error) {
        console.error('Error generating snapshot:', error)
        return null
    }
}
