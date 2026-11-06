import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { formatVisibility } from '../pose/landmarks';

export interface StatsPanelProps {
  fps: number;
  avgLatencyMs: number | null;
  keyVisibility: number | null;
  style?: StyleProp<ViewStyle>;
}

/** Stats_Panel: shows Pose_FPS, mean Native_Latency, and key-landmark visibility. Positioned by the parent via `style`. */
function StatsPanelImpl({ fps, avgLatencyMs, keyVisibility, style }: StatsPanelProps) {
  const latency = avgLatencyMs === null ? '--' : avgLatencyMs.toFixed(1);
  return (
    <View style={[styles.panel, style]}>
      <Text style={styles.text}>{`Pose FPS: ${fps.toFixed(1)}`}</Text>
      <Text style={styles.text}>{`Latency: ${latency} ms`}</Text>
      <Text style={styles.text}>{`Visibility: ${formatVisibility(keyVisibility)}`}</Text>
    </View>
  );
}

export const StatsPanel = React.memo(StatsPanelImpl);

const styles = StyleSheet.create({
  panel: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
});
