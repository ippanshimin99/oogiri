// Thin wrapper around Socket.io events for the online mode
export class OnlineGame {
  constructor() {
    this.socket = null;
    this.roomCode = null;
    this.playerId = null;
    this.isHost = false;
    this.hand = [];
    this._callbacks = {};
  }

  on(event, fn) { this._callbacks[event] = fn; return this; }
  _emit(event, data) { if (this._callbacks[event]) this._callbacks[event](data); }

  connect() {
    // `io` is the Socket.io global loaded from /socket.io/socket.io.js
    this.socket = window.io();

    const events = [
      'room_created','room_joined','join_error','player_joined','player_left',
      'deal_hand','new_round','player_played','cards_revealed',
      'vote_update','round_result','game_over',
    ];

    events.forEach(ev => {
      this.socket.on(ev, data => this._emit(ev, data));
    });

    this.socket.on('deal_hand', ({ hand }) => {
      this.hand = hand;
    });

    return this;
  }

  createRoom(playerName) {
    this.socket.emit('create_room', { playerName });
    this.on('room_created', ({ roomCode, playerId, players }) => {
      this.roomCode = roomCode;
      this.playerId = playerId;
      this.isHost = true;
    });
  }

  joinRoom(roomCode, playerName) {
    this.socket.emit('join_room', { roomCode, playerName });
    this.on('room_joined', ({ roomCode, playerId, isHost }) => {
      this.roomCode = roomCode;
      this.playerId = playerId;
      this.isHost = isHost ?? false;
    });
  }

  startGame() {
    this.socket.emit('start_game', { roomCode: this.roomCode });
  }

  playCard(cardId) {
    this.hand = this.hand.filter(c => c.id !== cardId);
    this.socket.emit('play_card', { roomCode: this.roomCode, cardId });
  }

  vote(targetPlayerId) {
    this.socket.emit('vote', { roomCode: this.roomCode, targetPlayerId });
  }

  nextRound() {
    this.socket.emit('next_round', { roomCode: this.roomCode });
  }

  disconnect() {
    if (this.socket) { this.socket.disconnect(); this.socket = null; }
  }
}
