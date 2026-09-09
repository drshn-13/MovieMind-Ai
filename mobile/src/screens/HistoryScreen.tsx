import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import {
  History,
  Trash2,
  Search,
  Film,
  Sparkles,
  Volume2,
  Heart,
  Compass,
} from 'lucide-react-native';
import { userApi } from '../api/user';
import { ActivityHistoryItem } from '../types';
import { useAuth } from '../context/AuthContext';

export const HistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const [history, setHistory] = useState<ActivityHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      const res = await userApi.getHistory();
      setHistory(res.history);
    } catch (e) {
      console.error('Error fetching history:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear your entire activity history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await userApi.clearHistory();
              setHistory([]);
            } catch (e) {
              Alert.alert('Error', 'Could not clear history.');
            }
          },
        },
      ]
    );
  };

  const renderIcon = (type: ActivityHistoryItem['activityType']) => {
    switch (type) {
      case 'search':
        return <Search size={16} color="#60a5fa" />;
      case 'movie_view':
        return <Film size={16} color="#94a3b8" />;
      case 'ai_summary':
        return <Sparkles size={16} color="#f59e0b" />;
      case 'audio_summary':
        return <Volume2 size={16} color="#10b981" />;
      case 'favorite_add':
      case 'favorite_remove':
        return <Heart size={16} color="#ef4444" />;
      case 'recommendation_view':
        return <Compass size={16} color="#a855f7" />;
      default:
        return <History size={16} color="#64748b" />;
    }
  };

  const formatActivityDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.centerBox}>
        <StatusBar barStyle="light-content" backgroundColor="#090d16" />
        <History size={48} color="#475569" />
        <Text style={styles.authTitle}>Sign in to view activity history</Text>
        <TouchableOpacity
          style={styles.signInBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.signInBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <History size={22} color="#60a5fa" />
          <Text style={styles.headerTitle}>Activity & Search History</Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearHistory}>
            <Trash2 size={16} color="#ef4444" />
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading activity log...</Text>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.centerBox}>
          <History size={48} color="#475569" />
          <Text style={styles.emptyTitle}>No recent activity</Text>
          <Text style={styles.emptySubtitle}>
            Your searches, movie views, AI summaries, and audio listens will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.historyItem}
              onPress={() => {
                if (item.movieId && item.movieTitle) {
                  navigation.navigate('MovieDetails', {
                    movieId: item.movieId,
                    movieTitle: item.movieTitle,
                  });
                }
              }}
              disabled={!item.movieId}
            >
              <View style={styles.iconCircle}>{renderIcon(item.activityType)}</View>

              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.movieTitle || item.details || item.activityType.replace('_', ' ')}
                </Text>
                <Text style={styles.itemDetails} numberOfLines={1}>
                  {item.details || item.activityType.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.itemDate}>{formatActivityDate(item.createdAt)}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#090d16',
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 4,
  },
  clearBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131b2e',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  itemDetails: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  itemDate: {
    color: '#64748b',
    fontSize: 11,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  authTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  signInBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  signInBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
