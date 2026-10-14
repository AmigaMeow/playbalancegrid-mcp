#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
const server = new Server({ name: "playbalancegrid-puzzle-tools", version: "1.0.0" }, { capabilities: { tools: {} } });
function generatePuzzle(size = 6) {
const grid = Array(size).fill().map(() => Array(size).fill(0));
function isValid(r, c, val) {
if (c >= 2 && grid[r][c-1] === val && grid[r][c-2] === val) return false;
if (r >= 2 && grid[r-1][c] === val && grid[r-2][c] === val) return false;
if (grid[r].filter(v => v === val).length >= size / 2) return false;
let colCount = 0;
for (let i = 0; i < size; i++) if (grid[i][c] === val) colCount++;
if (colCount >= size / 2) return false;
return true;
}
function solve(r, c) {
if (r === size) return true;
if (c === size) return solve(r + 1, 0);
const vals = Math.random() > 0.5 ? [0, 1] : [1, 0];
for (const v of vals) {
if (isValid(r, c, v)) { grid[r][c] = v; if (solve(r, c + 1)) return true; grid[r][c] = 0; }
}
return false;
}
solve(0, 0);
const solution = grid.map(row => [...row]);
const puzzle = grid.map(row => [...row]);
const cellsToRemove = Math.floor(size * size * 0.6);
const positions = [];
for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) positions.push([r, c]);
for (let i = positions.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [positions[i], positions[j]] = [positions[j], positions[i]]; }
for (let i = 0; i < cellsToRemove; i++) { const [r, c] = positions[i]; puzzle[r][c] = -1; }
return { puzzle, solution, size };
}
function validateSolution(grid) {
const size = grid.length;
const errors = [];
for (let r = 0; r < size; r++) {
let zeros = 0, ones = 0;
for (let c = 0; c < size; c++) {
if (grid[r][c] === 0) zeros++; else if (grid[r][c] === 1) ones++;
if (c >= 2 && grid[r][c] === grid[r][c-1] && grid[r][c] === grid[r][c-2]) errors.push(Row ${r+1}: three consecutive ${grid[r][c]}s);
}
if (zeros !== size / 2 || ones !== size / 2) errors.push(Row ${r+1}: must have ${size/2} zeros and ${size/2} ones);
}
for (let c = 0; c < size; c++) {
let zeros = 0, ones = 0;
for (let r = 0; r < size; r++) {
if (grid[r][c] === 0) zeros++; else if (grid[r][c] === 1) ones++;
if (r >= 2 && grid[r][c] === grid[r-1][c] && grid[r][c] === grid[r-2][c]) errors.push(Column ${c+1}: three consecutive ${grid[r][c]}s);
}
if (zeros !== size / 2 || ones !== size / 2) errors.push(Column ${c+1}: must have ${size/2} zeros and ${size/2} ones);
}
for (let i = 0; i < size; i++) for (let j = i + 1; j < size; j++) {
if (grid[i].join("") === grid[j].join("")) errors.push(Rows ${i+1} and ${j+1} are identical);
const colI = grid.map(row => row[i]).join(""); const colJ = grid.map(row => row[j]).join("");
if (colI === colJ) errors.push(Columns ${i+1} and ${j+1} are identical);
}
return { valid: errors.length === 0, errors };
}
server.setRequestHandler(ListToolsRequestSchema, async () => ({
tools: [
{ name: "generate_puzzle", description: "Generate a Takuzu/Binairo puzzle. Returns puzzle grid (-1 = empty) and solution.", inputSchema: { type: "object", properties: { size: { type: "number", description: "Grid size (6, 8, or 10)", default: 6 } } } },
{ name: "validate_solution", description: "Validate a Takuzu solution. Checks all rules.", inputSchema: { type: "object", properties: { grid: { type: "array", description: "2D array of 0s and 1s", items: { type: "array", items: { type: "number" } } } }, required: ["grid"] } },
{ name: "get_puzzle_hint", description: "Get a hint for a Takuzu puzzle.", inputSchema: { type: "object", properties: { grid: { type: "array", description: "Current puzzle grid (-1 = empty)", items: { type: "array", items: { type: "number" } } } }, required: ["grid"] } },
],
}));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
const { name, arguments: args } = req.params;
if (name === "generate_puzzle") return { content: [{ type: "text", text: JSON.stringify(generatePuzzle(args.size || 6), null, 2) }] };
if (name === "validate_solution") return { content: [{ type: "text", text: JSON.stringify(validateSolution(args.grid), null, 2) }] };
if (name === "get_puzzle_hint") {
const grid = args.grid; const size = grid.length;
for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
if (grid[r][c] === -1) {
if (c >= 2 && grid[r][c-1] === 1 && grid[r][c-2] === 1) return { content: [{ type: "text", text: JSON.stringify({ row: r, col: c, value: 0, reason: "Avoids three 1s in a row" }) }] };
if (c >= 2 && grid[r][c-1] === 0 && grid[r][c-2] === 0) return { content: [{ type: "text", text: JSON.stringify({ row: r, col: c, value: 1, reason: "Avoids three 0s in a row" }) }] };
if (r >= 2 && grid[r-1][c] === 1 && grid[r-2][c] === 1) return { content: [{ type: "text", text: JSON.stringify({ row: r, col: c, value: 0, reason: "Avoids three 1s in a column" }) }] };
if (r >= 2 && grid[r-1][c] === 0 && grid[r-2][c] === 0) return { content: [{ type: "text", text: JSON.stringify({ row: r, col: c, value: 1, reason: "Avoids three 0s in a column" }) }] };
}
}
return { content: [{ type: "text", text: JSON.stringify({ hint: "No forced move found." }) }] };
}
throw new Error(Unknown tool: ${name});
});
const transport = new StdioServerTransport();
await server.connect(transport);
