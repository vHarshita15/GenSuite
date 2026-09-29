import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowRight, BookOpen, ChevronLeft, Code2, Database, ExternalLink, FileText, GraduationCap, Laptop, Network } from 'lucide-react'

const resources = [
  {
    category: 'DSA & SDE preparation',
    title: "Striver's A2Z DSA Sheet",
    provider: 'takeUforward · Striver',
    description: 'A topic-by-topic path for learning DSA fundamentals and practising problems from basics through advanced topics.',
    level: 'Start with DSA basics',
    link: 'https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z',
  },
  {
    category: 'DSA & SDE preparation',
    title: "Striver's SDE Pattern Sheet",
    provider: 'takeUforward · Striver',
    description: 'A focused interview practice sheet organized around problem-solving patterns for placement and SDE preparation.',
    level: 'After learning DSA basics',
    link: 'https://takeuforward.org/prep-hub/strivers-180-master-dsa-patterns',
  },
  {
    category: 'DSA & SDE preparation',
    title: 'CodeStoryWithMIK',
    provider: 'Mazhar MIK',
    description: 'DSA and interview problem explanations, with topic-wise code and practice references in the companion repository.',
    level: 'Use alongside problem practice',
    link: 'https://www.youtube.com/@codestorywithmik',
  },
  {
    category: 'DSA & SDE preparation',
    title: 'Striver YouTube Channel',
    provider: 'takeUforward',
    description: 'Video lessons for DSA, coding interviews, and software engineering preparation from Striver.',
    level: 'Follow the topic you are studying',
    link: 'https://www.youtube.com/@takeUforward',
  },
  {
    category: 'DSA & SDE preparation',
    title: 'CodeStoryWithMIK Interview Prep Repository',
    provider: 'GitHub · Mazhar MIK',
    description: 'Topic-organized interview problem solutions and references that pair with CodeStoryWithMIK explanations.',
    level: 'For guided revision and practice',
    link: 'https://github.com/MAZHARMIK/Interview_DS_Algo',
  },
  {
    category: 'SQL & database practice',
    title: 'W3Schools SQL Tutorial',
    provider: 'W3Schools',
    description: 'Learn SQL step by step with explanations, examples, an online editor, and exercises for practising queries.',
    level: 'Beginner friendly',
    link: 'https://www.w3schools.com/sql/default.asp',
  },
  {
    category: 'SQL & database practice',
    title: 'LeetCode SQL 50',
    provider: 'LeetCode',
    description: 'A 50-question SQL study plan covering basic to intermediate topics for interview practice.',
    level: 'Basic to intermediate',
    link: 'https://leetcode.com/studyplan/top-sql-50/',
  },
  {
    category: 'System design',
    title: 'Hello Interview System Design Playlist',
    provider: 'Hello Interview',
    description: 'Watch system design walkthroughs and interview-style breakdowns of common system design problems.',
    level: 'For system design interview preparation',
    link: 'https://www.youtube.com/playlist?list=PL5q3E8eRUieWtYLmRU3z94-vGRcwKr9tM',
  },
  {
    category: 'DRDO internship information',
    title: 'DRDO Internship Information',
    provider: 'YouTube video',
    description: 'A video resource about DRDO internships for students interested in research and defence technology.',
    level: 'For students exploring DRDO internships',
    link: 'https://www.youtube.com/watch?v=Un4T6CTW83A',
  },
  {
    category: 'Student programs & communities',
    title: 'Microsoft Learn Student Ambassadors (MLSA) Guide',
    provider: 'YouTube video',
    description: 'A guide to the Microsoft Learn Student Ambassadors program for students interested in technology learning and community leadership.',
    level: 'For college students',
    link: 'https://www.youtube.com/watch?v=kvVHengl8Xw',
  },
  {
    category: 'Web development',
    title: 'GreatStack Web Development Playlists',
    provider: 'GreatStack · YouTube',
    description: 'Browse GreatStack video playlists for web development tutorials and project walkthroughs.',
    level: 'Beginner to intermediate',
    link: 'https://www.youtube.com/@GreatStackDev/playlists',
  },
  {
    category: 'Resume templates',
    title: 'Overleaf Resume & CV Template Gallery',
    provider: 'Overleaf',
    description: 'Browse Overleaf templates for résumés and CVs, then open a template to edit it online.',
    level: 'Choose a template that fits your experience',
    link: 'https://www.overleaf.com/gallery/tagged/cv',
  },
  {
    category: 'Resume templates',
    title: "Jake's Resume",
    provider: 'Overleaf template',
    description: 'A simple, straightforward resume layout that you can copy and customize in Overleaf.',
    level: 'Student and early-career friendly',
    link: 'https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzwjncs',
  },
  {
    category: 'Resume templates',
    title: 'Deedy CV',
    provider: 'Overleaf template',
    description: 'A compact, one-page, two-column CV and resume layout.',
    level: 'Check layout and readability for your content',
    link: 'https://www.overleaf.com/latex/templates/deedy-cv/bjryvfsjdyxz',
  },
  {
    category: 'Resume templates',
    title: 'Undergraduate CV Template',
    provider: 'Overleaf template',
    description: 'A student-focused CV template with sections for education, experience, presentations, and publications.',
    level: 'Undergraduate and graduate students',
    link: 'https://www.overleaf.com/latex/templates/undergraduate-cv-template/wkvwgwjqybbg',
  },
  {
    category: 'Resume templates',
    title: 'PlushCV',
    provider: 'Overleaf template',
    description: 'A one-page, two-column resume template designed for software developers.',
    level: 'Software developer resumes',
    link: 'https://www.overleaf.com/latex/templates/plushcv/jybpnsftmdkf',
  },
  {
    category: 'Semester preparation',
    title: 'SyllabusX',
    provider: 'SyllabusX',
    description: 'A study resource to help organize semester preparation around your syllabus.',
    level: 'For semester coursework and exam preparation',
    link: 'https://syllabusx.live/',
  },
]

