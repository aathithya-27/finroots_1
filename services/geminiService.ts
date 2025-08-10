// SECURITY WARNING: In a production application, this file should not exist on the
// frontend. API calls to services like Google Gemini should be made from a secure
// backend server where the API key can be safely stored and managed. Exposing an
// API key on the client-side is a significant security risk.

import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Member, VoiceNote, Policy, UpsellOpportunity, TodaysFocusItem, Lead, FinancialProfile } from '../types.ts';
import { generateDigipin as generateDigipinUtil } from './apiService.ts';

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fallback_generateDigipinFromCoords = async (lat: number, lng: number): Promise<string> => {
    // A simple, non-geographic fallback for demonstration.
    return `FB-LOC-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
};


const fallback_getCoordsFromDigipin = async (digipin: string): Promise<{ lat: number; lng: number } | null> => {
    // This is a simplified fallback for demonstration purposes.
    // A more robust fallback could use a local library or a different geocoding service.
    await simulateDelay(400);
    // Simulate a successful response for a known test location (e.g., Hosur)
    if (digipin === '7J5R9R5Q+5R') {
        return { lat: 12.722, lng: 77.832 };
    }
    // Simulate failure for other codes
    return null;
};


if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Gemini features will be disabled. Using fallback AI.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

/**
 * Implements the Soundex algorithm to generate a phonetic code for a string.
 * This helps in finding names that sound similar but are spelled differently.
 * @param s The input string (typically a name).
 * @returns The 4-character Soundex code.
 */
const soundex = (s: string): string => {
    if (!s) {
        return "";
    }
    const a = s.toLowerCase().split('');
    const f = a.shift()!.toUpperCase();
    let r = '';
    const codes: { [key: string]: string } = {
        a: '', e: '', i: '', o: '', u: '',
        b: '1', f: '1', p: '1', v: '1',
        c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
        d: '3', t: '3',
        l: '4',
        m: '5', n: '5',
        r: '6'
    };
    r = f +
        a
        .map(v => codes[v])
        .filter((v, i, a) => ((i === 0) ? v !== codes[f.toLowerCase()] : v !== a[i - 1]))
        .join('');
    return (r + '000').slice(0, 4);
};

/**
 * Extracts structured data from an image of a document (PAN, Aadhaar) using Gemini.
 * @param base64Image The base64 encoded image string.
 * @param mimeType The MIME type of the image.
 * @returns A promise resolving to an object with extracted data or null.
 */
export const extractDataFromImage = async (
    base64Image: string, 
    mimeType: string,
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<{ idNumber: string; name: string; address: string; phoneNumber: string; dob: string; } | null> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback AI for OCR.", "error");
        return null; // Fallback for OCR is disabled for brevity
    }
    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType,
            },
        };

        const prompt = `
Analyze the provided document image (likely an Indian PAN or Aadhaar card). Your task is to extract the following information and return it as a JSON object:
- "idNumber": The main identification number (PAN number or Aadhaar number).
- "name": The full name of the person.
- "dob": The date of birth in YYYY-MM-DD format.
- "address": The full address, if available.
- "phoneNumber": The mobile number, if available.

If a field is not present or clearly visible on the document, return an empty string "" for that field.
Return only the raw JSON object.
`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                temperature: 0.1,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        idNumber: { type: Type.STRING },
                        name: { type: Type.STRING },
                        dob: { type: Type.STRING },
                        address: { type: Type.STRING },
                        phoneNumber: { type: Type.STRING },
                    },
                     required: ["idNumber", "name", "dob", "address", "phoneNumber"]
                }
            }
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("Gemini API error in extractDataFromImage:", error);
        if(addToast) addToast("Gemini OCR failed, using fallback.", "error");
        return null;
    }
};

/**
 * Analyzes a payment proof screenshot using Gemini.
 * @param base64Image The base64 encoded image string.
 * @param mimeType The MIME type of the image.
 * @param expectedAmount The premium amount to verify against.
 * @returns A promise that resolves to the extracted payment details.
 */
export const analyzePaymentProof = async (
    base64Image: string,
    mimeType: string,
    expectedAmount: number,
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<Policy['paymentDetails']> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback AI for proof analysis.", "error");
        return { transactionId: 'N/A', amount: '0', date: '', status: 'Unverified', statusReason: 'Fallback AI used.' };
    }
    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType,
            },
        };

        const prompt = `
You are an expert financial document analyst. Analyze the following payment confirmation screenshot.
Your task is to extract the transaction ID, the total amount paid, and the date of the transaction.

- The expected payment amount is ${expectedAmount}.
- Compare the extracted amount with the expected amount.
- The 'transactionId' should be any unique reference number (UPI Transaction ID, reference no., etc.). If none is found, return "N/A".
- The 'amount' should be the numerical value of the transaction.
- The 'date' should be the date of the transaction in YYYY-MM-DD format.
- The 'status' must be one of: "Verified", "Mismatch", "Unverified".
  - "Verified": The extracted amount exactly matches the expected amount.
  - "Mismatch": The extracted amount does not match the expected amount.
  - "Unverified": The amount could not be clearly extracted from the image.
- The 'statusReason' should explain the status. For "Mismatch", it must state "Extracted amount [X] does not match expected amount [Y]". For "Unverified", explain why. For "Verified", state "Amount matches expected premium."

Return a single JSON object. Do not include any other text, explanation, or markdown formatting. Just the raw JSON object.
`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                temperature: 0,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        transactionId: { type: Type.STRING },
                        amount: { type: Type.STRING },
                        date: { type: Type.STRING },
                        status: { type: Type.STRING },
                        statusReason: { type: Type.STRING },
                    },
                    required: ["transactionId", "amount", "date", "status", "statusReason"]
                }
            }
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        // Additional validation
        if (result.status && ['Verified', 'Mismatch', 'Unverified'].includes(result.status)) {
            return result as Policy['paymentDetails'];
        }
        throw new Error("Invalid status received from AI.");

    } catch (error) {
        console.error("Gemini API error in analyzePaymentProof:", error);
        if(addToast) addToast("Gemini analysis failed, using fallback.", "error");
        return { transactionId: 'N/A', amount: '0', date: '', status: 'Unverified', statusReason: 'Fallback AI used.' };
    }
};

/**
 * Generates a Plus Code-like Digipin from coordinates using a simulated AI call.
 * @param lat The latitude.
 * @param lng The longitude.
 * @returns A promise resolving to the generated Digipin string.
 */
export const generateDigipinFromCoords = async (
    lat: number,
    lng: number,
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<string> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback AI for Digipin generation.", "error");
        return fallback_generateDigipinFromCoords(lat, lng);
    }
    try {
        // This is a simulation. In a real scenario, you might send coordinates to Gemini
        // with a prompt asking it to return a Plus Code or a custom smart ID.
        // For this demo, we use a local utility function to simulate the generation.
        const digipin = generateDigipinUtil(lat, lng);
        return digipin;
    } catch (error) {
        console.error("Gemini API simulation error in generateDigipinFromCoords:", error);
        if(addToast) addToast("Digipin generation failed, using fallback.", "error");
        return fallback_generateDigipinFromCoords(lat, lng);
    }
};

/**
 * NEW: Resolves a Plus Code-style Digipin to its latitude and longitude coordinates.
 * This enables the two-way synchronization feature.
 * @param digipin The Plus Code string (e.g., '7J5R9R5Q+5R').
 * @param addToast Optional toast function for user feedback.
 * @returns A promise that resolves to an object with lat and lng, or null on failure.
 */
export const getCoordsFromDigipin = async (
    digipin: string,
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<{ lat: number; lng: number } | null> => {
    // If the API key isn't set, use the fallback mechanism immediately.
    if (!process.env.API_KEY) {
        if (addToast) addToast("Using fallback AI for Digipin resolution.", "error");
        return fallback_getCoordsFromDigipin(digipin);
    }
    try {
        // Construct a clear prompt for the Gemini API.
        const prompt = `
            You are a highly accurate geocoding service.
            Your task is to resolve the given Google Plus Code (also known as a Digipin) into its corresponding geographic coordinates.
            The Plus Code is: "${digipin}"
            
            Return a valid JSON object with two keys:
            - "lat": The latitude as a number.
            - "lng": The longitude as a number.

            Do not include any other text, explanation, or markdown formatting. Just the raw JSON object.
        `;

        // Make the API call to Gemini.
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                temperature: 0, // Set to 0 for deterministic, factual responses.
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        lat: { type: Type.NUMBER },
                        lng: { type: Type.NUMBER },
                    },
                    required: ['lat', 'lng'],
                },
            },
        });

        // Parse the JSON response.
        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        // Basic validation to ensure we got numbers back.
        if (typeof result.lat === 'number' && typeof result.lng === 'number') {
            return result;
        } else {
            throw new Error("Invalid coordinate format received from AI.");
        }

    } catch (error) {
        console.error("Gemini API error in getCoordsFromDigipin:", error);
        if (addToast) addToast("AI Digipin resolution failed, using fallback.", "error");
        // On any error, revert to the fallback function.
        return fallback_getCoordsFromDigipin(digipin);
    }
};


const fallback_enrichDigipinLocation = async (lat: number, lng: number): Promise<{ summary: string, landmarks: string[] }> => {
    await simulateDelay(300);
    return {
        summary: "Fallback: A busy commercial area with several shops.",
        landmarks: ["Nearby Landmark A", "Local Park B", "City Hall C"],
    };
};

/**
 * Enriches a location with a summary and nearby landmarks using Gemini.
 * @param lat The latitude.
 * @param lng The longitude.
 * @returns A promise resolving to an object with a summary and a list of landmarks.
 */
export const enrichDigipinLocation = async (
    lat: number,
    lng: number,
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<{ summary: string, landmarks: string[] }> => {
    if (!process.env.API_KEY) {
        if (addToast) addToast("Using fallback AI for location enrichment.", "error");
        return fallback_enrichDigipinLocation(lat, lng);
    }
    try {
        const prompt = `
            Given the coordinates latitude=${lat} and longitude=${lng}, analyze the location.
            Provide a concise, one-sentence summary describing the area (e.g., "A dense residential area with local markets.").
            Also, list up to 3 notable nearby landmarks (e.g., "City Park", "Main Street Mall", "Grand Central Station").
            Return a valid JSON object with two keys: "summary" (a string) and "landmarks" (an array of strings).
            Do not include any other text, explanation, or markdown formatting.
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                temperature: 0.3,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        landmarks: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                    },
                    required: ['summary', 'landmarks'],
                },
            },
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("Gemini API error in enrichDigipinLocation:", error);
        if (addToast) addToast("AI enrichment failed, using fallback.", "error");
        return fallback_enrichDigipinLocation(lat, lng);
    }
};

