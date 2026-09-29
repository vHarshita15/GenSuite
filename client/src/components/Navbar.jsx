import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useClerk, UserButton, useUser } from '@clerk/clerk-react';
import BrandMark from './BrandMark';

const Navbar = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { openSignIn } = useClerk();

  return (
    <div className='fixed top-0 left-0 right-0 z-50 w-full bg-bg/70 backdrop-blur-2xl border-b border-border flex justify-between items-center py-3 px-6 sm:px-10'>
      <div
        className='flex items-center gap-2 cursor-pointer font-semibold text-lg text-text'
        onClick={() => navigate('/')}
      >
        <BrandMark />
        GenSuite
      </div>

      {user ? (
        <UserButton />
      ) : (
        <button
          onClick={openSignIn}
          className='flex items-center gap-2 rounded-full text-sm cursor-pointer bg-primary hover:bg-primary-light text-white px-8 py-2.5 transition-colors'
        >
          Get started <ArrowRight className='w-4 h-4' />
        </button>
      )}
    </div>
  );
};

export default Navbar;
