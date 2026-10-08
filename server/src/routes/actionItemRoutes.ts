import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createActionItem,
  getActionItemsByMeeting,
  updateActionItem,
  deleteActionItem,
} from '../controllers/actionItemController';

const router = Router();

router.use(authenticate);

router.post('/', createActionItem);
router.get('/meeting/:meetingId', getActionItemsByMeeting);
router.put('/:id', updateActionItem);
router.delete('/:id', deleteActionItem);

export default router;