/**
 * Summarizes an uploaded document (image or PDF handled as an image) using Gemini.
 * @param base64Data The base64 encoded document data.
 * @param mimeType The MIME type of the document.
 * @returns A summary of the document.
 */
export const summarizeDocument = async (
    base64Data: string, 
    mimeType: string,
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<string> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback AI for summarization.", "error");
        return 'Fallback: Summarization unavailable.';
    }
    try {
        const documentPart = {
            inlineData: {
                data: base64Data,
                mimeType,
            },
        };

        const textPart = {
            text: "You are an expert insurance document analyst. Summarize the following document. Extract key details like Policy Holder Name, Policy Type, Coverage Amount, Premium, and Policy Number. Present the information clearly and concisely in a bulleted list. If a field is not found, state 'Not Available'.",
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [documentPart, textPart] },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Gemini API error in summarizeDocument:", error);
        if(addToast) addToast("Gemini summarization failed, using fallback.", "error");
        return 'Fallback: Summarization unavailable.';
    }
};


/**
 * Generates policy suggestions based on a member's profile.
 * @param member The member's data.
 * @returns A string containing policy suggestions.
 */
export const getPolicySuggestions = async (
    member: Member,
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<string> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback AI for suggestions.", "error");
        return 'Fallback: Consider a top-up health plan.';
    }
    try {
        const policies = (member.policies && Array.isArray(member.policies)) ? member.policies : [];
        const existingPoliciesStr = policies.length > 0 ? policies.map(p => p.policyType).join(', ') : 'None';

        const prompt = `
            Based on the following customer profile, suggest 2 suitable additional policies for upselling. 
            For each suggestion, provide a short (1-2 sentence) rationale explaining why it's a good fit.
            Format the output as a clean, readable text. Do not use markdown.

            **Customer Profile:**
            - Age: ${new Date().getFullYear() - new Date(member.dob).getFullYear()}
            - City: ${member.city}
            - Marital Status: ${member.maritalStatus}
            - Existing Policies: ${existingPoliciesStr}

            **Suggestions:**
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
            }
        });

        return response.text;

    } catch (error) {
        console.error("Gemini API error in getPolicySuggestions:", error);
        if(addToast) addToast("Gemini suggestions failed, using fallback.", "error");
        return 'Fallback: Consider a top-up health plan.';
    }
};

/**
 * Filters members based on a natural language query, now with phonetic search.
 * @param query The natural language search query from the user.
 * @param members The full list of members.
 * @returns A promise that resolves to an array of member IDs that match the query.
 */
export const searchMembersWithNL = async (
    query: string, 
    members: Member[], 
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<string[]> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback for AI search.", "error");
        return [];
    }
    if (!query) {
        return members.map(m => m.id); // Return all if query is empty
    }

    // Augment member data with Soundex codes for phonetic matching
    const membersWithSoundex = members.map(member => ({
        ...member,
        nameSoundex: soundex(member.name)
    }));
    
    // Generate a soundex code for the query if it looks like a name
    const querySoundex = soundex(query.split(' ')[0]);

    try {
        const prompt = `
You are an intelligent data filtering assistant for a CRM with phonetic search capabilities. Your task is to analyze a natural language query and a JSON array of member data. You must return a JSON array containing only the IDs of the members that strictly match the user's query.

Matching Rules (in order of priority):
1.  **Direct & Fuzzy Text Match:** Analyze the user's query for criteria related to any fields in the member objects (id, name, city, memberId, etc.). This includes misspellings.
2.  **Phonetic Name Match:** If the query looks like a name, compare its Soundex code with the 'nameSoundex' field in the member data. This finds names that sound similar.
3.  **memberId Prefix Match**: If the user query seems to be a member ID, you should also include any members whose \`memberId\` **starts with** that query.
4.  **Date & Location:** Handle relative date calculations (today is ${new Date().toISOString().split('T')[0]}) and location queries.

A member is a match if they satisfy ANY of these conditions. Your response MUST be a valid JSON array of strings, where each string is a member 'id'. Do not include any other text, explanation, or markdown.

User Query: "${query}"
Query's Soundex Code (for name matching): "${querySoundex}"

Member Data (with phonetic codes):
${JSON.stringify(membersWithSoundex)}

JSON array of matching IDs:
`;
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0,
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    },
                    description: "An array of member IDs that match the user's query."
                }
            }
        });
        
        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        if (Array.isArray(result) && result.every(item => typeof item === 'string')) {
            return result;
        } else {
            console.error("AI response was not a valid array of strings:", result);
            return [];
        }

    } catch (error) {
        console.error("Gemini API error in searchMembersWithNL:", error);
        if(addToast) addToast("Gemini search failed, using basic search.", "error");
        return [];
    }
};

