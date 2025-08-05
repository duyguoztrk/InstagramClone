import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  Text,
  Dimensions,
  Animated,
  Platform,
  TouchableOpacity
} from 'react-native';

import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from './config/firebase';
import autoMessagingSystem from './utils/AutoMessagingSystem';

import LoginScreen from './screens/LoginScreen';
import FeedScreen from './screens/FeedScreen';
import SearchScreen from './screens/SearchScreen';
import ProfileScreen from './screens/ProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import PostScreen from './screens/PostScreen';
import DirectMessagesScreen from './screens/DirectMessagesScreen';
import ChatScreen from './screens/ChatScreen';
import UserProfile from './screens/UserProfileScreen';
import NewMessageScreen from './screens/NewMessageScreen'; 

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const { width, height } = Dimensions.get('window');

const initialPosts = [
  {
    id: '1',
    username: 'duygu',
    avatar: require('./assets/posts/duygu.jpg'),
    image: require('./assets/posts/duygu.jpg'),
    caption: 'Güzel bir gün.',
    likes: 42,
    liked: false,
    comments: ['Çok güzel', 'Harika görünüyorsun.'],
    timestamp: '2 saat önce',
    isVerified: true,
  },
  {
    id: '2',
    username: 'ayse',
    avatar: require('./assets/posts/ayse.jpg'),
    image: require('./assets/posts/ayse.jpg'),
    caption: 'Yeni gün yeni enerji  #goodvibes',
    likes: 128,
    liked: true,
    comments: ['Enerji dolu'],
    timestamp: '5 saat önce',
    isVerified: false,
  },
  {
    id: '3',
    username: 'selin',
    avatar: require('./assets/stories/selin.jpg'),
    image: require('./assets/stories/selin.jpg'),
    caption: 'yeni saçlarımla ben',
    likes: 89,
    liked: false,
    comments: ['Güzel mekan'],
    timestamp: '1 gün önce',
    isVerified: false,
  },
];

const addTestUsers = async () => {
  const testUsers = [
    {
      id: 'user1',
      username: 'duygu',
      displayName: 'Duygu Yılmaz',
      email: 'duygu@test.com',
      profilePicture: null,
      bio: 'Fotoğraf tutkunu 📸',
      followersCount: 145,
      followingCount: 89,
      verified: true,
      following: [],
      followers: [],
      isOnline: true,
    },
    {
      id: 'user2', 
      username: 'ayse',
      displayName: 'Ayşe Demir',
      email: 'ayse@test.com',
      profilePicture: null,
      bio: 'Doğa sevgisi 🌿',
      followersCount: 67,
      followingCount: 123,
      verified: false,
      following: [],
      followers: [],
      isOnline: Math.random() > 0.5,
    },
    {
      id: 'user3',
      username: 'selin',
      displayName: 'Selin Kaya',
      email: 'selin@test.com', 
      profilePicture: null,
      bio: 'Sanat ve yaşam ✨',
      followersCount: 234,
      followingCount: 45,
      verified: false,
      following: [],
      followers: [],
      isOnline: Math.random() > 0.5,
    },
    {
      id: 'user4',
      username: 'mehmet',
      displayName: 'Mehmet Özkan',
      email: 'mehmet@test.com',
      profilePicture: null,
      bio: 'Spor ve fitness 💪',
      followersCount: 89,
      followingCount: 156,
      verified: false,
      following: [],
      followers: [],
      isOnline: Math.random() > 0.5,
    },
    {
      id: 'user5',
      username: 'zeynep',
      displayName: 'Zeynep Çelik',
      email: 'zeynep@test.com',
      profilePicture: null,
      bio: 'Müzik aşığı 🎵',
      followersCount: 312,
      followingCount: 78,
      verified: true,
      following: [],
      followers: [],
      isOnline: Math.random() > 0.5,
    },
    {
      id: 'user6',
      username: 'ali',
      displayName: 'Ali Yıldız',
      email: 'ali@test.com',
      profilePicture: null,
      bio: 'Teknoloji meraklısı 💻',
      followersCount: 156,
      followingCount: 234,
      verified: false,
      following: [],
      followers: [],
      isOnline: Math.random() > 0.5,
    },
    {
      id: 'user7',
      username: 'ceren',
      displayName: 'Ceren Şahin',
      email: 'ceren@test.com',
      profilePicture: null,
      bio: 'Yemek blogger 🍴',
      followersCount: 445,
      followingCount: 67,
      verified: true,
      following: [],
      followers: [],
      isOnline: Math.random() > 0.5,
    },
    {
      id: 'user8',
      username: 'burak',
      displayName: 'Burak Aydın',
      email: 'burak@test.com',
      profilePicture: null,
      bio: 'Seyahat tutkunu ✈️',
      followersCount: 278,
      followingCount: 189,
      verified: false,
      following: [],
      followers: [],
      isOnline: Math.random() > 0.5,
    }
  ];

  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    if (snapshot.size === 0) {
      console.log('Hiç kullanıcı bulunamadı, test kullanıcıları ekleniyor...');
      
      for (const user of testUsers) {
        await setDoc(doc(db, 'users', user.id), user);
        console.log(`Test kullanıcısı eklendi: ${user.username}`);
      }
      console.log('Tüm test kullanıcıları başarıyla eklendi!');
    } else {
      console.log(`Zaten ${snapshot.size} kullanıcı mevcut.`);
    }
    
    return testUsers;
  } catch (error) {
    console.error('Test kullanıcıları eklenirken hata:', error);
    return [];
  }
};


