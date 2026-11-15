import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDatabase } from '../config/database.js'
import Product from '../models/Product.js'

const sampleProducts = [
  {
    title: 'Sony WH-1000XM5 Wireless Headphones',
    description: 'Immersive noise cancelling with rich, detailed sound. Includes original case and charging cable.',
    category: 'Electronics',
    brand: 'Sony',
    price: 18999,
    originalPrice: 29990,
    condition: 'Excellent',
    location: 'Indiranagar, Bengaluru',
    negotiable: true,
    images: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=900&q=85'],
  },
  {
    title: 'Fujifilm X-T30 II Mirrorless Camera',
    description: 'A compact, capable mirrorless camera in lovely condition. Comes with the 15–45mm kit lens.',
    category: 'Electronics',
    brand: 'Fujifilm',
    price: 54900,
    originalPrice: 74999,
    condition: 'Like New',
    location: 'Koramangala, Bengaluru',
    negotiable: false,
    images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=85'],
  },
  {
    title: 'Classic leather weekend duffel',
    description: 'Well-made cabin-size travel bag with a roomy interior and adjustable shoulder strap.',
    category: 'Fashion',
    brand: 'Hidesign',
    price: 4200,
    originalPrice: 8900,
    condition: 'Good',
    location: 'Jubilee Hills, Hyderabad',
    negotiable: true,
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85'],
  },
  {
    title: 'Minimal oak bedside table',
    description: 'Solid oak bedside table with a smooth drawer and subtle signs of use.',
    category: 'Furniture',
    brand: 'IKEA',
    price: 3200,
    originalPrice: 5990,
    condition: 'Good',
    location: 'Powai, Mumbai',
    negotiable: true,
    images: ['https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=900&q=85'],
  },
  {
    title: 'Nintendo Switch OLED + 2 games',
    description: 'Bright OLED display, dock and Joy-Con controllers. Includes Mario Kart 8 and Zelda: BOTW.',
    category: 'Gaming',
    brand: 'Nintendo',
    price: 21900,
    originalPrice: 32990,
    condition: 'Excellent',
    location: 'Baner, Pune',
    negotiable: false,
    images: ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=900&q=85'],
  },
  {
    title: 'Instant film camera bundle',
    description: 'A fun instant camera with a protective case and one unopened film pack.',
    category: 'Electronics',
    brand: 'Fujifilm',
    price: 5900,
    originalPrice: 8999,
    condition: 'Like New',
    location: 'Andheri West, Mumbai',
    negotiable: true,
    images: ['https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=900&q=85'],
  },
  {
    title: 'Hand-thrown ceramic table lamp',
    description: 'Warm, soft light and a handmade ceramic base. Includes a fresh warm-white bulb.',
    category: 'Home Appliances',
    brand: 'Studio Pottery',
    price: 2800,
    originalPrice: 5200,
    condition: 'Excellent',
    location: 'Whitefield, Bengaluru',
    negotiable: false,
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85'],
  },
  {
    title: 'Vintage film camera, fully working',
    description: 'A beautifully preserved 35mm film camera tested and ready for its next roll.',
    category: 'Electronics',
    brand: 'Olympus',
    price: 7600,
    originalPrice: 12000,
    condition: 'Good',
    location: 'Fort, Mumbai',
    negotiable: true,
    images: ['https://images.unsplash.com/photo-1510127034890-1e5894c5f6c9?auto=format&fit=crop&w=900&q=85'],
  },
]

try {
  await connectDatabase()
  await Promise.all(sampleProducts.map((product) => Product.updateOne(
    { title: product.title, seller: null },
    { $setOnInsert: product },
    { upsert: true },
  )))
  console.log(`Ensured ${sampleProducts.length} sample products are available.`)
} catch (error) {
  console.error(`Product seeding failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
