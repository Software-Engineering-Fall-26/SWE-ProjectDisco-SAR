import "./Login.css";

// src/Table.jsx
function LoginHeader() {
  return (
    <h1 id="title">Login</h1>
  );
}

// src/Table.jsx
function TableBody(props) {
  const rows = props.characterData.map((row, index) => {
    return (
      <tr key={row.id}>
        <td>{row.name}</td>
        <td>{row.job}</td>
        <td>{row.id}</td>
        <td>
          <button onClick={() => props.removeCharacter(row.id)}>Delete</button>
        </td>
      </tr>
    );
  });

  return <tbody>{rows}</tbody>;
}

function Login(props) {
  return (
    <table>
      <LoginHeader/>
      <TableBody
        characterData={props.characterData}
        removeCharacter={props.removeCharacter}
      />
    </table>
  );
}

export default Login;
