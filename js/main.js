import { Jugador } from './classes/Jugador.js';
import { Enemigo } from './classes/Enemigo.js'; 
import { Jefe } from './classes/Jefe.js'; 
import { combate } from './model/batalla.js';
import { obtenerListaProductos, aplicarDescuentoAleatorio } from './model/mercado.js';
import { distinguirJugador } from './model/ranking.js';
import { deepClone } from './utils/utils.js';
import { RAREZA, TIPO_PRODUCTO, UMBRAL_VETERANO } from './utils/constants.js';

// --- VARIABLES DE ESTADO GLOBALES ---
let jugador = null;
let productosDisponibles = [];
let productosEnCesta = []; 
let enemigosIniciales = [
    new Enemigo("Goblin", "imagenes/Personajes/goblin.png", 8, 50),
    new Enemigo("Lobo", "imagenes/Personajes/lobo.png", 9, 60),
    new Enemigo("Bandido", "imagenes/Personajes/bandido.png", 12, 80),
    new Jefe("Dragón", "imagenes/Personajes/dragon.png", 20, 150),
];
let enemigosRestantes = []; 
let currentEnemy = null; 

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

    const currentAttack = jugador.totalAttack;
    const currentDefense = jugador.totalDefense;
    const currentLife = jugador.totalLife; 

    document.getElementById(`${prefix}ataque`).textContent = currentAttack;
    document.getElementById(`${prefix}defensa`).textContent = currentDefense;
    document.getElementById(`${prefix}puntos`).textContent = jugador.points;
    
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
    cestaGrid.innerHTML = '';
    
    if (jugador.inventory.length === 0) {
        cestaGrid.innerHTML = '<p id="cesta-vacia-msg">Inventario vacío.</p>';
        return;
    }
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
    grid.innerHTML = ''; 

    productosDisponibles.forEach(product => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('product-item');
        itemDiv.setAttribute('data-name', product.name);
        itemDiv.setAttribute('data-id', product.name.replace(/\s/g, '-')); 

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
        const productToBuy = productosDisponibles.find(p => p.name === product.name);
        if (productToBuy) {
            jugador.addItemToInventory(productToBuy); 
        }
    });
    productosEnCesta = [];

    // 2. Renderizar stats actualizadas y mostrar
    renderPlayerStats('estado-', true);
    renderInventory();
    showScene('escena-estado');
}

function goToEnemigos() {
    if (enemigosRestantes.length === 0) {
        enemigosRestantes = enemigosIniciales.map(enemy => deepClone(enemy)); 
    }
    renderEnemigos();
    showScene('escena-enemigos');
}

function goToBatalla(enemyIndex) {
    const currentEnemy = enemigosRestantes[enemyIndex];

    if (!currentEnemy) {
        console.error("Error: Enemigo no válido o no encontrado. Volviendo a la selección.");
        goToEnemigos(); 
        return; 
    }

    const playerAvatar = document.getElementById('batalla-player-avatar');
    const enemyAvatar = document.getElementById('batalla-enemy-avatar');

    playerAvatar.classList.remove('player-initial-pos', 'avatar-loaded');
    enemyAvatar.classList.remove('enemy-initial-pos', 'avatar-loaded');
    
    playerAvatar.classList.add('player-initial-pos');
    enemyAvatar.classList.add('enemy-initial-pos');
    
    enemyAvatar.src = currentEnemy.avatar; 
    enemyAvatar.alt = currentEnemy.name;
    document.getElementById('combate-log').textContent = ''; 
    
    const { winner, points, combatLog } = combate(currentEnemy, jugador);

    showScene('escena-batalla'); 

    setTimeout(() => {
        playerAvatar.classList.remove('player-initial-pos');
        enemyAvatar.classList.remove('enemy-initial-pos');
        
        playerAvatar.classList.add('avatar-loaded'); 
        enemyAvatar.classList.add('avatar-loaded');
    }, 50); 

    document.getElementById('combate-log').innerHTML = combatLog.map(msg => `<p>${msg}</p>`).join('');
    document.getElementById('batalla-ganador').textContent = winner;
    document.getElementById('batalla-puntos-ganados').textContent = points;
    
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
                productosEnCesta = productosEnCesta.filter(p => p.name !== productName);
                productDiv.classList.remove('selected-product');
                button.textContent = 'Añadir';
            }
        }
    });

    document.getElementById('btn-comprar').addEventListener('click', finishShopping);

    // Escena 3: Estado Actualizado
    document.getElementById('btn-continuar-estado').addEventListener('click', goToEnemigos);
    
    // Escena 4: Enemigos 
    document.getElementById('enemigos-grid').addEventListener('click', (e) => {
        const button = e.target;
        if (button.classList.contains('btn-seleccionar-enemigo')) {
            const enemyDiv = button.closest('.enemy-item');
            const enemyIndex = parseInt(enemyDiv.getAttribute('data-index'));
            goToBatalla(enemyIndex);
        }
    });

    document.getElementById('btn-continuar-batalla').addEventListener('click', continueAfterBattle);
    document.getElementById('btn-reiniciar').addEventListener('click', initializeGame); 
}

// --- INICIALIZACIÓN DEL JUEGO ---

/**
 * @description Inicializa el juego al cargar el DOM.
 */
function initializeGame() {
    jugador = new Jugador("Cazador", "imagenes/9.png", 100); 
    productosDisponibles = obtenerListaProductos(); 
    productosEnCesta = []; 
    enemigosRestantes = []; 
    currentEnemy = null;
    
    renderPlayerStats('inicio-', false);
    renderInventory();
    showScene('escena-inicio');
}

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners(); 
    initializeGame(); 
});