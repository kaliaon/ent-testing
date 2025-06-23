const { User, TestAttempt } = require("../models");
const { Op } = require("sequelize");
const generateToken = require("../utils/generateToken");

// @desc    Register a new user
// @route   POST /auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, password, fullName, email } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create user
    const user = await User.create({
      username,
      password,
      fullName,
      email,
    });

    if (user) {
      res.status(201).json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        testHistory: [],
        token: generateToken(user.id),
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid user data",
      });
    }
  } catch (error) {
    console.error(error);

    // Handle validation errors with more specific messages
    if (error.name === "SequelizeValidationError") {
      const validationErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
        value: err.value,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
        requirements: {
          username: "Must be between 3-30 characters",
          password: "Must be between 6-100 characters",
          email: "Must be a valid email address",
        },
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Auth user & get token
// @route   POST /auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({
      where: { username },
      include: [
        {
          model: TestAttempt,
          as: "testHistory",
        },
      ],
    });

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      res.json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        testHistory: user.testHistory,
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Logout user
// @route   POST /auth/logout
// @access  Private
const logoutUser = (req, res) => {
  // In client-side, the token should be removed from storage
  res.json({ success: true });
};

// @desc    Get current user profile
// @route   GET /auth/current-user
// @access  Private
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: TestAttempt,
          as: "testHistory",
        },
      ],
    });

    if (user) {
      res.json({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        testHistory: user.testHistory,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Add test to user history
// @route   POST /auth/test-history
// @access  Private
const addTestHistory = async (req, res) => {
  try {
    const { testId, date, score, totalQuestions } = req.body;

    // Create a new test attempt
    const testAttempt = await TestAttempt.create({
      testId,
      date,
      score,
      totalQuestions,
      userId: req.user.id,
    });

    if (testAttempt) {
      res.json({ success: true });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to add test history",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  addTestHistory,
};
