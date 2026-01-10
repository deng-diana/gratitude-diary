    const renderImageGrid = (imageUrls: string[]) => {
      if (!imageUrls.length) return null;

      // ============================================================================
      // Image Grid Layout - Best Practice Design
      // ============================================================================
      //
      // Requirements:
      // 1. Single row only (no wrapping)
      // 2. Max 3 images displayed
      // 3. If ≥3 images, show first 3 with "+N" badge on 3rd image
      // 4. Consistent height for all layouts (1, 2, or 3 images)
      // 5. Height calculated based on 3-column scenario
      // 6. Width adjusts dynamically based on image count
      // 7. 24px distance from card edges (left and right)
      //
      // Context:
      // - Card has 24px padding
      // - Page has 24px horizontal margin
      // - Total horizontal padding: 24 + 24 + 24 + 24 = 96px
      //
      // Calculation:
      // availableWidth = screenWidth - 96px
      // height = (availableWidth - 2 gaps × 8px) / 3  [based on 3-column]
      //
      // For 1 image: width = availableWidth, height = calculated height
      // For 2 images: width = (availableWidth - 8px) / 2, height = calculated height
      // For 3+ images: width = (availableWidth - 16px) / 3, height = calculated height
      //

      const GAP = 8;
      const CARD_PADDING = 24;
      const PAGE_MARGIN = 24;
      const TOTAL_HORIZONTAL_PADDING = (CARD_PADDING + PAGE_MARGIN) * 2; // 96px
      
      const screenWidth = Dimensions.get("window").width;
      const availableWidth = screenWidth - TOTAL_HORIZONTAL_PADDING;
      
      // Calculate height based on 3-column layout (the standard)
      const IMAGE_HEIGHT = Math.floor((availableWidth - 2 * GAP) / 3);
      
      const imageCount = imageUrls.length;
      const displayCount = Math.min(imageCount, 3); // Max 3 images
      const hasMore = imageCount > 3;
      const remainingCount = imageCount - 3;

      // Calculate width based on actual display count
      let imageWidth: number;
      if (displayCount === 1) {
        imageWidth = availableWidth;
      } else if (displayCount === 2) {
        imageWidth = Math.floor((availableWidth - GAP) / 2);
      } else {
        imageWidth = Math.floor((availableWidth - 2 * GAP) / 3);
      }

      return (
        <View style={{ flexDirection: "row", gap: GAP }}>
          {imageUrls.slice(0, displayCount).map((url, index) => {
            const isLast = index === displayCount - 1;
            const showBadge = isLast && hasMore;

            return (
              <Pressable
                key={index}
                onPress={(event) => {
                  event?.stopPropagation?.();
                  setImagePreviewUrls(imageUrls);
                  setImagePreviewIndex(index);
                  setImagePreviewVisible(true);
                }}
                style={{
                  width: imageWidth,
                  height: IMAGE_HEIGHT,
                  borderRadius: 8,
                  overflow: "hidden",
                  backgroundColor: "#f0f0f0",
                }}
              >
                <Image
                  source={{ uri: url }}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  resizeMode="cover"
                />
                
                {/* "+N" Badge for remaining images */}
                {showBadge && (
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 20,
                        fontWeight: "600",
                      }}
                    >
                      +{remainingCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      );
    };
