// ===========================================
// ADVANCED ANALYTICS & REPORTING DASHBOARD
// Real-time Analytics with Business Intelligence
// ===========================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Tooltip,
  IconButton,
  Menu,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Timeline,
  TableChart,
  FilterList,
  GetApp,
  Refresh,
  DateRange,
  PredictiveText,
  Analytics,
  Dashboard,
  CompareArrows,
  Insights,
  AutoGraph,
  DataUsage,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  format: 'number' | 'percentage' | 'currency' | 'duration' | 'bytes';
  category: 'endorsements' | 'users' | 'documents' | 'performance' | 'security' | 'financial';
  trend: number[];
  target?: number;
  description: string;
  lastUpdated: Date;
}

interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'area' | 'bar' | 'pie' | 'scatter' | 'radar';
  data: any[];
  metrics: string[];
  timeframe: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  category: string;
  insights: string[];
  predictions?: any[];
}

interface Report {
  id: string;
  name: string;
  description: string;
  category: 'operational' | 'financial' | 'compliance' | 'performance' | 'user_behavior';
  schedule: 'manual' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  recipients: string[];
  lastGenerated: Date;
  nextScheduled?: Date;
  status: 'active' | 'paused' | 'draft';
  template: any;
}

interface Filter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: any;
  label: string;
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  widgets: Widget[];
  filters: Filter[];
  shareSettings: {
    isPublic: boolean;
    allowedUsers: string[];
    expiresAt?: Date;
  };
  refreshInterval: number; // seconds
  lastUpdated: Date;
}

interface Widget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'text' | 'image';
  title: string;
  position: { x: number; y: number; width: number; height: number };
  configuration: any;
  dataSource: string;
  refreshRate: number;
  isVisible: boolean;
}

