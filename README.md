# ForgeSpace MVP

ForgeSpace is a local browser microsite prototype for a simplified AFS-style visual collaboration workspace inspired by enterprise whiteboarding tools.

## Run Locally

From this folder, start a static server:

```powershell
node server.js
```

Then open:

```text
http://localhost:3000
```

You can also open `ForgeSpace.html` directly in a browser, but the local server is a cleaner demo path. `ForgeSpaceDemo.html` keeps the simulated floating collaborator cursors for pitch/demo use.

## MVP Capabilities

- Simulated AFS user login and guest access
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
- JSON import plus JSON, PNG, PDF, and HTML export for registered users

## Basic Use

- Sign in as the simulated AFS user for full import/export controls.
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

This MVP intentionally uses demo-only authentication, simulated collaboration, and deterministic demo AI. Production deployment would replace those with enterprise identity, real-time services, approved AI infrastructure, audit logging, and Microsoft ecosystem integrations.
