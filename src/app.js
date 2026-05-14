const STORE_KEY = "forgespace.currentBoard.v2";
const appConfig = window.FORGESPACE_CONFIG || {};

const state = {
  user: null,
  role: "guest",
  sessionId: `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
  persistenceAcknowledged: false,
  currentTemplate: null,
  boardTitle: "Untitled ForgeSpace Board",
  objects: [],
  connectors: [],
  drawings: [],
  selectedId: null,
  selectedIds: [],
  selectedItems: [],
  selectedType: "object",
  mode: "select",
  shapeVariant: "rectangle",
  lineVariant: "line",
  arrowVariant: "right",
  clipboard: null,
  history: [],
  historyIndex: -1,
  isRestoring: false,
  pan: { x: -120, y: -80 },
  zoom: 0.78,
  panel: "session",
  timer: { remaining: 15 * 60, running: false, id: null },
  voting: false,
  cursors: [
    { name: "Priya", x: 560, y: 260, color: "#a100ff", dx: 1.6, dy: 1.1 },
    { name: "Marcus", x: 920, y: 430, color: "#276ef1", dx: -1.2, dy: 1.4 },
    { name: "Elena", x: 1320, y: 300, color: "#1f8a5b", dx: 1.3, dy: -1.0 }
  ],
  aiResults: [
    "Cluster 1: Delivery confidence, dependency clarity, and schedule risk.",
    "Cluster 2: Client alignment, decision ownership, and follow-up cadence.",
    "Cluster 3: Engineering capacity, integration readiness, and test planning."
  ],
  actionItems: [
    "Confirm external dependency owners before the planning readout.",
    "Create a risk lane for items that need leadership escalation.",
    "Convert top-voted notes into accountable follow-up tasks."
  ],
  nextId: 1
};

const templates = [
  {
    id: "pi",
    title: "PI Planning",
    description: "Align objectives, dependencies, risks, milestones, and team capacity across a planning increment.",
    objects: [
      lane("Program Objectives", 180, 160, 390, 520),
      lane("Team Breakouts", 610, 160, 390, 520),
      lane("Dependencies", 1040, 160, 390, 520),
      lane("ROAM Risks", 1470, 160, 390, 520),
      sticky("Define mission success outcomes", 230, 240, "yellow"),
      sticky("Confirm release confidence vote", 245, 340, "green"),
      sticky("API contract needed by Sprint 2", 1095, 260, "pink"),
      sticky("Security review timing", 1515, 265, "blue"),
      shape("Planning Readout", 705, 755, 250, 80, "purple"),
      comment("Facilitator: Use voting after dependencies are mapped.", 1515, 510)
    ],
    connectors: [connector(705, 300, 1095, 300), connector(1260, 300, 1515, 300)]
  },
  {
    id: "retro",
    title: "Team Retrospective",
    description: "Run a focused retro with what worked, what slowed us down, actions, and owners.",
    objects: [
      lane("Worked Well", 190, 160, 370, 520),
      lane("Needs Attention", 610, 160, 370, 520),
      lane("Ideas", 1030, 160, 370, 520),
      lane("Actions", 1450, 160, 370, 520),
      sticky("Daily check-ins were concise", 240, 250, "green"),
      sticky("Decision latency hurt momentum", 660, 250, "pink"),
      sticky("Create blocker escalation path", 1080, 250, "yellow"),
      sticky("Owner + due date before close", 1500, 250, "blue"),
      comment("Use five votes to prioritize improvement actions.", 660, 470)
    ],
    connectors: [connector(1230, 292, 1500, 292)]
  },
  {
    id: "brainstorm",
    title: "Brainstorming",
    description: "Capture ideas quickly, cluster themes, vote, and move the strongest ideas into next steps.",
    objects: [
      shape("Challenge Statement", 210, 155, 430, 90, "purple"),
      sticky("Reduce meeting prep friction", 230, 320, "yellow"),
      sticky("One-click workshop setup", 430, 360, "green"),
      sticky("Reusable client-ready templates", 690, 300, "blue"),
      sticky("AI theme detection", 890, 420, "pink"),
      lane("Theme Cluster A", 210, 570, 430, 260),
      lane("Theme Cluster B", 710, 570, 430, 260),
      lane("Top Concepts", 1210, 240, 430, 590),
      sticky("Launch as internal pilot", 1260, 340, "green"),
      comment("AI Assist can simulate grouping and summary for the pitch.", 1260, 515)
    ],
    connectors: [connector(970, 462, 1260, 382)]
  },
  {
    id: "process",
    title: "Process Mapping",
    description: "Map current or future-state workflows using steps, decisions, handoffs, and risks.",
    objects: [
      shape("Intake", 190, 260, 170, 80, "gray"),
      shape("Review", 470, 260, 170, 80, "purple"),
      shape("Decision", 760, 245, 130, 130, "green", "diamond"),
      shape("Execute", 1040, 260, 170, 80, "purple"),
      shape("Closeout", 1320, 260, 170, 80, "gray"),
      sticky("Need owner at handoff", 475, 430, "yellow"),
      sticky("Escalate blocked approvals", 760, 455, "pink"),
      lane("Systems / Artifacts", 190, 595, 1300, 230),
      sticky("SharePoint folder", 245, 685, "blue"),
      sticky("Teams channel", 500, 685, "green"),
      sticky("Excel tracker", 750, 685, "yellow")
    ],
    connectors: [
      connector(360, 300, 470, 300),
      connector(640, 300, 760, 300),
      connector(890, 300, 1040, 300),
      connector(1210, 300, 1320, 300)
    ]
  }
];

function lane(text, x, y, w, h) {
  return { type: "lane", text, x, y, w, h, color: "white" };
}

function sticky(text, x, y, color = "yellow") {
  return { type: "sticky", text, x, y, w: 170, h: 120, color, votes: 0 };
}

function shape(text, x, y, w = 180, h = 90, color = "gray", variant = "rect") {
  return { type: "shape", text, x, y, w, h, color, variant, votes: 0 };
}

function comment(text, x, y) {
  return { type: "comment", text, x, y, w: 250, h: 112, color: "white" };
}

function connector(x1, y1, x2, y2, kind = "arrow") {
  return { x1, y1, x2, y2, kind, variant: kind === "arrow" ? "right" : "line" };
}

function uid() {
  return `fs-${state.nextId++}`;
}

function render() {
  const app = document.getElementById("app");
  if (!state.user) {
    app.innerHTML = accessView();
    bindAccess();
    return;
  }
  if (!state.currentTemplate) {
    app.innerHTML = galleryView();
    bindGallery();
    return;
  }
  app.innerHTML = workspaceView();
  bindWorkspace();
  renderBoard();
  renderPanel();
  if (appConfig.demoPresence) startCursorLoop();
}

function accessView() {
  return `
    <main class="view access-view">
      <section class="access-brand">
        <div class="brand-mark"><span class="mark">&gt;</span><span>ForgeSpace</span></div>
        <div>
          <h1>Visual planning space for serious federal delivery teams.</h1>
          <p>Run PI planning, retrospectives, brainstorming, and process mapping from one simple internal workshop surface.</p>
        </div>
        <div class="access-note">MVP demo environment - brand-adjacent concept interface</div>
      </section>
      <section class="access-panel">
        <div class="login-card">
          <p class="eyebrow">Access Preview</p>
          <h2>Enter ForgeSpace</h2>
          <p class="supporting">Use simulated AFS access for full facilitator controls, or continue as a guest to preview limited collaboration.</p>
          <label class="field"><span>Email</span><input id="email" value="matthew.sutton@afs.example" /></label>
          <label class="field"><span>Password</span><input id="password" type="password" value="demo-password" /></label>
          <button class="primary" id="loginBtn">Sign in as AFS User</button>
          <div class="divider">or</div>
          <button class="secondary" id="guestBtn">Continue as Guest</button>
        </div>
      </section>
    </main>`;
}

function bindAccess() {
  document.getElementById("loginBtn").addEventListener("click", () => {
    const email = document.getElementById("email").value || "AFS User";
    state.user = email.split("@")[0].replace(".", " ");
    state.role = "registered";
    state.persistenceAcknowledged = false;
    render();
  });
  document.getElementById("guestBtn").addEventListener("click", () => {
    state.user = "Guest Participant";
    state.role = "guest";
    state.persistenceAcknowledged = false;
    render();
  });
}

function galleryView() {
  return `
    <main class="view gallery-view">
      <header class="app-topbar">
        <div class="brand-mark"><span class="mark">&gt;</span><span>ForgeSpace</span></div>
        <div class="top-actions">
          <span class="role-pill">${state.role === "registered" ? "AFS User" : "Guest"}</span>
          <span class="user-pill">${escapeHtml(titleCase(state.user))}</span>
          <button class="secondary" id="signOut" style="width:auto;min-height:34px;padding:0 12px;">Sign out</button>
        </div>
      </header>
      <section class="gallery-main">
        <div class="gallery-header">
          <div>
            <p class="eyebrow">Choose a workshop</p>
            <h1>Start with the structure your team needs.</h1>
            <p class="supporting">Choose a template or open a blank canvas. ForgeSpace does not retain boards after a session; export JSON when you need to preserve the work.</p>
          </div>
          <div class="top-actions">
            <button class="secondary" id="blankBoard" style="width:auto;padding:12px 16px;">Blank Board</button>
          </div>
        </div>
        <div class="template-grid">${templates.map(templateCard).join("")}</div>
      </section>
      ${state.persistenceAcknowledged ? "" : persistenceModal()}
    </main>`;
}

function persistenceModal() {
  return `
    <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="persistenceTitle">
      <div class="modal">
        <p class="eyebrow">Board Retention Notice</p>
        <h2 id="persistenceTitle">ForgeSpace does not permanently save boards.</h2>
        <p class="supporting">Created boards are not retained by AFS after the session. To keep a board, export it as JSON, PNG, PDF, or HTML before leaving. JSON is the only format that can be imported later to continue work.</p>
        <div class="modal-actions">
          <button class="primary" id="ackPersistence">Yes, I understand</button>
        </div>
      </div>
    </div>`;
}

function templateCard(tpl) {
  return `
    <article class="template-card">
      <div>
        <div class="template-preview">${previewMarkup(tpl.id)}</div>
        <h3>${tpl.title}</h3>
        <p>${tpl.description}</p>
      </div>
      <button data-template="${tpl.id}">Use Template</button>
    </article>`;
}

function previewMarkup(id) {
  if (id === "process") {
    return `
      <span class="mini-flow" style="left:20px;top:48px;width:54px;height:30px;"></span>
      <span class="mini-flow" style="left:98px;top:48px;width:54px;height:30px;"></span>
      <span class="mini-flow" style="left:180px;top:42px;width:42px;height:42px;transform:rotate(45deg);"></span>
      <span class="mini-flow" style="left:260px;top:48px;width:54px;height:30px;"></span>`;
  }
  if (id === "brainstorm") {
    return `
      <span class="mini-note" style="left:36px;top:28px;"></span>
      <span class="mini-note" style="left:98px;top:48px;background:#dff5e8;"></span>
      <span class="mini-note" style="left:180px;top:28px;background:#dcecff;"></span>
      <span class="mini-note" style="left:250px;top:60px;background:#ffe1f2;"></span>`;
  }
  return `
    <span class="mini-lane" style="left:18px;"></span>
    <span class="mini-lane" style="left:92px;"></span>
    <span class="mini-lane" style="left:166px;"></span>
    <span class="mini-lane" style="left:240px;"></span>
    <span class="mini-note" style="left:32px;top:52px;"></span>
    <span class="mini-note" style="left:180px;top:42px;background:#dcecff;"></span>`;
}

function bindGallery() {
  document.getElementById("ackPersistence")?.addEventListener("click", () => {
    state.persistenceAcknowledged = true;
    render();
  });
  document.querySelectorAll("[data-template]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!state.persistenceAcknowledged) return;
      cloneTemplate(templates.find(tpl => tpl.id === btn.dataset.template));
      render();
    });
  });
  document.getElementById("blankBoard").addEventListener("click", createBlankBoard);
  document.getElementById("signOut").addEventListener("click", signOut);
}

function cloneTemplate(template) {
  state.currentTemplate = template.id;
  state.boardTitle = `${template.title} Workspace`;
  state.objects = template.objects.map(obj => ({ ...obj, id: uid(), ownerId: "template" }));
  state.connectors = template.connectors.map(conn => ({ kind: "arrow", ...conn, id: uid(), ownerId: "template" }));
  state.drawings = [];
  state.selectedId = null;
  state.selectedType = "object";
  state.pan = { x: -100, y: -70 };
  state.zoom = 0.78;
  saveLocalBoard(false);
}

function createBlankBoard() {
  if (!state.persistenceAcknowledged) return;
  state.currentTemplate = "blank";
  state.boardTitle = "Blank ForgeSpace Board";
  state.objects = [
    shape("Workshop Goal", 260, 180, 340, 92, "purple"),
    sticky("Click a tool, then click or drag on the canvas.", 280, 340, "yellow")
  ].map(obj => ({ ...obj, id: uid(), ownerId: state.sessionId }));
  state.connectors = [];
  state.drawings = [];
  state.selectedId = null;
  state.selectedType = "object";
  saveLocalBoard(false);
  render();
}

function workspaceView() {
  const registered = state.role === "registered";
  return `
    <main class="view workspace-view">
      <header class="ribbon">
        <div class="ribbon-row">
          <button class="brand-mark brand-button" id="homeTemplates" title="Return to template gallery"><span class="mark">&gt;</span><span>ForgeSpace</span></button>
          <div class="board-title"><input id="boardTitle" value="${escapeAttr(state.boardTitle)}" ${registered ? "" : "disabled"} /></div>
          <div class="tool-group">
            <button class="tool-btn ${state.mode === "select" ? "active" : ""}" data-mode="select" title="Select and move objects">Select</button>
            <button class="tool-btn" id="backGallery" title="Return to template gallery">Templates</button>
          </div>
          <div class="tool-group">
            <button class="tool-btn ${state.mode === "sticky" ? "active" : ""}" data-create="sticky" title="Click the canvas to place a sticky note">Sticky</button>
            <button class="tool-btn ${state.mode === "shape" ? "active" : ""}" data-create="shape" title="Click the canvas to place a shape">Shape</button>
            <select class="select-control compact-select" id="shapeSelect" title="Shape type">
              ${shapeOptions().map(opt => `<option value="${opt.value}" ${state.shapeVariant === opt.value ? "selected" : ""}>${opt.label}</option>`).join("")}
            </select>
            <button class="tool-btn ${state.mode === "text" ? "active" : ""}" data-create="text" title="Click the canvas to place text">Text</button>
            <button class="tool-btn ${state.mode === "comment" ? "active" : ""}" data-create="comment" title="Click the canvas to place a comment">Comment</button>
            <button class="tool-btn ${state.mode === "line" ? "active" : ""}" data-mode="line" title="Drag on the canvas to draw a line">Line</button>
            <select class="select-control compact-select" id="lineSelect" title="Line type">
              ${lineOptions().map(opt => `<option value="${opt.value}" ${state.lineVariant === opt.value ? "selected" : ""}>${opt.label}</option>`).join("")}
            </select>
            <button class="tool-btn ${state.mode === "arrow" ? "active" : ""}" data-mode="arrow" title="Drag on the canvas to draw an arrow">Arrow</button>
            <select class="select-control compact-select" id="arrowSelect" title="Arrow type">
              ${arrowOptions().map(opt => `<option value="${opt.value}" ${state.arrowVariant === opt.value ? "selected" : ""}>${opt.label}</option>`).join("")}
            </select>
            <button class="tool-btn ${state.mode === "pen" ? "active" : ""}" data-mode="pen" title="Drag on the canvas to draw freehand">Pen</button>
          </div>
          <div class="status-line">
            <span class="badge">${registered ? "AFS User" : "Guest"}</span>
            <span>${escapeHtml(titleCase(state.user))}</span>
          </div>
        </div>
        <div class="ribbon-row">
          <div class="tool-group">
            <button class="icon-btn" id="zoomOut" title="Zoom out">-</button>
            <span class="zoom-readout">${Math.round(state.zoom * 100)}%</span>
            <button class="icon-btn" id="zoomIn" title="Zoom in">+</button>
            <button class="tool-btn" id="fitBoard" title="Fit board">Fit</button>
          </div>
          <div class="tool-group">
            <button class="tool-btn ${state.voting ? "active" : ""}" id="voteBtn" title="Start or stop voting">Vote</button>
            <button class="tool-btn" id="timerBtn" title="Start or pause timer">Timer ${formatTimer(state.timer.remaining)}</button>
            <select class="select-control" id="timerSelect" title="Timer duration">
              <option value="300">5 min</option>
              <option value="600">10 min</option>
              <option value="900" selected>15 min</option>
              <option value="1800">30 min</option>
            </select>
          </div>
          <div class="tool-group">
            <button class="tool-btn" id="clusterBtn" title="Cluster ideas with demo AI">AI Cluster</button>
            <button class="tool-btn" id="summaryBtn" title="Summarize themes with demo AI">AI Summary</button>
            <button class="tool-btn" id="focusBtn" title="Bring participants to facilitator view">Focus</button>
          </div>
          <div class="tool-group">
            <button class="tool-btn" id="newBoard" ${registered ? "" : "disabled"} title="Create a blank board">New</button>
            <button class="tool-btn" id="loadJson" ${registered ? "" : "disabled"} title="Import board from JSON">Import</button>
            <button class="tool-btn" id="saveJson" title="Download board JSON">JSON</button>
            <button class="tool-btn" id="exportPng" title="Export PNG">PNG</button>
            <button class="tool-btn" id="exportPdf" title="Export PDF">PDF</button>
            <button class="tool-btn" id="exportHtml" title="Export HTML">HTML</button>
          </div>
          <div class="tool-group">
            <button class="tool-btn" id="duplicateObj" ${state.selectedId && state.selectedType === "object" ? "" : "disabled"} title="Duplicate selected object">Duplicate</button>
            <select class="select-control layer-select" id="layerSelect" ${state.selectedId ? "" : "disabled"} title="Layer selected item">
              <option value="">Layer</option>
              <option value="front">Bring to Front</option>
              <option value="forward">Forward</option>
              <option value="backward">Backward</option>
              <option value="back">Send to Back</option>
            </select>
            <button class="icon-btn danger" id="deleteObj" ${state.selectedId ? "" : "disabled"} title="Delete selected item">x</button>
          </div>
        </div>
      </header>
      <section class="canvas-shell">
        <div class="canvas-stage" id="canvasStage">
          <div class="canvas-world" id="canvasWorld">
            <svg class="connector-layer" id="connectorLayer"></svg>
            <div id="objectLayer"></div>
            <svg class="connector-layer connector-overlay" id="connectorOverlayLayer"></svg>
            <div id="cursorLayer"></div>
          </div>
        </div>
        <aside class="side-panel">
          <div class="panel-tabs">
            <button data-panel="session" class="${state.panel === "session" ? "active" : ""}">Session</button>
            <button data-panel="ai" class="${state.panel === "ai" ? "active" : ""}">AI Assist</button>
            <button data-panel="export" class="${state.panel === "export" ? "active" : ""}">Export</button>
          </div>
          <div class="panel-content" id="panelContent"></div>
        </aside>
      </section>
    </main>
    <div class="toast" id="toast"></div>
    <input id="fileInput" type="file" accept="application/json" hidden />`;
}

function bindWorkspace() {
  const stage = document.getElementById("canvasStage");
  updateWorldTransform();
  document.getElementById("boardTitle").addEventListener("input", event => {
    state.boardTitle = event.target.value;
    saveLocalBoard(false);
  });
  document.getElementById("backGallery").addEventListener("click", () => {
    state.currentTemplate = null;
    clearSelection();
    render();
  });
  document.getElementById("homeTemplates").addEventListener("click", () => {
    state.currentTemplate = null;
    clearSelection();
    render();
  });
  document.querySelectorAll("[data-mode]").forEach(btn => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });
  document.querySelectorAll("[data-create]").forEach(btn => {
    btn.addEventListener("click", () => {
      setMode(btn.dataset.create);
      toast(`Click the canvas to place a ${btn.dataset.create}.`);
    });
  });
  document.getElementById("shapeSelect").addEventListener("change", event => {
    state.shapeVariant = event.target.value;
    setMode("shape");
  });
  document.getElementById("lineSelect").addEventListener("change", event => {
    state.lineVariant = event.target.value;
    setMode("line");
  });
  document.getElementById("arrowSelect").addEventListener("change", event => {
    state.arrowVariant = event.target.value;
    setMode("arrow");
  });
  document.getElementById("zoomOut").addEventListener("click", () => setZoom(state.zoom - 0.1));
  document.getElementById("zoomIn").addEventListener("click", () => setZoom(state.zoom + 0.1));
  document.getElementById("fitBoard").addEventListener("click", () => {
    state.pan = { x: -100, y: -70 };
    state.zoom = 0.78;
    render();
  });
  document.getElementById("voteBtn").addEventListener("click", () => {
    state.voting = !state.voting;
    toast(state.voting ? "Voting is open. Click notes or shapes to vote." : "Voting closed.");
    render();
  });
  document.getElementById("timerBtn").addEventListener("click", toggleTimer);
  document.getElementById("timerSelect").addEventListener("change", event => {
    state.timer.remaining = Number(event.target.value);
    state.timer.running = false;
    clearInterval(state.timer.id);
    render();
  });
  document.getElementById("clusterBtn").addEventListener("click", () => {
    state.panel = "ai";
    toast("Demo AI clustered the board into three themes.");
    render();
  });
  document.getElementById("summaryBtn").addEventListener("click", () => {
    state.panel = "ai";
    toast("Demo AI generated a facilitation summary.");
    render();
  });
  document.getElementById("focusBtn").addEventListener("click", () => toast("Participants have been brought to the facilitator view."));
  document.getElementById("newBoard").addEventListener("click", createBlankBoard);
  document.getElementById("duplicateObj").addEventListener("click", duplicateSelected);
  document.getElementById("layerSelect").addEventListener("change", event => {
    if (!event.target.value) return;
    moveSelectedLayer(event.target.value);
    event.target.value = "";
  });
  document.getElementById("deleteObj").addEventListener("click", deleteSelected);
  document.getElementById("saveJson").addEventListener("click", exportJson);
  document.getElementById("loadJson").addEventListener("click", () => document.getElementById("fileInput").click());
  document.getElementById("fileInput").addEventListener("change", importJson);
  document.getElementById("exportPng").addEventListener("click", exportPng);
  document.getElementById("exportPdf").addEventListener("click", exportPdf);
  document.getElementById("exportHtml").addEventListener("click", exportHtml);
  document.querySelectorAll("[data-panel]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.panel = btn.dataset.panel;
      renderPanel();
      document.querySelectorAll("[data-panel]").forEach(b => b.classList.toggle("active", b.dataset.panel === state.panel));
    });
  });
  bindCanvas(stage);
  bindKeyboard();
  stage.addEventListener("wheel", event => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.06 : 0.06;
    setZoom(state.zoom + delta, false);
  }, { passive: false });
}

function setMode(mode) {
  state.mode = mode;
  state.draftLine = null;
  state.draftDrawing = null;
  render();
}

function shapeOptions() {
  return [
    { value: "rectangle", label: "Rectangle" },
    { value: "square", label: "Square" },
    { value: "oval", label: "Oval" },
    { value: "diamond", label: "Decision" },
    { value: "circle", label: "Circle" }
  ];
}

function lineOptions() {
  return [
    { value: "line", label: "Line" },
    { value: "elbow", label: "Elbow" },
    { value: "curve", label: "Curve" }
  ];
}

function arrowOptions() {
  return [
    { value: "right", label: "Right" },
    { value: "left", label: "Left" },
    { value: "double", label: "Double" },
    { value: "elbow-right", label: "Elbow Right" },
    { value: "elbow-left", label: "Elbow Left" },
    { value: "elbow-double", label: "Elbow Double" },
    { value: "curve-left", label: "Curve Left" },
    { value: "curve-right", label: "Curve Right" },
    { value: "curve-double", label: "Curve Double" }
  ];
}

function bindCanvas(stage) {
  stage.addEventListener("pointerdown", event => {
    if (event.target.closest(".board-object") || event.target.closest(".connector-hit") || event.target.closest(".drawing-hit") || event.target.closest(".connector-end")) return;
    const point = eventPoint(event, stage);
    if (["sticky", "shape", "text", "comment"].includes(state.mode)) {
      const obj = createObjectForMode(state.mode, point.x, point.y);
      addObject(obj, false, false);
      openEditor(obj.id, event.clientX, event.clientY);
      return;
    }
    if (state.mode === "line" || state.mode === "arrow") {
      startConnectorDraw(stage, event, point, state.mode, null);
      return;
    }
    if (state.mode === "pen") {
      startFreehandDraw(stage, event, point);
      return;
    }
    startPanning(stage, event);
  });
}

function createObjectForMode(mode, x, y) {
  const shapeSpec = shapeSpecFor(state.shapeVariant);
  const makers = {
    sticky: () => sticky("New idea", x - 85, y - 60, "yellow"),
    shape: () => shape(shapeSpec.text, x - shapeSpec.w / 2, y - shapeSpec.h / 2, shapeSpec.w, shapeSpec.h, "purple", shapeSpec.variant),
    text: () => ({ type: "text", text: "Section title", x: x - 130, y: y - 28, w: 260, h: 64, color: "black" }),
    comment: () => comment("Comment", x - 125, y - 50)
  };
  return makers[mode]();
}

function shapeSpecFor(variant) {
  const specs = {
    rectangle: { text: "New step", w: 190, h: 92, variant: "rectangle" },
    square: { text: "New step", w: 120, h: 120, variant: "square" },
    oval: { text: "New step", w: 190, h: 96, variant: "oval" },
    diamond: { text: "Decision", w: 140, h: 140, variant: "diamond" },
    circle: { text: "New step", w: 128, h: 128, variant: "circle" }
  };
  return specs[variant] || specs.rectangle;
}

function eventPoint(event, stage) {
  const rect = stage.getBoundingClientRect();
  return screenToWorld(event.clientX - rect.left, event.clientY - rect.top);
}

function startConnectorDraw(stage, event, point, kind, startObjectId) {
  clearSelection();
  const variant = kind === "arrow" ? state.arrowVariant : state.lineVariant;
  const conn = {
    id: uid(),
    kind,
    variant,
    x1: point.x,
    y1: point.y,
    x2: point.x,
    y2: point.y,
    fromId: startObjectId || null,
    fromPort: null,
    toId: null,
    ownerId: state.sessionId
  };
  if (startObjectId) {
    const startObject = state.objects.find(obj => obj.id === startObjectId);
    conn.fromPort = startObject ? nearestPort(startObject, point) : null;
  }
  state.connectors.push(conn);
  selectItem("connector", conn.id, false);
  try { stage.setPointerCapture(event.pointerId); } catch {}
  let lastClient = { x: event.clientX, y: event.clientY };
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", up, { once: true });
  function move(moveEvent) {
    lastClient = { x: moveEvent.clientX, y: moveEvent.clientY };
    const next = eventPoint(moveEvent, stage);
    conn.x2 = next.x;
    conn.y2 = next.y;
    renderBoard();
  }
  function up() {
    document.removeEventListener("pointermove", move);
    const endObject = objectFromElement(document.elementFromPoint(lastClient.x, lastClient.y));
    if (endObject && endObject.id !== conn.fromId) {
      conn.toId = endObject.id;
      conn.toPort = nearestPort(endObject, { x: conn.x2, y: conn.y2 });
    }
    if (distance(conn.x1, conn.y1, conn.x2, conn.y2) < 8) {
      state.connectors = state.connectors.filter(item => item.id !== conn.id);
      clearSelection();
    }
    state.mode = "select";
    saveLocalBoard(false);
    render();
  }
}

function startFreehandDraw(stage, event, point) {
  clearSelection();
  const drawing = { id: uid(), points: [point], color: "#111111", width: 3, ownerId: state.sessionId };
  state.drawings.push(drawing);
  selectItem("drawing", drawing.id, false);
  try { stage.setPointerCapture(event.pointerId); } catch {}
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", up, { once: true });
  function move(moveEvent) {
    drawing.points.push(eventPoint(moveEvent, stage));
    renderBoard();
  }
  function up() {
    document.removeEventListener("pointermove", move);
    if (drawing.points.length < 2) {
      state.drawings = state.drawings.filter(item => item.id !== drawing.id);
      clearSelection();
    }
    state.mode = "select";
    saveLocalBoard(false);
    render();
  }
}

function startPanning(stage, event) {
  clearSelection();
  renderBoard();
  const start = { x: event.clientX, y: event.clientY, px: state.pan.x, py: state.pan.y };
  stage.classList.add("panning");
  stage.setPointerCapture(event.pointerId);
  stage.addEventListener("pointermove", move);
  stage.addEventListener("pointerup", up, { once: true });
  function move(moveEvent) {
    state.pan.x = start.px + moveEvent.clientX - start.x;
    state.pan.y = start.py + moveEvent.clientY - start.y;
    updateWorldTransform();
  }
  function up() {
    stage.classList.remove("panning");
    stage.removeEventListener("pointermove", move);
  }
}

function addObject(obj, atCenter = true, keepMode = false) {
  if (atCenter) {
    const stage = document.getElementById("canvasStage");
    const rect = stage.getBoundingClientRect();
    const center = screenToWorld(rect.width / 2, rect.height / 2);
    obj.x = center.x - (obj.w || 160) / 2;
    obj.y = center.y - (obj.h || 100) / 2;
  }
  obj.id = uid();
  obj.ownerId = state.sessionId;
  state.objects.push(obj);
  selectItem("object", obj.id, false);
  if (!keepMode) state.mode = "select";
  saveLocalBoard(false);
  render();
  return obj;
}

function renderBoard() {
  renderConnectors();
  renderObjects();
}

function renderConnectors() {
  const underlay = document.getElementById("connectorLayer");
  const overlay = document.getElementById("connectorOverlayLayer");
  if (!underlay || !overlay) return;
  renderConnectorPlane(underlay, "under");
  renderConnectorPlane(overlay, "over");
}

function renderConnectorPlane(layer, plane) {
  const items = [
    ...state.drawings.map((item, index) => ({ type: "drawing", item, index })),
    ...state.connectors.map((item, index) => ({ type: "connector", item, index }))
  ]
    .filter(record => (record.item.plane || "under") === plane)
    .sort((a, b) => svgZ(a) - svgZ(b));
  const markup = items.map(record => record.type === "drawing" ? drawingMarkup(record.item) : connectorMarkup(record.item)).join("");
  layer.innerHTML = `
    <defs>
      <marker id="arrowEnd" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M0,0 L0,6 L9,3 z" fill="#6f6f78"></path>
      </marker>
      <marker id="arrowStart" markerWidth="10" markerHeight="10" refX="1" refY="3" orient="auto" markerUnits="strokeWidth">
        <path d="M9,0 L9,6 L0,3 z" fill="#6f6f78"></path>
      </marker>
    </defs>
    ${markup}`;
  bindConnectorLayer(layer);
}

function drawingMarkup(drawing) {
  const points = drawing.points.map(point => `${point.x},${point.y}`).join(" ");
  const selected = isItemSelected("drawing", drawing.id);
  return `
    <polyline class="drawing-line ${selected ? "selected-line" : ""}" points="${points}" fill="none" stroke="${drawing.color}" stroke-width="${drawing.width}" stroke-linecap="round" stroke-linejoin="round" />
    <polyline class="drawing-hit" data-id="${drawing.id}" points="${points}" fill="none" stroke="transparent" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" />`;
}

