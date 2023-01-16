const bgImage = document.getElementById("bgImage") as HTMLImageElement,
    drillImage = document.getElementById("drillImage") as HTMLImageElement,
    pumpImage = document.getElementById("pumpImage") as HTMLImageElement,
    planet = document.getElementById("planet") as HTMLImageElement,
    miningTable = document.getElementById("miningTable") as HTMLTableElement,
    comms = document.getElementById("comms") as HTMLDivElement,
    planetName = document.getElementById("planetName") as HTMLSpanElement,
    resourceElements = {
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

interface ResourceObj<Type> {
    iron: Type;
    copper: Type;
    aluminum: Type;
    lead: Type;
    titanium: Type;
    fuel: Type;
}

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
    resourcesPs: ResourceObj<number> = {
        iron: 0,
        copper: 0,
        aluminum: 0,
        lead: 0,
        titanium: 0,
        fuel: 0
    };

    bgRotation = 0;

    miningGrid: HTMLTableCellElement[][] = [];

    commsTextElements: HTMLParagraphElement[] = [];
    queuedCommsText: CommsText[] = [];

    commsBlinkShown = false;
    commsBlinkTimer = 15;

    currentPlanetName = genPlanetName();

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
            this.resources[resource as keyof ResourceObj<number>] += this.resourcesPs[resource as keyof ResourceObj<number>] / this.fps;
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
            if (resource == "fuel") continue;

            resourceElements.counts[resource as "iron" | "copper" | "aluminum" | "lead" | "titanium"].innerText = numFormat(this.resources[resource as keyof ResourceObj<number>]);
            resourceElements.perSecond[resource as "iron" | "copper" | "aluminum" | "lead" | "titanium"].innerText = numFormat(this.resourcesPs[resource as keyof ResourceObj<number>]) + "/s";
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

    Loop() {
        this.Logic();

        this.Render();
    }

    Start() {
        this.Render();

        setInterval(this.Loop.bind(this), 1000 / this.fps);
    }
}

class Upgrade {
    name: string;
    desc: string;
    costs: ResourceObj<number> = {
        iron: 0,
        copper: 0,
        aluminum: 0,
        lead: 0,
        titanium: 0,
        fuel: 0
    };

    constructor(name: string, desc: string, costs: Partial<ResourceObj<number>>) {
        this.name = name;
        this.desc = desc;
        for (let resource in costs) {
            this.costs[resource as keyof ResourceObj<number>] = costs[resource as keyof ResourceObj<number>] as number;
        }
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

// Register event listeners for page
window.addEventListener("resize", handleResize);

handleResize();

const game = new Game();

game.Start();