/**
 * Generates a contextual response for the FinBot admin-facing chatbot.
 * @param userMessage The latest message from the user.
 * @param members The full list of members to provide context.
 * @returns A promise that resolves to the bot's text response.
 */
export const getChatbotResponse = async (
    userMessage: string, 
    members: Member[],
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<string> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback AI for chatbot.", "error");
        return "Fallback: I can help with basic queries only.";
    }

    try {
        const prompt = `
You are FinBot, a friendly and highly capable AI assistant for a financial advisor using the FinRoots CRM. Your goal is to help the advisor manage their customers efficiently.
You have access to the following customer data in JSON format. Use this data to answer the advisor's questions.

- Today's date is: ${new Date().toISOString().split('T')[0]}.
- When asked for policies, list them clearly with policyType, premium, and renewal date.
- When asked for upsell suggestions, be creative and provide a rationale based on the customer's profile (age, marital status, existing policies).
- If asked about a customer, provide a brief summary (name, member type, location, active status).
- If the user's query is unclear, ask for clarification.
- Keep your responses concise, helpful, and formatted for easy reading in a chat window (e.g., use bullet points *).
- Your responses should be directly to the advisor, not to the end customer.

Advisor's message: "${userMessage}"

Customer Data:
${JSON.stringify(members, null, 2)}

Your response:
`;
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.5,
            }
        });

        return response.text;
    } catch (error) {
        console.error("Gemini API error in getChatbotResponse:", error);
        if(addToast) addToast("Gemini chat failed, using fallback.", "error");
        return "Fallback: I can help with basic queries only.";
    }
};

/**
 * Generates a response for a client in the simulator, acting as an automated assistant.
 * @param userMessage The message from the simulated client.
 * @returns A promise that resolves to the bot's text response to the client.
 */
export const getAutomatedClientResponse = async (
    userMessage: string,
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<string> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback AI for client chat.", "error");
        return 'Fallback: An agent will be with you shortly.';
    }

    try {
        const prompt = `
You are a helpful, polite, and professional AI assistant for FinRoots, a financial consultancy.
You are chatting with a customer. Your goal is to answer their questions accurately and concisely.
- If the user asks about policy details, claims, or renewals, politely inform them that you can help and ask them to provide their policy number or registered mobile number for verification.
- If the user's query is about a topic you don't recognize, provide a friendly response stating that you will connect them with a human agent who can better assist.
- Do not invent any personal or policy information.
- Keep your responses short and to the point.

Customer's message: "${userMessage}"

Your response:
`;
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.6,
                thinkingConfig: { thinkingBudget: 0 } // faster response for client chat
            }
        });

        return response.text;
    } catch (error) {
        console.error("Gemini API error in getAutomatedClientResponse:", error);
        if(addToast) addToast("Gemini client chat failed, using fallback.", "error");
        return 'Fallback: An agent will be with you shortly.';
    }
};


/**
 * Generates an optimal route for visiting multiple customers.
 * @param customers The list of customers to visit, including their locations.
 * @param userLocation The starting location of the user.
 * @returns A promise that resolves to an ordered array of customer IDs.
 */
