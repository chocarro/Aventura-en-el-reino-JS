// 1. IMPORTACIONES (Rutas corregidas según tu captura de pantalla)
import Jugador from './classes/Jugador.js';
import { Enemigo } from './classes/Enemigo.js'; 
import { Jefe } from './classes/Jefe.js'; 
import Producto from './classes/Producto.js';

// NOTA: Usamos la carpeta 'model' que vi en tu captura
import { combate } from './model/batalla.js';
import { distinguirJugador, UMBRAL_VETERANO } from './model/ranking.js';
import * as Mercado from './model/mercado.js';

import { cambiarEscena, obtenerElementoAleatorio, clonarObjeto } from './utils/utils.js';
import { RAREZA } from './utils/constants.js';

// 2. VARIABLES GLOBALES
let jugadorActual = null;
let productosDelMercado = []; 
let enemigosRestantes = [];

// 3. FUNCIONES DE INICIO Y UI
function inicializarJuego() {
    // Crear jugador
    jugadorActual = new Jugador("Cazador", "img/avatar_default.png");
    
    // Cargar enemigos base
    enemigosRestantes = [
        new Enemigo("Goblin", "img/goblin.png", 8, 30),
        new Enemigo("Lobo", "img/lobo.png", 9, 35),
        new Enemigo("Bandido", "img/bandido.png", 12, 45),
        new Jefe("Dragón Jefe", "img/dragon.png", 20, 100)
    ];
    
    // Cargar mercado base (sin descuentos aún)
    productosDelMercado = Mercado.getListaProductosOriginal(); 
    
    // Mostrar Escena 1
    actualizarVistaJugador('scene-start');
    cambiarEscena('scene-start'); 
}

function actualizarVistaJugador(sceneId) {
    const ataque = jugadorActual.obtenerAtaqueTotal();
    const defensa = jugadorActual.obtenerDefensaTotal();
    const vida = jugadorActual.obtenerVidaTotal();

    const statsContainer = document.querySelector(`#${sceneId} .stats-grid`);
    if (statsContainer) {
        statsContainer.querySelector('[data-stat="attack"]').textContent = ataque;
        statsContainer.querySelector('[data-stat="defense"]').textContent = defensa;
        statsContainer.querySelector('[data-stat="life"]').textContent = jugadorActual.vida;
        statsContainer.querySelector('[data-stat="points"]').textContent = jugadorActual.puntos;
    }
    
    // Actualizar visualización específica de la escena 3
    if (sceneId === 'scene-updated-stats') {
        const totalLifeSpan = document.querySelector('#updated-stats-display [data-stat="life"]');
        if (totalLifeSpan) totalLifeSpan.textContent = vida; 
    }
}

// 4. FUNCIONES DE LÓGICA DEL JUEGO

// --- ESTA ES LA FUNCIÓN QUE HACE QUE EL BOTÓN FUNCIONE ---
function handleStartAdventure() {
    console.log("¡Botón 'Comenzar Aventura' activado!");

    // PASO 1: FORZAR EL CAMBIO DE ESCENA INMEDIATAMENTE
    // Esto hace que el usuario sienta que el botón funciona al instante.
    cambiarEscena('scene-market');

    // PASO 2: Lógica interna (Descuentos)
    try {
        if (typeof RAREZA !== 'undefined' && typeof obtenerElementoAleatorio === 'function') {
            const rarezaAleatoria = obtenerElementoAleatorio(Object.values(RAREZA));
            console.log("Aplicando descuento a rareza:", rarezaAleatoria);
            productosDelMercado = Mercado.aplicarDescuentoPorCriterio(rarezaAleatoria, 20);
        } else {
            throw new Error("Faltan constantes o utilidades.");
        }
        // Renderizar productos con descuento
        renderizarProductos(productosDelMercado);

    } catch (error) {
        console.error("Error menor en lógica de mercado:", error);
        // Si falla el descuento, cargamos la lista normal para que el juego siga
        productosDelMercado = Mercado.getListaProductosOriginal();
        renderizarProductos(productosDelMercado);
    }
}

function handleProductAction(event) {
    const productElement = event.target.closest('.product-item');
    if (!productElement) return;

    const productId = productElement.getAttribute('data-product-id');
    // Buscamos el producto en la lista actual
    const productoSeleccionado = productosDelMercado.find(p => p.nombre === productId);
    
    if (productoSeleccionado) {
        // IMPORTANTE: Clonamos el objeto antes de añadirlo (Requisito del proyecto)
        const productoClonado = clonarObjeto(productoSeleccionado);
        jugadorActual.añadirObjetoAlInventario(productoClonado);

        event.target.textContent = "¡Comprado!";
        event.target.disabled = true;
        event.target.style.backgroundColor = "#ccc"; // Feedback visual simple
    }
}

function iniciarCombate(enemigoSeleccionado) {
    cambiarEscena('scene-battle');
    
    // Cargar datos visuales
    const imgEnemigo = document.getElementById('battle-enemy-avatar');
    if(imgEnemigo) imgEnemigo.src = enemigoSeleccionado.avatar;
    
    document.getElementById('battle-enemy-name').textContent = enemigoSeleccionado.nombre;

    // Lógica de Batalla
    const resultado = combate(enemigoSeleccionado, jugadorActual);
    
    // Mostrar Log
    const logContainer = document.querySelector('.combat-log');
    if (logContainer) {
        // Limpiamos log anterior y mostramos el nuevo
        logContainer.innerHTML = `<h4>Resultado del Combate:</h4>`;
        
        // Añadimos detalles del log si la función combate devuelve un array 'log'
        if (resultado.log && Array.isArray(resultado.log)) {
            resultado.log.forEach(linea => {
                logContainer.innerHTML += `<p style="margin: 5px 0; font-size: 0.9em;">${linea}</p>`;
            });
        }
        
        logContainer.innerHTML += `<p><strong>Ganador: ${resultado.ganador}. Puntos: ${resultado.puntos}</strong></p>`;
    }
    
    // Actualizar vida en UI
    document.getElementById('battle-player-life').textContent = jugadorActual.vida;

    // Si ganamos, eliminar enemigo de la lista
    if (resultado.ganador === jugadorActual.nombre) {
        enemigosRestantes = enemigosRestantes.filter(e => e.nombre !== enemigoSeleccionado.nombre);
    }
}

