import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { User } from '../models/User.js'
import { Therapist } from '../models/Therapist.js'
import { Patient } from '../models/Patient.js'
import { Service } from '../models/Service.js'
import { Ticket } from '../models/Ticket.js'
import { normalizeMongoUri, ensureAuthSource } from '../config/database.js'

const COMMON_PASSWORD = 'BenziDemoPassword#2026'

const THERAPISTS = [
  {
    email: 'dr.fatima.seed@benzi.local',
    firstName: 'Fatima',
    lastName: 'Khan',
    city: 'Lahore',
    profileImageUrl: '/images/Frame 33921.png',
    specializationTitle: 'Psychiatrist',
    qualification: 'MBBS, MCPS (Psychiatry)',
    practiceLocation: 'DHA Phase III, Lahore',
    experienceYears: 5,
    bio: 'Focus on mood disorders, anxiety, and medication management.',
    waitTimeLabel: 'Under 15 Min',
    reviewCount: 60,
    avgRating: 4.8,
    sessionCount: 120,
    clientCount: 45,
    services: [
      { name: 'Online video consulting', pricePerSession: 150000, durationMinutes: 45 },
      { name: 'Onsite DHA Hospital Phase III', pricePerSession: 300000, durationMinutes: 60 }
    ]
  },
  {
    email: 'dr.shayan.seed@benzi.local',
    firstName: 'Shayan',
    lastName: 'Malik',
    city: 'Lahore',
    profileImageUrl: '/images/Frame 33931.png',
    specializationTitle: 'Clinical Psychologist',
    qualification: 'MS Clinical Psychology',
    practiceLocation: 'Gulberg III, Lahore',
    experienceYears: 8,
    bio: 'CBT and trauma-informed care for adults and adolescents.',
    waitTimeLabel: 'Under 20 Min',
    reviewCount: 160,
    avgRating: 4.9,
    sessionCount: 200,
    clientCount: 70,
    services: [
      { name: 'Online video consulting', pricePerSession: 150000, durationMinutes: 45 }
    ]
  },
  {
    email: 'dr.alina.seed@benzi.local',
    firstName: 'Alina',
    lastName: 'Rauf',
    city: 'Lahore',
    profileImageUrl: '/images/Frame 33932.png',
    specializationTitle: 'Counselling Psychologist',
    qualification: 'MPhil Psychology',
    practiceLocation: 'Johar Town, Lahore',
    experienceYears: 6,
    bio: 'Relationship counselling and stress management.',
    waitTimeLabel: 'Under 15 Min',
    reviewCount: 93,
    avgRating: 4.7,
    sessionCount: 95,
    clientCount: 38,
    services: [
      { name: 'Online video consulting', pricePerSession: 150000, durationMinutes: 45 }
    ]
  }
]

const PATIENTS = [
  { email: 'sara.patel@benzi.local', firstName: 'Sara', lastName: 'Patel', active: true },
  { email: 'ali.khan@benzi.local', firstName: 'Ali', lastName: 'Khan', active: true },
  { email: 'mary.lopez@benzi.local', firstName: 'Mary', lastName: 'Lopez', active: false },
  { email: 'john.davis@benzi.local', firstName: 'John', lastName: 'Davis', active: true },
  { email: 'zainab.ali@benzi.local', firstName: 'Zainab', lastName: 'Ali', active: false },
  { email: 'ahmed.riaz@benzi.local', firstName: 'Ahmed', lastName: 'Riaz', active: true }
]

