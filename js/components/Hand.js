import { createCard, selectCard, deselectCard } from './Card.js';

/**
 * Renders a scrollable hand of cards with selection logic.
 * Returns { el, getSelected, clearSelection }
 */
export function createHand(cards, { onSelect } = {}) {
  const scroll = document.createElement('div');
  scroll.className = 'hand-scroll';

  let selectedCard = null;
  let selectedEl = null;

  cards.forEach((card, i) => {
    const wrapper = createCard(card, {
      size: 'hand',
      selectable: true,
      animate: true,
      dealDelay: i * 60,
      onSelect: (c, el) => {
        // Deselect previous
        if (selectedEl && selectedEl !== el) {
          deselectCard(selectedEl);
        }
        if (selectedEl === el) {
          // Toggle off
          deselectCard(el);
          selectedCard = null;
          selectedEl = null;
        } else {
          selectCard(el);
          selectedCard = c;
          selectedEl = el;
        }
        if (onSelect) onSelect(selectedCard);
      },
    });
    scroll.appendChild(wrapper);
  });

  return {
    el: scroll,
    getSelected: () => selectedCard,
    clearSelection: () => {
      if (selectedEl) deselectCard(selectedEl);
      selectedCard = null;
      selectedEl = null;
    },
  };
}
