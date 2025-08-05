
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../config/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const uploadToCloudinary = async (imageUri) => {
  const data = new FormData();
  data.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  });
  data.append('upload_preset', 'insta-clone-upload'); 
  try {
    const res = await fetch('https://api.cloudinary.com/v1_1/dnjb7z1a0/image/upload', {
      method: 'POST',
      body: data,
    });

    const result = await res.json();
    if (result.secure_url) {
      return result.secure_url;
    } else {
      console.error('Cloudinary response error:', result);
      return null;
    }
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return null;
  }
};

const PostScreen = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const camera = await ImagePicker.requestCameraPermissionsAsync();
    const media = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (camera.status !== 'granted' || media.status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera ve galeri erişimi izni vermelisiniz.');
    }
  };

  const pickImage = async (source) => {
    try {
      setLoading(true);
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true })
          : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Hata', 'Fotoğraf seçilemedi.');
    } finally {
      setLoading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert('Fotoğraf Seç', 'Bir yöntem seçin', [
      { text: 'Kamera', onPress: () => pickImage('camera') },
      { text: 'Galeri', onPress: () => pickImage('gallery') },
      { text: 'İptal', style: 'cancel' },
    ]);
  };
const handlePost = async () => {
  if (!auth.currentUser) {
    Alert.alert('Hata', 'Giriş yapmalısınız.');
    return;
  }
  
  if (!selectedImage) {
    return Alert.alert('Hata', 'Fotoğraf seçilmedi.');
  }
  if (!caption.trim()) {
    return Alert.alert('Hata', 'Açıklama boş olamaz.');
  }

  setUploading(true);

  try {
    const imageUrl = await uploadToCloudinary(selectedImage.uri);

    if (!imageUrl) {
      Alert.alert('Hata', 'Fotoğraf yüklenemedi.');
      return;
    }

    await addDoc(collection(db, 'posts'), {
      userId: auth.currentUser.uid, 
      username: auth.currentUser.displayName || 'Kullanıcı',
      imageUrl,
      caption: caption.trim(),
      createdAt: serverTimestamp(),
      likes: [], 
      comments: [], 
    });

    Alert.alert('Başarılı', 'Gönderi paylaşıldı!', [
      {
        text: 'Tamam',
        onPress: () => {
          setCaption('');
          setSelectedImage(null);
         navigation.navigate('Main', { screen: 'Feed' })
        },
      },
    ]);
  } catch (err) {
    console.error('Post error:', err);
    
    if (err.code === 'permission-denied') {
      Alert.alert('Hata', 'Bu işlem için yetkiniz yok.');
    } else if (err.code === 'unauthenticated') {
      Alert.alert('Hata', 'Giriş yapmalısınız.');
    } else {
      Alert.alert('Hata', 'Gönderi kaydedilemedi.');
    }
  } finally {
    setUploading(false);
  }
};
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yeni Gönderi</Text>
          <TouchableOpacity
            onPress={handlePost}
            disabled={!selectedImage || !caption.trim() || uploading}
          >
            {uploading ? <ActivityIndicator /> : <Text style={{
              color: (!selectedImage || !caption.trim()) ? '#ccc' : '#3897f0',
              fontWeight: 'bold'
            }}>Paylaş</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView style={{ padding: 16 }}>
          <TouchableOpacity onPress={showImageOptions}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage.uri }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="camera" size={48} color="#aaa" />
                <Text style={{ marginTop: 8, color: '#aaa' }}>Fotoğraf Seç</Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Açıklama yaz..."
            value={caption}
            onChangeText={setCaption}
            multiline
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  image: {
    width: width - 32,
    height: width - 32,
    borderRadius: 12,
    marginBottom: 16,
  },
  placeholder: {
    width: width - 32,
    height: width - 32,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
});

export default PostScreen;
