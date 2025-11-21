import Producto from '../classes/Producto.js';
import { RAREZA, TIPO_PRODUCTO } from '../utils/constants.js';

const LISTA_PRODUCTOS_ORIGINAL = [
    // Propiedades: nombre, imagen, precio, rareza, tipo, bonus
    new Producto("Manzana", "img/manzana.png", 40, RAREZA.COMUN, TIPO_PRODUCTO.CONSUMIBLE, 10),
    new Producto("Armadura de Cuero", "img/armadura.png", 900, RAREZA.COMUN, TIPO_PRODUCTO.ARMADURA, 5),
    new Producto("Hacha de Combate", "img/hacha.png", 1500, RAREZA.RARA, TIPO_PRODUCTO.ARMA, 15),
    new Producto("Botas de Viaje", "img/botas.png", 300, RAREZA.COMUN, TIPO_PRODUCTO.ARMADURA, 2),
];

// 1. **Función esencial agregada:**
export function getListaProductosOriginal() {
    // Retorna una copia para evitar modificar el original
    return LISTA_PRODUCTOS_ORIGINAL.map(p => p); 
}

export function filtrarProductos(rareza) {
    return LISTA_PRODUCTOS_ORIGINAL.filter(p => p.rareza === rareza);
}

export function aplicarDescuentoPorCriterio(criterio, descuento) {
    // Usamos LISTA_PRODUCTOS_ORIGINAL para aplicar el descuento
    return LISTA_PRODUCTOS_ORIGINAL.map(producto => {
        if (producto.rareza === criterio || producto.tipo === criterio) {
            return producto.aplicarUnDescuento(descuento); 
        }
        return producto;
    });
}