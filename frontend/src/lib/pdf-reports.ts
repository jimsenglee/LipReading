import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * generate comprehensive user learning analytics pdf report
 * this creates a proper formatted document, not a screenshot
 */
export const generateUserLearningPDFReport = async (
  analyticsData: any,
  options: { dateRange: number; category: string }
) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // ============================================================================
    // HEADER
    // ============================================================================
    
    // logo and title
    pdf.setFillColor(126, 87, 194); // primary purple
    pdf.rect(0, 0, pageWidth, 35, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('USER LEARNING ANALYTICS REPORT', pageWidth / 2, 15, { align: 'center' });
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 24, { align: 'center' });
    pdf.text(`Period: Last ${options.dateRange} days | Category: ${options.category === 'all' ? 'All Categories' : options.category}`, pageWidth / 2, 30, { align: 'center' });
    
    yPosition = 45;

    // ============================================================================
    // EXECUTIVE SUMMARY
    // ============================================================================
    
    pdf.setFillColor(245, 245, 250);
    pdf.rect(10, yPosition, pageWidth - 20, 8, 'F');
    pdf.setTextColor(126, 87, 194);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('EXECUTIVE SUMMARY', pageWidth / 2, yPosition + 5.5, { align: 'center' });
    
    yPosition += 12;

    const overall = analyticsData.overall;
    
    // summary metrics in 2 columns
    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const summaryData = [
      ['Total Users:', overall.totalUsers.toString(), 'Tutorials:', overall.totalTutorials.toString()],
      ['Quizzes:', overall.totalQuizzes.toString(), 'Categories:', overall.totalCategories.toString()],
      ['Tutorial Enrollments:', overall.totalTutorialEnrollments.toString(), 'Quiz Attempts:', overall.totalQuizAttempts.toString()],
      ['Average Quiz Score:', `${overall.averageQuizScore.toFixed(1)}%`, '', '']
    ];

    pdf.autoTable({
      startY: yPosition,
      head: [],
      body: summaryData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [100, 100, 100] },
        1: { fontStyle: 'bold', textColor: [126, 87, 194] },
        2: { fontStyle: 'bold', textColor: [100, 100, 100] },
        3: { fontStyle: 'bold', textColor: [126, 87, 194] }
      },
      margin: { left: 15, right: 15 }
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 8;

    // ============================================================================
    // TOP PERFORMERS
    // ============================================================================
    
    pdf.setFillColor(245, 245, 250);
    pdf.rect(10, yPosition, pageWidth - 20, 8, 'F');
    pdf.setTextColor(126, 87, 194);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TOP PERFORMERS', pageWidth / 2, yPosition + 5.5, { align: 'center' });
    
    yPosition += 12;

    const topPerformers = analyticsData.topPerformers?.slice(0, 10) || [];
    
    const performerRows = topPerformers.map((p: any) => [
      `#${p.rank}`,
      p.name,
      `${p.averageScore}%`,
      p.totalQuizzes.toString(),
      p.lastActivity
    ]);

    pdf.autoTable({
      startY: yPosition,
      head: [['Rank', 'Name', 'Avg Score', 'Quizzes', 'Last Activity']],
      body: performerRows,
      theme: 'striped',
      headStyles: { 
        fillColor: [126, 87, 194],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 60 },
        2: { cellWidth: 30, halign: 'center', textColor: [16, 185, 129] },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 35, halign: 'center' }
      },
      margin: { left: 15, right: 15 }
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 8;

    // ============================================================================
    // CATEGORY PERFORMANCE
    // ============================================================================
    
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFillColor(245, 245, 250);
    pdf.rect(10, yPosition, pageWidth - 20, 8, 'F');
    pdf.setTextColor(126, 87, 194);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CATEGORY PERFORMANCE ANALYSIS', pageWidth / 2, yPosition + 5.5, { align: 'center' });
    
    yPosition += 12;

    const categoryPerformance = analyticsData.categoryPerformance || [];
    
    if (categoryPerformance.length > 0) {
      const categoryRows = categoryPerformance.map((cat: any) => [
        cat.category,
        `${cat.averageScore}%`,
        cat.totalAttempts.toString(),
        cat.uniqueUsers.toString()
      ]);

      pdf.autoTable({
        startY: yPosition,
        head: [['Category', 'Avg Score', 'Total Attempts', 'Unique Users']],
        body: categoryRows,
        theme: 'striped',
        headStyles: { 
          fillColor: [126, 87, 194],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold'
        },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 35, halign: 'center', textColor: [79, 70, 229] },
        2: { cellWidth: 40, halign: 'center' },
        3: { cellWidth: 40, halign: 'center' }
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 8;
    }

    // ============================================================================
    // TUTORIAL ENROLLMENTS
    // ============================================================================
    
    // tutorial enrollments section
    const tutorialEnrollments = analyticsData.tutorialEnrollments || [];
    if (tutorialEnrollments.length > 0) {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFillColor(245, 245, 250);
      pdf.rect(10, yPosition, pageWidth - 20, 8, 'F');
      pdf.setTextColor(126, 87, 194);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOP TUTORIAL ENROLLMENTS', pageWidth / 2, yPosition + 5.5, { align: 'center' });
      
      yPosition += 12;

      const enrollmentRows = tutorialEnrollments.slice(0, 10).map((t: any) => [
        t.title.substring(0, 40),
        t.category,
        t.enrollments.toString(),
        t.views.toString()
      ]);

      pdf.autoTable({
        startY: yPosition,
        head: [['Tutorial', 'Category', 'Enrollments', 'Views']],
        body: enrollmentRows,
        theme: 'striped',
        headStyles: { 
          fillColor: [126, 87, 194],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold'
        },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' }
        },
        margin: { left: 15, right: 15 }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 8;
    }

    // ============================================================================
    // RECOMMENDATIONS & INSIGHTS
    // ============================================================================
    
    if (yPosition > pageHeight - 50) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFillColor(245, 245, 250);
    pdf.rect(10, yPosition, pageWidth - 20, 8, 'F');
    pdf.setTextColor(126, 87, 194);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RECOMMENDATIONS & INSIGHTS', pageWidth / 2, yPosition + 5.5, { align: 'center' });
    
    yPosition += 14;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);

    const recommendations = [];
    
    if (overall.averageQuizScore >= 80) {
      recommendations.push('✓ Excellent quiz performance: Average quiz score is above 80%. Maintain current content quality.');
    } else if (overall.averageQuizScore >= 60) {
      recommendations.push('◉ Good quiz performance: Average quiz score is satisfactory. Consider targeted improvements.');
    } else {
      recommendations.push('⚠ Quiz performance needs attention: Average score below 60%. Review quiz content and difficulty.');
    }

    if (overall.totalTutorialEnrollments > 0) {
      const avgEnrollmentsPerTutorial = overall.totalTutorialEnrollments / overall.totalTutorials;
      if (avgEnrollmentsPerTutorial >= 5) {
        recommendations.push('✓ Strong tutorial engagement: Good enrollment rates across tutorials.');
      } else {
        recommendations.push('◉ Tutorial engagement: Consider promoting popular tutorials to increase enrollments.');
      }
    }

    if (overall.totalQuizAttempts > 0) {
      const avgAttemptsPerQuiz = overall.totalQuizAttempts / overall.totalQuizzes;
      if (avgAttemptsPerQuiz >= 3) {
        recommendations.push('✓ Strong quiz engagement: Good attempt rates across quizzes.');
      } else {
        recommendations.push('◉ Quiz engagement: Consider improving quiz visibility and promotion.');
      }
    }

    const seriesCompletions = analyticsData.seriesCompletions || [];
    if (seriesCompletions.length > 0) {
      const avgCompletionRate = seriesCompletions.reduce((sum: number, s: any) => sum + s.completionRate, 0) / seriesCompletions.length;
      if (avgCompletionRate >= 70) {
        recommendations.push('✓ High series completion: Users are completing tutorial series successfully.');
      } else if (avgCompletionRate >= 50) {
        recommendations.push('◉ Moderate series completion: Consider improving content to increase completion rates.');
      } else {
        recommendations.push('⚠ Low series completion: Review tutorial series content and structure.');
      }
    }

    recommendations.push(`ℹ Platform health status: ${overall.averageQuizScore >= 70 ? 'EXCELLENT' : overall.averageQuizScore >= 60 ? 'GOOD' : 'NEEDS WORK'}`);

    recommendations.forEach((rec) => {
      const lines = pdf.splitTextToSize(rec, pageWidth - 30);
      pdf.text(lines, 15, yPosition);
      yPosition += (lines.length * 5) + 3;
    });

    // ============================================================================
    // FOOTER
    // ============================================================================
    
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `LipRead AI - Confidential Report | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // save pdf
    pdf.save(`User_Learning_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    
    console.log('[PDF Export] Report generated successfully');
    
  } catch (error) {
    console.error('[PDF Export] Error generating report:', error);
    throw error;
  }
};

