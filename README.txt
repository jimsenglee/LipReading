Database rules must follow:
Step 1. Edit Your Code

Go into your models/ folder.
Change your Python model classes.
(e.g., Add phone_number: so.Mapped[str] to the Account class).

Step 2. flask db migrate -m "Your descriptive message"

Go to your terminal.

Run this command. The -m "message" is not optional; it is critical for tracking your changes.

What it does:

Compares your Python models to the database's last known state.

Generates a new script inside the migrations/versions/ folder.

It does NOT touch or change your actual database.

Step 3. flask db upgrade

Go to your terminal.

Run this command.

What it does:

Takes the new script generated in Step 2.

Executes that script and applies the changes (e.g., ALTER TABLE...) to your live database.

Your database now matches your Python code.

Coding rule must follow (front end):
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
✅ /services/: ALL data fetching hooks organized by feature (auth, users, content, analytics)
✅ /hooks/: ONLY UI state hooks (useConfirmation, useToast, useSidebar, useTableState)
✅ /contexts/: ONLY global client state (AuthContext for user)
✅ NO mixed responsibilities in any hook file
✅ Each service folder contains queries.ts and mutations.ts files

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

9. SERVICES ARCHITECTURE RULE
✅ /services/auth/: Authentication queries and mutations
✅ /services/users/: User management queries and mutations  
✅ /services/content/: Content management queries and mutations
✅ /services/analytics/: Analytics queries and mutations
✅ Each service folder contains queries.ts and mutations.ts files
✅ Use /services/index.ts for centralized exports
✅ NO single giant queries.ts file
✅ Server-side filtering/sorting/pagination for all data tables
✅ Consistent error handling and loading states

## 🔧 **BACKEND ARCHITECTURE RULES**

### **BACKEND LAYERED ARCHITECTURE RULE**
✅ API Layer (/api/): ONLY HTTP handling and route definitions
✅ Service Layer (/services/): ALL business logic and data processing
✅ Schema Layer (/schemas/): Input validation and data serialization
✅ Model Layer (/models/): Database entities and relationships
✅ Utils Layer (/utils/): Helper functions and utilities
✅ NEVER mix responsibilities between layers

### **API ENDPOINT RULE**
✅ API files contain ONLY route definitions and HTTP logic
✅ ALWAYS delegate business logic to service layer
✅ ALWAYS validate input using schemas before processing
✅ ALWAYS handle HTTP status codes properly
✅ NEVER put business logic directly in API endpoints
✅ Pattern: Route → Schema Validation → Service Call → HTTP Response

### **SERVICE LAYER RULE**
✅ ALL business logic goes in /services/ folder
✅ ONE service file per feature (auth_service.py, user_service.py)
✅ Services handle data validation, processing, and database operations
✅ Services return structured data, not HTTP responses
✅ Services are testable independently of HTTP layer
✅ NO direct database operations in API endpoints

### **SCHEMA VALIDATION RULE**
✅ ALL input validation using /schemas/ folder
✅ Use Marshmallow or Pydantic for data validation
✅ Schema files organized by feature (auth_schemas.py, user_schemas.py)
✅ ALWAYS validate input before processing
✅ Return field-specific validation errors
✅ NO manual validation in API or service layers

### **ERROR HANDLING RULE**
✅ Custom exception classes in /exceptions/ folder
✅ Proper error hierarchy (ValidationError, BusinessLogicError, DatabaseError)
✅ Consistent error response format across all endpoints
✅ Field-specific error messages for validation failures
✅ Proper HTTP status codes (400, 401, 403, 404, 500)
✅ NO generic exception handling

### **DATABASE OPERATION RULE**
✅ ALL database operations in service layer
✅ Use SQLAlchemy ORM for all database interactions
✅ Proper transaction handling for complex operations
✅ Database models in /models/ folder only
✅ NO raw SQL queries unless absolutely necessary
✅ Proper relationship definitions in models

