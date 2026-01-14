import { Jugador } from './classes/Jugador.js';
import { Enemigo } from './classes/Enemigo.js'; 
import { Jefe } from './classes/Jefe.js'; 
import { combate } from './model/batalla.js';
import { obtenerListaProductos, aplicarDescuentoAleatorio, buscarProducto } from './model/mercado.js';
import { distinguirJugador } from './model/ranking.js';
import { deepClone } from './utils/utils.js';
import { RAREZA, TIPO_PRODUCTO, UMBRAL_VETERANO } from './utils/constants.js';

// --- VARIABLES DE ESTADO GLOBALES ---
let jugador = null;
let productosDisponibles = [];
let productosEnCesta = new Map(); 
let enemigosIniciales = [
    new Enemigo("Goblin", "imagenes/Personajes/goblin.png", 8, 50),
    new Enemigo("Lobo", "imagenes/Personajes/lobo.png", 9, 60),
    new Enemigo("Bandido", "imagenes/Personajes/bandido.png", 12, 80),
    new Jefe("Dragón", "imagenes/Personajes/dragon.png", 20, 150),
];
let enemigosRestantes = []; 
let currentEnemy = null; 
const maxpoints = 10;

//-- REGISTRO RANKING JUGADOR -- 

function guardarRanking() {
    if (!jugador) {
        console.error("No hay jugador para guardar.");
        return;
    }

    const newRecord = {
        name: jugador.name,
        points: jugador.points,
        gold: jugador.gold,
        date: new Date().toLocaleString()
    };

    let ranking = JSON.parse(localStorage.getItem('rankingAventura') || '[]');
    ranking.push(newRecord);
    ranking.sort((a, b) => b.points - a.points);
    
    localStorage.setItem('rankingAventura', JSON.stringify(ranking));
    console.log(`Registro de ${jugador.name} guardado en el ranking.`);
}


function showRanking() {
    const ranking = JSON.parse(localStorage.getItem('rankingAventura') || '[]');
    const rankingBody = document.getElementById('ranking-body');
    const rankingContainer = document.getElementById('ranking-container');

    if (!rankingBody || !rankingContainer) return;

    rankingBody.innerHTML = ''; // Limpiar tabla previa

    ranking.forEach((record, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${index + 1}</td>
            <td>${record.name}</td>
            <td>${record.points}</td>
            <td>${record.gold}</td>
            <td>${record.date}</td>
        `;
        rankingBody.appendChild(row);
    });

    rankingContainer.style.display = 'block'; // Mostrar la tabla
}      


function hideAllScenes() {
    document.querySelectorAll('.scene').forEach(scene => {
        scene.classList.remove('active-scene');
        scene.classList.add('hidden-scene');
    });
}

function showScene(sceneId) {
    hideAllScenes();
    const scene = document.getElementById(sceneId);
    if (scene) {
        scene.classList.remove('hidden-scene');
        scene.classList.add('active-scene');
    }
}

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
 * @description Renderiza el inventario en el footer con al menos 6 celdas.
 */

function renderInventory() {
    const cestaGrid = document.getElementById('cesta-grid');
    if (!cestaGrid) return;

    cestaGrid.innerHTML = '';
    
    const TOTAL_SLOTS = 6; // Mínimo de 6 celdas
    const currentInventory = jugador.inventory;

    for (let i = 0; i < TOTAL_SLOTS; i++) {
        const slotDiv = document.createElement('div');
        slotDiv.classList.add('inventory-item');

        if (currentInventory[i]) {
            // Celda con objeto real
            const item = currentInventory[i];
            slotDiv.innerHTML = `<img src="${item.image}" alt="${item.name}" title="${item.name} (+${item.bonus})">`;
            slotDiv.style.borderStyle = 'solid'; // Cambiar a borde sólido si tiene item
        } else {
            // Celda vacía
            slotDiv.innerHTML = ''; 
        }

        cestaGrid.appendChild(slotDiv);
    }
}


/**
 * Renderiza todos los productos disponibles en la escena de mercado.
 */

function renderMercado() {
    const grid = document.getElementById('productos-grid');
    grid.innerHTML = ''; 
    let totalCesta = 0;
    productosEnCesta.forEach((product) => {
        totalCesta += product.price; // El precio suele estar en céntimos (ej: 4000 para 40€)
    });
    
    // Nota: Si tus precios están en formato 40,00€, dividimos por 100 si price es 4000
    const saldoProyectado = jugador.gold - (totalCesta / 100);

    // Actualizamos todos los visuales de oro en tiempo real
    const displaySaco = document.getElementById('oro-display');
    const displayBarra = document.getElementById('mercado-oro');

    if (displaySaco) displaySaco.textContent = Math.floor(saldoProyectado);
    if (displayBarra) displayBarra.textContent = Math.floor(saldoProyectado);

    // Actualizamos el total de la cesta
    document.getElementById('mercado-total-cesta').textContent = (totalCesta / 100).toFixed(2) + '€';

    // Bloqueo del botón si no hay suficiente oro
   
    productosDisponibles.forEach(product => {
        const productDataId = product.name.replace(/\s/g, '-');
        
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('product-item');
        itemDiv.setAttribute('data-name', product.name);
        itemDiv.setAttribute('data-id', productDataId); 
        itemDiv.setAttribute('draggable', 'true');
        itemDiv.id = `product-${productDataId}`;

        if (productosEnCesta.has(product.name)) {
             itemDiv.classList.add('selected-product');
        }

        itemDiv.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <p><strong>${product.name}</strong> (${product.type})</p>
            <p class="product-bonus">Bonus: +${product.bonus}</p>
            <p class="product-price">Precio: ${product.precioFormateado}</p>
            `;

        grid.appendChild(itemDiv);
    });
    
    const cestaTemporalDiv = document.getElementById('cesta-mercado');
    cestaTemporalDiv.innerHTML = '';
    
    if (productosEnCesta.size === 0) {
        cestaTemporalDiv.innerHTML = '<p>Arrastra productos aquí</p>';
    } else {
        productosEnCesta.forEach((product, name) => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('basket-temp-item');
            itemDiv.setAttribute('data-name', name);
            itemDiv.innerHTML = `
                <img src="${product.image}" alt="${name}" title="${name}">
                <button class="btn-remove-basket">X</button>
            `;
            cestaTemporalDiv.appendChild(itemDiv);
            totalCesta += product.price;
        });
    }

    document.getElementById('mercado-oro').textContent = jugador.gold;
    document.getElementById('mercado-total-cesta').textContent = (totalCesta / 100).toFixed(2) + '€';
    
    const btnComprar = document.getElementById('btn-comprar');
    if (saldoProyectado < 0) {
        btnComprar.disabled = true;
        btnComprar.textContent = 'ORO INSUFICIENTE';
        btnComprar.classList.add('insufficient-gold');
        if (displaySaco) displaySaco.style.color = "red"; 
    } else {
        btnComprar.disabled = false;
        btnComprar.textContent = 'Terminar Compra y Continuar';
        btnComprar.classList.remove('insufficient-gold');
        if (displaySaco) displaySaco.style.color = "black";
    }
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
    const { products: discountedProducts, rarity: discountedRarity } = aplicarDescuentoAleatorio(15);
    productosDisponibles = discountedProducts;
    
    document.getElementById('mercado-descuento-info').textContent = 
        `¡Descuento del 15% aplicado a la rareza ${discountedRarity}!`;

    productosEnCesta.clear();

    renderMercado();
    showScene('escena-mercado');
}

