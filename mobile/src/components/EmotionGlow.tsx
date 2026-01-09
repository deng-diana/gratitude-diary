import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { EmotionType, EMOTION_MAP } from '../types/emotion';

interface EmotionGlowProps {
  emotion: string | null | undefined;
}

/**
 * 情绪光晕组件
 * 使用径向渐变 (RadialGradient) 创建柔和的、无硬边的光球效果
 */
export const EmotionGlow: React.FC<EmotionGlowProps> = ({ emotion }) => {
  if (!emotion) return null;

  // 获取情绪配置
  const config = EMOTION_MAP[emotion as EmotionType];
  if (!config) return null;

  const baseColor = config.color;

  return (
    <View style={styles.clippingContainer} pointerEvents="none">
      <View style={styles.svgPositioner}>
        <Svg height="100%" width="100%">
          <Defs>
            <RadialGradient
              id="grad"
              cx="70%"  // 光影几何中心 - 向右移动,对齐标签
              cy="45%"
              rx="50%"
              ry="50%"
              fx="75%"  // 光源焦点 - 最亮的点,对齐标签中心
              fy="20%"
              gradientUnits="userSpaceOnUse"
            >
              {/* 🎨 增强光影效果: 提高中心透明度从0.5到0.7,让光影更明显 */}
              <Stop offset="0" stopColor={baseColor} stopOpacity="0.6" />
              <Stop offset="1" stopColor={baseColor} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // 1. 裁剪容器
  clippingContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 16, 
    overflow: 'hidden', 
    zIndex: 0,
  },
  // 2. 定位容器
  svgPositioner: {
    position: 'absolute',
    top: 2,     // ✅ 恢复顶部留白
    right: 2,   // ✅ 恢复右侧留白
    width: 200,  
    height: 80, 
  },
});