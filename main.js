"use strict";
const bgImage = document.getElementById("bgImage"), drillImage = document.getElementById("drillImage"), pumpImage = document.getElementById("pumpImage"), planet = document.getElementById("planet"), miningTable = document.getElementById("miningTable"), comms = document.getElementById("comms"), planetName = document.getElementById("planetName"), shipContainer = document.getElementById("shipContainer"), upgradeTables = {
    ship: document.getElementById("shipUpgradeTable"),
    pump: document.getElementById("pumpUpgradeTable"),
    tool: document.getElementById("toolUpgradeTable"),
    drill: document.getElementById("drillUpgradeTable")
}, resourceElements = {
    counts: {
        iron: document.getElementById("ironCount"),
        copper: document.getElementById("copperCount"),
        aluminum: document.getElementById("aluminumCount"),
        lead: document.getElementById("leadCount"),
        titanium: document.getElementById("titaniumCount")
    },
    perSecond: {
        iron: document.getElementById("ironPs"),
        copper: document.getElementById("copperPs"),
        aluminum: document.getElementById("aluminumPs"),
        lead: document.getElementById("leadPs"),
        titanium: document.getElementById("titaniumPs")
    }
};
const planetNameSegments = {
    start: ["Zubr", "Avi", "Heso", "Hal", "Hea", "Pio", "Druc", "Llaz", "Fenr", "Xant", "Kryst", "Nym", "Zephyr", "Eldr", "Myst", "Vent", "Gor", "Kel", "Tyr", "Gryf", "Jyn", "Kron", "Vyr", "Ryn", "Lyr", "Cyr", "Syr", "Hyr", "Myyr", "Fyr", "Vyrn", "Cycl", "Kyn", "Jyr", "Wyr", "Zyr", "Ilin", "Alin", "Ethon", "Zyx", "Pix", "Zelr", "Abr", "Havir", "Hil", "Heli", "Pyr", "Dryl", "Lysz", "Fyrn", "Xar", "Kryl", "Nyl", "Zelph", "Eldyn", "Myzt", "Vyrn", "Gyr", "Kyl", "Tyl", "Gryl", "Jyl", "Kryl"],
    middle: ["iun", "arut", "sie", "nad", "wei", "vis", "itov", "eth", "ora", "ion", "aria", "ael", "aril", "ith", "osar", "ath", "ion", "iam", "iria", "iael", "ina", "orio", "oria", "ila", "ira", "ixu", "ily", "axy", "axi", "axo"],
    end: ["ia", "a", "o", "e", "u", "i", "is", "es", "us", "os", "ys", "ysus", "ax", "ion", "el", "ar", "er", "ir", "yr", "or", "ur", "esir", "ios", "ius", "ois", "ysa", "ora", "ese", "asi", "asi", "oxi", "oxa", "oxo", "axin", "arin", "elia", "eal", "ifia", "th", "arn", "ry"]
};
class Game {
    constructor() {
        this.fps = 30;
        this.resources = {
            iron: 0,
            copper: 0,
            aluminum: 0,
            lead: 0,
            titanium: 0,
            fuel: 0
        };
        this.mineralsPs = 0;
        this.fuelPs = 0;
        this.fuelRequirement = 200;
        this.bgRotation = 0;
        this.miningGrid = [];
        this.commsTextElements = [];
        this.queuedCommsText = [];
        this.commsBlinkShown = false;
        this.commsBlinkTimer = 15;
        this.upgrades = [
            new Upgrade(upgradeTables.drill, "🔋", "Lithium Batteries", "Oh, this thing turns on now?<br>[+1.0 minerals/sec]", 0, { iron: 100, copper: 1 }, () => {
                this.mineralsPs += 1;
                new CommsText("You have increased your mining rate by 1 per second.");
            }),
            new Upgrade(upgradeTables.drill, "🌀", "Faster Spinning", "A bit of added efficiency.<br>[+10.0 minerals/sec]", 0, { iron: 1000, copper: 25 }, () => {
                this.mineralsPs += 10;
                new CommsText("You have increased your mining rate by 10 per second.");
            }),
            new Upgrade(upgradeTables.drill, "🗡️", "Sharper Tip", "Should make digging through tough rocks easier.<br>[+50.0 minerals/sec]", 0, { iron: 7500, copper: 150, aluminum: 20 }, () => {
                this.mineralsPs += 50;
                new CommsText("You have increased your mining rate by 50 per second.");
            })
        ];
        this.currentPlanet = new Planet();
        for (let i = 0; i < 4; i++) {
            let thisRow = miningTable.insertRow();
            this.miningGrid[i] = [];
            for (let j = 0; j < 5; j++) {
                this.miningGrid[i][j] = thisRow.insertCell();
                this.miningGrid[i][j].onclick = null;
            }
        }
        document.querySelectorAll("img").forEach((img) => {
            img.setAttribute("draggable", "false");
        });
        let commsFirst = document.createElement("p");
        commsFirst.innerText = ">";
        comms.appendChild(commsFirst);
        this.commsTextElements.push(commsFirst);
        comms.scrollTop = comms.scrollHeight;
    }
    Logic() {
        for (let resource in this.resources) {
            if (resource != "fuel") {
                this.resources[resource] += (this.currentPlanet.lootTable[resource] * this.mineralsPs) / this.fps;
            }
            else {
                this.resources.fuel += this.fuelPs / this.fps;
            }
        }
    }
    Render() {
        bgImage.style.width = Math.sqrt(Math.pow((window.innerWidth / 2), 2) + Math.pow(window.innerHeight, 2)) * 2 + "px";
        bgImage.style.height = Math.sqrt(Math.pow((window.innerWidth / 2), 2) + Math.pow(window.innerHeight, 2)) * 2 + "px";
        this.bgRotation += 0.015;
        bgImage.style.transform = "translate(-50%, -50%) rotate(" + this.bgRotation + "deg)";
        for (let resource in this.resources) {
            if (resource == "fuel") {
                shipContainer.style.backgroundPositionY = Math.max(0, (1 - this.resources.fuel / this.fuelRequirement) * shipContainer.clientHeight) - shipContainer.clientHeight * 0.084 + "px";
                if (this.resources.fuel >= this.fuelRequirement) {
                    shipContainer.classList.add("completeFuel");
                }
                else {
                    shipContainer.classList.remove("completeFuel");
                }
            }
            else {
                resourceElements.counts[resource].innerText = numFormat(this.resources[resource]);
                resourceElements.perSecond[resource].innerText = numFormat(this.currentPlanet.lootTable[resource] * this.mineralsPs) + "/s";
            }
        }
        if (this.queuedCommsText.length > 0) {
            if (this.queuedCommsText[0].textElement == null) {
                this.queuedCommsText[0].AddElement(this.commsTextElements[this.commsTextElements.length - 1]);
            }
            this.queuedCommsText[0].Render();
            if (this.queuedCommsText[0].complete) {
                let nextElement = document.createElement("p");
                nextElement.innerText = ">";
                comms.appendChild(nextElement);
                this.commsTextElements.push(nextElement);
                this.queuedCommsText.shift();
            }
            comms.scrollTop = comms.scrollHeight;
        }
        else {
            let update = false;
            if (this.commsBlinkTimer > 0) {
                this.commsBlinkTimer--;
            }
            else {
                this.commsBlinkTimer = 15;
                this.commsBlinkShown = !this.commsBlinkShown;
                update = true;
            }
            if (update) {
                if (this.commsBlinkShown) {
                    this.commsTextElements[this.commsTextElements.length - 1].innerText = "> _";
                }
                else {
                    this.commsTextElements[this.commsTextElements.length - 1].innerText = ">";
                }
            }
        }
    }
    ChooseMineral(chances) {
        let total = 0;
        for (let mineral in chances) {
            total += chances[mineral];
        }
        let rand = Math.random() * total;
        for (let mineral in chances) {
            rand -= chances[mineral];
            if (rand < 0) {
                return mineral;
            }
        }
        return "iron";
    }
    Loop() {
        this.Logic();
        this.Render();
    }
    Start() {
        planetName.innerText = this.currentPlanet.name;
        for (let upgrade of this.upgrades) {
            upgrade.Register();
        }
        this.Render();
        setInterval(this.Loop.bind(this), 1000 / this.fps);
    }
}
class Upgrade {
    constructor(table, icon, name, desc, owned, costs, effect) {
        this.owned = 0;
        this.costs = {
            iron: 0,
            copper: 0,
            aluminum: 0,
            lead: 0,
            titanium: 0,
            fuel: 0
        };
        this.table = table;
        this.icon = icon;
        this.name = name;
        this.desc = desc;
        this.owned = owned;
        for (let resource in costs) {
            this.costs[resource] = costs[resource];
        }
        this.effect = effect;
    }
    Register() {
        let upgradeRow = this.table.insertRow();
        let iconCell = upgradeRow.insertCell(), nameCell = upgradeRow.insertCell(), descCell = upgradeRow.insertCell(), costCell = upgradeRow.insertCell(), ownedCell = upgradeRow.insertCell();
        iconCell.classList.add("upgradeTableIcon");
        nameCell.classList.add("upgradeTableName");
        descCell.classList.add("upgradeTableDesc");
        costCell.classList.add("upgradeTableCost");
        ownedCell.classList.add("upgradeTableOwned");
        iconCell.innerHTML = this.icon;
        nameCell.innerHTML = this.name;
        descCell.innerHTML = this.desc;
        ownedCell.innerHTML = "x" + this.owned;
        let needLineBreak = false;
        for (let resource in this.costs) {
            if (this.costs[resource] !== 0) {
                if (needLineBreak) {
                    costCell.innerHTML += "<br>";
                }
                else {
                    needLineBreak = true;
                }
                costCell.innerHTML += resource + ": " + numFormat(this.costs[resource]);
            }
        }
        upgradeRow.addEventListener("click", this.Buy.bind(this));
    }
    Buy() {
        for (let resource in this.costs) {
            if (game.resources[resource] < this.costs[resource]) {
                return;
            }
        }
        for (let resource in this.costs) {
            game.resources[resource] -= this.costs[resource];
        }
        this.owned++;
        this.effect();
    }
}
class Planet {
    constructor(name, lootTable) {
        if (name == undefined) {
            let start = "", end = "";
            if (Math.random() < 0.5) {
                while (start == "" || start.charAt(start.length - 1) == end.charAt(0)) {
                    start = planetNameSegments.start[Math.floor(Math.random() * planetNameSegments.start.length)];
                    end = planetNameSegments.end[Math.floor(Math.random() * planetNameSegments.end.length)];
                }
                this.name = start + end;
            }
            else {
                let middle = "";
                while (start == "" || start.charAt(start.length - 1) == middle.charAt(0) || middle.charAt(middle.length - 1) == end.charAt(0)) {
                    start = planetNameSegments.start[Math.floor(Math.random() * planetNameSegments.start.length)];
                    middle = planetNameSegments.middle[Math.floor(Math.random() * planetNameSegments.middle.length)];
                    end = planetNameSegments.end[Math.floor(Math.random() * planetNameSegments.end.length)];
                }
                this.name = start + middle + end;
            }
        }
        else {
            this.name = name;
        }
        if (lootTable == undefined) {
            this.lootTable = {
                iron: 0,
                copper: 0,
                aluminum: 0,
                lead: 0,
                titanium: 0
            };
            const resources = Object.keys(this.lootTable);
            const abundant = resources[Math.floor(Math.random() * resources.length)];
            this.lootTable[abundant] = Math.random() * 0.3 + 0.6;
            let sum = 0;
            resources.forEach((resource) => {
                if (resource !== abundant) {
                    let chosen = Math.random() * 5 + 3;
                    sum += chosen;
                    this.lootTable[resource] = chosen;
                }
            });
            let remaining = 1 - this.lootTable[abundant];
            resources.forEach((resource) => {
                if (resource !== abundant) {
                    this.lootTable[resource] = (this.lootTable[resource] / sum) * remaining;
                }
            });
        }
        else {
            this.lootTable = lootTable;
        }
    }
}
class CommsText {
    constructor(text) {
        this.textElement = null;
        this.complete = false;
        this.prefixSpace = true;
        this.pauseFrames = 0;
        this.textRemaining = text;
        game.queuedCommsText.push(this);
    }
    AddElement(element) {
        this.textElement = element;
        this.textElement.innerText = ">";
    }
    Render() {
        if (this.textElement == null) {
            console.error("Text element not yet created for comms text");
            return;
        }
        if (this.pauseFrames > 0) {
            this.pauseFrames--;
            return;
        }
        if (this.textRemaining.length > 0) {
            if (this.textRemaining[0] == " ") {
                this.prefixSpace = true;
                this.textRemaining = this.textRemaining.slice(1);
                return;
            }
            let toWrite = "";
            if (this.prefixSpace) {
                toWrite = " ";
                this.prefixSpace = false;
            }
            toWrite += this.textRemaining[0];
            this.textElement.innerText += toWrite;
            if (this.textRemaining[0] == ".") {
                this.pauseFrames = 10;
            }
            else if (this.textRemaining[0] == ",") {
                this.pauseFrames = 5;
            }
            this.textRemaining = this.textRemaining.slice(1);
        }
        else {
            this.complete = true;
        }
    }
}
function numFormat(num) {
    if (num < 1)
        return "0";
    let magnitude = Math.floor(Math.log10(Math.floor(num)) / 3);
    let suffix = ["", "K", "M", "B", "T", "q", "Q", "s", "S", "O", "N", "D"][magnitude];
    return (parseFloat((Math.floor(num) / Math.pow(10, magnitude * 3)).toFixed(2))
        .toString()
        .replace(/\.0$/, "") + suffix);
}
function selectTab(event, tabId) {
    const tabcontent = document.getElementsByClassName("tabcontent");
    Array.from(tabcontent).forEach((tab) => (tab.style.display = "none"));
    const tablinks = document.getElementsByClassName("tablinks");
    Array.from(tablinks).forEach((link) => link.classList.remove("active"));
    document.getElementById(tabId).style.display = "block";
    event.currentTarget.classList.add("active");
}
const game = new Game();
game.Start();
