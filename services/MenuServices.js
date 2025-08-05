
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Alert } from 'react-native';

class MenuServices {
  async getUserSettings() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return null;
      
      const userSettingsRef = doc(db, 'userSettings', currentUser.uid);
      const settingsSnapshot = await getDocs(collection(userSettingsRef, 'settings'));
      
      const settings = {};
      settingsSnapshot.forEach(doc => {
        settings[doc.id] = doc.data();
      });
      
      return settings;
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error);
      return null;
    }
  }

  async updateUserSetting(settingKey, settingValue) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;
      
      const settingRef = doc(db, 'userSettings', currentUser.uid, 'settings', settingKey);
      await setDoc(settingRef, {
        value: settingValue,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log(`Ayar güncellendi: ${settingKey}`);
      return true;
    } catch (error) {
      console.error('Ayar güncellenirken hata:', error);
      return false;
    }
  }

 
  async getArchivedPosts() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];
      
      const archiveRef = collection(db, 'archivedPosts');
      const q = query(
        archiveRef, 
        where('userId', '==', currentUser.uid),
        orderBy('archivedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const archivedPosts = [];
      
      snapshot.forEach(doc => {
        archivedPosts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return archivedPosts;
    } catch (error) {
      console.error('Arşivlenmiş gönderiler yüklenirken hata:', error);
      return [];
    }
  }

  async archivePost(postId) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;
      
    
      const archiveRef = doc(db, 'archivedPosts', postId);
      await setDoc(archiveRef, {
        userId: currentUser.uid,
        postId: postId,
        archivedAt: serverTimestamp()
      });
      
  
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        isArchived: true,
        archivedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Gönderi arşivlenirken hata:', error);
      return false;
    }
  }

  async unarchivePost(postId) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;
      
    
      const archiveRef = doc(db, 'archivedPosts', postId);
      await deleteDoc(archiveRef);
      

      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        isArchived: false,
        archivedAt: null
      });
      
      return true;
    } catch (error) {
      console.error('Gönderi arşivden çıkarılırken hata:', error);
      return false;
    }
  }

 
  async getUserActivities() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];
      
      const activitiesRef = collection(db, 'userActivities');
      const q = query(
        activitiesRef,
        where('targetUserId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const activities = [];
      
      snapshot.forEach(doc => {
        activities.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return activities;
    } catch (error) {
      console.error('Aktiviteler yüklenirken hata:', error);
      return [];
    }
  }

  async markActivityAsRead(activityId) {
    try {
      const activityRef = doc(db, 'userActivities', activityId);
      await updateDoc(activityRef, {
        isRead: true,
        readAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Aktivite okundu olarak işaretlenirken hata:', error);
      return false;
    }
  }

  
  async getSavedPosts() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];
      
      const savedRef = collection(db, 'savedPosts');
      const q = query(
        savedRef,
        where('userId', '==', currentUser.uid),
        orderBy('savedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const savedPosts = [];
      
      snapshot.forEach(doc => {
        savedPosts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return savedPosts;
    } catch (error) {
      console.error('Kayıtlı gönderiler yüklenirken hata:', error);
      return [];
    }
  }

  async savePost(postId) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;
      
      const savedRef = doc(db, 'savedPosts', `${currentUser.uid}_${postId}`);
      await setDoc(savedRef, {
        userId: currentUser.uid,
        postId: postId,
        savedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Gönderi kaydedilirken hata:', error);
      return false;
    }
  }

  async unsavePost(postId) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;
      
      const savedRef = doc(db, 'savedPosts', `${currentUser.uid}_${postId}`);
      await deleteDoc(savedRef);
      
      return true;
    } catch (error) {
      console.error('Gönderi kaydedilenlerden çıkarılırken hata:', error);
      return false;
    }
  }

 
  async getCloseFriends() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];
      
      const closeFriendsRef = collection(db, 'closeFriends');
      const q = query(
        closeFriendsRef,
        where('userId', '==', currentUser.uid)
      );
      
      const snapshot = await getDocs(q);
      const closeFriends = [];
      
      snapshot.forEach(doc => {
        closeFriends.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return closeFriends;
    } catch (error) {
      console.error('Yakın arkadaşlar yüklenirken hata:', error);
      return [];
    }
  }

  async addCloseFriend(friendUserId) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;
      
      const closeFriendRef = doc(db, 'closeFriends', `${currentUser.uid}_${friendUserId}`);
      await setDoc(closeFriendRef, {
        userId: currentUser.uid,
        friendUserId: friendUserId,
        addedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Yakın arkadaş eklenirken hata:', error);
      return false;
    }
  }

  async removeCloseFriend(friendUserId) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;
      
      const closeFriendRef = doc(db, 'closeFriends', `${currentUser.uid}_${friendUserId}`);
      await deleteDoc(closeFriendRef);
      
      return true;
    } catch (error) {
      console.error('Yakın arkadaş çıkarılırken hata:', error);
      return false;
    }
  }


  async getUserInsights() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return null;
      
      const insightsRef = doc(db, 'userInsights', currentUser.uid);
      const insightsDoc = await getDocs(collection(insightsRef, 'insights'));
      
      const insights = {};
      insightsDoc.forEach(doc => {
        insights[doc.id] = doc.data();
      });
      
      return insights;
    } catch (error) {
      console.error('İçgörüler yüklenirken hata:', error);
      return null;
    }
  }

  async updateInsights(insightData) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;
      
      const insightRef = doc(db, 'userInsights', currentUser.uid, 'insights', 'profile');
      await setDoc(insightRef, {
        ...insightData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error('İçgörüler güncellenirken hata:', error);
      return false;
    }
  }

  
  async generateQRCode() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return null;
      
      const qrData = {
        userId: currentUser.uid,
        username: currentUser.displayName || currentUser.email?.split('@')[0],
        profileUrl: `https://instagram.com/${currentUser.displayName || currentUser.email?.split('@')[0]}`,
        generatedAt: serverTimestamp()
      };
      
      const qrRef = doc(db, 'userQRCodes', currentUser.uid);
      await setDoc(qrRef, qrData);
      
      return qrData;
    } catch (error) {
      console.error('QR kod oluşturulurken hata:', error);
      return null;
    }
  }


  subscribeToActivities(callback) {
    const currentUser = auth.currentUser;
    if (!currentUser) return () => {};
    
    const activitiesRef = collection(db, 'userActivities');
    const q = query(
      activitiesRef,
      where('targetUserId', '==', currentUser.uid),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const unreadActivities = [];
      querySnapshot.forEach(doc => {
        unreadActivities.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(unreadActivities);
    });
  }

  subscribeToSettings(callback) {
    const currentUser = auth.currentUser;
    if (!currentUser) return () => {};
    
    const settingsRef = collection(db, 'userSettings', currentUser.uid, 'settings');
    
    return onSnapshot(settingsRef, (querySnapshot) => {
      const settings = {};
      querySnapshot.forEach(doc => {
        settings[doc.id] = doc.data();
      });
      callback(settings);
    });
  }
}

