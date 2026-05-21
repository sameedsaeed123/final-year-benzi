/**
 * Fix stuck records that are in PROCESSING state
 * This can happen if the server crashes during redaction
 */
import mongoose from 'mongoose'
import { Record } from '../models/Record.js'
import { env } from '../config/environment.js'

async function fixStuckRecords() {
  try {
    await mongoose.connect(env.MONGODB_URI)
    console.log('✓ Connected to MongoDB')

    // Find all stuck records
    const stuckRecords = await Record.find({
      redactionStatus: 'PROCESSING',
    }).select('fileName redactionStatus isAnonymous createdAt')

    console.log(`\nFound ${stuckRecords.length} stuck records in PROCESSING state`)

    if (stuckRecords.length === 0) {
      console.log('No stuck records to fix!')
      await mongoose.disconnect()
      return
    }

    // Reset them to PENDING so they can be retried
    const result = await Record.updateMany(
      { redactionStatus: 'PROCESSING' },
      { $set: { redactionStatus: 'PENDING' } }
    )

    console.log(`✓ Reset ${result.modifiedCount} records to PENDING status`)
    console.log('\nThese records will be processed when:')
    console.log('  1. Patient toggles anonymous mode off and back on')
    console.log('  2. Or clicks "Retry Redaction" button')

    await mongoose.disconnect()
    console.log('\n✓ Done!')
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

fixStuckRecords()
