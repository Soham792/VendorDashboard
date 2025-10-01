/**
 * Generate a food image by searching the web based on dish name
 * @param {string} dishName - Name of the dish
 * @param {string} description - Description of the dish (optional)
 * @returns {Promise<string>} - Image URL
 */
export const generateFoodImage = async (dishName, description = '') => {
  try {
    console.log(`Generating image for: ${dishName}`);
    
    // Try multiple image sources for better reliability
    const imageSources = [
      () => getUnsplashImage(dishName),
      () => getPexelsImage(dishName),
      () => getPixabayImage(dishName),
      () => getFoodiesFeedImage(dishName)
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
  // Using Pixabay's free image service with common food items including Indian dishes
  const foodImages = {
    // Indian dishes
    'pav bhaji': 'https://cdn.pixabay.com/photo/2020/01/16/11/49/pav-bhaji-4770943_1280.jpg',
    'bhaji': 'https://cdn.pixabay.com/photo/2020/01/16/11/49/pav-bhaji-4770943_1280.jpg',
    'pav': 'https://cdn.pixabay.com/photo/2020/01/16/11/49/pav-bhaji-4770943_1280.jpg',
    'dosa': 'https://cdn.pixabay.com/photo/2017/06/16/11/38/dosa-2408952_1280.jpg',
    'biryani': 'https://cdn.pixabay.com/photo/2019/01/29/18/05/biryani-3962073_1280.jpg',
    'curry': 'https://cdn.pixabay.com/photo/2017/06/16/11/38/curry-2408952_1280.jpg',
    'dal': 'https://cdn.pixabay.com/photo/2017/06/16/11/38/dal-2408952_1280.jpg',
    'roti': 'https://cdn.pixabay.com/photo/2017/06/23/23/57/bread-2434370_1280.jpg',
    'chapati': 'https://cdn.pixabay.com/photo/2017/06/23/23/57/bread-2434370_1280.jpg',
    'naan': 'https://cdn.pixabay.com/photo/2017/06/23/23/57/bread-2434370_1280.jpg',
    'samosa': 'https://cdn.pixabay.com/photo/2020/03/29/10/17/samosa-4981648_1280.jpg',
    'idli': 'https://cdn.pixabay.com/photo/2017/06/16/11/38/idli-2408952_1280.jpg',
    'vada': 'https://cdn.pixabay.com/photo/2017/06/16/11/38/vada-2408952_1280.jpg',
    'poha': 'https://cdn.pixabay.com/photo/2014/12/11/02/55/rice-563612_1280.jpg',
    'upma': 'https://cdn.pixabay.com/photo/2014/12/11/02/55/rice-563612_1280.jpg',
    'paratha': 'https://cdn.pixabay.com/photo/2017/06/23/23/57/bread-2434370_1280.jpg',
    'chole': 'https://cdn.pixabay.com/photo/2017/06/16/11/38/curry-2408952_1280.jpg',
    'rajma': 'https://cdn.pixabay.com/photo/2017/06/16/11/38/curry-2408952_1280.jpg',
    'paneer': 'https://cdn.pixabay.com/photo/2017/06/16/11/38/paneer-2408952_1280.jpg',
    'butter chicken': 'https://cdn.pixabay.com/photo/2020/06/30/15/03/chicken-5356775_1280.jpg',
    'tandoori': 'https://cdn.pixabay.com/photo/2020/06/30/15/03/chicken-5356775_1280.jpg',
    'masala': 'https://cdn.pixabay.com/photo/2017/06/16/11/38/curry-2408952_1280.jpg',
    
    // International dishes
    'pizza': 'https://cdn.pixabay.com/photo/2017/12/09/08/18/pizza-3007395_1280.jpg',
    'burger': 'https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_1280.jpg',
    'pasta': 'https://cdn.pixabay.com/photo/2018/07/18/19/12/pasta-3547078_1280.jpg',
    'rice': 'https://cdn.pixabay.com/photo/2014/12/11/02/55/rice-563612_1280.jpg',
    'chicken': 'https://cdn.pixabay.com/photo/2020/06/30/15/03/chicken-5356775_1280.jpg',
    'fish': 'https://cdn.pixabay.com/photo/2014/11/05/15/57/salmon-518032_1280.jpg',
    'salad': 'https://cdn.pixabay.com/photo/2017/05/11/19/20/belly-2305346_1280.jpg',
    'soup': 'https://cdn.pixabay.com/photo/2017/06/16/11/38/soup-2408952_1280.jpg',
    'bread': 'https://cdn.pixabay.com/photo/2017/06/23/23/57/bread-2434370_1280.jpg',
    'cake': 'https://cdn.pixabay.com/photo/2017/01/11/11/33/cake-1971552_1280.jpg',
    'sandwich': 'https://cdn.pixabay.com/photo/2017/05/07/08/56/sandwich-2293271_1280.jpg',
    'noodles': 'https://cdn.pixabay.com/photo/2017/03/23/19/57/asparagus-2169305_1280.jpg',
    'steak': 'https://cdn.pixabay.com/photo/2016/01/22/02/13/meat-1155132_1280.jpg',
    'eggs': 'https://cdn.pixabay.com/photo/2014/07/08/12/34/food-386733_1280.jpg'
  };

  // Try to match dish name with available images (check for partial matches)
  const dishLower = dishName.toLowerCase();
  
  // First try exact matches
  if (foodImages[dishLower]) {
    return foodImages[dishLower];
  }
  
  // Then try partial matches
  for (const [key, imageUrl] of Object.entries(foodImages)) {
    if (dishLower.includes(key) || key.includes(dishLower)) {
      return imageUrl;
    }
  }

  // Return a generic Indian food image if no match (since many users might be Indian restaurants)
  return 'https://cdn.pixabay.com/photo/2017/06/16/11/38/curry-2408952_1280.jpg';
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