const testFirebaseConnection = async () => {
  try {
    console.log('Firebase bağlantısı test ediliyor...');
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    console.log('Firebase bağlantısı başarılı!');
    console.log(` Toplam kullanıcı sayısı: ${snapshot.size}`);
    
    const users = [];
    snapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        ...userData
      });
      console.log(` Kullanıcı: ${userData.username} (${doc.id})`);
    });
    
    return { success: true, users };
  } catch (error) {
    console.error(' Firebase bağlantı hatası:', error);
    return { success: false, users: [] };
  }
};


const initializeAutoMessaging = async (users) => {
  try {
    if (users.length >= 2) {
      console.log(' Otomatik mesajlaşma sistemi başlatılıyor...');
      await autoMessagingSystem.startAutoMessaging(users);
      console.log(' Otomatik mesajlaşma sistemi başlatıldı!');
    } else {
      console.log(' Otomatik mesajlaşma için yeterli kullanıcı yok');
    }
  } catch (error) {
    console.error(' Otomatik mesajlaşma başlatılırken hata:', error);
  }
};

const LoadingScreen = () => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.loadingContainer}>
      <Animated.View 
        style={[
          styles.loadingContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <Text style={styles.loadingLogo}>Instagram</Text>
        <ActivityIndicator 
          size="large" 
          color="#3897f0" 
          style={styles.loadingIndicator}
        />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </Animated.View>
    </View>
  );
};

