function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
  });
}

function canvasToFile(canvas, fileName, mimeType, quality = 0.92) {
  const type = mimeType && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not process image'));
          return;
        }
        const name = fileName || 'image.jpg';
        resolve(new File([blob], name, { type: blob.type || type }));
      },
      type,
      quality
    );
  });
}

/**
 * Apply quarter-turn rotation and optional horizontal flip; returns original file if unchanged.
 */
export async function transformImageFile(file, { rotation = 0, flipHorizontal = false } = {}) {
  const normalized = ((Math.round(rotation) % 360) + 360) % 360;
  if (normalized === 0 && !flipHorizontal) {
    return file;
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const quarterTurns = normalized / 90;
    const swapSides = quarterTurns % 2 === 1;
    const canvas = document.createElement('canvas');
    canvas.width = swapSides ? img.height : img.width;
    canvas.height = swapSides ? img.width : img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not process image');
    }

    ctx.translate(canvas.width / 2, canvas.height / 2);
    if (flipHorizontal) {
      ctx.scale(-1, 1);
    }
    ctx.rotate((normalized * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    return await canvasToFile(canvas, file.name, file.type);
  } finally {
    URL.revokeObjectURL(url);
  }
}
