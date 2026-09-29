import { useState } from 'react'
import { Image, Sparkles } from 'lucide-react'
import axios from '../api/axiosClient'
import toast from 'react-hot-toast'

const visualStyles = [
  { name: 'Professional photography', detail: 'Natural, polished photography' },
  { name: 'Editorial illustration', detail: 'Clean, thoughtful illustration' },
  { name: 'Minimal 3D', detail: 'Modern, subtle 3D visual' },
]

const postPurposes = ['Professional insight', 'Project showcase', 'Career update', 'Event announcement']
const formats = [
  { name: 'Portrait', value: 'portrait 4:5 composition' },
  { name: 'Square', value: 'square 1:1 composition' },
  { name: 'Landscape', value: 'wide landscape 1.91:1 composition' },
]

const GenerateImages = () => {
  const [selectedStyle, setSelectedStyle] = useState(visualStyles[0].name)
  const [purpose, setPurpose] = useState(postPurposes[0])
  const [format, setFormat] = useState(formats[0].value)
  const [input, setInput] = useState('')
  const [generatedImage, setGeneratedImage] = useState(null)
  const [loading, setLoading] = useState(false)

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    if (loading) return
    if (!input.trim()) {
      toast.error('Describe the LinkedIn post visual you want to create.')
      return
    }

    setLoading(true)
    setGeneratedImage(null)

    const prompt = [
      `Create a polished, professional visual for a LinkedIn ${purpose.toLowerCase()} post.`,
      `Visual concept: ${input.trim()}.`,
      `Art direction: ${selectedStyle}.`,
      `Composition: ${format}, balanced composition with clear focal point and comfortable negative space.`,
      'Suitable for a professional audience. Refined colors, high visual quality, clean background.',
      'Do not include text, letters, logos, watermarks, UI mockups, or social media interface.',
    ].join(' ')

    try {
      const { data } = await axios.post('/api/ai/generate-image', { prompt, publish: false })
      if (data.success) {
        setGeneratedImage(data.content)
        if (data.fallback) toast('Image provider is unavailable; showing a placeholder instead.')
      } else {
        toast.error(data.message || 'Image generation failed.')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Image generation failed.')
    } finally {
      setLoading(false)
    }
  }

  const Choice = ({ label, active, onClick }) => (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border px-3.5 py-2 text-sm transition ${active ? 'border-primary bg-primary/15 text-text' : 'border-border bg-white/[0.02] text-text-dim hover:border-primary/50 hover:text-text'}`}
    >
      {label}
    </button>
  )

  return (
    <main className='min-h-full bg-bg px-4 py-8 text-text sm:px-8 sm:py-12'>
      <div className='mx-auto max-w-6xl'>
        <div className='flex items-start gap-4'>
          <div>
            <div className='mb-3 inline-flex items-center gap-2.5' aria-label='LinkedIn'>
              <span className='flex h-9 w-9 items-end justify-center rounded bg-[#0A66C2] pb-0.5 text-2xl font-bold leading-none tracking-[-0.08em] text-white'>in</span>
              <span className='text-xl font-bold tracking-tight text-text'>LinkedIn</span>
              <span className='ml-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary'>Post studio</span>
            </div>
            <h1 className='mt-1 text-3xl font-semibold sm:text-4xl'>Professional image generator</h1>
            <p className='mt-2 max-w-2xl text-sm text-text-dim sm:text-base'>Create clean, professional visuals for career updates, project showcases, and ideas you share on LinkedIn.</p>
          </div>
        </div>

        <div className='mt-8 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]'>
          <form onSubmit={onSubmitHandler} className='rounded-2xl border border-border bg-white/[0.03] p-5 sm:p-6'>
            <div className='flex items-center gap-2 text-sm font-medium'><Sparkles className='h-4 w-4 text-primary' /> Set up your post visual</div>

            <label htmlFor='post-visual' className='mt-6 block text-sm font-medium'>What should the image show?</label>
            <textarea
              id='post-visual'
              onChange={(event) => setInput(event.target.value)}
              value={input}
              className='mt-2 min-h-28 w-full resize-y rounded-xl border border-border bg-black/20 p-3 text-sm text-text outline-none placeholder:text-text-dim/70 focus:border-primary/60'
              placeholder='Example: a software engineer presenting a new data dashboard to a small team'
              maxLength={600}
              required
            />
            <p className='mt-1 text-right text-xs text-text-dim'>{input.length}/600</p>

            <fieldset className='mt-5'>
              <legend className='text-sm font-medium'>Post purpose</legend>
              <div className='mt-2 flex flex-wrap gap-2'>
                {postPurposes.map((item) => <Choice key={item} label={item} active={purpose === item} onClick={() => setPurpose(item)} />)}
              </div>
            </fieldset>

            <fieldset className='mt-5'>
              <legend className='text-sm font-medium'>Visual style</legend>
              <div className='mt-2 flex flex-wrap gap-2'>
                {visualStyles.map((item) => <Choice key={item.name} label={item.name} active={selectedStyle === item.name} onClick={() => setSelectedStyle(item.name)} />)}
              </div>
            </fieldset>

            <fieldset className='mt-5'>
              <legend className='text-sm font-medium'>Post layout</legend>
              <div className='mt-2 flex flex-wrap gap-2'>
                {formats.map((item) => <Choice key={item.name} label={item.name} active={format === item.value} onClick={() => setFormat(item.value)} />)}
              </div>
            </fieldset>

            <p className='mt-5 rounded-xl border border-border bg-black/10 px-3.5 py-3 text-xs leading-relaxed text-text-dim'>The generator creates the visual only. Add your post headline and any text separately in LinkedIn for clearer, readable typography.</p>
            <button type='submit' disabled={loading} className='mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-60'>
              {loading ? <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' /> : <Image className='h-4 w-4' />}
              {loading ? 'Creating your LinkedIn visual…' : 'Generate professional image'}
            </button>
          </form>

          <section className='flex min-h-[28rem] flex-col rounded-2xl border border-border bg-white/[0.03] p-5 sm:p-6' aria-live='polite'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <h2 className='font-semibold'>Your LinkedIn visual</h2>
                <p className='mt-1 text-xs text-text-dim'>Preview your generated post image here.</p>
              </div>
              {generatedImage && <a href={generatedImage} target='_blank' rel='noopener noreferrer' className='text-xs font-medium text-primary hover:underline'>Open full image</a>}
            </div>
            <div className='mt-5 flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-border bg-black/20 p-3'>
              {generatedImage ? (
                <img src={generatedImage} alt='Professional visual generated for a LinkedIn post' className='max-h-[38rem] w-full rounded-lg object-contain' />
              ) : (
                <div className='flex flex-col items-center gap-3 px-6 text-center text-sm text-text-dim'>
                  <Image className='h-10 w-10 text-primary/70' />
                  <p>Your LinkedIn-ready visual will appear here.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

export default GenerateImages
