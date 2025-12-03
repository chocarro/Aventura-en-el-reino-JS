// js/classes/Producto.js

import { TIPO_PRODUCTO } from '../utils/constants.js';
import { deepClone, formatPrice } from '../utils/utils.js';

/**
 * @class Producto
 * @description Representa un objeto que el jugador puede comprar.
 */
export class Producto {
    //
    constructor(name, image, price, rarity, type, bonus) {
        this.name = name;
        this.image = image;
        this.price = price; // En céntimos
        this.rarity = rarity;
        this.type = type; 
        this.bonus = bonus; // Se suma a Ataque, Defensa o Vida
    }

    /**
     * @description Devuelve el precio formateado (Método formatear atributos).
     */
    get precioFormateado() {
        return formatPrice(this.price);
    }

    /**
     * @description Aplica un descuento y devuelve una COPIA (clon) del producto.
     */
    applyDiscount(discountPercent) {
        const newProductData = deepClone(this);
        const newPrice = newProductData.price * (1 - discountPercent / 100);
        newProductData.price = Math.round(newPrice);
        
        return new Producto(
            newProductData.name,
            newProductData.image,
            newProductData.price,
            newProductData.rarity,
            newProductData.type,
            newProductData.bonus
        );
    }
}