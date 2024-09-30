// src/components/Login.tsx

import React, { useState, FormEvent } from "react";
import Button from "./Button";
import Input from "./Input";
import Label from "./Label";
import "./Login.css";

interface LoginProps {
  onLogin: (username: string, password: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (username === "test" && password === "test") {
      setErrorMessage("");
      onLogin(username, password);
    } else {
      setErrorMessage("Invalid username or password");
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="login-title">Login</h2>
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
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <Button type="submit" variant="default" fullWidth className="login-button">
          Login
        </Button>
        <Button variant="outline" fullWidth className="login-button">
          Login with Google
        </Button>
        <div className="additional-links">
          <a href="/forgot-password" className="forgot-password-link">
            Forgot your password?
          </a>
          <p className="signup-text">
            Don't have an account? <a href="/signup" className="signup-link">Sign up</a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
