
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const NewMessageScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) {
        Alert.alert('Hata', 'Giriş yapmanız gerekiyor');
        return;
      }

      console.log('👥 Kullanıcılar getiriliyor...');
      
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('username'));
      const snapshot = await getDocs(q);
      
      const usersData = [];
      snapshot.forEach(doc => {
        const userData = doc.data();
  
        if (doc.id !== currentUserId) {
          usersData.push({
            id: doc.id,
            username: userData.username || userData.displayName || 'Kullanıcı',
            displayName: userData.displayName || userData.username || 'Kullanıcı',
            avatar: userData.photoURL || userData.profilePicture || require('../assets/default-avatar.jpg'),
            isOnline: userData.isOnline || false,
            bio: userData.bio || '',
          });
        }
      });

      setUsers(usersData);
      console.log(` ${usersData.length} kullanıcı yüklendi`);
      setLoading(false);
    } catch (error) {
      console.error(' Kullanıcılar yüklenirken hata:', error);
      Alert.alert('Hata', 'Kullanıcılar yüklenemedi');
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchText.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchText.toLowerCase())
  );

  const startChat = (user) => {
    console.log(' Yeni chat başlatılıyor:', user.username);
    
    navigation.navigate('Chat', {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      isOnline: user.isOnline,
    });
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem} 
      onPress={() => startChat(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image 
          source={
            typeof item.avatar === 'string' && item.avatar.startsWith('http') 
              ? { uri: item.avatar } 
              : item.avatar
          } 
          style={styles.avatar}
        />
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.displayName}>{item.displayName}</Text>
        {item.bio ? (
          <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
        ) : null}
      </View>

      <TouchableOpacity style={styles.messageButton}>
        <Ionicons name="chatbubble-outline" size={20} color="#3897f0" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yeni Mesaj</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#8e8e8e" />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Kullanıcı ara..."
            style={styles.searchInput}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={16} color="#8e8e8e" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Kullanıcılar yükleniyor...</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>
            {searchText ? 'Kullanıcı bulunamadı' : 'Henüz kullanıcı yok'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchText ? 
              'Farklı bir isim deneyin' : 
              'Yeni kullanıcılar yakında eklenecek'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {!searchText && !loading && users.length > 0 && (
        <View style={styles.suggestedContainer}>
          <Text style={styles.suggestedTitle}>Önerilen</Text>
          <FlatList
            data={users.slice(0, 5)} 
            keyExtractor={(item) => `suggested_${item.id}`}
            renderItem={renderUser}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  searchContainer: { 
    paddingHorizontal: 16, 
    paddingVertical: 12 
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 8, 
    fontSize: 16, 
    color: '#000' 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  userItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  avatarContainer: { 
    position: 'relative', 
    marginRight: 12 
  },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25 
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#44db5e',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: { 
    flex: 1 
  },
  username: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#000',
    marginBottom: 2,
  },
  displayName: { 
    fontSize: 14, 
    color: '#8e8e8e',
    marginBottom: 2,
  },
  bio: { 
    fontSize: 12, 
    color: '#8e8e8e',
    fontStyle: 'italic',
  },
  messageButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8e8e8e',
    textAlign: 'center',
    lineHeight: 20,
  },
  suggestedContainer: {
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  suggestedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
});

export default NewMessageScreen;