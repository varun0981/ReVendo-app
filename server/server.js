import 'dotenv/config'
import mongoose from 'mongoose'
import app from './app.js'
import { connectDatabase } from './config/database.js'

const port = Number(process.env.PORT) || 5051

function listen(portNumber) {
  return new Promise((resolve, reject) => {
    const server = app.listen(portNumber)
    server.once('error', reject)
    server.once('listening', () => resolve(server))
  })
}

try {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters in server/.env.')
  }
  await connectDatabase()
  await listen(port)
  console.log(`ReVendo API listening at http://localhost:${port}`)
} catch (error) {
  const detail = error.code === 'EADDRINUSE'
    ? `Port ${port} is already in use. Set PORT and VITE_API_PROXY_TARGET to the same available port.`
    : error.message
  console.error(`Unable to start ReVendo API: ${detail}`)
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect()
  process.exitCode = 1
}
