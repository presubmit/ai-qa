import { Ai } from "../ai/agent";
import BrowserManager from "../browser/browserManager";

export class QaAgent {
    private browser: BrowserManager;
    private ai: Ai;

    constructor() {
        this.browser = new BrowserManager();
        this.ai = new Ai({
            takeScreenshot: this.takeScreenshot.bind(this),
            takeAction: this.takeAction.bind(this)
        });
    }

    async runTest(instructions: string): Promise<void> {
        console.log(`Running test: ${instructions}`);

        await this.browser.launch();

        await this.ai.test(instructions);
    }

    async takeScreenshot(): Promise<string> {
        return await this.browser.screenshot();
    }

    async takeAction(action: string, coordinates?: { x: number, y: number }, text?: string): Promise<void> {
        if (action === "move") {
            console.log("move");
            if (!coordinates?.x || !coordinates?.y) {
                throw new Error("Coordinates are required for move action");
            }
            await this.browser.moveCursor(coordinates.x, coordinates.y);
            return;
        }

        if (action === "click") {
            console.log("click");
            await this.browser.click();
            return;
        }

        if (action === "type") {
            console.log("type");
            if (!text) {
                throw new Error("Text is required for type action");
            }
            await this.browser.type(text);
            return;
        }
    }
}