const video = document.getElementById('src');
const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
let raf;

function draw() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  raf = requestAnimationFrame(draw);
}

function start() {
  overlay.style.display = 'none';
  video.play().then(() => {
    draw();
  }).catch(()=>{});
}

function pause() {
  video.pause();
  cancelAnimationFrame(raf);
}

function refreshPage() {
  location.reload();
}

video.addEventListener('canplay', () => {
  overlay.textContent = "Ready — press ▶";
});
