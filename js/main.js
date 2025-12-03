// js/main.js

import { Jugador } from './classes/Jugador.js';
import { Enemigo } from './classes/Enemigo.js'; // Clase Base
import { Jefe } from './classes/Jefe.js'; // Clase que Hereda
import { combate } from './model/batalla.js';
import { obtenerListaProductos, aplicarDescuentoAleatorio } from './model/mercado.js';
import { distinguirJugador } from './model/ranking.js';
import { deepClone } from './utils/utils.js';
import { RAREZA, TIPO_PRODUCTO, UMBRAL_VETERANO } from './utils/constants.js';

// --- VARIABLES DE ESTADO GLOBALES ---
let jugador = null;
let productosDisponibles = [];
let productosEnCesta = []; // Contiene los productos seleccionados antes de comprar
let enemigosIniciales = [
    new Enemigo("Goblin", "imagenes/Personajes/goblin.png", 8, 50),
    new Enemigo("Lobo", "imagenes/Personajes/lobo.png", 9, 60),
    new Enemigo("Bandido", "imagenes/Personajes/bandido.png", 12, 80),
    new Jefe("Dragón", "imagenes/Personajes/dragon.png", 20, 150),
];
let enemigosRestantes = []; // Enemigos que quedan por luchar
let currentEnemy = null; // Enemigo activo en el combate

// --- MANEJO DEL DOM Y RENDERIZADO ---

/**
 * Oculta todas las secciones con la clase 'scene'.
 */
function hideAllScenes() {
    document.querySelectorAll('.scene').forEach(scene => {
        scene.classList.remove('active-scene');
        scene.classList.add('hidden-scene');
    });
}

/**
 * Muestra una escena específica.
 * @param {string} sceneId - El ID de la escena a mostrar (ej: 'escena-inicio').
 */
function showScene(sceneId) {
    hideAllScenes();
    const scene = document.getElementById(sceneId);
    if (scene) {
        scene.classList.remove('hidden-scene');
        scene.classList.add('active-scene');
    }
}

/**
 * Actualiza los stats del jugador en una tarjeta específica del DOM.
 * @param {string} prefix - Prefijo de los IDs a actualizar ('inicio-', 'estado-').
 * @param {boolean} fullLife - Si se debe mostrar la vida máxima calculada (para escena-estado).
 */
function renderPlayerStats(prefix, fullLife = false) {
    if (!jugador) return;

    // Obtener los valores calculados
    const currentAttack = jugador.totalAttack;
    const currentDefense = jugador.totalDefense;
    const currentLife = jugador.totalLife; // Vida máxima con bonus

    // Actualizar el DOM
    document.getElementById(`${prefix}ataque`).textContent = currentAttack;
    document.getElementById(`${prefix}defensa`).textContent = currentDefense;
    document.getElementById(`${prefix}puntos`).textContent = jugador.points;
    
    // Si es la escena de inicio/estado, muestra la vida máxima/total
    if (fullLife) {
        document.getElementById(`${prefix}vida-max`).textContent = currentLife;
    } else {
         document.getElementById(`${prefix}vida`).textContent = jugador.currentLife;
    }
}

/**
 * Renderiza el inventario (cesta) en la parte inferior de la pantalla.
 */
function renderInventory() {
    const cestaGrid = document.getElementById('cesta-grid');
    cestaGrid.innerHTML = ''; // Limpiar el inventario anterior
    
    if (jugador.inventory.length === 0) {
        cestaGrid.innerHTML = '<p id="cesta-vacia-msg">Inventario vacío.</p>';
        return;
    }
    
    // Mostrar solo las imágenes de los productos en el inventario
    jugador.inventory.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('inventory-item');
        itemDiv.innerHTML = `<img src="${item.image}" alt="${item.name}" title="${item.name} (${item.bonus})">`;
        cestaGrid.appendChild(itemDiv);
    });
}

/**
 * Renderiza todos los productos disponibles en la escena de mercado.
 */
