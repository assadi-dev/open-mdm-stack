// Les chemins de l'API backend. Le QR code se demande en SVG : l'API répond avec le document, pas du JSON.
export const ENROLLMENT_ENDPOINTS = {
    qrCode: "enrollment/display-provisioning?format=svg",
}
