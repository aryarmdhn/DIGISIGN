const url = "/tes.pdf";
let doc;
let currentPage = 1;
let maxPage;
let konvaImages = {}; 

(async function () {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js";

    doc = await pdfjsLib.getDocument(url).promise;

    maxPage = doc._pdfInfo.numPages;

    await getPage(doc, currentPage);

    document.getElementById("pageNumber").innerHTML = `Page ${currentPage} of ${maxPage}`;

    document.getElementById("previous").addEventListener("click", async () => {
        if (currentPage > 1) {
            await getPage(doc, --currentPage);
            document.getElementById("pageNumber").innerHTML = `Page ${currentPage} of ${maxPage}`;
        }
    });

    document.getElementById("next").addEventListener("click", async () => {
        if (currentPage < maxPage) {
            await getPage(doc, ++currentPage);
            document.getElementById("pageNumber").innerHTML = `Page ${currentPage} of ${maxPage}`;
        }
    });

    document.getElementById('imageLoader').addEventListener('change', handleImage, false);
    document.getElementById('submit').addEventListener('click', submitImage);
    document.getElementById('download').addEventListener('click', downloadPDF);
})();

async function getPage(doc, pageNumber) {
    if (pageNumber >= 1 && pageNumber <= doc._pdfInfo.numPages) {
        const page = await doc.getPage(pageNumber);
        const scale = 1.5; 
        const viewport = page.getViewport({ scale: scale });
        const canvas = document.getElementById("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        setupKonva(canvas.width, canvas.height, pageNumber);
    } else {
        console.log("Please specify a valid page number");
    }
}

let stage, layer, konvaImage;

function setupKonva(width, height, pageNumber) {
    stage = new Konva.Stage({
        container: 'konva-container',
        width: width,
        height: height
    });

    layer = new Konva.Layer();
    stage.add(layer);

    if (konvaImages[pageNumber]) {
        konvaImages[pageNumber].forEach(img => {
            layer.add(img);
        });
    }
}

function handleImage(e) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
            konvaImage = new Konva.Image({
                image: img,
                x: 50,
                y: 50,
                width: 100,
                height: 100,
                draggable: true
            });

            konvaImage.on('dragmove', (evt) => {
                const { x, y } = evt.target.position();
                console.log('X:', x, 'Y:', y);
            });

            layer.add(konvaImage);

            const transformer = new Konva.Transformer({
                nodes: [konvaImage],
                enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center'],
                rotateEnabled: true,
            });
            layer.add(transformer);
            layer.draw();

            konvaImage.on('click', () => {
                layer.add(transformer);
                transformer.nodes([konvaImage]);
                layer.draw();
            });

            document.getElementById('submit').classList.remove('hidden');
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
}

function submitImage() {
    konvaImage.draggable(false); 
    konvaImage.off('click'); 
    const transformer = stage.findOne('Transformer');
    transformer.destroy();
    layer.draw();

    if (!konvaImages[currentPage]) {
        konvaImages[currentPage] = [];
    }
    konvaImages[currentPage].push(konvaImage);

    document.getElementById('submit').classList.add('hidden');
    document.getElementById('download').classList.remove('hidden');
}

async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [document.getElementById("canvas").width, document.getElementById("canvas").height]
    });

    for (let pageNumber = 1; pageNumber <= maxPage; pageNumber++) {
        await getPage(doc, pageNumber);

        const canvas = document.getElementById('canvas');
        const konvaCanvas = stage.toCanvas();

        const newCanvas = document.createElement('canvas');
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;
        const context = newCanvas.getContext('2d');

        context.drawImage(canvas, 0, 0);
        context.drawImage(konvaCanvas, 0, 0);

        const canvasData = newCanvas.toDataURL('image/jpeg', 1.0); 

        if (pageNumber > 1) {
            pdf.addPage([newCanvas.width, newCanvas.height]);
        }
        pdf.addImage(canvasData, 'JPEG', 0, 0, newCanvas.width, newCanvas.height);
    }

    pdf.save('new_pdf.pdf');
}
