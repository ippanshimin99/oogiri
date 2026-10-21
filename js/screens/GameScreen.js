import { navigate } from '../router.js';
import { state } from '../state.js';
import { getCards } from '../cards-data.js';
import { LocalGame } from '../game/LocalGame.js';
import { CpuGame } from '../game/CpuGame.js';
import { createHand } from '../components/Hand.js';
import { createCard, flipCard } from '../components/Card.js';
import { createScoreboard, getPlayerColor, getPlayerEmoji } from '../components/Scoreboard.js';
import { burst } from '../components/Confetti.js';
import { showToast } from '../components/Toast.js';

// ── State ────────────────────────────────────────────
let _game = null;
let _scoreboard = null;
let _container = null;
let _mode = null;
let _onlineGame = null;

// ── Entry point ──────────────────────────────────────
export function mount(container, params) {
  _container = container;
  _mode = params.mode;
  _onlineGame = params.game ?? null;

  const cardsData = getCards();

  if (_mode === 'local') {
    _game = new LocalGame(state.players, cardsData);
    _bindLocalEvents();
    _game.start();
  } else if (_mode === 'cpu') {
    const human = state.players[0];
    const cpuCount = state.players.length - 1;
    _game = new CpuGame(human, cpuCount, cardsData);
    _bindLocalEvents();
    _game.start();
  } else if (_mode === 'online') {
    _bindOnlineEvents(params.roundData);
  }
}

export function unmount() {
  _game = null;
  _scoreboard = null;
  _container = null;
}

// ── Local / CPU event bindings ────────────────────────
function _bindLocalEvents() {
  _game
    .on('roundStart', data => _renderRound(data))
    .on('selectTurn', data => _renderSelectTurn(data))
    .on('playerPlayed', data => _onPlayerPlayed(data))
    .on('allPlayed', data => _renderReveal(data))
    .on('voteTurn', data => _renderVoteTurn(data))
    .on('aiVoted', data => _showAiVoteToast(data))
    .on('roundResult', data => _renderRoundResult(data))
    .on('gameOver', data => navigate('gameover', data));
}

// ── Online event bindings ─────────────────────────────
function _bindOnlineEvents(initialRound) {
  const og = _onlineGame;
  let myPlayerId = og.playerId;
  let myHand = [...og.hand];
  let currentPlayers = [];
  let hasPlayed = false;
  let hasVoted = false;

  og.on('new_round', data => {
    myHand = [...og.hand];
    hasPlayed = false;
    hasVoted = false;
    currentPlayers = data.players;
    _renderOnlineSelecting(data, myHand, og, () => { hasPlayed = true; });
  });

  og.on('player_played', ({ playerId, playsCount, totalPlayers }) => {
    const count = document.getElementById('plays-count');
    if (count) count.textContent = `${playsCount} / ${totalPlayers} 人が出しました`;
  });

  og.on('cards_revealed', ({ plays }) => {
    _renderReveal({ plays: plays.map(p => ({
      player: { id: p.playerId, name: p.playerName },
      card: p.card,
    }))});
    // Wire vote buttons for online
    _setupOnlineVoting(plays, og, myPlayerId, () => { hasVoted = true; });
  });

  og.on('vote_update', ({ votesCount, totalPlayers }) => {
    const el = document.getElementById('vote-status');
    if (el) el.textContent = `${votesCount} / ${totalPlayers} 人が投票しました`;
  });

  og.on('round_result', data => {
    const wins = (data.scores ?? []).map(p => ({ id: p.id, name: p.name, score: p.score }));
    const plays = []; // already on screen
    _renderRoundResult({
      winnerId: data.winnerId,
      winner: { id: data.winnerId, name: data.winnerName },
      tally: data.tally,
      scores: wins,
      isHost: og.isHost,
      onNext: () => og.nextRound(),
    });
  });

  og.on('game_over', data => navigate('gameover', data));

  // Kick off with initial round data
  if (initialRound) {
    myHand = [...og.hand];
    currentPlayers = initialRound.players;
    _renderOnlineSelecting(initialRound, myHand, og, () => { hasPlayed = true; });
  }
}

