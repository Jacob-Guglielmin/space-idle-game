interface MineralObj<Type> {
    iron: Type;
    copper: Type;
    aluminum: Type;
    lead: Type;
    titanium: Type;
}
interface ResourceObj<Type> extends MineralObj<Type> {
    fuel: Type;
}

const bgImage = document.getElementById("bgImage") as HTMLImageElement,
    drillImage = document.getElementById("drillImage") as HTMLImageElement,
    pumpImage = document.getElementById("pumpImage") as HTMLImageElement,
    planet = document.getElementById("planet") as HTMLImageElement,
    miningTable = document.getElementById("miningTable") as HTMLTableElement,
    comms = document.getElementById("comms") as HTMLDivElement,
    planetName = document.getElementById("planetName") as HTMLSpanElement,
    shipContainer = document.getElementById("shipContainer") as HTMLDivElement,
    resourceElements: { counts: MineralObj<HTMLParagraphElement>; perSecond: MineralObj<HTMLParagraphElement> } = {
        counts: {
            iron: document.getElementById("ironCount") as HTMLParagraphElement,
            copper: document.getElementById("copperCount") as HTMLParagraphElement,
            aluminum: document.getElementById("aluminumCount") as HTMLParagraphElement,
            lead: document.getElementById("leadCount") as HTMLParagraphElement,
            titanium: document.getElementById("titaniumCount") as HTMLParagraphElement
        },
        perSecond: {
            iron: document.getElementById("ironPs") as HTMLParagraphElement,
            copper: document.getElementById("copperPs") as HTMLParagraphElement,
            aluminum: document.getElementById("aluminumPs") as HTMLParagraphElement,
            lead: document.getElementById("leadPs") as HTMLParagraphElement,
            titanium: document.getElementById("titaniumPs") as HTMLParagraphElement
        }
    };

class Game {
    readonly fps = 30;

    resources: ResourceObj<number> = {
        iron: 0,
        copper: 0,
        aluminum: 0,
        lead: 0,
        titanium: 0,
        fuel: 0
    };
    mineralAbundance: MineralObj<number> = {
        iron: 0,
        copper: 0,
        aluminum: 0,
        lead: 0,
        titanium: 0
    };
    mineralsPs: number = 0;
    fuelPs: number = 0;

    fuelRequirement = 200;

    bgRotation = 0;

    miningGrid: HTMLTableCellElement[][] = [];

    commsTextElements: HTMLParagraphElement[] = [];
    queuedCommsText: CommsText[] = [];

    commsBlinkShown = false;
    commsBlinkTimer = 15;

    currentPlanetName = genPlanetName();

    drillUpgrade1_effect = () => {
        this.mineralsPs += 1;
        new CommsText("You have increased your mining rate by 1 per second.");
    };
    drillUpgrade1: Upgrade = new Upgrade("🔋", "Lithium Batteries", "Oh, this thing turns on now?<br>[+1.0 minerals/sec]", 0, { iron: 100, copper: 1 }, this.drillUpgrade1_effect);

    drillUpgrade2_effect = () => {
        this.mineralsPs += 10;
        new CommsText("You have increased your mining rate by 10 per second.");
    };
    drillUpgrade2: Upgrade = new Upgrade("🌀", "Faster Spinning", "A bit of added efficiency.<br>[+10.0 minerals/sec]", 0, { iron: 1000, copper: 25 }, this.drillUpgrade2_effect);

    drillUpgrade3_effect = () => {
        this.mineralsPs += 50;
        new CommsText("You have increased your mining rate by 50 per second.");
    };
    drillUpgrade3: Upgrade = new Upgrade("🗡️", "Sharper Tip", "Should make digging through tough rocks easier.<br>[+50.0 minerals/sec]", 0, { iron: 7500, copper: 150, aluminum: 20 }, this.drillUpgrade3_effect);

    // list of upgrades
    drillUpgrades: Upgrade[] = [this.drillUpgrade1, this.drillUpgrade2, this.drillUpgrade3];

