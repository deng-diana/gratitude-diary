/**
 * 日记结果展示组件
 * 
 * 用于显示处理后的日记（文字输入和语音输入共享）
 */
import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PreciousMomentsIcon from "../assets/icons/preciousMomentsIcon.svg";
import { Typography, getFontFamilyForText } from "../styles/typography";
import { t } from "../i18n";

import { EmotionCapsule } from "./EmotionCapsule";
import { EmotionData } from "../types/emotion";

interface DiaryResultViewProps {
  title: string;
  polishedContent: string;
  aiFeedback: string;
  emotionData?: EmotionData; // ✅ 新增
  isEditing: boolean;
  editedContent: string;
  onStartEditing: () => void;
  onContentChange: (text: string) => void;
}

export default function DiaryResultView({
  title,
  polishedContent,
  aiFeedback,
  emotionData,
  isEditing,
  editedContent,
  onStartEditing,
  onContentChange,
}: DiaryResultViewProps) {
  // 获取当前语言环境，传给 EmotionCapsule
  const currentLanguage = t("common.save") === "Save" ? "en" : "zh";

  return (
    <>
      {/* 标题和内容卡片 */}
      <View style={styles.resultDiaryCard}>
        {/* 标题 + 情绪标签 */}
        {!!title && !isEditing && (
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.resultTitleText,
                {
                  fontFamily: getFontFamilyForText(title, "bold"),
                  flex: 1, // 让标题占据剩余空间
                  marginBottom: 0, // 布局由 titleRow 控制
                },
              ]}
            >
              {title}
            </Text>
            {/* ✅ 显示情绪标签 */}
            {emotionData?.emotion && (
              <View style={{ marginLeft: 8 }}>
                <EmotionCapsule
                  emotion={emotionData.emotion}
                  language={currentLanguage}
                  content={polishedContent}
                />
              </View>
            )}
          </View>
        )}

        {/* 内容 - 可点击编辑 */}
        {isEditing ? (
          <TextInput
            style={[
              styles.editContentInput,
              {
                fontFamily: getFontFamilyForText(editedContent, "regular"),
              },
            ]}
            value={editedContent}
            onChangeText={onContentChange}
            multiline
            autoFocus
            placeholder={t("diary.placeholderContent")}
            accessibilityLabel={t("diary.placeholderContent")}
            accessibilityHint={t("accessibility.input.textHint")}
            accessibilityRole="text"
          />
        ) : (
          <TouchableOpacity
            onPress={onStartEditing}
            activeOpacity={0.7}
            accessibilityLabel={polishedContent.substring(0, 100) + (polishedContent.length > 100 ? "..." : "")}
            accessibilityHint={t("accessibility.button.editHint")}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.resultContentText,
                {
                  fontFamily: getFontFamilyForText(polishedContent, "regular"),
                },
              ]}
            >
              {polishedContent}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* AI反馈 - 编辑时隐藏 */}
      {!isEditing && !!aiFeedback && (
        <View style={styles.resultFeedbackCard}>
          <View style={styles.resultFeedbackHeader}>
            <PreciousMomentsIcon width={20} height={20} />
            <Text
              style={[
                styles.resultFeedbackTitle,
                {
                  fontFamily: getFontFamilyForText(
                    t("diary.aiFeedbackTitle"),
                    "medium"
                  ),
                },
              ]}
            >
              {t("diary.aiFeedbackTitle")}
            </Text>
          </View>
          <Text
            style={[
              styles.resultFeedbackText,
              { fontFamily: getFontFamilyForText(aiFeedback, "regular") },
            ]}
          >
            {aiFeedback}
          </Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // ===== 日记卡片 =====
  resultDiaryCard: {
    backgroundColor: "#FAF6ED",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 0, // ✅ 外层 ScrollView 已经有 paddingHorizontal: 20
    marginBottom: 12,
  },

  // ✅ 新增：标题行布局
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  resultTitleText: {
    ...Typography.diaryTitle,
    fontSize: 16,
    color: "#1A1A1A",
    letterSpacing: -0.5,
    // marginBottom: 12, // ✅ 移至 titleRow 控制
  },

  resultContentText: {
    ...Typography.body,
    lineHeight: 26,
    color: "#1A1A1A",
    letterSpacing: 0.2,
  },

  editContentInput: {
    ...Typography.body,
    color: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#E56C45",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    minHeight: 200,
    maxHeight: 400,
    textAlignVertical: "top",
  },

  // ===== AI反馈卡片 =====
  resultFeedbackCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 0, // ✅ 外层 ScrollView 已经有 paddingHorizontal: 20
    marginBottom: 20,
  },

  resultFeedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  resultFeedbackTitle: {
    ...Typography.sectionTitle,
    fontSize: 16,
    color: "#E56C45",
    marginLeft: 8,
  },

  resultFeedbackText: {
    ...Typography.body,
    fontSize: 15,
    lineHeight: 28, // ✅ 增大行高，让中文内容不那么密集（从22增加到28）
    letterSpacing: 0.3, // ✅ 增加字间距，让阅读更舒适
    color: "#1A1A1A",
  },
});

