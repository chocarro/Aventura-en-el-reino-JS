import { Enemigo } from '../classes/Enemigo.js'; 
import { Jefe } from '../classes/Jefe.js'; 
import { Jugador } from '../classes/Jugador.js';
import { PUNTOS_BASE_VICTORIA } from '../utils/constants.js';

function turn(enemy, player) {
    const combatLog = [];
    
    // 1. Jugador ataca
    enemy.currentLife -= player.totalAttack;
    combatLog.push(`El jugador ataca a ${enemy.name} con ${player.totalAttack} de ataque. Vida restante: ${Math.max(0, enemy.currentLife)}`);

    if (enemy.currentLife <= 0) {
        return { log: combatLog };
    }
    
    // 2. Enemigo ataca
    let incomingDamage = enemy.attackLevel;
    if (enemy instanceof Jefe) {
        incomingDamage *= enemy.damageMultiplier;
        incomingDamage = Math.round(incomingDamage); 
        combatLog.push(`¡${enemy.name} (Jefe) usa su multiplicador de daño!`);
    }
    
    // Daño_Mitigado = Máx(0, Ataque_Enemigo - Defensa_Jugador)
    const mitigatedDamage = Math.max(0, incomingDamage - player.totalDefense);
    player.currentLife -= mitigatedDamage;

    combatLog.push(`${enemy.name} ataca al jugador. Daño infligido: ${mitigatedDamage}. Vida restante: ${Math.max(0, player.currentLife)}`);
    
    return { log: combatLog };
}

function calcularPuntuacion(enemy) {
    let points = PUNTOS_BASE_VICTORIA + enemy.attackLevel; 
    
    if (enemy instanceof Jefe) {
        points = Math.round(points * enemy.damageMultiplier);
    }
    return points;
}

/**
 * @description Simula un combate completo por turnos.
 * @returns {{winner: ('Jugador'|'Enemigo'), points: number, combatLog: string[]}}
 */
export function combate(enemy, player) {
    const combatLog = [];
    
    player.currentLife = player.totalLife; 
    
    while (player.currentLife > 0 && enemy.currentLife > 0) {
        const { log } = turn(enemy, player);
        combatLog.push(...log);
    }

    if (player.currentLife > 0) {
        const points = calcularPuntuacion(enemy);
        player.addPoints(points);
        combatLog.push(`¡Victoria! Ganador: ${player.name}. Puntos ganados: ${points}.`);
        return { winner: 'Jugador', points: points, combatLog };
    } else {
        combatLog.push(`Derrota. Ganador: ${enemy.name}.`);
        return { winner: 'Enemigo', points: 0, combatLog };
    }
}