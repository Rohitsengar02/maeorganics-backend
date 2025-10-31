const HomePageSettings = require('../models/HomePageSettings');

// @desc    Get home page settings
// @route   GET /api/homepage-settings
// @access  Public
exports.getHomePageSettings = async (req, res) => {
  try {
    const settings = await HomePageSettings.findOne({ isActive: true })
      .populate('featuredProducts', 'name images price')
      .populate('productGrid', 'name images price');

    if (!settings) {
      // Return default settings if none exist
      return res.status(200).json({
        success: true,
        data: {
          siteName: 'Maeorganics',
          logo: '',
          heroSlides: [],
          navLinks: [],
          featuredProducts: [],
          productGrid: [],
        }
      });
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get home page settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update home page settings
// @route   PUT /api/homepage-settings
// @access  Private (Admin only)
exports.updateHomePageSettings = async (req, res) => {
  try {
    const {
      siteName,
      logo,
      heroSlides,
      navLinks,
      featuredProducts,
      productGrid,
    } = req.body;

    const userId = req.user?.dbUser?._id;

    // Find existing active settings
    let settings = await HomePageSettings.findOne({ isActive: true });

    if (settings) {
      // Update existing settings
      settings.siteName = siteName || settings.siteName;
      settings.logo = logo !== undefined ? logo : settings.logo;
      settings.heroSlides = heroSlides || settings.heroSlides;
      settings.navLinks = navLinks || settings.navLinks;
      settings.featuredProducts = featuredProducts || settings.featuredProducts;
      settings.productGrid = productGrid || settings.productGrid;
      settings.updatedBy = userId;

      await settings.save();
    } else {
      // Create new settings
      settings = await HomePageSettings.create({
        siteName,
        logo,
        heroSlides,
        navLinks,
        featuredProducts,
        productGrid,
        updatedBy: userId,
        isActive: true,
      });
    }

    // Populate the response
    const populatedSettings = await HomePageSettings.findById(settings._id)
      .populate('featuredProducts', 'name images price')
      .populate('productGrid', 'name images price')
      .populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Home page settings updated successfully',
      data: populatedSettings
    });
  } catch (error) {
    console.error('Update home page settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Add hero slide
// @route   POST /api/homepage-settings/hero-slide
// @access  Private (Admin only)
exports.addHeroSlide = async (req, res) => {
  try {
    const slideData = req.body;
    const userId = req.user?.dbUser?._id;

    const settings = await HomePageSettings.findOne({ isActive: true });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Home page settings not found'
      });
    }

    settings.heroSlides.push(slideData);
    settings.updatedBy = userId;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Hero slide added successfully',
      data: settings
    });
  } catch (error) {
    console.error('Add hero slide error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update hero slide
// @route   PUT /api/homepage-settings/hero-slide/:slideId
// @access  Private (Admin only)
exports.updateHeroSlide = async (req, res) => {
  try {
    const { slideId } = req.params;
    const slideData = req.body;
    const userId = req.user?.dbUser?._id;

    const settings = await HomePageSettings.findOne({ isActive: true });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Home page settings not found'
      });
    }

    const slideIndex = settings.heroSlides.findIndex(
      slide => slide._id.toString() === slideId
    );

    if (slideIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Hero slide not found'
      });
    }

    // Update the slide
    settings.heroSlides[slideIndex] = {
      ...settings.heroSlides[slideIndex].toObject(),
      ...slideData,
      _id: settings.heroSlides[slideIndex]._id
    };

    settings.updatedBy = userId;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Hero slide updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Update hero slide error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete hero slide
// @route   DELETE /api/homepage-settings/hero-slide/:slideId
// @access  Private (Admin only)
exports.deleteHeroSlide = async (req, res) => {
  try {
    const { slideId } = req.params;
    const userId = req.user?.dbUser?._id;

    const settings = await HomePageSettings.findOne({ isActive: true });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Home page settings not found'
      });
    }

    settings.heroSlides = settings.heroSlides.filter(
      slide => slide._id.toString() !== slideId
    );

    settings.updatedBy = userId;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Hero slide deleted successfully',
      data: settings
    });
  } catch (error) {
    console.error('Delete hero slide error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Add navigation link
// @route   POST /api/homepage-settings/nav-link
// @access  Private (Admin only)
exports.addNavLink = async (req, res) => {
  try {
    const { label, href } = req.body;
    const userId = req.user?.dbUser?._id;

    const settings = await HomePageSettings.findOne({ isActive: true });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Home page settings not found'
      });
    }

    settings.navLinks.push({ label, href });
    settings.updatedBy = userId;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Navigation link added successfully',
      data: settings
    });
  } catch (error) {
    console.error('Add nav link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete navigation link
// @route   DELETE /api/homepage-settings/nav-link/:index
// @access  Private (Admin only)
exports.deleteNavLink = async (req, res) => {
  try {
    const { index } = req.params;
    const userId = req.user?.dbUser?._id;

    const settings = await HomePageSettings.findOne({ isActive: true });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Home page settings not found'
      });
    }

    settings.navLinks.splice(parseInt(index), 1);
    settings.updatedBy = userId;
    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Navigation link deleted successfully',
      data: settings
    });
  } catch (error) {
    console.error('Delete nav link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
