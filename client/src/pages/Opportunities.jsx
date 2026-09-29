import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Award, Briefcase, CalendarDays, ChevronLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from '../api/axiosClient'

const Card = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-border bg-white/[0.03] p-5 sm:p-6 ${className}`}>
    {children}
  </div>
)

const Opportunities = () => {
  const [opportunities, setOpportunities] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  const categories = useMemo(
    () => [...new Set(opportunities.map((opportunity) => opportunity.category))].sort(),
    [opportunities],
  )

  useEffect(() => {
    let active = true
    const loadOpportunities = async () => {
      try {
        const { data } = await axios.get('/api/opportunities')
        if (!data.success) throw new Error(data.message || 'Could not load opportunities.')
        if (active) setOpportunities(data.opportunities || [])
      } catch (error) {
        if (active) toast.error(error.response?.data?.message || error.message || 'Could not load opportunities.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadOpportunities()
    return () => { active = false }
  }, [])

  const filteredOpportunities = useMemo(
    () => opportunities.filter((opportunity) => opportunity.category === selectedCategory),
    [opportunities, selectedCategory],
  )

  return (
    <main className='min-h-full bg-bg px-4 py-10 text-text sm:px-8 sm:py-14'>
      <div className='mx-auto max-w-6xl'>
        <div className='flex items-start gap-4'>
          <div className='rounded-2xl bg-primary/15 p-3 text-primary'>
            <Briefcase className='h-6 w-6' />
          </div>
          <div>
            <h1 className='text-3xl font-semibold sm:text-4xl'>Student opportunities</h1>
            <p className='mt-2 text-sm text-text-dim sm:text-base'>Choose a section to explore programs, eligibility, and application dates.</p>
          </div>
        </div>

        {selectedCategory ? (
          <div className='mt-8 flex flex-wrap items-center justify-between gap-3'>
            <div>
              <button type='button' onClick={() => setSelectedCategory(null)} className='mb-3 inline-flex items-center gap-1 text-sm text-text-dim transition hover:text-primary'>
                <ChevronLeft className='h-4 w-4' /> All sections
              </button>
              <h2 className='text-2xl font-semibold'>{selectedCategory}</h2>
              <p className='mt-1 text-sm text-text-dim'>{filteredOpportunities.length} {filteredOpportunities.length === 1 ? 'opportunity' : 'opportunities'}</p>
            </div>
          </div>
        ) : (
          <div className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {categories.map((item) => {
              const count = opportunities.filter((opportunity) => opportunity.category === item).length
              return (
                <button
                  key={item}
                  type='button'
                  onClick={() => setSelectedCategory(item)}
                  className='group rounded-2xl border border-border bg-white/[0.03] p-5 text-left transition hover:-translate-y-1 hover:border-primary/60 hover:bg-primary/[0.06] sm:p-6'
                >
                  <span className='flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary'>
                    <Award className='h-5 w-5' />
                  </span>
                  <span className='mt-5 flex items-center justify-between gap-3'>
                    <span className='font-semibold text-text'>{item}</span>
                    <ArrowRight className='h-4 w-4 shrink-0 text-text-dim transition group-hover:translate-x-1 group-hover:text-primary' />
                  </span>
                  <span className='mt-2 block text-sm text-text-dim'>{count} {count === 1 ? 'program' : 'programs'} with details and application timing</span>
                </button>
              )
            })}
          </div>
        )}

        {loading ? (
          <div className='flex min-h-64 items-center justify-center text-primary'>
            <Loader2 className='h-8 w-8 animate-spin' />
          </div>
        ) : selectedCategory && filteredOpportunities.length ? (
          <div className='mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {filteredOpportunities.map((opportunity) => (
              <Card key={opportunity.id} className='flex h-full flex-col'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <span className='rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary'>
                    {opportunity.category}
                  </span>
                  <span className='text-xs text-text-dim'>{opportunity.status}</span>
                </div>
                <h2 className='mt-4 text-lg font-semibold leading-snug'>{opportunity.title}</h2>
                <p className='mt-1 text-sm text-text-dim'>{opportunity.organization}</p>

                {opportunity.description && (
                  <div className='mt-4'>
                    <h3 className='text-sm font-medium text-text'>About this opportunity</h3>
                    <p className='mt-1 text-sm leading-relaxed text-text-dim'>{opportunity.description}</p>
                  </div>
                )}
                {opportunity.eligibility && (
                  <div className='mt-4'>
                    <h3 className='text-sm font-medium text-text'>Eligibility</h3>
                    <p className='mt-1 text-sm leading-relaxed text-text-dim'>{opportunity.eligibility}</p>
                  </div>
                )}
                {opportunity.applicationOpen && (
                  <p className='mt-4 flex items-start gap-2 text-xs leading-relaxed text-text-dim'>
                    <CalendarDays className='mt-0.5 h-4 w-4 shrink-0' />
                    <span><span className='font-medium text-text'>Applications open: </span>{opportunity.applicationOpen}</span>
                  </p>
                )}
                {opportunity.deadline && (
                  <p className='mt-2 flex items-center gap-2 text-xs text-text-dim'>
                    <CalendarDays className='h-4 w-4 shrink-0' /> Deadline: {opportunity.deadline}
                  </p>
                )}

                {opportunity.link && (
                  <a
                    href={opportunity.link}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:scale-[1.02]'
                  >
                    <Award className='h-4 w-4' /> Apply / Learn more
                  </a>
                )}
              </Card>
            ))}
          </div>
        ) : (
          selectedCategory && (
            <Card className='mt-6 flex min-h-56 flex-col items-center justify-center text-center'>
              <Award className='h-7 w-7 text-text-dim' />
              <p className='mt-3 font-medium'>No programs in this section yet</p>
              <button type='button' onClick={() => setSelectedCategory(null)} className='mt-2 text-sm text-primary hover:underline'>Back to all sections</button>
            </Card>
          )
        )}
      </div>
    </main>
  )
}

export default Opportunities
