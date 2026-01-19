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
    const res = await fetch("/R.env", { cache: "no-store" });
    if (!res.ok) return;
    const text = await res.text();
    applyEnv(text);
  } catch {
    return;
  }
};

await loadEnv();
await import("./app.js");
