import { navigate } from '../router.js';
import { showToast } from '../components/Toast.js';
import { getPlayerColor, getPlayerEmoji } from '../components/Scoreboard.js';

export function mount(container, { game, playerName, players: initialPlayers }) {
  let players = initialPlayers ?? [];

  const render = () => {
    container.innerHTML = `
      <div class="screen" style="gap:var(--space-5);">
        <div class="nav-header">
          <button class="btn btn-ghost btn-icon" id="btn-back">←</button>
          <div class="nav-title">待合室</div>
          <div style="width:44px;"></div>
        </div>

        <!-- Room code display -->
        <div class="room-code-display animate-bounceIn">
          <div class="room-code-label">ルームコード</div>
          <div class="room-code-value" id="room-code-val">${game.roomCode}</div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:var(--space-2);">
            このコードを友達に伝えてください
          </div>
          <button class="btn btn-ghost btn-sm" id="btn-copy" style="margin-top:var(--space-3);">
            📋 コードをコピー
          </button>
        </div>

        <!-- Players list -->
        <div class="panel">
          <div class="panel-header">参加者 (${players.length}/6)</div>
          <div style="display:flex; flex-direction:column; gap:var(--space-2);" id="players-list">
            ${players.map((p, i) => `
              <div class="player-chip ${p.id === game.playerId ? 'active' : ''}">
                <div class="player-avatar" style="background:${getPlayerColor(i)}22; color:${getPlayerColor(i)};">
                  ${getPlayerEmoji(i)}
                </div>
                <div class="player-name">${p.name}</div>
                ${p.id === game.playerId ? '<span class="badge badge-primary" style="margin-left:auto;">あなた</span>' : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <div style="text-align:center; color:var(--text-secondary); font-size:14px;" id="waiting-msg">
          ${game.isHost
            ? players.length >= 2
              ? '<span style="color:var(--color-green);">✅ いつでも始められます！</span>'
              : '2人以上になったらゲームを開始できます'
            : 'ホストがゲームを開始するまでお待ちください...'
          }
        </div>

        <div class="spacer"></div>

        ${game.isHost ? `
          <button class="btn btn-primary btn-lg btn-full" id="btn-start"
            ${players.length < 2 ? 'disabled' : ''}>
            🎭 ゲームを開始する！ (${players.length}人)
          </button>
        ` : `
          <div style="display:flex; justify-content:center; gap:var(--space-3); align-items:center;">
            <div class="waiting-dots"><span></span><span></span><span></span></div>
            <span style="font-family:var(--font-heading); color:var(--text-secondary); font-weight:700;">
              ホストを待っています
            </span>
          </div>
        `}
      </div>
    `;

    container.querySelector('#btn-back')?.addEventListener('click', () => {
      game.disconnect();
      navigate('title');
    });

    container.querySelector('#btn-copy')?.addEventListener('click', () => {
      navigator.clipboard.writeText(game.roomCode).then(() => {
        showToast(`コード「${game.roomCode}」をコピーしました`, 'success');
      });
    });

    container.querySelector('#btn-start')?.addEventListener('click', () => {
      game.startGame();
    });
  };

  // Socket listeners
  game.on('player_joined', ({ players: updated }) => {
    players = updated;
    render();
    showToast(`${updated[updated.length - 1]?.name} が参加しました！`, 'info');
  });

  game.on('player_left', ({ players: updated }) => {
    players = updated;
    render();
  });

  game.on('new_round', data => {
    navigate('game', { mode: 'online', game, roundData: data });
  });

  game.on('join_error', ({ message }) => {
    showToast(message, 'error');
  });

  render();
}

export function unmount() {}
