import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  updateDoc, 
  doc, 
  increment,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';

class AutoMessagingSystem {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.conversationIntervals = new Map();
    this.messageListeners = new Map();
    this.replyTimeouts = new Map();
    
    this.messageTemplates = [
      // Selamlaşma
      "Merhaba! Nasıl gidiyor? 👋",
      "Selam, ne yapıyorsun?",
      "Hey! Uzun zamandır konuşmamıştık",
      "Merhabalar, nasılsın? 😊",
      
      // Günlük konuşmalar
      "Bugün çok güzel bir hava var 🌤️",
      "Bu akşam planın var mı?",
      "Hafta sonu ne yapacaksın?",
      "İş nasıl gidiyor?",
      "Bugün çok yoruldum 😴",
      
      // Sosyal medya etkileşimleri
      "Bu fotoğrafın çok güzel olmuş 📸",
      "Story'ni gördüm, harika yermiş!",
      "Bu postu çok beğendim 👍",
      "O fotoğraftaki manzara nerede?",
      
      // Sosyal aktiviteler
      "Kahve içmeye çıkıyor musun? ☕",
      "O kafeyi deneyebiliriz",
      "Sinema planı yapalım mı? 🎬",
      "Yürüyüşe çıkalım mı?",
      
      // Yemek ve içecek
      "O restoranda ne yemiştik? 🍽️",
      "Bu tarifi denemen lazım",
      "Çok lezzetli görünüyor! 🤤",
      "Yemek tarifinizi alabilirim?",
      
      // Müzik ve eğlence
      "Bu şarkıyı dinlemen lazım 🎵",
      "O konsere gidecek misin?",
      "Yeni çıkan diziyi izledin mi? 📺",
      "Playlist'ini paylaşır mısın?",
      
      // Genel yorumlar
      "Haklısın! 👍",
      "Kesinlikle katılıyorum",
      "Çok doğru söylüyorsun",
      "Aynen öyle düşünüyorum",
      "Süper fikir! 💡",
      
      // Emoji'li mesajlar
      "Çok tatlı! 🥰",
      "Harika! 🎉",
      "Muhteşem görünüyor ✨",
      "İnanılmaz! 😍",
      "Çok iyi! 💯"
    ];
    
    // Hızlı cevaplar
    this.quickReplies = [
      "Teşekkürler! ",
      "Çok sağol",
      "Aynen! ",
      "Evet bence de",
      "Haklısın",
      "Kesinlikle!",
      "Çok doğru",
      "Ben de öyle düşünüyorum",
      "Tabii ki!",
      "Elbette "
    ];

    // Kullanıcı mesajlarına özel yanıtlar
    this.userResponseTemplates = [
      // Selamlaşma yanıtları
      "Merhaba! Ben de iyiyim, sen nasılsın? ",
      "Selam! İyi gidiyor, teşekkürler ",
      "Hey! Bende seni merak ediyordum",
      "Merhabalar! Çok iyiyim, sen ne yapıyorsun?",
      
      // Genel yanıtlar
      "Çok ilginç! Daha fazla anlat ",
      "Gerçekten mi? Vay be! ",
      "Bu harika haber! ",
      "Anlıyorum, sen nasıl hissediyorsun?",
      "Çok güzel! Tebrikler ",
      
      // Sorular
      "Sen bugün ne yaptın?",
      "Nasıl geçti günün?",
      "Bu konuda ne düşünüyorsun?",
      "Planların neler?",
      "Sen de öyle mi düşünüyorsun?",
      
      // Destek mesajları
      "Yanındayım, merak etme ",
      "Her şey yoluna girecek ",
      "Sen çok güçlüsün!",
      "Bu durumdan çıkarsın mutlaka",
      
      // Eğlenceli yanıtlar
      "Haha çok komik! ",
      "Bu çok eğlenceli görünüyor!",
      "Kesinlikle katılmalıyım buna! ",
      "Süper fikir! Nasıl aklına geldi?",
      
      // Günlük hayat
      "Bu çok güzel bir aktivite ",
      "Ben de aynısını yapmak istiyorum",
      "Çok şanslısın! ",
      "Bu deneyim nasıldı?",
      "Fotoğraflarını görmek isterim "
    ];
    
