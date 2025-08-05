import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Animated,
  StatusBar,
  Alert,
  ActionSheetIOS,
  Platform,
  ScrollView,
  PermissionsAndroid,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const { width } = Dimensions.get('window');

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

// Dummy galeri fotoğrafları
const dummyGalleryPhotos = [
  { id: '1', uri: require('../assets/stories/duygu.jpg'), timestamp: Date.now() - 3600000 },
  { id: '2', uri: require('../assets/stories/ayse.jpg'), timestamp: Date.now() - 7200000 },
  { id: '3', uri: require('../assets/stories/selin.jpg'), timestamp: Date.now() - 10800000 },
  { id: '4', uri: require('../assets/stories/duygu.jpg'), timestamp: Date.now() - 14400000 },
  { id: '5', uri: require('../assets/stories/ayse.jpg'), timestamp: Date.now() - 18000000 },
  { id: '6', uri: require('../assets/stories/selin.jpg'), timestamp: Date.now() - 21600000 },
  { id: '7', uri: require('../assets/stories/duygu.jpg'), timestamp: Date.now() - 25200000 },
  { id: '8', uri: require('../assets/stories/ayse.jpg'), timestamp: Date.now() - 28800000 },
  { id: '9', uri: require('../assets/stories/selin.jpg'), timestamp: Date.now() - 32400000 },
  { id: '10', uri: require('../assets/stories/duygu.jpg'), timestamp: Date.now() - 36000000 },
  { id: '11', uri: require('../assets/stories/ayse.jpg'), timestamp: Date.now() - 39600000 },
  { id: '12', uri: require('../assets/stories/selin.jpg'), timestamp: Date.now() - 43200000 },
];

const dummyStories = [
  {
    id: 'my_story',
    username: 'Hikayeni paylaş',
    avatar: require('../assets/stories/duygu.jpg'),
    isAddStory: true,
  },
  {
    id: 's1',
    username: 'duygu',
    avatar: require('../assets/stories/duygu.jpg'),
    hasUnseenStory: true,
    stories: [
      { id: '1', image: require('../assets/stories/duygu.jpg'), timestamp: Date.now() - 3600000 },
      { id: '2', image: require('../assets/stories/ayse.jpg'), timestamp: Date.now() - 1800000 },
    ]
  },
  {
    id: 's2',
    username: 'ayse',
    avatar: require('../assets/stories/ayse.jpg'),
    hasUnseenStory: true,
    stories: [
      { id: '3', image: require('../assets/stories/ayse.jpg'), timestamp: Date.now() - 7200000 },
    ]
  },
  {
    id: 's3',
    username: 'selin',
    avatar: require('../assets/stories/selin.jpg'),
    hasUnseenStory: false,
    stories: [
      { id: '4', image: require('../assets/stories/selin.jpg'), timestamp: Date.now() - 86400000 },
    ]
  },
  {
    id: 's4',
    username: 'burak',
    avatar: require('../assets/stories/duygu.jpg'),
    hasUnseenStory: true,
    stories: [
      { id: '5', image: require('../assets/stories/duygu.jpg'), timestamp: Date.now() - 900000 },
    ]
  },
  {
    id: 's5',
    username: 'mert',
    avatar: require('../assets/stories/ayse.jpg'),
    hasUnseenStory: false,
    stories: [
      { id: '6', image: require('../assets/stories/ayse.jpg'), timestamp: Date.now() - 172800000 },
    ]
  },
];

