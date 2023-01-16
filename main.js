"use strict";
var bgImage = document.getElementById("bgImage"), drillImage = document.getElementById("drillImage"), pumpImage = document.getElementById("pumpImage"), planet = document.getElementById("planet"), miningTable = document.getElementById("miningTable"), comms = document.getElementById("comms"), planetName = document.getElementById("planetName"), shipContainer = document.getElementById("shipContainer"), resourceElements = {
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
var Game = (function () {
    function Game() {
        this.fps = 30;
        this.resources = {
            iron: 0,
            copper: 0,
            aluminum: 0,
            lead: 0,
            titanium: 0,
            fuel: 0
        };
        this.mineralAbundance = {
            iron: 0,
            copper: 0,
            aluminum: 0,
            lead: 0,
            titanium: 0
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
        this.currentPlanetName = genPlanetName();
        planetName.innerText = this.currentPlanetName;
        for (var i = 0; i < 4; i++) {
            var thisRow = miningTable.insertRow();
            this.miningGrid[i] = [];
            for (var j = 0; j < 5; j++) {
                this.miningGrid[i][j] = thisRow.insertCell();
                this.miningGrid[i][j].onclick = null;
            }
        }
        document.querySelectorAll("img").forEach(function (img) {
            img.setAttribute("draggable", "false");
        });
        var commsFirst = document.createElement("p");
        commsFirst.innerText = ">";
        comms.appendChild(commsFirst);
        this.commsTextElements.push(commsFirst);
        comms.scrollTop = comms.scrollHeight;
    }
    Game.prototype.Logic = function () {
        for (var resource in this.resources) {
            if (resource != "fuel") {
                this.resources[resource] += (this.mineralAbundance[resource] * this.mineralsPs) / this.fps;
            }
            else {
                this.resources.fuel += this.fuelPs / this.fps;
            }
        }
    };
    Game.prototype.Render = function () {
        bgImage.style.width = Math.sqrt(Math.pow((window.innerWidth / 2), 2) + Math.pow(window.innerHeight, 2)) * 2 + "px";
        bgImage.style.height = Math.sqrt(Math.pow((window.innerWidth / 2), 2) + Math.pow(window.innerHeight, 2)) * 2 + "px";
        this.bgRotation += 0.015;
        bgImage.style.transform = "translate(-50%, -50%) rotate(" + this.bgRotation + "deg)";
        for (var resource in this.resources) {
            if (resource == "fuel") {
                shipContainer.style.backgroundPositionY = (1 - this.resources.fuel / this.fuelRequirement) * shipContainer.clientHeight - shipContainer.clientHeight * 0.084 + "px";
                if (this.resources.fuel >= this.fuelRequirement) {
                    shipContainer.classList.add("completeFuel");
                }
                else {
                    shipContainer.classList.remove("completeFuel");
                }
            }
            else {
                resourceElements.counts[resource].innerText = numFormat(this.resources[resource]);
                resourceElements.perSecond[resource].innerText = numFormat(this.mineralAbundance[resource] * this.mineralsPs) + "/s";
            }
        }
        if (this.queuedCommsText.length > 0) {
            if (this.queuedCommsText[0].textElement == null) {
                this.queuedCommsText[0].AddElement(this.commsTextElements[this.commsTextElements.length - 1]);
            }
            this.queuedCommsText[0].Render();
            if (this.queuedCommsText[0].complete) {
                var nextElement = document.createElement("p");
                nextElement.innerText = ">";
                comms.appendChild(nextElement);
                this.commsTextElements.push(nextElement);
                this.queuedCommsText.shift();
            }
            comms.scrollTop = comms.scrollHeight;
        }
        else {
            var update = false;
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
    };
    Game.prototype.ChooseMineral = function (chances) {
        var total = 0;
        for (var mineral in chances) {
            total += chances[mineral];
        }
        var rand = Math.random() * total;
        for (var mineral in chances) {
            rand -= chances[mineral];
            if (rand < 0) {
                return mineral;
            }
        }
        return "iron";
    };
    Game.prototype.Loop = function () {
        this.Logic();
        this.Render();
    };
    Game.prototype.Start = function () {
        this.Render();
        setInterval(this.Loop.bind(this), 1000 / this.fps);
    };
    return Game;
}());
var Upgrade = (function () {
    function Upgrade(name, desc, costs) {
        this.costs = {
            iron: 0,
            copper: 0,
            aluminum: 0,
            lead: 0,
            titanium: 0,
            fuel: 0
        };
        this.name = name;
        this.desc = desc;
        for (var resource in costs) {
            this.costs[resource] = costs[resource];
        }
    }
    return Upgrade;
}());
var CommsText = (function () {
    function CommsText(text) {
        this.textElement = null;
        this.complete = false;
        this.prefixSpace = true;
        this.pauseFrames = 0;
        this.textRemaining = text;
        game.queuedCommsText.push(this);
    }
    CommsText.prototype.AddElement = function (element) {
        this.textElement = element;
        this.textElement.innerText = ">";
    };
    CommsText.prototype.Render = function () {
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
            var toWrite = "";
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
    };
    return CommsText;
}());
function numFormat(num) {
    if (num < 1)
        return "0";
    var magnitude = Math.floor(Math.log10(Math.floor(num)) / 3);
    var suffix = ["", "K", "M", "B", "T", "q", "Q", "s", "S", "O", "N", "D"][magnitude];
    return (parseFloat((Math.floor(num) / Math.pow(10, magnitude * 3)).toFixed(2))
        .toString()
        .replace(/\.0$/, "") + suffix);
}
var planetNameSegments = {
    start: ["Zubr", "Avi", "Heso", "Hal", "Hea", "Pio", "Druc", "Llaz", "Fenr", "Xant", "Kryst", "Nym", "Zephyr", "Eldr", "Myst", "Vent", "Gor", "Kel", "Tyr", "Gryf", "Jyn", "Kron", "Vyr", "Ryn", "Lyr", "Cyr", "Syr", "Hyr", "Myyr", "Fyr", "Vyrn", "Cycl", "Kyn", "Jyr", "Wyr", "Zyr", "Ilin", "Alin", "Ethon", "Zyx", "Pix", "Zelr", "Abr", "Havir", "Hil", "Heli", "Pyr", "Dryl", "Lysz", "Fyrn", "Xar", "Kryl", "Nyl", "Zelph", "Eldyn", "Myzt", "Vyrn", "Gyr", "Kyl", "Tyl", "Gryl", "Jyl", "Kryl"],
    middle: ["iun", "arut", "sie", "nad", "wei", "vis", "itov", "eth", "ora", "ion", "aria", "ael", "aril", "ith", "osar", "ath", "ion", "iam", "iria", "iael", "ina", "orio", "oria", "ila", "ira", "ixu", "ily", "axy", "axi", "axo"],
    end: ["ia", "a", "o", "e", "u", "i", "is", "es", "us", "os", "ys", "ysus", "ax", "ion", "el", "ar", "er", "ir", "yr", "or", "ur", "esir", "ios", "ius", "ois", "ysa", "ora", "ese", "asi", "asi", "oxi", "oxa", "oxo", "axin", "arin", "elia", "eal", "ifia", "th", "arn", "ry"]
};
function genPlanetName() {
    var len = Math.floor(Math.random() * 2) + 2;
    while (true) {
        var start = planetNameSegments.start[Math.floor(Math.random() * planetNameSegments.start.length)];
        var middle = planetNameSegments.middle[Math.floor(Math.random() * planetNameSegments.middle.length)];
        var end = planetNameSegments.end[Math.floor(Math.random() * planetNameSegments.end.length)];
        if (!(start.charAt(start.length - 1) == middle.charAt(0) || start.charAt(start.length - 1) == end.charAt(0) || middle.charAt(middle.length - 1) == end.charAt(0))) {
            if (len == 2) {
                return start + end;
            }
            else if (len == 3) {
                return start + middle + end;
            }
        }
    }
}
function selectTab(event, tabId) {
    var tabcontent = document.getElementsByClassName("tabcontent");
    Array.from(tabcontent).forEach(function (tab) { return (tab.style.display = "none"); });
    var tablinks = document.getElementsByClassName("tablinks");
    Array.from(tablinks).forEach(function (link) { return link.classList.remove("active"); });
    document.getElementById(tabId).style.display = "block";
    event.currentTarget.classList.add("active");
}
function handleResize() {
    var planetPosMiddle = [planet.getBoundingClientRect().left + planet.getBoundingClientRect().width / 2, planet.getBoundingClientRect().top + planet.getBoundingClientRect().height / 2];
    var planetRadius = planet.getBoundingClientRect().width / 2;
    drillImage.style.left = planetPosMiddle[0] + planetRadius / Math.SQRT2 - drillImage.clientWidth / 2 - 0.32 * (drillImage.clientWidth / Math.SQRT2) - 0.01 * planetRadius + "px";
    drillImage.style.top = planetPosMiddle[1] - planetRadius / Math.SQRT2 - drillImage.clientHeight - 0.32 * (drillImage.clientWidth / Math.SQRT2) + 0.01 * planetRadius + "px";
    pumpImage.style.left = planetPosMiddle[0] - planetRadius / Math.SQRT2 - pumpImage.clientWidth / 2 + 0.01 * planetRadius + "px";
    pumpImage.style.top = planetPosMiddle[1] - planetRadius / Math.SQRT2 - pumpImage.clientHeight + 0.01 * planetRadius + "px";
}
window.addEventListener("resize", handleResize);
handleResize();
var game = new Game();
game.Start();
