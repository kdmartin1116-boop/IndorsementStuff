// ===========================================
// AUTOMATED REPORT GENERATOR
// Business Intelligence Report Generation Engine
// ===========================================

import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'operational' | 'financial' | 'compliance' | 'performance' | 'user_behavior' | 'security' | 'executive';
  sections: ReportSection[];
  styling: ReportStyling;
  page_settings: PageSettings;
  metadata: {
    version: string;
    created_by: string;
    created_at: Date;
    updated_at: Date;
    tags: string[];
  };
}

interface ReportSection {
  id: string;
  type: 'header' | 'text' | 'metric_summary' | 'chart' | 'table' | 'image' | 'kpi_grid' | 'insight_panel' | 'executive_summary' | 'page_break';
  title?: string;
  subtitle?: string;
  content?: any;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  styling?: Partial<ReportStyling>;
  data_source?: DataSource;
  filters?: QueryFilter[];
  formatting?: SectionFormatting;
  conditional_rendering?: ConditionalRule[];
}

interface ReportStyling {
  theme: 'light' | 'dark' | 'corporate' | 'minimal' | 'colorful';
  brand: {
    logo_url?: string;
    company_name: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    text_color: string;
    background_color: string;
  };
  typography: {
    header_font: string;
    body_font: string;
    code_font: string;
    header_sizes: {
      h1: number;
      h2: number;
      h3: number;
      h4: number;
    };
    body_size: number;
    line_height: number;
  };
  spacing: {
    section_margin: number;
    paragraph_spacing: number;
    table_padding: number;
  };
  borders: {
    enabled: boolean;
    color: string;
    width: number;
    radius: number;
  };
}

interface PageSettings {
  orientation: 'portrait' | 'landscape';
  size: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Tabloid';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  header: {
    enabled: boolean;
    height: number;
    content: string;
    show_page_numbers: boolean;
  };
  footer: {
    enabled: boolean;
    height: number;
    content: string;
    show_timestamp: boolean;
  };
  watermark?: {
    text: string;
    opacity: number;
    rotation: number;
  };
}

interface DataSource {
  type: 'metrics' | 'time_series' | 'aggregated' | 'raw_data' | 'external_api';
  source_id: string;
  query: any;
  refresh_rate?: number;
  cache_duration?: number;
  transformation?: DataTransformation[];
}

interface DataTransformation {
  type: 'filter' | 'aggregate' | 'sort' | 'calculate' | 'format' | 'group';
  parameters: Record<string, any>;
}

interface SectionFormatting {
  number_format?: {
    locale: string;
    currency?: string;
    decimal_places: number;
    use_grouping: boolean;
  };
  date_format?: string;
  chart_settings?: {
    type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'radar' | 'heatmap';
    colors: string[];
    show_legend: boolean;
    show_grid: boolean;
    animation: boolean;
    responsive: boolean;
  };
  table_settings?: {
    show_headers: boolean;
    alternating_rows: boolean;
    sortable: boolean;
    pagination: boolean;
    max_rows: number;
  };
}

interface ConditionalRule {
  condition: string;
  action: 'show' | 'hide' | 'highlight' | 'format';
  parameters?: Record<string, any>;
}

interface QueryFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' | 'contains' | 'regex';
  value: any;
}

interface ReportGeneration {
  id: string;
  template_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  format: 'pdf' | 'excel' | 'html' | 'csv' | 'json';
  parameters: {
    date_range: { start: Date; end: Date };
    filters: QueryFilter[];
    recipients: string[];
    delivery_method: 'download' | 'email' | 'webhook' | 'storage';
  };
  progress: number; // 0-100
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  file_info?: {
    size_bytes: number;
    download_url: string;
    expires_at: Date;
  };
  error_message?: string;
  created_by: string;
  notifications_sent: boolean;
}

interface ExecutiveSummary {
  key_metrics: Array<{
    name: string;
    current_value: number;
    previous_value: number;
    change_percent: number;
    trend: 'up' | 'down' | 'stable';
    status: 'good' | 'warning' | 'critical';
  }>;
  top_insights: Array<{
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
  performance_summary: {
    overall_score: number;
    improvement_areas: string[];
    strengths: string[];
  };
  forecast: Array<{
    metric: string;
    predicted_value: number;
    confidence: number;
    timeframe: string;
  }>;
}

export class AutomatedReportGenerator {
  private static instance: AutomatedReportGenerator;
  private templates: Map<string, ReportTemplate> = new Map();
  private activeGenerations: Map<string, ReportGeneration> = new Map();
  private scheduledReports: Map<string, NodeJS.Timeout> = new Map();

