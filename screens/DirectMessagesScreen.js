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
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const DirectMessagesScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) {
      Alert.alert('Hata', 'Giriş yapmanız gerekiyor');
      return;
    }

    console.log('👤 Mevcut kullanıcı ID:', currentUserId);

    const q = query(
      collection(db, 'conversations'),
      where('users', 'array-contains', currentUserId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        console.log(`📱 ${snapshot.docs.length} konuşma bulundu`);
        const conversationsData = [];
        
        for (const conversationDoc of snapshot.docs) {
          const conversation = conversationDoc.data();
          const otherUserId = conversation.users.find(id => id !== currentUserId);
          
         
          if (!otherUserId) {
            console.warn(' Diğer kullanıcı ID bulunamadı:', conversation);
            continue;
          }
          
          try {
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            const userData = userDoc.exists() ? userDoc.data() : null;
            
            if (userData) {
              
              const defaultAvatar = require('../assets/default-avatar.jpg');
              
              conversationsData.push({
                id: conversationDoc.id,
                userId: otherUserId,
                username: userData.username || userData.displayName || 'Kullanıcı',
                avatar: userData.photoURL || userData.profilePicture || defaultAvatar, 
                lastMessage: conversation.lastMessage || 'Henüz mesaj yok',
                lastMessageTime: formatTime(conversation.updatedAt),
                isOnline: userData.isOnline || false,
                unreadCount: conversation.unreadCount?.[currentUserId] || 0,
              });
              
              console.log(` Konuşma eklendi: ${userData.username}`);
            } else {
              console.warn(' Kullanıcı verisi bulunamadı:', otherUserId);
            }
          } catch (userError) {
            console.error(' Kullanıcı verisi alınırken hata:', userError);
          }
        }
        
       
        conversationsData.sort((a, b) => {
          if (!a.lastMessageTime && !b.lastMessageTime) return 0;
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return b.lastMessageTime.localeCompare(a.lastMessageTime);
        });
        
        setConversations(conversationsData);
        console.log(`✅ ${conversationsData.length} konuşma yüklendi`);
      } catch (error) {
        console.error(' Konuşmalar yüklenirken hata:', error);
        Alert.alert('Hata', 'Konuşmalar yüklenemedi');
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error(' Snapshot listener hatası:', error);
      Alert.alert('Hata', 'Bağlantı hatası');
      setLoading(false);
    });

    return () => {
      console.log('🧹 DirectMessages listener temizleniyor');
      unsubscribe();
    };
  }, []);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const now = new Date();
      const messageTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const diffInMinutes = Math.floor((now - messageTime) / 60000);

      if (diffInMinutes < 1) return 'şimdi';
      if (diffInMinutes < 60) return `${diffInMinutes} dk önce`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours} saat önce`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return 'dün';
      if (diffInDays < 7) return `${diffInDays} gün önce`;
      
      return `${Math.floor(diffInDays / 7)} hafta önce`;
    } catch (error) {
      console.error(' Zaman formatlanırken hata:', error);
      return '';
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.username && conv.username.toLowerCase().includes(searchText.toLowerCase())
  );

  const openChat = (conversation) => {

    if (!conversation.userId || !conversation.username) {
      Alert.alert('Hata', 'Kullanıcı bilgileri eksik');
      return;
    }

    console.log('💬 Chat açılıyor:', {
      userId: conversation.userId,
      username: conversation.username,
      conversationId: conversation.id
    });
    
    navigation.navigate('Chat', {
      userId: conversation.userId,
      username: conversation.username,
      avatar: conversation.avatar,
      isOnline: conversation.isOnline,
    });
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity 
      style={styles.conversationItem} 
      onPress={() => openChat(item)}
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
          onError={(error) => {
            console.log('⚠️ Avatar yükleme hatası:', error);
          }}
        />
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.timestamp}>{item.lastMessageTime}</Text>
        </View>

        <View style={styles.messageRow}>
          <Text
            style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessage]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );


  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mesajlar</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('NewMessage')}>
            <Ionicons name="create-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Konuşmalar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mesajlar</Text>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('NewMessage')}>
          <Ionicons name="create-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#8e8e8e" />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Konuşmalarda ara"
            style={styles.searchInput}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={16} color="#8e8e8e" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.contentContainer}>
        {filteredConversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>
              {searchText ? 'Arama sonucu bulunamadı' : 'Henüz mesajınız yok'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchText ? 
                'Farklı kelimeler deneyin' : 
                'Arkadaşlarınızla mesajlaşmaya başlayın!'
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            renderItem={renderConversation}
            showsVerticalScrollIndicator={false}
            style={styles.conversationsList}
            contentContainerStyle={styles.listContentContainer}
          />
        )}
      </View>

      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            🔍 Toplam: {conversations.length} | Filtrelenmiş: {filteredConversations.length}
          </Text>
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
  contentContainer: {
    flex: 1,
    paddingBottom: 34, 
  },
  conversationsList: { 
    flex: 1 
  },
  listContentContainer: {
    paddingBottom: 100, 
  },
  conversationItem: {
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
    width: 56, 
    height: 56, 
    borderRadius: 28 
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#44db5e',
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationContent: { 
    flex: 1 
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#000' 
  },
  timestamp: { 
    fontSize: 14, 
    color: '#8e8e8e' 
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: { 
    fontSize: 14, 
    color: '#8e8e8e', 
    flex: 1 
  },
  unreadMessage: { 
    color: '#000', 
    fontWeight: '500' 
  },
  unreadBadge: {
    backgroundColor: '#3897f0',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },
  unreadCount: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100, 
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
  debugContainer: {
    position: 'absolute',
    bottom: 100,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 8,
    borderRadius: 4,
  },
  debugText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default DirectMessagesScreen;