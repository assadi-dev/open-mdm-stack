
export const log = (context: string, message: string) => {
    console.log(`[${context}] ${message}`)
}

export const logError = (context: string, message: string) => {
    console.error(`[${context}] ${message}`)
}

export const logWarn = (context: string, message: string) => {
    console.warn(`[${context}] ${message}`)
}

export const logInfo = (context: string, message: string) => {
    console.info(`[${context}] ${message}`)
}

export const logDebug = (context: string, message: string) => {
    console.debug(`[${context}] ${message}`)
}