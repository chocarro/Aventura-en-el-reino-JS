
import { Producto } from '../classes/Producto.js'; 
import { RAREZA, TIPO_PRODUCTO } from '../utils/constants.js';
import { getRandomElement } from '../utils/utils.js';

const LISTA_PRODUCTOS = [
    // Consumibles
    new Producto("Manzana Curativa", "imagenes/Mercado/Manzana.png", 400, RAREZA.COMUN, TIPO_PRODUCTO.CONSUMIBLE, 10), 
    new Producto("Poción de Vida", "imagenes/Mercado/Pocion.png", 1200, RAREZA.RARA, TIPO_PRODUCTO.CONSUMIBLE, 30), 
    
    // Armas
    new Producto("Daga de Hierro", "imagenes/Mercado/daga.png", 900, RAREZA.COMUN, TIPO_PRODUCTO.ARMA, 5), 
    new Producto("Hacha de Guerra", "imagenes/Mercado/hacha.png", 2500, RAREZA.RARA, TIPO_PRODUCTO.ARMA, 12), 
    new Producto("Espada Épica", "imagenes/Mercado/espada.png", 5500, RAREZA.EPICA, TIPO_PRODUCTO.ARMA, 25), 
    
    // Armaduras
    new Producto("Armadura de Cuero", "imagenes/Mercado/armadura.png", 1500, RAREZA.COMUN, TIPO_PRODUCTO.ARMADURA, 3), 
    new Producto("Escudo Templario", "imagenes/Mercado/escudo.png", 4000, RAREZA.RARA, TIPO_PRODUCTO.ARMADURA, 8), 
    new Producto("Cota de Malla Legendaria", "imagenes/Mercado/malla.png", 9000, RAREZA.LEGENDARIA, TIPO_PRODUCTO.ARMADURA, 15), 
];

export function obtenerListaProductos() {
    return [...LISTA_PRODUCTOS];
}

/**
 * @description Filtra los productos por rareza.
 */
export function filtrarProductos(rareza) {
    return LISTA_PRODUCTOS.filter(product => product.rarity === rareza);
}

/**
 * @description Aplica un descuento a productos de un tipo o rareza específica.
 */
export function aplicarDescuento(filterValue, discountPercent) {
    return LISTA_PRODUCTOS.map(product => {
        if (product.rarity === filterValue || product.type === filterValue) {
            return product.applyDiscount(discountPercent); 
        }
        return product;
    });
}

/**
 * @description Aplica un descuento a productos de una rareza elegida aleatoriamente.
 */
export function aplicarDescuentoAleatorio(discountPercent) {
    const rarezaAleatoria = getRandomElement(Object.values(RAREZA)); 
    
    const productosDescontados = LISTA_PRODUCTOS.map(product => {
        if (product.rarity === rarezaAleatoria) {
            return product.applyDiscount(discountPercent); 
        }
        return product;
    });

    return { products: productosDescontados, rarity: rarezaAleatoria };
}

/**
 * @description Busca un producto por nombre.
 */
export function buscarProducto(name) {
    const searchName = name.toLowerCase();
    return LISTA_PRODUCTOS.find(product => product.name.toLowerCase().includes(searchName));
}