import { navigate } from '../router.js';

export function mount(container) {
  container.innerHTML = `
    <div class="screen" style="justify-content:center; gap:var(--space-6); padding-top:var(--space-10);">

      <!-- Logo area -->
      <div class="text-center animate-slideUp" style="gap:var(--space-3); display:flex; flex-direction:column; align-items:center;">
        <div style="font-size:72px; animation:float 3s ease-in-out infinite;">🎭</div>
        <div>
          <div class="heading-xl" style="
            background: linear-gradient(135deg, #FF6B35, #FFD93D);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          ">レンタル大喜利</div>
          <div style="font-size:14px; color:var(--text-secondary); margin-top:var(--space-2); font-weight:500;">
            市民でも大喜利したい！
          </div>
        </div>
      </div>

      <!-- Concept pills -->
      <div class="flex justify-center flex-wrap gap-2 animate-slideUp delay-1">
        <span class="badge badge-primary">🧠 こじつけ力</span>
        <span class="badge badge-teal">⚡ 即興性</span>
        <span class="badge badge-yellow">😂 発想力</span>
      </div>

      <!-- Mode cards -->
      <div style="display:flex; flex-direction:column; gap:var(--space-3); animation:slideUp 0.4s 0.1s cubic-bezier(0.34,1.2,0.64,1) both;">
        <button class="mode-card mode-card-primary" id="btn-local">
          <div class="mode-card-icon">👥</div>
          <div>
            <div class="mode-card-title">ローカル対戦</div>
            <div class="mode-card-desc">同じ画面で集まって遊ぶ<br>飲み会・友達の家に最適</div>
          </div>
        </button>
        <button class="mode-card mode-card-teal" id="btn-cpu">
          <div class="mode-card-icon">🤖</div>
          <div>
            <div class="mode-card-title">CPU対戦</div>
            <div class="mode-card-desc">ひとりでも大喜利できる<br>練習・腕試しに</div>
          </div>
        </button>
      </div>

      <!-- Rules button -->
      <button id="btn-rules" style="background:none; border:none; color:var(--text-muted); font-family:var(--font-heading); font-size:13px; font-weight:700; cursor:pointer; text-decoration:underline; margin-top:var(--space-2);">
        📖 遊び方を見る
      </button>

    </div>
  `;

  container.querySelector('#btn-local').addEventListener('click', () => navigate('local-setup'));
  container.querySelector('#btn-cpu').addEventListener('click', () => navigate('cpu-setup'));
  container.querySelector('#btn-rules').addEventListener('click', showRules);
}

export function unmount() {}

function showRules() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-sheet" style="max-width:520px;">
      <div class="modal-handle"></div>
      <div class="heading-md" style="margin-bottom:var(--space-5);">📖 レンタル大喜利 のルール</div>

      <div style="display:flex; flex-direction:column; gap:var(--space-4); color:var(--text-secondary); font-size:14px; line-height:1.7;">
        <div>
          <div style="font-weight:700; color:var(--text-primary); margin-bottom:4px;">🎴 手札</div>
          芸人風の名回答が書かれたカードが5枚配られます。
          これが「レンタル」する回答です。
        </div>
        <div>
          <div style="font-weight:700; color:var(--text-primary); margin-bottom:4px;">📋 お題</div>
          場に大喜利のお題カードが1枚めくれます。
        </div>
        <div>
          <div style="font-weight:700; color:var(--text-primary); margin-bottom:4px;">🎯 評価軸</div>
          「一番うまい」「一番無理やり」など、審査基準が決まります。
        </div>
        <div>
          <div style="font-weight:700; color:var(--text-primary); margin-bottom:4px;">🃏 カードを出す</div>
          手札から1枚選んで出します。元のお題とは違う、<strong style="color:var(--color-primary)">ランダムな回答</strong>をこじつけるのがポイント！
        </div>
        <div>
          <div style="font-weight:700; color:var(--text-primary); margin-bottom:4px;">🗳️ 投票</div>
          全員で「一番いいカード」に投票。自分には投票できません。
          多数票を取った人がお題カードをゲット！
        </div>
        <div>
          <div style="font-weight:700; color:var(--text-primary); margin-bottom:4px;">🏆 勝利条件</div>
          お題カードがなくなったらゲーム終了。最多獲得者の勝ち！
        </div>
      </div>

      <button id="close-rules" class="btn btn-primary btn-full" style="margin-top:var(--space-6);">OK、わかった！</button>
    </div>
  `;

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('#close-rules').addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}
