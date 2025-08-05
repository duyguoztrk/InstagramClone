import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { 
  collection, 
  query as firebaseQuery, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  doc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const popularHashtags = [
  '#istanbul', '#ankara', '#izmir', '#doğa', '#yemek', '#seyahat', 
  '#fotograf', '#sanat', '#müzik', '#spor', '#teknoloji', '#moda'
];

const trendingPosts = [
  { id: 't1', username: 'ayse', image: require('../assets/posts/ayse.jpg'), likes: 142 },
  { id: 't2', username: 'selin', image: require('../assets/posts/duygu.jpg'), likes: 89 },
  { id: 't3', username: 'burak', image: require('../assets/posts/ayse.jpg'), likes: 234 },
  { id: 't4', username: 'cemre', image: require('../assets/posts/duygu.jpg'), likes: 167 },
  { id: 't5', username: 'ali', image: require('../assets/posts/ayse.jpg'), likes: 91 },
  { id: 't6', username: 'ceren', image: require('../assets/posts/duygu.jpg'), likes: 203 },
  { id: 't7', username: 'zeynep', image: require('../assets/posts/ayse.jpg'), likes: 156 },
  { id: 't8', username: 'mirac', image: require('../assets/posts/duygu.jpg'), likes: 78 },
  { id: 't9', username: 'damla', image: require('../assets/posts/ayse.jpg'), likes: 189 },
];

const SearchScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredHashtags, setFilteredHashtags] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const [followingInProgress, setFollowingInProgress] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({ id: auth.currentUser.uid, ...userData });
            if (userData.following) {
              setFollowingUsers(new Set(userData.following));
            }
          }
        } catch (error) {
          console.error('Kullanıcı bilgileri alınamadı:', error);
        }
      }
    };

    fetchCurrentUser();
  }, []);

  const searchUsers = async (searchText) => {
    if (searchText.trim().length < 2) {
      setFilteredUsers([]);
      return;
    }

    setIsSearching(true);
    
    try {
      const usersRef = collection(db, 'users');
      
      const usernameQuery = firebaseQuery(
        usersRef,
        where('username', '>=', searchText.toLowerCase()),
        where('username', '<=', searchText.toLowerCase() + '\uf8ff'),
        orderBy('username'),
        limit(15)
      );

      const displayNameQuery = firebaseQuery(
        usersRef,
        where('displayName', '>=', searchText),
        where('displayName', '<=', searchText + '\uf8ff'),
        orderBy('displayName'),
        limit(15)
      );

      const [usernameSnapshot, displayNameSnapshot] = await Promise.all([
        getDocs(usernameQuery),
        getDocs(displayNameQuery)
      ]);

      const foundUsers = new Map();

      usernameSnapshot.forEach((doc) => {
        if (doc.id !== auth.currentUser?.uid) { 
          const userData = { id: doc.id, ...doc.data() };
          foundUsers.set(doc.id, userData);
        }
      });

      displayNameSnapshot.forEach((doc) => {
        if (doc.id !== auth.currentUser?.uid) { 
          const userData = { id: doc.id, ...doc.data() };
          foundUsers.set(doc.id, userData);
        }
      });

      const usersArray = Array.from(foundUsers.values())
        .sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0)); 
      
      setFilteredUsers(usersArray);
    } catch (error) {
      console.error('Kullanıcı arama hatası:', error);
      setFilteredUsers([]);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleFollow = async (targetUserId, targetUsername) => {
    if (!auth.currentUser) {
      Alert.alert('Hata', 'Önce giriş yapmanız gerekiyor.');
      return;
    }

    if (followingInProgress.has(targetUserId)) {
      return; 
    }

    setFollowingInProgress(prev => new Set(prev).add(targetUserId));

    try {
      const currentUserId = auth.currentUser.uid;
      const isFollowing = followingUsers.has(targetUserId);

      if (isFollowing) {
        await Promise.all([
          
          updateDoc(doc(db, 'users', currentUserId), {
            following: arrayRemove(targetUserId),
            followingCount: increment(-1)
          }),
          
          updateDoc(doc(db, 'users', targetUserId), {
            followers: arrayRemove(currentUserId),
            followersCount: increment(-1)
          })
        ]);

        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(targetUserId);
          return newSet;
        });

        
        setFilteredUsers(prev => prev.map(user => 
          user.id === targetUserId 
            ? { ...user, followersCount: (user.followersCount || 0) - 1 }
            : user
        ));

      } else {
        
        await Promise.all([
         
          updateDoc(doc(db, 'users', currentUserId), {
            following: arrayUnion(targetUserId),
            followingCount: increment(1)
          }),
         
          updateDoc(doc(db, 'users', targetUserId), {
            followers: arrayUnion(currentUserId),
            followersCount: increment(1)
          })
        ]);

        setFollowingUsers(prev => new Set(prev).add(targetUserId));

        
        setFilteredUsers(prev => prev.map(user => 
          user.id === targetUserId 
            ? { ...user, followersCount: (user.followersCount || 0) + 1 }
            : user
        ));
      }

    } catch (error) {
      console.error('Takip işlemi hatası:', error);
      Alert.alert('Hata', 'Takip işlemi gerçekleştirilemedi. Tekrar deneyin.');
    } finally {
      setFollowingInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUserId);
        return newSet;
      });
    }
  };

 
  const handleSearch = (query) => {
    setSearchQuery(query);
    
   
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.trim() === '') {
      setFilteredUsers([]);
      setFilteredHashtags([]);
      return;
    }

   
    const hashtags = popularHashtags.filter(tag =>
      tag.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredHashtags(hashtags);

    
    const timeout = setTimeout(() => {
      searchUsers(query);
    }, 300);

    setSearchTimeout(timeout);
  };

 
  const navigateToProfile = (userId, username) => {
    if (!userId || !username) {
      Alert.alert('Hata', 'Kullanıcı bilgileri eksik.');
      return;
    }

    try {
      navigation.navigate('UserProfile', { 
        userId: userId,
        username: username,
      
        fromSearch: true
      });
    } catch (error) {
      console.error('Profil navigasyon hatası:', error);
      Alert.alert('Hata', 'Profil sayfasına gidilemedi.');
    }
  };


  const navigateToHashtag = (hashtag) => {
    try {
      navigation.navigate('HashtagPosts', { 
        hashtag: hashtag.replace('#', '') 
      });
    } catch (error) {
      console.error('Hashtag navigasyon hatası:', error);
    }
  };

  
  const renderUser = ({ item }) => {
    const isFollowing = followingUsers.has(item.id);
    const isProcessing = followingInProgress.has(item.id);

    return (
      <TouchableOpacity 
        style={styles.userItem}
        onPress={() => navigateToProfile(item.id, item.username)}
        activeOpacity={0.7}
      >
        <Image 
          source={
            item.profilePicture 
              ? { uri: item.profilePicture } 
              : require('../assets/posts/duygu.jpg')
          } 
          style={styles.userAvatar} 
        />
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.username} numberOfLines={1}>{item.username}</Text>
            {item.verified && (
              <Ionicons name="checkmark-circle" size={16} color="#3897f0" />
            )}
          </View>
          <Text style={styles.fullName} numberOfLines={1}>
            {item.displayName || item.email || 'Kullanıcı'}
          </Text>
          <Text style={styles.followerCount}>
            {item.followersCount || 0} takipçi
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.followButton,
            isFollowing ? styles.followingButton : styles.followButton,
            isProcessing && styles.processingButton
          ]}
          onPress={(e) => {
            e.stopPropagation(); 
            toggleFollow(item.id, item.username);
          }}
          disabled={isProcessing}
        >
          {isProcessing ? (
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
      </TouchableOpacity>
    );
  };

  const renderHashtag = ({ item }) => (
    <TouchableOpacity 
      style={styles.hashtagItem}
      onPress={() => navigateToHashtag(item)}
    >
      <View style={styles.hashtagIcon}>
        <Text style={styles.hashtagSymbol}>#</Text>
      </View>
      <View style={styles.hashtagInfo}>
        <Text style={styles.hashtagText}>{item}</Text>
        <Text style={styles.hashtagCount}>
          {Math.floor(Math.random() * 1000) + 100}K gönderi
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderTrendingPost = ({ item }) => (
    <TouchableOpacity 
      style={styles.trendingPost}
      activeOpacity={0.9}
      onPress={() => setSelectedPost(item)}
    >
      <Image source={item.image} style={styles.trendingImage} />
      <View style={styles.trendingOverlay}>
        <Ionicons name="heart" size={12} color="#fff" style={{ marginRight: 4 }} />
        <Text style={styles.trendingLikes}>{item.likes}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderExploreContent = () => (
    <ScrollView style={styles.exploreContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Popüler Hashtagler</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.hashtagScrollContainer}>
          {popularHashtags.slice(0, 6).map((tag, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.popularHashtagItem}
              onPress={() => navigateToHashtag(tag)}
            >
              <Text style={styles.popularHashtagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <FlatList
        data={trendingPosts}
        numColumns={3}
        keyExtractor={(item) => item.id}
        renderItem={renderTrendingPost}
        scrollEnabled={false}
        style={styles.trendingGrid}
        contentContainerStyle={{ marginHorizontal: -0.5 }}
        showsVerticalScrollIndicator={false}
      />
    </ScrollView>
  );

  const renderSearchResults = () => {
    if (searchQuery.trim() === '') {
      return renderExploreContent();
    }

    return (
      <ScrollView style={styles.searchResults} showsVerticalScrollIndicator={false}>
        {isSearching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3897f0" />
            <Text style={styles.loadingText}>Aranıyor...</Text>
          </View>
        )}

        {!isSearching && filteredUsers.length > 0 && (
          <>
            <Text style={styles.resultSectionTitle}>Kullanıcılar</Text>
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              renderItem={renderUser}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
        
        {filteredHashtags.length > 0 && (
          <>
            <Text style={styles.resultSectionTitle}>Hashtagler</Text>
            <FlatList
              data={filteredHashtags}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderHashtag}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}

        {!isSearching && 
         filteredUsers.length === 0 && 
         filteredHashtags.length === 0 && 
         searchQuery.trim() !== '' && (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={64} color="#8e8e93" />
            <Text style={styles.noResultsText}>Sonuç bulunamadı</Text>
            <Text style={styles.noResultsSubtext}>
              "{searchQuery}" için sonuç bulunamadı. Farklı anahtar kelimeler deneyin.
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };


  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <SafeAreaView style={styles.container} edges={['top']} >
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#8e8e93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Kullanıcı, hashtag ara..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#8e8e93"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setFilteredUsers([]);
                setFilteredHashtags([]);
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#8e8e93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderSearchResults()}

      {/* Gönderi Detay Modalı */}
      <Modal
        visible={selectedPost !== null}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setSelectedPost(null)}
        statusBarStyle="dark-content"
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedPost(null)}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Gönderi</Text>
            <View style={{ width: 24 }} />
          </View>
          {selectedPost && (
            <ScrollView>
              <View style={styles.modalUserInfo}>
                <Image source={selectedPost.image} style={styles.modalUserAvatar} />
                <Text style={styles.modalUsername}>{selectedPost.username}</Text>
              </View>
              <Image source={selectedPost.image} style={styles.modalImage} />
              <View style={styles.modalActions}>
                <View style={styles.modalActionButtons}>
                  <TouchableOpacity style={styles.modalActionButton}>
                    <Ionicons name="heart-outline" size={28} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalActionButton}>
                    <Ionicons name="chatbubble-outline" size={26} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalActionButton}>
                    <Ionicons name="paper-plane-outline" size={26} color="#000" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity>
                  <Ionicons name="bookmark-outline" size={26} color="#000" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalLikes}>{selectedPost.likes} beğenme</Text>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dbdbdb',
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#8e8e93',
  },
  exploreContainer: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
  },
  hashtagScrollContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  popularHashtagItem: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
  },
  popularHashtagText: {
    fontSize: 14,
    color: '#262626',
  },
  trendingGrid: {
    flex: 1,
    backgroundColor: '#fff',
  },
  trendingPost: {
    width: '33.333333%',
    aspectRatio: 1,
    padding: 0.5,
  },
  trendingImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  trendingOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendingLikes: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  searchResults: {
    flex: 1,
  },
  resultSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f8f8f8',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
    marginRight: 10,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    marginRight: 4,
    flex: 1,
  },
  fullName: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 2,
  },
  followerCount: {
    fontSize: 12,
    color: '#8e8e93',
  },
  followButton: {
    backgroundColor: '#3897f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#dbdbdb',
  },
  processingButton: {
    opacity: 0.7,
  },
  followButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#262626',
  },
  hashtagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  hashtagIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hashtagSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#262626',
  },
  hashtagInfo: {
    flex: 1,
  },
  hashtagText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#262626',
    marginBottom: 2,
  },
  hashtagCount: {
    fontSize: 12,
    color: '#8e8e93',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#262626',
    textAlign: 'center',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#dbdbdb',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  modalUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  modalUsername: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalActionButton: {
    marginRight: 16,
  },
  modalLikes: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});

export default SearchScreen;