import { useUser } from '@clerk/clerk-react'
import { NavLink } from 'react-router-dom'
import { Award, BookOpen, Briefcase, FileText, House, Image, Laptop, Share2 } from 'lucide-react'

const navItems = [
  { to: '/ai', label: 'Dashboard', Icon: House },
  { to: '/linkedin-optimization', label: 'LinkedIn Optimization', Icon: Briefcase },
  { to: '/ai/generate-images', label: 'Generate Images', Icon: Image },
  { to: '/ai/opportunities', label: 'Opportunities', Icon: Award },
  { to: '/ai/resources', label: 'Resources', Icon: BookOpen },
  { to: '/ai/review-resume', label: 'Review Resume', Icon: FileText },
  { to: '/ai/mock-interview', label: 'Mock Interview', Icon: Laptop },
  { to: '/ai/share-resources', label: 'Share Resources', Icon: Share2 },

]

const Sidebar = ({ sidebar, setSidebar }) => {
  const { user } = useUser()
  const displayName = user?.fullName || 'Guest'

  return (
    <div className={`w-60 bg-surface border-r border-border flex flex-col justify-between items-center max-sm:absolute top-14 bottom-0 ${sidebar ? 'translate-x-0' : 'max-sm:-translate-x-full'} transition-all duration-300 ease-in-out`}>

      <div className='my-7 w-full'>
        {user?.imageUrl && <img src={user.imageUrl} alt="User avatar" className='w-12 rounded-full mx-auto' />}
        <h1 className='mt-1 text-center text-text'>{displayName}</h1>

        <div className='mt-3'>
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/ai'}
              onClick={() => setSidebar(false)}
              className={({ isActive }) => `px-3.5 py-2.5 flex items-center gap-3 rounded text-text-dim ${isActive ? 'bg-primary text-white' : 'hover:bg-white/5'}`}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>

    </div>
  )
}

export default Sidebar
