const express = require("express");
const router = express.Router();
const {
  getTests,
  getTestById,
  submitTestResults,
  getTestResults,
  getTestResultsById,
  getPerformanceAnalytics,
} = require("../controllers/testController");
const { protect } = require("../middleware/authMiddleware");

/**
 * @swagger
 * /tests/performance:
 *   get:
 *     summary: Get performance analytics for the current user
 *     tags: [Tests]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: testIds
 *         schema:
 *           type: string
 *         description: Optional comma-separated list of test IDs to filter by
 *     responses:
 *       200:
 *         description: Performance analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalTests:
 *                   type: number
 *                 averageScore:
 *                   type: number
 *                 weakestAreas:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       testId:
 *                         type: number
 *                       title:
 *                         type: string
 *                       averageScore:
 *                         type: number
 *       401:
 *         description: Not authorized
 */
router.get("/performance", protect, getPerformanceAnalytics);

/**
 * @swagger
 * /tests/results:
 *   get:
 *     summary: Get all test results for the current user
 *     tags: [Tests]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of test results
 *       401:
 *         description: Not authorized
 */
router.get("/results", protect, getTestResults);

/**
 * @swagger
 * /tests/results:
 *   post:
 *     summary: Submit test results
 *     tags: [Tests]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - testId
 *               - score
 *               - answers
 *               - date
 *             properties:
 *               testId:
 *                 type: number
 *               score:
 *                 type: number
 *               answers:
 *                 type: array
 *                 items:
 *                   type: number
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Test results submitted successfully
 *       401:
 *         description: Not authorized
 */
router.post("/results", protect, submitTestResults);

/**
 * @swagger
 * /tests/{testId}/results:
 *   get:
 *     summary: Get results for a specific test
 *     tags: [Tests]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: testId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the test
 *     responses:
 *       200:
 *         description: List of test results for the specified test
 *       401:
 *         description: Not authorized
 */
router.get("/:testId/results", protect, getTestResultsById);

/**
 * @swagger
 * /tests:
 *   get:
 *     summary: Get all tests
 *     tags: [Tests]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all tests
 *       401:
 *         description: Not authorized
 */
router.get("/", protect, getTests);

/**
 * @swagger
 * /tests/{id}:
 *   get:
 *     summary: Get a test by ID
 *     tags: [Tests]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the test
 *     responses:
 *       200:
 *         description: Test details
 *       404:
 *         description: Test not found
 *       401:
 *         description: Not authorized
 */
router.get("/:id", protect, getTestById);

module.exports = router;
