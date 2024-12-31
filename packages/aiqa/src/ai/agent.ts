import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./prompts";
import fs from "fs/promises";
import pc from "picocolors";
import { BetaMessageParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { config } from "../util/config";

type ToolResult = {
    id: string;
    type: "image" | "text";
    content: string;
}

type ToolCall = {
    id: string;
    name: string;
    input: any;
}

interface AiCallbacks {
    takeScreenshot: () => Promise<string>;
    takeAction: (action: "move" | "click" | "type", coordinates?: { x: number, y: number }, text?: string) => Promise<void>;
}

export class Ai {
    private anthropic: Anthropic;
    private callbacks: AiCallbacks;

    constructor(callbacks: AiCallbacks) {
        this.anthropic = new Anthropic({ apiKey: config().anthropicApiKey });
        this.callbacks = callbacks;
    }

    async test(testInstruction: string) {
        const messages = [
            { role: "user", content: testInstruction }
        ] as BetaMessageParam[];

        while (true) {
            const message = await this.anthropic.beta.messages.create({
                system: SYSTEM_PROMPT,
                model: config().anthropicModel,
                max_tokens: 1024,
                tools: [
                    {
                        type: "computer_20241022",
                        name: "computer",
                        display_width_px: config().screenWidth,
                        display_height_px: config().screenHeight,
                        display_number: 1,
                    }
                ],
                messages: messages,
                betas: ["computer-use-2024-10-22"],
            });
            console.log("assistant's message", message.content);
            messages.push({
                role: "assistant",
                content: message.content
            });


            if (message.content[0].type === "text"
                && message.content[0].text?.includes("test_passed")) {
                try {
                    const result = JSON.parse(message.content[0].text);
                    console.log("Test result: ", result);
                    break;
                } catch (e) {
                    console.log("Invalid JSON");
                }
                break;
            }

            const toolCalls = message.content.filter(content => content.type === 'tool_use');
            const toolResults = await Promise.all(toolCalls.map(toolCall => this.handleToolCall(toolCall)));

            const actionableResults = toolResults.filter(result => result !== null);
            if (actionableResults.length === 0) {
                console.log("No actionable results");
                continue;
            }
            messages.push({
                role: "user",
                content: actionableResults.map(result => ({
                    type: "tool_result",
                    tool_use_id: result.id,
                    content: [result.type === "text" ? {
                        type: "text",
                        text: result.content
                    } : {
                        type: "image",
                        source: {
                            media_type: "image/jpeg",
                            type: "base64",
                            data: result.content
                        }
                    }
                    ]
                }))
            });
        }
    }

    async handleToolCall(toolCall: ToolCall): Promise<ToolResult | null> {
        console.log("Tool call: ", toolCall);
        console.log("Tool call input: ", toolCall.input);
        const name = toolCall.name;
        const action = toolCall.input.action;
        console.log(pc.yellow(`Executing action: ${action}`));

        if (name === "computer" && action === "screenshot") {
            const screenshotPath = await this.callbacks.takeScreenshot();
            console.log(pc.green(`Screenshot taken: ${screenshotPath}`));

            const screenshotBase64 = await fs.readFile(screenshotPath, { encoding: 'base64' });
            return {
                id: toolCall.id,
                type: "image",
                content: screenshotBase64
            }
        }

        if (name === "computer" && action === "mouse_move") {
            console.log(pc.green(`Mouse moved`));
            const [x, y] = toolCall.input.coordinate;
            await this.callbacks.takeAction("move", { x, y });
            return {
                id: toolCall.id,
                type: "text",
                content: "done"
            }
        }

        if (name === "computer" && action === "left_click") {
            console.log(pc.green(`Left clicked`));
            await this.callbacks.takeAction("click");
            return {
                id: toolCall.id,
                type: "text",
                content: "done"
            }
        }

        if (name === "computer" && action === "type") {
            console.log(pc.green(`Typed`));
            await this.callbacks.takeAction("type", undefined, toolCall.input.text);
            return {
                id: toolCall.id,
                type: "text",
                content: "done"
            }
        }

        return null
    }


}