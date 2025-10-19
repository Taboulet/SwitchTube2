// Flipbook renderer targeting limited browsers.
// - Hidden <video> decodes; <canvas> displays.
// - Loading overlay estimates progress via buffered ranges.
// - Uses RAF loop; optionally requestVideoFrameCallback if available.

let rafId = null;
let playing = false;
let overlayVisible = true;

function $(id) { return document.getElementById(id); }

function updateOverlayText(text) {
  const el = $('status-text');
  if (el) el.textContent = text;
}

function updateProgressBar(video) {
  try {
    const dur = video.duration;
    if (!isFinite(dur) || dur <= 0 || video.buffered.length === 0) return;

    // Use last buffered range end as progress estimate
    const end = video.buffered.end(video.buffered.length - 1);
    const pct = Math.max(0, Math.min(100, Math.floor((end / dur) * 100)));
    const bar = $('bar-fill');
    if (bar) bar.style.width = pct + '%';
    updateOverlayText(pct < 100 ? `Loading frames… ${pct}%` : 'Loaded — ready to play');
    if (pct >= 98) hideOverlay();
  } catch (e) {
    // Some browsers throw; ignore and keep spinner
  }
}

function showOverlay() {
  const ov = $('overlay');
  if (ov) {
    ov.style.display = 'grid';
    overlayVisible = true;
  }
}
function hideOverlay() {
  const ov = $('overlay');
  if (ov) {
    ov.style.display = 'none';
    overlayVisible = false;
  }
}
function toggleOverlay() {
  overlayVisible ? showOverlay() : hideOverlay();
}

function drawFrame(ctx, video, canvas) {
  const vw = video.videoWidth || 640;
  const vh = video.videoHeight || 360;
  const cw = canvas.width;
  const ch = canvas.height;

  const vAspect = vw / vh;
  const cAspect = cw / ch;
  let dw, dh, dx, dy;
  if (vAspect > cAspect) {
    dw = cw;
    dh = Math.floor(cw / vAspect);
    dx = 0;
    dy = Math.floor((ch - dh) / 2);
  } else {
    dh = ch;
    dw = Math.floor(ch * vAspect);
    dx = Math.floor((cw - dw) / 2);
    dy = 0;
  }

  ctx.drawImage(video, dx, dy, dw, dh);
}

function loopRender(ctx, video, canvas) {
  if (!playing) return;
  drawFrame(ctx, video, canvas);
  rafId = requestAnimationFrame(() => loopRender(ctx, video, canvas));
}

function startFlipbook() {
  const video = $('src');
  const canvas = $('screen');
  const ctx = canvas.getContext('2d');

  // If metadata not ready, wait then start
  if (video.readyState < 1) {
    updateOverlayText('Preparing video…');
    video.addEventListener('loadedmetadata', () => startFlipbook(), { once: true });
    // Kick load
    try { video.load(); } catch (e) {}
    return;
  }

  playing = true;

  // Hide overlay if sufficiently buffered
  updateProgressBar(video);

  // Prefer frame callback if available
  if (typeof video.requestVideoFrameCallback === 'function') {
    const onFrame = () => {
      if (!playing) return;
      drawFrame(ctx, video, canvas);
      video.requestVideoFrameCallback(onFrame);
    };
    video.play().catch(() => {});
    video.requestVideoFrameCallback(onFrame);
  } else {
    // Fallback to RAF loop
    video.play().catch(() => {});
    loopRender(ctx, video, canvas);
  }
}

function pauseFlipbook() {
  const video = $('src');
  playing = false;
  try { video.pause(); } catch (e) {}
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}

function refreshPage() { location.reload(); }

// Initialize: prepare canvas, show overlay, try to play muted, track buffering
document.addEventListener('DOMContentLoaded', () => {
  const video = $('src');
  const canvas = $('screen');
  const ctx = canvas.getContext('2d');

  // Fill black initially
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  showOverlay();
  updateOverlayText('Loading frames… 0%');

  // Periodically update buffering progress
  const progressTimer = setInterval(() => {
    updateProgressBar(video);
  }, 300);

  // When enough data to play
  video.addEventListener('canplay', () => {
    updateOverlayText('Buffered — ready to play');
  });

  // Auto-start if autoplay permitted
  video.play().then(() => {
    startFlipbook();
  }).catch(() => {
    // Leave overlay up; user can press Start
    updateOverlayText('Tap ▶ Start to begin');
  });

  // Cleanup on page hide
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseFlipbook();
  });

  // Ensure timer cleared on unload
  window.addEventListener('unload', () => clearInterval(progressTimer));
});
