# Settings

Settings provides the app tab for appearance, local backups, Google Drive backups and application information.

## Appearance

The app supports:

- System
- Light
- Dark

The selected preference is applied immediately and persisted outside the main SQLite database. `system` follows the device color scheme through React Native `useColorScheme`.

The preference is not included in backup data.

## Local Backup

The Local backup section exposes:

- Create backup
- Import backup
- View local backups
- Share local backup
- Delete local backup
- Restore an imported backup after explicit confirmation

Restore uses the existing replace strategy. Before restoring, the UI explains that current data will be replaced and a safety backup will be created first. After restore, the application provider reloads the local application API.

## Google Drive

The Google Drive section exposes:

- Connection status
- Connect Google Drive
- Disconnect Google Drive
- Upload new backup
- List backups
- Refresh
- Download backup
- Restore downloaded backup after explicit confirmation
- Delete remote backup

Tokens and raw Google responses are never displayed. Remote backups are kept when disconnecting.

## Application

The Application section shows:

- App name
- Version
- Build number when available
- Database schema version
- Backup format version
- Local privacy note

## Boundaries

Settings does not implement automatic sync, merge restore, scheduled backups, background work, notifications, app accounts, profile editing, subscriptions, analytics, remote backend, TanStack Query or Zustand.

