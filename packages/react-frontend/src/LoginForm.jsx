// src/Form.jsx
import React, { useState } from "react";
import "./pages.css";

function LoginHeader() {
  return (
    <h1 id="title" className = "login-title">Login</h1>
  );
}

function Form(props) {
  const [person, setPerson] = useState({
    name: "",
    job: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;
    if (name === "job") setPerson({ name: person["name"], job: value });
    else setPerson({ name: value, job: person["job"] });
  }

  function submitForm() {
    props.handleSubmit(person);
    setPerson({ name: "", job: "" });
  }

  return (
    <>
    <LoginHeader />

    <form className="login-form">
      <label htmlFor="name">Username</label>
      <input
        type="text"
        name="name"
        id="name"
        value={person.name}
        onChange={handleChange}
        className="login-input"
      />

      <label htmlFor="job">Password</label>
      <input
        type="password"
        name="job"
        id="job"
        value={person.job}
        onChange={handleChange}
        className="login-input"
      />

      <input
        type="button"
        value="Submit"
        onClick={submitForm}
        className="submit-button"
      />
    </form>
  </>
  );
}


export default Form;
