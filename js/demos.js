const PLAYER_ICONS = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5v17L21 12z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h5v18H5zM14 3h5v18h-5z"/></svg>',
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9h4l6-5v16l-6-5H2z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 9h4l6-5v16l-6-5H2z"/><path d="m15.5 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  full: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h7v2.5H5.5V10H3zM14 3h7v7h-2.5V5.5H14zM3 14h2.5v4.5H10V21H3zM18.5 14H21v7h-7v-2.5h4.5z"/></svg>',
};

let youTubeApi = null;
let activePlayer = null;

function loadYouTubeApi() {
  if (!youTubeApi) {
    youTubeApi = new Promise((resolve) => {
      window.onYouTubeIframeAPIReady = resolve;
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.append(script);
    });
  }
  return youTubeApi;
}

function formatTime(seconds) {
  const whole = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function mountPlayer(box) {
  const big = box.querySelector(".player-big");
  const frame = document.createElement("div");
  frame.className = "player-frame";
  const host = document.createElement("div");
  frame.append(host);

  const shield = document.createElement("button");
  shield.className = "player-shield";
  shield.type = "button";
  shield.setAttribute("aria-label", big.getAttribute("aria-label"));

  const bar = document.createElement("div");
  bar.className = "player-bar";
  bar.innerHTML =
    `<button class="player-toggle" type="button" aria-label="Play">${PLAYER_ICONS.play}</button>` +
    '<div class="player-track" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>' +
    '<span class="player-time">0:00 / 0:00</span>' +
    `<button class="player-mute" type="button" aria-label="Sound">${PLAYER_ICONS.sound}</button>` +
    `<button class="player-full" type="button" aria-label="Fullscreen">${PLAYER_ICONS.full}</button>`;

  box.prepend(frame);
  box.append(shield, bar);

  const toggle = bar.querySelector(".player-toggle");
  const track = bar.querySelector(".player-track");
  const time = bar.querySelector(".player-time");
  const mute = bar.querySelector(".player-mute");
  const full = bar.querySelector(".player-full");
  let player = null;
  let timer = null;

  function refresh() {
    if (!player || !player.getDuration) return;
    const duration = player.getDuration() || 0;
    const current = player.getCurrentTime() || 0;
    const ratio = duration ? current / duration : 0;
    track.style.setProperty("--p", ratio);
    track.setAttribute("aria-valuenow", Math.round(ratio * 100));
    time.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
    mute.innerHTML = player.isMuted() ? PLAYER_ICONS.muted : PLAYER_ICONS.sound;
  }

  function seekTo(event) {
    const box = track.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1);
    player.seekTo(ratio * player.getDuration(), true);
    refresh();
  }

  function handleState(state) {
    const playing = state === YT.PlayerState.PLAYING;
    box.classList.toggle("is-playing", playing);
    toggle.innerHTML = playing ? PLAYER_ICONS.pause : PLAYER_ICONS.play;
    toggle.setAttribute("aria-label", playing ? "Pause" : "Play");
    if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.PAUSED || state === YT.PlayerState.BUFFERING) {
      box.classList.add("is-started");
      big.classList.remove("is-loading");
    }
    if (state === YT.PlayerState.ENDED) {
      player.seekTo(0, true);
      player.pauseVideo();
      box.classList.remove("is-started", "is-playing");
    }
    clearInterval(timer);
    if (playing) timer = setInterval(refresh, 250);
    refresh();
  }

  const instance = {
    pause() {
      if (player) player.pauseVideo();
    },
    async start() {
      if (player) {
        player.playVideo();
        return;
      }
      big.classList.add("is-loading");
      await loadYouTubeApi();
      player = new YT.Player(host, {
        host: "https://www.youtube-nocookie.com",
        videoId: box.dataset.youtube,
        playerVars: { controls: 0, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3, disablekb: 1, fs: 0 },
        events: {
          onReady: () => {
            player.getIframe().title = box.dataset.title;
            player.playVideo();
          },
          onStateChange: (event) => handleState(event.data),
        },
      });
    },
    toggle() {
      if (activePlayer && activePlayer !== instance) activePlayer.pause();
      activePlayer = instance;
      if (player && player.getPlayerState && player.getPlayerState() === YT.PlayerState.PLAYING) {
        player.pauseVideo();
      } else {
        instance.start();
      }
    },
  };

  big.addEventListener("click", instance.toggle);
  shield.addEventListener("click", instance.toggle);
  toggle.addEventListener("click", instance.toggle);
  mute.addEventListener("click", () => {
    if (player.isMuted()) player.unMute();
    else player.mute();
    refresh();
  });
  full.addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (box.requestFullscreen) box.requestFullscreen();
  });
  track.addEventListener("pointerdown", (event) => {
    if (!player) return;
    track.setPointerCapture(event.pointerId);
    seekTo(event);
    const drag = (move) => seekTo(move);
    track.addEventListener("pointermove", drag);
    track.addEventListener("pointerup", () => track.removeEventListener("pointermove", drag), { once: true });
  });
  track.addEventListener("keydown", (event) => {
    if (!player || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    event.preventDefault();
    player.seekTo(player.getCurrentTime() + (event.key === "ArrowRight" ? 5 : -5), true);
    refresh();
  });

  instance.toggle();
}

document.addEventListener("click", (event) => {
  const big = event.target.closest(".player-big");
  if (!big) return;
  const box = big.closest(".player");
  if (box.dataset.ready) return;
  box.dataset.ready = "true";
  event.stopImmediatePropagation();
  mountPlayer(box);
}, true);
