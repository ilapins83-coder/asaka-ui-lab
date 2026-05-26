# ASAKA UI Lab

Isolated UI prototyping environment for ASAKA.

Target device canvas:

- Samsung Galaxy S25-style logical viewport: `360 x 780` CSS pixels
- Display ratio basis: `1080 x 2340` pixels, 19.5:9
- Desktop view keeps a Galaxy S25 presentation frame.
- Narrow/mobile view removes the outer phone frame so the app can be audited as a real mobile viewport.

Current prototype flow:

1. Add photos or short video clips.
2. Record voice or paste a short text, with compact mode choice.
3. Review vertical preview, frame order, captions and missing facts.
4. Create the video.

Run:

```bash
cd /root/asaka-ui-lab
python3 -m http.server 8080
```

Open:

```text
http://127.0.0.1:8080
```

This lab intentionally avoids the ASAKA backend until the UI flow is approved.
