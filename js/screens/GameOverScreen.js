import { navigate } from '../router.js';
import { bigCelebration } from '../components/Confetti.js';
import { getPlayerColor, getPlayerEmoji } from '../components/Scoreboard.js';

const MEDALS = ['🥇','🥈','🥉','🏅','🏅','🏅'];
const MESSAGES = [
  '圧倒的優勝！伝説の大喜利師誕生！',
  'すばらしいセンス！',
  '惜しかった！次こそ優勝！',
  'よく頑張りました！',
  '次は勝てるはず！',
  'これがレンタル大喜利の洗礼…',
];

export function mount(container, { finalScores }) {
  setTimeout(() => bigCelebration(), 300);

  container.innerHTML = `
    <div class="screen" style="gap:var(--space-5); align-items:center; text-align:center; padding-top:var(--space-8);">

      <div class="animate-bounceIn" style="display:flex; flex-direction:column; align-items:center; gap:var(--space-3);">
        <div style="font-size:72px; animation:float 2s ease-in-out infinite;">🎊</div>
        <div class="heading-xl" style="
          background:linear-gradient(135deg,#FFD93D,#FF6B35);
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          background-clip:text;
        ">ゲーム終了！</div>
        <div style="font-size:15px; color:var(--text-secondary);">${MESSAGES[0]}</div>
      </div>

      <!-- Rankings -->
      <div style="width:100%; display:flex; flex-direction:column; gap:var(--space-3); align-self:stretch;">
        ${finalScores.map((p, i) => `
          <div class="ranking-item rank-${i + 1} animate-slideUp delay-${i + 1}">
            <div class="ranking-position">${MEDALS[i] ?? '🏅'}</div>
            <div class="player-avatar" style="
              width:44px; height:44px; font-size:22px;
              background:${getPlayerColor(i)}22; color:${getPlayerColor(i)};
              border-radius:50%; display:flex; align-items:center; justify-content:center;
            ">${getPlayerEmoji(i)}</div>
            <div>
              <div style="font-family:var(--font-heading); font-weight:800; font-size:16px;">${p.name}</div>
              <div style="font-size:12px; color:var(--text-muted);">${MESSAGES[i] ?? ''}</div>
            </div>
            <div class="ranking-score">${p.score}<span style="font-size:12px; color:var(--text-muted);">pt</span></div>
          </div>
        `).join('')}
      </div>

      <div class="spacer"></div>

      <div style="display:flex; flex-direction:column; gap:var(--space-3); width:100%; align-self:stretch;">
        <button class="btn btn-primary btn-lg btn-full" id="btn-play-again">
          🔄 もう一度遊ぶ
        </button>
        <button class="btn btn-ghost btn-full" id="btn-home">
          🏠 タイトルに戻る
        </button>
      </div>

    </div>
  `;

  container.querySelector('#btn-play-again').addEventListener('click', () => {
    // Go back to same mode setup
    const mode = window._lastMode ?? 'local';
    if (mode === 'local') navigate('local-setup');
    else if (mode === 'cpu') navigate('cpu-setup');
    else navigate('online-setup');
  });

  container.querySelector('#btn-home').addEventListener('click', () => navigate('title'));
}

export function unmount() {}
