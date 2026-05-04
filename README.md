# Realtime Tracking App

A realtime location tracking application with Google Authentication, featuring a live map and an active user list.

## Features

- **Google Authentication**: Secure login via Google OAuth 2.0.
- **Realtime Tracking**: Live location updates using Socket.io and Geolocation API.
- **Interactive Map**: Built with Leaflet.js and OpenStreetMap.
- **Active User List**: See who else is online and click their name to find them on the map.
- **Persistent Sessions**: Users stay logged in for 7 days.

## Prerequisites

- Node.js installed.
- A Google Cloud Project with OAuth 2.0 credentials.

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd Realtime_Tracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   - Rename `.env.example` to `.env`.
   - Fill in your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
   - Set a secure `SESSION_SECRET`.
   - Ensure the `CALLBACK_URL` matches your Google Console settings (e.g., `http://localhost:3000/auth/google/callback`).

4. **Run the application**:
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Render

1. Push your code to GitHub (ensure `.env` is **not** pushed).
2. Create a new **Web Service** on Render.
3. Connect your GitHub repository.
4. Add the following **Environment Variables** in the Render dashboard:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `SESSION_SECRET`
   - `CALLBACK_URL` (Use your actual Render app URL)
5. Update your **Google Cloud Console** with the new production redirect URI.

## License

This project is licensed under the ISC License.
