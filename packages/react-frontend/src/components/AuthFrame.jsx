function AuthFrame({ kicker, title, children }) {
  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            D
          </span>
          <span className="brand-name">Disco</span>
        </div>

        <div className="auth-aside-copy">
          <p className="auth-aside-kicker">For people building something</p>
          <h2>Shape the idea. Then find the people it needs.</h2>
          <p>
            A private workspace for early ideas, and a public board when you are
            ready for investors, co-founders, or the first users.
          </p>
        </div>

        <ul className="auth-points">
          <li>Drafts stay private until you publish</li>
          <li>Say exactly who you are looking for</li>
          <li>See what other builders are shipping</li>
        </ul>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          {kicker && <p className="auth-kicker">{kicker}</p>}
          <h1 className="login-title">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}

export default AuthFrame;
