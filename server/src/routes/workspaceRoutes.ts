import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import {
  createWorkspace,
  getMyWorkspaces,
  getWorkspaceById,
  addMemberToWorkspace,
} from '../controllers/workspaceController'

const router = Router()

router.use(authenticate)

router.post('/', createWorkspace)
router.get('/', getMyWorkspaces)
router.get('/:id', getWorkspaceById)
router.post('/:id/members', addMemberToWorkspace)

export default router