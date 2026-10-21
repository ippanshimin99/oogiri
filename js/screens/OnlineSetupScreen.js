import { navigate } from '../router.js';
import { state } from '../state.js';
import { OnlineGame } from '../game/OnlineGame.js';
import { showToast } from '../components/Toast.js';

export function mount(container) {
  container.innerHTML = `
    <div class="screen" style="gap:var(--space-5);">
      <div class="nav-header">
        <button class="btn btn-ghost btn-icon" id="btn-back">←</button>
        <div class="nav-title">🌐 オンライン対戦</div>
        <div style="width:44px;"></div>
      </div>

      <!-- Name input -->
      <div class="input-group">
        <label class="input-label" for="player-name">あなたの名前</label>
        <input id="player-name" class="input" placeholder="例: 田中" maxlength="10" autocomplete="off">
      </div>

      <div class="divider"></div>

      <!-- Create room -->
      <button class="btn btn-primary btn-lg btn-full" id="btn-create">
        🏠 ルームを作る
      </button>

      <!-- Join room -->
      <div style="text-align:center; color:var(--text-muted); font-weight:700; font-size:13px;">または</div>

      <div style="display:flex; flex-direction:column; gap:var(--space-3);">
        <div class="input-group">
          <label class="input-label" for="room-code">ルームコード</label>
          <input id="room-code" class="input input-code" placeholder="ABCD" maxlength="4" autocomplete="off">
        </div>
        <button class="btn btn-teal btn-lg btn-full" id="btn-join">
          🚀 ルームに参加する
        </button>
      </div>

      <!-- Info -->
      <div class="panel" style="text-align:center; color:var(--text-secondary); font-size:13px; line-height:1.7;">
        📱 スマホのブラウザで同じURLを開き、<br>
        ルームコードを入力すれば友達も参加できます
      </div>
    </div>
  `;

  container.querySelector('#btn-back').addEventListener('click', () => navigate('title'));

  container.querySelector('#btn-create').addEventListener('click', () => {
    const name = container.querySelector('#player-name').value.trim();
    if (!name) { showToast('名前を入力してください', 'warning'); return; }

    const game = new OnlineGame();
    game.connect();
    game.on('room_created', ({ roomCode, playerId, players }) => {
      game.roomCode = roomCode;
      game.playerId = playerId;
      game.isHost = true;
      state.mode = 'online';
      state.game = game;
      navigate('lobby', { game, playerName: name, players });
    });
    game.createRoom(name);
  });

  container.querySelector('#btn-join').addEventListener('click', () => {
    const name = container.querySelector('#player-name').value.trim();
    const code = container.querySelector('#room-code').value.trim().toUpperCase();
    if (!name) { showToast('名前を入力してください', 'warning'); return; }
    if (code.length !== 4) { showToast('4文字のルームコードを入力してください', 'warning'); return; }

    const game = new OnlineGame();
    game.connect();
    game.on('room_joined', ({ roomCode, playerId, players }) => {
      game.isHost = false;
      state.mode = 'online';
      state.game = game;
      navigate('lobby', { game, playerName: name, players });
    });
    game.on('join_error', ({ message }) => {
      showToast(message, 'error');
      game.disconnect();
    });
    game.joinRoom(code, name);
  });
}

export function unmount() {}
