// Simple flipbook: draw every visible frame of the <video> to <canvas>
// Notes:
// - Audio is muted/omitted for now.
// - We render frames via requestAnimationFrame for broad compatibility.
// - If requestVideoFrameCallback is available, we use it for better frame timing.

let rafId = null;
let playing = false;

function drawFrame(ctx, video, canvas) {
  // Scale to canvas while preserving aspect ratio
  const vw = video.videoWidth || 1280;
  const vh = video.videoHeight || 720;
  const cw = canvas.width;
  const ch = canvas.height;

  // Fit video inside canvas (contain)
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
  const video = document.getElementById('src');
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');

  if (!video.src) {
    console.warn('demo.mp4 not loaded');
    return;
  }

  playing = true;

  // Try advanced callback if supported
  if (typeof video.requestVideoFrameCallback === 'function') {
    const onFrame = () => {
      if (!playing) return;
      drawFrame(ctx, video, canvas);
      video.requestVideoFrameCallback(onFrame);
    };
    video.play().catch(() => {});
    video.requestVideoFrameCallback(onFrame);
  } else {
    // Fallback: play and render via RAF
    video.play().catch(() => {});
    loopRender(ctx, video, canvas);
  }
}

function pauseFlipbook() {
  const video = document.getElementById('src');
  playing = false;
  try { video.pause(); } catch (e) {}
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function refreshPage() {
  location.reload();
}

// Auto-start if autoplay works; otherwise show Start button usage
document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('src');
  // Pre-size canvas to a friendly default
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Attempt silent autoplay; many browsers require user gesture even when muted
  video.play().then(() => {
    // If it plays, start drawing automatically
    startFlipbook();
  }).catch(() => {
    // If autoplay fails, user can press Start
    // We leave buttons visible for manual start
  });
});
