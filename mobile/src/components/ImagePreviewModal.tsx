/**
 * ImagePreviewModal - Production-Grade Image Viewer
 * 
 * Best Practice Implementation:
 * - Clean, simple animations (fade + subtle scale)
 * - Smooth 60fps gesture handling
 * - No complex shared element transitions (performance trade-off)
 * - Focus on reliability and smoothness
 * 
 * Reference: WeChat, Instagram approach
 * Note: Full shared element transitions require native modules
 * and add significant complexity. This approach prioritizes
 * stability and performance.
 */

import React, { useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SPRING_CONFIG = {
  damping: 25,
  stiffness: 250,
};

interface ImagePreviewModalProps {
  visible: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

function ImageViewer({
  uri,
  onSingleTap,
  isActive,
}: {
  uri: string;
  onSingleTap: () => void;
  isActive: boolean;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    if (!isActive) {
      scale.value = 1;
      savedScale.value = 1;
      translateX.value = 0;
      translateY.value = 0;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  }, [isActive]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = savedScale.value * event.scale;
      scale.value = Math.max(1, Math.min(newScale, 4));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      
      if (scale.value < 1.1) {
        scale.value = withSpring(1, SPRING_CONFIG);
        savedScale.value = 1;
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const panGesture = Gesture.Pan()
    .enabled(scale.value > 1)
    .onUpdate((event) => {
      const maxTranslateX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
      const maxTranslateY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;

      const newTranslateX = savedTranslateX.value + event.translationX;
      const newTranslateY = savedTranslateY.value + event.translationY;

      translateX.value = Math.max(-maxTranslateX, Math.min(maxTranslateX, newTranslateX));
      translateY.value = Math.max(-maxTranslateY, Math.min(maxTranslateY, newTranslateY));
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      if (scale.value > 1) {
        scale.value = withSpring(1, SPRING_CONFIG);
        savedScale.value = 1;
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        const targetScale = 2.5;
        const focalX = event.x - SCREEN_WIDTH / 2;
        const focalY = event.y - SCREEN_HEIGHT / 2;
        const targetTranslateX = -focalX * (targetScale - 1);
        const targetTranslateY = -focalY * (targetScale - 1);
        
        scale.value = withSpring(targetScale, SPRING_CONFIG);
        savedScale.value = targetScale;
        translateX.value = withSpring(targetTranslateX, SPRING_CONFIG);
        translateY.value = withSpring(targetTranslateY, SPRING_CONFIG);
        savedTranslateX.value = targetTranslateX;
        savedTranslateY.value = targetTranslateY;
      }
    });

  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      if (scale.value === 1) {
        runOnJS(onSingleTap)();
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    Gesture.Exclusive(doubleTapGesture, singleTapGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.Image
        source={{ uri }}
        style={[styles.image, animatedStyle]}
        resizeMode="contain"
      />
    </GestureDetector>
  );
}

export default function ImagePreviewModal({
  visible,
  images,
  initialIndex,
  onClose,
}: ImagePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      opacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) });
      translateX.value = -initialIndex * SCREEN_WIDTH;
      savedTranslateX.value = -initialIndex * SCREEN_WIDTH;
    } else {
      opacity.value = 0;
    }
  }, [visible, initialIndex]);
  const handleClose = useCallback(() => {
    // ✅ FIX: Call onClose immediately - parent will handle modal dismissal
    onClose();
  }, [onClose]);

  const swipeGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
    })
    .onEnd((event) => {
      const threshold = SCREEN_WIDTH * 0.25;
      const velocity = event.velocityX;

      let targetIndex = currentIndex;

      if (event.translationX > threshold || velocity > 500) {
        targetIndex = Math.max(0, currentIndex - 1);
      } else if (event.translationX < -threshold || velocity < -500) {
        targetIndex = Math.min(images.length - 1, currentIndex + 1);
      }

      const targetTranslateX = -targetIndex * SCREEN_WIDTH;
      translateX.value = withSpring(targetTranslateX, SPRING_CONFIG);
      savedTranslateX.value = targetTranslateX;

      if (targetIndex !== currentIndex) {
        runOnJS(setCurrentIndex)(targetIndex);
      }
    });

  const pagerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.root}>
        <StatusBar hidden />
        
        <Animated.View style={[styles.background, backgroundStyle]} />

        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          activeOpacity={0.7}
        >
          <View style={styles.closeButtonInner}>
            <Ionicons name="close" size={24} color="#fff" />
          </View>
        </TouchableOpacity>

        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={[styles.pager, pagerStyle]}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <ImageViewer
                  uri={uri}
                  onSingleTap={handleClose}
                  isActive={index === currentIndex}
                />
              </View>
            ))}
          </Animated.View>
        </GestureDetector>

        {images.length > 1 && (
          <Animated.View style={[styles.pageIndicator, backgroundStyle]}>
            <View style={styles.pageIndicatorContent}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.pageIndicatorDot,
                    index === currentIndex && styles.pageIndicatorDotActive,
                  ]}
                />
              ))}
            </View>
          </Animated.View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pager: {
    flex: 1,
    flexDirection: 'row',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  pageIndicator: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pageIndicatorContent: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pageIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 3,
  },
  pageIndicatorDotActive: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
