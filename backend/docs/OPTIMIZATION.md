# Backend Optimization & Scalability Notes

## 1. MongoDB Indexes (Added)
| Collection | Index | Purpose |
|------------|-------|---------|
| notifications | { userId:1, read:1, createdAt:-1 } | Fetch a user's unread / recent notifications quickly |
| notifications | { createdAt:-1 } | Fallback global ordering |
| posts | text(title, content) | Basic text search |
| posts | { author:1, createdAt:-1 } | Author feed |
| posts | { category:1, createdAt:-1 } | Category listing |
| posts | { likeCount:-1, commentCount:-1 } | Popular / trending queries |
| comments | { post:1, createdAt:-1 } | Paginate comments per post |
| users | { email:1 }, { username:1 } | Auth & profile lookups |

## 2. Query Patterns & Suggestions
- Use projection (select) to cut payload size when listing large sets.
- For infinite scroll on posts, consider keyset pagination (`createdAt < lastSeenCreatedAt`) to avoid deep skip().
- For very large notification volumes, archive (move read + old) to a cold collection.

## 3. Caching Strategy (Future)
| Layer | Candidate | Notes |
|-------|-----------|-------|
| In-memory | Recently accessed posts | LRU (e.g. node-cache) for hot posts by ID |
| Redis | Aggregated counters | Offload like/comment counts if write contention rises |
| CDN | Static assets / images | Move media to S3 + CloudFront/Cloudflare |

## 4. Realtime & WebSocket
- Current single namespace is fine; if event volume grows, split notification vs domain metrics.
- Add heartbeat/ping tracking for pruning dead sockets if memory is a concern.

## 5. Background Jobs
Potential BullMQ / Agenda jobs:
- Recalculate trending posts (weight = likes*2 + comments*3 + views*0.2)
- Digest emails of unread notifications (daily/weekly)
- Clean up soft-deleted or expired notifications

## 6. Security Hardening
| Area | Action |
|------|--------|
| Rate limiting | Already: ThrottlerModule; tune limits per route group |
| Passwords | Ensure bcrypt salt rounds >=10 (verify in auth service) |
| JWT | Rotate secret periodically; add token version field for invalidation |
| Input validation | DTOs ok; add stricter regex for username (avoid special chars) |
| CORS | Restrict origins in production |
| Headers | Helmet enabled; consider CSP & referrer policy |

## 7. Observability
- Add global logging interceptor (mask sensitive fields).
- Add Prometheus metrics: request duration, active sockets.
- Central error logging (e.g. Winston + daily rotate or external service).

## 8. Scaling Path
| Stage | Trigger | Action |
|-------|---------|--------|
| 1 | CPU >70% sustained | Horizontal scale API pods |
| 2 | Mongo slow queries | Add indexes (done) / shard if dataset huge |
| 3 | Socket load high | Sticky sessions + Redis adapter |
| 4 | Notification volume huge | Move notification writes into queue + eventual emit |

## 9. Data Lifecycle
- Option: soft delete posts/comments (add `deletedAt`) for moderation rollback.
- Archive notifications older than 90 days.

## 10. Future Enhancements (Backend)
- Full text search with weights (title > content) using text index weights.
- Add `parentComment` for threaded replies.
- Add `lastActiveAt` for users (update on login/post/comment).
- Add anti-spam: limit posts/comments per minute per user.
- Add an audit log collection for admin actions.

## 11. Testing Strategy (Optional Next)
| Layer | Target |
|-------|--------|
| Unit | Services: PostService like/unlike logic |
| Integration | Auth + notifications emitter flow |
| E2E | Register → Create post → Comment → Receive notifications |

---
Feel free to extend or trim depending on real usage patterns.
