// src/editor/transport/formatTime.js
// -------------------------------------------------------------
// Converts seconds into HH:MM:SS format.
// -------------------------------------------------------------

export function formatTime(sec = 0) {
  sec = Math.max(0, sec);

  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = Math.floor(sec % 60);

  const hh = hours.toString().padStart(2, "0");
  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");

  return `${hh}:${mm}:${ss}`;
}