    constructor() {
        planetName.innerText = this.currentPlanetName;

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
                this.resources[resource as keyof ResourceObj<number>] += (this.mineralAbundance[resource as keyof MineralObj<number>] * this.mineralsPs) / this.fps;
            } else {
                this.resources.fuel += this.fuelPs / this.fps;
            }
        }
    }

    Render() {
        // ==============================
        //          Background
        // ==============================

        bgImage.style.width = Math.sqrt((window.innerWidth / 2) ** 2 + window.innerHeight ** 2) * 2 + "px";
        bgImage.style.height = Math.sqrt((window.innerWidth / 2) ** 2 + window.innerHeight ** 2) * 2 + "px";

        this.bgRotation += 0.015;
        bgImage.style.transform = "translate(-50%, -50%) rotate(" + this.bgRotation + "deg)";

        // ==============================
        //           Resources
        // ==============================

        for (let resource in this.resources) {
            if (resource == "fuel") {
                shipContainer.style.backgroundPositionY = Math.max(0, (1 - this.resources.fuel / this.fuelRequirement) * shipContainer.clientHeight) - shipContainer.clientHeight * 0.084 + "px";

                if (this.resources.fuel >= this.fuelRequirement) {
                    shipContainer.classList.add("completeFuel");
                } else {
                    shipContainer.classList.remove("completeFuel");
                }
            } else {
                resourceElements.counts[resource as keyof MineralObj<HTMLParagraphElement>].innerText = numFormat(this.resources[resource as keyof MineralObj<number>]);
                resourceElements.perSecond[resource as keyof MineralObj<HTMLParagraphElement>].innerText = numFormat(this.mineralAbundance[resource as keyof MineralObj<number>] * this.mineralsPs) + "/s";
            }
        }

        // ==============================
        //          Comms Text
        // ==============================

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
        } else {
            let update = false;
            if (this.commsBlinkTimer > 0) {
                this.commsBlinkTimer--;
            } else {
                this.commsBlinkTimer = 15;
                this.commsBlinkShown = !this.commsBlinkShown;

                update = true;
            }

            if (update) {
                if (this.commsBlinkShown) {
                    this.commsTextElements[this.commsTextElements.length - 1].innerText = "> _";
                } else {
                    this.commsTextElements[this.commsTextElements.length - 1].innerText = ">";
                }
            }
        }
    }

    ChooseMineral(chances: MineralObj<number>): keyof MineralObj<number> {
        let total = 0;
        for (let mineral in chances) {
            total += chances[mineral as keyof MineralObj<number>];
        }

        let rand = Math.random() * total;
        for (let mineral in chances) {
            rand -= chances[mineral as keyof MineralObj<number>];
            if (rand < 0) {
                return mineral as keyof MineralObj<number>;
            }
        }

        return "iron";
    }

    Loop() {
        this.Logic();

        this.Render();
    }

    Start() {
        upgradesToTable(this.drillUpgrades, document.getElementById("drillUpgradeTable") as HTMLTableElement);
        assignListenersToTables();

        this.Render();

        setInterval(this.Loop.bind(this), 1000 / this.fps);
    }
}

class Upgrade {
    icon: string;
    name: string;
    desc: string;
    owned: number = 0;
    costs: ResourceObj<number> = {
        iron: 0,
        copper: 0,
        aluminum: 0,
        lead: 0,
        titanium: 0,
        fuel: 0
    };
    effect: () => void;

    constructor(icon: string, name: string, desc: string, owned: number, costs: Partial<ResourceObj<number>>, effect: () => void) {
        this.icon = icon;
        this.name = name;
        this.desc = desc;
        this.owned = owned;
        for (let resource in costs) {
            this.costs[resource as keyof ResourceObj<number>] = costs[resource as keyof ResourceObj<number>] as number;
        }
        this.effect = effect;
    }

    Buy() {
        for (let resource in this.costs) {
            game.resources[resource as keyof ResourceObj<number>] -= this.costs[resource as keyof ResourceObj<number>];
        }
        this.owned++;
        this.effect();
    }
}

class CommsText {
    textRemaining: string;

    textElement: HTMLParagraphElement | null = null;

    complete = false;

    prefixSpace = true;
    pauseFrames = 0;

    constructor(text: string) {
        this.textRemaining = text;

        game.queuedCommsText.push(this);
    }

    AddElement(element: HTMLParagraphElement) {
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
            } else if (this.textRemaining[0] == ",") {
                this.pauseFrames = 5;
            }

            this.textRemaining = this.textRemaining.slice(1);
        } else {
            this.complete = true;
        }
    }
}

function numFormat(num: number): string {
    if (num < 1) return "0";
    let magnitude = Math.floor(Math.log10(Math.floor(num)) / 3);
    let suffix = ["", "K", "M", "B", "T", "q", "Q", "s", "S", "O", "N", "D"][magnitude];
    return (
        parseFloat((Math.floor(num) / Math.pow(10, magnitude * 3)).toFixed(2))
            .toString()
            .replace(/\.0$/, "") + suffix
    );
}

const planetNameSegments = {
    start: ["Zubr", "Avi", "Heso", "Hal", "Hea", "Pio", "Druc", "Llaz", "Fenr", "Xant", "Kryst", "Nym", "Zephyr", "Eldr", "Myst", "Vent", "Gor", "Kel", "Tyr", "Gryf", "Jyn", "Kron", "Vyr", "Ryn", "Lyr", "Cyr", "Syr", "Hyr", "Myyr", "Fyr", "Vyrn", "Cycl", "Kyn", "Jyr", "Wyr", "Zyr", "Ilin", "Alin", "Ethon", "Zyx", "Pix", "Zelr", "Abr", "Havir", "Hil", "Heli", "Pyr", "Dryl", "Lysz", "Fyrn", "Xar", "Kryl", "Nyl", "Zelph", "Eldyn", "Myzt", "Vyrn", "Gyr", "Kyl", "Tyl", "Gryl", "Jyl", "Kryl"],
    middle: ["iun", "arut", "sie", "nad", "wei", "vis", "itov", "eth", "ora", "ion", "aria", "ael", "aril", "ith", "osar", "ath", "ion", "iam", "iria", "iael", "ina", "orio", "oria", "ila", "ira", "ixu", "ily", "axy", "axi", "axo"],
    end: ["ia", "a", "o", "e", "u", "i", "is", "es", "us", "os", "ys", "ysus", "ax", "ion", "el", "ar", "er", "ir", "yr", "or", "ur", "esir", "ios", "ius", "ois", "ysa", "ora", "ese", "asi", "asi", "oxi", "oxa", "oxo", "axin", "arin", "elia", "eal", "ifia", "th", "arn", "ry"]
};

