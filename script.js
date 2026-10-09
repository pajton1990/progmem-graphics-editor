const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');

const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const resizeBtn = document.getElementById('resizeBtn');
const symbolNameInput = document.getElementById('symbolName');
const codeOutput = document.getElementById('codeOutput');
const codeInput = document.getElementById('codeInput');
const clearBtn = document.getElementById('clearBtn');
const fillBtn = document.getElementById('fillBtn');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const loadCodeBtn = document.getElementById('loadCodeBtn');
const previewCodeBtn = document.getElementById('previewCodeBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const imageImport = document.getElementById('imageImport');
const applyImageBtn = document.getElementById('applyImageBtn');
const importOptions = document.getElementById('importOptions');
const thresholdInput = document.getElementById('thresholdInput');
const thresholdValue = document.getElementById('thresholdValue');

const state = {
  width: 16,
  height: 16,
  pixels: [],
  tool: 'draw',
  isDragging: false,
  dragValue: true,
  importedImage: null,
};

function makePixels(width, height) {
  return Array.from({ length: height }, () => Array(width).fill(false));
}

function setCanvasSize(width, height) {
  state.width = Math.max(1, Math.min(256, Number(width) || 1));
  state.height = Math.max(1, Math.min(256, Number(height) || 1));
  state.pixels = makePixels(state.width, state.height);
  widthInput.value = state.width;
  heightInput.value = state.height;
  renderEditor();
  renderPreview();
  refreshCode();
}

function renderEditor() {
  const cellSize = 18;
  const margin = 1;
  const canvasWidth = state.width * cellSize + margin * 2;
  const canvasHeight = state.height * cellSize + margin * 2;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.36)';
  ctx.lineWidth = 1;

  for (let x = 0; x <= state.width; x += 1) {
    const px = x * cellSize + margin;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, canvasHeight);
    ctx.stroke();
  }

  for (let y = 0; y <= state.height; y += 1) {
    const py = y * cellSize + margin;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(canvasWidth, py);
    ctx.stroke();
  }

  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      if (!state.pixels[y][x]) continue;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x * cellSize + margin + 1, y * cellSize + margin + 1, cellSize - 2, cellSize - 2);
    }
  }
}

function renderPreview() {
  const maxSize = 200;
  const scale = Math.min(maxSize / state.width, maxSize / state.height);
  const drawWidth = Math.max(1, Math.round(state.width * scale));
  const drawHeight = Math.max(1, Math.round(state.height * scale));

  previewCanvas.width = drawWidth;
  previewCanvas.height = drawHeight;
  previewCtx.clearRect(0, 0, drawWidth, drawHeight);
  previewCtx.fillStyle = '#ffffff';
  previewCtx.fillRect(0, 0, drawWidth, drawHeight);

  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      if (!state.pixels[y][x]) continue;
      previewCtx.fillStyle = '#0f172a';
      previewCtx.fillRect(Math.floor(x * scale), Math.floor(y * scale), Math.ceil(scale), Math.ceil(scale));
    }
  }
}

function getMouseCell(event) {
  const rect = canvas.getBoundingClientRect();
  const cellSize = 18;
  const x = Math.floor(((event.clientX - rect.left) / rect.width) * (canvas.width / cellSize));
  const y = Math.floor(((event.clientY - rect.top) / rect.height) * (canvas.height / cellSize));

  return {
    x: clamp(x, 0, state.width - 1),
    y: clamp(y, 0, state.height - 1),
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function applyToolAtCell(x, y) {
  if (x < 0 || y < 0 || x >= state.width || y >= state.height) return;

  if (state.tool === 'draw') {
    state.pixels[y][x] = true;
    state.dragValue = true;
  } else if (state.tool === 'erase') {
    state.pixels[y][x] = false;
    state.dragValue = false;
  } else if (state.tool === 'invert') {
    state.pixels[y][x] = !state.pixels[y][x];
    state.dragValue = state.pixels[y][x];
  }

  renderEditor();
  renderPreview();
  refreshCode();
}

function refreshCode() {
  const symbol = (symbolNameInput.value || 'sprite').trim() || 'sprite';
  const rowBytes = Math.ceil(state.width / 8);
  const rows = [];

  for (let y = 0; y < state.height; y += 1) {
    for (let byteIndex = 0; byteIndex < rowBytes; byteIndex += 1) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit += 1) {
        const x = byteIndex * 8 + bit;
        if (x < state.width && state.pixels[y][x]) {
          byte |= 1 << (7 - bit);
        }
      }
      rows.push(`0x${byte.toString(16).padStart(2, '0').toUpperCase()}`);
    }
  }

  const body = rows.length ? rows.join(', ') : '0x00';
  const code = `const uint8_t ${symbol}[] PROGMEM = {\n  ${body}\n};\n\nconst uint8_t ${symbol}_width = ${state.width};\nconst uint8_t ${symbol}_height = ${state.height};`;
  codeOutput.value = code;
}

