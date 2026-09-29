import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AiToolsData } from '../assets/assets'

const Dashboard = () => {
  const navigate = useNavigate()

  return (
    <main className='min-h-full bg-bg p-5 text-text sm:p-8'>
      <div className='mx-auto max-w-6xl'>
        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-primary'>Student hub</p>
        <h1 className='mt-2 text-3xl font-semibold'>Dashboard</h1>
        <p className='mt-2 text-sm text-text-dim'>Open a tool, explore resources, or share your experience with other students.</p>
        <section className='mt-9'>
          <h2 className='text-xl font-semibold'>All tools</h2>
          <p className='mt-1 text-sm text-text-dim'>Choose a tool to get started.</p>
          <div className='mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
            {AiToolsData.map((tool) => (
              <button key={tool.path} type='button' onClick={() => navigate(tool.path)} className='group rounded-2xl border border-border bg-white/[0.03] p-5 text-left transition hover:-translate-y-1 hover:border-primary/60 hover:bg-primary/[0.06] sm:p-6'>
                <span className='flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary'><tool.Icon className='h-5 w-5' /></span>
                <span className='mt-4 flex items-center justify-between gap-3'><span className='font-semibold'>{tool.title}</span><ArrowRight className='h-4 w-4 shrink-0 text-text-dim transition group-hover:translate-x-1 group-hover:text-primary' /></span>
                <span className='mt-2 block text-sm leading-relaxed text-text-dim'>{tool.description}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

export default Dashboard
