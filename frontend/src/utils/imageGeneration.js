const PEXELS_API_KEY = 'TfnrzFw3yVmcIRwC5YE4uBjKtqhVBTnB6CvdLEZrjkV2lrQ4qRFHZAi7'; // Free Pexels API key

/**
 * Generate a food image by searching the web based on dish name
 * @param {string} dishName - Name of the dish
 * @param {string} description - Description of the dish (optional)
 * @returns {Promise<string>} - Image URL
 */
export const generateFoodImage = async (dishName, description = '') => {
  try {
    console.log(`🍽️ Generating image for: "${dishName}"`);
    
    // First try Pexels API for real web search (most accurate)
    try {
      const pexelsImage = await searchPexelsAPI(dishName);
      if (pexelsImage) {
        console.log(`✅ Got image from Pexels API: ${pexelsImage}`);
        return pexelsImage;
      }
    } catch (error) {
      console.log(`❌ Pexels API search failed, trying curated database...`);
    }
    
    // Fallback to curated database for exact matches
    try {
      const curatedImage = await getCuratedFoodImage(dishName);
      if (curatedImage) {
        console.log(`✅ Got image from curated database: ${curatedImage}`);
        return curatedImage;
      }
    } catch (error) {
      console.log(`❌ Curated database search failed, trying Unsplash...`);
    }
    
    // Try direct Unsplash API search
    try {
      const unsplashImage = await searchUnsplashAPI(dishName);
      if (unsplashImage) {
        console.log(`✅ Got image from Unsplash API: ${unsplashImage}`);
        return unsplashImage;
      }
    } catch (error) {
      console.log(`❌ Unsplash API search failed...`);
    }

    // If all sources fail, return a working default image
    console.log(`⚠️ All sources failed, using default image for: ${dishName}`);
    return getWorkingDefaultImage(dishName);
    
  } catch (error) {
    console.error('❌ Error generating food image:', error);
    return getWorkingDefaultImage(dishName);
  }
};

/**
 * Search Pexels API for food images (like Google Image Search)
 * @param {string} dishName - Name of the dish
 * @returns {Promise<string>} - Image URL
 */
const searchPexelsAPI = async (dishName) => {
  try {
    console.log(`🔍 Searching Pexels API for: "${dishName}"`);
    
    const searchQuery = `${dishName} food`;
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': PEXELS_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.photos && data.photos.length > 0) {
      const imageUrl = data.photos[0].src.large;
      console.log(`✅ Found Pexels image: ${imageUrl}`);
      return imageUrl;
    }
    
    throw new Error('No images found on Pexels');
    
  } catch (error) {
    console.error('❌ Pexels API search failed:', error);
    throw error;
  }
};

/**
 * Search Unsplash API for food images
 * @param {string} dishName - Name of the dish
 * @returns {Promise<string>} - Image URL
 */
const searchUnsplashAPI = async (dishName) => {
  try {
    console.log(`🔍 Searching Unsplash API for: "${dishName}"`);
    
    // Use Unsplash's random photo API with specific search
    const searchQuery = `${dishName} food`;
    const url = `https://source.unsplash.com/800x600/?${encodeURIComponent(searchQuery)}`;
    
    console.log(`✅ Generated Unsplash URL: ${url}`);
    return url;
    
  } catch (error) {
    console.error('❌ Unsplash API search failed:', error);
    throw error;
  }
};

/**
 * Get a working default image that's guaranteed to load
 * @param {string} dishName - Name of the dish
 * @returns {string} - Image URL
 */
const getWorkingDefaultImage = (dishName) => {
  // Use a reliable food image from Pexels CDN
  const defaultImages = [
    'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
    'https://images.pexels.com/photos/1565982/pexels-photo-1565982.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
    'https://images.pexels.com/photos/1199957/pexels-photo-1199957.jpeg?auto=compress&cs=tinysrgb&w=800&h=600',
    'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=800&h=600'
  ];
  
  // Return a random default image
  const randomIndex = Math.floor(Math.random() * defaultImages.length);
  return defaultImages[randomIndex];
};


/**
 * Get food image from Unsplash
 * @param {string} dishName - Name of the dish
 * @returns {Promise<string>} - Image URL
 */
