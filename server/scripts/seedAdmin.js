import 'dotenv/config'
import { randomInt } from 'node:crypto'
import mongoose from 'mongoose'
import { connectDatabase } from '../config/database.js'
import User from '../models/User.js'

try {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12 || ADMIN_PASSWORD.length > 72) {
    throw new Error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of 12–72 characters in server/.env before seeding an administrator.')
  }
  await connectDatabase()
  const email = ADMIN_EMAIL.trim().toLowerCase()
  let admin = await User.findOne({ email }).select('+password')
  if (!admin) {
    admin = new User({
      name: 'ReVendo Admin',
      email,
      phone: `+91${randomInt(1000000000, 10000000000)}`,
      password: ADMIN_PASSWORD,
      emailVerified: true,
      phoneVerified: true,
      termsAcceptedAt: new Date(),
      role: 'Admin',
      accountStatus: 'Active',
    })
  } else {
    admin.name = 'ReVendo Admin'
    admin.password = ADMIN_PASSWORD
    admin.emailVerified = true
    admin.phoneVerified = true
    admin.termsAcceptedAt ??= new Date()
    admin.role = 'Admin'
    admin.accountStatus = 'Active'
  }
  await admin.save()
  console.log(`Administrator account ready for ${email}.`)
} catch (error) {
  console.error(`Admin seeding failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