// ── Round header (shared) ─────────────────────────────
function _renderRoundHeader(round, totalRounds, players, topic, evaluation) {
  _container.innerHTML = '';

  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.style.cssText = 'gap:var(--space-3); overflow-y:auto;';

  // Header bar
  const header = document.createElement('div');
  header.style.cssText = 'display:flex; align-items:center; justify-content:space-between; flex-shrink:0;';
  header.innerHTML = `
    <div style="font-family:var(--font-heading); font-size:13px; font-weight:700; color:var(--text-muted);">
      📋 第 ${round} 回
    </div>
    <div class="phase-pill phase-selecting" id="phase-label">カード選択中</div>
    <div></div>
  `;

  // Progress bar
  const progress = document.createElement('div');
  progress.className = 'progress-bar';
  progress.innerHTML = `<div class="progress-bar-fill" style="width:${(round / totalRounds) * 100}%"></div>`;

  // Scoreboard
  const sb = createScoreboard(players);
  _scoreboard = sb;

  // Topic card
  const topicEl = document.createElement('div');
  topicEl.className = 'topic-card animate-slideUp';
  topicEl.innerHTML = `
    <div class="topic-card-header">🎯 お題</div>
    <div class="topic-card-body">${topic.text}</div>
  `;

  // Eval badge
  const evalRow = document.createElement('div');
  evalRow.style.cssText = 'display:flex; align-items:center; gap:var(--space-3); flex-shrink:0;';
  evalRow.innerHTML = `
    <div class="eval-badge animate-slideUp delay-1">
      <span>🏅</span> 評価軸: ${evaluation.text}
    </div>
  `;

  screen.append(header, progress, sb.el, topicEl, evalRow);
  _container.appendChild(screen);
  return screen;
}

// ── Local: show whose turn it is ─────────────────────
function _renderRound(data) {
  // Just update internal state; _selectTurn will be emitted immediately after
}

function _renderSelectTurn({ player, playerIdx, totalPlayers }) {
  _container.innerHTML = '';

  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.style.cssText = 'gap:var(--space-5); justify-content:center; align-items:center; text-align:center;';

  const color = getPlayerColor(playerIdx);
  const emoji = getPlayerEmoji(playerIdx);

  screen.innerHTML = `
    <div style="font-family:var(--font-heading); font-size:13px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:.1em;">
      ${playerIdx === 0 ? '第 ' + (_game?.round ?? '?') + ' 回' : '次のプレイヤー'}
    </div>

    <div style="display:flex; flex-direction:column; align-items:center; gap:var(--space-4);">
      <div class="player-avatar animate-bounceIn"
        style="width:90px; height:90px; font-size:44px;
          background:${color}22; color:${color};
          border:4px solid ${color};
          border-radius:50%; display:flex; align-items:center; justify-content:center;">
        ${emoji}
      </div>
      <div>
        <div class="heading-lg" style="color:${color};">${player.name}</div>
        <div style="color:var(--text-muted); font-size:14px; margin-top:4px;">の番です</div>
      </div>
    </div>

    <div style="color:var(--text-secondary); font-size:14px; line-height:1.6;">
      他のプレイヤーは<strong style="color:var(--text-primary);">画面から目を離して</strong>ください
    </div>

    <button class="btn btn-primary btn-lg" id="btn-show-hand" style="min-width:200px;">
      🃏 手札を見る
    </button>
  `;

  _container.appendChild(screen);

  screen.querySelector('#btn-show-hand').addEventListener('click', () => {
    _renderHandPicker(player, playerIdx);
  });
}

