import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 7000;
const BASE_URL = `http://localhost:${PORT}/api/v1/translate`;

const testTranslation = async () => {
  console.log('🚀 Starting Translation System Tests...');

  try {
    // 1. Test Single Translation
    console.log('\n--- Test 1: Single Translation ---');
    const singleRes = await axios.post(BASE_URL, {
      text: 'Hello, how are you?',
      targetLang: 'hi'
    });
    console.log('Original:', singleRes.data.data.original);
    console.log('Translated:', singleRes.data.data.translation);

    // 2. Test Batch Translation
    console.log('\n--- Test 2: Batch Translation ---');
    const batchRes = await axios.post(`${BASE_URL}/batch`, {
      texts: ['Welcome to our app', 'Get started today', 'Contact support'],
      targetLang: 'hi'
    });
    console.log('Original:', batchRes.data.data.original);
    console.log('Translations:', batchRes.data.data.translations);

    // 3. Test Object Translation
    console.log('\n--- Test 3: Object Translation ---');
    const objRes = await axios.post(`${BASE_URL}/object`, {
      obj: {
        title: 'Premium Subscription',
        description: 'Get unlimited access to all features',
        metadata: {
          label: 'Special Offer'
        }
      },
      keysToTranslate: ['title', 'description', 'label'],
      targetLang: 'hi'
    });
    console.log('Original:', JSON.stringify(objRes.data.data.original, null, 2));
    console.log('Translated:', JSON.stringify(objRes.data.data.translation, null, 2));

    // 4. Test Cache (Second call to same text)
    console.log('\n--- Test 4: Cache Verification ---');
    const start = Date.now();
    await axios.post(BASE_URL, {
      text: 'Hello, how are you?',
      targetLang: 'hi'
    });
    console.log(`Cache hit time: ${Date.now() - start}ms`);

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
  }
};

testTranslation();
