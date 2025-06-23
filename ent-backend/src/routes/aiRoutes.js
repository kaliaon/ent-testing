const express = require("express");
const router = express.Router();
const { generateFeedback } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

/**
 * @swagger
 * /ai/feedback:
 *   post:
 *     summary: Generate AI-powered feedback based on user's test performance
 *     tags: [AI]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Performance feedback generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overview:
 *                   type: string
 *                   description: General overview of the user's performance
 *                 strengths:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Areas where the user performs well
 *                 weaknesses:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Areas where the user needs improvement
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Personalized recommendations for improvement
 *       401:
 *         description: Not authorized
 *       404:
 *         description: No tests found
 *       500:
 *         description: Server error
 */
router.post("/feedback", protect, generateFeedback);

module.exports = router;
