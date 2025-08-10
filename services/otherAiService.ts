
import { Member, UpsellOpportunity, Policy, VoiceNote, TodaysFocusItem } from '../types.ts';

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- FALLBACK IMPLEMENTATIONS ---

export const fallback_extractDataFromImage = async (base64Image: string, mimeType: string): Promise<{ idNumber: string; name: string; address: string; phoneNumber: string; dob: string; } | null> => {
    await simulateDelay(200);
    return { 
        idNumber: "FALLBACK_OCR_12345",
        name: "Fallback Name",
        address: "",
        phoneNumber: "",
        dob: ""
    };
};

export const fallback_analyzePaymentProof = async (base64Image: string, mimeType: string, expectedAmount: number): Promise<Policy['paymentDetails']> => {
    await simulateDelay(200);
    return { 
        status: 'Unverified', 
        statusReason: "Fallback AI: Manual check required. Primary AI service unavailable.", 
        transactionId: 'N/A', 
        amount: 'N/A', 
        date: 'N/A' 
    };
};

export const fallback_summarizeDocument = async (base64Data: string, mimeType: string): Promise<string> => {
    await simulateDelay(200);
    return `Fallback AI Summary:\n- This document requires manual review.\n- Primary AI service for summarization is currently unavailable.`;
};

export const fallback_getPolicySuggestions = async (member: Member): Promise<string> => {
    await simulateDelay(200);
    return "Fallback Suggestion: Based on general best practices, consider a Health Insurance top-up plan to enhance existing coverage.";
};

export const fallback_searchMembersWithNL = async (query: string, members: Member[]): Promise<string[]> => {
    await simulateDelay(200);
    // Return empty to avoid showing incorrect results
    return []; 
};

export const fallback_getChatbotResponse = async (userMessage: string, members: Member[]): Promise<string> => {
    await simulateDelay(200);
    return "I'm operating in fallback mode. I can only provide basic information. Please try complex queries later.";
};

export const fallback_getAutomatedClientResponse = async (userMessage: string): Promise<string> => {
    await simulateDelay(200);
    return "Our systems are currently experiencing high load. A human agent will get back to you shortly. Thank you for your patience.";
};

export const fallback_getOptimalRoute = async (customers: Member[], userLocation: { lat: number; lng: number; }): Promise<string[]> => {
    await simulateDelay(200);
    // Simple distance-based sort as a fallback
    const sorted = [...customers].sort((a, b) => {
        const distA = Math.hypot(a.lat - userLocation.lat, a.lng - userLocation.lng);
        const distB = Math.hypot(b.lat - userLocation.lat, b.lng - userLocation.lng);
        return distA - distB;
    });
    return sorted.map(c => c.id);
};

export const fallback_findClientsOnRoute = async (startLocationName: string, endLocationName: string, members: Member[]): Promise<string[]> => {
    await simulateDelay(200);
    return []; // Avoid returning potentially incorrect clients
};

export const fallback_transcribeAudioToEnglish = async (base64Audio: string, mimeType: string): Promise<string> => {
    await simulateDelay(200);
    return "Fallback: Audio transcription service is unavailable. Please summarize manually.";
};

export const fallback_summarizeTranscript = async (transcript: string, clientName: string, previousSummaries: string[]): Promise<Omit<VoiceNote, 'id' | 'filename' | 'audioUrl'> | null> => {
    await simulateDelay(200);
    return {
        client: clientName,
        recording_date: new Date().toISOString(),
        detected_language: 'Unknown (Fallback)',
        summary: `Fallback Summary: The primary AI summarizer is unavailable. The raw transcript is:\n\n"${transcript}"`,
        tags: ['fallback', 'manual-review-required'],
        status: 'Fallback',
        transcript_snippet: transcript.substring(0, 100) + '...',
        actionItems: [],
    };
};

export const fallback_searchVoiceNotes = async (query: string, notes: any[]): Promise<any[]> => {
    await simulateDelay(200);
    return [];
};

export const fallback_analyzeCompetitorPolicy = async (base64Data: string, mimeType: string): Promise<string> => {
    await simulateDelay(200);
    return "Fallback Analysis:\n- Primary AI service is unavailable.\n- Please manually review the competitor's document for coverage gaps and high deductibles.";
};

