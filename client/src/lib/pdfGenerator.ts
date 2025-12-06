import jsPDF from 'jspdf';

interface AnalysisResult {
  classification: "real" | "fake" | "misleading";
  confidence: number;
  explanation: string;
  sources?: Array<{ title: string; url: string; trustScore: number }>;
  patterns: {
    sensationalist: number;
    unreliableSource: number;
    unverifiedClaims: number;
  };
  sourceCredibility?: {
    name: string;
    score: number;
    level: 'high' | 'medium' | 'low';
  };
  factChecks?: Array<{
    source: string;
    title: string;
    snippet: string;
    url: string;
  }>;
  sentiment?: {
    emotionalTone: string;
    emotionalToneScore: number;
    languageStyle: string;
    languageStyleScore: number;
    politicalLeaning: string;
    politicalLeaningScore: number;
  };
}

export function generatePDFReport(
  result: AnalysisResult,
  contentPreview: string
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add text with word wrap
  const addText = (text: string, fontSize: number, isBold: boolean = false, color: string = '#000000') => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(color);
    
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line: string) => {
      checkPageBreak(fontSize * 0.5);
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    });
    yPosition += 5;
  };

  // Helper function to add heading
  const addHeading = (text: string, fontSize: number = 18) => {
    checkPageBreak(fontSize + 10);
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#1e40af'); // Blue color
    doc.text(text, margin, yPosition);
    yPosition += fontSize + 5;
  };

  // Helper function to add section
  const addSection = (title: string, content: string) => {
    checkPageBreak(30);
    yPosition += 5;
    addHeading(title, 14);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor('#000000');
    const lines = doc.splitTextToSize(content, contentWidth);
    lines.forEach((line: string) => {
      checkPageBreak(5);
      doc.text(line, margin + 5, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  };

  // Title
  doc.setFillColor(30, 64, 175); // Blue background
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor('#ffffff');
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('TruthLens Analysis Report', margin, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${new Date().toLocaleString()}`, margin, 35);
  
  yPosition = 50;

  // Classification Badge
  checkPageBreak(30);
  const classificationColors: Record<string, string> = {
    real: '#10b981', // Green
    fake: '#ef4444', // Red
    misleading: '#f59e0b' // Yellow/Orange
  };
  
  const classificationLabels: Record<string, string> = {
    real: 'REAL',
    fake: 'FAKE',
    misleading: 'MISLEADING'
  };

  const bgColor = classificationColors[result.classification] || '#6b7280';
  doc.setFillColor(bgColor);
  doc.setDrawColor(bgColor);
  const badgeWidth = 60;
  const badgeHeight = 20;
  doc.roundedRect(margin, yPosition, badgeWidth, badgeHeight, 3, 3, 'F');
  
  doc.setTextColor('#ffffff');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(classificationLabels[result.classification], margin + badgeWidth / 2, yPosition + badgeHeight / 2 + 3, { align: 'center' });
  
  doc.setTextColor('#000000');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${Math.round(result.confidence * 100)}% Confidence`, margin + badgeWidth + 10, yPosition + badgeHeight / 2 + 3);
  
  yPosition += badgeHeight + 15;

  // Content Analyzed
  addSection('Content Analyzed', contentPreview.substring(0, 500) + (contentPreview.length > 500 ? '...' : ''));

  // Explanation
  addSection('Analysis Explanation', result.explanation || 'No explanation provided');

  // Key Patterns
  checkPageBreak(40);
  addHeading('Key Patterns Detected', 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const patterns = [
    { label: 'Sensationalist Language', value: result.patterns.sensationalist.toFixed(2) },
    { label: 'Unreliable Sources', value: result.patterns.unreliableSource.toFixed(2) },
    { label: 'Unverified Claims', value: result.patterns.unverifiedClaims.toFixed(2) }
  ];

  patterns.forEach(pattern => {
    checkPageBreak(10);
    doc.text(`• ${pattern.label}: ${pattern.value}`, margin + 5, yPosition);
    yPosition += 8;
  });
  yPosition += 5;

  // Source Credibility
  if (result.sourceCredibility) {
    checkPageBreak(30);
    addHeading('Source Credibility', 14);
    doc.setFontSize(10);
    doc.text(`Source: ${result.sourceCredibility.name || 'Unknown'}`, margin + 5, yPosition);
    yPosition += 8;
    doc.text(`Trust Score: ${Math.round(result.sourceCredibility.score * 100)}%`, margin + 5, yPosition);
    yPosition += 8;
    doc.text(`Level: ${result.sourceCredibility.level.toUpperCase()}`, margin + 5, yPosition);
    yPosition += 10;
  }

  // Sentiment Analysis
  if (result.sentiment) {
    checkPageBreak(40);
    addHeading('Sentiment & Bias Analysis', 14);
    doc.setFontSize(10);
    doc.text(`Emotional Tone: ${result.sentiment.emotionalTone} (${Math.round(result.sentiment.emotionalToneScore * 100)}%)`, margin + 5, yPosition);
    yPosition += 8;
    doc.text(`Language Style: ${result.sentiment.languageStyle} (${Math.round(result.sentiment.languageStyleScore * 100)}%)`, margin + 5, yPosition);
    yPosition += 8;
    doc.text(`Political Leaning: ${result.sentiment.politicalLeaning} (${Math.round(result.sentiment.politicalLeaningScore * 100)}%)`, margin + 5, yPosition);
    yPosition += 10;
  }

  // Fact Checks
  if (result.factChecks && result.factChecks.length > 0) {
    checkPageBreak(50);
    addHeading('Fact Checks', 14);
    doc.setFontSize(10);
    result.factChecks.forEach((fc, index) => {
      checkPageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${fc.source}`, margin + 5, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      const titleLines = doc.splitTextToSize(fc.title, contentWidth - 10);
      titleLines.forEach((line: string) => {
        doc.text(line, margin + 5, yPosition);
        yPosition += 5;
      });
      yPosition += 2;
      const snippetLines = doc.splitTextToSize(fc.snippet, contentWidth - 10);
      snippetLines.forEach((line: string) => {
        doc.text(line, margin + 5, yPosition);
        yPosition += 5;
      });
      doc.setTextColor('#1e40af');
      doc.text(`URL: ${fc.url}`, margin + 5, yPosition);
      doc.setTextColor('#000000');
      yPosition += 8;
    });
  }

  // Sources
  if (result.sources && result.sources.length > 0) {
    checkPageBreak(30);
    addHeading('Reliable Sources', 14);
    doc.setFontSize(10);
    result.sources.slice(0, 5).forEach((source, index) => {
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${source.title}`, margin + 5, yPosition);
      yPosition += 7;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor('#1e40af');
      doc.text(source.url, margin + 5, yPosition);
      doc.setTextColor('#000000');
      doc.text(`Trust Score: ${Math.round(source.trustScore * 100)}%`, margin + 5, yPosition + 5);
      yPosition += 12;
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor('#6b7280');
    doc.text(
      `TruthLens - AI-Powered Fact-Checking | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `truthlens-report-${new Date().getTime()}.pdf`;
  doc.save(fileName);
}