function connectorMarkup(conn) {
  const selected = isItemSelected("connector", conn.id);
  const path = connectorPath(conn);
  const markers = markerAttrs(conn);
  const handles = selected ? connectorEndpointHandles(conn) : "";
  return `
    <path class="connector-line ${selected ? "selected-line" : ""}" d="${path}" fill="none" stroke="#6f6f78" stroke-width="3"${markers} />
    <path class="connector-hit" data-id="${conn.id}" d="${path}" fill="none" stroke="transparent" stroke-width="18" />
    ${handles}`;
}

function bindConnectorLayer(layer) {
  layer.querySelectorAll(".connector-hit").forEach(el => {
    el.addEventListener("pointerdown", event => {
      event.stopPropagation();
      if ((event.ctrlKey || event.metaKey) && state.mode === "select") {
        toggleItemSelection("connector", el.dataset.id);
        return;
      }
      if (!isItemSelected("connector", el.dataset.id)) selectItem("connector", el.dataset.id, false);
      if (state.mode === "select") {
        if (!canModifyItem(state.connectors.find(item => item.id === el.dataset.id))) {
          toast("Guests can only edit items they created.");
          render();
          return;
        }
        startConnectorMove(el.dataset.id, event);
      }
      else render();
    });
  });
  layer.querySelectorAll(".connector-end").forEach(el => {
    el.addEventListener("pointerdown", event => {
      event.stopPropagation();
      if (!canModifyItem(state.connectors.find(item => item.id === el.dataset.id))) {
        toast("Guests can only edit items they created.");
        render();
        return;
      }
      startConnectorEndpointMove(el.dataset.id, el.dataset.end, event);
    });
  });
  layer.querySelectorAll(".drawing-hit").forEach(el => {
    el.addEventListener("pointerdown", event => {
      event.stopPropagation();
      if ((event.ctrlKey || event.metaKey) && state.mode === "select") {
        toggleItemSelection("drawing", el.dataset.id);
        return;
      }
      if (!isItemSelected("drawing", el.dataset.id)) selectItem("drawing", el.dataset.id, false);
      if (state.mode === "select") {
        if (!canModifyItem(state.drawings.find(item => item.id === el.dataset.id))) {
          toast("Guests can only edit items they created.");
          render();
          return;
        }
        startDrawingMove(el.dataset.id, event);
      }
      else render();
    });
  });
}

