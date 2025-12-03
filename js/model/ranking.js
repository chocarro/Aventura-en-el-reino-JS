
import { UMBRAL_VETERANO } from '../utils/constants.js'; 

/**
 * [cite_start]@description Distingue si un jugador es "Veterano" o "Novato"[cite: 112].
 * @param {number} score - Puntuación total del jugador.
 * [cite_start]@param {number} [threshold=UMBRAL_VETERANO] - Umbral (con argumento por defecto)[cite: 111].
 * @returns {('Veterano' | 'Novato')} El rango del jugador.
 */
export function distinguirJugador(score, threshold = UMBRAL_VETERANO) { 
    if (score > threshold) {
        return 'Veterano';
    } else {
        return 'Novato';
    }
}