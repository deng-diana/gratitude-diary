/**
 * 处理动画组件
 * 
 * 用于显示日记处理进度（文字输入和语音输入共享）
 * 根据传入的 steps 自动适配不同的处理流程
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Typography } from "../styles/typography";
import { t } from "../i18n";

interface ProcessingStep {
  icon: string;
  text: string;
  duration: number;
}

interface ProcessingAnimationProps {
  processingStep: number;
  processingProgress: number;
  steps: ProcessingStep[];
}

export default function ProcessingAnimation({
  processingStep,
  processingProgress,
  steps,
}: ProcessingAnimationProps) {
  return (
    <View
      style={styles.processingCenter}
      accessibilityLiveRegion="polite"
      accessibilityLabel={t("accessibility.status.processing", {
        step: processingStep + 1,
      })}
      accessibilityRole="progressbar"
    >
      <View style={styles.processingContent}>
        {/* Emoji - 单独一行，居中对齐 */}
        <View style={styles.emojiContainer}>
          <Text style={styles.stepEmoji}>{steps[processingStep]?.icon}</Text>
        </View>

        {/* 步骤文案 - 单独一行，居中对齐 */}
        <View style={styles.textContainer}>
          <Text style={styles.currentStepText}>{steps[processingStep]?.text}</Text>
        </View>

        {/* 进度条和百分比 */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${processingProgress}%` },
              ]}
            />
          </View>
          <Text
            style={styles.progressText}
            accessibilityLabel={`${t("accessibility.status.processing")}, ${Math.round(processingProgress)}%`}
          >
            {Math.round(processingProgress)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  processingCenter: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 60,
  },

  processingContent: {
    width: "100%",
    maxWidth: 260,
    alignItems: "center",
  },

  emojiContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    height: 40, // 固定高度，确保布局稳定
  },

  stepEmoji: {
    fontSize: 32, // 稍微大一点，更醒目
    textAlign: "center",
  },

  textContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    minHeight: 24, // 最小高度，防止布局跳动
  },

  currentStepText: {
    ...Typography.body,
    color: "#1A1A1A",
    textAlign: "center",
  },

  progressSection: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: "#F0F0F0",
    borderRadius: 3,
    overflow: "hidden",
  },

  progressBarFill: {
    height: "100%",
    backgroundColor: "#E56C45",
    borderRadius: 3,
  },

  progressText: {
    ...Typography.caption,
    color: "#666",
    width: 45,
    textAlign: "right",
  },
});
