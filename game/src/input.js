// Keyboard and touch share ordering, but retain independent held sources.
export class Input {
  constructor() {
    this.held = new Map();
    this.order = 0;
    this.edges = new Set();
  }

  press(action, source) {
    if (this.held.has(source)) return;
    const wasHeld = this.isHeld(action);
    this.held.set(source, { action, order: ++this.order });
    if (!wasHeld) this.edges.add(action);
  }

  release(source) {
    this.held.delete(source);
  }

  releasePointer(pointerId) {
    for (const source of this.held.keys()) {
      if (source.startsWith(`touch:${pointerId}:`)) this.held.delete(source);
    }
  }

  clearTouch() {
    for (const source of this.held.keys()) {
      if (source.startsWith('touch:')) this.held.delete(source);
    }
  }

  clear() {
    this.held.clear();
    this.edges.clear();
  }

  isHeld(action) {
    return [...this.held.values()].some(value => value.action === action);
  }

  direction() {
    let newest = 0;
    let direction = 0;
    for (const value of this.held.values()) {
      if ((value.action === 'left' || value.action === 'right') && value.order > newest) {
        newest = value.order;
        direction = value.action === 'left' ? -1 : 1;
      }
    }
    return direction;
  }

  take(action) {
    const result = this.edges.has(action);
    this.edges.delete(action);
    return result;
  }

  sample() {
    return {
      move: this.direction(), jump: this.isHeld('jump'),
      jumpPressed: this.take('jump'), downPressed: this.take('down'),
    };
  }
}

export function bindTouchButton(button, action, input) {
  const source = event => `touch:${event.pointerId}:${action}`;
  const press = event => {
    event.preventDefault();
    input.press(action, source(event));
    if (button.hasPointerCapture?.(event.pointerId)) button.releasePointerCapture(event.pointerId);
  };
  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerenter', event => {
    if (event.buttons > 0) press(event);
  });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave', 'lostpointercapture']) {
    button.addEventListener(type, event => input.release(source(event)));
  }
  button.addEventListener('contextmenu', event => event.preventDefault());
}

export function bindInput(input, target, buttons, command) {
  const keys = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    Space: 'jump', KeyW: 'jump', ArrowUp: 'jump', ArrowDown: 'down', KeyS: 'down',
  };
  target.addEventListener('keydown', event => {
    if (keys[event.code] || ['Enter', 'KeyP', 'KeyR', 'KeyM'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.repeat) return;
    if (keys[event.code]) input.press(keys[event.code], `key:${event.code}`);
    if (event.code === 'Enter' || event.code === 'Space') command('start');
    if (event.code === 'KeyP') command('pause');
    if (event.code === 'KeyR') command('restart');
    if (event.code === 'KeyM') command('mute');
  });
  target.addEventListener('keyup', event => input.release(`key:${event.code}`));
  for (const type of ['pointerup', 'pointercancel']) {
    target.addEventListener(type, event => {
      const button = event.target?.closest?.('[data-action]');
      if (button) input.releasePointer(event.pointerId); else input.clearTouch();
    });
  }
  target.addEventListener('blur', () => {
    input.clear();
    command('blur');
  });
  for (const button of buttons) bindTouchButton(button, button.dataset.action, input);
}
