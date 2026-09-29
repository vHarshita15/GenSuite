import { ExternalLink, Phone } from 'lucide-react'
import Navbar from '../components/Navbar'

const contactDetails = [
  { label: 'LinkedIn', value: 'linkedin.com/in/harshita-453954292', href: 'https://www.linkedin.com/in/harshita-453954292/', Icon: ExternalLink },
  { label: 'GitHub', value: 'github.com/vHarshita15', href: 'https://github.com/vHarshita15', Icon: ExternalLink },
  { label: 'Phone', value: '+91 9084143300', href: 'tel:+919084143300', Icon: Phone },
]

const Contact = () => (
  <div className='min-h-screen bg-bg text-text'>
    <Navbar />
    <main className='mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-5 pb-16 pt-28 sm:px-8'>
      <p className='text-xs font-semibold uppercase tracking-[0.18em] text-primary'>Get in touch</p>
      <h1 className='mt-3 text-4xl font-semibold sm:text-5xl'>Contact us</h1>
      <p className='mt-4 max-w-2xl text-base leading-relaxed text-text-dim'>Connect with us through LinkedIn, GitHub, or phone.</p>
      <div className='mt-9 grid gap-4 sm:grid-cols-3'>
        {contactDetails.map(({ label, value, href, Icon }) => (
          <a key={label} href={href || undefined} aria-disabled={!href} className={`rounded-2xl border border-border bg-white/[0.03] p-5 transition ${href ? 'hover:border-primary/50 hover:bg-white/[0.05]' : 'cursor-default'}`}>
            <span className='inline-flex rounded-xl bg-primary/15 p-3 text-primary'><Icon className='h-5 w-5' /></span>
            <span className='mt-4 block text-sm font-semibold'>{label}</span>
            <span className='mt-1 block break-all text-sm text-text-dim'>{value || 'Contact detail to be added'}</span>
          </a>
        ))}
      </div>
    </main>
  </div>
)

export default Contact
