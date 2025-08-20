
# ChatNow Testing Guide

## Testing URLs

### Main Application
- **Primary URL**: `https://workspace-username.repl.co` (Replace with your actual repl URL)
- **Development URL**: `http://localhost:5000` (when running locally)

### Testing with Multiple Users

To test the chat functionality with multiple users:

1. **User 1 Setup**:
   - Open the main URL in one browser/incognito window
   - Create a new account with a display name (e.g., "Alice")
   - Note down the unique ID generated (e.g., `usr_24b62869`)

2. **User 2 Setup**:
   - Open the same URL in another browser/incognito window  
   - Create a new account with a different display name (e.g., "Bob")
   - Note down the unique ID generated (e.g., `usr_48c73951`)

3. **Add Contacts**:
   - In User 1's window: Click "Add Contact" and enter User 2's unique ID
   - In User 2's window: Click "Add Contact" and enter User 1's unique ID

4. **Start Chatting**:
   - Both users should now see each other in their contact list
   - Click on a contact to start chatting
   - Messages should appear in real-time

### Features to Test

#### ✅ Core Features
- [x] User registration with unique IDs
- [x] Real-time messaging
- [x] Contact management
- [x] Online/offline status indicators
- [x] Dark theme interface
- [x] Responsive design
- [x] Settings modal
- [x] Group creation

#### 🧪 Test Scenarios
1. **Registration Flow**:
   - Create new user with display name
   - Verify unique ID generation
   - Check user appears in Firebase database

2. **Contact Management**:
   - Add contact by unique ID
   - Verify bidirectional contact addition
   - Check online status indicators

3. **Messaging**:
   - Send text messages
   - Verify real-time delivery
   - Test message persistence

4. **Groups**:
   - Create new groups
   - Add members to groups
   - Group messaging

5. **Settings**:
   - Toggle profile visibility
   - Update user preferences
   - Logout functionality

### Browser Testing
- Chrome (recommended)
- Firefox
- Safari
- Mobile browsers (responsive design)

### Network Requirements
- WebSocket support required for real-time features
- Firebase Realtime Database access
- Port 5000 must be accessible

### Troubleshooting
- If registration fails, check browser console for errors
- If messages don't appear, verify WebSocket connection
- If contacts don't sync, check Firebase permissions
- Clear browser cache if experiencing issues

## Development Testing

When running in development mode:
```bash
npm run dev
```
The app will be available at `http://localhost:5000`
