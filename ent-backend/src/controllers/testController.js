const { Test, Question, User, TestAttempt } = require("../models");
const { Op } = require("sequelize");

// @desc    Get all tests
// @route   GET /tests
// @access  Private
const getTests = async (req, res) => {
  try {
    const tests = await Test.findAll({
      include: [Question],
      order: [["id", "ASC"]],
    });
    res.json(tests);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get single test by ID
// @route   GET /tests/:id
// @access  Private
const getTestById = async (req, res) => {
  try {
    const test = await Test.findOne({
      where: { id: req.params.id },
      include: [Question],
      order: [[Question, "id", "ASC"]],
    });

    if (test) {
      res.json(test);
    } else {
      res.status(404).json({
        success: false,
        message: "Test not found",
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

// @desc    Submit test results
// @route   POST /tests/results
// @access  Private
const submitTestResults = async (req, res) => {
  try {
    const { testId, score, answers, date } = req.body;

    // Get the test to calculate total questions
    const test = await Test.findOne({
      where: { id: testId },
      include: [Question],
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    const totalQuestions = test.Questions.length;

    // Add to user's test history
    const testAttempt = await TestAttempt.create({
      testId,
      date,
      score,
      totalQuestions,
      answers,
      userId: req.user.id,
    });

    if (testAttempt) {
      res.json({ success: true });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to save test results",
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

// @desc    Get all test results for user
// @route   GET /tests/results
// @access  Private
const getTestResults = async (req, res) => {
  try {
    const testAttempts = await TestAttempt.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });

    res.json(testAttempts);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get results for a specific test
// @route   GET /tests/:testId/results
// @access  Private
const getTestResultsById = async (req, res) => {
  try {
    const testId = parseInt(req.params.testId);

    const testResults = await TestAttempt.findAll({
      where: {
        userId: req.user.id,
        testId: testId,
      },
      order: [["createdAt", "DESC"]],
    });

    res.json(testResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get performance analytics
// @route   GET /tests/performance
// @access  Private
const getPerformanceAnalytics = async (req, res) => {
  try {
    // Get all test attempts for the user
    let whereClause = { userId: req.user.id };

    // Filter by specific tests if provided in query
    if (req.query.testIds) {
      const testIds = req.query.testIds.split(",").map((id) => parseInt(id));
      whereClause.testId = { [Op.in]: testIds };
    }

    const testHistory = await TestAttempt.findAll({
      where: whereClause,
    });

    if (testHistory.length === 0) {
      return res.json({
        totalTests: 0,
        averageScore: 0,
        weakestAreas: [],
      });
    }

    // Calculate average score
    const totalScore = testHistory.reduce(
      (sum, history) => sum + history.score,
      0
    );
    const averageScore = totalScore / testHistory.length;

    // Group by test ID to find weakest areas
    const testGroups = {};
    testHistory.forEach((history) => {
      if (!testGroups[history.testId]) {
        testGroups[history.testId] = {
          testId: history.testId,
          scores: [],
          totalScore: 0,
          count: 0,
        };
      }

      testGroups[history.testId].scores.push(history.score);
      testGroups[history.testId].totalScore += history.score;
      testGroups[history.testId].count += 1;
    });

    // Calculate average score for each test
    const testScores = Object.values(testGroups).map((group) => ({
      testId: group.testId,
      averageScore: group.totalScore / group.count,
    }));

    // Sort by score ascending to find weakest areas
    testScores.sort((a, b) => a.averageScore - b.averageScore);

    // Get test titles for weakest areas
    const weakestAreas = [];

    for (const testScore of testScores.slice(0, 3)) {
      const test = await Test.findOne({
        where: { id: testScore.testId },
      });

      if (test) {
        weakestAreas.push({
          testId: testScore.testId,
          title: test.title,
          averageScore: testScore.averageScore,
        });
      }
    }

    res.json({
      totalTests: testHistory.length,
      averageScore,
      weakestAreas,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getTests,
  getTestById,
  submitTestResults,
  getTestResults,
  getTestResultsById,
  getPerformanceAnalytics,
};
