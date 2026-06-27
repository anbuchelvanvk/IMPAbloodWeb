"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from '../lib/navigation';
import Webcam from 'react-webcam';
import { useAuth } from '../context/AuthContext';
import { Camera, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { SOUTH_INDIAN_STATES } from '../utils/locations';
import toast from 'react-hot-toast';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../firebase';

const generateCaptcha = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let captcha = '';
  for (let i = 0; i < 6; i++) {
    captcha += chars[Math.floor(Math.random() * chars.length)];
  }
  return captcha;
};

const Register = () => {
  const { register, loginWithGoogle, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const webcamRef = useRef(null);
  const captchaCanvasRef = useRef(null);
  const profileUser = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(window.sessionStorage.getItem('pendingProfileUser') || 'null');
    } catch {
      return null;
    }
  }, []);
  const sessionGoogleUser = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(window.sessionStorage.getItem('pendingGoogleUser') || 'null');
    } catch {
      return null;
    }
  }, []);
  const googleUser = location.state?.googleUser || profileUser || sessionGoogleUser;
  const isProfileCompletionMode = Boolean(profileUser || googleUser);
  const seedUser = googleUser || profileUser || null;
  
  const [formData, setFormData] = useState({
    name: seedUser?.name || '',
    contact: seedUser?.contact || '',
    email: seedUser?.email || '',
    bloodGroup: seedUser?.bloodGroup || '',
    state: seedUser?.state || '',
    district: seedUser?.district || '',
    password: '',
    confirmPassword: '',
    captchaInput: '',
    shareContact: seedUser?.shareContact === true,
    hasDonatedBefore: 'no',
    lastDonationDate: seedUser?.lastDonationDate ? String(seedUser.lastDonationDate).split('T')[0] : ''
  });
  
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceApi, setFaceApi] = useState(null);
  const [faceVerified, setFaceVerified] = useState(seedUser?.faceVerified === true);
  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [cameraDenied, setCameraDenied] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const isCompletionUi = hydrated && isProfileCompletionMode;

  useEffect(() => {
    if (!googleUser) return;
    setFormData((prev) => {
      const nextName = googleUser.name || prev.name;
      const nextEmail = googleUser.email || prev.email;
      if (nextName === prev.name && nextEmail === prev.email) return prev;
      return { ...prev, name: nextName, email: nextEmail };
    });
    if (googleUser.faceVerified === true) {
      setFaceVerified(true);
      setVerificationStatus('verified');
    }
    setLoading(false);
  }, [googleUser?.uid, googleUser?.name, googleUser?.email, googleUser?.faceVerified]);

  useEffect(() => {
    if (!isCompletionUi || !seedUser) return;
    setFormData((prev) => ({
      ...prev,
      name: seedUser.name || prev.name,
      contact: seedUser.contact || prev.contact,
      email: seedUser.email || prev.email,
      bloodGroup: seedUser.bloodGroup || prev.bloodGroup,
      state: seedUser.state || prev.state,
      district: seedUser.district || prev.district,
      shareContact: seedUser.shareContact === true ? true : prev.shareContact,
      lastDonationDate: seedUser.lastDonationDate ? String(seedUser.lastDonationDate).split('T')[0] : prev.lastDonationDate
    }));
    if (seedUser.faceVerified === true) {
      setFaceVerified(true);
      setVerificationStatus('verified');
    }
  }, [
    isCompletionUi,
    seedUser?.uid,
    seedUser?.name,
    seedUser?.contact,
    seedUser?.email,
    seedUser?.bloodGroup,
    seedUser?.state,
    seedUser?.district,
    seedUser?.shareContact,
    seedUser?.lastDonationDate,
    seedUser?.faceVerified
  ]);

  useEffect(() => {
    if (!isCompletionUi || !auth?.currentUser) return;
    let active = true;
    (async () => {
      try {
        const latest = await firebaseService.refreshCurrentUser();
        if (!active || !latest || latest.needsRegistration !== true) return;
        setFormData((prev) => ({
          ...prev,
          name: latest.name || prev.name,
          contact: latest.contact || prev.contact,
          email: latest.email || prev.email,
          bloodGroup: latest.bloodGroup || prev.bloodGroup,
          state: latest.state || prev.state,
          district: latest.district || prev.district,
          shareContact: latest.shareContact === true ? true : prev.shareContact,
          lastDonationDate: latest.lastDonationDate ? String(latest.lastDonationDate).split('T')[0] : prev.lastDonationDate
        }));
        if (latest.faceVerified === true) {
          setFaceVerified(true);
          setVerificationStatus('verified');
        }
        sessionStorage.setItem('pendingProfileUser', JSON.stringify(latest));
      } catch {}
    })();
    return () => {
      active = false;
    };
  }, [isCompletionUi]);

  // Draw captcha on canvas
  useEffect(() => {
    if (captchaCanvasRef.current) {
      const canvas = captchaCanvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Clear background
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add some noise (lines)
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.strokeStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255}, 0.5)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Add noise (dots)
      for (let i = 0; i < 30; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.random()*255},${Math.random()*255},${Math.random()*255}, 0.5)`;
        ctx.fill();
      }

      // Draw the text
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = '#333';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      // Draw character by character with slight rotation and distortion
      for (let i = 0; i < captcha.length; i++) {
        ctx.save();
        ctx.translate(25 + (i * 20), canvas.height / 2);
        ctx.rotate((Math.random() - 0.5) * 0.4); // rotate slightly
        ctx.fillText(captcha[i], 0, 0);
        ctx.restore();
      }
    }
  }, [captcha]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setVerificationStatus('loading_models');
        const faceapi = await import('@vladmandic/face-api');
        setFaceApi(faceapi);
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        setModelsLoaded(true);
        setVerificationStatus('idle');
      } catch (err) {
        console.error("Failed to load face-api models", err);
        setVerificationStatus('models_failed');
      }
    };
    loadModels();
  }, []);

  const openCameraForVerification = async () => {
    setError('');
    setCameraDenied(false);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setError('Camera access is not supported in this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      if (verificationStatus === 'models_failed') {
        setVerificationStatus('loading_models');
        try {
          const faceapi = await import('@vladmandic/face-api');
          setFaceApi(faceapi);
          await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
          setModelsLoaded(true);
          setVerificationStatus('idle');
        } catch {
          setVerificationStatus('models_failed');
          setError('Face verification model failed to load. Refresh and try again.');
          return;
        }
      }
      setIsCameraOpen(true);
    } catch (err) {
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setCameraDenied(true);
        setError('Camera permission is blocked. Allow camera access in browser site settings and retry.');
      } else {
        setError('Unable to access camera. Check if another app is using it and try again.');
      }
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleStateChange = (e) => {
    setFormData({ ...formData, state: e.target.value, district: '' });
  };

  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    let interval;
    if (isCameraOpen && modelsLoaded && faceApi) {
      let consecutiveFrames = 0;
      let movementQualified = false;
      let firstCenterX = null;
      const startedAt = Date.now();
      setVerificationStatus('verifying');
      interval = setInterval(async () => {
        if (!webcamRef.current || !webcamRef.current.video) return;
        const video = webcamRef.current.video;
        if (video.readyState !== 4) return;

        if (Date.now() - startedAt > 25_000) {
          clearInterval(interval);
          setIsCameraOpen(false);
          setFaceDetected(false);
          setFaceVerified(false);
          setVerificationStatus('failed_timeout');
          setError('Face verification timed out. Please try again in good lighting.');
          return;
        }

        const detections = await faceApi.detectAllFaces(video, new faceApi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }));
        
        if (detections.length > 0) {
          const box = detections[0]?.box;
          const centerX = box ? (box.x + (box.width / 2)) : null;
          if (typeof centerX === 'number') {
            if (firstCenterX === null) firstCenterX = centerX;
            if (Math.abs(centerX - firstCenterX) > 18) movementQualified = true;
          }
          setFaceDetected(true);
          consecutiveFrames++;
          if (consecutiveFrames >= 6 && movementQualified) {
            clearInterval(interval);
            setIsCameraOpen(false);
            setFaceDetected(false);
            setFaceVerified(true);
            setVerificationStatus('verified');
            setError('');
          }
        } else {
          setFaceDetected(false);
          consecutiveFrames = 0;
          firstCenterX = null;
          movementQualified = false;
        }
      }, 500);
    }
    return () => {
      clearInterval(interval);
      setFaceDetected(false);
    };
  }, [isCameraOpen, modelsLoaded, faceApi]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isProfileCompletionMode) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match!');
        return;
      }
    }

    if (!isProfileCompletionMode && formData.captchaInput !== captcha) {
      setError('Invalid Captcha!');
      setCaptcha(generateCaptcha());
      setFormData({ ...formData, captchaInput: '' });
      return;
    }

    if (!faceVerified) {
      setError('Please complete live face verification.');
      return;
    }

    try {
      setLoading(true);

      if (!isProfileCompletionMode) {
        const isDuplicate = await firebaseService.checkDuplicateUser(formData.email, formData.contact);
        if (isDuplicate) {
          setError("This Email or Phone Number has been used already. Try login instead. If you feel that's not you, contact admin through the details in Contact Us page.");
          setLoading(false);
          return;
        }
      }

      let nextEligibleDate = null;
      let formattedLastDonationDate = null;
      if (formData.hasDonatedBefore === 'yes' && formData.lastDonationDate) {
        formattedLastDonationDate = new Date(formData.lastDonationDate).toISOString();
        const eligible = new Date(formData.lastDonationDate);
        eligible.setDate(eligible.getDate() + 90);
        nextEligibleDate = eligible.toISOString();
      }

      if (isProfileCompletionMode) {
        const completedUser = await firebaseService.completeProfile({
          uid: googleUser?.uid || profileUser?.uid,
          name: formData.name,
          contact: formData.contact,
          email: formData.email,
          bloodGroup: formData.bloodGroup,
          state: formData.state,
          district: formData.district,
          faceVerified: true,
          shareContact: formData.shareContact,
          lastDonationDate: formattedLastDonationDate,
          nextEligibleDate: nextEligibleDate
        });
        updateUser(completedUser);
        sessionStorage.removeItem('pendingGoogleUser');
        sessionStorage.removeItem('pendingProfileUser');
      } else {
        await register({
          name: formData.name,
          contact: formData.contact,
          email: formData.email,
          bloodGroup: formData.bloodGroup,
          state: formData.state,
          district: formData.district,
          faceVerified: true,
          shareContact: formData.shareContact,
          lastDonationDate: formattedLastDonationDate,
          nextEligibleDate: nextEligibleDate,
          password: formData.password
        });
      }
      toast('Your donor card is now ready to download! Check your profile section for your donor card download link', {
        icon: '🎉',
        duration: 5000,
      });
      navigate('/requests');
    } catch (err) {
      if (err.message.includes('auth/email-already-in-use') || err.code === 'auth/email-already-in-use') {
        toast.error('An account with this email already exists. Please login instead.', {
          icon: '🛑',
          duration: 5000,
        });
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 0' }}>
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 className="text-center mb-8">{isCompletionUi ? 'Complete Your Profile' : 'Register as Donor'}</h2>
        
        {isCompletionUi && (
          <div style={{ background: '#e3f2fd', color: '#1565c0', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
            <strong>Welcome!</strong> Please provide your contact, blood group and location details to complete your registration.
          </div>
        )}

        {error && (
          <div style={{ background: '#ffebee', color: 'var(--error)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" name="name" className="form-input" required value={formData.name} onChange={handleChange} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" name="email" className="form-input" required value={formData.email} onChange={handleChange} readOnly={isCompletionUi} style={{ background: isCompletionUi ? '#f5f5f5' : 'white' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input type="tel" name="contact" className="form-input" required value={formData.contact} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Blood Group</label>
            <select name="bloodGroup" className="form-select" required value={formData.bloodGroup} onChange={handleChange}>
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="A1+">A1+</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">State</label>
              <select name="state" className="form-select" required value={formData.state} onChange={handleStateChange}>
                <option value="">Select State</option>
                {Object.keys(SOUTH_INDIAN_STATES).map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">District</label>
              <select name="district" className="form-select" required value={formData.district} onChange={handleChange} disabled={!formData.state}>
                <option value="">Select District</option>
                {formData.state && SOUTH_INDIAN_STATES[formData.state].map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group mb-6">
            <label className="form-label" style={{ fontWeight: 600, color: 'var(--text)' }}>Have you donated blood previously?</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="hasDonatedBefore" value="yes" checked={formData.hasDonatedBefore === 'yes'} onChange={handleChange} style={{ accentColor: 'var(--primary)' }} />
                Yes
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="hasDonatedBefore" value="no" checked={formData.hasDonatedBefore === 'no'} onChange={handleChange} style={{ accentColor: 'var(--primary)' }} />
                No
              </label>
            </div>
          </div>

          {formData.hasDonatedBefore === 'yes' && (
            <div className="form-group mb-6" style={{ background: 'rgba(29, 53, 87, 0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(29, 53, 87, 0.1)' }}>
              <label className="form-label">Last Donated Date <span style={{color: 'var(--error)'}}>*</span></label>
              <input type="date" name="lastDonationDate" className="form-input" max={new Date().toISOString().split('T')[0]} required={formData.hasDonatedBefore === 'yes'} value={formData.lastDonationDate} onChange={handleChange} />
              <p className="text-light mt-2" style={{ fontSize: '0.85rem', marginBottom: 0 }}>
                Note: You can always change the date of donation later in your profile page.
              </p>
            </div>
          )}

          <div className="form-group mb-6" style={{ background: 'rgba(230, 57, 70, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(230, 57, 70, 0.1)' }}>
            <label className="flex cursor-pointer" style={{ alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                name="shareContact"
                checked={formData.shareContact}
                onChange={handleChange}
                style={{ marginTop: '0.2rem', marginRight: '1rem', width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)', flexShrink: 0 }}
              />
              <div style={{ lineHeight: '1.4' }}>
                <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem', color: 'var(--text)', fontSize: '1.05rem' }}>
                  Publicly share my contact details
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', display: 'block' }}>
                  Are you ready to share your number so patients can contact you anytime regarding blood donation? If yes, your name, contact, and location will be publicly visible on the home page.
                </span>
              </div>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Live Photo Verification <span style={{color: 'var(--error)'}}>*</span></label>
            {faceVerified ? (
              <div className="text-center">
                <div style={{ marginBottom: '1rem', background: 'rgba(230, 57, 70, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(230, 57, 70, 0.1)' }}>
                  <p className="text-light" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    {seedUser?.faceVerified === true ? 'Face already verified. No photo is stored.' : 'Face verification completed. No photo is stored.'}
                  </p>
                </div>

                <button type="button" className="btn btn-outline" onClick={() => { setFaceVerified(false); setVerificationStatus('idle'); setIsCameraOpen(true); }}>
                  Re-verify Face
                </button>
              </div>
            ) : isCameraOpen ? (
              <div className="webcam-container" style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user" }}
                  onUserMedia={() => {
                    setCameraDenied(false);
                    setError('');
                  }}
                  onUserMediaError={(err) => {
                    const name = err?.name || '';
                    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
                      setCameraDenied(true);
                      setError('Camera permission is blocked. Allow permission and retry.');
                    } else {
                      setError('Camera stream failed to start. Retry after closing other camera apps.');
                    }
                  }}
                  style={{ width: '100%', display: 'block' }}
                />
                
                {/* Face Detection Overlay */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: '10%', 
                    left: '20%', 
                    right: '20%', 
                    bottom: '10%', 
                    border: `4px dashed ${faceDetected ? 'var(--success)' : 'var(--error)'}`,
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    transition: 'border-color 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <p style={{ 
                    color: faceDetected ? 'var(--success)' : 'var(--error)', 
                    background: 'rgba(255,255,255,0.9)', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem', 
                    fontWeight: 600,
                    marginTop: 'auto',
                    marginBottom: '-2rem'
                  }}>
                    {faceDetected ? 'Face detected. Move slightly to verify...' : 'Position face in frame'}
                  </p>
                </div>
              </div>
            ) : (
              <button type="button" className="btn btn-outline w-full" onClick={openCameraForVerification}>
                <Camera size={20} /> Open Camera
              </button>
            )}
            {verificationStatus === 'loading_models' && (
              <p className="text-light mt-2" style={{ fontSize: '0.85rem' }}>Loading verification models...</p>
            )}
            {verificationStatus === 'failed_timeout' && (
              <p className="text-light mt-2" style={{ fontSize: '0.85rem', color: 'var(--error)' }}>
                Verification timed out. Re-open camera and try again.
              </p>
            )}
            {cameraDenied && (
              <p className="text-light mt-2" style={{ fontSize: '0.85rem', color: 'var(--error)' }}>
                Camera permission denied by browser.
              </p>
            )}
          </div>

          {!isCompletionUi && (
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    className="form-input" 
                    required 
                    value={formData.password} 
                    onChange={handleChange} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    name="confirmPassword" 
                    className="form-input" 
                    required 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          )}



          {!isCompletionUi && (
            <div className="form-group">
              <label className="form-label">Captcha Verification</label>
              <div className="flex gap-4 items-center mb-2">
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <canvas
                    ref={captchaCanvasRef}
                    width="150"
                    height="50"
                    style={{ display: 'block' }}
                  />
                </div>
                <button type="button" onClick={() => setCaptcha(generateCaptcha())} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }} title="Reload Captcha">
                  <RefreshCw size={24} />
                </button>
              </div>
              <input
                type="text"
                name="captchaInput"
                className="form-input"
                placeholder="Enter the characters above"
                required
                value={formData.captchaInput}
                onChange={handleChange}
                onPaste={(e) => {
                  e.preventDefault();
                  toast.error("Pasting is not allowed for captcha verification");
                }}
                onDrop={(e) => e.preventDefault()}
                autoComplete="off"
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full mt-8" disabled={loading}>
            {loading ? (isCompletionUi ? 'Completing Profile...' : 'Registering...') : (isCompletionUi ? 'Complete Registration' : 'Register Account')}
          </button>

          {!isCompletionUi && (
            <>
              <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-light)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px solid var(--border)', zIndex: 1 }}></div>
                <span style={{ background: 'white', padding: '0 10px', position: 'relative', zIndex: 2, fontSize: '0.9rem' }}>OR SIGN UP WITH</span>
              </div>

              <div className="grid grid-cols-1 mt-6">
                <button type="button" className="btn btn-outline" disabled={loading} onClick={async () => {
                  try {
                    setLoading(true);
                    const userData = await loginWithGoogle();
                    if (userData?.needsRegistration) {
                      toast('Please complete your profile details to finish registration', { icon: 'ℹ️', duration: 5000 });
                      sessionStorage.setItem('pendingGoogleUser', JSON.stringify(userData));
                      navigate('/register');
                    } else {
                      navigate('/requests');
                    }
                  } catch (err) {
                    setError(err.message || 'Google signup failed');
                    setLoading(false);
                  }
                }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px' }} />
                  Google
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default Register;
