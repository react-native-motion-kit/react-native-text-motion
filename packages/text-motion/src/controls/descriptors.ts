import type { TextMotionControls } from './controls';

import { textMotionControlsBrand } from './brand';

export type TextMotionControlCommandKind = 'play' | 'replay' | 'reset' | 'stop';

export type TextMotionControlCommand = {
  id: number;
  kind: TextMotionControlCommandKind;
};

export type TextMotionControlCommandListener = (command: TextMotionControlCommand) => void;

export type TextMotionControlsDescriptor = {
  getListenerCount(): number;
  subscribe(listener: TextMotionControlCommandListener): () => void;
};

const controlsDescriptors = new WeakMap<TextMotionControls, TextMotionControlsDescriptor>();

export function createTextMotionControlsHandle(): TextMotionControls {
  const listeners = new Set<TextMotionControlCommandListener>();
  const descriptor: TextMotionControlsDescriptor = {
    getListenerCount() {
      return listeners.size;
    },
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
  const emit = createTextMotionControlEmitter(listeners);
  const controls: TextMotionControls = {
    [textMotionControlsBrand]: true,
    play() {
      emit('play');
    },
    replay() {
      emit('replay');
    },
    reset() {
      emit('reset');
    },
    stop() {
      emit('stop');
    },
  };

  controlsDescriptors.set(controls, descriptor);

  return controls;
}

export function readTextMotionControlsDescriptor(
  controls: TextMotionControls,
): TextMotionControlsDescriptor {
  const descriptor = controlsDescriptors.get(controls);

  if (descriptor) {
    return descriptor;
  }

  throw new Error('@react-native-motion-kit/text-motion received an unknown controls handle.');
}

function createTextMotionControlEmitter(
  listeners: Set<TextMotionControlCommandListener>,
): (kind: TextMotionControlCommandKind) => void {
  let nextCommandId = 0;

  return (kind) => {
    const command = {
      id: nextCommandId + 1,
      kind,
    };

    nextCommandId = command.id;
    listeners.forEach((listener) => listener(command));
  };
}
