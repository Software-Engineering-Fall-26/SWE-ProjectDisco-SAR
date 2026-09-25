import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./pages.css";

function LoginHeader() {
  return <h1 className="login-title">Login</h1>;
}

function Login() {
  const [loginInfo, setLoginInfo] = useState({
    username: "",
    password: "",
  });

  const navigate = useNavigate();

  function handleChange(event) {
    const { name, value } = event.target;

    setLoginInfo({
      ...loginInfo,
      [name]: value,
    });
  }

  function handleSubmit(event) {
    event.preventDefault();

    // Actual account verification will be added later.
    navigate("/ideas");
  }

  return (
    <div className="login-page">
      <LoginHeader />

      <form className="login-form" onSubmit={handleSubmit}>
        <label htmlFor="username">Username</label>

        <input
          type="text"
          name="username"
          id="username"
          value={loginInfo.username}
          onChange={handleChange}
          className="login-input"
          required
        />

        <label htmlFor="password">Password</label>

        <input
          type="password"
          name="password"
          id="password"
          value={loginInfo.password}
          onChange={handleChange}
          className="login-input"
          required
        />

        <button type="submit" className="submit-button">
          Submit
        </button>
      </form>
    </div>
  );
}

export default Login;
