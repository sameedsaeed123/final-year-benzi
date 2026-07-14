import OurApproach from '../components/OurApproach'
import HowItWorks from '../components/HowItWorks'
import UniqueFeatures from '../components/UniqueFeatures'
import InteractiveTherapy from '../components/InteractiveTherapy'
import FeedbackLearning from '../components/FeedbackLearning'

export default function MeditationCounselor() {
  return (
    <>
      {/* Page top padding to clear absolute navbar */}
      <div className="pt-28 max-[768px]:pt-24 max-[480px]:pt-20" />

      <OurApproach />
      <HowItWorks />
      <UniqueFeatures />
      <InteractiveTherapy />
      <FeedbackLearning />
    </>
  )
}