function fillCanvas(value) {
  state.pixels = Array.from({ length: state.height }, () => Array(state.width).fill(value));
  renderEditor();
  renderPreview();
  refreshCode();
}

function loadSample() {
  setCanvasSize(16, 16);

  const pattern = [
    '0000000000000000',
    '0011111100000000',
    '0111111110000000',
    '0111111110000000',
    '0111111110000000',
    '0011111100000000',
    '0001101100000000',
    '0000111000000000',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
    '0000000000000000',
  ];

  for (let y = 0; y < state.height; y += 1) {
    for (let x = 0; x < state.width; x += 1) {
      state.pixels[y][x] = pattern[y]?.[x] === '1';
    }
  }

  renderEditor();
  renderPreview();
  refreshCode();
}

function parseCodeIntoPixels(source) {
  const hexMatches = source.match(/0x[0-9A-Fa-f]+/g) || [];
  if (!hexMatches.length) {
    throw new Error('No byte values found. Paste a PROGMEM array like { 0x00, 0xFF, ... }.');
  }

  const bytes = hexMatches.map((value) => parseInt(value, 16));
  let width = Number((source.match(/(?:width|W)\s*[:=]\s*(\d+)/i) || [])[1]) || state.width;
  let height = Number((source.match(/(?:height|H)\s*[:=]\s*(\d+)/i) || [])[1]) || state.height;

  if (!bytes.length) {
    throw new Error('No graph bytes detected.');
  }

  const rowBytes = Math.ceil(width / 8);
  if (height === state.height && width === state.width) {
    // leave current size as is
  } else {
    const inferredHeight = Math.max(1, Math.ceil(bytes.length / rowBytes));
    height = height || inferredHeight;
    width = width || Math.max(1, rowBytes * 8);
    setCanvasSize(width, height);
  }

  const pixels = makePixels(state.width, state.height);
  const totalRows = Math.max(1, Math.ceil(bytes.length / rowBytes));
  const effectiveHeight = Math.min(state.height, totalRows);

  for (let rowIndex = 0; rowIndex < effectiveHeight; rowIndex += 1) {
    const rowStart = rowIndex * rowBytes;
    for (let byteIndex = 0; byteIndex < rowBytes; byteIndex += 1) {
      const value = bytes[rowStart + byteIndex] ?? 0;
      for (let bit = 0; bit < 8; bit += 1) {
        const x = byteIndex * 8 + bit;
        if (x >= state.width) continue;
        pixels[rowIndex][x] = Boolean(value & (1 << (7 - bit)));
      }
    }
  }

  state.pixels = pixels;
  renderEditor();
  renderPreview();
  refreshCode();
}

function imageToPixels(imageData, targetWidth, targetHeight, threshold) {
  const pixels = makePixels(targetWidth, targetHeight);
  
  for (let y = 0; y < targetHeight; y += 1) {
    for (let x = 0; x < targetWidth; x += 1) {
      // Map target pixel to source image coordinates
      const srcX = Math.floor((x / targetWidth) * imageData.width);
      const srcY = Math.floor((y / targetHeight) * imageData.height);
      
      // Get pixel data
      const index = (srcY * imageData.width + srcX) * 4;
      const r = imageData.data[index];
      const g = imageData.data[index + 1];
      const b = imageData.data[index + 2];
      
      // Convert to grayscale
      const gray = (r + g + b) / 3;
      
      // Threshold: pixel is "on" if darker than threshold
      pixels[y][x] = gray < threshold;
    }
  }
  
  return pixels;
}

