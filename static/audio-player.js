export async function playMidi(midiBlob, button) {
  const arrayBuffer = await midiBlob.arrayBuffer();
  const midiUrl = URL.createObjectURL(new Blob([arrayBuffer], { type: "audio/midi" }));

  const audio = new Audio(midiUrl);

  return new Promise((resolve, reject) => {
      audio.onended = () => {
          console.log("Music playback finished");
          if (button) {
              button.disabled = false;
              button.textContent = "Генерация";
          }
          resolve();
      };

      audio.onerror = (e) => {
          console.error("Ошибка при воспроизведении аудио", e);
          if (button) {
              button.disabled = false;
              button.textContent = "Генерация";
          }
          reject(e);
      };

      audio.play().catch((err) => {
          console.error("Ошибка при запуске воспроизведения", err);
          if (button) {
              button.disabled = false;
              button.textContent = "Генерация";
          }
          reject(err);
      });
  });
}
