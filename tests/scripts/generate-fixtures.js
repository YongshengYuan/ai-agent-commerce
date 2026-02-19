const fs = require('fs');
const path = require('path');

const generateProducts = (count = 50) => {
  const categories = ['Electronics', 'Clothing', 'Home', 'Sports', 'Books'];
  return Array.from({ length: count }, (_, i) => ({
    id: `prod-${String(i + 1).padStart(3, '0')}`,
    name: `Product ${i + 1}`,
    price: parseFloat((Math.random() * 500 + 10).toFixed(2)),
    category: categories[Math.floor(Math.random() * categories.length)],
    inventory: Math.floor(Math.random() * 100) + 10,
  }));
};

const fixturesDir = path.join(__dirname, '..', 'fixtures');
fs.mkdirSync(path.join(fixturesDir, 'products'), { recursive: true });
fs.writeFileSync(
  path.join(fixturesDir, 'products', 'products.json'),
  JSON.stringify(generateProducts(50), null, 2)
);
console.log('✅ Fixtures generated: 50 products');
