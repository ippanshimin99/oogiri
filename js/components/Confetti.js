const COLORS = ['#FF6B35','#4ECDC4','#FFD93D','#58CC02','#C77DFF','#FF6B6B','#FFF'];
let animId = null;
let particles = [];

function createParticle(x, y) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 4 + Math.random() * 8;
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 6,
    w: 8 + Math.random() * 8,
    h: 6 + Math.random() * 6,
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 12,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    opacity: 1,
    gravity: 0.35,
  };
}

export function burst(x, y, count = 60) {
  const canvas = document.getElementById('confetti-canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  for (let i = 0; i < count; i++) {
    particles.push(createParticle(x ?? window.innerWidth / 2, y ?? window.innerHeight / 3));
  }

  if (!animId) tick();
}

export function bigCelebration() {
  const w = window.innerWidth;
  // Three bursts from different positions
  burst(w * 0.2, window.innerHeight * 0.3, 50);
  setTimeout(() => burst(w * 0.8, window.innerHeight * 0.3, 50), 150);
  setTimeout(() => burst(w * 0.5, window.innerHeight * 0.2, 80), 300);
}

function tick() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles = particles.filter(p => p.opacity > 0.01);

  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.99;
    p.rotation += p.rotSpeed;
    if (p.y > canvas.height * 0.6) p.opacity -= 0.025;
    else if (p.opacity < 1) p.opacity += 0.05;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.globalAlpha = Math.max(0, p.opacity);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  });

  if (particles.length > 0) {
    animId = requestAnimationFrame(tick);
  } else {
    animId = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}
