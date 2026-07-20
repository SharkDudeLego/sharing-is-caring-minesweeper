const body = document.body;
const game = document.getElementById("game")
const dataElement = document.getElementById("game_data")

const set_width = document.getElementById("set_width")
const set_height = document.getElementById("set_height")
const set_mines = document.getElementById("set_mines")

const directions = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]
const numberColors = {
    0: "olive",
    1: "blue",
    2: "green",
    3: "red",
    4: "darkblue",
    5: "maroon",
    6: "darkcyan",
    7: "black",
    8: "gray"
}

let board = {}
let firstClick = true
let mineCount = 0;
let flagged = 0;
let interactable = true
let tilesLeft = 0;
let boardElement = null;

let setWidth = 9;
let setHeight = 9;
let setMines = 10;

function updateData() {
    dataElement.textContent = tilesLeft+" (?) | "+(mineCount-flagged)+"/"+mineCount+" (⚐)"
}

function win() {
    interactable = false

    for (const tilePos of Object.keys(board)) {
        const tile = board[tilePos]

        tile.element.classList.add("revealed")
        if (tile.mine) {
            tile.element.classList.add("sweeped")
        }
    }
}

function lose() {
    interactable = false

    for (const tilePos of Object.keys(board)) {
        const tile = board[tilePos]

        tile.element.classList.add("revealed")
        if (tile.mine) {
            tile.element.classList.add("mine")
        } else {
            let neighborCount = tile.neighborMines

            if (tile.nextToMine) {
                board[tilePos].element.style.color = numberColors[neighborCount]
                board[tilePos].element.textContent = neighborCount
            } else if (!tile.mine) {
                board[tilePos].element.textContent = ""
            }
        }
    }
}

function revealTile(position) {
    const tile = board[position]
    if (tile.mine) {
        lose()
    } else if (!tile.revealed) {
        tile.revealed = true;
        tile.element.classList.add("revealed");

        if (tile.flagged) {
            board[position].flagged = false
            board[position].element.textContent = ""
            flagged-=1
        }

        let neighborCount = tile.neighborMines

        if (tile.nextToMine) {
            board[position].element.style.color = numberColors[neighborCount]
            board[position].element.textContent = neighborCount
        } else if (!tile.mine) {
            board[position].element.textContent = ""
        }

        tilesLeft-=1;
        updateData();
        if (tilesLeft == 0) {
            win();
        } else if (neighborCount == 0) {
            for (const dir of directions) {
                let tilePos = tile.position.map((number,index) => number + dir[index])
                if (tilePos in board) {
                    revealTile(tilePos)
                }
            }
        }
    }
}

function flagTile(event,position) {
    if (interactable) {
        event.preventDefault();
        if (!board[position].revealed) {
            board[position].flagged = !board[position].flagged
            if (board[position].flagged) {
                board[position].element.classList.add("flagged")
                board[position].element.textContent = "\u2690"
                flagged+=1
            } else {
                board[position].element.classList.remove("flagged")
                board[position].element.textContent = ""
                flagged-=1
            }
            updateData();
        }
    }
}

function clickTile(position) {
    if (interactable && !board[position].flagged) {
        if (firstClick) {
            firstClick = false

            let minePlacements = []

            for (const countPos of Object.keys(board)) {
                if (countPos != position) {
                    minePlacements.push(countPos)
                }
            }

            for (let m = mineCount; m > 0; m--) {
                const randomIndex = Math.floor(Math.random()*minePlacements.length)
                const randomPos = minePlacements.splice(randomIndex,1)[0]
                board[randomPos].mine = true
            }

            for (const tilePos of Object.keys(board)) {
                const tile = board[tilePos]
                if (!tile.mine) {
                    let count = 0;

                    let nearbyPositions = []
                    let recorded = []

                    for (const dir of directions) {
                        let tilePos = tile.position.map((number,index) => number + dir[index])
                        if (tilePos in board) {
                            nearbyPositions.push(tilePos)
                        }
                    }

                    for (const near of nearbyPositions) {
                        if (board[near].mine) {
                            board[tilePos].nextToMine = true
                            for (const dir of directions) {
                                let tilePos = near.map((number,index) => number + dir[index])
                                if (tilePos in board && !board[tilePos].mine && (nearbyPositions.some(tileCheck => tileCheck[0] == tilePos[0] && tileCheck[1] == tilePos[1])) && (!recorded.some(tileCheck => tileCheck[0] == tilePos[0] && tileCheck[1] == tilePos[1]))) {
                                    recorded.push(tilePos)
                                    count+=1;
                                }
                            }
                        }
                    }
                    
                    board[tilePos].neighborMines = count
                }
            }
        }

        if (!board[position].revealed) {
            revealTile(position)
        }
    }
}

function generateBoard(width,height,mines) {
    if (boardElement != null) {
        boardElement.remove()
    }
    
    board = {}

    mineCount = Math.min(mines,(width*height)-1)
    firstClick = true
    interactable = true
    tilesLeft = (width*height)-mineCount
    flagged = 0;

    boardElement = document.createElement("div");
    boardElement.classList.add("board");
    boardElement.style.gridTemplateRows = "repeat("+width+", 32px)";
    boardElement.style.gridTemplateColumns = "repeat("+height+", 32px)";

    for (let r = 0; r < width; r++) {
        for (let c = 0; c < height; c++) {
            const cell = document.createElement("div")
            cell.classList.add("cell")

            const positionArray = [r,c]
            board[positionArray] = {
                position: positionArray,
                mine: false,
                flagged: false,
                revealed: false,
                neighborMines: 0,
                nextToMine: false,
                element: cell
            }

            cell.addEventListener("click",() => clickTile(positionArray))
            cell.addEventListener("contextmenu",(event) => flagTile(event,positionArray))

            boardElement.appendChild(cell)
        }
    }

    updateData();

    game.appendChild(boardElement);
}

function restart() {
    generateBoard(setWidth,setHeight,setMines);
};

function updateValues(width,height,mines) {
    setWidth = height || set_height.value
    setHeight = width || set_width.value
    setMines = mines || set_mines.value
    set_height.value = setWidth
    set_width.value = setHeight
    set_mines.value = setMines
    generateBoard(setWidth,setHeight,setMines);
}

generateBoard(setWidth,setHeight,setMines);