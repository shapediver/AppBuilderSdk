---
paths:
  - "**/AcceptReject*"
  - "**/acceptReject*"
  - "**/ViewportAcceptReject*"
---

# Accept/reject presentation

Parameter refs and parameter controls may set `acceptRejectModePresentation` to `"global"` (default) or `"inline"`.

- **Global.** Shared viewport overlay, bottom-toolbar buttons, and widget `AcceptRejectButtons`. The shared widget group stays the light variant.
- **Inline.** Full-width filled Accept and Reject buttons inside the parameter control that queued the change, and only while that change is pending. The shared viewport and toolbar buttons skip that pending change.
- Toolbar accept/reject keeps the icon buttons. The Accept and Reject captions sit centered under the icons.
