/**
 * 图片日记 Modal - 极简设计
 * 
 * 功能：选择图片 → 显示预览 → 添加语音/文字（可选）→ 保存
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { createImageOnlyDiary } from "../services/diaryService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const THUMBNAIL_SIZE = (SCREEN_WIDTH - 80) / 3; // 3列

interface ImageDiaryModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  maxImages?: number;
}

export default function ImageDiaryModal({
  visible,
  onClose,
  onSuccess,
  maxImages = 9,
}: ImageDiaryModalProps) {
  const [images, setImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false); // 显示底部选择器
  const [showConfirmModal, setShowConfirmModal] = useState(false); // 显示确认弹窗

  // Modal 打开时，显示底部选择器
  useEffect(() => {
    if (visible && images.length === 0) {
      setShowPicker(true);
    }
  }, [visible]);

  // 拍照
  const handleTakePhoto = async () => {
    setShowPicker(false); // 关闭选择器
    
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("需要相机权限", "请在设置中允许访问相机");
        onClose();
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        onClose();
        return;
      }

      setImages([result.assets[0].uri]);
    } catch (error) {
      console.error("拍照失败:", error);
      Alert.alert("拍照失败", "请重试");
      onClose();
    }
  };

  // 从相册选择
  const handlePickFromGallery = async () => {
    setShowPicker(false); // 关闭选择器
    
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("需要相册权限", "请在设置中允许访问相册");
        onClose();
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: maxImages,
      });

      if (result.canceled || !result.assets?.length) {
        onClose();
        return;
      }

      const uris = result.assets.map((asset) => asset.uri);
      setImages(uris);
    } catch (error) {
      console.error("选择图片失败:", error);
      Alert.alert("选择失败", "请重试");
      onClose();
    }
  };

  // 取消选择
  const handlePickerCancel = () => {
    setShowPicker(false);
    setImages([]);
    onClose();
  };

  // 添加更多图片
  const handleAddMore = async () => {
    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      Alert.alert("提示", `最多只能选择${maxImages}张图片`);
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("需要相册权限", "请在设置中允许访问相册");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: remaining,
      });

      if (!result.canceled && result.assets?.length) {
        const newUris = result.assets.map((asset) => asset.uri);
        setImages([...images, ...newUris]);
      }
    } catch (error) {
      console.error("添加图片失败:", error);
      Alert.alert("添加失败", "请重试");
    }
  };

  // 删除图片
  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    if (newImages.length === 0) {
      Alert.alert("提示", "至少需要一张图片", [
        { text: "取消", onPress: onClose, style: "cancel" },
        { text: "重新选择", onPress: () => setShowPicker(true) },
      ]);
    } else {
      setImages(newImages);
    }
  };

  // 保存纯图片日记
  const handleSave = async () => {
    if (images.length === 0) {
      Alert.alert("提示", "请至少选择一张图片");
      return;
    }

    // 显示确认弹窗
    setShowConfirmModal(true);
  };

  const doSave = async () => {
    setIsSaving(true);
    try {
      await createImageOnlyDiary(images);
      Alert.alert("成功", "图片日记已保存", [
        {
          text: "好的",
          onPress: () => {
            setImages([]);
            setShowPicker(false);
            setIsSaving(false);
            onSuccess();
          },
        },
      ]);
    } catch (error: any) {
      console.error("保存失败:", error);
      Alert.alert("保存失败", error.message || "请重试");
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setImages([]);
    setShowPicker(false);
    onClose();
  };

  // 如果没有图片，不渲染内容
  if (!visible) return null;

  // 显示底部选择器
  if (showPicker) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={handlePickerCancel}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerTitle}>选择图片</Text>

              <TouchableOpacity style={styles.pickerOption} onPress={handleTakePhoto}>
                <Text style={styles.pickerOptionText}>📷 拍照</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pickerOption} onPress={handlePickFromGallery}>
                <Text style={styles.pickerOptionText}>🖼️ 从相册选择</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pickerCancel} onPress={handlePickerCancel}>
                <Text style={styles.pickerCancelText}>取消</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }

  // 如果正在加载图片
  if (images.length === 0) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#E56C45" />
        </View>
      </Modal>
    );
  }

  // 显示图片预览界面
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* 顶部栏 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.title}>图片日记</Text>
            <TouchableOpacity onPress={handleSave} disabled={isSaving}>
              <Text style={[styles.saveText, isSaving && styles.saveTextDisabled]}>
                {isSaving ? "保存中..." : "完成"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 图片网格 */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.imageGrid}
            showsVerticalScrollIndicator={false}
          >
            {images.map((uri, index) => (
              <View key={`${uri}-${index}`} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.thumbnail} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}

            {images.length < maxImages && (
              <TouchableOpacity style={styles.addButton} onPress={handleAddMore}>
                <Ionicons name="add" size={36} color="#999" />
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* 确认弹窗 */}
        {showConfirmModal && (
          <Modal visible={showConfirmModal} transparent animationType="fade">
            <TouchableOpacity
              style={styles.confirmOverlay}
              activeOpacity={1}
              onPress={() => setShowConfirmModal(false)}
            >
              <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                <View style={styles.confirmContainer}>
                  {/* 右上角关闭按钮 */}
                  <TouchableOpacity
                    style={styles.confirmCloseButton}
                    onPress={() => setShowConfirmModal(false)}
                  >
                    <Ionicons name="close" size={24} color="#999" />
                  </TouchableOpacity>

                  <Text style={styles.confirmTitle}>温馨提示</Text>
                  <Text style={styles.confirmMessage}>
                    要不要添加一些文字或语音，让这个时刻更完整？
                  </Text>

                  <View style={styles.confirmButtons}>
                    <TouchableOpacity
                      style={[styles.confirmButton, styles.confirmButtonSecondary]}
                      onPress={() => {
                        setShowConfirmModal(false);
                        doSave();
                      }}
                    >
                      <Text style={styles.confirmButtonTextSecondary}>就这样保存</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.confirmButton, styles.confirmButtonPrimary]}
                      onPress={() => {
                        setShowConfirmModal(false);
                        // TODO: 打开文字/语音输入
                        Alert.alert("提示", "此功能即将上线");
                      }}
                    >
                      <Text style={styles.confirmButtonTextPrimary}>添加内容</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // 底部选择器样式
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  pickerOption: {
    backgroundColor: "#F5F5F5",
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  pickerOptionText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    color: "#333",
  },
  pickerCancel: {
    marginTop: 8,
    padding: 18,
  },
  pickerCancelText: {
    fontSize: 16,
    textAlign: "center",
    color: "#999",
  },
  
  // 图片预览界面样式
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: SCREEN_HEIGHT - 80,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  cancelText: {
    fontSize: 16,
    color: "#999",
  },
  saveText: {
    fontSize: 16,
    color: "#E56C45",
    fontWeight: "600",
  },
  saveTextDisabled: {
    color: "#ccc",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    paddingTop: 20,
    paddingBottom: 40,
  },
  imageWrapper: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
  },
  addButton: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  
  // 确认弹窗样式
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  confirmContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    position: "relative",
  },
  confirmCloseButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 10,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  confirmMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonSecondary: {
    backgroundColor: "#F5F5F5",
  },
  confirmButtonPrimary: {
    backgroundColor: "#E56C45",
  },
  confirmButtonTextSecondary: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  confirmButtonTextPrimary: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

