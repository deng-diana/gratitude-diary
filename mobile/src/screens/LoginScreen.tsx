/**
 * 登录页面
 *
 * 这个页面显示:
 * - App的logo和标题
 * - Apple登录按钮
 * - Google登录按钮
 * - 欢迎文字
 */
import { useNavigation } from "@react-navigation/native"; // ✅ 添加这行
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
// ✅ 正确的SafeAreaView导入
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

// 导入图标
import { Ionicons } from "@expo/vector-icons";

import {
  signInWithApple,
  signInWithGoogle,
  emailLoginOrSignUp,
  emailConfirmAndLogin,
  getCurrentUser,
  saveUser,
  isValidUserName,
  updateUserName,
} from "../services/authService";
import VerificationCodeModal from "../components/VerificationCodeModal";
import GoogleIcon from "../components/GoogleIcon";
import NameInputModal from "../components/NameInputModal";
import { getTypography } from "../styles/typography";
import SplashIcon from "../assets/icons/splash-icon.svg";

// ============================================================================
// 🌍 Step 1: 导入翻译函数
// ============================================================================
// 'export const t'的t是translate的缩写，Google/Facebook等大厂的标准命名
import { t, getCurrentLocale } from "../i18n";
import { Typography } from "../styles/typography";

// 登录页面组件
export default function LoginScreen() {
  //添加navigation
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // 加载状态
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<
    "apple" | "google" | "username" | null
  >(null);

  // 邮箱登录状态
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 密码显示/隐藏状态

  // 邮箱验证码状态
  const [showEmailVerificationModal, setShowEmailVerificationModal] =
    useState(false);
  const [emailForVerification, setEmailForVerification] = useState("");

  // 姓名输入状态
  const [showNameInputModal, setShowNameInputModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");

  // 获取 Typography 样式
  const typography = getTypography();

  // ✅ 修复：页面挂载或获得焦点时，确保清除任何残留的用户状态
  // 这样可以防止自动登录到之前的账号
  React.useEffect(() => {
    const checkAndClearStaleAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          console.log("🔒 LoginScreen: 检测到残留的用户状态，已清除");
          // 如果发现有用户状态，说明可能是退出登录不彻底，再次清除
          const { signOut } = await import("../services/authService");
          await signOut();
        }
      } catch (error) {
        console.error("❌ 检查用户状态失败:", error);
      }
    };
    checkAndClearStaleAuth();
  }, []);

  const markOnboardingComplete = async () => {
    try {
      await SecureStore.setItemAsync("hasCompletedOnboarding", "true");
    } catch (error) {
      console.warn("⚠️ 保存Onboarding状态失败", error);
    }
  };

  // Apple登录
  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      setLoadingProvider("apple");

      console.log("开始Apple登录...");
      const user = await signInWithApple();

      console.log("登录成功!", user);

      // ✅ 检查姓名是否有效，如果无效则弹出输入框
      if (!isValidUserName(user.name, user.email)) {
        console.log("📝 Apple登录用户姓名无效，弹出姓名输入框");
        setPendingEmail(user.email);
        setPendingPassword("");
        setShowNameInputModal(true);
        return;
      }

    await markOnboardingComplete();
      // ✅ 跳转到主应用（MainDrawer，默认显示日记列表）
      navigation.replace("MainDrawer");
    } catch (error: any) {
      console.error("Apple登录错误:", error);

      // 用户取消登录,不显示错误
      if (error.message.includes("已取消")) {
        return;
      }

      // 显示更友好的错误信息
      let errorMessage = error.message || "发生未知错误";

      // ============================================================================
      // 🌍 Step 2: 使用翻译函数替换硬编码文本
      // ============================================================================
      // 为什么要这样改？
      // - t('error.networkError') 会根据系统语言返回中文或英文
      // - 代码更简洁，不需要写两遍（中文版+英文版）
      // - 方便未来添加更多语言（只需加翻译文件，代码不用动）

      // 处理常见的网络错误
      if (errorMessage.includes("Network request failed")) {
        errorMessage = t("error.networkError");
      } else if (errorMessage.includes("timeout")) {
        errorMessage = t("common.retry");
      } else if (errorMessage.includes("无效的 Apple token")) {
        errorMessage = t("error.authExpired");
      } else if (errorMessage.includes("Apple 登录失败")) {
        // 提取具体错误信息
        const match = errorMessage.match(/Apple 登录失败: (.+)/);
        if (match) {
          errorMessage = match[1];
        }
      }

      Alert.alert(t("login.title"), errorMessage, [
        { text: t("common.confirm") },
      ]);
    } finally {
      setLoading(false);
      setLoadingProvider(null);
    }
  };

  // Google登录
  const handleGoogleSignIn = async () => {
    // ✅ 如果正在加载,直接返回
    if (loading) {
      return;
    }
    try {
      setLoading(true);
      setLoadingProvider("google");

      console.log("开始Google登录...");
      const user = await signInWithGoogle();

      console.log("登录成功!", user);

      // ✅ 检查姓名是否有效，如果无效则弹出输入框
      if (!isValidUserName(user.name, user.email)) {
        console.log("📝 Google登录用户姓名无效，弹出姓名输入框");
        setPendingEmail(user.email);
        setPendingPassword("");
        setShowNameInputModal(true);
        return;
      }

    await markOnboardingComplete();
      // ✅ 跳转到主应用（MainDrawer，默认显示日记列表）
      navigation.replace("MainDrawer");
    } catch (error: any) {
      console.error("Google登录错误:", error);

      // 用户取消登录,不显示错误
      if (error.message.includes("已取消")) {
        return;
      }

      // 显示更友好的错误信息
      let errorMessage = error.message || "发生未知错误";

      // 处理常见的网络错误
      if (errorMessage.includes("Network request failed")) {
        errorMessage = "网络连接失败，请检查网络设置";
      } else if (errorMessage.includes("timeout")) {
        errorMessage = "请求超时，请重试";
      } else if (errorMessage.includes("invalid_grant")) {
        errorMessage = "登录已过期,请重新尝试";
      } else if (errorMessage.includes("Google 登录失败")) {
        // 提取具体错误信息
        const match = errorMessage.match(/Google 登录失败: (.+)/);
        if (match) {
          errorMessage = match[1];
        }
      }

      Alert.alert("登录失败", errorMessage, [{ text: "好的" }]);
    } finally {
      setLoading(false);
      setLoadingProvider(null);
    }
  };

  // 智能登录/注册处理（邮箱）- 使用新接口
  const handleEmailContinue = async () => {
    const normalizedEmail = username.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    setEmailError("");
    setPasswordError("");
    setFormError("");

    let hasError = false;

    if (!normalizedEmail) {
      setEmailError(t("login.emailPlaceholder"));
      hasError = true;
    } else if (!emailRegex.test(normalizedEmail)) {
      setEmailError(t("signup.invalidEmail"));
      hasError = true;
    }

    if (!password || password.length < 8) {
      setPasswordError(t("signup.passwordTooShort"));
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setUsername(normalizedEmail);

    try {
      setLoading(true);
      setLoadingProvider("username");

      const result = await emailLoginOrSignUp(normalizedEmail, password);
      console.log("📊 EMAIL_LOGIN_FLOW", {
        stage: "login_or_signup",
        status: result.status,
        email: normalizedEmail,
      });

      if (result.status === "SIGNED_IN") {
        const { user } = result;

        if (!isValidUserName(user.name, user.email)) {
          setPendingEmail(user.email || normalizedEmail);
          setPendingPassword(password);
          setShowNameInputModal(true);
          return;
        }

        await markOnboardingComplete();
        setPendingEmail("");
        setPendingPassword("");
        setEmailForVerification("");
        // ✅ 跳转到主应用（MainDrawer，默认显示日记列表）
        navigation.replace("MainDrawer");
        return;
      }

      if (result.status === "CONFIRMATION_REQUIRED") {
        setEmailForVerification(normalizedEmail);
        setPendingEmail(normalizedEmail);
        setPendingPassword(password);
        setShowEmailVerificationModal(true);
        Alert.alert(t("login.codeSent"), t("login.emailCodeSentMessage"), [
          { text: t("common.confirm") },
        ]);
        return;
      }

      if (result.status === "WRONG_PASSWORD") {
        setPasswordError(t("login.invalidCredentials"));
        return;
      }

      setFormError(t("error.retryMessage"));
    } catch (error: any) {
      console.error("❌ 邮箱登录错误:", error);
      const message = (error.message || "").toLowerCase();
      console.log("📊 EMAIL_LOGIN_ERROR", {
        stage: "login_or_signup",
        email: normalizedEmail,
        message: error?.message,
      });

      if (
        message.includes("密码") ||
        message.includes("password") ||
        message.includes("not authorized")
      ) {
        setPasswordError(t("login.invalidCredentials"));
      } else if (message.includes("network request failed")) {
        setFormError(t("error.networkError"));
        Alert.alert(t("login.title"), t("login.networkSuggestion"), [
          { text: t("common.confirm") },
        ]);
      } else {
        setFormError(error.message || t("error.retryMessage"));
        Alert.alert(t("login.title"), error.message || t("error.retryMessage"), [
          { text: t("common.confirm") },
        ]);
      }
    } finally {
      setLoading(false);
      setLoadingProvider(null);
    }
  };

  // 邮箱验证码确认处理
  const handleEmailVerifyCode = async (code: string) => {
    try {
      setLoading(true);
      setLoadingProvider("username");

      console.log("📧 验证邮箱验证码...");
      const verificationPassword = pendingPassword || password;
      const user = await emailConfirmAndLogin(
        emailForVerification,
        code,
        verificationPassword
      );
      console.log("📊 EMAIL_VERIFY_SUCCESS", {
        stage: "email_confirm",
        email: emailForVerification,
      });

      console.log("✅ 邮箱确认并登录成功!", user);
      setShowEmailVerificationModal(false);

      // ✅ 检查姓名是否有效，如果无效则弹出输入框
      if (!isValidUserName(user.name, user.email)) {
        console.log("📝 邮箱注册用户姓名无效，弹出姓名输入框");
        setPendingEmail(user.email);
        setPendingPassword(verificationPassword);
        setShowNameInputModal(true);
        return;
      }

      await markOnboardingComplete();
      setPendingEmail("");
      setPendingPassword("");
      setEmailForVerification("");
      // ✅ 跳转到主应用（MainDrawer，默认显示日记列表）
      navigation.replace("MainDrawer");
    } catch (error: any) {
      console.error("❌ 邮箱确认失败:", error);
      const message = (error.message || "").toLowerCase();
      let displayMessage = t("login.verificationFailed");

      if (message.includes("network request failed")) {
        displayMessage = t("error.networkError");
      }

      console.log("📊 EMAIL_VERIFY_ERROR", {
        stage: "email_confirm",
        email: emailForVerification,
        message: error?.message,
      });

      throw new Error(displayMessage); // 让模态框处理错误显示
    } finally {
      setLoading(false);
      setLoadingProvider(null);
    }
  };

  // 处理姓名确认（适用于所有登录方式）
  const handleNameConfirm = async (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    try {
      setLoading(true);
      setLoadingProvider("username");

      await updateUserName(trimmedName);

      const currentUser = await getCurrentUser();
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          name: trimmedName,
        };
        await saveUser(updatedUser);
      }

      setShowNameInputModal(false);
      setPendingEmail("");
      setPendingPassword("");
      setEmailForVerification("");

      await markOnboardingComplete();
      // ✅ 跳转到主应用（MainDrawer，默认显示日记列表）
      navigation.replace("MainDrawer");
    } catch (error: any) {
      console.error("❌ 处理姓名确认失败:", error);
      let errorMessage = error.message || "操作失败";
      if (errorMessage.includes("Network request failed")) {
        errorMessage = t("error.networkError");
      }
      Alert.alert(t("login.title"), errorMessage, [
        { text: t("common.confirm") },
      ]);
    } finally {
      setLoading(false);
      setLoadingProvider(null);
    }
  };

  // 处理姓名取消（邮箱注册）
  const handleNameCancel = () => {
    setShowNameInputModal(false);
    setPendingEmail("");
    setPendingPassword("");
    setEmailForVerification("");
  };

  // 重新发送邮箱验证码
  const handleResendEmailCode = async () => {
    try {
      // 重新调用登录或注册接口（会自动重新发送验证码）
      const verificationPassword = pendingPassword || password;
      await emailLoginOrSignUp(emailForVerification, verificationPassword);
      console.log("📊 EMAIL_CODE_RESEND_SUCCESS", {
        stage: "email_resend",
        email: emailForVerification,
      });
      Alert.alert(t("login.codeSent"), t("login.emailCodeSentMessage"), [
        { text: t("common.confirm") },
      ]);
    } catch (error: any) {
      console.error("❌ 重发验证码失败:", error);
      console.log("📊 EMAIL_CODE_RESEND_ERROR", {
        stage: "email_resend",
        email: emailForVerification,
        message: error?.message,
      });

      const message = (error.message || "").toLowerCase();
      if (message.includes("network request failed")) {
        throw new Error(t("login.networkSuggestion"));
      }

      throw new Error(t("login.resendFailed"));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 顶部标题 */}
        <View style={styles.header}>
          <SplashIcon width={72} height={72} style={styles.logo} />
          <Text style={[styles.headerTitle, typography.diaryTitle]}>
            {t("login.title")}
          </Text>
          <Text style={[styles.headerSubtitle, typography.body]}>
            {t("login.subtitle")}
          </Text>
        </View>

        <View style={styles.buttonSection}>
          {/* 邮箱登录表单 */}
          {/* 邮箱输入 */}
          <TextInput
            style={[
              styles.input,
              emailError ? styles.inputError : null,
              typography.body,
            ]}
            placeholder={t("login.emailPlaceholder")}
            placeholderTextColor="#999"
            value={username}
            onChangeText={(value) => {
              setUsername(value);
              if (emailError) {
                setEmailError("");
              }
              if (formError) {
                setFormError("");
              }
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!loading}
            accessibilityLabel={t("login.emailPlaceholder")}
            accessibilityHint={t("accessibility.input.emailHint")}
            accessibilityRole="text"
            accessibilityState={{ disabled: loading }}
          />
          {emailError ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : null}

          {/* 密码输入 */}
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                passwordError ? styles.inputError : null,
                typography.body,
              ]}
              placeholder={t("login.passwordPlaceholder")}
              placeholderTextColor="#999"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (passwordError) {
                  setPasswordError("");
                }
                if (formError) {
                  setFormError("");
                }
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              accessibilityLabel={t("login.passwordPlaceholder")}
              accessibilityHint={t("accessibility.input.passwordHint")}
              accessibilityRole="text"
              accessibilityState={{ disabled: loading }}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
              accessibilityLabel={
                showPassword ? t("common.close") : t("common.show")
              }
              accessibilityHint={t("accessibility.button.showPasswordHint")}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}

          {/* 继续按钮 */}
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleEmailContinue}
            disabled={loading}
            accessibilityLabel={t("login.continue")}
            accessibilityHint={t("accessibility.button.continueHint")}
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
          >
            {loadingProvider === "username" ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.primaryButtonText, typography.body]}>
                {t("login.continue")}
              </Text>
            )}
          </TouchableOpacity>
          {formError ? (
            <Text style={styles.formErrorText}>{formError}</Text>
          ) : null}

          {/* 姓名输入模态框 */}
          <NameInputModal
            visible={showNameInputModal}
            onConfirm={handleNameConfirm}
            onCancel={handleNameCancel}
          />

          {/* 邮箱验证码输入模态框 */}
          <VerificationCodeModal
            visible={showEmailVerificationModal}
            phoneNumber={emailForVerification}
            onClose={() => setShowEmailVerificationModal(false)}
            onVerify={handleEmailVerifyCode}
            onResend={handleResendEmailCode}
            isLoading={loading && loadingProvider === "username"}
          />

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={[styles.separatorText, typography.sectionTitle]}>OR</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Apple登录按钮 */}
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={[styles.button, styles.socialButton]}
              onPress={handleAppleSignIn}
              disabled={loading}
              accessibilityLabel={t("login.appleSignIn")}
              accessibilityHint={t("accessibility.button.continueHint")}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading }}
            >
              {loadingProvider === "apple" ? (
                <ActivityIndicator color="#1a1a1a" />
              ) : (
                <>
                  <Ionicons
                    name="logo-apple"
                    size={24}
                    color="#1a1a1a"
                    style={styles.buttonIcon}
                  />
                  <Text style={[styles.socialButtonText, typography.body]}>
                    {t("login.appleSignIn")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Google登录按钮 */}
          <TouchableOpacity
            style={[styles.button, styles.socialButton]}
            onPress={handleGoogleSignIn}
            disabled={loading}
            accessibilityLabel={t("login.googleSignIn")}
            accessibilityHint={t("accessibility.button.continueHint")}
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
          >
            {loadingProvider === "google" ? (
              <ActivityIndicator color="#1a1a1a" />
            ) : (
              <>
                <View style={styles.googleIconContainer}>
                  <GoogleIcon size={20} />
                </View>
                <Text style={[styles.socialButtonText, typography.body]}>
                  {t("login.googleSignIn")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

/**
 * 样式定义
 *
 * 理解样式:
 * - flex: 1 表示占满整个空间
 * - alignItems: 'center' 表示水平居中
 * - justifyContent: 'center' 表示垂直居中
 * - padding: 20 表示内边距20像素
 * - marginBottom: 10 表示底部外边距10像素
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF6ED",
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  header: {
    paddingTop: 56,
    paddingBottom: 20,
    alignItems: "center",
  },
  logo: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    color: "#332824",
    marginBottom: 0,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 6,
  },
  buttonSection: {
    width: "100%",
    gap: 12,
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#F2E3C2",
  },
  separatorText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: "#332824",
    // ✅ Font will be applied via Typography in component
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FCF0D6",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1a1a1a",
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  passwordInputContainer: {
    position: "relative",
    width: "100%",
  },
  passwordInput: {
    paddingRight: 50, // 为眼睛图标留出空间
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 15,
    padding: 4,
  },
  primaryButton: {
    backgroundColor: "#E56C45",
    marginTop: 8,
  },
  formErrorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 48, // 确保加载时高度不变
  },
  socialButton: {
    marginBottom: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FCF0D6",
    minHeight: 48,
  },
  buttonIcon: {
    marginRight: 8,
  },
  googleIconContainer: {
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  socialButtonText: {
    color: "#332824",
    fontSize: 14,
    fontWeight: "600",
  },
});
