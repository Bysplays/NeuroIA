/** Run in a browser module with a decoded HTMLImageElement. No pixels are modified.
 * Finds transparent gutters near the requested grid and measures each sprite.
 * Review a labelled contact sheet before accepting the returned boxes.
 */
export function measureAtlas(image, columns = 4, rows = 4) {
  const width = image.naturalWidth, height = image.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, width, height).data;
  const opaque = (x, y) => pixels[(y * width + x) * 4 + 3] > 32;
  const split = (size, count, score) => {
    const edges = [0];
    for (let n = 1; n < count; n++) {
      let best = Infinity, position = n * size / count;
      for (let i = Math.floor((n - .17) * size / count); i < Math.ceil((n + .17) * size / count); i++) {
        const value = score(i) + Math.abs(i - n * size / count) * .001;
        if (value < best) { best = value; position = i; }
      }
      edges.push(position);
    }
    return [...edges, size];
  };
  const ys = split(height, rows, y => {
    let count = 0;
    for (let x = 0; x < width; x++) count += opaque(x, y);
    return count;
  });
  const boxes = [];
  for (let row = 0; row < rows; row++) {
    const xs = split(width, columns, x => {
      let count = 0;
      for (let y = ys[row]; y < ys[row + 1]; y++) count += opaque(x, y);
      return count;
    });
    for (let col = 0; col < columns; col++) {
      let left = width, top = height, right = -1, bottom = -1;
      for (let y = ys[row]; y < ys[row + 1]; y++) {
        for (let x = xs[col]; x < xs[col + 1]; x++) {
          if (!opaque(x, y)) continue;
          left = Math.min(left, x); right = Math.max(right, x);
          top = Math.min(top, y); bottom = Math.max(bottom, y);
        }
      }
      if (right < left) throw new Error(`Empty sprite at row ${row}, column ${col}`);
      // Retain antialiasing around the measured silhouette without crossing gutters.
      left = Math.max(xs[col], left - 2); top = Math.max(ys[row], top - 2);
      right = Math.min(xs[col + 1] - 1, right + 2); bottom = Math.min(ys[row + 1] - 1, bottom + 2);
      boxes.push({ x: left, y: top, width: right - left + 1, height: bottom - top + 1 });
    }
  }
  return { width, height, boxes };
}