const getUnsplashImage = async (dishName) => {
  try {
    console.log(`🔍 Searching Unsplash for: "${dishName}"`);
    
    // Clean the dish name and create multiple search variations
    const cleanDishName = dishName.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    const words = cleanDishName.split(' ').filter(word => word.length > 2);
    
    const searchTerms = [
      // Exact dish name
      cleanDishName,
      // With food keyword
      `${cleanDishName} food`,
      // Individual words for complex dishes
      ...words,
      // Indian cuisine specific
      `indian ${cleanDishName}`,
      // Generic food terms
      'indian food',
      'delicious food',
      'restaurant food'
    ];
    
    // Try each search term
    for (const term of searchTerms) {
      try {
        const encodedTerm = encodeURIComponent(term);
        const imageUrl = `https://source.unsplash.com/800x600/?${encodedTerm}`;
        
        console.log(`🔍 Trying Unsplash search: "${term}"`);
        
        // Test if the image loads
        if (await validateImage(imageUrl)) {
          console.log(`✅ Unsplash image found for term: "${term}"`);
          return imageUrl;
        }
      } catch (error) {
        console.log(`❌ Unsplash search failed for: "${term}"`);
        continue;
      }
    }
    
    // Final fallback
    const fallbackUrl = 'https://source.unsplash.com/800x600/?food,delicious';
    console.log(`⚠️ Using Unsplash fallback image`);
    return fallbackUrl;
    
  } catch (error) {
    console.error('❌ Unsplash search completely failed:', error);
    throw new Error('Unsplash image not available');
  }
};

/**
 * Get food image from Pexels (using their free API)
 * @param {string} dishName - Name of the dish
 * @returns {Promise<string>} - Image URL
 */
const getPexelsImage = async (dishName) => {
  try {
    const searchTerm = encodeURIComponent(`${dishName} food`);
    // Using Pexels free image service
    const imageUrl = `https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop`;
    
    // For now, return a generic food image from Pexels
    // In production, you'd want to use their API with proper search
    return imageUrl;
  } catch (error) {
    throw new Error('Pexels image not available');
  }
};

/**
 * Get food image from Pixabay (using their free service)
 * @param {string} dishName - Name of the dish
 * @returns {Promise<string>} - Image URL
 */
const getCuratedFoodImage = async (dishName) => {
  // Using high-quality, specific food images from various sources
  const foodImages = {
    // Indian dishes with real images
    'pav bhaji': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&h=600&fit=crop',
    'bhaji': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&h=600&fit=crop',
    'pav': 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&h=600&fit=crop',
    'dosa': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&h=600&fit=crop',
    'masala dosa': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&h=600&fit=crop',
    'biryani': 'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=800&h=600&fit=crop',
    'chicken biryani': 'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=800&h=600&fit=crop',
    'curry': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
    'dal': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop',
    'dal tadka': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop',
    'roti': 'https://images.unsplash.com/photo-1574653853027-5d5b25b5e5d8?w=800&h=600&fit=crop',
    'chapati': 'https://images.unsplash.com/photo-1574653853027-5d5b25b5e5d8?w=800&h=600&fit=crop',
    'naan': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&h=600&fit=crop',
    'garlic naan': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&h=600&fit=crop',
    'samosa': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&h=600&fit=crop',
    'idli': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&h=600&fit=crop',
    'vada': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&h=600&fit=crop',
    'medu vada': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&h=600&fit=crop',
    'poha': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=600&fit=crop',
    'upma': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=600&fit=crop',
    'paratha': 'https://images.unsplash.com/photo-1574653853027-5d5b25b5e5d8?w=800&h=600&fit=crop',
    'aloo paratha': 'https://images.unsplash.com/photo-1574653853027-5d5b25b5e5d8?w=800&h=600&fit=crop',
    'chole': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
    'chole bhature': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
    'rajma': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
    'paneer': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&h=600&fit=crop',
    'paneer butter masala': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&h=600&fit=crop',
    'butter chicken': 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&h=600&fit=crop',
    'butter chicken with naan': 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&h=600&fit=crop',
    'chicken with naan': 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&h=600&fit=crop',
    'tandoori chicken': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&h=600&fit=crop',
    'tandoori': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&h=600&fit=crop',
    'masala': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
    'tikka masala': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
    'chicken tikka masala': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
    'palak paneer': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&h=600&fit=crop',
    
    // International dishes
    'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop',
    'margherita pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=600&fit=crop',
    'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
    'cheeseburger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
    'pasta': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&h=600&fit=crop',
    'spaghetti': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&h=600&fit=crop',
    'rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&h=600&fit=crop',
    'fried rice': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop',
    'chicken': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&h=600&fit=crop',
    'grilled chicken': 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&h=600&fit=crop',
    'fish': 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=600&fit=crop',
    'grilled fish': 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=800&h=600&fit=crop',
    'salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop',
    'caesar salad': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop',
    'soup': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&h=600&fit=crop',
    'tomato soup': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&h=600&fit=crop',
    'bread': 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&h=600&fit=crop',
    'cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop',
    'chocolate cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop',
    'sandwich': 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=800&h=600&fit=crop',
    'club sandwich': 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=800&h=600&fit=crop',
    'noodles': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop',
    'ramen': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop',
    'steak': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&h=600&fit=crop',
    'eggs': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&h=600&fit=crop',
    'scrambled eggs': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&h=600&fit=crop'
  };

  // Clean and normalize dish name for better matching
  const dishLower = dishName.toLowerCase().trim();
  
  console.log(`🔍 Searching curated database for: "${dishName}"`);
  
  // First try exact matches
  if (foodImages[dishLower]) {
    console.log(`✅ Exact match found in database: ${dishName} -> ${dishLower}`);
    return foodImages[dishLower];
  }
  
  // Then try partial matches - prioritize longer matches
  const matches = [];
  for (const [key, imageUrl] of Object.entries(foodImages)) {
    if (dishLower.includes(key) || key.includes(dishLower)) {
      matches.push({ key, imageUrl, score: key.length });
    }
  }
  
  if (matches.length > 0) {
    // Sort by score (longer matches first) and return the best match
    matches.sort((a, b) => b.score - a.score);
    console.log(`✅ Partial match found in database: ${dishName} -> ${matches[0].key}`);
    return matches[0].imageUrl;
  }

  // No match found in curated database
  console.log(`❌ No match found in database for: ${dishName}`);
  throw new Error('No match in curated database');
};

