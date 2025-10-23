import { createContext, useContext, useReducer, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../constants";

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: false,
  loading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Validate token by fetching user profile
          const response = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          const data = await response.json();

          if (data.status === 200) {
            dispatch({
              type: "LOGIN_SUCCESS",
              payload: {
                user: data.data.user,
                token: token,
              },
            });
          } else {
            // Token is invalid, remove it
            localStorage.removeItem("token");
            dispatch({ type: "LOGOUT" });
          }
        } catch (error) {
          console.error("Token validation error:", error);
          localStorage.removeItem("token");
          dispatch({ type: "LOGOUT" });
        }
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.status === 200) {
        localStorage.setItem("token", data.data.token);

        // Get user profile after successful login
        try {
          const profileResponse = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: {
              Authorization: `Bearer ${data.data.token}`,
              "Content-Type": "application/json",
            },
          });

          const profileData = await profileResponse.json();

          if (profileData.status === 200) {
            dispatch({
              type: "LOGIN_SUCCESS",
              payload: {
                user: profileData.data.user,
                token: data.data.token,
              },
            });
          } else {
            // Fallback if profile fetch fails
            dispatch({
              type: "LOGIN_SUCCESS",
              payload: {
                user: { email }, // Use email as fallback
                token: data.data.token,
              },
            });
          }
        } catch (profileError) {
          console.error("Error fetching user profile:", profileError);
          // Fallback if profile fetch fails
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: {
              user: { email }, // Use email as fallback
              token: data.data.token,
            },
          });
        }

        navigate("/home");
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: "Network error" };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (data.status === 201) {
        localStorage.setItem("token", data.data.token);
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: {
            user: data.data.user,
            token: data.data.token,
          },
        });
        navigate("/home");
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: "Network error" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    dispatch({ type: "LOGOUT" });
    navigate("/");
  };

  const updateUser = (userData) => {
    dispatch({ type: "UPDATE_USER", payload: userData });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
