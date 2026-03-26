# AI Chatbot - Hệ thống quản lý sinh viên

## Tổng quan

Chatbot AI là trợ lý ảo thông minh tích hợp trong hệ thống quản lý sinh viên, hỗ trợ người dùng (STUDENT, LECTURER, ADMIN) với các tác vụ học vụ tự động.

## Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ChatbotPage.tsx                                         │   │
│  │  - Display chat interface                                │   │
│  │  - Render messages & components                          │   │
│  │  - Handle user input                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  StudentImportForm.tsx (Component)                       │   │
│  │  - Import sinh viên qua chatbot                          │   │
│  │  - Generate/paste modes                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ChatbotController                                       │   │
│  │  - POST /api/chatbot/reply                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ChatbotService                                          │   │
│  │  - Intent recognition (rule-based)                       │   │
│  │  - Context building                                      │   │
│  │  - AI fallback (Gemini API)                              │   │
│  │  - Early Warning integration                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ EarlyWarning │  │   Chatbot    │  │  Student     │          │
│  │ Service      │  │  Context     │  │  BulkImport  │          │
│  │              │  │  Service     │  │  Service     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL AI                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Google Gemini API (fallback)                            │   │
│  │  - Models: gemini-2.0-flash, gemini-3-flash-preview      │   │
│  │  - Fallback URL: generativelanguage.googleapis.com       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Backend Structure

### Services

#### 1. `ChatbotService.java`
**Location:** `backend/student_management/src/main/java/com/example/student_management/service/chatbot/ChatbotService.java`

**Main responsibilities:**
- Intent recognition (rule-based)
- Context building
- AI response generation (Gemini fallback)
- Integration with other services

**Key methods:**
```java
public ChatbotResponse reply(ChatbotRequest request)
```

**Supported intents:**
| Intent | Trigger Keywords | Role | Description |
|--------|------------------|------|-------------|
| `STUDENT_IMPORT` | "import", "nhập liệu", "thêm sinh viên" | ADMIN | Import students via chat |
| `GREETING` | "xin chào", "hello", "hi" | All | Greeting response |
| `LEARNING_PLAN` | "kế hoạch học tập" | STUDENT | Generate learning plan |
| `EARLY_WARNING` | "early warning", "cảnh báo", "rủi ro" | STUDENT | Show risk assessment |
| `GPA_ADVICE` | "mẹo", "tăng gpa", "cải thiện gpa" | STUDENT | GPA improvement tips |
| `COURSE_INFO` | "môn học", "đăng ký môn", "hocphan" | STUDENT | Course information |
| `AI_RESPONSE` | (fallback) | All | Gemini-generated response |

**Dependencies:**
- `EarlyWarningService` - Risk assessment
- `ChatbotContextService` - User data context
- `StudentBulkImportService` - Import functionality

#### 2. `EarlyWarningService.java`
**Location:** `backend/student_management/src/main/java/com/example/student_management/service/ai/EarlyWarningService.java`

**Purpose:** Evaluate student academic risk using rule-based heuristics

**Risk factors:**
- Attendance rate < 80%
- GPA < 2.0
- Failed courses
- Low assignment submission rate

**Output:**
```java
public class EarlyWarningResponse {
    String studentId;
    String studentName;
    Double riskScore;        // 0.0 - 1.0
    String riskLevel;        // LOW, MEDIUM, HIGH
    Double attendanceRate;
    Double averageGpa;
    Integer failedCourseCount;
    List<String> recommendations;
}
```

#### 3. `ChatbotContextService.java`
**Location:** `backend/student_management/src/main/java/com/example/student_management/service/chatbot/ChatbotContextService.java`

**Purpose:** Build contextual data about the user for AI responses

**Context includes:**
- Student/lecturer profile
- Enrollment data
- Grade history
- Attendance records

### DTOs

#### `ChatbotRequest.java`
```java
public class ChatbotRequest {
    String message;
    String role;           // ADMIN, LECTURER, STUDENT
    String userId;
    String userName;
    String studentId;
    List<ChatMessage> history;
}
```

#### `ChatbotResponse.java`
```java
public class ChatbotResponse {
    String reply;                    // HTML-formatted response
    String intent;                   // Detected intent
    List<String> suggestions;        // Quick reply buttons
    String source;                   // "server" or "fallback"
    String errorMessage;
    Map<String, Object> componentData;  // For UI components
}
```

#### `StudentImportComponent.java`
```java
public class StudentImportComponent {
    String type = "student_import";
    String classId;
    String departmentId;
    String instruction;
}
```

## Frontend Structure

### Components

#### 1. `ChatbotPage.tsx`
**Location:** `frontend/student-management-frontend/src/pages/shared/ChatbotPage.tsx`

**Features:**
- Chat interface with message history
- Dynamic component rendering
- Suggestion buttons
- Server status indicator

**State management:**
```typescript
interface State {
    messages: ChatbotMessage[];
    input: string;
    suggestions: string[];
    isSending: boolean;
    serverMode: "server" | "fallback";
    lastError: string;
    activeComponent: { type: string; data: any } | null;
}
```

