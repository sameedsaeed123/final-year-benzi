import 'dotenv/config'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { User } from '../models/User.js'
import { Therapist } from '../models/Therapist.js'
import { Service } from '../models/Service.js'
import { normalizeMongoUri, ensureAuthSource } from '../config/database.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_FILE = join(__dirname, '..', '..', 'THERAPIST_SEED_CREDENTIALS.md')

/**
 * Passwords are for local / demo use only. Rotate before any production deployment.
 * Run from repo: `cd benzi-server && npm run seed:therapists`
 */
const COMMON_PASSWORD = 'BenziTherapistDemo#2026'

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
    bio: 'Focus on mood disorders, anxiety, and medication management. Video and in-person sessions.',
    waitTimeLabel: 'Under 15 Min',
    reviewCount: 60,
    avgRating: 4.8,
    sessionCount: 120,
    clientCount: 45,
    services: [
      { name: 'Online video consulting', pricePerSession: 150000, durationMinutes: 45 },
      { name: 'Onsite DHA Hospital Phase III', pricePerSession: 300000, durationMinutes: 60 },
      { name: 'Onsite Irshad Memorial Hospital', pricePerSession: 250000, durationMinutes: 50 },
    ],
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
      { name: 'Onsite DHA Hospital Phase III', pricePerSession: 300000, durationMinutes: 60 },
      { name: 'Online video consulting', pricePerSession: 150000, durationMinutes: 45 },
      { name: 'Onsite Irshad Memorial Hospital', pricePerSession: 250000, durationMinutes: 50 },
    ],
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
    bio: 'Relationship counselling, stress management, and career transitions.',
    waitTimeLabel: 'Under 15 Min',
    reviewCount: 93,
    avgRating: 4.7,
    sessionCount: 95,
    clientCount: 38,
    services: [
      { name: 'Onsite Irshad Memorial Hospital', pricePerSession: 250000, durationMinutes: 50 },
      { name: 'Onsite DHA Hospital Phase III', pricePerSession: 300000, durationMinutes: 60 },
      { name: 'Online video consulting', pricePerSession: 150000, durationMinutes: 45 },
    ],
  },
  {
    email: 'dr.faizan.seed@benzi.local',
    firstName: 'Faizan',
    lastName: 'Ahmed',
    city: 'Lahore',
    profileImageUrl: '/images/Frame 33921.png',
    specializationTitle: 'Psychiatrist',
    qualification: 'MBBS, FCPS (Psychiatry)',
    practiceLocation: 'Model Town, Lahore',
    experienceYears: 12,
    bio: 'Adult psychiatry including bipolar disorder and schizophrenia spectrum.',
    waitTimeLabel: 'Under 25 Min',
    reviewCount: 190,
    avgRating: 4.85,
    sessionCount: 310,
    clientCount: 90,
    services: [
      { name: 'Onsite DHA Hospital Phase III', pricePerSession: 300000, durationMinutes: 60 },
      { name: 'Online video consulting', pricePerSession: 150000, durationMinutes: 45 },
      { name: 'Onsite Irshad Memorial Hospital', pricePerSession: 250000, durationMinutes: 50 },
    ],
  },
  {
    email: 'dr.saba.seed@benzi.local',
    firstName: 'Saba',
    lastName: 'Iqbal',
    city: 'Lahore',
    profileImageUrl: '/images/Frame 33932.png',
    specializationTitle: 'Therapist',
    qualification: 'BS Psychology, ADCP',
    practiceLocation: 'Cantt, Lahore',
    experienceYears: 4,
    bio: 'Youth mental health, exam stress, and family mediation.',
    waitTimeLabel: 'Under 15 Min',
    reviewCount: 53,
    avgRating: 4.6,
    sessionCount: 72,
    clientCount: 28,
    services: [
      { name: 'Onsite DHA Hospital Phase III', pricePerSession: 300000, durationMinutes: 60 },
      { name: 'Online video consulting', pricePerSession: 150000, durationMinutes: 45 },
      { name: 'Onsite Irshad Memorial Hospital', pricePerSession: 250000, durationMinutes: 50 },
    ],
  },
  {
    email: 'dr.rahima.seed@benzi.local',
    firstName: 'Rahima',
    lastName: 'Siddiqui',
    city: 'Karachi',
    profileImageUrl: '/images/Frame 33931.png',
    specializationTitle: 'Psychiatrist',
    qualification: 'MBBS, MCPS (Psychiatry)',
    practiceLocation: 'Clifton, Karachi',
    experienceYears: 10,
    bio: 'Women’s mental health and perinatal psychiatry.',
    waitTimeLabel: 'Under 30 Min',
    reviewCount: 88,
    avgRating: 4.75,
    sessionCount: 150,
    clientCount: 55,
    services: [
      { name: 'Online video consulting', pricePerSession: 160000, durationMinutes: 45 },
      { name: 'Clinic session — Clifton', pricePerSession: 280000, durationMinutes: 60 },
    ],
  },
]

