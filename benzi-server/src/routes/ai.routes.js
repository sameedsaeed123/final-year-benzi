import { Router } from 'express'
import { verifyJWT, requireRoles } from '../middleware/verifyJWT.js'
import {
  patientAiChat,
  getAiChatHistory,
  getPatientMoodStats,
  getAiDashboard,
  getTherapistPatientAiOverview,
  recommendGoals,
  assignGoal,
  getPatientGoals,
  updateGoalStatus,
  getPatientAnalytics,
  submitPatientGoalProposal,
  getPatientGoalInsightMe,
  previewPatientGoalRecommendations,
} from '../controllers/aiController.js'

const router = Router()

router.post('/chat', verifyJWT, requireRoles('patient'), patientAiChat)
router.get('/chat/history', verifyJWT, requireRoles('patient'), getAiChatHistory)

router.get('/dashboard/me', verifyJWT, requireRoles('patient'), getAiDashboard)
router.get('/dashboard/patient/:patientUserId', verifyJWT, requireRoles('therapist'), getAiDashboard)

router.get('/analytics/me', verifyJWT, requireRoles('patient'), getPatientAnalytics)
router.get('/analytics/patient/:patientUserId', verifyJWT, requireRoles('therapist'), getPatientAnalytics)

router.get('/mood/stats', verifyJWT, requireRoles('patient'), getPatientMoodStats)
router.get('/mood/stats/:patientUserId', verifyJWT, requireRoles('therapist'), getPatientMoodStats)

router.get(
  '/overview/patient/:patientUserId',
  verifyJWT,
  requireRoles('therapist'),
  getTherapistPatientAiOverview
)

router.post(
  '/goals/recommend/:patientUserId',
  verifyJWT,
  requireRoles('therapist'),
  recommendGoals
)
router.post('/goals/assign', verifyJWT, requireRoles('therapist'), assignGoal)
router.post('/goals/submit-proposal', verifyJWT, requireRoles('patient'), submitPatientGoalProposal)
router.get('/goals/insight/me', verifyJWT, requireRoles('patient'), getPatientGoalInsightMe)
router.post('/goals/preview/me', verifyJWT, requireRoles('patient'), previewPatientGoalRecommendations)
router.get('/goals/me', verifyJWT, requireRoles('patient'), getPatientGoals)
router.get('/goals/patient/:patientUserId', verifyJWT, requireRoles('therapist'), getPatientGoals)
router.patch('/goals/:goalId/status', verifyJWT, updateGoalStatus)

export default router