/**
 * Get food image from FoodiesFeed (free food images)
 * @param {string} dishName - Name of the dish
 * @returns {Promise<string>} - Image URL
 */
const getFoodiesFeedImage = async (dishName) => {
  // FoodiesFeed has high-quality free food images
  const foodiesFeedImages = [
    'https://www.foodiesfeed.com/wp-content/uploads/2019/06/top-view-for-box-of-2-burgers-home-made-600x899.jpg',
    'https://www.foodiesfeed.com/wp-content/uploads/2019/04/mae-mu-oranges-ice-600x750.jpg',
    'https://www.foodiesfeed.com/wp-content/uploads/2019/02/messy-pizza-on-a-black-table-600x400.jpg',
    'https://www.foodiesfeed.com/wp-content/uploads/2020/08/detail-of-pavlova-strawberry-piece-of-cake-600x800.jpg'
  ];

  // Return a random high-quality food image
  const randomIndex = Math.floor(Math.random() * foodiesFeedImages.length);
  return foodiesFeedImages[randomIndex];
};

/**
 * Generate a default food image with dish name
 * @param {string} dishName - Name of the dish
 * @returns {string} - Base64 encoded SVG image
 */
const generateDefaultFoodImage = (dishName) => {
  // Create a beautiful SVG placeholder with the dish name
  const svg = `
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#ffa726;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ff5722;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow">
          <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      <rect width="800" height="600" fill="url(#grad1)" />
      <circle cx="400" cy="300" r="120" fill="white" opacity="0.2"/>
      <circle cx="400" cy="300" r="80" fill="white" opacity="0.3"/>
      
      <!-- Food icon -->
      <path d="M400 220 L420 240 L400 260 L380 240 Z" fill="white" opacity="0.8"/>
      <circle cx="400" cy="280" r="15" fill="white" opacity="0.8"/>
      
      <text x="400" y="340" font-family="Arial, sans-serif" font-size="28" font-weight="bold" 
            text-anchor="middle" fill="white" filter="url(#shadow)">${dishName}</text>
      <text x="400" y="370" font-family="Arial, sans-serif" font-size="16" 
            text-anchor="middle" fill="white" opacity="0.9">Delicious Food</text>
    </svg>
  `;
  
  // Convert SVG to base64 data URL
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Validate if an image URL is valid
 * @param {string} imageUrl - Image URL to validate
 * @returns {Promise<boolean>} - Whether the image is valid
 */
export const validateImage = (imageUrl) => {
  // For Pexels and other CDN images, we trust they will work
  // Skip validation to avoid CORS issues
  if (!imageUrl || typeof imageUrl !== 'string') {
    return Promise.resolve(false);
  }
  
  // If it's from a known reliable source, trust it
  if (imageUrl.includes('pexels.com') || 
      imageUrl.includes('unsplash.com') || 
      imageUrl.includes('images.unsplash.com')) {
    console.log(`✅ Trusted image source, skipping validation: ${imageUrl}`);
    return Promise.resolve(true);
  }
  
  // For other sources, do basic validation
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      console.log(`✅ Image validated: ${imageUrl}`);
      resolve(true);
    };
    
    img.onerror = () => {
      console.log(`❌ Image validation failed: ${imageUrl}`);
      resolve(false);
    };
    
    img.src = imageUrl;
    
    // Shorter timeout
    setTimeout(() => resolve(false), 3000);
  });
};
