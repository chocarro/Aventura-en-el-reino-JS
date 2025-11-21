export function distinguirJugador(puntuacion, umbral = 500) {
    if (puntuacion > umbral) {
        return "Veterano";
    } else {
        return "Novato";
    }
}