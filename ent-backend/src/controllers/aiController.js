const { User, Test, TestAttempt } = require("../models");

// @desc    Generate feedback for user performance
// @route   POST /ai/feedback
// @access  Private
const generateFeedback = async (req, res) => {
  try {
    // Get user test history
    const testHistory = await TestAttempt.findAll({
      where: { userId: req.user.id },
    });

    // Get all tests
    const tests = await Test.findAll();

    if (tests.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No tests found",
      });
    }

    // Generate simple feedback based on user performance
    // In a real application, this would typically connect to an AI service
    if (testHistory.length === 0) {
      return res.json({
        overview:
          "You haven't taken any tests yet. Start practicing to get personalized feedback!",
        strengths: [],
        weaknesses: [],
        recommendations: [
          "Begin by taking a few tests to establish your baseline knowledge.",
        ],
      });
    }

    // Calculate average score
    const totalScore = testHistory.reduce(
      (sum, history) => sum + history.score,
      0
    );
    const averageScore = totalScore / testHistory.length;

    // Group by test ID to find weakest and strongest areas
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
    const sortedTestScores = [...testScores].sort(
      (a, b) => a.averageScore - b.averageScore
    );

    // Get weakest areas (bottom 3)
    const weakestAreas = [];
    for (const testScore of sortedTestScores.slice(0, 3)) {
      const test = tests.find((t) => t.id === testScore.testId);
      if (test) {
        weakestAreas.push(test.title);
      }
    }

    // Get strongest areas (top 3)
    const strongestAreas = [];
    for (const testScore of [...sortedTestScores].reverse().slice(0, 3)) {
      const test = tests.find((t) => t.id === testScore.testId);
      if (test) {
        strongestAreas.push(test.title);
      }
    }

    // Generate recommendations
    const recommendations = [];

    if (averageScore < 50) {
      recommendations.push(
        "Focus on improving your basic understanding in the weak areas."
      );
      recommendations.push(
        "Consider reviewing foundational concepts before proceeding to more complex topics."
      );
    } else if (averageScore < 70) {
      recommendations.push(
        "Continue practicing in your weaker areas to strengthen your knowledge."
      );
      recommendations.push(
        "Try more varied test types to broaden your understanding."
      );
    } else {
      recommendations.push(
        "Challenge yourself with more difficult tests to further enhance your skills."
      );
      recommendations.push(
        "Consider helping others or explaining concepts to solidify your understanding."
      );
    }

    // Add specific recommendations for weak areas
    weakestAreas.forEach((area) => {
      recommendations.push(`Dedicate more study time to ${area}.`);
    });

    // Generate overview
    let overview = "";
    if (averageScore < 50) {
      overview = `Your average score is ${averageScore.toFixed(
        2
      )}%. You're still developing your knowledge in many areas. Focus on building a strong foundation in the basics.`;
    } else if (averageScore < 70) {
      overview = `Your average score is ${averageScore.toFixed(
        2
      )}%. You're showing good progress but have room for improvement in several areas.`;
    } else if (averageScore < 90) {
      overview = `Your average score is ${averageScore.toFixed(
        2
      )}%. You're performing well across most tests with a few areas that could use additional focus.`;
    } else {
      overview = `Your average score is ${averageScore.toFixed(
        2
      )}%. Excellent work! You're demonstrating mastery across most subject areas.`;
    }

    res.json({
      overview,
      strengths: strongestAreas,
      weaknesses: weakestAreas,
      recommendations,
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
  generateFeedback,
};