function svgZ(record) {
  return Number.isFinite(record.item.z) ? record.item.z : record.type === "drawing" ? record.index : state.drawings.length + record.index;
}

function connectorEndpointHandles(conn) {
  const ep = connectorEndpoints(conn);
  return `
    <circle class="connector-end" data-id="${conn.id}" data-end="start" cx="${ep.x1}" cy="${ep.y1}" r="8" />
    <circle class="connector-end" data-id="${conn.id}" data-end="end" cx="${ep.x2}" cy="${ep.y2}" r="8" />`;
}

function renderObjects() {
  const layer = document.getElementById("objectLayer");
  if (!layer) return;
  layer.innerHTML = state.objects.map(objectMarkup).join("");
  layer.querySelectorAll(".board-object").forEach(el => bindObject(el));
}

function connectorPath(conn) {
  const { x1, y1, x2, y2 } = connectorEndpoints(conn);
  const variant = conn.variant || conn.kind;
  if (variant.includes("elbow")) {
    const midX = x1 + (x2 - x1) / 2;
    return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
  }
  if (variant.includes("curve")) {
    const midX = x1 + (x2 - x1) / 2;
    return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  }
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

function connectorEndpoints(conn) {
  const from = state.objects.find(obj => obj.id === conn.fromId);
  const to = state.objects.find(obj => obj.id === conn.toId);
  const start = from && conn.fromPort ? objectPortPoint(from, conn.fromPort) : null;
  const end = to && conn.toPort ? objectPortPoint(to, conn.toPort) : null;
  return {
    x1: start ? start.x : from ? from.x + from.w / 2 : conn.x1,
    y1: start ? start.y : from ? from.y + from.h / 2 : conn.y1,
    x2: end ? end.x : to ? to.x + to.w / 2 : conn.x2,
    y2: end ? end.y : to ? to.y + to.h / 2 : conn.y2
  };
}

function objectPortPoint(obj, port) {
  const points = {
    top: { x: obj.x + obj.w / 2, y: obj.y },
    right: { x: obj.x + obj.w, y: obj.y + obj.h / 2 },
    bottom: { x: obj.x + obj.w / 2, y: obj.y + obj.h },
    left: { x: obj.x, y: obj.y + obj.h / 2 }
  };
  return points[port] || points.right;
}

function nearestPort(obj, point) {
  return ["top", "right", "bottom", "left"]
    .map(port => ({ port, point: objectPortPoint(obj, port) }))
    .sort((a, b) => distance(a.point.x, a.point.y, point.x, point.y) - distance(b.point.x, b.point.y, point.x, point.y))[0].port;
}

function markerAttrs(conn) {
  if (conn.kind !== "arrow") return "";
  const variant = conn.variant || "right";
  if (variant.includes("double")) return ' marker-start="url(#arrowStart)" marker-end="url(#arrowEnd)"';
  if (variant.includes("left")) return ' marker-start="url(#arrowStart)"';
  return ' marker-end="url(#arrowEnd)"';
}

function objectMarkup(obj) {
  const classes = [
    "board-object",
    obj.type === "text" ? "text-object" : obj.type,
    obj.color || "",
    obj.variant || "",
    obj.locked ? "locked" : "",
    isObjectSelected(obj.id) ? "selected" : ""
  ].join(" ");
  const voteBadge = obj.votes ? `<span class="badge" style="position:absolute;right:6px;bottom:6px;background:#111;color:#fff;">${obj.votes} votes</span>` : "";
  const resize = isObjectSelected(obj.id) && state.selectedIds.length <= 1 ? `<span class="resize-handle" title="Resize"></span>` : "";
  const ports = ["top", "right", "bottom", "left"].map(port => `<span class="connector-port ${port}" data-port="${port}" title="Connector point"></span>`).join("");
  const locked = obj.locked ? `<span class="lock-badge">Locked</span>` : "";
  return `
    <div class="${classes}" data-id="${obj.id}" style="left:${obj.x}px;top:${obj.y}px;width:${obj.w}px;height:${obj.h}px;">
      <div class="object-text">${escapeHtml(obj.text)}</div>
      ${voteBadge}
      ${locked}
      ${ports}
      ${resize}
    </div>`;
}

function bindObject(el) {
  const id = el.dataset.id;
  el.addEventListener("pointerdown", event => {
    event.stopPropagation();
    const obj = state.objects.find(item => item.id === id);
    if (!obj) return;
    const stage = document.getElementById("canvasStage");
    const point = eventPoint(event, stage);
    if ((event.ctrlKey || event.metaKey) && state.mode === "select") {
      toggleObjectSelection(id);
      return;
    }
    if (event.target.classList.contains("connector-port")) {
      const portPoint = objectPortPoint(obj, event.target.dataset.port);
      startConnectorDraw(stage, event, portPoint, state.mode === "line" ? "line" : "arrow", obj.id);
      const conn = selectedItem();
      if (conn && state.selectedType === "connector") conn.fromPort = event.target.dataset.port;
      return;
    }
    if (["sticky", "shape", "text", "comment"].includes(state.mode)) {
      const created = createObjectForMode(state.mode, point.x, point.y);
      addObject(created, false, false);
      openEditor(created.id, event.clientX, event.clientY);
      return;
    }
    if (state.mode === "line" || state.mode === "arrow") {
      const center = objectCenter(obj);
      startConnectorDraw(stage, event, center, state.mode, obj.id);
      return;
    }
    if (state.mode === "pen") {
      startFreehandDraw(stage, event, point);
      return;
    }
    if (!isObjectSelected(id)) selectObject(id, false);
    if (state.voting && ["sticky", "shape"].includes(obj.type)) {
      if (!canModifyItem(obj)) {
        toast("Guests can only vote on items they created in this MVP.");
        render();
        return;
      }
      obj.votes = (obj.votes || 0) + 1;
      saveLocalBoard(false);
      toast("Vote added.");
      render();
      return;
    }
    if (!canModifyItem(obj)) {
      toast("Guests can only edit items they created.");
      document.querySelectorAll(".board-object.selected").forEach(node => node.classList.remove("selected"));
      el.classList.add("selected");
      renderPanel();
      clearTimeout(window.objectSelectTimer);
      window.objectSelectTimer = setTimeout(() => render(), 240);
      return;
    }
    if (event.target.classList.contains("resize-handle")) {
      if (obj.locked) {
        toast("Object is locked.");
        render();
        return;
      }
      startResize(el, obj, event);
      return;
    }
    if (obj.locked) {
      toast("Object is locked.");
      document.querySelectorAll(".board-object.selected").forEach(node => node.classList.remove("selected"));
      el.classList.add("selected");
      renderPanel();
      clearTimeout(window.objectSelectTimer);
      window.objectSelectTimer = setTimeout(() => render(), 240);
      return;
    }
    startObjectDrag(el, obj, event);
  });
  el.addEventListener("dblclick", event => {
    event.stopPropagation();
    clearTimeout(window.objectSelectTimer);
    if (!canModifyItem(state.objects.find(item => item.id === id))) {
      toast("Guests can only edit items they created.");
      return;
    }
    openEditor(id, event.clientX, event.clientY);
  });
}

function startObjectDrag(el, obj, event) {
  el.setPointerCapture(event.pointerId);
  document.querySelectorAll(".board-object.selected").forEach(node => node.classList.remove("selected"));
  selectedObjectIds().forEach(id => document.querySelector(`.board-object[data-id="${cssEscape(id)}"]`)?.classList.add("selected"));
  renderPanel();
  const group = dragItemsFor("object", obj.id, obj);
  const start = {
    x: event.clientX,
    y: event.clientY,
    positions: group.map(record => movementSnapshot(record))
  };
  let moved = false;
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up, { once: true });
  function move(moveEvent) {
    const dx = (moveEvent.clientX - start.x) / state.zoom;
    const dy = (moveEvent.clientY - start.y) / state.zoom;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true;
    start.positions.forEach(pos => applyMovementSnapshot(pos, dx, dy));
    renderConnectors();
  }
  function up() {
    el.removeEventListener("pointermove", move);
    if (moved) {
      saveLocalBoard(false);
      render();
    } else {
      clearTimeout(window.objectSelectTimer);
      window.objectSelectTimer = setTimeout(() => render(), 240);
    }
  }
}

