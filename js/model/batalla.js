export function combate(enemigo, jugador) {
    // Es importante clonar al enemigo para que sus PV no afecten
    // a otros combates si el jugador pierde.
    const enemigoActual = { ...enemigo }; 
    const jugadorAtaque = jugador.obtenerAtaqueTotal();
    const jugadorDefensa = jugador.obtenerDefensaTotal();
    const jugadorVida = jugador.obtenerVidaTotal(); // Vida inicial del combate
    
    // La lógica de turnos se repite hasta que la vida de uno llegue a 0[cite: 99].
    while (jugadorVida > 0 && enemigoActual.puntosVida > 0) {
        
        enemigoActual.puntosVida -= jugadorAtaque;
       
        if (enemigoActual.puntosVida <= 0) {
            // El jugador gana
            break; 
        }
 const danoEnemigo = enemigoActual.nivelAtaque * (enemigoActual instanceof Jefe ? enemigoActual.multiplicadorDano : 1);
        const danoRecibido = Math.max(0, danoEnemigo - jugadorDefensa);
    }

    // CÁLCULO DE RESULTADOS
    if (jugadorVida > 0) {
        const ganador = jugador.nombre;
        
        let puntosObtenidos = 100 + enemigo.nivelAtaque;
        
        if (enemigo instanceof Jefe) {
            puntosObtenidos *= enemigo.multiplicadorDano;
        }

        jugador.sumarPuntos(Math.round(puntosObtenidos)); // Actualizar puntos del jugador
        return { ganador: ganador, puntos: Math.round(puntosObtenidos) };
    } else {
        // El jugador pierde
        return { ganador: enemigo.nombre, puntos: 0 }; // Retorna 0 puntos si pierde [cite: 98]
    }
}