### **FILE ORGANIZATION RULE**
✅ /api/: Route definitions only (thin controllers)
✅ /services/: Business logic only (thick services)
✅ /schemas/: Data validation only
✅ /models/: Database entities only
✅ /utils/: Helper functions only
✅ /exceptions/: Custom exceptions only
✅ Clear separation of concerns in each folder

### **BACKEND DEVELOPMENT WORKFLOW RULE**
✅ Model → Schema → Service → API → Test → Migrate
✅ ALWAYS follow this exact sequence for new features
✅ Create database models first
✅ Create validation schemas second
✅ Implement business logic in services third
✅ Create API endpoints fourth
✅ Test each layer independently
✅ Add database migrations last

### **BACKEND CODE CONSISTENCY RULE**
✅ DRY (Don't Repeat Yourself) across all layers
✅ Consistent naming conventions (snake_case for Python)
✅ Proper docstrings for all functions and classes
✅ Type hints for all function parameters and returns
✅ Consistent error handling patterns
✅ NO shortcuts that break layered architecture

### **BACKEND TESTING RULE**
✅ Unit tests for service layer (business logic)
✅ Integration tests for API endpoints
✅ Test database operations with test database
✅ Mock external dependencies in tests
✅ Test error scenarios and edge cases
✅ NO business logic testing in API layer tests

## 🏗️ **PROJECT STRUCTURE**

```
LipReading/
├── backend/          # Python Flask API Server
├── frontend/         # React TypeScript Frontend  
├── dump/            # Documentation & Old Files
└── README.txt       # Project Instructions
```

### **🔧 BACKEND STRUCTURE (`/backend/`)**
**Purpose**: Python Flask API Server with Layered Architecture

```
backend/
├── app/                    # Main application package
│   ├── models/            # Database models (SQLAlchemy ORM)
│   ├── api/               # API endpoints (thin controllers - HTTP only)
│   ├── services/          # Business logic layer (thick services)
│   ├── schemas/           # Data validation schemas 
│   ├── exceptions/        # Custom exception classes
│   ├── utils/             # Helper functions and utilities
│   └── extensions.py      # Flask extensions initialization
├── migrations/            # Database migrations (Alembic)
├── scripts/               # Database setup scripts
├── uploads/               # File storage
├── requirements.txt       # Python dependencies
└── run.py                 # Application entry point
```

**✅ LAYERED ARCHITECTURE**: API (HTTP) → Services (Business Logic) → Models (Database) → Schemas (Validation) → Exceptions (Error Handling)

### **⚛️ FRONTEND STRUCTURE (`/frontend/`)**
**Purpose**: React TypeScript SPA with modern architecture

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Basic UI components (buttons, cards)
│   │   ├── admin/        # Admin-specific components
│   │   ├── auth/         # Authentication components
│   │   ├── education/    # Education feature components
│   │   ├── layout/       # Layout components (navbar, sidebar)
│   │   └── transcription/ # Transcription components
│   ├── pages/            # Page components (routes)
│   │   ├── admin/        # Admin pages
│   │   ├── auth/         # Auth pages
│   │   └── education/    # Education pages
│   ├── contexts/         # React Context (global state)
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API communication layer (organized by feature)
│   │   ├── auth/        # Authentication queries and mutations
│   │   ├── users/       # User management queries and mutations
│   │   ├── content/     # Content management queries and mutations
│   │   ├── analytics/   # Analytics queries and mutations
│   │   └── index.ts     # Centralized exports
│   ├── lib/              # Utilities and constants
│   └── main.tsx          # App entry point
├── public/               # Static assets
└── package.json          # Dependencies
```

**✅ CORRECT APPROACH**: Feature-based organization, Separation of concerns, Modern React patterns (hooks, context, TypeScript)

---

## 🎯 **ARCHITECTURE PATTERNS YOU'RE USING**

### **✅ CORRECT PATTERNS**:

1. **🏗️ Monorepo Structure**: Backend + Frontend in same repo
2. **🔀 Separation of Concerns**: Clear boundaries between layers
3. **📦 Feature-based Organization**: Group related files together
4. **🔄 API-First Design**: Backend provides REST API, frontend consumes it
5. **📱 Modern React**: Hooks, Context, TypeScript, React Query
6. **🗄️ Database Migrations**: Version-controlled schema changes
7. **🎨 Component Architecture**: Reusable UI components

---

## 🤖 **COMPREHENSIVE AI PROMPT FOR FUTURE FEATURES**

**CRITICAL**: When implementing ANY new feature (like Online Class Management, Course Registration, etc.), follow this EXACT pattern:

### **📋 STEP-BY-STEP IMPLEMENTATION GUIDE**

#### **1. BACKEND FIRST (Always)**
```
✅ Create database models in /backend/app/models/
✅ Create validation schemas in /backend/app/schemas/
✅ Create business logic in /backend/app/services/
✅ Create API endpoints in /backend/app/api/
✅ Add database migrations
✅ Test each layer independently
✅ Test API endpoints with Postman/curl
```

#### **2. FRONTEND SERVICES (Organized by Feature)**
```
✅ Create new service folder: /frontend/src/services/[feature]/
✅ Split into: [feature]Queries.ts and [feature]Mutations.ts
✅ Export from /frontend/src/services/index.ts
✅ Use React Query for all API calls
✅ Implement server-side filtering/sorting/pagination
```

#### **3. REUSABLE COMPONENTS (DRY Principles)**
```
✅ Use existing DataTable component
✅ Use existing SearchFilterBar component  
✅ Use existing BulkActions component
✅ Use existing useTableState hook
✅ Use existing useTableActions hook
✅ NO code duplication between features
```

#### **4. CONSISTENT PATTERNS**
```
✅ Same API response structure: ContentResponse<T>
✅ Same table state management
✅ Same error handling patterns
✅ Same loading states
✅ Same confirmation dialogs
```

#### **5. EXAMPLE: Online Class Management**
```
Backend (Layered Architecture):
- /backend/app/models/OnlineClass.py (Database entity)
- /backend/app/schemas/online_class_schemas.py (Input validation)
- /backend/app/services/online_class_service.py (Business logic)
- /backend/app/api/online_classes.py (HTTP endpoints)
- Database migration for online_classes table

Frontend:
- /frontend/src/services/online-classes/
  ├── onlineClassQueries.ts
  └── onlineClassMutations.ts
- /frontend/src/pages/admin/OnlineClassManagement.tsx
- Use existing DataTable, SearchFilterBar, BulkActions
- Use existing useTableState, useTableActions hooks
```

### **🚫 CRITICAL RULES - NEVER BREAK THESE**

1. **❌ NEVER create single giant files** (like queries.ts)
2. **❌ NEVER duplicate code** between features
3. **❌ NEVER use client-side filtering** for large datasets
4. **❌ NEVER skip backend API** implementation
5. **❌ NEVER create inconsistent interfaces**
6. **❌ NEVER ignore existing patterns**
7. **❌ NEVER put business logic in API endpoints**
8. **❌ NEVER skip schema validation**
9. **❌ NEVER mix responsibilities between layers**
10. **❌ NEVER use generic exception handling**

### **✅ ALWAYS DO THESE**

1. **✅ Follow existing architecture patterns**
2. **✅ Use server-side filtering/sorting/pagination**
3. **✅ Organize services by feature**
4. **✅ Reuse existing components and hooks**
5. **✅ Maintain consistent error handling**
6. **✅ Test both backend and frontend**
7. **✅ Use layered architecture (API → Services → Models → Schemas)**
8. **✅ Validate input using schemas before processing**
9. **✅ Delegate business logic to service layer**
10. **✅ Handle errors with proper HTTP status codes**

### **🎯 SUCCESS CRITERIA**

Your implementation is correct when:
- ✅ Backend API endpoints work with Postman
- ✅ Backend uses layered architecture (API → Services → Models → Schemas)
- ✅ Backend validates input using schemas
- ✅ Backend business logic is in service layer
- ✅ Frontend uses server-side filtering
- ✅ No code duplication between features
- ✅ Services are organized by feature
- ✅ All existing patterns are followed
- ✅ No linter errors
- ✅ Consistent user experience


