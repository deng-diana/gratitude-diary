import React, { useEffect, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  ImageBackground,
  Animated,
  Dimensions,
  Modal
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Diary } from './DiaryListScreen'; // Reuse functionality
import DiaryDetailScreen from './DiaryDetailScreen'; 
import { EmotionCapsule } from '../components/EmotionCapsule';
import { EMOTION_MAP } from '../types/emotion';

// 幸福情绪集合
const HAPPY_EMOTIONS = new Set(['Joyful', 'Grateful', 'Proud', 'Peaceful']);

const HappinessJarScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { diaries } = route.params as { diaries: Diary[] };
  
  // 动画值
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const jarScale = useRef(new Animated.Value(0.8)).current;

  // 1. 筛选幸福日记
  const happyDiaries = useMemo(() => {
    return diaries.filter(d => 
      d.emotion_data?.emotion && HAPPY_EMOTIONS.has(d.emotion_data.emotion)
    );
  }, [diaries]);

  // 2. 入场动画
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(jarScale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // 详情页状态
  const [selectedDiary, setSelectedDiary] = React.useState<Diary | null>(null);
  const [detailVisible, setDetailVisible] = React.useState(false);

  const renderItem = ({ item }: { item: Diary }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        setSelectedDiary(item);
        setDetailVisible(true);
      }}
      activeOpacity={0.9}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.date}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
        {item.emotion_data?.emotion && (
           <EmotionCapsule 
             emotion={item.emotion_data.emotion} 
             language={item.language}
           />
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.preview} numberOfLines={3}>
        {item.polished_content || item.original_content}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1541336528065-8f1fdc435835?q=80&w=3387&auto=format&fit=crop' }} 
      style={styles.container}
      blurRadius={30} // 模糊背景，营造梦幻感
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Happiness Jar 🫙</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          {/* 罐子头部展示 */}
          <View style={styles.jarContainer}>
            <Animated.Text style={[styles.jarIcon, { transform: [{ scale: jarScale }] }]}>
              🫙✨
            </Animated.Text>
            <Text style={styles.jarStats}>
              Collected {happyDiaries.length} moments of joy
            </Text>
          </View>

          <FlatList
            data={happyDiaries}
            renderItem={renderItem}
            keyExtractor={item => item.diary_id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>

        {/* 详情页 Modal */}
        <Modal
          visible={detailVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setDetailVisible(false)}
        >
          {selectedDiary && (
            <DiaryDetailScreen
              diaryId={selectedDiary.diary_id}
              onClose={() => setDetailVisible(false)}
            />
          )}
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF2B2', // Fallback color
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  jarContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  jarIcon: {
    fontSize: 64,
    marginBottom: 10,
    textShadowColor: 'rgba(255, 223, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  jarStats: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  preview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default HappinessJarScreen;
