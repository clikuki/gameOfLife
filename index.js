const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

const resolution = 10;
const viewChange = 10;
let xViewOffset = 0;
let yViewOffset = 0;
canvas.width = 600;
canvas.height = 600;

const heldKeys = {};

document.addEventListener('keydown', e =>
{
	if (e.key === ' ') pause = !pause;
	else heldKeys[e.key] = true;
});

document.addEventListener('keyup', e => heldKeys[e.key] = false);

let lifeMap = {};
// let lifeMap = { 0: { 1: 1 }, 1: { 2: 1 }, 2: { 0: 1, 1: 1, 2: 1 } };
// for (let j = 0; j < canvas.height / resolution; j++)
// {
// 	for (let i = 0; i < canvas.width / resolution; i++)
// 	{
// 		if (Math.random() < .5)
// 		{
// 			if (!lifeMap[j]) lifeMap[j] = {};
// 			lifeMap[j][i] = 1;
// 		}
// 	}
// }

const mouse = {
	isDown: false,
	isInside: false,
	x: 0, y: 0,
};
document.addEventListener('mouseup', () => mouse.isDown = true);
canvas.addEventListener('mouseenter', () => mouse.isInside = true);
canvas.addEventListener('mouseleave', () => mouse.isInside = false);
canvas.addEventListener('mousemove', e =>
{
	mouse.x = e.pageX;
	mouse.y = e.pageY;
})

function toggleCell(x, y)
{
	if (!lifeMap[y]) lifeMap[y] = {};
	if (!lifeMap[y][x]) lifeMap[y][x] = 1;
	else delete lifeMap[y][x];
}

function getNeighbors(x, y, map)
{
	x = +x;
	y = +y;

	const neighbors = [];
	const getObj = (xOffset, yOffset, state) => ({
		x: x + xOffset,
		y: y + yOffset,
		state: state || 0,
	})

	for (const yOffset of [-1, 0, 1])
	{
		const row = map[y + yOffset]
		for (const xOffset of [-1, 0, 1])
		{
			if (yOffset === 0 && xOffset === 0) continue;
			const obj = getObj(xOffset, yOffset, row ? row[x + xOffset] : 0);
			neighbors.push(obj);
		}
	}

	return neighbors;
}

function updateLife()
{
	const swap = {};
	let emptyCells = [];

	Object.entries(lifeMap).forEach(([y, row]) =>
	{
		Object.keys(row).forEach((x) =>
		{
			const neighbors = getNeighbors(x, y, lifeMap);
			const liveNeighbors = neighbors.filter(({ state }) => state).length;

			for (const neighbor of neighbors)
			{
				if (!neighbor.state && !emptyCells.some(c => c[0] === x && c[1] === y))
					emptyCells.push([neighbor.x, neighbor.y])
			}

			// Rules
			if (liveNeighbors < 2) return;
			if (liveNeighbors > 3) return;

			// Create
			if (!swap[y]) swap[y] = {};
			swap[y][x] = 1;
		})
	})

	for (const [x, y] of emptyCells)
	{
		const neighbors = getNeighbors(x, y, lifeMap);
		const liveNeighbors = neighbors.filter(({ state }) => state).length;

		if (liveNeighbors === 3)
		{
			if (!swap[y]) swap[y] = {};
			swap[y][x] = 1;
		}
	}

	lifeMap = swap;
	return swap;
}

let pause = false;
const fpsInterval = 1000 / 10;
let then = 0;
let now, elapsed;
function loop(t)
{
	requestAnimationFrame(loop);
	now = t;
	elapsed = now - then;

	c.fillStyle = 'black';
	c.fillRect(0, 0, canvas.width, canvas.height);

	c.fillStyle = 'white';
	Object.entries(lifeMap).forEach(([j, row]) =>
	{
		Object.keys(row).forEach((i) =>
		{
			const x = +i * resolution + xViewOffset;
			const y = +j * resolution + yViewOffset;

			if (x + resolution > canvas.width || y + resolution > canvas.width || x < 0 || y < 0) return;

			c.fillRect(
				x, y, resolution, resolution
			);
		})
	})

	if (mouse.isDown && mouse.isInside) toggleCell(
		Math.floor((mouse.x - xViewOffset) / resolution),
		Math.floor((mouse.y - yViewOffset) / resolution),
	);
	mouse.isDown = false;

	if (heldKeys.ArrowUp || heldKeys.w) yViewOffset += viewChange;
	if (heldKeys.ArrowDown || heldKeys.s) yViewOffset -= viewChange;
	if (heldKeys.ArrowLeft || heldKeys.a) xViewOffset += viewChange;
	if (heldKeys.ArrowRight || heldKeys.d) xViewOffset -= viewChange;

	if (elapsed > fpsInterval)
	{
		then = now - (elapsed % fpsInterval);
		if (!pause) updateLife();
	}
}
loop();
