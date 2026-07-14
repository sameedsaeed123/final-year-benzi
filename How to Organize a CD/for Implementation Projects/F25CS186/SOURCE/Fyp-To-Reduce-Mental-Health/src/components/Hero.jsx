export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-cream min-h-[min(100svh,800px)] max-md:min-h-[min(72svh,620px)] max-sm:min-h-[min(68svh,520px)]">
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          src="/images/Hero-section-Image.png"
          alt="Hero"
          className="h-full w-full max-w-full object-cover object-center md:object-[center_top]"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/8 to-transparent pointer-events-none" />
    </section>
  )
}
