/**
 * 欢迎页 - Onboarding流程的第一个页面
 *
 * 设计理念（乔布斯视角）：
 * - 简洁、优雅、不打扰
 * - 清晰传达产品价值
 * - 提供明确的下一步操作
 *
 * 技术实现（Google开发者视角）：
 * - 组件化、可复用
 * - 类型安全
 * - 性能优化
 */
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { useNavigation } from "@react-navigation/native";
import { t } from "../i18n";
import { getTypography } from "../styles/typography";

export default function WelcomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const typography = getTypography();

  const handlePrivacyPress = () => {
    // TODO: 导航到隐私政策页面
    navigation.navigate("PrivacyPolicy" as any);
  };

  const handleTermsPress = () => {
    // TODO: 导航到服务条款页面
    navigation.navigate("TermsOfService" as any);
  };

  const handleAgreeContinue = async () => {
    // 标记已查看欢迎页（但还没完成整个Onboarding）
    // 进入引导页轮播
    navigation.navigate("OnboardingCarousel" as any);
  };

  // 渲染带链接的文本
  const renderPrivacyNotice = () => {
    const noticeText = t("onboarding.welcome.privacyNotice");
    const privacyPolicyText = t("onboarding.welcome.privacyPolicy");
    const termsOfServiceText = t("onboarding.welcome.termsOfService");

    // 按占位符分割文本
    const parts = noticeText.split(/({{privacyPolicy}}|{{termsOfService}})/);

    return parts.map((part, index) => {
      if (part === "{{privacyPolicy}}") {
        return (
          <Text
            key={`privacy-${index}`}
            style={styles.link}
            onPress={handlePrivacyPress}
          >
            {privacyPolicyText}
          </Text>
        );
      }
      if (part === "{{termsOfService}}") {
        return (
          <Text
            key={`terms-${index}`}
            style={styles.link}
            onPress={handleTermsPress}
          >
            {termsOfServiceText}
          </Text>
        );
      }
      return <Text key={`text-${index}`}>{part}</Text>;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo占位符 */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder} />
        </View>

        {/* 标题和副标题 */}
        <View style={styles.contentContainer}>
          <Text style={[styles.title, typography.diaryTitle]}>
            {t("onboarding.welcome.title")}
          </Text>
          <Text style={[styles.subtitle, typography.body]}>
            {t("onboarding.welcome.subtitle")}
          </Text>
        </View>

        {/* 隐私政策和服务条款 */}
        <View style={styles.legalContainer}>
          <Text style={[styles.legalText, typography.caption]}>
            {renderPrivacyNotice()}
          </Text>
        </View>

        {/* 主按钮 */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleAgreeContinue}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, typography.body]}>
            {t("onboarding.welcome.agreeButton")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF6ED",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: "#D96F4C", // 主题色
  },
  contentContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    color: "#1A1A1A",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  legalContainer: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  legalText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
  },
  link: {
    color: "#D96F4C", // 主题色
    textDecorationLine: "underline",
  },
  button: {
    backgroundColor: "#D96F4C", // 主题色
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    shadowColor: "#D96F4C",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
