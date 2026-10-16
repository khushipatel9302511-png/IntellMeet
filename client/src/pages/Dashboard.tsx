import type { ReactNode } from 'react'
import AppSidebar from '../AppSlidebar'
import './Dashboard.css'

export type DashboardPage =
  | 'dashboard'
  | 'create'
  | 'join'
  | 'meetings'
  | 'chat'
  | 'workspace'

type DashboardProps = {
  userName: string
  activePage: DashboardPage
  children?: ReactNode
  onLogout: () => void
  onDashboard: () => void
  onCreateMeeting: () => void
  onJoinMeeting: () => void
  onWorkspace: () => void
  onMyMeetings: () => void
  onChat: () => void
}

const pageTitles: Record<DashboardPage, string> = {
  dashboard: 'Dashboard',
  create: 'Create Meeting',
  join: 'Join Meeting',
  meetings: 'My Meetings',
  chat: 'Meeting Chat',
  workspace: 'Team Workspace',
}

function Dashboard({
  userName,
  activePage,
  children,
  onLogout,
  onDashboard,
  onCreateMeeting,
  onJoinMeeting,
  onWorkspace,
  onMyMeetings,
  onChat,
}: DashboardProps) {
  const firstName = userName.trim().split(/\s+/)[0] || 'there'
  const isDashboard = activePage === 'dashboard'

  return (
    <div className="im-dashboard">
      <AppSidebar
        activePage={activePage}
        onDashboard={onDashboard}
        onCreateMeeting={onCreateMeeting}
        onJoinMeeting={onJoinMeeting}
        onMyMeetings={onMyMeetings}
        onChat={onChat}
        onWorkspace={onWorkspace}
        onLogout={onLogout}
      />

      <main className="im-main">
        <header className="im-topbar">
          <div>
            <p className="im-breadcrumb">
              Workspace / {pageTitles[activePage]}
            </p>

            <p className="im-topbar-caption">
              {isDashboard
                ? 'Your collaboration hub'
                : `Your workspace · ${pageTitles[activePage]}`}
            </p>
          </div>

          <div className="im-user-profile">
            <div className="im-avatar" aria-hidden="true">
              {firstName.charAt(0).toUpperCase()}
            </div>

            <div className="im-user-copy">
              <strong>{userName}</strong>
              <span>Workspace member</span>
            </div>
          </div>
        </header>

        {isDashboard ? (
          <div className="im-dashboard-content">
            <section className="im-welcome">
              <div className="im-welcome-content">
                <span className="im-eyebrow">
                  YOUR INTELLMEET WORKSPACE
                </span>

                <h2>Welcome back, {firstName}!</h2>

                <p>
                  Bring your team together, share ideas, and make every
                  meeting more productive.
                </p>

                <div className="im-welcome-actions">
                  <button
                    className="im-button im-button-gold"
                    type="button"
                    onClick={onCreateMeeting}
                  >
                    <span aria-hidden="true">+</span>
                    Create a meeting
                  </button>

                  <button
                    className="im-button im-button-outline"
                    type="button"
                    onClick={onJoinMeeting}
                  >
                    Join a meeting
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>

              <div
                className="im-welcome-decoration"
                aria-hidden="true"
              >
                <div className="im-decoration-ring im-ring-one" />
                <div className="im-decoration-ring im-ring-two" />

                <div className="im-decoration-center">
                  <span>IM</span>
                  <small>COLLABORATE</small>
                </div>
              </div>
            </section>

            <section className="im-section">
              <div className="im-section-heading">
                <div>
                  <span className="im-section-kicker">
                    GET STARTED
                  </span>

                  <h2>Your workspace</h2>
                  <p>Choose what you would like to do next.</p>
                </div>
              </div>

              <div className="im-feature-grid">
                <button
                  className="im-feature-card"
                  type="button"
                  onClick={onCreateMeeting}
                >
                  <span className="im-feature-icon im-icon-gold">
                    +
                  </span>

                  <span className="im-feature-title">
                    Create Meeting
                  </span>

                  <span className="im-feature-description">
                    Set up a new meeting for your team.
                  </span>

                  <span className="im-feature-link">
                    Create meeting <span aria-hidden="true">→</span>
                  </span>
                </button>

                <button
                  className="im-feature-card"
                  type="button"
                  onClick={onJoinMeeting}
                >
                  <span className="im-feature-icon im-icon-blue">
                    ↗
                  </span>

                  <span className="im-feature-title">
                    Join Meeting
                  </span>

                  <span className="im-feature-description">
                    Enter an existing meeting using its details.
                  </span>

                  <span className="im-feature-link">
                    Join now <span aria-hidden="true">→</span>
                  </span>
                </button>

                <button
                  className="im-feature-card"
                  type="button"
                  onClick={onMyMeetings}
                >
                  <span className="im-feature-icon im-icon-green">
                    ▤
                  </span>

                  <span className="im-feature-title">
                    My Meetings
                  </span>

                  <span className="im-feature-description">
                    View your scheduled and previous meetings.
                  </span>

                  <span className="im-feature-link">
                    View meetings <span aria-hidden="true">→</span>
                  </span>
                </button>

                <button
                  className="im-feature-card"
                  type="button"
                  onClick={onChat}
                >
                  <span className="im-feature-icon im-icon-purple">
                    ◌
                  </span>

                  <span className="im-feature-title">
                    Meeting Chat
                  </span>

                  <span className="im-feature-description">
                    Open meeting chat and communicate with participants.
                  </span>

                  <span className="im-feature-link">
                    Open chat <span aria-hidden="true">→</span>
                  </span>
                </button>

                <button
                  className="im-feature-card"
                  type="button"
                  onClick={onWorkspace}
                >
                  <span className="im-feature-icon im-icon-blue">
                    ▦
                  </span>

                  <span className="im-feature-title">
                    Team Workspace
                  </span>

                  <span className="im-feature-description">
                    Access your collaborative workspace.
                  </span>

                  <span className="im-feature-link">
                    Open workspace <span aria-hidden="true">→</span>
                  </span>
                </button>
              </div>
            </section>

            <footer className="im-dashboard-footer">
              <div className="im-footer-brand">
                <span className="im-footer-mark">IM</span>
                <span>IntellMeet</span>
              </div>

              <p>Thoughtful collaboration starts here.</p>
            </footer>
          </div>
        ) : (
          <section className={`im-page-content im-page-${activePage}`}>
            {children}
          </section>
        )}
      </main>
    </div>
  )
}

export default Dashboard