const TICKETS = [
  {
    ticketId: 'TKT-1042',
    subject: 'Unable to book session with Dr. Rahima',
    name: 'Sara Patel',
    email: 'sara.patel@benzi.local',
    priority: 'High',
    status: 'Pending',
    description: 'Hi, I keep getting an error when trying to book a session for tomorrow. Can you help?',
    replies: [
      { sender: 'user', message: 'Hi, I keep getting an error when trying to book a session for tomorrow. Can you help?', createdAt: new Date(Date.now() - 3600000) }
    ]
  },
  {
    ticketId: 'TKT-1041',
    subject: 'Refund request for cancelled session',
    name: 'Ali Khan',
    email: 'ali.khan@benzi.local',
    priority: 'Billing',
    status: 'Pending',
    description: 'My session with Dr. Shayan was cancelled but the payment was still deducted.',
    replies: [
      { sender: 'user', message: 'My session with Dr. Shayan was cancelled but the payment was still deducted.', createdAt: new Date(Date.now() - 7200000) },
      { sender: 'admin', message: 'Hello Ali, we are reviewing your refund request now. We will update you shortly.', createdAt: new Date(Date.now() - 1800000) }
    ]
  },
  {
    ticketId: 'TKT-1040',
    subject: 'How do I change my subscription plan?',
    name: 'Mary Lopez',
    email: 'mary.lopez@benzi.local',
    priority: 'Subscription',
    status: 'Completed',
    description: 'I would like to upgrade from the standard plan to the pro plan.',
    replies: [
      { sender: 'user', message: 'I would like to upgrade from the standard plan to the pro plan.', createdAt: new Date(Date.now() - 86400000) },
      { sender: 'admin', message: 'Hi Mary, you can upgrade easily through the subscription portal inside your profile page. Let us know if you need anything else.', createdAt: new Date(Date.now() - 43200000) }
    ]
  }
]

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is required')
    process.exit(1)
  }
  const uri = ensureAuthSource(normalizeMongoUri(process.env.MONGODB_URI))
  await mongoose.connect(uri)

  console.log('Seeding Database with Therapists, Patients, and Support Tickets...')

  const passwordHash = await bcrypt.hash(COMMON_PASSWORD, 12)
  const therapistUserIds = []

  // 1. Seed Therapists
  for (const t of THERAPISTS) {
    let user = await User.findOne({ email: t.email })
    if (!user) {
      user = await User.create({
        email: t.email,
        passwordHash,
        role: 'therapist',
        firstName: t.firstName,
        lastName: t.lastName,
        phone: '+923001234567',
        status: 'VERIFIED',
        lastLoginAt: new Date()
      })
    } else {
      user.lastLoginAt = new Date()
      await user.save()
    }
    therapistUserIds.push(user._id)

    await Therapist.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          userId: user._id,
          city: t.city,
          profileImageUrl: t.profileImageUrl,
          specializationTitle: t.specializationTitle,
          qualification: t.qualification,
          practiceLocation: t.practiceLocation,
          experienceYears: t.experienceYears,
          bio: t.bio,
          waitTimeLabel: t.waitTimeLabel,
          reviewCount: t.reviewCount,
          avgRating: t.avgRating,
          sessionCount: t.sessionCount,
          clientCount: t.clientCount,
          avgReplyTimeMinutes: 12,
          onboardingComplete: true,
          availableLocations: ['online']
        }
      },
      { upsert: true }
    )

    await Service.deleteMany({ therapistUserId: user._id })
    await Service.insertMany(
      t.services.map((s) => ({
        therapistUserId: user._id,
        name: s.name,
        type: 'Therapy',
        description: '',
        durationMinutes: s.durationMinutes,
        pricePerSession: s.pricePerSession,
        isActive: true
      }))
    )
  }
  console.log(`Successfully seeded ${therapistUserIds.length} Therapists!`)

  // 2. Seed Patients
  let patientIndex = 0
  for (const p of PATIENTS) {
    let user = await User.findOne({ email: p.email })
    const lastLoginAt = p.active 
      ? new Date() // Active within 7d
      : new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // Inactive (10 days ago)

    if (!user) {
      user = await User.create({
        email: p.email,
        passwordHash,
        role: 'patient',
        firstName: p.firstName,
        lastName: p.lastName,
        phone: '+923007654321',
        status: 'VERIFIED',
        lastLoginAt
      })
    } else {
      user.lastLoginAt = lastLoginAt
      await user.save()
    }

    // Assign therapist in sequence
    const assignedTherapistUserId = therapistUserIds[patientIndex % therapistUserIds.length]
    patientIndex++

    await Patient.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          userId: user._id,
          totalPoints: 120,
          assignedTherapistUserId,
          assignedAt: new Date()
        }
      },
      { upsert: true }
    )
  }
  console.log(`Successfully seeded ${PATIENTS.length} Patients linked to Therapists!`)

  // 3. Seed Support Tickets
  await Ticket.deleteMany({})
  await Ticket.insertMany(TICKETS)
  console.log(`Successfully seeded ${TICKETS.length} Support Tickets!`)

  console.log('\n--- SEEDING COMPLETED SUCCESSFULLY ---')
  console.log(`All seed users password: ${COMMON_PASSWORD}`)
  await mongoose.disconnect()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