  private readonly SUPPORTED_FORMATS = ['pdf', 'excel', 'html', 'csv', 'json'] as const;
  private readonly DEFAULT_STYLING: ReportStyling = {
    theme: 'corporate',
    brand: {
      company_name: 'Indorsement Platform',
      primary_color: '#1976d2',
      secondary_color: '#424242',
      accent_color: '#ff9800',
      text_color: '#333333',
      background_color: '#ffffff',
    },
    typography: {
      header_font: 'Arial, sans-serif',
      body_font: 'Arial, sans-serif',
      code_font: 'Courier New, monospace',
      header_sizes: { h1: 24, h2: 20, h3: 16, h4: 14 },
      body_size: 12,
      line_height: 1.4,
    },
    spacing: {
      section_margin: 20,
      paragraph_spacing: 10,
      table_padding: 8,
    },
    borders: {
      enabled: true,
      color: '#e0e0e0',
      width: 1,
      radius: 4,
    },
  };

  private constructor() {}

  public static getInstance(): AutomatedReportGenerator {
    if (!AutomatedReportGenerator.instance) {
      AutomatedReportGenerator.instance = new AutomatedReportGenerator();
    }
    return AutomatedReportGenerator.instance;
  }

  // ===========================================
  // TEMPLATE MANAGEMENT
  // ===========================================

  public async createTemplate(template: Omit<ReportTemplate, 'id' | 'metadata'>): Promise<ReportTemplate> {
    const newTemplate: ReportTemplate = {
      id: this.generateId(),
      ...template,
      styling: { ...this.DEFAULT_STYLING, ...template.styling },
      metadata: {
        version: '1.0.0',
        created_by: 'system', // Would be actual user ID
        created_at: new Date(),
        updated_at: new Date(),
        tags: [],
      },
    };

    this.templates.set(newTemplate.id, newTemplate);
    await this.saveTemplate(newTemplate);

    console.log(`📋 Report template created: ${newTemplate.name}`);
    return newTemplate;
  }

  public async getTemplate(templateId: string): Promise<ReportTemplate | null> {
    if (this.templates.has(templateId)) {
      return this.templates.get(templateId)!;
    }

    // Load from storage
    try {
      const template = await this.loadTemplate(templateId);
      if (template) {
        this.templates.set(templateId, template);
        return template;
      }
    } catch (error) {
      console.error('Failed to load template:', error);
    }

    return null;
  }

