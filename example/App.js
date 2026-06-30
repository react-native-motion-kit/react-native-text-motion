import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { multiply } from '@react-native-motion-kit/text-motion';

const smokeResult = multiply(3, 7);

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Text Motion workspace smoke</Text>
      <Text>3 x 7 = {smokeResult}</Text>
      <StatusBar style="auto" />
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
});
