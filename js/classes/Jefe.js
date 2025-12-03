
import { Enemigo } from './Enemigo.js'; 
import { MULTIPLICADOR_JEFE_DEFAULT } from '../utils/constants.js';

/**
 * @class Jefe
 * @augments Enemigo
 * @description Un enemigo especial que hereda de Enemigo.
 */
export class Jefe extends Enemigo {
    /**
     * @param {string} name 
     * @param {string} avatar 
     * @param {number} attackLevel 
     * @param {number} hitPoints 
     * @param {number} damageMultiplier - Multiplicador de daño (por defecto 1.2).
     */
    constructor(name, avatar, attackLevel, hitPoints, damageMultiplier = MULTIPLICADOR_JEFE_DEFAULT) {
        super(name, avatar, attackLevel, hitPoints);
        this.damageMultiplier = damageMultiplier; 
    }
}