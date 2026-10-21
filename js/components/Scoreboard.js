const PLAYER_COLORS = ['#FF6B35','#4ECDC4','#FFD93D','#58CC02','#C77DFF','#FF6B6B'];
const PLAYER_EMOJIS = ['🦁','🐯','🦊','🐸','🐼','🦄'];

export function getPlayerColor(idx) { return PLAYER_COLORS[idx % PLAYER_COLORS.length]; }
export function getPlayerEmoji(idx) { return PLAYER_EMOJIS[idx % PLAYER_EMOJIS.length]; }

/**
 * Create a mini scoreboard showing all player scores.
 * Returns { el, update(players) }
 */
export function createScoreboard(players) {
  const container = document.createElement('div');
  container.className = 'scoreboard-mini';

  const pips = players.map((p, i) => {
    const pip = document.createElement('div');
    pip.className = 'score-pip';
    pip.style.color = getPlayerColor(i);
    pip.dataset.playerId = p.id;
    pip.innerHTML = `
      <span>${getPlayerEmoji(i)}</span>
      <span>${p.name.slice(0, 6)}</span>
      <span class="score-val">${p.score ?? 0}</span>
    `;
    container.appendChild(pip);
    return { pip, playerId: p.id };
  });

  return {
    el: container,
    update(updatedPlayers) {
      const maxScore = Math.max(...updatedPlayers.map(p => p.score));
      updatedPlayers.forEach(p => {
        const found = pips.find(pip => pip.playerId === p.id);
        if (!found) return;
        const valEl = found.pip.querySelector('.score-val');
        const prevScore = parseInt(valEl.textContent);
        if (p.score !== prevScore) {
          valEl.textContent = p.score;
          found.pip.classList.add('animate-bounce');
          setTimeout(() => found.pip.classList.remove('animate-bounce'), 600);
        }
        found.pip.classList.toggle('leading', p.score === maxScore && maxScore > 0);
      });
    },
  };
}
