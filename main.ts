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

const localStorageKey = "idleGameSave";

const bgImage = document.getElementById("bgImage") as HTMLImageElement,
    drillImage = document.getElementById("drillImage") as HTMLImageElement,
    pumpImage = document.getElementById("pumpImage") as HTMLImageElement,
    planet = document.getElementById("planet") as HTMLImageElement,
    miningTable = document.getElementById("miningTable") as HTMLTableElement,
    comms = document.getElementById("comms") as HTMLDivElement,
    planetName = document.getElementById("planetName") as HTMLSpanElement,
    planetTooltip = document.getElementById("planetDescTooltip") as HTMLDivElement,
    shipContainer = document.getElementById("shipContainer") as HTMLDivElement,
    shipTooltip = document.getElementById("shipTooltip") as HTMLDivElement,
    upgradeTables: { [key: string]: HTMLTableElement } = {
        ship: document.getElementById("shipUpgradeTable") as HTMLTableElement,
        pump: document.getElementById("pumpUpgradeTable") as HTMLTableElement,
        tool: document.getElementById("toolUpgradeTable") as HTMLTableElement,
        drill: document.getElementById("drillUpgradeTable") as HTMLTableElement
    },
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

const planetNameSegments = {
    start: ["Zubr", "Avi", "Heso", "Hal", "Hea", "Pio", "Druc", "Llaz", "Fenr", "Xant", "Kryst", "Nym", "Zephyr", "Eldr", "Myst", "Vent", "Gor", "Kel", "Tyr", "Gryf", "Jyn", "Kron", "Vyr", "Ryn", "Lyr", "Cyr", "Syr", "Hyr", "Myyr", "Fyr", "Vyrn", "Cycl", "Kyn", "Jyr", "Wyr", "Zyr", "Ilin", "Alin", "Ethon", "Zyx", "Pix", "Zelr", "Abr", "Havir", "Hil", "Heli", "Pyr", "Dryl", "Lysz", "Fyrn", "Xar", "Kryl", "Nyl", "Zelph", "Eldyn", "Myzt", "Vyrn", "Gyr", "Kyl", "Tyl", "Gryl", "Jyl", "Kryl"],
    middle: ["iun", "arut", "sie", "nad", "wei", "vis", "itov", "eth", "ora", "ion", "aria", "ael", "aril", "ith", "osar", "ath", "ion", "iam", "iria", "iael", "ina", "orio", "oria", "ila", "ira", "ixu", "ily", "axy", "axi", "axo"],
    end: ["ia", "a", "o", "e", "u", "i", "is", "es", "us", "os", "ys", "ysus", "ax", "ion", "el", "ar", "er", "ir", "yr", "or", "ur", "esir", "ios", "ius", "ois", "ysa", "ora", "ese", "asi", "asi", "oxi", "oxa", "oxo", "axin", "arin", "elia", "eal", "ifia", "th", "arn", "ry"]
};

class Game {
    readonly fps = 30;

    resources: ResourceObj<number> = {
        iron: -1,
        copper: -1,
        aluminum: -1,
        lead: -1,
        titanium: -1,
        fuel: -1
    };
    mineralsPerSecond = -1;
    mineralsPerClick = -1;
    fuelPs = -1;

    fuelRequirement = -1;

    bgRotation = 0;

    miningGrid: HTMLTableCellElement[][] = [];
    miningGridMaterials: (keyof MineralObj<number>)[][] = [];
    miningGridTimers: number[][] = [];

    commsTextElements: HTMLParagraphElement[] = [];
    queuedCommsText: CommsText[] = [];

    commsBlinkShown = false;
    commsBlinkTimer = 15;

    currentPlanet = new Planet("", -1, { iron: -1, copper: -1, aluminum: -1, lead: -1, titanium: -1 });

