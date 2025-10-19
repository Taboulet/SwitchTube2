function reloadVideo() {
  const player = document.getElementById('player');
  // Force reload without full page refresh
  const currentTime = player.currentTime;
  player.pause();
  player.src = "demo.mp4";
  // Some Switch browsers need .load() before play()
  player.load();
  player.currentTime = currentTime || 0;
  player.play().catch(() => {});
}

function refreshPage() {
  // Full page reload
  location.reload();
}

// Autoplay fallback for restrictive browsers
document.addEventListener('DOMContentLoaded', () => {
  const player = document.getElementById('player');
  player.play().catch(() => {
    // If autoplay blocked, show a hint
    const btn = document.createElement('div');
    btn.textContent = "Tap ▶ Reload video to start playback";
    btn.style.marginTop = "8px";
    document.querySelector('.menu').appendChild(btn);
  });
});