// ── Local: show hand and let player pick ──────────────
function _renderHandPicker(player, playerIdx) {
  _container.innerHTML = '';
  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.style.cssText = 'gap:var(--space-4);';

  const color = getPlayerColor(playerIdx);

  // Header
  screen.innerHTML = `
    <div style="display:flex; align-items:center; gap:var(--space-3); flex-shrink:0;">
      <div class="player-avatar" style="width:40px; height:40px; font-size:20px;
        background:${color}22; color:${color}; border-radius:50%;
        display:flex; align-items:center; justify-content:center;">
        ${getPlayerEmoji(playerIdx)}
      </div>
      <div style="font-family:var(--font-heading); font-weight:800; color:${color};">${player.name} の手札</div>
    </div>

    <div class="topic-card" style="flex-shrink:0;">
      <div class="topic-card-header">🎯 お題</div>
      <div class="topic-card-body">${_game.currentTopic.text}</div>
    </div>
    <div class="eval-badge" style="align-self:flex-start; flex-shrink:0;">
      🏅 評価軸: ${_game.currentEvaluation.text}
    </div>

    <div style="font-family:var(--font-heading); font-size:13px; font-weight:700; color:var(--text-secondary); flex-shrink:0;">
      ← スクロールしてカードを選ぼう →
    </div>
  `;

  // Hand
  const actualPlayer = _game.players[playerIdx];
  const { el: handEl, getSelected } = createHand(actualPlayer.hand, {});
  screen.appendChild(handEl);

  // Confirm button
  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn btn-primary btn-lg btn-full';
  confirmBtn.textContent = '🃏 このカードを出す';
  confirmBtn.disabled = true;

  // Selection state
  let selectedCard = null;
  const { el: handEl2, getSelected: getSelected2 } = createHand(actualPlayer.hand, {
    onSelect: (card) => {
      selectedCard = card;
      confirmBtn.disabled = !card;
      confirmBtn.textContent = card ? `「${card.text}」を出す！` : '🃏 このカードを出す';
    },
  });

  // Replace hand with interactive version
  handEl.remove();
  screen.appendChild(handEl2);
  screen.appendChild(confirmBtn);

  confirmBtn.addEventListener('click', () => {
    if (!selectedCard) return;
    _game.humanPlay(playerIdx, selectedCard);
  });

  _container.appendChild(screen);
}

// ── Player played notification ────────────────────────
function _onPlayerPlayed({ player, playsCount, totalPlayers }) {
  // Toast feedback
  showToast(`${player.name} がカードを出しました（${playsCount}/${totalPlayers}）`, 'info', 1500);
}

// ── Reveal all cards ──────────────────────────────────
function _renderReveal({ plays }) {
  _container.innerHTML = '';
  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.style.cssText = 'gap:var(--space-5); align-items:center;';

  screen.innerHTML = `
    <div class="text-center animate-bounceIn">
      <div style="font-size:48px;">🎴</div>
      <div class="heading-md" style="margin-top:var(--space-3);">カードを公開！</div>
      <div id="vote-status" style="font-size:14px; color:var(--text-secondary); margin-top:4px;"></div>
    </div>

    <div class="plays-area" id="plays-area"></div>
  `;

  const playsArea = screen.querySelector('#plays-area');
  plays.forEach((play, i) => {
    const wrapper = createCard(play.card, {
      label: play.player.name,
      animate: true,
      dealDelay: i * 120,
    });
    // Add custom reveal animation
    wrapper.cardEl.style.animation = `cardReveal 0.6s ${i * 120}ms cubic-bezier(0.34,1.4,0.64,1) both`;
    playsArea.appendChild(wrapper);
    // Burst confetti slightly staggered
    setTimeout(() => {
      const rect = wrapper.getBoundingClientRect();
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 15);
    }, i * 120 + 300);
  });

  _container.appendChild(screen);
}

// ── Local: voting turn ────────────────────────────────
function _renderVoteTurn({ player, playerIdx, plays }) {
  _container.innerHTML = '';
  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.style.cssText = 'gap:var(--space-5);';

  const color = getPlayerColor(playerIdx);

  screen.innerHTML = `
    <div style="display:flex; align-items:center; gap:var(--space-3);">
      <div class="player-avatar" style="width:44px; height:44px; font-size:22px;
        background:${color}22; color:${color}; border-radius:50%;
        display:flex; align-items:center; justify-content:center;">
        ${getPlayerEmoji(playerIdx)}
      </div>
      <div>
        <div style="font-family:var(--font-heading); font-weight:800; color:${color};">${player.name}</div>
        <div class="eval-badge" style="margin-top:4px;">🏅 ${_game.currentEvaluation.text}</div>
      </div>
    </div>

    <div style="font-family:var(--font-heading); font-size:15px; color:var(--text-secondary);">
      一番 <strong style="color:var(--color-yellow);">${_game.currentEvaluation.text}</strong> と思うカードに投票してください
    </div>

    <div class="plays-area" id="vote-plays"></div>
  `;

  const area = screen.querySelector('#vote-plays');
  plays.forEach((play, i) => {
    const isOwn = play.player.id === player.id;
    const wrapper = createCard(play.card, {
      label: play.player.name + (isOwn ? ' 🙋(自分)' : ''),
      animate: true,
      dealDelay: i * 80,
    });

    const voteBtn = document.createElement('button');
    voteBtn.className = 'vote-btn';
    voteBtn.textContent = isOwn ? '🙋 自分に投票' : '👆 投票する';
    voteBtn.addEventListener('click', () => {
      screen.querySelectorAll('.vote-btn').forEach(b => { b.disabled = true; });
      voteBtn.classList.add('voted');
      voteBtn.textContent = '✅ 投票済み';
      setTimeout(() => _game.humanVote(playerIdx, play.player.id), 400);
    });
    wrapper.appendChild(voteBtn);

    area.appendChild(wrapper);
  });

  _container.appendChild(screen);
}

