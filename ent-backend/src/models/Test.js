const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

// Define Question model for association
const Question = sequelize.define(
  "Question",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true, // Changed to true to make it a primary key
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    options: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    correctAnswer: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

// Define Test model
const Test = sequelize.define(
  "Test",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      primaryKey: true, // Changed to true to make it a primary key
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

// Set up associations
Test.hasMany(Question, { foreignKey: "testId" });
Question.belongsTo(Test, { foreignKey: "testId" });

module.exports = { Test, Question };
