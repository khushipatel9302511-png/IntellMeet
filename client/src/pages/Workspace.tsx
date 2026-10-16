import { useEffect, useState } from 'react'
import KanbanBoard from './KanbanBoard'

type Member = {
  _id: string
  name: string
  email: string
}

type WorkspaceData = {
  _id: string
  name: string
  description?: string
  ownerId: Member
  members: Member[]
}

type WorkspaceProps = {
  onBack: () => void
  onLogout: () => void
}

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/$/, '')

function Workspace({ onBack, onLogout }: WorkspaceProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([])
  const [selectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceData | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [addingMemberWorkspaceId, setAddingMemberWorkspaceId] =
    useState<string | null>(null)
  const [deletingWorkspaceId, setDeletingWorkspaceId] =
    useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const token = localStorage.getItem('intellmeet_access_token')
  const currentUserId = (() => {
    try {
      const savedUser = localStorage.getItem('intellmeet_user')
      if (!savedUser) return ''

      const user = JSON.parse(savedUser)
      return user._id || user.id || user.userId || ''
    } catch {
      return ''
    }
  })()

  const loadWorkspaces = async () => {
    if (!token) {
      setError('Please login again.')
      return
    }

    try {
      const response = await fetch(`${API_URL}/workspaces`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load workspaces')
      }

      setWorkspaces(data.workspaces || [])
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load workspaces'
      )
    }
  }

  useEffect(() => {
    void loadWorkspaces()
  }, [])

  const handleCreateWorkspace = async () => {
    if (!name.trim()) {
      setError('Please enter workspace name.')
      setSuccess('')
      return
    }

    if (!token) {
      setError('Please login again.')
      setSuccess('')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_URL}/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create workspace')
      }

      setWorkspaces((previous) => [data.workspace, ...previous])
      setName('')
      setDescription('')
      setSuccess('Workspace created successfully.')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create workspace'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (workspaceId: string) => {
    if (!memberEmail.trim()) {
      setError('Please enter member email.')
      setSuccess('')
      return
    }

    if (!token) {
      setError('Please login again.')
      setSuccess('')
      return
    }

    setAddingMemberWorkspaceId(workspaceId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        `${API_URL}/workspaces/${encodeURIComponent(workspaceId)}/members`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({ email: memberEmail.trim() }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add member')
      }

      setWorkspaces((previous) =>
        previous.map((workspace) =>
          workspace._id === workspaceId ? data.workspace : workspace
        )
      )

      setMemberEmail('')
      setSuccess('Member added successfully.')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to add member'
      )
    } finally {
      setAddingMemberWorkspaceId(null)
    }
  }

  const handleDeleteWorkspace = async (workspace: WorkspaceData) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${workspace.name}"? This action cannot be undone.`
    )

    if (!confirmed) return

    if (!token) {
      setError('Please login again.')
      setSuccess('')
      return
    }

    setDeletingWorkspaceId(workspace._id)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(
        `${API_URL}/workspaces/${encodeURIComponent(workspace._id)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete workspace')
      }

      setWorkspaces((previous) =>
        previous.filter((item) => item._id !== workspace._id)
      )

      if (selectedWorkspace?._id === workspace._id) {
        setSelectedWorkspace(null)
      }

      setSuccess('Workspace deleted successfully.')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete workspace'
      )
    } finally {
      setDeletingWorkspaceId(null)
    }
  }

  if (selectedWorkspace) {
    return (
      <KanbanBoard
        workspace={selectedWorkspace}
        onBack={() => setSelectedWorkspace(null)}
        onLogout={onLogout}
      />
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '30px',
        background: '#f5f7fb',
        color: '#111827',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '30px',
          }}
        >
          <button className="workspace-button" onClick={onBack}>
            ← Back to Dashboard
          </button>

          <button className="workspace-button" onClick={onLogout}>
            Logout
          </button>
        </div>

        <h1 style={{ color: '#111827', fontWeight: 800 }}>
          Team Workspace
        </h1>

        <p style={{ color: '#374151' }}>
          Create and manage collaborative team workspaces.
        </p>

        {error && (
          <p role="alert" style={{ color: '#b91c1c', fontWeight: 600 }}>
            {error}
          </p>
        )}

        {success && (
          <p role="status" style={{ color: '#166534', fontWeight: 600 }}>
            {success}
          </p>
        )}

        <section className="workspace-card">
          <h2>Create Workspace</h2>

          <input
            className="workspace-input"
            type="text"
            placeholder="Workspace name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <textarea
            className="workspace-input workspace-textarea"
            placeholder="Workspace description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button
            className="workspace-button workspace-primary"
            onClick={handleCreateWorkspace}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Workspace'}
          </button>
        </section>

        <section style={{ marginTop: '25px' }}>
          <h2 style={{ color: '#111827' }}>My Workspaces</h2>

          {workspaces.length === 0 ? (
            <div className="workspace-card">No workspaces yet.</div>
          ) : (
            workspaces.map((workspace) => {
              const ownerId =
                typeof workspace.ownerId === 'object'
                  ? workspace.ownerId?._id
                  : workspace.ownerId

              const isOwner =
                Boolean(currentUserId) &&
                String(ownerId) === String(currentUserId)

              return (
                <div className="workspace-card" key={workspace._id}>
                  <h3>{workspace.name}</h3>

                  {workspace.description && (
                    <p>{workspace.description}</p>
                  )}

                  <p>
                    <strong>Owner:</strong>{' '}
                    {typeof workspace.ownerId === 'object'
                      ? workspace.ownerId?.name || 'Unknown'
                      : 'Workspace owner'}
                  </p>

                  <p>
                    <strong>Members:</strong>{' '}
                    {workspace.members?.length || 0}
                  </p>

                  {workspace.members?.length > 0 && (
                    <div>
                      <strong>Team Members:</strong>
                      <ul>
                        {workspace.members.map((member) => (
                          <li key={member._id}>
                            {member.name} — {member.email}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="workspace-divider">
                    <h4>Add Team Member</h4>

                    <input
                      className="workspace-input"
                      type="email"
                      placeholder="Enter member email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                    />

                    <button
                      className="workspace-button workspace-primary"
                      onClick={() => handleAddMember(workspace._id)}
                      disabled={addingMemberWorkspaceId === workspace._id}
                    >
                      {addingMemberWorkspaceId === workspace._id
                        ? 'Adding...'
                        : 'Add Member'}
                    </button>
                  </div>

                  <div className="workspace-divider">
                    <h4>Kanban Task Management</h4>
                    <p style={{ color: '#374151' }}>
                      Manage tasks using To Do, In Progress, and Completed
                      columns.
                    </p>

                    <button
                      className="workspace-button workspace-primary"
                      onClick={() => setSelectedWorkspace(workspace)}
                    >
                      Open Kanban Board
                    </button>
                  </div>

                  {isOwner && (
                    <div className="workspace-delete-area">
                      <button
                        className="workspace-button workspace-delete"
                        onClick={() => handleDeleteWorkspace(workspace)}
                        disabled={deletingWorkspaceId === workspace._id}
                      >
                        {deletingWorkspaceId === workspace._id
                          ? 'Deleting...'
                          : 'Delete Workspace'}
                      </button>
                      <p>
                        Only the workspace owner can delete this workspace.
                      </p>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </section>
      </div>

      <style>{`
        .workspace-card {
          background: #ffffff;
          color: #111827;
          padding: 25px;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          margin-top: 20px;
          overflow-wrap: anywhere;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
        }

        .workspace-card h2,
        .workspace-card h3,
        .workspace-card h4 {
          color: #111827;
          font-weight: 800;
        }

        .workspace-card p,
        .workspace-card li,
        .workspace-card strong {
          color: #1f2937;
        }

        .workspace-input {
          display: block;
          width: 100%;
          box-sizing: border-box;
          padding: 12px;
          margin: 0 0 12px;
          border: 1px solid #9ca3af;
          border-radius: 8px;
          background: #ffffff;
          color: #111827;
          font: inherit;
        }

        .workspace-input::placeholder {
          color: #4b5563;
          opacity: 1;
        }

        .workspace-input:focus {
          outline: 2px solid #b68b40;
          outline-offset: 1px;
          border-color: #92400e;
        }

        .workspace-textarea {
          min-height: 80px;
          resize: vertical;
        }

        .workspace-button {
          padding: 11px 16px;
          border: 1px solid #374151;
          border-radius: 8px;
          background: #1f2937;
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .workspace-button:hover {
          background: #111827;
        }

        .workspace-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .workspace-primary {
          background: #172554;
          border-color: #172554;
        }

        .workspace-primary:hover {
          background: #0f172a;
        }

        .workspace-divider {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #cbd5e1;
        }

        .workspace-delete-area {
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid #fecaca;
        }

        .workspace-delete {
          background: #b91c1c;
          border-color: #991b1b;
        }

        .workspace-delete:hover {
          background: #991b1b;
        }

        .workspace-delete-area p {
          margin-bottom: 0;
          color: #4b5563;
          font-size: 13px;
        }

        .workspace-button:focus-visible {
          outline: 2px solid #b68b40;
          outline-offset: 2px;
        }

        @media (max-width: 600px) {
          .workspace-card {
            padding: 18px;
          }
        }
      `}</style>
    </div>
  )
}

export default Workspace