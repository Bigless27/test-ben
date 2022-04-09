let lastTime = new Date().getTime();
const checkInterval = 10000;

setInterval(() => {
  const currentTime = new Date().getTime();

  // ignore small delays
  if (currentTime > lastTime + checkInterval * 2) {
    self.postMessage(`wake_up ${currentTime - lastTime}`);
  }

  lastTime = currentTime;
}, checkInterval);
