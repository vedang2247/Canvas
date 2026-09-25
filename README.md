# Caanvas

A full-stack web-based canvas editor allowing you to draw, arrange, resize, and edit shapes and text on an infinite-feeling canvas. Built using **Next.js**, **React Konva**, **Node.js**, **Express**, and **MongoDB**.

## Features

- **Object-Oriented Drawing:** Add Rectangles, Circles, and Text elements to your canvas.
- **Full Transformation Controls:** Drag to reposition, resize with bounding boxes, and rotate objects seamlessly.
- **Rich Text Editing:** Double-click any text element to edit it in place using a native HTML textarea overlay that automatically syncs.
- **Dynamic Properties Panel:** Tweak X/Y coordinates, rotation, dimensions (width/height/radius), text content, font sizes, colors, and Z-index layering.
- **Z-Index Layering:** Re-order overlapping objects using "Bring Forward" and "Send Backward" controls.
- **Keyboard Shortcuts:** Press `Delete` or `Backspace` to instantly remove selected elements.
- **Responsive Stage:** The canvas dynamically adapts to the size of your browser window.
- **Debounced Autosave:** Automatically syncs your progress to the backend 1.5 seconds after you finish moving or editing an element.
- **Export to PNG:** Download high-resolution (2x pixel ratio) exports of your masterpiece with a single click.
- **Robust Persistence:** Powered by an Express REST API with strict Zod validation and a MongoDB database for storage.

## Architecture Decisions

1. **React Konva over plain Canvas API:** React Konva provides a declarative, component-based approach to the HTML5 Canvas. It abstracts away the complex redraw loops and math required for hit detection, dragging, and transformation handles.
2. **Next.js + Express Separation:** Next.js is used purely as a React frontend client to cleanly decouple the interface from the backend business logic and validation. The backend is a traditional Node.js/Express REST API.
3. **Z-Index as Data:** Instead of relying on DOM ordering (which can be volatile in React), each element explicitly stores a `zIndex` integer in the database. The frontend sorts elements before rendering them onto the Konva layer.
4. **UUIDs for Elements:** We use standard UUIDs (`crypto.randomUUID()`) for individual canvas elements on the client instead of MongoDB `_id` fields for subdocuments. This makes client-side optimistic UI updates simpler before the data even hits the server.

## Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally (default: `mongodb://127.0.0.1:27017/caanvas`) or a MongoDB Atlas URI.

### 1. Clone the repository
```bash
git clone https://github.com/vedang2247/Canvas.git
cd Canvas
```

### 2. Setup the Server
Open a terminal in the `server` directory:
```bash
cd server
npm install
```
Create a `.env` file from the example:
```bash
cp .env.example .env
```
Ensure `.env` contains:
```env
MONGO_URI=mongodb://127.0.0.1:27017/caanvas
PORT=5000
CLIENT_ORIGIN=http://localhost:3000
```
Start the Express server:
```bash
npm run dev
```

### 3. Setup the Client
Open a new terminal in the `client` directory:
```bash
cd client
npm install
```
Create a `.env` file:
```bash
cp .env.example .env
```
Ensure `.env` contains:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```
Start the Next.js frontend:
```bash
npm run dev
```

The application is now accessible at [http://localhost:3000](http://localhost:3000).

## API Reference

Base URL: `http://localhost:5000/api/canvases`

| Method | Path | Request Body | Response Body | Status Codes |
|---|---|---|---|---|
| `POST` | `/` | `{ name: string, elements?: CanvasElement[] }` | Created Canvas Document | 201 Created, 400 Bad Request |
| `GET` | `/` | None | Array of Canvas summaries | 200 OK |
| `GET` | `/:id` | None | Full Canvas Document | 200 OK, 404 Not Found |
| `PUT` | `/:id` | `{ name?: string, elements?: CanvasElement[] }` | Updated Canvas Document | 200 OK, 400 Bad Request, 404 Not Found |
| `DELETE` | `/:id` | None | `{ message: 'Deleted' }` | 200 OK, 404 Not Found |

## Known Limitations

- **Text editing coordinate accuracy:** At non-default browser zooms, native HTML `<textarea>` overlays might experience minor offset misalignments with the underlying Konva canvas coordinates.
- **No Undo/Redo:** History management (Ctrl+Z / Ctrl+Y) is not currently implemented.
- **Single-user:** There is no real-time collaboration (WebSockets/Yjs) implemented. If multiple users edit the same canvas simultaneously, the last save operation overwrites the state.

## Bonus Features Implemented

- **Debounced Autosave:** Changes to the canvas are automatically persisted to the server 1.5 seconds after the last edit, guarded by an `isLoaded` flag to prevent spurious saves on initial page load.
- **PNG Export:** A high-resolution (2× pixel ratio) PNG is exported via `stage.toDataURL()` and downloaded automatically using a temporary anchor element.
- **Keyboard Delete Shortcut:** Pressing `Delete` or `Backspace` with a shape selected removes it instantly (ignored when focus is in an input or textarea).
- **Enter-to-Commit Text Edit:** While editing a text element's overlay textarea, pressing `Enter` (without `Shift`) commits the edit. `Shift+Enter` inserts a newline. `Escape` discards changes.
- **Rate Limiting:** The Express API applies a 100 requests/minute per-IP rate limit using `express-rate-limit`.