function continuarBatallaOFinalizar() {
    if (jugadorActual.vida <= 0 || enemigosRestantes.length === 0) {
        handleEndGame();
    } else {
        jugadorActual.curarVida(); 
        renderizarEnemigos();
        cambiarEscena('scene-enemies');
    }
}

function handleEndGame() {
    cambiarEscena('scene-final');
    const rango = distinguirJugador(jugadorActual.puntos, UMBRAL_VETERANO);
    document.getElementById('final-rank').textContent = `Rango: ${rango}`;
    document.getElementById('final-score').textContent = jugadorActual.puntos;
}

// 5. RENDERS AUXILIARES
function renderizarProductos(productos) {
    const listContainer = document.getElementById('product-list');
    if (!listContainer) return;
    listContainer.innerHTML = ''; 

    productos.forEach(producto => {
        const productElement = document.createElement('div');
        productElement.classList.add('product-item');
        productElement.setAttribute('data-product-id', producto.nombre);
        
        const precioFormateado = producto.formatearAtributos();
        
        productElement.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}" style="width:80px; height:80px; object-fit:contain;">
            <p><strong>${producto.nombre}</strong></p>
            <p style="font-size:0.8em;">+${producto.bonus} ${producto.tipo}</p>
            <p>${precioFormateado}</p>
            <button class="btn-add-item" style="cursor:pointer; background:gold; border:1px solid orange; padding:5px;">Añadir</button>
        `;
        listContainer.appendChild(productElement);
    });
}

function renderizarEnemigos() {
    const listContainer = document.getElementById('enemy-selection-list');
    if (!listContainer) return;
    listContainer.innerHTML = ''; 
    
    if (enemigosRestantes.length === 0) {
        listContainer.innerHTML = '<p>¡Todos los enemigos derrotados!</p>';
        return;
    }

    enemigosRestantes.forEach(enemigo => {
        const enemyElement = document.createElement('div');
        enemyElement.classList.add('enemy-item');
        
        enemyElement.innerHTML = `
            <img src="${enemigo.avatar}" alt="${enemigo.nombre}" style="width:100px;">
            <p><strong>${enemigo.nombre}</strong></p>
            <p>Ataque: ${enemigo.nivelAtaque}</p>
            <button class="btn-fight-enemy" data-enemy-name="${enemigo.nombre}" style="cursor:pointer; background:red; color:white; padding:5px;">Luchar</button>
        `;
        listContainer.appendChild(enemyElement);
    });
}

// 6. EL CEREBRO: ESCUCHADOR DE EVENTOS
// Aquí es donde se crea el "enlace" mágico.
document.addEventListener('DOMContentLoaded', () => {
    console.log("Juego cargando...");
    inicializarJuego();

    // --- CONEXIÓN DEL BOTÓN DE INICIO ---
    const btnInicio = document.getElementById('btn-start-adventure');
    if (btnInicio) {
        // Aquí le decimos: "Cuando te hagan clic, ejecuta la función handleStartAdventure"
        btnInicio.addEventListener('click', handleStartAdventure);
    } else {
        console.error("Error: No encuentro el botón 'btn-start-adventure' en el HTML.");
    }

    // --- RESTO DE EVENTOS ---
    
    // Botón continuar del mercado a stats
    const btnMarketStats = document.getElementById('btn-go-to-stats');
    if (btnMarketStats) {
        btnMarketStats.addEventListener('click', () => {
            actualizarVistaJugador('scene-updated-stats');
            cambiarEscena('scene-updated-stats');
        });
    }

    // Botón ir a enemigos
    const btnGoEnemies = document.getElementById('btn-go-to-enemies');
    if (btnGoEnemies) {
        btnGoEnemies.addEventListener('click', () => {
            renderizarEnemigos();
            cambiarEscena('scene-enemies');
        });
    }

    // Botón reiniciar
    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) btnRestart.addEventListener('click', inicializarJuego);
    
    // Botón continuar batalla
    const btnContBattle = document.getElementById('btn-continue-battle');
    if (btnContBattle) btnContBattle.addEventListener('click', continuarBatallaOFinalizar);

    // Delegación de eventos para PRODUCTOS (botones dinámicos)
    const productList = document.getElementById('product-list');
    if (productList) {
        productList.addEventListener('click', (event) => {
            if (event.target.classList.contains('btn-add-item')) {
                handleProductAction(event);
            }
        });
    }

    // Delegación de eventos para ENEMIGOS (botones dinámicos)
    const enemyList = document.getElementById('enemy-selection-list');
    if (enemyList) {
        enemyList.addEventListener('click', (event) => {
            if (event.target.classList.contains('btn-fight-enemy')) {
                const enemyName = event.target.getAttribute('data-enemy-name');
                const enemigoEncontrado = enemigosRestantes.find(e => e.nombre === enemyName);
                if (enemigoEncontrado) {
                    iniciarCombate(enemigoEncontrado);
                }
            }
        });
    }
});