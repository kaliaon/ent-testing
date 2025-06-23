# ЕНТ-ға Дайындық - Mobile App

Mobile application for preparing for the Unified National Testing (ЕНТ) in Kazakhstan. The app allows users to practice with tests, track their progress, and receive AI-generated recommendations for improvement.

## Features

- User authentication (login/register)
- Test practice with various subjects
- Test results with detailed feedback
- AI helper that analyzes performance and provides recommendations
- User profile with test history and statistics

## Technologies

- React Native with Expo
- TypeScript
- NativeWind (Tailwind CSS for React Native)
- React Navigation
- AsyncStorage for local data persistence

## Getting Started

### Prerequisites

- Node.js (version 14 or later)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

4. Run on a simulator/emulator or scan the QR code with the Expo Go app on your device.

## Project Structure

- `/app` - Main application code
  - `/assets` - Static assets and data files
  - `/components` - Reusable UI components
  - `/contexts` - React Context API providers
  - `/hooks` - Custom React hooks
  - `/navigation` - Navigation configuration
  - `/screens` - Application screens
  - `/services` - API services and utilities

## Current Status

This is a prototype version using local JSON data to simulate backend functionality. In a production environment, this would be replaced with actual API calls to a backend server.

## Future Improvements

- Integration with a real backend API
- More test subjects and questions
- Advanced analytics for user performance
- Personalized learning paths
- Social features for comparing progress with friends
