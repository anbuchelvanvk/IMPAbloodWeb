"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from '../lib/navigation';
import Navbar from './components/Navbar';
import Home from './ui-pages/Home';
import Register from './ui-pages/Register';
import Login from './ui-pages/Login';
import ResetPassword from './ui-pages/ResetPassword';
import BloodRequests from './ui-pages/BloodRequests';
import CreateRequest from './ui-pages/CreateRequest';
import AdminDashboard from './ui-pages/AdminDashboard';
import FoodDonation from './ui-pages/FoodDonation';
import Contact from './ui-pages/Contact';
import ChatPortal from './ui-pages/ChatPortal';
import Profile from './ui-pages/Profile';
import About from './ui-pages/About';
import Team from './ui-pages/Team';
import PrivacyPolicy from './ui-pages/PrivacyPolicy';
import Footer from './components/Footer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <Router>
        <div className="flex-col" style={{ minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/requests" element={<BloodRequests />} />
              <Route path="/food-donation" element={<FoodDonation />} />
              <Route path="/about" element={<About />} />
              <Route path="/team" element={<Team />} />
              <Route path="/contact" element={<Contact />} />
              <Route 
                path="/create-request" 
                element={
                  <ProtectedRoute>
                    <CreateRequest />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chat" 
                element={
                  <ProtectedRoute>
                    <ChatPortal />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route path="/privacy" element={<PrivacyPolicy />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
