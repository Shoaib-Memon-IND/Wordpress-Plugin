jQuery(document).ready(function($) {
    var filterSetCount = 0; // Counter for tracking filter set count

    // Function to add a set of filters horizontally
    function addHorizontalFilterSet() {
        filterSetCount++;

        var newRow = $('<div class="row filter-set"></div>');

        // Loop to add four filter dropdowns horizontally
        for (var i = 1; i <= 4; i++) {
            var filterId = 'filter-' + ((filterSetCount - 1) * 4 + i);
            var filterHtml = `
                <div class="col-3">
                    <div class="filter" style="margin-top: 20px;">
                        <select id="${filterId}" class="filter-select" style="width: 100%; padding: 5px;">
                            <option value="Select Filter" disabled selected>Select Filter</option>
                        </select>
                    </div>
                </div>
            `;
            newRow.append(filterHtml);
        }

        // Add remove button for this set of filters
        var removeButtonHtml = `
            <div class="col-1" style="margin-top: 20px;">
                <button type="button" class="btn btn-danger remove-filter-set">x</button>
            </div>
        `;

        // Append the new row to the filter container
        $('#filter-container').append(newRow);

        // Append the remove button to the new row
        newRow.append(removeButtonHtml);

        // Add options dynamically from table columns
        var tableHeaders = $('#csv-table').DataTable().columns().header().toArray().map(function(th) {
            return $(th).text();
        });

        // Populate the first dropdown with table headers from 'Revenue' to 'Capex'
        newRow.find('.filter-select').first().append(
            tableHeaders.slice(4).map(header => `<option value="${header}">${header}</option>`).join('')
        );

        // Populate the second dropdown with comparison options
        var comparisonOptions = ['Equal to', 'Not Equal to', 'Greater than', 'Greater than or Equal to', 'Less than', 'Less than or Equal to'];
        newRow.find('.filter-select').eq(1).append(
            comparisonOptions.map(option => `<option value="${option}">${option}</option>`).join('')
        );

        // Populate the fourth dropdown with currency options
        var currencyOptions = ['One', 'Thousands', 'Millions', 'Billions'];
        newRow.find('.filter-select').eq(3).append(
            currencyOptions.map(option => `<option value="${option}">${option}</option>`).join('')
        );

        // Disable the initial "Select Filter" option in all dropdowns
        newRow.find('.filter-select option[value="Select Filter"]').prop('disabled', true);

        // Replace the third dropdown with an input box with the same height
        var thirdDropdown = newRow.find('.filter-select').eq(2);
        thirdDropdown.replaceWith(`<input type="number" class="form-control filter-input" style="width: 100%; height: 28px; margin-top: 20px;">`);

        // Create a style element
        var styleElement = document.createElement('style');

        // Define the CSS rules
        var css = `
        /* Chrome, Safari, Edge, Opera */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
        }

        /* Firefox */
        input[type=number] {
        -moz-appearance: textfield;
        }
        `;

        // Set the CSS text for the style element
        styleElement.textContent = css;

        // Append the style element to the head of the document
        document.head.appendChild(styleElement);

        // Initialize Select2 for the new filter dropdowns
        $('.filter-select').select2();
    }

    // Add set of filters horizontally on button click
    $('#add-filter-btn').on('click', function() {
        addHorizontalFilterSet();
    });

    // Remove filter set on button click
    $('#filter-container').on('click', '.remove-filter-set', function() {
        $(this).closest('.filter-set').remove();
        applyFilters(); // Apply filters when removing a filter set
    });

    // Event handler for currency dropdown change
    $('#filter-container').on('change', '.filter-select', function() {
        var currencyValue = $(this).val();
        sortTable(currencyValue); // Call sortTable when currency dropdown changes
    });

    // Event handler for filter select change
    $('#filter-container').on('change', '.filter-select', function() {
        applyFilters(); // Apply filters when filter select changes
    });

    // Retrieve CSV URL from data attribute
    var csvUrl = $('#csv-table').data('csv-url');

    // Load CSV data using AJAX
    $.ajax({
        url: csvUrl,
        dataType: 'text',
        success: function(data) {
            // Parse CSV data using Papa Parse
            var parsedData = Papa.parse(data, { header: true }).data;

            // Filter out rows with empty or undefined 'ticker' values
            parsedData = parsedData.filter(function(row) {
                return row.ticker && row.ticker.trim() !== ''; // Check if 'ticker' is defined before trimming
            });

            // Manually specify column names based on your CSV structure
            var columns = [
                { data: 'company', title: 'Company' },
                { data: 'ticker', title: 'Ticker' },
                { data: 'Sector', title: 'Sector' },
                { data: 'Industry', title: 'Industry' },
                { data: 'revenue', title: 'Revenue' },
                { data: 'gp', title: 'GP' },
                { data: 'fcf', title: 'FCF' },
                { data: 'capex', title: 'Capex' }
            ];

            // Initialize DataTables with parsed data and columns
            $('#csv-table').DataTable({
                data: parsedData,
                columns: columns,
                responsive: true,
                "ordering": false
            });
        }
    });

    // Define a list to store filtered rows
    var filteredData = [];
    // Apply filters to the table
    function applyFilters() {

        // Get all filter values
        var filters = [];
        $('.filter-set').each(function() {
            var columnIdx = $(this).find('.filter-select').eq(0).prop('selectedIndex') + 3; // Assuming revenue is at 4th index
            var comparisonValue = $(this).find('.filter-select').eq(1).val();
            var numericValue = $(this).find('.filter-input').val();
            var currencyValue = $(this).find('.filter-select').eq(2).val();
            
            // Convert numeric value to a number
            numericValue = parseFloat(numericValue);
            
            // Push filter values into the filters array
            filters.push({ columnIdx: columnIdx, comparison: comparisonValue, value: numericValue, currency: currencyValue});
        });

        // Define custom search function
        $.fn.dataTable.ext.search.push(
            function(settings, data, dataIndex) {
                var isValid = true;
                filters.forEach(function(filter) {
                    var columnIndex = filter.columnIdx; // Get the column index
                    var comparisonOperator = getComparisonOperator(filter.comparison); // Get the comparison operator
                    var filterValue = filter.value; // Get the filter value
                    var currencyValue = filter.currency;
                    
                    if(currencyValue === 'Thousands'){
                        filterValue =   filterValue * 1000;
                    } else if (currencyValue === 'Millions'){
                        filterValue =   filterValue *  1000000;
                    }else if (currencyValue === 'Billions'){
                        filterValue =   filterValue * 1000000000;
                    }
    
                    // Perform comparison based on operator
                    var cellValue = parseInt(data[columnIndex]);
                    switch (comparisonOperator) {
                        case '=':
                            isValid = isValid && (cellValue === filterValue);
                            break;
                        case '!=':
                            isValid = isValid && (cellValue !== filterValue);
                            break;
                        case '>':
                            isValid = isValid && (cellValue > filterValue);
                            break;
                        case '>=':
                            isValid = isValid && (cellValue >= filterValue);
                            break;
                        case '<':
                            isValid = isValid && (cellValue < filterValue);
                            break;
                        case '<=':
                            isValid = isValid && (cellValue <= filterValue);
                            break;
                        default:
                            // Default behavior if operator not recognized
                            isValid = isValid && true;
                            break;
                    }
                });
                return isValid;
            }
        );
    
        // Apply filters to the DataTable instance
        dataTable = $('#csv-table').DataTable();
        dataTable.draw();
    
        // Remove custom search function after filtering
        $.fn.dataTable.ext.search.pop();

        // Store filtered data
        filteredData = dataTable.rows({ search: 'applied' }).data().toArray();
    }

    // Export table data to CSV
    $('#export-btn').on('click', function() {
        var csvContent = "data:text/csv;charset=utf-8,";
        
        // Add header row to CSV content
        var headerRow = Object.keys(filteredData[0]);
        csvContent += headerRow.join(",") + "\n";
    
        // Add data rows to CSV content
        filteredData.forEach(function(rowData) {
            var row = Object.values(rowData).map(function(cellData) {
                return cellData.toString(); // Convert cell data to string
            });
            csvContent += row.join(",") + "\n";
        });
    
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "filtered_table_data.csv");
        document.body.appendChild(link);
        link.click();
    });
    
    // Function to get the comparison operator based on comparison value
    function getComparisonOperator(comparisonValue) {
        switch (comparisonValue) {
            case 'Equal to':
                return '=';
            case 'Not Equal to':
                return '!=';
            case 'Greater than':
                return '>';
            case 'Greater than or Equal to':
                return '>=';
            case 'Less than':
                return '<';
            case 'Less than or Equal to':
                return '<=';
            default:
                return '';
        }
    }
    

    // Sort table based on currency option
    function sortTable(currencyValue) {
        // Determine the column index based on the currency option
        var columnIndex;
        switch (currencyValue) {
            case 'One':
                columnIndex = 4; // Assuming the revenue column is at index 4
                break;
            case 'Thousands':
                columnIndex = 4; // Assuming the revenue column is at index 4
                break;
            case 'Millions':
                columnIndex = 4; // Assuming the revenue column is at index 4
                break;
            case 'Billions':
                columnIndex = 4; // Assuming the revenue column is at index 4
                break;
            default:
                columnIndex = 4; // Default to revenue column
                break;
        }
        
        // Apply sorting to the DataTable instance based on the determined column index
        $('#csv-table').DataTable().order([columnIndex, 'asc']).draw();
    }
});
