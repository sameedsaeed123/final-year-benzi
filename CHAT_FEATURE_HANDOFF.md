# Chat Feature — Handoff Document

## What We Are Building

A real-time therapist ↔ patient messaging system for the **Benzi** mental health platform. Therapists can message their clients directly from the Clients page. Patients can message their assigned therapist. Both see unread badge counts in the sidebar and navbar.

---

## Project Structure

```
/Users/singlesolution/newrepo/
├── benzi-server/          ← Node.js/Express backend (port 5000)
└── Fyp-To-Reduce-Mental-Health/  ← React/Vite frontend (port 5173)
```

---

## What Has Been Completed ✅

### Backend (`benzi-server/`)

| File | Status | Description |
|------|--------|-------------|
| `src/models/Message.js` | ✅ Done | Mongoose schema: therapistUserId, patientUserId, senderUserId, senderRole, text, readAt |
| `src/services/chatService.js` | ✅ Done | listConversations, getMessages, sendMessage, markRead, getUnreadCount |
| `src/controllers/chatController.js` | ✅ Done | REST handlers for all chat operations |
| `src/routes/chat.routes.js` | ✅ Done | Routes: `/api/chat/therapist/*`, `/api/chat/patient/*`, `/api/chat/unread` |
| `src/socket.js` | ✅ Done | Socket.IO server: join_room, send_message, typing, mark_read events |
| `src/app.js` | ✅ Done | Chat routes registered at `/api/chat` |
| `server.js` | ✅ Done | HTTP server + Socket.IO initialized via `initSocket()` |
| `package.json` | ✅ Done | `socket.io` installed |

### Frontend (`Fyp-To-Reduce-Mental-Health/`)

| File | Status | Description |
|------|--------|-------------|
| `src/context/SocketContext.jsx` | ✅ Done | Socket.IO client context, unread count state |
| `src/components/ChatWindow.jsx` | ✅ Done | Full chat UI: messages, typing indicator, send, scroll-to-bottom |
| `src/pages/therapist/TherapistChatPage.jsx` | ✅ Done | Therapist chat page with conversation list + chat window |
| `src/pages/patient/PatientChatPage.jsx` | ✅ Done | Patient chat page with therapist list + chat window |
| `src/components/TherapistSidebar.jsx` | ✅ Done | "Messages" nav item added with unread badge |
| `src/components/PatientSidebar.jsx` | ✅ Done | "Messages" nav item added with unread badge |
| `src/components/Navbar.jsx` | ✅ Done | Chat icon with unread badge for logged-in users |
| `src/pages/therapist/TherapistClientsPage.jsx` | ✅ Done | Chat button (green) added to each client row → navigates to `/therapist-chat?patientId=...` |
| `src/App.jsx` | ✅ Done | Routes added: `/therapist-chat` and `/patient-chat` |
| `src/main.jsx` | ✅ Done | `SocketProvider` wraps the app |
| `src/index.css` | ✅ Done | `fadeSlideIn` keyframe animation for messages |
| `package.json` | ✅ Done | `socket.io-client` installed |

**Build status: ✅ Passes (`npm run build` — 2384 modules, 0 errors)**

---

## What Still Needs To Be Done ❌

### 1. Backend — CORS for Socket.IO on production
The Socket.IO CORS origin is set to `env.FRONTEND_URL` (from `.env`). If deploying, ensure `FRONTEND_URL` is set correctly.

### 2. Backend — Rate limiting for chat routes
The chat routes go through the global `apiLimiter`. Consider a separate, more permissive limiter for the chat polling endpoint (`/api/chat/unread`) since it's called frequently.

### 3. Frontend — Patient Dashboard "Chat with Therapist" shortcut
Add a quick "Message your therapist" card/button on the **PatientDashboard** page (`src/pages/patient/PatientDashboard.jsx`) that links to `/patient-chat`. This gives patients a prominent entry point.

### 4. Frontend — Mobile hamburger menu chat link
The mobile dropdown in `Navbar.jsx` doesn't show the chat icon. Add a "Messages" link inside the mobile menu for logged-in users:

```jsx
{/* Inside the mobile dropdown, after the navItems list */}
{user && (
  <Link
    to={chatPath}
    onClick={() => setMenuOpen(false)}
    className="flex items-center gap-2 py-3 px-2 no-underline text-[15px] font-medium border-b border-black/6 text-[#2a2a2a] hover:text-brand"
  >
    <MessageCircle size={16} />
    Messages
    {unreadCount > 0 && (
      <span className="ml-auto h-5 w-5 rounded-full bg-[#0f4e34] text-white text-[10px] font-bold flex items-center justify-center">
        {unreadCount}
      </span>
    )}
  </Link>
)}
```

### 5. Frontend — Anonymous patient chat handling
Currently anonymous patients show `EyeOff` icon in the chat list. The chat itself works fine, but the therapist sees the anonymous alias as the name. Verify this looks correct end-to-end.

### 6. Testing — End-to-end flow
After restarting the backend server, test:
1. Therapist logs in → goes to Clients → clicks chat icon on a patient → redirected to `/therapist-chat?patientId=...`
2. Patient logs in → goes to Messages → sees their therapist → sends a message
3. Therapist sees the message in real-time (typing indicator appears while patient types)
4. Unread badge appears in navbar and sidebar when a message is unread
5. Badge clears when the conversation is opened

---

## How To Run

```bash
# Terminal 1 — Backend
cd benzi-server
npm run dev

# Terminal 2 — Frontend
cd Fyp-To-Reduce-Mental-Health
npm run dev
```

Backend runs on `http://127.0.0.1:5000`  
Frontend runs on `http://localhost:5173`

---

## Key Architecture Decisions

- **Socket.IO** for real-time delivery (typing indicators, instant messages)
- **REST fallback** — if socket is disconnected, messages send via `POST /api/chat/*/messages/:id`
- **Optimistic UI** — message appears immediately in the sender's UI before server confirms
- **Room naming** — `chat:{therapistUserId}:{patientUserId}` — deterministic, no DB lookup needed
- **Authorization** — both socket and REST verify an appointment relationship exists before allowing chat
- **Anonymous mode** — therapist sees alias name, `EyeOff` icon; chat content is not redacted (only reports are)

---

## Files To Read First

If continuing this work, read these files in order:

1. `benzi-server/src/models/Message.js` — data shape
2. `benzi-server/src/socket.js` — real-time event flow
3. `Fyp-To-Reduce-Mental-Health/src/context/SocketContext.jsx` — frontend socket management
4. `Fyp-To-Reduce-Mental-Health/src/components/ChatWindow.jsx` — the core chat UI component
5. `Fyp-To-Reduce-Mental-Health/src/pages/therapist/TherapistChatPage.jsx` — therapist view
6. `Fyp-To-Reduce-Mental-Health/src/pages/patient/PatientChatPage.jsx` — patient view
