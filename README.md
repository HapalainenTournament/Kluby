# Clubroom FC27 Tracker v16

- redesigned standalone Compare tab
- no `archived` labels in metric names
- Compare falls back to the current EA match window immediately, then merges PostgreSQL history as it grows
- improved player identity matching (player id, pro name, EA/account name)
- PostgreSQL remains the permanent match archive; new matches are deduplicated by matchId

## Render
Set `DATABASE_URL` to the PostgreSQL Internal Database URL. The supplied `render.yaml` can also create/link `clubroom-db` when deploying as a Blueprint.

Important: a newly created database starts empty. On the first club load the currently available EA matches are stored; future collector runs keep adding new matchIds. EA history that is no longer returned cannot be reconstructed retroactively.