function startResize(el, obj, event) {
  el.setPointerCapture(event.pointerId);
  const start = { x: event.clientX, y: event.clientY, w: obj.w, h: obj.h };
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up, { once: true });
  function move(moveEvent) {
    obj.w = Math.max(80, start.w + (moveEvent.clientX - start.x) / state.zoom);
    obj.h = Math.max(52, start.h + (moveEvent.clientY - start.y) / state.zoom);
    el.style.width = `${obj.w}px`;
    el.style.height = `${obj.h}px`;
  }
  function up() {
    el.removeEventListener("pointermove", move);
    saveLocalBoard(false);
    render();
  }
}

function startConnectorMove(id, event) {
  const conn = state.connectors.find(item => item.id === id);
  if (!conn) return;
  if (conn.locked) {
    toast("Connector is locked.");
    render();
    return;
  }
  const group = dragItemsFor("connector", id, conn);
  const start = { x: event.clientX, y: event.clientY, positions: group.map(record => movementSnapshot(record)) };
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", up, { once: true });
  function move(moveEvent) {
    const dx = (moveEvent.clientX - start.x) / state.zoom;
    const dy = (moveEvent.clientY - start.y) / state.zoom;
    start.positions.forEach(pos => applyMovementSnapshot(pos, dx, dy));
    renderBoard();
  }
  function up() {
    document.removeEventListener("pointermove", move);
    saveLocalBoard(false);
    render();
  }
}

