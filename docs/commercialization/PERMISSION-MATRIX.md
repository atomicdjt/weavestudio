# Commercial Permission Matrix

All permissions below must be enforced server-side and by database policy in cloud mode. Local mode has no account roles.

| Action | Owner | Administrator | Editor | Commenter | Viewer |
| --- | --- | --- | --- | --- | --- |
| View workspace projects | Yes | Yes | Yes | Yes | Yes |
| Create/edit project | Yes | Yes | Yes | No | No |
| Comment/resolve own comment | Yes | Yes | Yes | Yes | No |
| Delete/archive project | Yes | Yes | No | No | No |
| Share project | Yes | Yes | Configurable | No | No |
| Invite/remove members | Yes | Yes | No | No | No |
| Change roles | Yes | No | No | No | No |
| Transfer ownership | Yes | No | No | No | No |
| Manage templates | Yes | Yes | Configurable | No | No |
| View audit history | Yes | Yes | No | No | No |
| Manage billing | Yes | Configurable | No | No | No |
| Delete workspace | Yes | No | No | No | No |

Server-side authorization must also check tenant membership, project relationship, invite status, soft-deletion state, subscription entitlement, and share-token scope before returning data.

