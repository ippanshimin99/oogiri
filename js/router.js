const screens = {};
let _current = null;

export function registerScreen(name, module) {
  screens[name] = module;
}

export async function navigate(name, params = {}) {
  const container = document.getElementById('app');

  // Unmount current
  if (_current?.unmount) {
    try { _current.unmount(); } catch (_) { /* ignore */ }
  }

  container.innerHTML = '';
  container.classList.remove('screen-enter');

  const module = screens[name];
  if (!module) {
    console.error(`Screen "${name}" not registered.`);
    return;
  }

  // Trigger enter animation
  void container.offsetWidth; // force reflow
  container.classList.add('screen-enter');

  _current = module;
  await module.mount(container, params);
}
