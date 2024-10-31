// src/components/Auth.tsx

import React, { useState, useEffect } from "react";
import Button from "./Button";
import Input from "./Input";
import Label from "./Label";
import "./Auth.css";

interface SocketMessageProps {
  result: string;
  function: string;
}

interface AuthProps {
  onLogin: (username: string, password: string, rememberMe: boolean) => void;
  onSignUp: (username: string, password: string, rememberMe: boolean) => void;
  setIsAuthenticated: (authentication: boolean) => void;
  socketMessage: SocketMessageProps | null;
  isConnected: boolean;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onSignUp, setIsAuthenticated, socketMessage, isConnected }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      onLogin(username, password, rememberMe);
    } else {
      if (!isLogin && password !== confirmPassword) {
        setErrorMessage("Passwords do not match");
        return;
      }
      if (username.length < 3) {
        setErrorMessage("Username must be at least 3 characters long");
        return;
      }
      if (!/^[a-zA-Z0-9]+$/.test(username)) {
        setErrorMessage("Username can only contain letters and numbers");
        return;
      }
      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters long");
        return;
      }
      if (!/\d/.test(password)) {
        setErrorMessage("Password must contain at least one number");
        return;
      }
      if (!/[a-zA-Z]/.test(password)) {
        setErrorMessage("Password must contain at least one English letter");
        return;
      } else {
        onSignUp(username, password, rememberMe);
      }
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setRememberMe(false);
    setErrorMessage("");
  };

  useEffect(() => {
    if (!isConnected) {
      setErrorMessage("ERROR 503: Server not connected");
      return;
    } else {
      setErrorMessage("");
    }
    if (socketMessage?.function == 'onOpen' && socketMessage?.result){
        setIsAuthenticated(true);
    }
    else if (socketMessage?.function === "signup") {
      if (socketMessage?.result) setIsAuthenticated(true);
      else setErrorMessage("Username already exists");
    } else if (socketMessage?.function === "login") {
      if (socketMessage?.result) {
        setIsAuthenticated(true);
      } else {
        setErrorMessage("Password is incorrect or the username doesn't exist");
      }
    }
  }, [socketMessage, isConnected]);

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2 className="auth-title">{isLogin ? "Login" : "Sign Up"}</h2>
        <div className="form-group">
          <Label htmlFor="username">Username</Label>
          <Input
            type="text"
            id="username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {!isLogin && (
          <div className="form-group">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              type="password"
              id="confirmPassword"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        )}
        <div className="remember-me-container">
            <input
                type="checkbox"
                id="rememberMe"
                className="remember-me-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="rememberMe" className="remember-me-label">
                Remember me
            </label>
        </div>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <Button type="submit" variant="default" fullWidth className="auth-button">
          {isLogin ? "Login" : "Sign Up"}
        </Button>
        <p className="toggle-form">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span className="toggle-link" onClick={toggleForm}>
            {isLogin ? "Sign Up" : "Login"}
          </span>
        </p>
      </form>
    </div>
  );
};

export default Auth;