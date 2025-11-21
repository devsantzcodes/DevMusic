document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Element References ---
  const player = document.querySelector(".player");
  const playPauseBtn = player.querySelector(".play-pause");
  const nextBtn = player.querySelector(".next");
  const prevBtn = player.querySelector(".prev");
  const shuffleBtn = player.querySelector(".shuffle");
  const repeatBtn = player.querySelector(".repeat");
  const progressBar = player.querySelector(
    ".progress-bar-container .progress-bar"
  );
  const progressFill = player.querySelector(
    ".progress-bar-container .progress-fill"
  );
  const currentTimeEl = player.querySelector(
    ".progress-bar-container span:first-child"
  );
  const durationEl = player.querySelector(
    ".progress-bar-container span:last-child"
  );
  const volumeSlider = player.querySelector(".volume-controls .progress-bar");
  const volumeFill = player.querySelector(".volume-controls .progress-fill");
  const currentTrackImg = player.querySelector(".current-track img");
  const currentTrackTitle = player.querySelector(".current-track h4");
  const currentTrackArtist = player.querySelector(".current-track p");

  // --- State Management ---
  const audio = new Audio();
  let isPlaying = false;
  let currentTrackIndex = 0;
  let isShuffled = false;
  let repeatMode = "off"; // 'off', 'all', 'one'

  // --- Load Music Data from dados.json ---
  let playlist = [];

  async function loadPlaylist() {
    try {
      const response = await fetch("dados.json");
      const data = await response.json();
      playlist = data.musicas.map((musica) => ({
        id: musica.id,
        title: musica.titulo,
        artist: musica.artista,
        coverSrc: musica.capa,
        audioSrc: musica.audio,
      }));
      renderTrackCards();
    } catch (error) {
      console.error("Erro ao carregar dados.json:", error);
      // Fallback to hardcoded if fetch fails
      playlist = [
        {
          id: 0,
          title: "One",
          artist: "Metallica",
          coverSrc:
            "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
          audioSrc:
            "https://p.scdn.co/mp3-preview/b872eb4246d55713294b2b3b4a3e91d133326359?cid=cfe923b2d6604394a03da02f1f3e167a",
        },
        {
          id: 1,
          title: "Toxicity",
          artist: "System Of A Down",
          coverSrc:
            "https://i.scdn.co/image/ab67616d0000b273e3335327648788912ab23696",
          audioSrc:
            "https://p.scdn.co/mp3-preview/069a58349c3314f8a263d3a773b754e06f1a8475?cid=cfe923b2d6604394a03da02f1f3e167a",
        },
        {
          id: 2,
          title: "Smells Like Teen Spirit",
          artist: "Nirvana",
          coverSrc:
            "https://i.scdn.co/image/ab67616d0000b273a049d35aa573f3833852594d",
          audioSrc:
            "https://p.scdn.co/mp3-preview/d5f8c967b67892a3a8637932eda589133a8c7908?cid=cfe923b2d6604394a03da02f1f3e167a",
        },
        {
          id: 3,
          title: "Chop Suey!",
          artist: "System Of A Down",
          coverSrc:
            "https://i.scdn.co/image/ab67616d0000b273429b4483a3e597254599386e",
          audioSrc:
            "https://p.scdn.co/mp3-preview/34b0553d501534ae4a2c368332502a534215ceaa?cid=cfe923b2d6604394a03da02f1f3e167a",
        },
      ];
      renderTrackCards();
    }
  }

  function renderTrackCards() {
    const trackCardsContainer = document.querySelector(".track-grid");
    if (!trackCardsContainer) return;
    trackCardsContainer.innerHTML = ""; // Clear existing cards
    playlist.forEach((track, index) => {
      const card = document.createElement("div");
      card.className = "track-card";
      card.innerHTML = `
        <img src="${track.coverSrc}" alt="Album Cover" />
        <h3>${track.title}</h3>
        <p>${track.artist}</p>
      `;
      card.addEventListener("click", () => {
        loadTrack(index);
        playTrack();
      });
      trackCardsContainer.appendChild(card);
    });
  }

  // --- Core Functions ---
  function loadTrack(trackIndex) {
    const track = playlist[trackIndex];
    currentTrackImg.src = track.coverSrc;
    currentTrackTitle.textContent = track.title;
    currentTrackArtist.textContent = track.artist;
    audio.src = track.audioSrc;
    currentTrackIndex = trackIndex;

    // Handle audio loading errors
    audio.onerror = () => {
      console.error("Erro ao carregar o áudio:", track.audioSrc);
      alert("Erro ao carregar a música. Tente novamente.");
      pauseTrack();
    };
  }

  function playTrack() {
    isPlaying = true;
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    // Use a Promise to handle potential browser autoplay restrictions
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.error("Erro ao tentar tocar o áudio:", error);
        pauseTrack(); // Se der erro, volte para o estado de pausa
      });
    }
  }

  function pauseTrack() {
    isPlaying = false;
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    audio.pause();
  }

  function playNext() {
    currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(currentTrackIndex);
    playTrack();
  }

  function playPrev() {
    currentTrackIndex =
      (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrackIndex);
    playTrack();
  }

  function updateProgress() {
    const { duration, currentTime } = audio;
    const progressPercent = (currentTime / duration) * 100;
    progressFill.style.width = `${progressPercent}%`;

    // Update time display
    durationEl.textContent = formatTime(duration);
    currentTimeEl.textContent = formatTime(currentTime);
  }

  function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
  }

  function setVolume(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const volume = clickX / width;
    audio.volume = volume;
    volumeFill.style.width = `${volume * 100}%`;
    saveState();
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  }

  // --- State Persistence ---
  function saveState() {
    const state = {
      trackIndex: currentTrackIndex,
      currentTime: audio.currentTime,
      volume: audio.volume,
    };
    localStorage.setItem("musicPlayerState", JSON.stringify(state));
  }

  function loadState() {
    const state = JSON.parse(localStorage.getItem("musicPlayerState"));
    if (state) {
      loadTrack(state.trackIndex);
      // Set currentTime only after metadata is loaded to avoid errors
      audio.onloadedmetadata = () => {
        audio.currentTime = state.currentTime;
      };
      audio.volume = state.volume;
      volumeFill.style.width = `${state.volume * 100}%`;
    } else {
      // Default state
      loadTrack(0);
      audio.volume = 0.8;
      volumeFill.style.width = "80%";
    }
  }

  // --- Shuffle and Repeat Functions ---
  function toggleShuffle() {
    isShuffled = !isShuffled;
    shuffleBtn.classList.toggle("active", isShuffled);
  }

  function toggleRepeat() {
    if (repeatMode === "off") {
      repeatMode = "all";
      repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
    } else if (repeatMode === "all") {
      repeatMode = "one";
      repeatBtn.innerHTML = '<i class="fas fa-redo-alt"></i>';
    } else {
      repeatMode = "off";
      repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
    }
    repeatBtn.classList.toggle("active", repeatMode !== "off");
  }

  // --- Event Listeners ---
  playPauseBtn.addEventListener("click", () =>
    isPlaying ? pauseTrack() : playTrack()
  );
  nextBtn.addEventListener("click", playNext);
  prevBtn.addEventListener("click", playPrev);
  shuffleBtn.addEventListener("click", toggleShuffle);
  repeatBtn.addEventListener("click", toggleRepeat);
  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("ended", () => {
    if (repeatMode === "one") {
      audio.currentTime = 0;
      playTrack();
    } else if (repeatMode === "all" || isShuffled) {
      playNext();
    } else {
      pauseTrack();
    }
  });
  progressBar.addEventListener("click", setProgress);
  volumeSlider.addEventListener("click", setVolume);

  // Save state before leaving the page
  window.addEventListener("beforeunload", saveState);

  // --- Initial Load ---
  loadPlaylist().then(() => {
    loadState();
  });

  // --- Sidebar Toggle ---
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  const container = document.querySelector(".container");

  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      sidebar.classList.toggle("show");
    });
  }

  if (container && sidebar) {
    container.addEventListener("click", (e) => {
      if (
        window.innerWidth <= 768 &&
        sidebar.classList.contains("show") &&
        !sidebar.contains(e.target)
      ) {
        sidebar.classList.remove("show");
      }
    });
  }
});
