export function navigateTo(path: string, { replace = false } = {}) {
  if (replace) {
    window.history.replaceState(null, "", path);
  } else {
    window.history.pushState(null, "", path);
  }
  // optional: dispatch a 'popstate' so listeners can handle it
  window.dispatchEvent(new PopStateEvent("popstate"));
}
