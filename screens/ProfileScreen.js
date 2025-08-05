import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
  PanResponder,
  Animated,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import MenuServices from '../services/MenuServices'; 

const { width, height } = Dimensions.get('window');


const menuItems = [
  { id: 'settings', icon: 'settings-outline', label: 'Ayarlar', hasChevron: true, hasNotification: false },
  { id: 'archive', icon: 'archive-outline', label: 'Arşiv', hasChevron: true, hasNotification: false },
  { id: 'activity', icon: 'heart-outline', label: 'Hareketlerin', hasChevron: true, hasNotification: true },
  { id: 'saved', icon: 'bookmark-outline', label: 'Kaydedilenler', hasChevron: true, hasNotification: false },
  { id: 'close_friends', icon: 'people-outline', label: 'Yakın arkadaşlar', hasChevron: true, hasNotification: false },
  { id: 'insights', icon: 'bar-chart-outline', label: 'İçgörüler', hasChevron: true, hasNotification: false },
  { id: 'qr_code', icon: 'qr-code-outline', label: 'QR kodu', hasChevron: true, hasNotification: false },
];

const highlights = [
  {
    id: 'h1',
    title: 'Seyahat',
    image: require('../assets/posts/duygu.jpg'),
    stories: [
      { id: 's1', image: require('../assets/posts/duygu.jpg'), timestamp: Date.now() - 3600000 },
      { id: 's2', image: require('../assets/posts/ayse.jpg'), timestamp: Date.now() - 7200000 },
      { id: 's3', image: require('../assets/stories/selin.jpg'), timestamp: Date.now() - 10800000 },
    ]
  },
  {
    id: 'h2',
    title: 'Yemek',
    image: require('../assets/posts/ayse.jpg'),
    stories: [
      { id: 's4', image: require('../assets/posts/ayse.jpg'), timestamp: Date.now() - 14400000 },
      { id: 's5', image: require('../assets/posts/duygu.jpg'), timestamp: Date.now() - 18000000 },
    ]
  },
  {
    id: 'h3',
    title: 'Arkadaşlar',
    image: require('../assets/stories/selin.jpg'),
    stories: [
      { id: 's6', image: require('../assets/stories/selin.jpg'), timestamp: Date.now() - 21600000 },
      { id: 's7', image: require('../assets/posts/ayse.jpg'), timestamp: Date.now() - 25200000 },
      { id: 's8', image: require('../assets/posts/duygu.jpg'), timestamp: Date.now() - 28800000 },
    ]
  },
  {
    id: 'h4',
    title: 'Çalışma',
    image: require('../assets/posts/duygu.jpg'),
    stories: [
      { id: 's9', image: require('../assets/posts/duygu.jpg'), timestamp: Date.now() - 32400000 },
    ]
  },
];

const discoverUsers = [
  { 
    id: 'd1', 
    username: 'mert_kaya', 
    fullName: 'Mert Kaya', 
    avatar: require('../assets/posts/duygu.jpg'),
    mutualFriends: ['ayse', 'burak'],
    mutualCount: 2,
    isFollowing: false
  },
  { 
    id: 'd2', 
    username: 'elif_demir', 
    fullName: 'Elif Demir', 
    avatar: require('../assets/posts/ayse.jpg'),
    mutualFriends: ['selin', 'cem'],
    mutualCount: 3,
    isFollowing: false
  },
  { 
    id: 'd3', 
    username: 'can_ozturk', 
    fullName: 'Can Öztürk', 
    avatar: require('../assets/stories/selin.jpg'),
    mutualFriends: ['duygu'],
    mutualCount: 1,
    isFollowing: false
  },
  { 
    id: 'd4', 
    username: 'zehra_yilmaz', 
    fullName: 'Zehra Yılmaz', 
    avatar: require('../assets/stories/ayse.jpg'),
    mutualFriends: ['ayse', 'selin', 'burak'],
    mutualCount: 4,
    isFollowing: false
  },
  { 
    id: 'd5', 
    username: 'emre_aksoy', 
    fullName: 'Emre Aksoy', 
    avatar: require('../assets/posts/duygu.jpg'),
    mutualFriends: ['cem'],
    mutualCount: 1,
    isFollowing: false
  },
];

const ProfileScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('posts');
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('followers');
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  
  const [menuLoading, setMenuLoading] = useState(false);
  const [unreadActivities, setUnreadActivities] = useState([]);
  const [userSettings, setUserSettings] = useState({});
  const [archivedCount, setArchivedCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [closeFriendsCount, setCloseFriendsCount] = useState(0);
  const [realTimeData, setRealTimeData] = useState({});

  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [progressAnim] = useState(new Animated.Value(0));
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showShareProfileModal, setShowShareProfileModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [discoverData, setDiscoverData] = useState(discoverUsers);
  const [editProfileData, setEditProfileData] = useState({
    name: '',
    username: '',
    website: '',
    bio: 'Computer Engineer',
  });

  const followers = 1247;
  const following = 856;

  
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

   
    const unsubscribeActivities = MenuServices.subscribeToActivities((activities) => {
      setUnreadActivities(activities);
      console.log(`📱 ${activities.length} okunmamış aktivite`);
    });

    
    const unsubscribeSettings = MenuServices.subscribeToSettings((settings) => {
      setUserSettings(settings);
      console.log('⚙️ Kullanıcı ayarları güncellendi');
    });

   
    loadMenuData();

    return () => {
      unsubscribeActivities();
      unsubscribeSettings();
    };
  }, []);

  const loadMenuData = async () => {
    try {
      console.log('🔄 Menü verileri yükleniyor...');
      
      const archived = await MenuServices.getArchivedPosts();
      setArchivedCount(archived.length);
      console.log(`📦 ${archived.length} arşivlenmiş gönderi`);

      
      const saved = await MenuServices.getSavedPosts();
      setSavedCount(saved.length);
      console.log(`🔖 ${saved.length} kayıtlı gönderi`);

      
      const closeFriends = await MenuServices.getCloseFriends();
      setCloseFriendsCount(closeFriends.length);
      console.log(`👥 ${closeFriends.length} yakın arkadaş`);

      
      const insights = await MenuServices.getUserInsights();
      if (insights) {
        console.log('📊 İçgörüler yüklendi:', insights);
      }

    } catch (error) {
      console.error('❌ Menü verileri yüklenirken hata:', error);
    }
  };

  
  const handleMenuItemPress = async (itemId) => {
    setShowSideMenu(false);
    setMenuLoading(true);
    
    console.log(`🎯 Menü öğesi seçildi: ${itemId}`);
    
    try {
      switch (itemId) {
        case 'settings':
          console.log('⚙️ Ayarlar yükleniyor...');
          const settings = await MenuServices.getUserSettings();
          
          Alert.alert(
            'Ayarlar', 
            `Ayarlar yüklendi!\n\nMevcut ayarlar: ${Object.keys(settings || {}).length} adet\n\nBu özellik geliştirme aşamasında...`,
            [
              { text: 'Tamam', style: 'default' },
              { 
                text: 'Test Ayarı Ekle', 
                onPress: async () => {
                  const success = await MenuServices.updateUserSetting('theme', 'dark');
                  if (success) {
                    Alert.alert('Başarılı', 'Test ayarı eklendi!');
                    loadMenuData(); 
                  }
                }
              }
            ]
          );
          break;
          
        case 'archive':
          console.log('📦 Arşiv yükleniyor...');
          const archivedPosts = await MenuServices.getArchivedPosts();
          Alert.alert(
            'Arşiv',
            `${archivedPosts.length} arşivlenmiş gönderi bulundu.\n\nBu özellik geliştirme aşamasında...`,
            [
              { text: 'Tamam', style: 'default' },
              { 
                text: 'Test Arşivle', 
                onPress: async () => {
                 
                  const success = await MenuServices.archivePost('test_post_' + Date.now());
                  if (success) {
                    Alert.alert('Başarılı', 'Test gönderi arşivlendi!');
                    loadMenuData();
                  }
                }
              }
            ]
          );
          break;
          
        case 'activity':
          console.log('💖 Aktiviteler yükleniyor...');
          const activities = await MenuServices.getUserActivities();
          Alert.alert(
            'Hareketlerin',
            `${activities.length} aktivite, ${unreadActivities.length} okunmamış.\n\nBu özellik geliştirme aşamasında...`,
            [
              { text: 'Tamam', style: 'default' },
              { 
                text: 'Tümünü Okundu İşaretle', 
                onPress: async () => {
                
                  for (const activity of unreadActivities) {
                    await MenuServices.markActivityAsRead(activity.id);
                  }
                  Alert.alert('Başarılı', 'Tüm aktiviteler okundu işaretlendi!');
                  loadMenuData();
                }
              }
            ]
          );
          break;
          
        case 'saved':
          console.log('🔖 Kayıtlı gönderiler yükleniyor...');
          const savedPosts = await MenuServices.getSavedPosts();
          Alert.alert(
            'Kaydedilenler',
            `${savedPosts.length} kayıtlı gönderi bulundu.\n\nBu özellik geliştirme aşamasında...`,
            [
              { text: 'Tamam', style: 'default' },
              { 
                text: 'Test Kaydet', 
                onPress: async () => {
                  const success = await MenuServices.savePost('test_post_' + Date.now());
                  if (success) {
                    Alert.alert('Başarılı', 'Test gönderi kaydedildi!');
                    loadMenuData();
                  }
                }
              }
            ]
          );
          break;
          
        case 'close_friends':
          console.log('👥 Yakın arkadaşlar yükleniyor...');
          const closeFriends = await MenuServices.getCloseFriends();
          Alert.alert(
            'Yakın arkadaşlar',
            `${closeFriends.length} yakın arkadaş bulundu.\n\nBu özellik geliştirme aşamasında...`,
            [
              { text: 'Tamam', style: 'default' },
              { 
                text: 'Test Arkadaş Ekle', 
                onPress: async () => {
                  const success = await MenuServices.addCloseFriend('test_user_' + Date.now());
                  if (success) {
                    Alert.alert('Başarılı', 'Test arkadaş eklendi!');
                    loadMenuData();
                  }
                }
              }
            ]
          );
          break;
          
        case 'insights':
          console.log('📊 İçgörüler yükleniyor...');
          const insights = await MenuServices.getUserInsights();
          const insightKeys = Object.keys(insights || {});
          Alert.alert(
            'İçgörüler',
            `Profil analitikleri:\n\n${insightKeys.length} veri kategorisi mevcut\n\nBu özellik geliştirme aşamasında...`,
            [
              { text: 'Tamam', style: 'default' },
              { 
                text: 'İçgörü Güncelle', 
                onPress: async () => {
                  const success = await MenuServices.updateInsights({
                    profileViews: Math.floor(Math.random() * 1000),
                    postReach: Math.floor(Math.random() * 5000),
                    lastUpdated: new Date().toISOString()
                  });
                  if (success) {
                    Alert.alert('Başarılı', 'İçgörüler güncellendi!');
                    loadMenuData();
                  }
                }
              }
            ]
          );
          break;
          
        case 'qr_code':
          console.log('📱 QR kod oluşturuluyor...');
          const qrData = await MenuServices.generateQRCode();
          if (qrData) {
            Alert.alert(
              'QR Kodu',
              `QR kodunuz oluşturuldu!\n\nKullanıcı: ${qrData.username}\nTarih: ${new Date().toLocaleDateString()}\n\nBu özellik geliştirme aşamasında...`
            );
          }
          break;
          
        default:
          Alert.alert('Bilgi', 'Bu özellik henüz mevcut değil');
          break;
      }
    } catch (error) {
      console.error('❌ Menü işlemi sırasında hata:', error);
      Alert.alert('Hata', 'İşlem gerçekleştirilemedi. Lütfen tekrar deneyin.');
    } finally {
      setMenuLoading(false);
    }
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setEditProfileData({
        name: currentUser.displayName || '',
        username: currentUser.email?.split('@')[0] || '',
        website: `linktr.ee/${(currentUser.displayName || currentUser.email?.split('@')[0] || 'kullanici').toLowerCase()}`,
        bio: 'Computer Engineer',
      });
    }
  }, []);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef, 
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const posts = [];
      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setUserPosts(posts);
      setLoading(false);
    }, (error) => {
      console.error('Posts fetch error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (showHighlightModal && selectedHighlight) {
      startStoryProgress();
    }
  }, [showHighlightModal, currentStoryIndex]);

  const startStoryProgress = () => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000, // 5 saniye
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        handleNextStory();
      }
    });
  };

  const handleNextStory = () => {
    if (selectedHighlight && currentStoryIndex < selectedHighlight.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      closeHighlightModal();
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const closeHighlightModal = () => {
    setShowHighlightModal(false);
    setSelectedHighlight(null);
    setCurrentStoryIndex(0);
    progressAnim.setValue(0);
  };

  const dummyPosts = [
    {
      id: '1',
      username: 'duygu',
      image: require('../assets/posts/duygu.jpg'),
      likes: 45,
      comments: 12,
      caption: 'Güzel bir gün geçirdim! ☀️',
      createdAt: new Date(),
    },
    {
      id: '2',
      username: 'duygu',
      image: require('../assets/posts/ayse.jpg'),
      likes: 89,
      comments: 23,
      caption: 'Yemek fotoğrafçılığı denemeleri 📸🍕',
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      id: '3',
      username: 'duygu',
      image: require('../assets/stories/selin.jpg'),
      likes: 156,
      comments: 34,
      caption: 'Arkadaşlarla güzel vakit 👫',
      createdAt: new Date(Date.now() - 172800000),
    },
  ];

  const dummyFollowers = [
    { id: '1', name: 'aysecelik', fullName: 'Ayşe Çelik', avatar: require('../assets/stories/ayse.jpg'), isFollowing: true },
    { id: '2', name: 'burak_yilmaz', fullName: 'Burak Yılmaz', avatar: require('../assets/posts/duygu.jpg'), isFollowing: false },
    { id: '3', name: 'selin.kaya', fullName: 'Selin Kaya', avatar: require('../assets/stories/selin.jpg'), isFollowing: true },
    { id: '4', name: 'cemre_demir', fullName: 'Cemre Demir', avatar: require('../assets/posts/ayse.jpg'), isFollowing: false },
    { id: '5', name: 'aliozkan', fullName: 'Ali Özkan', avatar: require('../assets/posts/duygu.jpg'), isFollowing: true },
    { id: '6', name: 'ceren_arslan', fullName: 'Ceren Arslan', avatar: require('../assets/stories/ayse.jpg'), isFollowing: false },
    { id: '7', name: 'zeynepsahin5', fullName: 'Zeynep Şahin', avatar: require('../assets/stories/selin.jpg'), isFollowing: true },
    { id: '8', name: 'mirac_can', fullName: 'Miraç Can', avatar: require('../assets/posts/ayse.jpg'), isFollowing: false },
  ];

  const dummyAccounts = [
    { id: '1', username: 'duygu', avatar: require('../assets/posts/duygu.jpg'), isActive: true },
    { id: '2', username: 'ayse', avatar: require('../assets/posts/ayse.jpg'), isActive: false },
    { id: '3', username: 'selin', avatar: require('../assets/stories/selin.jpg'), isActive: false },
  ];

  const displayPosts = userPosts.length > 0 ? userPosts : dummyPosts;

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabından çıkmak istediğinden emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: () => {
            signOut(auth)
              .then(() => {
                console.log('Çıkış başarılı');
              })
              .catch((error) => {
                console.log('Çıkış hatası:', error.message);
              });
          },
        },
      ]
    );
  };

  const handleAddAccount = () => {
    setShowAccountMenu(false);
    Alert.alert('Hesap Ekle', 'Yeni hesap ekleme sayfası açılacak');
  };

  const switchAccount = (accountId) => {
    setShowAccountMenu(false);
    const selectedAccount = dummyAccounts.find(acc => acc.id === accountId);
    Alert.alert('Hesap Değiştir', `${selectedAccount.username} hesabına geçiliyor`);
  };

  const handleHighlightPress = (highlight) => {
    setSelectedHighlight(highlight);
    setCurrentStoryIndex(0);
    setShowHighlightModal(true);
  };

  const handlePostPress = (post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  const handleEditProfile = () => {
    setShowEditProfileModal(true);
  };

  const handleShareProfile = () => {
    setShowShareProfileModal(true);
  };
  const handleCreatePost = () => {
    setShowCreatePostModal(true);
  };

  const handleDiscover = () => {
    setShowDiscoverModal(true);
  };

  const handleCreatePostOption = (option) => {
    setShowCreatePostModal(false);
    
    switch (option) {
      case 'post':
        Alert.alert('Gönderi', 'Yeni gönderi oluşturuluyor...');
        break;
      case 'story':
        Alert.alert('Story', 'Yeni story oluşturuluyor...');
        break;
      case 'reel':
        Alert.alert('Reel', 'Yeni reel oluşturuluyor...');
        break;
      case 'live':
        Alert.alert('Canlı Yayın', 'Canlı yayın başlatılıyor...');
        break;
      default:
        break;
    }
  };

  const handleFollowUser = (userId) => {
    setDiscoverData(prevData => 
      prevData.map(user => 
        user.id === userId 
          ? { ...user, isFollowing: !user.isFollowing }
          : user
      )
    );
  };

  const handleDismissUser = (userId) => {
    setDiscoverData(prevData => 
      prevData.filter(user => user.id !== userId)
    );
  };

  const handleSaveProfile = () => {
    Alert.alert('Başarılı', 'Profil bilgilerin güncellendi!');
    setShowEditProfileModal(false);
  };

  const shareOptions = [
    { id: 'copy_link', icon: 'link-outline', title: 'Bağlantıyı kopyala', subtitle: 'Profil linkini kopyala' },
    { id: 'whatsapp', icon: 'logo-whatsapp', title: 'WhatsApp', subtitle: 'WhatsApp ile paylaş' },
    { id: 'instagram', icon: 'logo-instagram', title: 'Instagram Story', subtitle: 'Story\'de paylaş' },
    { id: 'facebook', icon: 'logo-facebook', title: 'Facebook', subtitle: 'Facebook\'ta paylaş' },
    { id: 'twitter', icon: 'logo-twitter', title: 'Twitter', subtitle: 'Tweet olarak paylaş' },
    { id: 'more', icon: 'ellipsis-horizontal', title: 'Daha fazla', subtitle: 'Diğer uygulamalar' },
  ];

  const createPostOptions = [
    { id: 'post', icon: 'image-outline', title: 'Gönderi', subtitle: 'Fotoğraf ve video paylaş' },
    { id: 'story', icon: 'add-circle-outline', title: 'Story', subtitle: '24 saatte kaybolan içerik' },
    { id: 'reel', icon: 'videocam-outline', title: 'Reel', subtitle: 'Kısa video oluştur' },
    { id: 'live', icon: 'radio-outline', title: 'Canlı Yayın', subtitle: 'Canlı yayın başlat' },
  ];

  const handleShareOption = (optionId) => {
    setShowShareProfileModal(false);
    
    switch (optionId) {
      case 'copy_link':
        Alert.alert('Kopyalandı', 'Profil linki panoya kopyalandı');
        break;
      case 'whatsapp':
        Alert.alert('WhatsApp', 'WhatsApp uygulaması açılacak');
        break;
      case 'instagram':
        Alert.alert('Instagram Story', 'Instagram Story\'de paylaşılacak');
        break;
      case 'facebook':
        Alert.alert('Facebook', 'Facebook\'ta paylaşılacak');
        break;
      case 'twitter':
        Alert.alert('Twitter', 'Twitter\'da paylaşılacak');
        break;
      case 'more':
        Alert.alert('Daha fazla', 'Sistem paylaşım menüsü açılacak');
        break;
      default:
        break;
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffTime = Math.abs(now - postDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 gün önce';
    if (diffDays < 7) return `${diffDays} gün önce`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} hafta önce`;
    return `${Math.ceil(diffDays / 30)} ay önce`;
  };

  const renderHighlight = ({ item }) => (
    <TouchableOpacity 
      style={styles.highlightItem}
      onPress={() => handleHighlightPress(item)}
    >
      <View style={styles.highlightImageContainer}>
        <Image source={item.image} style={styles.highlightImage} />
      </View>
      <Text style={styles.highlightTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderPostGrid = ({ item }) => (
    <TouchableOpacity 
      style={styles.postItem}
      onPress={() => handlePostPress(item)}
    >
      <Image 
        source={item.imageUrl ? { uri: item.imageUrl } : item.image} 
        style={styles.postImage} 
      />
      <View style={styles.postOverlay}>
        <View style={styles.postStats}>
          <View style={styles.postStat}>
            <Ionicons name="heart" size={16} color="#fff" />
            <Text style={styles.postStatText}>{item.likes?.length || item.likes || 0}</Text>
          </View>
          <View style={styles.postStat}>
            <Ionicons name="chatbubble" size={16} color="#fff" />
            <Text style={styles.postStatText}>{item.comments?.length || item.comments || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFollowerItem = ({ item }) => (
    <View style={styles.followerItem}>
      <Image source={item.avatar} style={styles.followerAvatar} />
      <View style={styles.followerInfo}>
        <Text style={styles.followerUsername}>{item.name}</Text>
        <Text style={styles.followerFullName}>{item.fullName}</Text>
      </View>
      <TouchableOpacity style={[styles.followButton, item.isFollowing && styles.followingButton]}>
        <Text style={[styles.followButtonText, item.isFollowing && styles.followingButtonText]}>
          {item.isFollowing ? 'Takiptesin' : 'Takip Et'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderMenuItem = ({ item }) => {
    // Firebase verilerini göstermek için sayı hesapla
    let badgeCount = 0;
    let badgeText = '';
    
    switch (item.id) {
      case 'activity':
        badgeCount = unreadActivities.length;
        break;
      case 'archive':
        badgeCount = archivedCount;
        break;
      case 'saved':
        badgeCount = savedCount;
        break;
      case 'close_friends':
        badgeCount = closeFriendsCount;
        break;
    }

    return (
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => handleMenuItemPress(item.id)}
        disabled={menuLoading}
      >
        <View style={styles.menuItemLeft}>
          <View style={styles.menuIconContainer}>
            <Ionicons name={item.icon} size={24} color="#000" />
            {badgeCount > 0 && (
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>
                  {badgeCount > 99 ? '99+' : badgeCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.menuItemText}>{item.label}</Text>
          {badgeCount > 0 && (
            <Text style={styles.menuItemCount}>({badgeCount})</Text>
          )}
        </View>
        <View style={styles.menuItemRight}>
          {menuLoading && <ActivityIndicator size="small" color="#8e8e8e" />}
          {item.hasChevron && !menuLoading && (
            <Ionicons name="chevron-forward" size={20} color="#8e8e8e" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderAccountItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.accountItem}
      onPress={() => switchAccount(item.id)}
    >
      <Image source={item.avatar} style={styles.accountAvatar} />
      <Text style={styles.accountUsername}>{item.username}</Text>
      {item.isActive && (
        <View style={styles.activeIndicator}>
          <Ionicons name="checkmark" size={16} color="#3897f0" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderDiscoverUser = ({ item }) => (
    <View style={styles.discoverUserCard}>
      <TouchableOpacity 
        style={styles.discoverDismiss}
        onPress={() => handleDismissUser(item.id)}
      >
        <Ionicons name="close" size={16} color="#8e8e8e" />
      </TouchableOpacity>
      
      <Image source={item.avatar} style={styles.discoverUserAvatar} />
      
      <Text style={styles.discoverUserUsername}>{item.username}</Text>
      <Text style={styles.discoverUserFullName}>{item.fullName}</Text>
      
      <Text style={styles.discoverMutualText}>
        {item.mutualCount} ortak takipçi
      </Text>
      
      <View style={styles.discoverUserActions}>
        <TouchableOpacity 
          style={[styles.discoverFollowButton, item.isFollowing && styles.discoverFollowingButton]}
          onPress={() => handleFollowUser(item.id)}
        >
          <Text style={[styles.discoverFollowButtonText, item.isFollowing && styles.discoverFollowingButtonText]}>
            {item.isFollowing ? 'Takiptesin' : 'Takip Et'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.discoverRemoveButton}
          onPress={() => handleDismissUser(item.id)}
        >
          <Text style={styles.discoverRemoveButtonText}>Kaldır</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCreatePostOption = ({ item }) => (
    <TouchableOpacity 
      style={styles.createPostOption}
      onPress={() => handleCreatePostOption(item.id)}
    >
      <View style={styles.createPostOptionIcon}>
        <Ionicons name={item.icon} size={28} color="#000" />
      </View>
      <View style={styles.createPostOptionContent}>
        <Text style={styles.createPostOptionTitle}>{item.title}</Text>
        <Text style={styles.createPostOptionSubtitle}>{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#8e8e8e" />
    </TouchableOpacity>
  );

  const currentUser = auth.currentUser;
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Kullanıcı';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="lock-closed-outline" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowAccountMenu(true)}>
          <View style={styles.headerUsernameContainer}>
            <Text style={styles.headerUsername}>{displayName}</Text>
            <Ionicons name="chevron-down" size={16} color="#000" />
          </View>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleCreatePost}
          >
            <Ionicons name="add-outline" size={28} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowSideMenu(true)}
          >
            <Ionicons name="menu-outline" size={28} color="#000" />
            {unreadActivities.length > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>
                  {unreadActivities.length > 9 ? '9+' : unreadActivities.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <Image
              source={require('../assets/posts/duygu.jpg')}
              style={styles.profileAvatar}
            />
            <View style={styles.statsContainer}>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statNumber}>{displayPosts.length}</Text>
                <Text style={styles.statLabel}>Gönderi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statItem}
                onPress={() => {
                  setModalType('followers');
                  setModalVisible(true);
                }}
              >
                <Text style={styles.statNumber}>{followers.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Takipçi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statItem}
                onPress={() => {
                  setModalType('following');
                  setModalVisible(true);
                }}
              >
                <Text style={styles.statNumber}>{following}</Text>
                <Text style={styles.statLabel}>Takip</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bioContainer}>
            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.bioText}>Computer Engineer</Text>
            <TouchableOpacity>
              <Text style={styles.bioLink}>linktr.ee/{displayName.toLowerCase()}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.editButtonText}>Profili düzenle</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={handleShareProfile}
            >
              <Text style={styles.shareButtonText}>Profili paylaş</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={handleDiscover}
            >
              <Ionicons name="person-add-outline" size={16} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.highlightsSection}>
          <FlatList
            data={highlights}
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={renderHighlight}
            contentContainerStyle={styles.highlightsContent}
          />
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'posts' && styles.activeTab]}
            onPress={() => setSelectedTab('posts')}
          >
            <Ionicons 
              name="grid-outline" 
              size={24} 
              color={selectedTab === 'posts' ? '#000' : '#8e8e8e'} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'reels' && styles.activeTab]}
            onPress={() => setSelectedTab('reels')}
          >
            <Ionicons 
              name="play-outline" 
              size={24} 
              color={selectedTab === 'reels' ? '#000' : '#8e8e8e'} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, selectedTab === 'tagged' && styles.activeTab]}
            onPress={() => setSelectedTab('tagged')}
          >
            <Ionicons 
              name="person-outline" 
              size={24} 
              color={selectedTab === 'tagged' ? '#000' : '#8e8e8e'} 
            />
          </TouchableOpacity>
        </View>

        {selectedTab === 'posts' && (
          <>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3897f0" />
                <Text style={styles.loadingText}>Gönderiler yükleniyor...</Text>
              </View>
            ) : displayPosts.length > 0 ? (
              <FlatList
                data={displayPosts}
                keyExtractor={(item) => item.id}
                numColumns={3}
                renderItem={renderPostGrid}
                scrollEnabled={false}
                contentContainerStyle={styles.postsGrid}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="camera-outline" size={64} color="#8e8e8e" />
                <Text style={styles.emptyStateText}>Henüz gönderi yok</Text>
                <Text style={styles.emptyStateSubtext}>İlk gönderini paylaş</Text>
              </View>
            )}
          </>
        )}

        {selectedTab === 'reels' && (
          <View style={styles.emptyState}>
            <Ionicons name="play-circle-outline" size={64} color="#8e8e8e" />
            <Text style={styles.emptyStateText}>Henüz reels yok</Text>
            <Text style={styles.emptyStateSubtext}>Paylaştığın reels burada görünecek</Text>
          </View>
        )}

        {selectedTab === 'tagged' && (
          <View style={styles.emptyState}>
            <Ionicons name="person-circle-outline" size={64} color="#8e8e8e" />
            <Text style={styles.emptyStateText}>Etiketlendiğin fotoğraf ve video yok</Text>
            <Text style={styles.emptyStateSubtext}>İnsanlar seni fotoğraf ve videolarda etiketlediğinde, burada görünecek</Text>
          </View>
        )}
      </ScrollView>


      {menuLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#3897f0" />
            <Text style={styles.loadingOverlayText}>Firebase ile bağlantı kuruluyor...</Text>
          </View>
        </View>
      )}

      <Modal
        visible={showCreatePostModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreatePostModal(false)}
      >
        <View style={styles.createPostOverlay}>
          <TouchableOpacity 
            style={styles.createPostBackdrop}
            onPress={() => setShowCreatePostModal(false)}
          />
          <View style={styles.createPostContent}>
            <View style={styles.createPostHandle} />
            <View style={styles.createPostHeader}>
              <Text style={styles.createPostTitle}>Oluştur</Text>
            </View>

            <FlatList
              data={createPostOptions}
              keyExtractor={(item) => item.id}
              renderItem={renderCreatePostOption}
              scrollEnabled={false}
              style={styles.createPostList}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDiscoverModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDiscoverModal(false)}
      >
        <View style={styles.discoverOverlay}>
          <SafeAreaView style={styles.discoverContent}>
            <View style={styles.discoverHeader}>
              <Text style={styles.discoverTitle}>Yeni insanları keşfet</Text>
              <TouchableOpacity onPress={() => setShowDiscoverModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <Text style={styles.discoverSubtitle}>
              Tanıyabileceğin kişiler
            </Text>

            <FlatList
              data={discoverData}
              keyExtractor={(item) => item.id}
              renderItem={renderDiscoverUser}
              numColumns={2}
              contentContainerStyle={styles.discoverGrid}
              showsVerticalScrollIndicator={false}
            />

            {discoverData.length === 0 && (
              <View style={styles.discoverEmptyState}>
                <Ionicons name="people-outline" size={64} color="#8e8e8e" />
                <Text style={styles.discoverEmptyText}>Tüm öneriler görüntülendi</Text>
                <Text style={styles.discoverEmptySubtext}>Yeni öneriler için daha sonra tekrar kontrol et</Text>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      <Modal
        visible={showHighlightModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeHighlightModal}
      >
        <View style={styles.storyModalOverlay}>
          {selectedHighlight && (
            <>
              <View style={styles.storyProgressContainer}>
                {selectedHighlight.stories.map((_, index) => (
                  <View key={index} style={styles.storyProgressBar}>
                    <Animated.View
                      style={[
                        styles.storyProgressFill,
                        {
                          width: index === currentStoryIndex 
                            ? progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                              })
                            : index < currentStoryIndex ? '100%' : '0%'
                        }
                      ]}
                    />
                  </View>
                ))}
              </View>

              <View style={styles.storyHeader}>
                <View style={styles.storyUserInfo}>
                  <Image source={selectedHighlight.image} style={styles.storyUserAvatar} />
                  <Text style={styles.storyUsername}>{selectedHighlight.title}</Text>
                </View>
                <TouchableOpacity onPress={closeHighlightModal}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.storyContent}
                activeOpacity={1}
                onPress={handleNextStory}
              >
                <TouchableOpacity
                  style={styles.storyPrevArea}
                  activeOpacity={1}
                  onPress={handlePrevStory}
                />
                <Image 
                  source={selectedHighlight.stories[currentStoryIndex].image}
                  style={styles.storyImage}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>

      <Modal
        visible={showPostModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPostModal(false)}
      >
        <View style={styles.postModalOverlay}>
          <View style={styles.postModalContent}>
            {selectedPost && (
              <>
                <View style={styles.postModalHeader}>
                  <View style={styles.postModalUserInfo}>
                    <Image source={require('../assets/posts/duygu.jpg')} style={styles.postModalAvatar} />
                    <Text style={styles.postModalUsername}>{displayName}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowPostModal(false)}>
                    <Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>

                <ScrollView>
                  <Image 
                    source={selectedPost.imageUrl ? { uri: selectedPost.imageUrl } : selectedPost.image}
                    style={styles.postModalImage}
                  />
                  
                  <View style={styles.postModalActions}>
                    <View style={styles.postModalActionButtons}>
                      <TouchableOpacity style={styles.postModalActionButton}>
                        <Ionicons name="heart-outline" size={28} color="#000" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.postModalActionButton}>
                        <Ionicons name="chatbubble-outline" size={26} color="#000" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.postModalActionButton}>
                        <Ionicons name="paper-plane-outline" size={26} color="#000" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity>
                      <Ionicons name="bookmark-outline" size={26} color="#000" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.postModalInfo}>
                    <Text style={styles.postModalLikes}>
                      {(selectedPost.likes?.length || selectedPost.likes || 0).toLocaleString()} beğenme
                    </Text>
                    
                    {selectedPost.caption && (
                      <View style={styles.postModalCaption}>
                        <Text style={styles.postModalCaptionUsername}>{displayName}</Text>
                        <Text style={styles.postModalCaptionText}> {selectedPost.caption}</Text>
                      </View>
                    )}

                    <Text style={styles.postModalDate}>
                      {formatDate(selectedPost.createdAt)}
                    </Text>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View style={styles.editProfileOverlay}>
          <SafeAreaView style={styles.editProfileContent}>
            <View style={styles.editProfileHeader}>
              <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                <Text style={styles.editProfileCancel}>İptal</Text>
              </TouchableOpacity>
              <Text style={styles.editProfileTitle}>Profili Düzenle</Text>
              <TouchableOpacity onPress={handleSaveProfile}>
                <Text style={styles.editProfileSave}>Tamam</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editProfileScroll}>
              <View style={styles.editProfileAvatarSection}>
                <Image 
                  source={require('../assets/posts/duygu.jpg')} 
                  style={styles.editProfileAvatar} 
                />
                <TouchableOpacity style={styles.changePhotoButton}>
                  <Text style={styles.changePhotoText}>Profil fotoğrafını değiştir</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.editProfileForm}>
                <View style={styles.editProfileField}>
                  <Text style={styles.editProfileLabel}>Ad</Text>
                  <TextInput
                    style={styles.editProfileInput}
                    value={editProfileData.name}
                    onChangeText={(text) => setEditProfileData({...editProfileData, name: text})}
                    placeholder="Adınızı girin"
                  />
                </View>

                <View style={styles.editProfileField}>
                  <Text style={styles.editProfileLabel}>Kullanıcı adı</Text>
                  <TextInput
                    style={styles.editProfileInput}
                    value={editProfileData.username}
                    onChangeText={(text) => setEditProfileData({...editProfileData, username: text})}
                    placeholder="Kullanıcı adınızı girin"
                  />
                </View>

                <View style={styles.editProfileField}>
                  <Text style={styles.editProfileLabel}>Web sitesi</Text>
                  <TextInput
                    style={styles.editProfileInput}
                    value={editProfileData.website}
                    onChangeText={(text) => setEditProfileData({...editProfileData, website: text})}
                    placeholder="Web sitenizi girin"
                  />
                </View>

                <View style={styles.editProfileField}>
                  <Text style={styles.editProfileLabel}>Biyografi</Text>
                  <TextInput
                    style={[styles.editProfileInput, styles.editProfileBioInput]}
                    value={editProfileData.bio}
                    onChangeText={(text) => setEditProfileData({...editProfileData, bio: text})}
                    placeholder="Kendinizi tanıtın"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity style={styles.editProfileOption}>
                  <Text style={styles.editProfileOptionText}>Kişisel bilgi ayarlarına geç</Text>
                  <Ionicons name="chevron-forward" size={20} color="#8e8e8e" />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      <Modal
        visible={showShareProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareProfileModal(false)}
      >
        <View style={styles.shareProfileOverlay}>
          <TouchableOpacity 
            style={styles.shareProfileBackdrop}
            onPress={() => setShowShareProfileModal(false)}
          />
          <View style={styles.shareProfileContent}>
            <View style={styles.shareProfileHandle} />
            <View style={styles.shareProfileHeader}>
              <Text style={styles.shareProfileTitle}>Profili Paylaş</Text>
            </View>

            <ScrollView style={styles.shareProfileScroll}>
              {shareOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.shareOption}
                  onPress={() => handleShareOption(option.id)}
                >
                  <View style={styles.shareOptionIcon}>
                    <Ionicons name={option.icon} size={24} color="#000" />
                  </View>
                  <View style={styles.shareOptionContent}>
                    <Text style={styles.shareOptionTitle}>{option.title}</Text>
                    <Text style={styles.shareOptionSubtitle}>{option.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8e8e8e" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.shareProfileQR}>
              <View style={styles.qrCodeContainer}>
                <View style={styles.qrCodePlaceholder}>
                  <Ionicons name="qr-code" size={48} color="#8e8e8e" />
                </View>
                <Text style={styles.qrCodeText}>QR Kodu</Text>
                <Text style={styles.qrCodeSubtext}>Diğer kişiler seni takip etmek için bu kodu tarayabilir</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSideMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSideMenu(false)}
      >
        <View style={styles.sideMenuOverlay}>
          <TouchableOpacity 
            style={styles.sideMenuBackdrop}
            onPress={() => setShowSideMenu(false)}
          />
          <View style={styles.sideMenuContent}>
            <View style={styles.sideMenuHeader}>
              <Text style={styles.sideMenuTitle}>Menü</Text>
              <TouchableOpacity onPress={() => setShowSideMenu(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            
            <View style={styles.firebaseStatusContainer}>
              <View style={styles.firebaseStatusIndicator}>
                <View style={[styles.firebaseStatusDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.firebaseStatusText}>Firebase Bağlı</Text>
              </View>
              <Text style={styles.firebaseStatusSubtext}>
                Aktivite: {unreadActivities.length} • Arşiv: {archivedCount} • Kayıtlı: {savedCount}
              </Text>
            </View>

            <ScrollView style={styles.sideMenuScroll}>
              <FlatList
                data={menuItems}
                keyExtractor={(item) => item.id}
                renderItem={renderMenuItem}
                scrollEnabled={false}
              />
            </ScrollView>

            <View style={styles.sideMenuFooter}>
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={24} color="#ff3040" />
                <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.addAccountButton}
                onPress={handleAddAccount}
              >
                <Ionicons name="person-add-outline" size={24} color="#3897f0" />
                <Text style={styles.addAccountButtonText}>Hesap Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAccountMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAccountMenu(false)}
      >
        <View style={styles.accountMenuOverlay}>
          <TouchableOpacity 
            style={styles.accountMenuBackdrop}
            onPress={() => setShowAccountMenu(false)}
          />
          <View style={styles.accountMenuContent}>
            <View style={styles.accountMenuHeader}>
              <Text style={styles.accountMenuTitle}>Hesap Değiştir</Text>
              <TouchableOpacity onPress={() => setShowAccountMenu(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={dummyAccounts}
              keyExtractor={(item) => item.id}
              renderItem={renderAccountItem}
              scrollEnabled={false}
            />

            <TouchableOpacity 
              style={styles.addAccountMenuButton}
              onPress={handleAddAccount}
            >
              <Ionicons name="add-circle-outline" size={24} color="#3897f0" />
              <Text style={styles.addAccountMenuButtonText}>Hesap Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={dummyFollowers}
              keyExtractor={(item) => item.id}
              renderItem={renderFollowerItem}
              showsVerticalScrollIndicator={false}
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
  },
  headerButton: {
    padding: 4,
    position: 'relative',
  },
  headerBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff3040',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerUsernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerUsername: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginRight: 28,
  },
  statsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 13,
    color: '#8e8e8e',
    marginTop: 2,
  },
  bioContainer: {
    marginBottom: 16,
  },
  displayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  bioText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 18,
    marginBottom: 2,
  },
  bioLink: {
    fontSize: 14,
    color: '#3897f0',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  moreButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  highlightsSection: {
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  highlightsContent: {
    paddingHorizontal: 16,
  },
  highlightItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  highlightImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  highlightImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  highlightTitle: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
    maxWidth: 64,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#000',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#8e8e8e',
    marginTop: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingOverlayText: {
    fontSize: 16,
    color: '#000',
    marginTop: 16,
    textAlign: 'center',
  },
  postsGrid: {
    paddingTop: 2,
  },
  postItem: {
    width: width / 3 - 1,
    height: width / 3 - 1,
    marginRight: 2,
    marginBottom: 2,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  postOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  postStatText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8e8e8e',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Firebase Menu Styles
  firebaseStatusContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  firebaseStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  firebaseStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  firebaseStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  firebaseStatusSubtext: {
    fontSize: 12,
    color: '#8e8e8e',
    marginLeft: 16,
  },
  menuIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  menuBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ff3040',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  menuBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  menuItemCount: {
    fontSize: 14,
    color: '#8e8e8e',
    marginLeft: 8,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  createPostOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  createPostBackdrop: {
    flex: 1,
  },
  createPostContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  createPostHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#c4c4c4',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  createPostHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  createPostTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  createPostList: {
    paddingVertical: 8,
  },
  createPostOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  createPostOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  createPostOptionContent: {
    flex: 1,
  },
  createPostOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  createPostOptionSubtitle: {
    fontSize: 14,
    color: '#8e8e8e',
  },

  discoverOverlay: {
    flex: 1,
    backgroundColor: '#fff',
  },
  discoverContent: {
    flex: 1,
  },
  discoverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  discoverTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  discoverSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  discoverGrid: {
    paddingHorizontal: 8,
  },
  discoverUserCard: {
    width: (width - 24) / 2,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    alignItems: 'center',
    position: 'relative',
  },
  discoverDismiss: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  discoverUserAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
  },
  discoverUserUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  discoverUserFullName: {
    fontSize: 12,
    color: '#8e8e8e',
    textAlign: 'center',
    marginBottom: 8,
  },
  discoverMutualText: {
    fontSize: 12,
    color: '#8e8e8e',
    textAlign: 'center',
    marginBottom: 16,
  },
  discoverUserActions: {
    width: '100%',
  },
  discoverFollowButton: {
    backgroundColor: '#3897f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  discoverFollowingButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  discoverFollowButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  discoverFollowingButtonText: {
    color: '#000',
  },
  discoverRemoveButton: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  discoverRemoveButtonText: {
    color: '#8e8e8e',
    fontSize: 14,
    fontWeight: '500',
  },
  discoverEmptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  discoverEmptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    textAlign: 'center',
  },
  discoverEmptySubtext: {
    fontSize: 14,
    color: '#8e8e8e',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  storyModalOverlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  storyProgressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 50,
    paddingBottom: 16,
  },
  storyProgressBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 2,
    borderRadius: 1,
  },
  storyProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  storyUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  storyUsername: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  storyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyPrevArea: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '30%',
    zIndex: 1,
  },
  storyImage: {
    width: width,
    height: height * 0.7,
  },

  postModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
  },
  postModalContent: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 40,
    borderRadius: 12,
    maxHeight: '90%',
  },
  postModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  postModalUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postModalAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  postModalUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  postModalImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  postModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  postModalActionButtons: {
    flexDirection: 'row',
  },
  postModalActionButton: {
    marginRight: 16,
  },
  postModalInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  postModalLikes: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  postModalCaption: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  postModalCaptionUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  postModalCaptionText: {
    fontSize: 14,
    color: '#000',
  },
  postModalDate: {
    fontSize: 12,
    color: '#8e8e8e',
    textTransform: 'uppercase',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  followerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  followerInfo: {
    flex: 1,
  },
  followerUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  followerFullName: {
    fontSize: 14,
    color: '#8e8e8e',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#3897f0',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  followingButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#000',
  },
  sideMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  sideMenuBackdrop: {
    flex: 1,
  },
  sideMenuContent: {
    width: width * 0.8,
    backgroundColor: '#fff',
    paddingTop: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sideMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  sideMenuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  sideMenuScroll: {
    flex: 1,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
  },
  sideMenuFooter: {
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#ff3040',
    marginLeft: 16,
    fontWeight: '500',
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  addAccountButtonText: {
    fontSize: 16,
    color: '#3897f0',
    marginLeft: 16,
    fontWeight: '500',
  },
  accountMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  accountMenuBackdrop: {
    flex: 1,
  },
  accountMenuContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    maxHeight: '60%',
  },
  accountMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  accountMenuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  accountAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  accountUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  activeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAccountMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
  },
  addAccountMenuButtonText: {
    fontSize: 16,
    color: '#3897f0',
    marginLeft: 12,
    fontWeight: '500',
  },

  // Edit Profile Modal Styles
  editProfileOverlay: {
    flex: 1,
    backgroundColor: '#fff',
  },
  editProfileContent: {
    flex: 1,
  },
  editProfileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  editProfileCancel: {
    fontSize: 16,
    color: '#000',
  },
  editProfileTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  editProfileSave: {
    fontSize: 16,
    color: '#3897f0',
    fontWeight: '600',
  },
  editProfileScroll: {
    flex: 1,
  },
  editProfileAvatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  editProfileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  changePhotoButton: {
    paddingVertical: 8,
  },
  changePhotoText: {
    fontSize: 16,
    color: '#3897f0',
    fontWeight: '600',
  },
  editProfileForm: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  editProfileField: {
    marginBottom: 24,
  },
  editProfileLabel: {
    fontSize: 14,
    color: '#8e8e8e',
    marginBottom: 8,
    fontWeight: '500',
  },
  editProfileInput: {
    fontSize: 16,
    color: '#000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
  },
  editProfileBioInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  editProfileOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    marginTop: 16,
  },
  editProfileOptionText: {
    fontSize: 16,
    color: '#3897f0',
  },

  // Share Profile Modal Styles
  shareProfileOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  shareProfileBackdrop: {
    flex: 1,
  },
  shareProfileContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  shareProfileHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#c4c4c4',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  shareProfileHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  shareProfileTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  shareProfileScroll: {
    maxHeight: 300,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  shareOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shareOptionContent: {
    flex: 1,
  },
  shareOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  shareOptionSubtitle: {
    fontSize: 14,
    color: '#8e8e8e',
  },
  shareProfileQR: {
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  qrCodeContainer: {
    alignItems: 'center',
  },
  qrCodePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  qrCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  qrCodeSubtext: {
    fontSize: 14,
    color: '#8e8e8e',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ProfileScreen;