function startDrawingMove(id, event) {
  const drawing = state.drawings.find(item => item.id === id);
  if (!drawing) return;
  if (drawing.locked) {
    toast("Drawing is locked.");
    render();
    return;
  }
  const group = dragItemsFor("drawing", id, drawing);
  const start = { x: event.clientX, y: event.clientY, positions: group.map(record => movementSnapshot(record)) };
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", up, { once: true });
  function move(moveEvent) {
    const dx = (moveEvent.clientX - start.x) / state.zoom;
    const dy = (moveEvent.clientY - start.y) / state.zoom;
    start.positions.forEach(pos => applyMovementSnapshot(pos, dx, dy));
    renderBoard();
  }
  function up() {
    document.removeEventListener("pointermove", move);
    saveLocalBoard(false);
    render();
  }
}

function startConnectorEndpointMove(id, end, event) {
  const conn = state.connectors.find(item => item.id === id);
  if (!conn) return;
  if (conn.locked) {
    toast("Connector is locked.");
    render();
    return;
  }
  const stage = document.getElementById("canvasStage");
  selectItem("connector", id, false);
  if (end === "start") {
    conn.fromId = null;
    conn.fromPort = null;
  } else {
    conn.toId = null;
    conn.toPort = null;
  }
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", up, { once: true });
  function move(moveEvent) {
    const next = eventPoint(moveEvent, stage);
    if (end === "start") {
      conn.x1 = next.x;
      conn.y1 = next.y;
    } else {
      conn.x2 = next.x;
      conn.y2 = next.y;
    }
    renderBoard();
  }
  function up(upEvent) {
    document.removeEventListener("pointermove", move);
    const targetObject = objectFromElement(document.elementFromPoint(upEvent.clientX, upEvent.clientY));
    if (targetObject) {
      const currentPoint = end === "start" ? { x: conn.x1, y: conn.y1 } : { x: conn.x2, y: conn.y2 };
      const port = nearestPort(targetObject, currentPoint);
      const portPoint = objectPortPoint(targetObject, port);
      if (end === "start") {
        conn.fromId = targetObject.id;
        conn.fromPort = port;
        conn.x1 = portPoint.x;
        conn.y1 = portPoint.y;
      } else {
        conn.toId = targetObject.id;
        conn.toPort = port;
        conn.x2 = portPoint.x;
        conn.y2 = portPoint.y;
      }
    }
    saveLocalBoard(false);
    render();
  }
}

function openEditor(id, clientX, clientY) {
  const obj = state.objects.find(item => item.id === id);
  if (!obj) return;
  if (!canModifyItem(obj)) {
    toast("Guests can only edit items they created.");
    return;
  }
  document.querySelector(".context-editor")?.remove();
  const editor = document.createElement("div");
  editor.className = "context-editor";
  editor.style.left = `${Math.min(clientX, window.innerWidth - 310)}px`;
  editor.style.top = `${Math.min(clientY, window.innerHeight - 260)}px`;
  editor.innerHTML = `
    <textarea>${escapeHtml(obj.text)}</textarea>
    <div class="swatches">
      ${["yellow", "blue", "green", "pink", "purple", "gray", "white"].map(color => `<button class="swatch" data-color="${color}" style="background:${colorValue(color)}" title="${color}"></button>`).join("")}
    </div>
    <div class="modal-actions">
      <button class="secondary" id="cancelEdit">Cancel</button>
      <button class="primary" id="saveEdit">Save</button>
    </div>`;
  document.body.appendChild(editor);
  editor.querySelector("textarea").focus();
  editor.querySelectorAll("[data-color]").forEach(btn => {
    btn.addEventListener("click", () => {
      obj.color = btn.dataset.color;
      saveLocalBoard(false);
      renderBoard();
    });
  });
  editor.querySelector("#cancelEdit").addEventListener("click", () => editor.remove());
  editor.querySelector("#saveEdit").addEventListener("click", () => {
    obj.text = editor.querySelector("textarea").value;
    editor.remove();
    saveLocalBoard(false);
    render();
  });
}

function renderPanel() {
  const panel = document.getElementById("panelContent");
  if (!panel) return;
  if (state.panel === "ai") {
    panel.innerHTML = `
      <div class="panel-card">
        <h3>Demo AI Theme Clusters</h3>
        ${state.aiResults.map(item => `<p>${escapeHtml(item)}</p>`).join("")}
      </div>
      <div class="panel-card">
        <h3>Generated Action Items</h3>
        ${state.actionItems.map(item => `<div class="action-row"><span>${escapeHtml(item)}</span></div>`).join("")}
      </div>
      <div class="panel-card">
        <h3>Facilitation Summary</h3>
        <p>The board shows alignment around workshop structure, dependency visibility, and action ownership.</p>
      </div>`;
    return;
  }
  if (state.panel === "export") {
    panel.innerHTML = `
      <div class="panel-card">
        <h3>Export Options</h3>
        <p>AFS users can import a board from JSON. AFS users and guests can export the current board as JSON, PNG, PDF, or HTML.</p>
        <div class="stat-row"><span>Import</span><span class="badge">JSON board</span></div>
        <div class="stat-row"><span>JSON</span><span class="badge">Board data</span></div>
        <div class="stat-row"><span>PNG</span><span class="badge">Image snapshot</span></div>
        <div class="stat-row"><span>PDF</span><span class="badge">One-page artifact</span></div>
        <div class="stat-row"><span>HTML</span><span class="badge">Portable demo</span></div>
      </div>`;
    return;
  }
  const selected = selectedItem();
  panel.innerHTML = `
    <div class="panel-card">
      <h3>Session Status</h3>
      <div class="stat-row"><span>Template</span><strong>${escapeHtml(templateName())}</strong></div>
      <div class="stat-row"><span>Objects</span><strong>${state.objects.length}</strong></div>
      <div class="stat-row"><span>Lines</span><strong>${state.connectors.length + state.drawings.length}</strong></div>
      <div class="stat-row"><span>Timer</span><strong>${formatTimer(state.timer.remaining)}</strong></div>
      <div class="stat-row"><span>Voting</span><strong>${state.voting ? "Open" : "Closed"}</strong></div>
    </div>
    <div class="panel-card">
      <h3>Usable Tools</h3>
      <p class="small">Sticky, Shape, Text, and Comment place items where you click and stay active. Line, Arrow, and Pen draw when you drag and stay active. Double-click an object to edit it. Drag a selected corner to resize.</p>
    </div>
    <div class="panel-card">
      <h3>Selected Item</h3>
      ${selected ? selectedPanel(selected) : `<p class="small">Select an object, line, arrow, or drawing to inspect it.</p>`}
    </div>
    <div class="panel-card">
      <h3>Participants</h3>
      ${[
        ["MS", titleCase(state.user), state.role === "registered" ? "Facilitator" : "Guest"],
        ["PR", "Priya Rao", "Contributor"],
        ["MJ", "Marcus Jones", "Reviewer"],
        ["EL", "Elena Lee", "Contributor"]
      ].map(([initials, name, role]) => `
        <div class="participant-row">
          <span class="participant-name"><span class="avatar">${initials}</span>${escapeHtml(name)}</span>
          <span class="badge">${role}</span>
        </div>`).join("")}
    </div>`;
}

