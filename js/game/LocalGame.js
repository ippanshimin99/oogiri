import { shuffle } from '../cards-data.js';

export class LocalGame {
  constructor(players, cardsData) {
    this.players = players.map((p, i) => ({
      ...p,
      hand: [],
      score: 0,
      played: null,
      vote: null,
    }));
    this.cardsData = cardsData;

    this.answerDeck = [];
    this.topicDeck = [];
    this.evaluationDeck = [];
    this.currentTopic = null;
    this.currentEvaluation = null;
    this.plays = [];  // [{ player, card }]
    this.round = 0;
    this.totalRounds = cardsData.TOPIC_CARDS.length;

    this._callbacks = {};
  }

  on(event, fn) {
    this._callbacks[event] = fn;
    return this;
  }

  _emit(event, data) {
    if (this._callbacks[event]) this._callbacks[event](data);
  }

  start() {
    this.answerDeck = shuffle(this.cardsData.ANSWER_CARDS);
    this.topicDeck  = shuffle(this.cardsData.TOPIC_CARDS);
    this.evaluationDeck = shuffle([
      ...this.cardsData.EVALUATION_CARDS,
      ...this.cardsData.EVALUATION_CARDS,
    ]);

    this.players.forEach(p => {
      p.hand = this.answerDeck.splice(0, 5);
      p.score = 0;
    });

    this._startRound();
  }

  _startRound() {
    this.round++;
    this.plays = [];
    this.players.forEach(p => { p.played = null; p.vote = null; });

    this.currentTopic = this.topicDeck.shift();
    this.currentEvaluation = this.evaluationDeck.shift() ?? this.cardsData.EVALUATION_CARDS[0];

    this._emit('roundStart', {
      round: this.round,
      totalRounds: this.totalRounds,
      topic: this.currentTopic,
      evaluation: this.currentEvaluation,
      players: this._publicPlayers(),
    });

    this._selectTurn(0);
  }

  _selectTurn(playerIdx) {
    if (playerIdx >= this.players.length) {
      // All played — start voting
      this._emit('allPlayed', { plays: this.plays });
      this._voteTurn(0);
      return;
    }

    const player = this.players[playerIdx];
    this._emit('selectTurn', {
      player,
      playerIdx,
      totalPlayers: this.players.length,
    });
  }

  // Called when a human player selects a card
  humanPlay(playerIdx, card) {
    const player = this.players[playerIdx];
    player.hand = player.hand.filter(c => c.id !== card.id);
    player.played = card;
    this.plays.push({ player, card });

    this._emit('playerPlayed', {
      player,
      card,
      playsCount: this.plays.length,
      totalPlayers: this.players.length,
    });

    this._selectTurn(playerIdx + 1);
  }

  _voteTurn(playerIdx) {
    if (playerIdx >= this.players.length) {
      this._resolveVotes();
      return;
    }

    const player = this.players[playerIdx];
    this._emit('voteTurn', {
      player,
      playerIdx,
      plays: this.plays,
    });
  }

  humanVote(playerIdx, targetPlayerId) {
    this.players[playerIdx].vote = targetPlayerId;
    this._voteTurn(playerIdx + 1);
  }

  _resolveVotes() {
    const tally = {};
    this.players.forEach(p => { tally[p.id] = 0; });
    this.players.forEach(p => {
      if (p.vote) tally[p.vote] = (tally[p.vote] || 0) + 1;
    });

    // 🤖 AI審判が1票追加（引き分け防止・常に奇数票）
    const aiTarget = this.plays[Math.floor(Math.random() * this.plays.length)].player.id;
    tally[aiTarget]++;
    const aiTargetName = this.plays.find(p => p.player.id === aiTarget).player.name;
    this._emit('aiVoted', { targetId: aiTarget, targetName: aiTargetName });

    const maxVotes = Math.max(...Object.values(tally));
    const topIds = Object.keys(tally).filter(id => tally[id] === maxVotes);
    const winnerId = topIds[Math.floor(Math.random() * topIds.length)];

    const winner = this.players.find(p => p.id === winnerId);
    winner.score++;

    // 投票詳細：誰が誰に入れたか
    const voteDetails = this.players.map(p => ({
      voterId: p.id,
      voterName: p.name,
      targetId: p.vote,
      targetName: this.players.find(q => q.id === p.vote)?.name ?? '？',
    }));
    voteDetails.push({ voterId: 'ai', voterName: '🤖 AI審判', targetId: aiTarget, targetName: aiTargetName });

    // Draw replacement card
    this.players.forEach(p => {
      if (this.answerDeck.length > 0) p.hand.push(this.answerDeck.shift());
    });

    this._emit('roundResult', {
      winnerId,
      winner,
      tally,
      voteDetails,
      plays: this.plays,
      scores: this._publicPlayers(),
    });
  }

  nextRound() {
    if (this.topicDeck.length === 0 || this.round >= this.totalRounds) {
      const finalScores = this._publicPlayers().sort((a, b) => b.score - a.score);
      this._emit('gameOver', { finalScores });
      return;
    }
    this._startRound();
  }

  _publicPlayers() {
    return this.players.map(p => ({ id: p.id, name: p.name, score: p.score, isCpu: p.isCpu }));
  }
}