export const getOptimalRoute = async (
    customers: Member[], 
    userLocation: { lat: number, lng: number },
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<string[]> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback for route planning.", "error");
        return [];
    }
    if (customers.length <= 1) {
        return customers.map(c => c.id);
    }

    try {
        const prompt = `
You are a route optimization expert. Your task is to find the most efficient route to visit a list of customers, starting from a given user location.
You must return a JSON array containing the customer 'id's in the optimal travel order.

- The route should minimize total travel time.
- The first stop should be the one closest to the user's starting location.
- Your response MUST be a valid JSON array of strings, where each string is a customer 'id'. Do not include any other text, explanation, or markdown formatting. Just the raw array.

User's Start Location:
${JSON.stringify(userLocation)}

Customers to Visit (with their locations):
${JSON.stringify(customers.map(c => ({ id: c.id, name: c.name, lat: c.lat, lng: c.lng })))}

JSON array of optimally ordered customer IDs:
`;
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.1, // Low temperature for deterministic routing
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    },
                    description: "An array of optimally ordered customer IDs."
                }
            }
        });

        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        if (Array.isArray(result) && result.every(item => typeof item === 'string')) {
            // Basic validation to ensure all requested IDs are returned
            if(result.length === customers.length && result.every(id => customers.find(c => c.id === id))) {
               return result;
            }
        }
        
        console.error("AI response for routing was not a valid array of all customer IDs:", result);
        if(addToast) addToast("Gemini routing failed, using fallback.", "error");
        return [];

    } catch (error) {
        console.error("Gemini API error in getOptimalRoute:", error);
        if(addToast) addToast("Gemini routing failed, using fallback.", "error");
        return [];
    }
};

/**
 * Finds clients located on a plausible travel route between two locations.
 * @param startLocationName The name of the starting location (e.g., "Erode, Tamil Nadu").
 * @param endLocationName The name of the ending location (e.g., "Coimbatore, Tamil Nadu").
 * @param members The full list of members.
 * @returns A promise that resolves to an array of member IDs that are on the route.
 */
export const findClientsOnRoute = async (
    startLocationName: string, 
    endLocationName: string, 
    members: Member[],
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<string[]> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback for path finding.", "error");
        return [];
    }
    if (!startLocationName || !endLocationName || members.length === 0) {
        return [];
    }

    try {
        const customerDataForPrompt = members
            .filter(m => m.city && m.state)
            .map(m => ({
                id: m.id,
                name: m.name,
                location: `${m.city}, ${m.state}`
            }));

        const prompt = `
You are a geospatial logistics analyst. Your task is to identify which customers from a provided list are located on or very near a plausible travel route between a given start and end location in India.

- Consider major highways and logical travel paths, not just a straight line.
- A customer is on the route if their location is in the start/end cities themselves, or in cities/towns that a person would likely drive through when traveling from the start to the end location.
- Your response MUST be a valid JSON array of strings, where each string is a customer 'id' that falls on the route.
- If no customers are on the route, return an empty array: [].
- Do not include any other text, explanation, or markdown formatting. Just the raw array.

Start Location: "${startLocationName}"
End Location: "${endLocationName}"

Customer Data:
${JSON.stringify(customerDataForPrompt)}

JSON array of matching customer IDs on the route:
`;
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0,
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    },
                    description: "An array of customer IDs that are located on the travel route."
                }
            }
        });
        
        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        if (Array.isArray(result) && result.every(item => typeof item === 'string')) {
            return result;
        } else {
            console.error("AI response was not a valid array of strings:", result);
            if(addToast) addToast("Gemini path finding failed, using fallback.", "error");
            return [];
        }

    } catch (error) {
        console.error("Gemini API error in findClientsOnRoute:", error);
        if(addToast) addToast("Gemini path finding failed, using fallback.", "error");
        return [];
    }
};

/**
 * Transcribes an audio file to English text using Gemini.
 * It can handle multiple source languages (English, Hindi, Tamil, Telugu, Malayalam).
 * @param base64Audio The base64 encoded audio string.
 * @param mimeType The MIME type of the audio file.
 * @returns A promise that resolves to the English transcript.
 */
