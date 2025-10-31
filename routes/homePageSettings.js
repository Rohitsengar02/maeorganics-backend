const express = require('express');
const router = express.Router();
const {
  getHomePageSettings,
  updateHomePageSettings,
  addHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  addNavLink,
  deleteNavLink,
} = require('../controllers/homePageSettingsController');

// Import auth middleware
const { verifyToken } = require('../middleware/auth');

// Public routes
router.get('/', getHomePageSettings);

// Protected routes (require authentication)
router.put('/', verifyToken, updateHomePageSettings);
router.post('/hero-slide', verifyToken, addHeroSlide);
router.put('/hero-slide/:slideId', verifyToken, updateHeroSlide);
router.delete('/hero-slide/:slideId', verifyToken, deleteHeroSlide);
router.post('/nav-link', verifyToken, addNavLink);
router.delete('/nav-link/:index', verifyToken, deleteNavLink);

module.exports = router;
