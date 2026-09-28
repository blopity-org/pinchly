# Blopity Pinch

**Things that just work.** Blopity Pinch is Blopity's small, useful, slightly weird place to make browser apps. Start with a visual builder, then get into the details with JavaScript, a terminal, and per-app JSON storage.

## What it does

- Explore small interactive apps and examples.
- Make an app with the browser-based builder or edit its generated JSON.
- Run JavaScript and terminal commands inside an app.
- Save app data in the current browser after signing in; this demo does not use a server-backed account system.

## Files at a glance

```
index.html          # Blopity Pinch home
apps.html           # App library
builder.html        # App builder
community.html      # Creator profiles
inbox.html          # Notifications
data.json           # Starter apps and folders
style.css           # Shared interface styles
js/                 # App runtime and page modules
media/              # Site assets
```


## Getting Started

1. Clone the repository.
2. Open `index.html` in a browser.
3. Explore the examples or open **Create** to build an app.
4. Sign in to save app data in this browser. Demo accounts: `pinchi` / `pinch123` or `demo` / `demo`.

## Migration note

Blopity Pinch is the display name. The existing `pinchly` storage keys and runtime identifiers are intentionally retained so existing local data and integrations continue to work.