export const transcribeAudioToEnglish = async (
    base64Audio: string, 
    mimeType: string,
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<string> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback AI for transcription.", "error");
        return 'Fallback: Transcription unavailable.';
    }
    try {
        const audioPart = {
            inlineData: {
                data: base64Audio,
                mimeType,
            },
        };

        const prompt = `
            You are an expert multilingual transcriptionist. The user has provided an audio recording that could be in English, Hindi, Tamil, Telugu, or Malayalam.
            Your task is to accurately transcribe the speech from the audio.
            Regardless of the original language spoken, you MUST provide the final transcription in English. Translate the content to English if the original language is not English.
            If the audio is unclear or contains no speech, return an empty string. Do not add any explanatory text, just the transcript.
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [audioPart, { text: prompt }] },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Gemini API error in transcribeAudioToEnglish:", error);
        if(addToast) addToast("Gemini transcription failed, using fallback.", "error");
        return 'Fallback: Transcription unavailable.';
    }
};

/**
 * Summarizes a voice transcript using the Gemini API.
 * @param transcript The raw text transcript.
 * @param clientName The name of the client.
 * @param previousSummaries Optional array of previous summaries for context.
 * @returns A promise that resolves to a structured VoiceNote object.
 */
export const summarizeTranscript = async (
    transcript: string, 
    clientName: string, 
    previousSummaries: string[] = [],
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<Omit<VoiceNote, 'id' | 'filename' | 'audioUrl'> | null> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback AI for summarization.", "error");
        return null;
    }
    try {
        const contextPrompt = previousSummaries.length > 0 
        ? `
---
For context, here are summaries of previous notes for this client. Use them to avoid repetition and understand the ongoing conversation.
${previousSummaries.map((s, i) => `Previous Note ${i + 1}:\n${s}`).join('\n\n')}
---
` 
        : '';
        
        const prompt = `
You are a multilingual client documentation assistant trained for CRM (Client Relationship Management) systems.
An admin is recording spoken notes about a client during or after meetings. These notes may include updates, instructions, concerns, service preferences, or personal details relevant to the client’s case. These recordings may be in any language and are transcribed automatically.

Your job is to:
1. Understand the context and language of the transcript.
2. Summarize the key points clearly and professionally.
3. After the summary, analyze the transcript for any explicit action items or tasks for the advisor. Extract these into the 'actionItems' array.
4. Return output that can be stored in the CRM system’s client document section and shown in the UI.
${contextPrompt}
---

🧾 Here is the NEW transcript to process:
""" 
${transcript}
"""

👤 Client: ${clientName}  
🗓️ Date of Recording: ${new Date().toISOString().split('T')[0]}  

---

🎯 INSTRUCTIONS:
- If the transcript contains multiple topics, break them into bullet points.
- Do not omit important service-related information.
- Keep the tone professional and client-centric.
- For the 'actionItems', extract specific to-do items mentioned (e.g., "send the brochure", "follow up next week"). If no actions are found, return an empty array.
- Output must be in **English** regardless of input language.

---

📦 OUTPUT FORMAT (JSON):
`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.2,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        client: { type: Type.STRING },
                        recording_date: { type: Type.STRING },
                        detected_language: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        status: { type: Type.STRING },
                        transcript_snippet: { type: Type.STRING },
                        actionItems: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING },
                            description: "A list of action items for the advisor."
                        }
                    },
                    required: ["client", "recording_date", "detected_language", "summary", "tags", "status", "transcript_snippet", "actionItems"]
                }
            }
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        if(addToast) addToast("Gemini quota exceeded. Using fallback for summarization.", "error");
        return null;
    }
};

type NoteWithContext = {
    noteId: string;
    clientName: string;
    summary: string;
    recording_date: string;
}

export type SearchResult = { noteId: string, matchedText: string[] };

export const searchVoiceNotes = async (
    query: string, 
    notes: NoteWithContext[],
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<SearchResult[]> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback for voice note search.", "error");
        return [];
    }
    try {
        const prompt = `
You are an intelligent search assistant for a CRM. Your task is to find relevant voice note summaries that match a user's query. You can handle both semantic text search and date-based queries.

- Today's date is: ${new Date().toISOString().split('T')[0]}. Use this for any relative date calculations (e.g., "notes from last week", "yesterday's notes", "notes created on 2024-07-15").
- The user's query is: "${query}"

Here is the list of available notes in JSON format. Analyze both the 'summary' for semantic content and the 'recording_date' for date-based filtering.
${JSON.stringify(notes)}

Instructions:
1. Analyze the user's query for semantic content and/or date criteria.
2. Identify which notes are relevant to the query. A note is relevant if its summary matches the text OR if its recording_date matches the date criteria.
3. For each relevant note, extract the specific words or phrases from its summary that best match the textual part of the query. If the query is only date-based, you can return an empty array for matchedText.
4. Return a JSON array of objects. Each object must contain 'noteId' of the matching note and 'matchedText', an array of the exact words or phrases you found.
5. If no notes match, return an empty array [].
6. Your response MUST be a valid JSON array. Do not include any other text or explanation.
`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0,
                responseSchema: {
                    type: Type.ARRAY,
                    description: "An array of objects, where each object represents a matching voice note.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            noteId: {
                                type: Type.STRING,
                                description: "The ID of the matching voice note."
                            },
                            matchedText: {
                                type: Type.ARRAY,
                                description: "An array of strings containing the exact words or phrases from the summary that match the query.",
                                items: {
                                    type: Type.STRING
                                }
                            }
                        }
                    }
                }
            }
        });
        
        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        if (Array.isArray(result)) {
            return result as SearchResult[];
        }
        return [];

    } catch (error) {
        console.error("Gemini API error in searchVoiceNotes:", error);
        if(addToast) addToast("Gemini voice note search failed, using fallback.", "error");
        return [];
    }
};

/**
 * Analyzes a competitor's policy document and suggests talking points.
 * @param base64Data The base64 encoded document data.
 * @param mimeType The MIME type of the document.
 * @returns A string containing talking points.
 */
export const analyzeCompetitorPolicy = async (
    base64Data: string, 
    mimeType: string,
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<string> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback for competitor analysis.", "error");
        return 'Fallback: Competitor analysis unavailable.';
    }
    try {
        const documentPart = {
            inlineData: {
                data: base64Data,
                mimeType,
            },
        };

        const prompt = `
You are an expert insurance analyst. Analyze the following policy document from a competitor.
Your task is to identify three potential weaknesses, gaps in coverage, or areas that could be improved upon.
This is for an advisor who wants to convince the client to switch or augment their coverage.
Format the output as a bulleted list of talking points. Be specific and actionable.

Example talking points:
- "The medical coverage of 5 Lakhs is low for a metro area; we can offer 10 Lakhs for a similar premium."
- "This policy appears to lack a critical illness rider, which is a significant gap."
- "The deductible of 50,000 INR is quite high; we can offer plans with a lower deductible."

If the document is unclear, state that.
`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [documentPart, { text: prompt }] },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Gemini API error in analyzeCompetitorPolicy:", error);
        if(addToast) addToast("Gemini competitor analysis failed, using fallback.", "error");
        return 'Fallback: Competitor analysis unavailable.';
    }
};


/**
 * Forecasts customer growth for the next 3 months.
 * @param historicalData An array of past customer growth data.
 * @returns A promise that resolves to an array of forecast data.
 */
export const forecastCustomerGrowth = async (
    historicalData: { name: string, Customers: number }[],
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<{ name: string, Customers: number }[]> => {
    if (!process.env.API_KEY) {
        if (addToast) addToast("Using fallback AI for forecast.", "error");
        return [];
    }
    try {
        const prompt = `
            Given the following historical data of customer acquisition over the last 6 months, project the likely number of customers for the next 3 months.
            Analyze the trend (is it growing, shrinking, or stable?).
            Return a JSON array with three objects, one for each of the next three months. Each object should have 'name' (the month abbreviation, e.g., 'Sep \'24') and 'Customers' (the projected number).
            Your response MUST be a valid JSON array. Do not include any other text or explanation.

            Historical Data:
            ${JSON.stringify(historicalData)}
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.4,
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            Customers: { type: Type.INTEGER }
                        }
                    }
                }
            }
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        if(addToast) addToast("Gemini forecast failed, using fallback.", "error");
        return [];
    }
};


/**
 * Suggests an efficient trip to visit a cluster of nearby clients.
 * @param userLocation The user's current location.
 * @param members The full list of members.
 * @returns A promise that resolves to an array of 3-4 ordered client IDs.
 */
