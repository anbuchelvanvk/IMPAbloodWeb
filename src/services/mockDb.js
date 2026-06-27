// This is a mock database service using LocalStorage 
// to ensure the app works immediately before Firebase keys are provided.

export const mockDb = {
  getUsers: () => JSON.parse(localStorage.getItem('users') || '[]'),
  setUsers: (users) => localStorage.setItem('users', JSON.stringify(users)),
  
  getRequests: () => JSON.parse(localStorage.getItem('requests') || '[]'),
  setRequests: (requests) => localStorage.setItem('requests', JSON.stringify(requests)),

  getCurrentUser: () => JSON.parse(localStorage.getItem('currentUser') || 'null'),
  setCurrentUser: (user) => localStorage.setItem('currentUser', JSON.stringify(user)),

  register: async (userData) => {
    const users = mockDb.getUsers();
    if (users.find(u => u.contact === userData.contact)) {
      throw new Error("User with this contact already exists.");
    }
    const newUser = { id: Date.now().toString(), ...userData };
    users.push(newUser);
    mockDb.setUsers(users);
    mockDb.setCurrentUser(newUser);
    return newUser;
  },

  login: async (contact, securityAnswer) => {
    const users = mockDb.getUsers();
    const user = users.find(u => u.contact === contact);
    if (!user) throw new Error("User not found.");
    if (user.securityAnswer !== securityAnswer) throw new Error("Incorrect security answer.");
    mockDb.setCurrentUser(user);
    return user;
  },

  logout: () => {
    localStorage.removeItem('currentUser');
  },

  createRequest: async (requestData) => {
    const requests = mockDb.getRequests();
    const newRequest = { id: Date.now().toString(), createdAt: new Date().toISOString(), ...requestData };
    requests.push(newRequest);
    mockDb.setRequests(requests);
    return newRequest;
  },

  getAllRequests: async () => {
    return mockDb.getRequests().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};