function renderMercado() {
    const grid = document.getElementById('productos-grid');
    grid.innerHTML = ''; // Limpiar la cuadrícula

    productosDisponibles.forEach(product => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('product-item');
        itemDiv.setAttribute('data-name', product.name);
        itemDiv.setAttribute('data-id', product.name.replace(/\s/g, '-')); // Usar nombre como ID simple

        // Aplicar clase si el producto está actualmente seleccionado en la cesta
        if (productosEnCesta.some(item => item.name === product.name)) {
             itemDiv.classList.add('selected-product');
        }

        itemDiv.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <p><strong>${product.name}</strong> (${product.type})</p>
            <p class="product-bonus">Bonus: +${product.bonus}</p>
            <p class="product-price">Precio: ${product.precioFormateado}</p>
            <button class="btn-toggle-basket">${productosEnCesta.some(item => item.name === product.name) ? 'Retirar' : 'Añadir'}</button>
        `;

        grid.appendChild(itemDiv);
    });
}

/**
 * Renderiza la lista de enemigos disponibles para combatir.
 */
function renderEnemigos() {
    const grid = document.getElementById('enemigos-grid');
    grid.innerHTML = '';

    enemigosRestantes.forEach((enemy, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('enemy-item');
        itemDiv.setAttribute('data-index', index);
        
        itemDiv.innerHTML = `
            <img src="${enemy.avatar}" alt="${enemy.name}">
            <h3>${enemy.name} ${enemy instanceof Jefe ? '(JEFE)' : ''}</h3>
            <p>Ataque: ${enemy.attackLevel}</p>
            <p>Vida: ${enemy.maxLife}</p>
            <button class="btn-seleccionar-enemigo">Luchar</button>
        `;

        grid.appendChild(itemDiv);
    });
}

// --- FLUJO DE ESCENAS ---

function goToMercado() {
    // 1. Aplicar descuento aleatorio al cargar la escena
    const { products: discountedProducts, rarity: discountedRarity } = aplicarDescuentoAleatorio(15);
    productosDisponibles = discountedProducts;
    
    // 2. Actualizar mensaje de descuento
    document.getElementById('mercado-descuento-info').textContent = 
        `¡Descuento del 15% aplicado a la rareza ${discountedRarity}!`;

    // 3. Renderizar y mostrar
    renderMercado();
    showScene('escena-mercado');
}

function finishShopping() {
    // 1. Añadir productos de la cesta al inventario del jugador (aplicando clonación)
    productosEnCesta.forEach(product => {
        // Debemos buscar el producto actualizado de la lista de disponibles (con descuento)
        const productToBuy = productosDisponibles.find(p => p.name === product.name);
        if (productToBuy) {
            jugador.addItemToInventory(productToBuy); // La clase Jugador ya se encarga de clonar
        }
    });
    productosEnCesta = []; // Vaciar la cesta temporal

    // 2. Renderizar stats actualizadas y mostrar
    renderPlayerStats('estado-', true);
    renderInventory();
    showScene('escena-estado');
}

function goToEnemigos() {
    // 1. Inicializar/refrescar la lista de enemigos restantes (clonación para resetear HP)
    if (enemigosRestantes.length === 0) {
        enemigosRestantes = enemigosIniciales.map(enemy => deepClone(enemy)); 
    }
    
    // 2. Renderizar y mostrar
    renderEnemigos();
    showScene('escena-enemigos');
}

function goToBatalla(enemyIndex) {
    // 1. Obtener el enemigo a combatir
    const currentEnemy = enemigosRestantes[enemyIndex];

    // **COMPROBACIÓN DE SEGURIDAD CONTRA TypeError: Cannot read properties of null**
    if (!currentEnemy) {
        console.error("Error: Enemigo no válido o no encontrado. Volviendo a la selección.");
        // Si no hay enemigo válido (ej: índice fuera de rango), regresamos a la selección.
        goToEnemigos(); 
        return; 
    }

    // 2. Obtener elementos DOM para la animación
    const playerAvatar = document.getElementById('batalla-player-avatar');
    const enemyAvatar = document.getElementById('batalla-enemy-avatar');

    // --- Lógica de la Animación de Entrada (Requisito de Diseño) ---
    // a) Establecer posición inicial fuera de pantalla (para forzar la animación CSS)
    playerAvatar.classList.add('player-initial-pos');
    enemyAvatar.classList.add('enemy-initial-pos');
    
    // 3. Renderizar avatares y limpiar log
    enemyAvatar.src = currentEnemy.avatar; 
    enemyAvatar.alt = currentEnemy.name;
    document.getElementById('combate-log').textContent = ''; 
    
    // 4. Ejecutar el combate
    const { winner, points, combatLog } = combate(currentEnemy, jugador);

    // 5. Mostrar la escena (IMPORTANTE: Esto debe suceder antes de activar la animación)
    showScene('escena-batalla'); 

    // b) Remover las clases iniciales para disparar la transición CSS (animación de entrada)
    setTimeout(() => {
        playerAvatar.classList.remove('player-initial-pos');
        enemyAvatar.classList.remove('enemy-initial-pos');
        
        playerAvatar.classList.add('avatar-loaded');
        enemyAvatar.classList.add('avatar-loaded');
    }, 50); 
    // --- Fin Lógica de la Animación de Entrada ---

    // 6. Mostrar el log y el resultado del combate
    document.getElementById('combate-log').innerHTML = combatLog.map(msg => `<p>${msg}</p>`).join('');
    document.getElementById('batalla-ganador').textContent = winner;
    document.getElementById('batalla-puntos-ganados').textContent = points;
    
    // 7. Actualizar estado del juego: Eliminar al enemigo si el jugador ganó
    if (winner === 'Jugador') {
        enemigosRestantes.splice(enemyIndex, 1);
    } 
    
    renderInventory();
}

function goToFinal() {
    const rank = distinguirJugador(jugador.points, UMBRAL_VETERANO);
    
    document.getElementById('final-rango').textContent = rank;
    document.getElementById('final-rango-message').textContent = 
        `El jugador ha logrado ser un ${rank}`;
    document.getElementById('final-puntos-totales').textContent = jugador.points;
    
    showScene('escena-final');

    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 } 
        });
    }
}

/**
 * Decide a dónde ir después de una batalla.
 */
function continueAfterBattle() {
    if (enemigosRestantes.length > 0) {
        goToEnemigos();
    } else {
        goToFinal();
    }
}

// --- MANEJO DE EVENTOS ---

function setupEventListeners() {
    // Escena 1: Inicio
    document.getElementById('btn-continuar-inicio').addEventListener('click', goToMercado);

    // Escena 2: Mercado (Manejo de añadir/retirar productos)
    document.getElementById('productos-grid').addEventListener('click', (e) => {
        const button = e.target;
        if (button.classList.contains('btn-toggle-basket')) {
            const productDiv = button.closest('.product-item');
            const productName = productDiv.getAttribute('data-name');
            const product = productosDisponibles.find(p => p.name === productName);
            
            if (!product) return;
            
            if (button.textContent === 'Añadir') {
                // Añadir a la cesta
                productosEnCesta.push(product);
                productDiv.classList.add('selected-product');
                button.textContent = 'Retirar';
            } else {
                // Retirar de la cesta
                productosEnCesta = productosEnCesta.filter(p => p.name !== productName);
                productDiv.classList.remove('selected-product');
                button.textContent = 'Añadir';
            }
        }
    });

    document.getElementById('btn-comprar').addEventListener('click', finishShopping);

    // Escena 3: Estado Actualizado
    document.getElementById('btn-continuar-estado').addEventListener('click', goToEnemigos);
    
    // Escena 4: Enemigos (Selección de enemigo para luchar)
    document.getElementById('enemigos-grid').addEventListener('click', (e) => {
        const button = e.target;
        if (button.classList.contains('btn-seleccionar-enemigo')) {
            const enemyDiv = button.closest('.enemy-item');
            const enemyIndex = parseInt(enemyDiv.getAttribute('data-index'));
            goToBatalla(enemyIndex);
        }
    });

    // Escena 5: Batalla
    document.getElementById('btn-continuar-batalla').addEventListener('click', continueAfterBattle);

    // Escena 6: Final
    document.getElementById('btn-reiniciar').addEventListener('click', initializeGame); // Reiniciar el juego
}

// --- INICIALIZACIÓN DEL JUEGO ---

/**
 * @description Inicializa el juego al cargar el DOM.
 */
function initializeGame() {
    // Reiniciar variables de estado globales
    jugador = new Jugador("Cazador", "imagenes/9.png", 100); 
    productosDisponibles = obtenerListaProductos(); 
    productosEnCesta = []; 
    enemigosRestantes = []; 
    currentEnemy = null;
    
    // Renderizar la escena inicial
    renderPlayerStats('inicio-', false);
    renderInventory();
    showScene('escena-inicio');
}


// Punto de entrada: Asegurar que el DOM está cargado antes de inicializar
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners(); // Configurar todos los listeners una sola vez
    initializeGame(); // Iniciar el juego
});