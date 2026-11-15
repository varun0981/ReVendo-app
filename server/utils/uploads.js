import { randomBytes } from 'node:crypto'
import { mkdirSync, unlink } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer from 'multer'
import { fileTypeFromFile } from 'file-type'

export const uploadDirectory = fileURLToPath(new URL('../uploads/', import.meta.url))
mkdirSync(uploadDirectory, { recursive: true })

const extensionByMime = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (_req, file, callback) => {
    const extension = extensionByMime.get(file.mimetype)
    if (!extension) return callback(new Error('Only JPEG, PNG, and WebP images are allowed.'))
    return callback(null, `${randomBytes(18).toString('hex')}.${extension}`)
  },
})

export const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, callback) => {
    if (!extensionByMime.has(file.mimetype)) {
      return callback(new Error('Only JPEG, PNG, and WebP images are allowed.'))
    }
    return callback(null, true)
  },
})

function deleteFile(file) {
  return new Promise((resolve) => unlink(file.path, () => resolve()))
}

export async function verifyUploadedImages(req, res, next) {
  const files = req.files ?? (req.file ? [req.file] : [])
  try {
    for (const file of files) {
      const signature = await fileTypeFromFile(file.path)
      const expectedExtension = extensionByMime.get(file.mimetype)
      if (!signature || signature.mime !== file.mimetype || signature.ext !== expectedExtension) {
        await Promise.all(files.map(deleteFile))
        return res.status(400).json({ success: false, message: 'One or more uploads are not valid image files.' })
      }
    }
    return next()
  } catch (error) {
    await Promise.all(files.map(deleteFile))
    return next(error)
  }
}

export async function removeUploadedImages(images = []) {
  const tasks = images
    .map((image) => {
      const filename = path.posix.basename(String(image))
      if (!/^[a-f0-9]{36}\.(jpg|png|webp)$/.test(filename)) return null
      return new Promise((resolve, reject) => {
        unlink(path.join(uploadDirectory, filename), (error) => {
          if (error && error.code !== 'ENOENT') return reject(error)
          return resolve()
        })
      })
    })
    .filter(Boolean)

  await Promise.all(tasks)
}

export function imageUrl(file) {
  return `/uploads/${file.filename}`
}