const categoryIcons = {
  'DSA & SDE preparation': Code2,
  'SQL & database practice': Database,
  'System design': Network,
  'DRDO internship information': GraduationCap,
  'Student programs & communities': GraduationCap,
  'Web development': Code2,
  'Resume templates': FileText,
  'Semester preparation': BookOpen,
}

const Resources = () => {
  const location = useLocation()
  const [selectedCategory, setSelectedCategory] = useState(location.state?.category || null)
  const categories = useMemo(() => [...new Set(resources.map((resource) => resource.category))], [])
  const selectedResources = resources.filter((resource) => resource.category === selectedCategory)

  return (
    <main className='min-h-full bg-bg px-4 py-10 text-text sm:px-8 sm:py-14'>
      <div className='mx-auto max-w-6xl'>
        <div className='flex items-start gap-4'>
          <div className='rounded-2xl bg-primary/15 p-3 text-primary'><Laptop className='h-6 w-6' /></div>
          <div>
            <h1 className='text-3xl font-semibold sm:text-4xl'>Student resources</h1>
            <p className='mt-2 text-sm text-text-dim sm:text-base'>Resources I recommend from my four-year engineering journey.</p>
          </div>
        </div>

        {selectedCategory ? (
          <div className='mt-8'>
            <button type='button' onClick={() => setSelectedCategory(null)} className='mb-3 inline-flex items-center gap-1 text-sm text-text-dim transition hover:text-primary'>
              <ChevronLeft className='h-4 w-4' /> All sections
            </button>
            <h2 className='text-2xl font-semibold'>{selectedCategory}</h2>
            <p className='mt-1 text-sm text-text-dim'>{selectedResources.length} curated resources</p>
            <div className='mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {selectedResources.map((resource) => (
                <article key={resource.title} className='flex h-full flex-col rounded-2xl border border-border bg-white/[0.03] p-5 sm:p-6'>
                  <span className='w-fit rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary'>{resource.provider}</span>
                  <h3 className='mt-4 text-lg font-semibold leading-snug'>{resource.title}</h3>
                  <p className='mt-3 text-sm leading-relaxed text-text-dim'>{resource.description}</p>
                  <p className='mt-4 text-xs text-text-dim'><span className='font-medium text-text'>Level: </span>{resource.level}</p>
                  <a href={resource.link} target='_blank' rel='noopener noreferrer' className='mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:scale-[1.02]'>
                    Open resource <ExternalLink className='h-4 w-4' />
                  </a>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className='mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {categories.map((category) => {
              const Icon = categoryIcons[category] || BookOpen
              const count = resources.filter((resource) => resource.category === category).length
              return (
                <button key={category} type='button' onClick={() => setSelectedCategory(category)} className='group rounded-2xl border border-border bg-white/[0.03] p-5 text-left transition hover:-translate-y-1 hover:border-primary/60 hover:bg-primary/[0.06] sm:p-6'>
                  <span className='flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary'><Icon className='h-5 w-5' /></span>
                  <span className='mt-5 flex items-center justify-between gap-3'>
                    <span className='font-semibold text-text'>{category}</span>
                    <ArrowRight className='h-4 w-4 shrink-0 text-text-dim transition group-hover:translate-x-1 group-hover:text-primary' />
                  </span>
                  <span className='mt-2 block text-sm text-text-dim'>{count} resources with descriptions and direct links</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

export default Resources
