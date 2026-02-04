import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function generateReport(results, targetUrls = []) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    const reportDir = path.join(__dirname, '../reports');
    const filename = path.join(reportDir, `Scrape_Report_${timestamp}.md`);

    // Ensure directory exists
    if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);

    // Calculate Stats
    const total = results.length;
    const tiers = { A: 0, B: 0, C: 0 };
    results.forEach(r => tiers[r.status.publishTier]++);

    // Build Markdown Content
    let md = `# 🤖 Scrape Run Report\n`;
    md += `**Date:** ${new Date().toLocaleString()}\n\n`;
    md += `## 📊 Executive Summary\n`;
    md += `| Metric | Value |\n| :--- | :--- |\n`;
    md += `| Total Processed | ${total} |\n`;
    md += `| Tier A (Gov/High Trust) | ${tiers.A} |\n`;
    md += `| Tier B (Verified Startup) | ${tiers.B} |\n`;
    md += `| Tier C (Manual Review) | ${tiers.C} |\n\n`;

    // Add Target URLs section
    if (targetUrls && targetUrls.length > 0) {
        md += `## 🎯 Target URLs Configuration\n`;
        md += `**Total Target URLs:** ${targetUrls.length}\n\n`;
        md += `**Note:** URL list updated per Requirements 11.1-11.13 (${targetUrls.length} authoritative UAE ecosystem sources)\n\n`;
        md += `| # | URL |\n`;
        md += `| :--- | :--- |\n`;
        targetUrls.forEach((url, index) => {
            md += `| ${index + 1} | ${url} |\n`;
        });
        md += `\n`;
    }

    md += `## 📂 Detailed Logs\n`;
    md += `| Name | Category | Tier | Status |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    
    results.forEach(res => {
        md += `| ${res.name} | ${res.categories[0]} | **${res.status.publishTier}** | ${res.status.isActive ? '✅ Active' : '⏳ Pending'} |\n`;
    });

    fs.writeFileSync(filename, md);
    console.log(`\n📄 Markdown report generated: /reports/Scrape_Report_${timestamp}.md`);
}