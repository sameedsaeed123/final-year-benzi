import AboutUs from '../components/AboutUs'
import MeetDoctors from '../components/MeetDoctors'
import Achievements from '../components/Achievements'
import ContactCTA from '../components/ContactCTA'

export default function AboutPage() {
  return (
    <>
      {/* Reuse existing progress & therapy section */}
      <div className="pt-28 max-[768px]:pt-24 max-[480px]:pt-20">
        <AboutUs />
      </div>

      {/* Meet Our Doctors */}
      <MeetDoctors />

      {/* Our Achievements */}
      <Achievements />

      {/* Contact CTA reused */}
      <ContactCTA />
    </>
  )
}
