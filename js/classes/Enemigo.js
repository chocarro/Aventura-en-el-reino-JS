
/**
 * @class Enemigo
 * @description Clase base para todos los enemigos.
 */
export class Enemigo {
    /**
     * @param {string} name 
     * @param {string} avatar 
     * @param {number} attackLevel - Nivel de ataque.
     * @param {number} hitPoints - Puntos de vida (HP).
     */
    constructor(name, avatar, attackLevel, hitPoints) {
        this.name = name; 
        this.avatar = avatar; 
        this.attackLevel = attackLevel; 
        this.currentLife = hitPoints; 
        this.maxLife = hitPoints; 
    }
}