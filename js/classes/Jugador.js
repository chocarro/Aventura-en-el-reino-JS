
import { Producto } from './Producto.js';
import { TIPO_PRODUCTO } from '../utils/constants.js';
import { deepClone } from '../utils/utils.js';

/**
 * @class Jugador
 * @description Representa al jugador principal del juego.
 */
export class Jugador {
    /**
     * @param {string} name 
     * @param {string} avatar 
     * @param {number} initialLife 
     */
    constructor(name, avatar, initialLife = 100) {
        this.name = name; 
        this.avatar = avatar; 
        this.points = 0; 
        this.inventory = []; // Array de productos clonados
        this.maxLife = initialLife; 
        this.currentLife = initialLife; 
    }

    /**
     * @description Añade un objeto al inventario (Clona el producto antes).
     * @param {Producto} product - El producto a añadir.
     */
    addItemToInventory(product) {
        const productClone = deepClone(product); 
        this.inventory.push(productClone);
    }

    /**
     * @description Actualiza la puntuación del jugador.
     * @param {number} score - Puntos a sumar.
     */
    addPoints(score) {
        this.points += score;
    }

    /**
     * @description Calcula el ataque total sumando los bonus de las Armas.
     */
    get totalAttack() {
        return this.inventory
            .filter(item => item.type === TIPO_PRODUCTO.ARMA)
            .reduce((total, item) => total + item.bonus, 0);
    }

    /**
     * @description Calcula la defensa total sumando los bonus de las Armaduras.
     */
    get totalDefense() {
        return this.inventory
            .filter(item => item.type === TIPO_PRODUCTO.ARMADURA)
            .reduce((total, item) => total + item.bonus, 0);
    }

    /**
     * @description Calcula la vida total (base + bonus de Consumibles).
     */
    get totalLife() {
        const consumableBonus = this.inventory
            .filter(item => item.type === TIPO_PRODUCTO.CONSUMIBLE)
            .reduce((total, item) => total + item.bonus, 0);
        
        return this.maxLife + consumableBonus; 
    }
}