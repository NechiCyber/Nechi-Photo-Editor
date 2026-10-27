const fileInput = document.getElementById("fileInput");
const exportButton = document.getElementById("exportButton");
const chooseButton = document.getElementById("chooseButton");

const canvas = document.getElementById("photoCanvas");
const canvasWrapper = document.getElementById("canvasWrapper");
const ctx = canvas.getContext("2d");

const emptyState = document.getElementById("emptyState");
const dropZone = document.getElementById("dropZone");
const imageInfo = document.getElementById("imageInfo");
const imageDimensions = document.getElementById("imageDimensions");

const resetButton = document.getElementById("resetButton");
const brightnessSlider = document.getElementById("brightnessSlider");
const brightnessValue = document.getElementById("brightnessValue");
const filterSelect = document.getElementById("filterSelect");

const saturationSlider = document.getElementById("saturationSlider");
const saturationValue = document.getElementById("saturationValue");
const contrastSlider = document.getElementById("contrastSlider");
const contrastValue = document.getElementById("contrastValue");
const temperatureSlider = document.getElementById("temperatureSlider");
const temperatureValue = document.getElementById("temperatureValue");

const resizeWidth = document.getElementById("resizeWidth");
const resizeHeight = document.getElementById("resizeHeight");
const keepRatio = document.getElementById("keepRatio");
const applyResizeButton = document.getElementById("applyResizeButton");

const MIN_SIZE = 1;
const MAX_SIZE = 10000;

let originalImage = null;
let currentImageURL = null;
let outputWidth = 0;
let outputHeight = 0;
let displayScale = 1;
let dragState = null;

function openFilePicker() {
    fileInput.click();
}

chooseButton.addEventListener("click", openFilePicker);
exportButton.addEventListener("click", exportImage);

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) loadImage(file);
    fileInput.value = "";
});

function loadImage(file) {
    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!supportedTypes.includes(file.type)) {
        alert("Please choose a JPG, PNG or WebP image.");
        return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
        if (currentImageURL) URL.revokeObjectURL(currentImageURL);

        originalImage = image;
        currentImageURL = url;

        outputWidth = image.naturalWidth;
        outputHeight = image.naturalHeight;

        resetControls();
        resizeWidth.value = outputWidth;
        resizeHeight.value = outputHeight;

        // Keep a stable display scale during a drag. The canvas may grow
        // beyond the viewport; the viewport scrolls instead of hiding handles.
        const area = dropZone.getBoundingClientRect();
        const availableWidth = Math.max(100, area.width - 40);
        const availableHeight = Math.max(100, area.height - 40);
        displayScale = Math.min(
            availableWidth / outputWidth,
            availableHeight / outputHeight
        );

        canvasWrapper.hidden = false;
        emptyState.hidden = true;
        resetButton.disabled = false;

        imageInfo.textContent = file.name;
        renderImage();
        updateDimensionsText();
    };

    image.onerror = () => {
        URL.revokeObjectURL(url);
        alert("Could not load this image.");
    };

    image.src = url;
}

function resetControls() {
    brightnessSlider.value = 0;
    filterSelect.value = "none";
    saturationSlider.value = 100;
    contrastSlider.value = 100;
    temperatureSlider.value = 0;
}

function renderImage() {
    if (!originalImage) return;

    const brightness = Number(brightnessSlider.value);
    const brightnessFactor = 1 + brightness / 100;
    const saturation = Number(saturationSlider.value);
    const contrast = Number(contrastSlider.value);
    const temperature = Number(temperatureSlider.value);
    const filter = filterSelect.value;

    // Set the actual export dimensions. CSS dimensions are controlled separately.
    if (canvas.width !== outputWidth) canvas.width = outputWidth;
    if (canvas.height !== outputHeight) canvas.height = outputHeight;

    canvasWrapper.style.width = `${Math.max(1, outputWidth * displayScale)}px`;
    canvasWrapper.style.height = `${Math.max(1, outputHeight * displayScale)}px`;

    const selectedFilter = filter === "none" ? "" : ` ${filter}`;
    ctx.globalCompositeOperation = "source-over";
    ctx.filter =
        `brightness(${brightnessFactor})` +
        selectedFilter +
        ` saturate(${saturation}%) contrast(${contrast}%)`;

    ctx.clearRect(0, 0, outputWidth, outputHeight);
    ctx.drawImage(originalImage, 0, 0, outputWidth, outputHeight);
    ctx.filter = "none";

    if (temperature !== 0) {
        const strength = Math.abs(temperature) / 500;
        ctx.globalCompositeOperation = "soft-light";
        ctx.fillStyle = temperature > 0
            ? `rgba(255, 150, 50, ${strength})`
            : `rgba(60, 130, 255, ${strength})`;
        ctx.fillRect(0, 0, outputWidth, outputHeight);
        ctx.globalCompositeOperation = "source-over";
    }

    brightnessValue.textContent = brightness > 0 ? `+${brightness}` : `${brightness}`;
    saturationValue.textContent = `${saturation}%`;
    contrastValue.textContent = `${contrast}%`;
    temperatureValue.textContent = temperature > 0 ? `+${temperature}` : `${temperature}`;
}

