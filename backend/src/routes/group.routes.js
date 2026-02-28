import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
    createGroup,
    getUserGroups,
    getGroupById,
    updateGroup,
    addMember,
    removeMember,
    leaveGroup,
    deleteGroup
} from '../controllers/group.controller.js';

const router = express.Router();

// All group routes are protected
router.use(protect);

// Group CRUD
router.route('/')
    .post(createGroup)
    .get(getUserGroups);

router.route('/:id')
    .get(getGroupById)
    .put(updateGroup)
    .delete(deleteGroup); 

// Member management
router.post('/:id/members', addMember);           
router.delete('/:id/members/:userId', removeMember); 
router.post('/:id/leave', leaveGroup);            

export default router;