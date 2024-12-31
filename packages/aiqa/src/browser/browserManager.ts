import { Browser, BrowserContext, chromium, Page } from 'playwright';
import { execSync } from "child_process";
import pc from "picocolors"
import fs from "fs/promises";
import { config } from '../util/config';

export class BrowserManager {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private baseUrl: string;
    private cursorInitialized = false;

    constructor() {
        this.baseUrl = config().baseUrl;
    }

    async launch() {
        try {
            this.browser = await chromium.launch({
                headless: false,
            });
        } catch (error) {
            if (error instanceof Error && error.message.includes("Executable doesn't exist")) {
                console.log(pc.blue('Installing browser dependencies...'));
                execSync('npx playwright install chromium');
                console.log(pc.green('Browser dependencies installed'));

                this.browser = await chromium.launch({
                    headless: false
                });
            } else {
                throw error;
            }
        }

        this.context = await this.browser.newContext({
            viewport: { width: config().screenWidth, height: config().screenHeight },
        });

        this.page = await this.context.newPage();
        await this.goto(this.baseUrl);
        // Initialize cursor at (0,0) by default
        await this.initCursor();
    }

    private async initCursor() {
        if (!this.page || this.cursorInitialized) return;
        console.log(pc.blue('Initializing cursor'));

        // Inject cursor styles
        await this.page.addStyleTag({
            content: `
                .aiqa-cursor {
                    width: 20px;
                    height: 20px;
                    background: rgba(255, 165, 0, 0.5);
                    border: 2px solid #ff8c00;
                    border-radius: 50%;
                    position: fixed;
                    pointer-events: none;
                    z-index: 999999;
                    transition: all 0.1s ease;
                    transform: translate(-50%, -50%);
                }

                .aiqa-click {
                    position: fixed;
                    pointer-events: none;
                    z-index: 999998;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 2px solid #ff8c00;
                    animation: aiqa-click-animation 1s ease-out forwards;
                    transform: translate(-50%, -50%);
                }

                @keyframes aiqa-click-animation {
                    0% {
                        width: 20px;
                        height: 20px;
                        opacity: 1;
                        border-width: 2px;
                    }
                    100% {
                        width: 50px;
                        height: 50px;
                        opacity: 0;
                        border-width: 1px;
                    }
                }
            `
        });

        await this.page.evaluate(() => {
            const cursor = document.createElement('div');
            cursor.className = 'aiqa-cursor';
            cursor.style.left = '0px';
            cursor.style.top = '0px';
            document.body.appendChild(cursor);
            return true;
        });

        this.cursorInitialized = true;
    }

    async goto(url: string) {
        if (!this.page) {
            throw new Error('Page not initialized');
        }
        await this.page.goto(url);
        await this.page.waitForLoadState('networkidle');
        console.log(pc.green('Page loaded'));
        // Reinitialize cursor after navigation
        this.cursorInitialized = false;
        await this.initCursor();
    }

    async close() {
        if (this.page) await this.page.close();
        if (this.browser) await this.browser.close();
    }

    async moveCursor(x: number, y: number, duration: number = 500) {
        if (!this.page) throw new Error('Page not initialized');

        if (!this.cursorInitialized) {
            await this.initCursor();
        }

        console.log(pc.blue(`Moving cursor to (${x}, ${y})`));

        // Animate cursor movement
        await this.page.evaluate(({ x, y, duration }) => {
            const cursor = document.querySelector('.aiqa-cursor') as HTMLElement;
            if (cursor) {
                cursor.style.transition = `all ${duration}ms ease`;
                cursor.style.left = `${x}px`;
                cursor.style.top = `${y}px`;
            }
        }, { x, y, duration });

        // Wait for animation to complete
        await this.page.waitForTimeout(duration);
    }

    async click(x?: number, y?: number, duration: number = 500) {
        if (!this.page) throw new Error('Page not initialized');

        if (x !== undefined && y !== undefined) {
            await this.moveCursor(x, y, duration);
        }

        const currentPosition = await this.page.evaluate(() => {
            const cursor = document.querySelector('.aiqa-cursor') as HTMLElement;
            if (!cursor) return { x: 0, y: 0 };
            return {
                x: parseInt(cursor.style.left),
                y: parseInt(cursor.style.top)
            };
        });

        console.log(pc.yellow(`Clicking at (${currentPosition.x}, ${currentPosition.y})`));

        // Get current URL before click
        const currentUrl = this.page.url();

        try {
            // Create click animation and perform click in parallel
            await Promise.all([
                // Click animation
                this.page.evaluate(({ x, y }) => {
                    return new Promise<void>((resolve) => {
                        const clickEffect = document.createElement('div');
                        clickEffect.className = 'aiqa-click';
                        clickEffect.style.left = `${x}px`;
                        clickEffect.style.top = `${y}px`;
                        document.body.appendChild(clickEffect);

                        // Resolve immediately, let the animation play out
                        resolve();
                    });
                }, currentPosition),
                // Perform the click
                this.page.mouse.click(currentPosition.x, currentPosition.y)
            ]);

            // Small delay to let any navigation start
            await this.page.waitForTimeout(500);

            // Wait for page to settle
            await this.page.waitForLoadState('networkidle');

            // Check if URL changed
            const newUrl = this.page.url();

            if (currentUrl !== newUrl) {
                console.log(pc.green('Navigation complete'));
                // Reinitialize cursor after navigation
                this.cursorInitialized = false;
                await this.initCursor();
            } else {
                console.log(pc.blue('No navigation occurred'));
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error(pc.red('Error during click:'), error.message);
            }
            // Ensure cursor is reinitialized even if there's an error
            this.cursorInitialized = false;
            await this.initCursor();
        }
    }

    async type(text: string) {
        if (!this.page) throw new Error('Page not initialized');
        await this.page.keyboard.type(text);
    }

    async screenshot() {
        console.log(pc.blue('Taking screenshot'));
        if (!this.page) throw new Error('Page not initialized');

        const baseFolder = config().screenshotsDir;
        if (!(await fs.access(baseFolder).then(() => true).catch(() => false))) {
            await fs.mkdir(baseFolder, { recursive: true });
        }

        const datetime = new Date().toISOString()
            .replace(/[-:]/g, '')
            .replace(/\.\d+Z$/, ''); 
        const screenshotPath = `${baseFolder}/screenshot_${datetime}.jpg`;

        await this.page.screenshot({ path: screenshotPath });
        return screenshotPath;
    }
}

export default BrowserManager;