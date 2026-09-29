import { useEffect, useState } from 'react'
import { useAuth, useClerk, useUser } from '@clerk/clerk-react'
import { ExternalLink, Loader2, Share2, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from '../api/axiosClient'

const categories = [
  'DSA & SDE preparation',
  'SQL & database practice',
  'System design',
  'Web development',
  'Resume & career',
  'Semester preparation',
  'Internships & opportunities',
  'Other',
]

const ShareResources = () => {
  const { getToken } = useAuth()
  const { user, isSignedIn } = useUser()
  const { openSignIn } = useClerk()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [description, setDescription] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')

  useEffect(() => {
    let active = true
    const loadResources = async () => {
      try {
        const { data } = await axios.get('/api/community-resources')
        if (!data.success) throw new Error(data.message || 'Could not load community resources.')
        if (active) setResources(data.resources || [])
      } catch (error) {
        if (active) toast.error(error.response?.data?.message || error.message || 'Could not load community resources.')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadResources()
    return () => { active = false }
  }, [])

  const submitResource = async (event) => {
    event.preventDefault()
    if (!isSignedIn) {
      openSignIn()
      return
    }
    setSubmitting(true)
    try {
      const token = await getToken()
      const { data } = await axios.post('/api/community-resources', {
        displayName: name.trim() || user?.fullName || user?.firstName || 'Student',
        title: title.trim(),
        category,
        description: description.trim(),
        resourceUrl: resourceUrl.trim(),
      }, { headers: { Authorization: `Bearer ${token}` } })
      if (!data.success) throw new Error(data.message || 'Could not share this resource.')
      setResources((current) => [data.resource, ...current])
      setTitle('')
      setCategory(categories[0])
      setDescription('')
      setResourceUrl('')
      toast.success('Resource added to the student feed.')
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Could not share this resource.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className='min-h-full bg-bg px-4 py-8 text-text sm:px-8 sm:py-12'>
      <div className='mx-auto max-w-6xl'>
        <div className='flex items-start gap-4'>
          <div className='rounded-2xl bg-primary/15 p-3 text-primary'><Share2 className='h-6 w-6' /></div>
          <div>
            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-primary'>Student community</p>
            <h1 className='mt-1 text-3xl font-semibold sm:text-4xl'>Share resources</h1>
            <p className='mt-2 max-w-2xl text-sm text-text-dim sm:text-base'>Found a useful guide, course, video, or template? Add it for other students to discover.</p>
          </div>
        </div>

        <div className='mt-8 grid items-start gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]'>
          <form onSubmit={submitResource} className='rounded-2xl border border-border bg-white/[0.03] p-5 sm:p-6'>
            <h2 className='font-semibold'>Add a resource</h2>
            {!isSignedIn && <p className='mt-2 text-sm text-text-dim'>Sign in to add a resource. The community feed is open to browse.</p>}

            <label htmlFor='resource-name' className='mt-4 block text-sm font-medium'>Your name</label>
            <input id='resource-name' value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder={user?.fullName || 'How should we credit you?'} className='mt-1.5 w-full rounded-lg border border-border bg-black/20 px-3 py-2.5 text-sm outline-none focus:border-primary/60' />

            <label htmlFor='resource-title' className='mt-4 block text-sm font-medium'>Resource name</label>
            <input id='resource-title' value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} required placeholder='e.g. SQL interview practice set' className='mt-1.5 w-full rounded-lg border border-border bg-black/20 px-3 py-2.5 text-sm outline-none focus:border-primary/60' />

            <label htmlFor='resource-category' className='mt-4 block text-sm font-medium'>Section</label>
            <select id='resource-category' value={category} onChange={(event) => setCategory(event.target.value)} className='mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary/60'>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>

            <label htmlFor='resource-url' className='mt-4 block text-sm font-medium'>Resource link</label>
            <input id='resource-url' type='url' value={resourceUrl} onChange={(event) => setResourceUrl(event.target.value)} required placeholder='https://...' className='mt-1.5 w-full rounded-lg border border-border bg-black/20 px-3 py-2.5 text-sm outline-none placeholder:text-text-dim/70 focus:border-primary/60' />

            <label htmlFor='resource-description' className='mt-4 block text-sm font-medium'>Why is it useful? <span className='text-text-dim'>(optional)</span></label>
            <textarea id='resource-description' value={description} onChange={(event) => setDescription(event.target.value)} maxLength={600} rows={4} placeholder='A short note to help others know what they will find.' className='mt-1.5 w-full resize-y rounded-lg border border-border bg-black/20 px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-text-dim/70 focus:border-primary/60' />
            <p className='mt-1 text-right text-xs text-text-dim'>{description.length}/600</p>

            <p className='mt-2 text-xs leading-relaxed text-text-dim'>Shared links and your display name are visible to everyone.</p>
            <button type='submit' disabled={submitting} className='mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60'>
              {submitting ? <Loader2 className='h-4 w-4 animate-spin' /> : <Send className='h-4 w-4' />}
              {submitting ? 'Adding resource…' : isSignedIn ? 'Add to resource feed' : 'Sign in to share'}
            </button>
          </form>

          <section aria-live='polite'>
            <div>
              <h2 className='font-semibold'>Community resource feed</h2>
              <p className='mt-1 text-sm text-text-dim'>Recently shared links from students</p>
            </div>
            {loading ? (
              <div className='mt-4 flex min-h-48 items-center justify-center rounded-2xl border border-border bg-white/[0.03] text-primary'><Loader2 className='h-6 w-6 animate-spin' /></div>
            ) : resources.length ? (
              <div className='mt-4 space-y-3'>
                {resources.map((resource) => (
                  <article key={resource.id} className='rounded-2xl border border-border bg-white/[0.03] p-5'>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <span className='rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary'>{resource.category}</span>
                      <time className='text-xs text-text-dim' dateTime={resource.created_at}>{new Date(resource.created_at).toLocaleDateString()}</time>
                    </div>
                    <h3 className='mt-3 text-lg font-semibold'>{resource.title}</h3>
                    <p className='mt-1 text-xs text-text-dim'>Shared by {resource.display_name}</p>
                    {resource.description && <p className='mt-3 text-sm leading-relaxed text-text-dim'>{resource.description}</p>}
                    <a href={resource.resource_url} target='_blank' rel='noopener noreferrer' className='mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline'>Open resource <ExternalLink className='h-4 w-4' /></a>
                  </article>
                ))}
              </div>
            ) : (
              <div className='mt-4 flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white/[0.02] px-5 text-center'>
                <Share2 className='h-7 w-7 text-primary/70' />
                <p className='mt-3 font-medium'>No shared resources yet</p>
                <p className='mt-1 text-sm text-text-dim'>Be the first to add a helpful link for other students.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

export default ShareResources
