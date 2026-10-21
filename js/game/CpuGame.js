import { LocalGame } from './LocalGame.js';

const CPU_NAMES = ['バーチャル太郎', 'デジタル花子', 'ロボット次郎', 'AI四郎'];
const CPU_EMOJIS = ['🤖', '🦾', '🎮', '💻'];

export function createCpuPlayers(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `cpu-${i}`,
    name: CPU_NAMES[i] ?? `CPU${i + 1}`,
    isCpu: true,
    cpuEmoji: CPU_EMOJIS[i] ?? '🤖',
  }));
}

export class CpuGame extends LocalGame {
  constructor(humanPlayer, cpuCount, cardsData) {
    const cpus = createCpuPlayers(cpuCount);
    // Human is always first
    super([humanPlayer, ...cpus], cardsData);
  }

  _selectTurn(playerIdx) {
    if (playerIdx >= this.players.length) {
      this._emit('allPlayed', { plays: this.plays });
      this._voteTurn(0);
      return;
    }

    const player = this.players[playerIdx];

    if (player.isCpu) {
      // CPU picks a random card with slight delay for realism
      setTimeout(() => {
        const card = player.hand[Math.floor(Math.random() * player.hand.length)];
        this.humanPlay(playerIdx, card);
      }, 600 + Math.random() * 800);
    } else {
      this._emit('selectTurn', {
        player,
        playerIdx,
        totalPlayers: this.players.length,
      });
    }
  }

  _voteTurn(playerIdx) {
    if (playerIdx >= this.players.length) {
      this._resolveVotes();
      return;
    }

    const player = this.players[playerIdx];

    if (player.isCpu) {
      setTimeout(() => {
        // CPU votes randomly for someone other than itself
        const candidates = this.plays.filter(p => p.player.id !== player.id);
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        this.humanVote(playerIdx, target?.player.id ?? this.plays[0].player.id);
      }, 400 + Math.random() * 600);
    } else {
      this._emit('voteTurn', {
        player,
        playerIdx,
        plays: this.plays,
      });
    }
  }
}