    upgrades: Upgrade[] = [
        // Pump Upgrades

        new Upgrade(upgradeTables.pump, "🚀", "High-Pressure Nozzle", "A more powerful and efficient pumping method.<br>[+X fuel/sec]", 0, { copper: 15, iron: 5 }, () => {
            // per second += X;
            new CommsText("You have increased your pump speed by X per second.");
        }),
        new Upgrade(upgradeTables.pump, "🚰", "Bigger Tank", "Holds more liquid for longer sessions.<br>[+Y pump capacity]", 0, { copper: 100, iron: 40 }, () => {
            // capacity += Y;
            new CommsText("You have increased your pump capacity by Y.");
        }),
        new Upgrade(upgradeTables.pump, "🔥", "Insulated Hoses", "Keeps the liquid flowing in colder temperatures.<br>[+X fuel/sec]", 0, { copper: 700, iron: 300 }, () => {
            // per second += X;
            new CommsText("You have increased your pump speed by X per second.");
        }),
        new Upgrade(upgradeTables.pump, "🌊", "Self-Cleaning Impeller", "A self-cleaning mechanism that prevents clogging.<br>[+X fuel/sec]", 0, { copper: 5000, iron: 1500 }, () => {
            // per second += X;
            new CommsText("You have increased your pump speed by X per second.");
        }),
        new Upgrade(upgradeTables.pump, "💼", "Modular Tank", "A tank that can easily be branched out for extra space.<br>[+Y pump capacity]", 0, { copper: 27500, iron: 12000 }, () => {
            // capacity += Y;
            new CommsText("You have increased your pump capacity by Y.");
        }),
        new Upgrade(upgradeTables.pump, "🏭", "Industrial Motor", "A powerful motor for heavy-duty pumping.<br>[+X fuel/sec]", 0, { copper: 350000, iron: 150000 }, () => {
            // per second += X;
            new CommsText("You have increased your pump speed by X per second.");
        }),
        new Upgrade(upgradeTables.pump, "🧹", "Vacuum Intake", "Greatly increases intake efficiency with all-new vacuum technology.<br>[+X fuel/sec]", 0, { copper: 2000000, iron: 900000 }, () => {
            // per second += X;
            new CommsText("You have increased your pump speed by X per second.");
        }),
        new Upgrade(upgradeTables.pump, "💫", "Molecular Compression", "A tank that uses molecular compression technology to increase its capacity.<br>[+Y pump capacity]", 0, { copper: 15000000, iron: 7500000 }, () => {
            // capacity += Y;
            new CommsText("You have increased your pump capacity by Y.");
        }),
        new Upgrade(upgradeTables.pump, "🔧", "Tinkering Microbots", "These little machines automatically fix any leaks or damages.<br>[+X fuel/sec]", 0, { copper: 100000000, iron: 40000000 }, () => {
            // per second += X;
            new CommsText("You have increased your pump speed by X per second.");
        }),
        new Upgrade(upgradeTables.pump, "🔬", "Nano-Filtration System", "Deals with dust and debris at the molecular level.<br>[+X fuel/sec]", 0, { copper: 800000000, iron: 250000000 }, () => {
            // per second += X;
            new CommsText("You have increased your pump speed by X per second.");
        }),
        new Upgrade(upgradeTables.pump, "🛸", "Hyperspace Storage", "Uses interdimensional technology to increase capacity beyond normal limitations.<br>[+Y pump capacity]", 0, { copper: 5000000000, iron: 2000000000 }, () => {
            // capacity += Y;
            new CommsText("You have increased your pump capacity by Y.");
        }),
        new Upgrade(upgradeTables.pump, "🌌", "Fluid Dynamics Manipulator", "This technology allows for unimaginable speeds.<br>[+X fuel/sec]", 0, { copper: 40000000000, iron: 15000000000 }, () => {
            // per second += X;
            new CommsText("You have increased your pump speed by X per second.");
        }),
        new Upgrade(upgradeTables.pump, "🔮", "Quantum Entangled Tubes", "Uses quantum entanglement to pump fuel faster than the speed of light.<br>[+X fuel/sec]", 0, { copper: 200000000000, iron: 5 }, () => {
            // per second += X;
            new CommsText("You have increased your pump speed by X per second.");
        }),

        // Tool Upgrades

        new Upgrade(upgradeTables.tool, "🏓", "Reinforced Handle", "For added stability.<br>[+1 minerals/click]", 0, { lead: 10, iron: 5 }, () => {
            this.mineralsPerClick += 1;
            new CommsText("You have increased your mining power by 1 per click.");
        }),
        new Upgrade(upgradeTables.tool, "🧥", "Lead Coating", "A thin layer to shield some scratch damage.<br>[+3 minerals/click]", 0, { lead: 500, iron: 200 }, () => {
            this.mineralsPerClick += 3;
            new CommsText("You have increased your mining power by 3 per click.");
        }),
        new Upgrade(upgradeTables.tool, "🏌️", "Stronger Strikes", "You gain a sense of power.<br>[+20 minerals/click]", 0, { lead: 5000, iron: 2500 }, () => {
            this.mineralsPerClick += 20;
            new CommsText("You have increased your mining power by 20 per click.");
        }),
        new Upgrade(upgradeTables.tool, "🧲", "Magnetic Edge", "You seem to be losing track of less minerals now.<br>[+100 minerals/click]", 0, { lead: 35000, iron: 20000 }, () => {
            this.mineralsPerClick += 100;
            new CommsText("You have increased your mining power by 100 per click.");
        }),
        new Upgrade(upgradeTables.tool, "⚡", "Laser Sight", "A built-in laser sight for improved precision.<br>[+600 minerals/click]", 0, { lead: 550000, iron: 250000 }, () => {
            this.mineralsPerClick += 600;
            new CommsText("You have increased your mining power by 600 per click.");
        }),
        new Upgrade(upgradeTables.tool, "💻", "Magic Chip", "A smart microprocessor that tracks tool usage and suggests maintenance.<br>[+2000 minerals/click]", 0, { lead: 10000000, iron: 4000000 }, () => {
            this.mineralsPerClick += 2000;
            new CommsText("You have increased your mining power by 2000 per click.");
        }),

        // Drill Upgrades

        new Upgrade(upgradeTables.drill, "🔋", "Lithium Batteries", "Oh, this thing turns on now?<br>[+1 minerals/sec]", 0, { aluminum: 100, iron: 20 }, () => {
            this.mineralsPerSecond += 1;
            new CommsText("You have increased your mining rate by 1 per second.");
        }),
        new Upgrade(upgradeTables.drill, "🌀", "Faster Spinning", "A bit of added efficiency.<br>[+10 minerals/sec]", 0, { aluminum: 2000, iron: 800 }, () => {
            this.mineralsPerSecond += 10;
            new CommsText("You have increased your mining rate by 10 per second.");
        }),
        new Upgrade(upgradeTables.drill, "🗡️", "Sharper Tip", "Should make digging through tough rocks easier.<br>[+30 minerals/sec]", 0, { aluminum: 7500, iron: 3000 }, () => {
            this.mineralsPerSecond += 30;
            new CommsText("You have increased your mining rate by 50 per second.");
        }),
        new Upgrade(upgradeTables.drill, "🌡", "Thermal Dynamics", "This cooling system allows the drill to safely run at higher powers.<br>[+95 minerals/sec]", 0, { aluminum: 40000, iron: 17500 }, () => {
            this.mineralsPerSecond += 95;
            new CommsText("You have increased your mining rate by 95 per second.");
        }),
        new Upgrade(upgradeTables.drill, "📡", "Pressure Sensors", "Automatically detects and adjusts for different rock densities.<br>[+250 minerals/sec]", 0, { aluminum: 750000, iron: 400000 }, () => {
            this.mineralsPerSecond += 250;
            new CommsText("You have increased your mining rate by 250 per second.");
        }),
        new Upgrade(upgradeTables.drill, "🌪️", "High-Torque Motor", "A spin of unprecedented speeds.<br>[+800 minerals/sec]", 0, { aluminum: 6000000, iron: 2000000 }, () => {
            this.mineralsPerSecond += 800;
            new CommsText("You have increased your mining rate by 800 per second.");
        })
    ];

