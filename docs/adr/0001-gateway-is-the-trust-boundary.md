# The Gateway is the single trust boundary and the only internet egress

Every Household has exactly one Gateway that owns data, settings, secrets, policy and audit, and is the only part of hux that talks to the internet. Nodes are clients that keep no long-term state and hold no secrets beyond their own key. We chose this over a peer-to-peer mesh of equal devices, and over letting each Node call out on its own, so that policy, Approvals and egress control are enforced in one place that a Node compromise cannot bypass. Even the bundled desktop install runs the Gateway as a separate process from the UI, for the same reason.

## Consequences

- A Model endpoint bound to a Node's loopback interface is reached through that Node's authenticated connection to the Gateway; the Node forwards only to endpoints it has registered.
- Offline-capable Gateways that sync with each other (for example one in a car) are a future extension. The data model must not assume a single Gateway forever, but there is still only one trust boundary per Household at a time.
