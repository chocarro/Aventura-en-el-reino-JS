// Archivo: js/classes/Enemigo.js
export class Enemigo {
    constructor(nombre, avatar, nivelAtaque, puntosVida) {
        this.nombre = nombre;
        this.avatar = avatar;
        this.nivelAtaque = nivelAtaque;
        this.puntosVida = puntosVida;
        this.vidaInicial = puntosVida; 
    }
}