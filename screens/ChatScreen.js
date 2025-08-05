import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
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
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  increment,
  setDoc,
  getDoc,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const ChatScreen = ({ route, navigation }) => {
  const { userId, username, avatar, isOnline } = route.params;
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false); 
  const flatListRef = useRef();
  const messagesUnsubscribeRef = useRef();

  useEffect(() => {
    const currentUserId = auth.currentUser?.uid;
    
    console.log(' Chat Screen başlatıldı:', { 
      userId, 
      username, 
      currentUserId,
      conversationParams: route.params 
    });
    
    if (!currentUserId || !userId) {
      Alert.alert('Hata', 'Kullanıcı bilgileri alınamadı');
      navigation.goBack();
      return;
    }

    if (currentUserId === userId) {
      Alert.alert('Hata', 'Kendinizle mesajlaşamazsınız');
      navigation.goBack();
      return;
    }

    setupConversation(currentUserId, userId);

    return () => {
      if (messagesUnsubscribeRef.current) {
        console.log('🧹 Chat listener temizleniyor');
        messagesUnsubscribeRef.current();
      }
    };
  }, [userId]);

  const setupConversation = async (currentUserId, otherUserId) => {
    try {
      const users = [currentUserId, otherUserId].sort();
      console.log('🔍 Konuşma aranıyor, kullanıcılar:', users);
      
      const conversationsRef = collection(db, 'conversations');
      const q = query(conversationsRef, where('users', '==', users));
      
      const querySnapshot = await getDocs(q);
      let convId;
      
      if (!querySnapshot.empty) {
      
        convId = querySnapshot.docs[0].id;
        console.log(' Mevcut konuşma bulundu:', convId);
      } else {
       
        console.log(' Yeni konuşma oluşturuluyor...');
        
        const newConversation = {
          users,
          lastMessage: '',
          updatedAt: serverTcalısıyorumimestamp(),
          createdAt: serverTimestamp(),
          unreadCount: {
            [currentUserId]: 0,
            [otherUserId]: 0,
          }
        };
        
        const conversationRef = await addDoc(conversationsRef, newConversation);
        convId = conversationRef.id;
        console.log(' Yeni konuşma oluşturuldu:', convId);
      }
      
      setConversationId(convId);
      
      
      startListeningToMessages(convId, currentUserId);
      
    } catch (error) {
      console.error(' Konuşma kurulurken hata:', error);
      Alert.alert('Hata', 'Konuşma başlatılamadı');
      setLoading(false);
    }
  };

 
  const startListeningToMessages = (convId, currentUserId) => {
    console.log(' Mesaj dinleme başlatılıyor için conversation:', convId);
    
    const messagesRef = collection(db, 'conversations', convId, 'messages');
    const messagesQuery = query(
      messagesRef, 
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    const messagesUnsubscribe = onSnapshot(
      messagesQuery, 
      (snapshot) => {
        console.log(` Mesaj güncellemesi alındı: ${snapshot.docs.length} mesaj`);
        
        const fetchedMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        
        const sortedMessages = fetchedMessages.reverse();
        
        setMessages(sortedMessages);
        setLoading(false);
        
       
        const latestMessage = fetchedMessages[0];
        if (latestMessage && latestMessage.isBot && latestMessage.senderId !== currentUserId) {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
          }, 2000);
        }
        
        
        if (sortedMessages.length > 0) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
        
        
        markMessagesAsRead(convId, currentUserId, fetchedMessages);
      },
      (error) => {
        console.error(' Mesajlar dinlenirken hata:', error);
        Alert.alert('Hata', 'Mesajlar yüklenemedi');
        setLoading(false);
      }
    );
    
    messagesUnsubscribeRef.current = messagesUnsubscribe;
  };

  const markMessagesAsRead = async (convId, currentUserId, messages) => {
    if (!convId || !currentUserId) return;
    
    try {
      const unreadMessages = messages.filter(
        msg => msg.senderId !== currentUserId && !msg.isRead
      );

      if (unreadMessages.length > 0) {
        await updateDoc(doc(db, 'conversations', convId), {
          [`unreadCount.${currentUserId}`]: 0,
        });
        console.log(` ${unreadMessages.length} mesaj okundu olarak işaretlendi`);
      }
    } catch (error) {
      console.error(' Mesajlar okundu olarak işaretlenirken hata:', error);
    }
  };

  const sendMessage = async () => {
    const trimmedMessage = messageText.trim();
    
    if (!trimmedMessage || !conversationId || sending) {
      console.log(' Mesaj gönderilemedi:', { 
        trimmedMessage: !!trimmedMessage, 
        conversationId: !!conversationId, 
        sending 
      });
      return;
    }

    const currentUserId = auth.currentUser?.uid;
    
    if (!currentUserId) {
      Alert.alert('Hata', 'Oturum açın');
      return;
    }
    
    setSending(true);
    setMessageText(''); // Hemen temizle
    
    try {
      console.log('Kullanıcı mesajı gönderiliyor...', { 
        conversationId, 
        text: trimmedMessage,
        length: trimmedMessage.length 
      });
      
     
      const messageData = {
        text: trimmedMessage,
        senderId: currentUserId,
        timestamp: serverTimestamp(),
        isRead: false,
        isBot: false, 
      };
      
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);

   
      const conversationUpdate = {
        lastMessage: trimmedMessage,
        updatedAt: serverTimestamp(),
        [`unreadCount.${userId}`]: increment(1),
      };
      
      await updateDoc(doc(db, 'conversations', conversationId), conversationUpdate);

      console.log(' Kullanıcı mesajı başarıyla gönderildi');
      
      //  Mesaj gönderildikten sonra yazıyor göstergesini göster
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
      }, 3000); // 3 saniye sonra kapat
      
    } catch (error) {
      console.error(' Mesaj gönderilirken hata:', error);
      Alert.alert('Hata', 'Mesaj gönderilemedi. Tekrar deneyin.');
      setMessageText(trimmedMessage); 
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const now = new Date();
      const messageTime = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      
      if (isNaN(messageTime.getTime())) {
        return '';
      }
      
      const diffInMinutes = Math.floor((now - messageTime) / 60000);

      if (diffInMinutes < 1) return 'şimdi';
      if (diffInMinutes < 60) return `${diffInMinutes} dk önce`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return messageTime.toLocaleTimeString('tr-TR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return 'dün';
      if (diffInDays < 7) return `${diffInDays} gün önce`;
      
      return messageTime.toLocaleDateString('tr-TR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    } catch (error) {
      console.error(' Zaman formatlanırken hata:', error);
      return '';
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMyMessage = item.senderId === auth.currentUser?.uid;
    const showTimestamp = index === 0 || 
      (messages[index - 1] && Math.abs(
        new Date(item.timestamp?.toDate?.() || item.timestamp || 0) -
        new Date(messages[index - 1]?.timestamp?.toDate?.() || messages[index - 1]?.timestamp || 0)
      ) > 300000); // 5 dakika

    return (
      <View style={styles.messageContainer}>
        {showTimestamp && (
          <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
        )}
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessage : styles.theirMessage,
            item.isBot && !isMyMessage && styles.botMessage,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText,
              item.isBot && !isMyMessage && styles.botMessageText,
            ]}
          >
            {item.text}
          </Text>
         
          {item.isBot && !isMyMessage && (
            <View style={styles.botIndicator}>
              <Ionicons name="robot" size={10} color="#666" />
            </View>
          )}
        </View>
      </View>
    );
  };

 
  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        </View>
        <Text style={styles.typingText}>{username} yazıyor...</Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      <View style={styles.userInfo}>
        <Image source={
          typeof avatar === 'string' && avatar.startsWith('http') 
            ? { uri: avatar } 
            : avatar || require('../assets/default-avatar.jpg')
        } style={styles.headerAvatar} />
        <View>
          <Text style={styles.headerUsername}>{username || 'Kullanıcı'}</Text>
          <Text style={styles.userStatus}>
            {isOnline ? 'Aktif' : 'Çevrimdışı'}
          </Text>
        </View>
      </View>
      <TouchableOpacity>
        <Ionicons name="videocam" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Mesajlar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {renderHeader()}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 12, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>
              {username} ile konuşmanız başlasın!
            </Text>
            <Text style={styles.emptySubtitle}>
              İlk mesajınızı gönderin
            </Text>
          </View>
        }
        ListFooterComponent={renderTypingIndicator}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Mesaj yaz..."
              style={styles.messageInput}
              multiline
              maxLength={1000}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              blurOnSubmit={false}
              editable={!sending}
            />
          </View>
          <TouchableOpacity 
            onPress={sendMessage}
            style={[
              styles.sendButton,
              { 
                opacity: (messageText.trim() && !sending) ? 1 : 0.5,
                backgroundColor: (messageText.trim() && !sending) ? '#3897f0' : '#f0f0f0'
              }
            ]}
            disabled={!messageText.trim() || sending}
          >
            <Ionicons 
              name={sending ? "hourglass" : "send"} 
              size={20} 
              color={sending ? "#666" : "#fff"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            💬 ConvID: {conversationId ? conversationId.slice(-6) : 'null'} | 
            📨 Mesajlar: {messages.length} | 
            👤 User: {userId?.slice(-4)} | 
            ⌨️ Yazıyor: {isTyping ? 'Evet' : 'Hayır'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  headerUsername: { fontSize: 16, fontWeight: 'bold' },
  userStatus: { fontSize: 12, color: '#8e8e8e' },
  messageContainer: { marginBottom: 10 },
  timestamp: { 
    textAlign: 'center', 
    fontSize: 12, 
    color: '#999', 
    marginBottom: 8,
    marginTop: 8,
  },
  messageBubble: { 
    maxWidth: '75%', 
    padding: 12, 
    borderRadius: 16,
    marginHorizontal: 4,
    position: 'relative',
  },
  myMessage: { 
    backgroundColor: '#3897f0', 
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirMessage: { 
    backgroundColor: '#f0f0f0', 
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },

  botMessage: {
    backgroundColor: '#e8f4f8',
    borderWidth: 1,
    borderColor: '#d1ecf1',
  },
  messageText: { fontSize: 16, lineHeight: 20 },
  myMessageText: { color: '#fff' },
  theirMessageText: { color: '#000' },
  botMessageText: { color: '#0c5460' },

  botIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
    padding: 2,
  },

  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  typingBubble: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8e8e8e',
    marginHorizontal: 1,
  },
  typingDot1: {
    animationDelay: '0s',
  },
  typingDot2: {
    animationDelay: '0.2s',
  },
  typingDot3: {
    animationDelay: '0.4s',
  },
  typingText: {
    fontSize: 12,
    color: '#8e8e8e',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 0.5,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  messageInput: {
    fontSize: 16,
    maxHeight: 100,
    minHeight: 36,
    textAlignVertical: 'top',
    color: '#000',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
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
  },
  debugContainer: {
    position: 'absolute',
    bottom: 80,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 8,
    borderRadius: 4,
  },
  debugText: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
});

export default ChatScreen;