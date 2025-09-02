  import connectDB from '../config/db.js';
import { User, Category, Product } from '../models/index.js';

const seedData = async () => {
  try {
    await connectDB();


    // Tạo admin user
    const admin = new User({
      name: 'Admin',
      email: 'admin@dacsan-phuyen.com',
      password: 'hashedPassword', // Nhớ hash password
      role: 'admin',
      active: true
    });
    await admin.save();

    // Tạo categories
    const categories = [
      { name: 'Hải sản', slug: 'hai-san', description: 'Đặc sản từ vùng biển Phú Yên' },
      { name: 'Đặc sản núi', slug: 'dac-san-nui', description: 'Đặc sản từ vùng núi Phú Yên' },
      { name: 'Nông sản', slug: 'nong-san', description: 'Nông sản đồng bằng Phú Yên' }
    ];

    for (let cat of categories) {
      const category = new Category(cat);
      await category.save();
    }

    console.log('Seed data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();