/**
 * Image Grid Layout System
 * 
 * Production-grade responsive image grid with proper spacing calculations
 * 
 * Design Principles:
 * 1. Consistent horizontal padding (24px)
 * 2. Equal spacing between images (8px)
 * 3. Dynamic image size based on available width
 * 4. Perfect alignment with no awkward gaps
 * 5. Support for different grid layouts (2, 3, 4 columns)
 */

import { Dimensions } from 'react-native';

// ============================================================================
// Constants
// ============================================================================

const SCREEN_WIDTH = Dimensions.get('window').width;

// Design system spacing
export const SPACING = {
  HORIZONTAL_PADDING: 24,  // Page horizontal padding
  IMAGE_GAP: 8,            // Gap between images
  CARD_PADDING: 24,        // Padding inside diary card
} as const;

// ============================================================================
// Grid Layout Calculator
// ============================================================================

/**
 * Calculate optimal image size for a grid layout
 * 
 * Formula:
 * availableWidth = screenWidth - (2 × horizontalPadding)
 * totalGapWidth = (columns - 1) × gap
 * imageSize = (availableWidth - totalGapWidth) / columns
 * 
 * @param columns - Number of columns in the grid
 * @param horizontalPadding - Total horizontal padding (left + right)
 * @param gap - Gap between images
 * @returns Calculated image size (floored to avoid sub-pixel rendering)
 */
export function calculateImageSize(
  columns: number,
  horizontalPadding: number = SPACING.HORIZONTAL_PADDING * 2,
  gap: number = SPACING.IMAGE_GAP
): number {
  const availableWidth = SCREEN_WIDTH - horizontalPadding;
  const totalGapWidth = (columns - 1) * gap;
  const imageSize = (availableWidth - totalGapWidth) / columns;
  
  // Floor to avoid sub-pixel rendering issues
  return Math.floor(imageSize);
}

// ============================================================================
// Pre-calculated Sizes for Common Layouts
// ============================================================================

/**
 * Diary List Screen - 3 column grid
 * Used in: DiaryListScreen.tsx
 * 
 * Context: Inside diary card with 24px card padding
 * Total horizontal padding: 24px (page) × 2 + 24px (card) × 2 = 96px
 */
export const DIARY_LIST_IMAGE_SIZE = calculateImageSize(
  3,  // 3 columns
  SPACING.HORIZONTAL_PADDING * 2 + SPACING.CARD_PADDING * 2,  // 96px total
  SPACING.IMAGE_GAP
);

/**
 * Image Diary Modal - 4 column grid
 * Used in: ImageDiaryModal.tsx (picker view)
 * 
 * Context: Full screen modal with page padding
 * Total horizontal padding: 20px × 2 = 40px (keeping original 20px for image picker)
 */
export const IMAGE_PICKER_SIZE = calculateImageSize(
  4,  // 4 columns
  20 * 2,  // 40px total (original design)
  SPACING.IMAGE_GAP
);

/**
 * Diary Detail Screen - Dynamic based on image count
 * Used in: DiaryDetailScreen.tsx
 * 
 * Context: Inside content area with 24px page padding
 * Total horizontal padding: 24px × 2 = 48px
 */
export function getDetailImageSize(imageCount: number): number {
  // 1-3 images: 3 columns for better visibility
  // 4+ images: 4 columns for compact layout
  const columns = imageCount <= 3 ? 3 : 4;
  
  return calculateImageSize(
    columns,
    SPACING.HORIZONTAL_PADDING * 2,  // 48px total
    SPACING.IMAGE_GAP
  );
}

// ============================================================================
// Grid Layout Helpers
// ============================================================================

/**
 * Calculate if an image is the last in its row
 * Useful for removing right margin on last item
 */
export function isLastInRow(index: number, columns: number): boolean {
  return (index + 1) % columns === 0;
}

/**
 * Calculate if an image is in the last row
 * Useful for removing bottom margin on last row
 */
export function isInLastRow(index: number, totalCount: number, columns: number): boolean {
  const lastRowStartIndex = Math.floor((totalCount - 1) / columns) * columns;
  return index >= lastRowStartIndex;
}

/**
 * Get grid style object for a specific layout
 */
export function getGridStyle(columns: number) {
  return {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: SPACING.IMAGE_GAP,
    marginTop: 0,
    marginBottom: 12,  // Standard spacing below image grid
  };
}

/**
 * Get image wrapper style for a specific size
 */
export function getImageWrapperStyle(size: number) {
  return {
    width: size,
    height: size,
    borderRadius: 8,
    overflow: 'hidden' as const,
    backgroundColor: '#f0f0f0',  // Placeholder color while loading
  };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate that grid calculations are correct
 * This helps catch layout bugs during development
 */
export function validateGridLayout(
  columns: number,
  imageSize: number,
  horizontalPadding: number,
  gap: number
): boolean {
  const totalGapWidth = (columns - 1) * gap;
  const totalImageWidth = columns * imageSize;
  const calculatedWidth = totalImageWidth + totalGapWidth;
  const availableWidth = SCREEN_WIDTH - horizontalPadding;
  
  // Allow 1px tolerance for rounding
  const isValid = Math.abs(calculatedWidth - availableWidth) <= 1;
  
  if (!isValid) {
    console.warn('Grid layout validation failed:', {
      columns,
      imageSize,
      horizontalPadding,
      gap,
      calculatedWidth,
      availableWidth,
      difference: calculatedWidth - availableWidth,
    });
  }
  
  return isValid;
}

// ============================================================================
// Debug Helper
// ============================================================================

/**
 * Log grid layout information for debugging
 * Call this during development to verify calculations
 */
export function debugGridLayout(name: string, columns: number, size: number) {
  if (__DEV__) {
    console.log(`📐 Grid Layout: ${name}`, {
      screenWidth: SCREEN_WIDTH,
      columns,
      imageSize: size,
      gap: SPACING.IMAGE_GAP,
      totalWidth: columns * size + (columns - 1) * SPACING.IMAGE_GAP,
    });
  }
}
