import { StyleSheet, View } from 'react-native';
import type { Segment } from '../api/types';

interface ProgressSegmentsProps {
  segs: Segment[];
  onColor: string;
  height?: number;
  gap?: number;
}

export function ProgressSegments({ segs, onColor, height = 5, gap = 4 }: ProgressSegmentsProps) {
  return (
    <View style={[styles.row, { gap }]}>
      {segs.map((s, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height,
            borderRadius: height / 2,
            backgroundColor: s.on ? onColor : 'rgba(255,255,255,0.10)',
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
});