const dummyUsers = [
  { id: '1', name: 'ayse', avatar: require('../assets/stories/ayse.jpg') },
  { id: '2', name: 'selin', avatar: require('../assets/stories/selin.jpg') },
  { id: '3', name: 'burak', avatar: require('../assets/stories/duygu.jpg') },
  { id: '4', name: 'mert', avatar: require('../assets/stories/ayse.jpg') },
  { id: '5', name: 'cemre', avatar: require('../assets/stories/selin.jpg') },
  { id: '6', name: 'elif', avatar: require('../assets/stories/duygu.jpg') },
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

const FeedHeader = ({ navigation, unreadCount, onNotificationPress }) => (
  <View style={styles.header}>
    <TouchableOpacity>
 
    </TouchableOpacity>
    
    <Text style={styles.logoText}>Instagram</Text>
    
    <View style={styles.headerRight}>
      <TouchableOpacity 
        style={styles.headerIcon}
      >
        
      </TouchableOpacity>
      <TouchableOpacity onPress={onNotificationPress} style={styles.notificationIconContainer}>
        <Ionicons name="heart-outline" size={24} color="#000" />
        {unreadCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  </View>
);

const NotificationItem = ({ item, onPress, onFollowPress }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Ionicons name="heart" size={16} color="#ff3040" />;
      case 'comment':
        return <Ionicons name="chatbubble" size={16} color="#3897f0" />;
      case 'follow':
        return <Ionicons name="person-add" size={16} color="#3897f0" />;
      default:
        return <Ionicons name="notifications" size={16} color="#8e8e93" />;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={onPress}
    >
      <View style={styles.notificationContent}>
        <View style={styles.avatarContainer}>
          <Image source={getUserImage(item.username)} style={styles.notificationAvatar} />
          <View style={styles.notificationTypeIcon}>
            {getNotificationIcon(item.type)}
          </View>
        </View>
        
        <View style={styles.notificationTextContainer}>
          <Text style={styles.notificationText} numberOfLines={2}>
            <Text style={styles.notificationUsername}>{item.username}</Text>
            {' '}{item.message}
          </Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
        
        {item.type === 'follow' && (
          <TouchableOpacity 
            style={styles.miniFollowButton}
            onPress={onFollowPress}
          >
            <Text style={styles.miniFollowButtonText}>Takip Et</Text>
          </TouchableOpacity>
        )}
        
        {!item.read && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );
};

const FollowSuggestionItem = ({ item, onFollowPress }) => (
  <TouchableOpacity style={styles.suggestionItem}>
    <Image source={getUserImage(item.username)} style={styles.suggestionAvatar} />
    <View style={styles.suggestionInfo}>
      <Text style={styles.suggestionUsername}>{item.username}</Text>
      <Text style={styles.suggestionName}>{item.name}</Text>
      <Text style={styles.mutualFriends}>
        {item.mutualFriends} ortak takipçi
      </Text>
    </View>
    <TouchableOpacity style={styles.followButton} onPress={onFollowPress}>
      <Text style={styles.followButtonText}>Takip Et</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

const FeedScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [notifications, setNotifications] = useState(dummyNotifications);
  const [selectedStory, setSelectedStory] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isShareModalVisible, setShareModalVisible] = useState(false);
  const [isCommentsModalVisible, setCommentsModalVisible] = useState(false);
  const [isAddStoryModalVisible, setAddStoryModalVisible] = useState(false);
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [shareTargetUsers, setShareTargetUsers] = useState([]);
  const [commentText, setCommentText] = useState({});
  const [newCommentText, setNewCommentText] = useState('');
  const [storyProgress] = useState(new Animated.Value(0));
  const [doubleTapLike, setDoubleTapLike] = useState(null);
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [galleryPhotos, setGalleryPhotos] = useState(dummyGalleryPhotos);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [activeTab, setActiveTab] = useState('recent');
  const [activeNotificationTab, setActiveNotificationTab] = useState('all');
  const storyProgressRef = useRef(null);
  
  const heartScale = useRef(new Animated.Value(0)).current;
  const likeScale = useRef(new Animated.Value(1)).current;
  const lastTap = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          username: data.username || 'Kullanıcı',
          avatarUrl: data.avatarUrl || null,
          imageUrl: data.imageUrl,
          caption: data.caption,
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          likes: data.likes || [],
          liked: data.likes ? data.likes.includes(auth.currentUser?.uid) : false,
          comments: data.comments || [],
          isVerified: data.isVerified || false,
          timestamp: data.createdAt
            ? timeAgo(data.createdAt.toDate())
            : '',
        };
      });
      setPosts(postList);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isModalVisible && selectedStory && selectedStory.stories) {
      const duration = 5000;
      
      storyProgress.setValue(0);
      
      const animation = Animated.timing(storyProgress, {
        toValue: 1,
        duration: duration,
        useNativeDriver: false,
      });
      
      animation.start(({ finished }) => {
        if (finished) {
          nextStory();
        }
      });
      
      storyProgressRef.current = animation;
      
      return () => {
        if (storyProgressRef.current) {
          storyProgressRef.current.stop();
        }
      };
    }
  }, [isModalVisible, selectedStory, currentStoryIndex]);

  const nextStory = () => {
    if (selectedStory && selectedStory.stories) {
      if (currentStoryIndex < selectedStory.stories.length - 1) {
        setCurrentStoryIndex(currentStoryIndex + 1);
      } else {
        setModalVisible(false);
        setCurrentStoryIndex(0);
      }
    }
  };

  const previousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const timeAgo = (date) => {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return `${seconds} sn önce`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} dk önce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} saat önce`;
    const days = Math.floor(hours / 24);
    return `${days} gün önce`;
  };

  const getRandomUsers = () => {
    const shuffled = [...dummyUsers].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  const showPostOptions = (post) => {
    const isOwnPost = post.userId === auth.currentUser?.uid;
    
    const options = isOwnPost 
      ? ['Sil', 'Düzenle', 'Arşivle', 'Paylaşımı kapat', 'İptal']
      : ['Şikayet et', 'Bu hesabı engelle', 'Bu gönderiye ilgim yok', 'İptal'];
    
    const destructiveButtonIndex = isOwnPost ? 0 : -1;
    const cancelButtonIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (isOwnPost && buttonIndex === 0) {
            handleDeletePost(post.id);
          } else if (isOwnPost && buttonIndex === 1) {
            Alert.alert('Bilgi', 'Düzenleme özelliği henüz eklenmedi.');
          } else if (!isOwnPost && buttonIndex === 0) {
            Alert.alert('Şikayet', 'Gönderi şikayet edildi.');
          }
        }
      );
    } else {
      Alert.alert(
        'Gönderi Seçenekleri',
        'Ne yapmak istiyorsunuz?',
        isOwnPost ? [
          { text: 'Sil', onPress: () => handleDeletePost(post.id), style: 'destructive' },
          { text: 'Düzenle', onPress: () => Alert.alert('Bilgi', 'Düzenleme özelliği henüz eklenmedi.') },
          { text: 'İptal', style: 'cancel' },
        ] : [
          { text: 'Şikayet et', onPress: () => Alert.alert('Şikayet', 'Gönderi şikayet edildi.') },
          { text: 'Engelle', onPress: () => Alert.alert('Engellendi', 'Kullanıcı engellendi.') },
          { text: 'İptal', style: 'cancel' },
        ]
      );
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      Alert.alert('Başarılı', 'Gönderi silindi.');
    } catch (error) {
      console.error('Gönderi silme hatası:', error);
      Alert.alert('Hata', 'Gönderi silinirken bir hata oluştu.');
    }
  };

  const toggleLike = async (postId) => {
    if (!auth.currentUser) {
      Alert.alert('Hata', 'Giriş yapmalısınız.');
      return;
    }
    
    try {
      const postRef = doc(db, 'posts', postId);
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const currentLikes = post.likes || [];
      const userLiked = currentLikes.includes(auth.currentUser.uid);

      let newLikes;
      if (userLiked) {
        newLikes = currentLikes.filter(uid => uid !== auth.currentUser.uid);
      } else {
        newLikes = [...currentLikes, auth.currentUser.uid];
      }

      await updateDoc(postRef, {
        likes: newLikes,
      });
      
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { 
                ...p, 
                likes: newLikes, 
                liked: !userLiked 
              }
            : p
        )
      );
      
    } catch (error) {
      console.error('Beğeni güncelleme hatası:', error);
      if (error.code === 'permission-denied') {
        Alert.alert('Hata', 'Bu işlem için yetkiniz yok.');
      } else {
        Alert.alert('Hata', 'Beğeni güncellenirken bir hata oluştu.');
      }
    }
  };

  const toggleSave = (postId) => {
    setSavedPosts(prev => {
      const newSaved = new Set(prev);
      if (newSaved.has(postId)) {
        newSaved.delete(postId);
      } else {
        newSaved.add(postId);
      }
      return newSaved;
    });
  };

  const addComment = async (postId, comment) => {
    if (!auth.currentUser) {
      Alert.alert('Hata', 'Giriş yapmalısınız.');
      return;
    }

    try {
      const postRef = doc(db, 'posts', postId);
      const newComment = {
        id: Date.now().toString(),
        text: comment,
        userId: auth.currentUser.uid,
        username: auth.currentUser.displayName || 'Kullanıcı',
        createdAt: new Date(),
      };

      await updateDoc(postRef, {
        comments: arrayUnion(newComment),
      });
    } catch (error) {
      console.error('Yorum ekleme hatası:', error);
      Alert.alert('Hata', 'Yorum eklenirken bir hata oluştu.');
    }
  };

  const handleDoubleTap = (postId) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (lastTap.current && (now - lastTap.current) < DOUBLE_PRESS_DELAY) {
      const post = posts.find(p => p.id === postId);
      if (!post?.likes?.includes(auth.currentUser?.uid)) {
        toggleLike(postId);
        setDoubleTapLike(postId);
        showHeartAnimation();
      }
    }
    lastTap.current = now;
  };

  const showHeartAnimation = () => {
    heartScale.setValue(0);
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.delay(500),
      Animated.timing(heartScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => setDoubleTapLike(null));
  };

  const animateLikeButton = (liked) => {
    Animated.sequence([
      Animated.spring(likeScale, {
        toValue: liked ? 1.2 : 0.8,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(likeScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      })
    ]).start();
  };

  const openCommentsModal = (post) => {
    setSelectedPost(post);
    setCommentsModalVisible(true);
  };

  const handleStoryPress = (story) => {
    if (story.isAddStory) {
      setAddStoryModalVisible(true);
    } else if (story.stories) {
      setSelectedStory(story);
      setCurrentStoryIndex(0);
      setModalVisible(true);
    }
  };

  const handleNotificationPress = (notification) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notification.id ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const handleFollowPress = (username) => {
    Alert.alert('Başarılı', `${username} kullanıcısını takip etmeye başladınız.`);
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Kamera İzni',
            message: 'Bu uygulama kameraya erişim izni istiyor.',
            buttonNeutral: 'Daha Sonra Sor',
            buttonNegative: 'İptal',
            buttonPositive: 'Tamam',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const openCamera = async () => {
    let permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera kullanımı için izin gerekli.');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhoto = {
          id: Date.now().toString(),
          uri: { uri: result.assets[0].uri },
          timestamp: Date.now(),
        };
        setGalleryPhotos(prev => [newPhoto, ...prev]);
        setSelectedPhoto(newPhoto);
        Alert.alert('Başarılı', 'Fotoğraf çekildi ve galeriye eklendi!');
      }
    } catch (err) {
      Alert.alert('Hata', 'Kamera açılırken bir hata oluştu.');
    }
  };

  const selectPhotoFromGallery = (photo) => {
    setSelectedPhoto(photo);
    Alert.alert(
      'Hikaye Ekle',
      'Bu fotoğrafı hikayene eklemek istiyor musun?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Paylaş', 
          onPress: () => {
            Alert.alert('Başarılı', 'Hikaye paylaşıldı!');
            setAddStoryModalVisible(false);
            setSelectedPhoto(null);
          }
        },
      ]
    );
  };

  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
      return `${days} gün önce`;
    } else if (hours > 0) {
      return `${hours} saat önce`;
    } else {
      return 'Az önce';
    }
  };

 
  const filteredNotifications = activeNotificationTab === 'following' 
    ? notifications.filter(n => ['like', 'comment'].includes(n.type))
    : notifications;

  const renderStory = ({ item }) => (
    <TouchableOpacity
      style={styles.storyItem}
      onPress={() => handleStoryPress(item)}
    >
      <View style={[
        styles.storyAvatarContainer,
        item.hasUnseenStory && !item.isAddStory && styles.unseenStoryBorder,
        item.isAddStory && styles.addStoryBorder,
      ]}>
        <Image source={item.avatar} style={styles.storyAvatar} />
        {item.isAddStory && (
          <View style={styles.addStoryIcon}>
            <Ionicons name="add" size={20} color="#fff" />
          </View>
        )}
      </View>
      <Text style={styles.storyUsername} numberOfLines={1}>
        {item.username}
      </Text>
    </TouchableOpacity>
  );

  const renderPost = ({ item }) => (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.headerLeft}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.postAvatar} />
          ) : (
            <Image source={require('../assets/stories/duygu.jpg')} style={styles.postAvatar} />
          )}
          <View style={styles.usernameContainer}>
            <View style={styles.usernameRow}>
              <Text style={styles.postUsername}>{item.username}</Text>
              {item.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#3897f0" style={styles.verifiedIcon} />
              )}
            </View>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => showPostOptions(item)}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={1}
        onPress={() => handleDoubleTap(item.id)}
        style={styles.imageContainer}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
        {doubleTapLike === item.id && (
          <Animated.View style={[styles.heartOverlay, {
            transform: [
              { scale: heartScale },
              { rotate: '10deg' }
            ],
            opacity: heartScale
          }]}>
            <Ionicons name="heart" size={100} color="#fff" />
          </Animated.View>
        )}
      </TouchableOpacity>

      <View style={styles.actionButtons}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            onPress={() => {
              const liked = !item.likes?.includes(auth.currentUser?.uid);
              animateLikeButton(liked);
              toggleLike(item.id);
            }}
            style={styles.actionButton}
          >
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <Ionicons
                name={item.likes?.includes(auth.currentUser?.uid) ? 'heart' : 'heart-outline'}
                size={26}
                color={item.likes?.includes(auth.currentUser?.uid) ? '#ff3040' : '#000'}
              />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => openCommentsModal(item)}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setShareTargetUsers(getRandomUsers());
              setShareModalVisible(true);
            }}
          >
            <Ionicons name="paper-plane-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => toggleSave(item.id)}>
          <Ionicons 
            name={savedPosts.has(item.id) ? 'bookmark' : 'bookmark-outline'} 
            size={24} 
            color="#000" 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.likesContainer}>
        <Text style={styles.likesText}>
          {Array.isArray(item.likes) ? item.likes.length : 0} {Array.isArray(item.likes) && item.likes.length === 1 ? 'beğeni' : 'beğeni'}
        </Text>
      </View>

      <View style={styles.captionContainer}>
        <Text style={styles.caption}>
          <Text style={styles.captionUsername}>{item.username}</Text>
          {' '}{item.caption}
        </Text>
      </View>

      {item.comments.length > 0 && (
        <View style={styles.commentsContainer}>
          <TouchableOpacity onPress={() => openCommentsModal(item)}>
            <Text style={styles.viewAllComments}>
              {item.comments.length} yorumun tümünü gör
            </Text>
          </TouchableOpacity>

          {item.comments.slice(0, 2).map((comment, index) => (
            <View key={index} style={styles.commentRow}>
              <Text style={styles.comment}>
                <Text style={styles.commentUsername}>
                  {typeof comment === 'object' ? comment.username : `kullanici${index + 1}`}
                </Text>
                {' '}{typeof comment === 'object' ? comment.text : comment}
              </Text>
              <TouchableOpacity>
                <Ionicons name="heart-outline" size={12} color="#8e8e8e" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.addCommentContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.commentAvatar} />
        ) : (
          <Image source={require('../assets/stories/duygu.jpg')} style={styles.commentAvatar} />
        )}
        <TextInput
          value={commentText[item.id] || ''}
          onChangeText={(text) =>
            setCommentText((prev) => ({ ...prev, [item.id]: text }))
          }
          placeholder="Yorum yap..."
          style={styles.commentInput}
          multiline
        />
        {commentText[item.id]?.trim() && (
          <TouchableOpacity
            onPress={() => {
              if (commentText[item.id]?.trim()) {
                addComment(item.id, commentText[item.id].trim());
                setCommentText((prev) => ({ ...prev, [item.id]: '' }));
              }
            }}
          >
            <Text style={styles.postCommentButton}>Paylaş</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <FeedHeader 
        navigation={navigation} 
        unreadCount={unreadCount}
        onNotificationPress={() => setNotificationsVisible(true)}
      />

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.storiesContainer}>
            <FlatList
              data={dummyStories}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={renderStory}
              contentContainerStyle={styles.storiesContent}
            />
          </View>
        }
        renderItem={renderPost}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

     
      <Modal
        visible={isNotificationsVisible}
        animationType="slide"
        onRequestClose={() => setNotificationsVisible(false)}
        statusBarTranslucent={false}
      >
        <SafeAreaView style={styles.notificationsModal}>
          <View style={styles.notificationsModalHeader}>
            <TouchableOpacity onPress={() => setNotificationsVisible(false)}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.notificationsModalTitle}>Bildirimler</Text>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllAsRead} style={styles.markAllReadButton}>
                  <Text style={styles.markAllReadText}>Tümünü Okundu İşaretle</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          
          <View style={styles.notificationTabContainer}>
            <TouchableOpacity
              style={[styles.notificationTab, activeNotificationTab === 'all' && styles.activeNotificationTab]}
              onPress={() => setActiveNotificationTab('all')}
            >
              <Text style={[styles.notificationTabText, activeNotificationTab === 'all' && styles.activeNotificationTabText]}>
                Tümü
              </Text>
              {unreadCount > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.notificationTab, activeNotificationTab === 'following' && styles.activeNotificationTab]}
              onPress={() => setActiveNotificationTab('following')}
            >
              <Text style={[styles.notificationTabText, activeNotificationTab === 'following' && styles.activeNotificationTabText]}>
                Takip Ettiklerim
              </Text>
            </TouchableOpacity>
          </View>

          
          {activeNotificationTab === 'all' && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Takip Önerileri</Text>
              <FlatList
                data={followSuggestions}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <FollowSuggestionItem 
                    item={item} 
                    onFollowPress={() => handleFollowPress(item.username)} 
                  />
                )}
                contentContainerStyle={styles.suggestionsScrollContainer}
              />
            </View>
          )}

          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationItem 
                item={item} 
                onPress={() => handleNotificationPress(item)}
                onFollowPress={() => handleFollowPress(item.username)}
              />
            )}
            showsVerticalScrollIndicator={false}
            style={styles.notificationsList}
          />
        </SafeAreaView>
      </Modal> 
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.storyModalContainer}>
          {selectedStory && selectedStory.stories && (
            <>
              <View style={styles.storyProgressContainer}>
                {selectedStory.stories.map((_, index) => (
                  <View key={index} style={styles.storyProgressBar}>
                    <Animated.View
                      style={[
                        styles.storyProgressFill,
                        {
                          width: index === currentStoryIndex
                            ? storyProgress.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                              })
                            : index < currentStoryIndex ? '100%' : '0%',
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>

              <View style={styles.storyHeader}>
                <View style={styles.storyUserInfo}>
                  <Image source={selectedStory.avatar} style={styles.storyHeaderAvatar} />
                  <Text style={styles.storyHeaderUsername}>{selectedStory.username}</Text>
                  <Text style={styles.storyTime}>{timeAgo(new Date(selectedStory.stories[currentStoryIndex].timestamp))}</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.storyNavLeft}
                onPress={previousStory}
                activeOpacity={1}
              />
              <TouchableOpacity 
                style={styles.storyNavRight}
                onPress={nextStory}
                activeOpacity={1}
              />

              <Image
                source={selectedStory.stories[currentStoryIndex].image}
                style={styles.storyImage}
                resizeMode="cover"
              />

              <View style={styles.storyInputContainer}>
                <TextInput
                  placeholder="Yanıtla..."
                  placeholderTextColor="#fff"
                  style={styles.storyInput}
                />
                <TouchableOpacity>
                  <Ionicons name="heart-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Ionicons name="paper-plane-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

   
      <Modal
        visible={isCommentsModalVisible}
        animationType="slide"
        onRequestClose={() => setCommentsModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={[styles.commentsModal, { backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 50 : 0 }]}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Yorumlar</Text>
            <TouchableOpacity onPress={() => setCommentsModalVisible(false)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          {selectedPost && (
            <>
              <FlatList
                data={selectedPost.comments}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <Image 
                      source={require('../assets/stories/duygu.jpg')} 
                      style={styles.commentItemAvatar} 
                    />
                    <View style={styles.commentContent}>
                      <Text style={styles.commentText}>
                        <Text style={styles.commentUsername}>
                          {typeof item === 'object' ? item.username : 'kullanici'}
                        </Text>
                        {' '}{typeof item === 'object' ? item.text : item}
                      </Text>
                      <Text style={styles.commentTime}>
                        {typeof item === 'object' && item.createdAt 
                          ? timeAgo(item.createdAt) 
                          : '1 dk önce'}
                      </Text>
                    </View>
                    <TouchableOpacity>
                      <Ionicons name="heart-outline" size={16} color="#8e8e8e" />
                    </TouchableOpacity>
                  </View>
                )}
                style={styles.commentsList}
              />
              
              <View style={styles.commentInputContainer}>
                <Image 
                  source={require('../assets/stories/duygu.jpg')} 
                  style={styles.commentInputAvatar} 
                />
                <TextInput
                  value={newCommentText}
                  onChangeText={setNewCommentText}
                  placeholder="Yorum yap..."
                  style={styles.commentInputField}
                  multiline
                />
                {newCommentText.trim() && (
                  <TouchableOpacity
                    onPress={() => {
                      if (newCommentText.trim()) {
                        addComment(selectedPost.id, newCommentText.trim());
                        setNewCommentText('');
                      }
                    }}
                  >
                    <Text style={styles.postCommentButton}>Paylaş</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </Modal>

   
      <Modal
        visible={isShareModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.shareModalContainer}>
          <View style={styles.shareModalContent}>
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>Paylaş</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={shareTargetUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.shareUserItem}
                  onPress={() => {
                    setShareModalVisible(false);
                    Alert.alert('Başarılı', `${item.name} kullanıcısına gönderildi.`);
                  }}
                >
                  <Image source={item.avatar} style={styles.shareUserAvatar} />
                  <Text style={styles.shareUserName}>{item.name}</Text>
                  <View style={styles.shareUserButton}>
                    <Text style={styles.shareUserButtonText}>Gönder</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'serif',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 16,
  },
  notificationIconContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ff3040',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationsModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  notificationsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  notificationsModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginLeft: -24, 
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllReadButton: {
    marginRight: 16,
  },
  markAllReadText: {
    fontSize: 14,
    color: '#3897f0',
    fontWeight: '600',
  },
  notificationTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    padding: 2,
  },
  notificationTab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeNotificationTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationTabText: {
    fontSize: 14,
    color: '#8e8e93',
    fontWeight: '500',
  },
  activeNotificationTabText: {
    color: '#262626',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#ff3040',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  suggestionsContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  suggestionsScrollContainer: {
    paddingHorizontal: 16,
  },
  suggestionItem: {
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 12,
    width: 110,
  },
  suggestionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 6,
  },
  suggestionInfo: {
    alignItems: 'center',
    marginBottom: 6,
  },
  suggestionUsername: {
    fontSize: 12,
    fontWeight: '600',
    color: '#262626',
  },
  suggestionName: {
    fontSize: 11,
    color: '#8e8e93',
    marginBottom: 2,
  },
  mutualFriends: {
    fontSize: 10,
    color: '#8e8e93',
    textAlign: 'center',
  },
  followButton: {
    backgroundColor: '#3897f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  followButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
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
  notificationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  notificationTypeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
  },
  notificationTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  notificationText: {
    fontSize: 14,
    color: '#262626',
    marginBottom: 2,
  },
  notificationUsername: {
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 12,
    color: '#8e8e93',
  },
  miniFollowButton: {
    backgroundColor: '#3897f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  miniFollowButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3897f0',
    marginLeft: 8,
  },
  storiesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  storiesContent: {
    paddingHorizontal: 8,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 80,
  },
  storyAvatarContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  unseenStoryBorder: {
    borderWidth: 2,
    borderColor: '#ff3040',
  },
  addStoryBorder: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  storyAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  addStoryIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3897f0',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  storyUsername: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
    maxWidth: 80,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  post: {
    backgroundColor: '#fff',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  usernameContainer: {
    justifyContent: 'center',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postUsername: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#000',
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#8e8e8e',
    marginTop: 2,
  },
  imageContainer: {
    width: '100%',
    height: 375,
    position: 'relative',
    backgroundColor: '#000',
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heartOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -50,
    marginTop: -50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
  },
  likesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  likesText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#000',
  },
  captionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  caption: {
    fontSize: 14,
    color: '#000',
    lineHeight: 18,
  },
  captionUsername: {
    fontWeight: 'bold',
  },
  commentsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  viewAllComments: {
    fontSize: 14,
    color: '#8e8e8e',
    marginBottom: 4,
  },
  commentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  comment: {
    fontSize: 14,
    color: '#000',
    flex: 1,
    lineHeight: 18,
  },
  commentUsername: {
    fontWeight: 'bold',
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    paddingVertical: 8,
  },
  postCommentButton: {
    fontSize: 14,
    color: '#3897f0',
    fontWeight: 'bold',
  },
  storyModalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyProgressContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  storyProgressBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
  },
  storyProgressFill: {
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  storyHeader: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  storyUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyHeaderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  storyHeaderUsername: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
  },
  storyTime: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.7,
  },
  storyNavLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '30%',
    zIndex: 2,
  },
  storyNavRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '70%',
    zIndex: 2,
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyInputContainer: {
    position: 'absolute',
    bottom: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  storyInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    marginRight: 12,
  },
  commentsModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  commentItemAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 18,
  },
  commentTime: {
    fontSize: 12,
    color: '#8e8e8e',
    marginTop: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentInputField: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    paddingVertical: 8,
    maxHeight: 100,
  },
  shareModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  shareModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    maxHeight: '70%',
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  shareUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  shareUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  shareUserName: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  shareUserButton: {
    backgroundColor: '#3897f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  shareUserButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addStoryModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  addStoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  addStoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  storyTabs: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    padding: 4,
  },
  storyTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activeStoryTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  storyTabText: {
    fontSize: 14,
    marginLeft: 6,
    color: '#8e8e8e',
  },
  activeStoryTabText: {
    color: '#3897f0',
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  cameraText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 12,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  galleryPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  galleryPreviewImage: {
    width: '100%',
    height: '100%',
  },
  cameraButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  cameraButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  cameraSwitchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryContainer: {
    flex: 1,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  galleryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  selectMultiple: {
    fontSize: 14,
    color: '#3897f0',
    fontWeight: '600',
  },
  galleryScroll: {
    flex: 1,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 2,
  },
  galleryItem: {
    width: (width - 6) / 3,
    height: (width - 6) / 3,
    margin: 1,
    position: 'relative',
  },
  galleryItemFirst: {
    marginLeft: 2,
  },
  galleryItemLast: {
    marginRight: 2,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  galleryItemOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  galleryItemTime: {
    color: '#fff',
    fontSize: 10,
  },
  selectedOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 2,
  },
  selectedPhotoActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
  },
  shareStoryButton: {
    backgroundColor: '#3897f0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareStoryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FeedScreen;