# CineWeave UI Direction — Digital Darkroom

## Product diagnosis

CineWeave is a high-frequency creative production interface rather than a marketing site. The visual system therefore follows the **daily product interface** mode from `cinematic-web-experience-designer`: clarity and long-term comfort come first, while cinematic treatment is reserved for media previews, generation states, selection changes and the AI Director.

## Selected visual world

**Digital darkroom / editing table**

- Primary subject: generated images, videos and storyboard frames.
- Materials: charcoal metal, matte monitor glass, film-contact-sheet lines and warm projection light.
- Light behavior: warm amber light marks focus and creation; cool teal marks verified or synchronized state.
- Motion verbs: reveal, focus, scan, connect and settle.
- Typography: compact neutral UI typography; media and scene titles carry stronger editorial weight.

## Rejected directions

1. Purple AI SaaS glassmorphism: too generic and weakens media hierarchy.
2. Heavy Awwwards/WebGL treatment: unsuitable for a long-session editing workspace.
3. Pure broadcast-control-room density: powerful but too intimidating for non-professional creators.

## Hierarchy

1. Media previews and selected outputs.
2. Generation and Agent state.
3. Titles, prompts and production metadata.
4. Navigation chrome and supporting controls.

## Motion policy

- Node hover and panel entry use short, causal transitions only.
- Running generation nodes use a restrained scanning highlight.
- No continuous decorative floating objects.
- `prefers-reduced-motion` disables non-essential transitions and animations.

## Responsive direction

- Desktop keeps asset shelf, canvas and inspector visible.
- Medium screens preserve the asset shelf and hide the inspector.
- Small screens prioritize the canvas; assets move out of the persistent layout and the Agent becomes a full-width overlay.

## Accessibility and performance

- Visible `:focus-visible` treatment for keyboard users.
- Text and status colors maintain contrast against dark panels.
- Visual texture is CSS-only and low-opacity; no shader or video background is required.
- Animations use transform and opacity and are disabled in reduced-motion mode.