interface AnalyticsState {
  selectedDashboard: Dashboard | null;
  dashboards: Dashboard[];
  metrics: AnalyticsMetric[];
  charts: ChartData[];
  reports: Report[];
  filters: Filter[];
  dateRange: { start: Date; end: Date };
  isLoading: boolean;
  isRealTimeEnabled: boolean;
  refreshInterval: number;
  selectedTab: number;
  compareMode: boolean;
  comparisonPeriod: { start: Date; end: Date };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb366'];

const formatValue = (value: number, format: AnalyticsMetric['format']): string => {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(value);
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'duration':
      return `${Math.round(value)}ms`;
    case 'bytes':
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(value) / Math.log(1024));
      return `${(value / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    default:
      return new Intl.NumberFormat('en-US').format(value);
  }
};

const getChangeIcon = (changeType: AnalyticsMetric['changeType']) => {
  switch (changeType) {
    case 'increase':
      return <TrendingUp sx={{ color: 'success.main' }} />;
    case 'decrease':
      return <TrendingDown sx={{ color: 'error.main' }} />;
    default:
      return <CompareArrows sx={{ color: 'text.secondary' }} />;
  }
};

const MetricCard: React.FC<{ metric: AnalyticsMetric }> = ({ metric }) => {
  const changeColor = metric.changeType === 'increase' ? 'success.main' : 
                     metric.changeType === 'decrease' ? 'error.main' : 'text.secondary';

  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" component="div" color="text.secondary">
            {metric.name}
          </Typography>
          {getChangeIcon(metric.changeType)}
        </Box>
        
        <Typography variant="h4" component="div" gutterBottom>
          {formatValue(metric.value, metric.format)}
        </Typography>
        
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="body2" color={changeColor} sx={{ fontWeight: 'bold' }}>
            {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            vs previous period
          </Typography>
        </Box>

        {metric.target && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Progress to target
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min((metric.value / metric.target) * 100, 100)}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary">
              {formatValue(metric.target, metric.format)} target
            </Typography>
          </Box>
        )}

        <ResponsiveContainer width="100%" height={60}>
          <LineChart data={metric.trend.map((value, index) => ({ value, index }))}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={changeColor} 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {metric.description}
        </Typography>
      </CardContent>
    </Card>
  );
};

const ChartWidget: React.FC<{ chart: ChartData }> = ({ chart }) => {
  const renderChart = () => {
    switch (chart.type) {
      case 'line':
        return (
          <LineChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            {chart.metrics.map((metric, index) => (
              <Line 
                key={metric}
                type="monotone" 
                dataKey={metric} 
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            {chart.metrics.map((metric, index) => (
              <Area
                key={metric}
                type="monotone"
                dataKey={metric}
                stackId="1"
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            {chart.metrics.map((metric, index) => (
              <Bar 
                key={metric}
                dataKey={metric} 
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chart.data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chart.data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip />
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart data={chart.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" />
            <YAxis dataKey="y" />
            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter 
              data={chart.data} 
              fill={COLORS[0]}
            />
          </ScatterChart>
        );

      case 'radar':
        return (
          <RadarChart data={chart.data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis />
            <Radar 
              name="Score" 
              dataKey="value" 
              stroke={COLORS[0]} 
              fill={COLORS[0]} 
              fillOpacity={0.6} 
            />
            <RechartsTooltip />
          </RadarChart>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {chart.title}
        </Typography>
        
        <ResponsiveContainer width="100%" height={300}>
          {renderChart()}
        </ResponsiveContainer>

        {chart.insights.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Key Insights:
            </Typography>
            {chart.insights.map((insight, index) => (
              <Chip
                key={index}
                label={insight}
                size="small"
                sx={{ mr: 1, mb: 1 }}
                icon={<Insights />}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const FilterBar: React.FC<{
  filters: Filter[];
  onFiltersChange: (filters: Filter[]) => void;
}> = ({ filters, onFiltersChange }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const addFilter = () => {
    const newFilter: Filter = {
      field: '',
      operator: 'equals',
      value: '',
      label: 'New Filter',
    };
    onFiltersChange([...filters, newFilter]);
  };

  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    onFiltersChange(newFilters);
  };

  const updateFilter = (index: number, updatedFilter: Filter) => {
    const newFilters = [...filters];
    newFilters[index] = updatedFilter;
    onFiltersChange(newFilters);
  };

  return (
    <Box display="flex" alignItems="center" gap={2} mb={3}>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <FilterList />
      </IconButton>
      
      {filters.map((filter, index) => (
        <Chip
          key={index}
          label={filter.label}
          onDelete={() => removeFilter(index)}
          variant="outlined"
        />
      ))}
      
      <Button
        variant="outlined"
        size="small"
        onClick={addFilter}
        startIcon={<FilterList />}
      >
        Add Filter
      </Button>
    </Box>
  );
};

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [state, setState] = useState<AnalyticsState>({
    selectedDashboard: null,
    dashboards: [],
    metrics: [],
    charts: [],
    reports: [],
    filters: [],
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    },
    isLoading: false,
    isRealTimeEnabled: true,
    refreshInterval: 30,
    selectedTab: 0,
    compareMode: false,
    comparisonPeriod: {
      start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      end: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    },
  });

  // Mock data for demonstration
  const mockMetrics: AnalyticsMetric[] = useMemo(() => [
    {
      id: '1',
      name: 'Total Endorsements',
      value: 1247,
      previousValue: 1156,
      change: 7.9,
      changeType: 'increase',
      format: 'number',
      category: 'endorsements',
      trend: [1100, 1120, 1140, 1180, 1200, 1220, 1247],
      target: 1500,
      description: 'Total number of endorsements processed',
      lastUpdated: new Date(),
    },
    {
      id: '2',
      name: 'Active Users',
      value: 342,
      previousValue: 328,
      change: 4.3,
      changeType: 'increase',
      format: 'number',
      category: 'users',
      trend: [300, 310, 315, 325, 335, 340, 342],
      target: 500,
      description: 'Monthly active users',
      lastUpdated: new Date(),
    },
    {
      id: '3',
      name: 'Conversion Rate',
      value: 24.8,
      previousValue: 22.1,
      change: 12.2,
      changeType: 'increase',
      format: 'percentage',
      category: 'performance',
      trend: [20, 21, 22, 23, 24, 24.5, 24.8],
      target: 30,
      description: 'Endorsement completion rate',
      lastUpdated: new Date(),
    },
    {
      id: '4',
      name: 'Revenue',
      value: 45280,
      previousValue: 42150,
      change: 7.4,
      changeType: 'increase',
      format: 'currency',
      category: 'financial',
      trend: [38000, 39000, 40000, 41000, 43000, 44000, 45280],
      target: 50000,
      description: 'Monthly recurring revenue',
      lastUpdated: new Date(),
    },
    {
      id: '5',
      name: 'Avg Response Time',
      value: 245,
      previousValue: 312,
      change: -21.5,
      changeType: 'increase', // Decrease is good for response time
      format: 'duration',
      category: 'performance',
      trend: [350, 330, 310, 290, 270, 260, 245],
      target: 200,
      description: 'Average API response time',
      lastUpdated: new Date(),
    },
    {
      id: '6',
      name: 'Security Score',
      value: 94.2,
      previousValue: 91.8,
      change: 2.6,
      changeType: 'increase',
      format: 'percentage',
      category: 'security',
      trend: [88, 89, 90, 91, 92, 93, 94.2],
      target: 95,
      description: 'Overall security compliance score',
      lastUpdated: new Date(),
    },
  ], []);

  const mockCharts: ChartData[] = useMemo(() => [
    {
      id: 'endorsements_trend',
      title: 'Endorsements Over Time',
      type: 'area',
      data: [
        { name: 'Jan', endorsements: 120, completed: 95, pending: 25 },
        { name: 'Feb', endorsements: 135, completed: 110, pending: 25 },
        { name: 'Mar', endorsements: 148, completed: 125, pending: 23 },
        { name: 'Apr', endorsements: 162, completed: 140, pending: 22 },
        { name: 'May', endorsements: 178, completed: 155, pending: 23 },
        { name: 'Jun', endorsements: 195, completed: 175, pending: 20 },
      ],
      metrics: ['endorsements', 'completed', 'pending'],
      timeframe: 'month',
      category: 'endorsements',
      insights: ['25% increase in Q2', 'Completion rate improved', 'Pending endorsements stable'],
    },
    {
      id: 'user_segments',
      title: 'User Distribution by Type',
      type: 'pie',
      data: [
        { name: 'Legal Professionals', value: 145 },
        { name: 'Corporate Users', value: 98 },
        { name: 'Individual Users', value: 76 },
        { name: 'Government', value: 23 },
      ],
      metrics: ['value'],
      timeframe: 'month',
      category: 'users',
      insights: ['Legal professionals dominate', 'Corporate adoption growing'],
    },
    {
      id: 'performance_metrics',
      title: 'System Performance Indicators',
      type: 'radar',
      data: [
        { subject: 'Response Time', value: 85 },
        { subject: 'Uptime', value: 99 },
        { subject: 'Security', value: 94 },
        { subject: 'User Satisfaction', value: 88 },
        { subject: 'Feature Adoption', value: 76 },
        { subject: 'Support Quality', value: 92 },
      ],
      metrics: ['value'],
      timeframe: 'month',
      category: 'performance',
      insights: ['Excellent uptime', 'Feature adoption needs improvement'],
    },
    {
      id: 'revenue_breakdown',
      title: 'Revenue by Source',
      type: 'bar',
      data: [
        { name: 'Subscriptions', monthly: 32000, quarterly: 96000, annual: 384000 },
        { name: 'Per-Transaction', monthly: 8500, quarterly: 25500, annual: 102000 },
        { name: 'Enterprise', monthly: 15000, quarterly: 45000, annual: 180000 },
        { name: 'Consulting', monthly: 5200, quarterly: 15600, annual: 62400 },
      ],
      metrics: ['monthly', 'quarterly', 'annual'],
      timeframe: 'month',
      category: 'financial',
      insights: ['Subscriptions are primary revenue', 'Enterprise growing steadily'],
    },
  ], []);

  const loadDashboardData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setState(prev => ({
        ...prev,
        metrics: mockMetrics,
        charts: mockCharts,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [mockMetrics, mockCharts]);

  const exportData = useCallback(async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      // Simulate export
      console.log(`Exporting data in ${format} format...`);
      
      // In a real implementation, this would generate and download the file
      const blob = new Blob(['Mock exported data'], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, []);

  const toggleRealTime = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRealTimeEnabled: !prev.isRealTimeEnabled,
    }));
  }, []);

  const handleDateRangeChange = useCallback((field: 'start' | 'end', date: Date | null) => {
    if (date) {
      setState(prev => ({
        ...prev,
        dateRange: {
          ...prev.dateRange,
          [field]: date,
        },
      }));
    }
  }, []);

  const handleFiltersChange = useCallback((filters: Filter[]) => {
    setState(prev => ({ ...prev, filters }));
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (state.isRealTimeEnabled) {
      const interval = setInterval(loadDashboardData, state.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [state.isRealTimeEnabled, state.refreshInterval, loadDashboardData]);

  if (state.isLoading && state.metrics.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Advanced Analytics Dashboard
          </Typography>
          
          <Box display="flex" gap={2} alignItems="center">
            <Chip
              label={state.isRealTimeEnabled ? 'Real-time ON' : 'Real-time OFF'}
              color={state.isRealTimeEnabled ? 'success' : 'default'}
              icon={<DataUsage />}
              onClick={toggleRealTime}
            />
            
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadDashboardData}
              disabled={state.isLoading}
            >
              Refresh
            </Button>
            
            <Button
              variant="contained"
              startIcon={<GetApp />}
              onClick={() => exportData('pdf')}
            >
              Export PDF
            </Button>
          </Box>
        </Box>

        {/* Date Range and Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box display="flex" gap={2} alignItems="center" mb={2}>
            <DatePicker
              label="Start Date"
              value={state.dateRange.start}
              onChange={(date) => handleDateRangeChange('start', date)}
              renderInput={(params) => <TextField {...params} size="small" />}
            />
            
            <DatePicker
              label="End Date"
              value={state.dateRange.end}
              onChange={(date) => handleDateRangeChange('end', date)}
              renderInput={(params) => <TextField {...params} size="small" />}
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Compare</InputLabel>
              <Select
                value={state.compareMode ? 'previous' : 'none'}
                onChange={(e) => setState(prev => ({ ...prev, compareMode: e.target.value === 'previous' }))}
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="previous">Previous Period</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <FilterBar
            filters={state.filters}
            onFiltersChange={handleFiltersChange}
          />
        </Paper>

        {/* Tabs */}
        <Tabs
          value={state.selectedTab}
          onChange={(_, newValue) => setState(prev => ({ ...prev, selectedTab: newValue }))}
          sx={{ mb: 3 }}
        >
          <Tab label="Overview" icon={<Dashboard />} />
          <Tab label="Performance" icon={<TrendingUp />} />
          <Tab label="Users" icon={<Analytics />} />
          <Tab label="Financial" icon={<Assessment />} />
          <Tab label="Reports" icon={<TableChart />} />
        </Tabs>

        {/* Tab Content */}
        {state.selectedTab === 0 && (
          <>
            {/* Key Metrics */}
            <Typography variant="h5" gutterBottom>
              Key Metrics
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {state.metrics.map((metric) => (
                <Grid item xs={12} sm={6} md={4} lg={2} key={metric.id}>
                  <MetricCard metric={metric} />
                </Grid>
              ))}
            </Grid>

            {/* Charts */}
            <Typography variant="h5" gutterBottom>
              Trends & Insights
            </Typography>
            <Grid container spacing={3}>
              {state.charts.map((chart) => (
                <Grid item xs={12} md={6} key={chart.id}>
                  <ChartWidget chart={chart} />
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {state.selectedTab === 1 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Performance Analytics
            </Typography>
            <Grid container spacing={3}>
              {state.metrics
                .filter(m => m.category === 'performance')
                .map((metric) => (
                  <Grid item xs={12} sm={6} md={4} key={metric.id}>
                    <MetricCard metric={metric} />
                  </Grid>
                ))}
            </Grid>
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {state.charts
                .filter(c => c.category === 'performance')
                .map((chart) => (
                  <Grid item xs={12} key={chart.id}>
                    <ChartWidget chart={chart} />
                  </Grid>
                ))}
            </Grid>
          </Box>
        )}

        {state.selectedTab === 2 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              User Analytics
            </Typography>
            <Grid container spacing={3}>
              {state.metrics
                .filter(m => m.category === 'users')
                .map((metric) => (
                  <Grid item xs={12} sm={6} md={4} key={metric.id}>
                    <MetricCard metric={metric} />
                  </Grid>
                ))}
            </Grid>
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {state.charts
                .filter(c => c.category === 'users')
                .map((chart) => (
                  <Grid item xs={12} md={6} key={chart.id}>
                    <ChartWidget chart={chart} />
                  </Grid>
                ))}
            </Grid>
          </Box>
        )}

        {state.selectedTab === 3 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Financial Analytics
            </Typography>
            <Grid container spacing={3}>
              {state.metrics
                .filter(m => m.category === 'financial')
                .map((metric) => (
                  <Grid item xs={12} sm={6} md={4} key={metric.id}>
                    <MetricCard metric={metric} />
                  </Grid>
                ))}
            </Grid>
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {state.charts
                .filter(c => c.category === 'financial')
                .map((chart) => (
                  <Grid item xs={12} key={chart.id}>
                    <ChartWidget chart={chart} />
                  </Grid>
                ))}
            </Grid>
          </Box>
        )}

        {state.selectedTab === 4 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              Automated Reports
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Configure automated reports to be generated and delivered on schedule.
            </Alert>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Available Reports
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Report generation and scheduling features will be available in this section.
                Users can create custom reports with specific metrics and delivery schedules.
              </Typography>
            </Paper>
          </Box>
        )}

        {/* Real-time indicator */}
        {state.isRealTimeEnabled && (
          <Box
            position="fixed"
            bottom={16}
            right={16}
            display="flex"
            alignItems="center"
            sx={{
              bgcolor: 'success.main',
              color: 'white',
              px: 2,
              py: 1,
              borderRadius: 2,
              animation: 'pulse 2s infinite',
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                bgcolor: 'white',
                borderRadius: '50%',
                mr: 1,
                animation: 'pulse 1s infinite',
              }}
            />
            <Typography variant="caption">
              Live Data
            </Typography>
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default AdvancedAnalyticsDashboard;