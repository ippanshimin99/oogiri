let _cardsData = null;

export async function loadCards() {
  if (_cardsData) return _cardsData;
  const res = await fetch('cards.json');
  _cardsData = await res.json();
  return _cardsData;
}

export function getCards() { return _cardsData; }

export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
