import { navigate } from '../router.js';
import { state } from '../state.js';
import { createCpuPlayers } from '../game/CpuGame.js';
import { getPlayerColor, getPlayerEmoji } from '../components/Scoreboard.js';

export function mount(container) {
  let cpuCount = 2;

  const render = () => {
    const nameInput = container.querySelector('#player-name')?.value ?? '';

    container.innerHTML = `
      <div class="screen" style="gap:var(--space-5);">
        <div class="nav-header">
          <button class="btn btn-ghost btn-icon" id="btn-back">←</button>
          <div class="nav-title">🤖 CPU対戦</div>
          <div style="width:44px;"></div>
        </div>

        <!-- Your name -->
        <div class="panel" style="border:2px solid ${getPlayerColor(0)}33;">
          <div class="input-label" style="margin-bottom:var(--space-2);">あなたの名前</div>
          <div style="display:flex; align-items:center; gap:var(--space-3);">
            <div class="player-avatar" style="background:${getPlayerColor(0)}22; color:${getPlayerColor(0)};">
              ${getPlayerEmoji(0)}
            </div>
            <input id="player-name" class="input" placeholder="例: あなた" maxlength="10"
              style="padding:12px var(--space-3); font-size:16px;" value="${nameInput}"/>
          </div>
        </div>

        <!-- CPU count -->
        <div class="panel">
          <div class="input-label" style="margin-bottom:var(--space-4);">CPU の数: <span id="cpu-count-label" style="color:var(--color-purple); font-size:18px;">${cpuCount}</span> 体</div>
          <div style="display:flex; gap:var(--space-3); justify-content:center;">
            ${[1,2,3].map(n => `
              <button class="btn ${n === cpuCount ? 'btn-primary' : 'btn-ghost'} cpu-count-btn"
                data-n="${n}" style="flex:1; font-size:20px; font-weight:900;">
                ${n}
              </button>
            `).join('')}
          </div>

          <!-- CPU preview -->
          <div style="margin-top:var(--space-4); display:flex; flex-wrap:wrap; gap:var(--space-2);">
            ${createCpuPlayers(cpuCount).map((p, i) => `
              <div style="display:flex; align-items:center; gap:6px; padding:6px 10px;
                background:rgba(199,125,255,0.1); border-radius:var(--radius-md);
                border:1px solid rgba(199,125,255,0.2);">
                <span>${p.cpuEmoji}</span>
                <span style="font-family:var(--font-heading); font-size:13px; font-weight:700; color:var(--color-purple);">${p.name}</span>
                <span class="cpu-badge">CPU</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="spacer"></div>

        <button class="btn btn-teal btn-lg btn-full" id="btn-start">
          🤖 CPU と対戦する！
        </button>
      </div>
    `;

    container.querySelector('#btn-back').addEventListener('click', () => navigate('title'));

    container.querySelectorAll('.cpu-count-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        cpuCount = +e.currentTarget.dataset.n;
        render();
        // Restore name
        const ni = container.querySelector('#player-name');
        if (ni) ni.value = nameInput;
      });
    });

    container.querySelector('#btn-start').addEventListener('click', () => {
      const name = (container.querySelector('#player-name')?.value ?? '').trim() || 'あなた';
      const humanPlayer = { id: 'human-0', name, isCpu: false };
      state.mode = 'cpu';
      state.players = [humanPlayer, ...createCpuPlayers(cpuCount)];
      navigate('game', { mode: 'cpu' });
    });
  };

  render();
}

export function unmount() {}
