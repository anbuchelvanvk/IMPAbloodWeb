"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { firebaseService } from '../services/firebaseService';
import { Send, MessageCircle, AlertCircle, X } from 'lucide-react';
import { useNavigate } from '../lib/navigation';
import toast from 'react-hot-toast';

const ChatPortal = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesContainerRef = useRef(null);
  
  const [showEndModal, setShowEndModal] = useState(false);
  const [endStep, setEndStep] = useState('initial');
  const [endStepSelection, setEndStepSelection] = useState('cancel');
  const [otp, setOtp] = useState('');
  const [endLoading, setEndLoading] = useState(false);
  const unifiedPollInFlight = useRef(false);
  const isFirstPoll = useRef(true);
  const messageCursorRef = useRef('');
  const firstLoadGuardRef = useRef(null);
  const pollFailureCountRef = useRef(0);
  const pollWarnedRef = useRef(false);

  // Unified polling loop to avoid overlapping chat/message polling storms.
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    let pollTimer = null;
    firstLoadGuardRef.current = setTimeout(() => {
      if (!active) return;
      setLoading(false);
    }, 8000);
    const canPoll = () =>
      active &&
      typeof window !== 'undefined' &&
      window.navigator.onLine;
    const nextDelayMs = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return 120_000;
      if (typeof document !== 'undefined' && !document.hasFocus()) return 60_000;
      return activeChat ? 10_000 : 25_000;
    };
    const poll = async () => {
      if (!canPoll()) {
        if (isFirstPoll.current) {
          isFirstPoll.current = false;
          if (active) setLoading(false);
        }
        if (active) pollTimer = setTimeout(poll, nextDelayMs());
        return;
      }
      if (unifiedPollInFlight.current) return;
      unifiedPollInFlight.current = true;
      try {
        const data = await firebaseService.listMyChats(user.id);
        if (!active) return;
        pollFailureCountRef.current = 0;
        const nextChats = data.filter((c) => c.status !== 'cancelled').sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setChats(nextChats);
        const selectedId = activeChat?.id;
        if (selectedId) {
            const selected = nextChats.find((c) => c.id === selectedId);
            if (selected) {
              if (messageCursorRef.current) {
                const delta = await firebaseService.listChatMessagesPage(selectedId, messageCursorRef.current, 80);
                if (!active) return;
                const incoming = Array.isArray(delta?.items) ? delta.items : [];
                if (incoming.length > 0) {
                  setMessages((prev) => [...prev, ...incoming]);
                  messageCursorRef.current = incoming[incoming.length - 1].id;
                  firebaseService.setChatMessageCursor(user.id, selectedId, messageCursorRef.current).catch(() => {});
                }
              }
            }
          }
      } catch {
        pollFailureCountRef.current += 1;
      } finally {
        if (pollFailureCountRef.current > 0 && !pollWarnedRef.current && pollFailureCountRef.current >= 3) {
          pollWarnedRef.current = true;
          toast.error('Chat sync is slow right now. Retrying in background.');
        }
        if (isFirstPoll.current) {
          isFirstPoll.current = false;
          if (active) setLoading(false);
        }
        unifiedPollInFlight.current = false;
        if (active) {
          pollTimer = setTimeout(poll, nextDelayMs());
        }
      }
    };
    poll();
    const resumeOnFocus = () => {
      if (!active) return;
      clearTimeout(pollTimer);
      poll();
    };
    window.addEventListener('focus', resumeOnFocus);
    window.addEventListener('online', resumeOnFocus);
    document.addEventListener('visibilitychange', resumeOnFocus);
    return () => {
      active = false;
      clearTimeout(pollTimer);
      clearTimeout(firstLoadGuardRef.current);
      window.removeEventListener('focus', resumeOnFocus);
      window.removeEventListener('online', resumeOnFocus);
      document.removeEventListener('visibilitychange', resumeOnFocus);
    };
  }, [user, activeChat?.id]);

  // Update activeChat status if it changes in the main list
  useEffect(() => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 100);
  }, [messages]);

  useEffect(() => {
    if (activeChat) {
      const updated = chats.find(c => c.id === activeChat.id);
      if (updated && updated.status !== activeChat.status) {
        setActiveChat(updated);
      }
    }
  }, [chats, activeChat]);

  useEffect(() => {
    if (!user || !activeChat?.id) return;
    let disposed = false;
    (async () => {
      try {
        const savedCursor = await firebaseService.getChatMessageCursor(user.id, activeChat.id);
        if (disposed) return;
        if (savedCursor && typeof savedCursor === 'string') {
          messageCursorRef.current = savedCursor;
          const msgs = await firebaseService.listChatMessages(activeChat.id, user.id);
          if (disposed) return;
          setMessages(msgs);
          if (msgs.length > 0) {
            messageCursorRef.current = msgs[msgs.length - 1].id;
            firebaseService.setChatMessageCursor(user.id, activeChat.id, messageCursorRef.current).catch(() => {});
          }
        } else {
          messageCursorRef.current = '';
          const msgs = await firebaseService.listChatMessages(activeChat.id, user.id);
          if (disposed) return;
          setMessages(msgs);
          if (msgs.length > 0) {
            messageCursorRef.current = msgs[msgs.length - 1].id;
            firebaseService.setChatMessageCursor(user.id, activeChat.id, messageCursorRef.current).catch(() => {});
          }
        }
      } catch {}
    })();
    return () => { disposed = true; };
  }, [user?.id, activeChat?.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || activeChat.status === 'ended') return;
    
    try {
      await firebaseService.sendMessage(activeChat.id, user.id, newMessage);
      firebaseService.invalidateAfterMutation(user.id);
      setNewMessage('');
      const optimistic = {
        id: `local-${Date.now()}`,
        senderId: user.id,
        text: newMessage,
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, optimistic]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndChatClick = () => {
    setShowEndModal(true);
    setEndStep('initial');
    setOtp('');
  };

  const submitOTP = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setEndLoading(true);
    try {
      await firebaseService.verifyOTPAndFulfill(activeChat.requestId, activeChat.id, otp);
      firebaseService.invalidateAfterMutation(user.id);
      
      const today = new Date();
      const nextEligible = new Date(today);
      nextEligible.setDate(today.getDate() + 90);
      updateUser({ ...user, lastDonationDate: today.toISOString(), nextEligibleDate: nextEligible.toISOString() });

      toast.success("Donation verified! Thank you for your service. This chat has been completely deleted from our database for your privacy and security.", { duration: 8000, icon: '🏆' });
      setShowEndModal(false);
      setActiveChat(null);
    } catch (err) {
      toast.error("Invalid PIN. Please ask the requester for the correct 6-digit PIN.");
    } finally {
      setEndLoading(false);
    }
  };

  const cancelAndKeepAlive = async () => {
    if (window.confirm("This will delete the chat, but the blood request will remain open for others. Continue?")) {
      try {
        await firebaseService.updateRequestStatus(activeChat.requestId, 'Open');
        await firebaseService.cancelChat(activeChat.id);
        firebaseService.invalidateAfterMutation(user.id);
        setShowEndModal(false);
        setActiveChat(null);
        toast("Chat closed. Request remains open.");
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (!user) {
    return (
      <div className="container text-center" style={{ padding: '5rem 0' }}>
        <MessageCircle size={64} className="text-light mx-auto mb-4" />
        <h2>Login Required</h2>
        <p className="text-light mb-6">Please login to access your chats.</p>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>Go to Login</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem 0', height: 'calc(100vh - 200px)' }}>
        <div className="grid md:grid-cols-3 gap-6 h-full">
          <div className="card" style={{ height: '100%', padding: '1rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="skeleton" style={{ height: '26px', width: '100px', marginBottom: '1rem' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ padding: '1rem', borderRadius: '8px', background: i === 0 ? 'var(--background)' : 'transparent', borderLeft: `4px solid ${i === 0 ? 'var(--primary)' : 'transparent'}` }}>
                  <div className="skeleton" style={{ height: '18px', width: '70%', marginBottom: '0.4rem' }} />
                  <div className="skeleton" style={{ height: '14px', width: '50%' }} />
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 card" style={{ height: '100%', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--background)' }}>
              <div>
                <div className="skeleton" style={{ height: '22px', width: '220px', marginBottom: '0.4rem' }} />
                <div className="skeleton" style={{ height: '16px', width: '140px' }} />
              </div>
              <div className="skeleton" style={{ height: '40px', width: '100px', borderRadius: '12px' }} />
            </div>
            <div style={{ flex: 1, padding: '1.5rem', background: '#f8f9fa', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '1rem' }}>
              {[{ me: false, w: '55%' }, { me: true, w: '45%' }, { me: false, w: '65%' }, { me: true, w: '40%' }].map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.me ? 'flex-end' : 'flex-start' }}>
                  <div className="skeleton" style={{ height: '52px', width: m.w, borderRadius: m.me ? '18px 18px 0 18px' : '18px 18px 18px 0' }} />
                </div>
              ))}
            </div>
            <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', background: 'white', display: 'flex', gap: '0.75rem' }}>
              <div className="skeleton" style={{ flex: 1, height: '50px', borderRadius: '24px' }} />
              <div className="skeleton" style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0', height: 'calc(100vh - 200px)' }}>
      <div className="grid md:grid-cols-3 gap-6 h-full">
        
        {/* Chat List */}
        <div className="card" style={{ height: '100%', padding: '1rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h3 className="mb-4 px-2" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>My Chats</h3>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {chats.length === 0 ? (
              <p className="text-light text-center mt-8">No active chats.</p>
            ) : (
              chats.map(chat => (
                <div 
                  key={chat.id} 
                  onClick={() => setActiveChat(chat)}
                  style={{ 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    marginBottom: '0.5rem',
                    background: activeChat?.id === chat.id ? 'var(--background)' : 'transparent',
                    borderLeft: activeChat?.id === chat.id ? '4px solid var(--primary)' : '4px solid transparent',
                    transition: 'all 0.2s'
                  }}
                  className="hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-1">
                    <strong style={{ color: 'var(--secondary)' }}>{chat.patientName}</strong>
                    {chat.status === 'ended' && <span style={{ fontSize: '0.75rem', color: 'var(--error)', background: 'rgba(230, 57, 70, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>Ended</span>}
                  </div>
                  <p className="text-light" style={{ fontSize: '0.85rem', margin: 0 }}>
                    {chat.donorId === user.id ? 'You are donating' : 'You requested'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="md:col-span-2 card" style={{ height: '100%', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--background)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Donation for {activeChat.patientName}</h3>
                  <p className="text-light" style={{ margin: 0, fontSize: '0.9rem' }}>
                    {activeChat.donorId === user.id ? 'Chatting with Requester' : 'Chatting with Donor'}
                  </p>
                </div>
                {activeChat.status !== 'ended' && (
                  <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', borderColor: 'var(--error)', color: 'var(--error)' }} onClick={handleEndChatClick}>
                    End Chat
                  </button>
                )}
              </div>

              {/* Messages */}
              <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f8f9fa', scrollBehavior: 'smooth' }}>
                {messages.length === 0 ? (
                  <div className="text-center text-light mt-10">
                    <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Start the conversation to coordinate the donation.</p>
                    <p style={{ fontSize: '0.85rem' }}>Please do not share sensitive personal information.</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.senderId === user.id;
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ 
                          background: isMe ? 'var(--primary)' : 'white', 
                          color: isMe ? 'white' : 'var(--text)',
                          padding: '0.75rem 1.25rem',
                          borderRadius: isMe ? '18px 18px 0 18px' : '18px 18px 18px 0',
                          maxWidth: '75%',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                        }}>
                          <p style={{ margin: 0 }}>{msg.text}</p>
                          <span style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '5px', display: 'block', textAlign: isMe ? 'right' : 'left' }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Area */}
              <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', background: 'white' }}>
                {activeChat.status === 'ended' ? (
                  <div className="flex items-center justify-center gap-2 text-light" style={{ padding: '0.5rem' }}>
                    <AlertCircle size={18} />
                    <span>This chat session has been ended.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Type a message..." 
                      style={{ flex: 1, marginBottom: 0, borderRadius: '24px', padding: '0.75rem 1.25rem' }}
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" style={{ borderRadius: '50%', width: '50px', height: '50px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Send size={20} />
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-light flex-col">
              <MessageCircle size={64} className="mb-4 opacity-30" />
              <p>Select a chat from the sidebar to view messages.</p>
            </div>
          )}
        </div>

      </div>

      {/* End Chat Modal */}
      {showEndModal && activeChat && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ margin: 0 }}>End Chat Session</h3>
              <button onClick={() => setShowEndModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={24} /></button>
            </div>
            
            {endStep === 'initial' ? (
              <div className="flex flex-col gap-4">
                <p className="text-light mb-2">How would you like to resolve this blood request?</p>
                <select 
                  className="form-select mb-4" 
                  value={endStepSelection} 
                  onChange={(e) => setEndStepSelection(e.target.value)}
                  style={{ padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', border: '2px solid var(--border)' }}
                >
                  <option value="cancel">No, I didn't donate (Keep request open)</option>
                  <option value="fulfilled">Yes, blood was successfully donated</option>
                </select>
                <div className="flex gap-3 justify-end mt-2">
                  <button className="btn btn-outline" onClick={() => setShowEndModal(false)}>
                    Back
                  </button>
                  <button className="btn btn-primary" onClick={() => {
                    if (endStepSelection === 'fulfilled') {
                      setEndStep('fulfilled');
                    } else {
                      cancelAndKeepAlive();
                    }
                  }}>
                    Confirm
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitOTP}>
                <p style={{ marginBottom: '1rem' }}>
                  To verify the donation, please enter the <strong>6-digit Donation PIN</strong>. 
                  <br/><br/>
                  <span className="text-light" style={{ fontSize: '0.9rem' }}>The requester can find this PIN in their Profile page under "Active Blood Requests".</span>
                </p>
                <div className="form-group">
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter 6-digit PIN" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    style={{ fontSize: '1.25rem', letterSpacing: '2px', textAlign: 'center' }}
                    maxLength={6}
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button type="button" className="btn btn-outline flex-1" onClick={() => setEndStep('initial')}>Back</button>
                  <button type="submit" className="btn btn-primary flex-1" disabled={endLoading}>
                    {endLoading ? 'Verifying...' : 'Verify & Fulfill'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatPortal;
