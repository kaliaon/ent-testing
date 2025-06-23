const { sequelize } = require("../config/db");
const { User, TestAttempt } = require("./User");
const { Test, Question } = require("./Test");

// Define any additional associations if needed
// (Most are already defined in the model files)

// Create a function to sync all models with the database
const syncModels = async () => {
  try {
    // Force: true will drop the table if it already exists (only for development)
    // In production, you'll want to use migrations instead
    if (process.env.NODE_ENV === "development") {
      console.log("Syncing database models...");
      await sequelize.sync({ alter: true });
      console.log("Database synchronized successfully");
    } else {
      await sequelize.sync();
    }
  } catch (error) {
    console.error("Error syncing database:", error);
  }
};

module.exports = {
  sequelize,
  syncModels,
  User,
  TestAttempt,
  Test,
  Question,
};
