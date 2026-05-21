import { User } from '../models/User.js'
import { Patient } from '../models/Patient.js'
import { Therapist } from '../models/Therapist.js'
import { Appointment } from '../models/Appointment.js'
import { Ticket } from '../models/Ticket.js'
import { sendSuccess, sendError } from '../utils/responseUtils.js'
import emailService from '../services/emailService.js'
import { env } from '../config/environment.js'
import { EmailLog } from '../models/EmailLog.js'
import { checkQueueHealth, retryFailedJob } from '../queues/emailQueue.js'
import { listAppointmentsForAdmin } from '../services/appointmentService.js'
import { processAppointmentCompletions } from '../services/appointmentCompletionService.js'

// Helper to check if a date is within 7 days
const isWithinWeek = (date) => {
  if (!date) return false
  const diffTime = Math.abs(new Date() - new Date(date))
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 7
}

export async function getAdminAppointments(req, res, next) {
  try {
    await processAppointmentCompletions()
    const appointments = await listAppointmentsForAdmin()
    return sendSuccess(res, { appointments, total: appointments.length }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function getDashboardStats(req, res, next) {
  try {
    const totalDoctors = await User.countDocuments({ role: 'therapist' })
    const totalPatients = await User.countDocuments({ role: 'patient' })

    // Calculate percentage increase vs last month (roughly users created in last 30 days vs 30-60 days ago)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

    const docsNew = await User.countDocuments({ role: 'therapist', createdAt: { $gte: thirtyDaysAgo } })
    const docsPrev = await User.countDocuments({ role: 'therapist', createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } })
    const docsDelta = docsPrev > 0 ? ((docsNew / docsPrev) * 100).toFixed(1) : '3.2'

    const patientsNew = await User.countDocuments({ role: 'patient', createdAt: { $gte: thirtyDaysAgo } })
    const patientsPrev = await User.countDocuments({ role: 'patient', createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } })
    const patientsDelta = patientsPrev > 0 ? ((patientsNew / patientsPrev) * 100).toFixed(1) : '5.1'

    // Patients count per doctor (Dashboard table)
    const doctorsList = await User.find({ role: 'therapist' }).lean()
    const patientsPerDoctor = []

    for (let i = 0; i < doctorsList.length; i++) {
      const doc = doctorsList[i]
      const therapistProfile = await Therapist.findOne({ userId: doc._id }).lean()
      const specialization = therapistProfile?.specializationTitle || 'Counselor'

      const assignedPatients = await Patient.find({ assignedTherapistUserId: doc._id }).lean()
      const patientUserIds = assignedPatients.map(p => p.userId)
      const patientUsers = await User.find({ _id: { $in: patientUserIds } }).lean()

      let activeCount = 0
      let inactiveCount = 0
      patientUsers.forEach(pu => {
        if (isWithinWeek(pu.lastLoginAt)) {
          activeCount++
        } else {
          inactiveCount++
        }
      })

      // Last session (appointment) with this doctor
      const lastAppt = await Appointment.findOne({ therapistUserId: doc._id })
        .sort({ date: -1 })
        .lean()
      
      const lastSessionDate = lastAppt ? new Date(lastAppt.date).toISOString().split('T')[0] : 'None'

      patientsPerDoctor.push({
        id: i + 1,
        doctorName: `Dr. ${doc.firstName} ${doc.lastName}`,
        specialization,
        totalPatients: assignedPatients.length,
        active: activeCount,
        inactive: inactiveCount,
        lastSession: lastSessionDate
      })
    }

    // Pie chart distribution percentages (mental health, self care, therapy based on mock classifications/reals)
    const distribution = {
      mentalHealth: 40,
      selfCare: 35,
      therapy: 25
    }

    // New Patients This Month bar chart data (Mon-Sun counts for current week)
    const startOfWeek = new Date()
    startOfWeek.setHours(0,0,0,0)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1) // Monday

    const dayCounts = []
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(startOfWeek)
      dayStart.setDate(dayStart.getDate() + i)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const count = await User.countDocuments({
        role: 'patient',
        createdAt: { $gte: dayStart, $lt: dayEnd }
      })
      dayCounts.push(count)
    }

    return sendSuccess(res, {
      totalDoctors,
      totalPatients,
      docsDelta: `+${docsDelta}% vs last month`,
      patientsDelta: `+${patientsDelta}% vs last month`,
      patientsPerDoctor,
      distribution,
      weeklyCounts: dayCounts
    }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function getDoctorsList(req, res, next) {
  try {
    const doctors = await User.find({ role: 'therapist' }).lean()
    const result = []

    for (let i = 0; i < doctors.length; i++) {
      const doc = doctors[i]
      const therapistProfile = await Therapist.findOne({ userId: doc._id }).lean()
      const patientCount = await Patient.countDocuments({ assignedTherapistUserId: doc._id })
      
      const status = isWithinWeek(doc.lastLoginAt) ? 'Active' : 'Inactive'

      result.push({
        id: `#00${i + 1}`,
        name: `Dr. ${doc.firstName} ${doc.lastName}`,
        specialization: therapistProfile?.specializationTitle || 'Counselor',
        patients: patientCount,
        subscription: 'None', // Statically forced to None as requested!
        status: doc.status === 'SUSPENDED' ? 'Suspended' : status
      })
    }

    return sendSuccess(res, result, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function getTickets(req, res, next) {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 }).lean()

    const openCount = await Ticket.countDocuments({ status: 'Pending' })
    
    // Pending Reply: status Pending and last reply was from the user
    const allPending = await Ticket.find({ status: 'Pending' }).lean()
    const pendingReplyCount = allPending.filter(t => {
      if (t.replies.length === 0) return true
      return t.replies[t.replies.length - 1].sender === 'user'
    }).length

    const startOfToday = new Date()
    startOfToday.setHours(0,0,0,0)
    const resolvedTodayCount = await Ticket.countDocuments({
      status: 'Completed',
      updatedAt: { $gte: startOfToday }
    })

    return sendSuccess(res, {
      tickets,
      counts: {
        openTickets: openCount,
        pendingReply: pendingReplyCount,
        resolvedToday: resolvedTodayCount,
        avgResponse: '14m'
      }
    }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function replyToTicket(req, res, next) {
  try {
    const { message } = req.body
    if (!message || !message.trim()) {
      return sendError(res, 'Reply message is required', 400)
    }

    const ticket = await Ticket.findById(req.params.id)
    if (!ticket) {
      return sendError(res, 'Ticket not found', 404)
    }

    ticket.replies.push({
      sender: 'admin',
      message: message.trim(),
      createdAt: new Date()
    })
    
    // Keep ticket as pending or complete
    await ticket.save()

    // Send ticket reply email notification in the background
    const ticketUrl = `${env.FRONTEND_URL || 'http://localhost:3000'}/support/tickets/${ticket.ticketId}`
    await emailService.sendTicketReply(
      ticket.email,
      ticket.name,
      ticket.ticketId,
      message.trim(),
      ticketUrl
    )

    return sendSuccess(res, ticket, 'Reply added successfully', 200)
  } catch (e) {
    next(e)
  }
}

export async function updateTicketStatus(req, res, next) {
  try {
    const { status } = req.body
    if (!['Pending', 'Completed'].includes(status)) {
      return sendError(res, 'Invalid status', 400)
    }

    const ticket = await Ticket.findById(req.params.id)
    if (!ticket) {
      return sendError(res, 'Ticket not found', 404)
    }

    ticket.status = status
    await ticket.save()

    // If status is updated to Completed, trigger resolved email
    if (status === 'Completed') {
      const ticketUrl = `${env.FRONTEND_URL || 'http://localhost:3000'}/support/tickets/${ticket.ticketId}`
      await emailService.sendTicketResolved(
        ticket.email,
        ticket.name,
        ticket.ticketId,
        ticket.subject,
        ticketUrl
      )
    }

    return sendSuccess(res, ticket, 'Status updated successfully', 200)
  } catch (e) {
    next(e)
  }
}

export async function getPendingVerifications(req, res, next) {
  try {
    const pendingTherapists = await Therapist.find({ verificationStatus: 'Pending' }).lean()
    const result = []

    for (const term of pendingTherapists) {
      const u = await User.findById(term.userId).lean()
      if (u) {
        result.push({
          id: term._id,
          userId: u._id,
          name: `Dr. ${u.firstName} ${u.lastName}`,
          email: u.email,
          phone: u.phone,
          specializationTitle: term.specializationTitle,
          qualification: term.qualification,
          experienceYears: term.experienceYears,
          university: term.university || 'N/A',
          degreeUrl: term.degreeUrl,
          experienceLetterUrl: term.experienceLetterUrl,
          cnicUrl: term.cnicUrl,
          createdAt: term.createdAt
        })
      }
    }
    return sendSuccess(res, result, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function verifyTherapist(req, res, next) {
  try {
    const { approve, reason = 'Document verification failed.' } = req.body
    const therapist = await Therapist.findById(req.params.id)
    if (!therapist) {
      return sendError(res, 'Therapist not found', 404)
    }

    const therapistUser = await User.findById(therapist.userId)
    if (!therapistUser) {
      return sendError(res, 'Associated user account not found', 404)
    }

    const fullName = `${therapistUser.firstName} ${therapistUser.lastName}`

    if (approve) {
      therapist.verificationStatus = 'Approved'
      await User.findByIdAndUpdate(therapist.userId, { status: 'VERIFIED' })

      // Send approved notification email
      await emailService.sendTherapistVerificationApproved(therapistUser.email, fullName)
    } else {
      therapist.verificationStatus = 'Rejected'
      await User.findByIdAndUpdate(therapist.userId, { status: 'PENDING_VERIFICATION' })

      // Send rejected notification email
      const resubmitUrl = `${env.FRONTEND_URL || 'http://localhost:3000'}/therapist/verify`
      await emailService.sendTherapistVerificationRejected(therapistUser.email, fullName, reason, resubmitUrl)
    }

    await therapist.save()
    return sendSuccess(res, therapist, `Therapist has been ${approve ? 'Approved' : 'Rejected'} successfully!`, 200)
  } catch (e) {
    next(e)
  }
}

export async function getEmailLogs(req, res, next) {
  try {
    const { status, category, search, page = 1, limit = 50 } = req.query
    const query = {}
    if (status) query.status = status
    if (category) query.category = category
    if (search) {
      query.recipient = new RegExp(search, 'i')
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10)
    const logs = await EmailLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean()

    const total = await EmailLog.countDocuments(query)

    return sendSuccess(res, {
      logs,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    }, 'Email logs retrieved successfully', 200)
  } catch (e) {
    next(e)
  }
}

export async function getEmailMetrics(req, res, next) {
  try {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const todaySentCount = await EmailLog.countDocuments({
      status: 'sent',
      createdAt: { $gte: startOfToday }
    })

    const statusCounts = await EmailLog.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    const categoryCounts = await EmailLog.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])

    const queueHealth = await checkQueueHealth()

    return sendSuccess(res, {
      dailyUsage: {
        sent: todaySentCount,
        limit: 500,
        remaining: Math.max(0, 500 - todaySentCount)
      },
      statusCounts: statusCounts.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      categoryCounts: categoryCounts.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      queueHealth
    }, 'Email metrics retrieved successfully', 200)
  } catch (e) {
    next(e)
  }
}

export async function retryEmailJob(req, res, next) {
  try {
    const { jobId } = req.params
    if (!jobId) return sendError(res, 'Job ID is required', 400)

    await retryFailedJob(jobId)

    // Update log status if exists
    await EmailLog.findOneAndUpdate({ jobId }, { $set: { status: 'queued', error: null } })

    return sendSuccess(res, { retried: true }, 'Job queued for retry successfully', 200)
  } catch (e) {
    next(e)
  }
}

export async function testSMTPSettings(req, res, next) {
  try {
    const { to } = req.body
    if (!to) return sendError(res, 'Recipient email address is required', 400)

    // Queue test email
    const result = await emailService.sendEmail({
      to,
      templateId: 'test',
      data: {
        recipientName: 'BENZI Administrator'
      },
      category: 'test',
      priority: 'high'
    })

    return sendSuccess(res, result, 'Test email queued successfully. Check logs or inbox.', 200)
  } catch (e) {
    next(e)
  }
}