function handleImageUpload(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      // Create a temporary canvas to get image data
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(img, 0, 0);
      
      state.importedImage = tempCtx.getImageData(0, 0, img.width, img.height);
      
      // Show import options
      importOptions.classList.remove('hidden');
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function applyImage() {
  if (!state.importedImage) return;
  
  const threshold = Number(thresholdInput.value);
  state.pixels = imageToPixels(state.importedImage, state.width, state.height, threshold);
  
  renderEditor();
  renderPreview();
  refreshCode();
  
  // Hide import options and reset file input
  importOptions.classList.add('hidden');
  imageImport.value = '';
}

function handleCanvasPointerDown(event) {
  state.isDragging = true;
  const cell = getMouseCell(event);
  const currentValue = state.pixels[cell.y][cell.x];

  if (state.tool === 'draw') {
    state.dragValue = true;
    state.pixels[cell.y][cell.x] = true;
  } else if (state.tool === 'erase') {
    state.dragValue = false;
    state.pixels[cell.y][cell.x] = false;
  } else if (state.tool === 'invert') {
    state.dragValue = !currentValue;
    state.pixels[cell.y][cell.x] = state.dragValue;
  }

  renderEditor();
  renderPreview();
  refreshCode();
}

function handleCanvasPointerMove(event) {
  if (!state.isDragging) return;
  const cell = getMouseCell(event);

  if (state.tool === 'draw') {
    state.pixels[cell.y][cell.x] = true;
  } else if (state.tool === 'erase') {
    state.pixels[cell.y][cell.x] = false;
  } else if (state.tool === 'invert') {
    state.pixels[cell.y][cell.x] = !state.pixels[cell.y][cell.x];
  }

  renderEditor();
  renderPreview();
  refreshCode();
}

function handleCanvasPointerUp() {
  state.isDragging = false;
}

resizeBtn.addEventListener('click', () => {
  const width = Number(widthInput.value);
  const height = Number(heightInput.value);
  setCanvasSize(width, height);
});

clearBtn.addEventListener('click', () => fillCanvas(false));
fillBtn.addEventListener('click', () => fillCanvas(true));

copyCodeBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(codeOutput.value);
    copyCodeBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyCodeBtn.textContent = 'Copy code';
    }, 1200);
  } catch (error) {
    console.error('Could not copy:', error);
  }
});

loadCodeBtn.addEventListener('click', () => {
  try {
    parseCodeIntoPixels(codeInput.value);
  } catch (error) {
    alert(error.message);
  }
});

previewCodeBtn.addEventListener('click', () => {
  try {
    const source = codeInput.value;
    const hexMatches = source.match(/0x[0-9A-Fa-f]+/g) || [];
    if (!hexMatches.length) throw new Error('No byte values found.');

    const bytes = hexMatches.map((value) => parseInt(value, 16));
    const widthFromCode = Number((source.match(/(?:width|W)\s*[:=]\s*(\d+)/i) || [])[1]) || state.width;
    const heightFromCode = Number((source.match(/(?:height|H)\s*[:=]\s*(\d+)/i) || [])[1]) || state.height;
    const rowBytes = Math.ceil(widthFromCode / 8);

    const previewPixels = makePixels(widthFromCode || state.width, heightFromCode || state.height || 1);
    const height = previewPixels.length;
    const width = previewPixels[0]?.length || 1;

    for (let rowIndex = 0; rowIndex < height; rowIndex += 1) {
      const rowStart = rowIndex * rowBytes;
      for (let byteIndex = 0; byteIndex < rowBytes; byteIndex += 1) {
        const value = bytes[rowStart + byteIndex] ?? 0;
        for (let bit = 0; bit < 8; bit += 1) {
          const x = byteIndex * 8 + bit;
          if (x >= width) continue;
          previewPixels[rowIndex][x] = Boolean(value & (1 << (7 - bit)));
        }
      }
    }

    state.pixels = previewPixels;
    renderEditor();
    renderPreview();
    refreshCode();
  } catch (error) {
    alert(error.message);
  }
});

loadSampleBtn.addEventListener('click', loadSample);

symbolNameInput.addEventListener('input', refreshCode);

imageImport.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleImageUpload(e.target.files[0]);
  }
});

applyImageBtn.addEventListener('click', applyImage);

thresholdInput.addEventListener('input', (e) => {
  thresholdValue.textContent = e.target.value;
});

canvas.addEventListener('pointerdown', handleCanvasPointerDown);
canvas.addEventListener('pointermove', handleCanvasPointerMove);
window.addEventListener('pointerup', handleCanvasPointerUp);
window.addEventListener('pointercancel', handleCanvasPointerUp);

for (const button of document.querySelectorAll('.tool-button')) {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tool-button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    state.tool = button.dataset.tool;
  });
}

// Add drag and drop support for image files
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  canvas.style.opacity = '0.7';
});

document.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  canvas.style.opacity = '1';
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  canvas.style.opacity = '1';
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleImageUpload(files[0]);
  }
});

setCanvasSize(16, 16);
loadSample();
