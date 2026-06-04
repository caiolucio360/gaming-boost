const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '..', 'public', 'flautas', 'flautasboost-empilhada.png');
const outputPath = path.join(__dirname, '..', 'public', 'flautas', 'flautasboost-empilhada-cropped.png');

async function cropImage() {
  try {
    console.log('Cortando sobras da imagem...');
    await sharp(inputPath)
      .trim() // Corta pixels transparentes das bordas
      .toFile(outputPath);
    console.log('Imagem cortada com sucesso: ' + outputPath);
  } catch (error) {
    console.error('Erro ao cortar a imagem:', error);
  }
}

cropImage();
