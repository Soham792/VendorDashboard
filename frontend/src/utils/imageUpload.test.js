/**
 * Test file for image upload utilities
 * This is a simple test to verify our image upload functions work correctly
 */

import { validateImageFile, convertToBase64, createImagePreview } from './imageUpload.js';

// Mock File constructor for testing
class MockFile {
  constructor(name, size, type) {
    this.name = name;
    this.size = size;
    this.type = type;
  }
}

// Test validation function
export const testImageValidation = () => {
  console.log('🧪 Testing image validation...');
  
  // Test valid image
  const validImage = new MockFile('test.jpg', 1024 * 1024, 'image/jpeg'); // 1MB JPEG
  const validResult = validateImageFile(validImage);
  console.log('✅ Valid image test:', validResult.isValid ? 'PASSED' : 'FAILED');
  
  // Test oversized image
  const oversizedImage = new MockFile('big.jpg', 6 * 1024 * 1024, 'image/jpeg'); // 6MB
  const oversizedResult = validateImageFile(oversizedImage);
  console.log('✅ Oversized image test:', !oversizedResult.isValid ? 'PASSED' : 'FAILED');
  
  // Test invalid file type
  const invalidType = new MockFile('document.pdf', 1024, 'application/pdf');
  const invalidResult = validateImageFile(invalidType);
  console.log('✅ Invalid type test:', !invalidResult.isValid ? 'PASSED' : 'FAILED');
  
  // Test no file
  const noFileResult = validateImageFile(null);
  console.log('✅ No file test:', !noFileResult.isValid ? 'PASSED' : 'FAILED');
  
  console.log('🎉 Image validation tests completed!');
};

// Export for potential use in browser console
if (typeof window !== 'undefined') {
  window.testImageUpload = testImageValidation;
}
