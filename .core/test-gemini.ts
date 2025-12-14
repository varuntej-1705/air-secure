import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("API Key present:", !!apiKey);
    console.log("API Key (first 10 chars):", apiKey?.substring(0, 10));

    try {
        const genAI = new GoogleGenerativeAI(apiKey!);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent("Say hello!");
        const response = await result.response;
        const text = response.text();
        console.log("Success! Response:", text);
    } catch (error: any) {
        console.error("Error:", error);
        console.error("Error message:", error?.message);
        console.error("Error status:", error?.status);
        console.error("Error details:", error?.statusText);
    }
}

testGemini();