function finishShopping() {
    let totalCompra = 0;

    productosEnCesta.forEach(product => {
        totalCompra += product.price;
    });

    if (totalCompra <= jugador.gold * 100) {
        jugador.gold -= totalCompra / 100;

        productosEnCesta.forEach(product => {
            jugador.addItemToInventory(product); 
        });

        productosEnCesta.clear();

        renderPlayerStats('estado-', true);
        renderInventory();
        showScene('escena-estado');
    } else {
        alert("Error: No tienes suficiente oro para esta compra.");
        renderMercado(); 
    }
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
    
    // --- LÓGICA DE FINALIZACIÓN Y ANIMACIÓN ---
    if (winner === 'Jugador') {
        enemigosRestantes.splice(enemyIndex, 1);
        jugador.addGold(5);

        const contenedorMonedas = document.querySelector('.div2');
        if (contenedorMonedas) {
            contenedorMonedas.classList.add('monedas-activas');
            
            setTimeout(() => {
                contenedorMonedas.classList.remove('monedas-activas');
            }, 5000);
        }

    } else {
        setTimeout(() => {
            alert("¡Has sido derrotado! Tu aventura termina aquí.");
            goToFinal(); 
        }, 2000); 
        return; 
    }
    
    renderInventory();
}

function goToFinal() {
    guardarRanking();

    const rank = distinguirJugador(jugador.points, UMBRAL_VETERANO);
    
    const elMensaje = document.getElementById('final-rango-message');
    const elPuntos = document.getElementById('final-puntos-totales');
    const btnMostrarRanking = document.getElementById('btn-mostrar-ranking');

    if (elMensaje) {
        elMensaje.textContent = `El jugador ha logrado ser un ${rank}`;
    }
    if (elPuntos) {
        elPuntos.textContent = jugador.points;
    }
    if (btnMostrarRanking) {
        btnMostrarRanking.onclick = showRanking;
        btnMostrarRanking.style.display = 'block'; 
    }

    showScene('escena-final');

    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 } 
        });
    }
}
function continueAfterBattle() {
    if (enemigosRestantes.length > 0) {
        goToEnemigos();
    } else {
        goToFinal();
    }
}
// --- MANEJO DE EVENTOS ---
function setupEventListeners() {
    const inputsStats = ['creacion-ataque', 'creacion-defensa', 'creacion-vida'];
    inputsStats.forEach(id => {
        const inputEl = document.getElementById(id);
        if (inputEl) {
            inputEl.addEventListener('input', () => {
                const atk = parseInt(document.getElementById('creacion-ataque').value) || 0;
                const def = parseInt(document.getElementById('creacion-defensa').value) || 0;
                const vida = parseInt(document.getElementById('creacion-vida').value) || 100;
                
                const usados = atk + def + (vida - 100);
                const restantes = 10 - usados;
                
                const display = document.getElementById('puntos-disponibles');
                if (display) {
                    display.textContent = restantes;
                    display.style.color = restantes < 0 ? 'red' : 'inherit';
                }
            });
        }
    });

    document.getElementById('btn-comenzar-aventura').addEventListener('click', () => {
        const nombreInput = document.getElementById('input-nombre');
        const nombre = nombreInput.value.trim();
        
        const avatarFijo = "imagenes/1.png"; 

        const atk = parseInt(document.getElementById('creacion-ataque').value) || 0;
        const def = parseInt(document.getElementById('creacion-defensa').value) || 0;
        const vida = parseInt(document.getElementById('creacion-vida').value) || 0;

        const regexNombre = /^[A-Z][a-zA-Z\s]{0,19}$/;
        
        if (!regexNombre.test(nombre) || nombre === "") {
            alert("Nombre inválido: Debe empezar con Mayúscula, contener solo letras/espacios y tener máximo 20 caracteres.");
            return;
        }

        // Validación de mínimos y valores negativos
        if (atk < 0 || def < 0 || vida < 100) {
            alert("Las estadísticas no pueden ser negativas y la vida mínima es 100.");
            return;
        }

        // Validación de reparto de 10 puntos extra (Total máximo entre los 3: 110 puntos)
        const puntosExtra = atk + def + (vida - 100);
        if (puntosExtra > 10) {
            alert("Has repartido " + puntosExtra + " puntos extra. Solo tienes 10 puntos disponibles para repartir.");
            return;
        }

        // Creación del jugador con los datos validados y avatar fijo
        jugador = new Jugador(nombre, avatarFijo, vida, 500);
        jugador.attackLevel = atk;
        jugador.defenseLevel = def;
        
        // Sincronizar estadísticas en la escena de inicio
        renderPlayerStats('inicio-', false);
        document.getElementById('inicio-nombre').textContent = jugador.name;
        document.getElementById('inicio-avatar').src = jugador.avatar;
        
        renderInventory();
        showScene('escena-inicio');
    });

    // --- RESTO DE EVENTOS (Mercado, Drag & Drop, Combate) ---
    document.getElementById('btn-continuar-inicio').addEventListener('click', goToMercado);
    
    document.getElementById('productos-grid').addEventListener('dragstart', (e) => {
        const productDiv = e.target.closest('.product-item');
        if (productDiv) {
            e.dataTransfer.setData('text/plain', productDiv.getAttribute('data-name'));
            e.target.classList.add('dragging');
        }
    });

    document.getElementById('productos-grid').addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
    });

    const cestaMercado = document.getElementById('cesta-mercado');
    cestaMercado.addEventListener('dragover', (e) => {
        e.preventDefault(); 
        cestaMercado.classList.add('drag-over');
    });

    cestaMercado.addEventListener('dragleave', () => {
        cestaMercado.classList.remove('drag-over');
    });
    
    cestaMercado.addEventListener('drop', (e) => {
        e.preventDefault();
        cestaMercado.classList.remove('drag-over');
        const productName = e.dataTransfer.getData('text/plain');
        
        if (!productosEnCesta.has(productName)) {
            const productToAdd = productosDisponibles.find(p => p.name === productName);
            if (productToAdd) {
                productosEnCesta.set(productName, productToAdd);
                renderMercado();
            }
        }
    });
    
    cestaMercado.addEventListener('click', (e) => {
        const button = e.target;
        if (button.classList.contains('btn-remove-basket')) {
            const itemDiv = button.closest('.basket-temp-item');
            const productName = itemDiv.getAttribute('data-name');
            productosEnCesta.delete(productName);
            renderMercado();
        }
    });

    document.getElementById('btn-comprar').addEventListener('click', finishShopping);
    document.getElementById('btn-continuar-estado').addEventListener('click', goToEnemigos);
    
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

function initializeGame() {
   productosDisponibles = obtenerListaProductos(); 
    productosEnCesta.clear(); 
    enemigosRestantes = []; 
    currentEnemy = null;
    
    showScene('escena-creacion');
}

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners(); 
    initializeGame(); 
});

