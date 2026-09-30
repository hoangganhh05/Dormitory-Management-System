import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';

const router = Router();

// Stats summary route (must be before /:id)
router.get('/stats/summary', RoomController.getRoomStats);

// Rooms CRUD routes
router.get('/', RoomController.getRooms);
router.get('/:id', RoomController.getRoomById);
router.post('/', RoomController.createRoom);
router.put('/:id', RoomController.updateRoom);
router.delete('/:id', RoomController.deleteRoom);

// Bed management route
router.put('/:roomId/beds/:bedId', RoomController.updateBedStatus);

export default router;