    // Zaman aralıkları (milisaniye)
    this.intervals = {
      veryFast: { min: 10000, max: 30000 },    // 10-30 saniye
      fast: { min: 20000, max: 60000 },        // 20-60 saniye  
      normal: { min: 45000, max: 120000 },     // 45s-2dk
      slow: { min: 90000, max: 180000 },       // 1.5-3 dakika
      verySlow: { min: 180000, max: 300000 }   // 3-5 dakika
    };

    // Kullanıcı yanıt aralıkları (daha hızlı)
    this.userReplyIntervals = {
      immediate: { min: 3000, max: 8000 },     // 3-8 saniye
      quick: { min: 5000, max: 15000 },        // 5-15 saniye
      normal: { min: 10000, max: 30000 },      // 10-30 saniye
      delayed: { min: 30000, max: 60000 }      // 30s-1dk
    };
  }

  // Rastgele aralık hesaplama
  getRandomInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Başlangıç sistemi
  async startAutoMessaging(users) {
    if (this.isRunning) {
      console.log(' Otomatik mesajlaşma sistemi zaten çalışıyor');
      return;
    }
    
    console.log(' Otomatik mesajlaşma sistemi başlatılıyor...');
    console.log(` Toplam kullanıcı sayısı: ${users.length}`);
    
    this.isRunning = true;

    // İlk konuşmaları oluştur
    await this.createInitialConversations(users);

    // Her konuşma için ayrı mesajlaşma başlat
    await this.startIndividualConversations(users);

    // Kullanıcı mesaj dinleyicilerini başlat
    await this.startUserMessageListeners(users);

    console.log(' Otomatik mesajlaşma sistemi aktif!');
  }

  // Kullanıcı mesajlarını dinleme sistemi
  async startUserMessageListeners(users) {
    try {
      console.log(' Kullanıcı mesaj dinleyicileri başlatılıyor...');
      
      const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
      
      conversationsSnapshot.docs.forEach(conversationDoc => {
        const conversationId = conversationDoc.id;
        const conversationData = conversationDoc.data();
        
        // Konuşma verilerini doğrula
        if (!conversationData || !conversationData.users || !Array.isArray(conversationData.users) || conversationData.users.length < 2) {
          console.warn(` Geçersiz konuşma verisi atlanıyor: ${conversationId}`);
          return;
        }
        
        // Her konuşma için mesaj dinleyici oluştur
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const messagesQuery = query(
          messagesRef, 
          orderBy('timestamp', 'desc'), 
          limit(1)
        );
        
        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          if (!snapshot.empty) {
            const latestMessage = snapshot.docs[0].data();
            const messageId = snapshot.docs[0].id;
            
            // Eğer mesaj bir bot tarafından gönderilmediyse (gerçek kullanıcı mesajı)
            if (!latestMessage.isBot) {
              console.log(` Kullanıcı mesajı tespit edildi: "${latestMessage.text}"`);
              this.handleUserMessage(conversationId, conversationData, latestMessage, users);
            }
          }
        });
        
        this.messageListeners.set(conversationId, unsubscribe);
        console.log(` Konuşma ${conversationId.slice(-6)} için mesaj dinleyici aktif`);
      });
      
    } catch (error) {
      console.error('Kullanıcı mesaj dinleyicileri başlatılırken hata:', error);
    }
  }

  // Kullanıcı mesajını işleme
  async handleUserMessage(conversationId, conversationData, userMessage, users) {
    try {
      // Konuşma verilerini doğrula
      if (!conversationData || !conversationData.users || !Array.isArray(conversationData.users) || conversationData.users.length < 2) {
        console.warn(' Geçersiz konuşma verisi, kullanıcı mesajı işlenemiyor');
        return;
      }

      const [userId1, userId2] = conversationData.users;
      const senderId = userMessage.senderId;
      const receiverId = conversationData.users.find(id => id !== senderId);
      
      if (!receiverId) {
        console.warn(' Alıcı kullanıcı bulunamadı');
        return;
      }
      
      // Eğer mesajı gönderen gerçek bir kullanıcıysa
      const isRealUser = !users.find(u => u.id === senderId); // Test kullanıcılarında değilse gerçek kullanıcı
      
      if (isRealUser || Math.random() < 0.8) { // %80 şansla yanıt ver
        // Önceki yanıt zamanlayıcısını temizle
        if (this.replyTimeouts.has(conversationId)) {
          clearTimeout(this.replyTimeouts.get(conversationId));
        }
        
        // Yanıt için rastgele zaman belirle
        const replyType = this.getRandomReplyType();
        const delay = this.getRandomInterval(
          this.userReplyIntervals[replyType].min,
          this.userReplyIntervals[replyType].max
        );
        
        console.log(`⏰ ${Math.round(delay/1000)}s sonra yanıt gönderilecek (${replyType})`);
        
        // Zamanlayıcı kur
        const timeoutId = setTimeout(async () => {
          await this.sendResponseToUser(conversationId, receiverId, senderId, userMessage.text, users);
          this.replyTimeouts.delete(conversationId);
        }, delay);
        
        this.replyTimeouts.set(conversationId, timeoutId);
      }
      
    } catch (error) {
      console.error(' Kullanıcı mesajı işlenirken hata:', error);
    }
  }

  // Kullanıcıya yanıt gönderme
  async sendResponseToUser(conversationId, senderId, receiverId, originalMessage, users) {
    try {
      const sender = users.find(u => u.id === senderId);
      if (!sender) {
        console.log(' Gönderen kullanıcı bulunamadı');
        return;
      }
      
      // Mesaj tipine göre yanıt seç
      const responseMessage = this.generateResponseMessage(originalMessage);
      
      // Mesajı gönder (bot olarak işaretle)
      await this.sendMessage(conversationId, senderId, receiverId, responseMessage, true);
      
      console.log(` ${sender.username} -> Kullanıcı: "${responseMessage}"`);
      
      // Bazen devam mesajı gönder (%30 şans)
      if (Math.random() < 0.3) {
        setTimeout(async () => {
          const followUpMessage = this.generateFollowUpMessage();
          await this.sendMessage(conversationId, senderId, receiverId, followUpMessage, true);
          console.log(` ${sender.username} -> Kullanıcı (devam): "${followUpMessage}"`);
        }, this.getRandomInterval(5000, 20000));
      }
      
    } catch (error) {
      console.error(' Kullanıcıya yanıt gönderilirken hata:', error);
    }
  }

  generateResponseMessage(originalMessage) {
    const message = originalMessage.toLowerCase();
    
    // Anahtar kelime bazlı yanıtlar
    if (message.includes('merhaba') || message.includes('selam') || message.includes('hey')) {
      const greetings = [
        "Merhaba! Nasılsın? ",
        "Selam! Çok mutluyum seni görmek ",
        "Hey! Ne yapıyorsun?",
        "Merhabalar! İyi misin?"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    if (message.includes('nasılsın') || message.includes('nasıl gidiyor')) {
      const statusReplies = [
        "Çok iyiyim teşekkürler! Sen nasılsın? ",
        "İyi gidiyor, sen ne yapıyorsun?",
        "Harika! Bugün çok güzel geçiyor",
        "Süper! Sen nasılsın bakalım?"
      ];
      return statusReplies[Math.floor(Math.random() * statusReplies.length)];
    }
    
    if (message.includes('ne yapıyorsun') || message.includes('neler yapıyorsun')) {
      const activityReplies = [
        "Biraz dinleniyorum, sen ne yapıyorsun? ",
        "Müzik dinliyorum, sen?",
        "Film izliyordum, tavsiye eder misin?",
        "Kitap okuyorum, sen ne yapıyorsun?"
      ];
      return activityReplies[Math.floor(Math.random() * activityReplies.length)];
    }
    
    if (message.includes('teşekkür') || message.includes('sağol') || message.includes('teşekkürler')) {
      const thanksReplies = [
        "Rica ederim! ",
        "Ne demek, her zaman!",
        "Önemli değil! ",
        "Bu kadar teşekkür etme "
      ];
      return thanksReplies[Math.floor(Math.random() * thanksReplies.length)];
    }
    
    if (message.includes('güzel') || message.includes('harika') || message.includes('süper')) {
      const positiveReplies = [
        "Aynen! Çok güzel ",
        "Bence de harika!",
        "Kesinlikle süper! ",
        "Çok beğendim ben de!"
      ];
      return positiveReplies[Math.floor(Math.random() * positiveReplies.length)];
    }
    
    if (message.includes('?')) { // Soru sorulmuşsa
      const questionReplies = [
        "İlginç soru! Ben de merak ediyorum 🤔",
        "Bu konuda ne düşünüyorsun sen?",
        "Hmm, zor soru! Sen ne dersin?",
        "Çok güzel soru, beraber düşünelim"
      ];
      return questionReplies[Math.floor(Math.random() * questionReplies.length)];
    }
    
    // Varsayılan yanıtlar
    return this.userResponseTemplates[Math.floor(Math.random() * this.userResponseTemplates.length)];
  }

  // Devam mesajı oluşturma
  generateFollowUpMessage() {
    const followUps = [
      "Bu arada sen ne yapıyorsun?",
      "Bugün planların neler?",
      "Nasıl geçiyor günün?",
      "Ne var ne yok anlat bakalım 😊",
      "Sen de iyi misin?",
      "Bu hafta sonu ne yapacaksın?",
      "Yeni neler var hayatında?",
      "Canın nasıl?"
    ];
    return followUps[Math.floor(Math.random() * followUps.length)];
  }

  // Yanıt tipi belirleme
  getRandomReplyType() {
    const types = ['immediate', 'quick', 'normal', 'delayed'];
    const weights = [0.3, 0.4, 0.2, 0.1]; // Çoğunlukla hızlı yanıt
    
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < types.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return types[i];
      }
    }
    
    return 'quick';
  }

  // İlk konuşmaları oluştur
  async createInitialConversations(users) {
    try {
      console.log('🔄 İlk konuşmalar oluşturuluyor...');
      
      // Her kullanıcı çifti için konuşma oluştur
      for (let i = 0; i < users.length; i++) {
        for (let j = i + 1; j < Math.min(users.length, i + 3); j++) { // Her kullanıcı max 2 kişiyle konuşsun
          const user1 = users[i];
          const user2 = users[j];
          
          if (!user1 || !user2 || !user1.id || !user2.id) {
            console.warn(' Geçersiz kullanıcı verisi atlanıyor:', { user1, user2 });
            continue;
          }
          
          const userIds = [user1.id, user2.id].sort();
          
          // Bu konuşma zaten var mı kontrol et
          const existingConversation = await getDocs(
            query(collection(db, 'conversations'), where('users', '==', userIds))
          );
          
          if (existingConversation.empty) {
            // Yeni konuşma oluştur
            const conversationData = {
              users: userIds,
              lastMessage: '',
              updatedAt: serverTimestamp(),
              createdAt: serverTimestamp(),
              unreadCount: {
                [user1.id]: 0,
                [user2.id]: 0,
              }
            };
            
            await addDoc(collection(db, 'conversations'), conversationData);
            console.log(` ${user1.username} <-> ${user2.username} konuşması oluşturuldu`);
          }
        }
      }
      
      console.log('İlk konuşmalar hazırlandı');
    } catch (error) {
      console.error(' İlk konuşmalar oluşturulurken hata:', error);
    }
  }

  // Her konuşma için ayrı mesajlaşma döngüsü
  async startIndividualConversations(users) {
    try {
      const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
      
      conversationsSnapshot.docs.forEach(conversationDoc => {
        const conversationId = conversationDoc.id;
        const conversationData = conversationDoc.data();
        
        // Konuşma verilerini doğrula
        if (!conversationData || !conversationData.users || !Array.isArray(conversationData.users) || conversationData.users.length < 2) {
          console.warn(` Geçersiz konuşma verisi atlanıyor: ${conversationId}`);
          return;
        }
        
        // Her konuşma için rastgele bir interval belirle
        const intervalType = this.getRandomIntervalType();
        const interval = this.getRandomInterval(
          this.intervals[intervalType].min, 
          this.intervals[intervalType].max
        );
        
        console.log(` Konuşma ${conversationId.slice(-6)} için ${intervalType} interval: ${Math.round(interval/1000)}s`);
        
        // Bu konuşma için interval başlat
        const intervalId = setInterval(async () => {
          await this.sendRandomMessageToConversation(conversationId, conversationData, users);
        }, interval);
        
        this.conversationIntervals.set(conversationId, intervalId);
      });
    } catch (error) {
      console.error('Bireysel konuşmalar başlatılırken hata:', error);
    }
  }

  // Rastgele interval tipi seç
  getRandomIntervalType() {
    const types = ['veryFast', 'fast', 'normal', 'slow', 'verySlow'];
    const weights = [0.15, 0.25, 0.35, 0.15, 0.1]; // Ağırlıklar
    
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < types.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return types[i];
      }
    }
    
    return 'normal';
  }

  // Belirli bir konuşmaya rastgele mesaj gönder
  async sendRandomMessageToConversation(conversationId, conversationData, users) {
    try {
      // Konuşma verilerini doğrula
      if (!conversationData || !conversationData.users || !Array.isArray(conversationData.users) || conversationData.users.length < 2) {
        console.warn(` Geçersiz konuşma verisi: ${conversationId}`);
        return;
      }

      const [userId1, userId2] = conversationData.users;
      
      if (!userId1 || !userId2) {
        console.warn(` Geçersiz kullanıcı ID'leri: ${conversationId}`);
        return;
      }

      const user1 = users.find(u => u.id === userId1);
      const user2 = users.find(u => u.id === userId2);

      if (!user1 || !user2) {
        console.warn(` Kullanıcılar bulunamadı: ${conversationId}`, { userId1, userId2 });
        return;
      }

      // Son mesajı kontrol et 
      const recentMessagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      
      const recentMessagesSnapshot = await getDocs(recentMessagesQuery);
      
      // Eğer son 30 saniye içinde mesaj varsa, bu sefer mesaj gönderme
      if (!recentMessagesSnapshot.empty) {
        const lastMessage = recentMessagesSnapshot.docs[0].data();
        const now = new Date();
        const lastMessageTime = lastMessage.timestamp?.toDate?.() || new Date(lastMessage.timestamp);
        
        if (now - lastMessageTime < 30000) { // 30 saniye
          console.log(`⏳ Konuşma ${conversationId.slice(-6)} - çok yakın zamanda mesaj var, atlanıyor`);
          return;
        }
      }

      // Rastgele gönderen seç
      const sender = Math.random() > 0.5 ? user1 : user2;
      const receiver = sender.id === user1.id ? user2 : user1;

      // Mesaj tipini rastgele seç
      const messageType = Math.random();
      let message;

      if (messageType < 0.7) {
        // %70 normal mesaj
        message = this.messageTemplates[Math.floor(Math.random() * this.messageTemplates.length)];
      } else {
        // %30 hızlı cevap
        message = this.quickReplies[Math.floor(Math.random() * this.quickReplies.length)];
      }

      await this.sendMessage(conversationId, sender.id, receiver.id, message, true);
      
      console.log(`📱 ${sender.username} -> ${receiver.username}: "${message}"`);

      // Bazen otomatik cevap ver (%30 şans)
      if (Math.random() < 0.3) {
        setTimeout(async () => {
          await this.sendAutoReply(conversationId, receiver, sender);
        }, this.getRandomInterval(5000, 20000));
      }
    } catch (error) {
      console.error(' Konuşmaya mesaj gönderilirken hata:', error);
    }
  }

  async sendMessage(conversationId, senderId, receiverId, messageText, isBot = false) {
    try {
      const messageData = {
        text: messageText,
        senderId: senderId,
        timestamp: serverTimestamp(),
        isRead: false,
        isBot: isBot
      };
      
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData);

      const conversationUpdate = {
        lastMessage: messageText,
        updatedAt: serverTimestamp(),
        [`unreadCount.${receiverId}`]: increment(1),
      };
      
      await updateDoc(doc(db, 'conversations', conversationId), conversationUpdate);
      
    } catch (error) {
      console.error(' Mesaj gönderilirken hata:', error);
      throw error;
    }
  }

  async sendAutoReply(conversationId, sender, receiver) {
    try {
      const replyType = Math.random();
      let message;

      if (replyType < 0.4) {
        message = this.quickReplies[Math.floor(Math.random() * this.quickReplies.length)];
      } else if (replyType < 0.8) {
        const questions = [
          "Sen nasılsın?",
          "Ne yapıyorsun?",
          "Bugün planın var mı?",
          "Nasıl gidiyor?",
          "Sen ne düşünüyorsun?",
          "Sen de nasıl?",
          "İyi misin?"
        ];
        message = questions[Math.floor(Math.random() * questions.length)];
      } else {
        message = this.messageTemplates[Math.floor(Math.random() * this.messageTemplates.length)];
      }

      await this.sendMessage(conversationId, sender.id, receiver.id, message, true);
      
      console.log(` ${sender.username} -> ${receiver.username}: "${message}" (otomatik cevap)`);
    } catch (error) {
      console.error(' Otomatik cevap gönderilirken hata:', error);
    }
  }

  stopAutoMessaging() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.conversationIntervals.forEach((intervalId, conversationId) => {
      clearInterval(intervalId);
      console.log(` Konuşma ${conversationId.slice(-6)} interval'i durduruldu`);
    });
    
    this.messageListeners.forEach((unsubscribe, conversationId) => {
      unsubscribe();
      console.log(` Konuşma ${conversationId.slice(-6)} dinleyici durduruldu`);
    });
    
    this.replyTimeouts.forEach((timeoutId, conversationId) => {
      clearTimeout(timeoutId);
      console.log(` Konuşma ${conversationId.slice(-6)} yanıt zamanlayıcısı temizlendi`);
    });
    
    this.conversationIntervals.clear();
    this.messageListeners.clear();
    this.replyTimeouts.clear();
    this.isRunning = false;
    
    console.log(' Otomatik mesajlaşma sistemi tamamen durduruldu');
  }

  async getDetailedStats() {
    try {
      const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
      let totalMessages = 0;
      let botMessages = 0;
      let userMessages = 0;
      let conversationStats = [];

      for (const conversationDoc of conversationsSnapshot.docs) {
        const messagesSnapshot = await getDocs(
          collection(db, 'conversations', conversationDoc.id, 'messages')
        );
        
        let convBotMessages = 0;
        let convUserMessages = 0;
        
        messagesSnapshot.docs.forEach(messageDoc => {
          const messageData = messageDoc.data();
          if (messageData.isBot) {
            convBotMessages++;
            botMessages++;
          } else {
            convUserMessages++;
            userMessages++;
          }
        });
        
        conversationStats.push({
          id: conversationDoc.id,
          messageCount: messagesSnapshot.size,
          botMessages: convBotMessages,
          userMessages: convUserMessages,
          users: conversationDoc.data().users,
          lastUpdate: conversationDoc.data().updatedAt
        });
        
        totalMessages += messagesSnapshot.size;
      }

      return {
        totalConversations: conversationsSnapshot.size,
        totalMessages,
        botMessages,
        userMessages,
        averageMessagesPerConversation: Math.round(totalMessages / conversationsSnapshot.size),
        activeIntervals: this.conversationIntervals.size,
        activeListeners: this.messageListeners.size,
        pendingReplies: this.replyTimeouts.size,
        isRunning: this.isRunning,
        templateCount: this.messageTemplates.length,
        quickReplyCount: this.quickReplies.length,
        userResponseCount: this.userResponseTemplates.length,
        conversationDetails: conversationStats
      };
    } catch (error) {
      console.error(' Detaylı istatistikler alınırken hata:', error);
      return null;
    }
  }

  getSystemStatus() {
    return {
      isRunning: this.isRunning,
      activeConversations: this.conversationIntervals.size,
      activeListeners: this.messageListeners.size,
      pendingReplies: this.replyTimeouts.size,
      messageTemplates: this.messageTemplates.length,
      quickReplies: this.quickReplies.length,
      userResponses: this.userResponseTemplates.length,
      intervals: Object.keys(this.intervals).length,
      replyIntervals: Object.keys(this.userReplyIntervals).length
    };
  }

  updateUserResponseTemplates(newTemplates) {
    this.userResponseTemplates = [...this.userResponseTemplates, ...newTemplates];
    console.log(` ${newTemplates.length} yeni kullanıcı yanıt şablonu eklendi. Toplam: ${this.userResponseTemplates.length}`);
  }

  updateUserReplyIntervals(newIntervals) {
    this.userReplyIntervals = { ...this.userReplyIntervals, ...newIntervals };
    console.log(' Kullanıcı yanıt aralıkları güncellendi');
  }

  updateMessageTemplates(newTemplates) {
    this.messageTemplates = [...this.messageTemplates, ...newTemplates];
    console.log(` ${newTemplates.length} yeni mesaj şablonu eklendi. Toplam: ${this.messageTemplates.length}`);
  }

  updateQuickReplies(newReplies) {
    this.quickReplies = [...this.quickReplies, ...newReplies];
    console.log(` ${newReplies.length} yeni hızlı cevap eklendi. Toplam: ${this.quickReplies.length}`);
  }

  updateIntervals(newIntervals) {
    this.intervals = { ...this.intervals, ...newIntervals };
    console.log(' Interval ayarları güncellendi');
  }

  async sendImmediateResponse(conversationId, userId, message) {
    try {
      const users = await this.getAllUsers();
      const receiver = users.find(u => u.id === userId);
      
      if (!receiver) {
        console.log(' Alıcı kullanıcı bulunamadı');
        return false;
      }

      const conversationDoc = await getDocs(
        query(collection(db, 'conversations'), where('users', 'array-contains', userId))
      );
      
      if (!conversationDoc.empty) {
        const conversationData = conversationDoc.docs[0].data();
        
        // Konuşma verilerini doğrula
        if (!conversationData || !conversationData.users || !Array.isArray(conversationData.users)) {
          console.log(' Geçersiz konuşma verisi');
          return false;
        }
        
        const botUserId = conversationData.users.find(id => id !== userId);
        
        if (!botUserId) {
          console.log(' Bot kullanıcısı bulunamadı');
          return false;
        }
        
        const responseMessage = this.generateResponseMessage(message);
        await this.sendMessage(conversationId, botUserId, userId, responseMessage, true);
        
        console.log(` Anlık yanıt gönderildi: "${responseMessage}"`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(' Anlık yanıt gönderilirken hata:', error);
      return false;
    }
  }

  async getAllUsers() {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = [];
      
      usersSnapshot.forEach(doc => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return users;
    } catch (error) {
      console.error(' Kullanıcılar getirilirken hata:', error);
      return [];
    }
  }

  async simulateUserActivity(userId, activityType = 'online') {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isOnline: activityType === 'online',
        lastSeen: serverTimestamp()
      });
      
      console.log(`👤 Kullanıcı ${userId.slice(-4)} aktivitesi güncellendi: ${activityType}`);
    } catch (error) {
      console.error(' Kullanıcı aktivitesi güncellenirken hata:', error);
    }
  }

  async getConversationStats(conversationId) {
    try {
      const messagesSnapshot = await getDocs(
        collection(db, 'conversations', conversationId, 'messages')
      );
      
      let botMessages = 0;
      let userMessages = 0;
      let totalLength = 0;
      
      messagesSnapshot.docs.forEach(doc => {
        const message = doc.data();
        if (message.isBot) {
          botMessages++;
        } else {
          userMessages++;
        }
        totalLength += message.text?.length || 0;
      });
      
      return {
        totalMessages: messagesSnapshot.size,
        botMessages,
        userMessages,
        averageMessageLength: Math.round(totalLength / messagesSnapshot.size),
        botResponseRate: Math.round((botMessages / messagesSnapshot.size) * 100)
      };
    } catch (error) {
      console.error(' Konuşma istatistikleri alınırken hata:', error);
      return null;
    }
  }

  async restartConversation(conversationId) {
    // Mevcut interval'i durdur
    if (this.conversationIntervals.has(conversationId)) {
      clearInterval(this.conversationIntervals.get(conversationId));
      this.conversationIntervals.delete(conversationId);
    }
    
    // Mevcut listener'ı durdur
    if (this.messageListeners.has(conversationId)) {
      this.messageListeners.get(conversationId)();
      this.messageListeners.delete(conversationId);
    }
    
    // Bekleyen yanıtları temizle
    if (this.replyTimeouts.has(conversationId)) {
      clearTimeout(this.replyTimeouts.get(conversationId));
      this.replyTimeouts.delete(conversationId);
    }
    
    console.log(` Konuşma ${conversationId.slice(-6)} yeniden başlatılıyor`);
  }
}

const autoMessagingSystem = new AutoMessagingSystem();
export default autoMessagingSystem;