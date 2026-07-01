import { editorialRise } from '@react-native-motion-kit/text-motion/presets';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

const HeroReveal = editorialRise().component();

export default function App() {
  return (
    <View style={styles.container}>
      <HeroReveal style={styles.title}>Design motion that feels native</HeroReveal>
      <Text style={styles.caption}>
        Stable MVP: words, nativeText, stagger, and accessible tokens.
      </Text>
      <StatusBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 10,
    textAlign: 'center',
  },
  caption: {
    color: '#555',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 280,
    textAlign: 'center',
  },
});
