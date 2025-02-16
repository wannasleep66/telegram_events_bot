export function parseEventDate(input: string): Date | null {
    const regex = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/
    const match = input.match(regex)
    if (match) {
        const day = parseInt(match[1], 10)
        const month = parseInt(match[2], 10) - 1 // Месяцы в JavaScript начинаются с 0
        const year = parseInt(match[3], 10)
        const hours = parseInt(match[4], 10)
        const minutes = parseInt(match[5], 10)

        return new Date(year, month, day, hours, minutes)
    }
    return null
}