function selectedPanel(item) {
  if (selectedItems().length > 1) {
    return `<p>${selectedItems().length} items selected</p><p class="small">Ctrl+G groups them. Ctrl+L locks or unlocks them. Forward and Backward adjust stacking inside each item type. Drag any selected item to move the selected set.</p>`;
  }
  if (state.selectedType === "object") {
    return `<p>${escapeHtml(item.text)}</p><p class="small">${Math.round(item.w)} x ${Math.round(item.h)} px. ${item.locked ? "Locked. Ctrl+L unlocks." : "Ctrl+L locks."} Double-click to edit. Ctrl+D duplicates. Ctrl+C/V copies and pastes. Ctrl+G groups overlapping objects. Delete removes.</p>`;
  }
  if (state.selectedType === "connector") {
    return `<p>${item.kind === "arrow" ? "Arrow" : "Line"}</p><p class="small">${item.locked ? "Locked. Ctrl+L unlocks." : "Ctrl+L locks."} Drag an endpoint handle to adjust or reconnect it.</p>`;
  }
  return `<p>Freehand drawing</p><p class="small">${item.locked ? "Locked. Ctrl+L unlocks." : "Ctrl+L locks."} Delete removes the selected drawing.</p>`;
}

function selectedItem() {
  if (!state.selectedId) return null;
  if (state.selectedType === "object") return state.objects.find(item => item.id === state.selectedId);
  if (state.selectedType === "connector") return state.connectors.find(item => item.id === state.selectedId);
  return state.drawings.find(item => item.id === state.selectedId);
}

function selectedObjectIds() {
  return selectedItems()
    .filter(selection => selection.type === "object")
    .map(selection => selection.id);
}

function isObjectSelected(id) {
  return isItemSelected("object", id);
}

function selectObject(id, additive) {
  selectItem("object", id, additive);
}

function toggleObjectSelection(id) {
  toggleItemSelection("object", id);
}

function itemKey(type, id) {
  return `${type}:${id}`;
}

function parseItemKey(key) {
  const [type, ...rest] = key.split(":");
  return { type, id: rest.join(":") };
}

function selectedItems() {
  if (state.selectedItems.length) return state.selectedItems.map(parseItemKey);
  if (!state.selectedId) return [];
  return [{ type: state.selectedType, id: state.selectedId }];
}

function isItemSelected(type, id) {
  return selectedItems().some(item => item.type === type && item.id === id);
}

function selectItem(type, id, additive) {
  if (additive) {
    const next = new Set(state.selectedItems.length ? state.selectedItems : state.selectedId ? [itemKey(state.selectedType, state.selectedId)] : []);
    next.add(itemKey(type, id));
    state.selectedItems = [...next];
  } else {
    state.selectedItems = [itemKey(type, id)];
  }
  state.selectedType = type;
  state.selectedId = id;
  state.selectedIds = selectedObjectIds();
}

function toggleItemSelection(type, id) {
  const next = new Set(state.selectedItems.length ? state.selectedItems : state.selectedId ? [itemKey(state.selectedType, state.selectedId)] : []);
  const key = itemKey(type, id);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  state.selectedItems = [...next];
  const last = state.selectedItems.length ? parseItemKey(state.selectedItems[state.selectedItems.length - 1]) : null;
  state.selectedType = last?.type || "object";
  state.selectedId = last?.id || null;
  state.selectedIds = selectedObjectIds();
  render();
}

function selectedItemRecords() {
  return selectedItems()
    .map(selection => ({ ...selection, item: findItem(selection.type, selection.id) }))
    .filter(record => record.item);
}

function findItem(type, id) {
  if (type === "object") return state.objects.find(item => item.id === id);
  if (type === "connector") return state.connectors.find(item => item.id === id);
  if (type === "drawing") return state.drawings.find(item => item.id === id);
  return null;
}

function canModifyItem(item) {
  if (!item) return false;
  if (state.role === "registered") return true;
  return item.ownerId === state.sessionId;
}

function dragObjectGroup(obj) {
  const selected = selectedItemRecords();
  if (selected.length > 1 && isItemSelected("object", obj.id)) {
    return selected.map(record => record.item).filter(item => item && !item.locked);
  }
  if (obj.groupId) return state.objects.filter(item => item.groupId === obj.groupId && !item.locked);
  return [obj];
}

function dragItemsFor(type, id, item) {
  const selected = selectedItemRecords();
  if (selected.length > 1 && isItemSelected(type, id)) {
    return selected.filter(record => !record.item.locked);
  }
  if (item.groupId) {
    return allBoardItemRecords().filter(record => record.item.groupId === item.groupId && !record.item.locked);
  }
  return [{ type, id, item }];
}

function allBoardItemRecords() {
  return [
    ...state.objects.map(item => ({ type: "object", id: item.id, item })),
    ...state.connectors.map(item => ({ type: "connector", id: item.id, item })),
    ...state.drawings.map(item => ({ type: "drawing", id: item.id, item }))
  ];
}

function movementSnapshot(record) {
  if (record.type === "object") return { type: record.type, id: record.id, x: record.item.x, y: record.item.y };
  if (record.type === "connector") {
    const ep = connectorEndpoints(record.item);
    record.item.x1 = ep.x1;
    record.item.y1 = ep.y1;
    record.item.x2 = ep.x2;
    record.item.y2 = ep.y2;
    record.item.fromId = null;
    record.item.toId = null;
    return { type: record.type, id: record.id, x1: record.item.x1, y1: record.item.y1, x2: record.item.x2, y2: record.item.y2 };
  }
  return { type: record.type, id: record.id, points: record.item.points.map(point => ({ ...point })) };
}

function applyMovementSnapshot(pos, dx, dy) {
  if (pos.type === "object") {
    const item = findItem(pos.type, pos.id);
    if (!item) return;
    item.x = pos.x + dx;
    item.y = pos.y + dy;
    const node = document.querySelector(`.board-object[data-id="${cssEscape(item.id)}"]`);
    if (node) {
      node.style.left = `${item.x}px`;
      node.style.top = `${item.y}px`;
    }
    return;
  }
  if (pos.type === "connector") {
    const item = findItem(pos.type, pos.id);
    if (!item) return;
    item.x1 = pos.x1 + dx;
    item.y1 = pos.y1 + dy;
    item.x2 = pos.x2 + dx;
    item.y2 = pos.y2 + dy;
    return;
  }
  const item = findItem(pos.type, pos.id);
  if (item) item.points = pos.points.map(point => ({ x: point.x + dx, y: point.y + dy }));
}

function objectCenter(obj) {
  return { x: obj.x + obj.w / 2, y: obj.y + obj.h / 2 };
}

function objectFromElement(element) {
  const node = element?.closest?.(".board-object");
  if (!node) return null;
  return state.objects.find(obj => obj.id === node.dataset.id) || null;
}

function templateName() {
  return templates.find(tpl => tpl.id === state.currentTemplate)?.title || "Blank Board";
}

function clearSelection() {
  state.selectedId = null;
  state.selectedIds = [];
  state.selectedItems = [];
  state.selectedType = "object";
}

function duplicateSelected() {
  if (state.selectedType !== "object" || !state.selectedId) return;
  const obj = state.objects.find(item => item.id === state.selectedId);
  if (!obj) return;
  if (!canModifyItem(obj)) {
    toast("Guests can only duplicate items they created.");
    return;
  }
  const copy = { ...obj, id: uid(), x: obj.x + 28, y: obj.y + 28, text: obj.text, ownerId: state.sessionId };
  state.objects.push(copy);
  selectObject(copy.id, false);
  saveLocalBoard(false);
  render();
}

function copySelected(cut = false) {
  const item = selectedItem();
  if (!item) return;
  if (!canModifyItem(item)) {
    toast("Guests can only copy items they created.");
    return;
  }
  state.clipboard = {
    type: state.selectedType,
    item: JSON.parse(JSON.stringify(item))
  };
  if (cut) deleteSelected();
  else toast("Copied.");
}

function pasteClipboard() {
  if (!state.clipboard) return;
  const item = JSON.parse(JSON.stringify(state.clipboard.item));
  item.id = uid();
  item.ownerId = state.sessionId;
  if (state.clipboard.type === "object") {
    item.x += 32;
    item.y += 32;
    delete item.groupId;
    state.objects.push(item);
  }
  if (state.clipboard.type === "connector") {
    item.x1 += 32;
    item.y1 += 32;
    item.x2 += 32;
    item.y2 += 32;
    item.fromId = null;
    item.toId = null;
    state.connectors.push(item);
  }
  if (state.clipboard.type === "drawing") {
    item.points = item.points.map(point => ({ x: point.x + 32, y: point.y + 32 }));
    state.drawings.push(item);
  }
  state.selectedId = item.id;
  state.selectedType = state.clipboard.type;
  state.selectedIds = state.clipboard.type === "object" ? [item.id] : [];
  saveLocalBoard(false);
  render();
}