// ── Online: voting (wire up after reveal) ─────────────
function _setupOnlineVoting(plays, og, myPlayerId, onVoted) {
  const area = document.getElementById('plays-area');
  if (!area) return;

  const voteStatus = document.createElement('div');
  voteStatus.id = 'vote-status';
  voteStatus.style.cssText = 'text-align:center; font-family:var(--font-heading); font-size:14px; color:var(--text-secondary); margin-top:4px;';
  area.parentElement.insertBefore(voteStatus, area);

  plays.forEach((play) => {
    if (play.playerId === myPlayerId) return;

    const wrapper = area.querySelector(`[data-player-id="${play.playerId}"]`) ??
      area.children[plays.indexOf(play)];

    const voteBtn = document.createElement('button');
    voteBtn.className = 'vote-btn';
    voteBtn.textContent = '👆 投票する';
    voteBtn.addEventListener('click', () => {
      area.querySelectorAll('.vote-btn').forEach(b => { b.disabled = true; });
      voteBtn.classList.add('voted');
      voteBtn.textContent = '✅ 投票済み';
      og.vote(play.playerId);
      onVoted();
    });

    if (wrapper) wrapper.appendChild(voteBtn);
  });
}

// ── Online: selecting phase ───────────────────────────
function _renderOnlineSelecting(data, hand, og, onPlayed) {
  const { round, totalRounds, topicCard, evaluationCard, players } = data;
  const screen = _renderRoundHeader(round, totalRounds, players, topicCard, evaluationCard);

  // Plays status
  const playsStatus = document.createElement('div');
  playsStatus.id = 'plays-count';
  playsStatus.style.cssText = 'font-family:var(--font-heading); font-size:14px; color:var(--text-secondary); text-align:center; flex-shrink:0;';
  playsStatus.textContent = `0 / ${players.length} 人が出しました`;

  // Hand label
  const handLabel = document.createElement('div');
  handLabel.style.cssText = 'font-family:var(--font-heading); font-size:13px; font-weight:700; color:var(--text-secondary); flex-shrink:0;';
  handLabel.textContent = '← あなたの手札（1枚選んで出す） →';

  // Confirm button
  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn btn-primary btn-lg btn-full';
  confirmBtn.textContent = '🃏 カードを出す';
  confirmBtn.disabled = true;
  confirmBtn.style.flexShrink = '0';

  let selected = null;
  const { el: handEl } = createHand(hand, {
    onSelect: (card) => {
      selected = card;
      confirmBtn.disabled = !card;
      confirmBtn.textContent = card ? `「${card.text}」を出す！` : '🃏 カードを出す';
    },
  });

  confirmBtn.addEventListener('click', () => {
    if (!selected) return;
    confirmBtn.disabled = true;
    confirmBtn.textContent = '✅ 出しました！待機中...';
    og.playCard(selected.id);
    onPlayed();
  });

  screen.append(playsStatus, handLabel, handEl, confirmBtn);
}

// ── AI審判トースト ────────────────────────────────────
function _showAiVoteToast({ targetName }) {
  showToast(`🤖 AI審判が「${targetName}」に投票しました！`, 'info', 2500);
}

