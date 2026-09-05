const express = require('express');
const controller = require('../controllers/itemController');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.get);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

router.post('/:id/attachments', upload.single('file'), controller.addAttachment);
router.delete('/:id/attachments/:attachmentId', controller.removeAttachment);

module.exports = router;
