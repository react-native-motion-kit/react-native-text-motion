jest.mock('react-native-reanimated', () => {
  const Reanimated = jest.requireActual('react-native-reanimated');

  return {
    ...Reanimated,
    useReducedMotion: jest.fn(() => false),
  };
});

require('react-native-reanimated').setUpTests();
