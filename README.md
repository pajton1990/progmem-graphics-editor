# PROGMEM Graphics Editor

A lightweight browser app for creating and editing Arduino PROGMEM graphics.

## Features

- Pick pixel dimensions before drawing
- Draw and erase on a pixel grid
- Generate Arduino `PROGMEM` byte arrays
- Paste existing code and render it back to the canvas
- Preview the current graphic in real time
- Copy the generated Arduino code to the clipboard

## Run locally

Because this is a static web app, you can open `index.html` directly in a browser, or serve it with a tiny local web server:

```bash
cd progmem-graphics-editor
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Workflow

1. Set the width and height.
2. Draw your image on the canvas.
3. Click **Copy code** to get the Arduino array.
4. Paste code back in to load it into the editor.

## Example output

```cpp
const uint8_t sprite[] PROGMEM = {
  0x00, 0x7E, 0x81, 0xA5, 0x81, 0x99, 0x81, 0x7E, 0x00
};

const uint8_t sprite_width = 8;
const uint8_t sprite_height = 9;
```

This project is intentionally simple and dependency-free so it works well for quick Arduino sprite prototyping.

# License

MIT
