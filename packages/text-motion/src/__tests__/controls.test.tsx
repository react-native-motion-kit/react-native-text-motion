import {
  useTextMotionControls,
  type TextMotionControls,
} from '@react-native-motion-kit/text-motion';
import { render } from '@testing-library/react-native';
import { useEffect } from 'react';
import { Text } from 'react-native';

import {
  createTextMotionControlsHandle,
  readTextMotionControlsDescriptor,
  type TextMotionControlCommand,
} from '../controls/descriptors';

describe('text motion controls', () => {
  it('emits playback commands with monotonic ids', () => {
    const controls = createTextMotionControlsHandle();
    const commands: TextMotionControlCommand[] = [];

    readTextMotionControlsDescriptor(controls).subscribe((command) => {
      commands.push(command);
    });

    controls.play();
    controls.replay();
    controls.reset();
    controls.stop();

    expect(commands).toEqual([
      { id: 1, kind: 'play' },
      { id: 2, kind: 'replay' },
      { id: 3, kind: 'reset' },
      { id: 4, kind: 'stop' },
    ]);
  });

  it('removes listeners when unsubscribed', () => {
    const controls = createTextMotionControlsHandle();
    const descriptor = readTextMotionControlsDescriptor(controls);
    const commands: TextMotionControlCommand[] = [];
    const unsubscribe = descriptor.subscribe((command) => {
      commands.push(command);
    });

    expect(descriptor.getListenerCount()).toBe(1);

    unsubscribe();
    controls.play();

    expect(descriptor.getListenerCount()).toBe(0);
    expect(commands).toEqual([]);
  });

  it('fans out commands once per subscribed listener and stops after unsubscribe', () => {
    const controls = createTextMotionControlsHandle();
    const descriptor = readTextMotionControlsDescriptor(controls);
    const callsByListener = Array.from({ length: 64 }, (): TextMotionControlCommand[] => []);
    const unsubscribers = callsByListener.map((commands) =>
      descriptor.subscribe((command) => {
        commands.push(command);
      }),
    );

    controls.replay();
    controls.stop();

    expect(callsByListener.every((commands) => commands.length === 2)).toBe(true);
    expect(callsByListener.every((commands) => commands[0]?.kind === 'replay')).toBe(true);
    expect(callsByListener.every((commands) => commands[1]?.kind === 'stop')).toBe(true);

    unsubscribers.forEach((unsubscribe) => unsubscribe());
    controls.play();

    expect(callsByListener.every((commands) => commands.length === 2)).toBe(true);
  });

  it('keeps old controls inactive after moving a listener to a different controls object', () => {
    const firstControls = createTextMotionControlsHandle();
    const secondControls = createTextMotionControlsHandle();
    const firstDescriptor = readTextMotionControlsDescriptor(firstControls);
    const secondDescriptor = readTextMotionControlsDescriptor(secondControls);
    const firstCommands: TextMotionControlCommand[] = [];
    const secondCommands: TextMotionControlCommand[] = [];
    const unsubscribeFirst = firstDescriptor.subscribe((command) => {
      firstCommands.push(command);
    });

    unsubscribeFirst();
    secondDescriptor.subscribe((command) => {
      secondCommands.push(command);
    });

    firstControls.play();
    secondControls.play();

    expect(firstDescriptor.getListenerCount()).toBe(0);
    expect(secondDescriptor.getListenerCount()).toBe(1);
    expect(firstCommands).toEqual([]);
    expect(secondCommands).toEqual([{ id: 1, kind: 'play' }]);
  });

  it('does not expose descriptor fields on the public controls object', () => {
    const controls = createTextMotionControlsHandle();

    expect(Object.keys(controls)).toEqual(['play', 'replay', 'reset', 'stop']);
    expect('subscribe' in controls).toBe(false);
    expect('getListenerCount' in controls).toBe(false);
  });

  it('returns a stable controls object from the hook', async () => {
    const controlsSeen: TextMotionControls[] = [];
    const Harness = ({ label }: { label: string }) => {
      const controls = useTextMotionControls();

      useEffect(() => {
        controlsSeen.push(controls);
      }, [controls, label]);

      return <Text>{label}</Text>;
    };

    const view = await render(<Harness label="first" />);
    await view.rerender(<Harness label="second" />);

    expect(controlsSeen).toHaveLength(2);
    expect(controlsSeen[0]).toBe(controlsSeen[1]);
  });
});