export const suggestSmartTrip = async (
    userLocation: { lat: number, lng: number }, 
    members: Member[],
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<string[]> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback for trip suggestion.", "error");
        return [];
    }
    try {
        const prompt = `
            You are a logistics expert for a financial advisor. The advisor is at [${userLocation.lat}, ${userLocation.lng}].
            Here is a list of all their clients and their locations.
            Your task is to identify a cluster of 3-4 clients that are geographically close to each other, making for an efficient half-day trip.
            The starting point of the trip is the advisor's current location. The suggested route should be a logical travel path.
            
            Return a JSON array containing the 'id's of the 3 or 4 clients in the optimally ordered sequence for the trip.
            Your response MUST be a valid JSON array of strings. Do not include any other text or explanation.

            Client List:
            ${JSON.stringify(members.map(m => ({ id: m.id, name: m.name, lat: m.lat, lng: m.lng })))}
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.2,
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("Gemini API error in suggestSmartTrip:", error);
        if(addToast) addToast("Gemini trip suggestion failed, using fallback.", "error");
        return [];
    }
};

/**
 * Generates a comprehensive annual review for a client using Gemini.
 * @param member The member data.
 * @param allOpportunities The list of all upsell opportunities.
 * @returns A promise that resolves to the formatted review text.
 */
export const generateAnnualReview = async (
    member: Member, 
    allOpportunities: UpsellOpportunity[],
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<string> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback AI for annual review.", "error");
        return "Fallback: Annual review generation unavailable.";
    }
    try {
        const memberOpportunities = allOpportunities.find(op => op.memberId === member.id);

        const policies = (member.policies && Array.isArray(member.policies)) ? member.policies : [];
        const totalPolicies = policies.length;
        const totalPremium = policies.reduce((sum, p) => sum + p.premium, 0);
        const policyPortfolio = totalPolicies > 0 
            ? policies.map(p => `- ${p.policyType}: Coverage of ₹${p.coverage.toLocaleString('en-IN')}, renewing on ${new Date(p.renewalDate).toLocaleDateString('en-GB')}.`).join('\n')
            : '- No policies on file.';

        const voiceNotes = (member.voiceNotes && Array.isArray(member.voiceNotes)) ? member.voiceNotes : [];
        const recentVoiceNotes = voiceNotes.length > 0 
            ? voiceNotes.slice(-2).map(n => `- Note from ${new Date(n.recording_date).toLocaleDateString('en-GB')}: ${n.summary}`).join('\n') 
            : '- No recent voice notes on file.';


        const prompt = `
            You are a professional financial advisor's assistant. Your task is to generate a structured and personalized annual review document for a client.
            The tone should be professional, positive, and client-centric.
            The output must be a clean, readable text document. Use markdown for headings (#, ##) and lists (-). Do not use tables.

            Client Details:
            - Name: ${member.name}
            - Member Since: (Assume 2 years ago)
            - Current Tier: ${member.memberType}
            - Total Policies: ${totalPolicies}
            - Total Annual Premium: ₹${totalPremium.toLocaleString('en-IN')}

            Policy Portfolio:
            ${policyPortfolio}

            Recent Voice Note Summaries:
            ${recentVoiceNotes}

            Available Upsell Recommendations:
            ${memberOpportunities ? memberOpportunities.suggestions : '- No specific new opportunities at this time. Current portfolio is robust.'}

            Instructions:
            1.  Start with a personalized introduction for "${member.name}".
            2.  Create a "Portfolio Overview" section summarizing their current policies.
            3.  Create a "Recommendations for the Year Ahead" section based on the upsell opportunities. If none, state that their portfolio is strong but will be continuously monitored.
            4.  Create a "Key Discussion Points" section. Mention long-term goals and summarize any action items from recent voice notes.
            5.  End with a positive closing statement.
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.6,
            }
        });

        return response.text;

    } catch (error) {
        console.error("Gemini API error in generateAnnualReview:", error);
        if(addToast) addToast("Gemini review generation failed, using fallback.", "error");
        return "Fallback: Annual review generation unavailable.";
    }
};


/**
 * Summarizes a manually typed text note using the Gemini API.
 * @param manualText The raw text of the note.
 * @param clientName The name of the client.
 * @returns A promise that resolves to a structured VoiceNote-like object.
 */
export const summarizeManualText = async (
    manualText: string, 
    clientName: string,
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<Omit<VoiceNote, 'id' | 'filename' | 'audioUrl'>> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback AI for summarization.", "error");
        return { client: clientName, recording_date: new Date().toISOString(), summary: manualText, transcript_snippet: manualText, detected_language: 'N/A', tags: [], status: 'Fallback', actionItems: [] };
    }
    try {
        const prompt = `
You are a client documentation assistant. An admin has written a manual note about a client.

Your job is to:
1. Summarize the key points of the note clearly and professionally.
2. After the summary, analyze the note for any explicit action items or tasks. Extract these into the 'actionItems' array.
---

🧾 Here is the NEW NOTE to process:
""" 
${manualText}
"""

👤 Client: ${clientName}  
🗓️ Date of Recording: ${new Date().toISOString().split('T')[0]}  

---

🎯 INSTRUCTIONS:
- For 'summary', create a concise summary of the manual text.
- For 'actionItems', extract specific to-do items mentioned. If none, return an empty array.
- The 'transcript_snippet' should be the full original manual text.
- Set 'detected_language' to "English".
- Set 'status' to "Processed".

---

📦 OUTPUT FORMAT (JSON):
`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.2,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        client: { type: Type.STRING },
                        recording_date: { type: Type.STRING },
                        detected_language: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        status: { type: Type.STRING },
                        transcript_snippet: { type: Type.STRING },
                        actionItems: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING },
                            description: "A list of action items for the advisor."
                        }
                    },
                    required: ["client", "recording_date", "detected_language", "summary", "tags", "status", "transcript_snippet", "actionItems"]
                }
            }
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        if(addToast) addToast("Gemini note summarization failed. Using fallback.", "error");
        return { client: clientName, recording_date: new Date().toISOString(), summary: manualText, transcript_snippet: manualText, detected_language: 'N/A', tags: [], status: 'Fallback', actionItems: [] };
    }
};

/**
 * Generates a prioritized list of focus items for the advisor's dashboard.
 * @param context An object containing all relevant CRM data.
 * @returns A promise that resolves to an array of TodaysFocusItem objects.
 */
