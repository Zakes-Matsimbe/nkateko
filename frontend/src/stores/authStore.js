import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: undefined, // ← Start as undefined (loading state)
  theme: localStorage.getItem('nkatekoTheme') || 'light',

  initAuth: () => {
    const savedUser = localStorage.getItem('nkatekoUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        set({ user: parsed });
      } catch (e) {
        localStorage.removeItem('nkatekoUser');
        set({ user: null });
      }
    } else {
      set({ user: null });
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
    window.location.href = '/login';
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