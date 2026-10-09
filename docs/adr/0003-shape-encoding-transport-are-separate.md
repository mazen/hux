# Message shape, encoding and transport are separate layers; Rust types are canonical and published as JSON Schema

The Node↔Gateway protocol is split into typed message shapes (`hux-protocol`), an encoding (JSON for now), and a transport that only moves opaque, ordered messages (`hux-transport`: WebSocket now, in-memory for tests, iroh/QUIC later). We expect to change transports (LAN WebSocket, then NAT-traversing QUIC) without touching any message logic, and we want any language to be able to implement a Node. The Rust types are the source of truth; JSON Schema is generated and checked in, and other languages (starting with the web app's TypeScript) generate from that schema, not from Rust directly.

## Considered Options

- gRPC/protobuf: rejected for now, since it ties shape, encoding and transport together and is awkward in browsers.
- Hand-written TypeScript mirrors of Rust types: rejected, since they drift.
