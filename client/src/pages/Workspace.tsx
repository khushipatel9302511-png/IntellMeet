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

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function Workspace({
  onBack,
  onLogout,
}: WorkspaceProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([])
  const [selectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceData | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [addingMemberWorkspaceId, setAddingMemberWorkspaceId] =
    useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const token = localStorage.getItem(
    'intellmeet_access_token'
  )

  const loadWorkspaces = async () => {
    if (!token) {
      setError('Please login again.')
      return
    }

    try {
      const response = await fetch(
        `${API_URL}/workspaces`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to load workspaces'
        )
      }

      setWorkspaces(data.workspaces || [])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load workspaces'
      )
    }
  }

  useEffect(() => {
    loadWorkspaces()
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
      const response = await fetch(
        `${API_URL}/workspaces`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to create workspace'
        )
      }

      setWorkspaces((previous) => [
        data.workspace,
        ...previous,
      ])

      setName('')
      setDescription('')

      setSuccess('Workspace created successfully.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create workspace'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (
    workspaceId: string
  ) => {
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
        `${API_URL}/workspaces/${workspaceId}/members`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: memberEmail.trim(),
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to add member'
        )
      }

      setWorkspaces((previous) =>
        previous.map((workspace) =>
          workspace._id === workspaceId
            ? data.workspace
            : workspace
        )
      )

      setMemberEmail('')

      setSuccess('Member added successfully.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to add member'
      )
    } finally {
      setAddingMemberWorkspaceId(null)
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
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
          }}
        >
          <button onClick={onBack}>
            ← Back to Dashboard
          </button>

          <button onClick={onLogout}>
            Logout
          </button>
        </div>

        <h1>Team Workspace</h1>

        <p style={{ color: '#666' }}>
          Create and manage collaborative team workspaces.
        </p>

        {error && (
          <p style={{ color: 'red' }}>
            {error}
          </p>
        )}

        {success && (
          <p style={{ color: 'green' }}>
            {success}
          </p>
        )}

        <section
          style={{
            background: 'white',
            padding: '25px',
            borderRadius: '12px',
            border: '1px solid #ddd',
            marginTop: '25px',
          }}
        >
          <h2>Create Workspace</h2>

          <input
            type="text"
            placeholder="Workspace name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '12px',
              boxSizing: 'border-box',
            }}
          />

          <textarea
            placeholder="Workspace description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '12px',
              marginBottom: '12px',
              boxSizing: 'border-box',
            }}
          />

          <button
            onClick={handleCreateWorkspace}
            disabled={loading}
          >
            {loading
              ? 'Creating...'
              : 'Create Workspace'}
          </button>
        </section>

        <section style={{ marginTop: '25px' }}>
          <h2>My Workspaces</h2>

          {workspaces.length === 0 ? (
            <div
              style={{
                background: 'white',
                padding: '25px',
                borderRadius: '12px',
                border: '1px solid #ddd',
              }}
            >
              No workspaces yet.
            </div>
          ) : (
            workspaces.map((workspace) => (
              <div
                key={workspace._id}
                style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #ddd',
                  marginBottom: '15px',
                }}
              >
                <h3>{workspace.name}</h3>

                {workspace.description && (
                  <p>{workspace.description}</p>
                )}

                <p>
                  <strong>Owner:</strong>{' '}
                  {workspace.ownerId?.name ||
                    'Unknown'}
                </p>

                <p>
                  <strong>Members:</strong>{' '}
                  {workspace.members?.length || 0}
                </p>

                {workspace.members?.length > 0 && (
                  <div>
                    <strong>Team Members:</strong>

                    <ul>
                      {workspace.members.map(
                        (member) => (
                          <li key={member._id}>
                            {member.name} —{' '}
                            {member.email}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                <div
                  style={{
                    marginTop: '20px',
                    paddingTop: '20px',
                    borderTop: '1px solid #eee',
                  }}
                >
                  <h4>Add Team Member</h4>

                  <input
                    type="email"
                    placeholder="Enter member email"
                    value={memberEmail}
                    onChange={(e) =>
                      setMemberEmail(e.target.value)
                    }
                    style={{
                      width: '100%',
                      padding: '12px',
                      marginBottom: '10px',
                      boxSizing: 'border-box',
                    }}
                  />

                  <button
                    onClick={() =>
                      handleAddMember(workspace._id)
                    }
                    disabled={
                      addingMemberWorkspaceId ===
                      workspace._id
                    }
                  >
                    {addingMemberWorkspaceId ===
                    workspace._id
                      ? 'Adding...'
                      : 'Add Member'}
                  </button>
                </div>

                <div
                  style={{
                    marginTop: '20px',
                    paddingTop: '20px',
                    borderTop: '1px solid #eee',
                  }}
                >
                  <h4>Kanban Task Management</h4>

                  <p style={{ color: '#666' }}>
                    Manage tasks using To Do, In Progress,
                    and Completed columns.
                  </p>

                  <button
                    onClick={() =>
                      setSelectedWorkspace(workspace)
                    }
                  >
                    Open Kanban Board
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  )
}

export default Workspace
