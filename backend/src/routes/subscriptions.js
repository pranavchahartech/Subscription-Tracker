const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { subscriptionSchema } = require('../schemas/subscriptionSchemas');

router.use(authenticateToken);

router.get('/summary', subscriptionController.getSummary);
router.get('/export/csv', subscriptionController.exportCsv);
router.get('/', subscriptionController.getSubscriptions);
router.post('/', validate(subscriptionSchema), subscriptionController.createSubscription);
router.put('/:id', validate(subscriptionSchema), subscriptionController.updateSubscription);
router.delete('/:id', subscriptionController.deleteSubscription);

module.exports = router;
