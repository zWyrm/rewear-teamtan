import { db } from './db';
import { users, items } from '../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function seedDatabase() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
    
    if (existingAdmin.length === 0) {
      // Create admin user
      const adminPassword = await bcrypt.hash('admin123', 10);
      await db.insert(users).values({
        username: 'admin',
        email: 'admin@rewear.com',
        password: adminPassword,
        role: 'admin',
        points: 0,
      });

      // Create sample user
      const userPassword = await bcrypt.hash('password123', 10);
      const [sampleUser] = await db.insert(users).values({
        username: 'sarah_fashion',
        email: 'sarah@example.com',
        password: userPassword,
        role: 'user',
        points: 0,
      }).returning();

      // Create sample approved items
      await db.insert(items).values([
        {
          title: 'Vintage Denim Jacket',
          description: 'Classic blue denim jacket in excellent condition. Perfect for layering.',
          category: 'outerwear',
          condition: 'excellent',
          size: 'M',
          value: 1200,
          imageUrls: [],
          tags: ['vintage', 'denim', 'classic'],
          userId: sampleUser.id,
          isApproved: true,
          isAvailable: true,
        },
        {
          title: 'Floral Summer Dress',
          description: 'Beautiful floral print summer dress, worn only twice.',
          category: 'dresses',
          condition: 'good',
          size: 'S',
          value: 800,
          imageUrls: [],
          tags: ['floral', 'summer', 'casual'],
          userId: sampleUser.id,
          isApproved: true,
          isAvailable: true,
        },
        {
          title: 'Designer Leather Handbag',
          description: 'Authentic designer leather handbag with gold hardware.',
          category: 'accessories',
          condition: 'excellent',
          size: 'One Size',
          value: 2500,
          imageUrls: [],
          tags: ['designer', 'leather', 'luxury'],
          userId: sampleUser.id,
          isApproved: true,
          isAvailable: true,
        },
        {
          title: 'High-Waisted Jeans',
          description: 'Trendy high-waisted jeans in dark wash, very comfortable.',
          category: 'bottoms',
          condition: 'good',
          size: '28',
          value: 600,
          imageUrls: [],
          tags: ['jeans', 'high-waisted', 'trendy'],
          userId: sampleUser.id,
          isApproved: true,
          isAvailable: true,
        },
        {
          title: 'Black Leather Boots',
          description: 'Stylish black leather ankle boots with comfortable heel. Great for any season.',
          category: 'shoes',
          condition: 'excellent',
          size: '8',
          value: 1500,
          imageUrls: [],
          tags: ['leather', 'boots', 'black'],
          userId: sampleUser.id,
          isApproved: true,
          isAvailable: true,
        },
        {
          title: 'Cozy Knit Sweater',
          description: 'Soft cream-colored knit sweater, perfect for chilly days. Barely worn.',
          category: 'tops',
          condition: 'excellent',
          size: 'L',
          value: 900,
          imageUrls: [],
          tags: ['knit', 'sweater', 'cozy'],
          userId: sampleUser.id,
          isApproved: true,
          isAvailable: true,
        },
        {
          title: 'Silk Blouse',
          description: 'Elegant white silk blouse with subtle sheen. Professional and versatile.',
          category: 'tops',
          condition: 'good',
          size: 'M',
          value: 1100,
          imageUrls: [],
          tags: ['silk', 'blouse', 'professional'],
          userId: sampleUser.id,
          isApproved: true,
          isAvailable: true,
        },
        {
          title: 'Wool Trench Coat',
          description: 'Classic camel-colored wool trench coat. Timeless piece for any wardrobe.',
          category: 'outerwear',
          condition: 'excellent',
          size: 'M',
          value: 2200,
          imageUrls: [],
          tags: ['wool', 'trench', 'classic'],
          userId: sampleUser.id,
          isApproved: true,
          isAvailable: true,
        },
        {
          title: 'Boho Maxi Skirt',
          description: 'Flowing boho-style maxi skirt in earthy tones. Perfect for festivals or casual days.',
          category: 'bottoms',
          condition: 'good',
          size: 'S',
          value: 700,
          imageUrls: [],
          tags: ['boho', 'maxi', 'earthy'],
          userId: sampleUser.id,
          isApproved: true,
          isAvailable: true,
        },
        {
          title: 'Red Cocktail Dress',
          description: 'Stunning red cocktail dress with elegant draping. Perfect for special occasions.',
          category: 'dresses',
          condition: 'excellent',
          size: 'M',
          value: 1800,
          imageUrls: [],
          tags: ['cocktail', 'red', 'elegant'],
          userId: sampleUser.id,
          isApproved: true,
          isAvailable: true,
        },
        {
          title: 'Canvas Sneakers',
          description: 'Comfortable white canvas sneakers. Clean and ready for daily wear.',
          category: 'shoes',
          condition: 'good',
          size: '7',
          value: 400,
          imageUrls: [],
          tags: ['sneakers', 'canvas', 'comfortable'],
          userId: sampleUser.id,
          isApproved: true,
          isAvailable: true,
        },
        {
          title: 'Gold Statement Necklace',
          description: 'Elegant gold-toned statement necklace that adds sparkle to any outfit.',
          category: 'accessories',
          condition: 'excellent',
          size: 'One Size',
          value: 600,
          imageUrls: [],
          tags: ['jewelry', 'gold', 'statement'],
          userId: sampleUser.id,
          isApproved: true,
          isAvailable: true,
        },
        {
          title: 'Leather Crossbody Bag',
          description: 'Compact brown leather crossbody bag with adjustable strap. Perfect for essentials.',
          category: 'accessories',
          condition: 'good',
          size: 'One Size',
          value: 1000,
          imageUrls: [],
          tags: ['leather', 'crossbody', 'brown'],
          userId: sampleUser.id,
          isApproved: true,
          isAvailable: true,
        },
        {
          title: 'Striped Button-Down Shirt',
          description: 'Classic blue and white striped button-down shirt. Perfect for casual or business casual.',
          category: 'tops',
          condition: 'good',
          size: 'M',
          value: 500,
          imageUrls: [],
          tags: ['striped', 'button-down', 'classic'],
          userId: sampleUser.id,
          isApproved: true,
          isAvailable: true,
        },
      ]);

      console.log('Database seeded successfully!');
    } else {
      console.log('Database already seeded.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}