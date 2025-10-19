function loadVideo(file) {
  const player = document.getElementById('player');
  player.src = "videos/" + file;
  player.play();
}

function refreshPage() {
  location.reload();
}
