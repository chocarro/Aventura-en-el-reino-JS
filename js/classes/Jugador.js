export default class Jugador {
    constructor(nombre, avatar, vidaInicial = 100) {
        this.nombre = nombre;
        this.avatar = avatar;
        this.puntos = 0;
        this.inventario = [];
        this.vida = vidaInicial;
        this.vidaMaxima = vidaInicial;
    }

    añadirObjetoAlInventario(producto) {
        // Asumimos que el producto ya fue clonado en handleProductAction
        this.inventario.push(producto);
    }

    sumarPuntos(puntosGanados) {
        this.puntos += puntosGanados;
    }
    
    obtenerAtaqueTotal() {
        return this.inventario
            .filter(item => item.tipo === 'Arma')
            .reduce((total, item) => total + item.bonus, 0);
    }

    obtenerDefensaTotal() {
        return this.inventario
            .filter(item => item.tipo === 'Armadura')
            .reduce((total, item) => total + item.bonus, 0);
    }
    
    obtenerVidaTotal() {
        // Calcula la vida máxima potencial sumando la base y los consumibles
        const bonusConsumibles = this.inventario
            .filter(item => item.tipo === 'Consumible')
            .reduce((total, item) => total + item.bonus, 0);
        
        return this.vidaMaxima + bonusConsumibles;
    }
    
    /**
     * Restaura la vida del jugador a su máximo potencial (base + consumibles).
     */
    curarVida() {
        this.vida = this.obtenerVidaTotal();
    }
}