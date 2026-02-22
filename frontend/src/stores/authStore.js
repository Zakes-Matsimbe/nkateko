import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  theme: localStorage.getItem('nkatekoTheme') || 'light',

  // Load from localStorage on app start
  initAuth: () => {
    const savedUser = localStorage.getItem('nkatekoUser');
    if (savedUser) {
      try {
        set({ user: JSON.parse(savedUser) });
      } catch (e) {
        localStorage.removeItem('nkatekoUser');
      }
    }
    const savedTheme = localStorage.getItem('nkatekoTheme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-bs-theme', savedTheme);
    }
  },

  login: (userData) => {
    localStorage.setItem('nkatekoUser', JSON.stringify(userData));
    set({ user: userData });
  },

  logout: () => {
    localStorage.removeItem('nkatekoUser');
    localStorage.removeItem('nkatekoToken');
    set({ user: null });
    window.location.href = '/'; // force redirect to home
  },

  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('nkatekoTheme', newTheme);
      document.documentElement.setAttribute('data-bs-theme', newTheme);
      return { theme: newTheme };
    });
  },
}));

export default useAuthStore;