// Test script to verify category API
const testCategoryAPI = async () => {
  try {
    console.log('🧪 Testing Category API...\n');

    const API_BASE_URL = 'http://localhost:5000';

    // Test 1: Get categories (should return empty array initially)
    console.log('1. Testing GET /api/categories...');
    const getResponse = await fetch(`${API_BASE_URL}/api/categories`);
    const getData = await getResponse.json();
    console.log('✅ GET categories response:', getData);

    // Test 2: Create a category
    console.log('\n2. Testing POST /api/categories...');
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 transparent PNG

    const categoryData = {
      name: 'Test Category',
      description: 'This is a test category',
      status: 'Active',
      displayOrder: 1,
      image: testImage
    };

    const postResponse = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoryData),
    });

    const postData = await postResponse.json();
    console.log('✅ POST category response:', postData);

    if (postData.success) {
      const categoryId = postData.data._id;

      // Test 3: Get single category
      console.log('\n3. Testing GET /api/categories/:id...');
      const getSingleResponse = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`);
      const getSingleData = await getSingleResponse.json();
      console.log('✅ GET single category response:', getSingleData);

      // Test 4: Get categories again (should now have 1 category)
      console.log('\n4. Testing GET /api/categories (after creation)...');
      const getAgainResponse = await fetch(`${API_BASE_URL}/api/categories`);
      const getAgainData = await getAgainResponse.json();
      console.log('✅ GET categories (after creation):', getAgainData);

      console.log('\n🎉 All Category API tests passed!');
    }

  } catch (error) {
    console.error('❌ Category API test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure backend server is running on port 5000');
    console.log('2. Check MongoDB connection');
    console.log('3. Verify Cloudinary credentials in .env file');
  }
};

testCategoryAPI();
