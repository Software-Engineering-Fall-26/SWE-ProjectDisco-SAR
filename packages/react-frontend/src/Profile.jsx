import { useAuth } from "./AuthContext";

function Profile() {
  const { user } = useAuth();
  const username = user?.user_metadata?.username;

  return (
    <div className="profile-page">
      <h1>Account</h1>

      <dl className="account-details">
        <div>
          <dt>Username</dt>
          <dd>{username || "Not set"}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user?.email}</dd>
        </div>
        <div>
          <dt>User ID</dt>
          <dd>{user?.id}</dd>
        </div>
      </dl>
    </div>
  );
}

export default Profile;
