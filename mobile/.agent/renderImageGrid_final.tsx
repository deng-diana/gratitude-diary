    const renderImageGrid = (imageUrls: string[]) => {
      if (!imageUrls.length) return null;

      // ============================================================================
      // Best Practice Image Grid Layout
      // ============================================================================
      // Requirements:
      // - Single row only (no wrapping)
      // - Max 3 images displayed
      // - If ≥3 images, show "+N" badge on 3rd image
      // - Consistent height for all layouts (1, 2, or 3 images)
      // - Height calculated based on 3-column scenario
      // - Width adjusts dynamically based on image count
      // - 24px distance from card edges
      //
      const GAP = 8;
      const CARD_PADDING = 24;
      const PAGE_MARGIN = 24;
      const TOTAL_HORIZONTAL_PADDING = (CARD_PADDING + PAGE_MARGIN) * 2; // 96px
      
      const screenWidth = Dimensions.get("window").width;
      const availableWidth = screenWidth - TOTAL_HORIZONTAL_PADDING;
      
      // Height based on 3-column layout (standard)
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
        <View style={{ flexDirection: "row" }}>
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
                  marginRight: isLast ? 0 : GAP,
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
