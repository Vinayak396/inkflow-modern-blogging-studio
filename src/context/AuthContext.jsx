import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("inkflow-token");
    if (token) {
      api.getMe()
        .then((data) => setUser({ id: data._id, name: data.name, email: data.email, avatar: data.avatar }))
        .catch(() => localStorage.removeItem("inkflow-token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signup = async (name, email, password) => {
    try {
      const data = await api.signup(name, email, password);
      if (data.error) return { error: data.error };
      return { needsVerification: true, userId: data.userId };
    } catch {
      return { error: "Cannot connect to server. Please try again." };
    }
  };

  const verifyOtp = async (userId, otp) => {
    try {
      const data = await api.verifyOtp(userId, otp);
      if (data.error) return { error: data.error };
      localStorage.setItem("inkflow-token", data.token);
      setUser({ id: data.user._id, name: data.user.name, email: data.user.email, avatar: data.user.avatar });
      return {};
    } catch {
      return { error: "Cannot connect to server. Please try again." };
    }
  };

  const resendOtp = async (userId) => {
    try {
      const data = await api.resendOtp(userId);
      if (data.error) return { error: data.error };
      return {};
    } catch {
      return { error: "Cannot connect to server. Please try again." };
    }
  };

  const login = async (email, password) => {
    try {
      const data = await api.login(email, password);
      if (data.error) return { error: data.error };
      if (data.needsVerification) return { needsVerification: true, userId: data.userId };
      localStorage.setItem("inkflow-token", data.token);
      setUser({ id: data.user._id, name: data.user.name, email: data.user.email, avatar: data.user.avatar });
      return {};
    } catch {
      return { error: "Cannot connect to server. Please try again." };
    }
  };

  const googleLogin = async (credential) => {
    try {
      const data = await api.googleAuth(credential);
      if (data.error) return { error: data.error };
      localStorage.setItem("inkflow-token", data.token);
      setUser({ id: data.user._id, name: data.user.name, email: data.user.email, avatar: data.user.avatar });
      return {};
    } catch {
      return { error: "Cannot connect to server. Please try again." };
    }
  };

  const logout = () => {
    localStorage.removeItem("inkflow-token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, verifyOtp, resendOtp, login, logout, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
