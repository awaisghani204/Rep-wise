import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { PoseScreen } from './src/screens/PoseScreen';

/** Root component: the single Pose_Screen on a black background with a light status bar. */
export default function App() {
  return (
    <View style={styles.container}>
      <PoseScreen />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
