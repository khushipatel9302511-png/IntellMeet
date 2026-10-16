type AppSidebarProps = {
  activePage: string
  onDashboard: () => void
  onCreateMeeting: () => void
  onJoinMeeting: () => void
  onMyMeetings: () => void
  onChat: () => void
  onWorkspace: () => void
  onLogout: () => void
}

function AppSidebar({
  activePage,
  onDashboard,
  onCreateMeeting,
  onJoinMeeting,
  onMyMeetings,
  onChat,
  onWorkspace,
  onLogout,
}: AppSidebarProps) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '◫',
      onClick: onDashboard,
    },
    {
      id: 'create',
      label: 'Create Meeting',
      icon: '+',
      onClick: onCreateMeeting,
    },
    {
      id: 'join',
      label: 'Join Meeting',
      icon: '↗',
      onClick: onJoinMeeting,
    },
    {
      id: 'meetings',
      label: 'My Meetings',
      icon: '▤',
      onClick: onMyMeetings,
    },
    {
      id: 'chat',
      label: 'Meeting Chat',
      icon: '◌',
      onClick: onChat,
    },
    {
      id: 'workspace',
      label: 'Team Workspace',
      icon: '▦',
      onClick: onWorkspace,
    },
  ]

  return (
    <aside className="im-sidebar">
      <div className="im-brand">
        <div className="im-brand-mark" aria-hidden="true">
          IM
        </div>

        <div className="im-brand-copy">
          <h1>IntellMeet</h1>
          <p>Meet. Connect. Achieve.</p>
        </div>
      </div>

      <div className="im-nav-section">
        <p className="im-nav-heading">WORKSPACE</p>

        <nav
          className="im-navigation"
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`im-nav-item ${
                activePage === item.id ? 'is-active' : ''
              }`}
              aria-current={
                activePage === item.id ? 'page' : undefined
              }
              onClick={item.onClick}
            >
              <span className="im-nav-icon" aria-hidden="true">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="im-sidebar-bottom">
        <div className="im-sidebar-note">
          <span className="im-note-icon" aria-hidden="true">
            ✦
          </span>

          <div>
            <strong>Work better together</strong>
            <p>Your meetings, one workspace.</p>
          </div>
        </div>

        <button
          className="im-logout-button"
          type="button"
          onClick={onLogout}
        >
          <span aria-hidden="true">↪</span>
          Logout
        </button>
      </div>
    </aside>
  )
}

export default AppSidebar