function groupSelected() {
  if (!state.selectedId) return;
  const groupId = `group-${uid()}`;
  const explicitSelection = selectedItemRecords();
  let group = explicitSelection;
  if (group.length <= 1 && state.selectedType === "object") {
    const selected = state.objects.find(obj => obj.id === state.selectedId);
    group = selected
      ? state.objects
        .filter(obj => obj.id === selected.id || boxesIntersect(obj, selected))
        .map(item => ({ type: "object", id: item.id, item }))
      : group;
  }
  group = group.filter(record => canModifyItem(record.item));
  if (!group.length) {
    toast("Guests can only group items they created.");
    return;
  }
  group.forEach(record => { record.item.groupId = groupId; });
  state.selectedItems = group.map(record => itemKey(record.type, record.id));
  state.selectedIds = selectedObjectIds();
  const last = selectedItems()[selectedItems().length - 1];
  state.selectedType = last?.type || state.selectedType;
  state.selectedId = last?.id || state.selectedId;
  saveLocalBoard(false);
  toast(`Grouped ${group.length} item${group.length === 1 ? "" : "s"}.`);
  render();
}

function ungroupSelected() {
  const item = selectedItem();
  if (!item?.groupId) return;
  if (!canModifyItem(item)) {
    toast("Guests can only edit items they created.");
    return;
  }
  allBoardItemRecords().filter(record => record.item.groupId === item.groupId && canModifyItem(record.item)).forEach(record => delete record.item.groupId);
  saveLocalBoard(false);
  toast("Ungrouped.");
  render();
}

function toggleLockSelected() {
  if (selectedItems().length > 1) {
    const records = selectedItemRecords().filter(record => canModifyItem(record.item));
    if (!records.length) {
      toast("Guests can only edit items they created.");
      return;
    }
    const shouldLock = records.some(record => !record.item.locked);
    records.forEach(record => { record.item.locked = shouldLock; });
    saveLocalBoard(false);
    toast(shouldLock ? "Selected items locked." : "Selected items unlocked.");
    render();
    return;
  }
  const item = selectedItem();
  if (!item) return;
  if (!canModifyItem(item)) {
    toast("Guests can only edit items they created.");
    return;
  }
  item.locked = !item.locked;
  saveLocalBoard(false);
  toast(item.locked ? "Locked in place." : "Unlocked.");
  render();
}

function moveSelectedLayer(action) {
  if (!state.selectedId) return;
  reorderItems(state.objects, new Set(selectedItems().filter(item => item.type === "object" && canModifyItem(findItem(item.type, item.id))).map(item => item.id)), action);
  moveSelectedSvgItems(action);
  saveLocalBoard(false);
  render();
}

function moveSelectedSvgItems(action) {
  const records = selectedItemRecords().filter(record => (record.type === "connector" || record.type === "drawing") && canModifyItem(record.item));
  if (!records.length) return;
  if (action === "front") {
    let z = maxSvgZ("over") + 1;
    records.forEach(record => {
      record.item.plane = "over";
      record.item.z = z++;
    });
    return;
  }
  if (action === "back") {
    let z = minSvgZ("under") - records.length;
    records.forEach(record => {
      record.item.plane = "under";
      record.item.z = z++;
    });
    return;
  }
  if (action === "forward" || action === 1) {
    records.forEach(record => {
      record.item.plane = record.item.plane || "under";
      record.item.z = currentSvgZ(record) + 1;
    });
    return;
  }
  if (action === "backward" || action === -1) {
    records.forEach(record => {
      record.item.plane = record.item.plane || "under";
      record.item.z = currentSvgZ(record) - 1;
    });
  }
}

function currentSvgZ(record) {
  if (Number.isFinite(record.item.z)) return record.item.z;
  if (record.type === "drawing") return state.drawings.findIndex(item => item.id === record.id);
  return state.drawings.length + state.connectors.findIndex(item => item.id === record.id);
}

function maxSvgZ(plane) {
  const values = allSvgItemRecords()
    .filter(record => (record.item.plane || "under") === plane)
    .map(currentSvgZ);
  return values.length ? Math.max(...values) : 0;
}

function minSvgZ(plane) {
  const values = allSvgItemRecords()
    .filter(record => (record.item.plane || "under") === plane)
    .map(currentSvgZ);
  return values.length ? Math.min(...values) : 0;
}

function allSvgItemRecords() {
  return [
    ...state.drawings.map(item => ({ type: "drawing", id: item.id, item })),
    ...state.connectors.map(item => ({ type: "connector", id: item.id, item }))
  ];
}

function reorderItems(list, ids, action) {
  if (!ids.size) return;
  if (action === "front") {
    const selected = list.filter(item => ids.has(item.id));
    const rest = list.filter(item => !ids.has(item.id));
    list.splice(0, list.length, ...rest, ...selected);
    return;
  }
  if (action === "back") {
    const selected = list.filter(item => ids.has(item.id));
    const rest = list.filter(item => !ids.has(item.id));
    list.splice(0, list.length, ...selected, ...rest);
    return;
  }
  if (action === "forward" || action === 1) {
    for (let i = list.length - 2; i >= 0; i -= 1) {
      if (ids.has(list[i].id) && !ids.has(list[i + 1].id)) {
        [list[i], list[i + 1]] = [list[i + 1], list[i]];
      }
    }
  } else if (action === "backward" || action === -1) {
    for (let i = 1; i < list.length; i += 1) {
      if (ids.has(list[i].id) && !ids.has(list[i - 1].id)) {
        [list[i], list[i - 1]] = [list[i - 1], list[i]];
      }
    }
  }
}

function deleteSelected() {
  if (!state.selectedId) return;
  const selected = selectedItems();
  const allowed = selected.filter(item => canModifyItem(findItem(item.type, item.id)));
  if (!allowed.length) {
    toast("Guests can only delete items they created.");
    return;
  }
  if (allowed.length < selected.length) toast("Only items you created were deleted.");
  const objectIds = new Set(allowed.filter(item => item.type === "object").map(item => item.id));
  const connectorIds = new Set(allowed.filter(item => item.type === "connector").map(item => item.id));
  const drawingIds = new Set(allowed.filter(item => item.type === "drawing").map(item => item.id));
  state.objects = state.objects.filter(obj => !objectIds.has(obj.id));
  state.connectors = state.connectors.filter(conn => !connectorIds.has(conn.id));
  state.drawings = state.drawings.filter(drawing => !drawingIds.has(drawing.id));
  clearSelection();
  saveLocalBoard(false);
  render();
}

function bindKeyboard() {
  if (window.forgeKeyboardBound) return;
  window.forgeKeyboardBound = true;
  document.addEventListener("keydown", event => {
    if (event.target.matches("input, textarea")) return;
    if (event.key === "Delete" || event.key === "Backspace") deleteSelected();
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
      event.preventDefault();
      duplicateSelected();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "e") {
      event.preventDefault();
      setMode("pen");
      toast("Pen mode active.");
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
      event.preventDefault();
      copySelected(false);
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v") {
      event.preventDefault();
      pasteClipboard();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "x") {
      event.preventDefault();
      copySelected(true);
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      undo();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "g") {
      event.preventDefault();
      groupSelected();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "u") {
      event.preventDefault();
      ungroupSelected();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
      event.preventDefault();
      toggleLockSelected();
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "]") {
      event.preventDefault();
      moveSelectedLayer("forward");
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "[") {
      event.preventDefault();
      moveSelectedLayer("backward");
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      saveLocalBoard(true);
    }
    if (event.key === "Escape") {
      setMode("select");
      clearSelection();
      render();
    }
  });
}

function setZoom(value, rerender = true) {
  state.zoom = Math.max(0.35, Math.min(1.8, value));
  if (rerender) render();
  else updateWorldTransform();
}

