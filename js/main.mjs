const shapes = document.querySelectorAll('[class*="shape-"]');
const positions = [
  { top: 20, left: 5 },
  { top: 40, left: 85 },
  { top: 30, left: 15 },
  { top: 50, left: 60 },
  { top: 80, left: 10 },
  { top: 90, left: 80 },
];

shapes.forEach((shape, index) => {
  const { top, left } = positions[index % positions.length];

  const randomTopOffset = Math.random() * 8 - 2;
  const randomLeftOffset = Math.random() * 8 - 2;

  const finalTop = top + randomTopOffset;
  const finalLeft = left + randomLeftOffset;

  const randomFontSize = (Math.random() * 3 + 1.5).toFixed(2);
  const randomOpacity = (Math.random() * 0.22 + 0.08).toFixed(2);
  const randomRotation = Math.floor(Math.random() * 90) - 45;
  const randomAnimationDuration = (Math.random() * 1 + 1.5).toFixed(2);

  shape.style.setProperty("--top", `${finalTop}%`);
  shape.style.setProperty("--left", `${finalLeft}%`);
  shape.style.setProperty("--font-size", `${randomFontSize}rem`);
  shape.style.setProperty("--opacity", randomOpacity);
  shape.style.setProperty("--transform", `rotate(${randomRotation}deg)`);
  shape.style.setProperty(
    "--animation-duration",
    `${randomAnimationDuration}s`,
  );
});