function buildMarkdown(rows, sharedPassword) {
  const lines = [
    '# Therapist seed accounts (development only)',
    '',
    '> **Security:** This file is **generated** when you run `npm run seed:therapists`. It lists demo credentials for local testing. Add `THERAPIST_SEED_CREDENTIALS.md` to `.gitignore` (already done in `benzi-server/.gitignore`) so it is not committed. Log in via the **Therapist** tab on the login page.',
    '',
    `**Shared password for all seed therapists:** \`${sharedPassword}\``,
    '',
    '| Email | City | Name |',
    '| --- | --- | --- |',
    ...rows.map(
      (r) => `| ${r.email} | ${r.city} | Dr. ${r.firstName} ${r.lastName} |`
    ),
    '',
    '## Commands',
    '',
    '```bash',
    'cd benzi-server',
    'npm run seed:therapists',
    '```',
    '',
  ]
  return lines.join('\n')
}

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is required')
    process.exit(1)
  }
  const uri = ensureAuthSource(normalizeMongoUri(process.env.MONGODB_URI))
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_MS) || 25000,
  })

  const passwordHash = await bcrypt.hash(COMMON_PASSWORD, 12)
  const credRows = []

  for (const t of THERAPISTS) {
    let user = await User.findOne({ email: t.email.toLowerCase() })
    if (!user) {
      user = await User.create({
        email: t.email.toLowerCase(),
        passwordHash,
        role: 'therapist',
        firstName: t.firstName,
        lastName: t.lastName,
        phone: '+923001234567',
        status: 'VERIFIED',
      })
      console.log('Created user', t.email)
    } else {
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            passwordHash,
            role: 'therapist',
            firstName: t.firstName,
            lastName: t.lastName,
            status: 'VERIFIED',
          },
        }
      )
      user = await User.findById(user._id)
      console.log('Updated user', t.email)
    }

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
          // derive availableLocations and labels from provided services
          availableLocations: (function () {
            const set = new Set()
            for (const s of t.services || []) {
              const n = (s.name || '').toLowerCase()
              if (n.includes('online')) set.add('online')
              if (n.includes('onsite') || n.includes('hospital')) set.add('office')
              if (n.includes('clinic')) set.add('clinic')
            }
            return Array.from(set).length ? Array.from(set) : ['online']
          })(),
            availableLocationLabels: (function () {
              const map = {}
              for (const s of t.services || []) {
                const n = (s.name || '')
                const key = n.toLowerCase().includes('online')
                  ? 'online'
                  : n.toLowerCase().includes('clinic')
                  ? 'clinic'
                  : n.toLowerCase().includes('onsite') || n.toLowerCase().includes('hospital')
                  ? 'office'
                  : null
                if (key && !map[key]) map[key] = n
              }
              return map
            })(),
        },
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
        isActive: true,
      }))
    )

    credRows.push({
      email: t.email.toLowerCase(),
      city: t.city,
      firstName: t.firstName,
      lastName: t.lastName,
    })
  }

  writeFileSync(OUT_FILE, buildMarkdown(credRows, COMMON_PASSWORD), 'utf8')
  console.log('Wrote credentials file:', OUT_FILE)

  await mongoose.disconnect()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
