import { createContext, useState, useEffect, useContext } from "react";
import API from "../services/api";
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("userInfo");
      }
    }
    setLoading(false);
  }, []);

  const register = async (userData) => {
    try {
      // Convert frontend field names to backend field names
      const backendData = {
        FullName: userData.fullName,  // frontend fullName → backend FullName
        phoneNumber: userData.phoneNumber,
        email: userData.email || undefined,  // Send undefined if empty
        password: userData.password
      };
      
      console.log('📤 Sending to backend:', backendData);
      
      const response = await API.post('/auth/register', backendData);
      console.log('📥 Response from backend:', response.data);
      
      const data = response.data;
      
      // Store user info with token
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      console.error('❌ Registration error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const message = error.response?.data?.message || error.response?.data?.error || 'Registration failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const login = async (credentials) => {
    try {
      const response = await API.post('/auth/login', credentials);
      console.log('📥 Login response:', response.data);
      
      const data = response.data;
      
      localStorage.setItem("userInfo", JSON.stringify(data));
      setUser(data);
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error.response?.data);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem("userInfo");
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      register,
      loading,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};