#### 2. `StudentImportForm.tsx`
**Location:** `frontend/student-management-frontend/src/components/StudentImportForm.tsx`

**Modes:**
- **Generate mode:** Create sample student data
- **Paste mode:** Import custom student list

**Format:**
```
studentId email fullName phone classId
DTU001 dtu001@dtu.edu.vn Nguyen Van A 0901234567 DTU001
```

### Types

#### `ChatbotMessage`
```typescript
interface ChatbotMessage {
    role: 'user' | 'assistant';
    content: string;
    componentData?: {
        type?: string;
        classId?: string;
        departmentId?: string;
        instruction?: string;
        [key: string]: any;
    };
}
```

#### `ChatbotReply`
```typescript
interface ChatbotReply {
    reply: string;
    intent: string;
    suggestions: string[];
    source?: 'server' | 'fallback';
    errorMessage?: string;
    componentData?: Record<string, any>;
}
```

## AI Integration

### Gemini API Configuration

**Environment variables:**
```properties
gemini.api.key=<API_KEY>
gemini.api.url=<API_URL>
```

**Fallback mechanism:**
1. Try configured API URL
2. Fall back to `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`

**Retry logic:**
- Multiple endpoints tried sequentially
- Timeout: 20 seconds per request
- Proxy support enabled

### System Prompt

The AI assistant uses a system prompt that includes:
- Role definition (academic assistant)
- Response format guidelines (HTML)
- User context (role, profile, grades, etc.)

```
Bạn là trợ lý học vụ của hệ thống quản lý sinh viên.
Trả lời ngắn gọn, rõ ràng, bằng tiếng Việt và ưu tiên các chủ đề GPA, cảnh báo sớm, lịch học, đăng ký môn.

=== USER DATA CONTEXT ===
[User profile, enrollments, grades, attendance...]
=== END CONTEXT ===

ĐỊNH DẠNG: Use HTML format với thẻ <p>, <ul><li>, <strong>, <em>, <h3>.
```

## Chat Flow

```
User types message
    │
    ▼
ChatbotPage.tsx
    │
    ▼
askChatbotApi() → POST /api/chatbot/reply
    │
    ▼
ChatbotController
    │
    ▼
ChatbotService.reply()
    │
    ├─► Rule-based intent detection
    │   ├─ Import intent? → handleImportIntent()
    │   ├─ Greeting? → greeting response
    │   ├─ Early Warning? → earlyWarningService.evaluate()
    │   ├─ GPA advice? → GPA advice response
    │   └─ ... other intents
    │
    └─► Fallback to Gemini API
        ├─ Build system prompt with context
        ├─ Call Gemini (with retry)
        └─ Extract & format response
    │
    ▼
ChatbotResponse
    │
    ▼
ChatbotPage.tsx
    ├─ Display message
    ├─ Render component (if componentData.type set)
    └─ Update suggestions
```

## Component System

Chatbot supports dynamic UI components via `componentData`:

### Supported Components:

1. **student_import**
   - Form for importing students
   - Fields: classId, departmentId, quantity or studentData
   - Triggered by: "import sinh viên", "nhập liệu"

### Component Data Flow:
```java
ChatbotResponse.builder()
    .intent("STUDENT_IMPORT")
    .reply("Tôi có thể hỗ trợ import sinh viên!")
    .componentData(Map.of(
        "type", "student_import",
        "classId", "class1",
        "departmentId", "dept1"
    ))
    .build();
```

```typescript
// Frontend receives and renders component
if (response.componentData?.type === "student_import") {
    setActiveComponent({
        type: "student_import",
        data: response.componentData,
    });
}
```

## Security Considerations

1. **Role-based access:** Different intents available per role
2. **Context isolation:** Users only see their own data
3. **API key protection:** Gemini key stored in environment variables
4. **Input validation:** All user inputs validated before processing

## API Endpoints

### POST `/api/chatbot/reply`
**Request:**
```json
{
    "message": "Xin chào",
    "role": "STUDENT",
    "userId": "123",
    "userName": "Nguyen Van A",
    "studentId": "DTU001",
    "history": []
}
```

**Response:**
```json
{
    "reply": "Xin chào! Mình có thể giúp gì hôm nay?",
    "intent": "GREETING",
    "suggestions": ["Kiểm tra Early Warning", "Mẹo tăng GPA"],
    "source": "server",
    "componentData": {
        "type": "student_import",
        "classId": "class1"
    }
}
```

## Testing & Build

### Backend
```bash
cd backend/student_management
./gradlew compileJava
./gradlew test
```

### Frontend
```bash
cd frontend/student-management-frontend
npm run build
npm run dev
```

## Future Enhancements

- [ ] Integration with student bulk import API
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Analytics dashboard for chatbot usage
- [ ] Conversation history & persistence
- [ ] Advanced NLP for better intent detection
- [ ] Integration with notification system
- [ ] Support for file uploads (documents, transcripts)