export const generateTodaysFocus = async (
    context: {
        members: Member[];
        leads: Lead[];
        notifications: any[];
        upsellOpportunities: UpsellOpportunity[];
    },
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<TodaysFocusItem[]> => {
    if (!process.env.API_KEY) {
        if (addToast) addToast("Using fallback for Today's Focus.", "error");
        return [];
    }
    try {
        const prompt = `
You are a smart CRM assistant. Your task is to analyze the daily data for a financial advisor and generate a prioritized list of up to 5 "Today's Focus" items. These items should be the most important actions for the advisor to take today.

Here is the data:
- Today's Date: ${new Date().toISOString().split('T')[0]}
- Upcoming Notifications (renewals, birthdays): ${JSON.stringify(context.notifications)}
- High-Value Leads: ${JSON.stringify(context.leads.filter(l => l.status !== 'Won' && l.status !== 'Lost'))}
- All Members: ${JSON.stringify(context.members.map(m => ({id: m.id, name: m.name, memberType: m.memberType})))}
- Upsell Opportunities: ${JSON.stringify(context.upsellOpportunities)}

Generate a list of 3-5 focus items. For each item, provide a priority (High, Medium, Low), a title, a short rationale for why it's important, a suggested action ('call', 'review', 'email', etc.), and the related customer/lead ID and name.

Prioritization rules:
1.  High Priority: Overdue policy renewals, high-value leads that need follow-up.
2.  Medium Priority: Upcoming renewals (within 7 days), recently generated upsell opportunities for high-value clients.
3.  Low Priority: Birthdays, anniversaries, general check-ins for new members.

Return a valid JSON array of objects. Do not include any other text or explanation. Each object needs a unique ID.
`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.5,
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            priority: { type: Type.STRING },
                            title: { type: Type.STRING },
                            rationale: { type: Type.STRING },
                            action: { type: Type.STRING },
                            relatedId: { type: Type.STRING },
                            relatedName: { type: Type.STRING },
                        },
                        required: ["id", "priority", "title", "rationale", "action", "relatedId", "relatedName"]
                    }
                }
            }
        });
        
        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        if (Array.isArray(result)) {
            return result as TodaysFocusItem[];
        }
        return [];

    } catch (error) {
        console.error("Gemini API error in generateTodaysFocus:", error);
        if (addToast) addToast("Failed to generate Today's Focus.", "error");
        return [];
    }
};

/**
 * Parses natural language input to extract member details and generate a follow-up question.
 * @param userInput The user's text input.
 * @param accumulatedData The data already collected for the member.
 * @returns A promise resolving to an object with new member data and a follow-up question.
 */
export const parseNaturalLanguageToMember = async (
    userInput: string,
    accumulatedData: Partial<Member>,
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<{ memberData: Partial<Member>; followUpQuestion: string }> => {
    if (!process.env.API_KEY) {
        if (addToast) addToast("Using fallback for conversational AI.", "error");
        return { memberData: {}, followUpQuestion: 'Fallback: Please enter manually.' };
    }
    try {
        const prompt = `
You are a conversational AI assistant helping a user create a new customer profile in a CRM. The user provides information in natural language. You are given the user's latest message and the customer data that has already been collected.

Your tasks are:
1. Parse the user's message to extract any new customer details (name, mobile, dob, address, city, state, etc.).
2. Based on the *accumulated data*, determine the next most logical piece of information to ask for and formulate a friendly follow-up question. The question should be specific (e.g., ask for DOB, then address).
3. Return a JSON object with two keys: "memberData" (an object containing only the *newly extracted* information) and "followUpQuestion" (a string for the next question).

User message: "${userInput}"
Accumulated Data: ${JSON.stringify(accumulatedData)}

Example 1:
- User message: "The new client is Anjali, phone is 9876543210"
- Accumulated Data: {}
- Your Response: { "memberData": { "name": "Anjali", "mobile": "9876543210" }, "followUpQuestion": "Great! What is Anjali's date of birth?" }

Example 2:
- User message: "She lives in Mumbai"
- Accumulated Data: {"name": "Anjali"}
- Your Response: { "memberData": { "city": "Mumbai", "state": "Maharashtra" }, "followUpQuestion": "Got it. And what's her mobile number?" }

Your response MUST be a valid JSON object. Do not include any other text.
`;
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                temperature: 0.2,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        memberData: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                mobile: { type: Type.STRING },
                                dob: { type: Type.STRING },
                                address: { type: Type.STRING },
                                city: { type: Type.STRING },
                                state: { type: Type.STRING },
                            },
                        },
                        followUpQuestion: { type: Type.STRING },
                    },
                    required: ['memberData', 'followUpQuestion'],
                },
            },
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("Gemini API error in parseNaturalLanguageToMember:", error);
        if (addToast) addToast("AI parsing failed.", "error");
        return { memberData: {}, followUpQuestion: 'Fallback: Please enter manually.' };
    }
};

/**
 * Generates a financial health report based on a member's profile.
 * @param member The member data.
 * @returns A promise that resolves to the formatted report text.
 */
export const generateFinancialHealthReport = async (member: Member, addToast?: (message: string, type?: 'success' | 'error') => void): Promise<string> => {
    if (!process.env.API_KEY) {
        if (addToast) addToast("Using fallback for report generation.", "error");
        return "Fallback: Report generation unavailable.";
    }
    try {
        const policies = (member.policies && Array.isArray(member.policies)) ? member.policies : [];
        const policiesData = policies.map(p => ({ type: p.policyType, coverage: p.coverage, premium: p.premium }));

        const prompt = `
You are a professional financial advisor's assistant. Your task is to generate a structured and personalized financial health report for a client based on their profile.
The output must be a clean, readable text document. Use markdown for headings (e.g., '## Title'), bold text (e.g., '**bold**'), and bulleted lists (e.g., '- Item').

Client Data:
- Member Profile: ${JSON.stringify({ name: member.name, dob: member.dob, maritalStatus: member.maritalStatus })}
- Financial Profile: ${JSON.stringify(member.financialProfile || {})}
- Existing Policies: ${JSON.stringify(policiesData)}

Instructions:
1.  **Introduction:** Start with a brief, positive opening for ${member.name}.
2.  **Financial Summary:** Briefly summarize their income, expenses, and potential savings based on their profile.
3.  **Risk Profile Analysis:** Comment on their stated risk tolerance ('${member.financialProfile?.riskTolerance}').
4.  **Coverage Analysis:** Analyze their existing policies against their financial profile. Identify any obvious gaps (e.g., no health insurance, low life coverage for high income, lack of retirement planning).
5.  **Goal Alignment:** Comment on how well their current setup aligns with their stated financial goals ('${member.financialProfile?.financialGoals}').
6.  **Recommendations:** Provide 2-3 actionable recommendations. These could be about increasing coverage, starting a new type of policy, or other financial advice.

Keep the tone professional, helpful, and easy to understand. Do not invent data not present in the provided JSON.
`;
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.6,
            },
        });

        return response.text;

    } catch (error) {
        console.error("Gemini API error in generateFinancialHealthReport:", error);
        if (addToast) addToast("Failed to generate report.", "error");
        return "Fallback: Report generation unavailable.";
    }
};

