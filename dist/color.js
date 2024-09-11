"use strict";
const COLORS = [
  "#1abc9c",
  "#16a085", //teal
  "#2ecc71",
  "#27ae60", //green
  "#3498db",
  "#2980b9", //light blue
  "#9b59b6",
  "#8e44ad", //lilac
  "#f1c40f",
  "#f39c12", //yellow
  "#e67e22",
  "#d35400", //orange
  "#e74c3c",
  "#c0392b", //red
  "#ecf0f1",
  "#bdc3c7", //light gray
  "#95a5a6",
  "#7f8c8d", //darker gray
];
let unPickedColors = [];
for (let i = 0; i < COLORS.length / 2; i++) {
  unPickedColors.push(i);
}
const pickedColors = new Set();
function selectColors() {
  let index = unPickedColors[Math.floor(Math.random() * unPickedColors.length)];
  pickedColors.add(index);
  unPickedColors = unPickedColors.filter((clr) => {
    return !pickedColors.has(clr);
  });
  const ret = [COLORS[index * 2], COLORS[index * 2 + 1]];
  return ret;
}
//# sourceMappingURL=../src/dist/color.js.map
