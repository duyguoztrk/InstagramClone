import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { 
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const { width } = Dimensions.get('window');
const imageSize = width / 3 - 2;

const UserProfile = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, username, fromSearch } = route.params;

  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowProcessing, setIsFollowProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('posts'); 

  useEffect(() => {
    fetchUserData();
    fetchCurrentUser();
  }, [userId]);

  useEffect(() => {
    if (user) {
      fetchUserPosts();
      checkIfFollowing();
    }
  }, [user]);

  const fetchCurrentUser = async () => {
    if (auth.currentUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setCurrentUser({ id: auth.currentUser.uid, ...userDoc.data() });
        }
      } catch (error) {
        console.error('Mevcut kullanıcı bilgileri alınamadı:', error);
      }
    }
  };

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({ id: userId, ...userData });
      } else {
        Alert.alert('Hata', 'Kullanıcı bulunamadı.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Kullanıcı bilgileri alınamadı:', error);
      Alert.alert('Hata', 'Kullanıcı bilgileri yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setIsPostsLoading(true);
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const posts = [];
      
      querySnapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() });
      });
      
      setUserPosts(posts);
    } catch (error) {
      console.error('Gönderiler alınamadı:', error);
    } finally {
      setIsPostsLoading(false);
    }
  };

  const checkIfFollowing = () => {
    if (currentUser && currentUser.following) {
      setIsFollowing(currentUser.following.includes(userId));
    }
  };

  const toggleFollow = async () => {
    if (!auth.currentUser) {
      Alert.alert('Hata', 'Önce giriş yapmanız gerekiyor.');
      return;
    }

    if (isFollowProcessing) return;

    setIsFollowProcessing(true);

    try {
      const currentUserId = auth.currentUser.uid;

      if (isFollowing) {
        await Promise.all([
          updateDoc(doc(db, 'users', currentUserId), {
            following: arrayRemove(userId),
            followingCount: increment(-1)
          }),
          updateDoc(doc(db, 'users', userId), {
            followers: arrayRemove(currentUserId),
            followersCount: increment(-1)
          })
        ]);

        setIsFollowing(false);
        setUser(prev => ({ 
          ...prev, 
          followersCount: (prev.followersCount || 0) - 1 
        }));

      } else {
        await Promise.all([
          updateDoc(doc(db, 'users', currentUserId), {
            following: arrayUnion(userId),
            followingCount: increment(1)
          }),
          updateDoc(doc(db, 'users', userId), {
            followers: arrayUnion(currentUserId),
            followersCount: increment(1)
          })
        ]);

        setIsFollowing(true);
        setUser(prev => ({ 
          ...prev, 
          followersCount: (prev.followersCount || 0) + 1 
        }));
      }

    } catch (error) {
      console.error('Takip işlemi hatası:', error);
      Alert.alert('Hata', 'Takip işlemi gerçekleştirilemedi.');
    } finally {
      setIsFollowProcessing(false);
    }
  };

  const navigateToPost = (postId, postData) => {
    navigation.navigate('PostDetail', { 
      postId, 
      postData,
      fromProfile: true 
    });
  };

  const navigateToFollowers = () => {
    navigation.navigate('FollowersList', { 
      userId, 
      username: user.username,
      type: 'followers' 
    });
  };

  const navigateToFollowing = () => {
    navigation.navigate('FollowersList', { 
      userId, 
      username: user.username,
      type: 'following' 
    });
  };

  const renderPost = ({ item, index }) => (
    <TouchableOpacity 
      style={[styles.postItem, { marginRight: index % 3 !== 2 ? 2 : 0 }]}
      onPress={() => navigateToPost(item.id, item)}
    >
      <Image 
        source={{ uri: item.imageUrl }} 
        style={styles.postImage} 
        resizeMode="cover"
      />
      {item.isVideo && (
        <View style={styles.videoOverlay}>
          <Ionicons name="play" size={20} color="white" />
        </View>
      )}
      {item.isMultiple && (
        <View style={styles.multipleOverlay}>
          <Ionicons name="copy-outline" size={18} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image
            source={
              user?.profilePicture
                ? { uri: user.profilePicture }
                : require('../assets/posts/duygu.jpg')
            }
            style={styles.avatar}
          />
          {user?.isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{userPosts.length}</Text>
            <Text style={styles.statLabel}>gönderi</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statItem} onPress={navigateToFollowers}>
            <Text style={styles.statNumber}>{user?.followersCount || 0}</Text>
            <Text style={styles.statLabel}>takipçi</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statItem} onPress={navigateToFollowing}>
            <Text style={styles.statNumber}>{user?.followingCount || 0}</Text>
            <Text style={styles.statLabel}>takip</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>
            {user?.displayName || user?.username || 'Kullanıcı'}
          </Text>
          {user?.verified && (
            <Ionicons name="checkmark-circle" size={16} color="#3897f0" style={{ marginLeft: 4 }} />
          )}
        </View>
        
        {user?.bio && (
          <Text style={styles.bio}>{user.bio}</Text>
        )}
        
        {user?.website && (
          <TouchableOpacity>
            <Text style={styles.website}>{user.website}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actionSection}>
        {auth.currentUser?.uid === userId ? (
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editProfileText}>Profili Düzenle</Text>
          </TouchableOpacity>
        ) : (
          
          <View style={styles.profileActions}>
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing ? styles.followingButton : styles.followButton
              ]}
              onPress={toggleFollow}
              disabled={isFollowProcessing}
            >
              {isFollowProcessing ? (
                <ActivityIndicator size="small" color={isFollowing ? "#262626" : "white"} />
              ) : (
                <Text style={[
                  styles.followButtonText,
                  isFollowing ? styles.followingButtonText : styles.followButtonText
                ]}>
                  {isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.messageButton}>
              <Text style={styles.messageButtonText}>Mesaj</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="person-add-outline" size={18} color="#262626" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {user?.highlights && user.highlights.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.highlightsContainer}
        >
          {user.highlights.map((highlight, index) => (
            <TouchableOpacity key={index} style={styles.highlightItem}>
              <View style={styles.highlightCircle}>
                <Image source={{ uri: highlight.coverImage }} style={styles.highlightImage} />
              </View>
              <Text style={styles.highlightName} numberOfLines={1}>
                {highlight.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}


      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Ionicons 
            name="grid-outline" 
            size={24} 
            color={activeTab === 'posts' ? '#262626' : '#8e8e93'} 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'tagged' && styles.activeTab]}
          onPress={() => setActiveTab('tagged')}
        >
          <Ionicons 
            name="person-outline" 
            size={24} 
            color={activeTab === 'tagged' ? '#262626' : '#8e8e93'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#262626" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{username}</Text>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={24} color="#262626" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3897f0" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navigationHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#262626" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user?.username}</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#262626" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'posts' ? userPosts : []}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {isPostsLoading ? (
              <ActivityIndicator size="large" color="#3897f0" />
            ) : (
              <>
                <View style={styles.emptyIconContainer}>
                  <Ionicons 
                    name={activeTab === 'posts' ? "camera-outline" : "person-outline"} 
                    size={64} 
                    color="#8e8e93" 
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {activeTab === 'posts' ? 'Henüz gönderi yok' : 'Etiketlendiği gönderi yok'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === 'posts' 
                    ? 'Fotoğraf ve videolar paylaştığında burada görünecek.'
                    : 'Fotoğraflarda etiketlendiğinde burada görünecek.'
                  }
                </Text>
              </>
            )}
          </View>
        )}
        contentContainerStyle={userPosts.length === 0 ? { flex: 1 } : null}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dbdbdb',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
  },
  moreButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 15,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f0f0f0',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#262626',
  },
  statLabel: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 2,
  },
  infoSection: {
    marginBottom: 15,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  bio: {
    fontSize: 14,
    color: '#262626',
    lineHeight: 18,
    marginBottom: 5,
  },
  website: {
    fontSize: 14,
    color: '#3897f0',
  },
  actionSection: {
    marginBottom: 20,
  },
  editProfileButton: {
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#262626',
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followButton: {
    flex: 1,
    backgroundColor: '#3897f0',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#dbdbdb',
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#262626',
  },
  messageButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  messageButtonText: {
    color: '#262626',
    fontSize: 14,
    fontWeight: '600',
  },
  highlightsContainer: {
    marginBottom: 20,
  },
  highlightItem: {
    alignItems: 'center',
    marginRight: 15,
  },
  highlightCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#dbdbdb',
    padding: 2,
    marginBottom: 5,
  },
  highlightImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  highlightName: {
    fontSize: 12,
    color: '#262626',
    width: 64,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#dbdbdb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#262626',
  },
  postItem: {
    width: imageSize,
    height: imageSize,
    marginBottom: 2,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  videoOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  multipleOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#8e8e93',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#262626',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 40,
  },
});

export default UserProfile;