/**
 * Generates upsell opportunities for a selection of members.
 * @param members The list of all members.
 * @returns A promise resolving to an array of UpsellOpportunity objects.
 */
export const generateUpsellOpportunities = async (
    members: Member[],
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<UpsellOpportunity[]> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback AI for upsell opportunities.", "error");
        return [];
    }

    // To be efficient, let's select up to 3 interesting members for this demo.
    // e.g., Gold+ tier members or members with only one policy.
    const interestingMembers = members
        .filter(m => m.active && (['Gold', 'Diamond', 'Platinum'].includes(m.memberType) || m.policies.length === 1))
        .slice(0, 3);
    
    if (interestingMembers.length === 0) {
        return [];
    }

    const memberProfiles = interestingMembers.map(m => ({
        id: m.id,
        name: m.name,
        age: new Date().getFullYear() - new Date(m.dob).getFullYear(),
        maritalStatus: m.maritalStatus,
        existingPolicies: m.policies.map(p => p.policyType),
        totalPremium: m.policies.reduce((sum, p) => sum + p.premium, 0)
    }));

    try {
        const prompt = `
You are an expert financial advisor AI. Your task is to analyze a list of client profiles and identify potential upsell opportunities for each.

For each client in the provided JSON data, generate a concise, actionable suggestion for a new policy or a rider that would complement their existing portfolio. Provide a brief rationale for your suggestion.

Return a JSON array where each object contains:
- "memberId": The client's ID.
- "suggestions": A string containing the recommendation and rationale.

Analyze these clients:
${JSON.stringify(memberProfiles)}

Your JSON array output:
`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.7,
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            memberId: { type: Type.STRING },
                            suggestions: { type: Type.STRING }
                        },
                        required: ["memberId", "suggestions"]
                    }
                }
            }
        });
        
        const jsonStr = response.text.trim();
        const results = JSON.parse(jsonStr);

        if (Array.isArray(results)) {
            const opportunities: UpsellOpportunity[] = results.map(r => {
                const member = members.find(m => m.id === r.memberId);
                return {
                    id: `op-${r.memberId}-${Date.now()}`,
                    memberId: r.memberId,
                    memberName: member?.name || 'Unknown',
                    suggestions: r.suggestions,
                    timestamp: new Date().toISOString()
                }
            });
            return opportunities;
        }

        return [];

    } catch (error) {
        console.error("Gemini API error in generateUpsellOpportunities:", error);
        if(addToast) addToast("Gemini failed to generate upsell ideas.", "error");
        return [];
    }
};

/**
 * Generates an upsell opportunity for a single member.
 * @param member The member to analyze.
 * @returns A promise resolving to an UpsellOpportunity object or null.
 */
export const generateUpsellOpportunityForMember = async (
    member: Member,
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<UpsellOpportunity | null> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback AI for upsell opportunity.", "error");
        return null;
    }

    const memberProfile = {
        id: member.id,
        name: member.name,
        age: new Date().getFullYear() - new Date(member.dob).getFullYear(),
        maritalStatus: member.maritalStatus,
        existingPolicies: member.policies.map(p => p.policyType),
        totalPremium: member.policies.reduce((sum, p) => sum + p.premium, 0)
    };

    try {
        const prompt = `
You are an expert financial advisor AI. Your task is to analyze a single client's profile and identify a potential upsell opportunity.

The suggestion should be a concise, actionable idea for a new policy or a rider that would complement their existing portfolio. Provide a brief rationale.

Analyze this client:
${JSON.stringify(memberProfile)}

Return a JSON object containing:
- "suggestions": A string containing the recommendation and rationale.

If no clear opportunity is found, return an object with an empty "suggestions" string. Your response MUST be a valid JSON object. Do not include any other text or explanation.
`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.7,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: { type: Type.STRING }
                    },
                    required: ["suggestions"]
                }
            }
        });
        
        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        if (result && result.suggestions) {
            return {
                id: `op-${member.id}-${Date.now()}`,
                memberId: member.id,
                memberName: member.name,
                suggestions: result.suggestions,
                timestamp: new Date().toISOString()
            };
        }

        return null;

    } catch (error) {
        console.error("Gemini API error in generateUpsellOpportunityForMember:", error);
        if(addToast) addToast("Gemini failed to generate upsell idea.", "error");
        return null;
    }
};

/**
 * Generates an upsell/cross-sell opportunity for a single lead.
 * @param lead The lead to analyze.
 * @returns A promise resolving to a string suggestion or null.
 */
export const generateUpsellOpportunityForLead = async (
    lead: Lead,
    addToast?: (message: string, type?: 'success' | 'error') => void
): Promise<string | null> => {
    if (!process.env.API_KEY) {
        if(addToast) addToast("Using fallback AI for lead opportunity.", "error");
        return null;
    }

    const leadProfile = {
        id: lead.id,
        name: lead.name,
        notes: lead.notes,
        policyInterest: lead.policyInterestType,
        generalType: lead.policyInterestGeneralType,
        estimatedValue: lead.estimatedValue
    };

    try {
        const prompt = `
You are an expert financial advisor AI. Your task is to analyze a single sales lead's profile and identify a potential upsell or cross-sell opportunity.

The suggestion should be a concise, actionable idea for a policy or a rider that would be a good fit. Provide a brief rationale.

Analyze this lead:
${JSON.stringify(leadProfile)}

Return a JSON object containing:
- "suggestions": A string containing the recommendation and rationale (e.g., "Since they are interested in Motor insurance, suggest a Personal Accident cover as a valuable add-on for comprehensive protection.").

If no clear opportunity is found, return an object with an empty "suggestions" string. Your response MUST be a valid JSON object. Do not include any other text or explanation.
`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                temperature: 0.7,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: { type: Type.STRING }
                    },
                    required: ["suggestions"]
                }
            }
        });
        
        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);

        if (result && result.suggestions) {
            return result.suggestions;
        }

        return null;

    } catch (error) {
        console.error("Gemini API error in generateUpsellOpportunityForLead:", error);
        if(addToast) addToast("Gemini failed to generate lead opportunity.", "error");
        return null;
    }
};