// ── Round result ──────────────────────────────────────
function _renderRoundResult({ winnerId, winner, tally, voteDetails, scores, isHost, onNext }) {
  _container.innerHTML = '';
  const screen = document.createElement('div');
  screen.className = 'screen';
  screen.style.cssText = 'gap:var(--space-5); align-items:center; text-align:center;';

  const isOnline = _mode === 'online';
  const actualIsHost = isOnline ? isHost : true;

  // Fireworks
  setTimeout(() => burst(window.innerWidth / 2, window.innerHeight * 0.25, 80), 100);
  setTimeout(() => burst(window.innerWidth * 0.2, window.innerHeight * 0.3, 40), 350);
  setTimeout(() => burst(window.innerWidth * 0.8, window.innerHeight * 0.3, 40), 500);

  // Build vote bars
  const playsWithVotes = (Object.entries(tally ?? {})).map(([pid, votes]) => {
    const name = scores.find(p => p.id === pid)?.name ?? pid;
    return { pid, name, votes };
  }).sort((a, b) => b.votes - a.votes);

  screen.innerHTML = `
    <div class="animate-bounceIn" style="display:flex; flex-direction:column; align-items:center; gap:var(--space-3);">
      <div style="font-size:72px; animation:winnerBounce 0.6s 0.2s cubic-bezier(0.34,1.4,0.64,1) both;">🏆</div>
      <div class="heading-lg" style="color:var(--color-yellow);">${winner.name}</div>
      <div style="font-size:14px; color:var(--text-secondary);">今ラウンドの優勝！</div>
    </div>

    <!-- Vote breakdown -->
    <div class="panel" style="width:100%; align-self:stretch;">
      <div class="panel-header">票数</div>
      <div style="display:flex; flex-direction:column; gap:var(--space-3);">
        ${playsWithVotes.map((p, i) => `
          <div>
            <div style="display:flex; justify-content:space-between; font-family:var(--font-heading); font-size:13px; margin-bottom:4px;">
              <span>${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} ${p.name}</span>
              <span style="color:var(--color-yellow); font-weight:900;">${p.votes} 票</span>
            </div>
            <div class="progress-bar">
              <div class="progress-bar-fill" style="width:${playsWithVotes[0].votes ? (p.votes / playsWithVotes[0].votes) * 100 : 0}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Who voted for whom -->
    ${(voteDetails ?? []).length > 0 ? `
    <div class="panel" style="width:100%; align-self:stretch;">
      <div class="panel-header">投票内訳</div>
      <div style="display:flex; flex-direction:column; gap:var(--space-2);">
        ${(voteDetails ?? []).map(v => `
          <div style="display:flex; align-items:center; gap:var(--space-2); font-family:var(--font-heading); font-size:13px;">
            <span style="color:var(--text-secondary); min-width:100px; font-weight:700;">${v.voterName}</span>
            <span style="color:var(--text-muted);">→</span>
            <span style="color:var(--text-primary); font-weight:800;">${v.targetName}</span>
            ${v.voterId === 'ai' ? '<span class="cpu-badge" style="margin-left:4px;">AI審判</span>' : ''}
            ${v.voterId !== 'ai' && v.voterId === v.targetId ? '<span style="font-size:10px; color:var(--color-primary);">（自票）</span>' : ''}
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- Scores -->
    <div class="panel" style="width:100%; align-self:stretch;">
      <div class="panel-header">現在の得点</div>
      <div style="display:flex; flex-wrap:wrap; gap:var(--space-2);" id="score-list">
        ${scores.sort((a,b) => b.score - a.score).map((p, i) => `
          <div class="score-pip ${i === 0 ? 'leading' : ''}">
            <span>${i === 0 ? '👑' : ''} ${p.name}</span>
            <span class="score-val">${p.score}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div style="width:100%; flex-shrink:0;">
      ${actualIsHost ? `
        <button class="btn btn-primary btn-lg btn-full" id="btn-next">
          次のラウンドへ →
        </button>
      ` : `
        <div style="display:flex; justify-content:center; gap:12px; align-items:center;">
          <div class="waiting-dots"><span></span><span></span><span></span></div>
          <span style="font-family:var(--font-heading); font-weight:700; color:var(--text-secondary);">
            ホストが次のラウンドを開始します
          </span>
        </div>
      `}
    </div>
  `;

  _container.appendChild(screen);

  screen.querySelector('#btn-next')?.addEventListener('click', () => {
    if (_mode === 'online' && onNext) {
      onNext();
    } else if (_game) {
      _game.nextRound();
    }
  });
}
