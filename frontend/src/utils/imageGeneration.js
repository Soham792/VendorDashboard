/**
 * Generate a food image by searching the web based on dish name
 * @param {string} dishName - Name of the dish
 * @param {string} description - Description of the dish (optional)
 * @returns {Promise<string>} - Image URL
 */
export const generateFoodImage = async (dishName, description = '') => {
  try {
    console.log(`Generating image for: ${dishName}`);
    
    // Try sources in order of specificity - Pixabay first for exact matches
    const imageSources = [
      () => getPixabayImage(dishName),  // Most specific dish matching
      () => getUnsplashImage(dishName), // Good search capabilities
      () => getPexelsImage(dishName),   // Fallback with generic images
      () => getFoodiesFeedImage(dishName) // Random high-quality images
    ];

    // Try each source until we get a working image
    for (const getImage of imageSources) {
      try {
        const imageUrl = await getImage();
        if (imageUrl && await validateImage(imageUrl)) {
          console.log(`Successfully got image from source: ${imageUrl}`);
          return imageUrl;
        }
      } catch (error) {
        console.log(`Image source failed, trying next...`);
        continue;
      }
    }

    // If all sources fail, return a default image
    return generateDefaultFoodImage(dishName);
    
  } catch (error) {
    console.error('Error generating food image:', error);
    return generateDefaultFoodImage(dishName);
  }
};

/**
 * Get food image from Unsplash
 * @param {string} dishName - Name of the dish
 * @returns {Promise<string>} - Image URL
 */
const getUnsplashImage = async (dishName) => {
  try {
    // Clean the dish name and create search terms
    const cleanDishName = dishName.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    const searchTerms = [
      `${cleanDishName}-food`,
      `${cleanDishName}`,
      `indian-${cleanDishName}`,
      `${cleanDishName}-dish`
    ];
    
    // Try different search terms
    for (const term of searchTerms) {
      const imageUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(term)}`;
      
      // Return the URL directly - Unsplash handles the redirect
      if (await validateImage(imageUrl)) {
        return imageUrl;
      }
    }
    
    // Fallback to generic food image
    return 'https://source.unsplash.com/800x600/?food';
  } catch (error) {
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
const getPixabayImage = async (dishName) => {
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
    'butter chicken': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
    'tandoori chicken': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&h=600&fit=crop',
    'tandoori': 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&h=600&fit=crop',
    'masala': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop',
    'tikka masala': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
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
  
  // First try exact matches
  if (foodImages[dishLower]) {
    console.log(`Exact match found for: ${dishName}`);
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
    console.log(`Partial match found for: ${dishName} -> ${matches[0].key}`);
    return matches[0].imageUrl;
  }

  // Return a generic Indian food image if no match
  console.log(`No match found for: ${dishName}, using default`);
  return 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop';
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
 * Validate if an image URL is valid and loads properly
 * @param {string} imageUrl - Image URL to validate
 * @returns {Promise<boolean>} - Whether the image is valid
 */
export const validateImage = (imageUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = imageUrl;
    
    // Timeout after 5 seconds
    setTimeout(() => resolve(false), 5000);
  });
};