export const fallback_forecastCustomerGrowth = async (historicalData: { name: string, Customers: number }[]): Promise<{ name: string, Customers: number }[]> => {
    await simulateDelay(200);
    return []; // Return empty as we can't reliably forecast
};

export const fallback_suggestSmartTrip = async (userLocation: { lat: number, lng: number }, members: Member[]): Promise<string[]> => {
    await simulateDelay(200);
    // Suggest the 3 closest members as a simple fallback
    return members
        .map(member => ({
            ...member,
            distance: Math.hypot(member.lat - userLocation.lat, member.lng - userLocation.lng)
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3)
        .map(m => m.id);
};

export const fallback_generateAnnualReview = async (member: Member, allOpportunities: UpsellOpportunity[]): Promise<string> => {
    // Simulate a network delay for the alternative AI model
    await simulateDelay(1200);

    const memberOpportunities = allOpportunities.find(op => op.memberId === member.id);
    const totalPremium = member.policies.reduce((sum, policy) => sum + policy.premium, 0);

    const reviewText = `
# Annual Financial Review for ${member.name}

*(This report was generated by our fallback system as the primary AI service is currently unavailable. Please review carefully.)*

## Personalized Introduction
Hello ${member.name}, here is a summary of your financial portfolio with FinRoots.

## Your Portfolio at a Glance
You currently hold **${member.policies.length}** active polic(ies) with a total annual premium of **₹${totalPremium.toLocaleString('en-IN')}**.

## Policy Details
${member.policies.map(p => `- ${p.policyType}: Coverage ₹${p.coverage.toLocaleString('en-IN')}, renewing ${new Date(p.renewalDate).toLocaleDateString('en-GB')}`).join('\n')}

## Recommendations for the Year Ahead
${memberOpportunities ? memberOpportunities.suggestions : "Our AI recommendation engine is currently offline. We recommend a manual review of your portfolio to identify potential enhancements."}

## Closing Statement
We appreciate your continued trust in FinRoots.
`;

    return reviewText.trim();
};

export const fallback_summarizeManualText = async (manualText: string, clientName: string): Promise<Omit<VoiceNote, 'id' | 'filename' | 'audioUrl'>> => {
    await simulateDelay(200);
    return {
        client: clientName,
        recording_date: new Date().toISOString(),
        detected_language: 'Manual',
        summary: `Fallback: AI service unavailable. Note saved without summary.`,
        tags: ['fallback', 'manual-review-required'],
        status: 'Fallback',
        transcript_snippet: manualText,
        actionItems: [],
    };
};

export const fallback_generateTodaysFocus = async (context: any): Promise<TodaysFocusItem[]> => {
    await simulateDelay(200);
    // Return an empty array to avoid showing potentially irrelevant fallback data.
    return [];
};

export const fallback_parseNaturalLanguageToMember = async (userInput: string, accumulatedData: Partial<Member>): Promise<{ memberData: Partial<Member>, followUpQuestion: string }> => {
    await simulateDelay(200);
    return {
        memberData: {},
        followUpQuestion: "I'm having trouble with my AI functions right now. Please enter the data manually in the main form. What is the customer's full name?"
    };
};

export const fallback_generateFinancialHealthReport = async (member: Member): Promise<string> => {
    await simulateDelay(200);
    return `**Fallback Report**\n\nThe AI analysis service is temporarily unavailable. Please manually review the client's financial profile and existing policies to provide recommendations.`;
};

export const fallback_generateUpsellOpportunities = async (members: Member[]): Promise<UpsellOpportunity[]> => {
    await simulateDelay(200);
    if (members.length > 0) {
        return [
            {
                id: `op-fallback-${Date.now()}`,
                memberId: members[0].id,
                memberName: members[0].name,
                suggestions: "Based on their profile, consider suggesting a critical illness rider to complement their existing health plan. This provides a lump-sum payment on diagnosis of major illnesses, offering extra financial security.",
                timestamp: new Date().toISOString()
            }
        ];
    }
    return [];
};

export const fallback_generateUpsellOpportunityForMember = async (member: Member): Promise<UpsellOpportunity | null> => {
    await simulateDelay(200);
    return {
        id: `op-fallback-${member.id}-${Date.now()}`,
        memberId: member.id,
        memberName: member.name,
        suggestions: `Fallback Suggestion for ${member.name}: Consider a critical illness rider to complement their existing plan. This offers extra financial security.`,
        timestamp: new Date().toISOString()
    };
};
