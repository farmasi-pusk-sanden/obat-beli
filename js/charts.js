// Chart utilities and configurations

// Global chart defaults
Chart.defaults.font.family = "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif";
Chart.defaults.color = '#858796';
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)';
Chart.defaults.plugins.tooltip.titleFont = { weight: 'normal' };
Chart.defaults.plugins.tooltip.bodyFont = { weight: 'normal' };
Chart.defaults.plugins.legend.labels.usePointStyle = true;

// Chart color scheme
const CHART_COLORS = {
    primary: '#4e73df',
    success: '#1cc88a',
    info: '#36b9cc',
    warning: '#f6c23e',
    danger: '#e74a3b',
    secondary: '#858796',
    dark: '#5a5c69'
};

// Chart gradient utilities
function createGradient(ctx, color, opacity = 1) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, color + '33');
    gradient.addColorStop(1, color + '00');
    return gradient;
}

// Responsive chart configuration
function getResponsiveConfig() {
    return {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            }
        }
    };
}

// Export chart as image
function exportChartAsImage(chartId, filename = 'chart') {
    const chartCanvas = document.getElementById(chartId);
    if (!chartCanvas) return;
    
    const link = document.createElement('a');
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = chartCanvas.toDataURL('image/png');
    link.click();
}

// Print chart
function printChart(chartId) {
    const chartCanvas = document.getElementById(chartId);
    if (!chartCanvas) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Print Chart</title>
                <style>
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        text-align: center; 
                        font-family: Arial, sans-serif;
                    }
                    img { 
                        max-width: 100%; 
                        height: auto; 
                    }
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <img src="${chartCanvas.toDataURL('image/png')}">
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 500);
                    }
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// Chart data formatters
const ChartFormatters = {
    currency: (value) => {
        if (value >= 1000000) {
            return 'Rp' + (value / 1000000).toFixed(1) + 'Jt';
        } else if (value >= 1000) {
            return 'Rp' + (value / 1000).toFixed(0) + 'Rb';
        }
        return 'Rp' + value;
    },
    
    number: (value) => {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'Jt';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(0) + 'Rb';
        }
        return value.toString();
    },
    
    percentage: (value) => {
        return value.toFixed(1) + '%';
    }
};

// Initialize all charts on page load
function initializeAllCharts() {
    // This function can be called to reinitialize all charts
    // after dynamic content loading
    console.log('Charts initialized');
}

// Export functions for global use
window.ChartUtils = {
    exportChartAsImage,
    printChart,
    CHART_COLORS,
    createGradient,
    getResponsiveConfig
};