const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
const heldKeys = {};
const viewChange = 10;
const startResolution = 2;
const fpsInterval = 1000 / 10;
const mouse = {
	isDown: false,
	isInside: false,
	x: 0, y: 0,
};

let then = 0;
let now, elapsed;
let pause = false;
let scale = 1;
let resolution = startResolution;
let xViewOffset = 0;
let yViewOffset = 0;
let lifeMap = {}; // For neighbor finding
let lifeIndices = []; // For Accessing all live cells

canvas.width = 600;
canvas.height = 600;

for (let j = 0; j < canvas.height / resolution; j++)
{
	for (let i = 0; i < canvas.width / resolution; i++)
	{
		if (Math.random() < .5)
		{
			lifeIndices.push([i, j]);
			if (!lifeMap[j]) lifeMap[j] = {};
			lifeMap[j][i] = true;
		}
	}
}

// Event listeners
document.addEventListener('mouseup', () => mouse.isDown = true);
canvas.addEventListener('mouseenter', () => mouse.isInside = true);
canvas.addEventListener('mouseleave', () => mouse.isInside = false);
canvas.addEventListener('mousemove', e =>
{
	mouse.x = e.pageX;
	mouse.y = e.pageY;
})

document.addEventListener('keydown', e =>
{
	if (e.key === ' ') pause = !pause;
	else heldKeys[e.key] = true;
});

document.addEventListener('keyup', e => heldKeys[e.key] = false);

// TODO: Make zooming center around cursor
canvas.addEventListener('wheel', e =>
{
	let newScale = scale + e.deltaY * -0.001;
	newScale = Math.min(Math.max(.2, newScale), 1);
	if (newScale === scale) return;
	scale = newScale;
	resolution = startResolution * scale;

	// center around cursor
	const mouseXPercent = (mouse.x / canvas.width) * 100;
	const mouseYPercent = (mouse.y / canvas.height) * 100;
	const dir = Math.sign(e.deltaY);
	xViewOffset += mouseXPercent * dir;
	yViewOffset += mouseYPercent * dir;
})

// Functions
function toggleCellState(i, j)
{
	if (!lifeMap[j]) lifeMap[j] = {};
	const mode = lifeMap[j][i];
	if (mode)
	{
		delete lifeMap[j][i];
		const index = lifeIndices.findIndex(([oi, oj]) => oi === i && oj === j);
		lifeIndices.splice(index, 1);
	}
	else
	{
		lifeMap[j][i] = true;
		lifeIndices.push([i, j]);
	}
}

function getCellNeighbors(i, j)
{
	const neighbors = [];
	const getObj = (iOffset, jOffset, state) => ({
		i: i + iOffset,
		j: j + jOffset,
		state: !!state,
	})

	for (const jOffset of [-1, 0, 1])
	{
		const row = lifeMap[j + jOffset]
		for (const iOffset of [-1, 0, 1])
		{
			if (!jOffset && !iOffset) continue;
			neighbors.push(
				getObj(iOffset, jOffset, row?.[i + iOffset])
			);
		}
	}

	return neighbors;
}

function updateLife()
{
	const swap = {};
	const swapIndices = [];
	const emptyCells = {};
	const emptyCellIndices = [];

	// Keep dead cells
	lifeIndices.forEach(([i, j]) =>
	{
		const neighbors = getCellNeighbors(i, j);
		const liveNeighbors = neighbors.reduce((a, c) => a + +c.state, 0);

		// Increment live neighbor count for dead cells
		neighbors.forEach(n =>
		{
			const { i, j } = n;
			if (n.state) return;
			if (!emptyCells[j]) emptyCells[j] = {};
			if (!emptyCells[j][i])
			{
				emptyCellIndices.push([i, j]);
				emptyCells[j][i] = 0;
			}

			emptyCells[j][i]++;
		})

		// Check if cell continues to next generation
		if (liveNeighbors < 2) return;
		if (liveNeighbors > 3) return;

		// Cell lives
		swapIndices.push([i, j]);
		if (!swap[j]) swap[j] = {};
		swap[j][i] = true;
	})

	// Create new cell
	emptyCellIndices.forEach(([i, j]) =>
	{
		const liveNeighborCount = emptyCells[j][i];
		if (liveNeighborCount !== 3) return;
		swapIndices.push([i, j]);
		if (!swap[j]) swap[j] = {};
		swap[j][i] = true;
	})

	lifeMap = swap;
	lifeIndices = swapIndices;
}

function loop(t)
{
	requestAnimationFrame(loop);
	now = t;
	elapsed = now - then;

	c.fillStyle = 'black';
	c.fillRect(0, 0, canvas.width, canvas.height);

	c.fillStyle = 'white';
	lifeIndices.forEach(([i, j]) =>
	{
		const x = i * resolution + xViewOffset;
		const y = j * resolution + yViewOffset;

		if (x > canvas.width || y > canvas.width
			|| x < -resolution || y < -resolution) return;

		c.fillRect(x, y, resolution, resolution);
	})

	if (mouse.isDown && mouse.isInside) toggleCellState(
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
