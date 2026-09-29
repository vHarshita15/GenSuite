import { AiToolsData } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

const AiTools = () => {
  const navigate = useNavigate()

  return (
    <div className='px-4 sm:px-20 xl:px-32 my-24 bg-bg'>
      <div className='text-center'>
        <span className='text-primary text-xs font-semibold tracking-widest uppercase'>Capabilities</span>
        <h2 className='text-text text-[42px] font-semibold mt-3'>Every tool, one dashboard</h2>
        <p className='text-text-dim max-w-lg mx-auto mt-2'>
          Everything you need to create, enhance, and optimize your content with cutting-edge AI technology.
        </p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-14 max-w-6xl mx-auto items-center'>
        {AiToolsData.map((tool, index) => {
          const isFeatured = index === 1 // change this number to feature a different card

          return (
            <div
              key={index}
              onClick={() => navigate(tool.path)}
              className={`group relative rounded-2xl p-8 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5
                ${isFeatured
                  ? 'bg-white/[0.05] border-2 border-primary/60 shadow-[0_0_40px_rgba(80,68,229,0.25)] lg:scale-110 lg:z-10'
                  : 'bg-white/[0.03] border border-border hover:border-primary/50 hover:bg-white/[0.05] hover:shadow-[0_20px_45px_rgba(80,68,229,0.18)]'
                }`}
            >
              <span className='absolute top-6 right-7 text-[11px] font-mono text-text-dim/30'>
                0{index + 1}
              </span>

              <div className='relative flex items-start justify-between'>
                <div className='relative w-12 h-12 flex items-center justify-center rounded-xl bg-white/[0.06] border border-border group-hover:border-primary/40 transition-colors duration-300'>
                  <div className='absolute inset-0 rounded-xl bg-primary/0 group-hover:bg-primary/10 blur-md transition-all duration-300'></div>
                  <tool.Icon className='relative w-5 h-5 text-primary' strokeWidth={2} />
                </div>

                <ArrowUpRight
                  className='w-5 h-5 text-text-dim opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-primary transition-all duration-300 mt-1'
                />
              </div>

              <h3 className='relative mt-7 mb-2 text-lg font-semibold text-text group-hover:text-primary transition-colors duration-300'>
                {tool.title}
              </h3>
              <p className='relative text-text-dim text-sm leading-relaxed'>
                {tool.description}
              </p>

              <div className='absolute bottom-0 left-0 h-[2px] w-0 bg-primary group-hover:w-full transition-all duration-500 ease-out'></div>
            </div>
          )
        })}
      </div>

    </div>
  )
}

export default AiTools
