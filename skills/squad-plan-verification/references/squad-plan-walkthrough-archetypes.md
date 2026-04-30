# Squad Plan Walkthrough Archetypes

Use the archetype closest to the acceptance criterion you are walking. Adapt freely, but keep the same fields: triggering input, boundary sequence, concept labels from the glossary, and externally observable outcome.

## CLI or one-shot

1. Operator runs the documented command with the documented arguments.
2. Argument parser validates input and produces a glossary concept for input state.
3. Resolver converts it into the storage or runtime concept and performs the side effect.
4. Process exits with the expected code and the expected stdout or stderr.

## Service or event

1. Upstream caller issues the documented request or event.
2. Ingress validates and produces the ingress-side concept from the glossary.
3. Handler produces the domain concept and emits the side effect.
4. Observable outcome appears in the response, emitted event, stored row, or written file.

## Library or API

1. Consumer calls the documented public function with the documented inputs.
2. Public surface routes to the internal concept and runs the operation.
3. Return value, raised error, or side effect matches the acceptance criterion.

## UI

1. User performs the documented action on the documented surface.
2. The app updates the client-state concept and, when relevant, the server-state concept.
3. The expected visual state appears and any documented external side effect is observable.
