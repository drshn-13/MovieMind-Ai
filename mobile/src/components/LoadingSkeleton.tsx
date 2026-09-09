import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const LoadingSkeleton: React.FC<{ type?: 'cards' | 'details' | 'list' }> = ({ type = 'cards' }) => {
  if (type === 'details') {
    return (
      <View style={styles.detailsContainer}>
        <View style={styles.backdropSkeleton} />
        <View style={styles.detailsContent}>
          <View style={[styles.skeletonBlock, { width: '70%', height: 28, marginBottom: 12 }]} />
          <View style={[styles.skeletonBlock, { width: '40%', height: 16, marginBottom: 20 }]} />
          <View style={[styles.skeletonBlock, { width: '100%', height: 100, marginBottom: 20 }]} />
          <View style={[styles.skeletonBlock, { width: '100%', height: 50, marginBottom: 12 }]} />
        </View>
      </View>
    );
  }

  if (type === 'list') {
    return (
      <View style={styles.listContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.listItemSkeleton}>
            <View style={[styles.skeletonBlock, { width: 70, height: 100, borderRadius: 8 }]} />
            <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
              <View style={[styles.skeletonBlock, { width: '80%', height: 18, marginBottom: 8 }]} />
              <View style={[styles.skeletonBlock, { width: '50%', height: 14, marginBottom: 8 }]} />
              <View style={[styles.skeletonBlock, { width: '30%', height: 12 }]} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.skeletonBlock, { width: 160, height: 24, marginHorizontal: 16, marginBottom: 14 }]} />
      <View style={styles.row}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.cardSkeleton}>
            <View style={[styles.skeletonBlock, { width: 145, height: 215, borderRadius: 12 }]} />
            <View style={[styles.skeletonBlock, { width: 120, height: 14, marginTop: 8 }]} />
            <View style={[styles.skeletonBlock, { width: 70, height: 10, marginTop: 4 }]} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
  },
  row: {
    flexDirection: 'row',
    paddingLeft: 16,
  },
  cardSkeleton: {
    marginRight: 14,
  },
  skeletonBlock: {
    backgroundColor: '#1e293b',
    borderRadius: 6,
  },
  detailsContainer: {
    flex: 1,
  },
  backdropSkeleton: {
    width: '100%',
    height: 250,
    backgroundColor: '#1e293b',
  },
  detailsContent: {
    padding: 16,
  },
  listContainer: {
    padding: 16,
  },
  listItemSkeleton: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
  },
});