export default new MenuServices();


export const enhancedHandleMenuItemPress = async (itemId, navigation, setLoading) => {
  setLoading(true);
  
  try {
    switch (itemId) {
      case 'settings':
        const settings = await MenuServices.getUserSettings();
        navigation.navigate('Settings', { settings });
        break;
        
      case 'archive':
        const archivedPosts = await MenuServices.getArchivedPosts();
        navigation.navigate('Archive', { archivedPosts });
        break;
        
      case 'activity':
        const activities = await MenuServices.getUserActivities();
        navigation.navigate('Activity', { activities });
        break;
        
      case 'saved':
        const savedPosts = await MenuServices.getSavedPosts();
        navigation.navigate('SavedPosts', { savedPosts });
        break;
        
      case 'close_friends':
        const closeFriends = await MenuServices.getCloseFriends();
        navigation.navigate('CloseFriends', { closeFriends });
        break;
        
      case 'insights':
        const insights = await MenuServices.getUserInsights();
        navigation.navigate('Insights', { insights });
        break;
        
      case 'qr_code':
        const qrData = await MenuServices.generateQRCode();
        navigation.navigate('QRCode', { qrData });
        break;
        
      default:
        Alert.alert('Bilgi', 'Bu özellik henüz mevcut değil');
        break;
    }
  } catch (error) {
    console.error('Menü işlemi sırasında hata:', error);
    Alert.alert('Hata', 'İşlem gerçekleştirilemedi. Lütfen tekrar deneyin.');
  } finally {
    setLoading(false);
  }
};


export const useMenuIntegration = () => {
  const [menuLoading, setMenuLoading] = useState(false);
  const [unreadActivities, setUnreadActivities] = useState([]);
  const [userSettings, setUserSettings] = useState({});
  
  useEffect(() => {
 
    const unsubscribeActivities = MenuServices.subscribeToActivities(setUnreadActivities);
    

    const unsubscribeSettings = MenuServices.subscribeToSettings(setUserSettings);
    
    return () => {
      unsubscribeActivities();
      unsubscribeSettings();
    };
  }, []);
  
  return {
    menuLoading,
    setMenuLoading,
    unreadActivities,
    userSettings,
    handleMenuPress: (itemId, navigation) => 
      enhancedHandleMenuItemPress(itemId, navigation, setMenuLoading)
  };
};