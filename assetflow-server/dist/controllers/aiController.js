"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithGemini = void 0;
const Asset_1 = require("../models/Asset");
const AssetAllocation_1 = require("../models/AssetAllocation");
const MaintenanceRequest_1 = require("../models/MaintenanceRequest");
const utils_1 = require("../utils");
/**
 * Handles incoming query chats for the Gemini Copilot.
 * Aggregates live database snapshot metrics and feeds them as system context
 * to provide context-aware responses without model fine-tuning.
 */
exports.chatWithGemini = (0, utils_1.asyncHandler)(async (req, res) => {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
        res.status(400).json({ message: 'Message parameter is required and must be a string' });
        return;
    }
    // Compile active system metrics to ground Gemini's response context
    const totalAssets = await Asset_1.Asset.countDocuments({ deletedAt: null });
    const available = await Asset_1.Asset.countDocuments({ status: Asset_1.AssetStatus.AVAILABLE, deletedAt: null });
    const allocated = await Asset_1.Asset.countDocuments({ status: Asset_1.AssetStatus.ALLOCATED, deletedAt: null });
    const reserved = await Asset_1.Asset.countDocuments({ status: Asset_1.AssetStatus.RESERVED, deletedAt: null });
    const maintenanceCount = await Asset_1.Asset.countDocuments({ status: Asset_1.AssetStatus.UNDER_MAINTENANCE, deletedAt: null });
    const lost = await Asset_1.Asset.countDocuments({ status: Asset_1.AssetStatus.LOST, deletedAt: null });
    const activeAllocations = await AssetAllocation_1.AssetAllocation.find({ status: 'ACTIVE' })
        .populate('asset employee')
        .limit(10)
        .lean();
    const overdueAllocations = await AssetAllocation_1.AssetAllocation.find({
        status: 'ACTIVE',
        expectedReturn: { $lt: new Date() }
    }).populate('asset employee').lean();
    const openRepairs = await MaintenanceRequest_1.MaintenanceRequest.find({
        approvalStatus: { $ne: 'RESOLVED' }
    }).populate('asset').lean();
    // Format list context string representations
    const overdueSummary = overdueAllocations.length > 0
        ? overdueAllocations.map((a) => `${a.asset?.name || 'Asset'} (${a.asset?.assetTag}) held by ${a.employee?.firstName} ${a.employee?.lastName} (Overdue since ${new Date(a.expectedReturn).toLocaleDateString()})`).join('\n')
        : 'No overdue return requests.';
    const repairsSummary = openRepairs.length > 0
        ? openRepairs.map((r) => `Repair "${r.title}" for ${r.asset?.name || 'Asset'} (${r.asset?.assetTag}) - Status: ${r.approvalStatus}`).join('\n')
        : 'No active maintenance schedules.';
    const activeCustodies = activeAllocations.length > 0
        ? activeAllocations.map((a) => `${a.asset?.name || 'Asset'} (${a.asset?.assetTag}) is currently held by ${a.employee?.firstName} ${a.employee?.lastName}`).join('\n')
        : 'No active custodies.';
    const systemContext = `
You are the AssetFlow ERP Intelligent AI Assistant. You have access to real-time database state:
- Asset Counts: Total: ${totalAssets}, Available: ${available}, Allocated: ${allocated}, Reserved: ${reserved}, Under Maintenance: ${maintenanceCount}, Lost: ${lost}
- Current Active Custodies:
${activeCustodies}
- Overdue Return Violations:
${overdueSummary}
- Open Maintenance Repair Operations:
${repairsSummary}

Rules:
1. Provide accurate, professional MERN and SAP/Maximo-grade answers.
2. Format response in clean, concise GitHub markdown.
3. Be brief, friendly, and analytical. Predict risks if asked (e.g. assets with frequent repairs, or overdue returns).
`;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        // Local fallback heuristics if Gemini key is missing
        let responseText = '';
        const queryLower = message.toLowerCase();
        if (queryLower.includes('overdue')) {
            responseText = `### Overdue Custody Report\n\nThere are currently **${overdueAllocations.length} overdue assets**:\n\n` +
                overdueAllocations.map((a) => `- **${a.asset?.name}** (${a.asset?.assetTag}) held by *${a.employee?.firstName} ${a.employee?.lastName}* (Scheduled return: ${new Date(a.expectedReturn).toLocaleDateString()})`).join('\n');
        }
        else if (queryLower.includes('maintenance') || queryLower.includes('repair')) {
            responseText = `### Maintenance & Repair Status\n\nThere are **${maintenanceCount} assets under maintenance** and **${openRepairs.length} active repair requests**:\n\n` +
                openRepairs.map((r) => `- **${r.title}** (Asset: ${r.asset?.name || 'N/A'}, Status: *${r.approvalStatus}*)`).join('\n');
        }
        else if (queryLower.includes('who has') || queryLower.includes('holder') || queryLower.includes('assigned to')) {
            const match = activeAllocations.find((a) => queryLower.includes((a.asset?.assetTag || '').toLowerCase()) ||
                queryLower.includes((a.asset?.name || '').toLowerCase()));
            if (match) {
                responseText = `Asset **${match.asset?.name}** (${match.asset?.assetTag}) is currently allocated to **${match.employee?.firstName} ${match.employee?.lastName}** (Department: ${match.employee?.role || 'Staff'}).`;
            }
            else {
                responseText = `### Custody Summary\n\nHere is a list of active custodians:\n\n` +
                    activeAllocations.map((a) => `- **${a.asset?.name}** (${a.asset?.assetTag}) is with *${a.employee?.firstName} ${a.employee?.lastName}*`).join('\n');
            }
        }
        else {
            responseText = `### Executive ERP Assistant (Simulation Mode)

I am running in local simulation mode. Here is a summary of the live system metrics:
*   **Total Inventory**: ${totalAssets} registered assets.
*   **Availability**: ${available} available, ${allocated} allocated, ${reserved} reserved.
*   **Operations**: ${maintenanceCount} under maintenance, ${openRepairs.length} open maintenance requests.
*   **Compliance Alerts**: ${overdueAllocations.length} overdue returns.

*Tip: Set \`GEMINI_API_KEY\` in the backend environment to unlock full natural language processing, predictive analysis, and intelligent recommendations!*`;
        }
        res.status(200).json({ reply: responseText });
        return;
    }
    // Execute request to Google Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: `${systemContext}\n\nUser Question: ${message}` }
                    ]
                }
            ]
        })
    });
    if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        throw new Error(`Gemini API returned status ${geminiResponse.status}: ${errorText}`);
    }
    const geminiData = await geminiResponse.json();
    const chatResponse = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated from Gemini.';
    res.status(200).json({ reply: chatResponse });
});
