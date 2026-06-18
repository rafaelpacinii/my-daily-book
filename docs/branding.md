# Branding

This step finalizes the technical brand assets used by the Expo app build configuration.

## Source asset

Primary source:

- `assets/images/logo.png`

Audit summary:

- format: PNG
- dimensions: `1024x1024`
- alpha channel: present
- file size: about `1.37 MiB`
- composition: transparent logo with book symbol, star highlight, and brand wordmark

The full logo remains appropriate for splash usage, but not for launcher/app icons because the wordmark becomes illegible at small sizes.

## Generated assets

The following files are now the build assets used by Expo:

- `assets/images/logo.png`
- `assets/images/icon.png`
- `assets/images/adaptive-icon.png`
- `assets/images/adaptive-icon-monochrome.png`
- `assets/images/splash-icon.png`
- `assets/images/favicon.png`

### Icon

`icon.png` is derived from the book symbol and star only, centered on a deep green background:

- background: `#244A3A`
- no small text
- safe margins preserved
- square `1024x1024`

### Android adaptive icon

`adaptive-icon.png` is the transparent foreground symbol only:

- no wordmark
- safe transparent padding
- square `1024x1024`

`adaptive-icon-monochrome.png` is a monochrome mask version for Android monochrome support.

### Splash

`splash-icon.png` uses the trimmed full brand logo for centered splash presentation with:

- light background: `#F5F0E6`
- dark background: `#17231D`
- `resizeMode: contain`

### Favicon

`favicon.png` is a downscaled derivative of the launcher icon for web.

## Visual direction used

- Deep green: `#244A3A`
- Sage green: `#8FAF9D`
- Cream: `#F5F0E6`
- Soft terracotta: `#C97B63`
- Graphite: `#2D312F`
- Dark background: `#17231D`

## Asset validation

Run:

```bash
npm run assets:check
```

The script validates:

- required files exist
- PNG signature
- minimum dimensions
- alpha channel where expected
- reasonable file size
