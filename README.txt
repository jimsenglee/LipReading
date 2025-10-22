How to Run the Lip Reading Project

✅ VERIFIED WORKING COMMANDS - USE TWO SEPARATE TERMINALS:

TERMINAL 1 (Backend - Flask Server):
# Step 1: Navigate to backend directory
cd "C:\Users\gimsh\Desktop\FYP\Front end UI (already have copy on github previoseuly)\LipReading\backend"

# Step 2: Activate virtual environment
.venv\Scripts\Activate.ps1

# Step 3: Start Flask server (KEEP THIS TERMINAL OPEN)
python run.py

# Expected output:
# * Serving Flask app 'app'
# * Debug mode: on
# * Running on http://127.0.0.1:5000
# * Debugger is active!

TERMINAL 2 (Frontend - React Server):
# Step 1: Navigate to frontend directory (VERY IMPORTANT!)
cd "C:\Users\gimsh\Desktop\FYP\Front end UI (already have copy on github previoseuly)\LipReading\frontend"

# Step 2: Verify you're in the correct directory (should see package.json)
dir package.json

# Step 3: Start React development server (KEEP THIS TERMINAL OPEN)
npm run dev

# Expected output:
# VITE v5.4.20  ready in 1593 ms
# ➜  Local:   http://localhost:8080/
# ➜  Network: http://192.168.1.107:8080/

IMPORTANT NOTES:
- Use TWO SEPARATE PowerShell terminals
- Terminal 1: Keep Flask running (don't close it)
- Terminal 2: Keep React running (don't close it)
- Make sure you're in the correct directory before running npm run dev



hooks folder (useAuth): Manages INTERNAL state. It holds the key. It's the "Client State".
queries.ts (useLogin): Manages EXTERNAL communication. It fetches the key. It's the "Server State".

UNIFIED ARCHITECTURE RULES
🎯 GENERAL PRINCIPLES FOR ALL FEATURES:

1. DATA FETCHING RULE
✅ ALWAYS use React Query hooks for ALL server communication
✅ NEVER mix direct API calls with React Query
✅ ALL API calls go through /services/queries.ts
✅ Pattern: useFeatureName() → useQuery/useMutation

2. STATE MANAGEMENT RULE
✅ Server State: React Query (caching, synchronization, background updates)
✅ Client State: React Context (user info, UI preferences)
✅ Component State: useState/useReducer (form inputs, local UI state)
✅ NEVER duplicate state between different systems

3. HOOK ORGANIZATION RULE
✅ /services/queries.ts: ALL data fetching hooks (useQuery, useMutation)
✅ /hooks/: ONLY UI state hooks (useConfirmation, useToast, useSidebar)
✅ /contexts/: ONLY global client state (AuthContext for user)
✅ NO mixed responsibilities in any hook file

4. COMPONENT ARCHITECTURE RULE
✅ Pure UI components in /components/ui/
✅ Feature components in /pages/ or /components/feature/
✅ ALWAYS use custom hooks for data fetching
✅ NEVER call apiClient directly in components
✅ ALWAYS use React Query hooks for server state

5. ERROR HANDLING RULE
✅ Backend: Field-specific errors with HTTP status codes
✅ Frontend: React Query error handling + toast notifications
✅ Validation: Client-side validation + server-side validation
✅ User Feedback: Flash messages + field-specific error display

6. FILE ORGANIZATION RULE
✅ ONE source of truth for each type of functionality
✅ NO redundant files doing the same thing
✅ Clear separation of concerns
✅ Consistent naming conventions

7. DEVELOPMENT WORKFLOW RULE
✅ Model → Migrate → API Route → Test API → React Query Hook → UI Component
✅ ALWAYS follow this exact sequence for new features
✅ NEVER skip steps or mix approaches
✅ ALWAYS test each step before moving to next

8. CODE CONSISTENCY RULE
✅ DRY (Don't Repeat Yourself)
✅ Reusability over duplication
✅ Consistency across all features
✅ Readability with proper comments
✅ NO shortcuts that break patterns

USER MANAGEMENT FEATURE COMPLETED ✅
- Backend API endpoints for user CRUD operations
- React Query hooks for data fetching and mutations
- Client-side filtering and sorting for all columns
- Pagination with current/total user display
- Proper error handling and flash messages
- Database integration (no more mock data)
- Confirmation dialogs for destructive actions
- Responsive design with proper loading states