  public getAvailableTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values());
  }

  // ===========================================
  // REPORT GENERATION
  // ===========================================

  public async generateReport(
    templateId: string,
    format: typeof this.SUPPORTED_FORMATS[number],
    parameters: {
      date_range: { start: Date; end: Date };
      filters?: QueryFilter[];
      recipients?: string[];
      delivery_method?: 'download' | 'email' | 'webhook' | 'storage';
    }
  ): Promise<ReportGeneration> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const generation: ReportGeneration = {
      id: this.generateId(),
      template_id: templateId,
      status: 'queued',
      format,
      parameters: {
        date_range: parameters.date_range,
        filters: parameters.filters || [],
        recipients: parameters.recipients || [],
        delivery_method: parameters.delivery_method || 'download',
      },
      progress: 0,
      created_at: new Date(),
      created_by: 'system', // Would be actual user ID
      notifications_sent: false,
    };

    this.activeGenerations.set(generation.id, generation);

    // Start generation process
    this.processReportGeneration(generation, template);

    return generation;
  }

  private async processReportGeneration(generation: ReportGeneration, template: ReportTemplate): Promise<void> {
    try {
      generation.status = 'processing';
      generation.started_at = new Date();
      generation.progress = 10;

      console.log(`🔄 Starting report generation: ${template.name}`);

      // Collect data for all sections
      const sectionData = await this.collectSectionData(template.sections, generation.parameters);
      generation.progress = 40;

      // Generate executive summary if needed
      const executiveSummary = await this.generateExecutiveSummary(sectionData, template.category);
      generation.progress = 60;

      // Generate report based on format
      let reportContent: any;
      switch (generation.format) {
        case 'pdf':
          reportContent = await this.generatePDFReport(template, sectionData, executiveSummary);
          break;
        case 'excel':
          reportContent = await this.generateExcelReport(template, sectionData, executiveSummary);
          break;
        case 'html':
          reportContent = await this.generateHTMLReport(template, sectionData, executiveSummary);
          break;
        case 'csv':
          reportContent = await this.generateCSVReport(template, sectionData);
          break;
        case 'json':
          reportContent = await this.generateJSONReport(template, sectionData, executiveSummary);
          break;
        default:
          throw new Error(`Unsupported format: ${generation.format}`);
      }

      generation.progress = 80;

      // Save report file
      const fileInfo = await this.saveReportFile(generation.id, reportContent, generation.format);
      generation.file_info = fileInfo;
      generation.progress = 90;

      // Deliver report
      await this.deliverReport(generation, reportContent);
      generation.progress = 100;

      generation.status = 'completed';
      generation.completed_at = new Date();

      console.log(`✅ Report generation completed: ${template.name}`);
    } catch (error) {
      generation.status = 'failed';
      generation.error_message = error instanceof Error ? error.message : 'Unknown error';
      generation.completed_at = new Date();

      console.error('Report generation failed:', error);
    }
  }

  // ===========================================
  // DATA COLLECTION
  // ===========================================

  private async collectSectionData(sections: ReportSection[], parameters: any): Promise<Map<string, any>> {
    const sectionData = new Map<string, any>();

    for (const section of sections) {
      if (section.data_source) {
        try {
          const data = await this.fetchSectionData(section.data_source, parameters);
          sectionData.set(section.id, data);
        } catch (error) {
          console.error(`Failed to collect data for section ${section.id}:`, error);
          sectionData.set(section.id, { error: 'Data collection failed' });
        }
      }
    }

    return sectionData;
  }

  private async fetchSectionData(dataSource: DataSource, parameters: any): Promise<any> {
    // Apply filters from parameters
    const enhancedQuery = {
      ...dataSource.query,
      filters: [...(dataSource.query.filters || []), ...parameters.filters],
      timeRange: parameters.date_range,
    };

    switch (dataSource.type) {
      case 'metrics':
        return await this.fetchMetricsData(enhancedQuery);
      case 'time_series':
        return await this.fetchTimeSeriesData(enhancedQuery);
      case 'aggregated':
        return await this.fetchAggregatedData(enhancedQuery);
      case 'raw_data':
        return await this.fetchRawData(enhancedQuery);
      case 'external_api':
        return await this.fetchExternalData(enhancedQuery);
      default:
        throw new Error(`Unsupported data source type: ${dataSource.type}`);
    }
  }

  private async fetchMetricsData(query: any): Promise<any> {
    // Mock implementation - would integrate with actual analytics service
    return {
      metrics: [
        { name: 'Total Endorsements', value: 1247, change: 7.9 },
        { name: 'Active Users', value: 342, change: 4.3 },
        { name: 'Conversion Rate', value: 24.8, change: 12.2 },
        { name: 'Revenue', value: 45280, change: 7.4 },
      ],
    };
  }

  private async fetchTimeSeriesData(query: any): Promise<any> {
    // Mock implementation
    return {
      data: [
        { date: '2024-01-01', value: 120 },
        { date: '2024-01-02', value: 135 },
        { date: '2024-01-03', value: 148 },
        // ... more data points
      ],
    };
  }

  private async fetchAggregatedData(query: any): Promise<any> {
    // Mock implementation
    return {
      summary: {
        total_records: 1000,
        average_value: 250,
        max_value: 500,
        min_value: 10,
      },
      breakdown: [
        { category: 'Legal Professionals', value: 145, percentage: 42.3 },
        { category: 'Corporate Users', value: 98, percentage: 28.7 },
        { category: 'Individual Users', value: 76, percentage: 22.2 },
        { category: 'Government', value: 23, percentage: 6.7 },
      ],
    };
  }

  private async fetchRawData(query: any): Promise<any> {
    // Mock implementation
    return {
      records: [
        { id: 1, name: 'John Doe', email: 'john@example.com', created_at: '2024-01-01' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: '2024-01-02' },
        // ... more records
      ],
    };
  }

  private async fetchExternalData(query: any): Promise<any> {
    // Mock implementation
    return {
      external_metrics: {
        market_data: 125.67,
        industry_benchmark: 18.5,
        competitor_analysis: 'Above average',
      },
    };
  }

  // ===========================================
  // EXECUTIVE SUMMARY GENERATION
  // ===========================================

  private async generateExecutiveSummary(
    sectionData: Map<string, any>,
    category: string
  ): Promise<ExecutiveSummary> {
    // AI-powered summary generation (mock implementation)
    return {
      key_metrics: [
        {
          name: 'Total Revenue',
          current_value: 45280,
          previous_value: 42150,
          change_percent: 7.4,
          trend: 'up',
          status: 'good',
        },
        {
          name: 'User Growth',
          current_value: 342,
          previous_value: 328,
          change_percent: 4.3,
          trend: 'up',
          status: 'good',
        },
        {
          name: 'Conversion Rate',
          current_value: 24.8,
          previous_value: 22.1,
          change_percent: 12.2,
          trend: 'up',
          status: 'good',
        },
      ],
      top_insights: [
        {
          title: 'Strong Revenue Growth',
          description: 'Revenue increased by 7.4% compared to the previous period, driven by higher conversion rates.',
          impact: 'high',
          recommendation: 'Continue current marketing strategies and consider expanding to new markets.',
        },
        {
          title: 'User Engagement Improving',
          description: 'User engagement metrics show positive trends with increased session duration.',
          impact: 'medium',
          recommendation: 'Focus on feature adoption to maintain engagement momentum.',
        },
      ],
      performance_summary: {
        overall_score: 85.2,
        improvement_areas: ['Feature adoption', 'Mobile user experience'],
        strengths: ['Revenue growth', 'User satisfaction', 'Security compliance'],
      },
      forecast: [
        {
          metric: 'Revenue',
          predicted_value: 48500,
          confidence: 82.5,
          timeframe: 'Next 30 days',
        },
        {
          metric: 'Active Users',
          predicted_value: 385,
          confidence: 76.8,
          timeframe: 'Next 30 days',
        },
      ],
    };
  }

  // ===========================================
  // FORMAT-SPECIFIC GENERATION
  // ===========================================

  private async generatePDFReport(
    template: ReportTemplate,
    sectionData: Map<string, any>,
    executiveSummary: ExecutiveSummary
  ): Promise<Buffer> {
    const pdf = new jsPDF({
      orientation: template.page_settings.orientation,
      unit: 'mm',
      format: template.page_settings.size.toLowerCase() as any,
    });

    let yPosition = template.page_settings.margins.top;

    // Add header
    if (template.page_settings.header.enabled) {
      pdf.setFontSize(16);
      pdf.setFont(template.styling.typography.header_font, 'bold');
      pdf.text(template.name, template.page_settings.margins.left, yPosition);
      yPosition += 15;
    }

    // Add executive summary
    if (template.category === 'executive') {
      yPosition = this.addExecutiveSummaryToPDF(pdf, executiveSummary, yPosition, template);
    }

    // Add sections
    for (const section of template.sections) {
      const data = sectionData.get(section.id);
      yPosition = await this.addSectionToPDF(pdf, section, data, yPosition, template);
      
      // Check if we need a new page
      if (yPosition > 250) { // Near bottom of A4 page
        pdf.addPage();
        yPosition = template.page_settings.margins.top;
      }
    }

    // Add footer
    if (template.page_settings.footer.enabled) {
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.text(
          `Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`,
          template.page_settings.margins.left,
          280 // Near bottom of page
        );
      }
    }

    return Buffer.from(pdf.output('arraybuffer'));
  }

  private async generateExcelReport(
    template: ReportTemplate,
    sectionData: Map<string, any>,
    executiveSummary: ExecutiveSummary
  ): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    // Executive summary sheet
    if (template.category === 'executive') {
      const summaryData = this.convertExecutiveSummaryToExcelData(executiveSummary);
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');
    }

    // Data sheets for each section
    for (const section of template.sections) {
      if (section.type === 'table' || section.type === 'metric_summary') {
        const data = sectionData.get(section.id);
        if (data) {
          const sheetData = this.convertSectionDataToExcelFormat(section, data);
          const sheet = XLSX.utils.json_to_sheet(sheetData);
          XLSX.utils.book_append_sheet(workbook, sheet, section.title || section.id);
        }
      }
    }

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  private async generateHTMLReport(
    template: ReportTemplate,
    sectionData: Map<string, any>,
    executiveSummary: ExecutiveSummary
  ): Promise<string> {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${template.name}</title>
        <style>
          ${this.generateCSSFromStyling(template.styling)}
        </style>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      </head>
      <body>
        <div class="report-container">
          <header>
            <h1>${template.name}</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </header>
    `;

    // Add executive summary
    if (template.category === 'executive') {
      html += this.generateExecutiveSummaryHTML(executiveSummary);
    }

    // Add sections
    for (const section of template.sections) {
      const data = sectionData.get(section.id);
      html += await this.generateSectionHTML(section, data, template.styling);
    }

    html += `
        </div>
      </body>
      </html>
    `;

    return html;
  }

  private async generateCSVReport(
    template: ReportTemplate,
    sectionData: Map<string, any>
  ): Promise<string> {
    const csvRows: string[] = [];
    
    // Add header
    csvRows.push(`"Report: ${template.name}"`);
    csvRows.push(`"Generated: ${new Date().toISOString()}"`);
    csvRows.push(''); // Empty row

    // Process each section
    for (const section of template.sections) {
      if (section.type === 'table' || section.type === 'metric_summary') {
        const data = sectionData.get(section.id);
        if (data) {
          csvRows.push(`"${section.title || section.id}"`);
          const sectionCSV = this.convertSectionDataToCSV(section, data);
          csvRows.push(...sectionCSV);
          csvRows.push(''); // Empty row between sections
        }
      }
    }

    return csvRows.join('\n');
  }

  private async generateJSONReport(
    template: ReportTemplate,
    sectionData: Map<string, any>,
    executiveSummary: ExecutiveSummary
  ): Promise<string> {
    const report = {
      template: {
        id: template.id,
        name: template.name,
        category: template.category,
      },
      generated_at: new Date().toISOString(),
      executive_summary: executiveSummary,
      sections: {},
    };

    // Add section data
    for (const section of template.sections) {
      const data = sectionData.get(section.id);
      if (data) {
        (report.sections as any)[section.id] = {
          title: section.title,
          type: section.type,
          data: data,
        };
      }
    }

    return JSON.stringify(report, null, 2);
  }

  // ===========================================
  // PDF HELPER METHODS
  // ===========================================

  private addExecutiveSummaryToPDF(
    pdf: jsPDF,
    summary: ExecutiveSummary,
    yPosition: number,
    template: ReportTemplate
  ): number {
    const leftMargin = template.page_settings.margins.left;
    
    // Title
    pdf.setFontSize(18);
    pdf.setFont(template.styling.typography.header_font, 'bold');
    pdf.text('Executive Summary', leftMargin, yPosition);
    yPosition += 15;

    // Key metrics
    pdf.setFontSize(14);
    pdf.text('Key Performance Indicators', leftMargin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont(template.styling.typography.body_font, 'normal');
    
    for (const metric of summary.key_metrics) {
      const changeDirection = metric.change_percent >= 0 ? '↑' : '↓';
      const text = `${metric.name}: ${metric.current_value.toLocaleString()} (${changeDirection} ${Math.abs(metric.change_percent)}%)`;
      pdf.text(text, leftMargin + 5, yPosition);
      yPosition += 6;
    }

    yPosition += 10;

    // Top insights
    pdf.setFontSize(14);
    pdf.setFont(template.styling.typography.header_font, 'bold');
    pdf.text('Key Insights', leftMargin, yPosition);
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.setFont(template.styling.typography.body_font, 'normal');
    
    for (const insight of summary.top_insights) {
      pdf.setFont(template.styling.typography.body_font, 'bold');
      pdf.text(`${insight.title}:`, leftMargin + 5, yPosition);
      yPosition += 6;
      
      pdf.setFont(template.styling.typography.body_font, 'normal');
      const descriptionLines = pdf.splitTextToSize(insight.description, 160);
      pdf.text(descriptionLines, leftMargin + 5, yPosition);
      yPosition += descriptionLines.length * 4 + 5;
    }

    return yPosition + 10;
  }

  private async addSectionToPDF(
    pdf: jsPDF,
    section: ReportSection,
    data: any,
    yPosition: number,
    template: ReportTemplate
  ): Promise<number> {
    const leftMargin = template.page_settings.margins.left;

    if (section.title) {
      pdf.setFontSize(12);
      pdf.setFont(template.styling.typography.header_font, 'bold');
      pdf.text(section.title, leftMargin, yPosition);
      yPosition += 10;
    }

    switch (section.type) {
      case 'text':
        pdf.setFontSize(10);
        pdf.setFont(template.styling.typography.body_font, 'normal');
        const textLines = pdf.splitTextToSize(section.content || '', 160);
        pdf.text(textLines, leftMargin, yPosition);
        yPosition += textLines.length * 4 + 5;
        break;

      case 'metric_summary':
        if (data && data.metrics) {
          for (const metric of data.metrics) {
            pdf.setFontSize(10);
            const metricText = `${metric.name}: ${metric.value.toLocaleString()} (${metric.change >= 0 ? '+' : ''}${metric.change}%)`;
            pdf.text(metricText, leftMargin + 5, yPosition);
            yPosition += 6;
          }
        }
        yPosition += 5;
        break;

      case 'table':
        if (data && data.records) {
          yPosition = this.addTableToPDF(pdf, data.records, yPosition, template);
        }
        break;

      case 'chart':
        // For PDF, we would generate a chart image and embed it
        pdf.setFontSize(10);
        pdf.text('[Chart placeholder - would contain generated chart image]', leftMargin, yPosition);
        yPosition += 20;
        break;

      case 'page_break':
        pdf.addPage();
        yPosition = template.page_settings.margins.top;
        break;
    }

    return yPosition + 5;
  }

  private addTableToPDF(
    pdf: jsPDF,
    records: any[],
    yPosition: number,
    template: ReportTemplate
  ): number {
    if (records.length === 0) return yPosition;

    const leftMargin = template.page_settings.margins.left;
    const headers = Object.keys(records[0]);
    const colWidth = 40; // Simplified column width

    // Headers
    pdf.setFontSize(9);
    pdf.setFont(template.styling.typography.body_font, 'bold');
    headers.forEach((header, index) => {
      pdf.text(header, leftMargin + (index * colWidth), yPosition);
    });
    yPosition += 6;

    // Data rows (limit to first 20 rows for PDF)
    pdf.setFont(template.styling.typography.body_font, 'normal');
    const limitedRecords = records.slice(0, 20);
    
    for (const record of limitedRecords) {
      headers.forEach((header, index) => {
        const value = String(record[header] || '');
        pdf.text(value.substring(0, 15), leftMargin + (index * colWidth), yPosition);
      });
      yPosition += 5;
    }

    if (records.length > 20) {
      pdf.setFont(template.styling.typography.body_font, 'italic');
      pdf.text(`... and ${records.length - 20} more records`, leftMargin, yPosition);
      yPosition += 5;
    }

    return yPosition + 10;
  }

  // ===========================================
  // HTML HELPER METHODS
  // ===========================================

  private generateCSSFromStyling(styling: ReportStyling): string {
    return `
      body {
        font-family: ${styling.typography.body_font};
        font-size: ${styling.typography.body_size}px;
        line-height: ${styling.typography.line_height};
        color: ${styling.brand.text_color};
        background-color: ${styling.brand.background_color};
        margin: 0;
        padding: 20px;
      }
      
      .report-container {
        max-width: 1200px;
        margin: 0 auto;
      }
      
      h1, h2, h3, h4 {
        font-family: ${styling.typography.header_font};
        color: ${styling.brand.primary_color};
      }
      
      h1 { font-size: ${styling.typography.header_sizes.h1}px; }
      h2 { font-size: ${styling.typography.header_sizes.h2}px; }
      h3 { font-size: ${styling.typography.header_sizes.h3}px; }
      h4 { font-size: ${styling.typography.header_sizes.h4}px; }
      
      .metric-card {
        background: white;
        border: ${styling.borders.enabled ? `${styling.borders.width}px solid ${styling.borders.color}` : 'none'};
        border-radius: ${styling.borders.radius}px;
        padding: ${styling.spacing.table_padding}px;
        margin: ${styling.spacing.section_margin}px 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .insight-panel {
        background: ${styling.brand.accent_color}20;
        border-left: 4px solid ${styling.brand.accent_color};
        padding: ${styling.spacing.table_padding}px;
        margin: ${styling.spacing.paragraph_spacing}px 0;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin: ${styling.spacing.section_margin}px 0;
      }
      
      th, td {
        padding: ${styling.spacing.table_padding}px;
        text-align: left;
        border-bottom: 1px solid ${styling.borders.color};
      }
      
      th {
        background-color: ${styling.brand.primary_color};
        color: white;
      }
    `;
  }

  private generateExecutiveSummaryHTML(summary: ExecutiveSummary): string {
    let html = '<div class="executive-summary"><h2>Executive Summary</h2>';

    // Key metrics
    html += '<div class="key-metrics"><h3>Key Performance Indicators</h3>';
    for (const metric of summary.key_metrics) {
      const trendIcon = metric.trend === 'up' ? '↗️' : metric.trend === 'down' ? '↘️' : '➡️';
      const statusColor = metric.status === 'good' ? 'green' : metric.status === 'warning' ? 'orange' : 'red';
      
      html += `
        <div class="metric-card">
          <h4>${metric.name} ${trendIcon}</h4>
          <p style="color: ${statusColor}; font-size: 1.2em; font-weight: bold;">
            ${metric.current_value.toLocaleString()}
          </p>
          <p>Change: ${metric.change_percent >= 0 ? '+' : ''}${metric.change_percent}% from previous period</p>
        </div>
      `;
    }
    html += '</div>';

    // Top insights
    html += '<div class="top-insights"><h3>Key Insights</h3>';
    for (const insight of summary.top_insights) {
      const impactColor = insight.impact === 'high' ? 'red' : insight.impact === 'medium' ? 'orange' : 'blue';
      
      html += `
        <div class="insight-panel">
          <h4>${insight.title}</h4>
          <p>${insight.description}</p>
          <p><strong>Impact:</strong> <span style="color: ${impactColor};">${insight.impact.toUpperCase()}</span></p>
          <p><strong>Recommendation:</strong> ${insight.recommendation}</p>
        </div>
      `;
    }
    html += '</div>';

    html += '</div>';
    return html;
  }

  private async generateSectionHTML(
    section: ReportSection,
    data: any,
    styling: ReportStyling
  ): Promise<string> {
    let html = `<div class="section" id="${section.id}">`;

    if (section.title) {
      html += `<h3>${section.title}</h3>`;
    }

    switch (section.type) {
      case 'text':
        html += `<p>${section.content || ''}</p>`;
        break;

      case 'metric_summary':
        if (data && data.metrics) {
          html += '<div class="metrics-grid">';
          for (const metric of data.metrics) {
            html += `
              <div class="metric-card">
                <h4>${metric.name}</h4>
                <p class="metric-value">${metric.value.toLocaleString()}</p>
                <p class="metric-change">Change: ${metric.change >= 0 ? '+' : ''}${metric.change}%</p>
              </div>
            `;
          }
          html += '</div>';
        }
        break;

      case 'table':
        if (data && data.records && data.records.length > 0) {
          const headers = Object.keys(data.records[0]);
          html += '<table><thead><tr>';
          headers.forEach(header => {
            html += `<th>${header}</th>`;
          });
          html += '</tr></thead><tbody>';
          
          data.records.forEach((record: any) => {
            html += '<tr>';
            headers.forEach(header => {
              html += `<td>${record[header] || ''}</td>`;
            });
            html += '</tr>';
          });
          html += '</tbody></table>';
        }
        break;

      case 'chart':
        // Generate chart container - would be populated by Chart.js
        html += `
          <div class="chart-container">
            <canvas id="chart_${section.id}" width="400" height="200"></canvas>
            <script>
              // Chart.js initialization would go here
              console.log('Chart placeholder for section ${section.id}');
            </script>
          </div>
        `;
        break;
    }

    html += '</div>';
    return html;
  }

  // ===========================================
  // DATA CONVERSION HELPERS
  // ===========================================

  private convertExecutiveSummaryToExcelData(summary: ExecutiveSummary): any[] {
    const data = [];
    
    // Key metrics
    data.push({ Section: 'Key Metrics', Metric: '', Value: '', Change: '' });
    for (const metric of summary.key_metrics) {
      data.push({
        Section: '',
        Metric: metric.name,
        Value: metric.current_value,
        Change: `${metric.change_percent}%`,
      });
    }
    
    data.push({ Section: '', Metric: '', Value: '', Change: '' }); // Empty row
    
    // Insights
    data.push({ Section: 'Top Insights', Metric: '', Value: '', Change: '' });
    for (const insight of summary.top_insights) {
      data.push({
        Section: '',
        Metric: insight.title,
        Value: insight.description,
        Change: insight.impact,
      });
    }

    return data;
  }

  private convertSectionDataToExcelFormat(section: ReportSection, data: any): any[] {
    if (section.type === 'metric_summary' && data.metrics) {
      return data.metrics.map((metric: any) => ({
        Metric: metric.name,
        Value: metric.value,
        Change: metric.change,
      }));
    }
    
    if (section.type === 'table' && data.records) {
      return data.records;
    }
    
    return [{ Data: JSON.stringify(data) }];
  }

  private convertSectionDataToCSV(section: ReportSection, data: any): string[] {
    const rows: string[] = [];
    
    if (section.type === 'metric_summary' && data.metrics) {
      rows.push('"Metric","Value","Change"');
      for (const metric of data.metrics) {
        rows.push(`"${metric.name}","${metric.value}","${metric.change}%"`);
      }
    } else if (section.type === 'table' && data.records && data.records.length > 0) {
      const headers = Object.keys(data.records[0]);
      rows.push(headers.map(h => `"${h}"`).join(','));
      
      for (const record of data.records) {
        const values = headers.map(header => `"${record[header] || ''}"`);
        rows.push(values.join(','));
      }
    }
    
    return rows;
  }

  // ===========================================
  // FILE MANAGEMENT
  // ===========================================

  private async saveReportFile(
    reportId: string,
    content: any,
    format: string
  ): Promise<{ size_bytes: number; download_url: string; expires_at: Date }> {
    // In a real implementation, this would save to cloud storage
    const filename = `report_${reportId}.${format}`;
    const size = Buffer.isBuffer(content) ? content.length : Buffer.from(content).length;
    
    // Mock file storage
    const downloadUrl = `https://api.indorsement.app/reports/download/${filename}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      size_bytes: size,
      download_url: downloadUrl,
      expires_at: expiresAt,
    };
  }

  private async deliverReport(generation: ReportGeneration, content: any): Promise<void> {
    switch (generation.parameters.delivery_method) {
      case 'download':
        // File is ready for download
        break;
      case 'email':
        await this.sendReportByEmail(generation, content);
        break;
      case 'webhook':
        await this.sendReportToWebhook(generation, content);
        break;
      case 'storage':
        await this.saveReportToStorage(generation, content);
        break;
    }
  }

  private async sendReportByEmail(generation: ReportGeneration, content: any): Promise<void> {
    // Mock email delivery
    console.log(`📧 Sending report to ${generation.parameters.recipients.length} recipients`);
  }

  private async sendReportToWebhook(generation: ReportGeneration, content: any): Promise<void> {
    // Mock webhook delivery
    console.log('🔗 Sending report to webhook');
  }

  private async saveReportToStorage(generation: ReportGeneration, content: any): Promise<void> {
    // Mock storage save
    console.log('💾 Saving report to storage');
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveTemplate(template: ReportTemplate): Promise<void> {
    // In a real implementation, this would save to database
    console.log(`💾 Template saved: ${template.name}`);
  }

  private async loadTemplate(templateId: string): Promise<ReportTemplate | null> {
    // In a real implementation, this would load from database
    return null;
  }

  // ===========================================
  // PUBLIC API
  // ===========================================

  public static async generateReport(
    templateId: string,
    format: 'pdf' | 'excel' | 'html' | 'csv' | 'json',
    parameters: any
  ): Promise<ReportGeneration> {
    const instance = AutomatedReportGenerator.getInstance();
    return instance.generateReport(templateId, format, parameters);
  }

  public static async createTemplate(template: any): Promise<ReportTemplate> {
    const instance = AutomatedReportGenerator.getInstance();
    return instance.createTemplate(template);
  }

  public static getTemplates(): ReportTemplate[] {
    const instance = AutomatedReportGenerator.getInstance();
    return instance.getAvailableTemplates();
  }

  public static getGeneration(generationId: string): ReportGeneration | null {
    const instance = AutomatedReportGenerator.getInstance();
    return instance.activeGenerations.get(generationId) || null;
  }
}

export { AutomatedReportGenerator };