function updateDimensionsText() {
    imageDimensions.textContent = `${outputWidth} × ${outputHeight} px`;
}

brightnessSlider.addEventListener("input", renderImage);
saturationSlider.addEventListener("input", renderImage);
contrastSlider.addEventListener("input", renderImage);
temperatureSlider.addEventListener("input", renderImage);
filterSelect.addEventListener("change", renderImage);

function updateHeightFromWidth() {
    if (!originalImage || !keepRatio.checked) return;
    const width = Number(resizeWidth.value);
    if (width > 0) {
        resizeHeight.value = Math.round(width * originalImage.naturalHeight / originalImage.naturalWidth);
    }
}

function updateWidthFromHeight() {
    if (!originalImage || !keepRatio.checked) return;
    const height = Number(resizeHeight.value);
    if (height > 0) {
        resizeWidth.value = Math.round(height * originalImage.naturalWidth / originalImage.naturalHeight);
    }
}

resizeWidth.addEventListener("input", updateHeightFromWidth);
resizeHeight.addEventListener("input", updateWidthFromHeight);

applyResizeButton.addEventListener("click", () => {
    if (!originalImage) {
        alert("Please open an image first.");
        return;
    }

    const width = Number(resizeWidth.value);
    const height = Number(resizeHeight.value);

    if (!Number.isInteger(width) || !Number.isInteger(height) ||
        width < MIN_SIZE || height < MIN_SIZE ||
        width > MAX_SIZE || height > MAX_SIZE) {
        alert("Width and height must be integers from 1 to 10000.");
        return;
    }

    outputWidth = width;
    outputHeight = height;
    renderImage();
    updateDimensionsText();
});

function exportImage() {
    if (!originalImage) {
        alert("Please open an image first.");
        return;
    }

    canvas.toBlob((blob) => {
        if (!blob) {
            alert("Could not export the image.");
            return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "nechi-photo.png";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
}

resetButton.addEventListener("click", () => {
    if (!originalImage) return;

    resetControls();
    outputWidth = originalImage.naturalWidth;
    outputHeight = originalImage.naturalHeight;
    resizeWidth.value = outputWidth;
    resizeHeight.value = outputHeight;

    const area = dropZone.getBoundingClientRect();
    displayScale = Math.min(
        Math.max(100, area.width - 40) / outputWidth,
        Math.max(100, area.height - 40) / outputHeight
    );

    renderImage();
    updateDimensionsText();
});

// Direct manipulation resize handles.
// All movement is calculated from the initial pointer position and initial
// canvas bounds, so the canvas changing size during a drag won't cause jumps.
canvasWrapper.querySelectorAll(".resize-handle").forEach((handle) => {
    handle.addEventListener("pointerdown", (event) => {
        if (!originalImage) return;
        event.preventDefault();

        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        dragState = {
            pointerId: event.pointerId,
            handle: handle.dataset.handle,
            startX: event.clientX,
            startY: event.clientY,
            startWidth: outputWidth,
            startHeight: outputHeight,
            startRectWidth: rect.width,
            startRectHeight: rect.height
        };

        canvasWrapper.classList.add("resizing");
        handle.setPointerCapture(event.pointerId);
    });
});

document.addEventListener("pointermove", (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    const d = dragState;
    const dx = (event.clientX - d.startX) * d.startWidth / d.startRectWidth;
    const dy = (event.clientY - d.startY) * d.startHeight / d.startRectHeight;
    const h = d.handle;

    let width = d.startWidth;
    let height = d.startHeight;

    if (h.includes("e")) width += dx;
    if (h.includes("w")) width -= dx;
    if (h.includes("s")) height += dy;
    if (h.includes("n")) height -= dy;

    const ratio = d.startWidth / d.startHeight;

    if (keepRatio.checked) {
        if (h.length === 2) {
            // Corners preserve the ratio using the dominant pointer movement.
            const widthFactor = width / d.startWidth;
            const heightFactor = height / d.startHeight;
            const factor = Math.abs(widthFactor - 1) >= Math.abs(heightFactor - 1)
                ? widthFactor : heightFactor;
            width = d.startWidth * factor;
            height = d.startHeight * factor;
        } else if (h === "e" || h === "w") {
            height = width / ratio;
        } else {
            width = height * ratio;
        }
    }

    width = Math.round(Math.max(MIN_SIZE, Math.min(MAX_SIZE, width)));
    height = Math.round(Math.max(MIN_SIZE, Math.min(MAX_SIZE, height)));

    if (keepRatio.checked) {
        if (h === "e" || h === "w") height = Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(width / ratio)));
        if (h === "n" || h === "s") width = Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.round(height * ratio)));
    }

    outputWidth = width;
    outputHeight = height;
    resizeWidth.value = width;
    resizeHeight.value = height;

    renderImage();
    updateDimensionsText();
});

function stopResize(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    dragState = null;
    canvasWrapper.classList.remove("resizing");
}
document.addEventListener("pointerup", stopResize);
document.addEventListener("pointercancel", stopResize);

dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("dragging");
});
dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragging");
});
dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragging");
    const file = event.dataTransfer.files[0];
    if (file) loadImage(file);
});

resetButton.disabled = true;
