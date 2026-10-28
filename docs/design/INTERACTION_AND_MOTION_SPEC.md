# Interaction and motion specification

- Landing primary action scrolls to the two real entry paths. Each path calls the existing intake handler. Navigation links only to available application states; unavailable Studio, Workspace, or Blueprint destinations are disabled until a session exists.
- The orbital SVG shifts slowly through nine degrees and a small scale change. It communicates linked directions without requiring a timed reveal. `prefers-reduced-motion: reduce` removes this animation through the token stylesheet and explicit orbit rule.
- Constellation nodes are native buttons with real version IDs in their labels. Selecting one sets the same selected ID as List, then updates the existing inspector. The graph region can be keyboard focused and scrolled. The internal viewport scrolls; no fake zoom control is shown.
- Parent edges come only from the stored lineage array. Unlinked initial versions connect to a labeled origin. A two-parent child draws both edges. The selected edge is emphasized.
- List selection uses the same handler and includes the strategy, name, summary, and lineage state. At small widths, Explore and Inspect remain explicit panel choices; List is always available.
- Existing branch, combine, critique, blueprint, polling, autosave, and conflict handlers remain connected to the original API.