function MainTabs({ posts, toggleLike, addComment, addPost, navigation }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;

          if (route.name === 'Feed') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'DirectMessages') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          if (route.name === 'Camera') {
            return (
              <View
                style={[styles.cameraTab, focused && styles.cameraTabFocused]}
              >
                <Ionicons
                  name="add"
                  size={24}
                  color={focused ? '#fff' : '#000'}
                />
              </View>
            );
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#8e8e8e',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0.5,
          borderTopColor: '#e0e0e0',
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          paddingTop: 5,
          height: Platform.OS === 'ios' ? 80 : 60,
        },
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen name="Feed">
        {() => (
          <FeedScreen
            posts={posts}
            toggleLike={toggleLike}
            addComment={addComment}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen 
        name="Camera" 
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('PostScreen');
          },
        }}
      >
        {() => null}
      </Tab.Screen>
      <Tab.Screen name="DirectMessages" component={DirectMessagesScreen} />
     
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AppNavigator({ posts, toggleLike, addComment, addPost }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' },
        animationEnabled: true,
      }}
    >
      <Stack.Screen name="Main">
        {({ navigation }) => (
          <MainTabs
            posts={posts}
            toggleLike={toggleLike}
            addComment={addComment}
            addPost={addPost}
            navigation={navigation}
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="PostScreen" 
        options={{
          presentation: 'modal',
          cardStyle: { backgroundColor: '#fff' },
        }}
      >
        {({ navigation }) => (
          <PostScreen
            navigation={navigation}
            onAddPost={addPost}
          />
        )}
      </Stack.Screen>

      
      <Stack.Screen 
        name="NewMessage" 
        component={NewMessageScreen}
        options={{
          cardStyleInterpolator: ({ current, next, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      />
      
    
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfile}
        options={{
          cardStyleInterpolator: ({ current, next, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      />
      

      <Stack.Screen 
        name="HashtagPosts" 
        options={{
          cardStyleInterpolator: ({ current, next, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        {({ route, navigation }) => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
              #{route.params?.hashtag} Gönderileri
            </Text>
            <Text style={{ color: '#8e8e93', marginBottom: 20 }}>
              Bu özellik yakında gelecek!
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: '#3897f0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 }}
              onPress={() => navigation.goBack()}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>Geri Dön</Text>
            </TouchableOpacity>
          </View>
        )}
      </Stack.Screen>
      
    
      <Stack.Screen 
        name="FollowersList" 
        options={{
          cardStyleInterpolator: ({ current, next, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        {({ route, navigation }) => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
              {route.params?.type === 'followers' ? 'Takipçiler' : 'Takip Edilenler'}
            </Text>
            <Text style={{ color: '#8e8e93', marginBottom: 20 }}>
              @{route.params?.username}
            </Text>
            <Text style={{ color: '#8e8e93', marginBottom: 20 }}>
              Bu özellik yakında gelecek!
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: '#3897f0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 }}
              onPress={() => navigation.goBack()}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>Geri Dön</Text>
            </TouchableOpacity>
          </View>
        )}
      </Stack.Screen>
      
 
      <Stack.Screen 
        name="PostDetail" 
        options={{
          cardStyleInterpolator: ({ current, next, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        {({ route, navigation }) => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
              Gönderi Detayı
            </Text>
            <Text style={{ color: '#8e8e93', marginBottom: 20 }}>
              Bu özellik yakında gelecek!
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: '#3897f0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 }}
              onPress={() => navigation.goBack()}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>Geri Dön</Text>
            </TouchableOpacity>
          </View>
        )}
      </Stack.Screen>
      
      <Stack.Screen 
        name="Chat"
        options={{
          cardStyleInterpolator: ({ current, next, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
        component={ChatScreen} 
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [posts, setPosts] = useState(initialPosts);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [autoMessagingActive, setAutoMessagingActive] = useState(false);

  const toggleLike = (postId) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const addComment = (postId, comment) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [...post.comments, comment],
            }
          : post
      )
    );
  };

  const addPost = (newPost) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
        if (autoMessagingActive) {
          autoMessagingSystem.stopAutoMessaging();
          setAutoMessagingActive(false);
          console.log(' Kullanıcı çıkış yaptı, otomatik mesajlaşma durduruldu');
        }
      }
      
      if (initializing) {
        setInitializing(false);
        setTimeout(() => {
          setLoading(false);
        }, 1500);
      } else {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [initializing, autoMessagingActive]);

  useEffect(() => {
    const initializeFirebaseAndMessaging = async () => {
      if (!user) return;

      try {
        const { success, users: existingUsers } = await testFirebaseConnection();
        
        if (success) {
          const testUsers = await addTestUsers();
          
          
          const { users: finalUsers } = await testFirebaseConnection();
          
          if (!autoMessagingActive && finalUsers.length >= 2) {
            await initializeAutoMessaging(finalUsers);
            setAutoMessagingActive(true);
          }
        }
      } catch (error) {
        console.error(' Firebase ve mesajlaşma sistemi başlatılırken hata:', error);
      }
    };

    initializeFirebaseAndMessaging();
  }, [user, autoMessagingActive]);


  useEffect(() => {
    return () => {
      if (autoMessagingActive) {
        autoMessagingSystem.stopAutoMessaging();
        console.log(' App kapanıyor, otomatik mesajlaşma temizleniyor');
      }
    };
  }, [autoMessagingActive]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: '#fff' },
          animationEnabled: true,
          animationTypeForReplace: user ? 'push' : 'pop',
        }}
      >
        {user ? (
          <Stack.Screen name="AppNavigator">
            {() => (
              <AppNavigator
                posts={posts}
                toggleLike={toggleLike}
                addComment={addComment}
                addPost={addPost}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingLogo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 30,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
  },
  loadingIndicator: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  cameraTab: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  cameraTabFocused: {
    backgroundColor: '#000',
  },
});