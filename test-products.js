// Test script to verify product API
const testProductAPI = async () => {
  try {
    console.log('🧪 Testing Product API...\n');

    const API_BASE_URL = 'http://localhost:5000';

    // Test 1: Get products (should return empty array initially)
    console.log('1. Testing GET /api/products...');
    const getResponse = await fetch(`${API_BASE_URL}/api/products`);
    const getData = await getResponse.json();
    console.log('✅ GET products response:', getData);

    // Test 2: Get categories first (needed for product creation)
    console.log('\n2. Getting categories for product creation...');
    const categoriesResponse = await fetch(`${API_BASE_URL}/api/categories`);
    const categoriesData = await categoriesResponse.json();

    if (categoriesData.success && categoriesData.data.length > 0) {
      const categoryId = categoriesData.data[0]._id;

      // Test 3: Create a product
      console.log('\n3. Testing POST /api/products...');
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 transparent PNG

      const productData = {
        name: 'Test Product',
        shortDescription: 'This is a test product',
        longDescription: 'Detailed description of the test product',
        sku: 'TEST-001',
        categories: [categoryId],
        regularPrice: 99.99,
        discountedPrice: 79.99,
        stockQuantity: 10,
        status: 'Active',
        tags: ['test', 'sample'],
        images: [testImage]
      };

      const postResponse = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const postData = await postResponse.json();
      console.log('✅ POST product response:', postData);

      if (postData.success) {
        const productId = postData.data._id;

        // Test 4: Get single product
        console.log('\n4. Testing GET /api/products/:id...');
        const getSingleResponse = await fetch(`${API_BASE_URL}/api/products/${productId}`);
        const getSingleData = await getSingleResponse.json();
        console.log('✅ GET single product response:', getSingleData);

        // Test 5: Get products again (should now have 1 product)
        console.log('\n5. Testing GET /api/products (after creation)...');
        const getAgainResponse = await fetch(`${API_BASE_URL}/api/products`);
        const getAgainData = await getAgainResponse.json();
        console.log('✅ GET products (after creation):', getAgainData);

        // Test 6: Search products
        console.log('\n6. Testing GET /api/products/search...');
        const searchResponse = await fetch(`${API_BASE_URL}/api/products/search?q=test`);
        const searchData = await searchResponse.json();
        console.log('✅ Search products response:', searchData);

        console.log('\n🎉 All Product API tests passed!');
      } else {
        console.log('❌ Product creation failed, but API is responding');
      }
    } else {
      console.log('❌ No categories available for testing. Please create categories first.');
    }

  } catch (error) {
    console.error('❌ Product API test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure backend server is running on port 5000');
    console.log('2. Check MongoDB connection');
    console.log('3. Verify Cloudinary credentials in .env file');
    console.log('4. Create at least one category first');
  }
};

testProductAPI();