function genPlanetName() {
    let len = Math.floor(Math.random() * 2) + 2;

    while (true) {
        let start = planetNameSegments.start[Math.floor(Math.random() * planetNameSegments.start.length)];
        let middle = planetNameSegments.middle[Math.floor(Math.random() * planetNameSegments.middle.length)];
        let end = planetNameSegments.end[Math.floor(Math.random() * planetNameSegments.end.length)];

        if (!(start.charAt(start.length - 1) == middle.charAt(0) || start.charAt(start.length - 1) == end.charAt(0) || middle.charAt(middle.length - 1) == end.charAt(0))) {
            if (len == 2) {
                return start + end;
            } else if (len == 3) {
                return start + middle + end;
            }
        }
    }
}

function selectTab(event: PointerEvent, tabId: string) {
    const tabcontent = document.getElementsByClassName("tabcontent") as HTMLCollectionOf<HTMLElement>;
    Array.from(tabcontent).forEach((tab) => (tab.style.display = "none"));

    const tablinks = document.getElementsByClassName("tablinks");
    Array.from(tablinks).forEach((link) => link.classList.remove("active"));

    document.getElementById(tabId)!.style.display = "block";
    (event.currentTarget! as HTMLElement).classList.add("active");
}

function handleResize() {
    let planetPosMiddle = [planet.getBoundingClientRect().left + planet.getBoundingClientRect().width / 2, planet.getBoundingClientRect().top + planet.getBoundingClientRect().height / 2];
    let planetRadius = planet.getBoundingClientRect().width / 2;

    drillImage.style.left = planetPosMiddle[0] + planetRadius / Math.SQRT2 - drillImage.clientWidth / 2 - 0.32 * (drillImage.clientWidth / Math.SQRT2) - 0.01 * planetRadius + "px";
    drillImage.style.top = planetPosMiddle[1] - planetRadius / Math.SQRT2 - drillImage.clientHeight - 0.32 * (drillImage.clientWidth / Math.SQRT2) + 0.01 * planetRadius + "px";

    pumpImage.style.left = planetPosMiddle[0] - planetRadius / Math.SQRT2 - pumpImage.clientWidth / 2 + 0.01 * planetRadius + "px";
    pumpImage.style.top = planetPosMiddle[1] - planetRadius / Math.SQRT2 - pumpImage.clientHeight + 0.01 * planetRadius + "px";
}

function upgradesToTable(upgradeArray: Upgrade[], specifiedTable: HTMLTableElement) {
    let table = "";
    for (let i = 0; i < upgradeArray.length; i++) {
        let upgrade = upgradeArray[i];
        table += "<tr>";
        table += `<td class="upgradeTableIcon">${upgrade.icon}</td>`;
        table += `<td class="upgradeTableName">${upgrade.name}</td>`;
        table += `<td class="upgradeTableDesc">${upgrade.desc}</td>`;

        table += `<td class="upgradeTableCost">`;
        for (let [key, value] of Object.entries(upgrade.costs)) {
            if (value !== 0) {
                table += `${key}: ${value} <br>`;
            }
        }
        table += "</td>";

        table += `<td class="upgradeTableOwned">x${upgrade.owned}</td>`;
        table += "</tr>";
    }
    specifiedTable.innerHTML = table;
}

// Upgrade listeners
function assignListenersToTables() {
    const rows = document.querySelectorAll("#drillUpgradeTable tr");
    for (let i = 0; i < rows.length; i++) {
        rows[i].addEventListener("click", function () {
            if (i === 0) {
                game.drillUpgrade1.Buy();
            } else if (i === 1) {
                game.drillUpgrade2.Buy();
            } else if (i === 2) {
                game.drillUpgrade3.Buy();
            }
        });
    }
}

function generatePlanet() {
    let planetName = genPlanetName();
    const resources = ["iron", "copper", "aluminum", "lead", "titanium"];
    let planetLootTable = {};

    const abundant = resources[Math.floor(Math.random() * resources.length)];
    planetLootTable[abundant] = Math.random() * 0.3 + 0.6; // random between 0.60 and 0.90

    let remaining = 1 - planetLootTable[abundant];
    resources.forEach(resource => {
        if (resource !== abundant) {
            planetLootTable[resource] = Math.random() * remaining / (resources.length - 1);
            remaining -= planetLootTable[resource];
        }
    });
}

// Register event listeners for page
window.addEventListener("resize", handleResize);

handleResize();

const game = new Game();

game.Start();
