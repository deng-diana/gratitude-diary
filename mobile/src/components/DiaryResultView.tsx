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

import { DiaryContentCard } from "./DiaryContentCard";
import { AIFeedbackCard } from "./AIFeedbackCard";
import { EmotionData } from "../types/emotion";

interface DiaryResultViewProps {
  title: string;
  polishedContent: string;
  aiFeedback: string;
  emotionData?: EmotionData;
  language?: string; // ✅ 新增：日记语言
  
  // 编辑相关
  isEditingTitle?: boolean;
  isEditingContent: boolean;
  editedTitle?: string;
  editedContent: string;
  
  onStartTitleEditing?: () => void;
  onStartContentEditing: () => void;
  onTitleChange?: (text: string) => void;
  onContentChange: (text: string) => void;
}

export default function DiaryResultView({
  title,
  polishedContent,
  aiFeedback,
  emotionData,
  language = "zh",
  isEditingTitle,
  isEditingContent,
  editedTitle,
  editedContent,
  onStartTitleEditing,
  onStartContentEditing,
  onTitleChange,
  onContentChange,
}: DiaryResultViewProps) {
  return (
    <>
      {/* 日记主体卡片 */}
      <DiaryContentCard
        title={title}
        content={polishedContent}
        emotion={emotionData?.emotion}
        language={language}
        
        // 编辑状态传递
        isEditingTitle={isEditingTitle}
        isEditingContent={isEditingContent}
        editedTitle={editedTitle}
        editedContent={editedContent}
        
        // 回调传递
        onStartTitleEditing={onStartTitleEditing}
        onStartContentEditing={onStartContentEditing}
        onTitleChange={onTitleChange}
        onContentChange={onContentChange}
        
        style={styles.resultDiaryCardOverride}
      />

      {/* AI反馈 - 编辑时隐藏 */}
      {!isEditingTitle && !isEditingContent && !!aiFeedback && (
        <AIFeedbackCard 
          aiFeedback={aiFeedback} 
          style={styles.resultFeedbackCard}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // ===== 日记卡片覆盖样式 =====
  resultDiaryCardOverride: {
    marginHorizontal: 0,
    marginBottom: 12,
  },

  // ===== AI反馈卡片 =====
  resultFeedbackCard: {
    marginHorizontal: 0, // ✅ 外层 ScrollView 已经有 paddingHorizontal: 20
    marginBottom: 20,
  },
});

