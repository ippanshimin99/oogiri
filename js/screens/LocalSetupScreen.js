import { navigate } from '../router.js';
import { state } from '../state.js';
import { getPlayerColor, getPlayerEmoji } from '../components/Scoreboard.js';
import { showToast } from '../components/Toast.js';

export function mount(container) {
  const players = [{ name: '' }, { name: '' }];

  const render = () => {
    container.innerHTML = `
      <div class="screen" style="gap:var(--space-5);">
        <div class="nav-header">
          <button class="btn btn-ghost btn-icon" id="btn-back">←</button>
          <div class="nav-title">👥 ローカル対戦</div>
          <div style="width:44px;"></div>
        </div>

        <div style="display:flex; flex-direction:column; gap:var(--space-3);" id="players-list">
          ${players.map((p, i) => `
            <div class="panel" style="display:flex; align-items:center; gap:var(--space-3); border:2px solid ${getPlayerColor(i)}33;">
              <div class="player-avatar" style="background:${getPlayerColor(i)}22; color:${getPlayerColor(i)};">
                ${getPlayerEmoji(i)}
              </div>
              <div style="flex:1;">
                <div class="input-label" style="margin-bottom:4px;">プレイヤー ${i + 1}</div>
                <input
                  class="input"
                  placeholder="${i === 0 ? '例: 田中' : '例: 鈴木'}"
                  value="${p.name}"
                  data-idx="${i}"
                  maxlength="10"
                  style="padding:10px var(--space-3); font-size:15px;"
                />
              </div>
              ${players.length > 2 ? `<button class="btn btn-ghost btn-icon btn-sm remove-player" data-idx="${i}" style="color:var(--color-red); font-size:18px;">✕</button>` : ''}
            </div>
          `).join('')}
        </div>

        ${players.length < 6 ? `
          <button class="btn btn-ghost btn-full" id="btn-add" style="border-style:dashed;">
            ＋ プレイヤーを追加（最大6人）
          </button>
        ` : ''}

        <div class="spacer"></div>

        <button class="btn btn-primary btn-lg btn-full" id="btn-start">
          🎭 ゲームスタート！
        </button>
      </div>
    `;

    // Bind inputs
    container.querySelectorAll('input[data-idx]').forEach(input => {
      input.addEventListener('input', e => {
        players[+e.target.dataset.idx].name = e.target.value;
      });
    });

    container.querySelector('#btn-back')?.addEventListener('click', () => navigate('title'));
    container.querySelector('#btn-add')?.addEventListener('click', () => {
      players.push({ name: '' });
      render();
    });
    container.querySelectorAll('.remove-player').forEach(btn => {
      btn.addEventListener('click', e => {
        players.splice(+e.currentTarget.dataset.idx, 1);
        render();
      });
    });
    container.querySelector('#btn-start').addEventListener('click', () => {
      const named = players.map((p, i) => ({
        ...p,
        name: p.name.trim() || `プレイヤー${i + 1}`,
        id: `local-${i}`,
        isCpu: false,
      }));
      if (named.length < 2) { showToast('2人以上必要です', 'error'); return; }
      state.mode = 'local';
      state.players = named;
      navigate('game', { mode: 'local' });
    });
  };

  render();
}

export function unmount() {}
