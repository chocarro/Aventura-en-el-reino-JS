import { formatCurrency } from '../utils/utils.js';

export default class Producto {
    constructor(nombre, imagen, precio, rareza, tipo, bonus) {
        this.nombre = nombre;
        this.imagen = imagen;
        this.precio = precio;
        this.rareza = rareza;
        this.tipo = tipo; 
        this.bonus = bonus;
    }

    /**
     * Formatea el precio (ej. 950 a 9,50€). (Requisito funcional)
     * @returns {string} Precio formateado.
     */
    formatearAtributos() {
        return formatCurrency(this.precio);
    }

    /**
     * Devuelve un clon con el precio modificado. (Requisito funcional)
     * @param {number} valor - Valor a descontar (ej. 10 para 10%).
     * @returns {Producto} Nuevo producto con el precio descontado.
     */
    aplicarUnDescuento(valor) {
        const nuevoPrecio = this.precio - (this.precio * valor / 100);

        const clon = new Producto(
            this.nombre,
            this.imagen,
            Math.round(nuevoPrecio), // Redondeamos el precio
            this.rareza,
            this.tipo,
            this.bonus
        );
        return clon;
    }
}