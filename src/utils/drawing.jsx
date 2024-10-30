export const drawDetections = (predictions, ctx) => {
  predictions.forEach(prediction => {
    // Get prediction results
    const [x, y, width, height] = prediction.bbox;
    const text = `${prediction.class} ${Math.round(prediction.score * 100)}%`;

    // Set styling
    const color = '#00FFFF';
    ctx.strokeStyle = color;
    ctx.font = '18px Arial';
    ctx.fillStyle = color;

    // Draw bounding box
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.stroke();

    // Draw label background
    ctx.fillStyle = color;
    const textWidth = ctx.measureText(text).width;
    ctx.fillRect(x, y, textWidth + 10, 25);

    // Draw label text
    ctx.fillStyle = '#000000';
    ctx.fillText(text, x, y + 18);
  });
};