    constructor(savedGame: string | null) {
        this.Load(savedGame);

        for (let i = 0; i < 4; i++) {
            let thisRow = miningTable.insertRow();
            this.miningGrid[i] = [];
            for (let j = 0; j < 5; j++) {
                this.miningGrid[i][j] = thisRow.insertCell();
                this.miningGrid[i][j].onclick = ((event: MouseEvent) => {
                    if (this.miningGridTimers[i][j] == 0) {
                        this.resources[this.miningGridMaterials[i][j]] += this.mineralsPerClick;
                        this.miningGridMaterials[i][j] = this.ChooseMineral(this.currentPlanet.lootTable);
                        this.miningGridTimers[i][j] = 3;
                        floatText(event);
                    }
                }).bind(this);
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
                this.resources[resource as keyof ResourceObj<number>] += (this.currentPlanet.lootTable[resource as keyof MineralObj<number>] * this.mineralsPerSecond) / this.fps;
            } else {
                this.resources.fuel += this.fuelPs / this.fps;
            }
        }

        for (let row = 0; row < this.miningGridTimers.length; row++) {
            for (let col = 0; col < this.miningGridTimers[row].length; col++) {
                if (this.miningGridTimers[row][col] > 0) {
                    this.miningGridTimers[row][col] = Math.max(0, this.miningGridTimers[row][col] - 1 / this.fps);
                }
            }
        }

        this.currentPlanet.timeSpentSeconds += 1 / this.fps;
    }

