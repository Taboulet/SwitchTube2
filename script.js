let frames = [];
let fps = 30; // default, will adjust from video metadata
let playing = false;

function $(id) { return document.getElementById(id); }

function refreshPage() { location.reload(); }

function extractFrames() {
  return new Promise((resolve) => {
    const video = $('src');
    const canvas = $('screen');
    const ctx = canvas.getContext('2d');

    video.addEventListener('loadedmetadata', () => {
      fps = video.frameRate || 30; // not always available
      const duration = video.duration;
      const totalFrames = Math.floor(duration * fps);

      let currentFrame = 0;

      function captureNext() {
        if (currentFrame >= totalFrames) {
          resolve();
          return;
        }
        video.currentTime = currentFrame / fps;
      }

      video.addEventListener('seeked', () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = new Image();
        img.src = canvas.toDataURL("image/jpeg", 0.6);
        frames.push(img);

        currentFrame++;
        $('status-text').textContent = `Extracting frame ${currentFrame}/${totalFrames}`;
        setTimeout(captureNext, 0); // async step
      });

      captureNext();
    });
  });
}

function playFrames() {
  if (frames.length === 0) return;
  const canvas = $('screen');
  const ctx = canvas.getContext('2d');
  let i = 0;
  playing = true;

  function nextFrame() {
    if (!playing) return;
    ctx.drawImage(frames[i], 0, 0, canvas.width, canvas.height);
    i++;
    if (i < frames.length) {
      setTimeout(nextFrame, 1000 / fps);
    }
  }
  nextFrame();
}

document.addEventListener('DOMContentLoaded', async () => {
  $('status-text').textContent = 'Extracting frames…';
  await extractFrames();
  $('overlay').style.display = 'none';
});
