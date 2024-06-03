const nameInput = document.getElementById("nameInput");
const signatureContainer = document.getElementById("signatureContainer");
const signatureCanvas = document.getElementById("signatureCanvas");
const ctx = signatureCanvas.getContext("2d");
const clearButton = document.getElementById("clearButton");
const typeContainer = document.getElementById("typeContainer");
const drawContainer = document.getElementById("drawContainer");
const modeRadios = document.querySelectorAll('input[name="mode"]');

const fonts = ["Allura", "Brush Script MT", "Dancing Script", "Sacramento"];

let isDrawing = false;
let lastX = 0;
let lastY = 0;

function generateSignatures(name) {
  signatureContainer.innerHTML = "";
  fonts.forEach((font) => {
    const canvasContainer = document.createElement("div");
    canvasContainer.classList.add("canvas-container", "mx-2");

    const canvas = document.createElement("canvas");
    canvas.width = 225;
    canvas.height = 100;
    const ctx = canvas.getContext("2d");
    ctx.font = `30px ${font}`;

    const words = name.split(" ");
    const lines = [];
    let currentLine = "";
    for (const word of words) {
      const potentialLine = currentLine ? `${currentLine} ${word}` : word;
      if (potentialLine.length > 15) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = potentialLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    let y = 50;
    for (const line of lines) {
      ctx.fillText(line, 10, y);
      y += 30;
    }

    const downloadContainer = document.createElement("div");
    downloadContainer.classList.add("download-container", "mt-4");

    const pngButton = document.createElement("a");
    pngButton.classList.add("btn", "btn-primary", "mr-2");
    pngButton.textContent = "Download";
    pngButton.download = `tanda-tangan.png`;
    pngButton.href = canvas.toDataURL("image/png");
    pngButton.addEventListener("click", confirmDownload);

    const svgButton = document.createElement("a");
    svgButton.classList.add("btn", "btn-secondary");
    svgButton.textContent = "Download SVG";
    svgButton.download = `tanda-tangan.svg`;
    svgButton.href = `data:image/svg+xml;base64,${btoa(canvas.toDataURL("image/svg+xml"))}`;
    svgButton.addEventListener("click", confirmDownload);

    downloadContainer.appendChild(pngButton);
    // downloadContainer.appendChild(svgButton);

    canvasContainer.appendChild(canvas);
    canvasContainer.appendChild(downloadContainer);
    signatureContainer.appendChild(canvasContainer);
  });
}

nameInput.addEventListener("input", () => {
  const name = nameInput.value.trim();
  if (name) {
    generateSignatures(name);
  } else {
    while (signatureContainer.firstChild) {
      signatureContainer.removeChild(signatureContainer.firstChild);
    }
  }
});

function startDrawing(e) {
  isDrawing = true;
  [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
  if (!isDrawing) return;

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
  [lastX, lastY] = [e.offsetX, e.offsetY];
}

function stopDrawing() {
  isDrawing = false;
}

signatureCanvas.addEventListener("mousedown", startDrawing);
signatureCanvas.addEventListener("mousemove", draw);
signatureCanvas.addEventListener("mouseup", stopDrawing);
signatureCanvas.addEventListener("mouseout", stopDrawing);

clearButton.addEventListener("click", () => {
  ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
});

modeRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    if (radio.value === "type") {
      typeContainer.style.display = "block";
      drawContainer.style.display = "none";
    } else {
      typeContainer.style.display = "none";
      drawContainer.style.display = "block";
    }
  });
});

function confirmDownload(event) {
  if (window.confirm("Apakah Anda yakin ingin mengunduh file ini?")) {
    window.location.href = event.currentTarget.href;
  } else {
    event.preventDefault();
  }
}