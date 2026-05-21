import { Router } from 'express'
import { verifyJWT, requireRoles } from '../middleware/verifyJWT.js'
import { uploadVerificationDocsMiddleware } from '../middleware/documentUpload.js'
import { Therapist } from '../models/Therapist.js'
import { User } from '../models/User.js'
import { sendSuccess, sendError } from '../utils/responseUtils.js'

const router = Router()

router.post(
  '/submit-verification',
  verifyJWT,
  requireRoles('therapist'),
  (req, res, next) => {
    uploadVerificationDocsMiddleware.fields([
      { name: 'degree', maxCount: 1 },
      { name: 'experienceLetter', maxCount: 1 },
      { name: 'cnic', maxCount: 1 }
    ])(req, res, (err) => {
      if (err) {
        return sendError(res, err.message, 400)
      }
      next()
    })
  },
  async (req, res, next) => {
    try {
      const files = req.files
      const { university, experienceYears, city, specializationTitle, qualification, bio, practiceLocation } = req.body

      if (!files || !files.degree || !files.experienceLetter || !files.cnic) {
        return sendError(res, 'Missing required documents (Degree/License, Experience Letter, and CNIC are required)', 400)
      }

      if (!university || !experienceYears || !specializationTitle || !qualification) {
        return sendError(res, 'Missing required academic/practice details', 400)
      }

      const degreeUrl = `/api/files/documents/${files.degree[0].filename}`
      const experienceLetterUrl = `/api/files/documents/${files.experienceLetter[0].filename}`
      const cnicUrl = `/api/files/documents/${files.cnic[0].filename}`

      const therapist = await Therapist.findOneAndUpdate(
        { userId: req.user.id },
        {
          $set: {
            university,
            experienceYears: Number(experienceYears),
            city: city || 'Lahore',
            specializationTitle,
            qualification,
            practiceLocation: practiceLocation || city || 'Lahore',
            bio: bio || '',
            degreeUrl,
            experienceLetterUrl,
            cnicUrl,
            verificationStatus: 'Pending',
            onboardingComplete: true
          }
        },
        { new: true, upsert: true }
      )

      // Ensure the user status is PENDING_VERIFICATION
      await User.findByIdAndUpdate(req.user.id, { status: 'PENDING_VERIFICATION' })

      return sendSuccess(res, { therapist }, 'Verification documents submitted successfully and are pending admin approval.', 200)
    } catch (e) {
      next(e)
    }
  }
)

export default router
