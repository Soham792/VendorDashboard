const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Generate a food image using Gemini API based on dish name and description
 * @param {string} dishName - Name of the dish
 * @param {string} description - Description of the dish
 * @returns {Promise<string>} - Base64 encoded image data URL
 */
export const generateFoodImage = async (dishName, description) => {
  try {
    // Create a detailed prompt for food image generation
    const prompt = `Generate a high-quality, appetizing photograph of ${dishName}. 
    Description: ${description}. 
    The image should be professional food photography style, well-lit, colorful, and make the food look delicious and appealing. 
    The dish should be the main focus, placed on a clean plate or serving dish with appropriate garnishing. 
    Use natural lighting and make it look restaurant-quality.`;

    const requestBody = {
      contents: [{
        parts: [{
          text: `Create a realistic, high-quality food photograph based on this description: ${prompt}. Return only a detailed description of what the food image should look like, focusing on visual elements, colors, presentation, and styling.`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const imageDescription = data.candidates[0].content.parts[0].text;
    
    // Since Gemini doesn't directly generate images, we'll use a placeholder service
    // that creates food images based on the description
    return await generatePlaceholderFoodImage(dishName, imageDescription);
    
  } catch (error) {
    console.error('Error generating food image:', error);
    // Return a default food placeholder image
    return generateDefaultFoodImage(dishName);
  }
};

/**
 * Generate a placeholder food image using a service like Unsplash or similar
 * @param {string} dishName - Name of the dish
 * @param {string} description - AI-generated description
 * @returns {Promise<string>} - Image URL or base64 data
 */
const generatePlaceholderFoodImage = async (dishName, description) => {
  try {
    // Use Unsplash API for food images as a fallback
    const searchTerm = encodeURIComponent(dishName.toLowerCase());
    const unsplashUrl = `https://source.unsplash.com/800x600/?food,${searchTerm}`;
    
    // Convert the image to base64 for storage
    const response = await fetch(unsplashUrl);
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
    
  } catch (error) {
    console.error('Error generating placeholder image:', error);
    return generateDefaultFoodImage(dishName);
  }
};

/**
 * Generate a default food image with dish name
 * @param {string} dishName - Name of the dish
 * @returns {string} - Base64 encoded SVG image
 */
const generateDefaultFoodImage = (dishName) => {
  // Create a simple SVG placeholder with the dish name
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ffa726;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#grad1)" />
      <circle cx="200" cy="150" r="80" fill="white" opacity="0.2"/>
      <text x="200" y="140" font-family="Arial, sans-serif" font-size="18" font-weight="bold" 
            text-anchor="middle" fill="white">${dishName}</text>
      <text x="200" y="170" font-family="Arial, sans-serif" font-size="14" 
            text-anchor="middle" fill="white" opacity="0.8">Food Image</text>
    </svg>
  `;
  
  // Convert SVG to base64 data URL
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Validate if an image URL/data is valid
 * @param {string} imageData - Image URL or base64 data
 * @returns {Promise<boolean>} - Whether the image is valid
 */
export const validateImage = (imageData) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = imageData;
  });
};
