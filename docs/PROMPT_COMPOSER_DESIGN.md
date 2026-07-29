# Prompt Composer Design

This document is a temporary architecture note. The implementation moves generation from a raw prompt-only form to a two-layer flow:

1. User-facing creative description.
2. Provider-facing final prompt composed from description, connected assets, project context and mode rules.

The composer must use a deterministic rule draft first, then optionally ask the configured Agent model to rewrite it. If the Agent is unavailable, the rule draft remains usable. Request-only parameters such as duration, ratio, resolution and candidate count are not duplicated inside the final prompt.