function updateWorldTransform() {
  const world = document.getElementById("canvasWorld");
  if (world) world.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`;
}

function screenToWorld(x, y) {
  return {
    x: (x - state.pan.x) / state.zoom,
    y: (y - state.pan.y) / state.zoom
  };
}

function toggleTimer() {
  if (state.timer.running) {
    clearInterval(state.timer.id);
    state.timer.running = false;
    toast("Timer paused.");
    render();
    return;
  }
  state.timer.running = true;
  state.timer.id = setInterval(() => {
    state.timer.remaining = Math.max(0, state.timer.remaining - 1);
    const timerBtn = document.getElementById("timerBtn");
    if (timerBtn) timerBtn.textContent = `Timer ${formatTimer(state.timer.remaining)}`;
    renderPanel();
    if (state.timer.remaining === 0) {
      clearInterval(state.timer.id);
      state.timer.running = false;
      toast("Timer complete.");
    }
  }, 1000);
  toast("Timer started.");
}

function boardData() {
  return {
    app: "ForgeSpace",
    version: "0.2.0",
    title: state.boardTitle,
    template: state.currentTemplate,
    exportedAt: new Date().toISOString(),
    objects: state.objects,
    connectors: state.connectors,
    drawings: state.drawings,
    nextId: state.nextId
  };
}

function saveLocalBoard(showToast) {
  recordHistory();
  if (showToast) toast("ForgeSpace does not permanently save boards. Export JSON to keep this board.");
}

function historyData() {
  return {
    title: state.boardTitle,
    template: state.currentTemplate,
    objects: state.objects,
    connectors: state.connectors,
    drawings: state.drawings,
    nextId: state.nextId
  };
}

function recordHistory() {
  if (state.isRestoring) return;
  const snapshot = JSON.stringify(historyData());
  if (state.history[state.historyIndex] === snapshot) return;
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(snapshot);
  if (state.history.length > 60) state.history.shift();
  state.historyIndex = state.history.length - 1;
}

function undo() {
  if (state.historyIndex <= 0) {
    toast("Nothing to undo.");
    return;
  }
  state.historyIndex -= 1;
  state.isRestoring = true;
  applyBoardData(JSON.parse(state.history[state.historyIndex]));
  state.isRestoring = false;
  render();
}

function loadLocalBoard() {
  toast("Boards are not reopened automatically. Import JSON to continue prior work.");
  return false;
}

function applyBoardData(data) {
  state.boardTitle = data.title || "Imported ForgeSpace Board";
  state.currentTemplate = data.template || "imported";
  state.objects = Array.isArray(data.objects) ? data.objects : [];
  state.connectors = Array.isArray(data.connectors) ? data.connectors.map(conn => ({ kind: "arrow", ...conn })) : [];
  state.drawings = Array.isArray(data.drawings) ? data.drawings : [];
  state.nextId = Math.max(Number(data.nextId) || state.nextId, maxExistingId() + 1);
  clearSelection();
}

function exportJson() {
  download(`${slug(state.boardTitle)}.json`, JSON.stringify(boardData(), null, 2), "application/json");
  toast("JSON export created.");
}

function importJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      applyBoardData(JSON.parse(reader.result));
      saveLocalBoard(false);
      render();
      toast("Board loaded.");
    } catch {
      toast("That JSON file could not be loaded.");
    }
  };
  reader.readAsText(file);
}

function exportHtml() {
  const html = `<!doctype html><html><head><meta charset="UTF-8"><title>${escapeHtml(state.boardTitle)}</title><style>${exportStyles()}</style></head><body><h1>${escapeHtml(state.boardTitle)}</h1>${exportSvg()}</body></html>`;
  download(`${slug(state.boardTitle)}.html`, html, "text/html");
  toast("HTML export created.");
}

function exportPng() {
  const svg = exportSvg();
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1800;
    canvas.height = 1100;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob(pngBlob => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(pngBlob);
      link.download = `${slug(state.boardTitle)}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast("PNG export created.");
    }, "image/png");
  };
  image.src = url;
}

function exportPdf() {
  const pdf = createPdf();
  download(`${slug(state.boardTitle)}.pdf`, pdf, "application/pdf");
  toast("PDF export created.");
}

function exportSvg() {
  const drawings = state.drawings.map(drawing => {
    const points = drawing.points.map(point => `${point.x},${point.y}`).join(" ");
    return `<polyline points="${points}" fill="none" stroke="${drawing.color}" stroke-width="${drawing.width}" stroke-linecap="round" stroke-linejoin="round" />`;
  }).join("");
  const lines = state.connectors.map(conn => {
    return `<path d="${connectorPath(conn)}" fill="none" stroke="#6f6f78" stroke-width="3"${exportMarkerAttrs(conn)} />`;
  }).join("");
  const objects = state.objects.map(obj => {
    const fill = objectFill(obj);
    const stroke = obj.type === "comment" ? "#a100ff" : "#777782";
    const text = wrapText(obj.text, Math.max(12, Math.floor(obj.w / 9))).slice(0, 8);
    const textSvg = text.map((line, idx) => `<text x="${obj.x + 12}" y="${obj.y + 26 + idx * 18}" font-family="Segoe UI, Arial" font-size="15" fill="#111111">${escapeHtml(line)}</text>`).join("");
    if (obj.variant === "oval" || obj.variant === "circle") {
      return `<ellipse cx="${obj.x + obj.w / 2}" cy="${obj.y + obj.h / 2}" rx="${obj.w / 2}" ry="${obj.h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2" />${textSvg}`;
    }
    if (obj.variant === "diamond") {
      const cx = obj.x + obj.w / 2;
      const cy = obj.y + obj.h / 2;
      return `<polygon points="${cx},${obj.y} ${obj.x + obj.w},${cy} ${cx},${obj.y + obj.h} ${obj.x},${cy}" fill="${fill}" stroke="${stroke}" stroke-width="2" />${textSvg}`;
    }
    return `<rect x="${obj.x}" y="${obj.y}" width="${obj.w}" height="${obj.h}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="${obj.type === "lane" ? 2 : 1}" />${textSvg}`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1100" viewBox="120 120 1800 1100"><defs><marker id="exportArrowEnd" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#6f6f78"></path></marker><marker id="exportArrowStart" markerWidth="10" markerHeight="10" refX="1" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M9,0 L9,6 L0,3 z" fill="#6f6f78"></path></marker></defs><rect x="120" y="120" width="1800" height="1100" fill="#ffffff" />${drawings}${lines}${objects}</svg>`;
}

function exportMarkerAttrs(conn) {
  if (conn.kind !== "arrow") return "";
  const variant = conn.variant || "right";
  if (variant.includes("double")) return ' marker-start="url(#exportArrowStart)" marker-end="url(#exportArrowEnd)"';
  if (variant.includes("left")) return ' marker-start="url(#exportArrowStart)"';
  return ' marker-end="url(#exportArrowEnd)"';
}

function createPdf() {
  const width = 792;
  const height = 612;
  const content = [];
  content.push("q 1 1 1 rg 0 0 792 612 re f Q");
  content.push("BT /F1 22 Tf 36 566 Td (ForgeSpace Board) Tj ET");
  content.push(`BT /F1 14 Tf 36 540 Td (${pdfText(state.boardTitle)}) Tj ET`);
  const scale = 0.34;
  const ox = 20;
  const oy = 500;
  state.connectors.forEach(conn => {
    const ep = connectorEndpoints(conn);
    content.push(`0.45 0.45 0.5 RG 1.5 w ${ox + ep.x1 * scale} ${oy - ep.y1 * scale} m ${ox + ep.x2 * scale} ${oy - ep.y2 * scale} l S`);
  });
  state.drawings.forEach(drawing => {
    if (drawing.points.length < 2) return;
    const first = drawing.points[0];
    let path = `0 0 0 RG 1 w ${ox + first.x * scale} ${oy - first.y * scale} m`;
    drawing.points.slice(1).forEach(point => {
      path += ` ${ox + point.x * scale} ${oy - point.y * scale} l`;
    });
    content.push(`${path} S`);
  });
  state.objects.forEach(obj => {
    const x = ox + obj.x * scale;
    const y = oy - (obj.y + obj.h) * scale;
    const w = obj.w * scale;
    const h = obj.h * scale;
    const [r, g, b] = pdfColor(obj);
    content.push(`${r} ${g} ${b} rg 0.5 0.5 0.55 RG ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re B`);
    wrapText(obj.text, 24).slice(0, 3).forEach((line, idx) => {
      content.push(`BT /F1 7 Tf ${(x + 5).toFixed(2)} ${(y + h - 12 - idx * 9).toFixed(2)} Td (${pdfText(line)}) Tj ET`);
    });
  });
  const stream = content.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj, idx) => {
    offsets.push(pdf.length);
    pdf += `${idx + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

function startCursorLoop() {
  if (window.cursorLoopStarted) return;
  window.cursorLoopStarted = true;
  setInterval(() => {
    const layer = document.getElementById("cursorLayer");
    if (!layer) return;
    state.cursors.forEach(cursor => {
      cursor.x += cursor.dx;
      cursor.y += cursor.dy;
      if (cursor.x < 260 || cursor.x > 1660) cursor.dx *= -1;
      if (cursor.y < 170 || cursor.y > 760) cursor.dy *= -1;
    });
    layer.innerHTML = state.cursors.map(cursor => `
      <div class="cursor" style="left:${cursor.x}px;top:${cursor.y}px;">
        <i class="cursor-pointer" style="border-left-color:${cursor.color};"></i><span>${cursor.name}</span>
      </div>`).join("");
  }, 80);
}

function signOut() {
  state.user = null;
  state.role = "guest";
  state.currentTemplate = null;
  render();
}

function toast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

function download(filename, content, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function colorValue(color) {
  return {
    yellow: "#fff1a8",
    blue: "#dcecff",
    green: "#dff5e8",
    pink: "#ffe1f2",
    purple: "#f3e6ff",
    gray: "#efeff4",
    white: "#ffffff",
    black: "#111111"
  }[color] || "#ffffff";
}

function objectFill(obj) {
  if (obj.type === "text") return "transparent";
  return colorValue(obj.color);
}

function pdfColor(obj) {
  const map = {
    yellow: [1, 0.95, 0.66],
    blue: [0.86, 0.93, 1],
    green: [0.87, 0.96, 0.91],
    pink: [1, 0.88, 0.95],
    purple: [0.95, 0.9, 1],
    gray: [0.94, 0.94, 0.96],
    white: [1, 1, 1]
  };
  return map[obj.color] || [1, 1, 1];
}

function wrapText(text, limit) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  words.forEach(word => {
    if ((line + " " + word).trim().length > limit) {
      if (line.trim()) lines.push(line.trim());
      line = word;
    } else {
      line = `${line} ${word}`;
    }
  });
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function exportStyles() {
  return "body{font-family:Segoe UI,Arial,sans-serif;margin:32px;color:#111}h1{font-size:28px}svg{width:100%;height:auto;border:1px solid #ddd}";
}

function pdfText(text) {
  return String(text).replace(/[\\()]/g, "\\$&").slice(0, 120);
}

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function titleCase(value) {
  return String(value).replace(/\b\w/g, char => char.toUpperCase());
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "forgespace-board";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function cssEscape(value) {
  return window.CSS?.escape ? CSS.escape(value) : String(value).replace(/["\\]/g, "\\$&");
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

function boxesIntersect(a, b) {
  return !(a.x > b.x + b.w || a.x + a.w < b.x || a.y > b.y + b.h || a.y + a.h < b.y);
}

function maxExistingId() {
  const ids = [...state.objects, ...state.connectors, ...state.drawings]
    .map(item => Number(String(item.id || "").replace("fs-", "")))
    .filter(Number.isFinite);
  return ids.length ? Math.max(...ids) : 0;
}

render();