    Render() {
        // ==============================
        //          Background
        // ==============================

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
                    shipTooltip.innerHTML = "Ready!";
                } else {
                    shipContainer.classList.remove("completeFuel");
                    shipTooltip.innerHTML = "Fuel:&nbsp;" + numFormat(this.resources.fuel) + "&nbsp;/&nbsp;" + numFormat(this.fuelRequirement);
                }
            } else {
                resourceElements.counts[resource as keyof MineralObj<HTMLParagraphElement>].innerText = numFormat(this.resources[resource as keyof MineralObj<number>]);
                resourceElements.perSecond[resource as keyof MineralObj<HTMLParagraphElement>].innerText = numFormat(this.currentPlanet.lootTable[resource as keyof MineralObj<number>] * this.mineralsPerSecond) + "/s";
            }
        }

        // ==============================
        //          Mining Grid
        // ==============================
        for (let row = 0; row < this.miningGridTimers.length; row++) {
            for (let col = 0; col < this.miningGridTimers[row].length; col++) {
                this.miningGrid[row][col].innerHTML = this.miningGridTimers[row][col] == 0 ? this.miningGridMaterials[row][col].substring(0, 2).toUpperCase() : this.miningGridTimers[row][col].toFixed(1);
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

        // ==============================
        //        Planet Tooltip
        // ==============================
        planetTooltip.innerHTML = "Abundant&nbsp;Mineral:&nbsp;" + this.currentPlanet.abundantMineral[0].toUpperCase() + this.currentPlanet.abundantMineral.slice(1) + "<br>Time&nbsp;on&nbsp;Planet:&nbsp;" + new Date(this.currentPlanet.timeSpentSeconds * 1000).toISOString().substring(11, 19);
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

    Save() {
        let saveObj = {
            saveVersion: "0.1",

            resources: this.resources,

            mineralsPerSecond: this.mineralsPerSecond,
            mineralsPerClick: this.mineralsPerClick,
            fuelPs: this.fuelPs,

            fuelRequirement: this.fuelRequirement,

            currentPlanet: this.currentPlanet,

            miningGridMaterials: this.miningGridMaterials,
            miningGridTimers: this.miningGridTimers
        };

        localStorage.setItem(localStorageKey, JSON.stringify(saveObj));
    }

    Load(savedGame: string | null) {
        let saveObj: {
            [key: string]: any;
        } | null = null;

        if (savedGame != null) {
            try {
                let possiblyUnsafeSave = JSON.parse(savedGame);

                if (typeof possiblyUnsafeSave == "object" && possiblyUnsafeSave != null && possiblyUnsafeSave.hasOwnProperty("saveVersion")) {
                    // Safe to assume that this is a valid data structure for the save file
                    saveObj = possiblyUnsafeSave;
                }
            } catch (e) {
                // TODO: Handle error
            }
        }

        if (saveObj != null) {
            this.resources = saveObj.resources;

            this.mineralsPerSecond = saveObj.mineralsPerSecond;
            this.mineralsPerClick = saveObj.mineralsPerClick;
            this.fuelPs = saveObj.fuelPs;

            this.fuelRequirement = saveObj.fuelRequirement;

            this.currentPlanet = new Planet(saveObj.currentPlanet.name, saveObj.currentPlanet.timeSpentSeconds, saveObj.currentPlanet.lootTable);

            this.miningGridMaterials = saveObj.miningGridMaterials;
            this.miningGridTimers = saveObj.miningGridTimers;
        } else {
            this.resources = {
                iron: 0,
                copper: 0,
                aluminum: 0,
                lead: 0,
                titanium: 0,
                fuel: 0
            };

            this.mineralsPerSecond = 0;
            this.mineralsPerClick = 1;
            this.fuelPs = 0;

            this.fuelRequirement = 200;

            this.currentPlanet = new Planet("Earth", 0, {
                iron: 0.75,
                copper: 0.0625,
                lead: 0.0625,
                aluminum: 0.0625,
                titanium: 0.0625
            });

            this.miningGridMaterials = [];
            this.miningGridTimers = [];
            for (let i = 0; i < 4; i++) {
                this.miningGridMaterials[i] = [];
                this.miningGridTimers[i] = [];
                for (let j = 0; j < 4; j++) {
                    this.miningGridMaterials[i][j] = this.ChooseMineral(this.currentPlanet.lootTable);
                    this.miningGridTimers[i][j] = 0;
                }
            }
        }
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
    table: HTMLTableElement;
    icon: string;
    name: string;
    desc: string;
    owned: number = 0;
    ownedElement: HTMLTableCellElement | null = null;
    costs: ResourceObj<number> = {
        iron: 0,
        copper: 0,
        aluminum: 0,
        lead: 0,
        titanium: 0,
        fuel: 0
    };
    effect: () => void;

    constructor(table: HTMLTableElement, icon: string, name: string, desc: string, owned: number, costs: Partial<ResourceObj<number>>, effect: () => void) {
        this.table = table;
        this.icon = icon;
        this.name = name;
        this.desc = desc;
        this.owned = owned;
        for (let resource in costs) {
            this.costs[resource as keyof ResourceObj<number>] = costs[resource as keyof ResourceObj<number>] as number;
        }
        this.effect = effect;
    }

    Register() {
        let upgradeRow = this.table.insertRow();

        let iconCell = upgradeRow.insertCell(),
            nameCell = upgradeRow.insertCell(),
            descCell = upgradeRow.insertCell(),
            costCell = upgradeRow.insertCell();

        this.ownedElement = upgradeRow.insertCell();

        iconCell.classList.add("upgradeTableIcon");
        nameCell.classList.add("upgradeTableName");
        descCell.classList.add("upgradeTableDesc");
        costCell.classList.add("upgradeTableCost");
        this.ownedElement.classList.add("upgradeTableOwned");

        iconCell.innerHTML = this.icon;
        nameCell.innerHTML = this.name;
        descCell.innerHTML = this.desc;
        this.ownedElement.innerHTML = "x" + this.owned;

        let needLineBreak = false;
        for (let resource in this.costs) {
            if (this.costs[resource as keyof ResourceObj<number>] !== 0) {
                if (needLineBreak) {
                    costCell.innerHTML += "<br>";
                } else {
                    needLineBreak = true;
                }
                costCell.innerHTML += resource[0] + ":&nbsp;" + numFormat(this.costs[resource as keyof ResourceObj<number>]);
            }
        }

        upgradeRow.addEventListener("click", this.Buy.bind(this));
    }

    Buy() {
        for (let resource in this.costs) {
            if (game.resources[resource as keyof ResourceObj<number>] < this.costs[resource as keyof ResourceObj<number>]) {
                return;
            }
        }

        for (let resource in this.costs) {
            game.resources[resource as keyof ResourceObj<number>] -= this.costs[resource as keyof ResourceObj<number>];
        }
        this.owned++;

        if (this.ownedElement != null) {
            this.ownedElement.innerHTML = "x" + this.owned;
        }

        this.effect();
    }
}

class Planet {
    name: string;
    lootTable: MineralObj<number>;
    timeSpentSeconds: number;

    abundantMineral: keyof MineralObj<number>;

    constructor();
    constructor(name: string, timeSpentSeconds: number, lootTable: MineralObj<number>);
    constructor(name?: string, timeSpentSeconds?: number, lootTable?: MineralObj<number>) {
        if (name == undefined) {
            let start = "",
                end = "";

            if (Math.random() < 0.5) {
                while (start == "" || start.charAt(start.length - 1) == end.charAt(0)) {
                    start = planetNameSegments.start[Math.floor(Math.random() * planetNameSegments.start.length)];
                    end = planetNameSegments.end[Math.floor(Math.random() * planetNameSegments.end.length)];
                }

                this.name = start + end;
            } else {
                let middle = "";

                while (start == "" || start.charAt(start.length - 1) == middle.charAt(0) || middle.charAt(middle.length - 1) == end.charAt(0)) {
                    start = planetNameSegments.start[Math.floor(Math.random() * planetNameSegments.start.length)];
                    middle = planetNameSegments.middle[Math.floor(Math.random() * planetNameSegments.middle.length)];
                    end = planetNameSegments.end[Math.floor(Math.random() * planetNameSegments.end.length)];
                }

                this.name = start + middle + end;
            }
        } else {
            this.name = name;
        }

        if (timeSpentSeconds == undefined) {
            this.timeSpentSeconds = 0;
        } else {
            this.timeSpentSeconds = timeSpentSeconds;
        }

        if (lootTable == undefined) {
            this.lootTable = {
                iron: 0,
                copper: 0,
                aluminum: 0,
                lead: 0,
                titanium: 0
            };
            const resources = Object.keys(this.lootTable) as (keyof MineralObj<number>)[];

            const abundant = resources[Math.floor(Math.random() * resources.length)];
            this.lootTable[abundant] = Math.random() * 0.3 + 0.6; // random between 0.60 and 0.90

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
        } else {
            this.lootTable = lootTable;
        }

        this.abundantMineral = Object.keys(this.lootTable).reduce((a, b) => (this.lootTable[a as keyof MineralObj<number>] > this.lootTable[b as keyof MineralObj<number>] ? a : b)) as keyof MineralObj<number>;
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

function selectTab(event: PointerEvent, tabId: string) {
    const tabcontent = document.getElementsByClassName("tabcontent") as HTMLCollectionOf<HTMLElement>;
    Array.from(tabcontent).forEach((tab) => (tab.style.display = "none"));

    const tablinks = document.getElementsByClassName("tablinks");
    Array.from(tablinks).forEach((link) => link.classList.remove("active"));

    document.getElementById(tabId)!.style.display = "block";
    (event.currentTarget! as HTMLElement).classList.add("active");
}

function handleResize() {
    bgImage.style.width = Math.sqrt((window.innerWidth / 2) ** 2 + (window.innerHeight * 1.3) ** 2) * 2 + "px";
    bgImage.style.height = Math.sqrt((window.innerWidth / 2) ** 2 + (window.innerHeight * 1.3) ** 2) * 2 + "px";
}

window.addEventListener("resize", handleResize);
handleResize();

const game = new Game(localStorage.getItem(localStorageKey));

game.Start();

function floatText(e: MouseEvent) {
    let floatText = document.createElement("p");
    floatText.innerHTML = "+" + numFormat(game.mineralsPerClick);
    floatText.style.position = "absolute";
    floatText.style.left = e.clientX + "px";
    floatText.style.top = e.clientY + "px";

    floatText.style.color = "white";
    floatText.style.fontSize = "1.5vw";
    floatText.style.zIndex = "100";
    floatText.style.opacity = "1";
    floatText.style.transition = "opacity 1s";

    let floatTextRotation = Math.floor(Math.random() * 20) - 10;
    floatText.style.transform = "rotate(" + floatTextRotation + "deg) translate(-50%, -150%)";
    document.body.appendChild(floatText);

    setInterval(() => (floatText.style.top = parseFloat(floatText.style.top) - 1.3 + "px"), 10);

    setTimeout(() => {
        floatText.style.opacity = "0";
        setTimeout(() => floatText.remove(), 1000);
    }, 100);

    let mineSound = new Audio("Mining Sounds/mineSound" + Math.floor(Math.random() * 8 + 1) + ".mp3");
    mineSound.play();
}
