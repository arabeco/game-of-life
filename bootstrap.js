const setLoadingStatus = (text, progress) => {
  const status = document.getElementById("loading-status");
  const fill = document.getElementById("loading-progress-fill");
  if (status) status.textContent = text;
  if (fill && typeof progress === "number") {
    fill.style.width = `${Math.max(0, Math.min(100, progress))}%`;
  }
};

const applyEnv = (text) => {
  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .forEach((line) => {
      const [key, ...rest] = line.split("=");
      const value = rest.join("=").trim();
      if (key) window[key.trim()] = value;
    });
};

const loadEnv = async () => {
  try {
    setLoadingStatus("checando rede", 25);
    const res = await fetch("/R.env", { cache: "no-store" });
    if (!res.ok) return;
    setLoadingStatus("carregando configuracao", 55);
    const text = await res.text();
    applyEnv(text);
    setLoadingStatus("configuracao aplicada", 75);
  } catch {
    return;
  }
};

const withTimeout = (promise, ms) =>
  new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), ms);
    promise
      .then(() => {
        clearTimeout(timer);
        resolve(true);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(false);
      });
  });

setLoadingStatus("iniciando", 5);
await withTimeout(loadEnv(), 2000);
setLoadingStatus("carregando app", 85);
await import("./app.js");
setLoadingStatus("finalizando", 100);
