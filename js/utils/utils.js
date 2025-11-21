export function cambiarEscena(sceneId) {
    const escenas = document.querySelectorAll('.game-scene');
    
    // Ocultar todas las escenas
    escenas.forEach(scene => {
        if (scene.id === sceneId) {
            // Mostrar la escena objetivo
            scene.classList.add('active-scene');
            scene.classList.remove('hidden-scene');
        } else {
            // Ocultar todas las demás
            scene.classList.remove('active-scene');
            scene.classList.add('hidden-scene');
        }
    });
    
}

export function clonarObjeto(obj) {
    if (obj && typeof obj.constructor === 'function') {
        const clon = new obj.constructor(...Object.values(obj));
        return clon;
    }
    
return JSON.parse(JSON.stringify(obj)); 
}

export function obtenerElementoAleatorio(arr) {
    const indice = Math.floor(Math.random() * arr.length);
    return arr[indice];
}

export function formatCurrency(precioEnCentimos) {
    const euros = precioEnCentimos / 100;
    return `${euros.toFixed(2)} €`;
}