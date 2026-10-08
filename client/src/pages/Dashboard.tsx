type DashboardProps = {
  userName: string
  onLogout: () => void
  onCreateMeeting: () => void
  onJoinMeeting: () => void
  onWorkspace: () => void
  onMyMeetings: () => void
}

function Dashboard({
  userName,
  onLogout,
  onCreateMeeting,
  onJoinMeeting,
  onWorkspace,
  onMyMeetings,
}: DashboardProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '30px',
        background: '#f5f7fb',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>IntellMeet</h1>

          <p style={{ marginTop: '8px', color: '#666' }}>
            AI-Powered Meeting & Collaboration
          </p>
        </div>

        <button onClick={onLogout}>
          Logout
        </button>
      </header>

      <main>
        <h2>Welcome, {userName} 👋</h2>

        <p style={{ color: '#666' }}>
          Manage your meetings and collaboration from here.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginTop: '30px',
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '25px',
              borderRadius: '12px',
              border: '1px solid #ddd',
            }}
          >
            <h3>Create Meeting</h3>

            <p>
              Create a new meeting and schedule it.
            </p>

            <button onClick={onCreateMeeting}>
              Create Meeting
            </button>
          </div>

          <div
            style={{
              background: 'white',
              padding: '25px',
              borderRadius: '12px',
              border: '1px solid #ddd',
            }}
          >
            <h3>Join Meeting</h3>

            <p>
              Join an existing meeting using its ID.
            </p>

            <button onClick={onJoinMeeting}>
              Join Meeting
            </button>
          </div>

          <div
            style={{
              background: 'white',
              padding: '25px',
              borderRadius: '12px',
              border: '1px solid #ddd',
            }}
          >
            <h3>Team Workspace</h3>

            <p>
              Create and manage your collaborative team workspace.
            </p>

            <button onClick={onWorkspace}>
              Open Workspace
            </button>
          </div>

          <div
            style={{
              background: 'white',
              padding: '25px',
              borderRadius: '12px',
              border: '1px solid #ddd',
            }}
          >
            <h3>Chat</h3>

            <p>
              Real-time meeting chat.
            </p>

            <button disabled>
              Chat
            </button>
          </div>

          <div
            style={{
              background: 'white',
              padding: '25px',
              borderRadius: '12px',
              border: '1px solid #ddd',
            }}
          >
            <h3>My Meetings</h3>

            <p>
              View your scheduled and previous meetings.
            </p>

            <button onClick={onMyMeetings}>
              My Meetings
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
