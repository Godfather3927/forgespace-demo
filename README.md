# ForgeSpace MVP

ForgeSpace is a local browser microsite prototype for a simplified AFS-style visual collaboration workspace inspired by enterprise whiteboarding tools.

## Run Locally

From this folder, start the local static server:

```powershell
node server.js
```

Then open:

```text
http://localhost:3000
```

You can also open `ForgeSpace.html` directly in a browser, but the local server is a cleaner demo path. `ForgeSpaceDemo.html` keeps the simulated floating collaborator cursors for pitch/demo use.

For demo presence mode through the local server:

```powershell
node server.js --entry=ForgeSpaceDemo.html
```

Or open:

```text
http://localhost:3000/demo
```

Before handoff, run:

```powershell
node --check server.js
node --check src/app.js
```

If npm is available, the same workflows are also exposed as `npm start`, `npm run start:demo`, and `npm run check`.

## MVP Capabilities

- Simulated AFS user login and guest access
- Required board-retention warning before template selection
- Guided template gallery
- PI Planning, Team Retrospective, Brainstorming, and Process Mapping templates
- Two-row workshop ribbon
- Canvas pan, zoom, object selection, drag, resize, edit, duplicate, grouping, and voting
- Click-to-place sticky notes, shapes, text blocks, and comments
- Shape options for rectangles, squares, ovals, decision diamonds, and circles
- Comment boxes use a thought-bubble format
- Drag-to-draw straight, elbow, and curved lines
- Drag-to-draw right, left, double, elbow, and curved arrows
- Movable lines, arrows, and freehand pen marks
- Simulated multi-user cursors and participants
- Demo AI clustering, summary, and action-item panel
- JSON import for registered users plus JSON, PNG, PDF, and HTML export for registered users and guests

## Basic Use

- Sign in as the simulated AFS user for full import/export controls.
- Acknowledge the retention warning before entering the template gallery.
- Pick a template or open a blank board.
- Select Sticky, Shape, Text, or Comment, then click the canvas to place it. The app returns to Select after creation.
- Select Line, Arrow, or Pen, then drag on the canvas to draw. The app returns to Select after creation.
- Double-click an object to edit its text and color.
- Use the four connector points on objects to start or attach lines and arrows.
- Drag objects to move them. Drag the lower-right corner of a selected object to resize it.
- Hold Ctrl and click multiple objects, lines, arrows, or pen marks, then press Ctrl+G to group them.
- Use the Layer dropdown to Bring to Front, move Forward, move Backward, or Send to Back. Ctrl+] and Ctrl+[ also move forward/backward one step.
- Drag selected lines, arrows, and pen marks to move them.
- Press Ctrl+E for Pen mode, Ctrl+D to duplicate, Ctrl+C to copy, Ctrl+V to paste, Ctrl+X to cut, Ctrl+Z to undo, Ctrl+G to group, Ctrl+U to ungroup, Ctrl+L to lock/unlock, and Delete to remove a selected item.

## Notes

This MVP intentionally uses demo-only authentication, simulated collaboration, client-side exports, and deterministic demo AI. Production deployment would replace those with the current AFS login/UAM process, real-time collaboration services, server-enforced permissions, and Microsoft ecosystem integrations. AI is currently roadmap-only for production launch.

ForgeSpace boards are not intended to be permanently saved by AFS. Users must export JSON if they want to continue work later through import.

See `PRODUCTION_HANDOFF.md`, `PRODUCT_REQUIREMENTS.md`, and `PRODUCTION_BACKLOG.md` for the production roadmap, requirements, MVP boundaries, and handoff checklist.
