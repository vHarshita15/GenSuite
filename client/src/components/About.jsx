import { Award, BookOpen, Briefcase, FileText, Image, Laptop, MessageSquare, Share2 } from 'lucide-react'

const About = () => {
  const previewIcons = [
    { Icon: Briefcase, color: '#5B8DEF' },
    { Icon: Award, color: '#C05FD6' },
    { Icon: Image, color: '#4ADE80' },
    { Icon: BookOpen, color: '#F97316' },
    { Icon: FileText, color: '#2DD4BF' },
    { Icon: Laptop, color: '#6366F1' },
    { Icon: Share2, color: '#E879F9' },
    { Icon: MessageSquare, color: '#FB923C' },
  ]

  return (
    <div className='px-4 sm:px-20 xl:px-32 my-24 bg-bg'>
      <div className='max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center'>

        {/* Left: visual */}
        <div className='relative h-[380px] sm:h-[440px] rounded-3xl bg-white/[0.03] border border-border overflow-hidden flex items-center justify-center order-2 lg:order-1'>
          <div
            className='pointer-events-none absolute -top-10 -left-10 w-64 h-64 rounded-full blur-3xl opacity-40'
            style={{ background: 'radial-gradient(circle, rgba(80,68,229,0.5) 0%, rgba(80,68,229,0) 70%)' }}
          ></div>

          {/* floating dashboard mock card */}
          <div className='relative w-64 sm:w-72 bg-[#111018] border border-white/10 rounded-2xl p-6 shadow-2xl'>
            <div className='flex items-center justify-between mb-5'>
              <span className='text-text text-sm font-medium'>Your toolkit</span>
              <span className='w-2 h-2 rounded-full bg-primary animate-pulse'></span>
            </div>
            <div className='grid grid-cols-3 gap-3'>
              {previewIcons.map(({ Icon, color }, i) => (
                <div
                  key={i}
                  className='aspect-square rounded-xl flex items-center justify-center'
                  style={{ background: `${color}1A` }}
                >
                  <Icon className='w-5 h-5' style={{ color }} strokeWidth={2} />
                </div>
              ))}
            </div>
            <div className='mt-5 h-1.5 rounded-full bg-white/5 overflow-hidden'>
              <div className='h-full w-2/3 bg-primary rounded-full'></div>
            </div>
            <p className='mt-2 text-xs text-text-dim'>7 student tools, one workspace</p>
          </div>
        </div>

        {/* Right: text content */}
        <div className='text-center lg:text-left order-1 lg:order-2'>
          <span className='text-primary text-xs font-semibold tracking-widest uppercase'>About us</span>
          <h2 className='text-text text-[36px] sm:text-[42px] font-semibold mt-3 leading-tight'>
            Tools for your <br className='hidden sm:block' />
            <span className='text-primary'>next step as a student.</span>
          </h2>
          <p className='mt-5 text-text-dim leading-relaxed'>
            GenSuite brings together LinkedIn profile optimization, AI image generation, resume reviews, mock interviews, curated learning resources, and student opportunities. Students can also share useful learning links with one another.
          </p>
        </div>

      </div>
    </div>
  )
}

export default About
