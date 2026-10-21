// Simple reactive state store
const _state = {
  mode: null,         // 'local' | 'cpu' | 'online'
  cardsData: null,    // { ANSWER_CARDS, TOPIC_CARDS, EVALUATION_CARDS }
  players: [],        // [{ id, name, isCpu, hand, score }]
  myPlayerId: null,
  game: null,         // active game instance
};

const _subscribers = new Set();

export const state = new Proxy(_state, {
  set(target, key, value) {
    target[key] = value;
    _subscribers.forEach(fn => fn(key, value));
    return true;
  },
});

export function subscribe(fn) {
  _subscribers.add(fn);
  return () => _subscribers.delete(fn);
}

export function getState() { return _state; }
