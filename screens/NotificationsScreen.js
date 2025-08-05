import React, { useState } from 'react';

import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const dummyNotifications = [
  {
    id: '1',
    type: 'like',
    username: 'ayse',
    message: 'gönderini beğendi',
    time: '2 dakika önce',
    read: false,
    postImage: require('../assets/posts/duygu.jpg'),
  },
  {
    id: '2',
    type: 'follow',
    username: 'burak',
    message: 'seni takip etmeye başladı',
    time: '5 dakika önce',
    read: false,
    postImage: null,
  },
  {
    id: '3',
    type: 'comment',
    username: 'selin',
    message: 'gönderine yorum yaptı: "Çok güzel"',
    time: '15 dakika önce',
    read: false,
    postImage: require('../assets/posts/duygu.jpg'),
  },
  {
    id: '4',
    type: 'like',
    username: 'cemre',
    message: 'gönderini beğendi',
    time: '1 saat önce',
    read: true,
    postImage: require('../assets/posts/ayse.jpg'),
  },
  {
    id: '5',
    type: 'follow',
    username: 'ali',
    message: 'seni takip etmeye başladı',
    time: '2 saat önce',
    read: true,
    postImage: null,
  },
  {
    id: '6',
    type: 'comment',
    username: 'ceren',
    message: 'gönderine yorum yaptı: "Harika"',
    time: '3 saat önce',
    read: true,
    postImage: require('../assets/posts/duygu.jpg'),
  },
  {
    id: '7',
    type: 'like',
    username: 'zeynep',
    message: 'gönderini beğendi',
    time: '1 gün önce',
    read: true,
    postImage: require('../assets/posts/ayse.jpg'),
  },
  {
    id: '8',
    type: 'follow',
    username: 'mirac',
    message: 'seni takip etmeye başladı',
    time: '1 gün önce',
    read: true,
    postImage: null,
  },
  {
    id: '9',
    type: 'comment',
    username: 'damla',
    message: 'gönderine yorum yaptı: "Süper"',
    time: '2 gün önce',
    read: true,
    postImage: require('../assets/posts/duygu.jpg'),
  },
  {
    id: '10',
    type: 'like',
    username: 'ayse',
    message: 'hikayeni beğendi',
    time: '3 gün önce',
    read: true,
    postImage: null,
  },
];

const followSuggestions = [
  { id: '1', username: 'mehmet', name: 'Mehmet Yılmaz', mutualFriends: 3 },
  { id: '2', username: 'fatma', name: 'Fatma Kaya', mutualFriends: 5 },
  { id: '3', username: 'ahmet', name: 'Ahmet Özkan', mutualFriends: 2 },
  { id: '4', username: 'esra', name: 'Esra Demir', mutualFriends: 7 },
];

const getUserImage = (username) => {
  switch (username) {
    case 'ayse':
      return require('../assets/posts/ayse.jpg');
    case 'duygu':
      return require('../assets/posts/duygu.jpg');
    default:
      return require('../assets/posts/duygu.jpg');
  }
};

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState(dummyNotifications);
  const [activeTab, setActiveTab] = useState('all'); 

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Ionicons name="heart" size={24} color="#ff3040" />;
      case 'comment':
        return <Ionicons name="chatbubble" size={24} color="#3897f0" />;
      case 'follow':
        return <Ionicons name="person-add" size={24} color="#3897f0" />;
      default:
        return <Ionicons name="notifications" size={24} color="#8e8e93" />;
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification
      ]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.avatarContainer}>
          <Image
            source={getUserImage(item.username)}
            style={styles.avatar}
          />
          <View style={styles.notificationIcon}>
            {getNotificationIcon(item.type)}
          </View>
        </View>

        <View style={styles.notificationText}>
          <Text style={styles.notificationMessage}>
            <Text style={styles.username}>{item.username}</Text>
            {' '}
            {item.message}
          </Text>
          <Text style={styles.timeStamp}>{item.time}</Text>
        </View>

        {item.type === 'follow' && (
          <TouchableOpacity style={styles.followBackButton}>
            <Text style={styles.followBackText}>Takip Et</Text>
          </TouchableOpacity>
        )}
      </View>

      {!item.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  const renderFollowSuggestion = ({ item }) => (
    <TouchableOpacity style={styles.suggestionItem}>
      <Image source={getUserImage(item.username)} style={styles.suggestionAvatar} />
      <View style={styles.suggestionInfo}>
        <Text style={styles.suggestionUsername}>{item.username}</Text>
        <Text style={styles.suggestionName}>{item.name}</Text>
        <Text style={styles.mutualFriends}>
          {item.mutualFriends} ortak takipçi
        </Text>
      </View>
      <TouchableOpacity style={styles.followButton}>
        <Text style={styles.followButtonText}>Takip Et</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = activeTab === 'following' 
    ? notifications.filter(n => ['like', 'comment'].includes(n.type))
    : notifications;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllReadText}>Tümünü Okundu İşaretle</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Tümü
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.activeTab]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
            Takip Ettiklerim
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          activeTab === 'all' && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Takip Önerileri</Text>
              <FlatList
                data={followSuggestions}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={renderFollowSuggestion}
                contentContainerStyle={styles.suggestionsScrollContainer}
              />
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#dbdbdb',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#262626',
  },
  markAllReadText: {
    fontSize: 14,
    color: '#3897f0',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    padding: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#8e8e93',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#262626',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#ff3040',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  suggestionsScrollContainer: {
    paddingHorizontal: 15,
  },
  suggestionItem: {
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 12,
    width: 120,
  },
  suggestionAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  suggestionInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  suggestionName: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 2,
  },
  mutualFriends: {
    fontSize: 11,
    color: '#8e8e93',
  },
  followButton: {
    backgroundColor: '#3897f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  followButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  notificationItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  unreadNotification: {
    backgroundColor: '#f8f9fa',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  notificationIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
  },
  notificationText: {
    flex: 1,
    marginRight: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#262626',
    marginBottom:4,

 },
});
export default NotificationsScreen;