
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SignIn, SignUp, useUser, useAuth } from '@clerk/clerk-react';
import { Layout } from './components/Layout';
import { Feed } from './pages/Feed';
import { Discover } from './pages/Discover';
import { Communities } from './pages/Communities';
import { Messages } from './pages/Messages';
import { Profile } from './pages/Profile';
import { syncClerkUser } from './services/userService';
import { NotificationProvider } from './components/NotificationContext';

const App: React.FC = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  // Sync Clerk user with Supabase
  useEffect(() => {
    const syncUser = async () => {
      if (user) {
        // Sync user profile with Supabase
        await syncClerkUser({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          emailAddresses: user.emailAddresses.map(e => ({ emailAddress: e.emailAddress })),
        });
      }
    };

    if (isSignedIn && user) {
      syncUser();
    }
  }, [isSignedIn, user]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fffcf9]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ff7a59] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#3e2723] font-bold">Loading BookCircle...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <NotificationProvider>
        {!isSignedIn ? (
          <Routes>
            <Route
              path="/sign-in/*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-pattern p-4">
                  <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
                </div>
              }
            />
            <Route
              path="/sign-up/*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-pattern p-4">
                  <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
                </div>
              }
            />
            <Route path="*" element={<Navigate to="/sign-in" replace />} />
          </Routes>
        ) : (
          <Layout>
            <Routes>
              <Route path="/" element={<Feed />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/sign-in/*" element={<Navigate to="/" replace />} />
              <Route path="/sign-up/*" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        )}
      </NotificationProvider>
    </Router>
  );
};

export default App;
