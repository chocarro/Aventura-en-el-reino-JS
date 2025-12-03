
/**
 * @description Crea una copia profunda de un objeto.
 * @param {Object} obj - El objeto a clonar.
 * @returns {Object} Una nueva instancia del objeto.
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * @description Formatea un número (precio en céntimos) a formato moneda.
 * @param {number} amount - El precio numérico en céntimos.
 * @returns {string} El precio formateado (ej: "9,50€").
 */
export function formatPrice(amount) {
    const euros = (amount / 100).toFixed(2).replace('.', ',');
    return `${euros}€`;
}

/**
 * @description Retorna un elemento aleatorio de un array.
 * @param {Array} array - El array de entrada.
 * @returns {*} Un elemento aleatorio del array.
 */
export function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}