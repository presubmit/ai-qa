import { Ai } from './ai';
import { QaBrowser } from './browser';

async function main() {
    const browser = new QaBrowser('https://github.com/orgs/presubmit/repositories');
    await browser.launch();

    const ai = new Ai({
        takeScreenshot: async () => {
            return await browser.screenshot();
        },
        takeAction: async (action: string, coordinates?: { x: number, y: number }, text?: string) => {
            if (action === "move") {
                console.log("move");
                if (!coordinates?.x || !coordinates?.y) {
                    throw new Error("Coordinates are required for move action");
                }
                await browser.moveCursor(coordinates.x, coordinates.y);
                return;
            }
            
            if (action === "click") {
                console.log("click");
                await browser.click();
                return;
            }

            if (action === "type") {
                console.log("type");
                if (!text) {
                    throw new Error("Text is required for type action");
                }
                await browser.type(text);
                return;
            }
        }
    });

    await ai.test('Verify that user can redirect to "ai-qa" repository and star the repository');
}

main().catch(console.error);
