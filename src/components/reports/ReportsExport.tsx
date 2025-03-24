import React from 'react';
import {
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Grid,
  Typography,
  Divider,
  Checkbox,
  MenuItem,
  Select,
  InputLabel,
  SelectChangeEvent
} from '@mui/material';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  Description as ExcelIcon,
  Share as ShareIcon
} from '@mui/icons-material';

// Types for export options
export interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel';
  includeCharts: boolean;
  includeRawData: boolean;
  dateRange: string;
  selectedSections: string[];
}

interface ReportsExportProps {
  open: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  availableSections: { id: string; name: string }[];
}

const ReportsExport: React.FC<ReportsExportProps> = ({
  open,
  onClose,
  onExport,
  availableSections
}) => {
  const [options, setOptions] = React.useState<ExportOptions>({
    format: 'pdf',
    includeCharts: true,
    includeRawData: false,
    dateRange: 'all',
    selectedSections: []
  });

  // Reset options when dialog opens
  React.useEffect(() => {
    if (open) {
      setOptions({
        format: 'pdf',
        includeCharts: true,
        includeRawData: false,
        dateRange: 'all',
        selectedSections: availableSections.map(section => section.id)
      });
    }
  }, [open, availableSections]);

  const handleFormatChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptions({
      ...options,
      format: (event.target.value as ExportOptions['format'])
    });
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptions({
      ...options,
      [event.target.name]: event.target.checked
    });
  };

  const handleDateRangeChange = (event: SelectChangeEvent) => {
    setOptions({
      ...options,
      dateRange: event.target.value
    });
  };

  const handleSectionToggle = (sectionId: string) => {
    setOptions(prevOptions => {
      const selectedSections = [...prevOptions.selectedSections];
      const currentIndex = selectedSections.indexOf(sectionId);
      
      if (currentIndex === -1) {
        selectedSections.push(sectionId);
      } else {
        selectedSections.splice(currentIndex, 1);
      }

      return {
        ...prevOptions,
        selectedSections
      };
    });
  };

  const handleExport = () => {
    onExport(options);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Export Report</DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Export Format</FormLabel>
              <RadioGroup
                aria-label="export-format"
                name="format"
                value={options.format}
                onChange={handleFormatChange}
              >
                <FormControlLabel 
                  value="pdf" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PdfIcon sx={{ mr: 1 }} color="error" />
                      <span>PDF Document</span>
                    </Box>
                  } 
                />
                <FormControlLabel 
                  value="csv" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CsvIcon sx={{ mr: 1 }} color="primary" />
                      <span>CSV Spreadsheet</span>
                    </Box>
                  } 
                />
                <FormControlLabel 
                  value="excel" 
                  control={<Radio />} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ExcelIcon sx={{ mr: 1 }} color="success" />
                      <span>Excel Spreadsheet</span>
                    </Box>
                  } 
                />
              </RadioGroup>
            </FormControl>
            
            <Box sx={{ mt: 3 }}>
              <FormControl fullWidth>
                <InputLabel id="date-range-label">Date Range</InputLabel>
                <Select
                  labelId="date-range-label"
                  id="date-range"
                  value={options.dateRange}
                  label="Date Range"
                  onChange={handleDateRangeChange}
                >
                  <MenuItem value="week">Last Week</MenuItem>
                  <MenuItem value="month">Last Month</MenuItem>
                  <MenuItem value="quarter">Last Quarter</MenuItem>
                  <MenuItem value="year">Last Year</MenuItem>
                  <MenuItem value="all">All Time</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.includeCharts}
                    onChange={handleCheckboxChange}
                    name="includeCharts"
                  />
                }
                label="Include charts and visualizations"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.includeRawData}
                    onChange={handleCheckboxChange}
                    name="includeRawData"
                  />
                }
                label="Include raw data tables"
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Sections to Include
            </Typography>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, maxHeight: 300, overflow: 'auto' }}>
              {availableSections.map(section => (
                <FormControlLabel
                  key={section.id}
                  control={
                    <Checkbox
                      checked={options.selectedSections.includes(section.id)}
                      onChange={() => handleSectionToggle(section.id)}
                      name={`section-${section.id}`}
                    />
                  }
                  label={section.name}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <Divider />
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
            Export Preview
          </Typography>
          <Box sx={{ 
            mt: 1, 
            p: 2, 
            bgcolor: 'background.paper', 
            border: 1, 
            borderColor: 'divider',
            borderRadius: 1,
            minHeight: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography color="text.secondary">
              {`Your export will include ${options.selectedSections.length} sections in ${options.format.toUpperCase()} format`}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button 
          startIcon={<ShareIcon />} 
          color="primary"
        >
          Share
        </Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleExport} 
          startIcon={<DownloadIcon />} 
          variant="contained" 
          color="primary"
        >
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportsExport; 