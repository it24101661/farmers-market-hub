/**
 * Authentication routes — public register/login, protected profile.
 */
const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', auth.register);
router.post('/login', auth.login);
router.get('/me', protect, auth.me);

module.exports = router;
