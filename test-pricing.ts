import { calculatePrice, validatePricingRange } from './src/lib/pricing';
import { db } from './src/lib/db';

async function test() {
  try {
    console.log('Testing 4000 to 6000');
    const valid = await validatePricingRange('CS2', 'PREMIER', 4000, 6000);
    console.log('Valid:', valid);
    if(valid.valid) {
        const price = await calculatePrice('CS2', 'PREMIER', 4000, 6000);
        console.log('Price:', price);
    }
    
    console.log('\nTesting 4000 to 4500');
    const valid2 = await validatePricingRange('CS2', 'PREMIER', 4000, 4500);
    console.log('Valid:', valid2);
    if(valid2.valid) {
        const price2 = await calculatePrice('CS2', 'PREMIER', 4000, 4500);
        console.log('Price:', price2);
    }

    console.log('\nTesting 4000 to 5000');
    const valid3 = await validatePricingRange('CS2', 'PREMIER', 4000, 5000);
    console.log('Valid:', valid3);
    if(valid3.valid) {
        const price3 = await calculatePrice('CS2', 'PREMIER', 4000, 5000);
        console.log('Price:', price3);
    }
  } catch(e) {
    console.error('Error:', e);
  } finally {
    await db.$disconnect();
  }
}
test();
