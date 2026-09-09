import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import {
  User as UserIcon,
  Mail,
  Calendar,
  Lock,
  LogOut,
  Settings,
  Heart,
  Sparkles,
  Volume2,
  History,
  Edit2,
  Check,
  Zap,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/user';
import { authApi } from '../api/auth';
import { DashboardStats } from '../types';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, isAuthenticated, logout, demoLogin, updateUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Edit name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [updatingName, setUpdatingName] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLoadingStats(true);
      userApi
        .getDashboardStats()
        .then((res) => setStats(res.stats))
        .catch((e) => console.log('Stats error:', e))
        .finally(() => setLoadingStats(false));

      if (user) setNewName(user.name);
    }
  }, [isAuthenticated, user?.name]);

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setUpdatingName(true);
    try {
      const res = await authApi.updateProfile({ name: newName.trim() });
      updateUser(res.user);
      setIsEditingName(false);
      Alert.alert('Success', 'Profile name updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not update profile name.');
    } finally {
      setUpdatingName(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Missing Fields', 'Please enter your current and new password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'New password must be at least 6 characters.');
      return;
    }
    setUpdatingPassword(true);
    try {
      await authApi.updatePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Success', 'Password updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Current password incorrect or update failed.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of MovieMind AI?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#090d16" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account & Profile</Text>
        </View>
        <View style={styles.loggedOutContent}>
          <View style={styles.avatarCircleLarge}>
            <UserIcon size={44} color="#64748b" />
          </View>
          <Text style={styles.loggedOutTitle}>Sign in to your Account</Text>
          <Text style={styles.loggedOutSubtitle}>
            Unlock cross-device watchlists, history tracking, and AI summary analytics.
          </Text>

          <TouchableOpacity style={styles.primaryAuthBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.primaryAuthBtnText}>Sign In with Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.demoAuthBtn} onPress={() => demoLogin()}>
            <Zap size={16} color="#f59e0b" fill="#f59e0b" />
            <Text style={styles.demoAuthBtnText}>1-Click Demo Login</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsLink} onPress={() => navigation.navigate('Settings')}>
            <Settings size={18} color="#94a3b8" />
            <Text style={styles.settingsLinkText}>App Settings & Diagnostics</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity
          style={styles.headerSettingsBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Settings size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.name.charAt(0).toUpperCase()}</Text>
          </View>

          <View style={styles.userInfo}>
            {isEditingName ? (
              <View style={styles.editNameRow}>
                <TextInput
                  style={styles.nameInput}
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.saveNameBtn}
                  onPress={handleUpdateName}
                  disabled={updatingName}
                >
                  <Check size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.nameDisplayRow}>
                <Text style={styles.userName}>{user?.name}</Text>
                <TouchableOpacity onPress={() => setIsEditingName(true)} style={{ padding: 4 }}>
                  <Edit2 size={14} color="#60a5fa" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.metaRow}>
              <Mail size={12} color="#94a3b8" />
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>

            <View style={styles.metaRow}>
              <Calendar size={12} color="#94a3b8" />
              <Text style={styles.userJoinDate}>Member since {new Date(user?.createdAt || '').getFullYear()}</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionHeading}>USAGE & METRICS</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Heart size={20} color="#ef4444" />
            <Text style={styles.statNumber}>{stats?.favoritesCount || 0}</Text>
            <Text style={styles.statLabel}>Watchlist</Text>
          </View>

          <View style={styles.statCard}>
            <Sparkles size={20} color="#f59e0b" />
            <Text style={styles.statNumber}>{stats?.summariesCount || 0}</Text>
            <Text style={styles.statLabel}>AI Summaries</Text>
          </View>

          <View style={styles.statCard}>
            <Volume2 size={20} color="#10b981" />
            <Text style={styles.statNumber}>{stats?.audioCount || 0}</Text>
            <Text style={styles.statLabel}>Audio Briefs</Text>
          </View>

          <View style={styles.statCard}>
            <History size={20} color="#60a5fa" />
            <Text style={styles.statNumber}>{stats?.historyCount || 0}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>
        </View>

        {/* Change Password Card */}
        <Text style={styles.sectionHeading}>SECURITY SETTINGS</Text>
        <View style={styles.passwordCard}>
          <View style={styles.cardHeaderRow}>
            <Lock size={16} color="#60a5fa" />
            <Text style={styles.cardHeaderTitle}>Change Password</Text>
          </View>

          <TextInput
            style={styles.formInput}
            placeholder="Current password"
            placeholderTextColor="#64748b"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.formInput}
            placeholder="New password (min 6 characters)"
            placeholderTextColor="#64748b"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.updatePasswordBtn}
            onPress={handleUpdatePassword}
            disabled={updatingPassword}
          >
            {updatingPassword ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.updatePasswordBtnText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.historyNavBtn} onPress={() => navigation.navigate('History')}>
          <History size={18} color="#94a3b8" />
          <Text style={styles.historyNavBtnText}>View Full Activity History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color="#ef4444" />
          <Text style={styles.logoutBtnText}>Sign Out of MovieMind</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSettingsBtn: {
    padding: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131b2e',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  nameDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    flex: 1,
    backgroundColor: '#090d16',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  saveNameBtn: {
    backgroundColor: '#2563eb',
    padding: 8,
    borderRadius: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  userEmail: {
    color: '#94a3b8',
    fontSize: 12,
  },
  userJoinDate: {
    color: '#64748b',
    fontSize: 11,
  },
  sectionHeading: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '23%',
    backgroundColor: '#131b2e',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  passwordCard: {
    backgroundColor: '#131b2e',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardHeaderTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  formInput: {
    backgroundColor: '#090d16',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#1e293b',
    fontSize: 14,
  },
  updatePasswordBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  updatePasswordBtnText: {
    color: '#60a5fa',
    fontSize: 13,
    fontWeight: '700',
  },
  historyNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#131b2e',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
    marginBottom: 12,
  },
  historyNavBtnText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 8,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  loggedOutContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  avatarCircleLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#131b2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  loggedOutTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  loggedOutSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  primaryAuthBtn: {
    backgroundColor: '#2563eb',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryAuthBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  demoAuthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#f59e0b',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  demoAuthBtnText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingsLinkText: {
    color: '#94a3b8',
    fontSize: 13,
  },
});
