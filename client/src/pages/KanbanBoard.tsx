import { useEffect, useState } from 'react'

type Member = {
  _id: string
  name: string
  email: string
}

type TaskStatus = 'todo' | 'in-progress' | 'completed'

type Task = {
  _id: string
  workspaceId: string
  title: string
  description?: string
  assignedTo?: Member
  dueDate?: string
  status: TaskStatus
  createdBy: Member
}

type Workspace = {
  _id: string
  name: string
  members: Member[]
}

type KanbanBoardProps = {
  workspace: Workspace
  onBack: () => void
  onLogout: () => void
}

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function KanbanBoard({
  workspace,
  onBack,
  onLogout,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const token = localStorage.getItem(
    'intellmeet_access_token'
  )

  const loadTasks = async () => {
    if (!token) {
      setError('Please login again.')
      return
    }

    try {
      const response = await fetch(
        `${API_URL}/tasks/workspace/${workspace._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to load tasks'
        )
      }

      setTasks(data.tasks || [])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load tasks'
      )
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  const handleCreateTask = async () => {
    if (!title.trim()) {
      setError('Please enter task title.')
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
        `${API_URL}/tasks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            workspaceId: workspace._id,
            title: title.trim(),
            description: description.trim(),
            assignedTo: assignedTo || undefined,
            dueDate: dueDate || undefined,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to create task'
        )
      }

      setTasks((previous) => [
        data.task,
        ...previous,
      ])

      setTitle('')
      setDescription('')
      setAssignedTo('')
      setDueDate('')

      setSuccess('Task created successfully.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create task'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (
    taskId: string,
    status: TaskStatus
  ) => {
    if (!token) {
      setError('Please login again.')
      return
    }

    try {
      const response = await fetch(
        `${API_URL}/tasks/${taskId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to update task'
        )
      }

      setTasks((previous) =>
        previous.map((task) =>
          task._id === taskId
            ? data.task
            : task
        )
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update task'
      )
    }
  }

  const handleDeleteTask = async (
    taskId: string
  ) => {
    if (!token) {
      setError('Please login again.')
      return
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this task?'
    )

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(
        `${API_URL}/tasks/${taskId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to delete task'
        )
      }

      setTasks((previous) =>
        previous.filter(
          (task) => task._id !== taskId
        )
      )

      setSuccess('Task deleted successfully.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete task'
      )
    }
  }

  const todoTasks = tasks.filter(
    (task) => task.status === 'todo'
  )

  const inProgressTasks = tasks.filter(
    (task) => task.status === 'in-progress'
  )

  const completedTasks = tasks.filter(
    (task) => task.status === 'completed'
  )

  const renderTask = (task: Task) => (
    <div
      key={task._id}
      style={{
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: '10px',
        padding: '15px',
        marginBottom: '12px',
      }}
    >
      <h4 style={{ marginTop: 0 }}>
        {task.title}
      </h4>

      {task.description && (
        <p style={{ color: '#666' }}>
          {task.description}
        </p>
      )}

      {task.assignedTo && (
        <p>
          <strong>Assigned:</strong>{' '}
          {task.assignedTo.name}
        </p>
      )}

      {task.dueDate && (
        <p>
          <strong>Due:</strong>{' '}
          {new Date(
            task.dueDate
          ).toLocaleDateString()}
        </p>
      )}

      <select
        value={task.status}
        onChange={(e) =>
          handleStatusChange(
            task._id,
            e.target.value as TaskStatus
          )
        }
        style={{
          width: '100%',
          padding: '8px',
          marginBottom: '8px',
        }}
      >
        <option value="todo">
          To Do
        </option>

        <option value="in-progress">
          In Progress
        </option>

        <option value="completed">
          Completed
        </option>
      </select>

      <button
        onClick={() =>
          handleDeleteTask(task._id)
        }
      >
        Delete
      </button>
    </div>
  )

  const renderColumn = (
    title: string,
    columnTasks: Task[]
  ) => (
    <div
      style={{
        background: '#f8f9fb',
        border: '1px solid #ddd',
        borderRadius: '12px',
        padding: '15px',
        minHeight: '300px',
      }}
    >
      <h3>{title}</h3>

      <p style={{ color: '#666' }}>
        {columnTasks.length} task
        {columnTasks.length !== 1 ? 's' : ''}
      </p>

      {columnTasks.length === 0 ? (
        <p style={{ color: '#999' }}>
          No tasks
        </p>
      ) : (
        columnTasks.map(renderTask)
      )}
    </div>
  )

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
          maxWidth: '1200px',
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
            ← Back to Workspace
          </button>

          <button onClick={onLogout}>
            Logout
          </button>
        </div>

        <h1>Kanban Task Board</h1>

        <p style={{ color: '#666' }}>
          Workspace: <strong>{workspace.name}</strong>
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
            marginBottom: '30px',
          }}
        >
          <h2>Create Task</h2>

          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '12px',
              boxSizing: 'border-box',
            }}
          />

          <textarea
            placeholder="Task description"
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

          <select
            value={assignedTo}
            onChange={(e) =>
              setAssignedTo(e.target.value)
            }
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '12px',
            }}
          >
            <option value="">
              Assign to team member
            </option>

            {workspace.members.map(
              (member) => (
                <option
                  key={member._id}
                  value={member._id}
                >
                  {member.name} —{' '}
                  {member.email}
                </option>
              )
            )}
          </select>

          <input
            type="date"
            value={dueDate}
            onChange={(e) =>
              setDueDate(e.target.value)
            }
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '12px',
              boxSizing: 'border-box',
            }}
          />

          <button
            onClick={handleCreateTask}
            disabled={loading}
          >
            {loading
              ? 'Creating...'
              : 'Create Task'}
          </button>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {renderColumn(
            'To Do',
            todoTasks
          )}

          {renderColumn(
            'In Progress',
            inProgressTasks
          )}

          {renderColumn(
            'Completed',
            completedTasks
          )}
        </section>
      </div>
    </div>
  )
}

export default KanbanBoard
