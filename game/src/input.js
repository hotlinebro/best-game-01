export function createInput(canvas, gesture = () => {}) {
  let actions = {}, mouse = { x: -100, y: -100, click: false, mode: 'place' };
  function point(e) {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * 1280 / r.width;
    mouse.y = (e.clientY - r.top) * 720 / r.height;
  }
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    gesture(); point(e); mouse.click = true; actions.start = true;
  });
  canvas.addEventListener('pointermove', point);
  addEventListener('keydown', e => {
    gesture();
    if (['Space', 'Enter', 'KeyP', 'KeyR', 'KeyM', 'Digit1', 'Digit2', 'KeyU'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    if (['Space', 'Enter'].includes(e.code)) actions.start = true;
    if (e.code === 'KeyP') actions.pause = true;
    if (e.code === 'KeyR') actions.restart = true;
    if (e.code === 'KeyM') actions.mute = true;
    if (e.code === 'Digit1') mouse.mode = 'place';
    if (e.code === 'Digit2') mouse.mode = 'upgrade';
    if (e.code === 'KeyU') actions.upgrade = true;
  });
  return { take() {
    const snapshot = { ...actions, mouse: { ...mouse } };
    actions = {}; mouse.click = false;
    return snapshot;
  } };
}
