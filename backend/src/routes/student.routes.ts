import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';

const router = Router();

// Client routes
router.get('/me/profile', StudentController.getMyProfile);
router.put('/me/profile', StudentController.updateMyProfile);

// Admin routes
router.get('/', StudentController.getAllStudents);
router.get('/:id', StudentController.getStudentById);
router.post('/', StudentController.createStudent);
router.put('/:id', StudentController.updateStudent);

export default router;
