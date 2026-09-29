import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Contact from './pages/Contact';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import MockInterview from './pages/MockInterview';
import GenerateImage from './pages/GenerateImage';
import RemoveBackground from './pages/RemoveBackground';
import RemoveObjects from './pages/RemoveObjects';
import ReviewResume from './pages/ReviewResume';
import LinkedInOptimization from './pages/LinkedInOptimization';
import Opportunities from './pages/Opportunities';
import Resources from './pages/Resources';
import ShareResources from './pages/ShareResources';
import { Toaster } from 'react-hot-toast';

const App = () => {
  return (
    <div>
      <Toaster />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/linkedin-optimization' element={<Layout />}>
          <Route index element={<LinkedInOptimization />} />
        </Route>

        <Route path='/ai' element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path='mock-interview' element={<MockInterview />} />
          <Route path='opportunities' element={<Opportunities />} />
          <Route path='resources' element={<Resources />} />
          <Route path='share-resources' element={<ShareResources />} />
          <Route path='generate-images' element={<GenerateImage />} />
          <Route path='remove-background' element={<RemoveBackground />} />
          <Route path='remove-objects' element={<RemoveObjects />} />
          <Route path='review-resume' element={<ReviewResume />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;

