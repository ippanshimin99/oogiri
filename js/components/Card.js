const CARD_BACKS = ['🎭', '🎴', '🃏', '🌟', '✨'];
const BACK_ICON = '🎴';

/**
 * Create a game card element.
 * @param {object} card       - { id, text }
 * @param {object} options    - { size, faceDown, selectable, selected, showVote, onSelect, onVote, label }
 */
export function createCard(card, options = {}) {
  const {
    size = 'normal',   // 'hand' | 'normal' | 'large'
    faceDown = false,
    selectable = false,
    selected = false,
    onSelect = null,
    label = null,       // player name shown under card
    animate = true,
    dealDelay = 0,
  } = options;

  const wrapper = document.createElement('div');
  wrapper.className = 'play-item';

  const cardWrapper = document.createElement('div');
  cardWrapper.className = 'card-wrapper';

  const el = document.createElement('div');
  el.className = `game-card ${size === 'hand' ? 'hand-card' : ''} ${faceDown ? 'face-down' : ''} ${selected ? 'selected' : ''}`;
  if (animate) {
    el.classList.add('card-deal');
    el.style.animationDelay = `${dealDelay}ms`;
  }

  // Front face
  const front = document.createElement('div');
  front.className = 'game-card-face game-card-front';
  front.innerHTML = `
    <div class="card-corner-label">📝</div>
    <div class="card-text">${card?.text ?? ''}</div>
    <div class="card-decoration" style="font-size:9px; opacity:0.6; text-align:right; line-height:1.3;">
      ${card?.comedian ? `🎤 ${card.comedian}タイプ` : 'レンタル大喜利'}
    </div>
  `;

  // Back face
  const back = document.createElement('div');
  back.className = 'game-card-face game-card-back';
  back.textContent = BACK_ICON;

  el.appendChild(front);
  el.appendChild(back);

  // 3D tilt on hover (desktop only)
  if (selectable && !('ontouchstart' in window)) {
    el.addEventListener('mousemove', (e) => {
      if (selected) return;
      const rect = el.getBoundingClientRect();
      const rx = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
      const ry = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
      el.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.04)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  }

  if (selectable && onSelect) {
    el.addEventListener('click', () => onSelect(card, el));
    el.style.cursor = 'pointer';
  }

  cardWrapper.appendChild(el);
  wrapper.appendChild(cardWrapper);

  if (label) {
    const nameEl = document.createElement('div');
    nameEl.className = 'play-player-name';
    nameEl.textContent = label;
    wrapper.appendChild(nameEl);
  }

  // Expose ref to the card element for flipping
  wrapper.cardEl = el;

  return wrapper;
}

export function flipCard(cardEl) {
  return new Promise(resolve => {
    cardEl.style.transition = 'transform 0.5s cubic-bezier(0.34,1.2,0.64,1)';
    cardEl.classList.remove('face-down');
    cardEl.addEventListener('transitionend', resolve, { once: true });
  });
}

export function selectCard(cardEl) {
  cardEl.classList.add('selected');
  cardEl.style.transform = 'translateY(-18px) scale(1.05)';
  cardEl.style.transition = 'transform 0.25s cubic-bezier(0.34,1.5,0.64,1)';
  cardEl.style.boxShadow = 'var(--shadow-glow-primary), 0 12px 32px rgba(0,0,0,0.5)';
}

export function deselectCard(cardEl) {
  cardEl.classList.remove('selected');
  cardEl.style.transform = '';
  cardEl.style.transition = 'transform 0.2s ease';
  cardEl.style.boxShadow = '';
}
