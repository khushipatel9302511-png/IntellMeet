import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import {
  createTask,
  getTasksByWorkspace,
  updateTask,
  deleteTask,
} from '../controllers/taskController'

const router = Router()

router.use(authenticate)

router.post('/', createTask)
router.get('/workspace/:workspaceId', getTasksByWorkspace)
router.put('/:id', updateTask)
router.delete('/:id', deleteTask)

export default router
