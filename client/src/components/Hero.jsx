import { useNavigate } from 'react-router-dom'

const Hero = () => {
  const navigate = useNavigate()

  return (
    <div className='relative px-4 sm:px-10 lg:px-20 xl:px-32 w-full bg-bg min-h-screen overflow-hidden pt-32 pb-16'>

      {/* Glow background */}
      <div
        className='pointer-events-none absolute -top-[10%] -right-[10%] w-[700px] h-[700px] rounded-full'
        style={{ background: 'radial-gradient(circle, rgba(80,68,229,0.35) 0%, rgba(80,68,229,0) 70%)' }}
      ></div>
      <div
        className='pointer-events-none absolute top-[30%] -left-[15%] w-[500px] h-[500px] rounded-full'
        style={{ background: 'radial-gradient(circle, rgba(80,68,229,0.15) 0%, rgba(80,68,229,0) 70%)' }}
      ></div>

      <div className='relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-8 max-w-7xl mx-auto'>

        {/* Left: text content */}
        <div className='flex-1 text-center lg:text-left'>
          <h1 className='text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.15] text-text'>
            Built for makers <br className='hidden lg:block' />
            <span className='text-primary'>who move fast.</span>
          </h1>

          <p className='mt-5 max-w-md mx-auto lg:mx-0 text-text-dim max-sm:text-sm'>
            One student toolkit. Optimize your LinkedIn profile, create images, find learning resources, prepare for interviews, and explore opportunities from one dashboard.
          </p>

          <div className='mt-8 flex flex-wrap justify-center lg:justify-start gap-4 text-sm'>
            <button
              onClick={() => navigate('/ai')}
              className='bg-primary text-white px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition cursor-pointer'
            >
              Explore the Suite
            </button>
            <button
              onClick={() => navigate('/contact')}
              className='border border-text-dim/30 text-text px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition cursor-pointer'
            >
              Contact us
            </button>
          </div>
        </div>

        {/* Right: visual mockup */}
        <div className='flex-1 relative w-full max-w-md lg:max-w-none h-[420px] sm:h-[480px]'>

          {/* main card */}
          <div className='absolute top-0 left-1/2 -translate-x-1/2 w-64 sm:w-72 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl'>
            <div className='flex items-center justify-between text-text text-sm font-medium'>
              <span>LinkedIn Optimization</span>
              <span className='w-2 h-2 rounded-full bg-primary animate-pulse'></span>
            </div>
            <div className='mt-3 space-y-2'>
              <div className='text-xs text-text-dim'>Headline · About · Experience</div>
              <div className='h-2 rounded bg-white/10 w-full'></div>
              <div className='h-2 rounded bg-white/10 w-5/6'></div>
            </div>
            <div className='mt-4 text-xs text-primary flex items-center gap-1'>
              ✦ Profile insights ready
            </div>
          </div>

          {/* top-left card: image generation */}
          <div className='absolute top-8 left-0 sm:left-2 w-40 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-xl hidden sm:block'>
            <div className='text-xs text-text font-medium mb-2'>Image Generation</div>
            <div className='h-14 rounded-lg bg-gradient-to-br from-primary/40 via-primary/10 to-transparent'></div>
          </div>

          {/* top-right card: learning resources */}
          <div className='absolute top-4 right-0 sm:right-4 w-40 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-xl hidden sm:block'>
            <div className='text-xs text-text font-medium mb-2'>Student Resources</div>
            <div className='space-y-1.5'>
              <div className='text-[10px] text-text-dim'>DSA · SQL · System design</div>
              <div className='h-1.5 rounded bg-white/10 w-4/5'></div>
              <div className='h-1.5 rounded bg-white/10 w-3/5'></div>
            </div>
          </div>

          {/* chat bubble card */}
          <div className='absolute bottom-16 left-2 sm:left-8 w-56 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl'>
            <div className='flex items-center gap-2 mb-2'>
              <span className='w-6 h-6 rounded-full bg-primary/30'></span>
              <span className='text-xs text-text font-medium'>Resume Reviewer</span>
            </div>
            <p className='text-xs text-text-dim leading-relaxed'>
              Section feedback, ATS checks, and clear next steps for your resume.
            </p>
          </div>

          {/* bottom right card */}
          <div className='absolute bottom-0 right-2 sm:right-10 w-48 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl'>
            <div className='text-xs text-text font-medium mb-2'>Student Opportunities</div>
            <div className='rounded-lg bg-gradient-to-br from-primary/30 to-transparent p-3'>
              <div className='text-[10px] text-text'>Internships · Scholarships · Programs</div>
              <div className='mt-2 inline-flex rounded-full bg-primary/20 px-2 py-1 text-[9px] text-primary'>Eligibility &amp; deadlines</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Hero
