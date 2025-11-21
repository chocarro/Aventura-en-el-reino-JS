import { Enemigo } from './Enemigo.js'; // Importamos la clase padre
import { MULTIPLICADOR_JEFE_DEFAULT } from '../utils/constants.js';

export class Jefe extends Enemigo {
    constructor(nombre, avatar, nivelAtaque, puntosVida, multiplicadorDano = MULTIPLICADOR_JEFE_DEFAULT) {
        super(nombre, avatar, nivelAtaque, puntosVida);
        this.multiplicadorDano = multiplicadorDano;
    }
}